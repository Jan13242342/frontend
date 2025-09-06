<template>
  <div class="permission-page">
    <h1>Permission Page</h1>
    <p>This page is used to demonstrate role-based permission control.</p>
    <ul>
      <li>Only users with specific roles can access this page.</li>
      <li>You can configure permissions in the route meta information.</li>
      <li>Try switching roles to see different access results.</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'PermissionPage'
}
</script>

<style scoped>
.permission-page {
  max-width: 600px;
  margin: 40px auto;
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.permission-page h1 {
  margin-bottom: 16px;
}
.permission-page ul {
  margin: 16px 0;
  padding-left: 20px;
}
.permission-page li {
  margin-bottom: 8px;
}
</style>
