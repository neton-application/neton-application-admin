import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemSmsLogApi {
  /** 短信日志信息（对齐 privchat-application module-system 的 MessageLogVO）。 */
  export interface SmsLog {
    id: number;
    channelId: number;
    templateId?: number;
    templateCode?: string;
    /** 接收方（手机号）。后端字段是 receiver，不是 mobile。 */
    receiver: string;
    /** 短信内容。后端字段是 content，不是 templateContent。 */
    content?: string;
    /** 发送参数（后端序列化为字符串）。 */
    params?: string;
    /** 发送状态：0=成功 1=失败。 */
    sendStatus?: number;
    /** 发送时间（epoch millis）。 */
    sendTime?: number;
    /** 失败原因。 */
    errorMessage?: string;
    userId?: number;
    userType?: number;
    /** 创建时间（epoch millis）。后端字段是 createdAt，不是 createTime。 */
    createdAt: number;
  }
}

/** 查询短信日志列表 */
export function getSmsLogPage(params: PageParam) {
  return requestClient.get<PageResult<SystemSmsLogApi.SmsLog>>(
    '/system/sms-log/page',
    { params },
  );
}
