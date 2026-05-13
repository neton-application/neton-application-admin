import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/privchat/user/detail',
    component: () => import('#/views/privchat/user/detail/index.vue'),
    name: 'PrivchatUserDetail',
    meta: {
      title: 'IM 用户详情',
      icon: 'lucide:user-cog',
      activePath: '/privchat/user',
      hideInMenu: true,
    },
  },
  {
    path: '/privchat/conversation',
    component: () => import('#/views/privchat/conversation/index.vue'),
    name: 'PrivchatConversation',
    meta: {
      title: '聊天记录',
      icon: 'lucide:message-square-text',
      hideInMenu: true,
    },
  },
  {
    path: '/privchat/group/detail',
    component: () => import('#/views/privchat/group/detail/index.vue'),
    name: 'PrivchatGroupDetail',
    meta: {
      title: 'IM 群详情',
      icon: 'lucide:users',
      activePath: '/privchat/group',
      hideInMenu: true,
    },
  },
];

export default routes;
