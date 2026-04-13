<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';
import type { ApiApi } from '#/api/platform/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { message } from 'ant-design-vue';
import { Form, Input, Radio, RadioGroup, Textarea } from 'ant-design-vue';

import { createApi, getApi, updateApi } from '#/api/platform/api';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const formRef = ref();
const formData = ref<Partial<ApiApi.Api>>({
  id: undefined,
  code: undefined,
  name: undefined,
  description: undefined,
  price: 0,
  status: 1,
});
const rules: Record<string, Rule[]> = {
  code: [{ required: true, message: 'API 编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: 'API 名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
  price: [{ required: true, message: '价格不能为空', trigger: 'blur' }],
};
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['开放平台API定义'])
    : $t('ui.actionTitle.create', ['开放平台API定义']);
});


/** 重置表单 */
function resetForm() {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
    description: undefined,
    price: 0,
    status: 1,
  };
  formRef.value?.resetFields();
}


const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
        modalApi.lock();
    // 提交表单
    const data = formData.value as ApiApi.Api;
        try {
      await (formData.value?.id ? updateApi(data) : createApi(data));
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
    let data = modalApi.getData<ApiApi.Api>();
    if (!data) {
      return;
    }
    if (data.id) {
      modalApi.lock();
      try {
        data = await getApi(data.id);
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
            <Form.Item label="API 编码" name="code">
              <Input v-model:value="formData.code" placeholder="请输入API 编码" />
            </Form.Item>
            <Form.Item label="API 名称" name="name">
              <Input v-model:value="formData.name" placeholder="请输入API 名称" />
            </Form.Item>
            <Form.Item label="API 描述" name="description">
              <Textarea v-model="formData.description" height="500px" ></Textarea>
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
         
            <Form.Item label="价格（分）" name="price">
              <Input v-model:value="formData.price" placeholder="请输入价格（分）" />
            </Form.Item>
    </Form>
      </Modal>
</template>
