interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const getColor = (str: string): string => {
  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
    "bg-teal-100 text-teal-700",
    "bg-red-100 text-red-700",
    "bg-indigo-100 text-indigo-700",
    "bg-yellow-100 text-yellow-700",
    "bg-cyan-100 text-cyan-700",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name?: string | null, email?: string | null): string => {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
};

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export const UserAvatar = ({ name, email, size = "md", className = "" }: UserAvatarProps) => {
  const initials = getInitials(name, email);
  const colors = getColor(name || email || "default");

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold shrink-0 ${sizeClasses[size]} ${colors} ${className}`}
      title={name || email || "Unknown"}
    >
      {initials}
    </div>
  );
};