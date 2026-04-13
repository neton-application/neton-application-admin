<script lang="ts" setup>
import type { LogApi } from '#/api/platform/log';

import { h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useTableToolbar, VbenVxeTableToolbar } from '@vben/plugins/vxe-table';
import {
  cloneDeep,
  downloadFileFromBlobPart,
  formatDateTime,
  isEmpty,
} from '@vben/utils';
import { Download, Trash2 } from '@vben/icons';
import { Button, Card, Form, Input, message, Pagination } from 'ant-design-vue';

import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import { deleteLog, deleteLogList, exportLog, getLogPage } from '#/api/platform/log';
import { $t } from '#/locales';

const loading = ref(true);
const list = ref<LogApi.Log[]>([]);
const total = ref(0);
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  clientId: undefined,
  apiId: undefined,
  resultCode: undefined,
});
const queryFormRef = ref();
const exportLoading = ref(false);
const checkedIds = ref<number[]>([]);

async function getList() {
  loading.value = true;
  try {
    const params = cloneDeep(queryParams) as any;
    const data = await getLogPage(params);
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

async function handleDelete(row: LogApi.Log) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteLog(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    await getList();
  } finally {
    hideLoading();
  }
}

async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
  });
  try {
    await deleteLogList(checkedIds.value);
    checkedIds.value = [];
    message.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } finally {
    hideLoading();
  }
}

function handleRowCheckboxChange({ records }: { records: LogApi.Log[] }) {
  checkedIds.value = records.map((item) => item.id);
}

async function handleExport() {
  try {
    exportLoading.value = true;
    const data = await exportLog(queryParams);
    downloadFileFromBlobPart({ fileName: '开放平台调用日志.xls', source: data });
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
        <Form.Item label="结果码" name="resultCode">
          <Input
            v-model:value="queryParams.resultCode"
            placeholder="请输入结果码"
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

    <Card title="开放平台调用日志">
      <template #extra>
        <VbenVxeTableToolbar v-model:hidden-search="hiddenSearchBar">
          <Button
            :icon="h(Download)"
            type="primary"
            class="ml-2"
            :loading="exportLoading"
            @click="handleExport"
            v-access:code="['platform:log:export']"
          >
            {{ $t('ui.actionTitle.export') }}
          </Button>
          <Button
            :icon="h(Trash2)"
            type="primary"
            danger
            class="ml-2"
            :disabled="isEmpty(checkedIds)"
            @click="handleDeleteBatch"
            v-access:code="['platform:log:delete']"
          >
            批量删除
          </Button>
        </VbenVxeTableToolbar>
      </template>

      <VxeTable
        :data="list"
        show-overflow
        :loading="loading"
        @checkboxAll="handleRowCheckboxChange"
        @checkboxChange="handleRowCheckboxChange"
      >
        <VxeColumn type="checkbox" width="40" />
        <VxeColumn field="id" title="日志ID" align="center" />
        <VxeColumn field="clientId" title="客户端ID" align="center" />
        <VxeColumn field="apiId" title="API ID" align="center" />
        <VxeColumn field="requestUrl" title="请求地址" align="center" />
        <VxeColumn field="requestParams" title="请求参数" align="center" />
        <VxeColumn field="responseBody" title="响应内容" align="center" />
        <VxeColumn field="userIp" title="用户IP" align="center" />
        <VxeColumn field="duration" title="耗时(ms)" align="center" />
        <VxeColumn field="resultCode" title="结果码" align="center" />
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
              v-access:code="['platform:log:delete']"
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
