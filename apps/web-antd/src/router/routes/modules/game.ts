import type { RouteRecordRaw } from 'vue-router';

/**
 * 游戏管理路由 (game-admin-console Phase B + 菜单结构调整).
 *
 * 对接后端 privchat-application-module-game commit 4e2a9d8 (Phase A):
 *   GET /admin/game/tables/page             桌列表
 *   GET /admin/game/tables/get/{id}         桌详情
 *   GET /admin/game/audit/page              跨桌 audit
 *   GET /admin/game/ledger/page             跨桌 ledger
 *
 * 菜单层级 (与 system_menu seed 对齐, 见 GAME_V1_RELEASE_PROVING.md §7):
 *   游戏中心 (目录, /game)
 *     ├─ 俱乐部 (/game/club)           [占位; P-club-adm 待落地]
 *     ├─ 牌桌管理 (/game/table)
 *     ├─ 游戏日志 (/game/audit)        [前称"审计日志"; 更名"游戏日志"]
 *     └─ 资金流水 (/game/ledger)
 *   牌桌详情 (/game/table/detail) hideInMenu, 由列表行 action 跳.
 *
 * 菜单可见性: privchat-application-admin accessMode='backend' (见
 * apps/web-antd/src/preferences.ts), sidebar 由 system_menus 表驱动.
 * 本文件只声明本地路由; 上线前必须在 DB 加 system_menus 行
 * (SQL seed 见 GAME_V1_RELEASE_PROVING.md §7.3).
 *
 * 权限点:
 *   game:table:read         牌桌列表 / 详情 / 跨桌端点 read
 *   game:table:force_close  强关桌
 *   game:audit:read         游戏日志查询
 *   game:ledger:read        资金流水查询
 *   (俱乐部 admin 权限 P-club-adm 落地时定; 暂用 game:table:read 占位)
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/game/club',
    component: () => import('#/views/game/club/index.vue'),
    name: 'GameClub',
    meta: {
      title: '俱乐部',
      icon: 'lucide:users',
      keepAlive: true,
    },
  },
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
      title: '游戏日志',
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
