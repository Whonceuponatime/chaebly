<template>
  <div class="layout">
    <header class="header">
      <nav class="nav-container">
        <NuxtLink to="/" class="logo">채블리</NuxtLink>
        <div class="nav-links">
          <NuxtLink to="/products">상품</NuxtLink>
          <template v-if="user && user.email === 'taebaek@gmail.com'">
            <NuxtLink to="/wishlist">위시리스트</NuxtLink>
            <NuxtLink to="/mypage">마이페이지</NuxtLink>
          </template>
          <template v-if="!user">
            <NuxtLink to="/auth/login">로그인</NuxtLink>
            <NuxtLink to="/auth/register">회원가입</NuxtLink>
          </template>
          <a v-else href="#" @click.prevent="handleLogout" class="logout-link">로그아웃</a>
        </div>
      </nav>
    </header>

    <main class="main-content">
      <slot />
    </main>

    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>고객센터</h3>
          <p>평일 10:00 - 18:00</p>
          <p>주말 및 공휴일 휴무</p>
        </div>
        <div class="footer-section">
          <h3>채블리 정보</h3>
          <p>회사소개</p>
          <p>이용약관</p>
          <p>개인정보처리방침</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
const { user, logout } = useAuth()
const router = useRouter()

const handleLogout = async () => {
  await logout()
  router.push('/')
}
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  position: fixed;
  top: 0;
  width: 100%;
  background-color: var(--background-color);
  border-bottom: 1px solid var(--border-color);
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-links a {
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
}

.nav-links a:hover {
  color: var(--primary-color);
}

.logout-link {
  cursor: pointer;
}

.main-content {
  margin-top: 60px;
  flex: 1;
  padding: 1rem;
}

.footer {
  background-color: #f8f8f8;
  padding: 2rem 0;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.footer-section h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.footer-section p {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}
</style> 