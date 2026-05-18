import type { GameTableApi } from './table';

import { requestClient } from '#/api/request';

/**
 * Game admin Ledger API — 跨桌 ledger 查询 + summary.
 * 对接 controller/admin/ledger/LedgerController (实际 /admin/game/ledger/*).
 *
 * 后端契约 (game-admin-console A):
 *   GET /admin/game/ledger/page
 *     filter: table_id, user_id, club_id, currency_type, reason, from, to,
 *             page, page_size
 *     返回 list + summary{total_debit, total_credit, net, row_count}
 *     权限: game:ledger:read
 */

export namespace GameLedgerApi {
  /** Ledger entry 单行 — 与 GameTableApi.LedgerEntry 同形态. */
  export type Entry = GameTableApi.LedgerEntry;

  /** Summary — 与 GameTableApi.LedgerSummary 同形态. */
  export type Summary = GameTableApi.LedgerSummary;

  /** 跨桌 ledger 分页响应 (含 summary 模块). */
  export interface QueryResponse {
    list: Entry[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    summary: Summary;
  }

  /** filter (snake_case 对齐后端 @Query). */
  export interface QueryParams {
    page: number;
    page_size: number;
    table_id?: number;
    user_id?: number;
    club_id?: number;
    currency_type?: string;
    reason?: string;
    from?: number;
    to?: number;
  }
}

const BASE = '/game/ledger';

/** 跨桌 ledger 分页查询 (vxe-grid ajax 兼容: list+total). */
export async function getLedgerPage(
  params: GameLedgerApi.QueryParams,
): Promise<{ list: GameLedgerApi.Entry[]; total: number }> {
  const data = await requestClient.get<GameLedgerApi.QueryResponse>(
    `${BASE}/page`,
    { params },
  );
  return { list: data.list ?? [], total: data.total ?? 0 };
}

/**
 * Ledger summary 单独取 (page=1 + page_size=1 浪费 1 行 hack; UI 上方
 * summary card 用. 后端在同一 endpoint 同时返 list + summary, 不需要单独
 * 接口 — 但当 UI 只想刷新 summary 而不重画表时调本方法).
 */
export async function getLedgerSummary(
  params: Omit<GameLedgerApi.QueryParams, 'page' | 'page_size'>,
): Promise<GameLedgerApi.Summary> {
  const data = await requestClient.get<GameLedgerApi.QueryResponse>(
    `${BASE}/page`,
    {
      params: { ...params, page: 1, page_size: 1 },
    },
  );
  return data.summary;
}
