import styles from "./Chip.module.css";

interface ChipProps {
  color?: "blue" | "green" | "red" | "amber" | "gray";
  children: React.ReactNode;
}

const colorClass = {
  blue: styles.blue,
  green: styles.green,
  red: styles.red,
  amber: styles.amber,
  gray: styles.gray,
};

export const Chip = ({ color = "blue", children }: ChipProps) => (
  <span className={`${styles.chip} ${colorClass[color] || styles.gray}`}>
    {children}
  </span>
);
