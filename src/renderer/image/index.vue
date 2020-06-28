<template>
  <a-row type="flex" justify="center">
    <a-col class="fix-col" :span="22">
      <a-upload-dragger
        class="fix-upload"
        accept="image/*"
        :beforeUpload="handleBeforeUpload"
        :showUploadList="false"
      >
        <p class="ant-upload-drag-icon"><a-icon type="file-image" /></p>
        <p class="ant-upload-text">点击或拖拽图片到该区域</p>
      </a-upload-dragger>
    </a-col>

    <a-col v-show="image.source.type" class="fix-col" :span="22">
      <div class="picture" ref="pictureRef">
        <div class="picture__cover">
          <img
            v-if="state !== 0"
            @click="preview(image.target.path || image.source.path)"
            :src="`file://${image.target.path || image.source.path}`"
          >
        </div>
        <div class="picture__main">
          <div class="picture__title">{{ image.source.name }}</div>
          <div class="picture__summary">
            <span :class="state === 2? 'f2': 'f1'">
              {{ formateFileSize(image.source.size) }}
            </span>
            <span v-if="state === 2" class="f3">
              {{ formateFileSize(image.target.size) }}
              {{ '(' + ((image.target.size / image.source.size) * 100).toFixed(2) + '%)' }}
            </span>
            <span class="f3">
              <a-icon v-if="state === 1" style="color: #1890ff;" type="sync" spin />
              <a-icon v-else-if="state === 2" style="color: #52c41a;" type="check" />
            </span>
          </div>
        </div>
        <div class="picture__helper">
          <a-button
            type="dashed"
            shape="circle"
            icon="delete"
            :disabled="state !== 2"
            @click="handleFileRemove"
          />
        </div>
      </div>
    </a-col>

    <a-col class="fix-col">
      <a-button
        v-if="Object.keys(configs).length > 0"
        type="primary"
        icon="cloud-upload"
        :disabled="state !== 2"
        :loading="uploading"
        @click="handlePutToOSS"
      >
        {{ (state !== 0 && state === 1)? '压缩图片...': '上传' }}
      </a-button>
    </a-col>

    <Setting v-model="showSetting" :data="configs" @on-submit="handleSettingChange"></Setting>
  </a-row>
</template>

<script>
import { defineComponent, ref, reactive, onMounted } from '@vue/composition-api'
import { message } from 'ant-design-vue'
import Setting from './setting'

import { IpcChannel } from '../../main/image/constants'

import { useContextMenu, useClipboard, useFilePreview } from '../common/hooks'
import { formateFileSize } from '../common/file'

const { ipcRenderer, clipboard, shell } = window.require('electron')

export default defineComponent({
  components: { Setting },
  setup() {
    const state = ref(0)  // 0: init | 1: compressing | 2: compressed

    const uploading = ref(false)

    const configs = ref({})

    const copy = useClipboard()

    const preview = useFilePreview()

    const { element: pictureRef } = useContextMenu([{
      label: '保存',
      click: () => ipcRenderer.send(
        IpcChannel.FILE_SAVE,
        image.source,
        image.target
      )
    }])

    const showSetting = ref(false)

    const image = reactive({
      source: {},
      target: {}
    })

    const handleBeforeUpload = ({ name, path, size, type }) => {
      state.value = 1

      image.source = { name, path, size, type }

      ipcRenderer.send(IpcChannel.FILE_ADD, image.source)

      return Promise.reject()
    }

    const handleFileRemove = () => {
      state.value = 0
      image.source = {}
      image.target = {}
    }

    const handlePutToOSS = () => {
      uploading.value = true
      ipcRenderer.send(IpcChannel.FILE_PUT, image.target)
    }

    const handleSettingChange = (data) => {
      showSetting.value = true
      ipcRenderer.send(IpcChannel.CONFIGS_MODIFY, data)
    }

    onMounted(() => {
      ipcRenderer.on(IpcChannel.ON_CONFIGS_MODIFY, (_, data) => {
        configs.value = data.imageConfigs || {}
      })

      ipcRenderer.on(IpcChannel.FILE_DEAL, (_, target) => {
        state.value = 2
        image.target = target
      })

      ipcRenderer.on(IpcChannel.FILE_PUT_RESULT, (_, path, errMsg) => {
        uploading.value = false
        if (errMsg) {
          message.error(`上传失败: ${errMsg}`)
        } else {
          copy(path)
          message.info('oss 地址已保存到剪切板.')
        }
      })

      ipcRenderer.on(IpcChannel.SAVED_FILE, (_, file) => {})

      ipcRenderer.on(IpcChannel.SETTING_SHOW, () => showSetting.value = true)

      ipcRenderer.on(IpcChannel.MAIN_ERROR, (_,...message) => {
        console.log('error', message)
      })

      ipcRenderer.send(IpcChannel.VIEW_READY)
    })

    return {
      state,
      pictureRef,
      preview,
      image,
      configs,
      formateFileSize,
      uploading,
      handleBeforeUpload, handleFileRemove, handlePutToOSS,
      showSetting, handleSettingChange,
    }
  }
})
</script>

<style lang="scss" scoped>
.fix-col {
  margin-top: 16px;
}
.fix-upload::v-deep .ant-upload {
  height: 296px;
}

.picture {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  height: 56px;
  padding: 8px;
  border: 0.5px rgb(230, 230, 230) solid;
  border-radius: 4px;
  user-select: none;

  &__cover {
    flex: none;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 100%;
    background-color: rgb(250, 250, 250);
    overflow: hidden;
    img {
      width: auto;
      height: 100%;
      cursor: zoom-in;
    }
  }
  &__main {
    flex: auto;
    padding: 0 8px;
    overflow: hidden;
  }
  &__title {
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    vertical-align: middle;
  }
  &__summary {
    font-size: 12px;
  }
  &__helper {
    flex: none;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.f2 {
  color: rgb(199, 199, 199);
  text-decoration: line-through currentColor;
}
.f3 {
  margin-left: 8px;
}
</style>
