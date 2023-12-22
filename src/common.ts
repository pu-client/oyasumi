import {event, TimeInterval} from "./config";
import {Client, EventInfo, GroupData, SchoolEvent} from "pu-client";
import {scheduleJob} from "node-schedule";
import {getLogger} from "log4js";
import * as chalk from "chalk";
import * as lodash from 'lodash';
import {pusher} from "./pusher";
const logger=getLogger("app")
export function doFilter(e:SchoolEvent,client:Client){
    let flag=false;
    const filters=event.filter;
    filters.forEach((v)=>{
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
        flag=flag||flag2;
    })
    if((parseInt(e.deadline)*1000)<Date.now()){
        flag=false;
    }
    if(flag){

    }


    return flag;
}
export async function pushing(this: Client){
   try{
       const events=await this.eventList("", -1, {}, false);
       const ff= events.data.filter((v)=>{
           return doFilter(v,this);
       })
       await addToList(this, ff)
   }catch (e){
       logger.error(chalk.redBright("无网络 或者是 pu服务器死了"))
   }
}
const eventMap = new Map<string, EventInfo>();
const eventSet = new Set<string>();
const blackSet = new Set<string>();
export function joining(this: Client){
    eventMap.forEach((event,id)=>{
        const time = new Date().getTime()-100;
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
                        }
                        if (data.data==="您不是该活动的参与对象哦~"){
                            blackSet.add(event.actiId);
                            eventMap.delete(id)
                            logger.warn(chalk.bgBlueBright(`[过滤器失效] 请在github提交issue [https://pc.pocketuni.net/active/detail?id=${event.actiId}]`))
                        }
                    }
                }).catch(e=>{
                    logger.error(chalk.redBright("无网络 或者是 pu服务器死了"))

                })
            } else {


            }
        }


    })
}
async function addToList(client:Client,info:Array<SchoolEvent>){
    const promises: Promise<unknown>[] = [];
    const group=(await client.myGroupList()).data.map((v:GroupData)=>{
        return v.name;
    })
    for (let i = 0; i <= info.length-1; i++) {
        promises.push(client.eventInfo(info[i].id,false));
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

                let flag=false;
                if(lodash.isEqual(event,eventMap.get(event.actiId))){

                    flag=true;
                }
                if(eventSet.has(event.actiId)&&!blackSet.has(event.actiId)){
                    if(event.isJoin===0){
                        blackSet.add(event.actiId);
                        logger.mark(chalk.redBright('活动加入信息发生变化 '+event.name+` 已添加到黑名单列表`));

                    }
                }
                if(!blackSet.has(event.actiId)){
                    if(eventMap.has(event.actiId)){
                        if(flag){
                            logger.mark(chalk.redBright('活动信息发生变化 '+event.name+` [https://pc.pocketuni.net/active/detail?id=${event.actiId}]`))
                            eventMap.set(event.actiId, event);

                        }
                    }else {
                        if(event.isJoin===0){
                            logger.mark(chalk.redBright('添加到加入列表 '+event.name+` [https://pc.pocketuni.net/active/detail?id=${event.actiId}]`))
                            eventMap.set(event.actiId, event);

                        }

                    }
                }}
        }
    });
}
const eventMap1 = new Map<string, EventInfo>();

export async function monitor(this: Client){
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
                                }
                            }
                        }
                    ).catch((err)=>{
                        logger.error(chalk.redBright("无网络 或者是 pu服务器死了"))
                    })
                }
            }
        }).catch(e=>{

        })

    })
}



