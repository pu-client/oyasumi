import * as Fs from 'fs';
import {create} from "./login";
import {createConfigFile, event, loadConfigFile, saveConfigFile, user} from "./config";
import * as chalk from "chalk";
import {scheduleJob} from "node-schedule";
import {joining, monitor, pushing} from "./common";
import * as log4js from "log4js";
import {Client, SchoolEvent} from "pu-client";


const logger = log4js.getLogger("app");
log4js.configure({
    appenders: {
        console: {
            type: 'console',
            layout: {
                type: 'pattern',
                pattern: '[%d{DATETIME}][%p][%c]: %m',
            },
        },
        file: {
            type: 'file',
            filename: 'logs/app.log',
            layout: {
                type: 'pattern',
                pattern: '[%d{ISO8601}] [%p] %c - %m%n',
            },
        },
    },
    categories: {
        default: {appenders: ['console', 'file'], level: 'info'},
    },
});
let task_pushing;
let task_joining;
let task_monitor;
let task_update;
let task_keeper;
(async function () {
    await createConfigFile()
    await loadConfigFile()
    await saveConfigFile()
    const client = await create();
    const groups = await client.myGroupList();
    logger.mark(chalk.blueBright(`登录完成 学号: ${client.userinfo?.sno} 班级: ${client.userinfo?.class} 年级: ${client.userinfo?.year} `));
    logger.mark(chalk.yellowBright(`创建任务 pushing joining`));
    //------------------------------------------------------------------
    task_update= scheduleJob('* * */0 * * *', update.bind(client));
    task_pushing= scheduleJob('*/1 * * * *', pushing.bind(client));
    task_keeper= scheduleJob('*/30 * * * *', keeper.bind(client));
    task_joining= setInterval(joining.bind(client),200);
    task_monitor= setInterval(monitor.bind(client),200);
    //------------------------------------------------------------------
    logger.mark(chalk.blueBright(`部落列表[${groups.data.length}]`));
    if (groups.data.length > 0) {
        groups.data.forEach((v) => {
            logger.mark(chalk.blueBright(`部落名:${v.name}   部落id:${v.id}`));
        })
    }
    logger.mark(chalk.yellowBright(`已加载过滤器[${event.filter.length}]`));
    event.filter.forEach((v) => {

        logger.mark(chalk.yellowBright(`${v.name}  ${v.start}~${v.end}  部落: ${v.groups.length > 0 ? v.groups : "全部"}  ${v.over ? "交叉" : "包含"}  >=${v.score}分`));


    });
})();
async function update(this:Client){
    await createConfigFile()
    await loadConfigFile()
    await saveConfigFile()


}

async function keeper(this:Client){

    this.test().catch((err)=>{
        logger.error(chalk.redBright("登录已失效 重新登录中"))
        let sc =user.school
        let un =user.username
        let up =user.password
        this.login(un,up,sc).then(()=>{

        }).catch((err)=>{
            logger.error(chalk.redBright("登录失败 请检查账户密码"))
        })

    })

}
