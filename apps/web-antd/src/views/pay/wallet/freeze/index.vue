<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PayWalletFreezeApi } from '#/api/pay/wallet/freeze';

import { onMounted } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';
import { useRoute } from 'vue-router';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getFreezePage,
  releaseFreeze,
  sweepExpiredFreezes,
} from '#/api/pay/wallet/freeze';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

const route = useRoute();

/**
 * 从钱包余额页「冻结记录」跳过来时带着 userId：把它填进搜索框再查一次。
 *
 * 只在 formOptions 里给初值是不够的——表单是异步建的，初值那会儿还没有它，
 * 结果就是地址栏带着 userId、搜索框却空着、列表还是全量，运营以为这个人有
 * 一堆冻结。填完必须自己触发一次查询。
 */
onMounted(async () => {
  const userId = route.query.userId;
  if (!userId) {
    return;
  }
  await gridApi.formApi.setValues({ userId: String(userId) });
  // 必须走「提交表单」而不是直接 query：query 读的是表单**提交后**的值，
  // setValues 只填了控件。只 query 的结果是搜索框显示着 userId、列表却还是全量，
  // 运营会以为这个人有一堆冻结记录。
  await gridApi.formApi.submitForm();
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

function handleDetail(row: PayWalletFreezeApi.Freeze) {
  detailModalApi.setData(row).open();
}

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
    <DetailModal />
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
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['pay:wallet-freeze:list'],
              onClick: handleDetail.bind(null, row),
            },
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
