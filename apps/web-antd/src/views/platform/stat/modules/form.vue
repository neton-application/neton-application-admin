<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';
import type { StatApi } from '#/api/platform/stat';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { DatePicker, Form, Input, Select } from 'ant-design-vue';

import { createStat, getStat, updateStat } from '#/api/platform/stat';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const formRef = ref();
const formData = ref<Partial<StatApi.Stat>>({
        id: undefined,
        clientId: undefined,
        apiId: undefined,
        statDate: undefined,
        totalCount: undefined,
        successCount: undefined,
        failedCount: undefined,
        avgDurationMs: undefined,
        maxDurationMs: undefined,
        totalCharge: undefined,
        freeCount: undefined,
        chargedCount: undefined,
});
const rules: Record<string, Rule[]> = {
        clientId: [{ required: true, message: '客户端ID不能为空', trigger: 'change' }],
        statDate: [{ required: true, message: '统计日期不能为空', trigger: 'blur' }],
        totalCount: [{ required: true, message: '总调用次数不能为空', trigger: 'blur' }],
        successCount: [{ required: true, message: '成功次数不能为空', trigger: 'blur' }],
        failedCount: [{ required: true, message: '失败次数不能为空', trigger: 'blur' }],
        avgDurationMs: [{ required: true, message: '平均耗时（毫秒）不能为空', trigger: 'blur' }],
        maxDurationMs: [{ required: true, message: '最大耗时（毫秒）不能为空', trigger: 'blur' }],
        totalCharge: [{ required: true, message: '总计费金额（分）不能为空', trigger: 'blur' }],
        freeCount: [{ required: true, message: '免费调用次数不能为空', trigger: 'blur' }],
        chargedCount: [{ required: true, message: '计费调用次数不能为空', trigger: 'blur' }],
};
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['开放平台统计'])
    : $t('ui.actionTitle.create', ['开放平台统计']);
});


/** 重置表单 */
function resetForm() {
  formData.value = {
            id: undefined,
            clientId: undefined,
            apiId: undefined,
            statDate: undefined,
            totalCount: undefined,
            successCount: undefined,
            failedCount: undefined,
            avgDurationMs: undefined,
            maxDurationMs: undefined,
            totalCharge: undefined,
            freeCount: undefined,
            chargedCount: undefined,
  };
  formRef.value?.resetFields();
}


const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
        modalApi.lock();
    // 提交表单
    const data = formData.value as StatApi.Stat;
        try {
      await (formData.value?.id ? updateStat(data) : createStat(data));
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
    let data = modalApi.getData<StatApi.Stat>();
    if (!data) {
      return;
    }
    if (data.id) {
      modalApi.lock();
      try {
        data = await getStat(data.id);
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
              <Select v-model:value="formData.clientId" placeholder="请选择客户端ID">
                  <Select.Option label="请选择字典生成" value="" />
              </Select>
            </Form.Item>
            <Form.Item label="API ID（为空表示客户端维度统计）" name="apiId">
              <Select v-model:value="formData.apiId" placeholder="请选择API ID（为空表示客户端维度统计）">
                  <Select.Option label="请选择字典生成" value="" />
              </Select>
            </Form.Item>
            <Form.Item label="统计日期" name="statDate">
              <DatePicker
                      v-model:value="formData.statDate"
                      valueFormat="x"
                      placeholder="选择统计日期"
              />
            </Form.Item>
            <Form.Item label="总调用次数" name="totalCount">
              <Input v-model:value="formData.totalCount" placeholder="请输入总调用次数" />
            </Form.Item>
            <Form.Item label="成功次数" name="successCount">
              <Input v-model:value="formData.successCount" placeholder="请输入成功次数" />
            </Form.Item>
            <Form.Item label="失败次数" name="failedCount">
              <Input v-model:value="formData.failedCount" placeholder="请输入失败次数" />
            </Form.Item>
            <Form.Item label="平均耗时（毫秒）" name="avgDurationMs">
              <Input v-model:value="formData.avgDurationMs" placeholder="请输入平均耗时（毫秒）" />
            </Form.Item>
            <Form.Item label="最大耗时（毫秒）" name="maxDurationMs">
              <Input v-model:value="formData.maxDurationMs" placeholder="请输入最大耗时（毫秒）" />
            </Form.Item>
            <Form.Item label="总计费金额（分）" name="totalCharge">
              <Input v-model:value="formData.totalCharge" placeholder="请输入总计费金额（分）" />
            </Form.Item>
            <Form.Item label="免费调用次数" name="freeCount">
              <Input v-model:value="formData.freeCount" placeholder="请输入免费调用次数" />
            </Form.Item>
            <Form.Item label="计费调用次数" name="chargedCount">
              <Input v-model:value="formData.chargedCount" placeholder="请输入计费调用次数" />
            </Form.Item>
    </Form>
      </Modal>
</template>
