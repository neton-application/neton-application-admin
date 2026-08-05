<script setup lang="ts">
import type { PayBankCardApi } from '#/api/pay/wallet/bank-card';
import type { PayWalletApi } from '#/api/pay/wallet/balance';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Empty,
  message,
  Popconfirm,
  Spin,
  Table,
  Tag,
} from 'ant-design-vue';

import { getUserBankCards, revealBankCardNo } from '#/api/pay/wallet/bank-card';

const userId = ref<number>();
const loading = ref(false);
const cards = ref<PayBankCardApi.BankCard[]>([]);

/**
 * 已解密的完整卡号，按卡 id 存。
 *
 * 只在本次弹窗内存在：关掉就没了，下次要看得再解一次、再写一条审计。
 * 这是故意的——「谁在什么时候看了哪张卡」必须能从审计表还原出来。
 */
const revealed = ref<Record<number, string>>({});
const revealing = ref<null | number>(null);

const columns = [
  { title: '持卡人', dataIndex: 'holderName', width: 110 },
  { title: '开户行', dataIndex: 'bankName', width: 160 },
  { title: '卡号', dataIndex: 'cardNoMasked' },
  { title: '状态', dataIndex: 'status', width: 90 },
  { title: '绑定时间', dataIndex: 'createdAt', width: 180 },
  { title: '操作', dataIndex: 'actions', width: 120 },
];

async function handleReveal(row: PayBankCardApi.BankCard) {
  revealing.value = row.id;
  try {
    revealed.value = { ...revealed.value, [row.id]: await revealBankCardNo(row.id) };
    message.success('已解密，本次操作已记入敏感操作审计');
  } finally {
    revealing.value = null;
  }
}

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      // 关窗即丢明文，不留在内存里等下次打开复用。
      revealed.value = {};
      return;
    }
    const wallet = modalApi.getData<PayWalletApi.Wallet>();
    userId.value = wallet.userId;
    loading.value = true;
    try {
      cards.value = await getUserBankCards(wallet.userId);
    } finally {
      loading.value = false;
    }
  },
});
</script>

<template>
  <Modal
    :title="`银行卡（用户 ${userId ?? '-'}）`"
    class="w-[55%]"
    :footer="false"
  >
    <Spin :spinning="loading">
      <Empty v-if="!loading && cards.length === 0" description="该用户未绑定银行卡" />
      <Table
        v-else
        :columns="columns"
        :data-source="cards"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'cardNoMasked'">
            <!-- 解密过就显示明文，否则始终是掩码：列表接口本身永远不返回完整卡号。 -->
            <span :class="revealed[record.id] ? 'font-mono' : ''">
              {{ revealed[record.id] ?? record.cardNoMasked }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <Tag :color="record.status === 0 ? 'green' : 'default'">
              {{ record.status === 0 ? '正常' : '停用' }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'createdAt'">
            {{ record.createdAt ? formatDateTime(record.createdAt) : '-' }}
          </template>
          <template v-else-if="column.dataIndex === 'actions'">
            <Popconfirm
              v-if="!revealed[record.id]"
              title="解密完整卡号？该操作会记入敏感操作审计（经办人 / IP / 时间）"
              @confirm="handleReveal(record as PayBankCardApi.BankCard)"
            >
              <Button
                v-access:code="['pay:bank-card:reveal']"
                type="link"
                size="small"
                :loading="revealing === record.id"
              >
                查看完整卡号
              </Button>
            </Popconfirm>
          </template>
        </template>
      </Table>
    </Spin>
  </Modal>
</template>
