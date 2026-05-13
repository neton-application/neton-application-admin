<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PrivchatBotApi } from '#/api/privchat/bot';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, message, Modal, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteBot,
  disableBot,
  enableBot,
  getBotDetail,
  getBotPage,
} from '#/api/privchat/bot';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import BotFormDrawer from './modules/BotFormDrawer.vue';
import BotMenuDrawer from './modules/BotMenuDrawer.vue';

const router = useRouter();

function handleOwnerClick(row: PrivchatBotApi.BotItem) {
  router.push({
    name: 'PrivchatUserDetail',
    query: { uid: row.owner_user_id },
  });
}

const [Grid, gridApi] = useVbenVxeGrid<PrivchatBotApi.BotItem>({
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
          return await getBotPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<PrivchatBotApi.BotItem>,
} as any);

const formOpen = ref(false);
const formBot = ref<null | PrivchatBotApi.BotDetail>(null);
const menuOpen = ref(false);
const menuBotId = ref<null | number>(null);

function handleCreate() {
  formBot.value = null;
  formOpen.value = true;
}

async function handleEdit(row: PrivchatBotApi.BotItem) {
  try {
    formBot.value = await getBotDetail(row.id);
    formOpen.value = true;
  } catch (e: any) {
    message.error(e?.response?.data?.message ?? e?.message ?? '加载失败');
  }
}

function handleConfigMenu(row: PrivchatBotApi.BotItem) {
  menuBotId.value = row.id;
  menuOpen.value = true;
}

function handleEnable(row: PrivchatBotApi.BotItem) {
  Modal.confirm({
    title: '启用机器人',
    content: `确定启用「${row.name ?? `user:${row.id}`}」（id=${row.id}）？`,
    onOk: async () => {
      await enableBot(row.id);
      message.success('已启用');
      gridApi.query();
    },
  });
}

function handleDisable(row: PrivchatBotApi.BotItem) {
  Modal.confirm({
    title: '停用机器人',
    content: `停用后，该 bot 的 bot/menu/get 返回 20903；现有会话保留但菜单不显示。继续？`,
    okType: 'danger',
    onOk: async () => {
      await disableBot(row.id);
      message.success('已停用');
      gridApi.query();
    },
  });
}

function handleDelete(row: PrivchatBotApi.BotItem) {
  Modal.confirm({
    title: '删除机器人',
    content: `仅删除本地 bot_profile，**不**删除 PrivChat user_id=${row.id}（如需删除用户，请到「用户管理」操作）。继续？`,
    okText: '确认删除',
    okType: 'danger',
    onOk: async () => {
      await deleteBot(row.id);
      message.success('已删除');
      gridApi.query();
    },
  });
}

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="机器人管理">
      <template #toolbar-actions>
        <Button type="primary" @click="handleCreate"> 创建机器人 </Button>
      </template>

      <template #ownerCell="{ row }">
        <a class="text-blue-500 hover:underline" @click="handleOwnerClick(row)">
          {{ row.owner_name ?? row.owner_username ?? `user:${row.owner_user_id}` }}
        </a>
        <div class="text-xs text-gray-400">#{{ row.owner_user_id }}</div>
      </template>

      <template #serviceCell="{ row }">
        <Tag color="blue">
          {{ row.service_name ?? `service:${row.service_id}` }}
        </Tag>
      </template>

      <template #menuCell="{ row }">
        <Tag :color="row.has_menu ? 'green' : 'default'">
          {{ row.has_menu ? '已配置' : '无菜单' }}
        </Tag>
      </template>

      <template #statusCell="{ row }">
        <Tag :color="row.status === 1 ? 'green' : 'red'">
          {{ row.status === 1 ? '启用' : '停用' }}
        </Tag>
      </template>

      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['privchat:bot:operate'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '菜单',
              type: 'link',
              auth: ['privchat:bot:operate'],
              onClick: handleConfigMenu.bind(null, row),
            },
            {
              label: row.status === 1 ? '停用' : '启用',
              type: 'link',
              danger: row.status === 1,
              auth: ['privchat:bot:operate'],
              onClick:
                row.status === 1
                  ? handleDisable.bind(null, row)
                  : handleEnable.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              auth: ['privchat:bot:operate'],
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>

    <BotFormDrawer
      v-model:open="formOpen"
      :bot="formBot"
      @saved="refreshGrid"
    />

    <BotMenuDrawer
      v-model:open="menuOpen"
      :bot-id="menuBotId"
      @saved="refreshGrid"
    />
  </Page>
</template>
