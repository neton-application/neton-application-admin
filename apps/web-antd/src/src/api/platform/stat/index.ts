import type { PageParam, PageResult } from '@vben/request';
import type { Dayjs } from 'dayjs';

import { requestClient } from '#/api/request';

export namespace StatApi {
    /** 开放平台统计信息 */
  export interface Stat {
            id: number; // 统计ID
            clientId?: string; // 客户端ID
            apiId: number; // API ID（为空表示客户端维度统计）
            statDate?: string | Dayjs; // 统计日期
            totalCount?: number; // 总调用次数
            successCount?: number; // 成功次数
            failedCount?: number; // 失败次数
            avgDurationMs?: number; // 平均耗时（毫秒）
            maxDurationMs?: number; // 最大耗时（毫秒）
            totalCharge?: number; // 总计费金额（分）
            freeCount?: number; // 免费调用次数
            chargedCount?: number; // 计费调用次数
      }
}

/** 查询开放平台统计分页 */
export function getStatPage(params: PageParam) {
  return requestClient.get<PageResult<StatApi.Stat>>('/platform/stat/page', { params });
}

/** 查询开放平台统计详情 */
export function getStat(id: number) {
  return requestClient.get<StatApi.Stat>(`/platform/stat/get?id=${id}`);
}

/** 新增开放平台统计 */
export function createStat(data: StatApi.Stat) {
  return requestClient.post('/platform/stat/create', data);
}

/** 修改开放平台统计 */
export function updateStat(data: StatApi.Stat) {
  return requestClient.put('/platform/stat/update', data);
}

/** 删除开放平台统计 */
export function deleteStat(id: number) {
  return requestClient.delete(`/platform/stat/delete?id=${id}`);
}

/** 批量删除开放平台统计 */
export function deleteStatList(ids: number[]) {
  return requestClient.delete(`/platform/stat/delete-list?ids=${ids.join(',')}`)
}

/** 导出开放平台统计 */
export function exportStat(params: any) {
  return requestClient.download('/platform/stat/export-excel', { params });
}