import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SECRET = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente administrativo: SÓ para setup/teardown. Ignora RLS.
const admin = createClient(URL, SECRET, { auth: { persistSession: false } });

describe('E2E Social — BD real, sessão de utilizador', () => {
  const email = `test-${Date.now()}@otj.test`;
  const password = 'TestPassword123!';

  let userId: string;
  let user: SupabaseClient;   // cliente com sessão real (anon key + JWT)
  let postId: string;
  let commentId: string;

  beforeAll(async () => {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(`createUser: ${error.message}`);
    userId = data.user!.id;

    // Adulto verificado, para não bater na minors policy.
    const { error: pErr } = await admin
      .from('profiles')
      .upsert({ id: userId, username: `test_${Date.now()}`, data_nascimento: '1990-01-01', age_verified: true });
    if (pErr) throw new Error(`profiles upsert: ${pErr.message}`);

    // Sessão real: é isto que dá auth.uid() dentro das RPC.
    user = createClient(URL, ANON, { auth: { persistSession: false } });
    const { error: sErr } = await user.auth.signInWithPassword({ email, password });
    if (sErr) throw new Error(`signIn: ${sErr.message}`);
  });

  afterAll(async () => {
    if (userId) await admin.auth.admin.deleteUser(userId);
  });

  it('1. social_post_criar devolve id', async () => {
    const { data, error } = await user.rpc('social_post_criar', {
      p_content: 'Test post E2E',
      p_visibility: 'public',
    });
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    postId = data;
  });

  it('2. post existe com author_id correcto', async () => {
    const { data, error } = await admin
      .from('social_posts')
      .select('content, author_id')
      .eq('id', postId)
      .single();
    expect(error).toBeNull();
    expect(data?.content).toBe('Test post E2E');
    expect(data?.author_id).toBe(userId);
  });

  it('3. social_comentario_criar devolve id', async () => {
    const { data, error } = await user.rpc('social_comentario_criar', {
      p_post_id: postId,
      p_content: 'Test comment',
    });
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    commentId = data;
  });

  it('4. social_reacao_adicionar grava a reacção', async () => {
    const { error } = await user.rpc('social_reacao_adicionar', {
      p_post_id: postId,
      p_reaction: 'like',
    });
    expect(error).toBeNull();

    const { data } = await admin
      .from('social_post_reactions')
      .select('reaction')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
    expect(data?.reaction).toBe('like');
  });

  it('5. INSERT directo em social_posts é bloqueado pela policy', async () => {
    const { error } = await user.from('social_posts').insert({
      author_id: userId,
      content: 'Directo — não deve passar',
      visibility: 'public',
    });
    expect(error).toBeTruthy();
    expect(error?.code).toBe('42501'); // insufficient_privilege / RLS
  });

  it('6. social_post_editar altera o conteúdo', async () => {
    const { error } = await user.rpc('social_post_editar', {
      p_post_id: postId,
      p_content: 'Updated',
    });
    expect(error).toBeNull();

    const { data } = await admin
      .from('social_posts')
      .select('content')
      .eq('id', postId)
      .single();
    expect(data?.content).toBe('Updated');
  });

  it('7. social_comentario_apagar faz soft delete', async () => {
    const { error } = await user.rpc('social_comentario_apagar', {
      p_comment_id: commentId,
    });
    expect(error).toBeNull();

    const { data } = await admin
      .from('social_post_comments')
      .select('deleted_at')
      .eq('id', commentId)
      .single();
    expect(data?.deleted_at).toBeTruthy();
  });

  it('8. social_post_apagar faz soft delete', async () => {
    const { error } = await user.rpc('social_post_apagar', { p_post_id: postId });
    expect(error).toBeNull();

    const { data } = await admin
      .from('social_posts')
      .select('deleted_at')
      .eq('id', postId)
      .single();
    expect(data?.deleted_at).toBeTruthy();
  });
});
