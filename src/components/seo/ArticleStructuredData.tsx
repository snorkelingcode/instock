
import React, { useEffect } from 'react';
import { Article } from '@/types/article';
import { createSlug } from '@/pages/ArticleDetails';

interface ArticleStructuredDataProps {
  article: Article;
}

const ArticleStructuredData: React.FC<ArticleStructuredDataProps> = ({ article }) => {
  useEffect(() => {
    // Create Article schema structured data
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      'headline': article.title,
      'description': article.excerpt,
      'image': article.featured_image ? [article.featured_image] : [],
      'datePublished': article.published_at || article.created_at,
      'dateModified': article.updated_at,
      'author': {
        '@type': 'Organization',
        'name': 'TCG Updates',
        'url': 'https://tcgupdates.com'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'TCG Updates',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://tcgupdates.com/lovable-uploads/3ef7392a-c45d-4acd-bbdf-15d852b86297.png'
        }
      },
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': `https://tcgupdates.com/articles/${createSlug(article.title)}`
      },
      'keywords': `tcg, trading card game, ${article.category}, ${article.title.toLowerCase()}`
    };

    // Add the structured data to the page
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    script.id = 'article-structured-data';
    
    // Remove any existing structured data scripts for this article
    const existingScript = document.getElementById('article-structured-data');
    if (existingScript) {
      existingScript.remove();
    }
    
    document.head.appendChild(script);
    
    return () => {
      // Clean up
      const scriptToRemove = document.getElementById('article-structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [article]);

  // This component doesn't render anything visible
  return null;
};

export default ArticleStructuredData;
