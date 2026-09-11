'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const FEED_PATH = '/comunidade/feed';

export async function createPost(content: string) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Não autenticado' };
    const { error } = await supabase.rpc('social_create_post', { p_content: content });
    if (error) return { error: error.message };
    revalidatePath(FEED_PATH);
    return {};
  } catch (err) { return { error: 'Erro' }; }
}

export async function createComment(postId: string, content: string) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Não autenticado' };
    const { error } = await supabase.rpc('social_create_comment', { p_post: postId, p_content: content });
    if (error) return { error: error.message };
    revalidatePath(`${FEED_PATH}/${postId}`);
    return {};
  } catch (err) { return { error: 'Erro' }; }
}

export async function toggleReaction(postId: string, reactionType: string) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Não autenticado' };
    const { error } = await supabase.rpc('social_toggle_reaction', { p_post_id: postId, p_reaction_type: reactionType });
    if (error) return { error: error.message };
    revalidatePath(`${FEED_PATH}/${postId}`);
    return {};
  } catch (err) { return { error: 'Erro' }; }
}
