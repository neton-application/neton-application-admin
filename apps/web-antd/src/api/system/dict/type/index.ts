import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemDictTypeApi {
  /** 字典类型 */
  export type DictType = {
    createTime?: Date | string;
    id?: number;
    name: string;
    remark?: string;
    status: number;
    type: string;
  };

  export type DictTypeRequest = {
    id?: number;
    name: string;
    remark?: string;
    status: number;
    type: string;
  };
}

// 查询字典（精简)列表
export function getSimpleDictTypeList() {
  return requestClient.get<SystemDictTypeApi.DictType[]>(
    '/system/dict-type/simple-list',
  );
}

// 查询字典列表
export function getDictTypePage(params: PageParam) {
  return requestClient.get<PageResult<SystemDictTypeApi.DictType>>(
    '/system/dict-type/page',
    { params },
  );
}

// 查询字典详情
export function getDictType(id: number) {
  return requestClient.get<SystemDictTypeApi.DictType>(
    `/system/dict-type/get/${id}`,
  );
}

// 新增字典
export function createDictType(data: SystemDictTypeApi.DictTypeRequest) {
  return requestClient.post('/system/dict-type/create', data);
}

// 修改字典
export function updateDictType(data: SystemDictTypeApi.DictTypeRequest) {
  return requestClient.put('/system/dict-type/update', data);
}

// 删除字典
export function deleteDictType(id: number) {
  return requestClient.delete(`/system/dict-type/delete/${id}`);
}

// 批量删除字典
export function deleteDictTypeList(ids: number[]) {
  return requestClient.delete(
    `/system/dict-type/delete-list?ids=${ids.join(',')}`,
  );
}

// 导出字典类型
export function exportDictType(params: any) {
  return requestClient.download('/system/dict-type/export-excel', { params });
}
