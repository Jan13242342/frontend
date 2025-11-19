<template>
  <div class="admin-container">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">OTA 固件管理控制台</h1>
        <p class="page-desc">管理设备固件版本，发布更新及模拟设备升级请求。</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="el-icon-upload" @click="activeTab = 'upload'">发布新固件</el-button>
      </div>
    </div>

    <el-card class="main-card" :body-style="{ padding: '0' }">
      <el-tabs v-model="activeTab" type="card" class="custom-tabs">

        <el-tab-pane label="固件版本列表" name="list">
          <div class="tab-content">
            <div class="filter-bar">
              <el-form :inline="true" size="small">
                <el-form-item label="设备类型">
                  <el-input v-model="list_device_type" placeholder="输入设备类型 (如 esp32)" clearable @clear="fetchFirmwareList" />
                </el-form-item>
                <el-form-item label="状态">
                  <el-select v-model="list_status" placeholder="全部状态" clearable @clear="fetchFirmwareList">
                    <el-option label="草稿 (Draft)" value="draft" />
                    <el-option label="测试中 (Testing)" value="testing" />
                    <el-option label="已发布 (Released)" value="released" />
                    <el-option label="已废弃 (Deprecated)" value="deprecated" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" icon="el-icon-search" @click="fetchFirmwareList">查询</el-button>
                </el-form-item>
              </el-form>
            </div>

            <el-table
              v-loading="loadingList"
              :data="firmwareList"
              style="width: 100%"
              header-row-class-name="table-header"
            >
              <el-table-column prop="version" label="固件版本" min-width="140">
                <template slot-scope="scope">
                  <span class="version-text">{{ scope.row.version }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="device_type" label="设备类型" width="120" />

              <el-table-column prop="status" label="状态" width="120">
                <template slot-scope="scope">
                  <el-tag :type="getStatusTag(scope.row.status)" size="small" effect="light">
                    {{ getStatusLabel(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="min_hardware_version" label="最低硬件版本" width="120" align="center" />

              <el-table-column prop="uploaded_at" label="上传时间" width="180" sortable />

              <el-table-column label="操作" width="180" fixed="right">
                <template slot-scope="scope">
                  <a :href="scope.row.download_url" download :title="`下载 ${scope.row.version}`" class="download-link">
                    <i class="el-icon-download" />
                    <span>下载</span>
                  </a>
                  <el-divider direction="vertical" />
                  <el-button type="text" size="small" class="danger-text" icon="el-icon-delete" @click="handleDeleteFirmware(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>

              <template slot="empty">
                <div class="custom-empty">
                  <i class="el-icon-document-delete" style="font-size: 32px; color: #909399; margin-bottom: 10px;" />
                  <p style="color: #909399; margin: 0;">暂无固件数据</p>
                </div>
              </template>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="发布新固件" name="upload">
          <div class="tab-content narrow-content">
            <el-alert
              title="上传须知"
              type="info"
              description="请确保固件已经过本地测试。上传后默认为'草稿'状态，需手动更改状态进行发布。"
              show-icon
              :closable="false"
              style="margin-bottom: 24px;"
            />

            <el-form ref="uploadForm" label-position="top" :model="uploadForm" class="upload-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="设备类型" required>
                    <el-input v-model="uploadForm.device_type" placeholder="例如：esp32-s3" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="最小硬件兼容版本" required>
                    <el-input v-model="uploadForm.min_hardware_version" placeholder="例如：v1.0" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="固件版本号" required>
                    <el-input v-model="uploadForm.version" placeholder="例如：1.0.2-20250101" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="初始状态" required>
                    <el-select v-model="uploadForm.status" style="width: 100%;">
                      <el-option label="草稿 (Draft)" value="draft" />
                      <el-option label="测试中 (Testing)" value="testing" />
                      <el-option label="已发布 (Released)" value="released" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="固件文件 (.bin / .zip)" required>
                <el-upload
                  class="upload-dragger-box"
                  drag
                  action=""
                  :before-upload="beforeUpload"
                  :http-request="customUpload"
                  :show-file-list="true"
                  :limit="1"
                >
                  <i class="el-icon-upload" />
                  <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                </el-upload>
              </el-form-item>
            </el-form>

            <div v-if="uploadResult" class="result-box success">
              <i class="el-icon-circle-check" />
              <div class="content">
                <h4>上传成功</h4>
                <p>文件已归档，您可以在列表中查看。</p>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="OTA 策略测试" name="simulator">
          <div class="tab-content">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-card shadow="hover" class="simulator-card">
                  <div slot="header" class="card-header">
                    <span>🚀 模拟正式设备请求 (Prod)</span>
                  </div>
                  <el-form size="small" label-position="left" label-width="100px">
                    <el-form-item label="设备类型">
                      <el-input v-model="latest_device_type" />
                    </el-form-item>
                    <el-form-item label="硬件版本">
                      <el-input v-model="latest_hardware_version" />
                    </el-form-item>
                    <el-button type="primary" size="small" style="width:100%" @click="fetchLatestFirmware">查询最新正式版</el-button>
                  </el-form>

                  <div class="json-display-area">
                    <div v-if="latestFirmware">
                      <el-descriptions :column="1" border size="small">
                        <el-descriptions-item label="版本">{{ latestFirmware.version }}</el-descriptions-item>
                        <el-descriptions-item label="URL">
                          <a :href="latestFirmware.download_url" target="_blank" class="link-text">点击下载</a>
                        </el-descriptions-item>
                        <el-descriptions-item label="MD5">{{ latestFirmware.md5 || '-' }}</el-descriptions-item>
                      </el-descriptions>
                    </div>
                    <div v-else class="placeholder">点击查询查看结果</div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card shadow="hover" class="simulator-card">
                  <div slot="header" class="card-header">
                    <span>🧪 模拟测试设备请求 (Staging)</span>
                  </div>
                  <el-form size="small" label-position="left" label-width="100px">
                    <el-form-item label="设备类型">
                      <el-input v-model="staging_device_type" />
                    </el-form-item>
                    <el-form-item label="硬件版本">
                      <el-input v-model="staging_hardware_version" />
                    </el-form-item>
                    <el-form-item label="目标状态">
                      <el-select v-model="staging_status" style="width:100%">
                        <el-option label="Draft" value="draft" />
                        <el-option label="Testing" value="testing" />
                      </el-select>
                    </el-form-item>
                    <el-button type="warning" size="small" style="width:100%" @click="fetchLatestStagingFirmware">查询特定版本</el-button>
                  </el-form>

                  <div class="json-display-area">
                    <div v-if="latestStagingFirmware">
                      <el-descriptions :column="1" border size="small">
                        <el-descriptions-item label="版本">{{ latestStagingFirmware.version }}</el-descriptions-item>
                        <el-descriptions-item label="状态">
                          <el-tag size="mini" type="warning">{{ latestStagingFirmware.status }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="URL">
                          <a :href="latestStagingFirmware.download_url" target="_blank" class="link-text">点击下载</a>
                        </el-descriptions-item>
                      </el-descriptions>
                    </div>
                    <div v-else class="placeholder">点击查询查看结果</div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { uploadOta, getLatestFirmware, getFirmwareList, deleteFirmware, getLatestStagingFirmware } from '@/api/user'
import { getToken } from '@/utils/auth'

export default {
  name: 'FirmwareConsole',
  data() {
    return {
      activeTab: 'list',
      loadingList: false,

      // 上传表单
      uploadForm: {
        device_type: '',
        version: '',
        min_hardware_version: '',
        status: 'draft'
      },
      uploadResult: null,

      // 列表查询
      list_device_type: '',
      list_status: '',
      firmwareList: [],

      // 模拟器数据
      latest_device_type: 'esp32',
      latest_hardware_version: 'v1.0',
      latestFirmware: null,

      staging_device_type: 'esp32',
      staging_hardware_version: 'v1.0',
      staging_status: 'testing',
      latestStagingFirmware: null
    }
  },
  mounted() {
    this.fetchFirmwareList()
  },
  methods: {
    // --- 辅助方法 ---
    getStatusTag(status) {
      const map = {
        released: 'success',
        testing: 'warning',
        draft: 'info',
        deprecated: 'danger'
      }
      return map[status] || ''
    },
    getStatusLabel(status) {
      const map = {
        released: '已发布',
        testing: '测试中',
        draft: '草稿',
        deprecated: '已废弃'
      }
      return map[status] || status
    },
    // 【重要修改】 移除了 openLink 方法

    // --- 上传逻辑 ---
    beforeUpload(file) {
      const { device_type, version, min_hardware_version } = this.uploadForm
      if (!device_type || !version || !min_hardware_version) {
        this.$message.warning('请先填写左侧的固件版本信息')
        return false
      }
      const isBin = /\.(bin|zip)$/i.test(file.name)
      if (!isBin) {
        this.$message.error('仅支持 .bin 或 .zip 格式文件')
        return false
      }
      return true
    },
    async customUpload(option) {
      try {
        const token = getToken()
        const res = await uploadOta(
          token,
          option.file,
          this.uploadForm.device_type,
          this.uploadForm.version,
          this.uploadForm.status,
          this.uploadForm.min_hardware_version
        )
        this.$message.success('固件上传成功！')
        this.uploadResult = res.data
        option.onSuccess && option.onSuccess(res.data)
        // 自动跳转到列表页刷新
        setTimeout(() => {
          this.activeTab = 'list'
          this.fetchFirmwareList()
          this.uploadResult = null // 重置
        }, 1500)
      } catch (e) {
        this.$message.error(e.message || '上传失败')
        option.onError && option.onError(e)
      }
    },

    // --- 列表逻辑 ---
    async fetchFirmwareList() {
      this.loadingList = true
      try {
        const res = await getFirmwareList(
          this.list_device_type,
          getToken(),
          this.list_status
        )
        this.firmwareList = res.data.items || []
      } catch (e) {
        this.firmwareList = []
        this.$message.error('获取列表失败')
      } finally {
        this.loadingList = false
      }
    },
    handleDeleteFirmware(id) {
      this.$confirm('此操作将永久删除该固件版本, 是否继续?', '高风险操作', {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }).then(async() => {
        try {
          await deleteFirmware(id, getToken())
          this.$message.success('删除成功')
          this.fetchFirmwareList()
        } catch (e) {
          this.$message.error('删除失败')
        }
      })
    },

    // --- 模拟器逻辑 ---
    async fetchLatestFirmware() {
      if (!this.latest_device_type) return
      try {
        const res = await getLatestFirmware(this.latest_device_type, getToken(), this.latest_hardware_version)
        this.latestFirmware = res.data
      } catch (e) {
        this.latestFirmware = null
        this.$message.info('未找到匹配的正式固件')
      }
    },
    async fetchLatestStagingFirmware() {
      if (!this.staging_device_type) return
      try {
        const res = await getLatestStagingFirmware(this.staging_device_type, this.staging_hardware_version, this.staging_status, getToken())
        this.latestStagingFirmware = res.data
      } catch (e) {
        this.latestStagingFirmware = null
        this.$message.info('未找到匹配的测试固件')
      }
    }
  }
}
</script>

<style scoped>
.admin-container {
  padding: 24px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

/* 顶部 Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: #fff;
  padding: 20px 24px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}
.page-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 500;
  color: #1f2f3d;
}
.page-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* 主卡片 */
.main-card {
  border: none;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}

/* Tab 样式调整 */
.custom-tabs >>> .el-tabs__header {
  margin-bottom: 0;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}
.custom-tabs >>> .el-tabs__item {
  height: 50px;
  line-height: 50px;
  border-left: none !important;
}
.custom-tabs >>> .el-tabs__nav {
  border-top: none !important;
  border-radius: 0 !important;
}

.tab-content {
  padding: 24px;
}
.narrow-content {
  max-width: 800px;
  margin: 0 auto;
}

/* 筛选栏 */
.filter-bar {
  background: #f5f7fa;
  padding: 16px 16px 0 16px;
  border-radius: 4px;
  margin-bottom: 20px;
}

/* 表格相关 */
.version-text {
  font-weight: 600;
  color: #303133;
  font-family: monospace; /* 版本号用等宽字体看起来更专业 */
}
.danger-text {
  color: #F56C6C;
}
.danger-text:hover {
  color: #ff4949;
}

/* 【重要新增】下载链接样式 */
.download-link {
  color: #409EFF; /* Element UI Primary Color */
  text-decoration: none; /* 移除下划线 */
  font-size: 12px; /* 匹配 size="small" */
  display: inline-flex;
  align-items: center;
  line-height: 1; /* 确保垂直居中 */
}
.download-link:hover {
  color: #66b1ff; /* Hover effect */
}
.download-link i {
    margin-right: 3px; /* 让图标和文字间距更自然 */
}
/* 【重要新增】空状态容器样式 */
.custom-empty {
  padding: 32px 0;
  text-align: center;
}

/* 上传相关 */
.upload-dragger-box >>> .el-upload {
  width: 100%;
}
.upload-dragger-box >>> .el-upload-dragger {
  width: 100%;
  height: 180px;
}
.result-box {
  margin-top: 20px;
  padding: 16px;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
}
.result-box.success {
  background-color: #f0f9eb;
  color: #67C23A;
}
.result-box i {
  font-size: 24px;
  margin-right: 12px;
  margin-top: 2px;
}
.result-box h4 { margin: 0 0 4px 0; font-size: 16px; }
.result-box p { margin: 0; font-size: 14px; color: #5e6d82; }

/* 模拟器卡片 */
.simulator-card {
  background: #fcfcfc;
}
.json-display-area {
  margin-top: 20px;
  background: #fff;
  min-height: 140px;
}
.placeholder {
  color: #c0c4cc;
  text-align: center;
  padding-top: 40px;
  font-size: 13px;
}
.link-text {
  color: #409EFF;
  text-decoration: none;
}
.link-text:hover {
  text-decoration: underline;
}
</style>
