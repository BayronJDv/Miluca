import styles from './QuickAccess.module.css';

const quickActions = [
  { label: 'Terminal POS', icon: 'point_of_sale', color: 'primary', bg: 'bg-primary-container/10', hoverBg: 'hover:bg-primary-container/20' },
  { label: 'Inventario', icon: 'inventory_2', color: 'secondary', bg: 'bg-secondary-container/20', hoverBg: 'hover:bg-secondary-container/30' },
  { label: 'Reportes', icon: 'analytics', color: 'surface', bg: 'bg-surface-container-high', hoverBg: 'hover:bg-surface-container-highest' }
];

function QuickAccess() {
  return (
    <section className="bg-white p-lg rounded-xl shadow-sm border border-[#E2E8F0]">
      <h3 className="font-headline-sm text-headline-sm mb-xl">Accesos Rápidos</h3>
      <div className="grid grid-cols-3 gap-md">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className={`flex flex-col items-center gap-sm p-lg ${action.bg} rounded-xl ${action.hoverBg} transition-all group`}
          >
            <span className={`material-symbols-outlined text-3xl transition-transform group-hover:scale-110 text-${action.color}`}>
              {action.icon}
            </span>
            <span className={`font-label-md text-label-md text-${action.color}`}>{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickAccess;