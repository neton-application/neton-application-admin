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
                clientId: undefined,
                clientName: undefined,
                clientCode: undefined,
                companyName: undefined,
                businessLicense: undefined,
                contactName: undefined,
                contactEmail: undefined,
                contactPhone: undefined,
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
                    <Form.Item label="客户端唯一标识（公开）" name="clientId">
                      <Input 
                          v-model:value="queryParams.clientId"
                          placeholder="请输入客户端唯一标识（公开）"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="客户端名称" name="clientName">
                      <Input
                          v-model:value="queryParams.clientName"
                          placeholder="请输入客户端名称"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="客户端编码（英文标识）" name="clientCode">
                      <Input
                          v-model:value="queryParams.clientCode"
                          placeholder="请输入客户端编码（英文标识）"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="公司名称" name="companyName">
                      <Input
                          v-model:value="queryParams.companyName"
                          placeholder="请输入公司名称"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="营业执照号" name="businessLicense">
                      <Input
                          v-model:value="queryParams.businessLicense"
                          placeholder="请输入营业执照号"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="联系人姓名" name="contactName">
                      <Input
                          v-model:value="queryParams.contactName"
                          placeholder="请输入联系人姓名"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="联系人邮箱" name="contactEmail">
                      <Input
                          v-model:value="queryParams.contactEmail"
                          placeholder="请输入联系人邮箱"
                          allowClear
                          @pressEnter="handleQuery"
                           class="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="联系人电话" name="contactPhone">
                      <Input
                          v-model:value="queryParams.contactPhone"
                          placeholder="请输入联系人电话"
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
                    <VxeColumn field="clientLogo" title="客户端Logo" align="center" width="100" />
                    <VxeColumn field="id" title="客户端ID" align="center" width="120" />
                    <VxeColumn field="clientId" title="客户端唯一标识（公开）" align="center" width="120" />
                    <VxeColumn field="clientName" title="客户端名称" align="center" width="120" />
                    <VxeColumn field="clientCode" title="客户端编码（英文标识）" align="center" width="120" />
                    <VxeColumn field="description" title="客户端描述" align="center" width="120" />
                    <VxeColumn field="companyName" title="公司名称" align="center" width="120" />
                    <VxeColumn field="businessLicense" title="营业执照号" align="center" width="120" />
                    <VxeColumn field="contactName" title="联系人姓名" align="center" width="120" />
                    <VxeColumn field="contactEmail" title="联系人邮箱" align="center" width="120" />
                    <VxeColumn field="contactPhone" title="联系人电话" align="center" width="120" />
                    <VxeColumn field="status" title="状态" align="center" width="120">
                      <template #default="{row}">
                        <dict-tag :type="DICT_TYPE.PLATFORM_CLIENT_STATUS" :value="row.status" />
                      </template>
                    </VxeColumn>
                    <VxeColumn field="clientType" title="客户端类型" align="center" width="120">
                      <template #default="{row}">
                        <dict-tag :type="DICT_TYPE.PLATFORM_CLIENT_TYPE" :value="row.clientType" />
                      </template>
                    </VxeColumn>
                    <VxeColumn field="rateLimitPerMin" title="每分钟频率限制（次/分钟）" align="center" width="120" />
                    <VxeColumn field="rateLimitPerDay" title="每日调用配额" align="center" width="120" />
                    <VxeColumn field="usedCountToday" title="今日已用次数" align="center" width="120" />
                    <VxeColumn field="totalUsedCount" title="累计调用次数" align="center" width="120" />
                    <VxeColumn field="balance" title="账户余额（分）" align="center" width="120" />
                    <VxeColumn field="totalCharged" title="累计消费金额（分）" align="center" width="120" />
                    <VxeColumn field="lowBalanceAlert" title="余额不足预警阈值（分，默认100元）" align="center" width="120" />
                    <VxeColumn field="allowedIps" title="允许的IP白名单" align="center" width="120" />
                    <VxeColumn field="webhookUrl" title="回调地址（接收平台通知）" align="center" width="120" />
                    <VxeColumn field="expiredTime" title="过期时间（为空表示永久有效）" align="center" width="120">
                      <template #default="{row}">
                        {{formatDateTime(row.expiredTime)}}
                      </template>
                    </VxeColumn>
                    <VxeColumn field="lastCallTime" title="最后调用时间" align="center" width="120">
                      <template #default="{row}">
                        {{formatDateTime(row.lastCallTime)}}
                      </template>
                    </VxeColumn>
                    <VxeColumn field="createTime" title="创建时间" align="center" width="120">
                      <template #default="{row}">
                        {{formatDateTime(row.createTime)}}
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
