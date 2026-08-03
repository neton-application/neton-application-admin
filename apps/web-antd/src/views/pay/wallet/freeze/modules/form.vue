<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { yuanToFen } from '@vben/utils';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { placeJudicialFreeze, placeRiskHold } from '#/api/pay/wallet/freeze';

import { useJudicialFormSchema, useRiskHoldFormSchema } from '../data';

const emit = defineEmits(['success']);

type Mode = 'judicial' | 'risk';
const mode = ref<Mode>('risk');
const getTitle = computed(() =>
  mode.value === 'risk' ? '单笔风控冻结' : '账户冻结（司法）',
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-2',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useRiskHoldFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const values = (await formApi.getValues()) as Record<string, any>;
    if (
      mode.value === 'judicial' &&
      String(values.legalDocNo ?? '').trim() !==
        String(values.confirmDocNo ?? '').trim()
    ) {
      message.error('两次输入的法律文书号不一致');
      return;
    }
    modalApi.lock();
    try {
      await (mode.value === 'risk'
        ? placeRiskHold({
            userId: Number(values.userId),
            amount: yuanToFen(values.amount),
            refId: String(values.refId).trim(),
            reasonText: values.reasonText || undefined,
          })
        : placeJudicialFreeze({
            userId: Number(values.userId),
            // 留空 = 全额冻结（无上限），不是 0。
            targetAmount:
              values.targetAmount == null || values.targetAmount === ''
                ? null
                : yuanToFen(values.targetAmount),
            legalDocNo: String(values.legalDocNo).trim(),
            reasonText: values.reasonText || undefined,
            expiresAt: values.expiresAt ? Number(values.expiresAt) : 0,
          }));
      await modalApi.close();
      message.success('冻结已下达');
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    mode.value = (modalApi.getData<{ mode?: Mode }>()?.mode ?? 'risk') as Mode;
    formApi.setState({
      schema:
        mode.value === 'risk'
          ? useRiskHoldFormSchema()
          : useJudicialFormSchema(),
    });
    await formApi.resetForm();
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[40%]">
    <Form class="mx-4" />
  </Modal>
</template>
