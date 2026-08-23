"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PostImage {
  id: number;
  storage_path: string;
  sort_order: number;
}

interface Post {
  id: number;
  content: string;
  author: { id: string; username: string; reputation: number };
  created_at: string;
  updated_at: string;
  is_first_post: boolean;
  images?: PostImage[];
}

export function PostItem({ post, currentUserId }: { post: Post; currentUserId?: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const isAuthor = currentUserId === post.author.id;

  async function handleSave() {
    setSaving(true);
    await supabase.from("posts").update({ content }).eq("id", post.id);
    setSaving(false);
    setIsEditing(false);
  }

  return (
    <Card className={post.is_first_post ? "border-terra-300" : ""}>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-32">
            <div className="w-12 h-12 rounded-full bg-terra-200 flex items-center justify-center text-xl font-bold text-terra-700">
              {post.author.username[0].toUpperCase()}
            </div>
            <p className="font-medium text-terra-800 mt-2 text-sm">{post.author.username}</p>
            <p className="text-xs text-terra-500">Reputacao: {post.author.reputation}</p>
          </div>
          <div className="flex-1">
            <div className="text-xs text-terra-400 mb-2">
              {new Date(post.created_at).toLocaleString("pt-PT")}
              {post.updated_at !== post.created_at && " (editado)"}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-terra-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? "A guardar..." : "Guardar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose prose-terra max-w-none">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>
            )}
            {!isEditing && post.images && post.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md">
                {post.images.map((img) => (
                  <a key={img.id} href={img.storage_path} target="_blank" rel="noopener noreferrer">
                    <img
                      src={img.storage_path}
                      alt=""
                      className="w-full h-24 object-cover rounded-lg border border-terra-200 hover:opacity-90 transition"
                    />
                  </a>
                ))}
              </div>
            )}
            {isAuthor && !isEditing && (
              <div className="mt-4">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
