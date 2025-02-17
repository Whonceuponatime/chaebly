<template>
  <div class="admin-page">
    <div v-if="!isAuthorized" class="unauthorized">
      <h1>접근 권한이 없습니다</h1>
      <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
      <NuxtLink to="/" class="back-link">홈으로 돌아가기</NuxtLink>
    </div>

    <div v-else class="admin-content">
      <h1>관리자 페이지</h1>
      
      <div class="admin-sections">
        <!-- Database Status -->
        <section class="admin-section">
          <h2>데이터베이스 상태</h2>
          <div class="status-grid">
            <div class="status-item">
              <h3>Products</h3>
              <p>{{ products.length }} items</p>
              <button @click="refreshProducts" :disabled="loading">
                새로고침
              </button>
            </div>
            <div class="status-item">
              <h3>Wishlist Items</h3>
              <p>{{ wishlistCount }} items</p>
              <button @click="refreshWishlist" :disabled="loading">
                새로고침
              </button>
            </div>
          </div>
        </section>

        <!-- Database Management -->
        <section class="admin-section">
          <h2>데이터베이스 관리</h2>
          <div class="action-buttons">
            <button 
              @click="resetDatabase" 
              :disabled="loading"
              class="danger-btn"
            >
              데이터베이스 초기화
            </button>
            <button 
              @click="reinsertSampleData" 
              :disabled="loading"
              class="primary-btn"
            >
              샘플 데이터 재생성
            </button>
          </div>
        </section>

        <!-- User Management -->
        <section class="admin-section">
          <h2>사용자 관리</h2>
          <div class="user-list">
            <div v-for="user in users" :key="user.id" class="user-item">
              <div class="user-info">
                <p class="email">{{ user.email }}</p>
                <p class="created-at">가입일: {{ formatDate(user.created_at) }}</p>
              </div>
              <div class="user-actions">
                <button 
                  @click="resetUserPassword(user.id)"
                  :disabled="loading"
                  class="secondary-btn"
                >
                  비밀번호 초기화
                </button>
                <button 
                  @click="deleteUser(user.id)"
                  :disabled="loading"
                  class="danger-btn"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- System Info -->
        <section class="admin-section">
          <h2>시스템 정보</h2>
          <div class="system-info">
            <p><strong>Supabase URL:</strong> {{ supabaseUrl }}</p>
            <p><strong>Environment:</strong> {{ environment }}</p>
            <p><strong>Version:</strong> {{ version }}</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSupabaseClient } from '#imports'
import { useAuth } from '../composables/useAuth'
import { useProducts } from '../composables/useProducts'
import { useWishlist } from '../composables/useWishlist'

const { user } = useAuth()
const supabase = useSupabaseClient()
const router = useRouter()
const loading = ref(false)
const { products } = useProducts()
const { items: wishlistItems } = useWishlist()

// Admin authorization
const isAuthorized = computed(() => {
  return user.value?.email === 'taebaek@gmail.com'
})

// Redirect if not authorized
watchEffect(() => {
  if (user.value && !isAuthorized.value) {
    router.push('/')
  }
})

// System info
const supabaseUrl = process.env.SUPABASE_URL || 'Not configured'
const environment = process.env.NODE_ENV
const version = '1.0.0'

// Database stats
const wishlistCount = computed(() => wishlistItems.value.length)
const users = ref([])

// Fetch initial data
onMounted(async () => {
  if (isAuthorized.value) {
    await fetchUsers()
  }
})

// Database management functions
const resetDatabase = async () => {
  if (!confirm('정말 데이터베이스를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
  
  loading.value = true
  try {
    // Delete all wishlist items
    await supabase.from('wishlist_items').delete().neq('id', 0)
    // Delete all products
    await supabase.from('products').delete().neq('id', 0)
    await refreshData()
  } catch (error) {
    console.error('Error resetting database:', error)
  } finally {
    loading.value = false
  }
}

const reinsertSampleData = async () => {
  loading.value = true
  try {
    // Insert sample products
    const { error } = await supabase.from('products').insert(products)
    if (error) throw error
    await refreshData()
  } catch (error) {
    console.error('Error inserting sample data:', error)
  } finally {
    loading.value = false
  }
}

// User management functions
const fetchUsers = async () => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) throw error
    users.value = data
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

const resetUserPassword = async (userId) => {
  loading.value = true
  try {
    // In a real app, you would implement password reset logic here
    console.log('Reset password for user:', userId)
  } catch (error) {
    console.error('Error resetting password:', error)
  } finally {
    loading.value = false
  }
}

const deleteUser = async (userId) => {
  if (!confirm('정말 이 사용자를 삭제하시겠습니까?')) return

  loading.value = true
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) throw error
    await fetchUsers()
  } catch (error) {
    console.error('Error deleting user:', error)
  } finally {
    loading.value = false
  }
}

// Refresh functions
const refreshProducts = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase.from('products').select('*')
    if (error) throw error
    console.log('Products refreshed:', data)
  } catch (error) {
    console.error('Error refreshing products:', error)
  } finally {
    loading.value = false
  }
}

const refreshWishlist = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase.from('wishlist_items').select('*')
    if (error) throw error
    console.log('Wishlist refreshed:', data)
  } catch (error) {
    console.error('Error refreshing wishlist:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await Promise.all([
    refreshProducts(),
    refreshWishlist(),
    fetchUsers()
  ])
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.admin-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.unauthorized {
  text-align: center;
  padding: 4rem 2rem;
}

.unauthorized h1 {
  color: #ff4e4e;
  margin-bottom: 1rem;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  padding: 0.8rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.admin-content h1 {
  margin-bottom: 2rem;
}

.admin-sections {
  display: grid;
  gap: 2rem;
}

.admin-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-section h2 {
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.status-item {
  padding: 1rem;
  background: #f8f8f8;
  border-radius: 4px;
}

.status-item h3 {
  margin-bottom: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.primary-btn {
  background-color: var(--primary-color);
  color: white;
}

.secondary-btn {
  background-color: #4e7fff;
  color: white;
}

.danger-btn {
  background-color: #ff4e4e;
  color: white;
}

.user-list {
  display: grid;
  gap: 1rem;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f8f8;
  border-radius: 4px;
}

.user-info .email {
  font-weight: 500;
  margin-bottom: 0.3rem;
}

.user-info .created-at {
  font-size: 0.9rem;
  color: #666;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.system-info {
  background: #f8f8f8;
  padding: 1rem;
  border-radius: 4px;
}

.system-info p {
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .user-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .user-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .action-buttons {
    flex-direction: column;
  }

  .user-actions {
    flex-direction: column;
    width: 100%;
  }

  .user-actions button {
    width: 100%;
  }
}
</style> 