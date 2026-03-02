<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';
import type { ClientApiApi } from '#/api/platform/clientapi';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { Tinymce as RichTextarea } from '#/components/tinymce';
import { ImageUpload, FileUpload } from "#/components/upload";
import { message, Tabs, Form, Input, Textarea, Select, RadioGroup, Radio, CheckboxGroup, Checkbox, DatePicker, TreeSelect } from 'ant-design-vue';

import { $t } from '#/locales';
import { getClientApi, createClientApi, updateClientApi } from '#/api/platform/clientapi';

const emit = defineEmits(['success']);

const formRef = ref();
const formData = ref<Partial<ClientApiApi.ClientApi>>({
        id: undefined,
        clientId: undefined,
        apiId: undefined,
        status: undefined,
        rateLimitPerMin: undefined,
        rateLimitPerDay: undefined,
        isCustomPrice: 0,
        customPrice: undefined,
        startTime: undefined,
        endTime: undefined,
});
const rules: Record<string, Rule[]> = {
        clientId: [{ required: true, message: '客户端不能为空', trigger: 'blur' }],
        apiId: [{ required: true, message: 'API ID不能为空', trigger: 'blur' }],
        status: [{ required: true, message: '是否启用不能为空', trigger: 'blur' }],
        isCustomPrice: [{ required: true, message: '是否自定义价格不能为空', trigger: 'blur' }],
};
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['客户端-API授权关系表（含自定义定价）'])
    : $t('ui.actionTitle.create', ['客户端-API授权关系表（含自定义定价）']);
});


/** 重置表单 */
function resetForm() {
  formData.value = {
            id: undefined,
            clientId: undefined,
            apiId: undefined,
            status: undefined,
            rateLimitPerMin: undefined,
            rateLimitPerDay: undefined,
            isCustomPrice: undefined,
            customPrice: undefined,
            startTime: undefined,
            endTime: undefined,
  };
  formRef.value?.resetFields();
}


const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
        modalApi.lock();
    // 提交表单
    const data = formData.value as ClientApiApi.ClientApi;
        try {
      await (formData.value?.id ? updateClientApi(data) : createClientApi(data));
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
    let data = modalApi.getData<ClientApiApi.ClientApi>();
    if (!data) {
      return;
    }
    if (data.id) {
      modalApi.lock();
      try {
        data = await getClientApi(data.id);
      } finally {
        modalApi.unlock();
      }
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
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 18 }"
    >
            <Form.Item label="客户端" name="clientId">
              <Input v-model:value="formData.clientId" placeholder="请输入客户端" />
            </Form.Item>
            <Form.Item label="API ID" name="apiId">
              <Input v-model:value="formData.apiId" placeholder="请输入API ID" />
            </Form.Item>
           
     
            <Form.Item label="是否自定义价格" name="isCustomPrice">
              <RadioGroup v-model:value="formData.isCustomPrice">
                  <Radio
                          v-for="dict in getDictOptions(DICT_TYPE.PLATFORM_BOOL, 'number')"
                          :key="dict.value"
                          :value="dict.value"
                  >
                    {{ dict.label }}
                  </Radio>
              </RadioGroup>
            </Form.Item>
            <Form.Item v-if="formData.isCustomPrice == 1" label="自定义价格" name="customPrice">
              <Input suffix="分" v-model:value="formData.customPrice" placeholder="请输入自定义价格" />
            </Form.Item>
                   <Form.Item label="每分钟限流" name="rateLimitPerMin">
              <Input suffix="覆盖 API 默认配置"  v-model:value="formData.rateLimitPerMin" placeholder="请输入每分钟限流" />
            </Form.Item>
            <Form.Item label="每日配额" name="rateLimitPerDay">
              <Input suffix="覆盖客户端默认配置" v-model:value="formData.rateLimitPerDay" placeholder="请输入每日配额（覆盖客户端默认配置）" />
            </Form.Item>
            <Form.Item label="授权开始时间" name="startTime">
              <DatePicker
                      v-model:value="formData.startTime"
                      valueFormat="x"
                      placeholder="选择授权开始时间"
              />
            </Form.Item>
            <Form.Item label="授权结束时间（为空表示永久）" name="endTime">
              <DatePicker
                      v-model:value="formData.endTime"
                      valueFormat="x"
                      placeholder="选择授权结束时间（为空表示永久）"
              />
            </Form.Item>
             <Form.Item label="是否启用" name="status">
              <RadioGroup v-model:value="formData.status">
                  <Radio
                          v-for="dict in getDictOptions(DICT_TYPE.PLATFORM_BOOL, 'number')"
                          :key="dict.value"
                          :value="dict.value"
                  >
                    {{ dict.label }}
                  </Radio>
              </RadioGroup>
            </Form.Item>
    </Form>
      </Modal>
</template>
