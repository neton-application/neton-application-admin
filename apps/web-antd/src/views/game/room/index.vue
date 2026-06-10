<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { GameAdminRoomApi } from '#/api/game/admin-room';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';

import { Modal, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { forceCloseRoom, getRoomPage } from '#/api/game/admin-room';
import { $t } from '#/locales';

import { ROOM_STATE_OPTIONS, useGridColumns, useGridFormSchema } from './data';

const router = useRouter();

// ROOM-MATCH-1: Room has no detail page. The action button below is gone; users
//   navigate to Match Detail (ROOM-MATCH-2) from the Match list instead.

function handleForceClose(row: GameAdminRoomApi.TableListItem) {
  Modal.confirm({
    title: `强关桌 ${row.room_id}?`,
    content: `当前 state=${stateLabel(row.state)} phase=${row.phase ?? '-'}; 强关后玩家无法继续 action.`,
    okText: '确认强关',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      await forceCloseRoom(row.room_id, { reason: 'admin force close' });
      Modal.success({ title: `桌 ${row.room_id} 已 CLOSED` });
      gridApi.reload();
    },
  });
}

function stateLabel(state: number): string {
  return (
    ROOM_STATE_OPTIONS.find((o) => o.value === state)?.label ?? `state=${state}`
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

const [Grid, gridApi] = useVbenVxeGrid<GameAdminRoomApi.TableListItem>({
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
          return await getRoomPage({
            page: page.currentPage,
            page_size: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'room_id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<GameAdminRoomApi.TableListItem>,
} as any);

// 抑制 unused warning (modal helper 未直接用, 但保留导入以便后续接 modal 模式)
void useVbenModal;
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="房间管理">
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
              label: '强关',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['game:room:force_close'],
              ifShow: () => row.state !== 3,
              onClick: handleForceClose.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
