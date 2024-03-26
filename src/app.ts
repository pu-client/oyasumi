import * as Fs from 'fs';
import {create} from "./auth";
import {config, createConfigFile, event, loadConfigFile, saveConfigFile, user} from "./config";
import * as chalk from "chalk";
import {scheduleJob} from "node-schedule";
import {joining, monitor, pushing, sign} from "./common";
import * as log4js from "log4js";
import {Client, Group} from "pu-client";
import {createPusher, pusher} from "./pusher";
import {exec} from 'child_process';

const logger = log4js.getLogger("app");


function isGitRepositoryUpdated(callback: (isUpdated: boolean) => void): void {
    exec('git fetch', (error, stdout, stderr) => {
        if (error) {
            callback(true);
        } else {
            exec('git status -uno', (error, stdout, stderr) => {
                if (error) {
                    callback(true);
                } else {
                    const isBehind = /Your branch is behind/.test(stdout);
                    callback(!isBehind);
                }
            });
        }
    });
}

isGitRepositoryUpdated((isUpdated) => {
    if (isUpdated) {
        logger.info(chalk.bgGreenBright("当前已是最新版本"))

    } else {
        logger.warn(chalk.bgGreenBright("有新的更新 请在控制台输入 npm run update 更新版本"))

    }
});

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
export const ugroups = new Set();
export const ugroupsName: string[] = []
let task_pushing;
let task_joining;
let task_monitor;
let task_update;
let task_keeper;
let task_sign;
(async function () {
    await createConfigFile()
    await loadConfigFile()
    await saveConfigFile()
    const client = await create();
    logger.mark(chalk.redBright(`免责声明: 本软件仅供学习交流使用,请勿用于非法用途,否则后果自负!`));
    logger.mark(chalk.yellowBright(`Github: https://github.com/seiuna/puu-uuuuuuuuuuuu`));
    logger.mark(chalk.blueBright(`登录中...`));
    if (!client) {
        logger.error("用户名密码错误")
        process.exit()
        return
    }
    const groups: Group[] = []
    for await (const v of client.myGroupList()) {
        groups.push(...v)
    }
    await createPusher();
    logger.mark(chalk.blueBright(`登录完成 学号: ${client.userinfo?.sno} 班级: ${client.userinfo?.class} 年级: ${client.userinfo?.year} `));
    logger.mark(chalk.yellowBright(`创建任务 pushing joining`));
    //------------------------------------------------------------------
    task_update= scheduleJob('* * */0 * * *', update.bind(client));
    task_pushing = scheduleJob('*/1 * * * *', pushing.bind(client));
    if (config.event.autoSignInAndOut) {
        // task_sign = scheduleJob('*/5 * * * * *', sign.bind(client));
        task_sign = scheduleJob('*/1 * * * *', sign.bind(client));
    }
    // task_pushing = scheduleJob('*/10 * * * * *', pushing.bind(client));
    task_keeper = scheduleJob('*/8 * * * * *', keeper.bind(client));
    task_joining= setInterval(joining.bind(client),200);
    task_monitor = setInterval(monitor.bind(client), 300);
    //------------------------------------------------------------------
    if (config.pushing.enable) {
        pusher.push("喵喵喵? 已成功启动！", "")
        logger.mark(chalk.blueBright(`推送服务已启动 服务类型: ${config.pushing.enable}`));
    } else {
        logger.mark(chalk.redBright(`推送服务未启动`));
    }
    logger.mark(chalk.blueBright(`部落列表[${groups.length}]`));
    if (groups.length > 0) {
        groups.forEach((v) => {
            ugroups.add(v.id)
            ugroupsName.push(v.name)
            logger.mark(chalk.blueBright(`部落名:${v.name}   部落id:${v.id}`));
        })
    }
    logger.mark(chalk.yellowBright(`已加载过滤器[${event.filter.length}]`));
    event.filter.forEach((v) => {
        if (!v.enable) return;
        logger.mark(chalk.yellowBright(`${v.name}  ${v.start}~${v.end}  部落: ${v.groups.length > 0 ? v.groups : "全部"}  ${v.over ? "交叉" : "包含"}  >=${v.score}分`));
    });
    await pushing.bind(client)();
})();
async function update(this:Client){
    logger.mark((await this.dailySign()).data)
    await createConfigFile()
    await loadConfigFile()
    await saveConfigFile()
    await keeper.bind(this)();

}

export let isLogin: boolean;
async function keeper(this:Client){
    if (isLogin) return;
    this.test().catch((err)=>{
        isLogin = true;
        logger.error(chalk.redBright("登录已失效 重新登录中..."))
        let sc =user.school
        let un =user.username
        let up =user.password
        this.login(un,up,sc).then(()=>{
            logger.mark(chalk.greenBright("已重新登陆!"))
            pusher.push("喵喵喵? 登录已失效 但是已重新登录了","")
            isLogin = false;
        }).catch((err)=>{
            if (typeof err == "string") {
                if (err.includes("密码错误")) {
                    logger.error(chalk.redBright("登录失败 请检查账户密码!"))
                    pusher.push("喵喵喵? 登录已失效请检查账户密码", "")
                    process.exit()
                } else {
                    logger.error(chalk.redBright("网络错误"))

                }

            } else {
                logger.error("未知错误: " + err)
            }
            isLogin = false;

        })

    })

}

