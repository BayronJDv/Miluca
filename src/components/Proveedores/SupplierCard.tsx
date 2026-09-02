import React from 'react';
import styles from './SupplierCard.module.css';

interface SupplierCardProps {
  name: string;
  phone: string;
  icon?: string;
  initials?: string;
  nit?: string | null;
  address?: string | null;
  email?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

const SupplierCard: React.FC<SupplierCardProps> = ({ name, phone, icon, initials, nit, address, email, onEdit, onDelete }) => {
  return (
    <div className={styles.card}>
      <div className={styles.avatar}>
        {icon ? (
          <span className={`material-symbols-outlined ${styles.avatarIcon}`}>{icon}</span>
        ) : (
          <span className={styles.avatarInitials}>{initials}</span>
        )}
      </div>
      <h4 className={styles.name}>{name}</h4>
      {phone && (
        <p className={styles.infoLine}>
          <span className={`material-symbols-outlined ${styles.infoIcon}`}>call</span>
          {phone}
        </p>
      )}
      {nit && (
        <p className={styles.infoLineSm}>
          <span className={`material-symbols-outlined ${styles.infoIcon}`}>receipt_long</span>
          NIT: {nit}
        </p>
      )}
      {email && (
        <p className={styles.infoLineSmBreak}>
          <span className={`material-symbols-outlined ${styles.infoIcon}`}>mail</span>
          {email}
        </p>
      )}
      {address && (
        <p className={styles.infoLineSm}>
          <span className={`material-symbols-outlined ${styles.infoIcon}`}>location_on</span>
          {address}
        </p>
      )}
      <div className={styles.actions}>
        <button onClick={onEdit} className={styles.btnEdit}>
          Editar
        </button>
        <button onClick={onDelete} className={styles.btnDelete}>
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default SupplierCard;
