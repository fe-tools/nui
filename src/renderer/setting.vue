<template>
  <a-drawer
    title="设置"
    width="100%"
    :closable="true"
    :visible="value"
    @close="beforSettingClose"
  >
    <a-form-model
      ref="formRef"
      :model="form"
      :rules="rules"
      hideRequiredMark
    >
      <a-form-model-item label="region" prop="region">
        <a-input v-model="form.region"/>
      </a-form-model-item>
      <a-form-model-item label="access-key-id" prop="accessKeyId">
        <a-input v-model="form.accessKeyId"/>
      </a-form-model-item>
      <a-form-model-item label="access-key-secret" prop="accessKeySecret">
        <a-input v-model="form.accessKeySecret"/>
      </a-form-model-item>
      <a-form-model-item label="bucket" prop="bucket">
        <a-input v-model="form.bucket"/>
      </a-form-model-item>
      <a-form-model-item>
        <a-button type="primary" @click="handleSubmit">保存设置</a-button>
      </a-form-model-item>
    </a-form-model>
  </a-drawer>
</template>

<script>
import { defineComponent, reactive, ref, watch } from '@vue/composition-api'
import { Form } from 'ant-design-vue'

export default defineComponent({
  props: {
    value: Boolean,
    data: Object
  },
  setup(props, { emit }) {
    const formRef = ref(null)

    const form = ref({
      region: '',
      accessKeyId: '',
      accessKeySecret: '',
      bucket: ''
    })

    const rules = {
      region: [ { required: true, message: '请输入 region', trigger: 'change' } ],
      accessKeyId: [ { required: true, message: '请输入 access-key-id', trigger: 'change' } ],
      accessKeySecret: [ { required: true, message: '请输入 access-key-secret', trigger: 'change' } ],
      bucket: [ { required: true, message: '请输入 bucket', trigger: 'change' } ],
    }

    const handleSubmit = () => {
      formRef.value.validate(valid => {
        if (!valid) return
        emit('on-submit', {...form.value})
        emit('input', false)
      })
    }

    const beforSettingClose = () => {
      emit('input', false)
    }

    watch(() => props.data, (value) => {
      if (Object.keys(value).length !== 0) {
        form.value = value
      }
    })

    return {
      formRef, form, rules, handleSubmit,
      beforSettingClose
    }
  }
})
</script>

<style>

</style>