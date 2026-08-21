import PropTypes from 'prop-types';

interface KPICardProps {
  title: string;
  value: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  variant?: 'primary' | 'secondary' | 'error' | 'neutral';
}

function KPICard({
  title,
  value,
  icon,
  trend,
  trendUp,
  variant = 'primary'
}: KPICardProps) {
  return (
    <div className={`kpi-card kpi-variant-${variant}`}>
      <div className="kpi-card-top">
        <div className="kpi-card-icon">
          <span className="material-symbols-outlined icon-md">{icon}</span>
        </div>
        {trend && (
          <div className="kpi-card-trend">
            {trendUp !== null && (
              <span className="material-symbols-outlined icon-sm">
                {trendUp ? 'trending_up' : 'trending_down'}
              </span>
            )}
            {trend}
          </div>
        )}
      </div>
      <p className="kpi-card-label">{title}</p>
      <h3 className="kpi-card-value">{value}</h3>
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