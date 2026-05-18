import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'table_id',
      label: '桌 ID',
      component: 'InputNumber',
      componentProps: { allowClear: true, min: 1 },
    },
    {
      fieldName: 'user_id',
      label: '操作 user_id',
      component: 'InputNumber',
      componentProps: { allowClear: true, min: 1 },
    },
    {
      fieldName: 'event_type',
      label: 'Event Type',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: 'e.g. game.table.force_closed',
      },
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
    { field: 'id', title: 'ID', minWidth: 80 },
    {
      field: 'scope_type',
      title: 'Scope',
      minWidth: 180,
      slots: { default: 'scopeCell' },
    },
    { field: 'user_id', title: '操作用户', minWidth: 130 },
    { field: 'event_type', title: 'Event Type', minWidth: 230 },
    {
      field: 'payload_json',
      title: 'Payload',
      minWidth: 320,
      showOverflow: 'tooltip',
    },
    {
      field: 'created_at',
      title: 'Created',
      minWidth: 170,
      formatter: 'formatDateTime',
    },
  ];
}
