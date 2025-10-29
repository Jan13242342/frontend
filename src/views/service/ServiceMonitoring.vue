<template>
  <div class="energy-history-page">
    <div class="area-row">
      <!-- 实时监控区域 -->
      <el-card class="energy-card">
        <h3 class="title">Energy Monitoring</h3>
        <div class="sn-input-row">
          <el-input
            v-model="deviceSn"
            placeholder="Please enter device SN"
            style="width: 240px;"
            @keyup.enter="fetchRealtime"
          />
          <el-button type="primary" @click="fetchRealtime" :loading="loading" style="margin-left: 10px;">Query</el-button>
          <el-button
            type="success"
            @click="toggleAutoRefresh"
            style="margin-left: 10px;"
            :disabled="loading"
          >{{ autoRefresh ? 'Stop Auto Refresh' : 'Auto Refresh' }}</el-button>
        </div>
        <div class="main-row">
          <div class="data-list">
            <div v-if="realtimeData">
              <div v-for="(value, key) in realtimeData" :key="key" class="summary-item">
                <span class="label">{{ key }}:</span>
                <span class="value">{{ value }}</span>
              </div>
            </div>
            <div v-else class="no-data">No Data Available</div>
          </div>
          <div class="chart-area" v-if="realtimeData">
            <div class="chart-title">P_A</div>
            <div ref="chartA" class="energy-chart"></div>
            <div class="chart-title">P_B</div>
            <div ref="chartB" class="energy-chart"></div>
            <div class="chart-title">P_C</div>
            <div ref="chartC" class="energy-chart"></div>
          </div>
        </div>
      </el-card>

      <!-- 历史数据区域 -->
      <el-card class="history-card">
        <h3 class="title">History Data Query</h3>
        <div class="sn-input-row">
          <el-input
            v-model="historySn"
            placeholder="Please enter device SN"
            style="width: 180px;"
            @keyup.enter="fetchHistory"
          />
          <el-select v-model="period" placeholder="Select period" style="width: 120px; margin-left: 10px;">
            <el-option label="Today" value="today" />
            <el-option label="Week" value="week" />
            <el-option label="Month" value="month" />
            <el-option label="Quarter" value="quarter" />
            <el-option label="Year" value="year" />
          </el-select>
          <el-button type="primary" @click="fetchHistory" :loading="historyLoading" style="margin-left: 10px;">Query</el-button>
        </div>
        <div v-if="historyLoading" class="loading">Loading...</div>
        <div v-else-if="historyData && historyData.length > 0">
          <el-table :data="historyData" style="width: 100%; margin-top: 18px;">
            <el-table-column
              v-for="key in tableKeys"
              :key="key"
              :prop="key"
              :label="key"
            />
          </el-table>
          <!-- 柱状图区域 -->
          <div class="chart-title">History Bar Chart</div>
          <div ref="historyBarChart" class="history-bar-chart"></div>
        </div>
        <div v-else class="no-data">No Data Available</div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { getRealtimeBySn, getHistoryBySn } from '@/api/user'
import { getToken } from '@/utils/auth'
import * as echarts from 'echarts'

export default {
  name: 'EnergyHistoryPage',
  data() {
    return {
      // 实时监控
      deviceSn: '',
      realtimeData: null,
      loading: false,
      autoRefresh: false,
      timer: null,
      chartDataA: [],
      chartDataB: [],
      chartDataC: [],
      chartA: null,
      chartB: null,
      chartC: null,
      // 历史数据
      historySn: '',
      period: 'today',
      historyData: [],
      historyLoading: false,
      tableKeys: [],
      historyBarChart: null
    }
  },
  methods: {
    async fetchRealtime() {
      if (!this.deviceSn) {
        this.$message.warning('Please enter device SN')
        return
      }
      this.loading = true
      try {
        const token = getToken()
        const res = await getRealtimeBySn(this.deviceSn, token)
        this.realtimeData = res.data
        const now = new Date().toLocaleTimeString()
        this.chartDataA.push({ time: now, value: res.data.p_a || 0 })
        this.chartDataB.push({ time: now, value: res.data.p_b || 0 })
        this.chartDataC.push({ time: now, value: res.data.p_c || 0 })
        if (this.chartDataA.length > 20) this.chartDataA.shift()
        if (this.chartDataB.length > 20) this.chartDataB.shift()
        if (this.chartDataC.length > 20) this.chartDataC.shift()
        this.renderCharts()
      } catch (e) {
        this.$message.error('Failed to fetch realtime data')
      } finally {
        this.loading = false
      }
    },
    toggleAutoRefresh() {
      if (this.autoRefresh) {
        this.autoRefresh = false
        clearInterval(this.timer)
        this.timer = null
      } else {
        if (!this.deviceSn) {
          this.$message.warning('Please enter device SN')
          return
        }
        this.autoRefresh = true
        this.fetchRealtime()
        this.timer = setInterval(() => {
          this.fetchRealtime()
        }, 10000)
      }
    },
    renderCharts() {
      // P_A
      if (this.$refs.chartA) {
        if (!this.chartA) this.chartA = echarts.init(this.$refs.chartA)
        this.chartA.setOption({
          grid: { left: 40, right: 20, top: 30, bottom: 30 },
          xAxis: { type: 'category', data: this.chartDataA.map(d => d.time) },
          yAxis: { type: 'value' },
          series: [{
            type: 'line',
            data: this.chartDataA.map(d => d.value),
            smooth: true,
            lineStyle: { color: '#409EFF' },
            showSymbol: false
          }]
        })
      }
      // P_B
      if (this.$refs.chartB) {
        if (!this.chartB) this.chartB = echarts.init(this.$refs.chartB)
        this.chartB.setOption({
          grid: { left: 40, right: 20, top: 30, bottom: 30 },
          xAxis: { type: 'category', data: this.chartDataB.map(d => d.time) },
          yAxis: { type: 'value' },
          series: [{
            type: 'line',
            data: this.chartDataB.map(d => d.value),
            smooth: true,
            lineStyle: { color: '#67C23A' },
            showSymbol: false
          }]
        })
      }
      // P_C
      if (this.$refs.chartC) {
        if (!this.chartC) this.chartC = echarts.init(this.$refs.chartC)
        this.chartC.setOption({
          grid: { left: 40, right: 20, top: 30, bottom: 30 },
          xAxis: { type: 'category', data: this.chartDataC.map(d => d.time) },
          yAxis: { type: 'value' },
          series: [{
            type: 'line',
            data: this.chartDataC.map(d => d.value),
            smooth: true,
            lineStyle: { color: '#F56C6C' },
            showSymbol: false
          }]
        })
      }
    },
    renderHistoryBarChart() {
      if (!this.$refs.historyBarChart || !this.historyData.length) return
      if (!this.historyBarChart) {
        this.historyBarChart = echarts.init(this.$refs.historyBarChart)
      }
      const xData = this.historyData.map((item, idx) => item.hour || item.day || item.month || item.quarter || item.year || `#${idx + 1}`)
      const chargeData = this.historyData.map(item => item.charge_wh_total || 0)
      const dischargeData = this.historyData.map(item => item.discharge_wh_total || 0)
      const pvData = this.historyData.map(item => item.pv_wh_total || 0)
      const gridData = this.historyData.map(item => item.grid_wh_total || 0)
      const loadData = this.historyData.map(item => item.load_wh_total || 0)
      this.historyBarChart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['Charge', 'Discharge', 'PV', 'Grid', 'Load'] },
        xAxis: { type: 'category', data: xData },
        yAxis: { type: 'value' },
        series: [
          { name: 'Charge', type: 'bar', data: chargeData, itemStyle: { color: '#409EFF' }},
          { name: 'Discharge', type: 'bar', data: dischargeData, itemStyle: { color: '#67C23A' }},
          { name: 'PV', type: 'bar', data: pvData, itemStyle: { color: '#E6A23C' }},
          { name: 'Grid', type: 'bar', data: gridData, itemStyle: { color: '#F56C6C' }},
          { name: 'Load', type: 'bar', data: loadData, itemStyle: { color: '#909399' }}
        ]
      })
      this.historyBarChart.resize()
    },
    async fetchHistory() {
      if (!this.historySn) {
        this.$message.warning('Please enter device SN')
        return
      }
      this.historyLoading = true
      try {
        const token = getToken()
        const res = await getHistoryBySn({
          device_sn: this.historySn,
          period: this.period,
          page: 1,
          page_size: 100
        }, token)
        this.historyData = res.data && res.data.items ? res.data.items : []
        this.tableKeys = this.historyData.length ? Object.keys(this.historyData[0]) : []
        this.$nextTick(() => {
          setTimeout(() => {
            this.renderHistoryBarChart()
          }, 50)
        })
      } catch (e) {
        this.$message.error('Failed to fetch history data')
        this.historyData = []
        this.tableKeys = []
      } finally {
        this.historyLoading = false
      }
    }
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.chartA) { this.chartA.dispose(); this.chartA = null }
    if (this.chartB) { this.chartB.dispose(); this.chartB = null }
    if (this.chartC) { this.chartC.dispose(); this.chartC = null }
    if (this.historyBarChart) {
      this.historyBarChart.dispose()
      this.historyBarChart = null
    }
  }
}
</script>

<style scoped>
.energy-history-page {
  padding: 20px;
}
.area-row {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}
.energy-card, .history-card {
  width: 900px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 14px;
}
.sn-input-row {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}
.main-row {
  display: flex;
  flex-direction: row;
  gap: 24px;
}
.data-list {
  flex: 1;
  min-width: 220px;
}
.chart-area {
  flex: 2;
  min-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: flex-start;
}
.chart-title {
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 8px;
}
.energy-chart {
  width: 100%;
  height: 160px;
  min-width: 300px;
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
.no-data {
  text-align: center;
  font-size: 14px;
  color: #909399;
  margin: 20px 0;
}
.loading {
  text-align: center;
  font-size: 14px;
  color: #909399;
  margin: 20px 0;
}
.history-bar-chart {
  width: 100%;
  height: 260px;
  min-width: 300px;
}
</style>
