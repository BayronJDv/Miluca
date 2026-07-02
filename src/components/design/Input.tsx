import { colors } from "./colors";
import { Icon, IconName } from "./Icon";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  icon?: IconName;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  style?: React.CSSProperties;
}

export const Input = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  type = "text",
  disabled = false, 
  icon, 
  onKeyDown, 
  style 
}: InputProps) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {label && (
      <label style={{ 
        fontSize: 12, 
        fontWeight: 600, 
        letterSpacing: "0.04em", 
        color: disabled ? colors.outline : colors.onSurfaceVariant 
      }}>
        {label}
      </label>
    )}
    <div style={{ position: "relative" }}>
      {icon && (
        <span style={{ 
          position: "absolute", 
          left: 10, 
          top: "50%", 
          transform: "translateY(-50%)", 
          color: disabled ? colors.outline : colors.outline,
          display: "flex" 
        }}>
          <Icon name={icon} size={16} />
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled} // <-- ¡IMPORTANTE! Aquí se usa la prop
        style={{
          width: "100%",
          height: 40,
          padding: icon ? "0 12px 0 34px" : "0 12px",
          border: `1px solid ${disabled ? colors.outline : colors.outlineVariant}`,
          borderRadius: 8,
          fontSize: 14,
          color: disabled ? colors.outline : colors.onSurface,
          background: disabled ? colors.surfaceLow : "#fff", 
          cursor: disabled ? "not-allowed" : "text", 
          transition: "all 0.15s",
          fontFamily: "inherit",
          opacity: disabled ? 0.7 : 1, 
          ...style,
        }}
        onFocus={(e) => {
          if (!disabled) { 
            e.currentTarget.style.borderColor = colors.primary;
            e.currentTarget.style.outline = "none";
          }
        }}
        onBlur={(e) => {
          if (!disabled) { 
            e.currentTarget.style.borderColor = colors.outlineVariant;
          }
        }}
      />
    </div>
  </div>
);