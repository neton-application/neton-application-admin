<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';
import type { ClientApi } from '#/api/platform/client';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import {
  Button,
  Form,
  Input,
  message,
  Modal as AntModal,
  Radio,
  RadioGroup,
  Textarea,
} from 'ant-design-vue';

import {
  createClient,
  generateAppId,
  getClient,
  updateClient,
} from '#/api/platform/client';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const formRef = ref();
const isGeneratingClientId = ref(false);
const formData = ref<Partial<ClientApi.Client>>({
  id: undefined,
  appId: undefined,
  appSecret: undefined,
  name: undefined,
  remark: undefined,
  contactName: undefined,
  contactMobile: undefined,
  status: 1,
});
const rules: Record<string, Rule[]> = {
  appId: [{ required: true, message: '应用标识不能为空', trigger: 'blur' }],
  appSecret: [{ required: true, message: '应用密钥不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '客户端名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
};
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['开放平台客户端'])
    : $t('ui.actionTitle.create', ['开放平台客户端']);
});


/** 重置表单 */
function resetForm() {
  formData.value = {
    id: undefined,
    appId: undefined,
    appSecret: undefined,
    name: undefined,
    remark: undefined,
    contactName: undefined,
    contactMobile: undefined,
    status: 1,
  };
  formRef.value?.resetFields();
}

async function generateClientId() {
  if (isGeneratingClientId.value) {
    return;
  }
  isGeneratingClientId.value = true;
  try {
    const { appId } = await generateAppId();
    formData.value.appId = appId;
  } finally {
    isGeneratingClientId.value = false;
  }
}

function handleRegenerateClientId() {
  AntModal.confirm({
    title: '重新生成客户端唯一标识',
    content: '重新生成将覆盖当前客户端唯一标识，是否继续？',
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      await generateClientId();
      message.success('客户端唯一标识已重新生成');
    },
  });
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
        modalApi.lock();
    // 提交表单
    const data = formData.value as ClientApi.Client;
        try {
      await (formData.value?.id ? updateClient(data) : createClient(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
      });
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetForm()
      return;
    }
    // 加载数据
    let data = modalApi.getData<ClientApi.Client>();
    if (!data || !data.id) {
      resetForm();
      if (data) {
        formData.value = data;
      }
      await generateClientId();
      return;
    }
    modalApi.lock();
    try {
      data = await getClient(data.id);
    } finally {
      modalApi.unlock();
    }
    formData.value = data;
  },
});
</script>


<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 8 }"
      :wrapper-col="{ span: 16 }"
    >
            <Form.Item label="客户端唯一标识"    name="clientId">
              <div class="flex gap-2">
                <Input :disabled="true" 
                  v-model:value="formData.appId"
                  class="flex-1"
                  placeholder="请输入应用标识"
                />
                <Button
                  v-if="formData.id"
                  :loading="isGeneratingClientId"
                  @click="handleRegenerateClientId"
                >
                  重新生成
                </Button>
              </div>
            </Form.Item>
            <Form.Item label="应用密钥" name="appSecret">
              <Input v-model:value="formData.appSecret" placeholder="请输入应用密钥" />
            </Form.Item>
            <Form.Item label="客户端名称" name="name">
              <Input v-model:value="formData.name" placeholder="请输入客户端名称" />
            </Form.Item>
              <Form.Item label="状态" name="status">
              <RadioGroup v-model:value="formData.status">
                  <Radio
                          v-for="dict in getDictOptions(DICT_TYPE.PLATFORM_CLIENT_STATUS, 'number')"
                          :key="String(dict.value)"
                          :value="dict.value"
                  >
                    {{ dict.label }}
                  </Radio>
              </RadioGroup>
            </Form.Item>
            
            <Form.Item label="客户端备注" name="remark">
              <Textarea  v-model="formData.remark" height="500px" />
            </Form.Item>
            <Form.Item label="联系人姓名" name="contactName">
              <Input v-model:value="formData.contactName" placeholder="请输入联系人姓名" />
            </Form.Item>
            <Form.Item label="联系人手机号" name="contactMobile">
              <Input v-model:value="formData.contactMobile" placeholder="请输入联系人手机号" />
            </Form.Item>
    </Form>
      </Modal>
</template>
