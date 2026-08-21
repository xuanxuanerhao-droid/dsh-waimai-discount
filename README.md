# dsh-waimai-discount

> DeepSeek Harness (DSH) 插件：**外卖优惠助手**。聚合美团、饿了么、京东外卖、淘宝闪购等平台的官方领券渠道，按用户输入的平台与券类型智能匹配返回领取路径。全部为**无返佣**的官方入口指引。

[![dsh-plugin](https://img.shields.io/badge/dsh-plugin-blue)](https://github.com/topics/dsh-plugin)

## 功能

- 覆盖 4 平台 14 个官方领券入口：美团天天神券/外卖红包/试吃官/闪购专场、饿了么天天领红包/品牌馆/超级吃货卡、京东外卖惊喜红包、淘宝闪购新客/学生/叠加红包
- 平台归一化 + 券类型（红包/新客/学生/满减/神券包/返现）智能匹配
- 输出 App 内领取路径，可直接照着操作
- 领券策略：三券叠加、新客/学生优先、多平台比价、时段规律
- **无 CPS 返佣**：渠道数据为官方入口指引，不含任何推广返佣链接

## 触发方式

用户说以下内容时调用：外卖优惠 / 点外卖省钱 / 外卖红包 / 美团优惠 / 饿了么领券 / 京东外卖红包 / 外卖券 / 怎么点外卖便宜 / 吃饭省钱 / 今天外卖有什么活动 / 学生外卖券

## 安装

本插件通过 DSH 插件机制安装（`skills/` 目录注册为一个 `ctx.skills` provider）：

```bash
dsh add dsh-waimai-discount
# 或从 GitHub 源码安装
# dsh add github:xuanxuanerhao-droid/dsh-waimai-discount
```

安装后无需复制到项目 `.agents/skills`，技能随插件自动注册。

## 使用示例

```bash
# 列全部官方渠道概览
node skills/waimai-discount/scripts/find.mjs --list

# 按平台/券类型查询
node skills/waimai-discount/scripts/find.mjs "美团优惠" --limit=5
node skills/waimai-discount/scripts/find.mjs "学生外卖"
node skills/waimai-discount/scripts/find.mjs "点外卖" --format=json
```

## 目录结构

```
dsh-waimai-discount/
├── package.json              # 插件 manifest（声明 dsh.bundle.patch）
├── cordis.patch.yml          # bundle 注册（insert 一条 profile 记录）
├── index.js                  # skill loader：注册 skills/ 下的 SKILL.md
└── skills/
    └── waimai-discount/
        ├── SKILL.md          # 技能入口与执行流程
        ├── data/channels.json # 官方领券渠道目录（可编辑扩展）
        └── scripts/find.mjs  # 查询引擎
```

## 更新渠道数据

编辑 `skills/waimai-discount/data/channels.json`，按平台新增/修改 `entries`，保存即生效（加载器每次发现时重新读盘）。

## 许可证

[MIT](./LICENSE)
