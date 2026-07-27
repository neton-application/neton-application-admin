<script lang="ts" setup>
import type { MemberUserApi } from '#/api/member/user';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getUser, updateUserPassword } from '#/api/member/user';
import { $t } from '#/locales';

import { usePasswordFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MemberUserApi.User>();
const getTitle = computed(() => {
  return $t('ui.actionTitle.edit', ['会员密码']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: usePasswordFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const data = await formApi.getValues();
    try {
      // 只送 id + 新密码；confirmPassword 仅前端一致性校验用，不出网。
      await updateUserPassword({
        id: data.id,
        password: data.password,
      });
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      // 关闭即清空，别把明文密码留在表单状态里。
      formData.value = undefined;
      await formApi.resetForm();
      return;
    }
    const data = modalApi.getData<MemberUserApi.User>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getUser(data.id);
      // 只回填只读的身份字段；密码框保持空白（后端从不下发密码）。
      await formApi.setValues({
        id: formData.value?.id,
        nickname: formData.value?.nickname,
      });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/2">
    <Form class="mx-4" />
  </Modal>
</template>
