import React from 'react';
import styles from './SummaryCard.module.css';

function SummaryCard() {
  return (
    <section className="bg-primary p-lg rounded-xl shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-2xl"></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="max-w-[70%]">
          <h4 className="text-white font-headline-sm text-headline-sm mb-xs">Resumen Mensual Listo</h4>
          <p className="text-white/80 text-body-sm font-body-sm">
            Tu reporte de rendimiento operacional para el mes de Octubre ya está disponible para revisión.
          </p>
          <button className="mt-lg px-md py-sm bg-white text-primary rounded-lg font-label-md text-label-md hover:bg-primary-fixed transition-all hover:scale-105 active:scale-95">
            Revisar Ahora
          </button>
        </div>
        <span className="material-symbols-outlined text-white/20 text-[80px] transition-transform group-hover:scale-110 group-hover:rotate-12">
          insights
        </span>
      </div>
    </section>
  );
}

export default SummaryCard;