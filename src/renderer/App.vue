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

    <a-col v-show="currentfile.type" class="fix-col" :span="22">
      <div class="picture" ref="pictureRef">
        <div class="picture__cover">
          <template v-if="!readToUpload">
            <img
              v-if="currentfile.path"
              @click="handleImagePreview(currentfile.path)"
              :src="`file://${ currentfile.path }`"
            >
          </template>
          <template v-else>
            <img
              v-if="currentfile.path"
              @click="handleImagePreview(tinyfile.path)"
              :src="`file://${ tinyfile.path }`"
            >
          </template>
        </div>
        <div class="picture__main">
          <div class="picture__title">{{ currentfile.name }}</div>
          <div class="picture__summary">
            <span :class="readToUpload? 'f2': 'f1'">{{ formateFileSize(currentfile.size) }}</span>
            <span v-if="readToUpload" class="f3">
              {{ formateFileSize(tinyfile.size) }}({{ ((tinyfile.size / currentfile.size) * 100).toFixed(2) + '%' }})
            </span>
            <span class="f3">
              <a-icon v-if="readToUpload" style="color: #52c41a;" type="check" />
              <a-icon v-else="readToUpload" style="color: #1890ff;" type="sync" spin />
            </span>
          </div>
        </div>
        <div class="picture__helper">
          <a-button type="dashed" shape="circle" icon="delete"
            :disabled="!readToUpload" @click="handleFileRemove(currentfile)"
          />
        </div>
      </div>
    </a-col>

    <a-col class="fix-col">
      <a-button
        v-if="Object.keys(imageConfigs).length > 0"
        type="primary"
        icon="cloud-upload"
        :disabled="!currentfile.type"
        :loading="currentfile.type && !readToUpload || uploading"
        @click="handlePutToOSS"
      >
        {{ (currentfile.type && !readToUpload)? '压缩图片...': '上传' }}
      </a-button>
    </a-col>

    <Setting v-model="showSetting" :data="imageConfigs" @on-submit="handleSettingSubmit"></Setting>
  </a-row>
</template>

<script>
import { defineComponent, ref, reactive, onMounted } from '@vue/composition-api'
import { message } from 'ant-design-vue'
import Setting from './setting'

import { IpcChannel } from '../main/image/constants'

const { remote, ipcRenderer, clipboard, shell } = window.require('electron')
const { Menu, MenuItem } = remote

export default defineComponent({
  components: { Setting },
  setup() {
    const imageConfigs = ref({})

    const readToUpload = ref(true)
    const uploading = ref(false)
    const currentfile = ref({})
    const tinyfile = ref({})


    const showSetting = ref(false)

    /**
     * https://gist.github.com/lanqy/5193417
     */
    const formateFileSize = bytes => {
      if (bytes === 0) return 'n/a'
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1000)), 10)
      if (i === 0) return `${bytes} ${sizes[i]}`
      return `${(bytes / (1000 ** i)).toFixed(1)} ${sizes[i]}`
    }

    const handleBeforeUpload = async (file) => {
      currentfile.value = file

      readToUpload.value = false

      ipcRenderer.send(IpcChannel.FILE_ADD, {
        name: file.name,
        path: file.path,
        size: file.size,
        type: file.type
      })

      return Promise.reject()
    }

    const handleFileRemove = file => {
      currentfile.value = {}
    }

    const handleFileSave = () => {
      ipcRenderer.send(IpcChannel.FILE_SAVE,{
        name: currentfile.value.name,
        path: currentfile.value.path
      }, {
        path: tinyfile.value.path,
        ext: tinyfile.value.ext
      })
    }

    const beforSettingClose = () => {
      console.log('before close')
      showSetting.value = false
    }

    const pictureRef = ref(null)
    onMounted(() => {
      const menu = new Menu()
      menu.append(
        new MenuItem({
          label: '保存',
          click: () => handleFileSave()
        })
      )

      pictureRef.value.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        menu.popup({
          window: remote.getCurrentWindow()
        })
      }, false)
    })

    const handlePutToOSS = () => {
      if (!tinyfile.value.path) return

      uploading.value = true
      ipcRenderer.send(IpcChannel.FILE_PUT, tinyfile.value)
    }

    const handleSettingSubmit = (data) => {
      console.log('修改配置')
      ipcRenderer.send(IpcChannel.CONFIGS_MODIFY, data)
    }

    const handleImagePreview = (path) => {
      shell.openItem(path)
    }

    onMounted(() => {
      ipcRenderer.send(IpcChannel.VIEW_READY)

      ipcRenderer.on(IpcChannel.ON_CONFIGS_MODIFY, (_, data) => {
        console.log(data)
        if (data.imageConfigs) imageConfigs.value = data.imageConfigs
        console.log('接收配置')
      })

      ipcRenderer.on(IpcChannel.FILE_DEAL, (_, file) => {
        tinyfile.value = file
        readToUpload.value = true
      })

      ipcRenderer.on(IpcChannel.SAVED_FILE, (_, file) => {
        console.log('保存成功', file)
      })

      ipcRenderer.on(IpcChannel.FILE_PUT_SUCCESS, (_, path) => {
        uploading.value = false
        clipboard.writeText(path)
        message.info('oss 地址已保存到剪切板.')
      })

      ipcRenderer.on(IpcChannel.FILE_PUT_ERROR, (_, error) => {
        console.log('上传失败', error)
        message.error(`上传失败: ${error}`)
        uploading.value = false
      })

      ipcRenderer.on(IpcChannel.MAIN_ERROR, (_,...message) => {
        console.log('error', message)
      })

      ipcRenderer.on(IpcChannel.SETTING_SHOW, () => {
        console.log('receive message')
        if (!showSetting.value) {
          showSetting.value = true
        }
      })
    })

    return {
      imageConfigs,
      pictureRef,
      formateFileSize,
      readToUpload, uploading,
      currentfile, tinyfile,
      handleBeforeUpload, handleFileRemove, handlePutToOSS,
      showSetting, beforSettingClose, handleSettingSubmit,
      handleImagePreview
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

.f1 {
  // color: ;
}
.f2 {
  color: rgb(199, 199, 199);
  text-decoration: line-through currentColor;
}
.f3 {
  margin-left: 8px;
}
</style>
