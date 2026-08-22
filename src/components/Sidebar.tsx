import { NavLink } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { confirm } from '@tauri-apps/plugin-dialog';
import { isAdminAtom } from '../store/UserAtom';
import { useAtomValue } from 'jotai';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/pos', label: 'POS', icon: 'point_of_sale' },
  { path: '/inventario', label: 'Inventario', icon: 'inventory_2' },
  { path: '/vencimientos', label: 'Vencimientos', icon: 'warning' },
  { path: '/kardex', label: 'Kardex', icon: 'history' },
  { path: '/bajas', label: 'Bajas', icon: 'delete_sweep', adminOnly: true },
  { path: '/proveedores', label: 'Proveedores', icon: 'local_shipping' },
  { path: '/compras', label: 'Compras', icon: 'shopping_cart' },
  //{ path: '/analisis', label: 'Análisis', icon: 'bar_chart', adminOnly: true },
  { path: '/historial-compras', label: 'Historial Compras', icon: 'receipt_long' },
  { path: '/historial-ventas', label: 'Historial Ventas', icon: 'receipt' },
  { path: '/historial-ediciones', label: 'Historial Ediciones', icon: 'receipt_long', adminOnly: true },
  { path: '/reportes', label: 'Reportes', icon: 'analytics', adminOnly: true },
  { path: '/configuracion', label: 'Configuración', icon: 'settings', adminOnly: true },  
];

function Sidebar() {
  const isAdmin = useAtomValue(isAdminAtom);
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-[#1E293B] flex flex-col py-lg px-md z-50">
      {/* Logo ... */}
      <nav className="flex-1 space-y-1">
        {menuItems.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-md p-sm text-white transition-all duration-200 ${
                isActive
                  ? 'opacity-100 font-semibold border-l-4 border-primary bg-surface-variant/10'
                  : 'opacity-70 hover:opacity-100 hover:bg-surface-variant/5'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-body-md text-body-md">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {/* Botón cerrar sesión ... */}
      <button
        onClick={async () => {
          const confirmed = await confirm('¿Estás seguro de que deseas cerrar el programa?', { title: 'Cerrar programa', kind: 'warning' });
          if (confirmed) {
            invoke('close_app');
          }
        }}
        className="mt-auto flex items-center justify-center gap-md p-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-all duration-200"
      >
        <span className="material-symbols-outlined">power_settings_new</span>
        <span className="font-body-md text-body-md">Cerrar programa</span>
      </button>
    </aside>
  );
}

export default Sidebar;
