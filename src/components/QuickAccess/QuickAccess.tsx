import { useNavigate } from 'react-router-dom';
import { isAdminAtom } from '../../store/UserAtom';
import { useAtomValue } from 'jotai';

const quickActions = [
  { label: 'Terminal POS', icon: 'point_of_sale', variant: 'primary', path: '/pos' },
  { label: 'Inventario', icon: 'inventory_2', variant: 'secondary', path: '/inventario' },
  { label: 'Reportes', icon: 'analytics', variant: 'surface', path: '/reportes' }
];

function QuickAccess() {
  const navigate = useNavigate();
  const isAdmin = useAtomValue(isAdminAtom);

  const visibleActions = isAdmin
    ? quickActions
    : quickActions.filter(action => action.label !== 'Reportes');

  return (
    <section className="quick-access-panel">
      <h3 className="quick-access-title">Accesos Rápidos</h3>
      <div className="quick-access-grid">
        {visibleActions.map((action, index) => (
          <button
            key={index}
            onClick={() => navigate(action.path)}
            className={`quick-access-btn quick-access-${action.variant} group`}
          >
            <span className="material-symbols-outlined">{action.icon}</span>
            <span className="quick-access-btn-label">{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickAccess;