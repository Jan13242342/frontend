import axios from 'axios'

const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // 这里必须是 /api
  timeout: 5000
})

export default service
