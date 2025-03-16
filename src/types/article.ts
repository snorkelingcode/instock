
export interface Article {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  author_id: string;
  category: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  featured: boolean;
  published: boolean;
}

export type ArticleCreate = Omit<Article, 'id' | 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type ArticleUpdate = Partial<Omit<Article, 'id'>> & {
  id: number;
};
