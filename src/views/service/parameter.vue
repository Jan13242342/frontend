<template>
  <div class="parameter-page">
    <h2>Device Parameter Query</h2>
    <el-form :inline="true" @submit.native.prevent>
      <el-form-item label="Device SN">
        <el-input v-model="sn" placeholder="Enter device SN" style="width: 240px;" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchPara">Query</el-button>
      </el-form-item>
    </el-form>
    <div v-if="para" class="result">
      <h3>Device Parameters</h3>
      <div>Updated At: {{ para.updated_at }}</div>
      <ul>
        <li v-for="(value, key) in para.para.para" :key="key">
          {{ key }}: {{ value }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { getDevicePara } from '@/api/user'
import { getToken } from '@/utils/auth'

export default {
  name: 'ParameterPage',
  data() {
    return {
      sn: '',
      para: null
    }
  },
  methods: {
    async fetchPara() {
      if (!this.sn) {
        this.$message.error('Please enter device SN')
        return
      }
      const token = getToken()
      console.log('DevicePara token:', token)
      console.log('fetchPara params:', { device_sn: this.sn })
      try {
        const res = await getDevicePara(token, { device_sn: this.sn })
        this.para = res.data
      } catch (e) {
        this.para = null
        this.$message.error(
          e?.response?.data?.msg_en ||
          e?.response?.data?.detail?.msg_en ||
          e?.response?.data?.msg ||
          e?.response?.data?.detail?.msg ||
          e?.message ||
          'Failed to get device parameters'
        )
      }
    }
  }
}
</script>

<style scoped>
.parameter-page {
  padding: 40px;
}
.parameter-page h2 {
  color: #409EFF;
  margin-bottom: 20px;
}
.result {
  margin-top: 32px;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
}
</style>
