<script lang="ts" setup>
import type { GameAgentApi } from '#/api/game/agent';

import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Alert,
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
  Typography,
} from 'ant-design-vue';

import {
  createAgent,
  disableAgent,
  enableAgent,
  getAgentPage,
  updateAgent,
} from '#/api/game/agent';

/**
 * 代理管理列表 (P-revenue-runtime).
 *
 * 双层视角:
 *   - 平台超管视角: 看全部代理 + 各级层级 + 状态
 *   - 代理本人视角: 在 detail 页看自己下挂 club + 钱包 + 流水
 *
 * 业务规则提示:
 *   - 不能 delete; 软删走 disable (状态变 DISABLED, 历史 ledger 不动)
 *   - level=1 (总代理) parent 必空; level>=2 parent 必填
 *   - 同一 user_id 只能挂一个 agent
 */

const router = useRouter();

const loading = ref(false);
const rows = ref<GameAgentApi.AgentRow[]>([]);
const total = ref(0);
const page = reactive({ current: 1, pageSize: 20 });
const filters = reactive<{
  agent_id?: number;
  level?: number;
  name?: string;
  parent_agent_id?: number;
  status?: number;
  user_id?: number;
}>({});

async function load(p = page.current) {
  loading.value = true;
  try {
    const data = await getAgentPage({
      page: p,
      page_size: page.pageSize,
      ...filters,
    });
    rows.value = data.list;
    total.value = data.total;
    page.current = p;
  } finally {
    loading.value = false;
  }
}

// --- create modal ---
// 本地 form 用 0/'' 占位 (避免 Input/InputNumber 不接受 null 的类型告警);
// submit 时把 0/'' 转 null 再发后端.
const createOpen = ref(false);
const createForm = reactive({
  user_id: 0,
  parent_agent_id: 0,
  level: 1,
  display_name: '',
  contact_info: '',
});

function openCreate() {
  createForm.user_id = 0;
  createForm.parent_agent_id = 0;
  createForm.level = 1;
  createForm.display_name = '';
  createForm.contact_info = '';
  createOpen.value = true;
}

async function submitCreate() {
  if (!createForm.user_id || createForm.user_id <= 0) {
    message.error('user_id 必填且 > 0');
    return;
  }
  if (!createForm.display_name) {
    message.error('display_name 必填');
    return;
  }
  if (createForm.level === 1 && createForm.parent_agent_id) {
    message.error('level=1 (总代理) 不允许填 parent_agent_id');
    return;
  }
  if (createForm.level >= 2 && !createForm.parent_agent_id) {
    message.error('level>=2 必须填 parent_agent_id');
    return;
  }
  await createAgent({
    user_id: createForm.user_id,
    parent_agent_id: createForm.parent_agent_id || null,
    level: createForm.level,
    display_name: createForm.display_name,
    contact_info: createForm.contact_info.trim() || null,
  });
  message.success(`代理已创建`);
  createOpen.value = false;
  await load(1);
}

// --- edit modal ---
const editOpen = ref(false);
const editingAgentId = ref(0);
const editForm = reactive({
  display_name: '',
  contact_info: '',
});

function openEdit(row: GameAgentApi.AgentRow) {
  editingAgentId.value = row.agent_id;
  editForm.display_name = row.display_name;
  editForm.contact_info = row.contact_info ?? '';
  editOpen.value = true;
}

async function submitEdit() {
  if (!editForm.display_name) {
    message.error('display_name 必填');
    return;
  }
  await updateAgent(editingAgentId.value, {
    display_name: editForm.display_name,
    contact_info: editForm.contact_info.trim() || null,
  });
  message.success('已更新');
  editOpen.value = false;
  await load();
}

async function handleEnable(row: GameAgentApi.AgentRow) {
  await enableAgent(row.agent_id);
  message.success(`代理 ${row.display_name} 已启用`);
  await load();
}

async function handleDisable(row: GameAgentApi.AgentRow) {
  await disableAgent(row.agent_id);
  message.success(`代理 ${row.display_name} 已停用 (历史不动)`);
  await load();
}

function openDetail(row: GameAgentApi.AgentRow) {
  router.push({
    name: 'GameAgentDetail',
    query: { agentId: String(row.agent_id) },
  });
}

function statusTag(s: number) {
  if (s === 1) return { color: 'green', text: 'ACTIVE' };
  if (s === 0) return { color: 'default', text: 'DISABLED' };
  return { color: 'default', text: `status=${s}` };
}

function levelTag(level: number) {
  if (level === 1) return { color: 'gold', text: '总代理' };
  if (level === 2) return { color: 'blue', text: '一级代理' };
  if (level === 3) return { color: 'cyan', text: '二级代理' };
  return { color: 'default', text: `${level} 级` };
}

onMounted(() => load(1));
</script>

<template>
  <Page auto-content-height>
    <Card title="代理管理">
      <template #extra>
        <Space>
          <Typography.Text type="secondary">
            代理 = 棋牌经营层级; 平台 → 总代理 → 一级 → 俱乐部 → 玩家
          </Typography.Text>
          <Button @click="load()">刷新</Button>
          <Button type="primary" @click="openCreate">+ 创建代理</Button>
        </Space>
      </template>
      <Alert
        type="info"
        message="只读 v1: 不支持删除代理 (status=DISABLED 软删, 历史 ledger 不动). 创建代理后, 用'绑定俱乐部'把 club 挂到此代理下, 分账规则按 club_id → game_club_agent → 代理链 自动生效."
        show-icon
        class="mb-4"
      />
      <Table
        :data-source="rows"
        :loading="loading"
        :pagination="{
          current: page.current,
          pageSize: page.pageSize,
          total,
          showSizeChanger: false,
          onChange: (p: number) => load(p),
        }"
        row-key="agent_id"
        size="small"
        :columns="[
          { title: 'Agent ID', dataIndex: 'agent_id', width: 110, fixed: 'left' },
          { title: 'Display', dataIndex: 'display_name', minWidth: 200 },
          { title: '层级', dataIndex: 'level', width: 110 },
          { title: '上级 Agent', dataIndex: 'parent_agent_id', width: 130 },
          { title: 'User ID', dataIndex: 'user_id', width: 140 },
          { title: '状态', dataIndex: 'status', width: 110 },
          {
            title: '创建时间',
            dataIndex: 'created_at',
            width: 170,
            customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
          },
          { title: '操作', key: 'action', width: 260, fixed: 'right' },
        ]"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'level'">
            <Tag :color="levelTag(record.level).color">
              {{ levelTag(record.level).text }}
            </Tag>
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <Tag :color="statusTag(record.status).color">
              {{ statusTag(record.status).text }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space size="small">
              <Button
                size="small"
                type="link"
                @click="openDetail(record as GameAgentApi.AgentRow)"
              >
                详情
              </Button>
              <Button
                size="small"
                type="link"
                @click="openEdit(record as GameAgentApi.AgentRow)"
              >
                编辑
              </Button>
              <Popconfirm
                v-if="record.status !== 1"
                title="启用后该代理重新生效分成"
                @confirm="handleEnable(record as GameAgentApi.AgentRow)"
              >
                <Button size="small" type="link">启用</Button>
              </Popconfirm>
              <Popconfirm
                v-else
                title="停用 — 历史分成不动, 后续新分成不再入此代理"
                @confirm="handleDisable(record as GameAgentApi.AgentRow)"
              >
                <Button size="small" type="link" danger>停用</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Create modal -->
    <Modal
      v-model:open="createOpen"
      title="创建代理"
      width="640"
      :destroy-on-close="true"
      @ok="submitCreate"
    >
      <Form :label-col="{ span: 7 }">
        <FormItem label="User ID" required>
          <InputNumber v-model:value="createForm.user_id" :min="1" style="width: 100%" />
        </FormItem>
        <FormItem label="Display Name" required>
          <Input v-model:value="createForm.display_name" />
        </FormItem>
        <FormItem label="层级 (level)" required>
          <InputNumber
            v-model:value="createForm.level"
            :min="1"
            :max="10"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="上级 Agent ID" :help="createForm.level === 1 ? 'level=1 (总代理) 不填' : 'level>=2 必填'">
          <InputNumber
            v-model:value="createForm.parent_agent_id"
            :min="1"
            :disabled="createForm.level === 1"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="联系信息">
          <Input v-model:value="createForm.contact_info" placeholder="自由 JSON 或备注" />
        </FormItem>
      </Form>
    </Modal>

    <!-- Edit modal -->
    <Modal
      v-model:open="editOpen"
      :title="`编辑代理 #${editingAgentId}`"
      width="640"
      :destroy-on-close="true"
      @ok="submitEdit"
    >
      <Form :label-col="{ span: 7 }">
        <FormItem label="Display Name" required>
          <Input v-model:value="editForm.display_name" />
        </FormItem>
        <FormItem label="联系信息">
          <Input v-model:value="editForm.contact_info" />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
