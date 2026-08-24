import styles from './FAB.module.css';

function FAB() {
  const handleClick = () => {
    console.log('FAB Clicked - Acción rápida');
  };

  return (
    <button onClick={handleClick} className={styles.fab}>
      <span className="material-symbols-outlined">add</span>
    </button>
  );
}

export default FAB;
