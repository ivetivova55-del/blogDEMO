import { supabase } from '../api/supabase-client.js';

function isMissingTableError(error) {
  const message = [error?.message, error?.details, error?.hint, error?.code]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('schema cache')
  );
}

export async function fetchFaqs() {
  const { data, error } = await supabase
    .from('faqs')
    .select('id, question, answer, category, views, helpful_yes, helpful_no, tags, created_at, updated_at')
    .order('views', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }

  return data || [];
}

export async function incrementFaqView(faqId) {
  if (!faqId) return false;
  const { error } = await supabase.rpc('increment_faq_views', { faq_id: faqId });
  if (error) return false;
  return true;
}

export async function voteFaqHelpful(faqId, isYes) {
  if (!faqId) return false;
  const { error } = await supabase.rpc('vote_faq_helpful', { faq_id: faqId, is_yes: Boolean(isYes) });
  if (error) return false;
  return true;
}
