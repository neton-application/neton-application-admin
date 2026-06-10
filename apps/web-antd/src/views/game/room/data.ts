import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

/**
 * Room state 整数 → 中文 label. 与 module-game model.GameRoomStatus 对齐.
 * ROOM-MATCH-4: 命名从 table 收敛到 room.
 */
export const ROOM_STATE_OPTIONS = [
  { label: 'WAITING', value: 0 },
  { label: 'PLAYING', value: 1 },
  { label: 'PAUSED', value: 2 },
  { label: 'CLOSED', value: 3 },
  { label: 'CANCELLED', value: 4 },
  { label: 'IDLE', value: 5 },
];

/** 房间列表搜索表单. */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'room_id',
      label: '房间 ID',
      component: 'InputNumber',
      componentProps: {
        placeholder: 'room_id 精确匹配',
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
        options: ROOM_STATE_OPTIONS,
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

/** 房间列表列定义. */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'room_id', title: '房间 ID', minWidth: 100 },
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
