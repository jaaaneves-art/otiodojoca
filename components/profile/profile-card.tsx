import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Mail, MapPin, User } from "lucide-react";
import { UserAvatar } from "./user-avatar";

interface ProfileCardProps {
  profile: any;
  email?: string;
}

export function ProfileCard({ profile, email }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-6">
          <UserAvatar
            name={profile?.display_name}
            email={email}
          />

          <div>
            <CardTitle>
              {profile?.display_name || "Utilizador"}
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              @{profile?.username || "sem_username"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">

        <div className="flex items-center gap-2">
          <Mail size={18} />
          <span>{email}</span>
        </div>

        <div className="flex items-center gap-2">
          <User size={18} />
          <span>{profile?.username || "—"}</span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin size={18} />
          <span>{profile?.location || "Sem localização"}</span>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Biografia
          </p>

          <p>
            {profile?.bio || "Sem biografia."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Heart size={18} />
          <span>
            Reputação: {profile?.reputation ?? 0}
          </span>
        </div>

        <Button asChild className="w-full">
          <Link href="/perfil/editar">
            Editar Perfil
          </Link>
        </Button>

      </CardContent>
    </Card>
  );
}