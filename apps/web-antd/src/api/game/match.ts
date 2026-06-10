import { requestClient } from '#/api/request';

/**
 * Game admin Match API — 对局是 admin 信息架构的核心聚合点.
 * 对接 controller/admin/match/MatchController (实际 /admin/game/matches/*).
 *
 * 设计 (ROOM-MATCH-2):
 *   - Room 是容器, 没有详情页.
 *   - Match 才有列表 + 详情 (overview / actions / ledger / audit tabs).
 *   - 历史的 hand-by-hand / replay 等都在 Match Detail 里看, 不再有跨 club 的散页.
 */

export namespace GameMatchApi {
  /** 列表行. */
  export interface MatchPageItem {
    match_id: number;
    room_id: number;
    club_id?: null | number;
    game_kind: string;
    status: number;
    match_no_in_room: number;
    started_at: number;
    ended_at?: null | number;
  }

  /** 详情 — 含三个 snapshot JSON 原文, 前端按需解析. */
  export interface MatchDetail {
    match_id: number;
    room_id: number;
    club_id?: null | number;
    game_kind: string;
    status: number;
    match_no_in_room: number;
    config_snapshot_json?: null | string;
    participant_snapshot_json?: null | string;
    result_json?: null | string;
    started_at: number;
    ended_at?: null | number;
    created_at?: null | number;
    updated_at?: null | number;
  }

  /** Actions tab 行. */
  export interface MatchAction {
    table_id: number;
    round_id: number;
    user_id: number;
    action_seq: number;
    action: string;
    applied_state_version: number;
    created_at: number;
  }

  /** Ledger tab 行 (复用 LedgerEntryResponse 形). */
  export interface MatchLedgerEntry {
    table_id?: null | number;
    round_id?: null | number;
    club_id?: null | number;
    game_kind?: null | string;
    user_id: number;
    currency_type: string;
    amount: number;
    direction: number;
    reason: string;
    created_at: number;
  }

  export interface LedgerSummary {
    total_debit: number;
    total_credit: number;
    net: number;
    row_count: number;
  }

  /** Audit tab 行 (复用 AuditEventResponse 形). */
  export interface MatchAuditEvent {
    id: number;
    scope_type?: null | string;
    scope_id?: null | number;
    user_id?: null | number;
    event_type: string;
    payload_json?: null | string;
    created_at: number;
  }

  export interface PageQuery {
    club_id?: number;
    room_id?: number;
    game_kind?: string;
    status?: number;
    from?: number;
    to?: number;
    page?: number;
    page_size?: number;
  }

  export interface PageResponse {
    list: MatchPageItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }

  export interface ActionsResponse {
    match_id: number;
    total: number;
    list: MatchAction[];
  }

  export interface LedgerResponse {
    match_id: number;
    total: number;
    list: MatchLedgerEntry[];
    summary: LedgerSummary;
  }

  export interface AuditResponse {
    match_id: number;
    total: number;
    list: MatchAuditEvent[];
  }
}

const BASE = '/game/matches';

export function getMatchPage(params: GameMatchApi.PageQuery) {
  return requestClient.get<GameMatchApi.PageResponse>(`${BASE}/page`, { params });
}

export function getMatchDetail(matchId: number) {
  return requestClient.get<GameMatchApi.MatchDetail>(`${BASE}/${matchId}`);
}

export function getMatchActions(matchId: number) {
  return requestClient.get<GameMatchApi.ActionsResponse>(`${BASE}/${matchId}/actions`);
}

export function getMatchLedger(matchId: number) {
  return requestClient.get<GameMatchApi.LedgerResponse>(`${BASE}/${matchId}/ledger`);
}

export function getMatchAudit(matchId: number) {
  return requestClient.get<GameMatchApi.AuditResponse>(`${BASE}/${matchId}/audit`);
}
