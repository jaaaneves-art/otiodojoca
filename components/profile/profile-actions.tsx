import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ProfileActions() {

  return (

    <Card>

      <CardHeader>
        <CardTitle>Ações rápidas</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">

        <Button asChild className="w-full">
          <Link href="/perfil/editar">
            Editar Perfil
          </Link>
        </Button>

        <Button asChild variant="outline" className="w-full">
          <Link href="/forum">
            Fórum
          </Link>
        </Button>

        <Button asChild variant="outline" className="w-full">
          <Link href="/mercado">
            Mercado da Terra
          </Link>
        </Button>

      </CardContent>

    </Card>

  );

}