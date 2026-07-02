function FAB() {
  const handleClick = () => {
    console.log('FAB Clicked - Acción rápida');
    // Aquí puedes agregar la lógica para abrir un modal, crear nuevo registro, etc.
  };

  return (
    <button 
      onClick={handleClick}
      className="fixed bottom-lg right-lg w-14 h-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
    >
      <span className="material-symbols-outlined text-3xl transition-transform group-hover:rotate-90">
        add
      </span>
    </button>
  );
}

export default FAB;