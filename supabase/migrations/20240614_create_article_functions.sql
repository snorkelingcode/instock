
-- Function to get an article by ID
CREATE OR REPLACE FUNCTION public.get_article_by_id(article_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  author_id UUID,
  category TEXT,
  featured BOOLEAN,
  published BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.content, a.excerpt, a.author_id, a.category, a.featured, a.published, a.created_at, a.updated_at, a.published_at
  FROM public.articles a
  WHERE a.id = article_id;
END;
$$;

-- Function to get all articles (admin view)
CREATE OR REPLACE FUNCTION public.get_all_articles()
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  author_id UUID,
  category TEXT,
  featured BOOLEAN,
  published BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.content, a.excerpt, a.author_id, a.category, a.featured, a.published, a.created_at, a.updated_at, a.published_at
  FROM public.articles a
  ORDER BY a.created_at DESC;
END;
$$;

-- Function to get all published articles
CREATE OR REPLACE FUNCTION public.get_published_articles()
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  author_id UUID,
  category TEXT,
  featured BOOLEAN,
  published BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.content, a.excerpt, a.author_id, a.category, a.featured, a.published, a.created_at, a.updated_at, a.published_at
  FROM public.articles a
  WHERE a.published = true
  ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC;
END;
$$;

-- Function to get featured article
CREATE OR REPLACE FUNCTION public.get_featured_article()
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  author_id UUID,
  category TEXT,
  featured BOOLEAN,
  published BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.content, a.excerpt, a.author_id, a.category, a.featured, a.published, a.created_at, a.updated_at, a.published_at
  FROM public.articles a
  WHERE a.published = true AND a.featured = true
  ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to get latest articles with limit
CREATE OR REPLACE FUNCTION public.get_latest_articles(limit_count INT DEFAULT 5)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  author_id UUID,
  category TEXT,
  featured BOOLEAN,
  published BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.content, a.excerpt, a.author_id, a.category, a.featured, a.published, a.created_at, a.updated_at, a.published_at
  FROM public.articles a
  WHERE a.published = true
  ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to create an article
CREATE OR REPLACE FUNCTION public.create_article(article_data JSONB)
RETURNS UUID SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.articles (
    title,
    content,
    excerpt,
    author_id,
    category,
    featured,
    published,
    published_at,
    updated_at
  ) VALUES (
    article_data->>'title',
    article_data->>'content',
    article_data->>'excerpt',
    (article_data->>'author_id')::UUID,
    article_data->>'category',
    (article_data->>'featured')::BOOLEAN,
    (article_data->>'published')::BOOLEAN,
    CASE WHEN article_data->>'published_at' IS NOT NULL 
         THEN (article_data->>'published_at')::TIMESTAMPTZ 
         ELSE NULL END,
    (article_data->>'updated_at')::TIMESTAMPTZ
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Function to update an article
CREATE OR REPLACE FUNCTION public.update_article(article_id UUID, article_data JSONB)
RETURNS VOID SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.articles
  SET
    title = article_data->>'title',
    content = article_data->>'content',
    excerpt = article_data->>'excerpt',
    category = article_data->>'category',
    featured = (article_data->>'featured')::BOOLEAN,
    published = (article_data->>'published')::BOOLEAN,
    published_at = CASE WHEN article_data->>'published_at' IS NOT NULL 
                       THEN (article_data->>'published_at')::TIMESTAMPTZ 
                       ELSE NULL END,
    updated_at = (article_data->>'updated_at')::TIMESTAMPTZ
  WHERE id = article_id;
END;
$$;

-- Function to toggle article featured status
CREATE OR REPLACE FUNCTION public.toggle_article_featured(article_id UUID, is_featured BOOLEAN)
RETURNS VOID SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.articles
  SET featured = is_featured,
      updated_at = now()
  WHERE id = article_id;
END;
$$;

-- Function to toggle article published status
CREATE OR REPLACE FUNCTION public.toggle_article_published(article_id UUID, is_published BOOLEAN)
RETURNS VOID SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.articles
  SET published = is_published,
      published_at = CASE WHEN is_published THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = article_id;
END;
$$;

-- Function to delete an article
CREATE OR REPLACE FUNCTION public.delete_article(article_id UUID)
RETURNS VOID SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.articles
  WHERE id = article_id;
END;
$$;
