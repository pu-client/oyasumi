import {config, event, TimeInterval} from "./config";
import {Client, EventInfo, GroupData, SchoolEvent} from "pu-client";
import {scheduleJob} from "node-schedule";
import {getLogger} from "log4js";
import * as chalk from "chalk";
import * as lodash from 'lodash';
import {pusher} from "./pusher";
import {isLogin, ugroups} from "./app";
const logger=getLogger("app")

export async function doFilter(e: SchoolEvent, client: Client) {
    let flag=false;
    const filters=event.filter;
    for (let i = 0; i <= filters.length - 1; i++) {
        const v = filters[i];
        if (!v.enable) continue;
        let flag2=true;
        const st=new Date( parseInt(e.sTime)*1000);
        st.setMonth(v.t.start.getMonth())
        st.setDate(v.t.start.getDate())
        const en=new Date(e.eTime*1000)
        en.setMonth(v.t.start.getMonth())
        en.setDate(v.t.start.getDate())
        //e.start e.end 为时间戳 没有毫秒
        const interval=new TimeInterval(st,en);
        if(!TimeInterval.hasOverlap(v.t,interval)){
            flag2=flag2&&false;
        }
        if(parseInt(e.score)<v.score){
            flag2=flag2&&false;
        }
        if(e.allow!=="0"){
            flag2=flag2&&false;
        }
        v.names.forEach(v => {
            if (!new RegExp(v).test(e.title)) {
                flag2 = flag2 && false;
            }
        })

        flag=flag||flag2;
        if ((parseInt(e.deadline) * 1000) < Date.now()) {
            flag = false;
        }
        if (flag) {
            const eventInfo = await client.eventInfo(e.id, false);
            if (Object.keys(eventInfo.data.thinAssn).length > 0) {
                if (config.event.group) {

                    //是否只加入你自己部落的活动
                    if (config.event.group) {
                        return ugroups.has(eventInfo.data.thinAssn.assnid);
                    }

                }

                for (let i = 0; i <= v.groups.length - 1; i++) {
                    const r = v.groups[i];
                    if (!new RegExp(r).test(eventInfo.data.thinAssn.name)) {
                        flag = false;
                    } else {
                        flag = true
                        break
                    }
                }
            } else {
                return true
            }

        }
    }


    return flag;
}

let processFlag = true;
export async function pushing(this: Client){
    if (isLogin) return;

    if (!processFlag) {
        return;
    }
    processFlag = false;
    try {
        const events = []

        if (config.event.fav) {
            events.push(...(await this.myFavEventList(false)).data)
        } else {
            events.push(...(await this.eventList("未开始", "", 40, -1, false)).data)

        }

        // const ff= events.data.filter((v)=>{
        //     return  doFilter(v,this);
        // })
        const ff: any = [];
        for (let i = 0; i <= events.length - 1; i++) {
            const v = events[i];
            if (await doFilter(v, this)) {
                ff.push(v)
            }
        }


        await addToList(this, ff)
        logger.info("")
        logger.info(chalk.blueBright(`当前加入列表共有 [${chalk.greenBright(eventMap.size)}]`))

        eventMap.forEach((v, k) => {
            logger.info("- " + chalk.greenBright(v.name) + chalk.blueBright(` [${v.joinNum}/${v.limitNum}]`))

        })
        logger.info(chalk.blueBright(`当前监听列表共有 [${chalk.greenBright(eventMap1.size)}]`))


        eventMap1.forEach((v, k) => {
            logger.info("- " + chalk.greenBright(v.name) + chalk.blueBright(` [${v.joinNum}/${v.limitNum}]`))


        })
    } catch (e) {
        logger.error(chalk.redBright("无网络 或者是 pu服务器死了 c") + e)
    } finally {
        processFlag = true;
    }
}
const eventMap = new Map<string, EventInfo>();
const eventSet = new Set<string>();
export const blackSet = new Set<string>();
export function joining(this: Client){
    if (isLogin) return;


    eventMap.forEach((event,id)=>{
        const time = new Date().getTime();
        const eventRegTime = Number.parseInt(String(event.regStartTimeStr)) * 1000;
        if (time > eventRegTime) {
            if (this.joinDelay < Date.now()) {
                this.joinEvent(event.actiId).then((data) => {
                    if (data.status) {
                        logger.mark(chalk.green('活动 '+event.name+` [https://pc.pocketuni.net/active/detail?id=${event.actiId}] [${chalk.yellowBright("加入成功")}]`))
                        eventMap.delete(id);
                        eventSet.add(id)
                        pusher.push("喵喵喵?"+' 活动加入成功'+event.name,'活动加入成功'+event.name+` [https://pc.pocketuni.net/active/detail?id=${event.actiId}]`)

                    } else {
                        if (data.data === "报名人数已达限制，无法报名哦~") {
                            logger.mark(chalk.redBright('活动 '+event.name+`已达限制 ${chalk.green("[已添加到监听列表]")}`))
                            eventMap1.set(event.actiId, event);
                            eventMap.delete(id)
                            blackSet.add(event.actiId);
                        } else {
                            if (data.data === "您不是该活动的参与对象哦~") {
                                blackSet.add(event.actiId);
                                eventMap.delete(id)
                                logger.warn(chalk.bgBlueBright(`[过滤器失效] 请在github提交issue [https://pc.pocketuni.net/active/detail?id=${event.actiId}]`))
                            } else {
                                logger.error("未知错误: " + data.data + "  请在github提交issue [https://pc.pocketuni.net/active/detail?id=" + event.actiId + "]")

                            }
                        }

                    }
                }).catch(e=>{
                    logger.error(chalk.redBright("无网络 或者是 pu服务器死了 b") + e)

                })
            }
        } else {

        }


    })
}
async function addToList(client:Client,info:Array<SchoolEvent>){
    const promises: Promise<unknown>[] = [];
    const group=(await client.myGroupList()).data.map((v:GroupData)=>{
        return v.name;
    })
    for (let i = 0; i <= info.length-1; i++) {
        promises.push(client.eventInfo(info[i].id, true));
    }
    const results = await Promise.allSettled(promises);
    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            const data = (result as PromiseFulfilledResult<any>).value;
            if(data.status){
                const event:EventInfo|any=data.data;
                //我觉得理论上用10年就够了
                //判断是否允许加入活动 年纪和部落
                if(event.allow_year>0&&event.allow_year.indexOf("20"+client.userinfo?.year)!==-1){
                    return;
                }
                if(event.allow_group.length>0&&!event.allow_group.includes(...group)){
                    return;
                }
                if(event.allow_school.length>0&&!event.allow_school.includes(client.userinfo.yx)){
                    return;
                }


                if(eventSet.has(event.actiId)&&!blackSet.has(event.actiId)){
                    if(event.isJoin===0){
                        blackSet.add(event.actiId);
                        logger.mark(chalk.redBright('活动加入信息发生变化 '+event.name+` 已添加到黑名单列表`));

                    }
                }

                if(!blackSet.has(event.actiId)){
                    if(eventMap.has(event.actiId)){
                        eventMap.set(event.actiId, event);

                    }else {
                        if(event.isJoin===0){
                            logger.mark(chalk.redBright('添加到加入列表 ' + event.name + ` [https://pc.pocketuni.net/active/detail?id=${event.actiId}] [${forDate(new Date(parseInt(event.regStartTimeStr) * 1000))}]`))
                            eventMap.set(event.actiId, event);

                        }

                    }
                }}
        }
    });
}
const eventMap1 = new Map<string, EventInfo>();

function forDate(date: Date) {
    return (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes().toString().padStart(2, "0")
}
export async function monitor(this: Client){
    if (isLogin) return;

    eventMap1.forEach((event,id)=>{
        this.eventInfo(event.actiId,false).then((v)=>{
            if(v.status){
                if(v.data.joinNum<v.data.limitNum){
                    this.joinEvent(event.actiId).then(
                        (data)=>{
                            if (data.status) {
                                logger.mark(chalk.green('活动 '+event.name+` [https://pc.pocketuni.net/active/detail?id=${event.actiId}] [${chalk.yellowBright("加入成功")}]`))
                                eventMap1.delete(id);
                                eventSet.add(id)
                                pusher.push("喵喵喵?"+' 活动加入成功'+event.name,'活动加入成功'+event.name+` [https://pc.pocketuni.net/active/detail?id=${event.actiId}]`)

                            } else {
                                if (data.data==="您不是该活动的参与对象哦~"){
                                    blackSet.add(event.actiId);
                                    eventMap.delete(id)
                                    logger.warn(chalk.bgBlueBright(`[过滤器失效] 请在github提交issue [https://pc.pocketuni.net/active/detail?id=${event.actiId}]`))
                                } else {
                                    if (data.data === "报名人数已达限制，无法报名哦~") {

                                    } else {
                                        logger.error("未知错误: " + data.data + "  请在github提交issue [https://pc.pocketuni.net/active/detail?id=" + event.actiId + "]")

                                    }

                                }
                            }
                        }
                    ).catch((err)=>{
                        logger.error(chalk.redBright("无网络 或者是 pu服务器死了 a") + err)
                    })
                }
            }
        }).catch(e=>{

        })

    })
}



