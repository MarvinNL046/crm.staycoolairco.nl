import { supabase } from '@/lib/supabase'

export class Product {
  static async create(data) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: product, error } = await supabase
        .from('products')
        .insert({
          tenant_id: user.id,
          created_by: user.id,
          ...data
        })
        .select()
        .single()

      if (error) throw error
      return product
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  static async update(id, data) {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return product
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  static async delete(id) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  static async getById(id) {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select()
        .eq('id', id)
        .single()

      if (error) throw error
      return product
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  }

  static async getAll(filters = {}) {
    try {
      let query = supabase
        .from('products')
        .select()
        .order('name', { ascending: true })

      // Apply filters
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }

      const { data: products, error } = await query

      if (error) throw error
      return products
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  static async search(searchTerm) {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select()
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(10)

      if (error) throw error
      return products
    } catch (error) {
      console.error('Error searching products:', error)
      throw error
    }
  }
}