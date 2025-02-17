<template>
  <div v-if="show" class="valentine-modal" @click="close">
    <div class="valentine-box" :class="{ 'open': isOpen }">
      <div class="box-lid">
        <div class="box-bow"></div>
      </div>
      <div class="box-content">
        <div class="heart-container">
          <div class="heart"></div>
          <div class="heart"></div>
          <div class="heart"></div>
        </div>
        <div class="message">
          <h2>특별한 선물이 도착했어요! 💝</h2>
          <p>{{ message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  show: Boolean,
  message: {
    type: String,
    default: '당신을 위한 특별한 선물입니다 💕'
  }
})

const emit = defineEmits(['close'])
const isOpen = ref(false)

const close = () => {
  isOpen.value = false
  setTimeout(() => {
    emit('close')
  }, 500)
}

onMounted(() => {
  setTimeout(() => {
    isOpen.value = true
  }, 100)
})
</script>

<style scoped>
.valentine-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.valentine-box {
  position: relative;
  width: 300px;
  height: 300px;
  background-color: #ff69b4;
  border-radius: 10px;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.box-lid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background-color: #ff1493;
  border-radius: 10px 10px 0 0;
  transform-origin: top;
  transition: transform 1s ease;
}

.box-bow {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 60px;
  background-color: #ff1493;
  border-radius: 50%;
  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 30px;
    height: 60px;
    background-color: #ff1493;
    border-radius: 30px;
  }
  &::before {
    left: -20px;
    transform: rotate(-30deg);
  }
  &::after {
    right: -20px;
    transform: rotate(30deg);
  }
}

.valentine-box.open .box-lid {
  transform: rotateX(-120deg);
}

.box-content {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  border-radius: 0 0 10px 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.5s ease 0.5s;
}

.valentine-box.open .box-content {
  opacity: 1;
}

.heart-container {
  position: absolute;
  top: -50px;
  width: 100%;
  height: 100px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.heart {
  width: 20px;
  height: 20px;
  background-color: #ff1493;
  position: relative;
  transform: rotate(45deg);
  animation: float 3s infinite;
  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background-color: #ff1493;
    border-radius: 50%;
  }
  &::before {
    left: -10px;
  }
  &::after {
    top: -10px;
  }
}

.heart:nth-child(2) {
  animation-delay: 0.2s;
}

.heart:nth-child(3) {
  animation-delay: 0.4s;
}

.message {
  text-align: center;
  color: #ff1493;
}

.message h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.message p {
  font-size: 1.1rem;
}

@keyframes float {
  0%, 100% {
    transform: rotate(45deg) translateY(0);
  }
  50% {
    transform: rotate(45deg) translateY(-20px);
  }
}
</style> 