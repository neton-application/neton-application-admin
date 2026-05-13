<script setup lang="ts">
import type { PrivchatBotApi } from '#/api/privchat/bot';

import { computed, ref, watch } from 'vue';

import {
  Alert,
  Button,
  Drawer,
  Form,
  FormItem,
  message,
  Textarea,
} from 'ant-design-vue';

import { getBotDetail, updateBotMenu } from '#/api/privchat/bot';

interface Props {
  open: boolean;
  botId: number | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:open': [open: boolean];
  saved: [];
}>();

const loading = ref(false);
const saving = ref(false);
const rawText = ref('');
const validateError = ref<string | null>(null);

const EMPTY_TEMPLATE = JSON.stringify(
  {
    version: 1,
    items: [
      {
        id: 'balance',
        title: '查询余额',
        action: {
          type: 'transfer',
          route: 'bot/menu/click',
          body: { action: 'balance' },
        },
      },
      {
        id: 'support',
        title: '联系客服',
        action: {
          type: 'message',
          text: '联系客服',
          metadata: { command: 'support/start' },
        },
      },
      {
        id: 'wallet',
        title: '打开钱包',
        action: {
          type: 'web',
          url: 'https://wallet.example/app',
          open_mode: 'in_app_webview',
        },
      },
    ],
  },
  null,
  2,
);

watch(
  () => [props.open, props.botId] as const,
  async ([open, botId]) => {
    if (!open || !botId) return;
    loading.value = true;
    rawText.value = '';
    validateError.value = null;
    try {
      const detail = await getBotDetail(botId);
      rawText.value = detail.menu_schema
        ? JSON.stringify(detail.menu_schema, null, 2)
        : EMPTY_TEMPLATE;
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? e?.message ?? '加载失败');
    } finally {
      loading.value = false;
    }
  },
);

const parsed = computed<PrivchatBotApi.BotMenuSchema | null>(() => {
  if (!rawText.value.trim()) return null;
  try {
    const obj = JSON.parse(rawText.value);
    validateError.value = null;
    return obj;
  } catch (e: any) {
    validateError.value = e?.message ?? 'JSON 解析失败';
    return null;
  }
});

const canSave = computed(
  () => !saving.value && !loading.value && validateError.value === null,
);

async function handleSave() {
  if (!props.botId || !canSave.value) return;
  saving.value = true;
  try {
    // 空字符串视为清空菜单
    const menu = rawText.value.trim() ? parsed.value : null;
    await updateBotMenu(props.botId, { menu_schema: menu });
    message.success('已保存');
    emit('saved');
    emit('update:open', false);
  } catch (e: any) {
    message.error(e?.response?.data?.message ?? e?.message ?? '保存失败');
  } finally {
    saving.value = false;
  }
}

function handleClear() {
  rawText.value = '';
}

function handleResetTemplate() {
  rawText.value = EMPTY_TEMPLATE;
}

function handleClose() {
  if (saving.value) return;
  emit('update:open', false);
}
</script>

<template>
  <Drawer
    :open="open"
    :title="`配置菜单 · Bot #${botId ?? ''}`"
    :width="680"
    @close="handleClose"
  >
    <Alert
      class="mb-4"
      message="菜单 schema v1：JSON 格式，action.type ∈ {transfer, message, web}；空 = 清空菜单。"
      type="info"
      show-icon
    />

    <Form layout="vertical">
      <FormItem
        label="Menu Schema (JSON)"
        :validate-status="validateError ? 'error' : ''"
        :help="validateError ?? undefined"
      >
        <Textarea
          v-model:value="rawText"
          placeholder="留空 = 清空菜单。详见 BOT_INTERACTION_SPEC §8。"
          :rows="20"
          :disabled="loading"
        />
      </FormItem>

      <FormItem>
        <Button
          :disabled="!canSave"
          :loading="saving"
          type="primary"
          @click="handleSave"
        >
          保存
        </Button>
        <Button class="ml-2" @click="handleResetTemplate">载入示例</Button>
        <Button class="ml-2" @click="handleClear">清空</Button>
        <Button class="ml-2" @click="handleClose">取消</Button>
      </FormItem>
    </Form>
  </Drawer>
</template>
