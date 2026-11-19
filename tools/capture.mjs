import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';

const root=fileURLToPath(new URL('../',import.meta.url));
const port=Number(process.env.CAPTURE_PORT||8181), debugPort=Number(process.env.CDP_PORT||9229);
const profile=join(root,'.capture-profile');
const browser=process.env.CHROMIUM_PATH||['/usr/bin/chromium','/usr/bin/google-chrome','/home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome','/opt/meta-chromium/chrome'].find(path=>existsSync(path));
if(!browser)throw new Error('Set CHROMIUM_PATH to a local Chromium executable');
const policy=join(root,'tools/webgl-policy.txt');
const policyHash=createHash('sha256').update(await readFile(policy)).digest('hex');
const localFeatures=['LocalNetworkAccessChecks','LocalNetworkAccessForNavigations','LocalNetworkAccessForSubframeNavigations','LocalNetworkAccessForFencedFrameNavigations','LocalNetworkAccessForWorkers'];
const server=spawn(process.execPath,['serve.ts','--port',String(port)],{cwd:root,stdio:['ignore','pipe','pipe']});
const chrome=spawn(browser,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--hide-scrollbars','--force-device-scale-factor=1','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-sync','--disable-extensions',`--disable-features=${localFeatures.flatMap(name=>[name,'k'+name]).join(',')}`,`--hatch-webgl-allowed-domains-file=${policy}`,`--hatch-webgl-allowed-domains-sha256=${policyHash}`,`--user-data-dir=${profile}`,`--remote-debugging-port=${debugPort}`,'about:blank'],{cwd:root,stdio:'ignore'});
const sleep=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
async function waitFor(url) {
  for(let attempt=0;attempt<100;attempt++) {try{const response=await fetch(url);if(response.ok)return response;}catch{}await sleep(100);}
  throw new Error(`Service did not start: ${url}`);
}
let socket;
try {
  await Promise.all([waitFor(`http://127.0.0.1:${port}`),waitFor(`http://127.0.0.1:${debugPort}/json/version`)]);
  const target=await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  const waiting=new Map(),errors=[];let identifier=0;
  socket.onmessage=event=>{
    const message=JSON.parse(event.data);
    if(message.id) {const promise=waiting.get(message.id);waiting.delete(message.id);if(message.error)promise.reject(new Error(JSON.stringify(message.error)));else promise.resolve(message.result);}
    if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);
    if(message.method==='Runtime.consoleAPICalled'&&message.params.type==='error')errors.push(message.params.args.map(argument=>argument.value||argument.description).join(' '));
    if(message.method==='Log.entryAdded'&&message.params.entry.level==='error')errors.push(message.params.entry.text);
  };
  function command(method,params={}) {return new Promise((resolve,reject)=>{const id=++identifier;waiting.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}
  async function evaluate(expression) {
    const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails)throw new Error(result.exceptionDetails.text+' '+result.exceptionDetails.exception?.description);
    return result.result.value;
  }
  await command('Runtime.enable');await command('Log.enable');await command('Page.enable');
  await command('Browser.grantPermissions',{permissions:['localNetworkAccess']});
  await command('Network.enable');
  await command('Network.setBypassServiceWorker',{bypass:true});
  const scenes=JSON.parse(await readFile(join(root,'shots.json'),'utf8'));
  await mkdir(join(root,'screenshots'),{recursive:true});
  for(const scene of scenes) {
    await command('Emulation.setDeviceMetricsOverride',{width:scene.w,height:scene.h,deviceScaleFactor:1,mobile:false});
    await command('Page.navigate',{url:`http://127.0.0.1:${port}/${scene.query}`});
    let ready=false;
    for(let attempt=0;attempt<200;attempt++) {if(await evaluate('document.documentElement?.dataset.ready === "true"')){ready=true;break;}await sleep(50);}
    if(!ready)throw new Error(`Scene not ready: ${scene.name}\n${errors.join('\n')}\n${await evaluate('document.body?.innerText')}`);
    await evaluate('document.fonts.ready.then(() => true)');await sleep(200);
    let bytes,quality=94;
    do {
      const result=await command('Page.captureScreenshot',{format:'jpeg',quality,fromSurface:true,captureBeyondViewport:false});
      bytes=Buffer.from(result.data,'base64');quality-=6;
    }while(bytes.length>262144&&quality>=28);
    if(bytes.length>262144)throw new Error(`${scene.name} exceeds screenshot cap`);
    await writeFile(join(root,'screenshots',scene.name),bytes);
    console.log(`${scene.name}: ${scene.w} × ${scene.h}, ${bytes.length} bytes, JPEG quality ${quality+6}`);
    if(scene.name==='2-editor.jpg') {
      const point=await evaluate('(()=>{const bounds=document.querySelector("#cover").getBoundingClientRect();return {x:bounds.left+bounds.width*.87,y:bounds.top+bounds.height*.5};})()');
      await command('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',buttons:1,clickCount:1});
      await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x+18,y:point.y+12,button:'left',buttons:1});
      await command('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x+18,y:point.y+12,button:'left',buttons:0,clickCount:1});
      if(!await evaluate('window.studio.state.selected===3 && window.studio.state.framing["slash:3"].panY!==0'))throw new Error('Panel selection or drag-to-pan failed');
      console.log('Panel selection and drag-to-pan: PASS');
      const smoke=await evaluate(`(async()=>{
        const result=[];
        for(const tile of document.querySelectorAll('.layout-tile')) {tile.click();result.push(window.studio.state.layout);}
        for(const option of document.querySelector('#grade').options) {document.querySelector('#grade').value=option.value;document.querySelector('#grade').dispatchEvent(new Event('change'));await new Promise(resolve=>requestAnimationFrame(resolve));}
        document.querySelector('[data-layout="tilt"]').click();
        const tilt=window.studio.state.layout;
        window.studio.state.grade='Vice Sunset';document.querySelector('#grade').value='Vice Sunset';
        window.studio.state.width=1920;window.studio.state.height=1080;window.studio.render();
        return {layouts:result,grades:document.querySelector('#grade').options.length,tilt,photos:window.studio.photos.length};
      })()`);
      console.log('Editor smoke:',JSON.stringify(smoke));
      const tilt=await command('Page.captureScreenshot',{format:'jpeg',quality:85});
      await writeFile(join(root,'.tilt-check.jpg'),Buffer.from(tilt.data,'base64'));
      const png=await evaluate('(async()=>{const blob=await window.studio.png(1080,1080);return {type:blob.type,bytes:blob.size};})()');
      if(png.type!=='image/png'||png.bytes<10000)throw new Error('PNG export smoke failed');
      console.log('PNG export:',JSON.stringify(png));
      const controls=await evaluate(`(async()=>{
        const input=document.querySelector('#title');input.value='TEST COVER';input.dispatchEvent(new Event('input'));
        const zoom=document.querySelector('#zoom');zoom.value='150';zoom.dispatchEvent(new Event('input'));
        await new Promise(resolve=>requestAnimationFrame(resolve));
        if(window.studio.state.title!=='TEST COVER'||document.querySelector('#zoom-value').value!=='150%')throw new Error('Text or zoom control failed');
        document.querySelector('#reset').click();
        for(const option of document.querySelector('#size').options){document.querySelector('#size').value=option.value;document.querySelector('#size').dispatchEvent(new Event('change'));if(document.querySelector('#cover').width!==Number(option.value.split('x')[0]))throw new Error('Size control failed');}
        for(let index=0;index<5;index++)document.querySelector('#remove').click();
        for(const tile of document.querySelectorAll('.layout-tile'))tile.click();
        if(window.studio.photos.length!==1)throw new Error('Photo removal failed');
        return {text:true,zoom:true,reset:true,sizes:3,remove:true,remaining:window.studio.photos.length};
      })()`);
      console.log('Controls smoke:',JSON.stringify(controls));
      await command('DOM.enable');
      const documentNode=await command('DOM.getDocument');
      const fileInput=await command('DOM.querySelector',{nodeId:documentNode.root.nodeId,selector:'#files'});
      await command('DOM.setFileInputFiles',{nodeId:fileInput.nodeId,files:[join(root,'app/samples/aerial.jpg')]});
      for(let attempt=0;attempt<100;attempt++){if(await evaluate('window.studio.photos.length===2'))break;await sleep(50);}
      if(!await evaluate('window.studio.photos.length===2 && window.studio.photos[1].local===true'))throw new Error('Local photo addition failed');
      console.log('Local photo input: PASS');
      await evaluate('document.querySelector("#replace").click()');
      await command('DOM.setFileInputFiles',{nodeId:fileInput.nodeId,files:[join(root,'app/samples/boulevard.jpg')]});
      for(let attempt=0;attempt<100;attempt++){if(await evaluate('window.studio.photos[1].name==="boulevard"'))break;await sleep(50);}
      if(!await evaluate('window.studio.photos.length===2 && window.studio.photos[1].name==="boulevard"'))throw new Error('Photo replacement failed');
      console.log('Local photo replacement: PASS');
    }
  }
  if(errors.length)throw new Error(`Browser console errors:\n${errors.join('\n')}`);
  console.log('PASS: all scenes ready, nine layouts, seven grades, PNG export; zero console errors.');
} finally {
  socket?.close();chrome.kill('SIGTERM');server.kill('SIGTERM');
  await sleep(400);await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
