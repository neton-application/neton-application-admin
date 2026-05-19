<script lang="ts" setup>
import type { GameAgentApi } from '#/api/game/agent';
import type { GameWalletApi } from '#/api/game/wallet';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Empty,
  Modal,
  Space,
  Statistic,
  Table,
  Tabs,
  TabPane,
  Tag,
  Typography,
} from 'ant-design-vue';

import {
  getAgentClubs,
  getAgentDetail,
  unbindClubFromAgent,
} from '#/api/game/agent';
import { getAgentWallet } from '#/api/game/wallet';

const route = useRoute();
const router = useRouter();

const agentId = computed(() => Number(route.query.agentId ?? 0));

const detailLoading = ref(false);
const detail = ref<GameAgentApi.AgentRow | null>(null);

const clubsLoading = ref(false);
const clubs = ref<GameAgentApi.ClubAgentBinding[]>([]);

const walletLoading = ref(false);
const wallet = ref<GameWalletApi.AgentWallet | null>(null);

async function loadDetail() {
  if (!agentId.value) return;
  detailLoading.value = true;
  try {
    detail.value = await getAgentDetail(agentId.value);
  } finally {
    detailLoading.value = false;
  }
}

async function loadClubs() {
  if (!agentId.value) return;
  clubsLoading.value = true;
  try {
    clubs.value = await getAgentClubs(agentId.value);
  } finally {
    clubsLoading.value = false;
  }
}

async function loadWallet() {
  if (!agentId.value) return;
  walletLoading.value = true;
  try {
    wallet.value = await getAgentWallet(agentId.value);
  } finally {
    walletLoading.value = false;
  }
}

async function handleUnbindClub(b: GameAgentApi.ClubAgentBinding) {
  Modal.confirm({
    title: `解绑俱乐部 ${b.club_id}?`,
    content: '解绑后该 club 的新一手抽水不再走此代理. 历史 ledger 不动.',
    okType: 'danger',
    onOk: async () => {
      await unbindClubFromAgent(b.club_id);
      await loadClubs();
    },
  });
}

function handleTab(key: number | string) {
  if (key === 'clubs' && clubs.value.length === 0) loadClubs();
  if (key === 'wallet' && !wallet.value) loadWallet();
}

function statusTag(s: number) {
  if (s === 1) return { color: 'green', text: 'ACTIVE' };
  if (s === 0) return { color: 'default', text: 'DISABLED' };
  return { color: 'default', text: `${s}` };
}

function levelTag(level: number) {
  if (level === 1) return { color: 'gold', text: '总代理' };
  if (level === 2) return { color: 'blue', text: '一级代理' };
  if (level === 3) return { color: 'cyan', text: '二级代理' };
  return { color: 'default', text: `${level} 级` };
}

watch(agentId, (v, old) => {
  if (v && v !== old) {
    detail.value = null;
    clubs.value = [];
    wallet.value = null;
    loadDetail();
  }
});

onMounted(loadDetail);
</script>

<template>
  <Page auto-content-height>
    <div class="mb-4 flex justify-between">
      <Space>
        <Button @click="router.push({ path: '/game/agent' })">返回代理列表</Button>
        <Button type="primary" :loading="detailLoading" @click="loadDetail">
          刷新
        </Button>
      </Space>
    </div>

    <Empty v-if="!detailLoading && !detail" description="代理不存在或无权限" />

    <Tabs v-if="detail" default-active-key="overview" type="card" @change="handleTab">
      <TabPane key="overview" tab="概览">
        <Card>
          <Descriptions :column="2" bordered size="small">
            <DescriptionsItem label="Agent ID">{{ detail.agent_id }}</DescriptionsItem>
            <DescriptionsItem label="Display">{{ detail.display_name }}</DescriptionsItem>
            <DescriptionsItem label="层级">
              <Tag :color="levelTag(detail.level).color">
                {{ levelTag(detail.level).text }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="上级 Agent">
              {{ detail.parent_agent_id ?? '(直挂平台)' }}
            </DescriptionsItem>
            <DescriptionsItem label="User ID">{{ detail.user_id }}</DescriptionsItem>
            <DescriptionsItem label="状态">
              <Tag :color="statusTag(detail.status).color">
                {{ statusTag(detail.status).text }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="创建时间">
              {{ detail.created_at ? formatDateTime(detail.created_at) : '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="更新时间">
              {{ detail.updated_at ? formatDateTime(detail.updated_at) : '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="联系信息" :span="2">
              {{ detail.contact_info ?? '(空)' }}
            </DescriptionsItem>
          </Descriptions>
        </Card>
      </TabPane>

      <!-- Clubs -->
      <TabPane key="clubs" tab="下挂俱乐部">
        <Card>
          <Alert
            v-if="clubs.length === 0 && !clubsLoading"
            type="info"
            message="该代理还没有下挂任何俱乐部. 通过 POST /admin/game/agents/bind-club 或在俱乐部详情页绑定."
            show-icon
            class="mb-2"
          />
          <Table
            :data-source="clubs"
            :loading="clubsLoading"
            :pagination="false"
            row-key="club_id"
            size="small"
            :columns="[
              { title: 'Club ID', dataIndex: 'club_id', width: 120 },
              {
                title: '绑定时间',
                dataIndex: 'bound_at',
                width: 200,
                customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
              },
              { title: '操作', key: 'action', width: 160 },
            ]"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <Space>
                  <Button
                    size="small"
                    type="link"
                    @click="router.push({
                      name: 'GameClubDetail',
                      query: { clubId: String(record.club_id) },
                    })"
                  >
                    俱乐部详情
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    danger
                    @click="handleUnbindClub(record as GameAgentApi.ClubAgentBinding)"
                  >
                    解绑
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
        </Card>
      </TabPane>

      <!-- Wallet -->
      <TabPane key="wallet" tab="代理钱包 / 利润">
        <Alert
          type="info"
          message="代理钱包 = 实时分账入账聚合. 真实提现走 v1.1+ payment 模块 (freeze→release/unfreeze 三态)."
          show-icon
          class="mb-4"
        />
        <div v-if="wallet" class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card title="可用余额">
            <Statistic
              :value="wallet.available_balance"
              :value-style="{
                color: wallet.available_balance >= 0 ? '#3f8600' : '#cf1322',
              }"
            />
            <Typography.Text type="secondary" class="mt-2 block text-xs">
              {{ wallet.currency_type }}
            </Typography.Text>
          </Card>
          <Card title="历史累计入账">
            <Statistic title="Rake 分成" :value="wallet.total_rake_received" />
            <Statistic
              title="历史出账"
              :value="wallet.total_paid_out"
              class="mt-2"
              :value-style="{ color: '#cf1322' }"
            />
          </Card>
          <Card title="版本 / 时间">
            <Statistic title="version (CAS)" :value="wallet.version" />
            <Typography.Text type="secondary" class="mt-2 block text-xs">
              更新于:
              {{ wallet.updated_at ? formatDateTime(wallet.updated_at) : '-' }}
            </Typography.Text>
          </Card>
        </div>
        <Card v-else>
          <Empty v-if="!walletLoading" description="点击刷新加载钱包" />
        </Card>
      </TabPane>
    </Tabs>
  </Page>
</template>
