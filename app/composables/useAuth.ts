import { useSupabaseClient, useSupabaseUser } from '#imports'
import { ref } from 'vue'

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = null
      
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (err) throw err
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Register new user
  const register = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = null

      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (err) throw err
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Logout user
  const logout = async () => {
    try {
      loading.value = true
      error.value = null
      
      const { error: err } = await supabase.auth.signOut()
      if (err) throw err
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      loading.value = true
      error.value = null

      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (err) throw err
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Update password
  const updatePassword = async (password: string) => {
    try {
      loading.value = true
      error.value = null

      const { error: err } = await supabase.auth.updateUser({
        password
      })

      if (err) throw err
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    updatePassword
  }
} 