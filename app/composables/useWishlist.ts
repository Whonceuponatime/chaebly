import { useState } from '#app'

interface WishlistItem {
  id: number
  name: string
  price: number
  image: string
  message: string
}

interface Product {
  id: number
  name: string
  price: number
  image: string
}

export const useWishlist = () => {
  const items = useState<WishlistItem[]>('wishlist-items', () => [])
  
  const addItem = (product: Product) => {
    const exists = items.value.some(item => item.id === product.id)
    if (!exists) {
      items.value.push({
        ...product,
        message: ''
      })
    }
  }

  const removeItem = (id: number) => {
    items.value = items.value.filter(item => item.id !== id)
  }

  const updateMessage = (id: number, message: string) => {
    const item = items.value.find(item => item.id === id)
    if (item) {
      item.message = message
    }
  }

  const isInWishlist = (id: number) => {
    return items.value.some(item => item.id === id)
  }

  return {
    items,
    addItem,
    removeItem,
    updateMessage,
    isInWishlist
  }
} 