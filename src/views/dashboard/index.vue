<template>
  <div class="ha-dashboard">
    <el-card class="device-list-card" style="margin-bottom: 24px;">
      <div slot="header">
        <span>My Devices ({{ deviceList.length }})</span>
      </div>
      <div v-if="deviceList.length">
        <el-button
          v-for="dev in deviceList"
          :key="dev.id"
          :type="selectedDevice && selectedDevice.id === dev.id ? 'primary' : 'default'"
          style="margin-right: 12px; margin-bottom: 8px;"
          @click="selectDevice(dev)"
        >
          {{ dev.name }}
        </el-button>
      </div>
      <div v-else>
        <el-empty description="No devices" />
      </div>
    </el-card>

    <div v-if="selectedDevice">
      <div class="dashboard-header">
        <div class="header-left">
          <h2 class="page-title">Energy Dashboard - {{ selectedDevice.name }}</h2>
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
            <div ref="barChart" v-loading="loadingCharts" class="bar-chart-box" />
          </el-card>

          <el-card class="ha-card solar-hist-card" style="margin-top: 20px;">
            <div slot="header" class="card-header">Solar Production Forecast</div>
            <div ref="lineChart" v-loading="loadingCharts" class="line-chart-box" />
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
            <div ref="gaugeChart" v-loading="loadingCharts" class="gauge-box" />
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
    <div v-else>
      <el-empty description="Please select a device" />
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
// 引入 debounce (可选, 但推荐)
import { debounce } from 'lodash-es'

export default {
  name: 'HAEnergyDashboard',
  data() {
    return {
      // --- 设备 ---
      deviceList: [],
      selectedDevice: null,

      // --- 状态 ---
      loadingCharts: false,
      liveInterval: null, // 实时模拟定时器

      // --- 数据 ---
      currentDate: new Date(),
      flowData: { solar: 0, grid: 0, home: 0, battery: 0 },

      // --- ECharts 实例 ---
      barChart: null,
      gaugeChart: null,
      lineChart: null,

      // (防抖的 resize 处理器)
      debouncedResize: null
    }
  },

  // 核心改动：使用 watch 监听 selectedDevice
  watch: {
    selectedDevice(newDevice, oldDevice) {
      if (newDevice) {
        console.log(`Device changed to: ${newDevice.name}`)
        // 当设备变化时，加载新数据
        this.loadDashboardData(newDevice.id)
      } else {
        // 如果没有选中设备（例如，设备列表为空时），确保销毁图表
        this.disposeCharts()
      }
    }
  },

  mounted() {
    // 1. (模拟) 获取设备列表
    this.fetchDeviceList()

    // 2. 创建防抖的 resize 处理器
    this.debouncedResize = debounce(this.handleResize, 150)
    window.addEventListener('resize', this.debouncedResize)
  },

  beforeDestroy() {
    // 3. 组件销毁时，清理所有资源
    window.removeEventListener('resize', this.debouncedResize)
    this.disposeCharts()
    if (this.liveInterval) {
      clearInterval(this.liveInterval)
    }
  },

  methods: {
    /**
     * 1. (模拟) 获取设备列表，并默认选中第一个
     */
    fetchDeviceList() {
      // 模拟 API 调用
      this.deviceList = [
        { id: 1, name: 'Living Room Meter' },
        { id: 2, name: 'Garage PV' },
        { id: 3, name: 'Bedroom Meter' }
      ]

      // 默认选中第一个设备
      // 这将自动触发上面的 'watch' 监听器，从而加载数据
      if (this.deviceList.length) {
        this.selectedDevice = this.deviceList[0]
      }
    },

    /**
     * 2. 切换设备
     * (逻辑简化: 只需要更新 selectedDevice，其余的交给 watch)
     */
    selectDevice(dev) {
      if (this.selectedDevice && this.selectedDevice.id === dev.id) {
        return // 避免重复点击
      }
      this.selectedDevice = dev
    },

    /**
     * 3. (模拟) 加载所有 Dashboard 数据
     * 这是响应设备变化的核心
     */
    async loadDashboardData(deviceId) {
      console.log(`Fetching data for device ${deviceId}...`)
      this.loadingCharts = true

      // 停止旧的实时模拟
      if (this.liveInterval) clearInterval(this.liveInterval)

      // --- 模拟 API 调用 ---
      // (在真实项目中，这里应该是 const response = await api.getDashboard(deviceId))
      const simulatedData = this.getSimulatedData(deviceId)
      // ---------------------

      // 更新流向图数据
      this.flowData = simulatedData.flowData

      // 关键：等待 DOM (v-if) 更新完成
      await this.$nextTick()

      // 初始化所有图表
      this.initCharts(simulatedData)

      this.loadingCharts = false

      // 开启新的实时模拟
      this.liveInterval = setInterval(this.simulateLive, 3000)
    },

    /**
     * 4. 初始化所有图表 (或更新数据)
     */
    initCharts(data) {
      // *必须* 先销毁旧实例，防止内存泄漏
      this.disposeCharts()

      // 渲染新图表
      this.renderBarChart(data.barChartData)
      this.renderLineChart(data.lineChartData)
      this.renderGaugeChart(data.gaugeChartData)
    },

    /**
     * 5. 销毁所有 ECharts 实例
     */
    disposeCharts() {
      if (this.barChart) {
        this.barChart.dispose()
        this.barChart = null
      }
      if (this.lineChart) {
        this.lineChart.dispose()
        this.lineChart = null
      }
      if (this.gaugeChart) {
        this.gaugeChart.dispose()
        this.gaugeChart = null
      }
      console.log('Charts disposed.')
    },

    // --- 图表渲染方法 (已修改为接收数据) ---

    renderBarChart(data) {
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
          { name: 'Grid', type: 'bar', stack: 'total', data: data.grid, barWidth: '50%' },
          { name: 'Solar', type: 'bar', stack: 'total', data: data.solar },
          { name: 'Return', type: 'bar', stack: 'return', data: data.return }
        ]
      })
    },

    renderLineChart(data) {
      if (!this.$refs.lineChart) return
      this.lineChart = echarts.init(this.$refs.lineChart)
      this.lineChart.setOption({
        grid: { left: 40, right: 20, top: 20, bottom: 20 },
        xAxis: { type: 'category', data: ['00:00', '06:00', '12:00', '18:00', '23:59'], show: false },
        yAxis: { type: 'value', show: false },
        series: [{
          type: 'line',
          smooth: true,
          data: data.forecast, // 使用传入的数据
          areaStyle: { opacity: 0.2 },
          itemStyle: { color: '#ff9800' }
        }]
      })
    },

    renderGaugeChart(data) {
      if (!this.$refs.gaugeChart) return
      this.gaugeChart = echarts.init(this.$refs.gaugeChart)
      this.gaugeChart.setOption({
        series: [{
          type: 'gauge',
          startAngle: 180, endAngle: 0,
          min: 0, max: 100,
          radius: '100%',
          center: ['50%', '70%'],
          itemStyle: { color: '#4caf50' },
          progress: { show: true, width: 25 },
          pointer: { show: false },
          axisLine: { lineStyle: { width: 25, color: [[1, '#eee']] }},
          axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
          detail: { offsetCenter: [0, -10], fontSize: 24, fontWeight: 'bold', formatter: '{value}%' },
          data: [{ value: data.sufficiency }] // 使用传入的数据
        }]
      })
    },

    // --- 辅助方法 ---

    handleResize() {
      // 防抖调用
      this.barChart && this.barChart.resize()
      this.gaugeChart && this.gaugeChart.resize()
      this.lineChart && this.lineChart.resize()
    },

    /**
     * (模拟) 实时更新数据
     */
    simulateLive() {
      // 只更新流向图数据
      this.flowData.solar = (2 + Math.random() * (this.selectedDevice.id || 1)).toFixed(1)
      this.flowData.grid = (Math.random() - 0.3).toFixed(1)
      this.flowData.battery = (Math.random() * 2 - 1).toFixed(1)
      this.flowData.home = (this.flowData.solar + this.flowData.grid + this.flowData.battery).toFixed(1)
    },

    /**
     * (模拟) 获取假数据
     */
    getSimulatedData(deviceId) {
      // 乘以 deviceId 以便让数据看起来不一样
      const seed = deviceId || 1
      return {
        flowData: {
          solar: (3.2 * seed).toFixed(1),
          grid: (0.5 * seed).toFixed(1),
          home: (2.1 * seed).toFixed(1),
          battery: (1.6 * seed).toFixed(1)
        },
        barChartData: {
          grid: Array.from({ length: 24 }, () => Math.random() * seed),
          solar: Array.from({ length: 24 }, () => Math.random() * 2 * seed),
          return: Array.from({ length: 24 }, () => -Math.random() * 0.5 * seed)
        },
        lineChartData: {
          forecast: [0, 2 * seed, 8 * seed, 3 * seed, 0]
        },
        gaugeChartData: {
          sufficiency: Math.floor(Math.random() * 50 + 50) // 50-100
        }
      }
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
