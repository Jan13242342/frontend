<template>
  <div class="admin-page">
    <h1>管理员中心</h1>
    <p style="color: #e67e22; margin-top: 32px;">
      欢迎来到管理员专属页面！😄
    </p>
    <ul>
      <li>用户管理</li>
      <li>系统设置</li>
      <li>权限分配</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'AdminPage'
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
.admin-page h1 {
  margin-bottom: 16px;
  color: #e67e22;
}
.admin-page ul {
  margin: 16px 0;
  padding-left: 20px;
}
.admin-page li {
  margin-bottom: 8px;
}
</style>
