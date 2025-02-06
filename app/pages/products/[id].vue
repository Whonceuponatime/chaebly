<template>
  <div class="product-detail">
    <div class="product-images">
      <div class="main-image">
        <img :src="product.mainImage" :alt="product.name" />
      </div>
      <div class="thumbnail-images">
        <img 
          v-for="(img, index) in product.images" 
          :key="index" 
          :src="img" 
          :alt="product.name + ' ' + (index + 1)"
          @click="product.mainImage = img"
        />
      </div>
    </div>

    <div class="product-info">
      <div class="brand">{{ product.brand }}</div>
      <h1>{{ product.name }}</h1>
      
      <div class="price-section">
        <p class="price">{{ formatPrice(product.price) }}원</p>
        <p class="original-price" v-if="product.originalPrice">
          <span>{{ formatPrice(product.originalPrice) }}원</span>
          <span class="discount">{{ calculateDiscount(product.price, product.originalPrice) }}% OFF</span>
        </p>
      </div>

      <div class="delivery-info">
        <div class="info-item">
          <span class="label">배송</span>
          <span>무료배송</span>
        </div>
        <div class="info-item">
          <span class="label">배송예정</span>
          <span>{{ getDeliveryDate() }}</span>
        </div>
      </div>

      <div class="options">
        <div class="size-selection">
          <h3>사이즈</h3>
          <div class="size-buttons">
            <button 
              v-for="size in product.sizes" 
              :key="size"
              :class="{ active: selectedSize === size }"
              @click="selectedSize = size"
            >
              {{ size }}
            </button>
          </div>
        </div>

        <div class="quantity-selection">
          <h3>수량</h3>
          <div class="quantity-control">
            <button @click="decreaseQuantity">-</button>
            <input type="number" v-model="quantity" min="1" max="99">
            <button @click="increaseQuantity">+</button>
          </div>
        </div>
      </div>

      <div class="total-price">
        <span>총 상품금액</span>
        <span class="amount">{{ formatPrice(product.price * quantity) }}원</span>
      </div>

      <div class="action-buttons">
        <button class="wishlist-btn" @click="toggleWishlist">
          <span v-if="isInWishlist">❤️ 위시리스트에서 삭제</span>
          <span v-else>🤍 위시리스트에 담기</span>
        </button>
        <button class="buy-btn">구매하기</button>
      </div>

      <div class="product-details">
        <h2>상품정보</h2>
        <div class="detail-content">
          <p>{{ product.description }}</p>
          <div class="tags">
            <span v-for="tag in product.tags" :key="tag">#{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const quantity = ref(1)
const selectedSize = ref(null)
const isInWishlist = ref(false)

// Sample product data - this would normally come from your backend
const product = ref({
  id: route.params.id,
  name: '캐시미어 니트 스웨터',
  brand: '채블리',
  price: 89000,
  originalPrice: 129000,
  mainImage: 'https://picsum.photos/800/1000?random=1',
  images: [
    'https://picsum.photos/800/1000?random=1',
    'https://picsum.photos/800/1000?random=2',
    'https://picsum.photos/800/1000?random=3',
    'https://picsum.photos/800/1000?random=4'
  ],
  sizes: ['S', 'M', 'L', 'XL'],
  description: '부드러운 캐시미어 소재로 제작된 프리미엄 니트 스웨터입니다. 데일리하게 착용하기 좋은 베이직한 디자인으로 다양한 코디에 활용하기 좋습니다.',
  tags: ['니트', '겨울', '데일리', '캐시미어']
})

const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const calculateDiscount = (price, originalPrice) => {
  return Math.round((1 - price / originalPrice) * 100)
}

const getDeliveryDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + 2)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value--
}

const increaseQuantity = () => {
  if (quantity.value < 99) quantity.value++
}

const toggleWishlist = () => {
  isInWishlist.value = !isInWishlist.value
  // Implement wishlist toggle logic
}
</script>

<style scoped>
.product-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}

.product-images {
  position: sticky;
  top: 80px;
}

.main-image {
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.main-image img {
  width: 100%;
  height: auto;
  display: block;
}

.thumbnail-images {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.thumbnail-images img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.thumbnail-images img:hover {
  opacity: 0.8;
}

.product-info {
  padding-top: 1rem;
}

.brand {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 0.5rem;
}

h1 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.price-section {
  margin-bottom: 2rem;
}

.price {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.original-price {
  color: #999;
  text-decoration: line-through;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.discount {
  color: var(--primary-color);
  margin-left: 0.5rem;
}

.delivery-info {
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  margin-bottom: 0.5rem;
}

.info-item .label {
  width: 80px;
  color: #666;
}

.options {
  margin-bottom: 2rem;
}

.options h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.size-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.size-buttons button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: none;
  cursor: pointer;
}

.size-buttons button.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.quantity-control {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  width: fit-content;
}

.quantity-control button {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
}

.quantity-control input {
  width: 50px;
  text-align: center;
  border: none;
  border-left: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  padding: 0.5rem;
}

.total-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2rem 0;
  padding: 1rem 0;
  border-top: 1px solid var(--border-color);
}

.total-price .amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-buttons button {
  padding: 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.wishlist-btn {
  background-color: #f8f8f8;
}

.buy-btn {
  background-color: var(--primary-color);
  color: white;
}

.product-details {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.product-details h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.detail-content {
  color: #666;
  line-height: 1.6;
}

.tags {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tags span {
  background-color: #f0f0f0;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .product-detail {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .product-images {
    position: static;
  }
}
</style> 