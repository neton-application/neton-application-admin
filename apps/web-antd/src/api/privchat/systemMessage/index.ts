import { requestClient } from '#/api/request';

export namespace PrivchatSystemMessageApi {
  export type TargetType = 'users' | 'groups' | 'channels';

  export interface Content {
    type: 'text';
    text: string;
  }

  export interface SendRequest {
    target_type: TargetType;
    user_ids?: number[];
    group_ids?: number[];
    channel_ids?: number[];
    content: Content;
    /** 可选发送者 user_id；缺省由 server 用 SYSTEM_USER_ID。 */
    sender_id?: number;
  }

  export interface DeliveryResult {
    target: string;
    ok: boolean;
    channel_id?: number;
    message_id?: number;
    error_code?: string;
    error_message?: string;
  }

  export interface SendResponse {
    request_id: string;
    target_type: TargetType;
    sender_id: number;
    total_targets: number;
    ok_count: number;
    fail_count: number;
    results: DeliveryResult[];
  }

  /** 系统消息可选 sender 列表项。user_type: 1=System, 2=Bot。 */
  export interface SenderItem {
    user_id: number;
    username?: string;
    display_name?: string;
    avatar_url?: string;
    user_type: number;
  }

  export interface ListSendersResponse {
    items: SenderItem[];
  }
}

const BASE = '/privchat/system-message';

/**
 * 发送系统消息（v1：精准定向，仅 text 类型）。
 *
 * 成功 = server 已写入 IM 消息表。**不承诺**用户已读 / 设备 push 已送达。
 *
 * 上限（server 端校验，超出直接拒）：
 *   - users: ≤ 100
 *   - groups: ≤ 50
 *   - channels: ≤ 100
 */
export function sendSystemMessage(data: PrivchatSystemMessageApi.SendRequest) {
  return requestClient.post<PrivchatSystemMessageApi.SendResponse>(
    `${BASE}/send`,
    data,
  );
}

/**
 * 列出可选 sender（user_type ∈ {1=System, 2=Bot}）。
 *
 * UI 推荐：默认不传 `sender_id` → server 用 SYSTEM_USER_ID；
 * 用户从此列表挑选时再带上 `sender_id`。
 */
export function getSystemSenders() {
  return requestClient.get<PrivchatSystemMessageApi.ListSendersResponse>(
    `${BASE}/senders`,
  );
}
