import type { GameTableApi } from './table';

import { requestClient } from '#/api/request';

/**
 * Game admin Hand History API — 单桌局历史 + 单局详情.
 * 对接 controller/admin/hand/HandsController (实际 /admin/game/tables/{id}/hands*).
 *
 * 概念边界 (GAME_SESSION_REPLAY_SPEC §1):
 *   - v1 没有显式 game_table_session 表; "session" 隐含 = 牌桌生命周期.
 *   - hand / round 一一对应 (game_round.round_id 即一手).
 *   - v1 没有 graphical replay; 此 API 只透出 action_log + ledger 两个真相源.
 *
 * 后端契约:
 *   GET /admin/game/tables/{id}/hands               单桌全部局 (默认 limit=200)
 *   GET /admin/game/tables/{id}/hands/{roundId}     单局 actions + ledger 详情
 *   权限: game:hand:read
 */

export namespace GameHandApi {
  /** 单局总览 — list / detail 共用. */
  export interface HandSummary {
    table_id: number;
    round_id: number;
    action_count: number;
    started_at: number;
    ended_at: number;
    participant_user_ids: number[];
    ledger_count: number;
    total_debit: number;
    total_credit: number;
    rake: number;
    winner_user_ids: number[];
  }

  /** game_action_log 行投影. */
  export interface ActionLogEntry {
    table_id: number;
    round_id: number;
    seat_index: number;
    user_id: number;
    action_seq: number;
    action: string;
    payload_json?: null | string;
    applied_state_version: number;
    created_at: number;
  }

  /** /hands list 响应. */
  export interface HandListResponse {
    list: HandSummary[];
    table_id: number;
    total: number;
  }

  /** /hands/{roundId} detail 响应 — actions + ledger 完整列表. */
  export interface HandDetailResponse {
    table_id: number;
    round_id: number;
    summary: HandSummary;
    actions: ActionLogEntry[];
    ledger: GameTableApi.LedgerEntry[];
  }
}

const BASE = '/game/tables';

/** 单桌全部局列表 (admin debug). */
export async function getHandList(
  tableId: number,
  params?: { limit?: number },
): Promise<{ list: GameHandApi.HandSummary[]; total: number }> {
  const data = await requestClient.get<GameHandApi.HandListResponse>(
    `${BASE}/${tableId}/hands`,
    { params },
  );
  return { list: data.list ?? [], total: data.total ?? 0 };
}

/** 单局详情 — actions + ledger 完整列表 (admin debug / 客诉处理). */
export function getHandDetail(tableId: number, roundId: number) {
  return requestClient.get<GameHandApi.HandDetailResponse>(
    `${BASE}/${tableId}/hands/${roundId}`,
  );
}
