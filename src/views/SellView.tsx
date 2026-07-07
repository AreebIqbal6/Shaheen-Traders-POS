import React, { useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  color: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function SellView() {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Mock Products based on screenshots
  const products: Product[] = [
    { id: 1, name: 'Chocolate Brownie', price: 4.50, color: 'bg-[#6b4c3a]' },
    { id: 2, name: 'Freshly Squeezed Juice', price: 3.50, color: 'bg-[#d48c3b]' },
    { id: 3, name: 'Bottled Water', price: 2.00, color: 'bg-[#3b82d4]' },
    { id: 4, name: 'Espresso', price: 2.50, color: 'bg-[#402a1e]' },
    { id: 5, name: 'Latte', price: 3.50, color: 'bg-[#8c6751]' },
    { id: 6, name: 'Sandwich', price: 6.00, color: 'bg-[#2e5939]' },
  ];

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex w-full h-full text-white bg-[#151515]">
      {/* 70% Product Grid Area */}
      <div className="w-[70%] h-full flex flex-col p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Quick Keys</h2>
        <div className="grid grid-cols-3 gap-4">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className={`h-32 rounded-lg flex flex-col justify-center items-center p-4 transition-transform active:scale-95 shadow-md ${product.color}`}
            >
              <span className="font-semibold text-lg text-center text-white drop-shadow-md">{product.name}</span>
              <span className="mt-2 font-bold text-white drop-shadow-md">${product.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 30% Cart Area */}
      <div className="w-[30%] h-full bg-[#1c1c1c] border-l border-[#2d2d2d] flex flex-col">
        {/* Customer Search */}
        <div className="p-4 border-b border-[#2d2d2d]">
          <input 
            type="text" 
            placeholder="Add a customer" 
            className="w-full bg-[#2a2a2a] border border-[#3d3d3d] rounded text-sm px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Cart is empty
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-[#252525] p-3 rounded">
                <div className="flex items-center gap-3">
                  <span className="bg-[#3a3a3a] w-6 h-6 rounded flex items-center justify-center text-xs font-bold">{item.quantity}</span>
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                <span className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-4 border-t border-[#2d2d2d] flex flex-col gap-4">
          <div className="flex justify-between items-center text-gray-300">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button 
            className="w-full bg-[#252525] hover:bg-[#333333] text-blue-500 border border-[#3d3d3d] font-bold py-4 rounded transition-colors"
          >
            Discount
          </button>
          <button 
            className="w-full bg-[#4638c4] hover:bg-blue-600 text-white font-bold py-4 rounded text-lg transition-colors shadow-lg"
          >
            Pay ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
