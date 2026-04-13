import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ClientApiApi {
  export interface ClientApi {
    id?: number;
    clientId: number;
    apiId: number;
    customPrice?: number;
    status: number;
    createdAt?: string;
    updatedAt?: string;
  }

  export type ClientApiRequest = Pick<
    ClientApi,
    'apiId' | 'clientId' | 'customPrice' | 'status'
  > & {
    id?: number;
  };
}

export function getClientApiPage(params: PageParam) {
  return requestClient.get<PageResult<ClientApiApi.ClientApi>>('/platform/client-api/page', { params });
}

export function getClientApi(id: number) {
  return requestClient.get<ClientApiApi.ClientApi>(`/platform/client-api/get/${id}`);
}

export function createClientApi(data: ClientApiApi.ClientApiRequest) {
  return requestClient.post('/platform/client-api/create', data);
}

export function updateClientApi(data: ClientApiApi.ClientApiRequest) {
  return requestClient.put('/platform/client-api/update', data);
}

export function deleteClientApi(id: number) {
  return requestClient.delete(`/platform/client-api/delete/${id}`);
}

export function deleteClientApiList(ids: number[]) {
  return requestClient.delete(`/platform/client-api/delete-list?ids=${ids.join(',')}`);
}

export function exportClientApi(params: any) {
  return requestClient.download('/platform/client-api/export-excel', { params });
}
