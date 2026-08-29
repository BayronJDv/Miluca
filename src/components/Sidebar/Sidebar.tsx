import { NavLink } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { confirm } from '@tauri-apps/plugin-dialog';
import { isAdminAtom } from '../../store/UserAtom';
import { useAtom, useAtomValue } from 'jotai';
import { themeAtom, toggleThemeAtom } from '../../store/ThemeAtom';
import styles from './Sidebar.module.css';



const menuItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/pos', label: 'POS', icon: 'point_of_sale' },
  { path: '/inventario', label: 'Inventario', icon: 'inventory_2' },
  { path: '/vencimientos', label: 'Vencimientos', icon: 'warning' },
  { path: '/kardex', label: 'Kardex', icon: 'history' },
  { path: '/bajas', label: 'Bajas', icon: 'delete_sweep', adminOnly: true },
  { path: '/proveedores', label: 'Proveedores & clientes', icon: 'local_shipping' },
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
  const theme = useAtomValue(themeAtom);
  const [, toggleTheme] = useAtom(toggleThemeAtom);
  const isDark = theme === 'dark';
  return (
    <aside className={styles.sidebar}>
      {/* Logo ... */}
      <nav className={styles.nav}>
        {menuItems.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.sidebarLink} ${isActive ? styles.active : styles.idle}`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-body-md text-body-md">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        onClick={() => toggleTheme()}
        className={styles.themeToggle}
        aria-label="Cambiar tema"
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
      >
        <span className={`${styles.themeTrack} ${isDark ? styles.themeTrackDark : ''}`}>
          <span className={`${styles.themeThumb} ${isDark ? styles.themeThumbDark : ''}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{isDark ? 'dark_mode' : 'light_mode'}</span>
          </span>
        </span>
        <span>{isDark ? 'Modo espacial' : 'Modo claro'}</span>
      </button>

      {/* Botón cerrar sesión ... */}
      <button
        onClick={async () => {
          const confirmed = await confirm('¿Estás seguro de que deseas cerrar el programa?', { title: 'Cerrar programa', kind: 'warning' });
          if (confirmed) {
            invoke('close_app');
          }
        }}
        className={styles.logoutBtn}
      >
        <span className="material-symbols-outlined">power_settings_new</span>
        <span className="font-body-md text-body-md">Cerrar programa</span>
      </button>
    </aside>
  );
}

export default Sidebar;
