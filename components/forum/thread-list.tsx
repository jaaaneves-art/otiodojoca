import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Pin, Lock } from "lucide-react";

interface Thread {
  id: number;
  title: string;
  slug: string;
  author: { username: string };
  replies_count: number;
  views: number;
  is_pinned: boolean;
  is_locked: boolean;
  last_post_at: string;
  created_at: string;
}

export function ThreadList({ threads }: { threads: Thread[] }) {
  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <Link key={thread.id} href={`/forum/topico/${thread.id}`}>
          <Card className="hover:shadow-sm transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {thread.is_pinned && <Pin className="w-4 h-4 text-terra-500 flex-shrink-0" />}
                {thread.is_locked && <Lock className="w-4 h-4 text-terra-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-terra-800 truncate">{thread.title}</h4>
                  <p className="text-sm text-terra-500">
                    por {thread.author.username} · {new Date(thread.created_at).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-terra-500 flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {thread.replies_count}
                  </span>
                  <span>{thread.views} vistas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
