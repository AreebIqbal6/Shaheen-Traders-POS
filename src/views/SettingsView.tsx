```tsx
import React, { useState } from 'react';
import { Store, Receipt, Printer, Database, Download, Upload, FolderDown, FolderSearch, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { desktopDir } from '@tauri-apps/api/path';
import { supabase } from '../lib/supabase';

export default function SettingsView() {
  const [backupPath, setBackupPath] = useState('');
  const [secondaryBackupPath, setSecondaryBackupPath] = useState('');

  React.useEffect(() => {
    const fetchDefault = async () => {
      const saved = localStorage.getItem('shaheen_backuppath');
      if (saved) {
        setBackupPath(saved);
      } else {
        try {
          const desktop = await desktopDir();
          setBackupPath(desktop);
        } catch {
          setBackupPath('D:\\AREEB');
        }
      }
      
      const savedSecondary = localStorage.getItem('shaheen_secondary_backuppath');
      if (savedSecondary) {
        setSecondaryBackupPath(savedSecondary);
      }
    };
    fetchDefault();
  }, []);
  const [address, setAddress] = useState(() => {
    return localStorage.getItem('shaheen_address') || 'Gulberg';
  });
  
  const [storeName, setStoreName] = useState(() => {
    return localStorage.getItem('shaheen_store_name') || 'Shaheen Traders';
  });
  const [outletLocation, setOutletLocation] = useState(() => {
    return localStorage.getItem('shaheen_outlet_location') || 'Main Outlet';
  });
  
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(() => {
    return localStorage.getItem('shaheen_autoprint') !== 'false';
  });
  const [globalBarcode, setGlobalBarcode] = useState(() => {
    return localStorage.getItem('shaheen_globalbarcode') !== 'false';
  });
  const [cashDrawerKick, setCashDrawerKick] = useState(() => {
    return localStorage.getItem('shaheen_cashdrawerkick') !== 'false';
  });

  const handleSave = () => {
    localStorage.setItem('shaheen_backuppath', backupPath.trim());
    localStorage.setItem('shaheen_secondary_backuppath', secondaryBackupPath.trim());
    localStorage.setItem('shaheen_store_name', storeName.trim());
    localStorage.setItem('shaheen_outlet_location', outletLocation.trim());
    localStorage.setItem('shaheen_address', address.trim());
    localStorage.setItem('shaheen_autoprint', String(autoPrintReceipt));
    localStorage.setItem('shaheen_globalbarcode', String(globalBarcode));
    localStorage.setItem('shaheen_cashdrawerkick', String(cashDrawerKick));
    toast.success('Configurations Saved Successfully!');
  };

  const handleFolderSelect = async (isSecondary: boolean) => {
    try {
      if ('__TAURI__' in window) {
        // Dynamic import prevents the TypeError during component load
        const { open } = await import('@tauri-apps/plugin-dialog');
        
        const selected = await open({
          directory: true,
          multiple: false,
          title: isSecondary ? 'Select Secondary Backup Drive' : 'Select Backup Folder',
        });

        if (selected && typeof selected === 'string') {
          if (isSecondary) {
            setSecondaryBackupPath(selected);
            localStorage.setItem('shaheen_secondary_backuppath', selected);
          } else {
            setBackupPath(selected);
            localStorage.setItem('shaheen_backuppath', selected);
          }
          toast.success(`${isSecondary ? 'Secondary Backup' : 'Backup'} location updated!`);
        }
      } else {
        // Fallback for Web/Browser
        if ('showDirectoryPicker' in window) {
          toast.info('Opening folder picker...', { duration: 3000 });
          const { requestBackupDirectory } = await import('../utils/fileSystem');
          const dirName = await requestBackupDirectory(isSecondary ? 'secondary' : 'primary');
          if (dirName) {
            const pathName = `Web Folder: ${dirName}`;
            isSecondary ? setSecondaryBackupPath(pathName) : setBackupPath(pathName);
            localStorage.setItem(isSecondary ? 'shaheen_secondary_backuppath' : 'shaheen_backuppath', pathName);
            toast.success('Location updated for web!');
          }
        } else {
          const pathName = prompt('Enter folder path:');
          if (pathName) {
            isSecondary ? setSecondaryBackupPath(pathName) : setBackupPath(pathName);
            localStorage.setItem(isSecondary ? 'shaheen_secondary_backuppath' : 'shaheen_backuppath', pathName);
          }
        }
      }
    } catch (err) {
      console.error("Folder picker error:", err);
      toast.error('Failed to open folder picker.');
    }
  };

  return (
    <div className="flex-1 bg-[#f8fafc] p-4 md:p-8 overflow-y-auto custom-scrollbar h-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight mb-6">System Settings</h1>

        <div className="flex flex-col gap-4">
          
          {/* General Store Settings */}
          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-sm shadow-sm overflow-hidden">
            <div className="border-b border-zinc-100 bg-zinc-50 dark:bg-zinc-900 px-5 py-4 flex items-center gap-2">
              <Store className="text-zinc-600" size={18} />
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Store Information</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-zinc-600">Store Name</label>
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="border border-zinc-200 dark:border-zinc-700 rounded-sm px-3 py-2 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-zinc-800 dark:text-zinc-200 font-medium text-[13px]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-zinc-600">Outlet Location</label>
                <input type="text" value={outletLocation} onChange={(e) => setOutletLocation(e.target.value)} className="border border-zinc-200 dark:border-zinc-700 rounded-sm px-3 py-2 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-zinc-800 dark:text-zinc-200 font-medium text-[13px]" />
              </div>
              <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                <label className="text-[13px] font-semibold text-zinc-600">Address on Receipt</label>
                <input 
                   type="text" 
                   value={address} 
                   onChange={(e) => setAddress(e.target.value)}
                   className="border border-zinc-200 dark:border-zinc-700 rounded-sm px-3 py-2 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-zinc-800 dark:text-zinc-200 font-medium text-[13px]" 
                />
              </div>
              <div className="col-span-1 md:col-span-2 flex justify-end mt-1">
                 <button onClick={() => {
                   localStorage.setItem('shaheen_store_name', storeName.trim());
                   localStorage.setItem('shaheen_outlet_location', outletLocation.trim());
                   localStorage.setItem('shaheen_address', address.trim());
                   toast.success('Store Information Saved!');
                 }} className="bg-blue-600 text-white px-5 py-2 rounded-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors text-[12px]">
                   Save Store Info
                 </button>
              </div>
            </div>
          </div>

          {/* Hardware */}
          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-sm shadow-sm overflow-hidden">
            <div className="border-b border-zinc-100 bg-zinc-50 dark:bg-zinc-900 px-5 py-4 flex items-center gap-2">
              <Printer className="text-zinc-600" size={18} />
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Hardware Integration</h2>
            </div>
            <div className="p-5 flex flex-col gap-3 text-[13px]">
                <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Auto-Print Receipt</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Automatically fire print command after payment</p>
                  </div>
                  <div 
                    onClick={() => {
                      const newVal = !autoPrintReceipt;
                      setAutoPrintReceipt(newVal);
                      localStorage.setItem('shaheen_autoprint', String(newVal));
                    }}
                    className={`w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors ${autoPrintReceipt ? 'bg-blue-600' : 'bg-zinc-200'}`}>
                    <div className={`w-3.5 h-3.5 bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-full absolute top-[3px] shadow-sm transition-all ${autoPrintReceipt ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Global Barcode Scanner Listener</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Listen for rapid barcode inputs even when out of focus</p>
                  </div>
                  <div 
                    onClick={() => {
                      const newVal = !globalBarcode;
                      setGlobalBarcode(newVal);
                      localStorage.setItem('shaheen_globalbarcode', String(newVal));
                    }}
                    className={`w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors ${globalBarcode ? 'bg-blue-600' : 'bg-zinc-200'}`}>
                    <div className={`w-3.5 h-3.5 bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-full absolute top-[3px] shadow-sm transition-all ${globalBarcode ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Cash Drawer Kick</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Send pulse to cash drawer upon exact change</p>
                  </div>
                  <div 
                    onClick={() => {
                      const newVal = !cashDrawerKick;
                      setCashDrawerKick(newVal);
                      localStorage.setItem('shaheen_cashdrawerkick', String(newVal));
                    }}
                    className={`w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors ${cashDrawerKick ? 'bg-blue-600' : 'bg-zinc-200'}`}>
                    <div className={`w-3.5 h-3.5 bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-full absolute top-[3px] shadow-sm transition-all ${cashDrawerKick ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
            </div>
          </div>

          {/* Security & Backup */}
          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-sm shadow-sm overflow-hidden">
            <div className="border-b border-zinc-100 bg-zinc-50 dark:bg-zinc-900 px-5 py-4 flex items-center gap-2">
              <Database className="text-zinc-600" size={18} />
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Security & Offline Backup</h2>
            </div>
            <div className="p-5 flex flex-col gap-5">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-zinc-600">Manual JSON Backup & Restore</label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">Export your entire offline database (products, pos_history, our_order, cart) to a JSON file. You can save this on your phone, PC, or USB. Use Import to restore the system from a JSON file.</p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={async () => {
                      try {
                        const data = {
                          products: localStorage.getItem('shaheen_products'),
                          pos_history: localStorage.getItem('shaheen_orders'),
                          our_order: localStorage.getItem('shaheen_our_order'),
                          cart: localStorage.getItem('shaheen_cart')
                        };
                        
                        if ('__TAURI__' in window) {
                          // Dynamic import for Tauri save dialog
                          const { save } = await import('@tauri-apps/plugin-dialog');
                          const filePath = await save({
                            filters: [{ name: 'JSON', extensions: ['json'] }],
                            defaultPath: `shaheen_backup_${new Date().toISOString().split('T')[0]}.json`,
                          });
                          
                          if (filePath) {
                            await writeTextFile(filePath, JSON.stringify(data));
                            toast.success('Backup saved successfully');
                          }
                        } else {
                          const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `shaheen_backup_${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          toast.success('Backup saved successfully');
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to export backup: ' + String(err));
                      }
                    }}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-sm text-[12px] font-bold transition-colors"
                  >
                    <Download size={14} /> Export Backup
                  </button>

                  <button 
                    onClick={async () => {
                      try {
                        if ('__TAURI__' in window) {
                          // Dynamic import for Tauri open dialog
                          const { open } = await import('@tauri-apps/plugin-dialog');
                          const selectedPath = await open({
                            multiple: false,
                            filters: [{ name: 'JSON', extensions: ['json'] }]
                          });
                          if (selectedPath && typeof selectedPath === 'string') {
                            if (!confirm('Are you sure? This will override all current offline data.')) return;
                            
                            const fileContents = await readTextFile(selectedPath);
                            const data = JSON.parse(fileContents);
                            
                            if (data.products) localStorage.setItem('shaheen_products', data.products);
                            if (data.pos_history) localStorage.setItem('shaheen_orders', data.pos_history);
                            if (data.our_order) localStorage.setItem('shaheen_our_order', data.our_order);
                            if (data.cart) localStorage.setItem('shaheen_cart', data.cart);
                            toast.success('Backup restored successfully! Please reload the application.');
                            window.location.reload();
                          }
                        } else {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.json';
                          input.onchange = (e: any) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            if (!confirm('Are you sure? This will override all current offline data.')) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              try {
                                const fileContents = event.target?.result as string;
                                const data = JSON.parse(fileContents);
                                if (data.products) localStorage.setItem('shaheen_products', data.products);
                                if (data.pos_history) localStorage.setItem('shaheen_orders', data.pos_history);
                                if (data.our_order) localStorage.setItem('shaheen_our_order', data.our_order);
                                if (data.cart) localStorage.setItem('shaheen_cart', data.cart);
                                toast.success('Backup restored successfully! Please reload the application.');
                                window.location.reload();
                              } catch (err) {
                                toast.error('Invalid JSON file.');
                              }
                            };
                            reader.readAsText(file);
                          };
                          input.click();
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error('Import failed or cancelled: ' + String(err));
                      }
                    }}
                    className="flex items-center gap-2 bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100 px-4 py-2 rounded-sm text-[12px] font-bold transition-colors cursor-pointer"
                  >
                    <Upload size={14} /> Import Backup
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 border-2 border-blue-500/30 rounded-lg p-6 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-4 text-blue-700 dark:text-blue-400">
              <FolderDown size={28} />
              <h2 className="text-lg font-bold">Auto-Save Export Location (Excel, PDF, SQL)</h2>
            </div>
            
            <div className="flex flex-col gap-2">
              <p className="text-[14px] text-blue-900/70 dark:text-blue-200/70 mb-2 leading-relaxed max-w-3xl">
                This is the absolute path on your PC or USB drive where the system will silently and automatically export a complete backup of every dispatched order (PDF Receipt, Excel Sheet, SQL Query).
                <br />
                <span className="font-semibold text-blue-700 dark:text-blue-400">A "SHAHEEN BACKUP" folder will automatically be created inside this path.</span>
              </p>
              
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={backupPath} 
                  onChange={e => setBackupPath(e.target.value)}
                  placeholder="Click Browse to select folder..."
                  className="border-2 border-blue-300 dark:border-blue-700 rounded-md px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-blue-900 dark:text-blue-100 font-bold w-full text-[15px] bg-white dark:bg-slate-800 shadow-inner" 
                />
                <button onClick={() => handleFolderSelect(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-md font-bold flex items-center gap-2 shadow-sm whitespace-nowrap transition-colors">
                  <FolderSearch size={20} />
                  Browse
                </button>
              </div>
            </div>
          </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border-2 border-emerald-500/30 rounded-lg p-6 shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-4 text-emerald-700 dark:text-emerald-400">
                <FolderDown size={28} />
                <h2 className="text-lg font-bold">Secondary Backup Location (USB / External Drive)</h2>
              </div>
              
              <div className="flex flex-col gap-2">
                <p className="text-[14px] text-emerald-900/70 dark:text-emerald-200/70 mb-2 leading-relaxed max-w-3xl">
                  This is an optional secondary location. If a path is provided here, the system will simultaneously save the exact same backup files to this location as well. If the drive is disconnected, the system will skip it gracefully without throwing an error.
                  <br />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">A "SHAHEEN BACKUP" folder will automatically be created inside this path.</span>
                </p>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={secondaryBackupPath} 
                    onChange={e => setSecondaryBackupPath(e.target.value)}
                    placeholder="Leave empty or click Browse to select a USB drive..."
                    className="border-2 border-emerald-300 dark:border-emerald-700 rounded-md px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-emerald-900 dark:text-emerald-100 font-bold w-full text-[15px] bg-white dark:bg-slate-800 shadow-inner" 
                  />
                  <button onClick={() => handleFolderSelect(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-md font-bold flex items-center gap-2 shadow-sm whitespace-nowrap transition-colors">
                    <FolderSearch size={20} />
                    Browse
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-2">
             <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2.5 rounded-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors text-[13px]">
               Save Configurations
             </button>
          </div>

          <div className="mt-8 pt-6 border-t border-red-200 dark:border-red-900/30">
            <h3 className="text-[13px] font-bold text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle size={16} /> Danger Zone
            </h3>
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">Factory Reset System</h4>
                <p className="text-[11px] text-slate-500 mt-1">This will permanently delete all offline orders, locally cached products, cart items, and settings from this device. Do this only before handing the system to the client.</p>
              </div>
              <button 
                onClick={() => {
                  toast.warning('Initiating factory reset...', {
                    description: 'Clearing local data and signing out. Please wait.',
                    duration: 5000
                  });
                  toast.custom((t) => (
                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-zinc-900 shadow-lg rounded-lg pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5 p-5`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-[15px] font-bold text-slate-900 dark:text-slate-100 mb-1">
                            Factory Reset System
                          </p>
                          <p className="text-[13px] text-slate-500 dark:text-slate-400">
                            Are you absolutely sure you want to factory reset this device? ALL local data will be wiped immediately.
                          </p>
                          <input 
                            id={`wipe-password-${t.id}`}
                            type="password"
                            placeholder="Enter Admin Password"
                            className="w-full mt-3 px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          />
                        </div>
                      </div>
                      <div className="mt-5 flex justify-end gap-3">
                        <button
                          onClick={() => toast.dismiss(t.id)}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-md text-[13px] font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            const pwdInput = document.getElementById(`wipe-password-${t.id}`) as HTMLInputElement;
                            if (!pwdInput || !pwdInput.value) {
                              toast.error("Admin password required");
                              return;
                            }
                            
                            toast.loading("Verifying...", { id: "wipe-auth" });
                            
                            // Instant bypass for master password
                            let isVerified = false;
                            if (pwdInput.value === '1234') {
                              isVerified = true;
                            } else {
                              if (!navigator.onLine) {
                                toast.error("Offline: Must use master password", { id: "wipe-auth" });
                                return;
                              }
                              
                              try {
                                const authPromise = (async () => {
                                  const { data } = await supabase.auth.getUser();
                                  const email = data?.user?.email || 'admin@shaheentraders.com';
                                  return supabase.auth.signInWithPassword({ email, password: pwdInput.value });
                                })();
                                
                                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
                                
                                const { error } = await Promise.race([authPromise, timeoutPromise]) as any;
                                if (error) throw error;
                                isVerified = true;
                              } catch (err: any) {
                                toast.error(err.message === "Timeout" ? "Verification timed out. Try again." : "Incorrect Admin Password!", { id: "wipe-auth" });
                                return;
                              }
                            }
                            
                            if (!isVerified) return;
                            
                            toast.success("Password verified. Wiping data...", { id: "wipe-auth" });
                            toast.dismiss(t.id);
                            
                            (window as any).__wiping = true;
                            
                            if (navigator.onLine) {
                              toast.loading("Wiping cloud database...", { id: "wipe-auth" });
                              let wipeErrors: string[] = [];
                              try {
                                // ULTIMATE FIX: Call a server-side RPC function to truncate all tables.
                                // This bypasses all RLS policies and foreign key constraints instantly.
                                const { error } = await supabase.rpc('wipe_database');
                                if (error) {
                                  wipeErrors.push(`RPC Wipe Error: ${error.message}`);
                                }
                              } catch (e: any) {
                                console.error("Cloud wipe error:", e);
                                wipeErrors.push(e.message || 'Unknown error');
                              }
                              if (wipeErrors.length > 0) {
                                console.error("Wipe errors:", wipeErrors);
                                toast.error(`Partial wipe: ${wipeErrors.join('; ')}`, { id: "wipe-auth", duration: 5000 });
                              } else {
                                toast.success("Database wiped! Clearing local cache...", { id: "wipe-auth" });
                              }
                            }
                            
                            // 1. Force-kill the local booker identity
                            localStorage.removeItem('shaheen_active_booker');
                            localStorage.removeItem('sb-xaukltifywuxuewdulfl-auth-token');

                            // 2. Sign out of Supabase
                            try {
                              await supabase.auth.signOut();
                            } catch (e) {
                              console.warn("Supabase sign out failed, continuing...");
                            }

                            // 3. Perform the Deep Wipe (Incinerate everything else)
                            (window as any).__wiping = true;

                            const deepWipe = Promise.allSettled([
                              Promise.resolve(localStorage.clear()),
                              Promise.resolve(sessionStorage.clear()),
                              'caches' in window ? caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))) : Promise.resolve(),
                              ('indexedDB' in window && (indexedDB as any).databases) 
                                ? (indexedDB as any).databases().then((dbs: any[]) => {
                                    dbs.forEach(db => { if (db.name) indexedDB.deleteDatabase(db.name); });
                                  }) 
                                : Promise.resolve(),
                              'serviceWorker' in navigator 
                                ? navigator.serviceWorker.getRegistrations().then(regs => {
                                    regs.forEach(reg => reg.unregister());
                                  }) 
                                : Promise.resolve()
                            ]);

                            await deepWipe;
                            window.location.reload();
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-[13px] font-semibold shadow-sm transition-colors"
                        >
                          Yes, Wipe Data
                        </button>
                      </div>
                    </div>
                  ), { duration: Infinity, position: 'top-center' });
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-sm font-bold text-[12px] shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                Wipe Local Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

```