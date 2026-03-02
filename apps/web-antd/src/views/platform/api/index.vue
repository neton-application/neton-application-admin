<script lang="ts" setup>
import type { ApiApi } from '#/api/platform/api';

import { ref, h, reactive, onMounted, nextTick } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { useTableToolbar, VbenVxeTableToolbar } from '@vben/plugins/vxe-table';
import { cloneDeep, downloadFileFromBlobPart, formatDateTime, isEmpty } from '@vben/utils';
import { Button, Card, message, Tabs, Pagination, Form, RangePicker, DatePicker, Select, Input } from 'ant-design-vue';
import ApiForm from './modules/form.vue';
import { Download, Plus, RefreshCw, Search, Trash2 } from '@vben/icons';
import { DictTag } from '#/components/dict-tag';
import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils/rangePickerProps';


import { $t } from '#/locales';
import { getApiPage, deleteApi, deleteApiList, exportApi } from '#/api/platform/api';


const loading = ref(true) // 列表的加载中
const list = ref<ApiApi.Api[]>([]) // 列表的数据

const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
                apiCode: undefined,
                apiName: undefined,
                category: undefined,
                status: undefined,
                isPublic: undefined,
                createTime: undefined,
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const params = cloneDeep(queryParams) as any;
                if (params.createTime && Array.isArray(params.createTime)) {
                  params.createTime = (params.createTime as string[]).join(',');
                }
              const data = await getApiPage(params)
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
  connectedComponent: ApiForm,
  destroyOnClose: true,
});

/** 创建开放平台API定义 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑开放平台API定义 */
function handleEdit(row: ApiApi.Api) {
  formModalApi.setData(row).open();
}


/** 删除开放平台API定义 */
async function handleDelete(row: ApiApi.Api) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteApi(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    await getList();
  } finally {
    hideLoading();
  }
}

/** 批量删除开放平台API定义 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
  });
  try {
    await deleteApiList(checkedIds.value);
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
  records: ApiApi.Api[];
}) {
  checkedIds.value = records.map((item) => item.id!);
}

/** 导出表格 */
async function handleExport() {
try {
  exportLoading.value = true;
  const data = await exportApi(queryParams);
  downloadFileFromBlobPart({ fileName: '开放平台API定义.xls', source: data });
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
                    <Form.Item label="API 编码" name="apiCode">
                      <Input
                          v-model:value="queryParams.apiCode"
                          placeholder="请输入API 编码"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="API 名称" name="apiName">
                      <Input
                          v-model:value="queryParams.apiName"
                          placeholder="请输入API 名称"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="API 分类" name="category">
                      <Input
                          v-model:value="queryParams.category"
                          placeholder="请输入API 分类"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="状态" name="status">
                      <Select
                          v-model:value="queryParams.status"
                          placeholder="请选择状态"
                          allowClear
                           class="w-full"
                      >
                            <Select.Option
                                v-for="dict in getDictOptions(DICT_TYPE.PLATFORM_CLIENT_STATUS, 'number')"
                                :key="dict.value"
                                :value="dict.value"
                            >
                              {{ dict.label }}
                            </Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="是否公开" name="isPublic">
                      <Select
                          v-model:value="queryParams.isPublic"
                          placeholder="请选择是否公开"
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
                        <Form.Item label="创建时间" name="createTime">
                          <RangePicker
                              v-model:value="queryParams.createTime"
                              v-bind="getRangePickerDefaultProps()"
                              class="w-full"
                          />
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
    <Card title="开放平台API定义">
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
              v-access:code="['platform:api:create']"
          >
            {{ $t('ui.actionTitle.create', ['开放平台API定义']) }}
          </Button>
          <Button
              :icon="h(Download)"
              type="primary"
              class="ml-2"
              :loading="exportLoading"
              @click="handleExport"
              v-access:code="['platform:api:export']"
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
              v-access:code="['platform:api:delete']"
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
                              <VxeColumn field="id" title="API ID" align="center" />
                    <VxeColumn field="apiCode" title="API 编码" align="center" />
                    <VxeColumn field="apiName" title="API 名称" align="center" />
                    <VxeColumn field="apiPath" title="API 路径" align="center" />
                    <VxeColumn field="httpMethod" title="HTTP 方法" align="center">
                      <template #default="{row}">
                          <dict-tag :type="DICT_TYPE.PLATFORM_REQUEST_METHOD" :value="row.httpMethod" />
                      </template>
                    </VxeColumn>
                    <VxeColumn field="category" title="API 分类" align="center" />
                    <VxeColumn field="description" title="API 描述" align="center" />
                    <VxeColumn field="status" title="状态" align="center">
                      <template #default="{row}">
                        <dict-tag :type="DICT_TYPE.PLATFORM_CLIENT_STATUS" :value="row.status" />
                      </template>
                    </VxeColumn>
                    <!-- <VxeColumn field="isPublic" title="是否公开" align="center">
                      <template #default="{row}">
                        <dict-tag :type="DICT_TYPE.PLATFORM_BOOL" :value="row.isPublic" />
                      </template>
                    </VxeColumn> -->
                    <VxeColumn field="rateLimitPerMin" title="每分钟限流" align="center" />
                    <VxeColumn field="chargeType" title="计费类型" align="center">
                      <template #default="{row}">
                        <dict-tag :type="DICT_TYPE.PLATFORM_CHARGE_TYPE" :value="row.chargeType" />
                      </template>
                    </VxeColumn>
                    <VxeColumn field="defaultPrice" title="默认单价（分）" align="center" />
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
                v-access:code="['platform:api:update']"
            >
              {{ $t('ui.actionTitle.edit') }}
            </Button>
            <Button
                size="small"
                type="link"
                danger
                class="ml-2"
                @click="handleDelete(row)"
                v-access:code="['platform:api:delete']"
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
