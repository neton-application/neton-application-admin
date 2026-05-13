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

/**
 * 系统用户管理（user_type=1）。
 *
 * v1 范围：列表骨架。复用 `/privchat/user/page` API + 固定 `userType=1` 过滤。
 * 创建 / 编辑 / service_id 绑定后续单独迭代。
 *
 * 与机器人管理（user_type=2，有 owner_user_id）是两条独立路径。
 */
const router = useRouter();

function handleViewDetail(row: PrivchatUserApi.User) {
  // 复用既有 IM 用户详情页
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
    case 'Deleted': {
      return 'default';
    }
    case 'Suspended': {
      return 'red';
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
          // user_type=1 固定，由调用方在此 hardcode；前端不暴露这个 query。
          return await getUserPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            userType: 1,
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
    <Grid table-title="系统用户管理">
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
              auth: ['privchat:system-user:view'],
              onClick: handleViewDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
