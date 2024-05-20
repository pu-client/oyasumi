import {config, push} from "./config";
import {createTransport, Transporter} from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import * as querystring from "querystring";
import {getLogger} from "log4js";
import * as pkg from "../package.json";
import * as chalk from "chalk";
export interface Pusher{

    push(title: string, message: string, type?: boolean): void;
}
class ScPusher implements Pusher{
    async push(title: string, message: string, type: boolean = true): Promise<void> {
        const postData = querystring.stringify({ title, message });
        const url = `https://sctapi.ftqq.com/${push.server_chan.sendKey}.send`;
        const response = await fetch(url, {
            method: 'POST',
            headers: (()=>{
                return  {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                } as any
            })(),
            body: postData
        });
        const data = await response.text();
    }
}

const logger = getLogger("pusher");
class EmailPusher implements Pusher{
    transport: Transporter<SMTPTransport.SentMessageInfo>;
    constructor() {
        this.transport=createTransport({
            host: push.email.host,
            port: push.email.port,
            secure: false,
            auth: {
                user: push.email.email,
                pass: push.email.password
            }
        });

    }

    async push(title: string, message: string, type: boolean = true): Promise<void> {
        logger.info(`尝试发送邮件 -> ${push.email.to} 标题: ${title}`);
        await this.transport.sendMail({
            from: push.email.email,
            to: push.email.to,
            subject: `[fufuu v${pkg.version}] ${title}`,
            cc: type ? push.email.cc : [],
            bcc: type ? push.email.bcc : [],
            text: message,
            html: message,
        }).then((e) => {
            logger.info(`${chalk.greenBright(`发送成功 -> ${push.email.to}`)} 标题: ${title}`);
        }).catch((e) => {
            logger.info(`${chalk.redBright(`发送失败 -> ${push.email.to}`)} 标题: ${title} 原因: ${e}`);
        });
    }
}
export let pusher:Pusher
export async function createPusher(){
    if(config.pushing.enable){
        if(config.pushing.type==="email"){
            pusher=new EmailPusher();
        }
        if(config.pushing.type==="server_chan"){
            pusher=new ScPusher();
        }
    } else {
        pusher = {
            push: function () {

            }
        }
    }

}
