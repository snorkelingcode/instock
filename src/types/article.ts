
export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author_id: string;
  category: string;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

// Type for the form data used in the article editor
export interface ArticleFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  featured: boolean;
  published: boolean;
}
