<template>
  <div class="letter-container">
    <div class="letter" :class="{ 'letter--open': isOpen, 'letter--close': !isOpen }">
      <div class="paper">
        <div class="paper-content">
          <h1>비밀 편지</h1>
          <p>애기야, 내 사랑하는 민채야 🌙</p>
          <p>오늘따라 네 생각이 더 많이 나고, 마음이 너무 무거워서 이렇게 글 남겨. 그냥 미안하다고만 하기엔 너무 부족한데, 그래도 내 진심이 전해졌으면 좋겠어.</p>
          <p>솔직히 나 부족한 거 나도 아는데, 너한테 기대기만 했던 것 같아. 넌 항상 나 이해해주고, 받아주고, 아무 말 없이 안아주는데, 나는 그만큼 해주지 못했던 게 너무 미안해. 진짜 가끔은 내가 왜 이러나 싶고, 너한테 상처 줬을까 봐 걱정돼.</p>
          <p>근데 애기야, 나 진짜 잘할게. 말로만이 아니라, 진짜 행동으로 보여줄게. 더 많이 표현하고, 더 노력하고, 더 사랑할게. 네가 내 옆에 있다는 게 얼마나 소중한지, 요즘 들어 더 많이 느끼고 있어.</p>
          <p>너 없으면 안 될 것 같아. 너 없으면 진짜 공허하고, 하루하루가 재미없을 것 같아. 그러니까 앞으로도 내 옆에 있어줘. 나도 더 좋은 남자친구가 될 테니까.</p>
          <p>사랑해, 내 애기. 그리고 항상 내 곁에 있어줘서 고마워. 💙</p>
          <p class="signature">호진이가</p>
          <span class="paper-close" @click.stop="toggleEnvelope">×</span>
        </div>
      </div>
      <div class="envelope" @click="toggleEnvelope">
        <div class="envelope-paper"></div>
        <div class="envelope-flap"></div>
        <div class="envelope-detail"></div>
        <div class="envelope__fold"></div>
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
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8e8e8;
  padding: 2rem;
}

.letter {
  margin: 50px auto;
  max-width: 350px;
  height: 450px;
  position: relative;
  overflow: visible;
  display: block;
}

.paper {
  height: 50px;
  width: 90px;
  background: #f1f0c3;
  transform: translateY(150px);
  margin: 0 auto;
  transition: transform 0.3s 0.1s ease;
  border-radius: 2px;
  position: relative;
}

.letter--open .paper {
  animation: upthenscale 0.6s forwards;
}

.letter--close .paper {
  animation: scalethendown 0.4s forwards;
}

.paper-content {
  color: #545454;
  padding: 25px;
  opacity: 0;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #e65454 #f1f0c3;
}

.letter--open .paper-content {
  animation: waitfade 1.5s forwards;
}

.envelope {
  width: 94px;
  height: 60px;
  background: #f36363;
  position: relative;
  margin: auto;
  z-index: 2;
  cursor: pointer;
  border-radius: 3px;
  transition: box-shadow 0.3s ease;
  transform: translateY(210px);
  animation: wiggle 0.3s 0.2s infinite;
}

/* Add all the keyframe animations */
@keyframes upthenscale {
  0% { transform: translateY(150px); }
  50% { transform: translateY(0); }
  60% {
    height: 100px;
    width: 90px;
    transform: translateY(0);
  }
  100% { 
    height: 400px;
    width: 100%; 
    transform: translateY(-50px);
  }
}

@keyframes scalethendown {
  0% {
    height: 400px;
    width: 100%; 
    transform: translateY(-50px);
  }
  50% {
    height: 100px;
    width: 90px;
    transform: translateY(0);
  }
  60% { transform: translateY(0); }
  100% { transform: translateY(150px); }
}

@keyframes waitfade {
  0%, 50% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes wiggle {
  0% { transform: translateY(210px) rotate(0); }
  25% { transform: translateY(210px) rotate(2deg); }
  50% { transform: translateY(210px) rotate(0deg); }
  75% { transform: translateY(210px) rotate(-2deg); }
  100% { transform: translateY(210px) rotate(0); }
}

/* Add the rest of the envelope styles */
.envelope:hover {
  animation: none;
}

.envelope:hover .envelope-paper {
  transform: translateY(-20px);
}

.envelope:hover .envelope-flap {
  transform: translateY(-45px);
}

.envelope-paper {
  height: 50px;
  width: 90px;
  background: #f1f0c3;
  transform: translateY(0);
  margin: 0 auto;
  transition: transform 0.3s 0.1s ease;
  border-radius: 2px;
  position: absolute;
  border: 2px solid transparent;
}

.envelope-flap {
  content: '';
  width: 0;
  height: 0;
  border-left: 45px solid transparent;
  border-right: 45px solid transparent;
  border-bottom: 45px solid #f36363;
  display: block;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  margin: auto;
  transform: translateY(0);
}

.envelope-detail {
  overflow: hidden;
  height: 100%;
  width: 100%;
  display: block;
  position: absolute;
  background: #f36363;
  border-top: 2px solid transparent;
}

.envelope-detail::before,
.envelope-detail::after {
  content: '';
  width: 70px;
  height: 70px;
  background: #f36363;
  display: block;
  position: absolute;
  left: 0;
  right: 0;
  margin: auto;
  transform: rotate(45deg);
  border: 4px solid #e65454;
}

.envelope-detail::before {
  top: 30px;
}

.envelope-detail::after {
  top: -45px;
}

.envelope__fold {
  height: 25px;
  width: 86px;
  background: #f36363;
  border: 4px solid #e65454;
  display: block;
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  margin: auto;
  transition: all 0.3s ease;
  border-radius: 3px;
}

.paper-close {
  position: absolute;
  right: 10px;
  top: 5px;
  display: inline-block;
  cursor: pointer;
  font-size: 24px;
  color: #e65454;
}

/* Add visibility states */
.letter--open .envelope-paper,
.letter--close .envelope-paper {
  visibility: hidden;
}

.letter--open .envelope-detail::after {
  visibility: hidden;
}

.letter--open .envelope-flap {
  transform: translateY(-45px);
}

.letter--open .envelope-detail {
  border-top: 2px solid #e25b5b;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .letter {
    max-width: 280px;
  }
  
  .paper-content {
    padding: 15px;
  }
  
  .paper-content h1 {
    font-size: 1.2rem;
  }
  
  .paper-content p {
    font-size: 0.9rem;
  }
}

/* Custom scrollbar for webkit browsers */
.paper-content::-webkit-scrollbar {
  width: 6px;
}

.paper-content::-webkit-scrollbar-track {
  background: #f1f0c3;
  border-radius: 3px;
}

.paper-content::-webkit-scrollbar-thumb {
  background: #e65454;
  border-radius: 3px;
}
</style> 