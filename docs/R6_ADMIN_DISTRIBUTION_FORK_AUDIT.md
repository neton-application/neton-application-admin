# R6 — Admin Distribution Fork Audit

> 状态:CLOSED（2026-06-19）。与服务端 R5（`neton-application` distribution fork）对齐的后台分层决策。

## 1. 决策

后台前端与服务端采用同一套 distribution fork 模型：

```
neton-application-admin      (neton org)        = 通用 admin base
privchat-application-admin   (privchat-platform) = 产品 admin fork = base + game
```

不再让通用 base 携带产品页面。任何产品专属后台只存在于产品 fork，通过 `git merge upstream/main` 吸收通用改动、产品 delta 留 fork。

## 2. 分层原则：按模块性质，不按名字

页面归属由**后端模块性质**决定，而非名字是否含 “privchat”：

| 模块 | 性质 | base admin 页面 | base 后端启用 | base 默认可见 |
| --- | --- | --- | --- | --- |
| system / infra | Neton 通用默认 | ✅ 保留 | ✅ | ✅ |
| member / payment / platform | Neton 通用默认 | ✅ 保留 | ✅ | ✅ |
| **privchat** | **Neton 通用可选 IM 接入模块** | **✅ 保留** | ❌（base 不启用） | ❌（menu gate 隐藏） |
| **game** | **PrivChat 产品模块** | **❌ 移除** | ❌ | — |

## 3. privchat 留在 base 的语义

`neton-application-module-privchat` 是 **Neton 标准通用 IM 接入模块**（对接开源 IM 平台 PrivChat），不是产品私有模块。因此其后台页面（`privchat/user` `privchat/bot` `privchat/systemUser` `privchat/conversation` `privchat/group` `privchat/systemMessage`）作为**通用可选 IM 后台**保留在 base admin。

关键：base 后端 distribution **默认不启用 privchat 模块**（`neton.modules = system,infra,member,payment,platform`），不 seed privchat 菜单，因此：

- `neton-application` + `neton-application-admin` 单独跑起来时，privchat 页面**不会通过菜单 gate 显示** —— 避免 base 默认暴露 IM 后台。
- 只有启用 privchat 模块的 distribution（如 `privchat-application`）才 seed 菜单、令页面可见。

页面代码存在 ≠ 运行时可见。**可见性由后端 menu seed gate 决定。**

## 4. game 移除归 fork

`game` 是 PrivChat 产品域能力（俱乐部 / 牌局 / 房间 / 钱包 / 抽水），不属于 Neton 通用层。其后台仅存在于 `privchat-application-admin`：

`game/agent` `game/club` `game/kind` `game/ledger` `game/match` `game/room` `game/wallet` `game/share-rule` `game/wallet-ledger`。

## 5. 双 checkout 操作模型（红线）

| | 仓库 | remote |
| --- | --- | --- |
| base checkout | `neton-application-admin/` | origin = neton-application org（单 remote） |
| fork checkout | `privchat-application-admin/` | origin = privchat-platform / **upstream = neton org** |

🔒 **红线**：base 瘦身 commit 只 push neton org；产品 delta 只 push privchat-platform。绝不交叉，避免产品页面污染 canonical 或瘦身误删产品 fork。

## 6. 执行记录

| 阶段 | 动作 | 结果 |
| --- | --- | --- |
| R6-A | 产品 fork 先 fast-forward 追平 upstream（接住 game 页面） | privchat-platform `3148be8 → 4cc2e4c` |
| R6-B | base checkout 删 `views/game`(13) + `api/game`(12) + `router/routes/modules/game.ts` | commit `4ffefaa`，26 文件 / 6196 行 |
| R6-C | 验证 | 全仓 game 残留 = 0；vue-tsc baseline 对比 23→17，新增错误 = 0 |
| R6-D | fork 产品后台完好 | game 13+12+route + privchat 15 完好 |

## 7. 已知遗留（非 R6 引入，独立 backlog）

base admin `vue-tsc --noEmit` 仍有 **17 个 pre-existing 类型错误**（`views/privchat/*` 的 `Record<string, any>` 松散类型 + 1 个 `@core/ui-kit/layout-ui`）。fork 同源同样存在，**R6 既未引入也未修复**。属 privchat 页面独立技术债，单列 backlog 处理。
