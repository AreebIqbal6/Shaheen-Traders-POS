const fs = require('fs');
let code = fs.readFileSync('src/views/SettingsView.tsx', 'utf-8');

// Add import
const importStr = "import { Download, RefreshCw } from 'lucide-react';";
if (!code.includes('RefreshCw')) {
   code = code.replace(/import \{.*?\} from 'lucide-react';/, match => match.replace('}', ', Download, RefreshCw }'));
}

// Add state for updater
const stateStr = "  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);\n  const [updateStatus, setUpdateStatus] = useState('');";
if (!code.includes('isCheckingUpdate')) {
   code = code.replace('const [logo, setLogo] = useState', stateStr + '\n  const [logo, setLogo] = useState');
}

// Add handleCheckUpdate function
const funcStr = `  const handleCheckUpdate = async () => {
    try {
      setIsCheckingUpdate(true);
      setUpdateStatus('Checking for updates...');
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      
      if (update) {
        setUpdateStatus(\`Found update v\${update.version}. Downloading...\`);
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
  };`;
  
if (!code.includes('handleCheckUpdate')) {
  code = code.replace('  const handleLogoUpload =', funcStr + '\n\n  const handleLogoUpload =');
}

// Add UI for updater
const uiStr = `
            {/* App Updater Section */}
            <div className="bg-slate-50 dark:bg-[#111113] rounded-xl p-5 border border-slate-200 dark:border-zinc-800/80">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Download size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-50">Software Update</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
                    Check for new versions and install them seamlessly without losing your data.
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCheckUpdate}
                      disabled={isCheckingUpdate}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCheckingUpdate ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                      {isCheckingUpdate ? 'Checking...' : 'Check for Updates'}
                    </button>
                    {updateStatus && <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{updateStatus}</span>}
                  </div>
                </div>
              </div>
            </div>
`;

if (!code.includes('Software Update')) {
  code = code.replace('{/* Global Store Settings */}', uiStr + '\n            {/* Global Store Settings */}');
}

fs.writeFileSync('src/views/SettingsView.tsx', code);
console.log('done');
