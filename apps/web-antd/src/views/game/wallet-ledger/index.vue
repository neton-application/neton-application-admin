<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { GameWalletLedgerApi } from '#/api/game/wallet-ledger';

import { Page } from '@vben/common-ui';

import { Alert, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getWalletLedgerPage,
  sourceTypeLabel,
  walletKindLabel,
} from '#/api/game/wallet-ledger';

/**
 * 钱包流水视图 (OPS-B/C 顶级菜单).
 *
 * 跟"资金流水"(game_ledger_entry, 牌局经济事实) 平行的 audit 流:
 *   任何 wallet balance 变化都有 1 行 (HAND_SETTLE / BUY_IN_FREEZE / CASH_OUT /
 *   TOPUP / DEDUCT / WITHDRAW / ADJUSTMENT / REFUND).
 *
 * 主要场景:
 *   - 玩家说"我钱少了" → filter user_id, 看本玩家钱包变化历史
 *   - 老板说"俱乐部余额对不上" → filter wallet_kind=3 + club_id
 *   - 平台看今日 topup 总量 → filter source_type=TOPUP + from/to
 */

const [Grid] = useVbenVxeGrid<GameWalletLedgerApi.LedgerRow>({
  formOptions: {
    schema: [
      {
        fieldName: 'wallet_kind',
        label: '钱包类型',
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: [
            { label: '俱乐部 (3)', value: 3 },
            { label: '代理 (4)', value: 4 },
            { label: '玩家 (5)', value: 5 },
          ],
        },
      },
      {
        fieldName: 'club_id',
        label: '俱乐部 ID',
        component: 'InputNumber',
        componentProps: { allowClear: true, min: 1 },
      },
      {
        fieldName: 'user_id',
        label: '玩家 user_id',
        component: 'InputNumber',
        componentProps: { allowClear: true, min: 1 },
      },
      {
        fieldName: 'agent_id',
        label: '代理 ID',
        component: 'InputNumber',
        componentProps: { allowClear: true, min: 1 },
      },
      {
        fieldName: 'source_type',
        label: '来源类型',
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: [
            { label: '牌局结算 HAND_SETTLE', value: 'HAND_SETTLE' },
            { label: '入桌冻结 BUY_IN_FREEZE', value: 'BUY_IN_FREEZE' },
            { label: '离桌兑出 CASH_OUT', value: 'CASH_OUT' },
            { label: '充值 TOPUP', value: 'TOPUP' },
            { label: '扣账 DEDUCT', value: 'DEDUCT' },
            { label: '提现 WITHDRAW', value: 'WITHDRAW' },
            { label: '人工调账 ADJUSTMENT', value: 'ADJUSTMENT' },
            { label: '退款 REFUND', value: 'REFUND' },
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
    ],
  },
  gridOptions: {
    columns: [
      { field: 'entry_id', title: 'ID', width: 80, fixed: 'left' },
      {
        field: 'wallet_kind',
        title: '钱包',
        width: 110,
        slots: { default: 'walletKindCell' },
      },
      {
        field: 'scope',
        title: '归属',
        minWidth: 200,
        slots: { default: 'scopeCell' },
      },
      { field: 'currency_type', title: '币种', width: 110 },
      {
        field: 'direction',
        title: '方向',
        width: 90,
        slots: { default: 'directionCell' },
      },
      { field: 'amount', title: '金额', width: 110 },
      { field: 'balance_before', title: '变前余额', width: 120 },
      { field: 'balance_after', title: '变后余额', width: 120 },
      {
        field: 'source_type',
        title: '来源',
        width: 150,
        slots: { default: 'sourceCell' },
      },
      { field: 'reason', title: '备注', minWidth: 200, showOverflow: 'tooltip' },
      { field: 'operator_user_id', title: '操作 admin', width: 120 },
      {
        field: 'created_at',
        title: '时间',
        width: 170,
        formatter: 'formatDateTime',
      },
    ],
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getWalletLedgerPage({
            page: page.currentPage,
            page_size: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'entry_id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<GameWalletLedgerApi.LedgerRow>,
} as any);

function scopeLabel(row: GameWalletLedgerApi.LedgerRow): string {
  if (row.wallet_kind === 3) return `club=${row.scope_club_id ?? '-'}`;
  if (row.wallet_kind === 4) return `agent=${row.scope_agent_id ?? '-'}`;
  if (row.wallet_kind === 5)
    return `club=${row.scope_club_id ?? '-'} user=${row.scope_user_id ?? '-'}`;
  if (row.wallet_kind === 2) return `alliance=${row.scope_alliance_id ?? '-'}`;
  return 'platform';
}
</script>

<template>
  <Page auto-content-height>
    <Alert
      type="info"
      message="钱包流水 = 钱包余额变化事实 audit. 跟'资金流水'(牌局经济事实) 平行存在: 任何 wallet balance 变化都在这里 1 行可追溯."
      show-icon
      class="mb-2"
    />
    <Grid table-title="钱包流水">
      <template #walletKindCell="{ row }">
        <Tag>{{ walletKindLabel(row.wallet_kind) }}</Tag>
      </template>
      <template #scopeCell="{ row }">
        {{ scopeLabel(row) }}
      </template>
      <template #directionCell="{ row }">
        <Tag :color="row.direction === 1 ? 'green' : 'red'">
          {{ row.direction === 1 ? 'CREDIT (入)' : 'DEBIT (出)' }}
        </Tag>
      </template>
      <template #sourceCell="{ row }">
        <Tag>{{ sourceTypeLabel(row.source_type) }}</Tag>
      </template>
    </Grid>
  </Page>
</template>
