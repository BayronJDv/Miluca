import { useNavigate } from 'react-router-dom';
import { isAdminAtom } from '../../store/UserAtom';
import { useAtomValue } from 'jotai';
import styles from './QuickAccess.module.css';

const quickActions = [
  { label: 'Terminal POS', icon: 'point_of_sale', variant: 'primary', path: '/pos' },
  { label: 'Inventario', icon: 'inventory_2', variant: 'secondary', path: '/inventario' },
  { label: 'Reportes', icon: 'analytics', variant: 'surface', path: '/reportes' }
] as const;

const variantClass = {
  primary: styles.primary,
  secondary: styles.secondary,
  surface: styles.surface,
};

function QuickAccess() {
  const navigate = useNavigate();
  const isAdmin = useAtomValue(isAdminAtom);

  const visibleActions = isAdmin
    ? quickActions
    : quickActions.filter(action => action.label !== 'Reportes');

  return (
    <section className={styles.panel}>
      <h3 className={styles.title}>Accesos Rápidos</h3>
      <div className={styles.grid}>
        {visibleActions.map((action, index) => (
          <button
            key={index}
            onClick={() => navigate(action.path)}
            className={`${styles.btn} ${variantClass[action.variant]}`}
          >
            <span className="material-symbols-outlined">{action.icon}</span>
            <span className={styles.btnLabel}>{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickAccess;
