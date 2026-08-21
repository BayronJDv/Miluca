import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

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
    <div className="bg-white p-lg rounded-xl flex flex-col items-center text-center transition-all hover:shadow-md border border-outline-variant card-shadow">
      <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden mb-md">
        {loadingImg ? (
          <div className="w-full h-full bg-surface-container-high animate-pulse rounded-full" />
        ) : imgSrc ? (
          <img src={imgSrc} alt={name} className="w-full h-full object-cover" />
        ) : icon ? (
          <span className="material-symbols-outlined text-outline text-4xl">{icon}</span>
        ) : (
          <span className="text-primary-container font-bold text-2xl">{initials}</span>
        )}
      </div>
      <h4 className="font-headline-sm text-headline-sm text-on-surface mb-xs">{name}</h4>
      {phone && (
        <p className="text-body-md text-secondary flex items-center justify-center">
          <span className="material-symbols-outlined text-sm mr-xs">call</span>
          {phone}
        </p>
      )}
      {nit && (
        <p className="text-body-sm text-secondary flex items-center justify-center">
          <span className="material-symbols-outlined text-sm mr-xs">receipt_long</span>
          NIT: {nit}
        </p>
      )}
      {email && (
        <p className="text-body-sm text-secondary flex items-center justify-center break-all">
          <span className="material-symbols-outlined text-sm mr-xs">mail</span>
          {email}
        </p>
      )}
      {address && (
        <p className="text-body-sm text-secondary flex items-center justify-center">
          <span className="material-symbols-outlined text-sm mr-xs">location_on</span>
          {address}
        </p>
      )}
      <div className="mt-lg pt-md border-t border-outline-variant w-full flex justify-center gap-md">
        <button onClick={onEdit} className="text-primary hover:text-primary-container font-label-md text-label-md">
          Editar
        </button>
        <button onClick={onDelete} className="text-error hover:text-red-700 font-label-md text-label-md">
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default SupplierCard;
