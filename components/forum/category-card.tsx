import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  thread_count?: number;
}

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/forum/${category.slug}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">{category.icon}</span>
            <div>
              <h3 className="font-semibold text-terra-800">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-terra-600 mt-1">{category.description}</p>
              )}
              {category.thread_count !== undefined && (
                <p className="text-xs text-terra-400 mt-2">
                  {category.thread_count} topico{category.thread_count !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
