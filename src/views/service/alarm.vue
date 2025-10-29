<template>
  <div class="alarm-summary">
    <el-card class="alarm-card">
      <h3 class="title">Alarm & Device Summary</h3>
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="alarmSummary && deviceSummary">
        <div class="summary-item">
          <span class="label">Online Devices:</span>
          <span class="value">{{ deviceSummary && deviceSummary.online_devices ? deviceSummary.online_devices : 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Devices:</span>
          <span class="value">{{ deviceSummary && deviceSummary.total_devices ? deviceSummary.total_devices : 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Offline Devices:</span>
          <span class="value">{{ deviceSummary && deviceSummary.offline_devices ? deviceSummary.offline_devices : 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Unhandled Alarms:</span>
          <span class="value">{{ alarmSummary && alarmSummary.unhandled_alarm_count ? alarmSummary.unhandled_alarm_count : 0 }}</span>
        </div>
        <div class="level-title">Alarm Levels:</div>
        <div class="level-list">
          <div v-for="(count, level) in alarmSummary.level_counts" :key="level" class="level-item">
            <span class="level-name">{{ level }}:</span>
            <span class="level-value">{{ count ? count : 0 }}</span>
          </div>
        </div>
        <!-- 新增：各等级比例饼图 -->
        <div class="chart-title">Alarm Level Ratio</div>
        <div ref="levelPie" class="level-pie-chart" />
        <!-- 新增：在线与离线比例饼图 -->
        <div class="chart-title">Online vs Offline Ratio</div>
        <div ref="onlinePie" class="online-pie-chart" />
      </div>
      <div v-else class="no-data">No Data Available</div>
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
      alarmSummary: null,
      deviceSummary: null,
      loading: false,
      levelPieChart: null,
      onlinePieChart: null
    }
  },
  watch: {
    alarmSummary() {
      this.$nextTick(this.renderLevelPie)
    },
    deviceSummary() {
      this.$nextTick(this.renderOnlinePie)
    }
  },
  async mounted() {
    this.loading = true
    try {
      const token = getToken()
      const [alarmRes, deviceRes] = await Promise.all([
        alarm_summary(token),
        online_summary(token)
      ])
      this.alarmSummary = alarmRes.data || {}
      this.deviceSummary = deviceRes.data || {}
      this.$nextTick(() => {
        this.renderLevelPie()
        this.renderOnlinePie()
      })
    } catch (e) {
      this.$message.error(
        e?.response?.data?.msg_en ||
        e?.response?.data?.detail?.msg_en ||
        e?.response?.data?.msg ||
        e?.response?.data?.detail?.msg ||
        e?.message ||
        'Failed to fetch data'
      )
    } finally {
      this.loading = false
    }
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    if (this.levelPieChart) {
      this.levelPieChart.dispose()
      this.levelPieChart = null
    }
    if (this.onlinePieChart) {
      this.onlinePieChart.dispose()
      this.onlinePieChart = null
    }
  },
  methods: {
    handleResize() {
      if (this.levelPieChart) this.levelPieChart.resize()
      if (this.onlinePieChart) this.onlinePieChart.resize()
    },
    renderLevelPie() {
      if (!this.alarmSummary || !this.alarmSummary.level_counts) return
      const el = this.$refs.levelPie
      if (!el) return
      if (!this.levelPieChart) {
        this.levelPieChart = echarts.init(el)
      }
      const levelData = Object.entries(this.alarmSummary.level_counts).map(([level, count]) => ({
        name: level,
        value: count
      }))
      this.levelPieChart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
          type: 'pie',
          radius: '65%',
          center: ['50%', '50%'],
          data: levelData,
          label: {
            formatter: '{b}\n{d}%',
            fontSize: 12
          }
        }]
      })
    },
    renderOnlinePie() {
      if (!this.deviceSummary) return
      const el = this.$refs.onlinePie
      if (!el) return
      if (!this.onlinePieChart) {
        this.onlinePieChart = echarts.init(el)
      }
      const online = this.deviceSummary.online_devices ? this.deviceSummary.online_devices : 0
      const offline = this.deviceSummary.offline_devices ? this.deviceSummary.offline_devices : 0
      this.onlinePieChart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
          type: 'pie',
          radius: '65%',
          center: ['50%', '50%'],
          data: [
            { value: online, name: 'Online', itemStyle: { color: '#67C23A' }},
            { value: offline, name: 'Offline', itemStyle: { color: '#F56C6C' }}
          ],
          label: {
            formatter: '{b}\n{d}%',
            fontSize: 12
          }
        }]
      })
    }
  }
}
</script>

<style scoped>
.alarm-summary {
  padding: 20px;
}
.alarm-card {
  width: 420px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 14px;
}
.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
}
.label {
  font-size: 14px;
  color: #606266;
}
.value {
  font-size: 14px;
  font-weight: bold;
  color: #409EFF;
}
.level-title {
  font-size: 15px;
  font-weight: bold;
  margin-top: 14px;
  margin-bottom: 7px;
}
.level-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.level-item {
  display: flex;
  justify-content: space-between;
}
.level-name {
  font-size: 13px;
  color: #909399;
}
.level-value {
  font-size: 13px;
  font-weight: bold;
  color: #F56C6C;
}
.chart-title {
  font-size: 15px;
  font-weight: bold;
  margin-top: 18px;
  margin-bottom: 8px;
}
.level-pie-chart,
.online-pie-chart {
  width: 100%;
  height: 180px;
  min-height: 120px;
  margin-bottom: 10px;
}
.loading, .no-data {
  text-align: center;
  font-size: 14px;
  color: #909399;
  margin: 20px 0;
}
</style>
