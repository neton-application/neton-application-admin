import type { PageParam, PageResult } from '@vben/request';
import type { Dayjs } from 'dayjs';

import { requestClient } from '#/api/request';

export namespace ChargeRecordApi {
    /** 开放平台计费记录信息 */
  export interface ChargeRecord {
            id: number; // 计费ID
            clientId?: string; // 客户端ID
            apiId?: number; // API ID
            traceId?: string; // 请求跟踪ID（关联日志）
            chargeType?: number; // 计费类型
            price?: number; // 本次计费金额（分）
            isCustomPrice?: boolean; // 是否使用自定义价格
            balanceBefore?: number; // 扣费前余额（分）
            balanceAfter?: number; // 扣费后余额（分）
            chargeStatus?: number; // 是否扣费成功
            failureReason: string; // 失败原因
            chargeTime?: string | Dayjs; // 扣费时间
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
export function createChargeRecord(data: ChargeRecordApi.ChargeRecord) {
  return requestClient.post('/platform/charge-record/create', data);
}

/** 修改开放平台计费记录 */
export function updateChargeRecord(data: ChargeRecordApi.ChargeRecord) {
  return requestClient.put('/platform/charge-record/update', data);
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