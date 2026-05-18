<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { GameLedgerApi } from '#/api/game/ledger';

import { ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Col, Row, Statistic, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getLedgerPage, getLedgerSummary } from '#/api/game/ledger';

import { useGridColumns, useGridFormSchema } from './data';

const summary = ref<GameLedgerApi.Summary>({
  total_debit: 0,
  total_credit: 0,
  net: 0,
  row_count: 0,
});
const lastParams = ref<Record<string, any>>({});

async function refreshSummary(params: Record<string, any>) {
  const s = await getLedgerSummary(params);
  summary.value = s;
}

const [Grid, gridApi] = useVbenVxeGrid<GameLedgerApi.Entry>({
  formOptions: { schema: useGridFormSchema() },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          lastParams.value = formValues ?? {};
          // 主请求 (page + summary), 但 ajax 只用 list+total; summary 单独再拉一次
          const data = await getLedgerPage({
            page: page.currentPage,
            page_size: page.pageSize,
            ...formValues,
          });
          // 不阻塞主返回; summary async
          refreshSummary(formValues ?? {});
          return data;
        },
      },
    },
    rowConfig: { keyField: 'created_at', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<GameLedgerApi.Entry>,
} as any);

// 抑制 unused
void gridApi;
watch(lastParams, () => {}, { deep: true });

function directionLabel(d: number): string {
  if (d === 1) return 'CREDIT';
  if (d === -1) return 'DEBIT';
  return `dir=${d}`;
}

function directionColor(d: number): string {
  if (d === 1) return 'green';
  if (d === -1) return 'red';
  return 'default';
}
</script>

<template>
  <Page auto-content-height>
    <Card class="mb-4" title="资金流水汇总 (按当前筛选)">
      <Row :gutter="16">
        <Col :span="6">
          <Statistic title="Total Debit" :value="summary.total_debit" />
        </Col>
        <Col :span="6">
          <Statistic title="Total Credit" :value="summary.total_credit" />
        </Col>
        <Col :span="6">
          <Statistic
            title="Net (Credit - Debit)"
            :value="summary.net"
            :value-style="{
              color: summary.net >= 0 ? '#3f8600' : '#cf1322',
            }"
          />
        </Col>
        <Col :span="6">
          <Statistic title="Row Count" :value="summary.row_count" />
        </Col>
      </Row>
    </Card>

    <Grid table-title="游戏资金流水 (跨桌)">
      <template #directionCell="{ row }">
        <Tag :color="directionColor(row.direction)">
          {{ directionLabel(row.direction) }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>
