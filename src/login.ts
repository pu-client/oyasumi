import * as chalk from "chalk";
import {create} from "./auth";


(async () => {


    create(true).then((client) => {
        if (client) {
            console.log(`登陆成功学号: ${client.userinfo?.sno} 班级: ${client.userinfo?.class} 年级: ${client.userinfo?.year}`)
            console.log("在终端输入 npm run dev 启动程序！")
        } else {
            console.log(chalk.redBright("登录失败 请检查账户密码"))

        }
        process.exit()

    })

})()