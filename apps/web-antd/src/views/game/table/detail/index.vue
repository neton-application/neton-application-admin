<script lang="ts" setup>
import type { GameTableApi } from '#/api/game/table';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
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
  forceCloseTable,
  getTableAudit,
  getTableDetail,
  getTableLedger,
} from '#/api/game/table';

import { TABLE_STATE_OPTIONS } from '../data';

const route = useRoute();
const router = useRouter();

const tableId = computed(() => Number(route.query.tableId ?? 0));

const loading = ref(false);
const detail = ref<GameTableApi.TableDetailResponse | null>(null);
const ledgerRows = ref<GameTableApi.LedgerEntry[]>([]);
const auditRows = ref<GameTableApi.AuditEvent[]>([]);

async function load() {
  if (!tableId.value) return;
  loading.value = true;
  try {
    detail.value = await getTableDetail(tableId.value);
    ledgerRows.value = await getTableLedger(tableId.value);
    auditRows.value = await getTableAudit(tableId.value);
  } finally {
    loading.value = false;
  }
}

function handleForceClose() {
  if (!detail.value) return;
  const d = detail.value;
  Modal.confirm({
    title: `强关桌 ${d.table_id}?`,
    content: `当前 state=${stateLabel(d.state)}; 强关后玩家无法继续 action.`,
    okText: '确认强关',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      await forceCloseTable(d.table_id, { reason: 'admin force close (detail page)' });
      Modal.success({ title: `桌 ${d.table_id} 已 CLOSED` });
      await load();
    },
  });
}

function handleRefresh() {
  load();
}

function handleBack() {
  router.push({ name: 'GameTable' });
}

function stateLabel(state: number): string {
  return (
    TABLE_STATE_OPTIONS.find((o) => o.value === state)?.label ?? `state=${state}`
  );
}

function stateColor(state: number): string {
  switch (state) {
    case 0: {
      return 'green';
    }
    case 1: {
      return 'blue';
    }
    case 2: {
      return 'orange';
    }
    case 3: {
      return 'default';
    }
    default: {
      return 'default';
    }
  }
}

function directionLabel(d: number): string {
  if (d === 1) return 'CREDIT';
  if (d === -1) return 'DEBIT';
  return `dir=${d}`;
}

const snapshotPretty = computed(() => {
  if (!detail.value?.round?.snapshot) return null;
  try {
    return JSON.stringify(detail.value.round.snapshot, null, 2);
  } catch {
    return String(detail.value.round.snapshot);
  }
});

const seats = computed<
  Array<{
    acted?: boolean;
    all_in?: boolean;
    committed?: number;
    folded?: boolean;
    seat_no: number;
    stack?: number;
    status?: number | string;
    total_committed?: number;
    user_id?: null | number;
  }>
>(() => {
  const snap: any = detail.value?.round?.snapshot ?? null;
  if (!snap) return [];
  const rawSeats: any[] = snap.seats ?? [];
  // rule_state 里的 player_state 含 stack/committed/all_in 等; merge by seat_no
  let playerStateMap = new Map<number, any>();
  try {
    const ruleStateJson: string = snap.ruleStateJson ?? '{}';
    const ruleState = JSON.parse(ruleStateJson);
    const ps: any[] = ruleState.player_state ?? [];
    playerStateMap = new Map(ps.map((p) => [p.seat_no, p]));
  } catch {
    // ignore
  }
  return rawSeats.map((s: any) => {
    const ps = playerStateMap.get(s.seatNo);
    return {
      seat_no: s.seatNo,
      user_id: s.userId,
      status: s.status,
      stack: ps?.stack,
      committed: ps?.committed,
      total_committed: ps?.total_committed,
      folded: ps?.folded,
      all_in: ps?.all_in,
      acted: ps?.acted,
    };
  });
});

onMounted(load);
</script>

<template>
  <Page auto-content-height>
    <div class="mb-4 flex justify-between">
      <Space>
        <Button @click="handleBack">返回列表</Button>
        <Button type="primary" :loading="loading" @click="handleRefresh">
          刷新
        </Button>
      </Space>
      <Space>
        <Button
          v-if="detail && detail.state !== 3"
          type="primary"
          danger
          @click="handleForceClose"
        >
          强关 force-close
        </Button>
      </Space>
    </div>

    <Empty
      v-if="!loading && !detail"
      description="桌不存在或无权限"
    />

    <Tabs v-if="detail" default-active-key="overview" type="card">
      <!-- Overview -->
      <TabPane key="overview" tab="Overview">
        <Card>
          <Descriptions :column="2" bordered size="small">
            <DescriptionsItem label="Table ID">
              {{ detail.table_id }}
            </DescriptionsItem>
            <DescriptionsItem label="Game Kind">
              {{ detail.game_kind }}
            </DescriptionsItem>
            <DescriptionsItem label="状态">
              <Tag :color="stateColor(detail.state)">
                {{ stateLabel(detail.state) }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="可见性">
              {{ detail.visibility === 1 ? '公开' : '私桌' }}
            </DescriptionsItem>
            <DescriptionsItem label="俱乐部 ID">
              {{ detail.club_id ?? '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="创建人 user_id">
              {{ detail.owner_user_id }}
            </DescriptionsItem>
            <DescriptionsItem label="座位">
              {{ detail.min_seats }} ~ {{ detail.max_seats }}
            </DescriptionsItem>
            <DescriptionsItem label="加入策略">
              {{ detail.join_policy }}
            </DescriptionsItem>
            <DescriptionsItem label="Created">
              {{ detail.created_at ? formatDateTime(detail.created_at) : '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="Updated">
              {{ detail.updated_at ? formatDateTime(detail.updated_at) : '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="Closed">
              {{ detail.closed_at ? formatDateTime(detail.closed_at) : '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="Config JSON" :span="2">
              <Typography.Text code copyable>
                {{ detail.config_json ?? '(none)' }}
              </Typography.Text>
            </DescriptionsItem>
          </Descriptions>
        </Card>

        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card title="Round">
            <div v-if="detail.round">
              <Statistic title="Round ID" :value="detail.round.round_id" />
              <Statistic
                title="State Version"
                :value="detail.round.state_version"
                class="mt-2"
              />
              <div v-if="detail.round.current_seat !== null" class="mt-2">
                Current Seat: {{ detail.round.current_seat }}
              </div>
            </div>
            <Empty v-else description="桌还没开 round" />
          </Card>
          <Card title="Ledger Summary">
            <Statistic title="Debit" :value="detail.ledger_summary.total_debit" />
            <Statistic
              title="Credit"
              :value="detail.ledger_summary.total_credit"
              class="mt-2"
            />
            <Statistic
              title="Net"
              :value="detail.ledger_summary.net"
              :value-style="{
                color: detail.ledger_summary.net >= 0 ? '#3f8600' : '#cf1322',
              }"
              class="mt-2"
            />
            <Statistic
              title="Rows"
              :value="detail.ledger_summary.row_count"
              class="mt-2"
            />
          </Card>
          <Card title="Audit Summary">
            <Statistic
              title="Total Audit Events"
              :value="detail.audit_summary.total_count"
            />
            <div class="mt-2 text-gray-500">
              展示最近 {{ detail.audit_summary.recent.length }} 行 (详见 Audit Tab)
            </div>
          </Card>
        </div>
      </TabPane>

      <!-- Snapshot raw -->
      <TabPane key="snapshot" tab="Snapshot (Admin Debug)">
        <Card>
          <Empty v-if="!snapshotPretty" description="桌还没开 round, snapshot 不存在" />
          <pre v-else class="bg-gray-50 p-4 text-xs overflow-auto" style="max-height: 600px;">{{ snapshotPretty }}</pre>
        </Card>
      </TabPane>

      <!-- Seats -->
      <TabPane key="seats" tab="Seats">
        <Card>
          <Empty v-if="seats.length === 0" description="无 seat 信息" />
          <Table
            v-else
            :data-source="seats"
            :pagination="false"
            row-key="seat_no"
            size="small"
            :columns="[
              { title: 'Seat #', dataIndex: 'seat_no', width: 80 },
              { title: 'User ID', dataIndex: 'user_id', width: 140 },
              { title: 'Status', dataIndex: 'status', width: 100 },
              { title: 'Stack', dataIndex: 'stack', width: 100 },
              { title: 'Committed (street)', dataIndex: 'committed', width: 140 },
              { title: 'Total Committed', dataIndex: 'total_committed', width: 150 },
              { title: 'Folded', dataIndex: 'folded', width: 90 },
              { title: 'All-in', dataIndex: 'all_in', width: 90 },
              { title: 'Acted', dataIndex: 'acted', width: 90 },
            ]"
          />
        </Card>
      </TabPane>

      <!-- Ledger -->
      <TabPane key="ledger" tab="Ledger">
        <Card>
          <Table
            :data-source="ledgerRows"
            :pagination="{ pageSize: 20 }"
            row-key="created_at"
            size="small"
            :columns="[
              { title: 'Round', dataIndex: 'round_id', width: 80 },
              { title: 'User', dataIndex: 'user_id', width: 130 },
              { title: 'Currency', dataIndex: 'currency_type', width: 110 },
              { title: 'Amount', dataIndex: 'amount', width: 100 },
              { title: 'Direction', dataIndex: 'direction', width: 100,
                customRender: ({ value }) => directionLabel(Number(value)) },
              { title: 'Reason', dataIndex: 'reason', width: 130 },
              { title: 'Created', dataIndex: 'created_at', width: 170,
                customRender: ({ value }) => value ? formatDateTime(value) : '-' },
            ]"
          />
        </Card>
      </TabPane>

      <!-- Audit -->
      <TabPane key="audit" tab="Audit">
        <Card>
          <Table
            :data-source="auditRows"
            :pagination="{ pageSize: 20 }"
            row-key="id"
            size="small"
            :columns="[
              { title: 'ID', dataIndex: 'id', width: 80 },
              { title: 'Scope', width: 180,
                customRender: ({ record }) => `${record.scope_type ?? '-'}:${record.scope_id ?? '-'}` },
              { title: 'User', dataIndex: 'user_id', width: 140 },
              { title: 'Event Type', dataIndex: 'event_type', width: 220 },
              { title: 'Payload', dataIndex: 'payload_json', ellipsis: true },
              { title: 'Created', dataIndex: 'created_at', width: 170,
                customRender: ({ value }) => value ? formatDateTime(value) : '-' },
            ]"
          />
        </Card>
      </TabPane>
    </Tabs>
  </Page>
</template>
