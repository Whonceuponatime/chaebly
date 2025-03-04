<template>
  <div class="layout">
    <header class="header">
      <nav class="nav-container">
        <NuxtLink to="/" class="logo">채블리</NuxtLink>
        
        <button class="mobile-menu-btn" @click="isMobileMenuOpen = !isMobileMenuOpen">
          <span class="menu-icon"></span>
        </button>

        <div class="nav-links" :class="{ 'mobile-open': isMobileMenuOpen }">
          <NuxtLink to="/products" @click="isMobileMenuOpen = false">상품</NuxtLink>
          <NuxtLink to="/photography" @click="isMobileMenuOpen = false">포토그래피</NuxtLink>
          <template v-if="user && user.email === 'taebaek@gmail.com'">
            <NuxtLink to="/wishlist" @click="isMobileMenuOpen = false">위시리스트</NuxtLink>
            <NuxtLink to="/mypage" @click="isMobileMenuOpen = false">마이페이지</NuxtLink>
          </template>
          <template v-if="!user">
            <NuxtLink to="/auth/login" @click="isMobileMenuOpen = false">로그인</NuxtLink>
            <NuxtLink to="/auth/register" @click="isMobileMenuOpen = false">회원가입</NuxtLink>
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
const isMobileMenuOpen = ref(false)

const handleLogout = async () => {
  isMobileMenuOpen.value = false
  await logout()
  router.push('/')
}

// Close mobile menu when route changes
watch(() => router.currentRoute.value.path, () => {
  isMobileMenuOpen.value = false
})
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
  z-index: 1001;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  z-index: 1001;
}

.menu-icon {
  display: block;
  width: 24px;
  height: 2px;
  background-color: var(--text-color);
  position: relative;
  transition: background-color 0.3s;
}

.menu-icon::before,
.menu-icon::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  background-color: var(--text-color);
  transition: transform 0.3s;
}

.menu-icon::before {
  top: -6px;
}

.menu-icon::after {
  bottom: -6px;
}

.mobile-menu-btn.active .menu-icon {
  background-color: transparent;
}

.mobile-menu-btn.active .menu-icon::before {
  transform: rotate(45deg);
  top: 0;
}

.mobile-menu-btn.active .menu-icon::after {
  transform: rotate(-45deg);
  bottom: 0;
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

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: block;
  }

  .nav-links {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--background-color);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    padding: 2rem;
    font-size: 1.2rem;
  }

  .nav-links.mobile-open {
    transform: translateX(0);
  }

  .main-content {
    padding: 0.5rem;
  }

  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0.75rem 1rem;
  }

  .logo {
    font-size: 1.2rem;
  }

  .main-content {
    margin-top: 50px;
  }
}
</style> 