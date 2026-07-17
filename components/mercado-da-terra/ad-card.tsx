import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface Ad {
  id: number;
  title: string;
  price: number | null;
  price_type: string;
  location: string | null;
  status: string;
  author: { username: string };
  created_at: string;
}

export function AdCard({ ad }: { ad: Ad }) {
  const priceLabel = {
    fixed: `${ad.price?.toFixed(2)} €`,
    negotiable: `${ad.price?.toFixed(2)} € (negociavel)`,
    free: "Gratis",
  };

  return (
    <Link href={`/feira/${ad.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-terra-800">{ad.title}</h3>
              <p className="text-lg font-bold text-terra-600 mt-1">
                {priceLabel[ad.price_type as keyof typeof priceLabel] || "Preco sob consulta"}
              </p>
              {ad.location && (
                <p className="text-sm text-terra-500 mt-1">📍 {ad.location}</p>
              )}
              <p className="text-xs text-terra-400 mt-2">
                por {ad.author.username} · {new Date(ad.created_at).toLocaleDateString("pt-PT")}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              ad.status === 'active' ? 'bg-green-100 text-green-700' :
              ad.status === 'sold' ? 'bg-gray-100 text-gray-600' :
              'bg-terra-100 text-terra-600'
            }`}>
              {ad.status === 'active' ? 'Ativo' :
               ad.status === 'sold' ? 'Vendido' :
               ad.status === 'reserved' ? 'Reservado' : 'Expirado'}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
