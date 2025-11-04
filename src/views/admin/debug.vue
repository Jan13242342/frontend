<template>
  <div>
    <h1>Debug 页面</h1>
    <el-form @submit.native.prevent>
      <el-form-item label="Device SN">
        <el-input v-model="device_sn" placeholder="请输入设备SN" style="width: 240px;" />
      </el-form-item>
      <el-form-item label="Parameter Name">
        <el-input v-model="para_name" placeholder="请输入参数名" style="width: 240px;" />
      </el-form-item>
      <el-form-item label="Parameter Value">
        <el-input v-model="para_value" placeholder="请输入参数值" style="width: 240px;" />
      </el-form-item>
      <el-form-item label="Message">
        <el-input v-model="message" placeholder="请输入消息" style="width: 240px;" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="callRpc">发送参数</el-button>
        <el-button type="success" @click="subscribeTopic" style="margin-left: 10px;">订阅主题</el-button>
      </el-form-item>
    </el-form>
    <div v-if="result" class="result">
      <h3>发送结果</h3>
      <pre>{{ result }}</pre>
    </div>
    <div v-if="mqttMsg" class="result">
      <h3>MQTT调试消息</h3>
      <pre>{{ mqttMsg }}</pre>
    </div>
  </div>
</template>

<script>
import { rpcChangePara } from '@/api/user'
import { getToken } from '@/utils/auth'

const mqtt = window.mqtt

export default {
  name: 'AdminDebug',
  data() {
    return {
      device_sn: '',
      para_name: '',
      para_value: '',
      message: 'Debug',
      result: null,
      mqttMsg: '',
      mqttClient: null
    }
  },
  mounted() {
    const client = mqtt.connect('ws://37.114.34.61:8083/mqtt')
    this.mqttClient = client
    client.on('connect', () => {
      // 初始不自动订阅
    })
    client.on('message', (topic, message) => {
      this.mqttMsg = `主题: ${topic}\n消息: ${message.toString()}`
    })
  },
  beforeDestroy() {
    if (this.mqttClient) {
      this.mqttClient.end()
    }
  },
  methods: {
    async callRpc() {
      const token = getToken()
      if (!this.device_sn || !this.para_name || !this.para_value) {
        this.$message.error('请填写所有必填项')
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
        this.$message.success('参数发送成功')
      } catch (e) {
        this.result = null
        this.$message.error(
          e?.response?.data?.msg_en ||
          e?.response?.data?.detail?.msg_en ||
          e?.response?.data?.msg ||
          e?.response?.data?.detail?.msg ||
          e?.message ||
          '发送参数失败'
        )
      }
    },
    subscribeTopic() {
      if (!this.device_sn) {
        this.$message.error('请先输入设备SN')
        return
      }
      const topic = `devices/${this.device_sn}/debug`
      this.mqttClient.subscribe(topic, err => {
        if (!err) {
          this.$message.success(`已订阅MQTT主题: ${topic}`)
        } else {
          this.$message.error('订阅失败')
        }
      })
    }
  }
}
</script>

<style scoped>
.result {
  margin-top: 32px;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 6px;
}
</style>
