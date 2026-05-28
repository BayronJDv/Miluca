import PropTypes from 'prop-types';
import styles from './KPICard.module.css';

const variantConfig = {
  primary: {
    iconBg: 'bg-primary-container/10',
    iconColor: 'text-primary',
    trendBg: 'bg-green-100',
    trendText: 'text-green-700'
  },
  secondary: {
    iconBg: 'bg-secondary-container/20',
    iconColor: 'text-secondary',
    trendBg: 'bg-surface-container',
    trendText: 'text-secondary'
  },
  error: {
    iconBg: 'bg-error-container',
    iconColor: 'text-error',
    trendBg: 'bg-error-container/50',
    trendText: 'text-error'
  },
  neutral: {
    iconBg: 'bg-surface-container-highest',
    iconColor: 'text-on-surface',
    trendBg: 'bg-surface-container',
    trendText: 'text-secondary'
  }
};

function KPICard({ title, value, icon, trend, trendUp, variant = 'primary' }) {
  const config = variantConfig[variant];

  return (
    <div className="bg-white p-lg rounded-xl shadow-sm border border-[#E2E8F0] hover:border-primary transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex justify-between items-start mb-md">
        <div className={`p-sm ${config.iconBg} ${config.iconColor} rounded-lg`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {trend && (
          <div className={`flex items-center px-xs py-[2px] rounded text-[10px] font-bold ${config.trendBg} ${config.trendText}`}>
            {trendUp !== null && (
              <span className="material-symbols-outlined text-xs">
                {trendUp ? 'trending_up' : 'trending_down'}
              </span>
            )}
            {trend}
          </div>
        )}
      </div>
      <p className="text-secondary font-label-md text-label-md">{title}</p>
      <h3 className="font-headline-md text-headline-md text-on-surface mt-xs">{value}</h3>
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