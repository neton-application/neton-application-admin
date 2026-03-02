import type { PageParam, PageResult } from '@vben/request';
import type { Dayjs } from 'dayjs';

import { requestClient } from '#/api/request';

export namespace ClientApiApi {
    /** 客户端-API授权关系表（含自定义定价）信息 */
  export interface ClientApi {
            id: number; // 关系ID
            clientId?: string; // 客户端
            apiId?: number; // API ID
            status?: number; // 是否启用
            rateLimitPerMin: number; // 每分钟限流（覆盖 API 默认配置）
            rateLimitPerDay: number; // 每日配额（覆盖客户端默认配置）
            isCustomPrice?: number; // 是否自定义价格
            customPrice: number; // 自定义价格（分，仅当 is_custom_price=1 时有效）
            startTime: string | Dayjs; // 授权开始时间
            endTime: string | Dayjs; // 授权结束时间（为空表示永久）
      }
}

/** 查询客户端-API授权关系表（含自定义定价）分页 */
export function getClientApiPage(params: PageParam) {
  return requestClient.get<PageResult<ClientApiApi.ClientApi>>('/platform/client-api/page', { params });
}

/** 查询客户端-API授权关系表（含自定义定价）详情 */
export function getClientApi(id: number) {
  return requestClient.get<ClientApiApi.ClientApi>(`/platform/client-api/get/${id}`);
}

/** 新增客户端-API授权关系表（含自定义定价） */
export function createClientApi(data: ClientApiApi.ClientApi) {
  return requestClient.post('/platform/client-api/create', data);
}

/** 修改客户端-API授权关系表（含自定义定价） */
export function updateClientApi(data: ClientApiApi.ClientApi) {
  return requestClient.put('/platform/client-api/update', data);
}

/** 删除客户端-API授权关系表（含自定义定价） */
export function deleteClientApi(id: number) {
  return requestClient.delete(`/platform/client-api/delete/${id}`);
}

/** 批量删除客户端-API授权关系表（含自定义定价） */
export function deleteClientApiList(ids: number[]) {
  return requestClient.delete(`/platform/client-api/delete-list?ids=${ids.join(',')}`)
}

/** 导出客户端-API授权关系表（含自定义定价） */
export function exportClientApi(params: any) {
  return requestClient.download('/platform/client-api/export-excel', { params });
}
