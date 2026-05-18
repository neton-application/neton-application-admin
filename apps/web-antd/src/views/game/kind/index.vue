<script lang="ts" setup>
import type { GameKindApi } from '#/api/game/kind';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Textarea,
  Typography,
} from 'ant-design-vue';

import {
  disableKind,
  enableKind,
  getKindList,
  updateKind,
} from '#/api/game/kind';

/**
 * 游戏类型 (game_kind) admin 页面 (P-admin-history-kind).
 *
 * 控制面边界 (与后端约束对齐):
 *   - 不能创建/删除 kind: 新 kind 必须先后端 register GameRule + V*** seed.
 *   - 可改: display_name / min_seats / max_seats / default_config_json.
 *   - 可 enable / disable: DISABLED 软删 — 旧桌继续跑, 创新桌被
 *     GAME_KIND_DISABLED 拒.
 *   - active_table_count / total_table_count 是只读统计 (GROUP BY game_table).
 */

const loading = ref(false);
const rows = ref<GameKindApi.KindRow[]>([]);

const editingOpen = ref(false);
const editingKind = ref<null | string>(null);
// 用本地 form shape (default_config_json 为空字符串而非 null) 配合 Input v-model 的
// `string` 类型约束. submit 时把空串还原成 null 走后端 default fallback.
const editing = reactive({
  display_name: '',
  min_seats: 2,
  max_seats: 9,
  default_config_json: '',
});

async function load() {
  loading.value = true;
  try {
    const { list } = await getKindList();
    rows.value = list;
  } finally {
    loading.value = false;
  }
}

function openEdit(row: GameKindApi.KindRow) {
  editingKind.value = row.kind;
  editing.display_name = row.display_name;
  editing.min_seats = row.min_seats;
  editing.max_seats = row.max_seats;
  editing.default_config_json = row.default_config_json ?? '';
  editingOpen.value = true;
}

async function submitEdit() {
  if (!editingKind.value) return;
  // default_config_json 必须是合法 JSON; 空串当 null (后端走 fallback 语义)
  let cfg: null | string = null;
  const raw = editing.default_config_json.trim();
  if (raw !== '') {
    try {
      JSON.parse(raw);
      cfg = raw;
    } catch {
      message.error('default_config_json 不是合法 JSON');
      return;
    }
  }
  await updateKind(editingKind.value, {
    display_name: editing.display_name,
    min_seats: editing.min_seats,
    max_seats: editing.max_seats,
    default_config_json: cfg,
  });
  message.success(`kind=${editingKind.value} 已更新`);
  editingOpen.value = false;
  await load();
}

async function handleEnable(row: GameKindApi.KindRow) {
  await enableKind(row.kind);
  message.success(`kind=${row.kind} 已启用`);
  await load();
}

async function handleDisable(row: GameKindApi.KindRow) {
  await disableKind(row.kind);
  message.success(`kind=${row.kind} 已停用 (旧桌不受影响)`);
  await load();
}

function viewConfig(row: GameKindApi.KindRow) {
  Modal.info({
    title: `${row.kind} default_config_json`,
    width: 720,
    content: () =>
      row.default_config_json
        ? // ant-design vue 不支持 JSX 直接 import — 用 h() 也行,这里简单返回字符串
          row.default_config_json
        : '(空 — 创桌必须 client 传 config_json)',
  });
}

function statusTag(status: number): { color: string; text: string } {
  if (status === 1) return { color: 'green', text: 'ACTIVE' };
  if (status === 0) return { color: 'default', text: 'DISABLED' };
  return { color: 'default', text: `status=${status}` };
}

onMounted(load);
</script>

<template>
  <Page auto-content-height>
    <Card title="游戏类型 (game_kind)">
      <template #extra>
        <Space>
          <Typography.Text type="secondary">
            新 kind 必须后端 register GameRule + DB seed; admin 只能 edit /
            enable / disable 现有 kind.
          </Typography.Text>
          <Button :loading="loading" @click="load">刷新</Button>
        </Space>
      </template>
      <Table
        :data-source="rows"
        :loading="loading"
        :pagination="false"
        row-key="kind"
        size="small"
        :columns="[
          { title: 'Kind', dataIndex: 'kind', width: 200, fixed: 'left' },
          { title: 'Display', dataIndex: 'display_name', width: 220 },
          { title: 'Status', dataIndex: 'status', width: 110 },
          { title: 'Min Seats', dataIndex: 'min_seats', width: 100 },
          { title: 'Max Seats', dataIndex: 'max_seats', width: 100 },
          { title: 'Active Tables', dataIndex: 'active_table_count', width: 130 },
          { title: 'Total Tables', dataIndex: 'total_table_count', width: 120 },
          { title: 'Default Config', dataIndex: 'default_config_json', width: 130 },
          {
            title: 'Updated',
            dataIndex: 'updated_at',
            width: 170,
            customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
          },
          { title: '操作', key: 'action', fixed: 'right', width: 220 },
        ]"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <Tag :color="statusTag(record.status).color">
              {{ statusTag(record.status).text }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'default_config_json'">
            <Button
              size="small"
              type="link"
              @click="viewConfig(record as GameKindApi.KindRow)"
            >
              查看
            </Button>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space size="small">
              <Button
                size="small"
                type="link"
                @click="openEdit(record as GameKindApi.KindRow)"
              >
                编辑
              </Button>
              <Popconfirm
                v-if="record.status !== 1"
                title="启用后允许 client 创建新桌"
                @confirm="handleEnable(record as GameKindApi.KindRow)"
              >
                <Button size="small" type="link">启用</Button>
              </Popconfirm>
              <Popconfirm
                v-else
                title="停用 — 旧桌继续跑, 创新桌将被拒"
                @confirm="handleDisable(record as GameKindApi.KindRow)"
              >
                <Button size="small" type="link" danger>停用</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="editingOpen"
      :title="`编辑 game_kind=${editingKind ?? ''}`"
      width="720"
      :destroy-on-close="true"
      @ok="submitEdit"
    >
      <Form :label-col="{ span: 6 }">
        <FormItem label="Display Name" required>
          <Input v-model:value="editing.display_name" />
        </FormItem>
        <FormItem label="Min Seats" required>
          <InputNumber v-model:value="editing.min_seats" :min="1" :max="50" />
        </FormItem>
        <FormItem label="Max Seats" required>
          <InputNumber v-model:value="editing.max_seats" :min="1" :max="50" />
        </FormItem>
        <FormItem
          label="Default Config JSON"
          help="创桌时 client 未传 config_json 则用这里 fallback. 必须是合法 JSON. Texas Holdem 示例见 GAME_SERVICE_DESIGN.md §A.2 (含 small_blind / big_blind / buy_in_min / buy_in_max / rake_bps / rake_cap)."
        >
          <Textarea
            v-model:value="editing.default_config_json"
            :auto-size="{ minRows: 6, maxRows: 16 }"
            placeholder="(留空表示创桌必须 client 传 config_json)"
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
