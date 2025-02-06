<template>
  <div class="mypage">
    <div class="profile-header">
      <div class="profile-info">
        <div class="profile-image">
          <img src="https://picsum.photos/200/200" alt="프로필 이미지" />
        </div>
        <div class="profile-details">
          <h1>{{ user.name }}님</h1>
          <p class="email">{{ user.email }}</p>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="sidebar">
        <nav class="nav-menu">
          <a href="#orders" class="nav-item" :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">
            주문내역
          </a>
          <a href="#wishlist" class="nav-item" :class="{ active: activeTab === 'wishlist' }" @click="activeTab = 'wishlist'">
            위시리스트
          </a>
          <a href="#reviews" class="nav-item" :class="{ active: activeTab === 'reviews' }" @click="activeTab = 'reviews'">
            상품후기
          </a>
          <a href="#settings" class="nav-item" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
            설정
          </a>
        </nav>
      </div>

      <div class="main-content">
        <!-- Orders Tab -->
        <div v-if="activeTab === 'orders'" class="tab-content">
          <h2>주문내역</h2>
          <div class="order-list">
            <div v-for="order in orders" :key="order.id" class="order-item">
              <div class="order-header">
                <span class="order-date">{{ order.date }}</span>
                <span class="order-status">{{ order.status }}</span>
              </div>
              <div class="order-products">
                <div v-for="product in order.products" :key="product.id" class="order-product">
                  <img :src="product.image" :alt="product.name" />
                  <div class="product-info">
                    <h3>{{ product.name }}</h3>
                    <p class="price">{{ formatPrice(product.price) }}원</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Wishlist Tab -->
        <div v-if="activeTab === 'wishlist'" class="tab-content">
          <h2>위시리스트</h2>
          <div class="wishlist-grid">
            <div v-for="item in wishlistItems" :key="item.id" class="wishlist-item">
              <img :src="item.image" :alt="item.name" />
              <div class="item-info">
                <h3>{{ item.name }}</h3>
                <p class="price">{{ formatPrice(item.price) }}원</p>
                <p class="message">{{ item.message }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews Tab -->
        <div v-if="activeTab === 'reviews'" class="tab-content">
          <h2>상품후기</h2>
          <div class="reviews-list">
            <div v-for="review in reviews" :key="review.id" class="review-item">
              <div class="review-header">
                <img :src="review.productImage" :alt="review.productName" />
                <div class="review-product-info">
                  <h3>{{ review.productName }}</h3>
                  <div class="rating">
                    ⭐️'.repeat(review.rating)
                  </div>
                </div>
              </div>
              <p class="review-content">{{ review.content }}</p>
              <p class="review-date">{{ review.date }}</p>
            </div>
          </div>
        </div>

        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'" class="tab-content">
          <h2>설정</h2>
          <div class="settings-form">
            <div class="form-group">
              <label>이름</label>
              <input type="text" v-model="user.name" />
            </div>
            <div class="form-group">
              <label>이메일</label>
              <input type="email" v-model="user.email" />
            </div>
            <div class="form-group">
              <label>전화번호</label>
              <input type="tel" v-model="user.phone" />
            </div>
            <button class="save-btn">저장하기</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const activeTab = ref('orders')

// Sample user data
const user = ref({
  name: '김채블리',
  email: 'chaebly@example.com',
  phone: '010-1234-5678'
})

// Sample orders data
const orders = ref([
  {
    id: 1,
    date: '2024-02-05',
    status: '배송완료',
    products: [
      {
        id: 1,
        name: '캐시미어 니트 스웨터',
        price: 89000,
        image: 'https://picsum.photos/200/200?random=1'
      }
    ]
  }
])

// Sample wishlist data
const wishlistItems = ref([
  {
    id: 1,
    name: '귀여운 니트',
    price: 39000,
    image: 'https://picsum.photos/200/200?random=2',
    message: '이거 너무 예쁘지 않아? 우리 데이트할 때 입고 싶어 ❤️'
  }
])

// Sample reviews data
const reviews = ref([
  {
    id: 1,
    productName: '캐시미어 니트 스웨터',
    productImage: 'https://picsum.photos/200/200?random=3',
    rating: 5,
    content: '너무 따뜻하고 좋아요! 배송도 빨랐습니다.',
    date: '2024-02-01'
  }
])

const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
</script>

<style scoped>
.mypage {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.profile-header {
  background-color: #f8f8f8;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.profile-image {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
}

.profile-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-details h1 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.email {
  color: #666;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2rem;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  padding: 1rem;
  text-decoration: none;
  color: #666;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-item:hover {
  background-color: #f0f0f0;
}

.nav-item.active {
  background-color: var(--primary-color);
  color: white;
}

.tab-content {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
}

.tab-content h2 {
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.order-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.order-header {
  background-color: #f8f8f8;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
}

.order-status {
  color: var(--primary-color);
  font-weight: 500;
}

.order-products {
  padding: 1rem;
}

.order-product {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

.order-product:last-child {
  border-bottom: none;
}

.order-product img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.wishlist-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.wishlist-item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.item-info {
  padding: 1rem;
}

.review-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.review-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.review-header img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.rating {
  color: #ffd700;
}

.review-content {
  color: #666;
  margin-bottom: 0.5rem;
}

.review-date {
  color: #999;
  font-size: 0.9rem;
}

.settings-form {
  max-width: 400px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
}

.form-group input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: 'Noto Sans KR', sans-serif;
}

.save-btn {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .nav-menu {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 1rem;
  }

  .nav-item {
    white-space: nowrap;
  }
}
</style> 