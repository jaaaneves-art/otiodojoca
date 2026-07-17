import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  topics?: number;
  replies?: number;
  favorites?: number;
}

export function ProfileStats({
  topics = 0,
  replies = 0,
  favorites = 0,
}: Props) {
  return (
    <Card>

      <CardHeader>
        <CardTitle>Atividade</CardTitle>
      </CardHeader>

      <CardContent>

        <div className="grid grid-cols-3 gap-4 text-center">

          <div>
            <p className="text-2xl font-bold">
              {topics}
            </p>

            <p className="text-sm text-muted-foreground">
              Tópicos
            </p>
          </div>

          <div>
            <p className="text-2xl font-bold">
              {replies}
            </p>

            <p className="text-sm text-muted-foreground">
              Respostas
            </p>
          </div>

          <div>
            <p className="text-2xl font-bold">
              {favorites}
            </p>

            <p className="text-sm text-muted-foreground">
              Favoritos
            </p>
          </div>

        </div>

      </CardContent>

    </Card>
  );
}