<script lang="ts" setup>
import type { StatApi } from '#/api/platform/stat';

import { h, onMounted, reactive, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTableToolbar, VbenVxeTableToolbar } from '@vben/plugins/vxe-table';
import {
  cloneDeep,
  downloadFileFromBlobPart,
  formatDateTime,
  isEmpty,
} from '@vben/utils';
import { Download, Plus, Trash2 } from '@vben/icons';
import { Button, Card, Form, message, Pagination, RangePicker, Select } from 'ant-design-vue';

import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import { deleteStat, deleteStatList, exportStat, getStatPage } from '#/api/platform/stat';
import { $t } from '#/locales';
import { getRangePickerDefaultProps } from '#/utils/rangePickerProps';

import StatForm from './modules/form.vue';


const loading = ref(true) // 列表的加载中
const list = ref<StatApi.Stat[]>([]) // 列表的数据

const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
                clientId: undefined,
                apiId: undefined,
                statDate: undefined,
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const params = cloneDeep(queryParams) as any;
                if (params.statDate && Array.isArray(params.statDate)) {
                  params.statDate = (params.statDate as string[]).join(',');
                }
              const data = await getStatPage(params)
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
  connectedComponent: StatForm,
  destroyOnClose: true,
});

/** 创建开放平台统计 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑开放平台统计 */
function handleEdit(row: StatApi.Stat) {
  formModalApi.setData(row).open();
}


/** 删除开放平台统计 */
async function handleDelete(row: StatApi.Stat) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteStat(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    await getList();
  } finally {
    hideLoading();
  }
}

/** 批量删除开放平台统计 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
  });
  try {
    await deleteStatList(checkedIds.value);
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
  records: StatApi.Stat[];
}) {
  checkedIds.value = records.map((item) => item.id!);
}

/** 导出表格 */
async function handleExport() {
try {
  exportLoading.value = true;
  const data = await exportStat(queryParams);
  downloadFileFromBlobPart({ fileName: '开放平台统计.xls', source: data });
}finally {
  exportLoading.value = false;
}
}


/** 初始化 */
const { hiddenSearchBar } = useTableToolbar();
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
                      <Select
                          v-model:value="queryParams.clientId"
                          placeholder="请选择客户端ID"
                          allowClear
                           class="w-full"
                      >
                            <Select.Option label="请选择字典生成" value="" />
                      </Select>
                    </Form.Item>
                    <Form.Item label="API ID（为空表示客户端维度统计）" name="apiId">
                      <Select
                          v-model:value="queryParams.apiId"
                          placeholder="请选择API ID（为空表示客户端维度统计）"
                          allowClear
                           class="w-full"
                      >
                            <Select.Option label="请选择字典生成" value="" />
                      </Select>
                    </Form.Item>
                        <Form.Item label="统计日期" name="statDate">
                          <RangePicker
                              v-model:value="queryParams.statDate"
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
    <Card title="开放平台统计">
      <template #extra>
        <VbenVxeTableToolbar
            v-model:hidden-search="hiddenSearchBar"
        >
          <Button
              class="ml-2"
              :icon="h(Plus)"
              type="primary"
              @click="handleCreate"
              v-access:code="['platform:stat:create']"
          >
            {{ $t('ui.actionTitle.create', ['开放平台统计']) }}
          </Button>
          <Button
              :icon="h(Download)"
              type="primary"
              class="ml-2"
              :loading="exportLoading"
              @click="handleExport"
              v-access:code="['platform:stat:export']"
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
              v-access:code="['platform:stat:delete']"
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
                              <VxeColumn field="id" title="统计ID" align="center" />
                    <VxeColumn field="clientId" title="客户端ID" align="center" />
                    <VxeColumn field="apiId" title="API ID（为空表示客户端维度统计）" align="center" />
                    <VxeColumn field="statDate" title="统计日期" align="center" />
                    <VxeColumn field="totalCount" title="总调用次数" align="center" />
                    <VxeColumn field="successCount" title="成功次数" align="center" />
                    <VxeColumn field="failedCount" title="失败次数" align="center" />
                    <VxeColumn field="avgDurationMs" title="平均耗时（毫秒）" align="center" />
                    <VxeColumn field="maxDurationMs" title="最大耗时（毫秒）" align="center" />
                    <VxeColumn field="totalCharge" title="总计费金额（分）" align="center" />
                    <VxeColumn field="freeCount" title="免费调用次数" align="center" />
                    <VxeColumn field="chargedCount" title="计费调用次数" align="center" />
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
                v-access:code="['platform:stat:update']"
            >
              {{ $t('ui.actionTitle.edit') }}
            </Button>
            <Button
                size="small"
                type="link"
                danger
                class="ml-2"
                @click="handleDelete(row)"
                v-access:code="['platform:stat:delete']"
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
