import type { RouteRecordRaw } from 'vue-router';

/**
 * 游戏管理路由 (game-admin-console Phase B).
 *
 * 对接后端 privchat-application-module-game commit 4e2a9d8 (Phase A):
 *   GET /admin/game/tables/page             桌列表
 *   GET /admin/game/tables/get/{id}         桌详情
 *   GET /admin/game/audit/page              跨桌 audit
 *   GET /admin/game/ledger/page             跨桌 ledger
 *
 * 菜单可见性说明:
 *   privchat-application-admin 的可见 sidebar 菜单由后端 system_menu 表驱动
 *   (见 router/access.ts fetchMenuListAsync). 本文件只声明本地路由 (与
 *   modules/privchat.ts / system.ts 同模式 — 那些文件也都只声明 hideInMenu
 *   的 detail/edit 子路由).
 *
 *   想让"游戏管理 / 牌桌管理 / 审计日志 / 资金流水"出现在 sidebar, 需要 system
 *   admin 用户在 /system/menu 后台 INSERT 对应菜单条目, 路径分别为:
 *     /game                    (目录, icon: lucide:gamepad-2)
 *     /game/table              (Menu, 关联 GameTable 路由)
 *     /game/audit              (Menu, 关联 GameAudit 路由)
 *     /game/ledger             (Menu, 关联 GameLedger 路由)
 *   并绑定权限 game:table:read / game:audit:read / game:ledger:read.
 *
 *   该 system_menu 数据 seed 由 admin module 维护 (post-Phase-B, 本 commit 不动);
 *   开发期可手动在 DB 加菜单条目验证, 或直接 URL 访问 /game/table.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/game/table',
    component: () => import('#/views/game/table/index.vue'),
    name: 'GameTable',
    meta: {
      title: '牌桌管理',
      icon: 'lucide:layout-dashboard',
      keepAlive: true,
    },
  },
  {
    path: '/game/table/detail',
    component: () => import('#/views/game/table/detail/index.vue'),
    name: 'GameTableDetail',
    meta: {
      title: '牌桌详情',
      icon: 'lucide:table-2',
      activePath: '/game/table',
      hideInMenu: true,
    },
  },
  {
    path: '/game/audit',
    component: () => import('#/views/game/audit/index.vue'),
    name: 'GameAudit',
    meta: {
      title: '审计日志',
      icon: 'lucide:scroll-text',
      keepAlive: true,
    },
  },
  {
    path: '/game/ledger',
    component: () => import('#/views/game/ledger/index.vue'),
    name: 'GameLedger',
    meta: {
      title: '资金流水',
      icon: 'lucide:landmark',
      keepAlive: true,
    },
  },
];

export default routes;
