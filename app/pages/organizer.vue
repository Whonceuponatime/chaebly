<template>
  <div class="organizer">
    <!-- Side Navigation -->
    <div class="side-nav">
      <div class="nav-section">
        <NuxtLink to="/photography" class="nav-link">
          <i class="fas fa-camera"></i>
          <span>포토그래피</span>
        </NuxtLink>
        <button @click="navigateToRoot" class="nav-link">
          <i class="fas fa-home"></i>
          <span>내 드라이브</span>
        </button>
      </div>

      <!-- Albums Section -->
      <div class="albums-section">
        <h3>앨범</h3>
        <div 
          v-for="album in albums" 
          :key="album.id"
          class="album-item"
          @click="openAlbum(album)"
        >
          <i class="fas fa-images"></i>
          <span>{{ album.name }}</span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="drive-header">
        <div class="drive-toolbar">
          <button @click="openNewAlbumDialog" class="new-btn primary">
            <i class="fas fa-folder-plus"></i>
            새 앨범
          </button>
        </div>
      </div>

      <div class="drive-content">
        <!-- Album Grid -->
        <div class="album-grid">
          <div 
            v-for="album in currentAlbums" 
            :key="album.id"
            class="album-card"
            @click="openAlbum(album)"
          >
            <div class="album-preview">
              <i class="fas fa-images"></i>
            </div>
            <div class="album-info">
              <h4>{{ album.name }}</h4>
              <p>{{ album.photo_count || 0 }} 장의 사진</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Album Dialog -->
    <div v-if="showNewAlbumDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <h3>새 앨범</h3>
        <input 
          v-model="newAlbumName" 
          type="text" 
          placeholder="앨범 이름"
          @keyup.enter="createAlbum"
        >
        <div class="dialog-buttons">
          <button @click="closeDialog">취소</button>
          <button 
            class="primary" 
            @click="createAlbum"
            :disabled="!newAlbumName.trim()"
          >
            만들기
          </button>
        </div>
      </div>
    </div>

    <!-- Album Content Dialog -->
    <div v-if="showAlbumDialog" class="dialog-overlay" @click="closeAlbumDialog">
      <div class="dialog album-dialog" @click.stop>
        <div class="album-header">
          <h3>{{ selectedAlbum?.name }}</h3>
          <button @click="toggleEditMode" class="edit-btn">
            <i :class="isEditing ? 'fas fa-check' : 'fas fa-edit'"></i>
            {{ isEditing ? '완료' : '편집' }}
          </button>
        </div>

        <!-- Album Photos Grid (similar to photography page) -->
        <div class="album-content">
          <div v-if="!isEditing" class="portfolio-grid">
            <div 
              v-for="photo in albumPhotos" 
              :key="photo.path" 
              class="portfolio-item"
              @click="openPhotoModal(photo)"
            >
              <img :src="photo.url" :alt="photo.name">
            </div>
          </div>

          <!-- Edit Mode UI -->
          <div v-else>
            <!-- Current Album Photos -->
            <div class="edit-section">
              <h4>앨범 사진 ({{ albumPhotos.length }}장)</h4>
              <div class="portfolio-grid">
                <div 
                  v-for="photo in albumPhotos" 
                  :key="photo.path"
                  class="portfolio-item"
                >
                  <img :src="photo.url" :alt="photo.name">
                  <button @click="removeFromAlbum(photo)" class="remove-btn" title="사진 제거">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Available Photos -->
            <div class="edit-section">
              <h4>추가 가능한 사진 ({{ availablePhotos.length }}장)</h4>
              <div class="portfolio-grid">
                <div 
                  v-for="photo in availablePhotos" 
                  :key="photo.id"
                  class="portfolio-item"
                >
                  <img :src="photo.url" :alt="photo.name">
                  <button @click="addToAlbum(photo)" class="add-btn" title="앨범에 추가">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Photo Modal -->
        <Transition name="fade">
          <div v-if="selectedPhoto" class="modal" @click="closePhotoModal">
            <div class="modal-content" @click.stop>
              <img :src="selectedPhoto.url" :alt="selectedPhoto.name" class="modal-image">
              <button class="modal-close" @click="closePhotoModal">&times;</button>
            </div>
          </div>
        </Transition>

        <div class="dialog-buttons">
          <button @click="closeAlbumDialog">닫기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

// State
const showNewAlbumDialog = ref(false)
const newAlbumName = ref('')
const albums = ref([])
const currentAlbums = ref([])
const showAlbumDialog = ref(false)
const selectedAlbum = ref(null)
const albumPhotos = ref([])
const availablePhotos = ref([])
const isEditing = ref(false)
const selectedPhoto = ref(null)

// Fetch albums with photo count
const fetchAlbums = async () => {
  try {
    // First get all albums
    const { data: albumsData, error: albumsError } = await supabase
      .from('albums')
      .select('id, name, created_at')
      .eq('user_id', user.value?.id)
      .order('created_at', { ascending: false })

    if (albumsError) throw albumsError

    // Then get photo counts for each album
    const albumsWithCounts = await Promise.all(
      (albumsData || []).map(async (album) => {
        const { count, error: countError } = await supabase
          .from('album_photos')
          .select('id', { count: 'exact' })
          .eq('album_id', album.id)

        if (countError) throw countError

        return {
          ...album,
          photo_count: count
        }
      })
    )

    albums.value = albumsWithCounts
    currentAlbums.value = albumsWithCounts
  } catch (error) {
    console.error('Error fetching albums:', error)
  }
}

// Fetch photos for an album
const fetchAlbumPhotos = async (albumId) => {
  try {
    const { data: photoRefs, error } = await supabase
      .from('album_photos')
      .select('photo_path')
      .eq('album_id', albumId)

    if (error) throw error

    // Get the actual photos from storage
    const photos = await Promise.all(
      photoRefs.map(async (ref) => {
        const { data: { publicUrl } } = supabase
          .storage
          .from('photography')
          .getPublicUrl(ref.photo_path)

        return {
          path: ref.photo_path,
          url: publicUrl,
          name: ref.photo_path
        }
      })
    )

    albumPhotos.value = photos
  } catch (error) {
    console.error('Error fetching album photos:', error)
  }
}

// Fetch available photos
const fetchAvailablePhotos = async () => {
  try {
    const { data: files, error } = await supabase
      .storage
      .from('photography')
      .list()

    if (error) throw error

    const allPhotos = await Promise.all(
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

    // Filter out photos that are already in the album
    availablePhotos.value = allPhotos.filter(
      photo => !albumPhotos.value.some(albumPhoto => albumPhoto.path === photo.id)
    )
  } catch (error) {
    console.error('Error fetching available photos:', error)
  }
}

// UI Controls
const openNewAlbumDialog = () => {
  showNewAlbumDialog.value = true
}

const closeDialog = () => {
  showNewAlbumDialog.value = false
  newAlbumName.value = ''
}

// Create new album
const createAlbum = async () => {
  if (!newAlbumName.value.trim()) return

  try {
    const { data, error } = await supabase
      .from('albums')
      .insert({
        name: newAlbumName.value,
        user_id: user.value.id
      })
      .select()
      .single()

    if (error) throw error
    
    await fetchAlbums()
    closeDialog()
  } catch (error) {
    console.error('Error creating album:', error)
  }
}

// Album operations
const openAlbum = async (album) => {
  selectedAlbum.value = album
  showAlbumDialog.value = true
  await fetchAlbumPhotos(album.id)
  await fetchAvailablePhotos()
}

const closeAlbumDialog = () => {
  showAlbumDialog.value = false
  selectedAlbum.value = null
  albumPhotos.value = []
  availablePhotos.value = []
  isEditing.value = false
  selectedPhoto.value = null
}

const addToAlbum = async (photo) => {
  try {
    const { error } = await supabase
      .from('album_photos')
      .insert({
        album_id: selectedAlbum.value.id,
        photo_path: photo.id
      })

    if (error) throw error

    // Refresh photos
    await fetchAlbumPhotos(selectedAlbum.value.id)
    await fetchAvailablePhotos()
    await fetchAlbums() // Update photo count
  } catch (error) {
    console.error('Error adding photo to album:', error)
  }
}

const removeFromAlbum = async (photo) => {
  try {
    const { error } = await supabase
      .from('album_photos')
      .delete()
      .eq('album_id', selectedAlbum.value.id)
      .eq('photo_path', photo.path)

    if (error) throw error

    // Refresh photos
    await fetchAlbumPhotos(selectedAlbum.value.id)
    await fetchAvailablePhotos()
    await fetchAlbums() // Update photo count
  } catch (error) {
    console.error('Error removing photo from album:', error)
  }
}

const toggleEditMode = () => {
  isEditing.value = !isEditing.value
}

const openPhotoModal = (photo) => {
  if (!isEditing.value) {
    selectedPhoto.value = photo
    document.body.style.overflow = 'hidden'
  }
}

const closePhotoModal = () => {
  selectedPhoto.value = null
  document.body.style.overflow = ''
}

// Initial load
onMounted(() => {
  if (user.value) {
    fetchAlbums()
  }
  // Add keyboard event listener for ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selectedPhoto.value) {
      closePhotoModal()
    }
  })
})

// Watch for user changes
watch(user, (newUser) => {
  if (newUser) {
    fetchAlbums()
  } else {
    albums.value = []
    currentAlbums.value = []
  }
})

// Add to onUnmounted
onUnmounted(() => {
  window.removeEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selectedPhoto.value) {
      closePhotoModal()
    }
  })
})
</script>

<style scoped>
.organizer {
  display: flex;
  height: 100vh;
  background: #f8f9fa;
}

.side-nav {
  width: 260px;
  background: white;
  border-right: 1px solid #e0e0e0;
  padding: 1rem;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 24px;
  color: #5f6368;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #e8f0fe;
  color: #1a73e8;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.drive-header {
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.drive-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.new-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.primary {
  background: #1a73e8;
  color: white;
}

.primary:hover {
  background: #1557b0;
}

.drive-content {
  flex: 1;
  padding: 1rem;
  overflow: auto;
}

.albums-section {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.albums-section h3 {
  font-size: 0.9rem;
  color: #5f6368;
  margin-bottom: 0.5rem;
  padding: 0 1rem;
}

.album-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 0 20px 20px 0;
}

.album-item:hover {
  background: #e8f0fe;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.album-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.album-card:hover {
  transform: translateY(-2px);
}

.album-preview {
  height: 150px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.album-preview i {
  font-size: 3rem;
  color: #1a73e8;
}

.album-info {
  padding: 1rem;
}

.album-info h4 {
  margin: 0;
  font-size: 1rem;
}

.album-info p {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: #5f6368;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
}

.dialog h3 {
  margin: 0 0 1rem;
}

.dialog input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.dialog-buttons button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.dialog-buttons button.primary {
  background: #1a73e8;
  color: white;
}

.dialog-buttons button.primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.create-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 0.5rem;
  margin-top: 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  width: 100%;
  cursor: pointer;
  border-radius: 4px;
}

.menu-item:hover {
  background: #f5f5f5;
}

.album-dialog {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.album-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #1a73e8;
  color: white;
  cursor: pointer;
}

.album-content {
  padding: 1rem;
}

.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.portfolio-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.portfolio-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-section {
  margin: 2rem 0;
}

.edit-section h4 {
  color: #5f6368;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.remove-btn, .add-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn {
  background: rgba(244, 67, 54, 0.8);
}

.add-btn {
  background: rgba(76, 175, 80, 0.8);
}

.remove-btn:hover {
  background: rgba(244, 67, 54, 1);
}

.add-btn:hover {
  background: rgba(76, 175, 80, 1);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.modal-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 