const fs = require('fs');
let data = fs.readFileSync('src/screens/CustomerDashboard.tsx', 'utf8');
data = data.replace(/fontWeight:\s*['"]750['"]/g, "fontWeight: '700'")
           .replace(/fontWeight:\s*['"]850['"]/g, "fontWeight: '800'")
           .replace(/fontWeight:\s*['"]950['"]/g, "fontWeight: '900'")
           .replace(/overflow:\s*['"]scroll['"]/g, "/* overflow scroll removed */");
fs.writeFileSync('src/screens/CustomerDashboard.tsx', data);
console.log('Fixed fonts and overflow');
