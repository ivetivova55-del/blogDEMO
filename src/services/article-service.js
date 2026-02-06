import { supabase } from './supabase-client.js';

const ITEMS_PER_PAGE = 10;

export async function fetchArticles(page = 1, filters = {}) {
  try {
    let query = supabase
      .from('articles')
      .select('*, users(full_name), categories(name)', { count: 'exact' });

    // Apply filters
    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'published');
    }

    // Pagination
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    
    query = query.order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      articles: data || [],
      total: count || 0,
      page,
      limit: ITEMS_PER_PAGE,
    };
  } catch (error) {
    console.error('Error fetching articles:', error.message);
    throw error;
  }
}

export async function getArticleById(id) {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*, users(full_name, id), categories(name, id), comments(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase
      .from('articles')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', id);

    return data;
  } catch (error) {
    console.error('Error fetching article:', error.message);
    throw error;
  }
}

export async function createArticle(articleData, userId) {
  try {
    const { data, error } = await supabase
      .from('articles')
      .insert([{
        ...articleData,
        author_id: userId,
        views: 0,
        created_at: new Date(),
        updated_at: new Date(),
      }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating article:', error.message);
    throw error;
  }
}

export async function updateArticle(id, updates) {
  try {
    const { data, error } = await supabase
      .from('articles')
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating article:', error.message);
    throw error;
  }
}

export async function deleteArticle(id) {
  try {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting article:', error.message);
    throw error;
  }
}

export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    throw error;
  }
}

export async function getUserArticles(userId, page = 1) {
  try {
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('articles')
      .select('*, categories(name)', { count: 'exact' })
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      articles: data || [],
      total: count || 0,
      page,
      limit: ITEMS_PER_PAGE,
    };
  } catch (error) {
    console.error('Error fetching user articles:', error.message);
    throw error;
  }
}

export async function addComment(articleId, userId, content) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        article_id: articleId,
        author_id: userId,
        content,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error adding comment:', error.message);
    throw error;
  }
}

export async function deleteComment(commentId) {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error.message);
    throw error;
  }
}
