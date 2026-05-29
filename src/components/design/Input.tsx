// components/Login/Input.tsx
import { colors } from "./colors";
import { Icon } from "./Icon";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  style?: React.CSSProperties; // Añadir esto
}

export const Input = ({ label, placeholder, value, onChange, type = "text", icon, onKeyDown, style }: InputProps) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {label && (
      <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", color: colors.onSurfaceVariant }}>
        {label}
      </label>
    )}
    <div style={{ position: "relative" }}>
      {icon && (
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: colors.outline, display: "flex" }}>
          <Icon name={icon} size={16} />
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        style={{
          width: "100%",
          height: 40,
          padding: icon ? "0 12px 0 34px" : "0 12px",
          border: `1px solid ${colors.outlineVariant}`,
          borderRadius: 8,
          fontSize: 14,
          color: colors.onSurface,
          background: "#fff",
          transition: "all 0.15s",
          fontFamily: "inherit",
          ...style, // Esto permite sobrescribir/mergear estilos externos
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = colors.primary;
          e.currentTarget.style.outline = "none";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = colors.outlineVariant;
        }}
      />
    </div>
  </div>
);