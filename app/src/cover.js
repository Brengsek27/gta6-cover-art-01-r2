import { graded } from './grades.js';

export const layouts = ['slash', 'collage', 'magazine', 'filmstrip', 'diptych', 'grid', 'hero', 'duo', 'tilt'];
const cream = '#f3ead8';
const display = '"Arial Black", "DejaVu Sans", sans-serif';
const script = '"Snell Roundhand", "Brush Script MT", "Segoe Script", "Apple Chancery", "URW Chancery L", cursive, "Noto Sans", sans-serif';
const rect = (x, y, width, height, photo, extra = {}) => ({ x, y, width, height, photo, ...extra });

export function panelsFor(layout, width, height) {
  const bottom = height * .66, gap = 7;
  switch (layout) {
    case 'slash': return [
      rect(0, 0, width*.68, height*.80, 0, { polygon: [[0,0],[width*.68,0],[width*.60,height*.80],[0,height*.80]], captionLift: width*.047 }),
      rect(width*.657, 0, width*.343, height*.23, 5, { polygon: [[width*.68,0],[width,0],[width,height*.23],[width*.657,height*.23]], captionLift: height*.10 }),
      rect(width*.638, height*.23, width*.362, height*.19, 3, { polygon: [[width*.657,height*.23],[width,height*.23],[width,height*.42],[width*.638,height*.42]] }),
      rect(width*.619, height*.42, width*.381, height*.19, 4, { polygon: [[width*.638,height*.42],[width,height*.42],[width,height*.61],[width*.619,height*.61]] }),
      rect(width*.60, height*.61, width*.40, height*.19, 2, { polygon: [[width*.619,height*.61],[width,height*.61],[width,height*.80],[width*.60,height*.80]] }),
    ];
    case 'collage': return [rect(0,0,width*.47,bottom,0),rect(width*.47,0,width*.28,bottom*.53,2),rect(width*.75,0,width*.25,bottom*.53,3),rect(width*.47,bottom*.53,width*.53,bottom*.47,4)];
    case 'magazine': return [rect(0,0,width,height,5)];
    case 'filmstrip': return Array.from({ length: 4 }, (_, index) => rect(24 + index*(width-40)/4, height*.105, (width-40)/4-gap, height*.58, [0,1,3,4][index]));
    case 'diptych': return [rect(0,0,width*.5,bottom,0),rect(width*.5,0,width*.5,bottom,1)];
    case 'grid': return Array.from({length:6}, (_,index) => rect(index%3*width/3, Math.floor(index/3)*bottom/2,width/3,bottom/2,[0,1,2,3,4,0][index]));
    case 'hero': return [rect(0,0,width,bottom,0),rect(width*.70,height*.08,width*.25,height*.25,4)];
    case 'duo': return [rect(0,0,width*.63,bottom,0),rect(width*.63,0,width*.37,bottom,5)];
    case 'tilt': return [rect(width*.09,height*.13,width*.43,height*.51,0,{rotation:-.105}),rect(width*.52,height*.10,width*.38,height*.51,1,{rotation:.13})];
    default: return [];
  }
}

export function defaultFit(layout, photo, panel) {
  const seed = (layout.length*11 + photo*17 + panel*7) % 13;
  return { zoom: layout === 'grid' ? 1.05 + seed*.014 : 1, panX: (seed%3-1)*.035,
    panY: layout === 'tilt' ? (photo === 0 ? -.22 : photo === 1 ? .30 : 0) : photo === 0 ? (layout==='slash' ? -.55 : -.32) : photo === 1 && layout==='slash' ? -1.02 : photo === 5 && layout==='slash' ? -.35 : photo === 5 ? -.10 : 0 };
}

function path(context, panel) {
  context.beginPath();
  if (panel.polygon) { panel.polygon.forEach(([x,y], index) => index ? context.lineTo(x,y) : context.moveTo(x,y)); context.closePath(); }
  else context.rect(panel.x,panel.y,panel.width,panel.height);
}

function text(context, value, x, y, size, options = {}) {
  context.save();
  context.font = `${options.italic ? 'italic ' : ''}${options.weight || 800} ${size}px ${options.family || '"DejaVu Sans", sans-serif'}`;
  context.textAlign = options.align || 'left'; context.fillStyle = options.color || cream;
  if (options.shadow) { context.shadowColor = '#09051e'; context.shadowBlur = 12; context.shadowOffsetY = 3; }
  context.fillText(value, x, y, options.max || 10000); context.restore();
}

function headline(context, value, x, baseline, size, max) {
  context.save(); context.font = `italic 900 ${size}px ${display}`; context.lineJoin = 'round';
  const gradient = context.createLinearGradient(0,baseline-size,0,baseline); gradient.addColorStop(0,'#fff3cf'); gradient.addColorStop(.45,'#ffce80'); gradient.addColorStop(1,'#f55e92');
  context.lineWidth = size*.10; context.strokeStyle = '#150f24';
  context.strokeText(value,x+6,baseline+8,max); context.fillStyle = '#150f24'; context.fillText(value,x+6,baseline+8,max);
  context.strokeText(value,x,baseline,max); context.fillStyle = gradient; context.fillText(value,x,baseline,max); context.restore();
}

function neon(context, value, x, y, size, max, align='left') {
  context.save(); context.translate(x,y); context.rotate(-.035); context.transform(1,0,-.20,1,0,0);
  context.textAlign = align; context.font = `italic 500 ${size}px ${script}`;
  context.shadowColor = '#ff3caa'; context.shadowBlur = 16; context.strokeStyle = '#aa276f'; context.lineWidth = 3;
  context.strokeText(value,0,0,max); context.fillStyle = '#ffd5ec'; context.fillText(value,0,0,max); context.restore();
}

function stars(context,x,y,size,align='left') { text(context,'★ ★ ★ ★ ★',x,y,size,{color:'#ffce72',align}); }

function palm(context,x,y,size,lean=1) {
  context.save(); context.translate(x,y); context.scale(size,size); context.fillStyle = '#130f28';
  context.beginPath(); context.moveTo(-.03,0); context.quadraticCurveTo(.10*lean,-.5,.02*lean,-1); context.lineTo(.065*lean,-1); context.quadraticCurveTo(.18*lean,-.5,.04,0); context.fill();
  for (let index=0; index<7;index++) {
    const angle = -.4 + index*.59;
    context.save(); context.translate(.04*lean,-1); context.rotate(angle); context.beginPath(); context.moveTo(0,0); context.quadraticCurveTo(.30,-.18,.56,.12); context.quadraticCurveTo(.25,-.02,0,.045); context.fill(); context.restore();
  }
  context.restore();
}

function backdrop(context,width,height) {
  const gradient = context.createLinearGradient(0,0,0,height); gradient.addColorStop(0,'#17152f'); gradient.addColorStop(.55,'#71344f'); gradient.addColorStop(1,'#ef9d70');
  context.fillStyle = gradient; context.fillRect(0,0,width,height);
  const glow = context.createRadialGradient(width*.65,height*.36,10,width*.65,height*.36,width*.48); glow.addColorStop(0,'#fbad7955'); glow.addColorStop(1,'#ffb87100'); context.fillStyle=glow; context.fillRect(0,0,width,height);
  for (let index=0;index<34;index++) {
    const tower = 30+(index*41%135), x=index*width/34; context.fillStyle='#19162c'; context.fillRect(x,height*.66-tower,width/34-3,tower+80);
    context.fillStyle='#f6bb7977'; for(let floor=0;floor<tower/12-1;floor++) for(let window=0;window<3;window++) if((floor+window+index)%3) context.fillRect(x+5+window*8,height*.66-tower+8+floor*12,3,4);
  }
  palm(context,width*.05,height*.73,height*.52); palm(context,width*.94,height*.72,height*.65,-1);
}

function caption(context,value,panel,width,height) {
  if (!value || panel.height<height*.10) return;
  const size = width/1280*10.5, inset=12, available=panel.width-inset*2;
  context.save(); context.font=`700 ${size}px "DejaVu Sans",sans-serif`; context.letterSpacing = `${size*.06}px`;
  const pillWidth=Math.min(available,context.measureText(value).width+20);
  let left=panel.x+inset;
  if(panel.polygon) left = Math.max(...panel.polygon.filter(point=>point[1]>panel.y+panel.height*.5).map(point=>point[0]).filter(point=>point<panel.x+panel.width*.5),left)+inset;
  const top=panel.y+panel.height-34-(panel.captionLift||0);
  context.fillStyle='#131224df'; context.strokeStyle='#eee4cd88'; context.lineWidth=1;
  context.beginPath(); context.roundRect(left,top,pillWidth,23,4); context.fill(); context.stroke();
  context.fillStyle=cream; context.fillText(value,left+10,top+15,pillWidth-20); context.restore();
}

function seal(context,x,y,radius) {
  context.save(); context.translate(x,y); context.rotate(.12); context.shadowColor='#09061899'; context.shadowBlur=10; context.shadowOffsetY=5;
  context.beginPath(); for(let index=0;index<48;index++) { const angle=index*Math.PI/24, radiusStep=radius*(index%2?.88:1); const x=Math.cos(angle)*radiusStep,y=Math.sin(angle)*radiusStep; index?context.lineTo(x,y):context.moveTo(x,y); } context.closePath(); context.fillStyle='#f5c27c';context.fill(); context.shadowBlur=0;context.shadowOffsetY=0;
  context.strokeStyle='#4e2942';context.lineWidth=1.5; context.beginPath();context.arc(0,0,radius*.76,0,Math.PI*2);context.stroke();
  text(context,'VICE',0,-radius*.14,radius*.27,{align:'center',color:'#352037'});text(context,'HEAT',0,radius*.15,radius*.27,{align:'center',color:'#352037'});text(context,'ORIGINAL COVER ART',0,radius*.40,radius*.105,{align:'center',color:'#352037'});context.restore();
}

function barcode(context,x,y,width,height) {
  context.save();context.fillStyle=cream;context.fillRect(x,y,width,height);
  context.fillStyle='#171426'; let cursor=x+width*.07, index=0;
  while(cursor<x+width*.94) { const bar=(index*7%4+1)*width/145; context.fillRect(cursor,y+height*.12,bar,height*.53); cursor+=bar+width/95;index++; }
  text(context,'0 49381 00291 7',x+width/2,y+height*.87,height*.14,{align:'center',color:'#171426',max:width*.9});context.restore();
}

function band(context,width,height) {
  const top=height*.963; const gradient=context.createLinearGradient(0,top,width,height);gradient.addColorStop(0,'#edb777');gradient.addColorStop(.55,'#ea7992');gradient.addColorStop(1,'#9460b7');
  context.save();context.beginPath();context.rect(0,top,width,height-top);context.clip();
  context.fillStyle=gradient;context.fillRect(0,top,width,height-top);
  for(let index=0;index<9;index++) palm(context,index*width/8+14,height+10,height*.08,index%2?1:-1);
  text(context,'ONE COAST - NO RULES - COMING SOON',width/2,height*.988,Math.max(9,width*.009),{align:'center',color:'#1c1228'});
  context.restore();
}

function stickers(context,width,height,sealX,sealY,sealRadius,filmstrip=false,slash=false) {
  context.save();context.translate(width*.13,height*(filmstrip ? .700 : slash ? .80 : .56));context.rotate(-7*Math.PI/180);context.shadowColor='#09061799';context.shadowBlur=12;context.shadowOffsetY=5;
  context.fillStyle='#d92478';context.fillRect(-width*.1,-13,width*.23,29);context.shadowBlur=0;context.shadowOffsetY=0;
  text(context,"COLLECTOR'S EDITION",width*.015,6,width*.010,{align:'center'});context.restore();
  context.save();context.translate(sealX-sealRadius*.93,sealY+sealRadius*.28);context.rotate(-.24);context.strokeStyle=cream;context.lineWidth=1.5;context.shadowColor='#08051c';context.shadowBlur=6;
  context.beginPath();context.arc(0,0,width*.021,0,Math.PI*2);context.stroke();text(context,'EST •',0,-2,width*.007,{align:'center'});text(context,'2026',0,width*.010,width*.008,{align:'center'});context.restore();
}

function corner(context,width,height) {
  const size=width*30/1280,x=width*.025,y=height*.028;
  const gradient=context.createLinearGradient(x,y,x+size,y+size);gradient.addColorStop(0,'#f7bd70');gradient.addColorStop(1,'#d43c95');context.fillStyle=gradient;context.fillRect(x,y,size,size);
  text(context,'VH',x+size/2,y+size*.68,size*.45,{align:'center',italic:true,color:'#22162d'});
  text(context,'VICE HEAT STUDIO',x+size+9,y+size*.34,width*.0065,{shadow:true});text(context,'VOL 01 / NO. 01',x+size+9,y+size*.85,width*.009,{shadow:true});
}

function magazine(context,state,width,height) {
  const black=context.createLinearGradient(0,0,0,height);black.addColorStop(0,'#100d2288');black.addColorStop(.4,'#100d2200');black.addColorStop(.65,'#100d2200');black.addColorStop(1,'#100d22ee');context.fillStyle=black;context.fillRect(0,0,width,height);
  context.fillStyle='#110f20';context.fillRect(0,0,width,height*.157);
  headline(context,state.title,width*.035,height*.108,width*.13*state.furniture.titleSize/118,width*.92);
  text(context,'VOL 01 • NO. 01 • SUMMER 2026',width*.5,height*.140,width*.013,{align:'center'});
  text(context,'$7.99',width*.96,height*.140,width*.015,{align:'right'});
  text(context,'THE PEOPLE. THE PLACES. THE AFTER HOURS.',width*.04,height*.186,width*.012,{shadow:true});
  text(context,'VICE CITY',width*.04,height*.30,width*.045,{italic:true,shadow:true,max:width*.40});text(context,'BLUES',width*.04,height*.34,width*.056,{italic:true,shadow:true});
  text(context,'SUNSET STORIES / ISSUE 01',width*.04,height*.366,width*.011,{shadow:true});
  text(context,'CITY OF',width*.04,height*.49,width*.034,{italic:true,shadow:true});text(context,'SECRETS',width*.04,height*.526,width*.038,{italic:true,shadow:true});
  text(context,'EVERY STREET HAS A STORY',width*.04,height*.550,width*.010,{shadow:true});
  text(context,'NO WAY',width*.96,height*.59,width*.034,{italic:true,shadow:true,align:'right'});text(context,'BACK',width*.96,height*.627,width*.048,{italic:true,shadow:true,align:'right'});
  neon(context,state.subtitle,width*.5,height*.79,width*.091,width*.87,'center');stars(context,width*.5,height*.843,width*.027,'center');
  seal(context,width*.89,height*.244,width*.074);
  text(context,state.quote,width*.04,height*.904,width*.013,{max:width*.70});
}

export function render(canvas,state,photos,options={}) {
  const context=canvas.getContext('2d'); const width=canvas.width/canvas.height>1.4?1280:1000,height=width*canvas.height/canvas.width;
  context.save();context.scale(canvas.width/width,canvas.width/width);context.clearRect(0,0,width,height);backdrop(context,width,height);
  const panels=panelsFor(state.layout,width,height);
  panels.forEach((panel,index)=>{
    const photoIndex=(state.assignments[index]??panel.photo)%Math.max(1,photos.length), photo=photos[photoIndex];
    context.save();
    if(panel.rotation) { const centerX=panel.x+panel.width/2, centerY=panel.y+panel.height/2;context.translate(centerX,centerY);context.rotate(panel.rotation);context.translate(-centerX,-centerY); }
    if(state.layout!=='magazine' && state.layout!=='filmstrip') {context.shadowColor='#09051acc';context.shadowBlur=18;context.shadowOffsetY=9;path(context,panel);context.fillStyle=cream;context.fill();context.shadowColor='transparent';}
    context.save();path(context,panel);context.clip();
    if(photo?.image) {
      const image=graded(photo.image,state.accent?.panel===index?state.accent.grade:state.grade,state.grain);
      const defaults=defaultFit(state.layout,photoIndex,index);
      const framing=state.framing[`${state.layout}:${index}`]||defaults;
      const fit=Math.max(panel.width/image.width,panel.height/image.height)*framing.zoom;
      const drawWidth=image.width*fit,drawHeight=image.height*fit;
      const offsetX=Math.max(panel.width-drawWidth,Math.min(0,(panel.width-drawWidth)/2-framing.panX*panel.width));
      const originY=state.layout==='tilt' ? -(framing.panY-defaults.panY)*panel.height : (panel.height-drawHeight)/2-framing.panY*panel.height;
      const offsetY=Math.max(panel.height-drawHeight,Math.min(0,originY));
      context.drawImage(image,panel.x+offsetX,panel.y+offsetY,drawWidth,drawHeight);
      if(state.layout==='slash'&&index!==3) {context.fillStyle='rgba(255,155,84,.060)';context.fillRect(panel.x,panel.y,panel.width,panel.height);}
    } else {context.fillStyle='#45334b';context.fillRect(panel.x,panel.y,panel.width,panel.height);text(context,'ADD A PHOTO',panel.x+panel.width/2,panel.y+panel.height/2,18,{align:'center'});}
    context.restore();
    if(state.layout!=='magazine') {path(context,panel);context.lineWidth=state.layout==='tilt'?13:7;context.strokeStyle=cream;context.stroke();}
    if(['slash','collage','grid','diptych','duo','filmstrip'].includes(state.layout)) caption(context,state.captions[photoIndex],panel,width,height);
    if(options.selection&&state.selected===index) {path(context,panel);context.strokeStyle='#f781bb';context.lineWidth=3;context.stroke();}
    context.restore();
  });
  if(state.layout==='magazine') magazine(context,state,width,height);
  else {
    const lowerGradientTop=state.layout==='slash' ? .80 : .66;
    const lowerTop=state.layout==='slash' ? .80 : state.layout==='filmstrip' ? .69 : .665;
    const lower=context.createLinearGradient(0,height*lowerGradientTop,width,height);lower.addColorStop(0,'#2a182d');lower.addColorStop(1,'#14111f');context.fillStyle=lower;context.fillRect(0,height*lowerTop,width,height*(1-lowerTop));
    if(state.layout!=='slash') {
      const shade=context.createLinearGradient(0,height*.62,0,height*.96);shade.addColorStop(0,'#20152c00');shade.addColorStop(.34,'#20152cf5');shade.addColorStop(1,'#171222');
      context.fillStyle=shade;context.fillRect(0,height*.62,width,height*.35);
    }
    if(state.layout==='diptych') {context.fillStyle='#171222';context.fillRect(0,height*.67,width,height*.293);}
    const titleSize=state.furniture.titleSize*(width/1280)*(height/width>1?.99:1), base=height*(state.layout==='slash' ? .65 : .795);
    headline(context,state.title,width*.035,base,titleSize,state.layout==='filmstrip'?width*.92:width*.77);
    const step=width*.029, subtitleY=base+step*.75+titleSize*.16;
    neon(context,state.subtitle,width*(state.layout==='slash'?.42:.04),subtitleY,step,state.layout==='slash'?width*.55:width*.70);
    const starsY=subtitleY+step*.85+7;
    stars(context,width*(state.layout==='slash'?.42:.042),starsY,width*.018);
    text(context,state.quote,width*.04,height*(state.layout==='slash' ? .90 : .936),width*.010,{max:width*.72});
    if(state.layout!=='filmstrip') {
      const sealX=width*.90,sealY=height*(state.layout==='slash' ? .205 : .776),sealRadius=width*.061;
      seal(context,sealX,sealY,sealRadius);
      if(['slash','collage','grid','diptych','duo','hero'].includes(state.layout)) stickers(context,width,height,sealX,sealY,sealRadius,false,state.layout==='slash');
    }
    if(['slash','collage','grid','diptych','duo'].includes(state.layout)) corner(context,width,height);
    if(state.layout==='tilt'||state.layout==='hero') text(context,'VOL 01 / NO. 01',width*.04,height*.048,width*.012);
    if(state.layout==='filmstrip') {
      context.fillStyle='#14131e';context.fillRect(0,0,width,height*.105);
      for(let index=0;index<24;index++) {context.fillStyle='#e9c799';context.beginPath();context.roundRect(16+index*(width-24)/24,14,20,24,4);context.fill();}
      panels.forEach((panel,index)=>text(context,`0${index+1}`,panel.x+5,height*.083,width*.016,{color:'#e9c799'}));
      text(context,'35 MM • VICE HEAT • 400 ASA • 35 MM',width*.96,starsY,width*.010,{align:'right',color:'#e9c799'});
      for(let index=0;index<19;index++) {context.fillStyle='#e9c799';context.beginPath();context.roundRect(16+index*(width-24)/24,height*.892,20,18,3);context.fill();}
      const sealX=width*.92,sealY=height*.78,sealRadius=width*.045;
      seal(context,sealX,sealY,sealRadius);stickers(context,width,height,sealX,sealY,sealRadius,true);
    }
  }
  band(context,width,height);
  context.fillStyle='#171222';context.fillRect(0,height*.942,width,height*.021);
  text(context,'VICE HEAT - A VICE HEAT STUDIO PICTURE - STARRING YOU - SHOT ON YOUR OWN CAMERA - LETTERING AND SEAL ORIGINAL - CAT. VH-001',width*.5,height*.953,width*.0065,{align:'center',max:width*.93});
  if(state.layout==='magazine') barcode(context,width*.81,height*.88,width*.15,height*.069);
  else if(state.layout==='filmstrip') barcode(context,width*.84,height*.89,width*.13,height*.056);
  else barcode(context,width*.837,height*.865,width*.13,height*.075);
  context.restore();
  return {width,height,panels};
}

export function hitPanel(canvas,state,clientX,clientY) {
  const bounds=canvas.getBoundingClientRect(),width=canvas.width/canvas.height>1.4?1280:1000,height=width*canvas.height/canvas.width;
  const x=(clientX-bounds.left)/bounds.width*width,y=(clientY-bounds.top)/bounds.height*height;
  const panels=panelsFor(state.layout,width,height);
  const context=canvas.getContext('2d');
  for(let index=panels.length-1;index>=0;index--) {
    const panel=panels[index],angle=-(panel.rotation||0),centerX=panel.x+panel.width/2,centerY=panel.y+panel.height/2;
    const localX=centerX+(x-centerX)*Math.cos(angle)-(y-centerY)*Math.sin(angle),localY=centerY+(x-centerX)*Math.sin(angle)+(y-centerY)*Math.cos(angle);
    context.save();context.resetTransform();path(context,panel);const inside=context.isPointInPath(localX,localY);context.restore();if(inside)return index;
  }
  return -1;
}
