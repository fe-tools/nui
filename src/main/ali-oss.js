import OSS from 'ali-oss'

let OSSClient = null

const setOSSClient = (configs) => {
  const client = new OSS({
    internal: false,
    secure: true,
    ...configs
  })

  OSSClient = client
}

export { OSSClient, setOSSClient }
