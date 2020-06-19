import OSS from 'ali-oss'

let OSSClient = null

const setOSSClient = configs => {
  OSSClient = new OSS({
    internal: false,
    secure: true,
    ...configs
  })
}

const putImageToOss = file => {
  return OSSClient.put(file.hash + file.ext, file.path)
}

export { OSSClient, setOSSClient, putImageToOss }
