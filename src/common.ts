import {config, event, TimeInterval} from "./config";
import {Client, Event, GroupData} from "pu-client";
import {getLogger} from "log4js";
import * as chalk from "chalk";
import {pusher} from "./pusher";
import {isLogin, ugroups, ugroupsName} from "./app";
const logger=getLogger("app")

export async function sign(this: Client) {
    // for await (const e of this.myEventList("全部", 1, 20)) {
    //     for (let i = 0; i <= e.length - 1; i++) {
    //         const v = e[i];
    //         let flag = false;
    //         let flag1 = false;
    //         if (v.sign_in_status.timeline) {
    //             flag = true;
    //         }
    //         if (v.sign_out_status.timeline) {
    //             flag1 = true;
    //         }
    //         const st = parseInt(v.sTime) * 1000 - 1000 * 60 * 50;
    //
    //         const en = v.eTime * 1000 + 1000 * 60 * 35;
    //         if (st < Date.now() && Date.now() < en) {
    //             if (!flag) {
    //                 console.log(parseInt(v.sign_in_num) )
    //                 console.log(v.joinCount )
    //                 if (parseInt(v.sign_in_num) / v.joinNum > 0.6) {
    //                     this.signEvent(v.id, this.authData.uid, 1).then((data) => {
    //                         logger.mark(chalk.greenBright('签到成功 ' + v.title))
    //                     })
    //                 }
    //
    //             }
    //             if (!flag1) {
    //                 if (v.sign_out_num / v.joinNum > 0.6) {
    //                     this.signEvent(v.id, this.authData.uid, 2).then((data) => {
    //                         logger.mark(chalk.greenBright('签退成功 ' + v.title))
    //                     })
    //                 }
    //
    //             }
    //         }
    //     }
    // }
}
export async function doFilter(e: Event, client: Client) {
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
        // console.log(e.title)
        if (e.credit < v.score) {
            flag2=flag2&&false;
        }
        // 当allowed 开启时只会自动加入报名不需要审核的活动
        if (e.allow.toString() !== "0" && config.event.allowed) {
            flag2=flag2&&false;
        }

        v.names.forEach(v => {
            if (!new RegExp(v).test(e.title)) {
                flag2 = flag2 && false;
            }
        })
        flag=flag||flag2;
        if ((parseInt(e.startline) * 1000) < Date.now()) {
            flag = false;
        }
        if (flag) {
            const eventInfo = await client.getEvent(e.id, {cache: false});
            if (Object.keys(eventInfo.thinAssn).length > 0) {
                if (config.event.group) {

                    //是否只加入你自己部落的活动
                    if (config.event.group) {
                        return ugroups.has(eventInfo.thinAssn.assnid);
                    }

                }

                for (let i = 0; i <= v.groups.length - 1; i++) {
                    const r = v.groups[i];
                    if (!new RegExp(r).test(eventInfo.thinAssn.name)) {
                        flag = false;
                    } else {
                        flag = true
                        break
                    }
                }
            } else {
                flag = true
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
            // events.push(...(await this.myFavEventList(false)).data)
            for await (const v of (this.myFavEventList(-1, 20, {cache: false}))) {
                events.push(...v)
            }
        } else {
            // events.push(...(await this.eventList("未开始", "", 40, -1, false)).data)
            for await (const v of (this.eventList("未开始", "", 40, -1))) {
                events.push(...v)
            }
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
            logger.info("- " + chalk.greenBright(v.name) + chalk.yellowBright(` [${v.joinNum}/${v.limitNum}]`) + chalk.blueBright(` [${v.id}]`))

        })
        logger.info(chalk.blueBright(`当前监听列表共有 [${chalk.greenBright(eventMap1.size)}]`))


        eventMap1.forEach((v, k) => {
            logger.info("- " + chalk.greenBright(v.name) + chalk.yellowBright(` [${v.joinNum}/${v.limitNum}]`) + chalk.blueBright(` [${v.id}]`) + ` ${chalk.blueBright()}`)


        })
    } catch (e) {
        logger.error(chalk.redBright("无网络 或者是 pu服务器死了 c") + e)
    } finally {
        processFlag = true;
    }
}

const eventMap = new Map<string, Event>();
const eventSet = new Set<string>();
export const blackSet = new Set<string>();

let join_delay = 0;
export function joining(this: Client){
    if (isLogin) return;
    eventMap.forEach((event,id)=>{
        const time = new Date().getTime();
        const eventRegTime = Number.parseInt(String(event.regStartTimeStr)) * 1000;
        if (time > eventRegTime) {
            if (join_delay < Date.now()) {
                join_delay = Date.now() + 1000 * 3.2;
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


async function addToList(client: Client, info: Array<Event>) {
    const promises: Promise<unknown>[] = [];

    for (let i = 0; i <= info.length-1; i++) {
        promises.push(client.getEvent(info[i].id, {cache: false}));
    }
    const results = await Promise.allSettled(promises);
    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            const data = (result as PromiseFulfilledResult<any>).value;
            if (data) {
                const event: Event | any = data;
                // if(!event)return;
                //我觉得理论上用10年就够了
                //判断是否允许加入活动 年纪和部落
                // if(event.allow_year>0&&event.allow_year.indexOf("20"+client.userinfo?.year)!==-1){
                //     return;
                // }
                if (event.allow_group.length > 0 && !event.allow_group.includes(...ugroupsName)) {
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
                            logger.mark(chalk.green('添加到加入列表 ' + chalk.yellowBright(event.name) + ` [https://pc.pocketuni.net/active/detail?id=${event.actiId}] ${chalk.blueBright(`[${forDate(new Date(parseInt(event.regStartTimeStr) * 1000))}}]`)}`))
                            eventMap.set(event.actiId, event);

                        }

                    }
                }}
        }
    });
}

const eventMap1 = new Map<string, Event>();

function forDate(date: Date) {
    return (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes().toString().padStart(2, "0")
}
export async function monitor(this: Client){
    if (isLogin) return;

    eventMap1.forEach((event,id)=>{
        this.getEvent(event.actiId, {cache: false}).then((v) => {
            if(v.status){
                if (v.joinNum < v.limitNum) {
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



