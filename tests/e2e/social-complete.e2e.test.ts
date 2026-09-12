import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

describe('E2E Social Completo — BD Real', () => {
  let testUserId: string;
  let testPostId: string;
  let testCommentId: string;

  beforeAll(async () => {
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@otj.test`,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (error || !user) throw new Error('Falha ao criar utilizador');
    testUserId = user.id;

    await supabase.from('profiles').insert({
      id: testUserId,
      name: 'Test User',
      data_nascimento: '2000-01-01',
      age_verified: true,
    });
  });

  afterAll(async () => {
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it('1. Criar post via RPC', async () => {
    const { data, error } = await supabase.rpc('social_post_criar', {
      p_content: 'Test post E2E',
      p_visibility: 'public',
    });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    testPostId = data;
  });

  it('2. Verificar post na BD', async () => {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('id', testPostId)
      .single();

    expect(error).toBeNull();
    expect(data?.content).toBe('Test post E2E');
  });

  it('3. Criar comentário via RPC', async () => {
    const { data, error } = await supabase.rpc('social_comentario_criar', {
      p_post_id: testPostId,
      p_content: 'Test comment',
    });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    testCommentId = data;
  });

  it('4. Adicionar reação', async () => {
    const { data, error } = await supabase.rpc('social_reacao_adicionar', {
      p_post_id: testPostId,
      p_reaction: 'like',
    });

    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it('5. INSERT direto deve bloquear', async () => {
    const { error } = await supabase.from('social_posts').insert({
      author_id: testUserId,
      content: 'Direto',
      visibility: 'public',
    });

    expect(error).toBeTruthy();
  });

  it('6. Editar post via RPC', async () => {
    const { data, error } = await supabase.rpc('social_post_editar', {
      p_post_id: testPostId,
      p_content: 'Updated',
    });

    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it('7. Apagar post via RPC', async () => {
    const { data, error } = await supabase.rpc('social_post_apagar', {
      p_post_id: testPostId,
    });

    expect(error).toBeNull();
    expect(data).toBe(true);
  });
});
