import { colors } from "./colors";

interface ChipProps {
  color?: "blue" | "green" | "red" | "amber" | "gray";
  children: React.ReactNode;
}

export const Chip = ({ color = "blue", children }: ChipProps) => {
  const colores = {
    blue: { bg: "#dbeafe", text: "#1d4ed8" },
    green: { bg: colors.greenBg, text: colors.green },
    red: { bg: colors.redBg, text: colors.red },
    amber: { bg: colors.amberBg, text: colors.amber },
    gray: { bg: colors.surfaceHighest, text: colors.secondary },
  } as const;

  const s = colores[color] || colores.gray;
  
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        background: s.bg,
        color: s.text,
      }}
    >
      {children}
    </span>
  );
};