import { requestClient } from '#/api/request';

/**
 * Game admin Kind API — game_kind 表 CRUD.
 * 对接 controller/admin/kind/KindController (实际 /admin/game/kinds/*).
 *
 * 控制面边界:
 *   - 不暴露 create / delete: 新 kind 必须先后端注册 GameRule, admin 只能
 *     edit/enable/disable 现有 kind. status=DISABLED 是软删 (旧桌继续跑,
 *     创新桌被 GAME_KIND_DISABLED 拒).
 *
 * 后端契约:
 *   GET   /admin/game/kinds/page                  list (含 active/total table 用量)
 *   GET   /admin/game/kinds/get/{kind}            detail
 *   POST  /admin/game/kinds/{kind}/update         改 display/seats/default_config_json
 *   POST  /admin/game/kinds/{kind}/enable         status -> ACTIVE
 *   POST  /admin/game/kinds/{kind}/disable        status -> DISABLED
 *   权限: game:kind:read / game:kind:update
 */

export namespace GameKindApi {
  export const STATUS_DISABLED = 0;
  export const STATUS_ACTIVE = 1;

  /** game_kind 行 + 用量统计. */
  export interface KindRow {
    kind: string;
    display_name: string;
    status: number;
    min_seats: number;
    max_seats: number;
    default_config_json?: null | string;
    created_at: number;
    updated_at: number;
    active_table_count: number;
    total_table_count: number;
  }

  export interface KindListResponse {
    list: KindRow[];
    total: number;
  }

  export interface UpdateKindBody {
    display_name: string;
    min_seats: number;
    max_seats: number;
    default_config_json?: null | string;
  }
}

const BASE = '/game/kinds';

/** 全部 game_kind 列表 (单页, v1 < 50 kind, 暂不分页). */
export async function getKindList(): Promise<{
  list: GameKindApi.KindRow[];
  total: number;
}> {
  const data = await requestClient.get<GameKindApi.KindListResponse>(
    `${BASE}/page`,
  );
  return { list: data.list ?? [], total: data.total ?? 0 };
}

/** 单 kind 详情 (含用量). */
export function getKindDetail(kind: string) {
  return requestClient.get<GameKindApi.KindRow>(`${BASE}/get/${kind}`);
}

/** 改 display / seats / default_config_json. */
export function updateKind(kind: string, body: GameKindApi.UpdateKindBody) {
  return requestClient.post<GameKindApi.KindRow>(
    `${BASE}/${kind}/update`,
    body,
  );
}

/** status -> ACTIVE. */
export function enableKind(kind: string) {
  return requestClient.post<GameKindApi.KindRow>(`${BASE}/${kind}/enable`);
}

/** status -> DISABLED (软删; 旧桌不受影响, 创新桌被拒). */
export function disableKind(kind: string) {
  return requestClient.post<GameKindApi.KindRow>(`${BASE}/${kind}/disable`);
}
