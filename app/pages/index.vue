<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()
const colors = ['#f87171', '#fb923c', '#fbbf24', '#facc15', '#a3e635', '#4ade80', '#34d399', '#2dd4bf', '#22d3ee', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185']
const color = useState('color', () => colors[Math.floor(Math.random() * colors.length)])
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="hero-content">
        <h1>트렌디한 패션의 시작</h1>
        <p>당신만의 스타일을 찾아보세요</p>
      </div>
    </section>

    <section class="featured-products">
      <h2>인기 상품</h2>
      <div class="product-grid">
        <div v-for="i in 8" :key="i" class="product-card">
          <div class="product-image">
            <img :src="'https://picsum.photos/400/500?random=' + i" alt="상품 이미지" />
          </div>
          <div class="product-info">
            <h3>트렌디한 상품 {{ i }}</h3>
            <p class="price">{{ (Math.random() * 50000 + 10000).toFixed(0) }}원</p>
            <div class="tags">
              <span>#트렌디</span>
              <span>#신상</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="categories">
      <h2>카테고리</h2>
      <div class="category-grid">
        <div v-for="category in ['상의', '하의', '원피스', '아우터']" :key="category" class="category-card">
          <h3>{{ category }}</h3>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  height: 400px;
  background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
              url('https://picsum.photos/1200/400') center/cover;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  margin-bottom: 2rem;
}

.hero-content h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.featured-products, .categories {
  padding: 2rem 1rem;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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
}

.tags span {
  background-color: #f0f0f0;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.category-card {
  background-color: #f8f8f8;
  padding: 2rem;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.category-card:hover {
  background-color: #f0f0f0;
}
</style>
