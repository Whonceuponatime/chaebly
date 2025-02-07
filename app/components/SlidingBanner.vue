<template>
  <div class="banner-container">
    <div class="banner-wrapper" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
      <div v-for="(image, index) in bannerImages" :key="index" class="banner-slide">
        <img :src="image" :alt="`배너 이미지 ${index + 1}`">
      </div>
    </div>
    
    <div class="banner-controls">
      <div class="dots">
        <button 
          v-for="(_, index) in bannerImages" 
          :key="index"
          class="dot"
          :class="{ active: currentSlide === index }"
          @click="setSlide(index)"
        ></button>
      </div>
    </div>
  </div>
</template>

<script setup>
const bannerImages = [
  '/images/banner_image_1738301193274699.png',
  '/images/banner_image_1738802839576161.jpg',
  '/images/banner_image_1693188661946844.png'
]

const currentSlide = ref(0)
const autoSlideInterval = ref(null)

const setSlide = (index) => {
  currentSlide.value = index
}

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % bannerImages.length
}

// Auto slide
onMounted(() => {
  autoSlideInterval.value = setInterval(nextSlide, 5000)
})

onUnmounted(() => {
  if (autoSlideInterval.value) {
    clearInterval(autoSlideInterval.value)
  }
})
</script>

<style scoped>
.banner-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  margin-bottom: 2rem;
}

.banner-wrapper {
  display: flex;
  transition: transform 0.5s ease-in-out;
}

.banner-slide {
  min-width: 100%;
  height: 400px;
}

.banner-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-controls {
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
}

.dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  border: none;
  cursor: pointer;
  padding: 0;
}

.dot.active {
  background-color: white;
}

@media (max-width: 768px) {
  .banner-slide {
    height: 300px;
  }
}

@media (max-width: 480px) {
  .banner-slide {
    height: 200px;
  }

  .dot {
    width: 8px;
    height: 8px;
  }

  .dots {
    gap: 0.3rem;
  }
}
</style> 