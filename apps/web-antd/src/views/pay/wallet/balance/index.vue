<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PayWalletApi } from '#/api/pay/wallet/balance';

import { Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button } from 'ant-design-vue';
import { useRouter } from 'vue-router';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getWalletPage } from '#/api/pay/wallet/balance';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import FreezeForm from '../freeze/modules/form.vue';
import BankCards from './modules/bank-cards.vue';
import Detail from './modules/detail.vue';

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

const [BankCardsModal, bankCardsModalApi] = useVbenModal({
  connectedComponent: BankCards,
  destroyOnClose: true,
});

/** 查该用户绑定的银行卡（掩码；完整卡号在弹窗里单独解密 + 审计）。 */
function handleBankCards(row: Required<PayWalletApi.Wallet>) {
  bankCardsModalApi.setData(row).open();
}

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查看钱包 */
function handleDetail(row: Required<PayWalletApi.Wallet>) {
  detailModalApi.setData(row).open();
}

const [FreezeFormModal, freezeFormModalApi] = useVbenModal({
  connectedComponent: FreezeForm,
  destroyOnClose: true,
});

/**
 * 从钱包这一行直接冻结这个账户，并把 userId 带进表单。
 *
 * 运营已经在看这一行了，再让他手抄一遍用户编号只会抄错，而抄错一位就是冻错人的钱。
 */
function handleFreezeAccount(row: Required<PayWalletApi.Wallet>) {
  freezeFormModalApi.setData({ mode: 'judicial', userId: row.userId }).open();
}

/** 单笔风控冻结：冻住一笔可疑的钱，不动整个账户。 */
function handleRiskHold(row: Required<PayWalletApi.Wallet>) {
  freezeFormModalApi.setData({ mode: 'risk', userId: row.userId }).open();
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
    <BankCardsModal />
    <FreezeFormModal @success="handleRefresh" />
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
          ]"
          :drop-down-actions="[
            {
              label: '查看银行卡',
              auth: ['pay:bank-card:list'],
              onClick: handleBankCards.bind(null, row),
            },
            {
              label: '单笔冻结',
              auth: ['pay:wallet-freeze:place'],
              onClick: handleRiskHold.bind(null, row),
            },
            {
              label: '冻结账户',
              auth: ['pay:wallet-freeze:judicial'],
              onClick: handleFreezeAccount.bind(null, row),
            },
            {
              label: '冻结记录',
              auth: ['pay:wallet-freeze:list'],
              // 没冻过的账户点进去只会看到一张空表，白跑一趟。
              ifShow: row.freezePrice > 0,
              onClick: handleFreezes.bind(null, row),
            },
          ]"
        >
          <template #more>
            <Button type="link">
              操作
              <IconifyIcon icon="lucide:chevron-down" />
            </Button>
          </template>
        </TableAction>
      </template>
    </Grid>
  </Page>
</template>
