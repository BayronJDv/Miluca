import PropTypes from 'prop-types';
import styles from './KPICard.module.css';

interface KPICardProps {
  title: string;
  value: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  variant?: 'primary' | 'secondary' | 'error' | 'neutral';
}

const variantClass = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  error: styles.variantError,
  neutral: styles.variantNeutral,
};

function KPICard({
  title,
  value,
  icon,
  trend,
  trendUp,
  variant = 'primary'
}: KPICardProps) {
  return (
    <div className={`${styles.card} ${variantClass[variant]}`}>
      <div className={styles.top}>
        <div className={styles.icon}>
          <span className="material-symbols-outlined icon-md">{icon}</span>
        </div>
        {trend && (
          <div className={styles.trend}>
            {trendUp !== null && (
              <span className="material-symbols-outlined icon-sm">
                {trendUp ? 'trending_up' : 'trending_down'}
              </span>
            )}
            {trend}
          </div>
        )}
      </div>
      <p className={styles.label}>{title}</p>
      <h3 className={styles.value}>{value}</h3>
    </div>
  );
}

KPICard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  trend: PropTypes.string,
  trendUp: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'error', 'neutral'])
};

export default KPICard;
