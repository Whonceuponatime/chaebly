<template>
  <div class="app">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');

:root {
  --primary-color: #ff4e50;
  --text-color: #333;
  --background-color: #fff;
  --border-color: #e0e0e0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans KR', sans-serif;
  color: var(--text-color);
  background-color: var(--background-color);
}

.app {
  min-height: 100vh;
}
</style>
