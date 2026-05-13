import { requestClient } from '#/api/request';

export namespace PrivchatUserApi {
  /** IM 用户基础信息（与 server `UserInfo` 对齐）。 */
  export interface User {
    user_id: number;
    username?: string;
    phone?: string;
    email?: string;
    display_name?: string;
    avatar_url?: string;
    user_type: number;
    /** server 返字符串： Active / Inactive / Suspended / Deleted */
    status?: string;
    business_system_id?: string;
    created_at?: number;
    updated_at?: number;
  }

  /** IM 用户列表（用 list/total 适配 vxe-table，源字段 users/total）。 */
  export interface UserPageResult {
    list: User[];
    total: number;
  }

  /** 设备项。 */
  export interface Device {
    device_id: string;
    device_name?: string;
    device_model?: string;
    app_id: string;
    device_type: string;
    last_active_at: number;
    created_at: number;
    ip_address?: string;
  }

  /** 好友项。 */
  export interface Friend {
    user_id: number;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  }

  /** 用户加入的群项。 */
  export interface JoinedGroup {
    group_id: number;
    channel_id: number;
    name?: string;
    description?: string;
    owner_id?: number;
    member_count: number;
    role?: string;
    nickname?: string;
    joined_at?: number;
  }

  /** 登录日志项。 */
  export interface LoginLog {
    log_id: number;
    user_id: number;
    device_id: string;
    device_type?: string;
    device_name?: string;
    ip_address?: string;
    status: number;
    risk_score?: number;
    is_new_device: boolean;
    is_new_location: boolean;
    created_at: number;
  }

  /** 消息项。 */
  export interface Message {
    message_id: number;
    channel_id: number;
    sender_id: number;
    pts: number;
    local_message_id?: number;
    content: string;
    message_type: string;
    metadata?: unknown;
    reply_to_message_id?: number;
    created_at: number;
    updated_at?: number;
    deleted: boolean;
    revoked: boolean;
  }
}

const BASE = '/privchat/user';

/** IM 用户分页查询。 */
export async function getUserPage(params: {
  pageNo: number;
  pageSize: number;
  search?: string;
  status?: number;
  userType?: number;
  businessSystemId?: string;
}): Promise<PrivchatUserApi.UserPageResult> {
  const data = await requestClient.get<{
    users: PrivchatUserApi.User[];
    total: number;
  }>(`${BASE}/page`, { params });
  return { list: data.users ?? [], total: data.total ?? 0 };
}

/** IM 用户详情。 */
export function getUserDetail(uid: number) {
  return requestClient.get<PrivchatUserApi.User>(`${BASE}/detail/${uid}`);
}

/** 用户好友列表。 */
export function getUserFriends(uid: number) {
  return requestClient.get<{
    user_id: number;
    friends: PrivchatUserApi.Friend[];
    total: number;
  }>(`${BASE}/detail/${uid}/friends`);
}

/** 用户加入的群列表。 */
export function getUserJoinedGroups(uid: number) {
  return requestClient.get<{
    user_id: number;
    groups: PrivchatUserApi.JoinedGroup[];
  }>(`${BASE}/detail/${uid}/groups`);
}

/** 用户在线设备列表。 */
export function getUserDevices(uid: number) {
  return requestClient.get<{
    user_id: number;
    devices: PrivchatUserApi.Device[];
    total: number;
  }>(`${BASE}/detail/${uid}/devices`);
}

/** 用户登录日志（按 user_id 过滤）。 */
export async function getUserLoginLogs(
  uid: number,
  params: { pageNo: number; pageSize: number },
) {
  const data = await requestClient.get<{
    logs: PrivchatUserApi.LoginLog[];
    total: number;
  }>(`${BASE}/detail/${uid}/login-logs`, { params });
  return { list: data.logs ?? [], total: data.total ?? 0 };
}

/** 用户消息记录（按 sender_id 过滤；admin 端用得不多，保留但未挂在 UI 上）。 */
export async function getUserMessages(
  uid: number,
  params: { pageNo: number; pageSize: number },
) {
  const data = await requestClient.get<{
    messages: PrivchatUserApi.Message[];
    total: number;
  }>(`${BASE}/detail/${uid}/messages`, { params });
  return { list: data.messages ?? [], total: data.total ?? 0 };
}

/** 两人私聊聊天记录（admin 端"用户 → 好友 → 聊天记录"链路）。 */
export async function getConversationMessages(
  uid: number,
  peerUid: number,
  params: { pageNo: number; pageSize: number },
) {
  const data = await requestClient.get<{
    messages: PrivchatUserApi.Message[];
    total: number;
  }>(`${BASE}/detail/${uid}/conversations/${peerUid}/messages`, { params });
  return { list: data.messages ?? [], total: data.total ?? 0 };
}

/** 封禁用户。 */
export function suspendUser(
  uid: number,
  data: { reason: string; durationSecs?: number },
) {
  return requestClient.post(`${BASE}/detail/${uid}/suspend`, data);
}

/** 解封用户。 */
export function unsuspendUser(uid: number) {
  return requestClient.post(`${BASE}/detail/${uid}/unsuspend`, {});
}

/** 强制下线该用户全部设备。 */
export function revokeAllDevices(uid: number, data: { reason?: string }) {
  return requestClient.post(`${BASE}/detail/${uid}/revoke-all-devices`, data);
}

/** 强制下线指定设备。 */
export function revokeDevice(
  uid: number,
  deviceId: string,
  data: { reason?: string },
) {
  return requestClient.post(
    `${BASE}/detail/${uid}/devices/${deviceId}/revoke`,
    data,
  );
}

/** Bump session_version（让旧 token 失效，不改 session_state）。 */
export function bumpSessions(uid: number, data: { reason?: string }) {
  return requestClient.post(`${BASE}/detail/${uid}/bump-sessions`, data);
}
