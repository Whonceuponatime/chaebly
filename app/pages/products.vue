<template>
  <div class="products">
    <div class="filters">
      <div class="search-section">
        <SearchBar />
      </div>
      
      <div class="filter-section">
        <h3>카테고리</h3>
        <div class="filter-options">
          <label v-for="cat in categories" :key="cat">
            <input 
              type="checkbox" 
              v-model="selectedCategories" 
              :value="cat"
              @change="filterProducts"
            >
            {{ cat }}
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
              v-if="user?.email === 'taebaek@gmail.com'"
              class="wishlist-btn" 
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
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useWishlist } from '~/composables/useWishlist'

const route = useRoute()
const { user } = useAuth()
const { addItem, removeItem, isInWishlist } = useWishlist()
const selectedCategories = ref([])
const selectedPriceRanges = ref([])
const sortBy = ref('newest')

const categories = [
  '상의', '하의', '원피스', '아우터', '가방', '신발', '액세서리'
]

const priceRanges = [
  { label: '2만원 이하', min: 0, max: 20000 },
  { label: '2-5만원', min: 20000, max: 50000 },
  { label: '5-10만원', min: 50000, max: 100000 },
  { label: '10만원 이상', min: 100000, max: Infinity }
]

// Sample products data
const products = ref([
  {
    id: 1,
    name: '캐시미어 니트 스웨터',
    brand: '채블리',
    price: 89000,
    image: 'https://picsum.photos/400/500?random=10',
    category: '상의',
    tags: ['니트', '겨울', '데일리'],
    popularity: 95
  },
  {
    id: 2,
    name: '하이웨스트 와이드 데님',
    brand: '러블리',
    price: 45000,
    image: 'https://picsum.photos/400/500?random=11',
    category: '하의',
    tags: ['데님', '데일리'],
    popularity: 88
  },
  {
    id: 3,
    name: '플리츠 미디 스커트',
    brand: '스타일리시',
    price: 35000,
    image: 'https://picsum.photos/400/500?random=12',
    category: '하의',
    tags: ['스커트', '봄'],
    popularity: 92
  },
  {
    id: 4,
    name: '오버사이즈 트렌치코트',
    brand: '채블리',
    price: 129000,
    image: 'https://picsum.photos/400/500?random=13',
    category: '아우터',
    tags: ['코트', '봄', '가을'],
    popularity: 97
  },
  {
    id: 5,
    name: '크롭 캐시미어 가디건',
    brand: '러블리',
    price: 79000,
    image: 'https://picsum.photos/400/500?random=14',
    category: '상의',
    tags: ['니트', '가디건', '봄'],
    popularity: 91
  },
  {
    id: 6,
    name: '실크 블라우스',
    brand: '채블리',
    price: 68000,
    image: 'https://picsum.photos/400/500?random=15',
    category: '상의',
    tags: ['블라우스', '봄', '여름'],
    popularity: 89
  },
  {
    id: 7,
    name: '플라워 원피스',
    brand: '러블리',
    price: 85000,
    image: 'https://picsum.photos/400/500?random=16',
    category: '원피스',
    tags: ['원피스', '봄', '여름'],
    popularity: 94
  },
  {
    id: 8,
    name: '레더 미니 스커트',
    brand: '스타일리시',
    price: 55000,
    image: 'https://picsum.photos/400/500?random=17',
    category: '하의',
    tags: ['스커트', '가을', '겨울'],
    popularity: 87
  }
])

const filteredProducts = computed(() => {
  let result = [...products.value]

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

const handleWishlist = (product) => {
  if (!user.value) {
    router.push('/auth/login')
    return
  }
  
  if (user.value.email !== 'taebaek@gmail.com') {
    return
  }

  const wishlistProduct = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image
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
.products {
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
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
  transition: transform 0.2s;
}

.wishlist-btn:hover {
  transform: scale(1.1);
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

@media (max-width: 768px) {
  .products {
    flex-direction: column;
  }

  .filters {
    width: 100%;
  }
}
</style> 