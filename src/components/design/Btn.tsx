import React from 'react';
import { Icon, IconName } from "./Icon";
import styles from "./Btn.module.css";

interface BtnProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: IconName;
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const variantClass = {
  primary: styles.btnPrimary,
  ghost: styles.btnGhost,
  danger: styles.btnDanger,
};

const Btn: React.FC<BtnProps> = ({ children, variant = "primary", icon, onClick, style: s, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${styles.btn} ${variantClass[variant]}`}
      style={s}
    >
      {icon && <Icon name={icon} size={16} color={variant === "ghost" ? "var(--color-primary)" : "var(--color-on-primary)"} />}
      {children}
    </button>
  );
};

export default Btn;
