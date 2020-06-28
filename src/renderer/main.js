import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
import antVue from 'ant-design-vue';
import App from './image/index.vue'

import 'ant-design-vue/dist/antd.css'

Vue.use(antVue)
Vue.use(VueCompositionApi)

Vue.config.productionTip = false

new Vue({
  render: function (h) { return h(App) },
}).$mount('#app')
