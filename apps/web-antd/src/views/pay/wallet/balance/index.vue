<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PayWalletApi } from '#/api/pay/wallet/balance';

import { Page, useVbenModal } from '@vben/common-ui';

import { useRouter } from 'vue-router';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getWalletPage } from '#/api/pay/wallet/balance';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查看钱包 */
function handleDetail(row: Required<PayWalletApi.Wallet>) {
  detailModalApi.setData(row).open();
}

const router = useRouter();

/**
 * 跳到该用户的冻结记录。
 *
 * 「冻结金额」这一列能看到有多少钱被冻着，但看不到**是什么冻的**——归因只能去
 * 冻结记录里查（spec：freeze_price 是缓存，不许从这个数反推）。带上 userId 过去，
 * 运营不用手抄编号。
 */
function handleFreezes(row: Required<PayWalletApi.Wallet>) {
  router.push({ path: '/pay/wallet/freeze', query: { userId: row.userId } });
}

const [Grid, gridApi] = useVbenVxeGrid<PayWalletApi.Wallet>({
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
          return await getWalletPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<PayWalletApi.Wallet>,
} as any);
</script>

<template>
  <Page auto-content-height>
    <template #doc>
    </template>

    <DetailModal @reload="handleRefresh" />
    <Grid>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              onClick: handleDetail.bind(null, row),
            },
            {
              label: '冻结记录',
              type: 'link',
              auth: ['pay:wallet-freeze:list'],
              ifShow: row.freezePrice > 0,
              onClick: handleFreezes.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
