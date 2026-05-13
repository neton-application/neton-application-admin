import { requestClient } from '#/api/request';

import type { PrivchatUserApi } from '#/api/privchat/user';

export namespace PrivchatGroupApi {
  /** 群组列表项。 */
  export interface Group {
    group_id: number;
    channel_id: number;
    name?: string;
    description?: string;
    owner_id?: number;
    member_count: number;
    last_message_id?: number;
    last_message_at?: number;
    message_count: number;
    created_at: number;
    updated_at: number;
  }

  /** 群成员（嵌在群详情）。 */
  export interface Member {
    user_id: number;
    role?: string;
    joined_at?: number;
    /** 群内昵称（成员自定义，可能为空）。 */
    nickname?: string;
    /** 全局展示字段（server JOIN privchat_users）。 */
    username?: string;
    display_name?: string;
    avatar_url?: string;
  }

  /** 群详情：列表所有字段 + members 数组 + 群主全局展示字段。 */
  export interface GroupDetail extends Group {
    owner_username?: string;
    owner_display_name?: string;
    owner_avatar_url?: string;
    members?: Member[];
  }

  /** 群组列表（vxe-table 适配）。 */
  export interface GroupPageResult {
    list: Group[];
    total: number;
  }
}

const BASE = '/privchat/group';

/** 群组分页查询（server 暂不支持 search）。 */
export async function getGroupPage(params: {
  pageNo: number;
  pageSize: number;
}): Promise<PrivchatGroupApi.GroupPageResult> {
  const data = await requestClient.get<{
    groups: PrivchatGroupApi.Group[];
    total: number;
  }>(`${BASE}/page`, { params });
  return { list: data.groups ?? [], total: data.total ?? 0 };
}

/** 群详情（含群成员）。 */
export function getGroupDetail(groupId: number) {
  return requestClient.get<PrivchatGroupApi.GroupDetail>(
    `${BASE}/detail/${groupId}`,
  );
}

/** 群消息（vxe-table 适配；server 用 channel_id 过滤）。 */
export async function getGroupMessages(
  groupId: number,
  params: { pageNo: number; pageSize: number },
) {
  const data = await requestClient.get<{
    messages: PrivchatUserApi.Message[];
    total: number;
  }>(`${BASE}/detail/${groupId}/messages`, { params });
  return { list: data.messages ?? [], total: data.total ?? 0 };
}

/** 解散群组。 */
export function dissolveGroup(groupId: number) {
  return requestClient.delete(`${BASE}/detail/${groupId}`);
}

/** 移除群成员（Owner 由 server 拒绝）。 */
export function removeGroupMember(groupId: number, userId: number) {
  return requestClient.delete(
    `${BASE}/detail/${groupId}/members/${userId}`,
  );
}

/** 设置群成员角色（仅 admin / member 互切；Owner 由 server 拒绝）。 */
export function setGroupMemberRole(
  groupId: number,
  userId: number,
  role: 'admin' | 'member',
) {
  return requestClient.put(
    `${BASE}/detail/${groupId}/members/${userId}/role`,
    { role },
  );
}
