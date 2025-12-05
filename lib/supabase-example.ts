// Supabase Usage Examples
import { supabase } from './supabase'

// Example: Authentication functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Example: Database operations
export const getPosts = async () => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:author_id (
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const createPost = async (title: string, content: string) => {
  const { data, error } = await supabase
    .from('posts')
    .insert([
      {
        title,
        content,
        author_id: (await supabase.auth.getUser()).data.user?.id
      }
    ])
    .select()

  return { data, error }
}

export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { data, error }
}

// Example: Real-time subscription
export const subscribeToPosts = (callback: (payload: any) => void) => {
  return supabase
    .channel('posts')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, callback)
    .subscribe()
}

// Example: Storage operations
export const uploadAvatar = async (file: File) => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'Not authenticated' }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Math.random()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file)

  if (error) return { data: null, error }

  // Update user profile with avatar URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  return { data: publicUrl, error: null }
}





