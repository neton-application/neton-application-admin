import type { PageParam, PageResult } from '@vben/request';
import type { Dayjs } from 'dayjs';

import { requestClient } from '#/api/request';

export namespace LogApi {
    /** 开放平台调用日志信息 */
  export interface Log {
            id: number; // 日志ID
            traceId?: string; // 请求跟踪ID（对应 X-Trace-Id）
            clientId?: string; // 客户端ID
            apiId: number; // API ID（关联 platform_api.id）
            apiCode: string; // API 编码
            apiPath?: string; // API 路径
            httpMethod?: string; // HTTP 方法
            requestHeaders: string; // 请求头（JSON）
            requestParams: string; // 请求参数（JSON）
            requestBody: string; // 请求体（JSON）
            requestIp: string; // 请求IP
            requestUserAgent: string; // User-Agent
            responseStatus: number; // HTTP 状态码
            responseBody: string; // 响应内容（截断，保留前 10KB）
            durationMs: number; // 耗时（毫秒）
            success?: boolean; // 是否成功
            errorCode: string; // 错误码
            errorMsg: string; // 错误信息
            chargePrice?: number; // 本次计费金额（分）
            chargeStatus: number; // 扣费状态：1=成功 2=失败（余额不足）
            requestTime?: string | Dayjs; // 请求时间（UTC）
      }
}

/** 查询开放平台调用日志分页 */
export function getLogPage(params: PageParam) {
  return requestClient.get<PageResult<LogApi.Log>>('/platform/log/page', { params });
}

/** 查询开放平台调用日志详情 */
export function getLog(id: number) {
  return requestClient.get<LogApi.Log>(`/platform/log/get/${id}`);
}

/** 新增开放平台调用日志 */
export function createLog(data: LogApi.Log) {
  return requestClient.post('/platform/log/create', data);
}

/** 修改开放平台调用日志 */
export function updateLog(data: LogApi.Log) {
  return requestClient.put('/platform/log/update', data);
}

/** 删除开放平台调用日志 */
export function deleteLog(id: number) {
  return requestClient.delete(`/platform/log/delete/${id}`);
}

/** 批量删除开放平台调用日志 */
export function deleteLogList(ids: number[]) {
  return requestClient.delete(`/platform/log/delete-list?ids=${ids.join(',')}`)
}

/** 导出开放平台调用日志 */
export function exportLog(params: any) {
  return requestClient.download('/platform/log/export-excel', { params });
}