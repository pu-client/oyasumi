import * as Fs from "fs";
import {blackSet} from "./common";
export let email:any={};
// export let blackList: any = [];
export let user:User={
    username:"",
    password:"",
    school:"",
};
export let event:Event={
    filter:[
        {
            name:'default',
            start:'00:00',
            end:'23:59',
            groups:[],
            names: [
                ".*"
            ],
            over:false,
            score:0,
            enable:true,
            t:{}
        }
    ]
};
export let config:Config={
    event:{
        autoSignInAndOut: false,
        group:false,
        fav: false,
        allowed:true,
    },
    pushing:{
        enable:false,
        type:'email'
    },
    skip: true,
    autoJoin: true,
};
export let push: Push =
    {
        pushInfo: false,
        email: {
            email: '',
            password: '',
            host: '',
            port: 465,
            to: '',
            bcc: [],
            cc: [],
        },
        server_chan: {
            sendKey: ''
        },
        url: ""
    };
export async function createConfigFile() {
    Fs.mkdirSync(process.cwd()+"/config", { recursive: true });
    if (!Fs.existsSync(process.cwd()+"/config/push.json")) {
        Fs.writeFileSync(process.cwd()+"/config/push.json", JSON.stringify(push,null,"\t"));
    }
    if (!Fs.existsSync(process.cwd()+"/config/user.json")) {
        Fs.writeFileSync(process.cwd()+"/config/user.json", JSON.stringify(user,null,"\t"));
    }
    if (!Fs.existsSync(process.cwd()+"/config/config.json")) {
        Fs.writeFileSync(process.cwd()+"/config/config.json", JSON.stringify(config,null,"\t") );
    }
    if (!Fs.existsSync(process.cwd()+"/config/event.json")) {
        Fs.writeFileSync(process.cwd()+"/config/event.json", JSON.stringify(event,null,"\t"));
    }
    // if (!Fs.existsSync(process.cwd() + "/config/blackList.json")) {
    //     Fs.writeFileSync(process.cwd() + "/config/blackList.json", JSON.stringify(blackList, null, "\t"));
    // }
}
export async function loadConfigFile(){
    config=JSON.parse(Fs.readFileSync(process.cwd()+"/config/config.json").toString());
    user=JSON.parse(Fs.readFileSync(process.cwd()+"/config/user.json").toString());
    push=JSON.parse(Fs.readFileSync(process.cwd()+"/config/push.json").toString());
    event=JSON.parse(Fs.readFileSync(process.cwd()+"/config/event.json").toString());
    // blackList = JSON.parse(Fs.readFileSync(process.cwd() + "/config/blackList.json").toString());
    event.filter.forEach((v)=>{
        v.t=new TimeInterval(new Date(new Date().toLocaleDateString()+" "+v.start),new Date(new Date().toLocaleDateString()+" "+v.end))
    })

}
export async function saveConfigFile(){
    Fs.writeFileSync(process.cwd()+"/config/config.json", JSON.stringify(config,null,"\t"),{flag:"w"});
    Fs.writeFileSync(process.cwd()+"/config/user.json", JSON.stringify(user,null,"\t"),{flag:"w"});
    Fs.writeFileSync(process.cwd()+"/config/push.json", JSON.stringify(push,null,"\t"),{flag:"w"});
    Fs.writeFileSync(process.cwd()+"/config/event.json", JSON.stringify(event,null,"\t"),{flag:"w"});
    // Fs.writeFileSync(process.cwd() + "/config/blackList.json", JSON.stringify(blackList, null, "\t"), {flag: "w"});
}
export interface User{
    username:string
    password:string
    school:string
}
export interface Config{
    event:{
        autoSignInAndOut: boolean
        //是否只会加入你部落的活动
        group:boolean
        //是否只会加入你收藏的活动
        fav:boolean
        //如果可以回自动加入所有可以加入的活动
        allowed:boolean
    },
    pushing:{
        //启用和关闭推送
        enable:boolean
        //推送类型
        type:string // email ServerChan
    }
    skip: boolean,
    autoJoin: boolean,
}
export interface Event{
    filter:Array<{
        name:string,
        //开始时间和结束时间
        //格式为 12:23 前面为小时:后面为分钟 24小时制
        start:string,
        end:string,
        //允许有交叉 true 表示 如果活动时间和设置的时间有交叉就会添加 false表示活动时间必须包含在 start  和 end之间才会添加
        over:boolean
        groups: Array<string> //表示只会添加指定部落的活动
        names: Array<string> //表用正则表达式匹配示只会添加指定活动名的活动
        score:number //表示只会添加分数大于 所设置值的活动
        //是否启用
        enable:boolean
        t:TimeInterval|any
    }>
}
export interface Push{
    url: string;
    pushInfo: boolean;
    email:{
        //发送邮件的邮箱
        email:string
        //发送邮件的密码
        password:string
        //发送邮件的服务器
        host:string
        //发送邮件的端口
        port:number
        //发送邮件的目标邮箱
        to:string
        //抄送
        cc: Array<string>
        //密送
        bcc: Array<string>
    },
    server_chan:{
        sendKey:string
    }
}
// export interface Email{
//     email:
// }
export class TimeInterval {
    start: Date;
    end: Date;

    constructor(start: Date, end: Date) {
        this.start = start;
        this.end = end;
    }


    static hasOverlap(interval1: TimeInterval, interval2: TimeInterval): boolean {
        return interval1.start < interval2.end && interval1.end > interval2.start;
    }

    static hasContainment(container: TimeInterval, contained: TimeInterval): boolean {
        return container.start <= contained.start && container.end >= contained.end;
    }

    static hasNoOverlapNoContainment(interval1: TimeInterval, interval2: TimeInterval): boolean {
        return !this.hasOverlap(interval1, interval2) && !this.hasContainment(interval1, interval2);
    }
}
