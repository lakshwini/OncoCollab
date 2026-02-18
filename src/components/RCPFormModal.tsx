import React from 'react';
import { X } from 'lucide-react';
import { RCPFormUnified } from './RCPFormUnified';

interface RCPFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName?: string;
  authToken: string | null;
  onSuccess?: () => void;
}

export function RCPFormModal({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  authToken,
  onSuccess,
}: RCPFormModalProps) {
  if (!isOpen) return null;

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <>
      {/* BACKDROP RESPONSIVE */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      />

      {/* MODAL RESPONSIVE */}
      <div
        className={`
          fixed z-50
          top-0 left-0 right-0 bottom-0
          md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2
          md:w-auto md:h-auto
          w-full h-full md:max-w-2xl md:max-h-[90vh]
          rounded-none md:rounded-xl
          bg-white shadow-xl
          flex flex-col
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden md:absolute"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {/* FORM */}
        <RCPFormUnified
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          authToken={authToken}
          onSuccess={handleSuccess}
          onCancel={onClose}
          displayMode="modal"
        />
      </div>
    </>
  );
}
