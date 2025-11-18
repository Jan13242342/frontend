<template>
  <div class="admin-page">
    <!-- 获取最新固件区域 -->
    <h2>获取最新固件</h2>
    <el-form :inline="true" style="margin-bottom: 16px;">
      <el-form-item label="设备类型">
        <el-input v-model="latest_device_type" placeholder="如：esp32" style="width: 120px;" />
      </el-form-item>
      <el-form-item label="硬件版本号">
        <el-input v-model="latest_hardware_version" placeholder="如：v1.0" style="width: 120px;" />
      </el-form-item>
      <el-form-item>
        <el-button
          type="info"
          @click="fetchLatestFirmware"
          :disabled="!latest_device_type || !latest_hardware_version"
        >
          获取最新固件
        </el-button>
      </el-form-item>
    </el-form>
    <div v-if="latestFirmware" class="result">
      <h3>最新固件信息</h3>
      <pre>{{ latestFirmware | pretty }}</pre>
    </div>

    <!-- 获取最新测试/草稿固件区域 -->
    <h2>获取最新测试/草稿固件</h2>
    <el-form :inline="true" style="margin-bottom: 16px;">
      <el-form-item label="设备类型">
        <el-input v-model="staging_device_type" placeholder="如：esp32" style="width: 120px;" />
      </el-form-item>
      <el-form-item label="硬件版本号">
        <el-input v-model="staging_hardware_version" placeholder="如：V1.0" style="width: 120px;" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="staging_status" placeholder="请选择" style="width: 120px;">
          <el-option label="草稿 (draft)" value="draft" />
          <el-option label="测试中 (testing)" value="testing" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="info"
          :disabled="!staging_device_type || !staging_hardware_version || !staging_status"
          @click="fetchLatestStagingFirmware"
        >
          获取最新测试/草稿固件
        </el-button>
      </el-form-item>
    </el-form>
    <div v-if="latestStagingFirmware" class="result">
      <h3>最新测试/草稿固件信息</h3>
      <pre>{{ latestStagingFirmware | pretty }}</pre>
    </div>

    <!-- OTA 文件上传区域 -->
    <h2>OTA 文件上传</h2>
    <el-form :inline="true" style="margin-bottom: 16px;">
      <el-form-item label="设备类型">
        <el-input v-model="device_type" placeholder="如：esp32" style="width: 120px;" />
      </el-form-item>
      <el-form-item label="固件版本号">
        <el-input v-model="version" placeholder="如：1.0.0-20250101" style="width: 240px;" />
      </el-form-item>
      <el-form-item label="最小硬件版本号">
        <el-input v-model="min_hardware_version" placeholder="如：v1.0" style="width: 120px;" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="status" placeholder="请选择固件状态" style="width: 120px;">
          <el-option label="草稿 (draft)" value="draft" />
          <el-option label="测试中 (testing)" value="testing" />
          <el-option label="已发布 (released)" value="released" />
          <el-option label="已废弃 (deprecated)" value="deprecated" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-upload
      action=""
      :before-upload="beforeUpload"
      :show-file-list="false"
      :http-request="customUpload"
    >
      <el-button type="primary">选择OTA文件并上传</el-button>
    </el-upload>
    <div v-if="uploadResult" class="result">
      <h3>上传结果</h3>
      <pre>{{ uploadResult }}</pre>
    </div>

    <!-- 固件列表区域 -->
    <h2>固件列表</h2>
    <el-form :inline="true" style="margin-bottom: 16px;">
      <el-form-item label="设备类型">
        <el-input v-model="list_device_type" placeholder="如：esp32" style="width: 120px;" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="list_status" placeholder="全部" style="width: 120px;">
          <el-option label="全部" value="" />
          <el-option label="草稿 (draft)" value="draft" />
          <el-option label="测试中 (testing)" value="testing" />
          <el-option label="已发布 (released)" value="released" />
          <el-option label="已废弃 (deprecated)" value="deprecated" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="info"
          @click="fetchFirmwareList"
          :disabled="!list_device_type"
        >
          获取固件列表
        </el-button>
      </el-form-item>
    </el-form>
    <el-table
      v-if="firmwareList && firmwareList.length"
      :data="firmwareList"
      style="width: 100%; margin-bottom: 32px;"
      size="small"
      border
    >
      <el-table-column prop="version" label="版本号" width="120" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column prop="min_hardware_version" label="最小硬件版本" width="120" />
      <el-table-column prop="uploaded_at" label="上传时间" width="180" />
      <el-table-column prop="notes" label="备注" />
      <el-table-column prop="download_url" label="下载链接" width="200">
        <template slot-scope="scope">
          <a :href="scope.row.download_url" target="_blank">{{ scope.row.download_url }}</a>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template slot-scope="scope">
          <el-button
            type="danger"
            size="mini"
            @click="handleDeleteFirmware(scope.row.id)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-else-if="firmwareList && !firmwareList.length" style="color: #999; margin-bottom: 32px;">
      暂无数据
    </div>
  </div>
</template>

<script>
import { uploadOta, getLatestFirmware, getFirmwareList, deleteFirmware, getLatestStagingFirmware } from '@/api/user'
import { getToken } from '@/utils/auth'

export default {
  name: 'AdminPage',
  data() {
    return {
      // OTA上传相关
      uploadResult: null,
      device_type: '',
      version: '',
      min_hardware_version: '',
      status: '',
      // 最新固件相关
      latest_device_type: '',
      latest_hardware_version: '',
      latestFirmware: null,
      // 固件列表相关
      list_device_type: '',
      list_status: '',
      firmwareList: [],
      // 最新测试/草稿固件相关
      staging_device_type: '',
      staging_hardware_version: '',
      staging_status: '',
      latestStagingFirmware: null
    }
  },
  methods: {
    beforeUpload(file) {
      if (!this.device_type || !this.version || !this.min_hardware_version || !this.status) {
        this.$message.error('请填写所有必填项')
        return false
      }
      const isBin = file.name.endsWith('.bin') || file.name.endsWith('.zip')
      if (!isBin) {
        this.$message.error('只能上传 .bin 或 .zip 文件')
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
          this.device_type,
          this.version,
          this.status,
          this.min_hardware_version
        )
        this.$message.success('上传成功')
        this.uploadResult = JSON.stringify(res.data, null, 2)
        option.onSuccess && option.onSuccess(res.data)
      } catch (e) {
        this.$message.error('上传失败')
        this.uploadResult = e.message
        option.onError && option.onError(e)
      }
    },
    async fetchLatestFirmware() {
      if (!this.latest_device_type || !this.latest_hardware_version) {
        this.latestFirmware = null
        return
      }
      try {
        const res = await getLatestFirmware(
          this.latest_device_type,
          getToken(),
          this.latest_hardware_version
        )
        this.latestFirmware = res.data
      } catch (e) {
        this.latestFirmware = { error: e.message }
      }
    },
    async fetchLatestStagingFirmware() {
      if (!this.staging_device_type || !this.staging_hardware_version || !this.staging_status) {
        this.latestStagingFirmware = null
        return
      }
      try {
        const res = await getLatestStagingFirmware(
          this.staging_device_type,
          this.staging_hardware_version,
          this.staging_status,
          getToken()
        )
        this.latestStagingFirmware = res.data
      } catch (e) {
        this.latestStagingFirmware = { error: e?.response?.data?.detail || e.message }
      }
    },
    async fetchFirmwareList() {
      if (!this.list_device_type) {
        this.firmwareList = []
        return
      }
      try {
        const res = await getFirmwareList(
          this.list_device_type,
          getToken(),
          this.list_status
        )
        this.firmwareList = res.data.items || []
      } catch (e) {
        this.firmwareList = []
        this.$message.error(
          e?.response?.data?.detail || e.message || '获取固件列表失败'
        )
      }
    },
    handleDeleteFirmware(id) {
      this.$confirm('确定要删除该固件吗？', '确认删除', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        try {
          const token = getToken()
          await deleteFirmware(id, token)
          this.$message.success('固件删除成功')
          this.fetchFirmwareList()
        } catch (e) {
          this.$message.error('固件删除失败')
        }
      })
    }
  },
  filters: {
    pretty(val) {
      return typeof val === 'string' ? val : JSON.stringify(val, null, 2)
    }
  }
}
</script>

<style scoped>
.admin-page {
  max-width: 600px;
  margin: 40px auto;
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.result {
  margin-top: 32px;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 6px;
}
</style>
