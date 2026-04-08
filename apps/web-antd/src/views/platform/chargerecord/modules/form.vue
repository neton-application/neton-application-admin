<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';
import type { ChargeRecordApi } from '#/api/platform/chargerecord';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { message } from 'ant-design-vue';
import { DatePicker, Form, Input, Radio, RadioGroup, Select } from 'ant-design-vue';

import {
  createChargeRecord,
  getChargeRecord,
  updateChargeRecord,
} from '#/api/platform/chargerecord';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const formRef = ref();
const formData = ref<Partial<ChargeRecordApi.ChargeRecord>>({
        id: undefined,
        clientId: undefined,
        apiId: undefined,
        traceId: undefined,
        chargeType: undefined,
        price: undefined,
        isCustomPrice: undefined,
        balanceBefore: undefined,
        balanceAfter: undefined,
        chargeStatus: undefined,
        failureReason: undefined,
        chargeTime: undefined,
});
const rules: Record<string, Rule[]> = {
        clientId: [{ required: true, message: '客户端ID不能为空', trigger: 'blur' }],
        apiId: [{ required: true, message: 'API ID不能为空', trigger: 'blur' }],
        traceId: [{ required: true, message: '请求跟踪ID（关联日志）不能为空', trigger: 'blur' }],
        chargeType: [{ required: true, message: '计费类型不能为空', trigger: 'change' }],
        price: [{ required: true, message: '本次计费金额（分）不能为空', trigger: 'blur' }],
        isCustomPrice: [{ required: true, message: '是否使用自定义价格不能为空', trigger: 'blur' }],
        balanceBefore: [{ required: true, message: '扣费前余额（分）不能为空', trigger: 'blur' }],
        balanceAfter: [{ required: true, message: '扣费后余额（分）不能为空', trigger: 'blur' }],
        chargeStatus: [{ required: true, message: '是否扣费成功不能为空', trigger: 'blur' }],
        chargeTime: [{ required: true, message: '扣费时间不能为空', trigger: 'blur' }],
};
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['开放平台计费记录'])
    : $t('ui.actionTitle.create', ['开放平台计费记录']);
});


/** 重置表单 */
function resetForm() {
  formData.value = {
            id: undefined,
            clientId: undefined,
            apiId: undefined,
            traceId: undefined,
            chargeType: undefined,
            price: undefined,
            isCustomPrice: undefined,
            balanceBefore: undefined,
            balanceAfter: undefined,
            chargeStatus: undefined,
            failureReason: undefined,
            chargeTime: undefined,
  };
  formRef.value?.resetFields();
}


const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
        modalApi.lock();
    // 提交表单
    const data = formData.value as ChargeRecordApi.ChargeRecord;
        try {
      await (formData.value?.id ? updateChargeRecord(data) : createChargeRecord(data));
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
    formData.value = data;
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
              <Input v-model:value="formData.clientId" placeholder="请输入客户端ID" />
            </Form.Item>
            <Form.Item label="API ID" name="apiId">
              <Input v-model:value="formData.apiId" placeholder="请输入API ID" />
            </Form.Item>
            <Form.Item label="请求跟踪ID（关联日志）" name="traceId">
              <Input v-model:value="formData.traceId" placeholder="请输入请求跟踪ID（关联日志）" />
            </Form.Item>
            <Form.Item label="计费类型" name="chargeType">
              <Select v-model:value="formData.chargeType" placeholder="请选择计费类型">
                  <Select.Option
                          v-for="dict in getDictOptions(DICT_TYPE.PLATFORM_CHARGE_TYPE, 'number')"
                          :key="String(dict.value)"
                          :value="dict.value"
                  >
                    {{ dict.label }}
                  </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="本次计费金额（分）" name="price">
              <Input v-model:value="formData.price" placeholder="请输入本次计费金额（分）" />
            </Form.Item>
            <Form.Item label="是否使用自定义价格" name="isCustomPrice">
              <RadioGroup v-model:value="formData.isCustomPrice">
                  <Radio
                          v-for="dict in getDictOptions(DICT_TYPE.PLATFORM_BOOL, 'number')"
                          :key="String(dict.value)"
                          :value="dict.value"
                  >
                    {{ dict.label }}
                  </Radio>
              </RadioGroup>
            </Form.Item>
            <Form.Item label="扣费前余额（分）" name="balanceBefore">
              <Input v-model:value="formData.balanceBefore" placeholder="请输入扣费前余额（分）" />
            </Form.Item>
            <Form.Item label="扣费后余额（分）" name="balanceAfter">
              <Input v-model:value="formData.balanceAfter" placeholder="请输入扣费后余额（分）" />
            </Form.Item>
            <Form.Item label="是否扣费成功" name="chargeStatus">
              <RadioGroup v-model:value="formData.chargeStatus">
                  <Radio
                          v-for="dict in getDictOptions(DICT_TYPE.PLATFORM_BOOL, 'number')"
                          :key="String(dict.value)"
                          :value="dict.value"
                  >
                    {{ dict.label }}
                  </Radio>
              </RadioGroup>
            </Form.Item>
            <Form.Item label="失败原因" name="failureReason">
              <Input v-model:value="formData.failureReason" placeholder="请输入失败原因" />
            </Form.Item>
            <Form.Item label="扣费时间" name="chargeTime">
              <DatePicker
                      v-model:value="formData.chargeTime"
                      valueFormat="x"
                      placeholder="选择扣费时间"
              />
            </Form.Item>
    </Form>
      </Modal>
</template>
