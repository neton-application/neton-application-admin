<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

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
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'ant-design-vue';

import {
  archiveShareRule,
  bpsToPercent,
  createShareRule,
  GameShareRuleApi,
  getShareRulePage,
  scopeLabel,
} from '#/api/game/share-rule';

/**
 * 分账规则管理 (P-revenue-runtime).
 *
 * scope 优先级 (后端 resolveEffectiveRule):
 *   per_club (3) > per_agent (4) > per_game_kind (2) > global default (1)
 *
 * 规则:
 *   - sum(*_bps) 必须 = 10000 (1 bps = 0.01%; 10000 = 100%)
 *   - global default 必须有 1 条 active; 不能 archive 唯一活跃 global
 *   - archive 是软删 (status=0 + effective_to 标 now)
 */

const loading = ref(false);
const rows = ref<GameShareRuleApi.RuleRow[]>([]);

async function load() {
  loading.value = true;
  try {
    const data = await getShareRulePage();
    rows.value = data.list;
  } finally {
    loading.value = false;
  }
}

// --- create modal ---
const createOpen = ref(false);
// 本地 form 用空字符串/0 占位; submit 时转 null. 避开 Input v-model 类型约束.
const createForm = reactive({
  scope_type: 1,
  scope_ref_id: '',
  share_platform_bps: 2000,
  share_club_bps: 5000,
  share_agent_bps: 2000,
  share_upper_agent_bps: 1000,
  share_top_agent_bps: 0,
  effective_from: 0,
  effective_to: 0,
  note: '',
});

const bpsSum = computed(
  () =>
    createForm.share_platform_bps +
    createForm.share_club_bps +
    createForm.share_agent_bps +
    createForm.share_upper_agent_bps +
    createForm.share_top_agent_bps,
);
const bpsValid = computed(() => bpsSum.value === GameShareRuleApi.BPS_TOTAL);

function openCreate() {
  Object.assign(createForm, {
    scope_type: 1,
    scope_ref_id: '',
    share_platform_bps: 2000,
    share_club_bps: 5000,
    share_agent_bps: 2000,
    share_upper_agent_bps: 1000,
    share_top_agent_bps: 0,
    effective_from: 0,
    effective_to: 0,
    note: '',
  });
  createOpen.value = true;
}

async function submitCreate() {
  if (!bpsValid.value) {
    message.error(`五项 bps 和必须 = 10000, 当前 ${bpsSum.value}`);
    return;
  }
  if (createForm.scope_type !== 1 && !createForm.scope_ref_id) {
    message.error('非 global 规则必须填 scope_ref_id (game_kind / club_id / agent_id)');
    return;
  }
  await createShareRule({
    scope_type: createForm.scope_type,
    scope_ref_id: createForm.scope_ref_id.trim() || null,
    share_platform_bps: createForm.share_platform_bps,
    share_club_bps: createForm.share_club_bps,
    share_agent_bps: createForm.share_agent_bps,
    share_upper_agent_bps: createForm.share_upper_agent_bps,
    share_top_agent_bps: createForm.share_top_agent_bps,
    effective_from: createForm.effective_from || 0,
    effective_to: createForm.effective_to || null,
    note: createForm.note.trim() || null,
  });
  message.success('规则已创建');
  createOpen.value = false;
  await load();
}

async function handleArchive(row: GameShareRuleApi.RuleRow) {
  await archiveShareRule(row.rule_id);
  message.success('规则已归档');
  await load();
}

function statusTag(s: number) {
  if (s === 1) return { color: 'green', text: 'ACTIVE' };
  if (s === 0) return { color: 'default', text: 'ARCHIVED' };
  return { color: 'default', text: `${s}` };
}

onMounted(load);
</script>

<template>
  <Page auto-content-height>
    <Card title="分账规则 (Revenue Share Rule)">
      <template #extra>
        <Space>
          <Typography.Text type="secondary">
            sum(*_bps) = 10000 (100%); per_club &gt; per_agent &gt; per_game_kind &gt; global
          </Typography.Text>
          <Button :loading="loading" @click="load">刷新</Button>
          <Button type="primary" @click="openCreate">+ 新建规则</Button>
        </Space>
      </template>
      <Alert
        type="warning"
        message="改规则会立即影响下一手开始的所有分账. 旧手不受影响 (历史 ledger append-only)."
        show-icon
        class="mb-4"
      />
      <Table
        :data-source="rows"
        :loading="loading"
        :pagination="false"
        row-key="rule_id"
        size="small"
        :columns="[
          { title: 'ID', dataIndex: 'rule_id', width: 80, fixed: 'left' },
          { title: '范围', dataIndex: 'scope_type', width: 130 },
          { title: '范围值', dataIndex: 'scope_ref_id', width: 130 },
          { title: '平台', dataIndex: 'share_platform_bps', width: 100 },
          { title: '俱乐部', dataIndex: 'share_club_bps', width: 100 },
          { title: '直属代理', dataIndex: 'share_agent_bps', width: 100 },
          { title: '上级', dataIndex: 'share_upper_agent_bps', width: 100 },
          { title: '总代理', dataIndex: 'share_top_agent_bps', width: 100 },
          { title: '状态', dataIndex: 'status', width: 110 },
          {
            title: '生效开始',
            dataIndex: 'effective_from',
            width: 170,
            customRender: ({ value }) => (value ? formatDateTime(value) : '-'),
          },
          { title: '备注', dataIndex: 'note', ellipsis: true },
          { title: '操作', key: 'action', width: 110, fixed: 'right' },
        ]"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'scope_type'">
            <Tag>{{ scopeLabel(record.scope_type) }}</Tag>
          </template>
          <template v-else-if="column.dataIndex === 'scope_ref_id'">
            {{ record.scope_ref_id ?? '(global)' }}
          </template>
          <template
            v-else-if="
              (
                [
                  'share_platform_bps',
                  'share_club_bps',
                  'share_agent_bps',
                  'share_upper_agent_bps',
                  'share_top_agent_bps',
                ] as string[]
              ).includes(String(column.dataIndex))
            "
          >
            {{ bpsToPercent(Number((record as any)[String(column.dataIndex)] ?? 0)) }}
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <Tag :color="statusTag(record.status).color">
              {{ statusTag(record.status).text }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Popconfirm
              v-if="record.status === 1"
              title="归档此规则? 不可逆 (但可创建新的覆盖)."
              @confirm="handleArchive(record as GameShareRuleApi.RuleRow)"
            >
              <Button size="small" type="link" danger>归档</Button>
            </Popconfirm>
            <Typography.Text v-else type="secondary">已归档</Typography.Text>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Create modal -->
    <Modal
      v-model:open="createOpen"
      title="新建分账规则"
      width="720"
      :destroy-on-close="true"
      @ok="submitCreate"
    >
      <Form :label-col="{ span: 8 }">
        <FormItem label="范围 (scope)" required>
          <Select
            v-model:value="createForm.scope_type"
            :options="[
              { label: '全局默认 (global)', value: 1 },
              { label: '玩法专属 (per_game_kind)', value: 2 },
              { label: '俱乐部专属 (per_club)', value: 3 },
              { label: '代理专属 (per_agent)', value: 4 },
            ]"
          />
        </FormItem>
        <FormItem
          v-if="createForm.scope_type !== 1"
          label="范围 ID"
          required
          help="game_kind (e.g. texas_holdem) / club_id / agent_id"
        >
          <Input v-model:value="createForm.scope_ref_id" />
        </FormItem>
        <FormItem
          label="平台 BPS"
          :help="`当前 ${bpsToPercent(createForm.share_platform_bps)}`"
          required
        >
          <InputNumber
            v-model:value="createForm.share_platform_bps"
            :min="0"
            :max="10_000"
            style="width: 100%"
          />
        </FormItem>
        <FormItem
          label="俱乐部 BPS"
          :help="`当前 ${bpsToPercent(createForm.share_club_bps)}`"
          required
        >
          <InputNumber
            v-model:value="createForm.share_club_bps"
            :min="0"
            :max="10_000"
            style="width: 100%"
          />
        </FormItem>
        <FormItem
          label="直属代理 BPS"
          :help="`当前 ${bpsToPercent(createForm.share_agent_bps)}`"
        >
          <InputNumber
            v-model:value="createForm.share_agent_bps"
            :min="0"
            :max="10_000"
            style="width: 100%"
          />
        </FormItem>
        <FormItem
          label="上级代理 BPS"
          :help="`当前 ${bpsToPercent(createForm.share_upper_agent_bps)}`"
        >
          <InputNumber
            v-model:value="createForm.share_upper_agent_bps"
            :min="0"
            :max="10_000"
            style="width: 100%"
          />
        </FormItem>
        <FormItem
          label="总代理 BPS"
          :help="`当前 ${bpsToPercent(createForm.share_top_agent_bps)}`"
        >
          <InputNumber
            v-model:value="createForm.share_top_agent_bps"
            :min="0"
            :max="10_000"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="校验">
          <Tag :color="bpsValid ? 'green' : 'red'">
            sum = {{ bpsSum }} / {{ GameShareRuleApi.BPS_TOTAL }}
            {{ bpsValid ? '✓' : '✗' }}
          </Tag>
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="createForm.note" />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
