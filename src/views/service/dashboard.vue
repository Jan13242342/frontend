<template>
  <div class="alarm-summary-container">
    <el-card class="dashboard-card" shadow="hover">
      <div slot="header" class="card-header">
        <div class="header-left">
          <i class="el-icon-s-data header-icon" />
          <span class="title">Monitor Summary</span>
        </div>
      </div>

      <div v-if="loading" class="loading-box">
        <i class="el-icon-loading" /> Loading...
      </div>

      <div v-else>
        <div class="kpi-row">
          <div class="kpi-item">
            <div class="kpi-label">Total Devices</div>
            <div class="kpi-value primary-color">{{ safeData(deviceSummary.total_devices) }}</div>
          </div>
          <div class="kpi-divider" />
          <div class="kpi-item">
            <div class="kpi-label">Online</div>
            <div class="kpi-value success-color">{{ safeData(deviceSummary.online_devices) }}</div>
          </div>
          <div class="kpi-divider" />
          <div class="kpi-item">
            <div class="kpi-label">Alarms</div>
            <div class="kpi-value danger-color">{{ safeData(alarmSummary.unhandled_alarm_count) }}</div>
          </div>
        </div>

        <el-divider class="custom-divider" />

        <div class="charts-area">
          <div class="chart-wrapper">
            <div class="chart-header">
              <i class="el-icon-connection" /> Device Status
            </div>
            <div ref="onlinePie" class="chart-canvas" style="height: 220px; width: 100%;" />
          </div>

          <div class="chart-wrapper">
            <div class="chart-header">
              <i class="el-icon-warning-outline" /> Alarm Levels
            </div>
            <div ref="levelPie" class="chart-canvas" style="height: 220px; width: 100%;" />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { alarm_summary, online_summary } from '@/api/user'
import { getToken } from '@/utils/auth'
import * as echarts from 'echarts'

export default {
  name: 'AlarmAndDeviceSummary',
  data() {
    return {
      alarmSummary: { level_counts: {}}, // 给个默认结构防止报错
      deviceSummary: {},
      loading: false,
      levelPieChart: null,
      onlinePieChart: null
    }
  },
  // 【关键修复 1】监听数据变化，数据变了再画图
  watch: {
    deviceSummary: {
      handler() { this.$nextTick(() => this.renderOnlinePie()) },
      deep: true
    },
    alarmSummary: {
      handler() { this.$nextTick(() => this.renderLevelPie()) },
      deep: true
    }
  },
  mounted() {
    this.fetchData()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.disposeCharts()
  },
  methods: {
    safeData(val) {
      return val !== undefined && val !== null ? val : 0
    },
    async fetchData() {
      this.loading = true
      try {
        const token = getToken()
        // 并行请求
        const [alarmRes, deviceRes] = await Promise.all([
          alarm_summary(token).catch(e => ({ data: { unhandled_alarm_count: 0, level_counts: {}}})),
          online_summary(token).catch(e => ({ data: { total_devices: 0, online_devices: 0, offline_devices: 0 }}))
        ])

        this.alarmSummary = alarmRes.data || { level_counts: {}}
        this.deviceSummary = deviceRes.data || {}

        // 数据获取完，DOM更新后，强制重绘一次
        this.$nextTick(() => {
          this.renderOnlinePie()
          this.renderLevelPie()
        })
      } catch (e) {
        console.error('Summary Fetch Error:', e)
      } finally {
        this.loading = false
      }
    },

    renderOnlinePie() {
      const el = this.$refs.onlinePie
      // 【关键修复 2】如果没有找到 DOM，或者处于 loading，直接返回
      if (!el || this.loading) return

      if (!this.onlinePieChart) this.onlinePieChart = echarts.init(el)

      const online = this.safeData(this.deviceSummary.online_devices)
      const offline = this.safeData(this.deviceSummary.offline_devices)

      // 【关键修复 3】如果数据全是 0，显示灰色占位圆环
      let chartData = []
      if (online === 0 && offline === 0) {
        chartData = [{ value: 0, name: 'No Devices', itemStyle: { color: '#f2f2f2' }}]
      } else {
        chartData = [
          { value: online, name: 'Online', itemStyle: { color: '#67C23A' }},
          { value: offline, name: 'Offline', itemStyle: { color: '#F56C6C' }}
        ]
      }

      this.onlinePieChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '0', left: 'center', icon: 'circle' },
        series: [{
          name: 'Device Status',
          type: 'pie',
          radius: ['50%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold' }},
          data: chartData
        }]
      }, true) // true 表示不合并，完全重绘
    },

    renderLevelPie() {
      const el = this.$refs.levelPie
      if (!el || this.loading) return

      if (!this.levelPieChart) this.levelPieChart = echarts.init(el)

      const counts = this.alarmSummary.level_counts || {}
      let data = Object.keys(counts).map(key => ({ name: key, value: counts[key] }))

      // 处理空数据
      if (data.length === 0 || data.every(d => d.value === 0)) {
        data = [{ value: 0, name: 'No Alarms', itemStyle: { color: '#f2f2f2' }}]
      }

      this.levelPieChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '0', left: 'center', icon: 'circle' },
        series: [{
          name: 'Alarm Level',
          type: 'pie',
          radius: ['50%', '70%'],
          center: ['50%', '45%'],
          itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: '14', fontWeight: 'bold' }},
          data: data
        }]
      }, true)
    },

    handleResize() {
      this.onlinePieChart && this.onlinePieChart.resize()
      this.levelPieChart && this.levelPieChart.resize()
    },
    disposeCharts() {
      if (this.onlinePieChart) { this.onlinePieChart.dispose(); this.onlinePieChart = null }
      if (this.levelPieChart) { this.levelPieChart.dispose(); this.levelPieChart = null }
    }
  }
}
</script>

<style scoped>
.alarm-summary-container {
  padding: 10px;
  width: 100%;
}
.dashboard-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left { display: flex; align-items: center; gap: 8px; }
.header-icon { font-size: 18px; color: #409EFF; }
.title { font-size: 16px; font-weight: 600; color: #303133; }

/* KPI Styles */
.kpi-row { display: flex; justify-content: space-around; align-items: center; padding: 15px 0; }
.kpi-item { text-align: center; flex: 1; }
.kpi-label { font-size: 12px; color: #909399; margin-bottom: 6px; }
.kpi-value { font-size: 24px; font-weight: 700; line-height: 1.2; }
.kpi-divider { width: 1px; height: 30px; background-color: #E4E7ED; }
.primary-color { color: #409EFF; }
.success-color { color: #67C23A; }
.danger-color { color: #F56C6C; }
.custom-divider { margin: 10px 0 20px 0; }

/* Chart Area */
.charts-area {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.chart-wrapper {
  background: #F9FAFC;
  border-radius: 8px;
  padding: 15px;
  /* 确保容器撑开 */
  flex: 1;
}
.chart-header {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 15px;
  display: flex; align-items: center; gap: 6px;
}
.chart-canvas {
  width: 100%;
  /* 显式高度非常重要 */
  min-height: 220px;
}
.loading-box { padding: 40px 0; text-align: center; color: #909399; }

/* 宽屏并排 */
@media screen and (min-width: 1200px) {
  .charts-area { flex-direction: row; }
}
</style>
