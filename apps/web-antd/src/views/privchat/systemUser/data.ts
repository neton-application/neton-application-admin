import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

/** 系统用户列表搜索表单（user_type 固定为 1，由 page 调用方在 query 里 hardcode）。 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'search',
      label: '关键字',
      component: 'Input',
      componentProps: {
        placeholder: '用户 ID / username / display_name',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '正常', value: 0 },
          { label: '未激活', value: 1 },
          { label: '已封禁', value: 2 },
          { label: '已删除', value: 3 },
        ],
        allowClear: true,
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 系统用户列表列定义。 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'user_id', title: 'User ID', minWidth: 140 },
    {
      field: 'avatar_url',
      title: '头像',
      minWidth: 80,
      cellRender: { name: 'CellImage' },
    },
    { field: 'username', title: '用户名', minWidth: 140 },
    { field: 'display_name', title: '名称', minWidth: 140 },
    {
      field: 'status',
      title: '状态',
      minWidth: 90,
      slots: { default: 'statusCell' },
    },
    {
      field: 'created_at',
      title: '创建时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
