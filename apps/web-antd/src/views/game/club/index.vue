<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { GameClubApi } from '#/api/game/club';

import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Button, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getClubPage } from '#/api/game/club';

const router = useRouter();

const [Grid] = useVbenVxeGrid<GameClubApi.ClubListItem>({
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
        width: 110,
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
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="俱乐部管理 (admin 视角)">
      <template #statusCell="{ row }">
        <Tag :color="statusLabel(row.status).color">
          {{ statusLabel(row.status).text }}
        </Tag>
      </template>
      <template #actionCell="{ row }">
        <Button size="small" type="link" @click="openDetail(row)">详情</Button>
      </template>
    </Grid>
  </Page>
</template>
