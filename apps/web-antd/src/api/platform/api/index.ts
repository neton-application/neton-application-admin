import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ApiApi {
    /** 开放平台API定义信息 */
  export interface Api {
            id: number; // API ID
            apiCode?: string; // API 编码
            apiName?: string; // API 名称
            apiPath?: string; // API 路径
            httpMethod?: string; // HTTP 方法
            category: string; // API 分类
            description: string; // API 描述
            status?: number; // 状态
            isPublic?: boolean; // 是否公开
            rateLimitPerMin?: number; // 每分钟限流
            chargeType?: number; // 计费类型
            defaultPrice?: number; // 默认单价（分）
      }
}

/** 查询开放平台API定义分页 */
export function getApiPage(params: PageParam) {
  return requestClient.get<PageResult<ApiApi.Api>>('/platform/api/page', { params });
}

/** 查询开放平台API定义详情 */
export function getApi(id: number) {
  return requestClient.get<ApiApi.Api>(`/platform/api/get/${id}`);
}

/** 新增开放平台API定义 */
export function createApi(data: ApiApi.Api) {
  return requestClient.post('/platform/api/create', data);
}

/** 修改开放平台API定义 */
export function updateApi(data: ApiApi.Api) {
  return requestClient.put('/platform/api/update', data);
}

/** 删除开放平台API定义 */
export function deleteApi(id: number) {
  return requestClient.delete(`/platform/api/delete/${id}`);
}

/** 批量删除开放平台API定义 */
export function deleteApiList(ids: number[]) {
  return requestClient.delete(`/platform/api/delete-list?ids=${ids.join(',')}`)
}

/** 导出开放平台API定义 */
export function exportApi(params: any) {
  return requestClient.download('/platform/api/export-excel', { params });
}
