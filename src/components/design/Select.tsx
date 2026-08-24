import { Icon, IconName } from "./Icon";
import styles from "./Select.module.css";

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
  <div className={styles.wrapper}>
    {label && (
      <label className={styles.label}>
        {label}
      </label>
    )}
    <div className={styles.field}>
      {icon && (
        <span className={styles.icon}>
          <Icon name={icon} size={16} />
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${styles.select} ${icon ? styles.selectWithIcon : ""} ${!value ? styles.selectPlaceholder : ""}`}
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
      <span className={styles.chevron}>
        <Icon name="chevron_down" size={16} />
      </span>
    </div>
  </div>
);
