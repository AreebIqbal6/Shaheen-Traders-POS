import React from 'react';
import { Home, ShoppingCart, Box, BarChart2, Tag, Wrench, Package, Users, Settings, LogOut } from 'lucide-react';

export type ModuleState = 'register' | 'inventory';
export type ViewState = 
  // Register Views
  'sell' | 'open-close' | 'sales-history' | 'cash-management' | 'status' | 'settings' | 'quotes' | 
  // Inventory Views
  'stock-control' | 'inventory-counts' | 'special-orders';

interface SidebarProps {
  activeModule: ModuleState;
  setModule: (mod: ModuleState) => void;
  activeView: ViewState;
  setView: (view: ViewState) => void;
}

export default function Sidebar({ activeModule, setModule, activeView, setView }: SidebarProps) {
  const storeName = localStorage.getItem('shaheen_store_name') || 'Shaheen Global Traders';
  const logo = localStorage.getItem('shaheen_logo');
  const outletLocation = localStorage.getItem('shaheen_outlet_location') || 'Main Outlet';
  
  // Leftmost Module Strip Icons
  const moduleIcons = [
    { id: 'home', icon: <Home size={20} /> },
    { id: 'register', icon: <ShoppingCart size={20} /> },
    { id: 'inventory', icon: <Box size={20} /> },
    { id: 'reports', icon: <BarChart2 size={20} /> },
    { id: 'tags', icon: <Tag size={20} /> },
    { id: 'tools', icon: <Wrench size={20} /> },
    { id: 'packages', icon: <Package size={20} /> },
    { id: 'customers', icon: <Users size={20} /> },
    { id: 'settings', icon: <Settings size={20} /> },
  ];

  const registerViews = [
    { id: 'sell', label: 'Sell' },
    { id: 'open-close', label: 'Open / Close' },
    { id: 'sales-history', label: 'Sales history' },
    { id: 'cash-management', label: 'Cash management' },
    { id: 'status', label: 'Status' },
    { id: 'settings', label: 'Settings' },
    { id: 'quotes', label: 'Quotes' },
  ];

  const inventoryViews = [
    { id: 'stock-control', label: 'Stock control' },
    { id: 'inventory-counts', label: 'Inventory counts' },
    { id: 'special-orders', label: 'Special orders' },
    { id: 'fulfillments', label: 'Fulfillments' },
    { id: 'serial-numbers', label: 'Serial numbers' },
  ];

  const currentViews = activeModule === 'register' ? registerViews : inventoryViews;
  
  // Theme logic for secondary sidebar
  const isDark = activeModule === 'register';
  const bgClass = isDark ? 'bg-[#1c1c1c] text-white border-[#2d2d2d]' : 'bg-[#f4f5f9] text-[#333] border-[#e2e2e2]';
  const hoverClass = isDark ? 'hover:bg-[#252525] hover:text-white' : 'hover:bg-white hover:text-black';
  const activeClass = isDark ? 'bg-[#252525] text-white' : 'bg-white text-blue-600 font-medium';
  const textClass = isDark ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className="flex h-full flex-shrink-0">
      
      {/* Primary Module Strip (Always Dark) */}
      <div className="w-14 bg-[#151515] flex flex-col border-r border-[#2d2d2d] items-center py-4 text-gray-400">
        <div className="w-8 h-8 flex justify-center items-center mb-6 text-white cursor-pointer overflow-hidden rounded-md">
          {logo ? (
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {moduleIcons.map(item => (
            <button 
              key={item.id}
              onClick={() => {
                if (item.id === 'register') {
                  setModule('register');
                  setView('sell');
                } else if (item.id === 'inventory') {
                  setModule('inventory');
                  setView('stock-control');
                }
              }}
              className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
                activeModule === item.id ? 'text-white bg-[#252525]' : 'hover:text-white hover:bg-[#252525]'
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <button className="w-10 h-10 flex items-center justify-center hover:text-white transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Secondary Context Sidebar */}
      <div className={`w-48 flex flex-col border-r ${bgClass}`}>
        
        {/* Module Header */}
        {activeModule === 'register' && (
          <div className="mt-6 px-4 flex flex-col mb-4">
            <span className="font-bold text-lg leading-tight">{storeName}</span>
            <span className="text-sm text-gray-400">{outletLocation}</span>
            <span className="text-xs text-gray-500 mt-1 cursor-pointer hover:text-gray-300">Switch ⌄</span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto mt-4 custom-scrollbar">
          <ul className="flex flex-col">
            {currentViews.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setView(item.id as ViewState)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors relative ${
                    activeView === item.id ? activeClass : `${textClass} ${hoverClass}`
                  }`}
                >
                  {activeView === item.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                  )}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

    </div>
  );
}
