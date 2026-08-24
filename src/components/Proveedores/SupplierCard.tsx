import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './SupplierCard.module.css';

interface SupplierCardProps {
  name: string;
  phone: string;
  imageUrl?: string | null;
  icon?: string;
  initials?: string;
  nit?: string | null;
  address?: string | null;
  email?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

const SupplierCard: React.FC<SupplierCardProps> = ({ name, phone, imageUrl, icon, initials, nit, address, email, onEdit, onDelete }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(!!imageUrl);

  useEffect(() => {
    if (!imageUrl) {
      setImgSrc(null);
      setLoadingImg(false);
      return;
    }

    if (imageUrl.startsWith('/suppliers/')) {
      invoke<string>('get_supplier_image_base64', { path: imageUrl })
        .then(setImgSrc)
        .catch(() => setImgSrc(null))
        .finally(() => setLoadingImg(false));
    } else {
      setImgSrc(imageUrl);
      setLoadingImg(false);
    }
  }, [imageUrl]);

  return (
    <div className={styles.card}>
      <div className={styles.avatar}>
        {loadingImg ? (
          <div className={styles.avatarLoading} />
        ) : imgSrc ? (
          <img src={imgSrc} alt={name} className={styles.avatarImg} />
        ) : icon ? (
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
