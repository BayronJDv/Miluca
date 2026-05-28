import React, { useState } from 'react';
import styles from './TopNav.module.css';

function TopNav() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <header className="h-16 fixed top-0 right-0 left-64 bg-surface flex justify-between items-center px-lg w-full z-40 border-b border-outline-variant">
      <div className="flex items-center bg-surface-container rounded-full px-md py-xs w-96 transition-all duration-200 focus-within:shadow-md">
        <span className="material-symbols-outlined text-outline">search</span>
        <input
          type="text"
          className="bg-transparent border-none focus:ring-0 text-body-md w-full ml-sm outline-none"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-lg">
        <button className="relative p-xs text-secondary hover:text-primary transition-colors cursor-pointer active:scale-95 transition-transform">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
        </button>

        <button className="p-xs text-secondary hover:text-primary transition-colors cursor-pointer active:scale-95 transition-transform">
          <span className="material-symbols-outlined">help_outline</span>
        </button>

        <div className="flex items-center gap-md border-l border-outline-variant pl-lg">
          <div className="text-right">
            <p className="font-label-md text-label-md text-on-surface">Administrador</p>
            <p className="text-[10px] text-secondary">Perfil de Gestión</p>
          </div>
          <img
            alt="Avatar de Administrador"
            className="w-10 h-10 rounded-full object-cover border border-outline-variant"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGGMEfYj3vU7HN6ryW0AtHaHzmnd8PcvR5PLVvsHOHYX-d1eKOQDqdwonAc9PPFzA2r3LWLvBb_Vz5qFw6M85OHMU-fZeHJKjrJ1BWnQTmxSOhZzvA6T20L71Ax0zKWVW8BuXSct7CCDNORN6nHiXVfJbm2GWw9Ta602yzQBhgVuG-QoQKJE1D7-gxs7GD30vx4fctKf8KL5Neo8A6nr88HMZ0Ra34z8e_asGDzeZlIOMZ_STGgHyfLiNlHtFirj9mb2nLm_CCOpUv"
          />
        </div>
      </div>
    </header>
  );
}

export default TopNav;