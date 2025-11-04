<template>
  <div class="rpc-page">
    <h2>Remote Procedure Call</h2>
    <el-form @submit.native.prevent>
      <el-form-item label="Device SN">
        <el-input v-model="device_sn" placeholder="Enter device SN" style="width: 240px;" />
      </el-form-item>
      <el-form-item label="Parameter Name">
        <el-input v-model="para_name" placeholder="Enter parameter name" style="width: 240px;" />
      </el-form-item>
      <el-form-item label="Parameter Value">
        <el-input v-model="para_value" placeholder="Enter parameter value" style="width: 240px;" />
      </el-form-item>
      <el-form-item label="Message">
        <el-input v-model="message" placeholder="Enter message" style="width: 240px;" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="callRpc">Change Parameter</el-button>
      </el-form-item>
    </el-form>
    <div v-if="result" class="result">
      <h3>Send Result&&发送结果</h3>
      <pre>{{ result }}</pre>
    </div>
    <el-divider />
    <h3>RPC Change History</h3>
    <el-form :inline="true" @submit.native.prevent>
      <el-form-item label="Device SN">
        <el-input v-model="history_sn" placeholder="Enter device SN" style="width: 180px;" />
      </el-form-item>
      <el-form-item label="Status">
        <el-select v-model="history_status" placeholder="Select status" style="width: 120px;">
          <el-option label="Pending" value="pending" />
          <el-option label="Success" value="success" />
          <el-option label="Failed" value="failed" />
          <el-option label="Error" value="error" />
          <el-option label="Timeout" value="timeout" />
        </el-select>
      </el-form-item>
      <el-form-item label="Operator">
        <el-input v-model="history_operator" placeholder="Operator" style="width: 120px;" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchHistory">Query History</el-button>
      </el-form-item>
    </el-form>
    <el-table v-if="history.length" :data="history" style="width: 100%; margin-top: 20px;">
      <el-table-column prop="device_sn" label="Device SN" />
      <el-table-column prop="para_name" label="Parameter" />
      <el-table-column prop="para_value" label="Value" />
      <el-table-column prop="operator" label="Operator" />
      <el-table-column prop="status" label="Status" />
      <el-table-column prop="message" label="Message" />
      <el-table-column prop="created_at" label="Created At" />
      <el-table-column prop="confirmed_at" label="Confirmed At" />
    </el-table>
  </div>
</template>

<script>
import { rpcChangePara, getRpcHistory } from '@/api/user'
import { getToken } from '@/utils/auth'

export default {
  name: 'RemoteProcedureCallPage',
  data() {
    return {
      device_sn: '',
      para_name: '',
      para_value: '',
      message: '',
      result: null,
      history_sn: '',
      history_status: '',
      history_operator: '',
      history: []
    }
  },
  methods: {
    async callRpc() {
      const token = getToken()
      if (!this.device_sn || !this.para_name || !this.para_value) {
        this.$message.error('Please fill in all required fields')
        return
      }
      try {
        const payload = {
          device_sn: this.device_sn,
          para_name: this.para_name,
          para_value: this.para_value,
          message: this.message
        }
        const res = await rpcChangePara(token, payload)
        this.result = res.data
        this.$message.success('Parameter send successfully&参数下发成功')
      } catch (e) {
        this.result = null
        this.$message.error(
          e?.response?.data?.msg_en ||
          e?.response?.data?.detail?.msg_en ||
          e?.response?.data?.msg ||
          e?.response?.data?.detail?.msg ||
          e?.message ||
          'Failed to send parameter'
        )
      }
    },
    async fetchHistory() {
      const token = getToken()
      const params = {
        device_sn: this.history_sn || undefined,
        status: this.history_status || undefined,
        operator: this.history_operator || undefined,
        page: 1,
        page_size: 40
      }
      try {
        const res = await getRpcHistory(token, params)
        this.history = res.data.items || []
      } catch (e) {
        this.history = []
        this.$message.error(
          e?.response?.data?.msg_en ||
          e?.response?.data?.detail?.msg_en ||
          e?.response?.data?.msg ||
          e?.response?.data?.detail?.msg ||
          e?.message ||
          'Failed to fetch history'
        )
      }
    }
  }
}
</script>

<style scoped>
.rpc-page {
  padding: 40px;
}
.rpc-page h2 {
  color: #67C23A;
  margin-bottom: 20px;
}
.result {
  margin-top: 32px;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 6px;
}
</style>
