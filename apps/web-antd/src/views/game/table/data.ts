import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

/** 桌 state 整数 → 中文 label. 与 module-game model.GameTableState 对齐. */
export const TABLE_STATE_OPTIONS = [
  { label: 'OPEN', value: 0 },
  { label: 'PLAYING', value: 1 },
  { label: 'SETTLING', value: 2 },
  { label: 'CLOSED', value: 3 },
];

/** 桌列表搜索表单. */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'table_id',
      label: '桌 ID',
      component: 'InputNumber',
      componentProps: {
        placeholder: 'table_id 精确匹配',
        allowClear: true,
        min: 1,
      },
    },
    {
      fieldName: 'game_kind',
      label: '玩法',
      component: 'Select',
      componentProps: {
        options: [
          { label: 'Texas Holdem', value: 'texas_holdem' },
          { label: 'Echo (dev)', value: 'echo' },
        ],
        allowClear: true,
        placeholder: '请选择玩法',
      },
    },
    {
      fieldName: 'state',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: TABLE_STATE_OPTIONS,
        allowClear: true,
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'club_id',
      label: '俱乐部 ID',
      component: 'InputNumber',
      componentProps: { allowClear: true, min: 1 },
    },
    {
      fieldName: 'owner_user_id',
      label: '创建人 user_id',
      component: 'InputNumber',
      componentProps: { allowClear: true, min: 1 },
    },
  ];
}

/** 桌列表列定义. */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'table_id', title: '桌 ID', minWidth: 100 },
    { field: 'game_kind', title: '玩法', minWidth: 120 },
    {
      field: 'state',
      title: '状态',
      minWidth: 100,
      slots: { default: 'stateCell' },
    },
    {
      field: 'phase',
      title: 'Phase',
      minWidth: 110,
      slots: { default: 'phaseCell' },
    },
    {
      field: 'player_count',
      title: '玩家',
      minWidth: 90,
      slots: { default: 'playerCountCell' },
    },
    { field: 'pot', title: '池底', minWidth: 90 },
    { field: 'club_id', title: '俱乐部', minWidth: 100 },
    { field: 'owner_user_id', title: '创建人', minWidth: 120 },
    {
      field: 'created_at',
      title: '创建时间',
      minWidth: 160,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
