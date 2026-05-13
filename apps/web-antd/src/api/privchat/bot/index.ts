import { requestClient } from '#/api/request';

export namespace PrivchatBotApi {
  /** 列表项：name/username/avatar_url/owner_* 来自 PrivChat user 表（admin controller 拼装）。 */
  export interface BotItem {
    /** bot 自己的 PrivChat user_id（同时也是 privchat_bot_profile.id） */
    id: number;
    /** 所属用户 ID（owner） */
    owner_user_id: number;
    /** owner 的 display_name（昵称） */
    owner_name?: string;
    /** owner 的 username（备用展示） */
    owner_username?: string;
    service_id: number;
    service_name?: string;
    /** 来自 user.display_name */
    name?: string;
    /** 来自 user.username */
    username?: string;
    /** 来自 user.avatar_url；头像在 member 模块维护 */
    avatar_url?: string;
    description?: string;
    status: number;
    has_menu: boolean;
    created_at?: number;
    updated_at?: number;
  }

  /** 详情（含完整 menu_schema）。 */
  export interface BotDetail {
    id: number;
    owner_user_id: number;
    owner_name?: string;
    owner_username?: string;
    service_id: number;
    service_name?: string;
    name?: string;
    username?: string;
    avatar_url?: string;
    description?: string;
    status: number;
    menu_schema?: BotMenuSchema | null;
    created_at?: number;
    updated_at?: number;
  }

  export interface BotPageResult {
    list: BotItem[];
    total: number;
  }

  export interface BotMenuSchema {
    version: number;
    items: BotMenuItem[];
  }

  export interface BotMenuItem {
    id: string;
    title: string;
    action: BotMenuAction;
  }

  export type BotMenuAction =
    | BotMenuMessageAction
    | BotMenuTransferAction
    | BotMenuWebAction;

  export interface BotMenuTransferAction {
    type: 'transfer';
    route: string;
    body?: Record<string, unknown>;
  }

  export interface BotMenuMessageAction {
    type: 'message';
    text: string;
    metadata?: Record<string, unknown>;
  }

  export interface BotMenuWebAction {
    type: 'web';
    url: string;
    open_mode?: string;
    prefetch_signed_url_route?: string;
  }

  /**
   * 创建机器人请求。
   * - 只创建 Bot（后端 user_type 固定 2，**不**接受前端传值）
   * - 系统用户（user_type=1）走独立入口，不在本表单
   * - 不接受 avatar_url（头像在 member 模块）
   * - 不接受 service_id（v1 固定 bot service 9001）
   */
  export interface CreateRequest {
    name: string;
    username?: string;
    description?: string;
    /** 所属用户 user_id（owner），必填 */
    owner_user_id: number;
    reason?: string;
  }

  export interface CreateResponse {
    /** bot 自己的 PrivChat user_id */
    id: number;
    owner_user_id: number;
    service_id: number;
    status: number;
  }

  export interface UpdateRequest {
    name?: string;
    username?: string;
    description?: string;
    reason?: string;
  }

  export interface UpdateMenuRequest {
    menu_schema?: BotMenuSchema | null;
    reason?: string;
  }
}

const BASE = '/privchat/bot';

export async function getBotPage(params: {
  pageNo: number;
  pageSize: number;
  status?: number;
  ownerUserId?: number;
}): Promise<PrivchatBotApi.BotPageResult> {
  const data = await requestClient.get<{
    bots: PrivchatBotApi.BotItem[];
    total: number;
  }>(`${BASE}/page`, { params });
  return { list: data.bots ?? [], total: data.total ?? 0 };
}

export function getBotDetail(botId: number) {
  return requestClient.get<PrivchatBotApi.BotDetail>(`${BASE}/detail/${botId}`);
}

export function createBot(data: PrivchatBotApi.CreateRequest) {
  return requestClient.post<PrivchatBotApi.CreateResponse>(
    `${BASE}/create`,
    data,
  );
}

export function updateBot(botId: number, data: PrivchatBotApi.UpdateRequest) {
  return requestClient.put(`${BASE}/${botId}`, data);
}

export function updateBotMenu(
  botId: number,
  data: PrivchatBotApi.UpdateMenuRequest,
) {
  return requestClient.put(`${BASE}/${botId}/menu`, data);
}

export function enableBot(botId: number) {
  return requestClient.post(`${BASE}/${botId}/enable`, {});
}

export function disableBot(botId: number) {
  return requestClient.post(`${BASE}/${botId}/disable`, {});
}

export function deleteBot(botId: number) {
  return requestClient.delete(`${BASE}/${botId}`);
}
