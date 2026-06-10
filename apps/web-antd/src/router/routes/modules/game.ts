import type { RouteRecordRaw } from 'vue-router';

/**
 * 游戏管理本地路由 — 只放 hideInMenu 的子页面 (与 privchat/system/infra 同款约定).
 *
 * 主菜单 (俱乐部 / 牌桌管理 / 游戏类型 / 游戏日志 / 资金流水) **不**写在这里:
 *   - admin app accessMode='backend' (见 apps/web-antd/src/preferences.ts),
 *     主菜单全部由 DB `system_menus` 表驱动 → 后端 `/admin/system/auth/get-permission-info`
 *     下发 → 前端 `generateRoutesByBackend` 把字符串 component 映射到
 *     `views/game/<x>/index.vue` 自动注册路由.
 *   - 如果在这里再写一份 `path: '/game/table'`, 会和后端下发同 path 路由冲突,
 *     且会直接 push 到 sidebar 顶级 (没"游戏中心"父目录包裹).
 *
 * SQL seed (DB system_menus 必须先 INSERT 完整 6 行 1 目录 + 5 子菜单):
 *   见 GAME_V1_RELEASE_PROVING.md §7.2.
 *
 * 后端 endpoint 对接 (参考):
 *   GET  /admin/game/tables/page                       桌列表  (game:table:read)
 *   POST /admin/game/tables/{id}/force-close           强关桌  (game:table:force_close)
 *   GET  /admin/game/matches/page                      对局列表 (game:hand:read)
 *   GET  /admin/game/matches/{matchId}                 对局详情 (game:hand:read)
 *   GET  /admin/game/matches/{matchId}/actions         对局动作 (game:hand:read)
 *   GET  /admin/game/matches/{matchId}/ledger          对局资金 (game:ledger:read)
 *   GET  /admin/game/matches/{matchId}/audit           对局审计 (game:audit:read)
 *   GET  /admin/game/ledger/page                       跨桌 ledger (game:ledger:read)
 *   GET  /admin/game/kinds/page                        game_kind 列表 (game:kind:read)
 *   POST /admin/game/kinds/{kind}/{update,enable,disable}  (game:kind:update)
 *
 * ROOM-MATCH-1: Room 没有详情页, GameTableDetail 已删除. 看牌桌实时状态 / 资金 /
 *   审计走 Match Detail (ROOM-MATCH-2 加).
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/game/club/detail',
    component: () => import('#/views/game/club/detail/index.vue'),
    name: 'GameClubDetail',
    meta: {
      title: '俱乐部详情',
      icon: 'lucide:users',
      activePath: '/game/club',
      hideInMenu: true,
    },
  },
  {
    path: '/game/agent/detail',
    component: () => import('#/views/game/agent/detail/index.vue'),
    name: 'GameAgentDetail',
    meta: {
      title: '代理详情',
      icon: 'lucide:user-cog',
      activePath: '/game/agent',
      hideInMenu: true,
    },
  },
];

export default routes;
