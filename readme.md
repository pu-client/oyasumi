## 当前状态

## 免责声明!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

本项目仅供学习交流使用，请勿用于商业用途，否则后果自负。

## 介绍
这是一个用于自动加入活动的脚本，可以自动加入你收藏的活动、你部落的活动、所有可以加入的活动。并且支持推送功能，可以通过邮件等方式推送活动信息。也可以根据你的要求自定义活动的筛选条件。
pu-client库[pu-client](https://github.com/seiuna/pukoudai-client)。
## 快速开始

### 使用Termux(安卓/linux类似)

#### 安装[Termux](https://github.com/termux/termux-app/releases)

下载arm64版本的安装包，在手机上安装后打开Termux，依次运行以下命令：
```bash
pkg install git
pkg install nodejs
```

#### 检查是否安装成功

```bash
git --version
node -v
```

#### 下载

```bash
git clone https://github.com/seiuna/puu-uuuuuuuuuuuu.git
```

#### 安装依赖

```bash
npm install
```

#### 运行

```bash
npm run dev
```

#### 切换账户或者重新登录

```bash
npm run login
```

### 使用Windows

#### 安装[Node.js](https://nodejs.org/zh-cn/download/)

#### 安装[Git](https://git-scm.com/downloads)

#### 下载

```bash
git clone https://github.com/seiuna/puu-uuuuuuuuuuuu.git
```

#### 安装依赖

```bash
cd puu-uuuuuuuuuuuu
```

```bash
npm install
```

#### 运行

```bash
npm run dev
```

#### 切换账户或者重新登录

```bash
npm run login
```

### 注意事项

1. 不要将termux放到后台，否则可能会导致程序无法正常运行。

# 配置文件

### 修改活动筛选条件

建议配置event.json文件，否则可能会加入奇怪的活动。例如如下配置，只会加入电子信息工程学院学生会、图书馆、轨道交通学生会、人文艺术系的活动。

```json
{
  "filter": [
    {
      "name": "default",
      "start": "00:00",
      "end": "23:59",
      "groups": [
        "电子信息工程学院学生会",
        "图书馆",
        "轨道交通学生会",
        "人文艺术系"
      ],
      "names": [
        ".*"
      ],
      "over": false,
      "score": 0,
      "enable": true
    }
  ]
}
```
### 修改扫描间隔

你可以修改`src/app.ts`文件中的`task_update`、`task_pushing`、`task_keeper`、`task_joining`、`task_monitor`的时间间隔，以适应你的需求。

```js
task_update = scheduleJob('* * */0 * * *', update.bind(client));
// 扫描活动的间隔
task_pushing = scheduleJob('*/1 * * * *', pushing.bind(client));
// 保证你一直处于登录状态
task_keeper = scheduleJob('*/8 * * * * *', keeper.bind(client));
// 加入活动的扫描间隔
task_joining = setInterval(joining.bind(client), 200);
// 当一个活动满员了的扫描间隔
task_monitor = setInterval(monitor.bind(client), 200);
```

配置文件位于`/config`目录下，包含`user.json`、`config.json`、`event.json`三个文件。
### user.json
```json
{
    "username": "",
    "password": "",
    "school": ""
}
```

| 属性       | 类型     | 描述  |
|----------|--------|-----|
| username | string | 用户名 |
| password | string | 密码  |
| school   | string | 学校  |

### config.json
```json
{
  "event":{
    "group":false,
    "fav":true,
    "allowed":true
  },
  "pushing":{
    "enable":false,
    "type":"email"
  }
}
```

| 属性             | 类型      | 描述                |
|----------------|---------|-------------------|
| event.group    | boolean | 是否只加入你自己部落的活动     |
| event.fav      | boolean | 是否自动加入你收藏的活动  未实现 |
| event.allowed  | boolean | 是否自动加入所有可以加入的活动   |
| pushing.enable | boolean | 是否启用推送            |
| pushing.type   | string  | 推送类型（email）       |

### event
```json
{
  "filter":[
    {
      "name":"default",
      "start":"00:00",
      "end":"23:59",
      "groups":[],
      "over":false,
      "score":0,
      "enable":true
    }
  ]
}
```

| 属性            | 类型      | 描述                |
|---------------|---------|-------------------|
| filter.name   | string  | 活动名称              |
| filter.start  | string  | 活动开始时间            |
| filter.end    | string  | 活动结束时间            |
| filter.over   | boolean | 活动时间与设置的时间是否可以有交叉 |
| filter.groups | array   | 只添加指定部落的活动        |
| filter.score  | number  | 只添加分数大于所设置值的活动    |
| filter.enable | boolean | 是否启用              |

