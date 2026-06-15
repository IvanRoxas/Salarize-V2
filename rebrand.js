const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Rebranding
  content = content.replace(/admin@nainggie\.com/g, 'AdminSalarize');
  content = content.replace(/nainggie/g, 'AdminSalarize');

  // Icon Upscale
  content = content.replace(/w-4 h-4/g, 'w-5 h-5');
  content = content.replace(/w-3 h-3/g, 'w-4 h-4');
  
  // Primary Button Upscale
  // Looking for specific text matches to safely upgrade buttons
  content = content.replace(/px-4 py-2 bg-\[var\(--color-emerald-custom\)\]/g, 'px-6 py-2.5 text-base bg-[var(--color-emerald-custom)]');
  content = content.replace(/px-4 py-2 rounded-lg font-medium hover:bg-emerald-600/g, 'px-6 py-2.5 text-base rounded-lg font-medium hover:bg-emerald-600');

  // Catch generic Save/Update buttons
  content = content.replace(/py-2 px-4 bg-\[var\(--color-emerald-custom\)\]/g, 'py-2.5 px-6 text-base bg-[var(--color-emerald-custom)]');
  content = content.replace(/py-2 px-4 bg-\[var\(--color-yellow-custom\)\]/g, 'py-2.5 px-6 text-base bg-[var(--color-yellow-custom)]');

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
