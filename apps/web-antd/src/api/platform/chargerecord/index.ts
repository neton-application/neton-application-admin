import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ChargeRecordApi {
  /** 开放平台计费记录信息 */
  export interface ChargeRecord {
    id: number;
    clientId?: number;
    apiId?: number;
    orderId?: string;
    apiCode?: string;
    price?: number;
    amount?: number;
    status?: number;
    createdAt?: string;
  }

  export interface ChargeRecordRequest {
    id?: number;
    clientId: number;
    apiId: number;
    orderId?: string;
    apiCode?: string;
    price?: number;
    amount?: number;
    status?: number;
  }
}

/** 查询开放平台计费记录分页 */
export function getChargeRecordPage(params: PageParam) {
  return requestClient.get<PageResult<ChargeRecordApi.ChargeRecord>>('/platform/charge-record/page', { params });
}

/** 查询开放平台计费记录详情 */
export function getChargeRecord(id: number) {
  return requestClient.get<ChargeRecordApi.ChargeRecord>(`/platform/charge-record/get/${id}`);
}

/** 新增开放平台计费记录 */
export function createChargeRecord(data: ChargeRecordApi.ChargeRecordRequest) {
  return requestClient.post('/platform/charge-record/create', data);
}

/** 删除开放平台计费记录 */
export function deleteChargeRecord(id: number) {
  return requestClient.delete(`/platform/charge-record/delete/${id}`);
}

/** 批量删除开放平台计费记录 */
export function deleteChargeRecordList(ids: number[]) {
  return requestClient.delete(`/platform/charge-record/delete-list?ids=${ids.join(',')}`)
}

/** 导出开放平台计费记录 */
export function exportChargeRecord(params: any) {
  return requestClient.download('/platform/charge-record/export-excel', { params });
}
