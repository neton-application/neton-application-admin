import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace LogApi {
  /** 开放平台调用日志信息 */
  export interface Log {
    id: number;
    clientId?: number;
    apiId?: number;
    requestUrl?: string;
    requestParams?: string;
    responseBody?: string;
    userIp?: string;
    duration?: number;
    resultCode?: number;
    createdAt?: string;
  }

  export interface LogRequest {
    id?: number;
    clientId: number;
    apiId: number;
    requestUrl?: string;
    requestParams?: string;
    responseBody?: string;
    userIp?: string;
    duration?: number;
    resultCode?: number;
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
export function createLog(data: LogApi.LogRequest) {
  return requestClient.post('/platform/log/create', data);
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
