<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PrivchatGroupApi } from '#/api/privchat/group';

import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { message, Modal } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { dissolveGroup, getGroupPage } from '#/api/privchat/group';
import { $t } from '#/locales';

import { useGridColumns } from './data';

const router = useRouter();

function handleViewDetail(row: PrivchatGroupApi.Group) {
  router.push({
    name: 'PrivchatGroupDetail',
    query: { groupId: row.group_id },
  });
}

const [Grid, gridApi] = useVbenVxeGrid<PrivchatGroupApi.Group>({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getGroupPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'group_id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: false,
    },
  } as VxeTableGridOptions<PrivchatGroupApi.Group>,
} as any);

function handleDissolve(row: PrivchatGroupApi.Group) {
  Modal.confirm({
    title: '解散群组',
    content: `确定解散「${row.name ?? row.group_id}」吗？该操作会删除全部成员关系并标记频道为已删除，无法恢复。`,
    okText: '确认解散',
    okType: 'danger',
    onOk: async () => {
      await dissolveGroup(row.group_id);
      message.success('已解散');
      gridApi.query();
    },
  });
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="IM 群组管理">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['privchat:group:view'],
              onClick: handleViewDetail.bind(null, row),
            },
            {
              label: '解散',
              type: 'link',
              danger: true,
              auth: ['privchat:group:operate'],
              onClick: handleDissolve.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
