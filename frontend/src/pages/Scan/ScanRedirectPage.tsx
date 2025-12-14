import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const ScanRedirectPage = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (uuid) {
      // Redirect to the detail page
      navigate(`/equipment/${uuid}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [uuid, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-500">正在導向設備頁面...</div>
    </div>
  );
};
