import { requestClient } from '#/api/request';

/**
 * Game admin Club API — 俱乐部列表 / 详情 / 成员 / 抽水统计 (P-club-game-center).
 * 对接 controller/admin/club/ClubController (实际 /admin/game/clubs/*).
 *
 * 双视角架构:
 *   - 顶级菜单 (游戏日志 / 资金流水 / 牌桌管理) = 平台超管视角, 跨 club 全局
 *   - 俱乐部详情 5 Tab (本文件 + views/game/club/detail) = 俱乐部老板视角,
 *     全部默认 club_id filter, 复用现有 /tables/page, /audit/page, /ledger/page,
 *     /tables/{id}/hands endpoint (不需要新建 nested 路径).
 *
 * 后端契约:
 *   GET /admin/game/clubs/page                       list (game:club:read)
 *   GET /admin/game/clubs/get/{clubId}               detail (game:club:read)
 *   GET /admin/game/clubs/{clubId}/members           成员 (game:club:read)
 *   GET /admin/game/clubs/{clubId}/revenue-summary   抽水统计
 *                                                    (game:club:revenue:read)
 *
 * **v1 边界**: revenue-summary 是只读 game_ledger_entry 聚合; 真实"俱乐部
 * 资金池 + 代理分成 + 结算周期"在 GAME_REVENUE_SHARE_SPEC.md (v1.1+).
 */

export namespace GameClubApi {
  export const STATUS_ACTIVE = 1;
  export const STATUS_DISSOLVED = 2;

  export const ROLE_MEMBER = 0;
  export const ROLE_ADMIN = 1;
  export const ROLE_OWNER = 2;

  export interface ClubListItem {
    club_id: number;
    owner_user_id: number;
    name: string;
    description?: null | string;
    status: number;
    member_count: number;
    created_at: number;
    updated_at: number;
  }

  export interface ClubListResponse {
    list: ClubListItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }

  export interface ClubDetail {
    club_id: number;
    owner_user_id: number;
    name: string;
    description?: null | string;
    status: number;
    member_count: number;
    active_table_count: number;
    total_table_count: number;
    created_at: number;
    updated_at: number;
  }

  export interface ClubMember {
    club_id: number;
    user_id: number;
    role: number;
    joined_at: number;
  }

  export interface RevenueSummary {
    club_id: number;
    total_rake: number;
    today_rake: number;
    hand_count: number;
    active_table_count: number;
    total_table_count: number;
    debit_total: number;
    credit_total: number;
    today_start: number;
    today_end: number;
  }

  export interface ListParams {
    page: number;
    page_size: number;
    club_id?: number;
    owner_user_id?: number;
    name?: string;
    status?: number;
    created_from?: number;
    created_to?: number;
  }
}

const BASE = '/game/clubs';

export async function getClubPage(
  params: GameClubApi.ListParams,
): Promise<{ list: GameClubApi.ClubListItem[]; total: number }> {
  const data = await requestClient.get<GameClubApi.ClubListResponse>(
    `${BASE}/page`,
    { params },
  );
  return { list: data.list ?? [], total: data.total ?? 0 };
}

export function getClubDetail(clubId: number) {
  return requestClient.get<GameClubApi.ClubDetail>(`${BASE}/get/${clubId}`);
}

export function getClubMembers(clubId: number) {
  return requestClient.get<GameClubApi.ClubMember[]>(`${BASE}/${clubId}/members`);
}

export function getClubRevenueSummary(clubId: number) {
  return requestClient.get<GameClubApi.RevenueSummary>(
    `${BASE}/${clubId}/revenue-summary`,
  );
}
