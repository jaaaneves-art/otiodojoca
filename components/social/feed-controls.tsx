'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createPost, createComment, toggleReaction } from './actions';

export function FeedPostForm({ onSuccess }: { onSuccess?: () => void }) {
  const [content, setContent] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const canSubmit = content.trim().length > 0 && content.trim().length <= 3000;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    try {
      const result = await createPost(content.trim());
      if (!result.error) { setContent(''); router.refresh(); onSuccess?.(); }
    } finally { setPending(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-white border-b">
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="O que tens em mente?" className="w-full p-2 border rounded" maxLength={3000} disabled={pending} />
      <div className="text-xs text-gray-500">{content.length} / 3000</div>
      <button type="submit" disabled={pending || !canSubmit} className="w-full bg-[#18352f] text-white p-2 rounded disabled:opacity-50">
        {pending ? 'A publicar...' : 'Publicar'}
      </button>
    </form>
  );
}

export function FeedCommentForm({ postId, onSuccess }: { postId: string; onSuccess?: () => void }) {
  const [content, setContent] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const canSubmit = content.trim().length > 0 && content.trim().length <= 1000;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    try {
      const result = await createComment(postId, content.trim());
      if (!result.error) { setContent(''); router.refresh(); onSuccess?.(); }
    } finally { setPending(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-white border-t">
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Comentário..." className="w-full p-2 border rounded" maxLength={1000} disabled={pending} />
      <div className="text-xs text-gray-500">{content.length} / 1000</div>
      <button type="submit" disabled={pending || !canSubmit} className="w-full bg-[#18352f] text-white p-2 rounded disabled:opacity-50">
        {pending ? 'A comentar...' : 'Comentar'}
      </button>
    </form>
  );
}

export function FeedReactions({ postId, likes, loves, useful, userReaction }: any) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const handleReaction = useCallback(async (reaction: string) => {
    setPending(true);
    try { const result = await toggleReaction(postId, reaction); if (!result.error) router.refresh(); }
    finally { setPending(false); }
  }, [postId, router]);

  return (
    <div className="flex gap-2 p-2">
      <button onClick={() => handleReaction('like')} disabled={pending} className="px-3 py-1 rounded text-sm bg-gray-100">👍 {likes}</button>
      <button onClick={() => handleReaction('love')} disabled={pending} className="px-3 py-1 rounded text-sm bg-gray-100">❤️ {loves}</button>
      <button onClick={() => handleReaction('useful')} disabled={pending} className="px-3 py-1 rounded text-sm bg-gray-100">✨ {useful}</button>
    </div>
  );
}
