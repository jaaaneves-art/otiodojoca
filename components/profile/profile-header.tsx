import { UserAvatar } from "./user-avatar";

interface Props {
  profile: any;
  email?: string;
}

export function ProfileHeader({ profile, email }: Props) {
  return (
    <div className="flex items-center gap-5">
      <UserAvatar
        name={profile?.display_name}
        email={email}
        size={90}
      />
      <div>
        <h1 className="text-3xl font-bold">
          {profile?.display_name || "Utilizador"}
        </h1>
        <p className="text-muted-foreground">
          @{profile?.username || "sem_username"}
        </p>
      </div>
    </div>
  );
}
