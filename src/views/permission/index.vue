<template>
  <div class="ha-dashboard">
    <div class="dashboard-header">
      <div class="header-left">
        <h2 class="page-title">Energy Dashboard</h2>
      </div>
      <div class="header-right">
        <el-date-picker
          v-model="currentDate"
          type="date"
          size="small"
          :clearable="false"
          class="custom-date-picker"
        />
      </div>
    </div>

    <div class="dashboard-container">

      <div class="column-left">
        <el-card class="ha-card usage-card">
          <div slot="header" class="card-header">
            <span>Energy Usage</span>
            <el-tag size="mini" type="info">kWh</el-tag>
          </div>
          <div ref="barChart" class="bar-chart-box" />
        </el-card>

        <el-card class="ha-card solar-hist-card" style="margin-top: 20px;">
          <div slot="header" class="card-header">Solar Production Forecast</div>
          <div ref="lineChart" class="line-chart-box" />
        </el-card>
      </div>

      <div class="column-right">

        <el-card class="ha-card flow-card">
          <div slot="header" class="card-header">Energy Distribution</div>

          <div class="flow-wrapper">
            <div class="flow-node node-top">
              <div class="icon-bubble solar-bg"><i class="el-icon-sunny" /></div>
              <div class="node-info">
                <span class="n-label">Solar</span>
                <span class="n-val">{{ flowData.solar }} kW</span>
              </div>
            </div>

            <div class="flow-node node-left">
              <div class="icon-bubble grid-bg"><i class="el-icon-s-grid" /></div>
              <div class="node-info">
                <span class="n-label">Grid</span>
                <span class="n-val">{{ flowData.grid }} kW</span>
              </div>
            </div>

            <div class="flow-node node-right">
              <div class="icon-bubble home-bg"><i class="el-icon-s-home" /></div>
              <div class="node-info">
                <span class="n-label">Home</span>
                <span class="n-val">{{ flowData.home }} kW</span>
              </div>
            </div>

            <div class="flow-node node-bottom">
              <div class="icon-bubble battery-bg"><i class="el-icon-cpu" /></div>
              <div class="node-info">
                <span class="n-label">Battery</span>
                <span class="n-val">{{ flowData.battery }} kW</span>
              </div>
            </div>

            <div class="lines-layer">
              <div class="line-v-top" :class="{ 'anim-fwd': flowData.solar > 0 }"><div class="dot solar-dot" /></div>
              <div class="line-h-left" :class="{ 'anim-fwd': flowData.grid > 0, 'anim-rev': flowData.grid < 0 }"><div class="dot grid-dot" /></div>
              <div class="line-h-right anim-fwd"><div class="dot mix-dot" /></div>
              <div class="line-v-bottom" :class="{ 'anim-fwd': flowData.battery > 0, 'anim-rev': flowData.battery < 0 }"><div class="dot battery-dot" /></div>
            </div>
          </div>
        </el-card>

        <el-card class="ha-card gauge-card">
          <div slot="header" class="card-header">Self Sufficiency</div>
          <div ref="gaugeChart" class="gauge-box" />
          <div class="gauge-details">
            <div class="detail-item">
              <span class="d-label">Autonomy</span>
              <span class="d-val">82%</span>
            </div>
            <div class="detail-item">
              <span class="d-label">Ratio</span>
              <span class="d-val">45%</span>
            </div>
          </div>
        </el-card>

      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'HAEnergyDashboard',
  data() {
    return {
      currentDate: new Date(),
      flowData: { solar: 3.2, grid: 0.5, home: 2.1, battery: 1.6 },
      barChart: null,
      gaugeChart: null,
      lineChart: null
    }
  },
  mounted() {
    this.initCharts()
    window.addEventListener('resize', this.handleResize)
    setInterval(this.simulateLive, 3000)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    if (this.barChart) this.barChart.dispose()
    if (this.gaugeChart) this.gaugeChart.dispose()
    if (this.lineChart) this.lineChart.dispose()
  },
  methods: {
    simulateLive() {
      this.flowData.solar = (2 + Math.random()).toFixed(1)
      this.flowData.grid = (Math.random() - 0.3).toFixed(1) // 可能为负(卖电)
    },
    initCharts() {
      this.renderBarChart()
      this.renderGaugeChart()
      this.renderLineChart()
    },
    renderBarChart() {
      if (!this.$refs.barChart) return
      this.barChart = echarts.init(this.$refs.barChart)
      const hours = Array.from({ length: 24 }, (_, i) => i)

      this.barChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }},
        legend: { bottom: 0, icon: 'circle' },
        grid: { left: 40, right: 20, top: 20, bottom: 40 },
        xAxis: { type: 'category', data: hours },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' }}},
        color: ['#03a9f4', '#ff9800', '#673ab7'], // Grid, Solar, Return
        series: [
          { name: 'Grid', type: 'bar', stack: 'total', data: hours.map(() => Math.random()), barWidth: '50%' },
          { name: 'Solar', type: 'bar', stack: 'total', data: hours.map(() => Math.random() * 2) },
          { name: 'Return', type: 'bar', stack: 'return', data: hours.map(() => -Math.random() * 0.5) }
        ]
      })
    },
    renderLineChart() {
      if (!this.$refs.lineChart) return
      this.lineChart = echarts.init(this.$refs.lineChart)
      this.lineChart.setOption({
        grid: { left: 40, right: 20, top: 20, bottom: 20 },
        xAxis: { type: 'category', data: ['00:00', '06:00', '12:00', '18:00', '23:59'], show: false },
        yAxis: { type: 'value', show: false },
        series: [{ type: 'line', smooth: true, data: [0, 2, 8, 3, 0], areaStyle: { opacity: 0.2 }, itemStyle: { color: '#ff9800' }}]
      })
    },
    renderGaugeChart() {
      if (!this.$refs.gaugeChart) return
      this.gaugeChart = echarts.init(this.$refs.gaugeChart)
      this.gaugeChart.setOption({
        series: [{
          type: 'gauge',
          startAngle: 180, endAngle: 0,
          min: 0, max: 100,
          radius: '100%',
          center: ['50%', '70%'], // 调整半圆位置
          itemStyle: { color: '#4caf50' },
          progress: { show: true, width: 25 },
          pointer: { show: false },
          axisLine: { lineStyle: { width: 25, color: [[1, '#eee']] }},
          axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
          detail: { offsetCenter: [0, -10], fontSize: 24, fontWeight: 'bold', formatter: '{value}%' },
          data: [{ value: 82 }]
        }]
      })
    },
    handleResize() {
      this.barChart && this.barChart.resize()
      this.gaugeChart && this.gaugeChart.resize()
      this.lineChart && this.lineChart.resize()
    }
  }
}
</script>

<style scoped>
/* === 全局容器 === */
.ha-dashboard {
  padding: 20px;
  background-color: #fafafa;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title { margin: 0; font-weight: 500; color: #2c3e50; }

/* === 核心 Grid 布局 (关键变化) === */
.dashboard-container {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* 左栏：自适应宽度 (占据大头) */
.column-left {
  flex: 3; /* 占比 3 */
  min-width: 0; /* 防止 flex 子项溢出 */
}

/* 右栏：固定宽度或小占比 (Sidebar) */
.column-right {
  flex: 1.2; /* 占比 1.2 */
  min-width: 340px; /* 保证流向图不被压缩太小 */
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 响应式：窄屏变单栏 */
@media (max-width: 1000px) {
  .dashboard-container { flex-direction: column; }
  .column-right { width: 100%; flex: none; }
}

/* === 卡片样式 (仿 Material Design) === */
.ha-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.04) !important;
  background: #fff;
  overflow: visible; /* 让气泡可以贴边 */
}
.card-header {
  font-size: 16px; font-weight: 600; color: #333;
  display: flex; justify-content: space-between; align-items: center;
}

.bar-chart-box { height: 400px; width: 100%; }
.line-chart-box { height: 150px; width: 100%; }

/* === Energy Flow (核心流向图) === */
.flow-wrapper {
  position: relative;
  height: 320px;
  width: 100%;
  margin-top: 10px;
}

.flow-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  width: 80px;
}
/* 节点定位 - 十字布局 */
.node-top { top: 0; left: 50%; transform: translateX(-50%); }
.node-bottom { bottom: 0; left: 50%; transform: translateX(-50%); }
.node-left { top: 50%; left: 10px; transform: translateY(-50%); }
.node-right { top: 50%; right: 10px; transform: translateY(-50%); }

.icon-bubble {
  width: 48px; height: 48px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; border: 2px solid; background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.node-info { text-align: center; margin-top: 4px; }
.n-label { font-size: 12px; color: #888; display: block; }
.n-val { font-size: 14px; font-weight: 700; color: #333; }

/* 颜色 */
.solar-bg { color: #ff9800; border-color: #ff9800; }
.grid-bg { color: #03a9f4; border-color: #03a9f4; }
.home-bg { color: #9c27b0; border-color: #9c27b0; }
.battery-bg { color: #4caf50; border-color: #4caf50; }

/* 线条层 */
.lines-layer {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; /* 不挡鼠标 */
}
/* 定义中心点位置: 50% 50% */
.line-v-top {
  position: absolute; width: 2px; background: #eee;
  top: 50px; bottom: 50%; left: 50%; transform: translateX(-50%);
}
.line-v-bottom {
  position: absolute; width: 2px; background: #eee;
  top: 50%; bottom: 50px; left: 50%; transform: translateX(-50%);
}
.line-h-left {
  position: absolute; height: 2px; background: #eee;
  left: 60px; right: 50%; top: 50%; transform: translateY(-50%);
}
.line-h-right {
  position: absolute; height: 2px; background: #eee;
  left: 50%; right: 60px; top: 50%; transform: translateY(-50%);
}

/* 动画点 */
.dot { position: absolute; width: 6px; height: 6px; border-radius: 50%; opacity: 0; }
.solar-dot { background: #ff9800; left: -2px; }
.grid-dot { background: #03a9f4; top: -2px; }
.battery-dot { background: #4caf50; left: -2px; }
.mix-dot { background: #9c27b0; top: -2px; }

/* 动画 Keyframes */
@keyframes flow-down { 0% { top: 0; opacity: 1; } 100% { top: 100%; opacity: 0; } }
@keyframes flow-up { 0% { top: 100%; opacity: 1; } 100% { top: 0; opacity: 0; } }
@keyframes flow-right { 0% { left: 0; opacity: 1; } 100% { left: 100%; opacity: 0; } }
@keyframes flow-left { 0% { left: 100%; opacity: 1; } 100% { left: 0; opacity: 0; } }

.line-v-top.anim-fwd .solar-dot { animation: flow-down 1.5s infinite linear; }
.line-h-left.anim-fwd .grid-dot { animation: flow-right 1.5s infinite linear; } /* 买电 */
.line-h-left.anim-rev .grid-dot { animation: flow-left 1.5s infinite linear; } /* 卖电 */
.line-h-right.anim-fwd .mix-dot { animation: flow-right 1.5s infinite linear; }
.line-v-bottom.anim-fwd .battery-dot { animation: flow-down 1.5s infinite linear; } /* 充电 */
.line-v-bottom.anim-rev .battery-dot { animation: flow-up 1.5s infinite linear; } /* 放电 */

/* === 仪表盘细节 === */
.gauge-box { height: 180px; width: 100%; margin-top: -20px; }
.gauge-details {
  display: flex; justify-content: space-around; padding-bottom: 15px;
}
.detail-item { display: flex; flex-direction: column; align-items: center; }
.d-label { font-size: 12px; color: #999; }
.d-val { font-size: 16px; font-weight: bold; color: #333; margin-top: 2px; }
</style>
