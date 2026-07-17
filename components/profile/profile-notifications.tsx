import Link from "next/link";
import { Bell } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  notifications: any[];
}

export function ProfileNotifications({
  notifications,
}: Props) {

  return (

    <Card>

      <CardHeader>

        <CardTitle className="flex items-center gap-2">

          <Bell size={18}/>

          Notificações

        </CardTitle>

      </CardHeader>

      <CardContent>

        {notifications.length === 0 ? (

          <p className="text-sm text-muted-foreground">

            Sem notificações.

          </p>

        ) : (

          <div className="space-y-3">

            {notifications.map((n) => (

              <div
                key={n.id}
                className="rounded-lg border p-3"
              >

                <p>{n.message}</p>

                {n.link && (

                  <Link
                    href={n.link}
                    className="text-sm text-blue-600"
                  >

                    Ver

                  </Link>

                )}

              </div>

            ))}

          </div>

        )}

      </CardContent>

    </Card>

  );

}