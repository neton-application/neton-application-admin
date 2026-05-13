import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

/** IM 用户列表搜索表单。 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'search',
      label: '关键字',
      component: 'Input',
      componentProps: {
        placeholder: '用户 ID / username / phone / email',
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
    {
      fieldName: 'userType',
      label: '类型',
      component: 'Select',
      componentProps: {
        options: [
          { label: '普通', value: 0 },
          { label: '系统', value: 1 },
          { label: '机器人', value: 2 },
        ],
        allowClear: true,
        placeholder: '请选择类型',
      },
    },
  ];
}

/** IM 用户列表列定义。 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'user_id', title: '用户 ID', minWidth: 140 },
    {
      field: 'avatar_url',
      title: '头像',
      minWidth: 80,
      cellRender: { name: 'CellImage' },
    },
    { field: 'username', title: '用户名', minWidth: 140 },
    { field: 'display_name', title: '昵称', minWidth: 120 },
    { field: 'phone', title: '手机号', minWidth: 120 },
    { field: 'email', title: '邮箱', minWidth: 160 },
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
