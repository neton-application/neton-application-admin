import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/account/user/detail',
    component: () => import('#/views/account/user/detail/index.vue'),
    name: 'AccountUserDetail',
    meta: {
      title: '账号详情',
      icon: 'lucide:user',
      activePath: '/account/user',
      hideInMenu: true,
    },
  },
];

export default routes;
