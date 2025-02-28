
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  url: string;
  product_name: string | null;
  product_line: string | null;
  source: string | null;
  in_stock: boolean;
  last_checked: string;
  created_at: string;
}

export const ProductService = {
  async addProductLink(url: string): Promise<{ success: boolean; error?: string; product?: Product }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .upsert(
          { url },
          { onConflict: 'url', ignoreDuplicates: false }
        )
        .select('*')
        .single();

      if (error) throw error;

      // Trigger the check stock function
      await this.checkStock(url);
      
      return { success: true, product: data as Product };
    } catch (error: any) {
      console.error('Error adding product link:', error);
      return { success: false, error: error.message };
    }
  },

  async checkStock(url: string): Promise<boolean> {
    try {
      // Call the edge function to check stock
      const { data, error } = await supabase.functions.invoke('check-stock', {
        body: { url },
      });

      if (error) throw error;
      
      return data.inStock;
    } catch (error) {
      console.error('Error checking stock:', error);
      return false;
    }
  },

  async getProducts(limit = 30): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('last_checked', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data as Product[];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }
};
