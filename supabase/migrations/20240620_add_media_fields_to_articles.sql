
-- Add media_type and featured_video columns to articles table
ALTER TABLE public.articles 
ADD COLUMN media_type TEXT CHECK (media_type IN ('image', 'video')),
ADD COLUMN featured_video TEXT;

-- Update the existing article functions to include these new fields
DROP FUNCTION IF EXISTS public.get_article_by_id(UUID);
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
  featured_image TEXT,
  featured_video TEXT,
  media_type TEXT,
  additional_images TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.content, a.excerpt, a.author_id, a.category, a.featured, a.published, 
         a.featured_image, a.featured_video, a.media_type, a.additional_images,
         a.created_at, a.updated_at, a.published_at
  FROM public.articles a
  WHERE a.id = article_id;
END;
$$;

DROP FUNCTION IF EXISTS public.get_all_articles();
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
  featured_image TEXT,
  featured_video TEXT,
  media_type TEXT,
  additional_images TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.content, a.excerpt, a.author_id, a.category, a.featured, a.published, 
         a.featured_image, a.featured_video, a.media_type, a.additional_images,
         a.created_at, a.updated_at, a.published_at
  FROM public.articles a
  ORDER BY a.created_at DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_published_articles();
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
  featured_image TEXT,
  featured_video TEXT,
  media_type TEXT,
  additional_images TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.content, a.excerpt, a.author_id, a.category, a.featured, a.published, 
         a.featured_image, a.featured_video, a.media_type, a.additional_images,
         a.created_at, a.updated_at, a.published_at
  FROM public.articles a
  WHERE a.published = true
  ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_featured_article();
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
  featured_image TEXT,
  featured_video TEXT,
  media_type TEXT,
  additional_images TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.content, a.excerpt, a.author_id, a.category, a.featured, a.published, 
         a.featured_image, a.featured_video, a.media_type, a.additional_images,
         a.created_at, a.updated_at, a.published_at
  FROM public.articles a
  WHERE a.published = true AND a.featured = true
  ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
  LIMIT 1;
END;
$$;

DROP FUNCTION IF EXISTS public.get_latest_articles(INT);
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
  featured_image TEXT,
  featured_video TEXT,
  media_type TEXT,
  additional_images TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.content, a.excerpt, a.author_id, a.category, a.featured, a.published, 
         a.featured_image, a.featured_video, a.media_type, a.additional_images,
         a.created_at, a.updated_at, a.published_at
  FROM public.articles a
  WHERE a.published = true
  ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Update create function to include the new fields
DROP FUNCTION IF EXISTS public.create_article(JSONB);
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
    featured_image,
    featured_video,
    media_type,
    additional_images,
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
    article_data->>'featured_image',
    article_data->>'featured_video',
    article_data->>'media_type',
    (article_data->'additional_images')::TEXT[],
    CASE WHEN article_data->>'published_at' IS NOT NULL 
         THEN (article_data->>'published_at')::TIMESTAMPTZ 
         ELSE NULL END,
    (article_data->>'updated_at')::TIMESTAMPTZ
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Update function to include the new fields
DROP FUNCTION IF EXISTS public.update_article(UUID, JSONB);
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
    featured_image = article_data->>'featured_image',
    featured_video = article_data->>'featured_video',
    media_type = article_data->>'media_type',
    additional_images = (article_data->'additional_images')::TEXT[],
    published_at = CASE WHEN article_data->>'published_at' IS NOT NULL 
                       THEN (article_data->>'published_at')::TIMESTAMPTZ 
                       ELSE NULL END,
    updated_at = (article_data->>'updated_at')::TIMESTAMPTZ
  WHERE id = article_id;
END;
$$;
