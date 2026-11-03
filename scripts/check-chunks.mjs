// After `vite build`: fail if chunks import each other in a cycle (the blank-page bug).
import fs from 'fs';
import path from 'path';
const dir = path.resolve('dist/assets');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
const deps = Object.fromEntries(files.map((f) => {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  return [f, [...src.matchAll(/(?:from|import)\s*["']\.\/([^"']+\.js)["']/g)].map((m) => m[1]).filter((d) => d !== f)];
}));
const cycles = [];
const visit = (f, stack) => {
  if (stack.includes(f)) { cycles.push([...stack.slice(stack.indexOf(f)), f].join(' -> ')); return; }
  (deps[f] || []).forEach((d) => visit(d, [...stack, f]));
};
files.forEach((f) => visit(f, []));
const reactDomIn = files.filter((f) => /__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
if (cycles.length) { console.error('Circular chunk imports:\n' + [...new Set(cycles)].join('\n')); process.exit(1); }
if (reactDomIn.length > 1) { console.error('React internals split across chunks: ' + reactDomIn.join(', ')); process.exit(1); }
console.log(`chunk check ok (${files.length} js chunks, no cycles, React in one chunk)`);
