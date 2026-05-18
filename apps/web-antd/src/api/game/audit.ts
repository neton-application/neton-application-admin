import type { GameTableApi } from './table';

import { requestClient } from '#/api/request';

/**
 * Game admin Audit API — 跨桌 audit 查询.
 * 对接 controller/admin/audit/AuditController (实际 /admin/game/audit/*).
 *
 * 后端契约 (game-admin-console A + P-admin-history-kind):
 *   GET /admin/game/audit/page
 *     filter: table_id, user_id, event_type, club_id, game_kind, from, to,
 *             page, page_size
 *     权限: game:audit:read
 *     club_id / game_kind: 后端 JOIN game_table 实现, 只能匹配 scope_type='game_table'.
 */

export namespace GameAuditApi {
  /** AuditEvent 单行 — 与 GameTableApi.AuditEvent 同形态. */
  export type Event = GameTableApi.AuditEvent;

  /** 跨桌 audit 分页响应. */
  export interface QueryResponse {
    list: Event[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }

  /** 跨桌 audit filter (snake_case 对齐后端 @Query). */
  export interface QueryParams {
    page: number;
    page_size: number;
    table_id?: number;
    user_id?: number;
    event_type?: string;
    club_id?: number;
    game_kind?: string;
    from?: number;
    to?: number;
  }
}

const BASE = '/game/audit';

/** 跨桌 audit 分页查询. vxe-grid ajax 用. */
export async function getAuditPage(
  params: GameAuditApi.QueryParams,
): Promise<{ list: GameAuditApi.Event[]; total: number }> {
  const data = await requestClient.get<GameAuditApi.QueryResponse>(
    `${BASE}/page`,
    { params },
  );
  return { list: data.list ?? [], total: data.total ?? 0 };
}
