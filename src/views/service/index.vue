<template>
  <div class="service-page">
    <h1>服务中心</h1>
    <p style="color: #27ae60; margin-top: 32px;">
      欢迎来到服务专属页面！🚀
    </p>
    <ul>
      <li>服务工单管理</li>
      <li>客户反馈处理</li>
      <li>服务统计报表</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'ServicePage'
}
</script>

<style scoped>
.service-page {
  max-width: 600px;
  margin: 40px auto;
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.service-page h1 {
  margin-bottom: 16px;
  color: #27ae60;
}
.service-page ul {
  margin: 16px 0;
  padding-left: 20px;
}
.service-page li {
  margin-bottom: 8px;
}
</style>
