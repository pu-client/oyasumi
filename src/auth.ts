import {Client, createClient, getSchoolMap} from "@pu-client/pukoudai-client";
import {saveConfigFile, user} from "./config";
import * as chalk from "chalk";
// @ts-ignore
import {AutoComplete, Input, Password} from 'enquirer';

export const create = async (flag: boolean = false): Promise<Client> => {
    let sc =user.school
    let un =user.username
    let up =user.password
    if ((sc === "" && un === "" && up === "") || flag) {
        if (flag) {
            console.log(chalk.blueBright("这是你的第一次使用,你需要先登录pu账户."))
        }
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

        sc=  await schoolIn.run()
        un=await username.run()
        up= await password.run()
        sc = await getSchoolMap().then((v: any) => {
            return v.ne[sc]})
        user.school=sc;
        user.username=un;
        user.password=up;
       await saveConfigFile();
    }

    try {
    return await createClient(un,sc,up);

    } catch (err) {
        console.log(chalk.redBright("登录失败 请检查账户密码后重新登录!"))
        return create(true);
    }
};
