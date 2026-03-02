<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';
import type { LogApi } from '#/api/platform/log';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { getDictOptions } from '@vben/hooks';
import { Tinymce as RichTextarea } from '#/components/tinymce';
import { ImageUpload, FileUpload } from "#/components/upload";
import { message, Tabs, Form, Input, Textarea, Select, RadioGroup, Radio, CheckboxGroup, Checkbox, DatePicker, TreeSelect } from 'ant-design-vue';

import { $t } from '#/locales';
import { getLog, createLog, updateLog } from '#/api/platform/log';

const emit = defineEmits(['success']);

const formRef = ref();
const formData = ref<Partial<LogApi.Log>>({
        id: undefined,
        traceId: undefined,
        clientId: undefined,
        apiId: undefined,
        apiCode: undefined,
        apiPath: undefined,
        httpMethod: undefined,
        requestHeaders: undefined,
        requestParams: undefined,
        requestBody: undefined,
        requestIp: undefined,
        requestUserAgent: undefined,
        responseStatus: undefined,
        responseBody: undefined,
        durationMs: undefined,
        success: undefined,
        errorCode: undefined,
        errorMsg: undefined,
        chargePrice: undefined,
        chargeStatus: undefined,
        requestTime: undefined,
});
const rules: Record<string, Rule[]> = {
        traceId: [{ required: true, message: '请求跟踪ID（对应 X-Trace-Id）不能为空', trigger: 'blur' }],
        clientId: [{ required: true, message: '客户端ID不能为空', trigger: 'blur' }],
        apiPath: [{ required: true, message: 'API 路径不能为空', trigger: 'blur' }],
        httpMethod: [{ required: true, message: 'HTTP 方法不能为空', trigger: 'blur' }],
        success: [{ required: true, message: '是否成功不能为空', trigger: 'blur' }],
        chargePrice: [{ required: true, message: '本次计费金额（分）不能为空', trigger: 'blur' }],
        requestTime: [{ required: true, message: '请求时间（UTC）不能为空', trigger: 'blur' }],
};
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['开放平台调用日志'])
    : $t('ui.actionTitle.create', ['开放平台调用日志']);
});


/** 重置表单 */
function resetForm() {
  formData.value = {
            id: undefined,
            traceId: undefined,
            clientId: undefined,
            apiId: undefined,
            apiCode: undefined,
            apiPath: undefined,
            httpMethod: undefined,
            requestHeaders: undefined,
            requestParams: undefined,
            requestBody: undefined,
            requestIp: undefined,
            requestUserAgent: undefined,
            responseStatus: undefined,
            responseBody: undefined,
            durationMs: undefined,
            success: undefined,
            errorCode: undefined,
            errorMsg: undefined,
            chargePrice: undefined,
            chargeStatus: undefined,
            requestTime: undefined,
  };
  formRef.value?.resetFields();
}


const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
        modalApi.lock();
    // 提交表单
    const data = formData.value as LogApi.Log;
        try {
      await (formData.value?.id ? updateLog(data) : createLog(data));
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
            <Form.Item label="请求跟踪ID（对应 X-Trace-Id）" name="traceId">
              <Input v-model:value="formData.traceId" placeholder="请输入请求跟踪ID（对应 X-Trace-Id）" />
            </Form.Item>
            <Form.Item label="客户端ID" name="clientId">
              <Input v-model:value="formData.clientId" placeholder="请输入客户端ID" />
            </Form.Item>
            <Form.Item label="API ID（关联 platform_api.id）" name="apiId">
              <Input v-model:value="formData.apiId" placeholder="请输入API ID（关联 platform_api.id）" />
            </Form.Item>
            <Form.Item label="API 编码" name="apiCode">
              <Input v-model:value="formData.apiCode" placeholder="请输入API 编码" />
            </Form.Item>
            <Form.Item label="API 路径" name="apiPath">
              <Input v-model:value="formData.apiPath" placeholder="请输入API 路径" />
            </Form.Item>
            <Form.Item label="HTTP 方法" name="httpMethod">
              <Input v-model:value="formData.httpMethod" placeholder="请输入HTTP 方法" />
            </Form.Item>
            <Form.Item label="请求头（JSON）" name="requestHeaders">
              <Input v-model:value="formData.requestHeaders" placeholder="请输入请求头（JSON）" />
            </Form.Item>
            <Form.Item label="请求参数（JSON）" name="requestParams">
              <Input v-model:value="formData.requestParams" placeholder="请输入请求参数（JSON）" />
            </Form.Item>
            <Form.Item label="请求体（JSON）" name="requestBody">
              <Input v-model:value="formData.requestBody" placeholder="请输入请求体（JSON）" />
            </Form.Item>
            <Form.Item label="请求IP" name="requestIp">
              <Input v-model:value="formData.requestIp" placeholder="请输入请求IP" />
            </Form.Item>
            <Form.Item label="User-Agent" name="requestUserAgent">
              <Input v-model:value="formData.requestUserAgent" placeholder="请输入User-Agent" />
            </Form.Item>
            <Form.Item label="HTTP 状态码" name="responseStatus">
              <RadioGroup v-model:value="formData.responseStatus">
                  <Radio value="1">请选择字典生成</Radio>
              </RadioGroup>
            </Form.Item>
            <Form.Item label="响应内容（截断，保留前 10KB）" name="responseBody">
              <Input v-model:value="formData.responseBody" placeholder="请输入响应内容（截断，保留前 10KB）" />
            </Form.Item>
            <Form.Item label="耗时（毫秒）" name="durationMs">
              <Input v-model:value="formData.durationMs" placeholder="请输入耗时（毫秒）" />
            </Form.Item>
            <Form.Item label="是否成功" name="success">
              <RadioGroup v-model:value="formData.success">
                  <Radio value="1">请选择字典生成</Radio>
              </RadioGroup>
            </Form.Item>
            <Form.Item label="错误码" name="errorCode">
              <Input v-model:value="formData.errorCode" placeholder="请输入错误码" />
            </Form.Item>
            <Form.Item label="错误信息" name="errorMsg">
              <Input v-model:value="formData.errorMsg" placeholder="请输入错误信息" />
            </Form.Item>
            <Form.Item label="本次计费金额（分）" name="chargePrice">
              <Input v-model:value="formData.chargePrice" placeholder="请输入本次计费金额（分）" />
            </Form.Item>
            <Form.Item label="扣费状态：1=成功 2=失败（余额不足）" name="chargeStatus">
              <RadioGroup v-model:value="formData.chargeStatus">
                  <Radio value="1">请选择字典生成</Radio>
              </RadioGroup>
            </Form.Item>
            <Form.Item label="请求时间（UTC）" name="requestTime">
              <DatePicker
                      v-model:value="formData.requestTime"
                      valueFormat="x"
                      placeholder="选择请求时间（UTC）"
              />
            </Form.Item>
    </Form>
      </Modal>
</template>