import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { formatDateTime } from '@vben/utils';

/** 1=提现冻结 2=单笔风控 3=账户冻结（司法） */
export const FREEZE_TYPES = [
  { label: '提现冻结', value: 1 },
  { label: '单笔风控', value: 2 },
  { label: '账户冻结', value: 3 },
];

/**
 * 三种终态含义不同，不许合并成一个「已解冻」：
 * 已解除 = 钱回到可用余额；已扣除 = 钱离开了账户（提现打款）；已到期 = 期限到了。
 */
export const FREEZE_STATUSES = [
  { label: '冻结中', value: 0 },
  { label: '已解除', value: 1 },
  { label: '已扣除', value: 2 },
  { label: '已到期', value: 3 },
];

const labelOf = (options: { label: string; value: number }[], value: number) =>
  options.find((item) => item.value === value)?.label ?? String(value);

export const freezeTypeLabel = (value: number) => labelOf(FREEZE_TYPES, value);
export const freezeStatusLabel = (value: number) =>
  labelOf(FREEZE_STATUSES, value);

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户编号',
      component: 'Input',
      componentProps: { placeholder: '请输入用户编号', allowClear: true },
    },
    {
      fieldName: 'freezeType',
      label: '冻结类型',
      component: 'Select',
      componentProps: {
        options: FREEZE_TYPES,
        placeholder: '请选择冻结类型',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: FREEZE_STATUSES,
        placeholder: '请选择状态',
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { title: '编号', field: 'id', minWidth: 90 },
    { title: '用户编号', field: 'userId', minWidth: 120 },
    {
      title: '冻结类型',
      field: 'freezeType',
      minWidth: 110,
      formatter: ({ cellValue }) => freezeTypeLabel(cellValue),
    },
    {
      title: '冻结金额',
      field: 'amount',
      minWidth: 120,
      // null = 全额司法冻结，冻结额随余额浮动，没有一个固定数字可显示。
      formatter: ({ cellValue }) =>
        cellValue == null ? '全额' : `¥${(cellValue / 100).toFixed(2)}`,
    },
    {
      title: '状态',
      field: 'status',
      minWidth: 110,
      formatter: ({ cellValue, row }) =>
        row.status === 0 && row.expiresAt > 0 && row.expiresAt < Date.now()
          ? '已到期（待巡检）'
          : freezeStatusLabel(cellValue),
    },
    { title: '关联/文书号', field: 'refId', minWidth: 160 },
    {
      title: '到期',
      field: 'expiresAt',
      minWidth: 180,
      // 0 = 无期限。有值时走和「下达时间」同一个格式化器，否则两列一个
      // `2026-08-04 04:54:04`、一个 `8/4/2026, 4:32:54 AM`，同一行里读起来像两种数据。
      formatter: ({ cellValue }) =>
        cellValue > 0 ? formatDateTime(cellValue) : '无期限',
    },
    {
      title: '下达时间',
      field: 'createdAt',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      field: 'actions',
      width: 100,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 单笔风控冻结表单 */
export function useRiskHoldFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户编号',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'amount',
      label: '冻结金额',
      component: 'InputNumber',
      componentProps: { min: 0.01, precision: 2, addonAfter: '元' },
      rules: 'required',
    },
    {
      fieldName: 'refId',
      label: '业务单号',
      component: 'Input',
      componentProps: { placeholder: '选填：触发冻结的账变流水 id 或工单号' },
      help: '填了就是幂等键，同一个单号重复下达不会重复冻结；留空则每次提交都是一条新记录',
    },
    {
      fieldName: 'reasonText',
      label: '冻结原因',
      component: 'Textarea',
      componentProps: { rows: 2, placeholder: '会显示给用户，请用对方看得懂的话' },
      help: '⚠️ 用户在 App 的冻结详情里能看到这段话',
    },
  ];
}

/** 账户冻结（司法）表单 */
export function useJudicialFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户编号',
      component: 'Input',
      rules: 'required',
    },
    // 目标冻结额已去掉：账户冻结的语义就是「冻住整个账户」，后续到账继续吸收。
    // 服务端仍支持定额（targetAmount），但那不是这个入口该暴露的选择——
    // 留一个可填可不填的金额框，只会让运营以为「不填=不冻」。
    {
      fieldName: 'legalDocNo',
      label: '法律文书号',
      component: 'Input',
      help: '选填。填了就是幂等键，并会作为「关联单号」显示给用户；紧急处置可先冻结、文书后补',
    },
    {
      fieldName: 'confirmDocNo',
      label: '确认文书号',
      component: 'Input',
      // 二次确认绑在文书号上而不是一个复选框：要求经办人再核对一遍写的是哪份文书。
      // 文书号留空时无需确认——没有东西可核对。
      help: '填了文书号才需要再输一次，两次必须一致',
    },
    {
      fieldName: 'expiresAt',
      label: '到期时间',
      component: 'DatePicker',
      componentProps: { showTime: true, valueFormat: 'x', class: 'w-full' },
      help: '留空 = 无期限。到期后冻结立即失效，不需要等巡检',
    },
    {
      fieldName: 'reasonText',
      label: '冻结说明',
      component: 'Textarea',
      componentProps: { rows: 2, placeholder: '会显示给用户，请用对方看得懂的话' },
      help: '⚠️ 用户在 App 的冻结详情里能看到这段话，不要写办案细节',
    },
  ];
}
