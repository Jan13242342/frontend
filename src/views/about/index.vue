<template>
  <div class="about-page">
    <h1>About Page</h1>
    <p style="color: #e67e22; margin-top: 32px;">
      吴总少吃点，给我留点 😄
    </p>
  </div>
</template>

<script>
export default {
  name: 'About'
}
</script>

<style scoped>
.about-page {
  max-width: 600px;
  margin: 40px auto;
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.about-page h1 {
  margin-bottom: 16px;
}
.about-page ul {
  margin: 16px 0;
  padding-left: 20px;
}
.about-page li {
  margin-bottom: 8px;
}
</style>
