<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';
import type { ApiApi } from '#/api/platform/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { Tinymce as RichTextarea } from '#/components/tinymce';
import { ImageUpload, FileUpload } from "#/components/upload";
import { message, Tabs, Form, Input, Textarea, Select, RadioGroup, Radio, CheckboxGroup, Checkbox, DatePicker, TreeSelect } from 'ant-design-vue';

import { $t } from '#/locales';
import { getApi, createApi, updateApi } from '#/api/platform/api';
import { Option } from 'ant-design-vue/es/vc-select';

const emit = defineEmits(['success']);

const formRef = ref();
const formData = ref<Partial<ApiApi.Api>>({
        id: undefined,
        apiCode: undefined,
        apiName: undefined,
        apiPath: undefined,
        httpMethod: undefined,
        category: undefined,
        description: undefined,
        status: undefined,
        isPublic: undefined,
        rateLimitPerMin: undefined,
        chargeType: undefined,
        defaultPrice: undefined,
});
const rules: Record<string, Rule[]> = {
        apiCode: [{ required: true, message: 'API 编码不能为空', trigger: 'blur' }],
        apiName: [{ required: true, message: 'API 名称不能为空', trigger: 'blur' }],
        apiPath: [{ required: true, message: 'API 路径不能为空', trigger: 'blur' }],
        httpMethod: [{ required: true, message: 'HTTP 方法不能为空', trigger: 'blur' }],
        status: [{ required: true, message: '状态不能为空', trigger: 'blur' }],
        isPublic: [{ required: true, message: '是否公开不能为空', trigger: 'blur' }],
        rateLimitPerMin: [{ required: true, message: '每分钟限流不能为空', trigger: 'blur' }],
        chargeType: [{ required: true, message: '计费类型不能为空', trigger: 'change' }],
        defaultPrice: [{ required: true, message: '默认单价（分）不能为空', trigger: 'blur' }],
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
            apiCode: undefined,
            apiName: undefined,
            apiPath: undefined,
            httpMethod: undefined,
            category: undefined,
            description: undefined,
            status: undefined,
            isPublic: undefined,
            rateLimitPerMin: undefined,
            chargeType: undefined,
            defaultPrice: undefined,
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
            <Form.Item label="API 编码" name="apiCode">
              <Input v-model:value="formData.apiCode" placeholder="请输入API 编码" />
            </Form.Item>
            <Form.Item label="API 名称" name="apiName">
              <Input v-model:value="formData.apiName" placeholder="请输入API 名称" />
            </Form.Item>
            <Form.Item label="API 路径" name="apiPath">
              <Input v-model:value="formData.apiPath" placeholder="请输入API 路径" />
            </Form.Item>
            <Form.Item label="HTTP 方法"   name="httpMethod">
                <Select  v-model:value="formData.httpMethod">
                    <Option      v-for="dict in getDictOptions(DICT_TYPE.PLATFORM_REQUEST_METHOD)"
                          :key="dict.value"
                          :value="dict.value"
                  >
                    {{ dict.label }}
                  </Option>
                </Select>

            </Form.Item>
            <Form.Item label="API 分类" name="category">
              <Input v-model:value="formData.category" placeholder="请输入API 分类" />
            </Form.Item>
            <Form.Item label="API 描述" name="description">
              <Textarea v-model="formData.description" height="500px" ></Textarea>
            </Form.Item>
            <Form.Item label="状态" name="status">
              <RadioGroup v-model:value="formData.status">
                  <Radio
                          v-for="dict in getDictOptions(DICT_TYPE.PLATFORM_CLIENT_STATUS, 'number')"
                          :key="dict.value"
                          :value="dict.value"
                  >
                    {{ dict.label }}
                  </Radio>
              </RadioGroup>
            </Form.Item>
         
            <Form.Item label="每分钟限流" name="rateLimitPerMin">
              <Input v-model:value="formData.rateLimitPerMin" placeholder="请输入每分钟限流" />
            </Form.Item>
            <Form.Item label="计费类型" name="chargeType">
              <Select v-model:value="formData.chargeType" placeholder="请选择计费类型">
                  <Select.Option
                          v-for="dict in getDictOptions(DICT_TYPE.PLATFORM_CHARGE_TYPE, 'number')"
                          :key="dict.value"
                          :value="dict.value"
                  >
                    {{ dict.label }}
                  </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="默认单价（分）" name="defaultPrice">
              <Input v-model:value="formData.defaultPrice" placeholder="请输入默认单价（分）" />
            </Form.Item>
    </Form>
      </Modal>
</template>
