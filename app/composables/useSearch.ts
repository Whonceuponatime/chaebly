import { ref, computed } from 'vue'

// Sample product data - in a real app, this would come from your backend
const sampleProducts = [
  {
    id: 1,
    name: '캐시미어 니트 스웨터',
    brand: '채블리',
    price: 89000,
    category: '상의',
    tags: ['니트', '겨울', '데일리']
  },
  {
    id: 2,
    name: '하이웨스트 와이드 데님',
    brand: '러블리',
    price: 45000,
    category: '하의',
    tags: ['데님', '데일리']
  },
  {
    id: 3,
    name: '플리츠 미디 스커트',
    brand: '스타일리시',
    price: 35000,
    category: '하의',
    tags: ['스커트', '봄']
  },
  {
    id: 4,
    name: '오버사이즈 트렌치코트',
    brand: '채블리',
    price: 129000,
    category: '아우터',
    tags: ['코트', '봄', '가을']
  },
  {
    id: 5,
    name: '크롭 캐시미어 가디건',
    brand: '러블리',
    price: 79000,
    category: '상의',
    tags: ['니트', '가디건', '봄']
  }
]

export const useSearch = () => {
  const searchQuery = ref('')
  const recentSearches = ref<string[]>([])
  const showSuggestions = ref(false)
  const selectedIndex = ref(-1)

  // Popular search terms
  const popularSearches = [
    '니트',
    '원피스',
    '데님',
    '가디건',
    '코트'
  ]

  // Get suggestions based on search query
  const suggestions = computed(() => {
    if (!searchQuery.value) return []

    const query = searchQuery.value.toLowerCase()
    const results = new Set<string>()

    // Search in product names
    sampleProducts.forEach(product => {
      if (product.name.toLowerCase().includes(query)) {
        results.add(product.name)
      }
    })

    // Search in brands
    sampleProducts.forEach(product => {
      if (product.brand.toLowerCase().includes(query)) {
        results.add(product.brand)
      }
    })

    // Search in tags
    sampleProducts.forEach(product => {
      product.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
          results.add(`#${tag}`)
        }
      })
    })

    // Search in categories
    sampleProducts.forEach(product => {
      if (product.category.toLowerCase().includes(query)) {
        results.add(product.category)
      }
    })

    return Array.from(results).slice(0, 10)
  })

  // Add search term to recent searches
  const addToRecent = (term: string) => {
    if (!term) return
    recentSearches.value = [
      term,
      ...recentSearches.value.filter(item => item !== term)
    ].slice(0, 5)
  }

  // Handle search submission
  const handleSearch = (term?: string) => {
    const searchTerm = term || searchQuery.value
    if (!searchTerm) return

    addToRecent(searchTerm)
    // Here you would typically navigate to search results page
    // or filter products based on the search term
    navigateTo(`/products?search=${encodeURIComponent(searchTerm)}`)
    
    searchQuery.value = searchTerm
    showSuggestions.value = false
  }

  // Handle keyboard navigation
  const handleKeydown = (e: KeyboardEvent) => {
    if (!showSuggestions.value) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex.value >= 0) {
          handleSearch(suggestions.value[selectedIndex.value])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        showSuggestions.value = false
        break
    }
  }

  return {
    searchQuery,
    recentSearches,
    popularSearches,
    suggestions,
    showSuggestions,
    selectedIndex,
    handleSearch,
    handleKeydown,
    addToRecent
  }
} 