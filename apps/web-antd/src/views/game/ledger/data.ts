import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'room_id',
      label: '房间 ID',
      component: 'InputNumber',
      componentProps: { allowClear: true, min: 1 },
    },
    {
      fieldName: 'user_id',
      label: '用户 ID',
      component: 'InputNumber',
      componentProps: { allowClear: true, min: 1 },
    },
    {
      fieldName: 'club_id',
      label: '俱乐部 ID',
      component: 'InputNumber',
      componentProps: { allowClear: true, min: 1 },
    },
    {
      fieldName: 'game_kind',
      label: '玩法',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: 'e.g. texas_holdem' },
    },
    {
      fieldName: 'currency_type',
      label: '币种',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: 'club_credit', value: 'club_credit' },
          { label: 'chips_virtual (legacy)', value: 'chips_virtual' },
        ],
      },
    },
    {
      fieldName: 'reason',
      label: '类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: 'blind_sb', value: 'blind_sb' },
          { label: 'blind_bb', value: 'blind_bb' },
          { label: 'bet_call', value: 'bet_call' },
          { label: 'bet_raise', value: 'bet_raise' },
          { label: 'bet_all_in', value: 'bet_all_in' },
          { label: 'winner_pot', value: 'winner_pot' },
          { label: 'rake_take', value: 'rake_take' },
          { label: 'bet_refund', value: 'bet_refund' },
        ],
      },
    },
    {
      fieldName: 'from',
      label: '起始 (ms)',
      component: 'InputNumber',
      componentProps: { allowClear: true },
    },
    {
      fieldName: 'to',
      label: '截止 (ms)',
      component: 'InputNumber',
      componentProps: { allowClear: true },
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'table_id', title: 'Room ID', minWidth: 90 },
    { field: 'round_id', title: 'Round', minWidth: 80 },
    { field: 'user_id', title: '用户', minWidth: 130 },
    { field: 'currency_type', title: '币种', minWidth: 120 },
    { field: 'amount', title: '金额', minWidth: 100 },
    {
      field: 'direction',
      title: '方向',
      minWidth: 90,
      slots: { default: 'directionCell' },
    },
    { field: 'reason', title: '类型', minWidth: 130 },
    { field: 'club_id', title: '俱乐部', minWidth: 100 },
    { field: 'game_kind', title: '玩法', minWidth: 130 },
    {
      field: 'created_at',
      title: 'Created',
      minWidth: 170,
      formatter: 'formatDateTime',
    },
  ];
}
