import React, { useEffect, useState } from 'react';
import { Receipt, AlertCircle, Loader2 } from 'lucide-react';
import { getAuthHeaders } from '../utils/authStore';

interface ProtectedReceiptImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const ProtectedReceiptImage: React.FC<ProtectedReceiptImageProps> = ({
  src,
  alt,
  className = 'w-full h-48 object-cover rounded-xl'
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    const loadReceipt = async () => {
      if (!src) {
        setLoading(false);
        setError(true);
        return;
      }

      if (src.startsWith('data:image/') || src.startsWith('/uploads/')) {
        setObjectUrl(src);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const res = await fetch(src, {
          headers: {
            ...getAuthHeaders()
          }
        });
        if (!res.ok) {
          throw new Error('Failed to load protected receipt');
        }
        const blob = await res.blob();
        createdUrl = URL.createObjectURL(blob);
        if (active) {
          setObjectUrl(createdUrl);
          setLoading(false);
        } else {
          URL.revokeObjectURL(createdUrl);
        }
      } catch {
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadReceipt();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 text-gray-500 gap-2 ${className}`}
      >
        <Loader2 size={20} className="animate-spin" />
        <span className="text-xs font-medium">Loading receipt...</span>
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 text-gray-500 gap-1.5 border border-gray-200 ${className}`}
      >
        {error ? <AlertCircle size={20} className="text-amber-500" /> : <Receipt size={20} />}
        <span className="text-xs font-medium">Receipt image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={objectUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
};
