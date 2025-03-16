
export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author_id: string;
  category: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  featured: boolean;
  published: boolean;
  featured_image?: string;
  additional_images?: string[];
}

export interface ArticleFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  featured: boolean;
  published: boolean;
  featured_image?: string;
  additional_images?: string[];
}

export type ArticleCreate = Omit<Article, 'id' | 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type ArticleUpdate = Partial<Omit<Article, 'id'>> & {
  id: string;
};
