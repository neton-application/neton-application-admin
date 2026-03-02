<script lang="ts" setup>
import type { ClientApiApi } from '#/api/platform/clientapi';

import { ref, h, reactive, onMounted, nextTick } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { useTableToolbar, VbenVxeTableToolbar } from '@vben/plugins/vxe-table';
import { cloneDeep, downloadFileFromBlobPart, formatDateTime, isEmpty } from '@vben/utils';
import { Button, Card, message, Tabs, Pagination, Form, RangePicker, DatePicker, Select, Input } from 'ant-design-vue';
import ClientApiForm from './modules/form.vue';
import { Download, Plus, RefreshCw, Search, Trash2 } from '@vben/icons';
import { DictTag } from '#/components/dict-tag';
import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils/rangePickerProps';


import { $t } from '#/locales';
import { getClientApiPage, deleteClientApi, deleteClientApiList, exportClientApi } from '#/api/platform/clientapi';


const loading = ref(true) // 列表的加载中
const list = ref<ClientApiApi.ClientApi[]>([]) // 列表的数据

const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
                clientId: undefined,
                apiId: undefined,
                status: undefined,
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const params = cloneDeep(queryParams) as any;
              const data = await getClientApiPage(params)
        list.value = data.list
        total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value.resetFields()
  handleQuery()
}

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ClientApiForm,
  destroyOnClose: true,
});

/** 创建客户端-API授权关系表（含自定义定价） */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑客户端-API授权关系表（含自定义定价） */
function handleEdit(row: ClientApiApi.ClientApi) {
  formModalApi.setData(row).open();
}


/** 删除客户端-API授权关系表（含自定义定价） */
async function handleDelete(row: ClientApiApi.ClientApi) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteClientApi(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    await getList();
  } finally {
    hideLoading();
  }
}

/** 批量删除客户端-API授权关系表（含自定义定价） */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
  });
  try {
    await deleteClientApiList(checkedIds.value);
    checkedIds.value = [];
    message.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } finally {
    hideLoading();
  }
}

const checkedIds = ref<number[]>([])
function handleRowCheckboxChange({
  records,
}: {
  records: ClientApiApi.ClientApi[];
}) {
  checkedIds.value = records.map((item) => item.id!);
}

/** 导出表格 */
async function handleExport() {
try {
  exportLoading.value = true;
  const data = await exportClientApi(queryParams);
  downloadFileFromBlobPart({ fileName: '客户端-API授权关系表（含自定义定价）.xls', source: data });
}finally {
  exportLoading.value = false;
}
}


/** 初始化 */
const { hiddenSearchBar, tableToolbarRef, tableRef } = useTableToolbar();
onMounted(() => {
  getList();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="getList" />

    <Card v-if="!hiddenSearchBar" class="mb-4">
      <!-- 搜索工作栏 -->
      <Form
          :model="queryParams"
          ref="queryFormRef"
          layout="inline"
      >
                    <Form.Item label="客户端" name="clientId">
                      <Input
                          v-model:value="queryParams.clientId"
                          placeholder="请输入客户端"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="API ID" name="apiId">
                      <Input
                          v-model:value="queryParams.apiId"
                          placeholder="请输入API ID"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="是否启用" name="status">
                      <Select
                          v-model:value="queryParams.status"
                          placeholder="请选择是否启用"
                          allowClear
                           class="w-full"
                      >
                            <Select.Option
                                v-for="dict in getDictOptions(DICT_TYPE.PLATFORM_BOOL, 'number')"
                                :key="dict.value"
                                :value="dict.value"
                            >
                              {{ dict.label }}
                            </Select.Option>
                      </Select>
                    </Form.Item>
        <Form.Item>
          <Button class="ml-2" @click="resetQuery"> 重置 </Button>
          <Button class="ml-2" @click="handleQuery" type="primary">
            搜索
          </Button>
        </Form.Item>
      </Form>
    </Card>

    <!-- 列表 -->
    <Card title="客户端-API授权关系表（含自定义定价）">
      <template #extra>
        <VbenVxeTableToolbar
            ref="tableToolbarRef"
            v-model:hidden-search="hiddenSearchBar"
        >
          <Button
              class="ml-2"
              :icon="h(Plus)"
              type="primary"
              @click="handleCreate"
              v-access:code="['platform:client-api:create']"
          >
            {{ $t('ui.actionTitle.create', ['客户端-API授权关系表（含自定义定价）']) }}
          </Button>
          <Button
              :icon="h(Download)"
              type="primary"
              class="ml-2"
              :loading="exportLoading"
              @click="handleExport"
              v-access:code="['platform:client-api:export']"
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
              v-access:code="['platform:client-api:delete']"
          >
            批量删除
          </Button>
        </VbenVxeTableToolbar>
      </template>
      <VxeTable
          ref="tableRef"
          :data="list"
          show-overflow
          :loading="loading"
          @checkboxAll="handleRowCheckboxChange"
          @checkboxChange="handleRowCheckboxChange"
      >
        <VxeColumn type="checkbox" width="40" />
                              <VxeColumn field="id" title="关系ID" align="center" />
                    <VxeColumn field="clientId" title="客户端" align="center" />
                    <VxeColumn field="apiId" title="API ID" align="center" />
                    <VxeColumn field="status" title="是否启用" align="center">
                      <template #default="{row}">
                        <dict-tag :type="DICT_TYPE.PLATFORM_BOOL" :value="row.status" />
                      </template>
                    </VxeColumn>
                    <VxeColumn field="rateLimitPerMin" title="每分钟限流（覆盖 API 默认配置）" align="center" />
                    <VxeColumn field="rateLimitPerDay" title="每日配额（覆盖客户端默认配置）" align="center" />
                    <VxeColumn field="isCustomPrice" title="是否自定义价格" align="center">
                      <template #default="{row}">
                        <dict-tag :type="DICT_TYPE.PLATFORM_BOOL" :value="row.isCustomPrice" />
                      </template>
                    </VxeColumn>
                    <VxeColumn field="customPrice" title="自定义价格（分，仅当 is_custom_price=1 时有效）" align="center" />
                    <VxeColumn field="startTime" title="授权开始时间" align="center">
                      <template #default="{row}">
                        {{formatDateTime(row.startTime)}}
                      </template>
                    </VxeColumn>
                    <VxeColumn field="endTime" title="授权结束时间（为空表示永久）" align="center">
                      <template #default="{row}">
                        {{formatDateTime(row.endTime)}}
                      </template>
                    </VxeColumn>
                    <VxeColumn field="createTime" title="创建时间" align="center">
                      <template #default="{row}">
                        {{formatDateTime(row.createTime)}}
                      </template>
                    </VxeColumn>
        <VxeColumn field="operation" title="操作" align="center">
          <template #default="{row}">
            <Button
                size="small"
                type="link"
                @click="handleEdit(row)"
                v-access:code="['platform:client-api:update']"
            >
              {{ $t('ui.actionTitle.edit') }}
            </Button>
            <Button
                size="small"
                type="link"
                danger
                class="ml-2"
                @click="handleDelete(row)"
                v-access:code="['platform:client-api:delete']"
            >
              {{ $t('ui.actionTitle.delete') }}
            </Button>
          </template>
        </VxeColumn>
      </VxeTable>
      <!-- 分页 -->
      <div class="mt-2 flex justify-end">
        <Pagination
            :total="total"
            v-model:current="queryParams.pageNo"
            v-model:page-size="queryParams.pageSize"
            show-size-changer
            @change="getList"
        />
      </div>
    </Card>
  </Page>
</template>
