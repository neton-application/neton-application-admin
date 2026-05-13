<script setup lang="ts">
import type { PrivchatSystemMessageApi } from '#/api/privchat/systemMessage';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Form,
  FormItem,
  message,
  RadioButton,
  RadioGroup,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { getSystemSenders, sendSystemMessage } from '#/api/privchat/systemMessage';

const targetType = ref<PrivchatSystemMessageApi.TargetType>('users');
const idsInput = ref('');
const text = ref('');
const sending = ref(false);
const result = ref<PrivchatSystemMessageApi.SendResponse>();

// sender 下拉：null = 用 server 默认 SYSTEM_USER_ID
const senderId = ref<null | number>(null);
const senders = ref<PrivchatSystemMessageApi.SenderItem[]>([]);
const sendersLoading = ref(false);

const senderOptions = computed(() => [
  {
    value: null,
    label: '默认（系统账号）',
  },
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
    message.error(
      e?.response?.data?.message ?? e?.message ?? '加载发送者失败',
    );
  } finally {
    sendersLoading.value = false;
  }
}

onMounted(() => {
  loadSenders();
});

const limits: Record<PrivchatSystemMessageApi.TargetType, number> = {
  users: 100,
  groups: 50,
  channels: 100,
};

const targetLabel = computed(() => {
  switch (targetType.value) {
    case 'users': {
      return '用户 ID';
    }
    case 'groups': {
      return '群 ID';
    }
    case 'channels': {
      return 'channel_id（高级）';
    }
  }
  return '';
});

const parsedIds = computed<number[]>(() => {
  return idsInput.value
    .split(/[\s,，;；]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
});

const idsOverLimit = computed(
  () => parsedIds.value.length > limits[targetType.value],
);

const canSend = computed(
  () =>
    !sending.value &&
    parsedIds.value.length > 0 &&
    !idsOverLimit.value &&
    text.value.trim().length > 0,
);

async function handleSend() {
  if (!canSend.value) return;
  sending.value = true;
  result.value = undefined;
  try {
    const req: PrivchatSystemMessageApi.SendRequest = {
      target_type: targetType.value,
      content: { type: 'text', text: text.value },
    };
    if (targetType.value === 'users') req.user_ids = parsedIds.value;
    if (targetType.value === 'groups') req.group_ids = parsedIds.value;
    if (targetType.value === 'channels') req.channel_ids = parsedIds.value;
    if (senderId.value !== null) req.sender_id = senderId.value;
    const resp = await sendSystemMessage(req);
    result.value = resp;
    if (resp.fail_count === 0) {
      message.success(`成功写入 ${resp.ok_count} 个目标`);
    } else {
      message.warning(
        `成功 ${resp.ok_count} / 失败 ${resp.fail_count}，请查看下方结果`,
      );
    }
  } catch (e: any) {
    message.error(
      e?.response?.data?.message ?? e?.message ?? '发送失败',
    );
  } finally {
    sending.value = false;
  }
}

function handleReset() {
  idsInput.value = '';
  text.value = '';
  result.value = undefined;
}
</script>

<template>
  <Page auto-content-height>
    <Alert
      class="mb-4"
      message="系统消息（v1 精准定向）"
      type="info"
      show-icon
    >
      <template #description>
        以系统账号身份向指定目标写入 IM 消息流（不是 push 通知）。<b>成功 = server 已写入消息</b>，
        不代表用户已读或设备已收到 push。当前不支持全服广播 / 条件投递。
      </template>
    </Alert>

    <Card title="发送系统消息" class="mb-4">
      <Form layout="vertical">
        <FormItem label="发送人">
          <Select
            v-model:value="senderId"
            :loading="sendersLoading"
            :options="senderOptions"
            allow-clear
            placeholder="选择系统账号 / 机器人，留空则使用默认系统账号"
            style="max-width: 480px"
          />
          <div class="mt-1 text-xs text-gray-500">
            sender 必须是 user_type ∈ &#123;System, Bot&#125; 的账号；server 强校验，普通用户禁止伪装。
          </div>
        </FormItem>

        <FormItem label="目标类型">
          <RadioGroup v-model:value="targetType" button-style="solid">
            <RadioButton value="users">指定用户</RadioButton>
            <RadioButton value="groups">指定群</RadioButton>
            <RadioButton value="channels">指定 channel（高级）</RadioButton>
          </RadioGroup>
        </FormItem>

        <FormItem :label="targetLabel">
          <Textarea
            v-model:value="idsInput"
            :placeholder="`一行一个，或用 , ; 空格分隔；最多 ${limits[targetType]} 个`"
            :rows="3"
            :status="idsOverLimit ? 'error' : ''"
          />
          <div class="mt-1 text-xs text-gray-500">
            已识别 {{ parsedIds.length }} 个 ID
            <span v-if="idsOverLimit" class="text-red-500">
              · 超过上限 {{ limits[targetType] }}
            </span>
          </div>
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

        <Space>
          <Button
            :disabled="!canSend"
            :loading="sending"
            type="primary"
            @click="handleSend"
          >
            发送
          </Button>
          <Button :disabled="sending" @click="handleReset">重置</Button>
        </Space>
      </Form>
    </Card>

    <Card v-if="result" title="发送结果">
      <Space :size="32" class="mb-4">
        <Statistic title="目标数" :value="result.total_targets" />
        <Statistic
          title="成功"
          :value="result.ok_count"
          :value-style="{ color: '#3f8600' }"
        />
        <Statistic
          title="失败"
          :value="result.fail_count"
          :value-style="{
            color: result.fail_count > 0 ? '#cf1322' : '#999',
          }"
        />
      </Space>
      <div class="mb-3 text-xs text-gray-500">
        request_id：<code>{{ result.request_id }}</code>
      </div>
      <Table
        :columns="[
          { title: '目标', dataIndex: 'target', width: 160 },
          { title: '结果', key: 'ok', width: 80 },
          { title: 'channel_id', dataIndex: 'channel_id', width: 140 },
          { title: 'message_id', dataIndex: 'message_id' },
          { title: '错误', key: 'error' },
        ]"
        :data-source="result.results"
        :pagination="{ pageSize: 50 }"
        row-key="target"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'ok'">
            <Tag v-if="record.ok" color="green">成功</Tag>
            <Tag v-else color="red">失败</Tag>
          </template>
          <template v-else-if="column.key === 'error'">
            <span v-if="record.error_message" class="text-red-500">
              {{ record.error_code }}: {{ record.error_message }}
            </span>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>
