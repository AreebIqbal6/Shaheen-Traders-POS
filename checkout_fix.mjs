import fs from 'fs';
let content = fs.readFileSync('src/components/B2BCheckout.tsx', 'utf8');

// Add Area input field. Let's find where to insert it.
// Right after the Shop search input.
const shopInputDiv = /<div className="relative">\s*<div\s*onClick=\{[^}]*\}\s*className="w-full h-11[^>]*>[\s\S]*?<\/div>[\s\S]*?<\/div>\s*<\/div>/;

// Wait, I can just use a simple string replace for the entire formData state and UI fields.
content = content.replace(
  /const \[formData, setFormData\] = useState\(\{[\s\S]*?\}\);/,
  `const [formData, setFormData] = useState({
    businessName: '',
    areaName: '',
    bookerName: activeBooker.name || '',
    paymentTerms: 'Cash on Delivery'
  });`
);

content = content.replace(
  /if \(!formData\.businessName \|\| !formData\.bookerName\) \{/,
  `if (!formData.businessName || !formData.bookerName || !formData.areaName) {`
);

content = content.replace(
  /areaName: exactShop\.address \|\| formData\.areaName,/g,
  ''
);

content = content.replace(
  /contactNumber: exactShop\.contact_number \|\| exactShop\.contactNumber \|\| formData\.contactNumber/g,
  ''
);

content = content.replace(
  /areaName: shop\.address \|\| '',/g,
  ''
);

content = content.replace(
  /contactNumber: shop\.contact_number \|\| shop\.contactNumber \|\| ''/g,
  ''
);

content = content.replace(
  /contact_number: formData\.contactNumber,/g,
  ''
);

// Remove the contact number input UI from B2BCheckout
content = content.replace(
  /<div>\s*<label[^>]*>\s*<Phone[^>]*\/> Contact Number\s*<\/label>\s*<input[^>]*value=\{formData\.contactNumber\}[^>]*onChange=\{e => setFormData\(\{\.\.\.formData, contactNumber: e\.target\.value\}\)\}[^>]*\/>\s*<\/div>/,
  `<div>
                  <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <MapPin size={12} className="text-blue-600 dark:text-blue-400" /> Area
                  </label>
                  <input 
                    type="text" 
                    value={formData.areaName}
                    onChange={e => setFormData({...formData, areaName: e.target.value})}
                    className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 transition-all text-sm"
                    placeholder="Enter area manually"
                  />
                </div>`
);

fs.writeFileSync('src/components/B2BCheckout.tsx', content);
