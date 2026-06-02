<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { GameClubApi } from '#/api/game/club';

import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { createClubByAdmin, getClubPage, updateClubBasic } from '#/api/game/club';

const router = useRouter();

const [Grid, gridApi] = useVbenVxeGrid<GameClubApi.ClubListItem>({
  formOptions: {
    schema: [
      {
        fieldName: 'club_id',
        label: '俱乐部 ID',
        component: 'InputNumber',
        componentProps: { allowClear: true, min: 1 },
      },
      {
        fieldName: 'name',
        label: '名称',
        component: 'Input',
        componentProps: { allowClear: true, placeholder: '模糊搜索 (ILIKE)' },
      },
      {
        fieldName: 'owner_user_id',
        label: '创建人 user_id',
        component: 'InputNumber',
        componentProps: { allowClear: true, min: 1 },
      },
      {
        fieldName: 'status',
        label: '状态',
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: [
            { label: 'ACTIVE', value: 1 },
            { label: 'DISSOLVED', value: 2 },
          ],
        },
      },
    ],
  },
  gridOptions: {
    columns: [
      { field: 'club_id', title: 'ID', width: 100, fixed: 'left' },
      { field: 'name', title: '名称', minWidth: 200 },
      {
        field: 'description',
        title: '描述',
        minWidth: 240,
        showOverflow: 'tooltip',
      },
      { field: 'owner_user_id', title: '创建人', width: 130 },
      {
        field: 'status',
        title: '状态',
        width: 110,
        slots: { default: 'statusCell' },
      },
      { field: 'member_count', title: '成员数', width: 100 },
      {
        field: 'created_at',
        title: '创建时间',
        width: 170,
        formatter: ({ cellValue }) =>
          cellValue ? formatDateTime(cellValue) : '-',
      },
      {
        field: 'action',
        title: '操作',
        width: 170,
        fixed: 'right',
        slots: { default: 'actionCell' },
      },
    ],
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getClubPage({
            page: page.currentPage,
            page_size: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'club_id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<GameClubApi.ClubListItem>,
} as any);

function statusLabel(s: number): { color: string; text: string } {
  if (s === 1) return { color: 'green', text: 'ACTIVE' };
  if (s === 2) return { color: 'default', text: 'DISSOLVED' };
  return { color: 'default', text: `status=${s}` };
}

function openDetail(row: GameClubApi.ClubListItem) {
  router.push({
    name: 'GameClubDetail',
    query: { clubId: String(row.club_id) },
  });
}

// 短期 admin 协助经营者编辑俱乐部基础信息 (manage 路由组未启用前的代理).
const editOpen = ref(false);
const editing = ref(false);
const editForm = reactive({
  clubId: 0,
  origName: '',
  origDescription: '',
  name: '',
  description: '',
});

function openEdit(row: GameClubApi.ClubListItem) {
  editForm.clubId = row.club_id;
  editForm.origName = row.name;
  editForm.origDescription = row.description ?? '';
  editForm.name = row.name;
  editForm.description = row.description ?? '';
  editOpen.value = true;
}

// 后台代用户建俱乐部 (POST /admin/game/clubs/create) — app 端禁止自助创建。
const createOpen = ref(false);
const creating = ref(false);
const createForm = reactive({
  owner_user_id: undefined as number | undefined,
  name: '',
  description: '',
});

function openCreate() {
  createForm.owner_user_id = undefined;
  createForm.name = '';
  createForm.description = '';
  createOpen.value = true;
}

async function submitCreate() {
  if (!createForm.owner_user_id || createForm.owner_user_id <= 0) {
    message.error('创建人 user_id 必填且 > 0');
    return;
  }
  if (!createForm.name.trim()) {
    message.error('名称必填');
    return;
  }
  if (createForm.name.length > 64) {
    message.error('名称长度需 ≤ 64');
    return;
  }
  if (createForm.description.length > 256) {
    message.error('描述长度需 ≤ 256');
    return;
  }
  creating.value = true;
  try {
    await createClubByAdmin({
      owner_user_id: createForm.owner_user_id,
      name: createForm.name.trim(),
      description: createForm.description.trim() || null,
    });
    message.success('创建成功');
    createOpen.value = false;
    await gridApi.query();
  } catch (e: any) {
    message.error(`创建失败: ${e?.message ?? e}`);
  } finally {
    creating.value = false;
  }
}

async function submitEdit() {
  if (!editForm.name.trim()) {
    message.error('名称必填');
    return;
  }
  if (editForm.name.length > 64) {
    message.error('名称长度需 ≤ 64');
    return;
  }
  if (editForm.description.length > 256) {
    message.error('描述长度需 ≤ 256');
    return;
  }
  // 只把改了的字段传给后端 (缺字段 = 不改; description 传 "" 等于清空).
  const patch: GameClubApi.UpdateBasicRequest = {};
  if (editForm.name !== editForm.origName) patch.name = editForm.name.trim();
  if (editForm.description !== editForm.origDescription) {
    patch.description = editForm.description.trim();
  }
  if (!patch.name && patch.description === undefined) {
    message.info('未做修改');
    editOpen.value = false;
    return;
  }
  editing.value = true;
  try {
    await updateClubBasic(editForm.clubId, patch);
    message.success('保存成功');
    editOpen.value = false;
    await gridApi.query();
  } catch (e: any) {
    message.error(`保存失败: ${e?.message ?? e}`);
  } finally {
    editing.value = false;
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="俱乐部管理 (admin 视角)">
      <template #toolbar-tools>
        <Button type="primary" @click="openCreate">新增俱乐部</Button>
      </template>
      <template #statusCell="{ row }">
        <Tag :color="statusLabel(row.status).color">
          {{ statusLabel(row.status).text }}
        </Tag>
      </template>
      <template #actionCell="{ row }">
        <Button size="small" type="link" @click="openDetail(row)">详情</Button>
        <Button size="small" type="link" @click="openEdit(row)">编辑</Button>
      </template>
    </Grid>

    <Modal
      v-model:open="createOpen"
      title="新增俱乐部 (admin 代建)"
      :confirm-loading="creating"
      width="520"
      :destroy-on-close="true"
      @ok="submitCreate"
    >
      <Form :label-col="{ span: 6 }">
        <FormItem label="创建人 user_id" required>
          <InputNumber
            v-model:value="createForm.owner_user_id"
            :min="1"
            style="width: 100%"
            placeholder="必填: 经营者用户 ID"
          />
        </FormItem>
        <FormItem label="名称" required>
          <Input
            v-model:value="createForm.name"
            :max-length="64"
            placeholder="必填 ≤ 64 字"
            show-count
          />
        </FormItem>
        <FormItem label="描述">
          <Textarea
            v-model:value="createForm.description"
            :max-length="256"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            placeholder="可选 ≤ 256 字"
            show-count
          />
        </FormItem>
      </Form>
    </Modal>

    <Modal
      v-model:open="editOpen"
      :title="`编辑俱乐部 #${editForm.clubId}`"
      :confirm-loading="editing"
      width="520"
      :destroy-on-close="true"
      @ok="submitEdit"
    >
      <Form :label-col="{ span: 5 }">
        <FormItem label="名称" required>
          <Input
            v-model:value="editForm.name"
            :max-length="64"
            placeholder="必填 ≤ 64 字"
            show-count
          />
        </FormItem>
        <FormItem label="描述">
          <Textarea
            v-model:value="editForm.description"
            :max-length="256"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            placeholder="可选 ≤ 256 字; 清空等于删除描述"
            show-count
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
