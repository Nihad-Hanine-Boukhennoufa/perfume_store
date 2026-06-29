
const CartItem = ({ item, onRemove, onUpdate }) => {
  const { productId, quantity } = item;

  const handleDecrement = () => {
    if (quantity > 1) onUpdate(productId._id, quantity - 1);
  };

  const handleIncrement = () => {
    onUpdate(productId._id, quantity + 1);
  };

  return (
    <div className="flex items-center gap-4 border rounded p-4">
      {/* صورة المنتج */}
      <img
        src={`http://localhost:3000/uploads/${productId.image}`}
        alt={productId.name}
        className="w-24 h-24 object-cover rounded"
      />

      {/* معلومات المنتج */}
      <div className="flex-1 flex flex-col gap-1">
        <h2 className="font-bold">{productId.name}</h2>
        <p className="text-gray-600">{productId.brand}</p>
        <p className="font-semibold">${productId.price.toFixed(2)}</p>

        {/* تعديل الكمية */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleDecrement}
            className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
          >
            -
          </button>
          <span className="px-2">{quantity}</span>
          <button
            onClick={handleIncrement}
            className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
          >
            +
          </button>
        </div>
      </div>

      {/* زر إزالة المنتج */}
      <button
        onClick={() => onRemove(productId._id)}
        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Remove
      </button>
    </div>
  );
};

export default CartItem;
