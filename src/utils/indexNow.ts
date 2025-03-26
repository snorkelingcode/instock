
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/article";

// Your IndexNow key - you should replace this with your actual key
const INDEX_NOW_KEY = "65196a99c535429cb66fb6fca33477d7"; // Example key from your prompt
const SITE_HOST = window.location.hostname;

/**
 * Notify search engines about a single article URL using IndexNow
 */
export async function notifyIndexNowSingleUrl(article: Article) {
  const articleUrl = `${window.location.origin}/article/${article.id}`;
  
  try {
    const { data, error } = await supabase.functions.invoke("index-now", {
      body: {
        url: articleUrl,
        key: INDEX_NOW_KEY
      }
    });
    
    if (error) {
      console.error("IndexNow notification failed:", error);
      return { success: false, error };
    }
    
    console.log("IndexNow notification sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending IndexNow notification:", error);
    return { success: false, error };
  }
}

/**
 * Notify search engines about multiple article URLs using IndexNow
 */
export async function notifyIndexNowBatch(articles: Article[]) {
  if (!articles.length) return { success: false, error: "No articles provided" };
  
  try {
    const urlList = articles.map(article => `${window.location.origin}/article/${article.id}`);
    
    const { data, error } = await supabase.functions.invoke("index-now", {
      body: {
        host: SITE_HOST,
        key: INDEX_NOW_KEY,
        urlList: urlList
      }
    });
    
    if (error) {
      console.error("IndexNow batch notification failed:", error);
      return { success: false, error };
    }
    
    console.log("IndexNow batch notification sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending IndexNow batch notification:", error);
    return { success: false, error };
  }
}
