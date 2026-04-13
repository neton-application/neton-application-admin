import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ClientApi {
  export interface Client {
    id?: number;
    name: string;
    appId: string;
    appSecret: string;
    status: number;
    remark?: string;
    contactName?: string;
    contactMobile?: string;
    createdAt?: string;
    updatedAt?: string;
  }

  export type ClientRequest = Pick<
    Client,
    'appId' | 'appSecret' | 'contactMobile' | 'contactName' | 'name' | 'remark' | 'status'
  > & {
    id?: number;
  };
}

export function getClientPage(params: PageParam) {
  return requestClient.get<PageResult<ClientApi.Client>>('/platform/client/page', { params });
}

export function getClient(id: number) {
  return requestClient.get<ClientApi.Client>(`/platform/client/get/${id}`);
}

export function createClient(data: ClientApi.ClientRequest) {
  return requestClient.post('/platform/client/create', data);
}

export function updateClient(data: ClientApi.ClientRequest) {
  return requestClient.put('/platform/client/update', data);
}

export function deleteClient(id: number) {
  return requestClient.delete(`/platform/client/delete/${id}`);
}

export function deleteClientList(ids: number[]) {
  return requestClient.delete(`/platform/client/delete-list?ids=${ids.join(',')}`);
}

export function exportClient(params: any) {
  return requestClient.download('/platform/client/export-excel', { params });
}

export function generateAppId() {
  return requestClient.get<{ appId: string }>('/platform/client/generateAppId');
}
