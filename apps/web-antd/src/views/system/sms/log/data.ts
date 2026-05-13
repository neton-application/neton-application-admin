import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { getSimpleSmsChannelList } from '#/api/system/sms/channel';
import { DictTag } from '#/components/dict-tag';

/** 列表的搜索表单。后端 SmsLogController 仅接受
 *  channelId / templateCode / receiver / sendStatus 四个查询参数，
 *  不要在前端加它没实现的过滤项（mobile 必须叫 receiver）。 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'receiver',
      label: '手机号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入手机号',
      },
    },
    {
      fieldName: 'channelId',
      label: '短信渠道',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleSmsChannelList,
        labelField: 'signature',
        valueField: 'id',
        allowClear: true,
        placeholder: '请选择短信渠道',
      },
    },
    {
      fieldName: 'templateCode',
      label: '模板编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入模板编码',
      },
    },
    {
      fieldName: 'sendStatus',
      label: '发送状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_SMS_SEND_STATUS, 'number'),
        allowClear: true,
        placeholder: '请选择发送状态',
      },
    },
  ];
}

/** 列表的字段。字段名严格对齐后端 MessageLogVO：
 *  receiver / content / sendStatus / sendTime / createdAt。 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      minWidth: 100,
    },
    {
      field: 'receiver',
      title: '手机号',
      minWidth: 140,
    },
    {
      field: 'content',
      title: '短信内容',
      minWidth: 300,
    },
    {
      field: 'sendStatus',
      title: '发送状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_SMS_SEND_STATUS },
      },
    },
    {
      field: 'sendTime',
      title: '发送时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'channelId',
      title: '短信渠道',
      minWidth: 100,
    },
    {
      field: 'templateCode',
      title: '模板编码',
      minWidth: 220,
    },
    {
      field: 'createdAt',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 详情页的字段。仅展示后端 MessageLogVO 真正返回的字段；
 *  yudao 模板里的 apiSendCode / apiReceiveMsg / receiveStatus 等
 *  后端不写、不返回，删掉它们避免出现一堆永远空着的 description 项。 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'createdAt',
      label: '创建时间',
      render: (val) => formatDateTime(val) as string,
    },
    {
      field: 'receiver',
      label: '手机号',
    },
    {
      field: 'channelId',
      label: '短信渠道',
    },
    {
      field: 'templateId',
      label: '模板编号',
    },
    {
      field: 'templateCode',
      label: '模板编码',
    },
    {
      field: 'content',
      label: '短信内容',
      span: 2,
    },
    {
      field: 'params',
      label: '发送参数',
      span: 2,
    },
    {
      field: 'sendStatus',
      label: '发送状态',
      render: (val) => {
        return h(DictTag, {
          type: DICT_TYPE.SYSTEM_SMS_SEND_STATUS,
          value: val,
        });
      },
    },
    {
      field: 'sendTime',
      label: '发送时间',
      render: (val) => formatDateTime(val) as string,
    },
    {
      field: 'errorMessage',
      label: '失败原因',
      span: 2,
    },
    {
      field: 'userId',
      label: '用户编号',
    },
    {
      field: 'userType',
      label: '用户类型',
    },
  ];
}
