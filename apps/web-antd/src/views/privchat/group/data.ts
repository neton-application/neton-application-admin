import type { VxeTableGridOptions } from '#/adapter/vxe-table';

/** 群组列表列定义。 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'group_id', title: '群 ID', minWidth: 100 },
    { field: 'name', title: '群名', minWidth: 160 },
    { field: 'description', title: '描述', minWidth: 200 },
    { field: 'owner_id', title: '群主 (uid)', minWidth: 140 },
    { field: 'member_count', title: '成员数', minWidth: 90 },
    { field: 'message_count', title: '消息数', minWidth: 90 },
    {
      field: 'last_message_at',
      title: '最后消息',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      field: 'created_at',
      title: '创建时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
