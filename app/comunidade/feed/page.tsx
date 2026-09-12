import Link from "next/link";
import { ArrowLeft, Image as ImageIcon, MapPin, MessageCircle, MessageCircleMore, UserRound, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";
import { DeleteFeedPost, FeedPostForm, FeedReactions, FeedUpdates } from "@/components/social/feed-controls";
import { isUuid, socialSession } from "@/lib/social/messages";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type PostMedia = {
  id: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
};

type Reaction = "like" | "love" | "useful";

const firstRelation = <T,>(value: T | T[] | null): T | null =>
  Array.isArray(value) ? value[0] ?? null : value;

export default async function CommunityFeedPage({ searchParams }: {
  searchParams: Promise<{ before?: string }>;
}) {
  const { before } = await searchParams;
  const { db, user } = await socialSession();

  const query = db.from("social_posts")
    .select("id,author_id,content,created_at,comments_count,reactions_count,likes_count,loves_count,useful_count,author:profiles!social_posts_author_id_fkey(id,username,display_name,avatar_url),media:social_post_media(id,storage_key,mime_type,size_bytes)")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(21);

  if (before) {
    if (!isUuid(before)) notFound();
    const { data: cursor, error: cursorError } = await db.from("social_posts")
      .select("id,created_at").eq("id", before).maybeSingle();
    if (cursorError || !cursor) notFound();
    query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  }

  const [{ data: rows, error }, { data: ownProfile }] = await Promise.all([
    query,
    db.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).maybeSingle(),
  ]);
  if (error) throw new Error("Não foi possível carregar o feed.");

  const hasMore = (rows?.length || 0) > 20;
  const pageRows = (rows || []).slice(0, 20);
  const postIds = pageRows.map(row => row.id);
  const { data: myReactions, error: reactionsError } = postIds.length
    ? await db.from("social_post_reactions").select("post_id,reaction")
        .eq("user_id", user.id).in("post_id", postIds)
    : { data: [], error: null };
  if (reactionsError) throw new Error("Não foi possível carregar as reações.");
  const reactionFor = new Map((myReactions || []).map(row => [row.post_id, row.reaction as Reaction]));
  const posts = pageRows.map(row => ({
    id: row.id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at,
    commentsCount: row.comments_count,
    reactionsCount: row.reactions_count,
    counts: { like: row.likes_count, love: row.loves_count, useful: row.useful_count },
    currentReaction: reactionFor.get(row.id) || null,
    author: firstRelation(row.author as unknown as Profile | Profile[] | null),
    media: firstRelation(row.media as unknown as PostMedia | PostMedia[] | null),
  }));

  return (
    <div className="min-h-screen bg-[#f4f0e8] text-[#18352f]">
      <nav className="sticky top-0 z-20 border-b border-[#18352f]/10 bg-[#f4f0e8]/95 px-4 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/comunidade" className="inline-flex items-center gap-2 text-sm font-bold text-[#48635b] hover:text-[#18352f]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Comunidade
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/grupos" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold hover:bg-white/70">
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Grupos</span>
            </Link>
            <Link href="/mensagens" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold hover:bg-white/70">
              <MessageCircleMore className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Mensagens</span>
            </Link>
            <Link href="/perfil" className="inline-flex items-center gap-2 rounded-full bg-[#18352f] px-3.5 py-2 text-sm font-bold text-white">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Perfil</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-7 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-5">
          <header>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#d95d39]">Rede Social OTJ</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Publicações da comunidade</h1>
          </header>

          {!before && <FeedPostForm />}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">{before ? "Publicações anteriores" : "Mais recentes"}</h2>
            <FeedUpdates userId={user.id} />
          </div>

          {before && <Link href="/comunidade/feed" className="inline-flex rounded-full border border-[#18352f]/15 bg-white px-4 py-2 text-sm font-bold hover:bg-[#faf8f3]">
            Voltar às publicações recentes
          </Link>}

          {posts.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-[#18352f]/20 bg-white/55 px-6 py-14 text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-[#d95d39]" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-black">Ainda não há publicações</h2>
              <p className="mt-2 text-[#5a6d67]">Partilha a primeira novidade com a comunidade.</p>
            </div>
          ) : (
            <ol className="space-y-4" aria-label="Publicações da comunidade">
              {posts.map(post => {
                const authorName = post.author?.display_name || post.author?.username || "Utilizador";
                return <li key={post.id} className="overflow-hidden rounded-[1.75rem] border border-[#18352f]/10 bg-white shadow-[0_12px_38px_rgba(24,53,47,0.06)]">
                  <article>
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <Link href={`/perfil/${post.authorId}`} className="group flex min-w-0 items-center gap-3">
                          {post.author?.avatar_url ? (
                            // Os avatares podem vir de origens já aceites pelo perfil existente.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.author.avatar_url} alt={`Avatar de ${post.author?.username ? "@" + post.author.username : "utilizador"}`} className="h-11 w-11 shrink-0 rounded-full border border-[#18352f]/10 object-cover" />
                          ) : (
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e8f0d8] text-[#375238]">
                              <UserRound className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="block truncate font-black group-hover:underline">{authorName}</span>
                            <span className="block truncate text-sm text-[#6a7b75]">
                              {post.author?.username ? `@${post.author.username}` : "Membro da comunidade"}
                            </span>
                          </span>
                        </Link>
                        <time dateTime={post.createdAt} className="shrink-0 text-xs font-semibold text-[#7b8a85]">
                          {new Date(post.createdAt).toLocaleString("pt-PT", {
                            timeZone: "Europe/Lisbon", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </time>
                      </div>
                      <p className="mt-5 whitespace-pre-wrap break-words text-base leading-7 text-[#263f39]">{post.content}</p>
                    </div>
                    {post.media && (
                      // Esta rota privada valida a sessão; o otimizador não recebe os cookies do utilizador.
                      // eslint-disable-next-line @next/next/no-img-element
                      <div className="w-full border-y border-[#18352f]/10 bg-[#ebe6dc]" style={{ aspectRatio: "16/9" }}>
                      <img
                        src={`/comunidade/feed/imagens/${post.media.id}`}
                        alt="Imagem da publicação"
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                      </div>
                    )}
                    <div className="space-y-3 border-t border-[#18352f]/10 px-5 py-3 sm:px-6">
                      <FeedReactions postId={post.id} current={post.currentReaction} counts={post.counts} />
                      <footer className="flex min-h-9 flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#6a7b75]">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Comunidade OTJ
                          </span>
                          <Link href={`/comunidade/feed/${post.id}#comentarios`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 hover:bg-[#f4f0e8] hover:text-[#18352f]">
                            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            {post.commentsCount} {post.commentsCount === 1 ? "comentário" : "comentários"}
                          </Link>
                          <span>{post.reactionsCount} {post.reactionsCount === 1 ? "reação" : "reações"}</span>
                        </div>
                        {post.authorId === user.id && <DeleteFeedPost postId={post.id} />}
                      </footer>
                    </div>
                  </article>
                </li>;
              })}
            </ol>
          )}

          {hasMore && <Link href={`/comunidade/feed?before=${posts.at(-1)?.id}`} className="block rounded-full border border-[#18352f]/15 bg-white px-5 py-3 text-center text-sm font-black hover:bg-[#faf8f3]">
            Ver publicações anteriores
          </Link>}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-[1.5rem] bg-[#18352f] p-5 text-white">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#e6eebf]">A tua comunidade</p>
            <p className="mt-4 text-lg font-bold leading-7">Partilha novidades, ideias e histórias que aproximem as pessoas.</p>
            <div className="mt-5 border-t border-white/15 pt-4 text-sm text-white/70">
              <p className="font-bold text-white">{ownProfile?.display_name || ownProfile?.username || "O teu perfil"}</p>
              {ownProfile?.username && <p>@{ownProfile.username}</p>}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
