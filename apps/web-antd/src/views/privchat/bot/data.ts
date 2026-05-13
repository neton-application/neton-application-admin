import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

/** 机器人列表搜索表单。 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '停用', value: 0 },
        ],
        allowClear: true,
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'ownerUserId',
      label: '所属用户 ID',
      component: 'InputNumber',
      componentProps: {
        placeholder: '按所属用户 user_id 过滤',
        allowClear: true,
        precision: 0,
      },
    },
  ];
}

/** 机器人列表列定义。 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'id', title: 'Bot User ID', minWidth: 160 },
    {
      field: 'owner_user_id',
      title: '所属用户',
      minWidth: 160,
      slots: { default: 'ownerCell' },
    },
    {
      field: 'avatar_url',
      title: '头像',
      minWidth: 80,
      cellRender: { name: 'CellImage' },
    },
    { field: 'name', title: '昵称', minWidth: 140 },
    { field: 'username', title: '用户名', minWidth: 140 },
    {
      field: 'has_menu',
      title: '菜单',
      width: 80,
      slots: { default: 'menuCell' },
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
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
      width: 240,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
