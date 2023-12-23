## 介绍
这是一个用于自动加入活动的脚本，可以自动加入你收藏的活动、你部落的活动、所有可以加入的活动。并且支持推送功能，可以通过邮件等方式推送活动信息。也可以根据你的要求自定义活动的筛选条件。
## 快速开始
### 安装依赖
在此之前您应该确保您已经安装了nodejs, npm, git。
```bash
npm install
```
### 启动
```bash
npm run dev
```
第一次启动会自动创建配置文件，配置文件位于`/config`目录下。并且你需要登录pu账户. 如果需要推送功能，需要在`/config/config.json`中配置推送方式。

## 配置文件
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

| 属性             | 类型      | 描述              |
|----------------|---------|-----------------|
| event.group    | boolean | 是否自动加入你部落的活动    |
| event.fav      | boolean | 是否自动加入你收藏的活动    |
| event.allowed  | boolean | 是否自动加入所有可以加入的活动 |
| pushing.enable | boolean | 是否启用推送          |
| pushing.type   | string  | 推送类型（email）     |

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
