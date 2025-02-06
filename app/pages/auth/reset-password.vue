<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>비밀번호 재설정</h1>
      
      <form @submit.prevent="handleResetPassword" class="auth-form">
        <div class="form-group">
          <label for="email">이메일</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="가입하신 이메일을 입력하세요"
          >
        </div>

        <p v-if="error" class="error-message">{{ error }}</p>
        <p v-if="success" class="success-message">
          비밀번호 재설정 링크가 이메일로 전송되었습니다.<br>
          이메일을 확인해주세요.
        </p>

        <button type="submit" class="submit-btn" :disabled="loading || success">
          {{ loading ? '전송 중...' : '비밀번호 재설정 링크 전송' }}
        </button>

        <div class="auth-links">
          <NuxtLink to="/auth/login">로그인으로 돌아가기</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const { resetPassword, loading, error } = useAuth()
const success = ref(false)
const email = ref('')

const handleResetPassword = async () => {
  success.value = false
  await resetPassword(email.value)
  if (!error.value) {
    success.value = true
  }
}
</script>

<style scoped>
.auth-container {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.auth-card h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--primary-color);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  color: #666;
}

.form-group input {
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: 'Noto Sans KR', sans-serif;
}

.error-message {
  color: #ff4e4e;
  font-size: 0.9rem;
  text-align: center;
}

.success-message {
  color: #4caf50;
  font-size: 0.9rem;
  text-align: center;
  line-height: 1.5;
}

.submit-btn {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-links {
  display: flex;
  justify-content: center;
  font-size: 0.9rem;
}

.auth-links a {
  color: #666;
  text-decoration: none;
}

.auth-links a:hover {
  color: var(--primary-color);
}
</style> 