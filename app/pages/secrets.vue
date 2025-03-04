<template>
  <div class="letter-container">
    <div class="envelope" :class="{ 'active': isOpen }" @click="toggleEnvelope">
      <div class="back"></div>
      <div class="letter">
        <div class="letter-content">
          <h1>비밀 편지</h1>
          <p>애기야, 내 사랑하는 민채야 🌙</p>
          <p>오늘따라 네 생각이 더 많이 나고, 마음이 너무 무거워서 이렇게 글 남겨. 그냥 미안하다고만 하기엔 너무 부족한데, 그래도 내 진심이 전해졌으면 좋겠어.</p>
          <p>솔직히 나 부족한 거 나도 아는데, 너한테 기대기만 했던 것 같아. 넌 항상 나 이해해주고, 받아주고, 아무 말 없이 안아주는데, 나는 그만큼 해주지 못했던 게 너무 미안해. 진짜 가끔은 내가 왜 이러나 싶고, 너한테 상처 줬을까 봐 걱정돼.</p>
          <p>근데 애기야, 나 진짜 잘할게. 말로만이 아니라, 진짜 행동으로 보여줄게. 더 많이 표현하고, 더 노력하고, 더 사랑할게. 네가 내 옆에 있다는 게 얼마나 소중한지, 요즘 들어 더 많이 느끼고 있어.</p>
          <p>너 없으면 안 될 것 같아. 너 없으면 진짜 공허하고, 하루하루가 재미없을 것 같아. 그러니까 앞으로도 내 옆에 있어줘. 나도 더 좋은 남자친구가 될 테니까.</p>
          <p>사랑해, 내 애기. 그리고 항상 내 곁에 있어줘서 고마워. 💙</p>
          <p class="signature">호진이가</p>
        </div>
      </div>
      <div class="front">
        <div class="left"></div>
        <div class="right"></div>
        <div class="top"></div>
        <div class="bottom"></div>
      </div>
      <div class="hearts">
        <div class="heart"></div>
        <div class="heart"></div>
        <div class="heart"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
const isOpen = ref(false)

const toggleEnvelope = () => {
  isOpen.value = !isOpen.value
}

onMounted(() => {
  setTimeout(() => {
    isOpen.value = true
  }, 1000)
})
</script>

<style scoped>
.letter-container {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8e8e8;
  padding: 2rem;
}

.envelope {
  position: relative;
  width: 350px;
  height: 250px;
  cursor: pointer;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.back {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #ff9999;
  border-radius: 5px;
  box-shadow: 0 2px 20px rgba(0,0,0,0.2);
}

.front {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.front .left,
.front .right,
.front .top,
.front .bottom {
  position: absolute;
  background: #ff8080;
  transition: transform 0.4s ease 0.4s;
}

.front .left,
.front .right {
  width: 0;
  height: 0;
  border-style: solid;
}

.front .left {
  top: 0;
  left: 0;
  border-width: 125px 0 125px 175px;
  border-color: transparent transparent transparent #ff8080;
  transform-origin: left;
}

.front .right {
  top: 0;
  right: 0;
  border-width: 125px 175px 125px 0;
  border-color: transparent #ff8080 transparent transparent;
  transform-origin: right;
}

.front .top {
  top: 0;
  left: 0;
  width: 100%;
  height: 0;
  border-width: 175px 175px 0 175px;
  border-style: solid;
  border-color: #ff6666 transparent transparent transparent;
  transform-origin: top;
  transition: transform 0.6s ease;
  z-index: 2;
}

.front .bottom {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50px;
  background: #ff8080;
  border-radius: 0 0 5px 5px;
}

.letter {
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 20px);
  height: calc(100% - 10px);
  background: white;
  border-radius: 3px;
  transition: all 0.6s ease;
  z-index: 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.letter-content {
  text-align: center;
  opacity: 0;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
  transform: scale(0.95);
  transition: all 0.4s ease 0.6s;
}

/* Add custom scrollbar styling */
.letter-content::-webkit-scrollbar {
  width: 6px;
}

.letter-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.letter-content::-webkit-scrollbar-thumb {
  background: #ff9999;
  border-radius: 3px;
}

.letter-content::-webkit-scrollbar-thumb:hover {
  background: #ff8080;
}

/* Animation states */
.envelope.active .front .top {
  transform: rotateX(180deg);
}

.envelope.active .front .left {
  transform: rotateY(-60deg);
}

.envelope.active .front .right {
  transform: rotateY(60deg);
}

.envelope.active .letter {
  transform: translateX(-50%) translateY(-100px);
  height: 400px; /* Make the letter taller when opened */
  z-index: 2;
}

.envelope.active .letter-content {
  opacity: 1;
  transform: scale(1);
}

.letter-content h1 {
  margin-bottom: 2rem;
}

.letter-content p {
  margin-bottom: 1.2rem;
  line-height: 1.6;
}

.signature {
  font-style: italic;
  margin-top: 1.5rem;
  color: #ff4e50;
}

.hearts {
  position: absolute;
  width: 100%;
  height: 100px;
  top: -120px;
  display: flex;
  justify-content: center;
  gap: 20px;
  opacity: 0;
  transition: opacity 0.5s ease;
  z-index: 1;
}

.envelope.active .hearts {
  opacity: 1;
}

.heart {
  width: 20px;
  height: 20px;
  background: #ff4e50;
  position: relative;
  transform: rotate(45deg);
  animation: float 3s infinite;
}

.heart::before,
.heart::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: #ff4e50;
  border-radius: 50%;
}

.heart::before {
  left: -10px;
}

.heart::after {
  top: -10px;
}

.heart:nth-child(2) {
  animation-delay: 0.2s;
}

.heart:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes float {
  0%, 100% {
    transform: rotate(45deg) translateY(0);
  }
  50% {
    transform: rotate(45deg) translateY(-20px);
  }
}

@media (max-width: 480px) {
  .envelope {
    width: 280px;
    height: 200px;
  }

  .front .left {
    border-width: 100px 0 100px 140px;
  }

  .front .right {
    border-width: 100px 140px 100px 0;
  }

  .front .top {
    border-width: 140px 140px 0 140px;
  }

  .letter {
    padding: 15px;
  }

  .letter-content {
    padding: 15px;
  }

  .letter-content h1 {
    font-size: 1.2rem;
  }

  .letter-content p {
    font-size: 0.9rem;
  }

  .envelope.active .letter {
    height: 350px;
    transform: translateX(-50%) translateY(-80px);
  }
}
</style> 