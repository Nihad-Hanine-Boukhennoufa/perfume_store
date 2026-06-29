import { AlertCircle } from 'lucide-react';

const DeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productName,  // Keep for backwards compatibility
  itemName,     // New generic prop
  itemType = "item", 
  isLoading 
}) => {
  if (!isOpen) return null;

  // Use itemName if provided, otherwise fall back to productName
  const displayName = itemName || productName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Confirm Delete</h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete{" "}
          {displayName ? (
            <span className="font-semibold">"{displayName}"</span>
          ) : (
            `this ${itemType}`
          )}? 
          This action cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;