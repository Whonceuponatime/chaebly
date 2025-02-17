<template>
  <div class="products-page">
    <SlidingBanner />
    
    <div class="products">
      <div class="filters">
        <div class="search-section">
          <SearchBar />
        </div>
        
        <div class="filter-section">
          <h3>카테고리</h3>
          <div class="category-filters">
            <label v-for="(icon, category) in categoryIcons" :key="category" class="category-filter">
              <input 
                type="checkbox" 
                v-model="selectedCategories" 
                :value="category"
                @change="filterProducts"
              >
              <img :src="icon" :alt="categoryMapping[category]">
              <span>{{ categoryMapping[category] }}</span>
            </label>
          </div>
        </div>

        <div class="filter-section">
          <h3>가격대</h3>
          <div class="filter-options">
            <label v-for="range in priceRanges" :key="range.label">
              <input 
                type="checkbox" 
                v-model="selectedPriceRanges" 
                :value="range"
                @change="filterProducts"
              >
              {{ range.label }}
            </label>
          </div>
        </div>

        <div class="filter-section">
          <h3>정렬</h3>
          <select v-model="sortBy" @change="filterProducts">
            <option value="newest">최신순</option>
            <option value="priceAsc">가격 낮은순</option>
            <option value="priceDesc">가격 높은순</option>
            <option value="popular">인기순</option>
          </select>
        </div>
      </div>

      <div class="products-container">
        <div class="products-header">
          <h1>
            <template v-if="route.query.search">
              "{{ route.query.search }}" 검색결과
            </template>
            <template v-else>
              전체상품
            </template>
            <span>({{ filteredProducts.length }})</span>
          </h1>
        </div>

        <div v-if="filteredProducts.length === 0" class="no-results">
          <p>검색 결과가 없습니다.</p>
          <p>다른 검색어를 입력해보세요.</p>
        </div>

        <div v-else class="product-grid">
          <div v-for="product in filteredProducts" :key="product.id" class="product-card">
            <div class="product-image">
              <NuxtLink :to="`/products/${product.id}`">
                <img :src="product.image" :alt="product.name" />
              </NuxtLink>
              <button 
                v-if="user"
                class="wishlist-btn" 
                :class="{ 'in-wishlist': isInWishlist(product.id) }"
                @click="handleWishlist(product)"
              >
                <span v-if="isInWishlist(product.id)">❤️</span>
                <span v-else>🤍</span>
              </button>
            </div>
            <div class="product-info">
              <div class="brand">{{ product.brand }}</div>
              <h3>{{ product.name }}</h3>
              <p class="price">{{ formatPrice(product.price) }}원</p>
              <div class="tags">
                <span v-for="tag in product.tags" :key="tag">#{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ValentineBox 
      v-if="showValentineBox" 
      :show="showValentineBox"
      :message="valentineMessage"
      @close="showValentineBox = false"
    />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useWishlist } from '~/composables/useWishlist'
import { useProducts } from '../composables/useProducts'
import SlidingBanner from '../components/SlidingBanner.vue'
import ValentineBox from '../components/ValentineBox.vue'

const route = useRoute()
const { user } = useAuth()
const { addItem, removeItem, isInWishlist } = useWishlist()
const { products } = useProducts()
const selectedCategories = ref([])
const selectedPriceRanges = ref([])
const sortBy = ref('newest')
const showValentineBox = ref(false)
const valentineMessage = ref('')

const categoryMapping = {
  'top': '상의',
  'bottom': '하의',
  'dress': '원피스',
  'outer': '아우터',
  'bag': '가방',
  'shoes': '신발',
  'accessory': '액세서리',
  'jewelry': '주얼리'
}

const categoryIcons = {
  'top': '/images/icon_category_top.png',
  'bottom': '/images/icon_category_bottom.png',
  'dress': '/images/icon_category_dress.png',
  'outer': '/images/icon_category_outer.png',
  'bag': '/images/icon_category_bag.png',
  'shoes': '/images/icon_category_shoes.png',
  'accessory': '/images/icon_category_accessory.png',
  'jewelry': '/images/icon_category_jewelry.png'
}

const priceRanges = [
  { label: '2만원 이하', min: 0, max: 20000 },
  { label: '2-5만원', min: 20000, max: 50000 },
  { label: '5-10만원', min: 50000, max: 100000 },
  { label: '10만원 이상', min: 100000, max: Infinity }
]

const filteredProducts = computed(() => {
  let result = [...products]

  // Apply search filter
  if (route.query.search) {
    const query = route.query.search.toLowerCase()
    result = result.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Apply category filter
  if (selectedCategories.value.length > 0) {
    result = result.filter(product => 
      selectedCategories.value.includes(product.category)
    )
  }

  // Apply price range filter
  if (selectedPriceRanges.value.length > 0) {
    result = result.filter(product => 
      selectedPriceRanges.value.some(range => 
        product.price >= range.min && product.price <= range.max
      )
    )
  }

  // Apply sorting
  switch (sortBy.value) {
    case 'priceAsc':
      result.sort((a, b) => a.price - b.price)
      break
    case 'priceDesc':
      result.sort((a, b) => b.price - a.price)
      break
    case 'popular':
      result.sort((a, b) => b.popularity - a.popularity)
      break
    // newest is default, no need to sort
  }

  return result
})

const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const handleWishlist = async (product) => {
  if (!user.value) {
    router.push('/auth/login')
    return
  }

  const wishlistProduct = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image
  }

  // Check if it's the second item (플라워 패턴 원피스)
  if (product.id === 2) {
    valentineMessage.value = '플라워 패턴 원피스를 위시리스트에 담았어요! 💝\n데이트할 때 입으면 예쁠 것 같아요~'
    showValentineBox.value = true
  }

  if (isInWishlist(product.id)) {
    removeItem(product.id)
  } else {
    addItem(wishlistProduct)
  }
}

// Watch route query changes to handle direct navigation to search results
watch(() => route.query.search, (newSearch) => {
  if (newSearch) {
    // Reset filters when searching
    selectedCategories.value = []
    selectedPriceRanges.value = []
    sortBy.value = 'newest'
  }
})
</script>

<style scoped>
.products-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.products {
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 0;
}

.filters {
  width: 250px;
  flex-shrink: 0;
}

.search-section {
  margin-bottom: 2rem;
}

.filter-section {
  margin-bottom: 2rem;
}

.filter-section h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: 'Noto Sans KR', sans-serif;
}

.products-container {
  flex-grow: 1;
}

.products-header {
  margin-bottom: 2rem;
}

.products-header h1 {
  font-size: 1.5rem;
}

.products-header span {
  color: var(--primary-color);
}

.no-results {
  text-align: center;
  padding: 3rem 0;
  color: #666;
}

.no-results p:first-child {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.product-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wishlist-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.wishlist-btn:hover {
  transform: scale(1.1);
}

.wishlist-btn.in-wishlist {
  background-color: var(--primary-color);
}

.wishlist-btn.in-wishlist:hover {
  background-color: #ff3a3c;
}

.product-info {
  padding: 1rem;
}

.brand {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.3rem;
}

.product-info h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.price {
  color: var(--primary-color);
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tags span {
  background-color: #f0f0f0;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.category-filters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
}

.category-filter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.category-filter input {
  display: none;
}

.category-filter img {
  width: 40px;
  height: 40px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.category-filter input:checked + img {
  opacity: 1;
}

.category-filter span {
  font-size: 0.9rem;
  color: #666;
}

@media (max-width: 768px) {
  .products {
    flex-direction: column;
  }

  .filters {
    width: 100%;
    position: relative;
  }

  .search-section {
    margin-bottom: 1rem;
  }

  .filter-section {
    margin-bottom: 1.5rem;
  }

  .category-filters {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .category-filter img {
    width: 32px;
    height: 32px;
  }

  .category-filter span {
    font-size: 0.8rem;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .product-card {
    font-size: 0.9rem;
  }

  .product-info {
    padding: 0.75rem;
  }

  .product-info h3 {
    font-size: 0.9rem;
  }

  .tags span {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
  }

  .products-header h1 {
    font-size: 1.2rem;
  }

  .filter-options label {
    padding: 0.5rem 0;
  }
}

@media (max-width: 480px) {
  .products-page {
    padding: 0 0.5rem;
  }

  .category-filters {
    grid-template-columns: repeat(3, 1fr);
  }

  .product-grid {
    grid-template-columns: repeat(1, 1fr);
  }

  .product-card {
    max-width: 100%;
  }

  .filter-section h3 {
    font-size: 0.9rem;
  }

  .filter-options {
    font-size: 0.9rem;
  }

  select {
    font-size: 0.9rem;
  }
}
</style> 