import React from 'react';
import { colors } from "./colors";
import { Icon } from "./Icon";

interface BtnProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const Btn: React.FC<BtnProps> = ({ children, variant = "primary", icon, onClick, style: s = {}, disabled }) => {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "0 20px",
    height: 40,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    transition: "all 0.15s",
    opacity: disabled ? 0.5 : 1,
  };
  
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: colors.primary, color: "#fff" },
    ghost: { background: "transparent", color: colors.primary, border: `1px solid ${colors.outlineVariant}` },
    danger: { background: colors.error, color: "#fff" },
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-${variant}`}
      style={{ ...base, ...variants[variant], ...s }}
    >
      {icon && <Icon name={icon} size={16} color={variant === "ghost" ? colors.primary : "#fff"} />}
      {children}
    </button>
  );
};

export default Btn;