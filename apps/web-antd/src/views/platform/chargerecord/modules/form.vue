<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';
import type { ChargeRecordApi } from '#/api/platform/chargerecord';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { Form, Input, InputNumber } from 'ant-design-vue';

import {
  createChargeRecord,
  getChargeRecord,
} from '#/api/platform/chargerecord';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const formRef = ref();
const formData = ref<Partial<ChargeRecordApi.ChargeRecordRequest & { id?: number }>>({
  id: undefined,
  clientId: undefined,
  apiId: undefined,
  orderId: undefined,
  apiCode: undefined,
  price: undefined,
  amount: undefined,
  status: undefined,
});

const rules: Record<string, Rule[]> = {
  clientId: [{ required: true, message: '客户端ID不能为空', trigger: 'blur' }],
  apiId: [{ required: true, message: 'API ID不能为空', trigger: 'blur' }],
};

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.detail', ['开放平台计费记录'])
    : $t('ui.actionTitle.create', ['开放平台计费记录']);
});

function resetForm() {
  formData.value = {
    id: undefined,
    clientId: undefined,
    apiId: undefined,
    orderId: undefined,
    apiCode: undefined,
    price: undefined,
    amount: undefined,
    status: undefined,
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
      await createChargeRecord({
        clientId: data.clientId,
        apiId: data.apiId,
        orderId: data.orderId,
        apiCode: data.apiCode,
        price: data.price,
        amount: data.amount,
        status: data.status,
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
    let data = modalApi.getData<ChargeRecordApi.ChargeRecord>();
    if (!data) {
      return;
    }
    if (data.id) {
      modalApi.lock();
      try {
        data = await getChargeRecord(data.id);
      } finally {
        modalApi.unlock();
      }
    }
    formData.value = {
      id: data.id,
      clientId: data.clientId,
      apiId: data.apiId,
      orderId: data.orderId,
      apiCode: data.apiCode,
      price: data.price,
      amount: data.amount,
      status: data.status,
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
      <Form.Item label="订单号" name="orderId">
        <Input v-model:value="formData.orderId" placeholder="请输入订单号" />
      </Form.Item>
      <Form.Item label="API 编码" name="apiCode">
        <Input v-model:value="formData.apiCode" placeholder="请输入API 编码" />
      </Form.Item>
      <Form.Item label="计费金额(分)" name="price">
        <InputNumber v-model:value="formData.price" class="w-full" placeholder="请输入计费金额" />
      </Form.Item>
      <Form.Item label="数量" name="amount">
        <InputNumber v-model:value="formData.amount" class="w-full" placeholder="请输入数量" />
      </Form.Item>
      <Form.Item label="状态" name="status">
        <InputNumber v-model:value="formData.status" class="w-full" placeholder="请输入状态" />
      </Form.Item>
    </Form>
  </Modal>
</template>
