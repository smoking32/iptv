var App=(function(){
var C=window.CFG,tk,wa,mode='',data={},ci=0,li=0,focus='cats',q='',kbi=0,list=[],searching=false,avp=null;
var view='browse',cur=null,D={},eps=[],SE=[],sIx=0,allEps=[],isLive=false,paused=false,pos=0,dur=0,osdT=null;
var KEYS='1234567890qwertyuiopasdfghjklñzxcvbnm'.split('').concat(['DEL','ESP','CLR']),COLS=10,ROWS=12;
var MENU=[{m:'live',t:'TV en vivo'},{m:'vod',t:'Películas'},{m:'series',t:'Series'},{m:'later',t:'Ver más tarde'},{m:'fav',t:'Favoritos'},{m:'cont',t:'Continuar viendo'},{m:'set',t:'Ajustes'}],NV=[[6,-1,-1,1],[6,3,0,2],[6,4,1,-1],[1,5,0,4],[2,5,3,-1],[3,-1,0,-1],[-1,0,-1,-1]],mi=0;
var M={live:{p:'live',t:'TV EN VIVO',next:'vod'},vod:{p:'vod',t:'PELÍCULAS',next:'series'},series:{p:'series',t:'SERIES',next:'live'}};
function $(i){return document.getElementById(i);}
function norm(s){return String(s||'').toLowerCase().replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/ñ/g,'n');}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function status(t){$('status').innerHTML=t||'';}
function get(u,cb,er){var x=new XMLHttpRequest();x.open('GET',u,true);
 x.onreadystatechange=function(){if(x.readyState==4){var j;try{j=JSON.parse(x.responseText);}catch(e){if(er)er();return;}cb(j);}};x.send();}
function api(a,cb){get(C.server+'/player_api.php?username='+C.user+'&password='+C.pass+'&action='+a,cb,function(){status('Error de servidor/red');});}

/* ---------- TEMAS / AJUSTES / RECOMENDADOS (v24) ---------- */
var THEMES=[{id:'classic',name:'Clásico',cat:'lista',bg:'none',home:'tiles'},{id:'netflix',name:'Netflix',cat:'carteles',bg:'f1',home:'rows'},{id:'medianoche',name:'Medianoche',cat:'lista',bg:'f2',home:'tiles'},{id:'atardecer',name:'Atardecer',cat:'lista',bg:'f3',home:'tiles'}];
var BGS=[{id:'none',name:'Sin imagen'},{id:'f1',name:'Cine',f:'bg/fondo1.jpg'},{id:'f2',name:'Noche',f:'bg/fondo2.jpg'},{id:'f3',name:'Atardecer',f:'bg/fondo3.jpg'},{id:'f4',name:'Aurora',f:'bg/fondo4.jpg'},{id:'mi',name:'Mi imagen (fondo.jpg)',f:'fondo.jpg'}];
function lsGet(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function themeIx(id){for(var k=0;k<THEMES.length;k++)if(THEMES[k].id==id)return k;return 0;}
var THEME=THEMES[themeIx(lsGet('xt_theme'))].id,CATSET=!!lsGet('xt_cat'),CAT=lsGet('xt_cat')||THEMES[themeIx(THEME)].cat;
function bgIx(id){for(var k=0;k<BGS.length;k++)if(BGS[k].id==id)return k;return 0;}
var BGSET=!!lsGet('xt_bg'),BG=BGS[bgIx(lsGet('xt_bg')||THEMES[themeIx(THEME)].bg)].id;
var HOMESET=!!lsGet('xt_home'),HOMEMODE=lsGet('xt_home')||THEMES[themeIx(THEME)].home,HM=false,hrow=-1,hidx={},HREC={vod:null,series:null,busy:false,tm:0};
var setPage='main',siMain=0,AFF=ld('aff'),GC=6,GR=2,G=false;
function applyTheme(){try{var b=BGS[bgIx(BG)];document.body.className='th-'+THEME+(b.f?' hasbg':'');$('bgimg').style.backgroundImage=b.f?"url('"+b.f+"')":'none';}catch(e){}}
function cycleBg(d){BG=BGS[(bgIx(BG)+d+BGS.length)%BGS.length].id;BGSET=true;lsSet('xt_bg',BG);applyTheme();lastSig='';render();}
function cycleTheme(d){var i=(themeIx(THEME)+d+THEMES.length)%THEMES.length;THEME=THEMES[i].id;lsSet('xt_theme',THEME);
 if(!CATSET)CAT=THEMES[i].cat;if(!BGSET)BG=THEMES[i].bg;if(!HOMESET)HOMEMODE=THEMES[i].home;hrow=-1;applyTheme();lastSig='';render();}
function toggleHome(){HOMEMODE=HOMEMODE=='rows'?'tiles':'rows';HOMESET=true;lsSet('xt_home',HOMEMODE);hrow=-1;if(mi==5)mi=0;lastSig='';render();}
function toggleCat(){CAT=CAT=='carteles'?'lista':'carteles';CATSET=true;lsSet('xt_cat',CAT);lastSig='';render();}
function isGrid(){return CAT=='carteles'&&mode!='live'&&view!='eps'&&!searching&&(focus=='list'||focus=='cont'||focus=='later');}
function gmove(up,dn,lf,rt){var n=list.length;
 if(up){if(li>=GC)li-=GC;}
 else if(dn){if(li+GC<n)li+=GC;else if(Math.floor(li/GC)<Math.floor((n-1)/GC))li=n-1;}
 else if(lf){if(li>0)li--;}
 else if(rt){if(li<n-1)li++;}
 render();}
function cardIn(it){var m=[];prep(it);if(it.rt)m.push(it.rt);if(it.y)m.push(it.y);
 return '<div class=\"pp\" style=\"'+bg(it.stream_icon||it.cover)+'\"></div><div class=\"pn\">'+esc(it.t||it.name)+'</div><div class=\"pm\">'+esc(m.join('  '))+'</div>';}
function setCount(){return setPage=='iptv'?SRVS.length+4:setPage=='ap'?5:3;}
function setTitle(){return setPage=='ap'?'Ajustes · Apariencia':setPage=='iptv'?'Ajustes · Configurar IPTV':'Ajustes';}
function setRows(){
 if(setPage=='iptv')return iptvRows();
 if(setPage=='ap')return ['Tema:   <  '+THEMES[themeIx(THEME)].name+'  >','Fondo:   <  '+BGS[bgIx(BG)].name+'  >','Inicio:   <  '+(HOMEMODE=='rows'?'Con carteles':'Botones')+'  >','Películas y series:   <  '+(CAT=='carteles'?'Carteles':'Lista')+'  >','Reiniciar recomendaciones'];
 return ['Apariencia   ·   '+THEMES[themeIx(THEME)].name,'Configurar IPTV   ·   '+(SRV?SRV.name:'sin servidor'),'Diagnóstico del reproductor'];}
function setHelp(){return setPage=='iptv'?'2: Eliminar servidor &nbsp; OK: Elegir &nbsp; RETURN: Atrás':setPage=='ap'?'IZQ / DER: Cambiar &nbsp; RETURN: Atrás':'OK: Entrar &nbsp; RETURN: Atrás';}
function setKey(e,c){var up=c==tk.KEY_UP,dn=c==tk.KEY_DOWN,lf=c==tk.KEY_LEFT,rt=c==tk.KEY_RIGHT,ok=c==tk.KEY_ENTER,back=c==tk.KEY_RETURN||c==tk.KEY_EXIT,nS=SRVS.length;
 if(back){wa.blockNavigation(e);if(setPage=='main')focus='menu';else{setPage='main';si=siMain;}lastSig='';render();return;}
 if(up&&si>0){si--;render();return;}
 if(dn&&si<setCount()-1){si++;render();return;}
 if(setPage=='main'){if(ok){siMain=si;if(si==0){setPage='ap';si=0;}else if(si==1){setPage='iptv';si=0;}else{showDiag();return;}lastSig='';render();}return;}
 if(setPage=='ap'){
  if(si==0&&(lf||rt||ok))cycleTheme(lf?-1:1);
  else if(si==1&&(lf||rt||ok))cycleBg(lf?-1:1);
  else if(si==2&&(lf||rt||ok))toggleHome();
  else if(si==3&&(lf||rt||ok))toggleCat();
  else if(si==4&&ok){clearRec();msg('Recomendaciones reiniciadas');}
  return;}
 if((c==tk.KEY_RED||c==tk.KEY_2)&&si<nS){delSrv(si);return;}
 if(ok){if(si<nS)useSrv(si);else if(si==nS)enterAdd();else if(si==nS+1)enterAddEpg();else if(si==nS+2){if(epgUrl()){epgReset();epgLoad(true);msg('Actualizando guía...');}else msg('Primero configura la guía');}else{cclear();msg('Caché borrada');}}}
function bumpAff(it){var md=it&&(it.type||mode);if(!it||it.category_id===undefined||md=='live')return;
 var k=md+'|'+it.category_id;AFF[k]=Math.min(10,(AFF[k]||0)+1);sv('aff',AFF);}
function buildRec(A,d,md){md=md||mode;var bad={},cnt={},out=[],i,x,it,r,r5,sc,age,cid,now=new Date().getTime()/1000;
 for(i=0;i<d.real.length;i++){x=d.real[i];if(/adult|xxx|porn|erot|\+\s?18|18\s?\+/i.test(x.category_name||''))bad[x.category_id]=1;}
 for(i=0;i<A.length;i++){it=A[i];if(!it||bad[it.category_id])continue;
  r5=parseFloat(it.rating_5based);r=parseFloat(it.rating);r=r5>0?r5:(r>0?r/2:0);
  if(r>0&&r<3)continue;
  if(md=='vod'&&PRG['m'+it.stream_id]&&PRG['m'+it.stream_id].f)continue;
  age=now-(parseInt(it.added||it.last_modified,10)||0);
  sc=r+(age>0&&age<31536000?(1-age/31536000):0)+Math.min(1.5,(AFF[md+'|'+it.category_id]||0)*0.4);
  out.push({it:it,sc:sc});}
 out.sort(function(u,v){return v.sc-u.sc;});
 var res=[];for(i=0;i<out.length&&res.length<60;i++){cid=out[i].it.category_id;if((cnt[cid]||0)>=10)continue;cnt[cid]=(cnt[cid]||0)+1;res.push(out[i].it);}
 return res;}
function getRec(cb){var d=data[mode];if(d.rec){cb();return;}
 var ck='rec_'+sid()+'_'+mode,cc=cget(ck,TTL());if(cc&&cc.length){d.rec=cc;cb();return;}
 function done(A){d.rec=buildRec(A,d);if(d.rec.length)cset(ck,trimItems(d.rec));loading=false;status('');cb();}
 if(d.all){done(d.all);return;}
 loading=true;status('Preparando recomendados...');
 api(allAction(),function(s){d.all=s instanceof Array?s:[];done(d.all);});}
function clearRec(){var ks=[],i,n,k;
 try{for(i=0;i<localStorage.length;i++){n=localStorage.key(i);if(n&&n.indexOf('xc_rec_')==0)ks.push(n);}for(i=0;i<ks.length;i++)localStorage.removeItem(ks[i]);}catch(e){}
 AFF={};sv('aff',AFF);HREC={vod:null,series:null,busy:false,tm:0};for(k in data)if(data[k])data[k].rec=null;}

/* ---------- INICIO CON CARTELES (v25) ---------- */
function homeRows(){var r=[],c=contList();
 if(c.length)r.push({t:'Continuar viendo',items:c,ty:'cont'});
 if(HREC.vod&&HREC.vod.length)r.push({t:'Películas recomendadas',items:HREC.vod,ty:'vod'});
 if(HREC.series&&HREC.series.length)r.push({t:'Series recomendadas',items:HREC.series,ty:'series'});
 return r;}
function homeRedraw(){if(focus=='menu'&&HOMEMODE=='rows'){lastSig='';render();}}
function homeLoad(){
 if(HREC.busy||!SRV||SRV.type!='xtream'||C.noAccount)return;
 var H=HREC,md=!H.vod?'vod':!H.series?'series':'';if(!md)return;
 var ck='rec_'+sid()+'_'+md,cc=cget(ck,TTL()),base=C.server+'/player_api.php?username='+C.user+'&password='+C.pass+'&action=',fail=function(){if(H!==HREC)return;H.busy=false;H[md]=[];};
 if(cc&&cc.length){H[md]=cc.slice(0,30);homeRedraw();homeLoad();return;}
 H.busy=true;homeRedraw();
 get(base+'get_'+md+'_categories',function(cs){if(H!==HREC)return;
  get(base+(md=='vod'?'get_vod_streams':'get_series'),function(A){if(H!==HREC)return;
   var r=buildRec(A instanceof Array?A:[],{real:cs instanceof Array?cs:[]},md);
   if(r.length)cset(ck,trimItems(r));
   H[md]=r.slice(0,30);H.busy=false;A=null;homeRedraw();homeLoad();},fail);},fail);}
function drawRows(){var h='',i,j,R=homeRows(),a,r,it,n,sel,ro,fr,bar,P=[0,1,2,3,4];
 if(mi==5)mi=0;
 for(i=0;i<P.length;i++)h+='<div class="hp'+(hrow<0&&mi==P[i]?' on':'')+'">'+esc(MENU[P[i]].t)+'</div>';
 $('hpills').innerHTML=h;$('hpills').style.display='block';
 if(hrow>=R.length)hrow=R.length-1;
 h='';
 if(!R.length)h='<div class="hrt">'+(HREC.busy?'Preparando recomendaciones...':'Aquí aparecerá lo que dejes a medias y tus recomendaciones')+'</div>';
 a=Math.max(0,hrow-1);
 for(i=a;i<a+2&&i<R.length;i++){r=R[i];n=r.items.length;sel=hidx[r.ty]||0;if(sel>=n)sel=hidx[r.ty]=0;ro=start(n,sel,9);
  h+='<div class="hrt">'+esc(r.t)+'</div><div class="hrl">';
  for(j=ro;j<ro+9&&j<n;j++){it=r.items[j];prep(it);bar='';
   if(r.ty=='cont'){fr=PRG[it.k];if(fr&&fr.d>0)bar='<div class="hbar"><div style="width:'+Math.min(100,Math.round(fr.p*100/fr.d))+'%"></div></div>';}
   h+='<div class="hc'+(i==hrow&&j==sel?' on':'')+'"><div class="hpp" style="'+bg(it.stream_icon||it.cover)+'">'+bar+'</div><div class="hn">'+esc(it.t||it.name)+'</div></div>';}
  h+='</div>';}
 $('hrows').innerHTML=h;$('hrows').style.display='block';
 if(!HREC.tm&&!HREC.busy&&(!HREC.vod||!HREC.series)){HREC.tm=setTimeout(function(){HREC.tm=0;homeLoad();},700);}}
function homeOpen(r,i){var it=r.items[i];if(!it)return;HM=true;
 if(r.ty=='cont'){playCont(it);return;}
 mode=r.ty;LT=false;view='browse';openDetail(it);}
function homeKey(e,c){var up=c==tk.KEY_UP,dn=c==tk.KEY_DOWN,lf=c==tk.KEY_LEFT,rt=c==tk.KEY_RIGHT,ok=c==tk.KEY_ENTER,back=c==tk.KEY_RETURN||c==tk.KEY_EXIT,R=homeRows(),P=[6,0,1,2,3,4],pi=0,k,r,mm;
 if(hrow>=R.length)hrow=R.length-1;
 if(hrow>=0){r=R[hrow];k=r.ty;
  if(lf){if((hidx[k]||0)>0)hidx[k]--;}
  else if(rt){if((hidx[k]||0)<r.items.length-1)hidx[k]=(hidx[k]||0)+1;}
  else if(up)hrow--;
  else if(dn){if(hrow<R.length-1)hrow++;}
  else if(ok){homeOpen(r,hidx[k]||0);return;}
  else if(back){wa.blockNavigation(e);hrow=-1;}
  else return;
  render();return;}
 for(k=0;k<P.length;k++)if(P[k]==mi)pi=k;
 if(lf){if(pi>0)mi=P[pi-1];}
 else if(rt){if(pi<P.length-1)mi=P[pi+1];}
 else if(dn){if(R.length)hrow=0;}
 else if(ok){HM=false;mm=MENU[mi].m;if(mm=='set')enterSettings();else if(mm=='later')enterLater();else if(mm=='cont')enterCont();else if(mm=='fav'){gotoFav=true;mode='live';enterMode();}else{mode=mm;enterMode();}return;}
 else if(back){wa.blockNavigation(e);wa.sendReturnEvent();return;}
 else return;
 render();}
function enterMode(){
 HM=false;HCM=false;LT=false;view='browse';searching=false;q='';ci=0;li=0;focus='cats';list=[];
 if(SRV&&SRV.type=='m3u'){enterM3U();return;}
 if(data[mode]){afterCats();return;}
 render();status('Cargando...');var p=M[mode].p;
 loading=true;
 var cc=cget('cats_'+sid()+'_'+mode,TTL()*2);
 if(cc){setCats(cc);return;}
 loading=true;
 api('get_'+p+'_categories',function(c){
  if(!(c instanceof Array)){loading=false;status(srvMsg(c));render();return;}
  cset('cats_'+sid()+'_'+mode,c);setCats(c);});}
function hk(m,x){return m+'|'+((SRV&&SRV.type=='m3u')?x.category_name:x.category_id);}
function buildCats(d,m){var vis=[],hid=[],i,x;
 for(i=0;i<d.real.length;i++){x=d.real[i];if(HIDC[hk(m,x)])hid.push(x);else vis.push(x);}
 d.hidc=hid;d.cats=[{category_id:'__search',category_name:'Buscar'}];
 if((m=='vod'||m=='series')&&SRV&&SRV.type=='xtream')d.cats.push({category_id:'__rec',category_name:'★ Recomendado para ti'});
 if(m=='live')d.cats.push({category_id:'__fav',category_name:'★ Favoritos'});
 d.cats=d.cats.concat(vis);
 if(m=='live')d.cats.push({category_id:'__hid',category_name:'Ocultos'});
 if(hid.length)d.cats.push({category_id:'__hcat',category_name:'Categorías ocultas ('+hid.length+')'});}
function hideCat(){var d=data[mode],x=d.cats[ci];
 if(!x||String(x.category_id).indexOf('__')==0)return;
 HIDC[hk(mode,x)]=x.category_name;sv('hidc',HIDC);buildCats(d,mode);
 if(ci>=d.cats.length)ci=d.cats.length-1;lastSig='';msg('Categoría oculta (se ve en "Categorías ocultas")',3000);render();}
function restoreCat(){var d=data[mode],x=d.hidc[ci];if(!x)return;
 delete HIDC[hk(mode,x)];sv('hidc',HIDC);buildCats(d,mode);
 if(!d.hidc.length){HCM=false;ci=0;}else if(ci>=d.hidc.length)ci=d.hidc.length-1;
 lastSig='';msg('Categoría restaurada');render();}
function setCats(c){
 if(mode=='live')c.sort(function(x,y){var u=norm(x.category_name),v=norm(y.category_name);return u<v?-1:u>v?1:0;});
 var dd={real:c,byCat:{},all:null};buildCats(dd,mode);data[mode]=dd;loading=false;status('');afterCats();}
function TTL(){return (C.cacheHours===undefined?6:C.cacheHours)*3600000;}
function cget(k,age){try{var o=JSON.parse(localStorage.getItem('xc_'+k)||'null');if(o&&new Date().getTime()-o.t<age)return o.v;}catch(e){}return null;}
function cset(k,v){try{localStorage.setItem('xc_'+k,JSON.stringify({t:new Date().getTime(),v:v}));}catch(e){cclear();}}
function cclear(){try{var ks=[],i,n;for(i=0;i<localStorage.length;i++){n=localStorage.key(i);if(n&&n.indexOf('xc_')==0)ks.push(n);}for(i=0;i<ks.length;i++)localStorage.removeItem(ks[i]);}catch(e){}}
function citem(k,v){if(v.length>1500)return;var ix;try{ix=JSON.parse(localStorage.getItem('xc_idx')||'[]');}catch(e){ix=[];}
 var p=ix.indexOf(k);if(p>-1)ix.splice(p,1);ix.push(k);
 while(ix.length>10){try{localStorage.removeItem('xc_'+ix.shift());}catch(e){}}
 try{localStorage.setItem('xc_idx',JSON.stringify(ix));}catch(e){}
 cset(k,v);}
function trimItems(s){var F=['name','stream_id','series_id','stream_icon','cover','container_extension','rating','rating_5based','added','last_modified','num','category_id','releaseDate','epg_channel_id'],r=[],i,j,o,x;
 for(i=0;i<s.length;i++){o={};x=s[i];for(j=0;j<F.length;j++)if(x[F[j]]!==undefined)o[F[j]]=x[F[j]];r.push(o);}return r;}
function ld(k){try{return JSON.parse(localStorage.getItem('xb_'+sid()+k)||'{}')||{};}catch(e){return {};}}
function sv(k,o){try{localStorage.setItem('xb_'+sid()+k,JSON.stringify(o));}catch(e){msg('No se pudo guardar');}}
function srvMsg(j){var u=j&&j.user_info;
 if(u){if(u.auth===0||u.auth==='0')return 'Usuario o clave incorrectos';if(u.status&&u.status!='Active')return 'Cuenta: '+u.status;}
 return 'El servidor no devolvió datos. Revisa si otro aparato usa la cuenta';}
function msg(t,ms){status(t);setTimeout(function(){status('');},ms||1800);}
var FAV=ld('fav'),HID=ld('hid'),PRG=ld('prog'),LAST=ld('last'),LATER=ld('later'),HIDC=ld('hidc'),HCM=false,gOpen=false,gMode=0,gi=0,gl=[],LT=false,lti=0,gotoFav=false,loading=false;
function byNum(x,y){return (parseInt(x.num,10)||0)-(parseInt(y.num,10)||0);}
function byAdded(x,y){return (parseInt(y.added||y.last_modified,10)||0)-(parseInt(x.added||x.last_modified,10)||0);}
function vals(o){var r=[],k;for(k in o)r.push(o[k]);r.sort(byNum);return r;}
function allAction(){var p=M[mode].p;return p=='series'?'get_series':'get_'+p+'_streams';}
function getCat(cid,cb){var d=data[mode];if(d.byCat[cid]){cb();return;}
 var ck='it2_'+sid()+'_'+mode+'_'+cid,cc=cget(ck,TTL());if(cc){d.byCat[cid]=cc;cb();return;}
 loading=true;status('Cargando...');
 api(allAction()+'&category_id='+cid,function(s){
  if(!(s instanceof Array))s=[];s.sort(mode=='live'?byNum:byAdded);d.byCat[cid]=s;if(s.length)citem(ck,trimItems(s));loading=false;status('');cb();});}
function prep(o){if(o.t!==undefined)return;
 var m=String(o.name).match(/^(.*?)[\s\(\[\-]*(19\d{2}|20[0-3]\d)[\)\]]*\s*$/);
 if(m&&m[1]){o.t=m[1].replace(/\s+$/,'');o.y=m[2];}else{o.t=o.name;o.y=String(o.releaseDate||o.releasedate||'').substr(0,4);}
 var r5=parseFloat(o.rating_5based),r=parseFloat(o.rating);
 o.rt=r5>0?'★ '+r5.toFixed(1)+'/5':(r>0?'★ '+(r/2).toFixed(1)+'/5':'');}
function setList(){
 var d=data[mode],r=[],i,it,A;
 if(searching){var nq=norm(q);A=d.all||[];
  if(nq.length>1)for(i=0;i<A.length&&r.length<50;i++){it=A[i];if(it.n===undefined)it.n=norm(it.name);if(it.n.indexOf(nq)>-1&&!HID[it.stream_id])r.push(it);}
 }else{var cid=d.cats[ci].category_id;
  if(cid=='__search')r=[];else if(cid=='__rec')r=d.rec||[];else if(cid=='__fav')r=vals(FAV);else if(cid=='__hid')r=vals(HID);
  else{A=d.byCat[cid]||[];for(i=0;i<A.length;i++)if(!HID[A[i].stream_id])r.push(A[i]);}}
 list=r;if(li>=r.length)li=0;render();}
var SRVS=[],SRV=null,M3UD=null,si=0,inp='',addMsg='',kr=0,kc=0,caps=false,busy=false;
var KR=['1234567890'.split(''),'qwertyuiop'.split(''),'asdfghjkl-'.split(''),'zxcvbnm._:'.split(''),'/?&=@%+#~,'.split(''),['http://','https://','.com','ABC','DEL'],['ESP','CLR','LISTO','CANCELAR']];
function sid(){return SRV?SRV.id:'';}
function hostOf(u){var m=String(u).match(/^https?:\/\/([^\/:?#]+)/i);return m?m[1]:String(u).substr(0,20);}
function hs(s){var h=5381,i;for(i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return 'u'+(h>>>0).toString(36);}
function mu(it){var u=it.url;if(/\.m3u8(\?|$)/i.test(u))u+='|COMPONENT=HLS';return u;}
function saveSrvs(){try{localStorage.setItem('xb_srvs',JSON.stringify(SRVS));localStorage.setItem('xb_srva',SRV?SRV.id:'');}catch(e){}}
function loadSrvs(){
 var s=[],aid='',cs=[],out=[],i,j,it,p,x,dup;
 try{s=JSON.parse(localStorage.getItem('xb_srvs')||'[]');aid=localStorage.getItem('xb_srva')||'';}catch(e){s=[];}
 if(!(s instanceof Array))s=[];
 if(C.server&&C.server.indexOf('TU_SERVIDOR')<0)cs.push({id:'',name:hostOf(C.server),type:'xtream',server:C.server,user:C.user,pass:C.pass});
 if(C.servers instanceof Array)for(i=0;i<C.servers.length;i++){
  it=C.servers[i];if(typeof it=='string')it={link:it};
  p=it&&it.link?parseLink(String(it.link).replace(/^\s+|\s+$/g,'')):null;if(p&&p.type=='m3u'&&!p.local&&hostOf(p.url).indexOf('.')<0)p=null;if(!p)continue;
  p.id='c'+hs(p.type=='m3u'?p.url:p.server.toLowerCase()+'|'+p.user);
  p.name=it.name||hostOf(p.server||p.url);if(it.epg)p.epg=it.epg;if(it.live)p.live=true;if(it.px)p.px=true;
  dup=false;for(j=0;j<cs.length;j++){x=cs[j];
   if(x.id===p.id||(x.type=='xtream'&&p.type=='xtream'&&x.server.toLowerCase()==p.server.toLowerCase()&&x.user==p.user))dup=true;}
  if(!dup)cs.push(p);}
 for(i=0;i<cs.length;i++){x=cs[i];x.cfg=true;
  for(j=0;j<s.length;j++)if(s[j].id===x.id&&s[j].epg&&!x.epg)x.epg=s[j].epg;
  out.push(x);}
 for(i=0;i<s.length;i++){if(s[i].cfg)continue;dup=false;for(j=0;j<out.length;j++)if(out[j].id===s[i].id)dup=true;if(!dup)out.push(s[i]);}
 SRVS=out;SRV=null;
 for(i=0;i<SRVS.length;i++)if(SRVS[i].id===aid)SRV=SRVS[i];
 if(!SRV)SRV=SRVS[0]||null;
 saveSrvs();}
function epgUrl(){var u=SRV?(SRV.epg||C.epg||''):'';if(u&&!/^https?:\/\//i.test(u)&&!/^[\w\-. ]+\.js$/i.test(u))u='http://'+u;return u;}
function applySrv(){
 if(SRV&&SRV.type=='xtream'){C.server=SRV.server;C.user=SRV.user;C.pass=SRV.pass;}
 FAV=ld('fav');HID=ld('hid');PRG=ld('prog');LAST=ld('last');LATER=ld('later');HIDC=ld('hidc');AFF=ld('aff');HREC={vod:null,series:null,busy:false,tm:0};HCM=false;data={};M3UD=null;epgReset();cur=null;lastSig='';}
function parseLink(s){
 if(/^[\w\-. ]+\.(m3u8?|txt|js)$/i.test(s))return {type:'m3u',url:s,local:true};
 var t=s.split(/\s+/),m,sv0,u,p,q;
 if(t.length>=3){sv0=t[0];if(!/^https?:\/\//i.test(sv0))sv0='http://'+sv0;m=sv0.match(/^(https?:\/\/[^\/?#]+)/i);if(m)return {type:'xtream',server:m[1],user:t[1],pass:t[2]};}
 if(!/^https?:\/\//i.test(s))s='http://'+s;
 m=s.match(/^(https?:\/\/[^\/?#]+)/i);if(!m)return null;
 u=s.match(/[?&]username=([^&#]*)/i);p=s.match(/[?&]password=([^&#]*)/i);
 if(u&&p)return {type:'xtream',server:m[1],user:decodeURIComponent(u[1]),pass:decodeURIComponent(p[1])};
 q=s.match(/\/(?:live|movie|series)\/([^\/]+)\/([^\/]+)\//i);
 if(q)return {type:'xtream',server:m[1],user:decodeURIComponent(q[1]),pass:decodeURIComponent(q[2])};
 return {type:'m3u',url:s};}
var M3ERR='';
function parseM3Uc(t,cb){
 var R={live:[],vod:[]},pos=0,len=t.length,max=C.m3uMax||30000,only=SRV&&SRV.live,n=0,cu=null;
 function step(){
  var k=0,e,s,m,c,u,isV;
  while(pos<len&&k<4000&&n<max){
   e=t.indexOf('\n',pos);if(e<0)e=len;
   s=t.substring(pos,e).replace(/^\s+|\s+$/g,'');pos=e+1;k++;
   if(!s)continue;
   if(s.indexOf('#EXTINF')===0){cu={};
    m=s.match(/tvg-logo="([^"]*)"/);cu.stream_icon=m?m[1]:'';m=s.match(/tvg-id="([^"]*)"/);cu.tvg=m?m[1]:'';
    m=s.match(/group-title="([^"]*)"/);cu.grp=m&&m[1]?m[1]:'Sin grupo';
    m=s.match(/tvg-chno="([^"]*)"/);cu.num=m?m[1]:'';
    c=s.lastIndexOf(',');cu.name=c>-1?s.substr(c+1).replace(/^\s+|\s+$/g,''):'';
    if(!cu.name){m=s.match(/tvg-name="([^"]*)"/);cu.name=m?m[1]:'Canal';}}
   else if(s.charAt(0)!='#'&&cu){u=s;cu.url=u;cu.stream_id=hs(u);
    isV=/\/(movie|series)\//i.test(u)||/\.(mp4|mkv|avi|mov)(\?|$)/i.test(u);
    if(isV){if(!only)R.vod.push(cu);}else R.live.push(cu);cu=null;n++;}}
  if(pos<len&&n<max){status('Leyendo lista... '+Math.round(pos*100/len)+'%');setTimeout(step,10);return;}
  cb(R);}
 step();}
function buildM3U(){var ms=['live','vod'],x,arr,real,by,gm,g,i,k,dd;
 for(x=0;x<2;x++){arr=M3UD[ms[x]];real=[];by={};gm={};g=0;
  for(i=0;i<arr.length;i++){k='$'+arr[i].grp;
   if(gm[k]===undefined){gm[k]='g'+(g++);real.push({category_id:gm[k],category_name:arr[i].grp});by[gm[k]]=[];}
   arr[i].category_id=gm[k];by[gm[k]].push(arr[i]);}
  dd={real:real,byCat:by,all:arr};buildCats(dd,ms[x]);data[ms[x]]=dd;}}
function loadM3U(cb){
 if(M3UD){buildM3U();cb(true);return;}
 if(SRV.local&&/\.js$/i.test(SRV.url)){loadJsText(SRV.url,'LISTA_TXT',function(t){
  if(!t||t.indexOf('#EXTINF')<0){M3ERR=t?(SRV.url+' está vacío o dañado'):('no encuentro '+SRV.url+' en la carpeta del widget (créalo con ActualizarLista.bat y sincroniza el TV)');cb(false);return;}
  M3ERR='';parseM3Uc(t,function(r){M3UD=r;t=null;buildM3U();cb(true);});});return;}
 var u0=SRV.url,cand=[],whys=[],i=0,viaPx=SRV.px&&C.proxy;
 if(SRV.local)cand.push(u0);
 else if(viaPx)cand.push(C.proxy+encodeURIComponent(u0)+(SRV.live?'&live=1':''));
 else{cand.push(u0);
  if(!/\.(m3u8?|txt)(\?|$)/i.test(u0)&&u0.indexOf('?')<0)cand.push(u0+'.m3u');
  if(/^http:/i.test(u0))cand.push(u0.replace(/^http:/i,'https:'));}
 function go(){
  var x=new XMLHttpRequest();x.open('GET',cand[i],true);
  x.onprogress=function(e){if(e&&e.loaded)status('Descargando lista... '+(e.loaded/1048576).toFixed(1)+' MB');};
  x.onreadystatechange=function(){if(x.readyState!=4)return;
   var t=x.responseText||'',why='';
   if(!t)why=x.status?'respondió '+x.status:'sin respuesta';
   else if(t.indexOf('#EXTINF')<0)why='no es M3U ('+t.substr(0,30).replace(/[<>&]/g,' ')+')';
   if(why){whys.push((i+1)+') '+why);if(i<cand.length-1){i++;go();return;}M3ERR='Falló: '+whys.join('  ')+(SRV.local?'  · usa lista.js (ActualizarLista.bat)':'');cb(false);return;}
   M3ERR='';parseM3Uc(t,function(r){M3UD=r;t=null;buildM3U();cb(true);});};
  x.send();}
 go();}
function loadJsText(url,v,cb){var s=document.createElement('script'),done=false;window[v]=null;
 function fin(t){if(done)return;done=true;window[v]=null;cb(t);}
 s.charset='utf-8';s.onload=function(){fin(window[v]);};s.onerror=function(){fin(null);};
 s.src=url;document.getElementsByTagName('head')[0].appendChild(s);}
function epgFetch(){var u=epgUrl();return (SRV&&SRV.px&&C.proxy)?C.proxy+encodeURIComponent(u):u;}
function enterM3U(){
 if(mode=='series'){focus='menu';render();msg('Las series no están disponibles en listas M3U');return;}
 if(data[mode]){afterCats();return;}
 render();loading=true;status('Descargando lista...');
 loadM3U(function(ok){loading=false;status('');
  if(focus=='menu')return;
  if(!ok){focus='menu';render();msg(M3ERR||'No se pudo leer la lista M3U',8000);return;}
  afterCats();});}
function homeInfo(){$('hl').innerHTML='';$('hr').innerHTML='';if(!SRV)return;
 if(SRV.type=='m3u'){$('hl').innerHTML='Lista M3U';$('hr').innerHTML=esc(SRV.name);return;}
 if(C.noAccount){$('hr').innerHTML=esc(SRV.name);return;}
 try{get(C.server+'/player_api.php?username='+C.user+'&password='+C.pass,function(j){var u=j.user_info||{},e=u.exp_date?new Date(parseInt(u.exp_date,10)*1000):null;
  $('hl').innerHTML='Vence: '+(e?e.getDate()+'/'+(e.getMonth()+1)+'/'+e.getFullYear():'Ilimitado');$('hr').innerHTML=esc(SRV.name)+' · '+esc(u.username||C.user);},function(){});}catch(x){}}
function iptvRows(){var r=[],i;
 for(i=0;i<SRVS.length;i++)r.push(SRVS[i].name+'   ·   '+(SRVS[i].type=='m3u'?'M3U':'Xtream')+(SRVS[i].cfg?'   ·   cfg':'')+(SRVS[i]===SRV?'   ·   activo':''));
 r.push('+ Agregar servidor');r.push('Guía (XMLTV): '+(epgUrl()?hostOf(epgUrl())+(EPG.ok?(EPG.cnt?'   ·   lista':'   ·   VENCIDA'):EPG.loading?'   ·   cargando...':''):'no configurada'));r.push('Actualizar guía ahora');r.push('Borrar caché de listas');return r;}
function enterSettings(){si=0;siMain=0;setPage='main';lastSig='';focus='set';render();}
function useSrv(i){SRV=SRVS[i];saveSrvs();applySrv();homeInfo();setTimeout(function(){epgLoad(false);},1500);lastSig='';render();msg('Servidor activo: '+SRV.name);}
function delSrv(i){var s=SRVS[i],k,ks=[],j,pre;
 if(s.cfg){msg('Viene de cfg.js: quítalo de ese archivo');return;}
 if(s.id){pre='xb_'+s.id;try{for(j=0;j<localStorage.length;j++){k=localStorage.key(j);if(k&&k.indexOf(pre)===0)ks.push(k);}for(j=0;j<ks.length;j++)localStorage.removeItem(ks[j]);}catch(e){}}
 SRVS.splice(i,1);
 if(SRV===s){SRV=SRVS[0]||null;applySrv();}
 saveSrvs();
 if(!SRVS.length){enterAdd();return;}
 if(si>=SRVS.length+4)si=0;lastSig='';homeInfo();render();msg('Servidor eliminado');}
function enterAdd(){addMode='srv';inp='';addMsg='';kr=0;kc=0;caps=false;busy=false;focus='add';render();}
function addBack(){if(SRVS.length){lastSig='';setPage='iptv';focus='set';render();}else wa.sendReturnEvent();}
function kmove(dr,dc){var K=KR[kr],pos;
 if(dr){pos=(kc+0.5)/K.length;kr=Math.max(0,Math.min(KR.length-1,kr+dr));kc=Math.min(KR[kr].length-1,Math.floor(pos*KR[kr].length));}
 else kc=Math.max(0,Math.min(K.length-1,kc+dc));}
function drawAdd(){var h='',r,c,K,w,t,lb;
 $('home').style.display='none';$('left').style.display='none';$('right').style.display='none';$('add').style.display='block';
 $('title').innerHTML=addMode=='epg'?'Guía de programación (XMLTV)':'Agregar servidor';
 $('abox').innerHTML=inp?esc(inp)+'_':'<span style="color:#6f87a8">'+(addMode=='epg'?'Escribe la dirección del archivo XMLTV (vacío para quitar)':'Escribe aquí el enlace M3U, o: servidor usuario clave')+'</span>';
 for(r=0;r<KR.length;r++){K=KR[r];w=Math.floor(720/K.length)-6;h+='<div class="kr">';
  for(c=0;c<K.length;c++){t=K[c];
   lb=t=='ESP'?'espacio':t=='ABC'?(caps?'abc':'ABC'):t=='DEL'?'borrar':t=='CLR'?'limpiar':t=='CANCELAR'?'cancelar':(t.length==1&&caps?t.toUpperCase():t);
   h+='<div class="ak'+(r==kr&&c==kc?' on':'')+'" style="width:'+w+'px">'+esc(lb)+'</div>';}
  h+='</div>';}
 $('akb').innerHTML=h;$('amsg').innerHTML=esc(addMsg);
 $('help').innerHTML='Flechas y OK, o los números del control &nbsp; RETURN: Atrás';}
function addKey(t){addMsg='';
 if(t=='DEL')inp=inp.slice(0,-1);else if(t=='CLR')inp='';else if(t=='ESP')inp+=' ';else if(t=='ABC')caps=!caps;
 else if(t=='LISTO'){submitAdd();return;}else if(t=='CANCELAR'){addBack();return;}
 else inp+=(t.length==1&&caps?t.toUpperCase():t);
 drawAdd();}
function saveNew(p,keep){var host=hostOf(p.server||p.url),nm=host,c=1,i;
 for(i=0;i<SRVS.length;i++)if(SRVS[i].name==host||SRVS[i].name.indexOf(host+' (')===0)c++;
 if(c>1)nm=host+' ('+c+')';
 p.name=nm;p.id='s'+new Date().getTime().toString(36);SRVS.push(p);SRV=p;saveSrvs();
 applySrv();M3UD=keep||null;
 busy=false;inp='';addMsg='';focus='menu';mi=0;render();homeInfo();msg('Servidor agregado: '+nm);}
function submitAdd(){
 if(addMode=='epg'){submitEpg();return;}
 var s=inp.replace(/^\s+|\s+$/g,''),p,old=SRV;
 if(!s){addMsg='Escribe primero el enlace';drawAdd();return;}
 p=parseLink(s);if(!p){addMsg='No entendí el enlace';drawAdd();return;}
 busy=true;addMsg='Comprobando el servidor...';drawAdd();
 if(p.type=='xtream'){
  get(p.server+'/player_api.php?username='+encodeURIComponent(p.user)+'&password='+encodeURIComponent(p.pass),function(j){
   var u=j&&j.user_info;
   if(u&&(u.auth===1||u.auth==='1')){saveNew(p,null);}
   else{busy=false;addMsg='Usuario o clave incorrectos';drawAdd();}
  },function(){busy=false;addMsg='No se pudo conectar. Revisa la dirección';drawAdd();});
 }else{
  SRV=p;M3UD=null;addMsg='Descargando la lista M3U (puede tardar)...';drawAdd();
  loadM3U(function(ok){
   if(!ok){SRV=old;M3UD=null;busy=false;addMsg=M3ERR||'No se pudo leer la lista M3U';drawAdd();return;}
   var keep=M3UD;SRV=old;saveNew(p,keep);});}}
var EPG={p:{},n:{},ok:false,loading:false},SE={},curProgs=null,epgView=null,ei=0,addMode='srv';
function epgReset(){EPG={p:{},n:{},ok:false,loading:false};}
function nk(s){return norm(s).replace(/[^a-z0-9]/g,'');}
function attr(a,n){a=' '+a;var k=n+'="',i=a.indexOf(' '+k),d='"';if(i<0){k=n+"='";i=a.indexOf(' '+k);d="'";if(i<0)return '';}i+=k.length+1;var j=a.indexOf(d,i);return j<0?'':a.substring(i,j);}
function dec(s){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#39;/g,"'").replace(/&amp;/g,'&');}
function xt(s){var m=s.match(/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)?\s*([+-]\d{4})?/);if(!m)return 0;
 var t=Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+(m[6]||0)),o=m[7]?(m[7].charAt(0)=='-'?-1:1)*(parseInt(m[7].substr(1,2),10)*60+parseInt(m[7].substr(3,2),10))*60000:0;return t-o;}
function t12(ms){var d=new Date(ms),h=d.getHours(),m=d.getMinutes();return (h%12||12)+':'+(m<10?'0':'')+m+' '+(h<12?'AM':'PM');}
function b64(s){try{return decodeURIComponent(escape(atob(s)));}catch(e){try{return atob(s);}catch(x){return s||'';}}}
function epgParse(t,cb){
 var mx=0,cnt=0,now=new Date().getTime(),lo=now-3600000,hi=now+(C.epgHours||12)*3600000,P={},N={},total=t.length,pos=t.indexOf('<channel'),end=t.indexOf('<programme'),q,r,id,m,re=/<display-name[^>]*>([^<]*)</g,b,k;
 while(pos>-1&&(end<0||pos<end)){q=t.indexOf('>',pos);r=t.indexOf('</channel>',q);if(q<0||r<0)break;
  id=attr(t.substring(pos+8,q),'id');b=t.substring(q+1,r);re.lastIndex=0;
  while((m=re.exec(b))){k=nk(dec(m[1]));if(k&&id)N[k]=id;}
  pos=t.indexOf('<channel',r);}
 pos=end;
 function step(){
  if(focus=='player'){setTimeout(step,1500);return;}
  var n=0,a,e,s,idc;
  while(pos>-1&&n<1500){q=t.indexOf('>',pos);r=t.indexOf('</programme>',q);if(q<0||r<0){pos=-1;break;}
   a=t.substring(pos+10,q);s=xt(attr(a,'start'));e=xt(attr(a,'stop'));
   if(e>mx)mx=e;
   if(e>lo&&s<hi){cnt++;b=t.substring(q+1,r);m=b.match(/<title[^>]*>([\s\S]*?)<\/title>/);idc=attr(a,'channel');if(idc)(P[idc]||(P[idc]=[])).push({s:s,e:e,t:m?dec(m[1]):''});}
   pos=t.indexOf('<programme',r);n++;}
  if(pos>-1){status('Procesando guía '+Math.round(pos*100/total)+'%');setTimeout(step,15);return;}
  for(id in P)P[id].sort(function(u,v){return u.s-v.s;});
  EPG.p=P;EPG.n=N;EPG.mx=mx;EPG.cnt=cnt;cb();}
 if(end<0){EPG.p=P;EPG.n=N;EPG.mx=0;EPG.cnt=0;cb();return;}
 step();}
function epgDone(){status('');lastSig='';if(focus=='set'||(focus=='list'&&mode=='live'))render();}
function epgGot(t,ck){
 if(!t||t.indexOf('<programme')<0){EPG.loading=false;status('');msg('No se pudo leer la guía (¿está vacía o es .gz?)');return;}
 epgParse(t,function(){t=null;EPG.loading=false;EPG.ok=true;
  if(!EPG.cnt){epgDone();var dv=new Date(EPG.mx);msg('La guía está VENCIDA: llega hasta el '+dv.getDate()+'/'+(dv.getMonth()+1)+'. Actualízala con ActualizarLista.bat',9000);return;}
  try{localStorage.setItem('xc_'+ck,JSON.stringify({t:new Date().getTime(),v:{p:EPG.p,n:EPG.n}}));}catch(e){}
  epgDone();msg('Guía lista');});}
function epgLoad(force){
 if(!SRV||!epgUrl()||EPG.loading)return;
 var loc=/^[\w\-. ]+\.js$/i.test(epgUrl()),ck='epg_'+sid()+hs(epgUrl()),c=(force||loc)?null:cget(ck,TTL());
 if(c&&c.p){EPG.p=c.p;EPG.n=c.n||{};EPG.ok=true;epgDone();return;}
 EPG.loading=true;EPG.ok=false;status('Leyendo guía...');
 if(loc){loadJsText(epgUrl(),'GUIA_TXT',function(t){epgGot(t,ck);});return;}
 var x=new XMLHttpRequest();x.open('GET',epgFetch(),true);
 x.onreadystatechange=function(){if(x.readyState==4)epgGot(x.responseText||'',ck);};
 x.send();}
function epgList(it){var id=it.epg_channel_id;
 if(id&&EPG.p[id])return EPG.p[id];
 id=it.tvg;if(id&&EPG.p[id])return EPG.p[id];
 id=EPG.n[nk(it.name||'')];return id&&EPG.p[id]?EPG.p[id]:null;}
function epgNow(it){var L=epgList(it),n=new Date().getTime(),i;if(!L)return '';
 for(i=0;i<L.length;i++)if(L[i].s<=n&&n<L[i].e)return L[i].t;return '';}
function shortEpg(it,cb){
 if(!SRV||SRV.type!='xtream'||!it.stream_id){cb(null);return;}
 var k=it.stream_id,c=SE[k];if(c&&new Date().getTime()-c.t<600000){cb(c.L);return;}
 get(C.server+'/player_api.php?username='+C.user+'&password='+C.pass+'&action=get_short_epg&stream_id='+k+'&limit=12',function(j){
  var L=[],a=j&&j.epg_listings,i,x;
  if(a&&a.length)for(i=0;i<a.length;i++){x=a[i];L.push({s:(parseInt(x.start_timestamp,10)||0)*1000,e:(parseInt(x.stop_timestamp,10)||0)*1000,t:b64(x.title)});}
  SE[k]={t:new Date().getTime(),L:L.length?L:null};cb(L.length?L:null);},function(){cb(null);});}
function getProgs(it,cb){var L=epgList(it);if(L){cb(L);return;}shortEpg(it,cb);}
function openEpg(it){epgView={it:it,L:null,msg:''};ei=0;focus='epgv';lastSig='';render();
 getProgs(it,function(L){if(!epgView||epgView.it!==it)return;
  var n=new Date().getTime(),i,R=[];
  if(L)for(i=0;i<L.length;i++)if(L[i].e>n-1800000)R.push({s:L[i].s,e:L[i].e,t:L[i].t,cur:L[i].s<=n&&n<L[i].e});
  if(!R.length){epgView.msg='Sin información de guía para este canal';}
  else{epgView.L=R;ei=0;for(i=0;i<R.length;i++)if(R[i].cur)ei=i;}
  lastSig='';if(focus=='epgv')render();});}
function enterAddEpg(){addMode='epg';inp=epgUrl();addMsg='';kr=0;kc=0;caps=false;busy=false;focus='add';render();}
function submitEpg(){var s=inp.replace(/^\s+|\s+$/g,'');
 if(s&&!/^https?:\/\//i.test(s))s='http://'+s;
 SRV.epg=s;saveSrvs();epgReset();addMode='srv';lastSig='';setPage='iptv';focus='set';render();
 if(s){msg('Descargando la guía...');epgLoad(true);}else msg(C.epg?'Se usará la guía de cfg.js':'Guía quitada');}
function homeClock(){var d=new Date(),h=d.getHours(),m=d.getMinutes(),mn=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
 $('hclk').innerHTML=(h%12||12)+':'+(m<10?'0':'')+m+'<span class="ap"> '+(h<12?'AM':'PM')+'</span><div class="cd">'+d.getDate()+' '+mn[d.getMonth()]+' '+d.getFullYear()+'</div>';}
function tileLabel(i){var t=MENU[i].t;if(MENU[i].m=='cont'){var n=contList().length;if(n)t+=' ('+n+')';}return t;}
function drawHome(){var h='',i;status('');
 $('home').style.display='block';$('add').style.display='none';$('left').style.display='none';$('right').style.display='none';$('title').innerHTML='';$('gearbtn').className='gear'+(mi==6?' on':'');
 for(i=0;i<MENU.length-1;i++)h+='<div class="tile t'+i+(i==mi?' on':'')+'">'+esc(tileLabel(i))+'</div>';
 if(HOMEMODE=='rows'){$('tiles').style.display='none';drawRows();}else{$('tiles').style.display='block';$('hpills').style.display='none';$('hrows').style.display='none';$('tiles').innerHTML=h;}
 homeClock();
 $('help').innerHTML='OK: Elegir &nbsp; INFO: Hora &nbsp; RETURN: Salir';}
function afterCats(){if(gotoFav){gotoFav=false;ci=1;li=0;setList();focus='list';render();}else{var d0=data[mode];if(d0&&d0.cats[1]&&d0.cats[1].category_id=='__rec')ci=1;render();}}
function lk(it){return it.series_id?'s'+it.series_id:'v'+it.stream_id;}
function laterList(){var r=[],k;for(k in LATER)r.push(LATER[k]);r.sort(function(x,y){return y.at-x.at;});return r;}
function enterLater(){LT=true;mode='vod';view='browse';searching=false;q='';focus='later';li=0;list=laterList();render();}
function toggleLater(it){
 var k=lk(it),F=['name','stream_id','series_id','stream_icon','cover','container_extension','rating','rating_5based','plot','genre','releaseDate','releasedate','added','last_modified','url','category_id'],o={},i;
 if(LATER[k]){delete LATER[k];msg('Quitado de Ver más tarde');}
 else{for(i=0;i<F.length;i++)if(it[F[i]]!==undefined)o[F[i]]=it[F[i]];o.type=it.type||mode;o.at=new Date().getTime();LATER[k]=o;bumpAff(o);msg('Guardado en Ver más tarde');}
 sv('later',LATER);
 if(focus=='later'){list.splice(li,1);if(li>=list.length)li=Math.max(0,list.length-1);}
 lastSig='';if(view=='detail')renderDetail();else render();}
function digit(c){for(var i=0;i<10;i++)if(c==tk['KEY_'+i])return ''+i;return '';}
function openSearch(d){view='browse';searching=true;q='';kbi=0;focus='kb';li=0;list=[];render();
 if(!d.all){loading=true;status('Cargando catálogo...');api(allAction(),function(s){d.all=s instanceof Array?s:[];loading=false;status('');setList();});}
 else setList();}
function favHide(isFav){
 var it=list[li],id=it.stream_id,cid=searching?'':data[mode].cats[ci].category_id;
 var min={stream_id:id,name:it.name,stream_icon:it.stream_icon,num:it.num,category_id:it.category_id,url:it.url,epg_channel_id:it.epg_channel_id,tvg:it.tvg};
 if(isFav){if(FAV[id]){delete FAV[id];msg('Quitado de favoritos');}else{FAV[id]=min;msg('Añadido a favoritos');}
  sv('fav',FAV);if(cid=='__fav')list.splice(li,1);}
 else{if(HID[id]){delete HID[id];msg('Canal restaurado');}else{HID[id]=min;delete FAV[id];msg('Canal ocultado');}
  sv('hid',HID);sv('fav',FAV);list.splice(li,1);}
 if(li>=list.length)li=Math.max(0,list.length-1);lastSig='';render();}
var lastSig='';
function start(n,idx,R){return Math.max(0,Math.min(idx-Math.floor(R/2),n-R));}
function bg(u){return u?"background-image:url('"+String(u).replace(/'/g,'%27').replace(/"/g,'%22').replace(/\(/g,'%28').replace(/\)/g,'%29')+"')":'';}
function rowCls(i,idx,plain){if(G)return 'pc'+(i==idx?' on':'');return 'r'+(plain?'':' it'+(mode=='live'?' lv':'')+(view=='eps'?' epr':''))+(i==idx&&focus!='kb'?' on':'');}
function rowIn(it){if(G)return cardIn(it);var m=[];prep(it);
 if(it.ep){if(it.rt)m.push(it.rt);if(it.y)m.push(it.y);var em=epMark(it).replace(/^\s+·\s+/,'');if(em)m.push(em);
  return '<div class="th ep" style="'+bg(it.stream_icon||(D&&D.img))+'"></div><div class="tx"><div class="nm">'+esc(it.name)+'</div><div class="mt">'+esc(m.join('   '))+'</div><div class="pl">'+esc(it.pl||'')+'</div></div>';}
 if(mode=='live'){if(it.num)m.push('Canal '+it.num);var pg=epgNow(it);if(pg)m.push(pg);if(FAV[it.stream_id])m.push('★');}else{if(it.rt)m.push(it.rt);if(it.y)m.push(it.y);if(it.at&&it.type)m.push(it.type=='series'?'Serie':'Película');else if(LATER[lk(it)])m.push('Guardado');}
 return '<div class="th'+(mode=='live'?' lv':'')+'" style="'+bg(it.stream_icon||it.cover)+'"></div><div class="tx"><div class="nm">'+esc(it.t||it.name)+'</div><div class="mt">'+esc(m.join('   '))+'</div></div>';}
function render(){
 var d=data[mode],h='',i,a,rows=[],idx=0,t='IPTV',sk=searching&&view!='eps',plain=true,R=12;
 if(!(view=='eps'&&focus=='list')){$('sov').style.display='none';$('right').style.top='';}
 if(focus=='menu'){drawHome();return;}
 if(focus=='add'){drawAdd();return;}
 $('home').style.display='none';$('add').style.display='none';$('right').style.display='block';
 $('left').style.display=sk?'block':'none';
 $('right').className=sk?'':(focus=='menu'?'wide menu':'wide');
 if(focus=='menu'){for(i=0;i<MENU.length;i++)rows.push(MENU[i].t);idx=mi;t='¿Qué quieres ver?';}
 else if(focus=='epgv'){var EL=epgView.L;if(!EL)rows.push(epgView.msg||'Cargando guía...');else for(i=0;i<EL.length;i++)rows.push(t12(EL[i].s)+'   '+EL[i].t+(EL[i].cur?'     (ahora)':''));idx=ei;t='Guía · '+epgView.it.name;}
 else if(focus=='set'){rows=setRows();idx=si;t=setTitle();}
 else if(focus=='cont'){rows=list;plain=false;R=5;idx=li;t='Continuar viendo ('+list.length+')';}
 else if(focus=='later'){rows=list;plain=false;R=5;idx=li;t='Ver más tarde ('+list.length+')';}
 else if(view=='eps'&&focus=='list'){rows=list;plain=false;R=4;idx=li;t=((cur&&(cur.t||cur.name))||'')+' · Temporada '+(SE[sIx]?SE[sIx].n:'')+' de '+SE.length;}
 else if(!d){t=(M[mode]?M[mode].t:'');}
 else if(focus=='cats'){var CL=HCM?d.hidc:d.cats;for(i=0;i<CL.length;i++)rows.push(CL[i].category_name);idx=ci;t=M[mode].t+(HCM?' · Categorías ocultas':' · Categorías');}
 else{idx=li;
  if(view=='eps'){for(i=0;i<list.length;i++)rows.push(list[i].name+epMark(list[i]));}
  else{rows=list;plain=false;R=mode=='live'?8:5;}
  t=M[mode].t+' · '+(view=='eps'?'Episodios':searching?'Buscar: '+q+'_':d.cats[ci].category_name)+' ('+list.length+')';}
 $('title').innerHTML=esc(t);
 var hp=focus=='kb'?'OK o números: escribir &nbsp; RETURN: Atrás':'1: Buscar &nbsp; OK: Elegir &nbsp; RETURN: Atrás';
 if(mode=='live'&&focus=='list'&&view!='eps')hp=(!searching&&d&&d.cats[ci].category_id=='__hid')?'3: Restaurar canal &nbsp; 1: Buscar &nbsp; RETURN: Atrás':'2: Favorito &nbsp; 3: Ocultar &nbsp; 4: Guía &nbsp; 1: Buscar';
 if(focus=='cats')hp=HCM?'OK: Restaurar categoría &nbsp; RETURN: Atrás':'3: Ocultar categoría &nbsp; 1: Buscar &nbsp; OK: Elegir &nbsp; RETURN: Atrás';
 if(focus=='epgv')hp='Flechas: mover &nbsp; RETURN: Atrás';
 else if(focus=='set')hp=setHelp();
 else if(focus=='cont')hp='2: Quitar de la lista &nbsp; OK: Continuar &nbsp; RETURN: Atrás';
 else if(focus=='later')hp='2: Quitar de la lista &nbsp; OK: Elegir &nbsp; RETURN: Atrás';
 else if((mode=='vod'||mode=='series')&&focus=='list'&&view!='eps')hp='2: Ver más tarde &nbsp; 1: Buscar &nbsp; RETURN: Atrás';
 if(view=='eps'&&focus=='list'){hp='IZQ / DER: Temporada &nbsp; OK: Ver episodio &nbsp; RETURN: Atrás';
  if(SE[sIx]){$('sov').innerHTML='<b>&lt; Temporada '+SE[sIx].n+' de '+SE.length+' &gt;</b> &nbsp; '+SE[sIx].eps.length+' episodios<br>'+esc((SE[sIx].ov||'').substr(0,190));$('sov').style.display='block';$('right').style.top='130px';}}
 $('help').innerHTML=hp;
 if(sk){for(i=0;i<KEYS.length;i++){var k=KEYS[i];
  h+='<div class="k'+(focus=='kb'&&i==kbi?' on':'')+'">'+(k=='ESP'?'&#9251;':k=='DEL'?'&lt;':k=='CLR'?'X':k.toUpperCase())+'</div>';}
  $('left').innerHTML=h;h='';}
 G=isGrid();if(G){R=GC*GR;a=Math.max(0,Math.floor(idx/GC)-1)*GC;$('right').className='wide grid';}else a=start(rows.length,idx,R);
 var sig=[focus,mode,view,sk,a,rows.length,q,ci,G?1:0].join('|'),rc=$('right');
 if(sig==lastSig&&rows.length&&rc.childNodes.length){for(i=0;i<rc.childNodes.length;i++)rc.childNodes[i].className=rowCls(a+i,idx,plain);}
 else{for(i=a;i<a+R&&i<rows.length;i++)h+='<div class="'+rowCls(i,idx,plain)+'">'+(plain?esc(rows[i]):rowIn(rows[i]))+'</div>';if(focus=='cont'&&!rows.length)h='<div class="r">Nada pendiente. Aquí aparecerá lo que dejes a medias.</div>';
 if(focus=='later'&&!rows.length)h='<div class="r">Aún no guardaste nada. En una película o serie pulsa 2.</div>';rc.innerHTML=h;lastSig=sig;}}
/* ---------- FICHA ---------- */
function renderDetail(){
 var it=cur,t=D.title||it.name,m=[];
 if(D.year)m.push(D.year);if(D.genre)m.push(D.genre);if(D.dur)m.push(D.dur);
 var r=D.imdb?'<span class="imdb">IMDb '+esc(D.imdb)+'</span> ':'';
 if(D.rating)r+='<span class="tm">&#9733; '+esc(D.rating)+(D.imdb?'':' (Xtream/TMDB)')+'</span>';
 $('det').innerHTML='<img id="dp" src="'+esc(D.img||'')+'"><div id="dtx"><h2>'+esc(t)+'</h2><div class="m">'+esc(m.join('  |  '))+'</div><div class="m">'+r+'</div>'
  +'<div class="p">'+esc((D.plot||'Cargando información...').substr(0,520))+'</div>'
  +(D.cast?'<div class="m">Reparto: '+esc(D.cast.substr(0,120))+'</div>':'')
  +'<div class="hb">OK: '+(mode=='vod'?'Reproducir':'Ver episodios ('+eps.length+')')+' &nbsp;&nbsp; 2: '+(LATER[lk(cur)]?'Quitar de Ver más tarde':'Ver más tarde')+' &nbsp;&nbsp; RETURN: Volver</div></div>';}
function omdb(){
 if(!C.omdbKey)return;
 var t=(D.title||cur.name).replace(/\(.*?\)|\[.*?\]/g,'').replace(/\s+\d{4}\s*$/,'').replace(/^\s+|\s+$/g,'');
 var u='http://www.omdbapi.com/?apikey='+C.omdbKey+(D.imdbId?'&i='+D.imdbId:'&t='+encodeURIComponent(t)+(D.year?'&y='+String(D.year).substr(0,4):''));
 get(u,function(j){if(j&&j.imdbRating&&j.imdbRating!='N/A'){D.imdb=j.imdbRating;if(j.imdbVotes&&j.imdbVotes!='N/A')D.imdb+=' ('+j.imdbVotes+')';if(view=='detail')renderDetail();}});}
function openDetail(it){
 if(SRV&&SRV.type=='m3u'){cur=it;playItem(it);return;}
 bumpAff(it);cur=it;view='detail';eps=[];D={img:it.stream_icon||it.cover,plot:it.plot,rating:it.rating,genre:it.genre,year:it.releaseDate||it.releasedate};
 $('det').style.display='block';$('right').style.display='none';$('left').style.display='none';$('home').style.display='none';$('title').innerHTML='';$('help').innerHTML='';focus='detail';renderDetail();
 var isS=mode=='series';
 api(isS?'get_series_info&series_id='+it.series_id:'get_vod_info&vod_id='+it.stream_id,function(j){
  var i=j.info||{};
  D.img=i.movie_image||i.cover||D.img;D.plot=i.plot||i.description||D.plot;D.rating=i.rating||D.rating;
  D.genre=i.genre||D.genre;D.year=i.releasedate||i.releaseDate||i.release_date||D.year;D.cast=i.cast||i.actors;
  D.dur=i.duration||'';D.imdbId=i.imdb_id&&/^tt/.test(i.imdb_id)?i.imdb_id:'';
  var bsn=buildSeasons(j);SE=bsn.se;allEps=bsn.all;eps=allEps;
  if(view=='detail')renderDetail();omdb();});}
function closeDetail(){view='browse';$('det').style.display='none';if(HM){HM=false;mode='';focus='menu';render();return;}if(LT){mode='vod';focus='later';list=laterList();li=lti;render();return;}focus='list';render();}
/* ---------- REPRODUCCION ---------- */
var PL=null,eng='',curUrl='',curTitle='',retry=0,lastAct=0,rcT=null,rcP=false,audN=0,audCur=0,audI=0,avWant=false,avStart=0,audAfter=false,sk='',stepN=0,stepT=0,curKey='',resumeMs=0,resumed=false,ended=false,lastSaveT=0,clkT=null,curMeta=null,fromCont=false,prevLive=null,curItem=null,okT=0,numBuf='',numT=null;
window.XB={
 time:function(t){pos=parseInt(t,10)||0;lastAct=new Date().getTime();if(retry||rcP){retry=0;rcP=false;clearTimeout(rcT);buf(-1);}if(!dur)try{dur=getDur();}catch(e){}
  if(resumeMs>0&&!resumed&&!isLive){resumed=true;var r=resumeMs;setTimeout(function(){if(focus=='player'){eJump(Math.floor(r/1000));sk='Continuando';osd();}},1500);}
  if(!isLive&&pos>5000&&new Date().getTime()-lastSaveT>10000)saveProg();
  if($('osd').style.display=='block')osdDraw();},
 info:function(){try{dur=getDur();}catch(e){}osd();},
 bs:function(){buf(0);},bp:function(p){buf(parseInt(p,10)||0);},
 bc:function(){lastAct=new Date().getTime();buf(-1);osd();if(audAfter){audAfter=false;openAudio();}},
 end:function(){if(focus!='player')return;if(isLive){fail();return;}ended=true;saveProg();if(C.autoNext&&playNext(1))return;stop();},
 err:function(){fail();}};
function buf(p){var b=$('buf');if(p<0){b.style.display='none';return;}b.innerHTML='Cargando'+(p>0?' '+p+'%':'...');b.style.display='block';}
function fail(){
 if(focus!='player')return;
 if(isLive){retry++;rcP=true;$('buf').innerHTML='Reconectando...';$('buf').style.display='block';clearTimeout(rcT);
  rcT=setTimeout(function(){rcP=false;if(focus=='player'&&isLive){lastAct=new Date().getTime();engStart(curUrl);}},Math.min(10000,1500*retry));return;}
 $('buf').innerHTML='No se pudo reproducir';$('buf').style.display='block';}
function eStop(){try{if(eng=='pl')PL.Stop();else if(avp)avp.stop();}catch(e){}}
function ePause(){try{if(eng=='pl')PL.Pause();else avp.pause();}catch(e){}}
function eResume(){try{if(eng=='pl')PL.Resume();else avp.resume();}catch(e){}}
function eJump(n){try{if(eng=='pl'){if(n>0)PL.JumpForward(n);else PL.JumpBackward(-n);}else{if(n>0)avp.jumpForward(n);else avp.jumpBackward(-n);}}catch(e){}}
function engStart(url){
 eStop();
 if(eng=='pl'){
  var H=['OnCurrentPlayTime','XB.time','OnStreamInfoReady','XB.info','OnBufferingStart','XB.bs','OnBufferingProgress','XB.bp','OnBufferingComplete','XB.bc','OnRenderingComplete','XB.end','OnConnectionFailed','XB.err','OnStreamNotFound','XB.err','OnNetworkDisconnected','XB.err','OnRenderError','XB.err','OnAuthenticationFailed','XB.err'];
  for(var i=0;i<H.length;i+=2)try{PL[H[i]]=H[i+1];}catch(e){}
  try{PL.SetDisplayArea(0,0,960,540);}catch(e){}
  try{PL.SetTotalBufferSize(C.bufTotal||24*1024*1024);}catch(e){}
  try{PL.SetInitialBuffer(C.bufInitial||512*1024);}catch(e){}
  try{PL.SetPendingBuffer(C.bufPending||1024*1024);}catch(e){}
  try{PL.Play(url);}catch(e){fail();}
 }else{
  webapis.avplay.getAVPlay(function(av){avp=av;
   av.init({containerID:'avc',zIndex:0,displayRect:{top:0,left:0,width:960,height:540},autoRatio:true,
    bufferingCallback:{onbufferingstart:XB.bs,onbufferingprogress:XB.bp,onbufferingcomplete:XB.bc},
    playCallback:{oncurrentplaytime:XB.time,onresolutionchanged:function(){},onstreamcompleted:XB.end,onerror:XB.err}});
   av.open(url);av.play(function(){},function(){},avStart||0);avStart=0;},function(){fail();});}}
function play(url,live,title){
 PL=$('pluginPlayer');var e2=(!live&&(C.vodPlayer=='avplay'||avWant))?'av':((C.player!='avplay'&&PL&&PL.Play)?'pl':'av');
 if(e2=='av'&&typeof webapis==='undefined'){status('Reproductor no disponible (solo en el TV)');return;}
 eng=e2;isLive=live;paused=false;pos=0;dur=0;retry=0;lastAct=new Date().getTime();clearTimeout(rcT);rcP=false;sk='';resumed=false;ended=false;lastSaveT=new Date().getTime();curUrl=url;curTitle=title||'';
 focus='player';$('left').innerHTML='';$('right').innerHTML='';lastSig='';
 $('ui').style.display='none';$('det').style.display='none';document.body.style.background='transparent';
 if(eng=='av')$('avc').style.display='block';
 buf(0);engStart(url);}
function fmt(ms){var s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s/60)%60;s=s%60;return (h?h+':':'')+(m<10&&h?'0':'')+m+':'+(s<10?'0':'')+s;}
function osdDraw(){
 $('otl').innerHTML=esc(curTitle);
 if(isLive){var L=curProgs,n=new Date().getTime(),c=null,nx=null,i;
  if(L)for(i=0;i<L.length;i++){if(L[i].s<=n&&n<L[i].e){c=L[i];nx=L[i+1]||null;break;}if(L[i].s>n){nx=L[i];break;}}
  $('ot').innerHTML='&#9679; EN VIVO'+(c?' &nbsp; '+esc(c.t)+' &nbsp; '+t12(c.s)+' - '+t12(c.e):'')+(nx?'<br><span style="color:#999">Después: '+esc(nx.t)+' · '+t12(nx.s)+'</span>':'')+(c||nx?'<br><span style="color:#667;font-size:14px">OK otra vez: ver la guía</span>':'');
  if(c){$('obg').style.display='block';$('ob').style.width=Math.min(100,(n-c.s)*100/(c.e-c.s))+'%';}else $('obg').style.display='none';
  return;}
 $('obg').style.display='block';
 $('ot').innerHTML=(paused?'&#10074;&#10074; PAUSA':'&#9654;')+' &nbsp; '+fmt(pos)+' / '+(dur?fmt(dur):'--:--')+(sk?' &nbsp; '+sk:'')+'<br><span style="color:#667;font-size:14px">Flecha arriba/abajo: idioma del audio</span>';
 $('ob').style.width=(dur?Math.min(100,pos*100/dur):0)+'%';}
function osd(){$('osd').style.display='block';osdDraw();clearTimeout(osdT);if(!paused||isLive)osdT=setTimeout(function(){$('osd').style.display='none';sk='';},4000);}
function stop(){clearTimeout(rcT);rcP=false;closeGuide();saveProg();eStop();numBuf='';$('chn').style.display='none';clearTimeout(osdT);$('osd').style.display='none';buf(-1);$('avc').style.display='none';
 document.body.style.background='';$('ui').style.display='block';
 if(fromCont&&HM){fromCont=false;HM=false;mode='';view='browse';focus='menu';render();}
 else if(fromCont){fromCont=false;mode='vod';view='browse';searching=false;focus='cont';list=contList();li=0;render();}
 else if(view=='detail'){$('det').style.display='block';focus='detail';renderDetail();}else{focus=searching&&!list.length?'kb':'list';render();}}
var aud=null,volT=null;
function vol(d){var t;
 try{aud=aud||$('pluginAudio');
  if(d)aud.SetVolumeWithKey?aud.SetVolumeWithKey(d>0?0:1):aud.SetVolume(Math.max(0,Math.min(100,aud.GetVolume()+d*5)));
  t='Volumen del TV: '+aud.GetVolume();}
 catch(x){t='Volumen no disponible en este TV';}
 $('vol').innerHTML=t;$('vol').style.display='block';clearTimeout(volT);volT=setTimeout(function(){$('vol').style.display='none';},2500);}
function probeAudio(){var n=0,i,ok;
 try{for(i=0;i<8;i++){ok=avp.setAudioStreamID(i);if(!ok)break;n++;}}catch(e){}
 try{avp.setAudioStreamID(audCur);}catch(e){}return n;}
function openAudio(){gOpen=true;gMode=2;clearTimeout(osdT);$('osd').style.display='none';
 if(eng=='av'){audN=probeAudio();audI=audCur<audN?audCur:0;}
 drawAudio();}
function drawAudio(){var h='<div class="gh"><span class="gon">Idioma del audio</span></div>',i;
 if(eng!='av')h+='<div class="gr gsel">Activar la selección de idioma</div><div class="gr" style="font-size:14px;color:#9ab;white-space:normal">Se reabre la película en el reproductor AVPlay, en el mismo minuto. Puede tardar unos segundos.</div>';
 else if(audN<2)h+='<div class="gr">'+(audN==1?'Esta película tiene una sola pista de audio':'No se pudieron leer las pistas de audio')+'</div>';
 else for(i=0;i<audN;i++)h+='<div class="gr'+(i==audI?' gsel':'')+'">Pista de audio '+(i+1)+(i==audCur?' &nbsp;<b>(actual)</b>':'')+'</div>';
 h+='<div class="gh" style="font-size:12px;margin-top:6px">OK: elegir &nbsp; RETURN: cerrar</div>';
 $('gp').innerHTML=h;$('gp').style.display='block';}
function switchAv(){avWant=true;avStart=Math.floor(pos/1000);resumeMs=0;audAfter=true;msg('Cambiando de reproductor...',4000);eStop();play(curUrl,false,curTitle);}
function audKey(e,c){
 if(c==tk.KEY_RETURN||c==tk.KEY_EXIT){wa.blockNavigation(e);closeGuide();return;}
 if(c==tk.KEY_UP){if(audI>0)audI--;}
 else if(c==tk.KEY_DOWN){if(audI<audN-1)audI++;}
 else if(c==tk.KEY_ENTER){
  if(eng!='av'){closeGuide();switchAv();return;}
  if(audN>1){var ok=false;try{ok=avp.setAudioStreamID(audI);}catch(x){}
   if(ok){audCur=audI;sk='Audio: pista '+(audI+1);}else msg('No se pudo cambiar de pista');}
  closeGuide();osd();return;}
 drawAudio();}
function showDiag(){var t='DIAGNÓSTICO DEL REPRODUCTOR (sácale una foto)<br>',k,a=[],p;
 t+='webapis: '+(typeof webapis)+'<br>';
 try{for(k in webapis.avplay)a.push(k);t+='avplay: '+a.join(', ')+'<br>';}catch(e){t+='avplay: no disponible<br>';}
 if(avp){a=[];try{for(k in avp)a.push(k);}catch(e){}t+='avp: '+a.join(', ')+'<br>';}
 a=[];try{p=$('pluginPlayer');for(k in p)a.push(k);}catch(e){}
 t+='plugin Player ('+a.length+'): '+a.join(', ').substr(0,800)+'<br>Pulsa cualquier tecla para cerrar';
 $('dbg').innerHTML=t;$('dbg').style.top='16px';$('dbg').style.display='block';}
function openGuide(){var n=new Date().getTime(),i;gOpen=true;okT=0;gMode=0;gi=0;gl=[];
 if(curProgs)for(i=0;i<curProgs.length;i++)if(curProgs[i].e>n)gl.push(curProgs[i]);
 clearTimeout(osdT);$('osd').style.display='none';drawGuide();}
function drawGuide(){var h,i,a,p,n=new Date().getTime(),R=8,L=gMode?list:gl;
 h='<div class="gh"><span'+(gMode==0?' class="gon"':'')+'>Este canal</span> &nbsp;&nbsp; <span'+(gMode==1?' class="gon"':'')+'>Otros canales</span></div>';
 if(gMode==0&&!L.length)h+='<div class="gr">Sin información de guía para este canal</div>';
 a=Math.max(0,Math.min(gi-3,L.length-R));
 for(i=a;i<a+R&&i<L.length;i++){
  if(gMode==0)h+='<div class="gr'+(i==gi?' gsel':'')+'">'+t12(L[i].s)+' &nbsp; '+esc(L[i].t)+(L[i].s<=n?' &nbsp;<b>(ahora)</b>':'')+'</div>';
  else{p=epgNow(L[i]);h+='<div class="gr'+(i==gi?' gsel':'')+'">'+(L[i].num?L[i].num+' ':'')+esc(L[i].name)+(p?' <span class="gp2">'+esc(p)+'</span>':'')+'</div>';}}
 h+='<div class="gh" style="font-size:12px;margin-top:6px">&#9664; &#9654; cambiar vista &nbsp; OK: elegir &nbsp; RETURN: cerrar</div>';
 $('gp').innerHTML=h;$('gp').style.display='block';}
function closeGuide(){gOpen=false;okT=0;$('gp').style.display='none';}
function gkey(e,c){if(gMode==2){audKey(e,c);return;}var L=gMode?list:gl;
 if(c==tk.KEY_RETURN||c==tk.KEY_EXIT||c==tk.KEY_INFO){wa.blockNavigation(e);closeGuide();return;}
 if(c==tk.KEY_UP){if(gi>0)gi--;}
 else if(c==tk.KEY_DOWN){if(gi<L.length-1)gi++;}
 else if(c==tk.KEY_LEFT||c==tk.KEY_RIGHT){gMode=gMode?0:1;gi=gMode?li:0;}
 else if(c==tk.KEY_ENTER){if(gMode==1&&list[gi]){li=gi;closeGuide();playItem(list[li]);return;}closeGuide();return;}
 drawGuide();}
function pkey(e,c){
 if(gOpen){gkey(e,c);return;}
 if(c==tk.KEY_RETURN||c==tk.KEY_STOP||c==tk.KEY_EXIT){wa.blockNavigation(e);stop();return;}
 if(c==tk.KEY_UP&&!isLive){openAudio();return;}
 if(c==tk.KEY_UP||c==tk.KEY_VOL_UP){vol(1);return;}
 if(c==tk.KEY_DOWN&&!isLive){openAudio();return;}
 if(c==tk.KEY_DOWN||c==tk.KEY_VOL_DOWN){vol(-1);return;}
 if(isLive){
  if(c==tk.KEY_ENTER){var tn=new Date().getTime();if(tn-okT<500)lastCh();else if($('osd').style.display=='block')openGuide();else osd();okT=tn;return;}
  if(c==tk.KEY_RIGHT||c==tk.KEY_CH_UP){zap(1);return;}
  if(c==tk.KEY_LEFT||c==tk.KEY_CH_DOWN){zap(-1);return;}
  if(c==tk.KEY_PRECH||c==tk.KEY_GREEN){lastCh();return;}
  var dg=digit(c);if(dg!==''){numKey(dg);return;}
  return;}
 if((c==tk.KEY_CH_UP||c==tk.KEY_CH_DOWN)&&playNext(c==tk.KEY_CH_UP?1:-1))return;
 if(c==tk.KEY_ENTER||c==tk.KEY_PLAY||c==tk.KEY_PAUSE){if(paused){eResume();paused=false;}else{ePause();paused=true;}}
 else if(c==tk.KEY_RIGHT||c==tk.KEY_LEFT){var n=new Date().getTime();stepN=(n-stepT<1200)?Math.min(stepN+1,4):0;stepT=n;
  var s=[10,20,40,90,180][stepN],j=c==tk.KEY_RIGHT?s:-s;sk=(j>0?'+':'-')+s+' s';eJump(j);}
 else if(c==tk.KEY_FF){sk='+60 s';eJump(60);}
 else if(c==tk.KEY_RW){sk='-60 s';eJump(-60);}
 else return;
 osd();}
function saveProg(){
 if(isLive||!curKey)return;
 if(!ended&&pos<5000)return;
 var f=ended||(dur>0&&pos>dur*0.95);
 PRG[curKey]={p:f?0:pos,d:dur||0,f:f?1:0,t:new Date().getTime(),m:curMeta};
 var ks=[],k,i;for(k in PRG)ks.push(k);
 if(ks.length>200){ks.sort(function(x,y){return PRG[x].t-PRG[y].t;});for(i=0;i<ks.length-200;i++)delete PRG[ks[i]];}
 sv('prog',PRG);lastSaveT=new Date().getTime();}
function epMark(it){var r=PRG['e'+it.id];if(!r)return '';return r.f?'   · visto':(r.p>0?'   · en '+fmt(r.p):'');}
function resumeIdx(){var id=cur&&LAST[cur.series_id];if(!id)return 0;
 for(var i=0;i<eps.length;i++)if(String(eps[i].id)==String(id)){var r=PRG['e'+id];return (r&&r.f&&i+1<eps.length)?i+1:i;}
 return 0;}
function setRes(k){curKey=k;var r=PRG[k];resumeMs=(r&&!r.f&&r.p>30000)?r.p:0;}
function clock(){var b=$('clk');
 if(b.style.display=='block'){b.style.display='none';return;}
 var d=new Date(),h=d.getHours(),m=d.getMinutes(),dn=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'],mn=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
 b.innerHTML=(h%12||12)+':'+(m<10?'0':'')+m+'<span class="ap"> '+(h<12?'AM':'PM')+'</span><div class="cd">'+dn[d.getDay()]+' '+d.getDate()+' '+mn[d.getMonth()]+'</div>';
 b.style.display='block';clearTimeout(clkT);clkT=setTimeout(function(){b.style.display='none';},5000);}
function zap(dir){if(!list.length)return true;var n=li+dir;if(n<0)n=list.length-1;if(n>=list.length)n=0;li=n;playItem(list[li]);return true;}
function lastCh(){if(!prevLive)return;var p=prevLive,i;for(i=0;i<list.length;i++)if(list[i].stream_id==p.stream_id){li=i;break;}playItem(p);}
function findNum(n){var N=parseInt(n,10),i,A,k,d=data.live;
 function fx(arr){for(var j=0;j<arr.length;j++)if(parseInt(arr[j].num,10)==N)return j;return -1;}
 i=fx(list);if(i>-1)return {arr:list,idx:i};
 if(d){if(d.all){i=fx(d.all);if(i>-1)return {arr:d.all,idx:i};}
  for(k in d.byCat){A=d.byCat[k];i=fx(A);if(i>-1)return {arr:A,idx:i};}}
 return null;}
function numKey(d){numBuf=numBuf.length>=4?d:numBuf+d;var b=$('chn');b.innerHTML='Canal '+numBuf+'_';b.style.display='block';clearTimeout(numT);
 numT=setTimeout(function(){var n=numBuf;numBuf='';tuneNum(n);},1500);}
function tuneNum(n){var b=$('chn'),f;
 if(focus!='player'){b.style.display='none';return;}
 f=findNum(n);
 if(!f){b.innerHTML='Canal '+n+' no existe';setTimeout(function(){b.style.display='none';},1500);return;}
 b.style.display='none';list=f.arr;li=f.idx;playItem(list[li]);}
function buildSeasons(j){var out=[],all=[],ks=[],s,x,y,L,inf,ep,se,r,si2={};
 if(j&&j.seasons&&j.seasons.length)for(x=0;x<j.seasons.length;x++)si2[String(j.seasons[x].season_number)]=j.seasons[x];
 if(j&&j.episodes){for(s in j.episodes)ks.push(s);ks.sort(function(p,q){return p-q;});
  for(x=0;x<ks.length;x++){L=j.episodes[ks[x]];if(!L||!L.length)continue;
   se={n:ks[x],ov:(si2[ks[x]]&&si2[ks[x]].overview)||'',eps:[]};
   for(y=0;y<L.length;y++){inf=L[y].info||{};r=parseFloat(inf.rating);
    ep={ep:1,id:L[y].id,ext:L[y].container_extension||'mp4',sn:ks[x],en:L[y].episode_num||y+1,t:L[y].title||'',pl:inf.plot||'',stream_icon:inf.movie_image||'',y:inf.duration||'',rt:r>0?'\u2605 '+r.toFixed(1):''};
    ep.name='E'+ep.en+' · '+ep.t;se.eps.push(ep);all.push(ep);}
   out.push(se);}}
 return {se:out,all:all};}
function setSeason(k){if(k<0||k>=SE.length)return;sIx=k;list=SE[k].eps;li=0;lastSig='';omdbSeason(k);render();}
function enterSeasons(){var id=cur&&LAST[cur.series_id],k,i,f=-1,fk=0,r;
 if(id)for(k=0;k<SE.length&&f<0;k++)for(i=0;i<SE[k].eps.length;i++)if(String(SE[k].eps[i].id)==String(id)){f=i;fk=k;break;}
 if(f>=0){r=PRG['e'+id];if(r&&r.f){if(f+1<SE[fk].eps.length)f++;else if(fk+1<SE.length){fk++;f=0;}}}
 sIx=f>=0?fk:0;list=SE[sIx].eps;li=f>=0?f:0;omdbSeason(sIx);}
function omdbSeason(k){var s=SE[k];if(!s||s.om||!C.omdbKey)return;s.om=1;
 var t=(D.title||(cur&&cur.name)||'').replace(/\(.*?\)|\[.*?\]/g,'').replace(/\s+\d{4}\s*$/,'').replace(/^\s+|\s+$/g,'');
 get('http://www.omdbapi.com/?apikey='+C.omdbKey+(D.imdbId?'&i='+D.imdbId:'&t='+encodeURIComponent(t))+'&Season='+s.n,function(j){
  if(!j||!j.Episodes)return;var i,x,e;
  for(i=0;i<j.Episodes.length;i++){e=j.Episodes[i];
   if(e.imdbRating&&e.imdbRating!='N/A')for(x=0;x<s.eps.length;x++)if(String(s.eps[x].en)==String(e.Episode))s.eps[x].rt='IMDb '+e.imdbRating;}
  if(view=='eps'&&sIx==k){lastSig='';render();}});}
function playNext(dir){
 if(mode!='series'||view!='eps'||!allEps.length)return false;
 var cid=curMeta&&curMeta.id,i,n=0,e,k;
 for(i=0;i<allEps.length;i++)if(String(allEps[i].id)==String(cid))n=i;
 n+=dir;if(n<0||n>=allEps.length)return false;
 e=allEps[n];saveProg();
 for(k=0;k<SE.length;k++)if(String(SE[k].n)==String(e.sn)){sIx=k;list=SE[k].eps;break;}
 for(i=0;i<list.length;i++)if(list[i]===e)li=i;
 playItem(e);sk=dir>0?'Siguiente episodio':'Episodio anterior';return true;}
function playNextOLD(dir){
 if(mode!='series'||view!='eps'||!list.length)return false;
 var n=li+dir;if(n<0||n>=list.length)return false;
 saveProg();li=n;playItem(list[li]);sk=dir>0?'Siguiente episodio':'Episodio anterior';return true;}
function buildEps(j){var r=[],ks=[],s,x,y,L;
 if(j&&j.episodes){for(s in j.episodes)ks.push(s);ks.sort(function(p,q){return p-q;});
  for(x=0;x<ks.length;x++){L=j.episodes[ks[x]];if(!L||!L.length)continue;
   for(y=0;y<L.length;y++)r.push({name:'T'+ks[x]+' E'+(L[y].episode_num||y+1)+'  '+(L[y].title||''),id:L[y].id,ext:L[y].container_extension||'mp4'});}}
 return r;}
function contList(){var r=[],k,e,m;
 for(k in PRG){e=PRG[k];m=e&&e.m;if(!m||e.f||e.p<30000)continue;
  r.push({name:m.title,t:m.title,stream_icon:m.icon,cover:m.icon,rt:'en '+fmt(e.p)+(e.d?' de '+fmt(e.d):''),y:'',k:k,m:m,at0:e.t});}
 r.sort(function(x,y){return y.at0-x.at0;});return r.slice(0,30);}
function enterCont(){LT=false;fromCont=false;mode='vod';view='browse';searching=false;q='';focus='cont';li=0;list=contList();render();}
function removeCont(){var it=list[li];if(!it)return;delete PRG[it.k];sv('prog',PRG);list.splice(li,1);if(li>=list.length)li=Math.max(0,list.length-1);lastSig='';render();}
function playCont(it){var m=it.m,u=C.server;fromCont=true;
 if(m.ty=='vod'){mode='vod';view='browse';setRes(it.k);curMeta=m;play(m.url?mu({url:m.url}):u+'/movie/'+C.user+'/'+C.pass+'/'+m.id+'.'+m.ext,false,m.title);return;}
 mode='series';cur={series_id:m.sid,name:m.sname,t:m.sname,cover:m.icon};
 loading=true;status('Cargando...');
 api('get_series_info&series_id='+m.sid,function(j){loading=false;status('');
  var b3=buildSeasons(j),i,ix=-1,e,k;SE=b3.se;allEps=b3.all;eps=allEps;D={img:m.icon};
  for(i=0;i<allEps.length;i++)if(String(allEps[i].id)==String(m.id))ix=i;
  if(ix>-1){e=allEps[ix];for(k=0;k<SE.length;k++)if(String(SE[k].n)==String(e.sn)){sIx=k;list=SE[k].eps;break;}
   for(i=0;i<list.length;i++)if(list[i]===e)li=i;view='eps';omdbSeason(sIx);playItem(e);}
  else{view='browse';playItem({id:m.id,ext:m.ext,name:m.title});}});}
function playItem(it){var u=C.server;
 if(mode=='live'){curKey='';resumeMs=0;curMeta=null;if(curItem&&curItem.stream_id!=it.stream_id)prevLive=curItem;curItem=it;
  play(it.url?mu(it):u+'/live/'+C.user+'/'+C.pass+'/'+it.stream_id+(C.liveHLS?'.m3u8|COMPONENT=HLS':'.ts'),true,(it.num?it.num+'  ':'')+it.name);
  curProgs=null;var itm=it;getProgs(it,function(L){if(curItem!==itm)return;curProgs=L;if(focus=='player'&&isLive&&$('osd').style.display=='block')osdDraw();});}
 else if(mode=='vod'){avWant=false;audCur=0;setRes('m'+it.stream_id);curMeta={ty:'vod',id:it.stream_id,ext:it.container_extension||'mp4',title:it.t||it.name,icon:it.stream_icon||'',url:it.url||''};
  play(it.url?mu(it):u+'/movie/'+C.user+'/'+C.pass+'/'+it.stream_id+'.'+(it.container_extension||'mp4'),false,it.t||it.name);}
 else{avWant=false;audCur=0;setRes('e'+it.id);var sn=(cur&&(cur.t||cur.name))||'';if(cur&&cur.series_id){LAST[cur.series_id]=it.id;sv('last',LAST);}
  curMeta={ty:'ep',id:it.id,ext:it.ext,title:sn+' - '+it.name,icon:(cur&&(cur.cover||cur.stream_icon))||'',sid:cur&&cur.series_id,sname:sn};
  play(u+'/series/'+C.user+'/'+C.pass+'/'+it.id+'.'+it.ext,false,sn+' - '+it.name);}}
/* ---------- TECLAS ---------- */
function key(e){
 var c=e.keyCode;
 if($('dbg').style.display=='block'&&focus=='set'){$('dbg').style.display='none';return;}
 if(c==tk.KEY_INFO&&focus=='player'&&isLive){if(gOpen)closeGuide();else openGuide();return;}
 if(c==tk.KEY_INFO||(c==tk.KEY_0&&focus!='kb'&&focus!='add'&&!(focus=='player'&&isLive))){clock();return;}
 if(focus=='player'){pkey(e,c);return;}
 var d=data[mode],ok=c==tk.KEY_ENTER,back=c==tk.KEY_RETURN||c==tk.KEY_EXIT,up=c==tk.KEY_UP,dn=c==tk.KEY_DOWN,lf=c==tk.KEY_LEFT,rt=c==tk.KEY_RIGHT;
 if(focus=='add'){
  var dg2=digit(c);
  if(busy)return;
  if(dg2!==''){inp+=dg2;addMsg='';drawAdd();return;}
  if(back){wa.blockNavigation(e);addBack();return;}
  if(up)kmove(-1,0);else if(dn)kmove(1,0);else if(lf)kmove(0,-1);else if(rt)kmove(0,1);
  else if(ok){addKey(KR[kr][kc]);return;}else return;
  drawAdd();return;}
 if(focus=='epgv'){
  if(back){wa.blockNavigation(e);focus='list';lastSig='';render();}
  else if(up&&ei>0){ei--;render();}
  else if(dn&&epgView&&epgView.L&&ei<epgView.L.length-1){ei++;render();}
  return;}
 if(focus=='set'){setKey(e,c);return;}
 if(view=='detail'){
  if(back){wa.blockNavigation(e);closeDetail();}
  else if(c==tk.KEY_RED||c==tk.KEY_2){toggleLater(cur);}
  else if(ok){if(mode=='vod')playItem(cur);else if(allEps.length){view='eps';enterSeasons();focus='list';$('det').style.display='none';render();}}
  return;}
 if(focus=='menu'){
  if(HOMEMODE=='rows'){homeKey(e,c);return;}
  if(up||dn||lf||rt){var nx=up?NV[mi][0]:dn?NV[mi][1]:lf?NV[mi][2]:NV[mi][3];if(nx>-1){mi=nx;render();}}
  else if(ok){var mm=MENU[mi].m;if(mm=='set')enterSettings();else if(mm=='later')enterLater();else if(mm=='cont')enterCont();else if(mm=='fav'){gotoFav=true;mode='live';enterMode();}else{mode=mm;enterMode();}}
  else if(back){wa.blockNavigation(e);wa.sendReturnEvent();}
  return;}
 if(focus=='cont'){
  if(back){wa.blockNavigation(e);focus='menu';render();}
  else if(loading){}
  else if(isGrid()&&(up||dn||lf||rt))gmove(up,dn,lf,rt);
  else if(up&&li>0){li--;render();}
  else if(dn&&li<list.length-1){li++;render();}
  else if((c==tk.KEY_RED||c==tk.KEY_2)&&list[li])removeCont();
  else if(ok&&list[li])playCont(list[li]);
  return;}
 if(focus=='later'){
  if(back){wa.blockNavigation(e);LT=false;focus='menu';render();}
  else if(isGrid()&&(up||dn||lf||rt))gmove(up,dn,lf,rt);
  else if(up&&li>0){li--;render();}
  else if(dn&&li<list.length-1){li++;render();}
  else if((c==tk.KEY_RED||c==tk.KEY_2)&&list[li])toggleLater(list[li]);
  else if(ok&&list[li]){var it=list[li];lti=li;mode=it.type;openDetail(it);}
  return;}
 if(back){wa.blockNavigation(e);
  if(loading){loading=false;status('');}
  if(HCM&&focus=='cats'){HCM=false;ci=0;lastSig='';render();return;}
  if(view=='eps'){view='browse';if(HM){HM=false;mode='';focus='menu';}else if(LT){mode='vod';focus='later';list=laterList();li=lti;}else{setList();focus='list';}}
  else if(searching){searching=false;q='';focus='cats';}
  else if(focus=='list')focus='cats';
  else focus='menu';
  render();return;}
 if((!d&&view!='eps')||loading)return;
 var dg=digit(c);
 if(focus=='kb'&&dg){q+=dg;li=0;setList();return;}
 if((c==tk.KEY_YELLOW||c==tk.KEY_1)&&focus!='kb'){openSearch(d);return;}
 if(focus=='cats'){
  var nC=HCM?d.hidc.length:d.cats.length;
  if(up&&ci>0){ci--;render();}
  else if(dn&&ci<nC-1){ci++;render();}
  else if(HCM){if(ok||rt||c==tk.KEY_3||c==tk.KEY_BLUE)restoreCat();}
  else if(c==tk.KEY_3||c==tk.KEY_BLUE){hideCat();}
  else if(ok||rt){var cid=d.cats[ci].category_id;li=0;
   if(cid=='__hcat'){HCM=true;ci=0;lastSig='';render();}
   else if(cid=='__search')openSearch(d);
   else if(cid=='__rec'){getRec(function(){setList();focus='list';render();});}
   else if(cid=='__fav'||cid=='__hid'){setList();focus='list';render();}
   else getCat(cid,function(){setList();focus='list';render();});}
 }else if(focus=='list'){
  if(isGrid()&&(up||dn||lf||rt))gmove(up,dn,lf,rt);
  else if(up&&li>0){li--;render();}
  else if(dn&&li<list.length-1){li++;render();}
  else if(view=='eps'&&(lf||rt)){setSeason(sIx+(rt?1:-1));}
  else if(lf&&searching&&view!='eps'){focus='kb';render();}
  else if(mode=='live'&&view!='eps'&&list[li]&&c==tk.KEY_4){openEpg(list[li]);}
  else if(mode=='live'&&view!='eps'&&list[li]&&(c==tk.KEY_RED||c==tk.KEY_BLUE||c==tk.KEY_2||c==tk.KEY_3)){favHide(c==tk.KEY_RED||c==tk.KEY_2);}
  else if(mode!='live'&&view!='eps'&&list[li]&&(c==tk.KEY_RED||c==tk.KEY_2)){toggleLater(list[li]);}
  else if(ok&&list[li]){if(view=='eps'||mode=='live')playItem(list[li]);else openDetail(list[li]);}
 }else if(focus=='kb'){
  if(up&&kbi>=COLS)kbi-=COLS;
  else if(dn&&kbi+COLS<KEYS.length)kbi+=COLS;
  else if(lf&&kbi%COLS>0)kbi--;
  else if(rt){if(kbi%COLS==COLS-1||kbi==KEYS.length-1){if(list.length)focus='list';}else kbi++;}
  else if(ok){var k=KEYS[kbi];
   if(k=='ESP')q+=' ';else if(k=='DEL')q=q.slice(0,-1);else if(k=='CLR')q='';else q+=k;
   li=0;setList();return;}
  render();}
}
return{init:function(){
 C=window.CFG=window.CFG||{};var pc=typeof Common==='undefined';
 var f=pc?{KEY_UP:38,KEY_DOWN:40,KEY_LEFT:37,KEY_RIGHT:39,KEY_ENTER:13,KEY_RETURN:8,KEY_EXIT:27,KEY_RED:82,KEY_INFO:73,KEY_CH_UP:33,KEY_CH_DOWN:34,KEY_PRECH:81,KEY_YELLOW:89,KEY_GREEN:71,KEY_BLUE:66,KEY_STOP:83,KEY_PLAY:80,KEY_PAUSE:80,KEY_FF:76,KEY_RW:75}
  :{KEY_UP:29460,KEY_DOWN:29461,KEY_LEFT:4,KEY_RIGHT:5,KEY_ENTER:29443,KEY_RETURN:88,KEY_EXIT:45,KEY_RED:108,KEY_INFO:31,KEY_CH_UP:68,KEY_CH_DOWN:65,KEY_PRECH:259,KEY_YELLOW:21,KEY_GREEN:20,KEY_BLUE:22,KEY_STOP:70,KEY_PLAY:71,KEY_PAUSE:74,KEY_FF:72,KEY_RW:69};
 var dc=pc?[48,49,50,51,52,53,54,55,56,57]:[17,101,98,6,8,9,10,12,13,14];for(var z=0;z<10;z++)f['KEY_'+z]=dc[z];
 try{tk=new Common.API.TVKeyValue();}catch(e){tk=f;}
 for(var n in f)if(tk[n]===undefined)tk[n]=f[n];
 try{var pa=new Common.API.Plugin(),rk=['KEY_INFO','KEY_CH_UP','KEY_CH_DOWN','KEY_PRECH'];for(var q2=0;q2<rk.length;q2++)try{pa.registKey(tk[rk[q2]]);}catch(e2){}}catch(e){}
 try{wa=new Common.API.Widget();}catch(e){wa={blockNavigation:function(){},sendReadyEvent:function(){},sendReturnEvent:function(){}};}
 try{$('anchor').focus();}catch(e){}
 document.onkeydown=function(e){e=e||window.event;if(pc&&e.keyCode==8&&e.preventDefault)e.preventDefault();key(e);};
 try{wa.sendReadyEvent();}catch(e){}
 applyTheme();loadSrvs();applySrv();
 if(!SRV){$('dbg').style.display='none';setInterval(function(){if(focus=='menu')homeClock();},20000);enterAdd();return;}
 focus='menu';render();$('dbg').style.display='none';
 setInterval(function(){if(focus=='menu')homeClock();},20000);
 setTimeout(homeInfo,4000);
 setInterval(function(){if(focus=='player'&&isLive&&!rcP&&new Date().getTime()-lastAct>(C.stallMs||20000))fail();},5000);
 setTimeout(function(){epgLoad(false);},6000);
 }};
})();
