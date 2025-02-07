<template>
  <div class="search-container">
    <div class="search-input-wrapper" :class="{ active: showSuggestions }">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="상품을 검색해보세요"
        @focus="showSuggestions = true"
        @blur="handleBlur"
        @keydown="handleKeydown"
      >
      <button class="search-button" @click="handleSearch()">
        <span class="search-icon">🔍</span>
      </button>
    </div>

    <div v-if="showSuggestions" class="suggestions-container">
      <!-- Recent Searches -->
      <div v-if="recentSearches.length > 0" class="suggestion-section">
        <h3>최근 검색어</h3>
        <ul>
          <li
            v-for="(term, index) in recentSearches"
            :key="'recent-' + index"
            @mousedown.prevent="handleSearch(term)"
            class="suggestion-item"
          >
            <span class="suggestion-icon">🕒</span>
            {{ term }}
          </li>
        </ul>
      </div>

      <!-- Search Suggestions -->
      <div v-if="suggestions.length > 0" class="suggestion-section">
        <h3>검색 추천</h3>
        <ul>
          <li
            v-for="(suggestion, index) in suggestions"
            :key="'suggestion-' + index"
            @mousedown.prevent="handleSearch(suggestion)"
            class="suggestion-item"
            :class="{ active: index === selectedIndex }"
          >
            <span class="suggestion-icon">🔍</span>
            {{ suggestion }}
          </li>
        </ul>
      </div>

      <!-- Popular Searches -->
      <div v-if="!searchQuery && popularSearches.length > 0" class="suggestion-section">
        <h3>인기 검색어</h3>
        <ul class="popular-searches">
          <li
            v-for="(term, index) in popularSearches"
            :key="'popular-' + index"
            @mousedown.prevent="handleSearch(term)"
            class="popular-item"
          >
            <span class="rank">{{ index + 1 }}</span>
            {{ term }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
const { 
  searchQuery,
  recentSearches,
  popularSearches,
  suggestions,
  showSuggestions,
  selectedIndex,
  handleSearch,
  handleKeydown
} = useSearch()

const handleBlur = () => {
  // Delay hiding suggestions to allow clicking them
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}
</script>

<style scoped>
.search-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.search-input-wrapper.active {
  border-color: var(--primary-color);
}

.search-input-wrapper input {
  flex: 1;
  padding: 1rem;
  border: none;
  outline: none;
  font-size: 1rem;
  font-family: 'Noto Sans KR', sans-serif;
}

.search-button {
  padding: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}

.suggestions-container {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-top: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.suggestion-section {
  padding: 1rem;
}

.suggestion-section:not(:last-child) {
  border-bottom: 1px solid var(--border-color);
}

.suggestion-section h3 {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
}

.suggestion-item:hover,
.suggestion-item.active {
  background-color: #f8f8f8;
}

.suggestion-icon {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.popular-searches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.popular-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
}

.popular-item:hover {
  background-color: #f8f8f8;
}

.rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 0.5rem;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: bold;
}

@media (max-width: 768px) {
  .search-input-wrapper input {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .search-button {
    padding: 0.75rem;
  }

  .popular-searches {
    grid-template-columns: repeat(2, 1fr);
  }

  .suggestion-section {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .search-input-wrapper input {
    padding: 0.5rem;
  }

  .search-button {
    padding: 0.5rem;
  }

  .popular-searches {
    grid-template-columns: 1fr;
  }

  .suggestion-section h3 {
    font-size: 0.8rem;
  }

  .suggestion-item,
  .popular-item {
    font-size: 0.9rem;
    padding: 0.4rem;
  }

  .rank {
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
  }
}
</style> 