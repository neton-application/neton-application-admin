import { requestClient } from '#/api/request';

/**
 * Game admin Table API. 对接 privchat-application-module-game 的
 * controller/admin/table/TableController (实际 /admin/game/tables/*).
 *
 * Vite proxy /admin-api/* → 后端 /admin/*, 所以前端 BASE 写 /game/tables 即可.
 *
 * 后端契约 (game-admin-console A, 见 module-game commit 4e2a9d8):
 *   GET  /admin/game/tables/page              list paged (game:table:read)
 *   GET  /admin/game/tables/get/{tableId}     detail (game:table:read)
 *   POST /admin/game/tables/{tableId}/force-close
 *                                             force-close (game:table:force_close)
 *   GET  /admin/game/tables/{tableId}/audit   per-table audit (game:audit:read)
 *   GET  /admin/game/tables/{tableId}/ledger  per-table ledger (game:ledger:read)
 */

export namespace GameTableApi {
  /** 桌列表行. */
  export interface TableListItem {
    table_id: number;
    game_kind: string;
    club_id?: null | number;
    owner_user_id: number;
    state: number;
    visibility: number;
    min_seats: number;
    max_seats: number;
    phase?: null | string;
    player_count: number;
    seat_count: number;
    pot?: null | number;
    created_at?: null | number;
    updated_at?: null | number;
  }

  /** 桌列表分页响应. */
  export interface TableListResponse {
    list: TableListItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }

  /** Ledger summary (与 LedgerEntry 列表共用). */
  export interface LedgerSummary {
    total_debit: number;
    total_credit: number;
    net: number;
    row_count: number;
  }

  /** Audit summary (桌详情用). */
  export interface AuditSummary {
    total_count: number;
    recent: AuditEvent[];
  }

  /** Audit event 单行 (跨桌 + per-table 共用). */
  export interface AuditEvent {
    id: number;
    scope_type?: null | string;
    scope_id?: null | number;
    user_id?: null | number;
    event_type: string;
    payload_json?: null | string;
    created_at: number;
  }

  /** Ledger entry 单行. */
  export interface LedgerEntry {
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

  /** 桌 round 子结构. snapshot 直接 inline (admin debug 用). */
  export interface TableRoundInfo {
    round_id: number;
    state_version: number;
    current_seat?: null | number;
    deadline_at?: null | number;
    updated_at: number;
    snapshot: unknown; // 完整 GameSnapshot JsonElement; 不强类型, admin debug 自己读
  }

  /** 桌详情完整响应. */
  export interface TableDetailResponse {
    table_id: number;
    game_kind: string;
    club_id?: null | number;
    owner_user_id: number;
    state: number;
    visibility: number;
    join_policy: number;
    min_seats: number;
    max_seats: number;
    config_json?: null | string;
    created_at?: null | number;
    updated_at?: null | number;
    closed_at?: null | number;
    // GAME_CRAZY_DEALER_MODE Phase 1 §12 (Admin-A): 顶层暴露 dealer 状态
    //   dealer_mode:                 'FAIR' / 'CRAZY' (FAIR 时不展示 strategy)
    //   dealer_strategy:             CRAZY 模式下策略名 (noop / debug); FAIR 时 null
    //   has_pending_debug_overrides: 当前 config_json 是否还挂着未消费的 debug_overrides
    dealer_mode?: 'CRAZY' | 'FAIR';
    dealer_strategy?: null | string;
    has_pending_debug_overrides?: boolean;
    round?: null | TableRoundInfo;
    ledger_summary: LedgerSummary;
    audit_summary: AuditSummary;
  }

  /** 列表 filter (snake_case 对齐后端 @Query 参数名). */
  export interface ListParams {
    page: number;
    page_size: number;
    table_id?: number;
    game_kind?: string;
    state?: number;
    club_id?: number;
    owner_user_id?: number;
    created_from?: number;
    created_to?: number;
  }
}

const BASE = '/game/tables';

/** 桌列表分页查询. vxe-grid ajax 回调用. */
export async function getTablePage(
  params: GameTableApi.ListParams,
): Promise<{ list: GameTableApi.TableListItem[]; total: number }> {
  const data = await requestClient.get<GameTableApi.TableListResponse>(
    `${BASE}/page`,
    { params },
  );
  return { list: data.list ?? [], total: data.total ?? 0 };
}

/** 桌详情 (admin debug full snapshot + summary). */
export function getTableDetail(tableId: number) {
  return requestClient.get<GameTableApi.TableDetailResponse>(
    `${BASE}/get/${tableId}`,
  );
}

/** 强关桌. 返回写入的 audit event. */
export function forceCloseTable(tableId: number, data: { reason?: string }) {
  return requestClient.post<GameTableApi.AuditEvent>(
    `${BASE}/${tableId}/force-close`,
    data,
  );
}

/** 桌 per-table audit (legacy G8 endpoint, 详情页 audit tab 用). */
export function getTableAudit(tableId: number) {
  return requestClient.get<GameTableApi.AuditEvent[]>(
    `${BASE}/${tableId}/audit`,
  );
}

/** 桌 per-table ledger (legacy G8 endpoint, 详情页 ledger tab 用). */
export function getTableLedger(tableId: number) {
  return requestClient.get<GameTableApi.LedgerEntry[]>(
    `${BASE}/${tableId}/ledger`,
  );
}
