<script setup lang="ts">
import type { PayWalletFreezeApi } from '#/api/pay/wallet/freeze';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Descriptions, DescriptionsItem } from 'ant-design-vue';

import { freezeStatusLabel, freezeTypeLabel } from '../data';

const freeze = ref<PayWalletFreezeApi.Freeze>();

/** null = 全额冻结（无上限），冻结额随余额浮动，没有一个固定数字可显示。 */
const amountText = (row: PayWalletFreezeApi.Freeze) =>
  row.amount == null ? '全额' : `¥${(row.amount / 100).toFixed(2)}`;

const statusText = (row: PayWalletFreezeApi.Freeze) =>
  row.status === 0 && row.expiresAt > 0 && row.expiresAt < Date.now()
    ? '已到期（待巡检）'
    : freezeStatusLabel(row.status);

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    freeze.value = modalApi.getData<PayWalletFreezeApi.Freeze>();
  },
});
</script>

<template>
  <Modal title="冻结详情" class="w-[50%]" :footer="false">
    <Descriptions v-if="freeze" bordered :column="1" size="small">
      <DescriptionsItem label="冻结编号">{{ freeze.id }}</DescriptionsItem>
      <DescriptionsItem label="用户编号">{{ freeze.userId }}</DescriptionsItem>
      <DescriptionsItem label="钱包编号">{{ freeze.walletId }}</DescriptionsItem>
      <DescriptionsItem label="冻结类型">
        {{ freezeTypeLabel(freeze.freezeType) }}
      </DescriptionsItem>
      <DescriptionsItem label="冻结金额">
        {{ amountText(freeze) }}
      </DescriptionsItem>
      <DescriptionsItem label="状态">{{ statusText(freeze) }}</DescriptionsItem>
      <!-- 账户冻结的 refId 是法律文书号，属于办案信息，只在后台可见，不下发给用户。 -->
      <DescriptionsItem label="关联/文书号">
        {{ freeze.refId || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="原因">
        {{ freeze.reasonText || freeze.reasonCode || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="经办人">
        {{ freeze.operatorId || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="到期时间">
        {{ freeze.expiresAt > 0 ? formatDateTime(freeze.expiresAt) : '无期限' }}
      </DescriptionsItem>
      <DescriptionsItem label="下达时间">
        {{ formatDateTime(freeze.createdAt) }}
      </DescriptionsItem>
      <DescriptionsItem label="结束时间">
        {{ freeze.releasedAt > 0 ? formatDateTime(freeze.releasedAt) : '-' }}
      </DescriptionsItem>
    </Descriptions>
  </Modal>
</template>
