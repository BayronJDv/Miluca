import { colors } from "./colors";
import { Icon, IconName } from "./Icon"; // Importar IconName

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon?: IconName;
}

export const Select = ({ label, placeholder, value, onChange, options, icon }: SelectProps) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {label && (
      <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", color: colors.onSurfaceVariant }}>
        {label}
      </label>
    )}
    <div style={{ position: "relative" }}>
      {icon && (
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: colors.outline, display: "flex", zIndex: 1 }}>
          <Icon name={icon} size={16} />
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: 40,
          padding: icon ? "0 12px 0 34px" : "0 12px",
          border: `1px solid ${colors.outlineVariant}`,
          borderRadius: 8,
          fontSize: 14,
          color: value ? colors.onSurface : colors.outline,
          background: "#fff",
          transition: "all 0.15s",
          fontFamily: "inherit",
          cursor: "pointer",
          appearance: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = colors.primary;
          e.currentTarget.style.outline = "none";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = colors.outlineVariant;
        }}
      >
        <option value="" disabled>
          {placeholder || "Seleccionar"}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: colors.outline,
          display: "flex",
          pointerEvents: "none",
        }}
      >
        <Icon name="chevron_down" size={16} />
      </span>
    </div>
  </div>
);