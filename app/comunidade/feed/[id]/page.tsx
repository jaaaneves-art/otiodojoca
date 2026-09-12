import Link from "next/link";
import { ArrowLeft, MessageCircle, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import {
  DeleteFeedComment,
  DeleteFeedPost,
  FeedCommentForm,
  FeedReactions,
  FeedUpdates,
} from "@/components/social/feed-controls";
import { isUuid, socialSession } from "@/lib/social/messages";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Media = { id: string; mime_type: string };
type Reaction = "like" | "love" | "useful";

const firstRelation = <T,>(value: T | T[] | null): T | null =>
  Array.isArray(value) ? value[0] ?? null : value;

export default async function CommunityPostPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ before?: string }>;
}) {
  const { id } = await params;
  const { before } = await searchParams;
  if (!isUuid(id)) notFound();
  const { db, user } = await socialSession();

  const { data: row, error } = await db.from("social_posts")
    .select("id,author_id,content,created_at,comments_count,reactions_count,likes_count,loves_count,useful_count,author:profiles!social_posts_author_id_fkey(id,username,display_name,avatar_url),media:social_post_media(id,mime_type)")
    .eq("id", id).eq("visibility", "public").is("deleted_at", null).maybeSingle();
  if (error || !row) notFound();

  const commentsQuery = db.from("social_post_comments")
    .select("id,author_id,content,created_at,author:profiles!social_post_comments_author_id_fkey(id,username,display_name,avatar_url)")
    .eq("post_id", id).is("deleted_at", null)
    .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(51);
  if (before) {
    if (!isUuid(before)) notFound();
    const { data: cursor, error: cursorError } = await db.from("social_post_comments")
      .select("id,created_at").eq("id", before).eq("post_id", id).maybeSingle();
    if (cursorError || !cursor) notFound();
    commentsQuery.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  }

  const [{ data: commentRows, error: commentsError }, { data: myReaction, error: reactionError }] = await Promise.all([
    commentsQuery,
    db.from("social_post_reactions").select("reaction")
      .eq("post_id", id).eq("user_id", user.id).maybeSingle(),
  ]);
  if (commentsError || reactionError) throw new Error("Não foi possível carregar a conversa.");

  const author = firstRelation(row.author as unknown as Profile | Profile[] | null);
  const media = firstRelation(row.media as unknown as Media | Media[] | null);
  const pageComments = (commentRows || []).slice(0, 50);
  const hasMore = (commentRows?.length || 0) > 50;
  const comments = pageComments.map(comment => ({
    ...comment,
    author: firstRelation(comment.author as unknown as Profile | Profile[] | null),
  }));
  const authorName = author?.display_name || author?.username || "Utilizador";

  return <div className="min-h-screen bg-[#f4f0e8] text-[#18352f]">
    <nav className="border-b border-[#18352f]/10 bg-[#f4f0e8]/95 px-4 py-3 sm:px-8">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <Link href="/comunidade/feed" className="inline-flex items-center gap-2 text-sm font-bold text-[#48635b] hover:text-[#18352f]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar ao feed
        </Link>
        <Link href="/perfil" className="rounded-full bg-[#18352f] px-4 py-2 text-sm font-bold text-white">Perfil</Link>
      </div>
    </nav>

    <main className="mx-auto max-w-3xl space-y-5 px-4 py-7 sm:px-8 sm:py-10">
      <FeedUpdates userId={user.id} />
      <article className="overflow-hidden rounded-[1.75rem] border border-[#18352f]/10 bg-white shadow-[0_12px_38px_rgba(24,53,47,0.06)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <Link href={`/perfil/${row.author_id}`} className="group flex min-w-0 items-center gap-3">
              {author?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={author.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full border border-[#18352f]/10 object-cover" />
              ) : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e8f0d8] text-[#375238]">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>}
              <span className="min-w-0">
                <span className="block truncate font-black group-hover:underline">{authorName}</span>
                <span className="block truncate text-sm text-[#6a7b75]">{author?.username ? `@${author.username}` : "Membro da comunidade"}</span>
              </span>
            </Link>
            <time dateTime={row.created_at} className="shrink-0 text-xs font-semibold text-[#7b8a85]">
              {new Date(row.created_at).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon", dateStyle: "medium", timeStyle: "short" })}
            </time>
          </div>
          <p className="mt-5 whitespace-pre-wrap break-words text-base leading-7 text-[#263f39]">{row.content}</p>
        </div>
        {media && (
          // A imagem passa pela rota autenticada do feed.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/comunidade/feed/imagens/${media.id}`} alt="Imagem da publicação" className="max-h-[42rem] w-full border-y border-[#18352f]/10 bg-[#ebe6dc] object-contain" />
        )}
        <div className="space-y-3 border-t border-[#18352f]/10 px-5 py-4 sm:px-6">
          <FeedReactions
            postId={id}
            current={(myReaction?.reaction as Reaction | undefined) || null}
            counts={{ like: row.likes_count, love: row.loves_count, useful: row.useful_count }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-[#6a7b75]">
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {row.comments_count} {row.comments_count === 1 ? "comentário" : "comentários"} · {row.reactions_count} {row.reactions_count === 1 ? "reação" : "reações"}
            </span>
            {row.author_id === user.id && <DeleteFeedPost postId={id} returnTo="/comunidade/feed" />}
          </div>
        </div>
      </article>

      {!before && <FeedCommentForm postId={id} />}

      <section id="comentarios" className="scroll-mt-6 space-y-4" aria-labelledby="comments-title">
        <div className="flex items-center justify-between gap-3">
          <h1 id="comments-title" className="text-2xl font-black tracking-tight">Comentários</h1>
          {before && <Link href={`/comunidade/feed/${id}#comentarios`} className="text-sm font-bold underline">Ver recentes</Link>}
        </div>
        {!comments.length ? <div className="rounded-[1.5rem] border border-dashed border-[#18352f]/20 bg-white/55 p-8 text-center text-[#5a6d67]">
          Ainda não há comentários. Inicia a conversa.
        </div> : <ol className="space-y-3">
          {comments.map(comment => {
            const commentName = comment.author?.display_name || comment.author?.username || "Utilizador";
            return <li key={comment.id} className="rounded-[1.5rem] border border-[#18352f]/10 bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/perfil/${comment.author_id}`} className="font-black hover:underline">{commentName}</Link>
                <time dateTime={comment.created_at} className="text-xs font-semibold text-[#7b8a85]">
                  {new Date(comment.created_at).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon", dateStyle: "short", timeStyle: "short" })}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words leading-7 text-[#334b45]">{comment.content}</p>
              {comment.author_id === user.id && <DeleteFeedComment postId={id} commentId={comment.id} />}
            </li>;
          })}
        </ol>}
        {hasMore && <Link href={`/comunidade/feed/${id}?before=${pageComments.at(-1)?.id}#comentarios`} className="block rounded-full border border-[#18352f]/15 bg-white px-5 py-3 text-center text-sm font-black hover:bg-[#faf8f3]">
          Ver comentários anteriores
        </Link>}
      </section>
    </main>
  </div>;
}
