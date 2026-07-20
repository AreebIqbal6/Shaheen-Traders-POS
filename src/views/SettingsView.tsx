import React, { useState, useEffect } from 'react';
import { Store, Receipt, Printer, Database, Download, Upload, FolderDown, FolderSearch, AlertTriangle, X , Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '../lib/supabase';
import { ensureBackupFolder } from '../utils/backupValidator';

export default function SettingsView() {
  const [backupPath, setBackupPath] = useState('');
  const [secondaryBackupPath, setSecondaryBackupPath] = useState('');

  useEffect(() => {
    const fetchDefault = async () => {
      const saved = localStorage.getItem('shaheen_backuppath');
      if (saved) {
        setBackupPath(saved);
      } else {
        try {
          const { desktopDir } = await import('@tauri-apps/api/path');
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
    return localStorage.getItem('shaheen_store_name') || 'Shaheen Global Traders';
  });
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [logo, setLogo] = useState(() => {
    return localStorage.getItem('shaheen_logo') || '';
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

  const handleCheckUpdate = async () => {
    try {
      setIsCheckingUpdate(true);
      setUpdateStatus('Checking for updates...');
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      
      if (update) {
        setUpdateStatus(`Found update v${update.version}. Downloading...`);
        await update.downloadAndInstall();
        setUpdateStatus('Update installed. Restarting...');
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await relaunch();
      } else {
        setUpdateStatus('You are on the latest version.');
        setTimeout(() => setUpdateStatus(''), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setUpdateStatus('Failed to check for updates: ' + err.message);
      setTimeout(() => setUpdateStatus(''), 3000);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogo(base64);
      localStorage.setItem('shaheen_logo', base64);
      toast.success('Logo updated! (Refresh to see changes everywhere)');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    localStorage.setItem('shaheen_backuppath', backupPath.trim());
    localStorage.setItem('shaheen_secondary_backuppath', secondaryBackupPath.trim());
    localStorage.setItem('shaheen_store_name', storeName.trim());
    localStorage.setItem('shaheen_outlet_location', outletLocation.trim());
    localStorage.setItem('shaheen_address', address.trim());
    localStorage.setItem('shaheen_autoprint', String(autoPrintReceipt));
    localStorage.setItem('shaheen_globalbarcode', String(globalBarcode));
    localStorage.setItem('shaheen_cashdrawerkick', String(cashDrawerKick));

    if ('__TAURI_INTERNALS__' in window || '__TAURI__' in window) {
      toast.loading("Validating backup folders...", { id: "save-val" });
      await ensureBackupFolder(backupPath.trim(), false);
      if (secondaryBackupPath.trim()) {
        await ensureBackupFolder(secondaryBackupPath.trim(), false);
      }
      toast.dismiss("save-val");
    }

    toast.success('Configurations Saved Successfully!');
  };

  const handleFolderSelect = async (isSecondary: boolean) => {
    const savePath = (pathName: string) => {
      if (isSecondary) {
        setSecondaryBackupPath(pathName);
        localStorage.setItem('shaheen_secondary_backuppath', pathName);
      } else {
        setBackupPath(pathName);
        localStorage.setItem('shaheen_backuppath', pathName);
      }
    };

    if (!('__TAURI_INTERNALS__' in window) && !('__TAURI__' in window) && !('showDirectoryPicker' in window)) {
      toast.error("Automated folder backups require the Desktop App. Web users must manually download files via the browser.", { duration: 6000, style: { minWidth: '400px' } });
      return;
    }

    try {
      if ('__TAURI_INTERNALS__' in window || '__TAURI__' in window) {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          directory: true,
          multiple: false,
          title: isSecondary ? 'Select Secondary Backup Drive' : 'Select Backup Folder',
        });

        if (selected && typeof selected === 'string') {
          savePath(selected);
          toast.success('Backup location updated!');
        }
        return;
      }

      if ('showDirectoryPicker' in window) {
        try {
          // @ts-ignore
          const dirHandle = await window.showDirectoryPicker();
          if (dirHandle) {
            savePath(`Web Folder: ${dirHandle.name}`);
            toast.success('Web folder access granted!');
          }
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            console.error('Directory picker error:', err);
            toast.error('Failed to access folder.');
          }
        }
        return;
      }

      const pathName = prompt('Browser does not support folder picking. Please manually enter the full system path (e.g., C:\\Backups):');
      if (pathName) {
        savePath(pathName);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError' && err !== 'User cancelled') {
        console.error("Folder picker error:", err);
        toast.error('Failed to open folder picker.');
      }
    }
  };

  const renderFactoryResetToast = (t: any) => {
    return (
      <div className={(t.visible ? 'animate-enter' : 'animate-leave') + " max-w-md w-full bg-white dark:bg-zinc-900 shadow-lg rounded-lg pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5 p-5"}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-[15px] font-bold text-slate-900 dark:text-slate-100 mb-1">True Factory Reset (Cloud + Local)</p>
            <p className="text-[13px] text-slate-500 dark:text-zinc-400">Are you absolutely sure? This will permanently delete ALL Products, Bookers, Orders, and Local Data from the entire cloud system and this device.</p>
            <input
              id={"wipe-password-" + t.id}
              type="password"
              placeholder="Enter Admin Password"
              className="w-full mt-3 px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md text-[13px] text-slate-900 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => { (window as any).__wiping = false; toast.dismiss(t.id); }}
            className="bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-md text-[13px] font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              const pwdInput = document.getElementById("wipe-password-" + t.id) as HTMLInputElement;
              if (pwdInput?.value !== '1234') {
                toast.error("Incorrect Admin Password!");
                return;
              }

              if (!navigator.onLine) {
                 toast.error("You must be online to wipe the cloud database.");
                 return;
              }

              toast.loading("Nuking cloud database & local system...", { id: "wipe-auth" });
              try {
                (window as any).__wiping = true;

                // 1. WIPE THE CLOUD (Deletes all rows safely)
                await supabase.from('products').delete().not('id', 'is', null);
                await supabase.from('bookers').delete().not('id', 'is', null); 
                await supabase.from('orders').delete().not('id', 'is', null);  

                // 2. WIPE LOCAL DATA CACHE
                supabase.removeAllChannels();
                localStorage.clear();
                sessionStorage.clear();
                
                if ('indexedDB' in window && (indexedDB as any).databases) {
                  const dbs = await (indexedDB as any).databases();
                  dbs.forEach((db: any) => { if (db.name) indexedDB.deleteDatabase(db.name); });
                }
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  for (const reg of regs) { reg.unregister(); }
                }
                
                toast.success("System completely wiped. Rebooting...", { id: "wipe-auth" });
                
                // Force all listeners to shut down, then reload
                window.dispatchEvent(new Event('force_remount'));
                setTimeout(() => window.location.reload(), 500);

              } catch (err: any) {
                console.error("Wipe failed:", err);
                toast.error("Wipe failed: " + err.message, { id: "wipe-auth" });
                (window as any).__wiping = false;
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-[13px] font-bold"
          >
            YES, NUKE EVERYTHING
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#f8fafc] p-4 md:p-8 overflow-y-auto custom-scrollbar h-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight mb-6">System Settings</h1>

        <div className="flex flex-col gap-4">
          
          {/* Branding Settings */}
          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-sm shadow-sm overflow-hidden mb-4">
            <div className="border-b border-zinc-100 bg-zinc-50 dark:bg-zinc-900 px-5 py-4 flex items-center gap-2">
              <Store className="text-zinc-600" size={18} />
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Branding</h2>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold text-zinc-600">Global Store Logo</label>
                <div className="flex items-center gap-4">
                  {logo ? (
                    <img src={logo} alt="Store Logo" className="w-16 h-16 object-contain border border-slate-200 rounded-md bg-white p-1 mix-blend-multiply" />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex items-center justify-center text-slate-400 text-xs text-center">No Logo</div>
                  )}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                <p className="text-xs text-zinc-500">This logo will be displayed everywhere across the app.</p>
              </div>
            </div>
          </div>

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
               <button onClick={handleSave} className="bg-blue-600 text-white px-5 py-2 rounded-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors text-[12px]">
                 Save Store Info
               </button>
            </div>
          </div>
        </div>

        {/* Hardware Integration */}
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
                className={"w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors " + (autoPrintReceipt ? "bg-blue-600" : "bg-zinc-200")}
              >
                <div className={"w-3.5 h-3.5 bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-full absolute top-[3px] shadow-sm transition-all " + (autoPrintReceipt ? "right-1" : "left-1")}></div>
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
                className={"w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors " + (globalBarcode ? "bg-blue-600" : "bg-zinc-200")}
              >
                <div className={"w-3.5 h-3.5 bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-full absolute top-[3px] shadow-sm transition-all " + (globalBarcode ? "right-1" : "left-1")}></div>
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
                className={"w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors " + (cashDrawerKick ? "bg-blue-600" : "bg-zinc-200")}
              >
                <div className={"w-3.5 h-3.5 bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-full absolute top-[3px] shadow-sm transition-all " + (cashDrawerKick ? "right-1" : "left-1")}></div>
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
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">Export your entire offline database to a JSON file. Use Import to restore the system from a JSON file.</p>
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
                      const dateString = new Date().toISOString().split('T')[0];
                      const backupFileName = 'shaheen_backup_' + dateString + '.json';
                      if ('__TAURI_INTERNALS__' in window || '__TAURI__' in window) {
                        const { save } = await import('@tauri-apps/plugin-dialog');
                        const filePath = await save({ filters: [{ name: 'JSON', extensions: ['json'] }], defaultPath: backupFileName });
                        if (filePath) { const { writeTextFile } = await import('@tauri-apps/plugin-fs'); await writeTextFile(filePath, JSON.stringify(data)); toast.success('Backup saved successfully'); }
                      } else {
                        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = backupFileName;
                        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                        toast.success('Backup saved successfully');
                      }
                    } catch (err) { toast.error('Failed to export backup: ' + String(err)); }
                  }}
                  className="flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-sm text-[12px] font-bold transition-colors"
                >
                  <Download size={14} /> Export Backup
                </button>

                <button 
                  onClick={async () => {
                    try {
                      if ('__TAURI_INTERNALS__' in window || '__TAURI__' in window) {
                        const { open } = await import('@tauri-apps/plugin-dialog');
                        const selectedPath = await open({ multiple: false, filters: [{ name: 'JSON', extensions: ['json'] }] });
                        if (selectedPath && typeof selectedPath === 'string') {
                          if (!confirm('Are you sure? This will override all current offline data.')) return;
                          const { readTextFile } = await import('@tauri-apps/plugin-fs');
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
                        const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
                        input.onchange = (e: any) => {
                          const file = e.target.files[0]; if (!file) return;
                          if (!confirm('Are you sure? This will override all current offline data.')) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const fileContents = event.target?.result as string; const data = JSON.parse(fileContents);
                              if (data.products) localStorage.setItem('shaheen_products', data.products);
                              if (data.pos_history) localStorage.setItem('shaheen_orders', data.pos_history);
                              if (data.our_order) localStorage.setItem('shaheen_our_order', data.our_order);
                              if (data.cart) localStorage.setItem('shaheen_cart', data.cart);
                              toast.success('Backup restored successfully! Please reload the application.');
                              window.location.reload();
                            } catch (err) { toast.error('Invalid JSON file.'); }
                          };
                          reader.readAsText(file);
                        };
                        input.click();
                      }
                    } catch (err) { toast.error('Import failed or cancelled: ' + String(err)); }
                  }}
                  className="flex items-center gap-2 bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100 px-4 py-2 rounded-sm text-[12px] font-bold transition-colors cursor-pointer"
                >
                  <Upload size={14} /> Import Backup
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Save Export Location */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 border-2 border-blue-500/30 rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4 text-blue-700 dark:text-blue-400">
            <FolderDown size={28} />
            <h2 className="text-lg font-bold">Auto-Save Export Location (Excel, PDF, SQL)</h2>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[14px] text-blue-900/70 dark:text-blue-200/70 mb-2 leading-relaxed max-w-3xl">
              This is the absolute path on your PC or USB drive where the system will silently and automatically export a complete backup.
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

        {/* Secondary Backup Location */}
        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border-2 border-emerald-500/30 rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4 text-emerald-700 dark:text-emerald-400">
            <FolderDown size={28} />
            <h2 className="text-lg font-bold">Secondary Backup Location (USB / External Drive)</h2>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[14px] text-emerald-900/70 dark:text-emerald-200/70 mb-2 leading-relaxed max-w-3xl">
              This is an optional secondary location. If a path is provided here, the system will simultaneously save the exact same backup files.
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

        {/* Danger Zone */}
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
                (window as any).__wiping = true;
                toast.custom(renderFactoryResetToast, { duration: Infinity });
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
