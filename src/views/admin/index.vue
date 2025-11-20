<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-warning-outline" /> 报警管理 | Alarm Management</span>
        <el-button type="text" icon="el-icon-refresh" @click="fetchAlarms">刷新</el-button>
      </div>

      <el-form :inline="true" :model="filters" size="small" class="filter-form" @submit.native.prevent>
        <el-form-item label="Device SN">
          <el-input v-model="filters.device_sn" placeholder="输入设备SN" clearable prefix-icon="el-icon-cpu" style="width: 200px;" />
        </el-form-item>

        <el-form-item label="Alarm Type">
          <el-input v-model="filters.alarm_type" placeholder="报警类型" clearable prefix-icon="el-icon-bell" style="width: 160px;" />
        </el-form-item>

        <el-form-item label="Status">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 140px;">
            <el-option v-for="(label, val) in statusMap" :key="val" :label="label.text" :value="val">
              <span :style="{ color: label.color }">●</span> {{ label.text }}
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Level">
          <el-select v-model="filters.level" placeholder="全部等级" clearable style="width: 140px;">
            <el-option v-for="(label, val) in levelMap" :key="val" :label="label.text" :value="val">
              <el-tag size="mini" :type="label.type" effect="plain">{{ label.text }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Code">
          <el-input-number v-model="filters.code" :min="0" controls-position="right" placeholder="Code" style="width: 120px;" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="el-icon-search" :loading="loading" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-refresh-left" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table
        v-loading="loading"
        :data="alarms"
        style="width: 100%"
        size="medium"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        border
      >
        <el-table-column prop="alarm_id" label="ID" width="80" align="center" />

        <el-table-column prop="device_sn" label="Device SN" min-width="140" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="link-type">{{ scope.row.device_sn }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="alarm_type" label="Alarm Type" width="140" show-overflow-tooltip />

        <el-table-column prop="code" label="Code" width="80" align="center">
          <template slot-scope="scope">
            <el-tag type="info" size="mini">{{ scope.row.code }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="level" label="Level" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getLevelType(scope.row.level)" effect="dark" size="small">
              {{ scope.row.level ? scope.row.level.toUpperCase() : '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="Status" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)" effect="light" size="small">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="repeat_count" label="Count" width="80" align="center">
          <template slot-scope="scope">
            <span style="font-weight: bold; color: #606266;">{{ scope.row.repeat_count || 1 }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="last_triggered_at" label="Last Triggered" width="160" sortable show-overflow-tooltip />

        <el-table-column prop="message" label="Message" min-width="200" show-overflow-tooltip />

        <el-table-column label="Actions" width="100" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" icon="el-icon-view" @click="showDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          :total="total"
          :current-page.sync="page"
          :page-size.sync="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="fetchAlarms"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <el-dialog title="报警详情 (Alarm Details)" :visible.sync="detailVisible" width="800px" append-to-body>
      <div v-if="currentRow">
        <el-descriptions border :column="2" size="medium">
          <el-descriptions-item label="Alarm ID">{{ currentRow.alarm_id }}</el-descriptions-item>
          <el-descriptions-item label="Code">{{ currentRow.code }}</el-descriptions-item>
          <el-descriptions-item label="Device SN">{{ currentRow.device_sn }}</el-descriptions-item>
          <el-descriptions-item label="Alarm Type">{{ currentRow.alarm_type }}</el-descriptions-item>

          <el-descriptions-item label="Level">
            <el-tag :type="getLevelType(currentRow.level)" size="small">{{ currentRow.level }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Status">
            <el-tag :type="getStatusType(currentRow.status)" size="small">{{ currentRow.status }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Repeat Count">
            <strong style="font-size: 16px;">{{ currentRow.repeat_count || 1 }}</strong>
          </el-descriptions-item>

          <el-descriptions-item label="Duration">
            -
          </el-descriptions-item>

          <el-descriptions-item label="First Triggered">{{ currentRow.first_triggered_at }}</el-descriptions-item>
          <el-descriptions-item label="Last Triggered">{{ currentRow.last_triggered_at }}</el-descriptions-item>

          <el-descriptions-item label="Message" :span="2">{{ currentRow.message }}</el-descriptions-item>
        </el-descriptions>

        <el-collapse style="margin-top: 20px;">
          <el-collapse-item title="查看原始数据 (Raw JSON)" name="1">
            <pre class="json-viewer">{{ JSON.stringify(currentRow, null, 2) }}</pre>
          </el-collapse-item>
        </el-collapse>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" icon="el-icon-document-copy" @click="copyDetail">复制 JSON</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getAllAlarms } from '@/api/user'
import { getToken } from '@/utils/auth'

export default {
  name: 'AlarmListPage',
  data() {
    return {
      statusMap: {
        pending: { text: 'Pending', type: 'warning', color: '#E6A23C' },
        active: { text: 'Active', type: 'danger', color: '#F56C6C' },
        resolved: { text: 'Resolved', type: 'success', color: '#67C23A' },
        cleared: { text: 'Cleared', type: 'info', color: '#909399' }
      },
      levelMap: {
        critical: { text: 'Critical', type: 'danger' },
        major: { text: 'Major', type: 'warning' },
        minor: { text: 'Minor', type: '' },
        info: { text: 'Info', type: 'info' }
      },
      filters: {
        device_sn: '',
        status: '',
        level: '',
        code: undefined,
        alarm_type: ''
      },
      alarms: [],
      loading: false,
      total: 0,
      page: 1,
      pageSize: 20,
      detailVisible: false,
      currentRow: null
    }
  },
  methods: {
    getStatusType(status) {
      return this.statusMap[status] ? this.statusMap[status].type : 'info'
    },
    getLevelType(level) {
      return this.levelMap[level] ? this.levelMap[level].type : 'info'
    },
    async fetchAlarms() {
      const token = getToken()
      this.loading = true
      const params = {
        page: this.page,
        page_size: this.pageSize,
        ...this.filters
      }
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) delete params[key]
      })

      try {
        const res = await getAllAlarms(params, token)
        const raw = res?.data ?? res
        this.alarms = Array.isArray(raw?.items) ? raw.items : (Array.isArray(raw) ? raw : [])
        this.total = raw?.total ?? this.alarms.length
      } catch (e) {
        console.error('fetchAlarms error:', e)
        this.$message.error(e?.message || 'Failed to fetch data')
        this.alarms = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },
    onSearch() {
      this.page = 1
      this.fetchAlarms()
    },
    resetFilters() {
      this.filters = {
        device_sn: '',
        status: '',
        level: '',
        code: undefined,
        alarm_type: ''
      }
      this.onSearch()
    },
    onSizeChange(size) {
      this.pageSize = size
      this.fetchAlarms()
    },
    showDetail(row) {
      this.currentRow = row
      this.detailVisible = true
    },
    copyDetail() {
      if (!this.currentRow) return
      const text = JSON.stringify(this.currentRow, null, 2)
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => this.$message.success('JSON 已复制到剪贴板'))
          .catch(() => this.$message.error('复制失败'))
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          this.$message.success('JSON 已复制到剪贴板')
        } catch (err) {
          this.$message.error('复制失败')
        }
        document.body.removeChild(textArea)
      }
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
}
.filter-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.filter-form .el-form-item {
  margin-bottom: 10px;
}
.table-card {
  min-height: 500px;
}
.link-type {
  color: #409EFF;
  cursor: pointer;
  font-weight: 500;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.json-viewer {
  background: #f4f4f5;
  padding: 15px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  color: #606266;
  max-height: 300px;
  overflow: auto;
}
</style>
