import { requestClient } from '#/api/request';

/**
 * Game admin Room API (ROOM-MATCH-4: 原 GameTableApi 重命名收敛).
 *
 * 对接 privchat-application-module-game 的
 * controller/admin/room/AdminRoomController (实际 /admin/game/rooms/*).
 *
 * Vite proxy /admin-api/* → 后端 /admin/*, 所以前端 BASE 写 /game/rooms 即可.
 *
 * 后端契约 (ROOM-MATCH design note §3):
 *   GET  /admin/game/rooms/page                房间列表 (game:room:read)
 *   POST /admin/game/rooms/{roomId}/force-close 强关 (game:room:force_close)
 *   GET  /admin/game/rooms/{roomId}/audit      per-room audit (game:audit:read)
 *   GET  /admin/game/rooms/{roomId}/ledger     per-room ledger (game:ledger:read)
 *
 * Room 是容器, 没有详情对象 (ROOM-MATCH-1 已删 getTableDetail). 看牌谱 / 资金 /
 * 审计走 Match Detail (/admin/game/matches/{matchId}, ROOM-MATCH-2).
 */

export namespace GameAdminRoomApi {
  /** 房间列表行. */
  export interface RoomListItem {
    room_id: number;
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

  /** 房间列表分页响应. */
  export interface RoomListResponse {
    list: RoomListItem[];
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

  /** Audit event 单行. */
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

  /** 列表 filter (snake_case 对齐后端 @Query 参数名). */
  export interface ListParams {
    page: number;
    page_size: number;
    room_id?: number;
    game_kind?: string;
    state?: number;
    club_id?: number;
    owner_user_id?: number;
    created_from?: number;
    created_to?: number;
  }
}

const BASE = '/game/rooms';

/** 房间列表分页查询. vxe-grid ajax 回调用. */
export async function getRoomPage(
  params: GameAdminRoomApi.ListParams,
): Promise<{ list: GameAdminRoomApi.RoomListItem[]; total: number }> {
  const data = await requestClient.get<GameAdminRoomApi.RoomListResponse>(
    `${BASE}/page`,
    { params },
  );
  return { list: data.list ?? [], total: data.total ?? 0 };
}

/** 强关房间. 返回写入的 audit event. */
export function forceCloseRoom(roomId: number, data: { reason?: string }) {
  return requestClient.post<GameAdminRoomApi.AuditEvent>(
    `${BASE}/${roomId}/force-close`,
    data,
  );
}

/** Per-room audit (历史 SCOPE_TABLE + 新 SCOPE_ROOM 兼容; 详情视图入口实际在 Match Detail). */
export function getRoomAudit(roomId: number) {
  return requestClient.get<GameAdminRoomApi.AuditEvent[]>(
    `${BASE}/${roomId}/audit`,
  );
}

/** Per-room ledger. */
export function getRoomLedger(roomId: number) {
  return requestClient.get<GameAdminRoomApi.LedgerEntry[]>(
    `${BASE}/${roomId}/ledger`,
  );
}
