import { useSupabaseClient, useSupabaseUser } from '#imports'
import { ref, onMounted, watch } from 'vue'
import type { Database } from '../../types/database.types'

interface WishlistItem {
  id: number
  name: string
  price: number
  image: string
  message: string | null
}

interface Product {
  id: number
  name: string
  price: number
  image: string
}

export const useWishlist = () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const items = ref<WishlistItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch wishlist items from Supabase
  const fetchItems = async () => {
    if (!user.value) return

    try {
      loading.value = true
      error.value = null

      const { data, error: err } = await supabase
        .from('wishlist_items')
        .select(`
          id,
          message,
          products:product_id (
            id,
            name,
            price,
            image
          )
        `)
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })

      if (err) throw err

      items.value = (data || []).map(item => ({
        id: item.products.id,
        name: item.products.name,
        price: item.products.price,
        image: item.products.image,
        message: item.message
      }))
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Add item to wishlist
  const addItem = async (product: Product) => {
    if (!user.value) {
      error.value = '로그인이 필요합니다'
      return
    }

    try {
      loading.value = true
      error.value = null

      const { error: err } = await supabase
        .from('wishlist_items')
        .insert({
          product_id: product.id,
          user_id: user.value.id,
          message: ''
        } as Database['public']['Tables']['wishlist_items']['Insert'])

      if (err) throw err

      await fetchItems()
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Remove item from wishlist
  const removeItem = async (id: number) => {
    if (!user.value) return

    try {
      loading.value = true
      error.value = null

      const { error: err } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('product_id', id)
        .eq('user_id', user.value.id)

      if (err) throw err

      items.value = items.value.filter(item => item.id !== id)
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Update wishlist item message
  const updateMessage = async (id: number, message: string) => {
    if (!user.value) return

    try {
      loading.value = true
      error.value = null

      const { error: err } = await supabase
        .from('wishlist_items')
        .update({ message } as Database['public']['Tables']['wishlist_items']['Update'])
        .eq('product_id', id)
        .eq('user_id', user.value.id)

      if (err) throw err

      const item = items.value.find(item => item.id === id)
      if (item) {
        item.message = message
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Check if item is in wishlist
  const isInWishlist = (id: number) => {
    return items.value.some(item => item.id === id)
  }

  // Watch for user changes
  watch(user, () => {
    if (user.value) {
      fetchItems()
    } else {
      items.value = []
    }
  }, { immediate: true })

  return {
    items,
    loading,
    error,
    addItem,
    removeItem,
    updateMessage,
    isInWishlist,
    fetchItems
  }
} 