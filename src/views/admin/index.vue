<template>
  <div class="rpc-page">

    <el-card class="box-card" style="margin-bottom: 24px;">
      <div slot="header" class="clearfix">
        <span>🚀 Remote Device Control</span>
      </div>

      <h3>Remote Procedure Call</h3>
      <el-form
        ref="rpcForm"
        :model="rpcForm"
        :rules="rpcRules"
        label-width="120px"
        @submit.native.prevent
      >
        <el-form-item label="Device SN" prop="device_sn">
          <el-input v-model="rpcForm.device_sn" placeholder="Enter device SN" style="width: 280px;" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="Param Name" prop="para_name">
              <el-input v-model="rpcForm.para_name" placeholder="Enter parameter name" style="width: 280px;" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="Param Value" prop="para_value">
              <el-input v-model="rpcForm.para_value" placeholder="Enter parameter value" style="width: 280px;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Message">
          <el-input v-model="rpcForm.message" placeholder="Enter message (optional)" style="width: 280px;" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loadingRpc" @click="submitRpcForm">Change Parameter</el-button>
        </el-form-item>
      </el-form>
      <div v-if="result" class="result">
        <h3>Send Result & 发送结果</h3>
        <pre>{{ result | pretty }}</pre>
      </div>

      <el-divider />

      <h3>⚡️ OTA Quick Actions</h3>
      <el-form :inline="true" style="margin-bottom: 24px;" @submit.native.prevent>
        <el-form-item label="Device SN">
          <el-input
            v-model="rpcForm.device_sn"
            placeholder="Enter device SN from above"
            style="width: 280px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="success" :disabled="!rpcForm.device_sn" :loading="loadingRpc" @click="sendOtaAction('draft')">一键OTA Draft</el-button>
          <el-button type="info" :disabled="!rpcForm.device_sn" :loading="loadingRpc" style="margin-left: 10px;" @click="sendOtaAction('latest')">一键OTA Latest</el-button>
          <el-button type="warning" :disabled="!rpcForm.device_sn" :loading="loadingRpc" style="margin-left: 10px;" @click="sendOtaAction('testing')">一键OTA Testing</el-button>
        </el-form-item>
      </el-form>
      <div v-if="otaResult" class="result">
        <h3>OTA Send Result</h3>
        <pre>{{ otaResult | pretty }}</pre>
      </div>

    </el-card>

    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>📊 RPC Change History</span>
      </div>

      <el-form :inline="true" @submit.native.prevent>
        <el-form-item label="Device SN">
          <el-input v-model="history_sn" placeholder="Enter device SN" style="width: 180px;" clearable />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="history_status" placeholder="Select status" style="width: 120px;" clearable>
            <el-option label="Pending" value="pending" />
            <el-option label="Success" value="success" />
            <el-option label="Failed" value="failed" />
            <el-option label="Error" value="error" />
            <el-option label="Timeout" value="timeout" />
          </el-select>
        </el-form-item>
        <el-form-item label="Operator">
          <el-input v-model="history_operator" placeholder="Operator" style="width: 120px;" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loadingHistory" @click="fetchHistory">Query History</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loadingHistory"
        :data="history"
        style="width: 100%; margin-top: 20px;"
        :empty-text="history_sn ? '未找到该设备的下发记录' : '请先输入查询条件'"
      >
        <el-table-column prop="device_sn" label="Device SN" width="180" />
        <el-table-column prop="para_name" label="Parameter" width="150" />
        <el-table-column prop="para_value" label="Value" width="150" show-overflow-tooltip />
        <el-table-column prop="operator" label="Operator" width="120" />
        <el-table-column prop="status" label="Status" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusTag(scope.row.status)" size="small">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="Message" min-width="150" show-overflow-tooltip />
        <el-table-column prop="created_at" label="Created At" width="180" />
        <el-table-column prop="confirmed_at" label="Confirmed At" width="180" />
      </el-table>
    </el-card>

  </div>
</template>

<script>
import { rpcChangePara, getRpcHistory } from '@/api/user'
import { getToken } from '@/utils/auth'

export default {
  name: 'RemoteProcedureCallPage',
  filters: {
    pretty(val) {
      return typeof val === 'string' ? val : JSON.stringify(val, null, 2)
    }
  },
  data() {
    return {
      // Loading 状态
      loadingRpc: false,
      loadingHistory: false,

      // --- OTA快捷操作 ---
      // ota_sn: '',  // <-- 已移除，复用 rpcForm.device_sn
      otaResult: null,

      // --- RPC参数下发 (统一为一个对象) ---
      rpcForm: {
        device_sn: '',
        para_name: '',
        para_value: '',
        message: ''
      },
      rpcRules: {
        device_sn: [{ required: true, message: '请输入设备SN', trigger: 'blur' }],
        para_name: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
        para_value: [{ required: true, message: '请输入参数值', trigger: 'blur' }]
      },
      result: null,

      // --- RPC历史 ---
      history_sn: '',
      history_status: '',
      history_operator: '',
      history: []
    }
  },
  methods: {
    // --- 辅助方法 ---
    getStatusTag(status) {
      const map = {
        success: 'success',
        pending: 'info',
        failed: 'danger',
        error: 'danger',
        timeout: 'warning'
      }
      return map[status.toLowerCase()] || 'info'
    },
    getErrorMessage(e) {
      return (
        e?.response?.data?.msg_en ||
        e?.response?.data?.detail?.msg_en ||
        e?.response?.data?.msg ||
        e?.response?.data?.detail?.msg ||
        e?.message ||
        '请求失败'
      )
    },

    // --- OTA 统一方法 (重构) ---
    async sendOtaAction(type) {
      const token = getToken()

      // 关键改动：检查 rpcForm.device_sn
      if (!this.rpcForm.device_sn) {
        this.$message.error('Please enter device SN')
        return
      }

      this.loadingRpc = true
      try {
        const payload = {
          // 关键改动：使用 rpcForm.device_sn
          device_sn: this.rpcForm.device_sn,
          para_name: 'ota_action',
          para_value: type,
          message: `ota ${type}`
        }
        const res = await rpcChangePara(token, payload)
        this.otaResult = res.data
        this.$message.success(`OTA ${type.toUpperCase()} sent successfully`)
      } catch (e) {
        this.otaResult = null
        this.$message.error(this.getErrorMessage(e))
      } finally {
        this.loadingRpc = false
      }
    },

    // --- RPC 参数下发 (优化：使用表单验证) ---
    submitRpcForm() {
      this.$refs.rpcForm.validate(async(valid) => {
        if (valid) {
          await this.callRpc()
        } else {
          this.$message.error('请填写完整的必填项')
          return false
        }
      })
    },
    async callRpc() {
      const token = getToken()
      this.loadingRpc = true
      try {
        const res = await rpcChangePara(token, this.rpcForm)
        this.result = res.data
        this.$message.success('Parameter send successfully & 参数下发成功')
      } catch (e) {
        this.result = null
        this.$message.error(this.getErrorMessage(e))
      } finally {
        this.loadingRpc = false
      }
    },

    // --- RPC 历史查询 ---
    async fetchHistory() {
      const token = getToken()
      this.loadingHistory = true
      this.history = [] // 清空旧数据
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
        if (this.history.length === 0) {
          this.$message.info('未找到符合条件的记录')
        }
      } catch (e) {
        this.history = []
        this.$message.error(this.getErrorMessage(e))
      } finally {
        this.loadingHistory = false
      }
    }
  }
}
</script>

<style scoped>
.rpc-page {
  padding: 40px;
}
/* 卡片标题 */
.box-card ::v-deep .el-card__header {
  background-color: #f5f7fa;
}
.box-card span {
  font-weight: bold;
  font-size: 18px;
  color: #409EFF;
}

/* 卡片内部的子标题 */
.box-card h3 {
  margin-top: 0; /* 移除卡片内第一个h3的上边距 */
  margin-bottom: 20px;
  color: #303133;
}

.result {
  margin-top: 24px;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  white-space: pre-wrap; /* 允许文本换行 */
}
.result pre {
    margin: 0;
    overflow-x: auto; /* 确保 JSON 格式化后不溢出 */
}

/* 调整表单项宽度，使其在卡片内更协调 */
/* 统一一个宽度或使用百分比 */
/* 示例中已使用内联style设置，这里保留 */
</style>
