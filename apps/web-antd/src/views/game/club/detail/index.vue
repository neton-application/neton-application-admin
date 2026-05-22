<script lang="ts" setup>
import type { GameAgentApi } from '#/api/game/agent';
import type { GameClubApi } from '#/api/game/club';
import type { GameTableApi } from '#/api/game/table';
import type { GameLedgerApi } from '#/api/game/ledger';
import type { GameAuditApi } from '#/api/game/audit';
import type { GameWalletApi } from '#/api/game/wallet';

import { computed, onMounted, reactive, ref, watch } from 'vue';
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
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Statistic,
  Table,
  Tabs,
  TabPane,
  Tag,
  Typography,
} from 'ant-design-vue';

import { bindClubToAgent, getAgentDetail } from '#/api/game/agent';
import {
  getClubDetail,
  getClubMembers,
  getClubRevenueSummary,
} from '#/api/game/club';
import { getTablePage } from '#/api/game/table';
import { getLedgerPage } from '#/api/game/ledger';
import { getAuditPage } from '#/api/game/audit';
import {
  deductMemberWallet,
  getClubMemberWallets,
  getClubWallet,
  topupMemberWallet,
} from '#/api/game/wallet';

/**
 * 俱乐部详情页 (P-club-game-center) — 俱乐部老板视角入口.
 *
 * 5 Tabs (与 spec doc 一致):
 *   - Overview: 基本信息 + member/table 统计 + 创建/更新时间
 *   - Members:  成员列表 (含 owner/admin/member 角色)
 *   - Tables:   本 club 桌列表 (复用 getTablePage + club_id filter)
 *   - Game Records: 本 club 游戏日志 (audit; 默认 club_id + scope_type='game_table' 走 JOIN)
 *   - Ledger:   本 club 资金流水 (复用 getLedgerPage + club_id filter)
 *   - Revenue:  抽水统计 (read-only summary; 真实分账见 GAME_REVENUE_SHARE_SPEC v1.1+)
 *
 * 跳转规则:
 *   - Tables 行 → 牌桌详情 (GameTableDetail) 同款入口
 *   - 顶级菜单 (游戏日志 / 资金流水) 是跨 club 平台超管视角, 与此并列共存
 */

const route = useRoute();
const router = useRouter();

const clubId = computed(() => Number(route.query.clubId ?? 0));

const detailLoading = ref(false);
const detail = ref<GameClubApi.ClubDetail | null>(null);

const membersLoading = ref(false);
const members = ref<GameClubApi.ClubMember[]>([]);

const tablesLoading = ref(false);
const tables = ref<GameTableApi.TableListItem[]>([]);
const tablesPage = ref({ current: 1, pageSize: 20, total: 0 });

const auditLoading = ref(false);
const auditRows = ref<GameAuditApi.Event[]>([]);
const auditPage = ref({ current: 1, pageSize: 20, total: 0 });

const ledgerLoading = ref(false);
const ledgerRows = ref<GameLedgerApi.Entry[]>([]);
const ledgerPage = ref({ current: 1, pageSize: 20, total: 0 });

const revenueLoading = ref(false);
const revenue = ref<GameClubApi.RevenueSummary | null>(null);

// P-revenue-runtime: 钱包 + 代理绑定
const walletLoading = ref(false);
const clubWallet = ref<GameWalletApi.ClubWallet | null>(null);
const memberWallets = ref<GameWalletApi.MemberWallet[]>([]);
const bindAgentOpen = ref(false);
const bindForm = reactive({ agent_id: 0 });
const bindAgentDetail = ref<GameAgentApi.AgentRow | null>(null);

// OPS-B: topup / deduct modal
const adjustOpen = ref(false);
const adjustMode = ref<'deduct' | 'topup'>('topup');
const adjustTargetUserId = ref(0);
const adjustForm = reactive({ amount: 0, reason: '', remark: '' });

async function loadDetail() {
  if (!clubId.value) return;
  detailLoading.value = true;
  try {
    detail.value = await getClubDetail(clubId.value);
  } finally {
    detailLoading.value = false;
  }
}

async function loadMembers() {
  if (!clubId.value) return;
  membersLoading.value = true;
  try {
    members.value = await getClubMembers(clubId.value);
  } finally {
    membersLoading.value = false;
  }
}

async function loadTables(page = 1) {
  if (!clubId.value) return;
  tablesLoading.value = true;
  try {
    const data = await getTablePage({
      page,
      page_size: tablesPage.value.pageSize,
      club_id: clubId.value,
    });
    tables.value = data.list;
    tablesPage.value = { ...tablesPage.value, current: page, total: data.total };
  } finally {
    tablesLoading.value = false;
  }
}

async function loadAudit(page = 1) {
  if (!clubId.value) return;
  auditLoading.value = true;
  try {
    const data = await getAuditPage({
      page,
      page_size: auditPage.value.pageSize,
      club_id: clubId.value,
    });
    auditRows.value = data.list;
    auditPage.value = { ...auditPage.value, current: page, total: data.total };
  } finally {
    auditLoading.value = false;
  }
}

async function loadLedger(page = 1) {
  if (!clubId.value) return;
  ledgerLoading.value = true;
  try {
    const data = await getLedgerPage({
      page,
      page_size: ledgerPage.value.pageSize,
      club_id: clubId.value,
    });
    ledgerRows.value = data.list;
    ledgerPage.value = { ...ledgerPage.value, current: page, total: data.total };
  } finally {
    ledgerLoading.value = false;
  }
}

async function loadRevenue() {
  if (!clubId.value) return;
  revenueLoading.value = true;
  try {
    revenue.value = await getClubRevenueSummary(clubId.value);
  } finally {
    revenueLoading.value = false;
  }
}

async function loadWallet() {
  if (!clubId.value) return;
  walletLoading.value = true;
  try {
    clubWallet.value = await getClubWallet(clubId.value);
    memberWallets.value = await getClubMemberWallets(clubId.value, 200);
  } finally {
    walletLoading.value = false;
  }
}

async function openBindAgent() {
  bindForm.agent_id = 0;
  bindAgentDetail.value = null;
  bindAgentOpen.value = true;
}

async function lookupAgent() {
  if (!bindForm.agent_id) {
    bindAgentDetail.value = null;
    return;
  }
  try {
    bindAgentDetail.value = await getAgentDetail(bindForm.agent_id);
  } catch {
    bindAgentDetail.value = null;
    message.warning(`agent_id=${bindForm.agent_id} 不存在`);
  }
}

async function submitBindAgent() {
  if (!bindForm.agent_id || !bindAgentDetail.value) {
    message.error('请输入合法的 agent_id');
    return;
  }
  await bindClubToAgent({
    club_id: clubId.value,
    agent_id: bindForm.agent_id,
  });
  message.success(`已绑定到代理 ${bindAgentDetail.value.display_name}`);
  bindAgentOpen.value = false;
}

// OPS-B: 给会员充值 / 扣账
function resetAdjustForm() {
  adjustForm.amount = 0;
  adjustForm.reason = '';
  adjustForm.remark = '';
}

function openTopupModal(userId: number) {
  adjustMode.value = 'topup';
  adjustTargetUserId.value = userId;
  resetAdjustForm();
  adjustOpen.value = true;
}

function openDeductModal(userId: number) {
  adjustMode.value = 'deduct';
  adjustTargetUserId.value = userId;
  resetAdjustForm();
  adjustOpen.value = true;
}

async function submitAdjust() {
  if (!adjustForm.amount || adjustForm.amount <= 0) {
    message.error('amount 必须 > 0');
    return;
  }
  if (!adjustForm.reason.trim()) {
    message.error('reason 必填');
    return;
  }
  const fn = adjustMode.value === 'topup' ? topupMemberWallet : deductMemberWallet;
  try {
    await fn(clubId.value, adjustTargetUserId.value, {
      amount: adjustForm.amount,
      request_id: crypto.randomUUID(),
      reason: adjustForm.reason.trim(),
      remark: adjustForm.remark.trim() || null,
    });
    message.success(adjustMode.value === 'topup' ? '充值成功' : '扣账成功');
    adjustOpen.value = false;
    await loadWallet();
  } catch (e: any) {
    message.error(`操作失败: ${e?.message ?? e}`);
  }
}

// 切 tab 时按需 lazy load (Overview 已经在 mount 时 loadDetail).
function handleTabChange(key: number | string) {
  if (key === 'members' && members.value.length === 0) loadMembers();
  if (key === 'tables' && tables.value.length === 0) loadTables(1);
  if (key === 'audit' && auditRows.value.length === 0) loadAudit(1);
  if (key === 'ledger' && ledgerRows.value.length === 0) loadLedger(1);
  if (key === 'revenue' && !revenue.value) loadRevenue();
  if (key === 'wallet' && !clubWallet.value) loadWallet();
}

function handleBack() {
  router.push({ path: '/game/club' });
}

function openTable(row: GameTableApi.TableListItem) {
  router.push({
    name: 'GameTableDetail',
    query: { tableId: String(row.table_id) },
  });
}

function statusTag(s: number) {
  if (s === 1) return { color: 'green', text: 'ACTIVE' };
  if (s === 2) return { color: 'default', text: 'DISSOLVED' };
  return { color: 'default', text: `status=${s}` };
}

function roleLabel(r: number) {
  if (r === 2) return { color: 'gold', text: 'OWNER' };
  if (r === 1) return { color: 'blue', text: 'ADMIN' };
  return { color: 'default', text: 'MEMBER' };
}

function tableStateLabel(s: number) {
  switch (s) {
    case 0:
      return { color: 'green', text: 'OPEN' };
    case 1:
      return { color: 'blue', text: 'PLAYING' };
    case 2:
      return { color: 'orange', text: 'SETTLING' };
    case 3:
      return { color: 'default', text: 'CLOSED' };
    default:
      return { color: 'default', text: `state=${s}` };
  }
}

function directionLabel(d: number): string {
  if (d === 1) return 'CREDIT';
  if (d === -1) return 'DEBIT';
  return `dir=${d}`;
}

watch(clubId, (v, old) => {
  if (v && v !== old) {
    detail.value = null;
    members.value = [];
    tables.value = [];
    auditRows.value = [];
    ledgerRows.value = [];
    revenue.value = null;
    loadDetail();
  }
});

onMounted(loadDetail);
</script>

<template>
  <Page auto-content-height>
    <div class="mb-4 flex justify-between">
      <Space>
        <Button @click="handleBack">返回俱乐部列表</Button>
        <Button type="primary" :loading="detailLoading" @click="loadDetail">
          刷新
        </Button>
      </Space>
      <Space>
        <Button v-if="detail" @click="openBindAgent">绑定代理</Button>
      </Space>
    </div>

    <Empty v-if="!detailLoading && !detail" description="俱乐部不存在或无权限" />

    <Tabs
      v-if="detail"
      default-active-key="overview"
      type="card"
      @change="handleTabChange"
    >
      <!-- Overview -->
      <TabPane key="overview" tab="概览">
        <Card>
          <Descriptions :column="2" bordered size="small">
            <DescriptionsItem label="俱乐部 ID">
              {{ detail.club_id }}
            </DescriptionsItem>
            <DescriptionsItem label="名称">
              {{ detail.name }}
            </DescriptionsItem>
            <DescriptionsItem label="状态">
              <Tag :color="statusTag(detail.status).color">
                {{ statusTag(detail.status).text }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="创建人 user_id">
              {{ detail.owner_user_id }}
            </DescriptionsItem>
            <DescriptionsItem label="成员数">
              {{ detail.member_count }}
            </DescriptionsItem>
            <DescriptionsItem label="活跃 / 总桌数">
              {{ detail.active_table_count }} / {{ detail.total_table_count }}
            </DescriptionsItem>
            <DescriptionsItem label="创建时间">
              {{ detail.created_at ? formatDateTime(detail.created_at) : '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="更新时间">
              {{ detail.updated_at ? formatDateTime(detail.updated_at) : '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="描述" :span="2">
              {{ detail.description ?? '(无)' }}
            </DescriptionsItem>
          </Descriptions>
        </Card>
      </TabPane>

      <!-- Members -->
      <TabPane key="members" tab="成员">
        <Card>
          <div class="mb-2 flex justify-end">
            <Button :loading="membersLoading" size="small" @click="loadMembers">
              刷新
            </Button>
          </div>
          <Table
            :data-source="members"
            :loading="membersLoading"
            :pagination="{ pageSize: 50 }"
            row-key="user_id"
            size="small"
            :columns="[
              { title: '角色', dataIndex: 'role', width: 110 },
              { title: 'User ID', dataIndex: 'user_id', width: 160 },
              { title: '加入时间', dataIndex: 'joined_at', width: 200 },
            ]"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'role'">
                <Tag :color="roleLabel(record.role).color">
                  {{ roleLabel(record.role).text }}
                </Tag>
              </template>
              <template v-else-if="column.dataIndex === 'joined_at'">
                {{ record.joined_at ? formatDateTime(record.joined_at) : '-' }}
              </template>
            </template>
          </Table>
        </Card>
      </TabPane>

      <!-- Tables -->
      <TabPane key="tables" tab="牌桌">
        <Card>
          <div class="mb-2 flex justify-end">
            <Button :loading="tablesLoading" size="small" @click="loadTables(tablesPage.current)">
              刷新
            </Button>
          </div>
          <Table
            :data-source="tables"
            :loading="tablesLoading"
            :pagination="{
              current: tablesPage.current,
              pageSize: tablesPage.pageSize,
              total: tablesPage.total,
              showSizeChanger: false,
              onChange: (p: number) => loadTables(p),
            }"
            row-key="table_id"
            size="small"
            :columns="[
              { title: 'Table ID', dataIndex: 'table_id', width: 110, fixed: 'left' },
              { title: 'Game Kind', dataIndex: 'game_kind', width: 160 },
              { title: '状态', dataIndex: 'state', width: 110 },
              { title: 'Phase', dataIndex: 'phase', width: 120 },
              { title: 'Players', dataIndex: 'player_count', width: 100 },
              { title: 'Seats', dataIndex: 'seat_count', width: 90 },
              { title: 'Pot', dataIndex: 'pot', width: 110 },
              {
                title: '创建时间',
                dataIndex: 'created_at',
                width: 170,
                customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
              },
              { title: '操作', key: 'action', width: 110, fixed: 'right' },
            ]"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'state'">
                <Tag :color="tableStateLabel(record.state).color">
                  {{ tableStateLabel(record.state).text }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Button
                  size="small"
                  type="link"
                  @click="openTable(record as GameTableApi.TableListItem)"
                >
                  详情
                </Button>
              </template>
            </template>
          </Table>
        </Card>
      </TabPane>

      <!-- Game Records (audit, by club_id, scope_type='game_table' JOIN) -->
      <TabPane key="audit" tab="游戏记录">
        <Card>
          <div class="mb-2 flex justify-between">
            <Typography.Text type="secondary">
              本俱乐部下所有桌的 audit (来自 game_audit_event JOIN game_table by club_id).
              单局 hand-by-hand 明细请进牌桌详情 Hands tab.
            </Typography.Text>
            <Button :loading="auditLoading" size="small" @click="loadAudit(auditPage.current)">
              刷新
            </Button>
          </div>
          <Table
            :data-source="auditRows"
            :loading="auditLoading"
            :pagination="{
              current: auditPage.current,
              pageSize: auditPage.pageSize,
              total: auditPage.total,
              showSizeChanger: false,
              onChange: (p: number) => loadAudit(p),
            }"
            row-key="id"
            size="small"
            :columns="[
              { title: 'ID', dataIndex: 'id', width: 80 },
              { title: 'Table', dataIndex: 'scope_id', width: 110 },
              { title: 'User', dataIndex: 'user_id', width: 130 },
              { title: 'Event Type', dataIndex: 'event_type', width: 220 },
              { title: 'Payload', dataIndex: 'payload_json', ellipsis: true },
              {
                title: '时间',
                dataIndex: 'created_at',
                width: 170,
                customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
              },
            ]"
          />
        </Card>
      </TabPane>

      <!-- Ledger (by club_id) -->
      <TabPane key="ledger" tab="资金流水">
        <Card>
          <div class="mb-2 flex justify-end">
            <Button :loading="ledgerLoading" size="small" @click="loadLedger(ledgerPage.current)">
              刷新
            </Button>
          </div>
          <Table
            :data-source="ledgerRows"
            :loading="ledgerLoading"
            :pagination="{
              current: ledgerPage.current,
              pageSize: ledgerPage.pageSize,
              total: ledgerPage.total,
              showSizeChanger: false,
              onChange: (p: number) => loadLedger(p),
            }"
            row-key="created_at"
            size="small"
            :columns="[
              { title: 'Table', dataIndex: 'table_id', width: 90 },
              { title: 'Round', dataIndex: 'round_id', width: 80 },
              { title: 'User', dataIndex: 'user_id', width: 130 },
              { title: 'Currency', dataIndex: 'currency_type', width: 120 },
              { title: 'Amount', dataIndex: 'amount', width: 100 },
              {
                title: 'Direction',
                dataIndex: 'direction',
                width: 100,
                customRender: ({ value }) => directionLabel(Number(value)),
              },
              { title: 'Reason', dataIndex: 'reason', width: 130 },
              {
                title: '时间',
                dataIndex: 'created_at',
                width: 170,
                customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
              },
            ]"
          />
        </Card>
      </TabPane>

      <!-- Wallet (P-revenue-runtime: 真实钱包余额) -->
      <TabPane key="wallet" tab="资金池">
        <Alert
          type="success"
          message="P-revenue-runtime: 实时分账钱包"
          description="每一手抽水按 game_revenue_share_rule 实时拆账, 俱乐部份额直接入此钱包. 玩家在本俱乐部内的余额隔离 (不跨 club)."
          show-icon
          class="mb-4"
        />
        <div v-if="clubWallet" class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card title="俱乐部可用余额">
            <Statistic
              :value="clubWallet.available_balance"
              :value-style="{
                color: clubWallet.available_balance >= 0 ? '#3f8600' : '#cf1322',
              }"
            />
            <Typography.Text type="secondary" class="mt-2 block text-xs">
              {{ clubWallet.currency_type }}
            </Typography.Text>
          </Card>
          <Card title="历史累计">
            <Statistic title="抽水入账" :value="clubWallet.total_rake_received" />
            <Statistic
              title="出账"
              :value="clubWallet.total_paid_out"
              class="mt-2"
              :value-style="{ color: '#cf1322' }"
            />
          </Card>
          <Card title="冻结 / 版本">
            <Statistic title="frozen" :value="clubWallet.frozen_balance" />
            <Typography.Text type="secondary" class="mt-2 block text-xs">
              version: {{ clubWallet.version }} · 更新:
              {{ clubWallet.updated_at ? formatDateTime(clubWallet.updated_at) : '-' }}
            </Typography.Text>
          </Card>
        </div>
        <Card class="mt-4" title="会员钱包 (本俱乐部隔离)">
          <Alert
            v-if="memberWallets.length === 0 && !walletLoading"
            type="info"
            message="还没有会员钱包记录. settleHand 时会自动创建零余额行 + UPSERT."
            show-icon
            class="mb-2"
          />
          <Table
            :data-source="memberWallets"
            :loading="walletLoading"
            :pagination="{ pageSize: 20 }"
            :row-key="(row: any) => `${row.club_id}-${row.user_id}-${row.currency_type}`"
            size="small"
            :columns="[
              { title: 'User ID', dataIndex: 'user_id', width: 140 },
              { title: 'Currency', dataIndex: 'currency_type', width: 110 },
              { title: '可用余额', dataIndex: 'available_balance', width: 120 },
              { title: '冻结', dataIndex: 'frozen_balance', width: 100 },
              { title: '净盈亏', dataIndex: 'win_loss_total', width: 130 },
              { title: '累计买入', dataIndex: 'buy_in_total', width: 120 },
              { title: '累计兑出', dataIndex: 'cash_out_total', width: 120 },
              {
                title: '更新',
                dataIndex: 'updated_at',
                width: 170,
                customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
              },
              { title: '操作', key: 'wallet_action', width: 160, fixed: 'right' },
            ]"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'wallet_action'">
                <Space size="small">
                  <Button
                    size="small"
                    type="link"
                    @click="openTopupModal(record.user_id)"
                  >
                    充值
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    danger
                    @click="openDeductModal(record.user_id)"
                  >
                    扣账
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
        </Card>
      </TabPane>

      <!-- Revenue (read-only summary) -->
      <TabPane key="revenue" tab="抽水 / 利润">
        <Alert
          type="info"
          message="抽水流水统计 (game_ledger_entry 聚合视角)"
          description="本视图来自 ledger 聚合, 包含历史 rake_take (V009 前) 和 club_share (V009 后实时分账). 当前真实余额请看'资金池' tab."
          show-icon
          class="mb-4"
        />
        <div v-if="revenue" class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card title="抽水统计">
            <Statistic title="历史累计抽水" :value="revenue.total_rake" />
            <Statistic title="今日抽水 (UTC)" :value="revenue.today_rake" class="mt-2" />
            <Typography.Text type="secondary" class="mt-2 block text-xs">
              今日窗口: {{ formatDateTime(revenue.today_start) }} —
              {{ formatDateTime(revenue.today_end) }}
            </Typography.Text>
          </Card>
          <Card title="对局统计">
            <Statistic title="已结账局数" :value="revenue.hand_count" />
            <Statistic
              title="活跃 / 总桌数"
              :value="`${revenue.active_table_count} / ${revenue.total_table_count}`"
              class="mt-2"
            />
          </Card>
          <Card title="出入账总额">
            <Statistic
              title="Debit (玩家出账)"
              :value="revenue.debit_total"
              :value-style="{ color: '#cf1322' }"
            />
            <Statistic
              title="Credit (玩家入账)"
              :value="revenue.credit_total"
              :value-style="{ color: '#3f8600' }"
              class="mt-2"
            />
          </Card>
        </div>
        <Card v-else>
          <Empty v-if="!revenueLoading" description="点击刷新加载抽水统计" />
          <div v-else>加载中…</div>
        </Card>
      </TabPane>
    </Tabs>

    <!-- OPS-B: 会员充值 / 扣账 modal -->
    <Modal
      v-model:open="adjustOpen"
      :title="adjustMode === 'topup'
        ? `给玩家 #${adjustTargetUserId} 充值`
        : `从玩家 #${adjustTargetUserId} 扣账`"
      width="520"
      :destroy-on-close="true"
      @ok="submitAdjust"
    >
      <Alert
        v-if="adjustMode === 'topup'"
        type="info"
        message="充值 = 给玩家 club_credit available 余额加钱. 不影响俱乐部钱包 (club_credit 是内部记账 token, 不是真钱). 操作留 wallet_ledger 审计."
        show-icon
        class="mb-4"
      />
      <Alert
        v-else
        type="warning"
        message="扣账 = 从玩家 available 直接扣. 校验 available >= amount 不足拒. 操作留 wallet_ledger 审计."
        show-icon
        class="mb-4"
      />
      <Form :label-col="{ span: 6 }">
        <FormItem label="金额" required>
          <InputNumber
            v-model:value="adjustForm.amount"
            :min="1"
            :max="100_000_000"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="原因" required>
          <Input
            v-model:value="adjustForm.reason"
            placeholder="必填: 活动补偿 / 测试上分 / 风控扣回 等短分类原因"
          />
        </FormItem>
        <FormItem label="备注">
          <Input
            v-model:value="adjustForm.remark"
            placeholder="可选: 工单号 / 操作附言"
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- Bind agent modal -->
    <Modal
      v-model:open="bindAgentOpen"
      :title="`绑定俱乐部 #${clubId} 到代理`"
      width="560"
      :destroy-on-close="true"
      @ok="submitBindAgent"
    >
      <Alert
        type="warning"
        message="绑定 = 1:1 替换. 该 club 之前如果绑了别的代理, 会被覆盖. 历史 ledger 不动."
        show-icon
        class="mb-4"
      />
      <Form :label-col="{ span: 7 }">
        <FormItem label="Agent ID" required>
          <Space>
            <InputNumber v-model:value="bindForm.agent_id" :min="1" />
            <Button size="small" @click="lookupAgent">查询代理</Button>
          </Space>
        </FormItem>
        <FormItem v-if="bindAgentDetail" label="代理信息">
          <Tag color="blue">{{ bindAgentDetail.display_name }}</Tag>
          <span class="ml-2 text-gray-500 text-xs">
            level={{ bindAgentDetail.level }} status={{ bindAgentDetail.status }}
          </span>
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
