<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { GameAuditApi } from '#/api/game/audit';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAuditPage } from '#/api/game/audit';

import { useGridColumns, useGridFormSchema } from './data';

const [Grid] = useVbenVxeGrid<GameAuditApi.Event>({
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
          return await getAuditPage({
            page: page.currentPage,
            page_size: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<GameAuditApi.Event>,
} as any);
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="游戏审计日志 (跨桌)">
      <template #scopeCell="{ row }">
        {{ row.scope_type ?? '-' }}:{{ row.scope_id ?? '-' }}
      </template>
    </Grid>
  </Page>
</template>
