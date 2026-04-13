<script lang="ts" setup>
import type { ClientApi } from '#/api/platform/client';

import { h, onMounted, reactive, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { useTableToolbar, VbenVxeTableToolbar } from '@vben/plugins/vxe-table';
import {
  cloneDeep,
  downloadFileFromBlobPart,
  formatDateTime,
  isEmpty,
} from '@vben/utils';
import { Download, Plus, Trash2 } from '@vben/icons';
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Pagination,
  Select,
} from 'ant-design-vue';

import { DictTag } from '#/components/dict-tag';
import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import {
  deleteClient,
  deleteClientList,
  exportClient,
  getClientPage,
} from '#/api/platform/client';
import { $t } from '#/locales';

import ClientForm from './modules/form.vue';


const loading = ref(true) // 列表的加载中
const list = ref<ClientApi.Client[]>([]) // 列表的数据

const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  appId: undefined,
  status: undefined,
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const params = cloneDeep(queryParams) as any;
              const data = await getClientPage(params)
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
  connectedComponent: ClientForm,
  destroyOnClose: true,
});

/** 创建开放平台客户端 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑开放平台客户端 */
function handleEdit(row: ClientApi.Client) {
  formModalApi.setData(row).open();
}


/** 删除开放平台客户端 */
async function handleDelete(row: ClientApi.Client) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteClient(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    await getList();
  } finally {
    hideLoading();
  }
}

/** 批量删除开放平台客户端 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
  });
  try {
    await deleteClientList(checkedIds.value);
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
  records: ClientApi.Client[];
}) {
  checkedIds.value = records.map((item) => item.id!);
}

/** 导出表格 */
async function handleExport() {
try {
  exportLoading.value = true;
  const data = await exportClient(queryParams);
  downloadFileFromBlobPart({ fileName: '开放平台客户端.xls', source: data });
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
                    <Form.Item label="应用标识" name="appId">
                      <Input 
                          v-model:value="queryParams.appId"
                          placeholder="请输入应用标识"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="客户端名称" name="name">
                      <Input
                          v-model:value="queryParams.name"
                          placeholder="请输入客户端名称"
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
        <Form.Item>
          <Button class="ml-2" @click="resetQuery"> 重置 </Button>
          <Button class="ml-2" @click="handleQuery" type="primary">
            搜索
          </Button>
        </Form.Item>
      </Form>
    </Card>

    <!-- 列表 -->
    <Card title="开放平台客户端">
      <template #extra>
        <VbenVxeTableToolbar
            v-model:hidden-search="hiddenSearchBar"
        >
          <Button
              class="ml-2"
              :icon="h(Plus)"
              type="primary"
              @click="handleCreate"
              v-access:code="['platform:client:create']"
          >
            {{ $t('ui.actionTitle.create', ['客户端']) }}
          </Button>
          <Button
              :icon="h(Download)"
              type="primary"
              class="ml-2"
              :loading="exportLoading"
              @click="handleExport"
              v-access:code="['platform:client:export']"
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
              v-access:code="['platform:client:delete']"
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
                    <VxeColumn field="id" title="客户端ID" align="center" width="120" />
                    <VxeColumn field="appId" title="应用标识" align="center" width="160" />
                    <VxeColumn field="name" title="客户端名称" align="center" width="160" />
                    <VxeColumn field="remark" title="备注" align="center" width="160" />
                    <VxeColumn field="contactName" title="联系人姓名" align="center" width="120" />
                    <VxeColumn field="contactMobile" title="联系人手机号" align="center" width="120" />
                    <VxeColumn field="status" title="状态" align="center" width="120">
                      <template #default="{row}">
                        <dict-tag :type="DICT_TYPE.PLATFORM_CLIENT_STATUS" :value="row.status" />
                      </template>
                    </VxeColumn>
                    <VxeColumn field="createdAt" title="创建时间" align="center" width="160">
                      <template #default="{row}">
                        {{formatDateTime(row.createdAt)}}
                      </template>
                    </VxeColumn>
        <VxeColumn field="operation" title="操作" align="center" width="120">
          <template #default="{row}">
            <Button
                size="small"
                type="link"
                @click="handleEdit(row)"
                v-access:code="['platform:client:update']"
            >
              {{ $t('ui.actionTitle.edit') }}
            </Button>
            <Button
                size="small"
                type="link"
                danger
                class="ml-2"
                @click="handleDelete(row)"
                v-access:code="['platform:client:delete']"
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
