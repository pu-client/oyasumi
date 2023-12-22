import {createClient, getSchoolMap} from "pu-client"
import {saveConfigFile, user} from "./config";
import * as chalk from "chalk";
const {AutoComplete, Input, Password} = require('enquirer');
export const create = async () => {
    let sc =user.school
    let un =user.username
    let up =user.password
    if((sc===""&&un===""&&up==="")){
        console.log(chalk.blueBright("这是你的第一次使用,你需要先登录pu账户."))
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
    }

    try {
    return await createClient(un,sc,up);

    } catch (err) {
        return undefined
    }
};
