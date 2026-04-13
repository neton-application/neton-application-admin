<script lang="ts" setup>
import type { ChargeRecordApi } from '#/api/platform/chargerecord';

import { h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useTableToolbar, VbenVxeTableToolbar } from '@vben/plugins/vxe-table';
import {
  cloneDeep,
  downloadFileFromBlobPart,
  formatDateTime,
} from '@vben/utils';
import { Download } from '@vben/icons';
import { Button, Card, Form, Input, message, Pagination } from 'ant-design-vue';

import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import {
  deleteChargeRecord,
  exportChargeRecord,
  getChargeRecordPage,
} from '#/api/platform/chargerecord';
import { $t } from '#/locales';

const loading = ref(true);
const list = ref<ChargeRecordApi.ChargeRecord[]>([]);
const total = ref(0);
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  clientId: undefined,
  apiId: undefined,
});
const queryFormRef = ref();
const exportLoading = ref(false);

async function getList() {
  loading.value = true;
  try {
    const params = cloneDeep(queryParams) as any;
    const data = await getChargeRecordPage(params);
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  queryParams.pageNo = 1;
  getList();
}

function resetQuery() {
  queryFormRef.value.resetFields();
  handleQuery();
}

async function handleDelete(row: ChargeRecordApi.ChargeRecord) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteChargeRecord(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    await getList();
  } finally {
    hideLoading();
  }
}

async function handleExport() {
  try {
    exportLoading.value = true;
    const data = await exportChargeRecord(queryParams);
    downloadFileFromBlobPart({ fileName: '开放平台计费记录.xls', source: data });
  } finally {
    exportLoading.value = false;
  }
}

const { hiddenSearchBar } = useTableToolbar();
onMounted(() => {
  getList();
});
</script>

<template>
  <Page auto-content-height>
    <Card v-if="!hiddenSearchBar" class="mb-4">
      <Form
        ref="queryFormRef"
        :model="queryParams"
        layout="inline"
      >
        <Form.Item label="客户端ID" name="clientId">
          <Input
            v-model:value="queryParams.clientId"
            placeholder="请输入客户端ID"
            allow-clear
            @pressEnter="handleQuery"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="API ID" name="apiId">
          <Input
            v-model:value="queryParams.apiId"
            placeholder="请输入API ID"
            allow-clear
            @pressEnter="handleQuery"
            class="w-full"
          />
        </Form.Item>
        <Form.Item>
          <Button class="ml-2" @click="resetQuery">重置</Button>
          <Button class="ml-2" @click="handleQuery" type="primary">搜索</Button>
        </Form.Item>
      </Form>
    </Card>

    <Card title="开放平台计费记录">
      <template #extra>
        <VbenVxeTableToolbar v-model:hidden-search="hiddenSearchBar">
          <Button
            :icon="h(Download)"
            type="primary"
            class="ml-2"
            :loading="exportLoading"
            @click="handleExport"
            v-access:code="['platform:charge-record:export']"
          >
            {{ $t('ui.actionTitle.export') }}
          </Button>
        </VbenVxeTableToolbar>
      </template>

      <VxeTable
        :data="list"
        show-overflow
        :loading="loading"
      >
        <VxeColumn field="id" title="计费ID" align="center" />
        <VxeColumn field="clientId" title="客户端ID" align="center" />
        <VxeColumn field="apiId" title="API ID" align="center" />
        <VxeColumn field="price" title="计费金额(分)" align="center" />
        <VxeColumn field="createdAt" title="创建时间" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </VxeColumn>
        <VxeColumn field="operation" title="操作" align="center">
          <template #default="{ row }">
            <Button
              size="small"
              type="link"
              danger
              class="ml-2"
              @click="handleDelete(row)"
              v-access:code="['platform:charge-record:delete']"
            >
              {{ $t('ui.actionTitle.delete') }}
            </Button>
          </template>
        </VxeColumn>
      </VxeTable>

      <div class="mt-2 flex justify-end">
        <Pagination
          v-model:current="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          show-size-changer
          @change="getList"
        />
      </div>
    </Card>
  </Page>
</template>
