<template>
  <div class="wishlist">
    <h1>위시리스트</h1>
    
    <div class="wishlist-grid">
      <div v-for="item in wishlistItems" :key="item.id" class="wishlist-item">
        <div class="product-image">
          <img :src="item.image" alt="상품 이미지" />
        </div>
        <div class="product-info">
          <h3>{{ item.name }}</h3>
          <p class="price">{{ item.price }}원</p>
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
const showModal = ref(false)
const currentMessage = ref('')
const currentItem = ref(null)

// Simulated wishlist data - this would normally come from your backend
const wishlistItems = ref([
  {
    id: 1,
    name: '귀여운 니트',
    price: '39,000',
    image: 'https://picsum.photos/400/500?random=1',
    message: '이거 너무 예쁘지 않아? 우리 데이트할 때 입고 싶어 ❤️'
  },
  {
    id: 2,
    name: '캐주얼 청바지',
    price: '45,000',
    image: 'https://picsum.photos/400/500?random=2',
    message: '오늘 하루도 잘 보내! 사랑해 😊'
  }
])

const showMessageModal = (item) => {
  currentItem.value = item
  currentMessage.value = item.message
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  currentMessage.value = ''
  currentItem.value = null
}

const saveMessage = () => {
  if (currentItem.value) {
    const item = wishlistItems.value.find(i => i.id === currentItem.value.id)
    if (item) {
      item.message = currentMessage.value
    }
  }
  closeModal()
}

const removeFromWishlist = (id) => {
  wishlistItems.value = wishlistItems.value.filter(item => item.id !== id)
}
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