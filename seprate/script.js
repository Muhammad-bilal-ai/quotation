/* ---- Initial line items from the reference quotation ---- */
const SEED = [
  ["Careful Removal and Disposal of Existing Interlock Pavers and Installation of New Interlock Pavers Including Bedding Sand, Cutting, Alignment, Compaction and Finishing Complete.", "m²", 760, 95],
  ["Careful Removal and Disposal of Existing Carvestone and Installation of New Carvestone Including Surface Preparation, Bedding, Alignment, Cutting and Finishing Complete.", "m²", 46, 65],
  ["Careful Removal and Disposal of Existing Helcoverh and Installation of New Helcoverh Including Bedding, Alignment and Finishing Complete.", "Lm", 31, 55],
  ["Careful Removal and Disposal of Existing Tiles and Installation of New Tiles Including Surface Preparation, Adhesive, Grouting, Cutting, Alignment and Finishing Complete.", "m²", 122, 110],
  ["Crack Repair and Repainting Works Using Jotashield Premium Materials Including Surface Preparation, Application, Coating and Finishing Complete.", "m²", 775, 35],
  ["Careful Removal and Disposal of Existing Main Entrance Granite and Installation of New Marble or Granite Including Surface Preparation, Setting, Alignment and Finishing Complete.", "LS", 1, 14000],
  ["Careful Removal of Existing Entrance Column Gypsum Cladding and Installation of New Stone or Marble Cladding Including Surface Preparation, Fixing and Finishing Complete.", "LS", 1, 16500],
  ["Demolition of Existing Boundary Wall and Reconstruction with New Blockwork, Cement Plaster and Matching Paint Finish Complete Including Foundation, Backfilling, Plastering and Painting.", "LS", 1, 5400],
  ["Collection, Removal and Off-Site Disposal of All Construction Debris from the Work Area Including Loading, Transportation and Disposal at Approved Dumping Site.", "LS", 1, 6200]
];

const fmt = n => (isFinite(n)?n:0).toLocaleString('en-US',{minimumFractionDigits:2, maximumFractionDigits:2});

function rowHTML(desc="", unit="", qty="", rate=""){
  return `<tr>
    <td class="col-sr sr" data-col="sr"></td>
    <td class="desc" data-col="desc"><textarea class="f" oninput="recalc();autoGrow(this)">${desc}</textarea></td>
    <td class="col-unit" data-col="unit"><input class="f" style="text-align:center" value="${unit}" oninput="recalc()"></td>
    <td class="col-qty" data-col="qty"><input class="f num" type="number" step="any" value="${qty}" oninput="recalc()"></td>
    <td class="col-rate" data-col="rate"><input class="f num" type="number" step="any" value="${rate}" oninput="recalc()"></td>
    <td class="col-amt" data-col="amt"><span class="amt">0.00</span></td>
    <td class="col-x no-print"><button class="rmbtn" onclick="deleteEl(this.closest('tr'))">×</button></td>
  </tr>`;
}

function autoGrow(el){
  if(!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function makeCustomCell(key){
  const td = document.createElement('td');
  td.className = 'col-custom';
  td.setAttribute('data-col', key);
  td.innerHTML = '<input class="f" value="">';
  return td;
}

// Keep a row's cells in sync with the current header columns
// (drop removed columns, add any custom columns the user added).
function syncRowColumns(row){
  const headerCols = [...document.querySelectorAll('thead th[data-col]')].map(th=>th.dataset.col);
  const present = new Set(headerCols);
  row.querySelectorAll('td[data-col]').forEach(td=>{ if(!present.has(td.dataset.col)) td.remove(); });
  const rowCols = new Set([...row.querySelectorAll('td[data-col]')].map(td=>td.dataset.col));
  const colx = row.querySelector('.col-x');
  headerCols.forEach(key=>{ if(!rowCols.has(key)) row.insertBefore(makeCustomCell(key), colx); });
}

function addRow(desc,unit,qty,rate){
  document.getElementById('items').insertAdjacentHTML('beforeend', rowHTML(desc,unit,qty,rate));
  const row = document.querySelector('#items tr:last-child');
  syncRowColumns(row);
  autoGrow(row.querySelector('.desc textarea'));
  recalc();
}

function recalc(){
  let sub = 0;
  document.querySelectorAll('#items tr').forEach((tr,i)=>{
    const srCell = tr.querySelector('.sr');
    if(srCell) srCell.textContent = (i+1) + '.';
    const qtyEl = tr.querySelector('.col-qty input');
    const rateEl = tr.querySelector('.col-rate input');
    const amtEl = tr.querySelector('.amt');
    let amt;
    if(qtyEl && rateEl && amtEl){
      amt = (parseFloat(qtyEl.value)||0) * (parseFloat(rateEl.value)||0);
      amtEl.textContent = fmt(amt);
    } else if(amtEl){
      amt = parseFloat(amtEl.textContent.replace(/,/g,'')) || 0;
    } else {
      amt = 0;
    }
    sub += amt;
  });
  const st = document.getElementById('subtotal'); if(st) st.textContent = fmt(sub);
  const gt = document.getElementById('grandtotal'); if(gt) gt.textContent = fmt(sub);
}

function resetAll(){
  if(!confirm('Reset the whole quotation to defaults?\nThis restores every section and the example items and clears your edits.\n(Your saved company branding & logo are kept.)')) return;
  location.reload();
}

/* ---- Make footer + signature sections editable and removable ---- */
function addDel(container){
  const b = document.createElement('button');
  b.className = 'del no-print';
  b.type = 'button';
  b.textContent = '×';
  b.title = 'Remove this section';
  b.setAttribute('contenteditable','false');
  b.onclick = () => deleteEl(container);
  container.appendChild(b);
}

function enhanceSections(){
  // Footer info boxes: editable title + content, removable
  document.querySelectorAll('.fbox').forEach(box=>{
    box.classList.add('rmwrap');
    box.querySelectorAll('.fh, ul, p').forEach(el=>el.setAttribute('contenteditable','true'));
    addDel(box);
  });
  // Signature columns: editable text (inputs already editable), removable
  document.querySelectorAll('.sigrow .sc').forEach(sc=>{
    sc.classList.add('rmwrap');
    sc.querySelectorAll('h4, p.small, .lineitem').forEach(el=>el.setAttribute('contenteditable','true'));
    addDel(sc);
  });
}

// Add a × on each table header (remove column) + drag-to-reorder.
let dragCol = null;
function enhanceColumns(){
  document.querySelectorAll('thead th[data-col]').forEach(th=>{
    if(!th.querySelector('.del')){
      th.classList.add('rmwrap');
      const b = document.createElement('button');
      b.className = 'del coldel no-print';
      b.type = 'button';
      b.textContent = '×';
      b.title = 'Remove this column';
      b.onclick = () => removeColumn(th.dataset.col);
      th.appendChild(b);
    }
    if(!th.dataset.dragReady){
      th.dataset.dragReady = '1';
      th.setAttribute('draggable','true');
      th.title = 'Drag to reorder · hover for ×';
      th.addEventListener('dragstart', e=>{ dragCol = th.dataset.col; e.dataTransfer.effectAllowed='move'; th.classList.add('dragging'); });
      th.addEventListener('dragend', ()=>{ th.classList.remove('dragging'); document.querySelectorAll('th.dragover').forEach(x=>x.classList.remove('dragover')); });
      th.addEventListener('dragover', e=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; if(dragCol && dragCol!==th.dataset.col) th.classList.add('dragover'); });
      th.addEventListener('dragleave', ()=> th.classList.remove('dragover'));
      th.addEventListener('drop', e=>{ e.preventDefault(); th.classList.remove('dragover'); if(dragCol) moveColumn(dragCol, th.dataset.col); dragCol=null; });
    }
  });
}

// Move a whole column to another column's position (drag-reorder), with undo.
function moveColumn(fromKey, targetKey){
  if(!fromKey || fromKey === targetKey) return;
  const order = [...document.querySelectorAll('thead th[data-col]')].map(t=>t.dataset.col);
  const fromIdx = order.indexOf(fromKey), targetIdx = order.indexOf(targetKey);
  if(fromIdx < 0 || targetIdx < 0) return;
  const after = fromIdx < targetIdx;   // dropped to the right of its current spot
  const moves = [];
  const rows = [document.querySelector('thead tr'), ...document.querySelectorAll('#items tr')];
  rows.forEach(cont=>{
    const fromCell = cont.querySelector('[data-col="'+fromKey+'"]');
    const targetCell = cont.querySelector('[data-col="'+targetKey+'"]');
    if(!fromCell || !targetCell) return;
    const origNext = fromCell.nextSibling;
    if(after) cont.insertBefore(fromCell, targetCell.nextSibling);
    else cont.insertBefore(fromCell, targetCell);
    moves.push({parent:cont, node:fromCell, origNext, newNext:fromCell.nextSibling});
  });
  pushAction({
    undo(){ moves.forEach(m => insertBack(m.parent, m.node, m.origNext)); },
    redo(){ moves.forEach(m => insertBack(m.parent, m.node, m.newNext)); }
  });
}

// Add a new editable column (header + a cell in every row), with undo support.
let customColCount = 0;
function addColumn(){
  const key = 'custom' + (++customColCount);
  const headRow = document.querySelector('thead tr');
  const colxTh = headRow.querySelector('.col-x');
  const th = document.createElement('th');
  th.className = 'col-custom';
  th.setAttribute('data-col', key);
  th.innerHTML = '<span class="colttl" contenteditable="true">NEW COLUMN</span>';
  headRow.insertBefore(th, colxTh);
  const created = [{parent:headRow, node:th, next:colxTh}];
  document.querySelectorAll('#items tr').forEach(tr=>{
    const colxTd = tr.querySelector('.col-x');
    const td = makeCustomCell(key);
    tr.insertBefore(td, colxTd);
    created.push({parent:tr, node:td, next:colxTd});
  });
  enhanceColumns();
  pushAction({
    undo(){ created.forEach(c => c.node.remove()); },
    redo(){ created.forEach(c => insertBack(c.parent, c.node, c.next)); enhanceColumns(); }
  });
}

// Remove a whole column (header + every row cell), with undo support.
function removeColumn(key){
  const cells = [...document.querySelectorAll('thead th[data-col="'+key+'"], #items td[data-col="'+key+'"]')];
  if(!cells.length) return;
  const removed = cells.map(c => ({parent:c.parentNode, node:c, next:c.nextSibling}));
  removed.forEach(r => r.node.remove());
  recalc();
  pushAction({
    undo(){ removed.forEach(r => insertBack(r.parent, r.node, r.next)); recalc(); },
    redo(){ removed.forEach(r => r.node.remove()); recalc(); }
  });
}

/* ---- Undo / Redo for structural changes (delete section / add-remove rows) ----
   We keep the actual detached DOM node, so re-inserting restores all typed
   values and edits. Text typing inside fields keeps the browser's native undo. */
let undoStack = [], redoStack = [];

function pushAction(action){
  undoStack.push(action);
  redoStack = [];
  updateUndoUI();
}
function undo(){
  const a = undoStack.pop();
  if(!a) return;
  a.undo();
  redoStack.push(a);
  updateUndoUI();
}
function redo(){
  const a = redoStack.pop();
  if(!a) return;
  a.redo();
  undoStack.push(a);
  updateUndoUI();
}
function updateUndoUI(){
  const u = document.getElementById('undoBtn'), r = document.getElementById('redoBtn');
  if(u) u.disabled = undoStack.length === 0;
  if(r) r.disabled = redoStack.length === 0;
}
function insertBack(parent, el, next){
  if(next && next.parentNode === parent) parent.insertBefore(el, next);
  else parent.appendChild(el);
}

// Delete any section / subsection / item row, with undo support.
function deleteEl(el){
  if(!el) return;
  const isRow = el.tagName === 'TR';
  const parent = el.parentNode, next = el.nextSibling;
  el.remove();
  if(isRow) recalc();
  pushAction({
    undo(){ insertBack(parent, el, next); if(isRow) recalc(); },
    redo(){ el.remove(); if(isRow) recalc(); }
  });
}

// Add an item row from the button, with undo support.
function userAddRow(){
  addRow();
  const row = document.querySelector('#items tr:last-child');
  const parent = row.parentNode;
  pushAction({
    undo(){ row.remove(); recalc(); },
    redo(){ parent.appendChild(row); recalc(); }
  });
}

// Ctrl+Z / Ctrl+Y — only when NOT typing in a field (so native text undo still works).
document.addEventListener('keydown', e=>{
  const t = e.target;
  const editing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  if((e.ctrlKey || e.metaKey) && !editing){
    const k = e.key.toLowerCase();
    if(k === 'z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if(k === 'y'){ e.preventDefault(); redo(); }
  }
});

/* ---- Fit everything onto ONE A4 page when printing ----
   Uses `zoom` (not transform) so the layout box actually shrinks and the
   browser paginates it as a single page instead of adding a blank 2nd page. */
function fitToPrint(){
  const sheet = document.getElementById('sheet');
  sheet.style.zoom = '';
  // Conservative A4 target so it stays one page even with the print dialog's
  // default margins + optional browser headers/footers eating into the page.
  const PW = 720, PH = 950;
  const w = sheet.offsetWidth, h = sheet.offsetHeight;
  const scale = Math.min(PW / w, PH / h, 1);
  if(scale < 1) sheet.style.zoom = scale;
}
function unfitPrint(){
  document.getElementById('sheet').style.zoom = '';
}
window.addEventListener('beforeprint', fitToPrint);
window.addEventListener('afterprint', unfitPrint);

/* ---- Company branding: editable + saved in this browser ---- */
const BRAND_FIELDS = ['bEnName','bEnSub','bArName','bArSub','feat0','feat1','feat2','feat3','prepName','prepCo','prepPhone'];

function sizeFeats(){
  ['feat0','feat1','feat2','feat3'].forEach(id=>{
    const el = document.getElementById(id);
    el.setAttribute('size', Math.max(6, el.value.length + 1));
  });
}

function saveBrand(){
  sizeFeats();
  const data = {};
  BRAND_FIELDS.forEach(id => data[id] = document.getElementById(id).value);
  const img = document.getElementById('logoImg');
  data.logo = (img.style.display !== 'none') ? img.src : '';
  const st = document.getElementById('stampImg');
  data.stamp = (st.style.display !== 'none') ? st.src : '';
  const sz = document.getElementById('logoSize');
  data.logoSize = sz ? sz.value : 86;
  try { localStorage.setItem('imBrand', JSON.stringify(data)); } catch(e){}
}

function loadBrand(){
  let data; try { data = JSON.parse(localStorage.getItem('imBrand')); } catch(e){}
  if(!data) return;
  BRAND_FIELDS.forEach(id => { if(data[id] != null) document.getElementById(id).value = data[id]; });
  if(data.logo) setLogo(data.logo);
  if(data.stamp) setStamp(data.stamp);
  if(data.logoSize){ document.getElementById('logoSize').value = data.logoSize; applyLogoSize(data.logoSize); }
}

function applyLogoSize(px){
  document.querySelector('.logo').style.setProperty('--logo-w', px + 'px');
}
function setLogoSize(px){
  const sz = document.getElementById('logoSize');
  if(sz) sz.value = px;
  applyLogoSize(px);
  saveBrand();
}

function setStamp(src){
  const st = document.getElementById('stampImg');
  st.src = src; st.style.display = 'block';
  document.getElementById('stampHint').style.display = 'none';
}

function uploadStamp(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => { setStamp(e.target.result); saveBrand(); };
  reader.readAsDataURL(file);
}

function setLogo(src){
  const img = document.getElementById('logoImg');
  img.src = src; img.style.display = 'block';
  document.getElementById('logoSvg').style.display = 'none';
}

function resetLogo(){
  const img = document.getElementById('logoImg');
  img.style.display = 'none'; img.removeAttribute('src');
  document.getElementById('logoSvg').style.display = 'block';
  saveBrand();
}

function uploadLogo(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => { setLogo(e.target.result); saveBrand(); };
  reader.readAsDataURL(file);
}

/* build seed rows */
SEED.forEach(r=>addRow(r[0],r[1],r[2],r[3]));
recalc();
loadBrand();
sizeFeats();
enhanceSections();
enhanceColumns();
updateUndoUI();
document.querySelectorAll('.center-head textarea').forEach(autoGrow);
