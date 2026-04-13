<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';
import type { LogApi } from '#/api/platform/log';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { Form, Input, InputNumber } from 'ant-design-vue';

import { createLog, getLog } from '#/api/platform/log';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const formRef = ref();
const formData = ref<Partial<LogApi.LogRequest & { id?: number }>>({
  id: undefined,
  clientId: undefined,
  apiId: undefined,
  requestUrl: undefined,
  requestParams: undefined,
  responseBody: undefined,
  userIp: undefined,
  duration: undefined,
  resultCode: undefined,
});

const rules: Record<string, Rule[]> = {
  clientId: [{ required: true, message: '客户端ID不能为空', trigger: 'blur' }],
  apiId: [{ required: true, message: 'API ID不能为空', trigger: 'blur' }],
};

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.detail', ['开放平台调用日志'])
    : $t('ui.actionTitle.create', ['开放平台调用日志']);
});

function resetForm() {
  formData.value = {
    id: undefined,
    clientId: undefined,
    apiId: undefined,
    requestUrl: undefined,
    requestParams: undefined,
    responseBody: undefined,
    userIp: undefined,
    duration: undefined,
    resultCode: undefined,
  };
  formRef.value?.resetFields();
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
    modalApi.lock();
    try {
      const data = formData.value;
      if (!data.clientId || !data.apiId) {
        return;
      }
      await createLog({
        clientId: data.clientId,
        apiId: data.apiId,
        requestUrl: data.requestUrl,
        requestParams: data.requestParams,
        responseBody: data.responseBody,
        userIp: data.userIp,
        duration: data.duration,
        resultCode: data.resultCode,
      });
      await modalApi.close();
      emit('success');
      message.success({ content: $t('ui.actionMessage.operationSuccess') });
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetForm();
      return;
    }
    let data = modalApi.getData<LogApi.Log>();
    if (!data) {
      return;
    }
    if (data.id) {
      modalApi.lock();
      try {
        data = await getLog(data.id);
      } finally {
        modalApi.unlock();
      }
    }
    formData.value = {
      id: data.id,
      clientId: data.clientId,
      apiId: data.apiId,
      requestUrl: data.requestUrl,
      requestParams: data.requestParams,
      responseBody: data.responseBody,
      userIp: data.userIp,
      duration: data.duration,
      resultCode: data.resultCode,
    };
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 18 }"
    >
      <Form.Item label="客户端ID" name="clientId">
        <InputNumber v-model:value="formData.clientId" class="w-full" placeholder="请输入客户端ID" />
      </Form.Item>
      <Form.Item label="API ID" name="apiId">
        <InputNumber v-model:value="formData.apiId" class="w-full" placeholder="请输入API ID" />
      </Form.Item>
      <Form.Item label="请求地址" name="requestUrl">
        <Input v-model:value="formData.requestUrl" placeholder="请输入请求地址" />
      </Form.Item>
      <Form.Item label="请求参数" name="requestParams">
        <Input v-model:value="formData.requestParams" placeholder="请输入请求参数" />
      </Form.Item>
      <Form.Item label="响应内容" name="responseBody">
        <Input v-model:value="formData.responseBody" placeholder="请输入响应内容" />
      </Form.Item>
      <Form.Item label="用户IP" name="userIp">
        <Input v-model:value="formData.userIp" placeholder="请输入用户IP" />
      </Form.Item>
      <Form.Item label="耗时(ms)" name="duration">
        <InputNumber v-model:value="formData.duration" class="w-full" placeholder="请输入耗时" />
      </Form.Item>
      <Form.Item label="结果码" name="resultCode">
        <InputNumber v-model:value="formData.resultCode" class="w-full" placeholder="请输入结果码" />
      </Form.Item>
    </Form>
  </Modal>
</template>
