import { requestClient } from '#/api/request';

/**
 * Game admin 自动玩家 (陪玩机器人) API。
 * 对接 controller/admin/bot/AutoPlayerAdminController (/admin/game/clubs/{clubId}/auto-players/*)。
 *
 * 机器人配置只在平台后台 (admin)；玩家端 / 经营者端对机器人无感 (模拟真人)。
 * 权限点: game:auto-player:manage
 */

export namespace GameAutoPlayerApi {
  export interface AutoPlayerRow {
    club_id: number;
    user_id: number;
    role: number;
    is_auto_player: boolean;
    auto_play_enabled: boolean;
    auto_play_profile?: null | string;
  }

  export interface CreatedAutoPlayer {
    user_id: number;
    nickname: string;
  }

  export interface BatchCreateResult {
    created_count: number;
    failed_count: number;
    players: CreatedAutoPlayer[];
  }

  export interface FillResult {
    room_id: number;
    seated: number;
    skipped: number;
    seated_user_ids: number[];
  }

  export interface SeatBreakdown {
    room_id: number;
    seated_count: number;
    real_player_count: number;
    auto_player_count: number;
  }
}

const BASE = '/game/clubs';

// 批量创建自动玩家 (建 member + club_member + wallet seed)。≤20/次。
export function batchCreateAutoPlayers(
  clubId: number,
  body: {
    request_id: string;
    count: number;
    initial_balance: number;
    auto_play_enabled?: boolean;
  },
) {
  return requestClient.post<GameAutoPlayerApi.BatchCreateResult>(
    `${BASE}/${clubId}/auto-players/batch-create`,
    body,
  );
}

// 列俱乐部自动玩家。
export function listAutoPlayers(clubId: number) {
  return requestClient.get<GameAutoPlayerApi.AutoPlayerRow[]>(
    `${BASE}/${clubId}/auto-players`,
  );
}

// 批量标记/取消现有成员为自动玩家。
export function markAutoPlayers(
  clubId: number,
  body: {
    user_ids: number[];
    is_auto_player: boolean;
    auto_play_enabled: boolean;
    auto_play_profile?: null | string;
  },
) {
  return requestClient.post<GameAutoPlayerApi.AutoPlayerRow[]>(
    `${BASE}/${clubId}/auto-players/mark`,
    body,
  );
}

// 给某 Room 补自动玩家入座 + 触发开局。
export function fillAutoPlayers(
  clubId: number,
  body: { room_id: number; count: number },
) {
  return requestClient.post<GameAutoPlayerApi.FillResult>(
    `${BASE}/${clubId}/auto-players/fill`,
    body,
  );
}

// 查某房间 real/auto 在座拆分 (仅 admin 可见)。
export function getRoomSeatBreakdown(roomId: number) {
  return requestClient.get<GameAutoPlayerApi.SeatBreakdown>(
    `/game/rooms/${roomId}/seat-breakdown`,
  );
}
