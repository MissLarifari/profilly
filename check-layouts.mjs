import fs from 'fs';

// Standardmaessig die App neben dieser Datei pruefen; ein Pfad als Argument geht auch.
const HERE = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const HTML = process.argv[2] || HERE + 'index.html';
const html = fs.readFileSync(HTML, 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));

/* Arial advance widths, Einheiten pro 1000 em (Standard-Metrik) */
const AW = {' ':278,'!':278,'"':355,'#':556,'$':556,'%':889,'&':667,"'":191,'(':333,')':333,
'*':389,'+':584,',':278,'-':333,'.':278,'/':278,':':278,';':278,'<':584,'=':584,'>':584,'?':556,'@':1015,
'[':278,'\\':278,']':278,'^':469,'_':556,'`':333,'{':334,'|':260,'}':334,'~':584,
'A':667,'B':667,'C':722,'D':722,'E':667,'F':611,'G':778,'H':722,'I':278,'J':500,'K':667,'L':556,'M':833,
'N':722,'O':778,'P':667,'Q':778,'R':722,'S':667,'T':611,'U':722,'V':667,'W':944,'X':667,'Y':667,'Z':611,
'a':556,'b':556,'c':500,'d':556,'e':556,'f':278,'g':556,'h':556,'i':222,'j':222,'k':500,'l':222,'m':833,
'n':556,'o':556,'p':556,'q':556,'r':333,'s':500,'t':278,'u':556,'v':500,'w':722,'x':500,'y':500,'z':500};
for (const d of '0123456789') AW[d] = 556;

const ctx2d = {
  font: '14px Arial',
  measureText(t){
    const m = /(\d+(?:\.\d+)?)px/.exec(this.font);
    const size = m ? parseFloat(m[1]) : 14;
    let width = 0;
    for (const ch of t) width += (AW[ch] ?? 556) / 1000 * size;
    return { width };
  }
};

const mkEl = () => {
  const el = {
    innerHTML:'', value:'', textContent:'', disabled:false,
    style: new Proxy({}, { set: () => true, get: () => '' }),
    classList: { toggle(){}, add(){}, remove(){}, contains(){return false} },
    addEventListener(){}, querySelectorAll(){ return []; },
    dataset:{}, focus(){}, select(){}
  };
  el.parentElement = el;
  return el;
};
const els = {};
const document = {
  createElement: () => ({ getContext: () => ctx2d }),
  getElementById: id => (els[id] ||= mkEl()),
  querySelector: () => mkEl(),
  querySelectorAll: () => [],
  addEventListener(){}
};

const api = new Function('document','navigator',
  script + '\nreturn { ALL, render, setBlocks: b => { blocks = b; }, code: () => $("code").value,'
         + ' toLines, indent, w, clone, PW, SAFE, HARD };'
)(document, { clipboard: { writeText: async () => {} } });

const LIMIT = 1000, MAXW = api.HARD;
console.log('Layout                  Zeichen  breiteste Zeile  Status');
console.log('-'.repeat(62));
let bad = 0;
for (const [name, bl] of Object.entries(api.ALL)) {
  const blocks = api.clone(bl);
  api.setBlocks(blocks);
  api.render();
  const n = api.code().length;

  let widest = 0;
  for (const ln of api.toLines(blocks)) {
    if (!ln.text.trim()) continue;
    const t = api.indent(ln.text, ln.a, ln.s, ln.b, ln.i);
    widest = Math.max(widest, api.w(t, ln.s, ln.b, ln.i));
  }

  const probs = [];
  if (n > LIMIT)      probs.push(`+${n - LIMIT} Zeichen`);
  if (widest > MAXW)  probs.push(`+${widest - MAXW}px breit`);
  if (probs.length) bad++;

  console.log(name.padEnd(24) + String(n).padStart(5)
    + String(widest + 'px').padStart(14) + '   '
    + (probs.length ? 'FEHLER: ' + probs.join(', ') : 'ok'));
}
console.log('-'.repeat(62));
console.log(bad ? `${bad} Layout(s) fehlerhaft` : `alle ${Object.keys(api.ALL).length} Layouts ok (<=${LIMIT} Zeichen, <=${MAXW}px)`);
