interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  size?: number;
  imageUrl?: string | null;
}

export function UserAvatar({
  name,
  email,
  size = 72,
  imageUrl,
}: UserAvatarProps) {
  const initials =
    name
      ?.trim()
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase() ||
    email?.substring(0, 2).toUpperCase() ||
    "U";

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || "Avatar"}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "3px solid #8c6b40",
          boxShadow: "0 4px 10px rgba(0,0,0,.15)",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #8c6b40 0%, #6b5033 100%)",
        color: "#ffffff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontWeight: 700,
        fontSize: `${size * 0.42}px`,
        userSelect: "none",
        boxShadow: "0 4px 10px rgba(0,0,0,.15)",
        border: "3px solid #ffffff",
      }}
    >
      {initials}
    </div>
  );
}