<template>
  <div class="photography">
    <div class="hero-section">
      <h1>포토그래피</h1>
      <p>나의 시선으로 담아낸 순간들</p>
    </div>

    <!-- Add upload section -->
    <div class="upload-section">
      <div v-if="!user" class="login-message">
        <p>사진을 업로드하려면 <NuxtLink to="/auth/login">로그인</NuxtLink>이 필요합니다.</p>
      </div>
      <div v-else>
        <input
          type="file"
          ref="fileInput"
          @change="handleFileUpload"
          accept="image/jpeg,image/png"
          class="file-input"
          multiple
        />
        <button 
          @click="triggerFileInput" 
          class="upload-btn"
          :disabled="isUploading"
        >
          {{ isUploading ? `업로드 중... (${uploadProgress}%)` : '사진 업로드' }}
        </button>
      </div>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>

    <!-- Add upload progress section -->
    <div v-if="uploadingFiles.length > 0" class="upload-progress">
      <div v-for="file in uploadingFiles" :key="file.name" class="upload-item">
        <span>{{ file.name }}</span>
        <div class="progress-bar">
          <div :style="{ width: `${file.progress}%` }" class="progress"></div>
        </div>
      </div>
    </div>

    <!-- Preview section -->
    <div v-if="previewUrl" class="preview-section">
      <h2>미리보기</h2>
      <div class="preview-container">
        <img :src="previewUrl" alt="Preview" class="preview-image" />
        <button @click="clearPreview" class="clear-btn">취소</button>
      </div>
    </div>

    <div class="portfolio-grid">
      <div v-for="photo in photos" :key="photo.id" class="portfolio-item" @click="openModal(photo)">
        <img :src="photo.url" :alt="photo.name">
      </div>
    </div>

    <!-- Updated modal with animation -->
    <Transition name="fade">
      <div v-if="selectedPhoto" class="modal" @click="closeModal">
        <Transition name="zoom">
          <div v-if="selectedPhoto" class="modal-content" @click.stop>
            <img :src="selectedPhoto.url" :alt="selectedPhoto.name" class="modal-image">
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const photos = ref([])
const fileInput = ref(null)
const previewUrl = ref(null)
const errorMessage = ref('')
const isUploading = ref(false)
const uploadingFiles = ref([])
const uploadProgress = ref(0)
const selectedPhoto = ref(null)

// Fetch photos from Supabase storage
const fetchPhotos = async () => {
  try {
    const { data: files, error } = await supabase
      .storage
      .from('photography')
      .list()

    if (error) throw error

    photos.value = await Promise.all(
      files.map(async (file) => {
        const { data: { publicUrl } } = supabase
          .storage
          .from('photography')
          .getPublicUrl(file.name)

        return {
          id: file.name,
          name: file.name,
          url: publicUrl
        }
      })
    )
  } catch (error) {
    console.error('Error fetching photos:', error)
    errorMessage.value = '사진을 불러오는데 실패했습니다.'
  }
}

const triggerFileInput = () => {
  if (!user.value) {
    errorMessage.value = '사진을 업로드하려면 로그인이 필요합니다.'
    return
  }
  fileInput.value.click()
}

const handleFileUpload = async (event) => {
  if (!user.value) {
    errorMessage.value = '사진을 업로드하려면 로그인이 필요합니다.'
    return
  }

  const files = Array.from(event.target.files || [])
  if (files.length === 0) return

  errorMessage.value = ''
  isUploading.value = true
  uploadingFiles.value = files.map(file => ({
    name: file.name,
    progress: 0
  }))

  try {
    const uploadPromises = files.map(async (file, index) => {
      // Validate file
      if (!file.type.match('image/(jpeg|png)')) {
        throw new Error(`${file.name}: JPG 또는 PNG 파일만 업로드 가능합니다.`)
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`${file.name}: 파일 크기는 5MB 이하여야 합니다.`)
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${index}.${fileExt}`

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('photography')
        .upload(fileName, file, {
          onUploadProgress: (progress) => {
            // Update individual file progress
            uploadingFiles.value[index].progress = Math.round(
              (progress.loaded / progress.total) * 100
            )
            // Update overall progress
            const totalProgress = uploadingFiles.value.reduce(
              (sum, file) => sum + file.progress, 
              0
            )
            uploadProgress.value = Math.round(
              totalProgress / uploadingFiles.value.length
            )
          }
        })

      if (uploadError) throw uploadError
    })

    await Promise.all(uploadPromises)
    await fetchPhotos()
    clearPreview()
    
    // Show success message
    errorMessage.value = '모든 사진이 성공적으로 업로드되었습니다.'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)

  } catch (error) {
    console.error('Upload error:', error)
    errorMessage.value = error.message
  } finally {
    isUploading.value = false
    uploadingFiles.value = []
    uploadProgress.value = 0
  }
}

// Delete photo from Supabase storage
const deletePhoto = async (photoName) => {
  try {
    const { error } = await supabase
      .storage
      .from('photography')
      .remove([photoName])

    if (error) throw error

    // Refresh photos list
    await fetchPhotos()
  } catch (error) {
    console.error('Delete error:', error)
    errorMessage.value = '삭제 중 오류가 발생했습니다.'
  }
}

const clearPreview = () => {
  previewUrl.value = null
  fileInput.value.value = '' // Reset file input
}

// Add modal functions
const openModal = (photo) => {
  selectedPhoto.value = photo
  document.body.style.overflow = 'hidden' // Prevent scrolling when modal is open
}

const closeModal = () => {
  selectedPhoto.value = null
  document.body.style.overflow = '' // Restore scrolling
}

// Add keyboard event listener for ESC key
onMounted(() => {
  fetchPhotos()
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selectedPhoto.value) {
      closeModal()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selectedPhoto.value) {
      closeModal()
    }
  })
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<style scoped>
.photography {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.hero-section {
  text-align: center;
  margin-bottom: 3rem;
}

.hero-section h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero-section p {
  color: #666;
  font-size: 1.2rem;
}

.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  padding: 1rem;
}

.portfolio-item {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: white;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  aspect-ratio: 3/2;
}

.portfolio-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.portfolio-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background-color: #f8f8f8;
}

.upload-section {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background-color: #f8f8f8;
  border-radius: 8px;
}

.file-input {
  display: none;
}

.upload-btn {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
  min-width: 150px;
}

.upload-btn:hover {
  background-color: #e64547;
}

.error-message {
  color: #ff4e4e;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.preview-section {
  margin-bottom: 3rem;
}

.preview-section h2 {
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.preview-container {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.preview-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.clear-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 2rem;
  }

  .hero-section p {
    font-size: 1rem;
  }

  .portfolio-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .upload-section {
    padding: 1.5rem;
  }

  .upload-btn {
    padding: 0.8rem 1.5rem;
  }

  .preview-section h2 {
    font-size: 1.2rem;
  }

  .modal {
    padding: 1rem;
  }

  .modal-close {
    top: -1.5rem;
    right: -1rem;
  }
}

@media (max-width: 480px) {
  .photography {
    padding: 1rem 0.5rem;
  }

  .hero-section {
    margin-bottom: 2rem;
  }

  .hero-section h1 {
    font-size: 1.5rem;
  }

  .upload-section {
    padding: 1rem;
  }

  .preview-container {
    margin: 0 0.5rem;
  }

  .portfolio-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .portfolio-item img {
    height: 150px;
  }

  .photo-description {
    padding: 0.8rem;
  }
}

.login-message {
  text-align: center;
  padding: 1rem;
}

.login-message a {
  color: var(--primary-color);
  text-decoration: underline;
}

/* Add these new styles */
.upload-progress {
  max-width: 600px;
  margin: 1rem auto;
  padding: 1rem;
  background-color: #f8f8f8;
  border-radius: 8px;
}

.upload-item {
  margin-bottom: 1rem;
}

.upload-item span {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: #eee;
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.3s ease;
}

/* Update modal styles with animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.3s ease;
}

.zoom-enter-from,
.zoom-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(5px);
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 8px;
  overflow: hidden;
}

.modal-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  display: block;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.7);
}

/* Remove photo description styles that are no longer needed */
.photo-description {
  display: none;
}
</style> 