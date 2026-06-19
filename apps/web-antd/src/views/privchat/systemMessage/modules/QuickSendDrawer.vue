<script setup lang="ts">
import type { PrivchatSystemMessageApi } from '#/api/privchat/systemMessage';

import { computed, ref, watch } from 'vue';

import {
  Alert,
  Button,
  Drawer,
  Form,
  FormItem,
  message,
  Select,
  Statistic,
  Table,
  Tag,
  Textarea,
} from 'ant-design-vue';

import {
  getSystemSenders,
  sendSystemMessage,
} from '#/api/privchat/systemMessage';

interface Props {
  open: boolean;
  /** 'users' = 私聊到指定用户；'groups' = 发到指定群。 */
  targetType: 'groups' | 'users';
  /** 目标 ID（用户的 user_id 或群的 group_id）。 */
  targetId: number;
  /** 用户/群的展示名（用于标题）。 */
  targetLabel?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ 'update:open': [open: boolean] }>();

const text = ref('');
const sending = ref(false);
const result = ref<PrivchatSystemMessageApi.SendResponse>();

// sender 下拉
const senderId = ref<number | undefined>(undefined);
const senders = ref<PrivchatSystemMessageApi.SenderItem[]>([]);
const sendersLoading = ref(false);

const senderOptions = computed(() => [
  { value: null, label: '默认（系统账号）' },
  ...senders.value.map((s) => ({
    value: s.user_id,
    label: `${s.display_name ?? s.username ?? `uid:${s.user_id}`} · ${s.user_type === 1 ? 'System' : 'Bot'} (uid:${s.user_id})`,
  })),
]);

async function loadSenders() {
  sendersLoading.value = true;
  try {
    const resp = await getSystemSenders();
    senders.value = resp.items ?? [];
  } catch (e: any) {
    // 静默失败：默认 sender 仍可用
    console.warn('加载 sender 列表失败:', e);
  } finally {
    sendersLoading.value = false;
  }
}

const drawerTitle = computed(() => {
  const noun = props.targetType === 'users' ? '用户' : '群';
  return `给${noun}「${props.targetLabel ?? props.targetId}」发送系统消息`;
});

const canSend = computed(
  () => !sending.value && text.value.trim().length > 0,
);

watch(
  () => props.open,
  (v) => {
    if (v) {
      // 第一次开启时拉 senders（缓存到 component 实例内，关闭后保留）
      if (senders.value.length === 0 && !sendersLoading.value) loadSenders();
    } else {
      text.value = '';
      result.value = undefined;
      sending.value = false;
      senderId.value = undefined;
    }
  },
);

async function handleSend() {
  if (!canSend.value) return;
  sending.value = true;
  result.value = undefined;
  try {
    const req: PrivchatSystemMessageApi.SendRequest = {
      target_type: props.targetType,
      content: { type: 'text', text: text.value },
    };
    if (props.targetType === 'users') req.user_ids = [props.targetId];
    if (props.targetType === 'groups') req.group_ids = [props.targetId];
    if (senderId.value != null) req.sender_id = senderId.value;
    const resp = await sendSystemMessage(req);
    result.value = resp;
    if (resp.fail_count === 0) {
      message.success('已写入消息');
    } else {
      message.warning('写入失败，请查看下方错误');
    }
  } catch (e: any) {
    message.error(
      e?.response?.data?.message ?? e?.message ?? '发送失败',
    );
  } finally {
    sending.value = false;
  }
}

function handleClose() {
  if (sending.value) return;
  emit('update:open', false);
}
</script>

<template>
  <Drawer
    :open="open"
    :title="drawerTitle"
    :width="540"
    @close="handleClose"
  >
    <Alert
      class="mb-4"
      message="以系统账号身份写入 IM 消息流；不是 push 通知。"
      type="info"
      show-icon
    />

    <Form layout="vertical">
      <FormItem label="发送人">
        <Select
          v-model:value="senderId"
          :loading="sendersLoading"
          :options="senderOptions"
          allow-clear
          placeholder="选择系统账号 / 机器人，留空则使用默认"
        />
      </FormItem>

      <FormItem label="内容（纯文本）">
        <Textarea
          v-model:value="text"
          placeholder="系统消息内容"
          :rows="6"
          :maxlength="4000"
          show-count
        />
      </FormItem>

      <FormItem>
        <Button
          :disabled="!canSend"
          :loading="sending"
          type="primary"
          @click="handleSend"
        >
          发送
        </Button>
      </FormItem>
    </Form>

    <div v-if="result" class="mt-4">
      <Statistic
        :value="result.fail_count > 0 ? '失败' : '成功'"
        :value-style="{
          color: result.fail_count > 0 ? '#cf1322' : '#3f8600',
        }"
        title="结果"
      />
      <Table
        v-if="result.fail_count > 0 || result.results.length > 1"
        class="mt-3"
        :columns="[
          { title: '目标', dataIndex: 'target', width: 140 },
          { title: '结果', key: 'ok', width: 70 },
          { title: 'message_id', dataIndex: 'message_id' },
          { title: '错误', key: 'error' },
        ]"
        :data-source="result.results"
        :pagination="false"
        row-key="target"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'ok'">
            <Tag v-if="record.ok" color="green">OK</Tag>
            <Tag v-else color="red">FAIL</Tag>
          </template>
          <template v-else-if="column.key === 'error'">
            <span v-if="record.error_message" class="text-red-500">
              {{ record.error_message }}
            </span>
          </template>
        </template>
      </Table>
    </div>
  </Drawer>
</template>
