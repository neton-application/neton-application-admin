import { requestClient } from '#/api/request';

/**
 * Game admin Agent API (P-revenue-runtime).
 * 对接 controller/admin/agent/AgentController (/admin/game/agents/*).
 *
 * 代理层级:
 *   平台 (隐式 level=0)
 *     └── 总代理 (level=1, parent_agent_id=NULL)
 *           └── 一级代理 (level=2)
 *                 └── 二级代理 (level=3)
 *                       └── 俱乐部 (game_club_agent 1:1 绑定)
 *
 * 业务规则 (后端校验):
 *   - level=1 必须 parent_agent_id=NULL; level>=2 必须 parent 存在且 level=child-1
 *   - 同一 user_id 只能绑一个 agent (DB UNIQUE)
 *   - 不允许环 (业务层校)
 *   - delete 不支持; status=DISABLED 软删 (历史 ledger 不动)
 *
 * 后端契约:
 *   GET  /page
 *   GET  /get/{agentId}
 *   GET  /{agentId}/clubs
 *   POST /create
 *   POST /{agentId}/{update,enable,disable}
 *   POST /bind-club          {club_id, agent_id}
 *   POST /unbind-club/{clubId}
 *
 * 权限点: game:agent:read / game:agent:update
 */

export namespace GameAgentApi {
  export const STATUS_ACTIVE = 1;
  export const STATUS_DISABLED = 0;

  export const LEVEL_TOP = 1;
  export const LEVEL_MAX = 10;

  export interface AgentRow {
    agent_id: number;
    user_id: number;
    parent_agent_id?: null | number;
    level: number;
    display_name: string;
    status: number;
    contact_info?: null | string;
    created_at: number;
    updated_at: number;
  }

  export interface AgentListResponse {
    list: AgentRow[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }

  export interface ClubAgentBinding {
    club_id: number;
    agent_id: number;
    bound_at: number;
  }

  export interface ListParams {
    page: number;
    page_size: number;
    agent_id?: number;
    user_id?: number;
    parent_agent_id?: number;
    level?: number;
    status?: number;
    name?: string;
  }

  export interface CreateBody {
    user_id: number;
    parent_agent_id?: null | number;
    level: number;
    display_name: string;
    contact_info?: null | string;
  }

  export interface UpdateBody {
    display_name: string;
    contact_info?: null | string;
  }

  export interface BindBody {
    club_id: number;
    agent_id: number;
  }
}

const BASE = '/game/agents';

export async function getAgentPage(
  params: GameAgentApi.ListParams,
): Promise<{ list: GameAgentApi.AgentRow[]; total: number }> {
  const data = await requestClient.get<GameAgentApi.AgentListResponse>(
    `${BASE}/page`,
    { params },
  );
  return { list: data.list ?? [], total: data.total ?? 0 };
}

export function getAgentDetail(agentId: number) {
  return requestClient.get<GameAgentApi.AgentRow>(`${BASE}/get/${agentId}`);
}

export function getAgentClubs(agentId: number) {
  return requestClient.get<GameAgentApi.ClubAgentBinding[]>(
    `${BASE}/${agentId}/clubs`,
  );
}

export function createAgent(body: GameAgentApi.CreateBody) {
  return requestClient.post<GameAgentApi.AgentRow>(`${BASE}/create`, body);
}

export function updateAgent(agentId: number, body: GameAgentApi.UpdateBody) {
  return requestClient.post<GameAgentApi.AgentRow>(
    `${BASE}/${agentId}/update`,
    body,
  );
}

export function enableAgent(agentId: number) {
  return requestClient.post<GameAgentApi.AgentRow>(`${BASE}/${agentId}/enable`);
}

export function disableAgent(agentId: number) {
  return requestClient.post<GameAgentApi.AgentRow>(
    `${BASE}/${agentId}/disable`,
  );
}

export function bindClubToAgent(body: GameAgentApi.BindBody) {
  return requestClient.post<GameAgentApi.ClubAgentBinding>(
    `${BASE}/bind-club`,
    body,
  );
}

export function unbindClubFromAgent(clubId: number) {
  return requestClient.post<boolean>(`${BASE}/unbind-club/${clubId}`);
}
