'use client';
import { FeedPostForm } from '@/components/social/feed-controls';
export default function FeedPage() {
  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <div className="mx-auto max-w-2xl">
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          <FeedPostForm />
        </div>
        <div className="p-6 text-center text-gray-500">
          Feed vazio
        </div>
      </div>
    </div>
  );
}
