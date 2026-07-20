const fs = require('fs');
let code = fs.readFileSync('src/components/B2BCheckout.tsx', 'utf-8');

code = code.replace(
  'if (!formData.businessName || !formData.areaName || !formData.bookerName || !formData.contactNumber) {',
  'if (!formData.businessName || !formData.bookerName) {'
);
code = code.replace(
  /if \(!validatePhone\(formData\.contactNumber\)\) \{[\s\S]*?return;\s*\}/,
  '// Phone validation removed'
);

const areaBlock = `              <div>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <MapPin size={12} className="text-blue-600 dark:text-blue-400" /> Area Name
                </label>
                <input 
                  type="text" 
                  value={formData.areaName}
                  onChange={e => setFormData({...formData, areaName: e.target.value})}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  placeholder="e.g. Samnabad"
                />
              </div>`;

const contactBlock = `              <div>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <Phone size={12} className="text-blue-600 dark:text-blue-400" /> Contact Number
                </label>
                <input 
                  type="text" 
                  value={formData.contactNumber}
                  onChange={e => setFormData({...formData, contactNumber: e.target.value})}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  placeholder="e.g. 0300 1234567"
                />
              </div>`;

// Check if blocks were found
if (!code.includes(areaBlock)) { console.log('Area block not found!'); }
if (!code.includes(contactBlock)) { console.log('Contact block not found!'); }

code = code.replace(areaBlock, '');
code = code.replace(contactBlock, '');

fs.writeFileSync('src/components/B2BCheckout.tsx', code);
console.log('done');
