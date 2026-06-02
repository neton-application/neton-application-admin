import { requestClient } from '#/api/request';

/**
 * Game admin Room API — 单房间运维入口 (与 /game/tables/* 平级, BASE 是 /game/rooms).
 * 对接 module-game 的 controller/admin/debug/CrazyDealerDebugController.
 *
 * 后端契约:
 *   PUT /admin/game/rooms/{roomId}/debug-overrides
 *       Body: SetDebugOverridesRequest (hole_cards / flop / turn / river 全可选)
 *       Response: SetDebugOverridesResponse
 *       权限: game:room:debug
 *
 * 红线 (与 spec §11 一致):
 *   1. GameDebugFlags.crazyDebugEnabled = false → 404
 *   2. 房间 dealer_mode != "CRAZY" → 400 (FAIR 房间不消费 debug_overrides)
 *   3. 房间不存在 → 404
 *
 * 设置成功后 server 会自动把 dealer_strategy 切到 'debug', 下一手 start_round
 * tx 内一次性消费并剥除 (admin 这边只管发请求, 不用自己维护 strategy 字段).
 */

export namespace GameRoomDebugApi {
  // PUT body. 至少有一组字段; server 端只 put 非 null 的进 debug_overrides JSON.
  // 卡牌字符串约定: `card_<suit><rank>` —— suit ∈ s/h/d/c (黑/红/方/梅);
  // rank ∈ A/K/Q/J/10/9..2 (注意 10 用 '10', 不用 'T').
  // hole_cards key 是座位号字符串 (JSON object key 必须 string).
  export interface SetDebugOverridesRequest {
    hole_cards?: Record<string, string[]>;
    flop?: string[];
    turn?: string;
    river?: string;
  }

  export interface SetDebugOverridesResponse {
    room_id: number;
    dealer_mode: string;
    // server echo: 实际写入 game_room.config_json.debug_overrides 的 JsonObject.
    // 形状 = 上面 Request 的 snake_case 镜像; 字段类型由 server 保证不双重编码.
    debug_overrides: Record<string, unknown>;
  }
}

const BASE = '/game/rooms';

// 写下一手调试发牌指令. 成功后 server 自动把 dealer_strategy 设为 'debug';
// 下一手 start_round tx 一次性消费并剥除 debug_overrides; 之后 strategy 回 noop.
export function setRoomDebugOverrides(
  roomId: number,
  body: GameRoomDebugApi.SetDebugOverridesRequest,
) {
  return requestClient.put<GameRoomDebugApi.SetDebugOverridesResponse>(
    `${BASE}/${roomId}/debug-overrides`,
    body,
  );
}
