import clsx from "clsx";

const PALETTE = [
  { bg: "#f3e6eb", fg: "#71324b" },
  { bg: "#e2ebe1", fg: "#3c5740" },
  { bg: "#fef3c7", fg: "#92400e" },
  { bg: "#dbeafe", fg: "#1e40af" },
  { bg: "#fae8ff", fg: "#86198f" },
  { bg: "#fee2e2", fg: "#991b1b" },
  { bg: "#e0f2fe", fg: "#075985" },
  { bg: "#ffedd5", fg: "#9a3412" },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

export default function Avatar({
  nombre,
  apellido,
  size = "md",
  className,
}: {
  nombre: string;
  apellido: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const initials = (apellido[0] ?? "") + (nombre[0] ?? "");
  const c = PALETTE[hash(nombre + apellido) % PALETTE.length];
  const sizes: Record<string, string> = {
    sm: "w-7 h-7 text-[11px]",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };
  return (
    <span
      className={clsx("avatar", sizes[size], className)}
      style={{ background: c.bg, color: c.fg }}
      aria-hidden
    >
      {initials.toUpperCase()}
    </span>
  );
}
