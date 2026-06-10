<script lang="ts" setup>
import type { GameMatchApi } from '#/api/game/match';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Select,
  Table,
  Tag,
  Typography,
} from 'ant-design-vue';

import { getMatchPage } from '#/api/game/match';

/**
 * Match 列表 (ROOM-MATCH-2).
 *
 * admin 信息架构核心: Room 是容器没详情, Match 才是聚合点.
 * 这里是跨 club 的对局列表; club-scoped 列表仍在 club/detail Matches tab.
 *
 * 行点击 → /game/match/detail?matchId=... 看牌谱 + 资金 + 审计.
 */

const router = useRouter();

const filter = ref({
  club_id: undefined as number | undefined,
  room_id: undefined as number | undefined,
  game_kind: undefined as string | undefined,
  status: undefined as number | undefined,
});

const rows = ref<GameMatchApi.MatchPageItem[]>([]);
const loading = ref(false);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });

async function loadPage(page = 1) {
  loading.value = true;
  try {
    const data = await getMatchPage({
      page,
      page_size: pagination.value.pageSize,
      ...filter.value,
    });
    rows.value = data.list ?? [];
    pagination.value = {
      ...pagination.value,
      current: page,
      total: data.total ?? 0,
    };
  } finally {
    loading.value = false;
  }
}

function statusTag(s: number) {
  if (s === 0) return { color: 'blue', text: 'PLAYING' };
  if (s === 1) return { color: 'green', text: 'SETTLED' };
  if (s === 2) return { color: 'default', text: 'ABORTED' };
  return { color: 'default', text: `status=${s}` };
}

function openDetail(row: GameMatchApi.MatchPageItem) {
  router.push({
    name: 'GameMatchDetail',
    query: { matchId: String(row.match_id) },
  });
}

onMounted(() => loadPage(1));
</script>

<template>
  <Page>
    <Card title="对局管理">
      <template #extra>
        <Typography.Text type="secondary">
          房间是容器, 对局才是详情对象. 点击行进入对局详情看动作/资金/审计.
        </Typography.Text>
      </template>

      <Form layout="inline" class="mb-3">
        <FormItem label="俱乐部">
          <Input
            v-model:value="filter.club_id"
            placeholder="club_id"
            allow-clear
            style="width: 120px"
            type="number"
          />
        </FormItem>
        <FormItem label="房间">
          <Input
            v-model:value="filter.room_id"
            placeholder="room_id"
            allow-clear
            style="width: 120px"
            type="number"
          />
        </FormItem>
        <FormItem label="类型">
          <Input
            v-model:value="filter.game_kind"
            placeholder="game_kind"
            allow-clear
            style="width: 160px"
          />
        </FormItem>
        <FormItem label="状态">
          <Select
            v-model:value="filter.status"
            placeholder="所有"
            allow-clear
            style="width: 140px"
            :options="[
              { value: 0, label: 'PLAYING' },
              { value: 1, label: 'SETTLED' },
              { value: 2, label: 'ABORTED' },
            ]"
          />
        </FormItem>
        <FormItem>
          <Button type="primary" @click="loadPage(1)">查询</Button>
        </FormItem>
      </Form>

      <Table
        :data-source="rows"
        :loading="loading"
        row-key="match_id"
        size="small"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false,
          onChange: (p: number) => loadPage(p),
        }"
        :columns="[
          { title: 'Match ID', dataIndex: 'match_id', width: 140 },
          { title: 'Room', dataIndex: 'room_id', width: 110 },
          { title: 'Club', dataIndex: 'club_id', width: 100 },
          { title: '类型', dataIndex: 'game_kind', width: 140 },
          { title: '局号', dataIndex: 'match_no_in_room', width: 80 },
          { title: '状态', dataIndex: 'status', width: 110, key: 'status' },
          {
            title: '开始时间',
            dataIndex: 'started_at',
            width: 170,
            customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
          },
          {
            title: '结束时间',
            dataIndex: 'ended_at',
            width: 170,
            customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
          },
          { title: '操作', key: 'action', width: 100, fixed: 'right' },
        ]"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusTag(record.status).color">
              {{ statusTag(record.status).text }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button size="small" type="link" @click="openDetail(record)">
              详情
            </Button>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>
