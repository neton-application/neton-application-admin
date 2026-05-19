import { requestClient } from '#/api/request';

/**
 * Game admin Revenue Share Rule API (P-revenue-runtime).
 * 对接 controller/admin/revenue/RevenueShareRuleController (/admin/game/revenue-rules/*).
 *
 * 分账规则 (basis points, sum = 10000):
 *   share_platform_bps      平台分成
 *   share_club_bps          俱乐部分成
 *   share_agent_bps         直属代理分成
 *   share_upper_agent_bps   上级代理分成
 *   share_top_agent_bps     总代理分成
 *
 * scope 优先级 (后端 resolveEffectiveRule):
 *   per_club (3) > per_agent (4) > per_game_kind (2) > global default (1)
 *
 * 业务规则:
 *   - global default (scope=1) 必须有且仅有 1 条 active (V009 seed); 不能 archive 唯一活跃 global
 *   - 同一 scope 允许多条 (effective_from 倒序取最新)
 *   - archive 是软删 (status=0 + effective_to 标到 now)
 *
 * 权限点: game:revenue:rule:read / game:revenue:rule:update
 */

export namespace GameShareRuleApi {
  export const SCOPE_GLOBAL = 1;
  export const SCOPE_PER_GAME_KIND = 2;
  export const SCOPE_PER_CLUB = 3;
  export const SCOPE_PER_AGENT = 4;

  export const STATUS_ACTIVE = 1;
  export const STATUS_ARCHIVED = 0;

  export const BPS_TOTAL = 10_000;

  export interface RuleRow {
    rule_id: number;
    scope_type: number;
    scope_ref_id?: null | string;
    share_platform_bps: number;
    share_club_bps: number;
    share_agent_bps: number;
    share_upper_agent_bps: number;
    share_top_agent_bps: number;
    effective_from: number;
    effective_to?: null | number;
    status: number;
    note?: null | string;
    created_at: number;
    created_by: number;
  }

  export interface RuleListResponse {
    list: RuleRow[];
    total: number;
  }

  export interface CreateBody {
    scope_type: number;
    scope_ref_id?: null | string;
    share_platform_bps: number;
    share_club_bps: number;
    share_agent_bps: number;
    share_upper_agent_bps: number;
    share_top_agent_bps: number;
    effective_from?: number;
    effective_to?: null | number;
    note?: null | string;
  }
}

const BASE = '/game/revenue-rules';

export async function getShareRulePage(): Promise<{
  list: GameShareRuleApi.RuleRow[];
  total: number;
}> {
  const data = await requestClient.get<GameShareRuleApi.RuleListResponse>(
    `${BASE}/page`,
  );
  return { list: data.list ?? [], total: data.total ?? 0 };
}

export function getShareRuleDetail(ruleId: number) {
  return requestClient.get<GameShareRuleApi.RuleRow>(`${BASE}/get/${ruleId}`);
}

export function createShareRule(body: GameShareRuleApi.CreateBody) {
  return requestClient.post<GameShareRuleApi.RuleRow>(`${BASE}/create`, body);
}

export function archiveShareRule(ruleId: number) {
  return requestClient.post<GameShareRuleApi.RuleRow>(
    `${BASE}/${ruleId}/archive`,
  );
}

export function scopeLabel(scope: number): string {
  switch (scope) {
    case 1: {
      return '全局默认';
    }
    case 2: {
      return '玩法专属';
    }
    case 3: {
      return '俱乐部专属';
    }
    case 4: {
      return '代理专属';
    }
    default: {
      return `scope=${scope}`;
    }
  }
}

export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}
