import {createClient, getSchoolMap} from "pu-client"
import {loadConfigFile, saveConfigFile, user} from "./config";
import * as chalk from "chalk";
const {AutoComplete, Input, Password} = require('enquirer');

(async () => {
    await loadConfigFile()

    let sc =user.school
    let un =user.username
    let up =user.password

        const schoolIn = new AutoComplete({
            name: 'school',
            message: '选择你的学校',
            limit: 10,
            initial: 2,
            choices: Object.keys(await getSchoolMap().then((e)=> {return e.ne}))
        });
        const username = new Input({
            name: 'school',
            message: '输入你的学号或身份证',
        });

        const password = new Password({
            name: 'password',
            message: '输入你的密码',
        });
        let type = "save";
        let token;

        sc=  await schoolIn.run()
        un=await username.run()
        up= await password.run()
        sc=await getSchoolMap().then((v)=>{
            return v.ne[sc]})
        user.school=sc;
        user.username=un;
        user.password=up;
        await saveConfigFile();


     createClient(un,sc,up).then((client)=>{
        console.log(`登陆成功学号: ${client.userinfo?.sno} 班级: ${client.userinfo?.class} 年级: ${client.userinfo?.year}`)

     }).catch((err)=>{
         console.log(chalk.redBright("登录失败 请检查账户密码"))
     })
    process.exit()

})()