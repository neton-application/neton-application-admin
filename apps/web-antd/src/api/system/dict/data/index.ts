import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemDictDataApi {
  /** 字典数据 */
  export type DictData = {
    createTime?: Date | string;
    dictType: string;
    id?: number;
    label: string;
    remark?: string;
    sort?: number;
    status: number;
    value: string;
  };

  export type DictDataRequest = {
    id?: number;
    dictType: string;
    label: string;
    remark?: string;
    sort?: number;
    status: number;
    value: string;
  };
}

// 查询字典数据（精简)列表
export function getSimpleDictDataList() {
  return requestClient.get<SystemDictDataApi.DictData[]>(
    '/system/dict-data/simple-list',
  );
}

// 查询字典数据列表
export function getDictDataPage(params: PageParam) {
  return requestClient.get<PageResult<SystemDictDataApi.DictData>>(
    '/system/dict-data/page',
    { params },
  );
}

// 查询字典数据详情
export function getDictData(id: number) {
  return requestClient.get<SystemDictDataApi.DictData>(
    `/system/dict-data/get/${id}`,
  );
}

// 新增字典数据
export function createDictData(data: SystemDictDataApi.DictDataRequest) {
  return requestClient.post('/system/dict-data/create', data);
}

// 修改字典数据
export function updateDictData(data: SystemDictDataApi.DictDataRequest) {
  return requestClient.put('/system/dict-data/update', data);
}

// 删除字典数据
export function deleteDictData(id: number) {
  return requestClient.delete(`/system/dict-data/delete/${id}`);
}

// 批量删除字典数据
export function deleteDictDataList(ids: number[]) {
  return requestClient.delete(
    `/system/dict-data/delete-list?ids=${ids.join(',')}`,
  );
}

// 导出字典类型数据
export function exportDictData(params: any) {
  return requestClient.download('/system/dict-data/export-excel', { params });
}
