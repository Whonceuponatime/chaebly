<template>
  <div class="wishlist">
    <h1>위시리스트</h1>
    
    <div v-if="wishlistItems.length === 0" class="empty-state">
      <p>아직 위시리스트에 담긴 상품이 없습니다.</p>
      <NuxtLink to="/products" class="browse-btn">상품 둘러보기</NuxtLink>
    </div>
    
    <div v-else class="wishlist-grid">
      <div v-for="item in wishlistItems" :key="item.id" class="wishlist-item">
        <div class="product-image">
          <img :src="item.image" alt="상품 이미지" />
        </div>
        <div class="product-info">
          <h3>{{ item.name }}</h3>
          <p class="price">{{ formatPrice(item.price) }}원</p>
          <p class="message">{{ item.message }}</p>
          <div class="actions">
            <button @click="removeFromWishlist(item.id)" class="remove-btn">삭제</button>
            <button @click="showMessageModal(item)" class="message-btn">메시지 수정</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Message Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>비밀 메시지</h2>
        <textarea
          v-model="currentMessage"
          placeholder="여기에 비밀 메시지를 입력하세요..."
          rows="4"
        ></textarea>
        <div class="modal-actions">
          <button @click="saveMessage">저장</button>
          <button @click="closeModal">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '../composables/useAuth'
import { useWishlist } from '../composables/useWishlist'
import { useRouter } from 'vue-router'

const { user } = useAuth()
const router = useRouter()
const { items: wishlistItems, removeItem: removeFromWishlist, updateMessage } = useWishlist()

// Redirect if not authorized
if (!user.value || user.value.email !== 'taebaek@gmail.com') {
  router.push('/')
}

const showModal = ref(false)
const currentMessage = ref('')
const currentItem = ref(null)

const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const showMessageModal = (item) => {
  currentItem.value = item
  currentMessage.value = item.message || ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  currentMessage.value = ''
  currentItem.value = null
}

const saveMessage = () => {
  if (currentItem.value) {
    updateMessage(currentItem.value.id, currentMessage.value)
  }
  closeModal()
}

// Add to wishlist function that will be used by other components
const addToWishlist = (product) => {
  const exists = wishlistItems.value.some(item => item.id === product.id)
  if (!exists) {
    wishlistItems.value.push({
      ...product,
      message: ''
    })
  }
}

// Expose the addToWishlist function to be used by other components
defineExpose({
  addToWishlist
})
</script>

<style scoped>
.wishlist {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

h1 {
  margin-bottom: 2rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: #f8f8f8;
  border-radius: 8px;
}

.empty-state p {
  margin-bottom: 1.5rem;
  color: #666;
}

.browse-btn {
  display: inline-block;
  padding: 0.8rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
}

.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.wishlist-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.product-image {
  aspect-ratio: 1;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 1rem;
}

.price {
  color: var(--primary-color);
  font-weight: 700;
  margin: 0.5rem 0;
}

.message {
  background-color: #f8f8f8;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  font-size: 0.9rem;
  white-space: pre-wrap;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.remove-btn {
  background-color: #ff4e4e;
  color: white;
}

.message-btn {
  background-color: #4e7fff;
  color: white;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.modal-content h2 {
  margin-bottom: 1rem;
}

textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: 'Noto Sans KR', sans-serif;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.modal-actions button {
  padding: 0.5rem 1.5rem;
}

.modal-actions button:first-child {
  background-color: var(--primary-color);
  color: white;
}

.modal-actions button:last-child {
  background-color: #e0e0e0;
}
</style> 