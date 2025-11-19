<!-- eslint-disable vue/no-dupe-keys -->
<!-- eslint-disable vue/no-dupe-keys -->
<!-- eslint-disable vue/no-dupe-keys -->
<template>
  <div class="rpc-page">
    <!-- Only Firmware Audit Log Card -->
    <el-card class="box-card" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>🔍 Firmware Audit Log</span>
      </div>

      <el-form :inline="true" @submit.native.prevent>
        <el-form-item label="Action">
          <el-select v-model="auditFilters.action" placeholder="Select action" style="width: 160px;" clearable>
            <el-option label="Upload" value="upload" />
            <el-option label="Delete" value="delete" />
            <el-option label="Update" value="update" />
          </el-select>
        </el-form-item>

        <el-form-item label="Performed By">
          <el-input v-model="auditFilters.performed_by" placeholder="Operator" style="width: 160px;" clearable />
        </el-form-item>

        <el-form-item label="Device Type">
          <el-input v-model="auditFilters.device_type" placeholder="Device Type" style="width: 160px;" clearable />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loadingAudit" @click="onAuditSearch">Query Audit Log</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loadingAudit"
        :data="auditList"
        style="width: 100%; margin-top: 16px;"
        size="small"
        :empty-text="auditList.length ? 'No records' : 'No records found'"
      >
        <el-table-column prop="action" label="Action" width="120" />
        <el-table-column prop="performed_by" label="Performed By" width="160" />
        <el-table-column prop="performed_at" label="Performed At" width="200" />
        <el-table-column prop="device_type" label="Device Type" width="140" />
        <el-table-column prop="version" label="Version" width="120" />
        <el-table-column prop="status" label="Status" width="120" />
        <el-table-column prop="details" label="Details" min-width="360" show-overflow-tooltip>
          <template slot-scope="scope">
            <div v-if="scope.row.details && typeof scope.row.details === 'object'">
              <div v-if="scope.row.details.min_hardware_version !== undefined">
                Min HW Version: {{ scope.row.details.min_hardware_version || '-' }}
              </div>
              <div v-if="scope.row.details.file_size !== undefined">
                File Size: {{ scope.row.details.file_size || '-' }}
              </div>
              <div v-if="scope.row.details.md5 !== undefined">
                MD5: {{ scope.row.details.md5 || '-' }}
              </div>
              <div v-if="scope.row.details.filename !== undefined">
                Filename: {{ scope.row.details.filename || '-' }}
              </div>
            </div>
            <span v-else>
              {{ scope.row.details }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 12px; display: flex; justify-content: flex-end; align-items: center;">
        <el-pagination
          :total="auditTotal"
          :current-page="auditPage"
          :page-size="auditPageSize"
          layout="prev, pager, next, sizes, total"
          small
          @current-change="onAuditPageChange"
          @size-change="onAuditSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { getFirmwareAuditLog } from '@/api/user'
import { getToken } from '@/utils/auth'

export default {
  name: 'FirmwareAuditLogPage',
  data() {
    return {
      auditFilters: {
        action: '',
        performed_by: '',
        device_type: ''
      },
      auditList: [],
      loadingAudit: false,
      auditTotal: 0,
      auditPage: 1,
      auditPageSize: 20
    }
  },
  methods: {
    async fetchFirmwareAudit() {
      const token = getToken()
      this.loadingAudit = true
      this.auditList = []
      this.auditTotal = 0

      const params = {
        action: this.auditFilters.action || undefined,
        performed_by: this.auditFilters.performed_by || undefined,
        device_type: this.auditFilters.device_type || undefined,
        page: this.auditPage,
        page_size: this.auditPageSize
      }

      try {
        const res = await getFirmwareAuditLog(params, token)
        const raw = res?.data ?? res
        this.auditList = Array.isArray(raw?.items) ? raw.items : (Array.isArray(raw) ? raw : [])
        this.auditTotal = raw?.total ?? (this.auditList.length || 0)
        if (!this.auditList.length) {
          this.$message.info('No audit logs found')
        }
      } catch (e) {
        console.error('fetchFirmwareAudit error:', e)
        this.auditList = []
        this.auditTotal = 0
        this.$message.error(e?.message || 'Request failed')
      } finally {
        this.loadingAudit = false
      }
    },
    onAuditSearch() {
      this.auditPage = 1
      this.fetchFirmwareAudit()
    },
    onAuditPageChange(page) {
      this.auditPage = page
      this.fetchFirmwareAudit()
    },
    onAuditSizeChange(size) {
      this.auditPageSize = size
      this.auditPage = 1
      this.fetchFirmwareAudit()
    },
    clearAuditFilters() {
      this.auditFilters = { action: '', performed_by: '', device_type: '' }
      this.auditPage = 1
      this.fetchFirmwareAudit()
    }
  }
}
</script>

<style scoped>
.rpc-page {
  padding: 40px;
}
.box-card ::v-deep .el-card__header {
  background-color: #f5f7fa;
}
.box-card span {
  font-weight: bold;
  font-size: 18px;
  color: #409EFF;
}
</style>
