<script lang="ts" setup>
import type { ChargeRecordApi } from '#/api/platform/chargerecord';

import { ref, h, reactive, onMounted, nextTick } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { useTableToolbar, VbenVxeTableToolbar } from '@vben/plugins/vxe-table';
import { cloneDeep, downloadFileFromBlobPart, formatDateTime, isEmpty } from '@vben/utils';
import { Button, Card, message, Tabs, Pagination, Form, RangePicker, DatePicker, Select, Input } from 'ant-design-vue';
import ChargeRecordForm from './modules/form.vue';
import { Download, Plus, RefreshCw, Search, Trash2 } from '@vben/icons';
import { DictTag } from '#/components/dict-tag';
import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import { getRangePickerDefaultProps } from '#/utils/rangePickerProps';


import { $t } from '#/locales';
import { getChargeRecordPage, deleteChargeRecord, deleteChargeRecordList, exportChargeRecord } from '#/api/platform/chargerecord';


const loading = ref(true) // 列表的加载中
const list = ref<ChargeRecordApi.ChargeRecord[]>([]) // 列表的数据

const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
                clientId: undefined,
                apiId: undefined,
                traceId: undefined,
                chargeStatus: undefined,
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
              const data = await getChargeRecordPage(params)
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
  connectedComponent: ChargeRecordForm,
  destroyOnClose: true,
});

/** 创建开放平台计费记录 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑开放平台计费记录 */
function handleEdit(row: ChargeRecordApi.ChargeRecord) {
  formModalApi.setData(row).open();
}


/** 删除开放平台计费记录 */
async function handleDelete(row: ChargeRecordApi.ChargeRecord) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteChargeRecord(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    await getList();
  } finally {
    hideLoading();
  }
}

/** 批量删除开放平台计费记录 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
  });
  try {
    await deleteChargeRecordList(checkedIds.value);
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
  records: ChargeRecordApi.ChargeRecord[];
}) {
  checkedIds.value = records.map((item) => item.id!);
}

/** 导出表格 */
async function handleExport() {
try {
  exportLoading.value = true;
  const data = await exportChargeRecord(queryParams);
  downloadFileFromBlobPart({ fileName: '开放平台计费记录.xls', source: data });
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
                    <Form.Item label="API ID" name="apiId">
                      <Input
                          v-model:value="queryParams.apiId"
                          placeholder="请输入API ID"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="请求跟踪ID（关联日志）" name="traceId">
                      <Input
                          v-model:value="queryParams.traceId"
                          placeholder="请输入请求跟踪ID（关联日志）"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="是否扣费成功" name="chargeStatus">
                      <Select
                          v-model:value="queryParams.chargeStatus"
                          placeholder="请选择是否扣费成功"
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
    <Card title="开放平台计费记录">
      <template #extra>
        <VbenVxeTableToolbar
            ref="tableToolbarRef"
            v-model:hidden-search="hiddenSearchBar"
        >
          <!-- <Button
              class="ml-2"
              :icon="h(Plus)"
              type="primary"
              @click="handleCreate"
              v-access:code="['platform:charge-record:create']"
          >
            {{ $t('ui.actionTitle.create', ['开放平台计费记录']) }}
          </Button> -->
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
          <!-- <Button
              :icon="h(Trash2)"
              type="primary"
              danger
              class="ml-2"
              :disabled="isEmpty(checkedIds)"
              @click="handleDeleteBatch"
              v-access:code="['platform:charge-record:delete']"
          >
            批量删除
          </Button> -->
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
                              <VxeColumn field="id" title="计费ID" align="center" />
                    <VxeColumn field="clientId" title="客户端ID" align="center" />
                    <VxeColumn field="apiId" title="API ID" align="center" />
                    <VxeColumn field="traceId" title="请求跟踪ID（关联日志）" align="center" />
                    <VxeColumn field="chargeType" title="计费类型" align="center">
                      <template #default="{row}">
                        <dict-tag :type="DICT_TYPE.PLATFORM_CHARGE_TYPE" :value="row.chargeType" />
                      </template>
                    </VxeColumn>
                    <VxeColumn field="price" title="本次计费金额（分）" align="center" />
                    <VxeColumn field="isCustomPrice" title="是否使用自定义价格" align="center">
                      <template #default="{row}">
                        <dict-tag :type="DICT_TYPE.PLATFORM_BOOL" :value="row.isCustomPrice" />
                      </template>
                    </VxeColumn>
                    <VxeColumn field="balanceBefore" title="扣费前余额（分）" align="center" />
                    <VxeColumn field="balanceAfter" title="扣费后余额（分）" align="center" />
                    <VxeColumn field="chargeStatus" title="是否扣费成功" align="center">
                      <template #default="{row}">
                        <dict-tag :type="DICT_TYPE.PLATFORM_BOOL" :value="row.chargeStatus" />
                      </template>
                    </VxeColumn>
                    <VxeColumn field="failureReason" title="失败原因" align="center" />
                    <VxeColumn field="chargeTime" title="扣费时间" align="center">
                      <template #default="{row}">
                        {{formatDateTime(row.chargeTime)}}
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
                v-access:code="['platform:charge-record:update']"
            >
              {{ $t('ui.actionTitle.edit') }}
            </Button>
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
