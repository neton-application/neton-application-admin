<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PayWalletFreezeApi } from '#/api/pay/wallet/freeze';

import { Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getFreezePage,
  releaseFreeze,
  sweepExpiredFreezes,
} from '#/api/pay/wallet/freeze';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function handleRefresh() {
  gridApi.query();
}

function handlePlace(mode: 'judicial' | 'risk') {
  formModalApi.setData({ mode }).open();
}

async function handleRelease(row: PayWalletFreezeApi.Freeze) {
  await releaseFreeze(row.id);
  message.success('已解除冻结，资金回到用户可用余额');
  handleRefresh();
}

/**
 * 巡检到期。
 *
 * 到期本身不需要点这个：过期的冻结在可用余额计算里当场失效。这里只是把状态、
 * 缓存和列表追上事实，所以晚点、忘了点都不会让用户的钱多冻一分钟。
 */
async function handleSweep() {
  const count = await sweepExpiredFreezes();
  message.success(`已巡检 ${count} 条到期冻结`);
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid<PayWalletFreezeApi.Freeze>({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getFreezePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<PayWalletFreezeApi.Freeze>,
} as any);
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <Grid table-title="冻结管理">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '单笔冻结',
              type: 'default',
              icon: ACTION_ICON.ADD,
              auth: ['pay:wallet-freeze:place'],
              onClick: handlePlace.bind(null, 'risk'),
            },
            {
              label: '账户冻结',
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.ADD,
              auth: ['pay:wallet-freeze:judicial'],
              onClick: handlePlace.bind(null, 'judicial'),
            },
            {
              label: '巡检到期',
              type: 'default',
              auth: ['pay:wallet-freeze:release'],
              onClick: handleSweep,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '解除冻结',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['pay:wallet-freeze:release'],
              // 提现冻结由提现状态机维护，两处都能解就会双写。
              ifShow: row.status === 0 && row.freezeType !== 1,
              popConfirm: {
                title: `确认解除 #${row.id} 的冻结？资金将回到用户可用余额`,
                confirm: handleRelease.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
