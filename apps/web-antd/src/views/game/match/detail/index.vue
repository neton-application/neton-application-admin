<script lang="ts" setup>
import type { GameMatchApi } from '#/api/game/match';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Statistic,
  Table,
  TabPane,
  Tabs,
  Tag,
  Typography,
} from 'ant-design-vue';

import {
  getMatchActions,
  getMatchAudit,
  getMatchDetail,
  getMatchLedger,
} from '#/api/game/match';

/**
 * Match 详情 (ROOM-MATCH-2).
 *
 * admin 信息架构的核心聚合点 — 一局对局的:
 *   Overview / Actions / Ledger / Audit
 * 都在这一页. Tabs 按需懒加载.
 *
 * audit tab 读 scope_type='game_match' + scope_id=match_id 的行
 * (ROOM-MATCH-3 后 engine 才开始按这个 scope 写入; commit 2 期间该 tab 多半为空,
 *  这是设计预期 — 历史 scope_type='game_table' 的散件不混进来).
 */

const route = useRoute();
const matchId = computed(() => Number(route.query.matchId));

const detail = ref<GameMatchApi.MatchDetail | null>(null);
const detailLoading = ref(false);
const activeTab = ref('overview');

const actions = ref<GameMatchApi.MatchAction[]>([]);
const actionsLoading = ref(false);

const ledger = ref<GameMatchApi.MatchLedgerEntry[]>([]);
const ledgerSummary = ref<GameMatchApi.LedgerSummary | null>(null);
const ledgerLoading = ref(false);

const audit = ref<GameMatchApi.MatchAuditEvent[]>([]);
const auditLoading = ref(false);

async function loadDetail() {
  if (!matchId.value) return;
  detailLoading.value = true;
  try {
    detail.value = await getMatchDetail(matchId.value);
  } finally {
    detailLoading.value = false;
  }
}

async function loadActions() {
  if (!matchId.value || actions.value.length > 0) return;
  actionsLoading.value = true;
  try {
    const r = await getMatchActions(matchId.value);
    actions.value = r.list ?? [];
  } finally {
    actionsLoading.value = false;
  }
}

async function loadLedger() {
  if (!matchId.value || ledger.value.length > 0) return;
  ledgerLoading.value = true;
  try {
    const r = await getMatchLedger(matchId.value);
    ledger.value = r.list ?? [];
    ledgerSummary.value = r.summary ?? null;
  } finally {
    ledgerLoading.value = false;
  }
}

async function loadAudit() {
  if (!matchId.value || audit.value.length > 0) return;
  auditLoading.value = true;
  try {
    const r = await getMatchAudit(matchId.value);
    audit.value = r.list ?? [];
  } finally {
    auditLoading.value = false;
  }
}

function onTabChange(key: number | string) {
  activeTab.value = String(key);
  if (key === 'actions') loadActions();
  else if (key === 'ledger') loadLedger();
  else if (key === 'audit') loadAudit();
}

function statusTag(s: number) {
  if (s === 0) return { color: 'blue', text: 'PLAYING' };
  if (s === 1) return { color: 'green', text: 'SETTLED' };
  if (s === 2) return { color: 'default', text: 'ABORTED' };
  return { color: 'default', text: `status=${s}` };
}

watch(matchId, (v) => {
  if (v) {
    detail.value = null;
    actions.value = [];
    ledger.value = [];
    audit.value = [];
    activeTab.value = 'overview';
    loadDetail();
  }
});

onMounted(loadDetail);
</script>

<template>
  <Page>
    <Card :loading="detailLoading">
      <template #title>
        对局 #{{ matchId }}
        <Tag
          v-if="detail"
          :color="statusTag(detail.status).color"
          style="margin-left: 8px"
        >
          {{ statusTag(detail.status).text }}
        </Tag>
      </template>
      <template #extra>
        <Button @click="loadDetail">刷新</Button>
      </template>

      <Tabs :active-key="activeTab" @change="onTabChange">
        <!-- Overview -->
        <TabPane key="overview" tab="概览">
          <template v-if="detail">
            <Descriptions bordered size="small" :column="2">
              <DescriptionsItem label="Match ID">
                {{ detail.match_id }}
              </DescriptionsItem>
              <DescriptionsItem label="Room ID">
                {{ detail.room_id }}
              </DescriptionsItem>
              <DescriptionsItem label="Club ID">
                {{ detail.club_id ?? '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="Game Kind">
                {{ detail.game_kind }}
              </DescriptionsItem>
              <DescriptionsItem label="本房间局号">
                #{{ detail.match_no_in_room }}
              </DescriptionsItem>
              <DescriptionsItem label="状态">
                <Tag :color="statusTag(detail.status).color">
                  {{ statusTag(detail.status).text }}
                </Tag>
              </DescriptionsItem>
              <DescriptionsItem label="开始">
                {{ detail.started_at ? formatDateTime(detail.started_at) : '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="结束">
                {{ detail.ended_at ? formatDateTime(detail.ended_at) : '进行中' }}
              </DescriptionsItem>
            </Descriptions>

            <div class="mt-4">
              <Typography.Title :level="5">参与玩家 snapshot</Typography.Title>
              <Typography.Paragraph>
                <pre class="raw-json">{{
                  detail.participant_snapshot_json ?? '(无 snapshot)'
                }}</pre>
              </Typography.Paragraph>
            </div>

            <div class="mt-4">
              <Typography.Title :level="5">结果 result_json</Typography.Title>
              <Typography.Paragraph>
                <pre class="raw-json">{{
                  detail.result_json ?? '(对局未结束 / 无 result)'
                }}</pre>
              </Typography.Paragraph>
            </div>
          </template>
        </TabPane>

        <!-- Actions -->
        <TabPane key="actions" tab="动作">
          <Table
            :data-source="actions"
            :loading="actionsLoading"
            row-key="action_seq"
            size="small"
            :pagination="{ pageSize: 50, showSizeChanger: false }"
            :columns="[
              { title: '#', dataIndex: 'action_seq', width: 70 },
              { title: 'Table', dataIndex: 'table_id', width: 100 },
              { title: 'Round', dataIndex: 'round_id', width: 90 },
              { title: 'User', dataIndex: 'user_id', width: 130 },
              { title: 'Action', dataIndex: 'action', width: 130 },
              {
                title: 'state_version',
                dataIndex: 'applied_state_version',
                width: 120,
              },
              {
                title: '时间',
                dataIndex: 'created_at',
                customRender: ({ value }) =>
                  value ? formatDateTime(value) : '-',
              },
            ]"
          />
        </TabPane>

        <!-- Ledger -->
        <TabPane key="ledger" tab="资金">
          <div v-if="ledgerSummary" class="mb-3 flex gap-6">
            <Statistic title="借方" :value="ledgerSummary.total_debit" />
            <Statistic title="贷方" :value="ledgerSummary.total_credit" />
            <Statistic title="净额" :value="ledgerSummary.net" />
            <Statistic title="行数" :value="ledgerSummary.row_count" />
          </div>
          <Table
            :data-source="ledger"
            :loading="ledgerLoading"
            row-key="created_at"
            size="small"
            :pagination="{ pageSize: 50, showSizeChanger: false }"
            :columns="[
              { title: 'User', dataIndex: 'user_id', width: 130 },
              { title: 'Currency', dataIndex: 'currency_type', width: 130 },
              { title: 'Amount', dataIndex: 'amount', width: 100 },
              { title: '±', dataIndex: 'direction', width: 50 },
              { title: 'Reason', dataIndex: 'reason' },
              {
                title: '时间',
                dataIndex: 'created_at',
                width: 170,
                customRender: ({ value }) =>
                  value ? formatDateTime(value) : '-',
              },
            ]"
          />
        </TabPane>

        <!-- Audit -->
        <TabPane key="audit" tab="审计">
          <Typography.Paragraph type="secondary" class="mb-2">
            按 scope_type='game_match' + scope_id={{ matchId }} 查询.
            ROOM-MATCH-3 前 engine 还未按这个 scope 写入, 列表可能为空.
          </Typography.Paragraph>
          <Table
            :data-source="audit"
            :loading="auditLoading"
            row-key="id"
            size="small"
            :pagination="{ pageSize: 50, showSizeChanger: false }"
            :columns="[
              { title: 'ID', dataIndex: 'id', width: 80 },
              { title: 'User', dataIndex: 'user_id', width: 130 },
              { title: 'Event', dataIndex: 'event_type', width: 240 },
              { title: 'Payload', dataIndex: 'payload_json', ellipsis: true },
              {
                title: '时间',
                dataIndex: 'created_at',
                width: 170,
                customRender: ({ value }) =>
                  value ? formatDateTime(value) : '-',
              },
            ]"
          />
        </TabPane>
      </Tabs>
    </Card>
  </Page>
</template>

<style scoped>
.raw-json {
  background: var(--ant-color-fill-tertiary);
  padding: 8px;
  border-radius: 4px;
  font-size: 11px;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
