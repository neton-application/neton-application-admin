<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PrivchatUserApi } from '#/api/privchat/user';

import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getUserPage } from '#/api/privchat/user';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';

const router = useRouter();

function handleViewDetail(row: PrivchatUserApi.User) {
  router.push({
    name: 'PrivchatUserDetail',
    query: { uid: row.user_id },
  });
}

function statusColor(status?: string): string {
  switch (status) {
    case 'Active': {
      return 'green';
    }
    case 'Suspended': {
      return 'red';
    }
    case 'Deleted': {
      return 'default';
    }
    default: {
      return 'orange';
    }
  }
}

const [Grid] = useVbenVxeGrid<PrivchatUserApi.User>({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getUserPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'user_id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<PrivchatUserApi.User>,
} as any);
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="IM 用户管理">
      <template #statusCell="{ row }">
        <Tag :color="statusColor(row.status)">
          {{ row.status ?? '-' }}
        </Tag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['privchat:user:view'],
              onClick: handleViewDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
