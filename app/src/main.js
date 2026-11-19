import { render, layouts, hitPanel, panelsFor, defaultFit } from './cover.js';
import { grades } from './grades.js';
import { initialState, sampleNames } from './shots.js';

const $ = selector => document.querySelector(selector);
const shot = new URLSearchParams(location.search).get('shot');
const state = initialState(shot);
const posterDefault=initialState();
const stories={poster:{title:posterDefault.title,subtitle:posterDefault.subtitle,quote:posterDefault.quote},magazine:{title:'HEAT INDEX',subtitle:'AFTER DARK',quote:'THE NIGHT IS YOURS - THE LEONIDA POST'}};
const storyGroup=layout=>layout==='magazine'?'magazine':'poster';
stories[storyGroup(state.layout)]={title:state.title,subtitle:state.subtitle,quote:state.quote};
const canvas = $('#cover');
const photos = [];
let scene, pending = false, replaceIndex = null, toastTimer, selectionVisible = false;

function notify(message) { $('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600); }
function activePhoto() { return (state.assignments[state.selected]??scene.panels[state.selected]?.photo??0)%Math.max(1,photos.length); }
function framing() {
  const key=`${state.layout}:${state.selected}`;
  return state.framing[key] ||= defaultFit(state.layout,activePhoto(),state.selected);
}
function syncPanel() {
  const index=activePhoto();$('#assignment').value=index;
  $('#panel-number').textContent=`PANEL ${String(state.selected+1).padStart(2,'0')}`;
  $('#zoom').value=Math.round(framing().zoom*100);$('#zoom-value').value=`${Math.round(framing().zoom*100)}%`;
  document.querySelectorAll('.photo').forEach((photo,photoIndex)=>photo.classList.toggle('active',photoIndex===index));
}
function drawThumbnails() {
  for(const layout of layouts) {
    const thumbnail=document.querySelector(`[data-layout="${layout}"] canvas`);
    render(thumbnail,{...state,...stories[storyGroup(layout)],layout,selected:-1,assignments:{},framing:{},accent:null},photos);
  }
}
function draw() {
  pending=false;canvas.width=state.width;canvas.height=state.height;scene=render(canvas,state,photos,{selection:selectionVisible&&!document.body.classList.contains('cover-only')});
  $('#dimensions').textContent=`${state.width} × ${state.height}`;$('#layout-name').textContent=`/ ${state.layout.toUpperCase()}`;
  document.querySelectorAll('.layout-tile').forEach(tile=>{tile.classList.toggle('active',tile.dataset.layout===state.layout);tile.setAttribute('aria-pressed',tile.dataset.layout===state.layout);});
}
function schedule(thumbnails=false) {
  if(!pending){pending=true;requestAnimationFrame(()=>{draw();if(thumbnails)drawThumbnails();});}
}
function photoUI() {
  $('#photos').replaceChildren();$('#assignment').replaceChildren();
  photos.forEach((photo,index)=>{
    const option=document.createElement('option');option.value=index;option.textContent=`${String(index+1).padStart(2,'0')} · ${photo.name}`;$('#assignment').append(option);
    const button=document.createElement('button');button.className='photo';button.title=`Assign ${photo.name} to selected panel`;button.setAttribute('aria-label',button.title);
    const image=document.createElement('img');image.src=photo.url;image.alt=photo.name;button.append(image);
    const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');button.append(number);
    button.onclick=()=>{state.assignments[state.selected]=index;delete state.framing[`${state.layout}:${state.selected}`];draw();syncPanel();};$('#photos').append(button);
  });
  $('#photo-count').textContent=`${photos.length} PHOTOS`;
}

for(const layout of layouts) {
  const button=document.createElement('button');button.className='layout-tile';button.dataset.layout=layout;
  const preview=document.createElement('canvas');preview.width=240;preview.height=150;preview.setAttribute('aria-hidden','true');
  const label=document.createElement('span');label.textContent=layout;button.append(preview,label);
  button.onclick=()=>{
    state.layout=layout;Object.assign(state,stories[storyGroup(layout)]);
    for(const field of ['title','subtitle','quote'])$(`#${field}`).value=state[field];
    state.selected=0;state.assignments={};state.accent=layout==='slash'?{panel:3,grade:'Neon Night'}:null;draw();syncPanel();
  };$('#layouts').append(button);
}
grades.forEach(grade=>{const option=document.createElement('option');option.textContent=grade;$('#grade').append(option);});
for(const field of ['title','subtitle','quote']) { $(`#${field}`).value=state[field];$(`#${field}`).oninput=event=>{state[field]=event.target.value;stories[storyGroup(state.layout)][field]=state[field];schedule(true);}; }
$('#grade').value=state.grade;$('#grade').onchange=event=>{state.grade=event.target.value;schedule(true);};
$('#grain').value=state.grain;$('#grain').oninput=event=>{state.grain=+event.target.value;$('#grain-value').value=state.grain;schedule(true);};
$('#size').value=`${state.width}x${state.height}`;$('#size').onchange=event=>{[state.width,state.height]=event.target.value.split('x').map(Number);draw();};
$('#assignment').onchange=event=>{state.assignments[state.selected]=+event.target.value;delete state.framing[`${state.layout}:${state.selected}`];draw();syncPanel();};
$('#zoom').oninput=event=>{framing().zoom=+event.target.value/100;$('#zoom-value').value=`${event.target.value}%`;schedule();};
$('#reset').onclick=()=>{delete state.framing[`${state.layout}:${state.selected}`];draw();syncPanel();notify('Original framing restored');};
$('#fit').onclick=()=>{canvas.scrollIntoView({block:'center',behavior:'smooth'});notify('Preview fitted to your workspace');};
let drag=null;
canvas.onpointerdown=event=>{
  const index=hitPanel(canvas,state,event.clientX,event.clientY);if(index<0)return;
  state.selected=index;selectionVisible=true;syncPanel();schedule();canvas.setPointerCapture(event.pointerId);
  drag={x:event.clientX,y:event.clientY,...framing()};notify(`Panel ${index+1} selected · drag to reframe`);
};
canvas.onpointermove=event=>{
  if(!drag)return;const bounds=canvas.getBoundingClientRect();
  framing().panX=Math.max(-1.5,Math.min(1.5,drag.panX-(event.clientX-drag.x)/bounds.width*2));
  framing().panY=Math.max(-1.5,Math.min(1.5,drag.panY-(event.clientY-drag.y)/bounds.height*2));schedule();
};
canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};

async function loadImage(url) { const image=new Image();image.src=url;await image.decode();return image; }
$('#add').onclick=()=>{replaceIndex=null;$('#files').multiple=true;$('#files').click();};
$('#replace').onclick=()=>{replaceIndex=activePhoto();$('#files').multiple=false;$('#files').click();};
$('#files').onchange=async event=>{
  const files=[...event.target.files];
  for(const file of files) {
    const url=URL.createObjectURL(file);
    try {
      const image=await loadImage(url);const photo={name:file.name.replace(/\.[^.]+$/,''),image,url,local:true};
      if(replaceIndex!==null) { if(photos[replaceIndex].local)URL.revokeObjectURL(photos[replaceIndex].url);photos[replaceIndex]=photo;state.captions[replaceIndex]=''; }
      else {photos.push(photo);state.captions.push('');state.assignments[state.selected]=photos.length-1;}
    } catch {URL.revokeObjectURL(url);notify(`Could not open ${file.name}. Try a JPG, PNG or WebP.`);}
  }
  event.target.value='';replaceIndex=null;photoUI();draw();drawThumbnails();syncPanel();
};
$('#remove').onclick=()=>{
  if(photos.length<=1){notify('Keep at least one photo in your cast');return;}
  const index=activePhoto();
  const oldPanels=panelsFor(state.layout,scene.width,scene.height);
  const remap=value=>value===index?0:value>index?value-1:value;
  oldPanels.forEach((panel,panelIndex)=>{state.assignments[panelIndex]=remap(state.assignments[panelIndex]??panel.photo);});
  const [removed]=photos.splice(index,1);if(removed.local)URL.revokeObjectURL(removed.url);state.captions.splice(index,1);
  photoUI();draw();drawThumbnails();syncPanel();notify('Photo removed from this project');
};

function png(width=state.width,height=state.height) {
  const output=document.createElement('canvas');output.width=width;output.height=height;render(output,state,photos);
  return new Promise((resolve,reject)=>output.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG export failed')),'image/png'));
}
async function download(width,height) {
  const blob=await png(width,height),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`vice-heat-${state.layout}-${width}x${height}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
$('#export').onclick=async()=>{await download(state.width,state.height);notify('Your cover is ready. Roll credits.');};
$('#all-sizes').onclick=async()=>{for(const [width,height]of [[1920,1080],[1080,1350],[1080,1080]])await download(width,height);notify('All three sizes exported');};
$('#copy').onclick=async()=>{
  if(!navigator.clipboard?.write||!window.ClipboardItem){notify('Clipboard PNG is unavailable here. Use Export PNG.');return;}
  try {await navigator.clipboard.write([new ClipboardItem({'image/png':png()})]);notify('PNG copied to clipboard');}catch{notify('Clipboard permission unavailable. Use Export PNG.');}
};

try {
  await Promise.all(sampleNames.map(async(name,index)=>{const url=`./samples/${name}.jpg`;photos[index]={name,image:await loadImage(url),url};}));
  if(shot&&shot!=='editor') {
    document.body.classList.add('cover-only');state.width=innerWidth;state.height=innerHeight;
  }
  photoUI();draw();drawThumbnails();syncPanel();
  window.studio={state,photos,render:()=>{draw();drawThumbnails();syncPanel();},png};
  document.documentElement.dataset.ready='true';
} catch(error) {console.error(error);notify('A sample could not load. Please serve the app with node serve.ts.');}
