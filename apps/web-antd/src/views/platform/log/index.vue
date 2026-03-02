<script lang="ts" setup>
import type { LogApi } from '#/api/platform/log';

import { ref, h, reactive, onMounted, nextTick } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { getDictOptions } from '@vben/hooks';
import { useTableToolbar, VbenVxeTableToolbar } from '@vben/plugins/vxe-table';
import { cloneDeep, downloadFileFromBlobPart, formatDateTime, isEmpty } from '@vben/utils';
import { Button, Card, message, Tabs, Pagination, Form, RangePicker, DatePicker, Select, Input } from 'ant-design-vue';
import LogForm from './modules/form.vue';
import { Download, Plus, RefreshCw, Search, Trash2 } from '@vben/icons';
import { DictTag } from '#/components/dict-tag';
import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils/rangePickerProps';


import { $t } from '#/locales';
import { getLogPage, deleteLog, deleteLogList, exportLog } from '#/api/platform/log';


const loading = ref(true) // 列表的加载中
const list = ref<LogApi.Log[]>([]) // 列表的数据

const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
                clientId: undefined,
                apiId: undefined,
                apiCode: undefined,
                success: undefined,
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const params = cloneDeep(queryParams) as any;
              const data = await getLogPage(params)
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
  connectedComponent: LogForm,
  destroyOnClose: true,
});

/** 创建开放平台调用日志 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑开放平台调用日志 */
function handleEdit(row: LogApi.Log) {
  formModalApi.setData(row).open();
}


/** 删除开放平台调用日志 */
async function handleDelete(row: LogApi.Log) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteLog(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    await getList();
  } finally {
    hideLoading();
  }
}

/** 批量删除开放平台调用日志 */
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

const checkedIds = ref<number[]>([])
function handleRowCheckboxChange({
  records,
}: {
  records: LogApi.Log[];
}) {
  checkedIds.value = records.map((item) => item.id!);
}

/** 导出表格 */
async function handleExport() {
try {
  exportLoading.value = true;
  const data = await exportLog(queryParams);
  downloadFileFromBlobPart({ fileName: '开放平台调用日志.xls', source: data });
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
                    <Form.Item label="客户端ID" name="clientId">
                      <Input
                          v-model:value="queryParams.clientId"
                          placeholder="请输入客户端ID"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="API ID（关联 platform_api.id）" name="apiId">
                      <Input
                          v-model:value="queryParams.apiId"
                          placeholder="请输入API ID（关联 platform_api.id）"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="API 编码" name="apiCode">
                      <Input
                          v-model:value="queryParams.apiCode"
                          placeholder="请输入API 编码"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="是否成功" name="success">
                      <Select
                          v-model:value="queryParams.success"
                          placeholder="请选择是否成功"
                          allowClear
                           class="w-full"
                      >
                            <Select.Option label="请选择字典生成" value="" />
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
    <Card title="开放平台调用日志">
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
              v-access:code="['platform:log:create']"
          >
            {{ $t('ui.actionTitle.create', ['开放平台调用日志']) }}
          </Button>
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
          ref="tableRef"
          :data="list"
          show-overflow
          :loading="loading"
          @checkboxAll="handleRowCheckboxChange"
          @checkboxChange="handleRowCheckboxChange"
      >
        <VxeColumn type="checkbox" width="40" />
                              <VxeColumn field="id" title="日志ID" align="center" />
                    <VxeColumn field="traceId" title="请求跟踪ID（对应 X-Trace-Id）" align="center" />
                    <VxeColumn field="clientId" title="客户端ID" align="center" />
                    <VxeColumn field="apiId" title="API ID（关联 platform_api.id）" align="center" />
                    <VxeColumn field="apiCode" title="API 编码" align="center" />
                    <VxeColumn field="apiPath" title="API 路径" align="center" />
                    <VxeColumn field="httpMethod" title="HTTP 方法" align="center" />
                    <VxeColumn field="requestHeaders" title="请求头（JSON）" align="center" />
                    <VxeColumn field="requestParams" title="请求参数（JSON）" align="center" />
                    <VxeColumn field="requestBody" title="请求体（JSON）" align="center" />
                    <VxeColumn field="requestIp" title="请求IP" align="center" />
                    <VxeColumn field="requestUserAgent" title="User-Agent" align="center" />
                    <VxeColumn field="responseStatus" title="HTTP 状态码" align="center" />
                    <VxeColumn field="responseBody" title="响应内容（截断，保留前 10KB）" align="center" />
                    <VxeColumn field="durationMs" title="耗时（毫秒）" align="center" />
                    <VxeColumn field="success" title="是否成功" align="center" />
                    <VxeColumn field="errorCode" title="错误码" align="center" />
                    <VxeColumn field="errorMsg" title="错误信息" align="center" />
                    <VxeColumn field="chargePrice" title="本次计费金额（分）" align="center" />
                    <VxeColumn field="chargeStatus" title="扣费状态：1=成功 2=失败（余额不足）" align="center" />
                    <VxeColumn field="requestTime" title="请求时间（UTC）" align="center">
                      <template #default="{row}">
                        {{formatDateTime(row.requestTime)}}
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
                v-access:code="['platform:log:update']"
            >
              {{ $t('ui.actionTitle.edit') }}
            </Button>
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