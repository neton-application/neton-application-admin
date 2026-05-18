<script lang="ts" setup>
import type { GameClubApi } from '#/api/game/club';
import type { GameTableApi } from '#/api/game/table';
import type { GameLedgerApi } from '#/api/game/ledger';
import type { GameAuditApi } from '#/api/game/audit';

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
  Space,
  Statistic,
  Table,
  Tabs,
  TabPane,
  Tag,
  Typography,
} from 'ant-design-vue';

import {
  getClubDetail,
  getClubMembers,
  getClubRevenueSummary,
} from '#/api/game/club';
import { getTablePage } from '#/api/game/table';
import { getLedgerPage } from '#/api/game/ledger';
import { getAuditPage } from '#/api/game/audit';

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

// 切 tab 时按需 lazy load (Overview 已经在 mount 时 loadDetail).
function handleTabChange(key: number | string) {
  if (key === 'members' && members.value.length === 0) loadMembers();
  if (key === 'tables' && tables.value.length === 0) loadTables(1);
  if (key === 'audit' && auditRows.value.length === 0) loadAudit(1);
  if (key === 'ledger' && ledgerRows.value.length === 0) loadLedger(1);
  if (key === 'revenue' && !revenue.value) loadRevenue();
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

      <!-- Revenue (read-only summary) -->
      <TabPane key="revenue" tab="抽水 / 利润">
        <Alert
          type="info"
          message="只读抽水统计 (read-only revenue summary)"
          description="当前数据完全从 game_ledger_entry 聚合, 不是钱包余额. 真实'俱乐部资金池 + 代理分成 + 结算周期'模型见 GAME_REVENUE_SHARE_SPEC.md (v1.1+)."
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
  </Page>
</template>
