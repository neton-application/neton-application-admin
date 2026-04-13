import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ApiApi {
  export interface Api {
    id?: number;
    name: string;
    code: string;
    description?: string;
    price: number;
    status: number;
    createdAt?: string;
    updatedAt?: string;
  }

  export type ApiRequest = Pick<
    Api,
    'code' | 'description' | 'name' | 'price' | 'status'
  > & {
    id?: number;
  };
}

export function getApiPage(params: PageParam) {
  return requestClient.get<PageResult<ApiApi.Api>>('/platform/api/page', { params });
}

export function getApi(id: number) {
  return requestClient.get<ApiApi.Api>(`/platform/api/get/${id}`);
}

export function createApi(data: ApiApi.ApiRequest) {
  return requestClient.post('/platform/api/create', data);
}

export function updateApi(data: ApiApi.ApiRequest) {
  return requestClient.put('/platform/api/update', data);
}

export function deleteApi(id: number) {
  return requestClient.delete(`/platform/api/delete/${id}`);
}

export function deleteApiList(ids: number[]) {
  return requestClient.delete(`/platform/api/delete-list?ids=${ids.join(',')}`);
}

export function exportApi(params: any) {
  return requestClient.download('/platform/api/export-excel', { params });
}
