"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, ImagePlus, Lightbulb, LoaderCircle, Send, ThumbsUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createComment, createPost, deleteComment, deletePost, toggleReaction } from "@/app/comunidade/feed/actions";
import { createClient } from "@/lib/supabase/client";

export function FeedPostForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [imageName, setImageName] = useState("");

  return (
    <form ref={formRef} className="rounded-[1.75rem] border border-[#18352f]/10 bg-white p-5 shadow-[0_14px_45px_rgba(24,53,47,0.08)] sm:p-6" onSubmit={async event => {
      event.preventDefault();
      if (busy.current) return;
      busy.current = true;
      setPending(true);
      setError("");
      try {
        const result = await createPost(new FormData(event.currentTarget));
        if (result.error) setError(result.error);
        else {
          formRef.current?.reset();
          setContent("");
          setImageName("");
          router.refresh();
        }
      } catch {
        setError("Não foi possível publicar. Verifica a ligação e tenta novamente.");
      } finally {
        busy.current = false;
        setPending(false);
      }
    }}>
      <label htmlFor="social-post-content" className="text-lg font-black text-[#18352f]">
        Partilha com a comunidade
      </label>
      <textarea
        id="social-post-content"
        name="content"
        required
        maxLength={3000}
        rows={4}
        value={content}
        onChange={event => setContent(event.target.value)}
        placeholder="O que gostavas de partilhar?"
        className="mt-3 block w-full resize-y rounded-2xl border border-[#18352f]/15 bg-[#faf8f3] px-4 py-3 text-base leading-7 outline-none transition focus:border-[#d95d39] focus:ring-2 focus:ring-[#d95d39]/15"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#18352f]/15 px-4 py-2.5 text-sm font-bold text-[#48635b] transition hover:bg-[#f4f0e8]">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {imageName || "Juntar imagem"}
          <input
            className="sr-only"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={event => setImageName(event.target.files?.[0]?.name || "")}
          />
        </label>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums text-[#6a7b75]">{content.length}/3000</span>
          <button disabled={pending || !content.trim()} className="inline-flex items-center gap-2 rounded-full bg-[#d95d39] px-5 py-2.5 text-sm font-black text-white shadow-[0_8px_24px_rgba(150,62,37,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            {pending ? "A publicar…" : "Publicar"}
          </button>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}
    </form>
  );
}

export function DeleteFeedPost({ postId, returnTo }: { postId: string; returnTo?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  if (confirming) {
    return <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
      <span className="text-[#5a6d67]">Apagar esta publicação?</span>
      <button disabled={pending} onClick={() => setConfirming(false)} className="rounded-full px-3 py-1.5 font-bold hover:bg-[#f4f0e8]">
        Cancelar
      </button>
      <button disabled={pending} onClick={async () => {
        setPending(true);
        setError("");
        try {
          const result = await deletePost(postId);
          if (result.error) setError(result.error);
          else if (returnTo) router.push(returnTo);
          else router.refresh();
        } catch { setError("Não foi possível apagar. Tenta novamente."); }
        finally { setPending(false); }
      }} className="rounded-full bg-red-700 px-3 py-1.5 font-bold text-white disabled:opacity-50">
        {pending ? "A apagar…" : "Apagar"}
      </button>
      {error && <span role="alert" className="w-full text-right text-red-700">{error}</span>}
    </div>;
  }

  return <button onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-[#7a5147] hover:bg-red-50 hover:text-red-800">
    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
    Apagar
  </button>;
}

export function FeedUpdates({ userId }: { userId: string }) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const db = createClient();
    let disposed = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (disposed || document.visibilityState !== "visible" || refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        if (!disposed && document.visibilityState === "visible") router.refresh();
      }, 250);
    };
    const channel: RealtimeChannel = db.channel(`social-feed:${userId}:${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "social_posts" }, refresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "social_posts" }, refresh)
      .subscribe(status => {
        if (disposed) return;
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") refresh();
      });
    const poll = setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      disposed = true;
      clearInterval(poll);
      if (refreshTimer) clearTimeout(refreshTimer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
      void db.removeChannel(channel).catch(() => undefined);
    };
  }, [router, userId]);

  return <p role="status" className="text-xs font-semibold text-[#6a7b75]">
    {connected ? "Novas publicações aparecem automaticamente." : "O feed é atualizado a cada 30 segundos."}
  </p>;
}

type Reaction = "like" | "love" | "useful";

const reactionOptions: { value: Reaction; label: string; icon: typeof ThumbsUp; active: string }[] = [
  { value: "like", label: "Gosto", icon: ThumbsUp, active: "border-[#315f9a] bg-[#eaf2fc] text-[#244f86]" },
  { value: "love", label: "Adoro", icon: Heart, active: "border-[#b94a55] bg-[#fff0f1] text-[#a33340]" },
  { value: "useful", label: "Útil", icon: Lightbulb, active: "border-[#9a7026] bg-[#fff6dc] text-[#795719]" },
];

export function FeedReactions({ postId, current, counts }: {
  postId: string;
  current: Reaction | null;
  counts: Record<Reaction, number>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<Reaction | null>(null);
  const [error, setError] = useState("");

  return <div>
    <div className="flex flex-wrap gap-2" aria-label="Reações à publicação">
      {reactionOptions.map(option => {
        const Icon = option.icon;
        const active = current === option.value;
        return <button
          key={option.value}
          type="button"
          aria-pressed={active}
          disabled={pending !== null}
          onClick={async () => {
            setPending(option.value);
            setError("");
            try {
              const result = await toggleReaction(postId, option.value);
              if (result.error) setError(result.error);
              else router.refresh();
            } catch { setError("Não foi possível registar a reação."); }
            finally { setPending(null); }
          }}
          className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition disabled:opacity-50 ${active ? option.active : "border-[#18352f]/12 text-[#526a62] hover:bg-[#f4f0e8]"}`}
        >
          {pending === option.value ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
          {option.label} <span className="tabular-nums">{counts[option.value]}</span>
        </button>;
      })}
    </div>
    {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
  </div>;
}

export function FeedCommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");

  return <form ref={formRef} className="rounded-[1.5rem] border border-[#18352f]/10 bg-white p-4 sm:p-5" onSubmit={async event => {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const result = await createComment(postId, new FormData(event.currentTarget));
      if (result.error) setError(result.error);
      else {
        formRef.current?.reset();
        setContent("");
        router.refresh();
      }
    } catch { setError("Não foi possível comentar. Verifica a ligação e tenta novamente."); }
    finally { busy.current = false; setPending(false); }
  }}>
    <label htmlFor="social-comment-content" className="font-black text-[#18352f]">Escrever comentário</label>
    <textarea
      id="social-comment-content"
      name="content"
      required
      maxLength={1000}
      rows={3}
      value={content}
      onChange={event => setContent(event.target.value)}
      className="mt-2 block w-full resize-y rounded-2xl border border-[#18352f]/15 bg-[#faf8f3] px-4 py-3 text-base leading-7 outline-none focus:border-[#d95d39] focus:ring-2 focus:ring-[#d95d39]/15"
      placeholder="Deixa uma resposta útil e respeitosa…"
    />
    <div className="mt-3 flex items-center justify-between gap-3">
      <span className="text-sm tabular-nums text-[#6a7b75]">{content.length}/1000</span>
      <button disabled={pending || !content.trim()} className="inline-flex items-center gap-2 rounded-full bg-[#18352f] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">
        {pending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {pending ? "A comentar…" : "Comentar"}
      </button>
    </div>
    {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
  </form>;
}

export function DeleteFeedComment({ postId, commentId }: { postId: string; commentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return <div className="text-right">
    <button disabled={pending} onClick={async () => {
      setPending(true);
      setError("");
      try {
        const result = await deleteComment(postId, commentId);
        if (result.error) setError(result.error);
        else router.refresh();
      } catch { setError("Não foi possível apagar o comentário."); }
      finally { setPending(false); }
    }} className="text-sm font-bold text-[#7a5147] hover:text-red-800 disabled:opacity-50">
      {pending ? "A apagar…" : "Apagar"}
    </button>
    {error && <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
  </div>;
}
