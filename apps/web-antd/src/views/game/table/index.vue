<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { GameTableApi } from '#/api/game/table';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';

import { Modal, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { forceCloseTable, getTablePage } from '#/api/game/table';
import { $t } from '#/locales';

import { TABLE_STATE_OPTIONS, useGridColumns, useGridFormSchema } from './data';

const router = useRouter();

function handleViewDetail(row: GameTableApi.TableListItem) {
  router.push({
    name: 'GameTableDetail',
    query: { tableId: row.table_id },
  });
}

function handleForceClose(row: GameTableApi.TableListItem) {
  Modal.confirm({
    title: `强关桌 ${row.table_id}?`,
    content: `当前 state=${stateLabel(row.state)} phase=${row.phase ?? '-'}; 强关后玩家无法继续 action.`,
    okText: '确认强关',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      await forceCloseTable(row.table_id, { reason: 'admin force close' });
      Modal.success({ title: `桌 ${row.table_id} 已 CLOSED` });
      gridApi.reload();
    },
  });
}

function stateLabel(state: number): string {
  return (
    TABLE_STATE_OPTIONS.find((o) => o.value === state)?.label ?? `state=${state}`
  );
}

function stateColor(state: number): string {
  switch (state) {
    case 0: {
      return 'green';
    }
    case 1: {
      return 'blue';
    }
    case 2: {
      return 'orange';
    }
    case 3: {
      return 'default';
    }
    default: {
      return 'default';
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid<GameTableApi.TableListItem>({
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
          return await getTablePage({
            page: page.currentPage,
            page_size: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'table_id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<GameTableApi.TableListItem>,
} as any);

// 抑制 unused warning (modal helper 未直接用, 但保留导入以便后续接 modal 模式)
void useVbenModal;
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="游戏牌桌管理">
      <template #stateCell="{ row }">
        <Tag :color="stateColor(row.state)">{{ stateLabel(row.state) }}</Tag>
      </template>
      <template #phaseCell="{ row }">
        <Tag v-if="row.phase" color="purple">{{ row.phase }}</Tag>
        <span v-else>-</span>
      </template>
      <template #playerCountCell="{ row }">
        {{ row.player_count }} / {{ row.seat_count }}
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['game:table:read'],
              onClick: handleViewDetail.bind(null, row),
            },
            {
              label: '强关',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['game:table:force_close'],
              ifShow: () => row.state !== 3,
              onClick: handleForceClose.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
