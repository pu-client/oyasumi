import {config, push} from "./config";
import {createTransport, Transporter} from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import * as querystring from "querystring";

export interface Pusher{

    push(title:string,message:string):void;
}
class ScPusher implements Pusher{
    async push(title:string,message: string): Promise<void> {


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
class EmailPusher implements Pusher{
    transport: Transporter<SMTPTransport.SentMessageInfo>;
    constructor() {
        this.transport=createTransport({
            host: push.email.host,
            port: push.email.port,
            secure: true, // true for 465, false for other ports
            auth: {
                user: push.email.email, // generated ethereal user
                pass: push.email.password, // generated ethereal password
            },
        });

    }
    async push(title:string,message: string): Promise<void> {
        await this.transport.sendMail({
            from: push.email.email,
            to: push.email.to,
            subject: "喵喵喵?",
            text: message,
            html: message,
        })
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
    }

}