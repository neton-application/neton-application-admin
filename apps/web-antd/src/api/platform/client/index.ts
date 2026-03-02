import type { PageParam, PageResult } from '@vben/request';
import type { Dayjs } from 'dayjs';

import { requestClient } from '#/api/request';

export namespace ClientApi {
    /** 开放平台客户端信息 */
  export interface Client {
            id: number; // 客户端ID
            clientId: string; // 客户端唯一标识（公开）
            clientSecret?: string; // 客户端密钥（AES-256 加密存储）
            clientName?: string; // 客户端名称
            clientCode: string; // 客户端编码（英文标识）
            clientLogo: string; // 客户端Logo URL
            description: string; // 客户端描述
            companyName: string; // 公司名称
            businessLicense: string; // 营业执照号
            contactName: string; // 联系人姓名
            contactEmail: string; // 联系人邮箱
            contactPhone: string; // 联系人电话
            status?: number; // 状态
            clientType?: number; // 客户端类型
            rateLimitPerMin?: number; // 每分钟频率限制（次/分钟）
            rateLimitPerDay?: number; // 每日调用配额
            usedCountToday?: number; // 今日已用次数
            totalUsedCount?: number; // 累计调用次数
            balance?: number; // 账户余额（分）
            totalCharged?: number; // 累计消费金额（分）
            lowBalanceAlert?: number; // 余额不足预警阈值（分，默认100元）
            allowedIps: string; // 允许的IP白名单
            webhookUrl: string; // 回调地址（接收平台通知）
            expiredTime: string | Dayjs; // 过期时间（为空表示永久有效）
            lastCallTime: string | Dayjs; // 最后调用时间
      }
}

/** 查询开放平台客户端分页 */
export function getClientPage(params: PageParam) {
  return requestClient.get<PageResult<ClientApi.Client>>('/platform/client/page', { params });
}

/** 查询开放平台客户端详情 */
export function getClient(id: number) {
  return requestClient.get<ClientApi.Client>(`/platform/client/get/${id}`);
}

/** 新增开放平台客户端 */
export function createClient(data: ClientApi.Client) {
  return requestClient.post('/platform/client/create', data);
}

/** 修改开放平台客户端 */
export function updateClient(data: ClientApi.Client) {
  return requestClient.put('/platform/client/update', data);
}

/** 删除开放平台客户端 */
export function deleteClient(id: number) {
  return requestClient.delete(`/platform/client/delete/${id}`);
}

/** 批量删除开放平台客户端 */
export function deleteClientList(ids: number[]) {
  return requestClient.delete(`/platform/client/delete-list?ids=${ids.join(',')}`)
}

/** 导出开放平台客户端 */
export function exportClient(params: any) {
  return requestClient.download('/platform/client/export-excel', { params });
}

/** 生成客户端唯一标识 */
export function generateAppId() {
  return requestClient.get<string>('/platform/client/generateAppId');
}
