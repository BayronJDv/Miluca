import { Icon, IconName } from "./Icon";
import styles from "./Input.module.css";

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
  <div className={styles.wrapper}>
    {label && (
      <label className={`${styles.label} ${disabled ? styles.labelDisabled : ""}`}>
        {label}
      </label>
    )}
    <div className={styles.field}>
      {icon && (
        <span className={styles.icon}>
          <Icon name={icon} size={16} />
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className={`${styles.input} ${icon ? styles.inputWithIcon : ""} ${disabled ? styles.inputDisabled : ""}`}
        style={style}
      />
    </div>
  </div>
);
