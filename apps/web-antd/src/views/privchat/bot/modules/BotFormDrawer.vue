<script setup lang="ts">
import type { PrivchatBotApi } from '#/api/privchat/bot';

import { computed, ref, watch } from 'vue';

import {
  Alert,
  Button,
  Drawer,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Textarea,
} from 'ant-design-vue';

import { createBot, updateBot } from '#/api/privchat/bot';

interface Props {
  open: boolean;
  /** 非空 = 编辑模式；null = 创建。 */
  bot?: null | PrivchatBotApi.BotDetail;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:open': [open: boolean];
  saved: [];
}>();

const isEdit = computed(() => !!props.bot);
const submitting = ref(false);

const form = ref<{
  name: string;
  username?: string;
  description?: string;
  owner_user_id?: number;
  reason?: string;
}>({
  name: '',
});

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    if (props.bot) {
      form.value = {
        name: props.bot.name ?? '',
        username: props.bot.username,
        description: props.bot.description,
        owner_user_id: props.bot.owner_user_id,
      };
    } else {
      form.value = {
        name: '',
        username: undefined,
        description: undefined,
        owner_user_id: undefined,
        reason: undefined,
      };
    }
  },
);

const canSubmit = computed(() => {
  if (submitting.value) return false;
  if (!form.value.name.trim()) return false;
  if (!isEdit.value && !form.value.owner_user_id) return false;
  return true;
});

/** username 规范化：去空白 + 强制小写。后端 controller 也会再做一遍。 */
function normalizeUsername(v?: string): string | undefined {
  if (!v) return undefined;
  const t = v.trim().toLowerCase();
  return t || undefined;
}

async function handleSubmit() {
  if (!canSubmit.value) return;
  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateBot(props.bot!.id, {
        name: form.value.name,
        username: normalizeUsername(form.value.username),
        description: form.value.description,
        reason: form.value.reason,
      });
      message.success('已更新');
    } else {
      await createBot({
        name: form.value.name,
        username: normalizeUsername(form.value.username),
        description: form.value.description,
        owner_user_id: form.value.owner_user_id!,
        reason: form.value.reason,
      });
      message.success('已创建');
    }
    emit('saved');
    emit('update:open', false);
  } catch (e: any) {
    message.error(e?.response?.data?.message ?? e?.message ?? '保存失败');
  } finally {
    submitting.value = false;
  }
}

function handleClose() {
  if (submitting.value) return;
  emit('update:open', false);
}
</script>

<template>
  <Drawer
    :open="open"
    :title="isEdit ? `编辑机器人 #${bot?.id}` : '创建机器人'"
    :width="540"
    @close="handleClose"
  >
    <Alert
      v-if="!isEdit"
      class="mb-4"
      message="创建后会自动生成一个 PrivChat 机器人账号；头像创建后请到「会员中心」单独维护。"
      type="info"
      show-icon
    />

    <Form layout="vertical">
      <FormItem label="名称" required>
        <Input
          v-model:value="form.name"
          placeholder="机器人显示名"
          :maxlength="128"
        />
      </FormItem>

      <FormItem label="用户名">
        <Input
          v-model:value="form.username"
          placeholder="@username（可选，自动转小写）"
          :maxlength="128"
          @input="
            (e: any) => {
              const v = e?.target?.value ?? '';
              if (v && v !== v.toLowerCase()) form.username = v.toLowerCase();
            }
          "
        />
      </FormItem>

      <FormItem label="简介">
        <Textarea
          v-model:value="form.description"
          placeholder="机器人简介，可选"
          :rows="3"
          :maxlength="512"
          show-count
        />
      </FormItem>

      <FormItem v-if="!isEdit" label="所属用户 user_id" required>
        <InputNumber
          v-model:value="form.owner_user_id"
          :min="1"
          :precision="0"
          placeholder="谁拥有/创建这个机器人的 user_id"
          style="width: 100%"
        />
      </FormItem>

      <FormItem label="备注（reason）">
        <Input
          v-model:value="form.reason"
          placeholder="审计文本"
          :maxlength="200"
        />
      </FormItem>

      <FormItem>
        <Button
          :disabled="!canSubmit"
          :loading="submitting"
          type="primary"
          @click="handleSubmit"
        >
          {{ isEdit ? '保存' : '创建' }}
        </Button>
        <Button class="ml-2" @click="handleClose">取消</Button>
      </FormItem>
    </Form>
  </Drawer>
</template>
