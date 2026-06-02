var js=Object.defineProperty;var ys=(r,l,p)=>l in r?js(r,l,{enumerable:!0,configurable:!0,writable:!0,value:p}):r[l]=p;var I=(r,l,p)=>ys(r,typeof l!="symbol"?l+"":l,p);import{m as _s,t as Ns,C as Ss,c as Cs,j as e,r as d,S as C}from"./CreateReactScript-DH4w7JsR.js";import{B as ws}from"./Base-DFFiXjl8.js";import{T as $s,t as Qe,G as Rs,u as Fs}from"./Table-Bez8CmE2.js";import{M as De}from"./Modal-DxCZkDHe.js";import{D as Je}from"./DxButton-CsjWvhyj.js";import{B as Is}from"./BasicRest-B3gG22Ns.js";import{a as Z}from"./permissionScope-Be8AULz2.js";import{r as kt}from"./renderGridEditLink-D8NGEeKJ.js";import{o as Bs,b as Ds}from"./magistralesRecordPdf-u_WuIWdK.js";import"./ubigeoInei-D0FnAslC.js";const pe=async(r,l={})=>{try{const{status:p,result:x}=await _s.Fetch(r,{method:"POST",body:JSON.stringify({take:1e3,skip:0,isLoadingAll:!0,...l})});if(!p)throw new Error((x==null?void 0:x.message)||"No se pudo cargar la lista");return(x==null?void 0:x.data)??[]}catch(p){return Ns.error("Error",{description:p.message,duration:3e3,richColors:!0}),[]}},Ts=()=>location.pathname.includes("/admin/storage-general-service-orders"),ks=()=>location.pathname.includes("/admin/storage-service-orders");class qs extends Is{constructor(){super(...arguments);I(this,"path",Z()?Ts()?"admin/storage/general-service-orders":"admin/storage/service-orders":"admin/service-orders");I(this,"deleted",!1);I(this,"getBranchesByBusiness",async p=>p?await this.simpleGet(`/api/${this.path}/businesses/${p}/branches`)??[]:[]);I(this,"getBusinesses",async()=>await pe("/api/admin/businesses/paginate"));I(this,"getClients",async()=>await pe(Z()?"/api/admin/storage/clients/paginate":"/api/admin/services-client/paginate"));I(this,"getServices",async()=>await pe(Z()?"/api/admin/storage/general-service/paginate":"/api/admin/services/paginate",ks()?{storage_service_types:!0}:{}));I(this,"saveStorageGeneralService",async p=>{const x=this.path;this.path="admin/storage/general-service-orders/services";try{return await this.save(p)}finally{this.path=x}});I(this,"getStorageOptions",async()=>Z()?await this.simpleGet("/api/admin/storage/kardex/options"):null);I(this,"getStorageWarehouses",async()=>Z()?await pe("/api/admin/storage/kardex/paginate",{section:"warehouses",sort:[{selector:"warehouse_name",desc:!1}]}):[]);I(this,"getStorageLocations",async()=>Z()?await pe("/api/admin/storage/kardex/paginate",{section:"locations"}):[])}async paginate(p){return await super.paginate({...p,deleted:this.deleted})}}const j=new qs,qt=r=>(r==null?void 0:r.fullname)||[r==null?void 0:r.name,r==null?void 0:r.lastname].filter(Boolean).join(" ")||(r==null?void 0:r.username)||"",ge=()=>({uid:crypto.randomUUID(),service_id:"",scope:"",gloss:"",description:"",quantity:1,unit_price:0,detraction_percent:0,commission_percent:0,total:0}),y=(r="")=>r.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""),Os=["Servicio de almacenamiento","Servicio de almacenamiento - Adicional"],Es=[{value:"PEN",label:"Soles"},{value:"USD",label:"Dolares"}],Ps="kamary_medicals",Et=r=>(r==null?void 0:r.name)??(r==null?void 0:r.warehouse_name)??"",Ls=r=>(r==null?void 0:r.id)??(r==null?void 0:r.warehouse_id)??"",zs=r=>r==="approved"?"Aprobado":Fs(r),Ye=(r=[])=>r.find(l=>`${l.business_key??""}`===Ps)??r.find(l=>y([l.name,l.trade_name].filter(Boolean).join(" ")).includes("kamarymedicals"))??r[0],As=r=>{const l=Ls(r),p=Et(r);return{key:l?`warehouse-${l}`:y(p),warehouse_name:p,warehouse_id:l?`${l}`:"",enabled:!1,location_id:"",location_ids:[],location_label:"",location_labels:[],start_date:"",months:"",end_date:"",billing_dates:[],quantity_m3:"",tariff:"",monthly_amount:""}},Te=(r=[])=>r.filter(l=>(l==null?void 0:l.status)!==null).map(As),Xe=r=>{var l,p,x;return((x=(l=r==null?void 0:r.toString)==null?void 0:(p=l.call(r)).slice)==null?void 0:x.call(p,0,10))??""},he=r=>Number(r||0),Ze=(r,l,p=!1)=>{if(!r)return"";const x=Number(l);if(!Number.isFinite(x)||x<0||!p&&x<=0)return"";const S=new Date(`${r}T00:00:00`);if(Number.isNaN(S.getTime()))return"";const _=new Date(S),O=_.getDate();return _.setDate(1),_.setMonth(_.getMonth()+x),_.setDate(Math.min(O,new Date(_.getFullYear(),_.getMonth()+1,0).getDate())),_.toISOString().slice(0,10)},Ot=(r,l)=>{const p=Number.parseInt(l,10);return!r||!Number.isFinite(p)||p<=0?[]:Array.from({length:p},(x,S)=>({month:S+1,date:Ze(r,S,!0)}))},M=r=>r?[r.code,r.temperature_range].filter(Boolean).join(" | "):"",Pt=(r="")=>r.split(",").map(l=>l.trim()).filter(Boolean),ke=r=>Array.isArray(r.location_ids)?r.location_ids.filter(Boolean).map(l=>`${l}`):r.location_id?[`${r.location_id}`]:[],Ms=(r,l)=>[r.warehouse_name,(Array.isArray(l)?l.map(M).filter(Boolean).join(", "):M(l))||r.location_label,`${r.start_date||""} - ${r.end_date||""}`,`${r.months||0} meses`,`${r.quantity_m3||0} m3`].filter(Boolean).join("; "),Gs=(r="")=>{const l=r.split(";").map(x=>x.trim()),p=(l[2]??"").split("-").map(x=>x.trim());return{warehouse_name:l[0]??"",location_label:l[1]??"",location_labels:Pt(l[1]??""),start_date:p.length>=3?`${p[0]}-${p[1]}-${p[2]}`.slice(0,10):"",end_date:p.length>=6?`${p[3]}-${p[4]}-${p[5]}`.slice(0,10):"",months:parseFloat(l[3])||"",quantity_m3:parseFloat(l[4])||""}},Us=({moduleTitle:r="Ordenes de servicio",serviceOrderType:l="service"})=>{const p=d.useRef(),x=d.useRef(),S=d.useRef(),_=d.useRef(),O=d.useRef(),ee=d.useRef(),te=d.useRef(),k=d.useRef(),w=d.useRef(),G=d.useRef(),xe=d.useRef(),se=d.useRef(),ie=d.useRef(),fe=d.useRef(),U=d.useRef(),W=d.useRef(),re=d.useRef(),V=d.useRef(),qe=d.useRef(null),H=d.useRef(),ve=d.useRef(),ne=d.useRef(),et=d.useRef(),Oe=d.useRef(),Ee=d.useRef(""),ae=d.useRef(),be=d.useRef(),je=d.useRef(),[ye,Lt]=d.useState([]),[Ws,zt]=d.useState([]),[_e,At]=d.useState([]),[le,Mt]=d.useState([]),[E,Pe]=d.useState(""),[K,oe]=d.useState(""),[R,Ne]=d.useState(""),[tt,st]=d.useState(""),[Gt,it]=d.useState("PEN"),[Le,rt]=d.useState(!1),[z,nt]=d.useState("services"),[Se,at]=d.useState(""),[Ce,lt]=d.useState(""),[we,ot]=d.useState(""),[ct,dt]=d.useState(null),[$e,ut]=d.useState({penTotal:0,penBilled:0,usdTotal:0,usdBilled:0}),[Q,P]=d.useState([ge()]),[J,Ut]=d.useState([]),[ce,Wt]=d.useState([]),[mt,de]=d.useState(()=>Te()),[pt,Vt]=d.useState(!1),[Ht,ze]=d.useState(""),[gt,Kt]=d.useState(!1),F=l==="storage_general",B=l==="storage_service",b=F||B,N=!b,Qt=le.filter(t=>Os.some(s=>y(s)===y(t.name))),Ae=Object.fromEntries(le.map(t=>[`${t.id}`,t])),D=b?Ye(ye):null,ht=F&&D!=null&&D.id?`${D.id}`:E,Jt=F?(D==null?void 0:D.name)??(D==null?void 0:D.trade_name)??"Kamary Medicals":"",xt=async()=>{if(!B)return{warehouseRows:[],locationRows:[]};qe.current||(qe.current=(async()=>{const i=await j.getStorageOptions();let n=((i==null?void 0:i.warehouses)??[]).filter(u=>u.status!==null),a=((i==null?void 0:i.locations)??[]).filter(u=>u.status!==null);if(!n.length||!a.length){const[u,m]=await Promise.all([a.length?Promise.resolve(a):j.getStorageLocations(),n.length?Promise.resolve(n):j.getStorageWarehouses()]);n=(n.length?n:m??[]).filter(o=>o.status!==null),a=(a.length?a:u??[]).filter(o=>o.status!==null)}return{warehouseRows:n,locationRows:a}})());const{warehouseRows:t,locationRows:s}=await qe.current;return Ut(t),Wt(s),Vt(!0),{warehouseRows:t,locationRows:s}};d.useEffect(()=>{(async()=>{var m;const s=B?xt():Promise.resolve({warehouseRows:[],locationRows:[]}),[i,n,,a]=await Promise.all([j.getBusinesses(),j.getClients(),ft(),s]),u=i??[];if(Lt(u),At((n??[]).filter(o=>o.status!==null)),B&&de(Te(a.warehouseRows)),b||N){const o=b?Ye(u):u[0];if(o){Pe(`${o.id}`);const c=await Re(o.id);(m=c[0])!=null&&m.id&&oe(`${c[0].id}`)}}})()},[]),d.useLayoutEffect(()=>{if(!N)return;j.deleted=z==="deleted",ut({penTotal:0,penBilled:0,usdTotal:0,usdBilled:0});const t=p.current?$(p.current).dxDataGrid("instance"):null;t&&(t.pageIndex(0),t.getDataSource().reload())},[z]);const Yt=()=>{const t=[];Se&&t.push(["client_id","=",Number(Se)]),Ce&&t.push(["created_at",">=",`${Ce} 00:00:00`]),we&&t.push(["created_at","<=",`${we} 23:59:59`]),dt(t.length?t.reduce((s,i)=>s.length?[...s,"and",i]:i,[]):null)},Xt=()=>{at(""),lt(""),ot(""),dt(null)},Zt=t=>{const i=((t==null?void 0:t.data)??[]).reduce((n,a)=>{const u=`${a.currency??"PEN"}`.toUpperCase(),m=Number(a.total||0),o=a.billing_status==="billed"||a.order_status==="invoiced"?m:Number(a.paid_amount||0);return u==="USD"?(n.usdTotal+=m,n.usdBilled+=o):(n.penTotal+=m,n.penBilled+=o),n},{penTotal:0,penBilled:0,usdTotal:0,usdBilled:0});ut(i)},Re=async(t,s="")=>{const n=await j.getBranchesByBusiness(t)??[];return zt(n),oe(s?`${s}`:""),n},ft=async()=>{const s=(await j.getServices()??[]).filter(i=>i.status!==null);return Mt(s),s},Me=t=>({...t,total:Number(t.quantity||0)*Number(t.unit_price||0)}),L=(t,s="")=>{var i;return((i=t.current)==null?void 0:i.value)||s||""},ue=(t="")=>{const s=`${t??""}`.trim(),i=s.match(/^client-(\d+)$/i);return i?i[1]:s},vt=(t,s=J)=>s.find(i=>y(Et(i))===y(t)),bt=(t,s=J)=>{var i;return t.warehouse_id||((i=vt(t.warehouse_name,s))==null?void 0:i.id)||""},jt=(t,s=ce,i=J,n=R)=>{const a=bt(t,i),u=ue(n);return s.filter(m=>!u||`${m.client_id??""}`!=`${u}`?!1:a&&`${m.warehouse_id}`==`${a}`?!0:y(m.warehouse_name)===y(t.warehouse_name))},yt=(t,s=ce,i=J,n=R)=>{const a=jt(t,s,i,n),u=ke(t),m=u.length?a.filter(c=>u.includes(`${c.id}`)):[];return m.length?m:(Array.isArray(t.location_labels)&&t.location_labels.length?t.location_labels:Pt(t.location_label)).map(c=>a.find(g=>y(M(g))===y(c))).filter(Boolean)},es=(t=[],s=J,i=ce,n=R)=>{const a=Te(s);return t.forEach(u=>{var h,T;const m=Gs(u.description??""),o=a.findIndex(q=>y(q.warehouse_name)===y(m.warehouse_name));if(o<0)return;const c={...a[o],enabled:!0,warehouse_id:((h=vt(a[o].warehouse_name,s))==null?void 0:h.id)??a[o].warehouse_id,location_label:m.location_label,location_labels:m.location_labels,start_date:m.start_date,months:m.months||"",end_date:m.end_date||Ze(m.start_date,m.months),billing_dates:Ot(m.start_date,m.months),quantity_m3:m.quantity_m3||Number(u.quantity||0)||"",tariff:Number(u.unit_price||0)||"",monthly_amount:Number(u.total||0)||""},g=yt(c,i,s,n);a[o]={...c,location_id:(T=g[0])!=null&&T.id?`${g[0].id}`:"",location_ids:g.map(q=>`${q.id}`)}}),a},Y=(t,s)=>{de(i=>i.map(n=>{if(n.key!==t)return n;const a="location_ids"in s?(Array.isArray(s.location_ids)?s.location_ids:[s.location_ids]).filter(Boolean).map(h=>`${h}`):null,u=ue(R),m=ce.filter(h=>u&&`${h.client_id??""}`==`${u}`),o=s.location_id?m.find(h=>`${h.id}`==`${s.location_id}`):null,c=a?m.filter(h=>a.includes(`${h.id}`)):null,g={...n,...s,warehouse_id:bt(n)};if(o&&(g.location_label=M(o)),c&&(g.location_ids=a,g.location_id=a[0]??"",g.location_labels=c.map(M).filter(Boolean),g.location_label=g.location_labels.join(", ")),("start_date"in s||"months"in s)&&(g.end_date=Ze(g.start_date,g.months),g.billing_dates=Ot(g.start_date,g.months)),"quantity_m3"in s||"tariff"in s){const h=he(g.quantity_m3)*he(g.tariff);g.monthly_amount=h?h.toFixed(2):""}return g}))},ts=(t,s,i)=>{de(n=>n.map(a=>a.key!==t?a:{...a,billing_dates:(a.billing_dates??[]).map((u,m)=>m===s?{...u,date:i}:u)}))},ss=(t,s)=>{const i=`${s}`,n=ke(t),a=n.includes(i)?n.filter(u=>u!==i):[...n,i];Y(t.key,{location_ids:a})},me=async(t=null)=>{var c,g;Kt(!!(t!=null&&t.id)),S.current.value=(t==null?void 0:t.id)??"",_.current.value=(t==null?void 0:t.code)??"Se genera al guardar",O.current.value=Xe(t==null?void 0:t.issue_date)||new Date().toISOString().slice(0,10),ee.current.value=Xe(t==null?void 0:t.scheduled_at),te.current.value=Xe(t==null?void 0:t.first_due_date),k.current.value=(t==null?void 0:t.expected_document_type)??(b?"":"Factura");const s=(t==null?void 0:t.currency)??(F?"PEN":b?"":"PEN");w.current.value=s,it(s||"PEN"),G.current.value=(t==null?void 0:t.billing_cycle)??(N?"Unico":""),xe.current&&(xe.current.value=(t==null?void 0:t.contract_label)??""),se.current.value=(t==null?void 0:t.payment_condition)??"Contado",ie.current.value=Number((t==null?void 0:t.installments)??1),fe.current&&(fe.current.value=(t==null?void 0:t.billing_day)??""),U.current.value=(t==null?void 0:t.order_status)??(F?"approved":"draft"),W.current.value=(t==null?void 0:t.billing_status)??"pending",re.current.value=Number((t==null?void 0:t.tax_amount)??0),V.current.value=(t==null?void 0:t.observations)??"",rt(!!((t==null?void 0:t.detraction_enabled)??((t==null?void 0:t.items)??[]).some(h=>Number(h.detraction_percent||0)>0)));const i=b?Ye(ye):ye[0],n=F?i!=null&&i.id?`${i.id}`:E:t!=null&&t.business_id?`${t.business_id}`:E||(i!=null&&i.id?`${i.id}`:"");Pe(n),Ne(t!=null&&t.client_id?`${t.client_id}`:"");const a=await Re(n,(t==null?void 0:t.business_branch_id)??K);!(t!=null&&t.business_branch_id)&&!K&&((c=a[0])!=null&&c.id)&&oe(`${a[0].id}`);const u=((t==null?void 0:t.items)??[]).map(h=>{var T,q;return{uid:crypto.randomUUID(),service_id:`${h.service_id}`,scope:h.scope??((T=h.service)==null?void 0:T.category)??"",gloss:h.gloss??h.description??((q=h.service)==null?void 0:q.name)??"",description:h.description??"",quantity:Number(h.quantity||0),unit_price:Number(h.unit_price||0),detraction_percent:Number(h.detraction_percent||0),commission_percent:Number(h.commission_percent||0),total:Number(h.total||0)}});st(((g=u[0])==null?void 0:g.service_id)??"");let m=J,o=ce;if(B&&(!m.length||!o.length||!pt)){const h=await xt();m=h.warehouseRows,o=h.locationRows}de(B?es((t==null?void 0:t.items)??[],m,o,t!=null&&t.client_id?`${t.client_id}`:R):Te()),P(u.length?u:F?[]:[ge()]),$(x.current).modal("show")},A=(t,s,i)=>{P(n=>n.map(a=>{var m;if(a.uid!==t)return a;const u={...a,[s]:i};if(s==="service_id"){const o=Ae[i];u.scope=u.scope||(o==null?void 0:o.category)||"",u.gloss=u.gloss||(o==null?void 0:o.name)||"",u.description=u.gloss||u.description||(o==null?void 0:o.name)||"",u.unit_price=Number(((m=w.current)==null?void 0:m.value)==="USD"?o==null?void 0:o.unit_price_usd:o==null?void 0:o.unit_price_pen)||0}return s==="gloss"&&(u.description=i),Me(u)}))},_t=t=>{it(t||"PEN"),P(s=>s.map(i=>{if(!i.service_id)return i;const n=Ae[i.service_id];return Me({...i,unit_price:Number(t==="USD"?n==null?void 0:n.unit_price_usd:n==null?void 0:n.unit_price_pen)||0})}))},is=t=>{Ee.current=t,ae.current&&(ae.current.value=""),be.current&&(be.current.value=""),je.current&&(je.current.value="0.00"),$(Oe.current).modal("show"),setTimeout(()=>{var s;return(s=ae.current)==null?void 0:s.focus()},150)},rs=async t=>{t.preventDefault();const s=ae.current.value.trim(),i=be.current.value.trim(),n=je.current.value||0;if(!s){C.fire("Formulario incompleto","Ingresa el nombre del servicio general.","warning");return}const a=new Set(le.map(c=>`${c.id}`));if(!await j.saveStorageGeneralService({name:s,category:"General",service_type:"General",billing_unit:"Servicio",unit_price_pen:n,unit_price_usd:0,observations:i,status:!0}))return;const m=await ft(),o=m.find(c=>!a.has(`${c.id}`)&&y(c.name)===y(s))??[...m].reverse().find(c=>y(c.name)===y(s));o&&Ee.current&&P(c=>c.map(g=>{var h;return g.uid!==Ee.current?g:Me({...g,service_id:`${o.id}`,scope:g.scope||o.category||"",gloss:g.gloss||o.name||"",description:g.description||g.gloss||o.name||"",unit_price:Number(((h=w.current)==null?void 0:h.value)==="USD"?o.unit_price_usd:o.unit_price_pen)||0})})),$(Oe.current).modal("hide")},Nt=t=>{C.fire({icon:"success",title:"Correcto",text:(t==null?void 0:t.message)||"Orden de servicio guardada correctamente.",timer:1800,showConfirmButton:!1})},St=async t=>{const s=j.showSavedMessage;j.showSavedMessage=!1;try{return await j.save(t)}finally{j.showSavedMessage=s}},Ge=async t=>{var g,h,T,q,$t;if(t.preventDefault(),B){const v=L(H,E),Ie=L(ve,K),Rt=ue(L(ne,R)),Ve=L(et,tt),X=mt.filter(f=>f.enabled),Ft=X.find(f=>!ke(f).length||!f.start_date||!f.months||!f.end_date||!f.quantity_m3||!f.tariff);if(!v||!Ie||!Rt||!k.current.value||!w.current.value||!Ve){C.fire("Formulario incompleto","Completa empresa, cliente, tipo documento, moneda y tipo de servicio.","warning");return}if(!X.length){C.fire("Formulario incompleto","Selecciona al menos un almacen.","warning");return}if(Ft){C.fire("Formulario incompleto",`Completa los datos de ${Ft.warehouse_name}.`,"warning");return}const It=X.find(f=>{const Ke=Number.parseInt(f.months,10);return!Array.isArray(f.billing_dates)||f.billing_dates.length!==Ke||f.billing_dates.some(Be=>!Be.date)});if(It){C.fire("Formulario incompleto",`Completa las fechas de facturacion de ${It.warehouse_name}.`,"warning");return}const Bt=X.map(f=>f.start_date).filter(Boolean).sort(),xs=Math.max(...X.map(f=>Number(f.months||1))),He=Ae[Ve],fs={id:S.current.value||void 0,business_id:v||null,business_branch_id:Ie||null,client_id:Rt||null,expected_document_type:k.current.value,currency:w.current.value,billing_cycle:(He==null?void 0:He.name)??"",payment_condition:"Contado",installments:xs||1,issue_date:O.current.value||new Date().toISOString().slice(0,10),scheduled_at:Bt[0]??null,first_due_date:Bt[0]??null,order_status:U.current.value||"draft",billing_status:W.current.value||"pending",tax_amount:0,observations:V.current.value.trim(),items:X.map(f=>{const Ke=yt(f),Be=he(f.quantity_m3),Tt=he(f.tariff),vs=he(f.monthly_amount)||Be*Tt;return{service_id:Ve,description:Ms(f,Ke),quantity:Be,unit_price:Tt,detraction_percent:0,commission_percent:0,total:vs,billing_dates:(f.billing_dates??[]).map(bs=>bs.date)}})},Dt=await St(fs);if(!Dt)return;$(p.current).dxDataGrid("instance").refresh(),$(x.current).modal("hide"),Nt(Dt);return}const s=F?L(H,ht):L(H,E);let i=L(ve,K);const n=ue(L(ne,R)),a=Q.filter(v=>v.service_id).map(v=>({service_id:v.service_id,scope:v.scope,gloss:v.gloss,description:v.gloss||v.description,quantity:v.quantity,unit_price:v.unit_price,detraction_percent:N&&Le?v.detraction_percent||12:v.detraction_percent,commission_percent:v.commission_percent,total:v.total}));if(F){if(s&&!i){const v=await Re(s);i=(g=v[0])!=null&&g.id?`${v[0].id}`:"",i&&oe(i)}if(!s||!i||!n||!k.current.value||!w.current.value){C.fire("Formulario incompleto","Completa empresa, cliente, tipo documento y moneda.","warning");return}if(!a.length){C.fire("Formulario incompleto","Agrega al menos un servicio general.","warning");return}}else if(N){if(!s||!i||!n||!k.current.value||!w.current.value||!G.current.value){C.fire("Formulario incompleto","Completa cliente, comprobante, moneda y ciclo de facturacion.","warning");return}if(!a.length){C.fire("Formulario incompleto","Agrega al menos un item de servicio.","warning");return}}const u=a.reduce((v,Ie)=>v+Number(Ie.total||0),0),m=Number(N?(u*.18).toFixed(2):re.current.value||0),o={id:S.current.value||void 0,business_id:s||null,business_branch_id:i||null,client_id:n||null,contract_label:((q=(T=(h=xe.current)==null?void 0:h.value)==null?void 0:T.trim)==null?void 0:q.call(T))||null,expected_document_type:k.current.value,currency:w.current.value,billing_cycle:G.current.value.trim(),payment_condition:se.current.value,installments:ie.current.value,billing_day:(($t=fe.current)==null?void 0:$t.value)||null,detraction_enabled:N?Le:!1,issue_date:O.current.value,scheduled_at:ee.current.value||null,first_due_date:te.current.value||null,order_status:U.current.value,billing_status:W.current.value,tax_amount:m,observations:V.current.value.trim(),items:a},c=await St(o);c&&($(p.current).dxDataGrid("instance").refresh(),$(x.current).modal("hide"),Nt(c))},ns=async t=>{const s=typeof t=="object"?t==null?void 0:t.id:t;if(!s||(t==null?void 0:t.order_status)==="cancelled"||(t==null?void 0:t.status)===null)return;const{isConfirmed:i}=await C.fire({title:"Anular orden de servicio",text:b?"La orden quedara anulada y se mantendra visible en el historial.":"Se dara de baja la orden de servicio.",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, anular",cancelButtonText:"Cancelar"});!i||!(b?await j.boolean({id:s,field:"order_status",value:"cancelled"}):await j.delete(s))||$(p.current).dxDataGrid("instance").refresh()},as=(t,{data:s})=>{const i=(s==null?void 0:s.order_status)??"",n=document.createElement("span");n.className=`badge ${i==="approved"?"bg-soft-success text-success":i==="cancelled"?"bg-soft-danger text-danger":"bg-soft-warning text-warning"}`,n.textContent=zs(i),t.append(n)},ls=(t,{data:s})=>{const i=(s==null?void 0:s.billing_status)==="billed"||(s==null?void 0:s.order_status)==="invoiced",n=document.createElement("span");n.className=`badge ${i?"bg-soft-success text-success":"bg-soft-warning text-warning"}`,n.textContent=i?"Facturado":"Pendiente",t.append(n)},os=t=>(t.items??[]).map(s=>{var i;return s.gloss||s.description||((i=s.service)==null?void 0:i.name)}).filter(Boolean).join(" | "),cs=t=>(t==null?void 0:t.billing_status)==="billed"||(t==null?void 0:t.order_status)==="invoiced"?Number((t==null?void 0:t.total)||0):0,Ct={caption:"Acciones",width:b?136:150,minWidth:b?136:150,fixed:b,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(t,{data:s})=>{const i=(s==null?void 0:s.order_status)==="cancelled"||(s==null?void 0:s.status)===null;t.css({overflow:"visible",textOverflow:"unset",whiteSpace:"nowrap"});const n=$("<div>").css({display:"flex",alignItems:"center",gap:"0.35rem",minWidth:"max-content"});t.append(n),n.append(Je({className:b?"btn btn-xs btn-soft-warning":"btn btn-xs btn-soft-primary",title:"Editar orden de servicio",icon:"mdi mdi-pencil",onClick:()=>me(s)})),b||n.append(Je({className:"btn btn-xs btn-soft-danger",title:"Imprimir PDF",icon:"mdi mdi-file-pdf-box",onClick:()=>Bs(Ds.serviceOrder(s))})),i||n.append(Je({className:"btn btn-xs btn-soft-danger",title:"Anular orden de servicio",icon:b?"mdi mdi-close":"mdi mdi-delete",onClick:()=>ns(s)}))}},ds=[{dataField:"client_id",caption:"Cliente ID",visible:!1,showInColumnChooser:!1},{dataField:"row_number",caption:"#",width:56,allowFiltering:!1,calculateCellValue:t=>t.id},Ct,{dataField:"billing_status",caption:"Estado",width:130,lookup:Qe([{value:"pending",label:"Pendiente"},{value:"billed",label:"Facturado"}]),cellTemplate:ls},{dataField:"code",caption:"Orden Servicio",width:150,cellTemplate:(t,{data:s})=>kt(t,s==null?void 0:s.code,()=>me(s),"Editar orden de servicio")},{dataField:"billing_cycle",caption:"Ciclo Facturación",width:155},{dataField:"client.document_number",caption:"Doc. Cliente",width:140},{dataField:"client.full_name",caption:"Cliente",minWidth:200},{dataField:"services_text",caption:"Servicios",minWidth:260,calculateCellValue:os},{dataField:"total_prefactures",caption:"Total Prefacturas",width:150,dataType:"number",format:{type:"fixedPoint",precision:2},calculateCellValue:t=>Number(t.total||0)},{dataField:"total",caption:"Total Servicio",width:145,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total_billed",caption:"Total Facturado",width:150,dataType:"number",format:{type:"fixedPoint",precision:2},calculateCellValue:cs},{dataField:"contract_label",caption:"Contrato",width:150},{dataField:"creator.fullname",caption:"Usuario Registro",minWidth:150,calculateCellValue:t=>qt(t.creator)},{dataField:"created_at",caption:"Fecha Registro",dataType:"datetime",width:170,format:"yyyy-MM-dd HH:mm:ss"}],us=[{dataField:"client_id",caption:"Cliente ID",visible:!1,showInColumnChooser:!1},Ct,{dataField:"order_status",caption:"Estado",width:145,minWidth:145,lookup:Qe(Rs),cellTemplate:as},{dataField:"code",caption:"Codigo",width:185,minWidth:185,cellTemplate:(t,{data:s})=>kt(t,s==null?void 0:s.code,()=>me(s),"Editar orden de servicio")},{dataField:"business.name",caption:"Empresa",minWidth:210},{dataField:"client.full_name",caption:"Cliente",minWidth:330},{dataField:"expected_document_type",caption:"Tipo comprobante",width:170,minWidth:170},{dataField:"currency",caption:"Moneda",width:105,lookup:Qe(Es)},{dataField:"created_at",caption:"Fecha registro",dataType:"datetime",width:185,minWidth:185,format:"yyyy-MM-dd HH:mm:ss"},{dataField:"creator.fullname",caption:"Usuario registro",minWidth:185,calculateCellValue:t=>qt(t.creator)}],ms=b?us:ds,ps=Q.reduce((t,s)=>t+Number(s.total||0),0),Ue=Q.reduce((t,s)=>t+Number(s.total||0),0),wt=Number((Ue*.18).toFixed(2)),gs=Number((Ue+wt).toFixed(2)),We=Gt==="USD"?"$":"S/",Fe=t=>Number(t||0).toFixed(5),hs=N?e.jsxs("div",{className:"service-order-list-panel",children:[e.jsxs("div",{className:"service-order-tabs",children:[e.jsx("button",{type:"button",className:z==="services"?"active":"",onClick:()=>nt("services"),children:"Servicios"}),e.jsx("button",{type:"button",className:z==="deleted"?"active":"",onClick:()=>nt("deleted"),children:"OS Eliminadas"})]}),e.jsxs("div",{className:"service-order-filter-panel",children:[e.jsxs("div",{className:"row g-3 align-items-end",children:[e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{className:"form-select",value:Se,onChange:t=>at(t.target.value),children:[e.jsx("option",{value:"",children:z==="deleted"?"Seleccione":"Todos"}),_e.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} - `:"",t.full_name]},`service-order-filter-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Fecha Registro (Inicio - Fin):"}),e.jsxs("div",{className:"service-order-date-range",children:[e.jsx("input",{type:"date",className:"form-control",value:Ce,onChange:t=>lt(t.target.value)}),e.jsx("input",{type:"date",className:"form-control",value:we,onChange:t=>ot(t.target.value)})]})]})]}),e.jsxs("div",{className:"service-order-filter-actions",children:[e.jsxs("button",{type:"button",className:"btn service-order-outline-btn",onClick:Yt,children:[e.jsx("i",{className:"mdi mdi-filter me-1"})," Filtrar"]}),(Se||Ce||we||ct)&&e.jsx("button",{type:"button",className:"btn service-order-muted-btn",onClick:Xt,children:"Limpiar"})]})]}),z==="services"&&e.jsxs("div",{className:"service-order-list-summary",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Importe Total"}),e.jsxs("strong",{className:"text-success",children:["S/ ",Fe($e.penTotal)]}),e.jsxs("strong",{className:"text-success",children:["$ ",Fe($e.usdTotal)]})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Total Facturado"}),e.jsxs("strong",{className:"text-warning",children:["S/ ",Fe($e.penBilled)]}),e.jsxs("strong",{className:"text-warning",children:["$ ",Fe($e.usdBilled)]})]})]})]}):r;return e.jsxs(e.Fragment,{children:[N&&e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
          .service-order-action-row {
            display: grid;
            grid-template-columns: minmax(240px, 1fr) minmax(240px, 1fr);
            gap: 22px;
            max-width: 1128px;
            margin-bottom: 22px;
          }
          .service-order-action-tile {
            border: 0;
            border-radius: 0;
            min-height: 52px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 18px;
            color: #fff;
            font-weight: 500;
            text-align: left;
          }
          .service-order-action-tile.primary { background: #202146; }
          .service-order-action-tile.warning { background: #f5b955; }
          .service-order-list-panel { color: #33394a; }
          .service-order-tabs {
            display: flex;
            gap: 22px;
            border-bottom: 1px solid #e9ecef;
            margin: -8px -8px 16px;
            padding: 0 8px;
          }
          .service-order-tabs button {
            border: 0;
            background: transparent;
            color: #9aa1ac;
            padding: 12px 0 10px;
            font-size: 13px;
          }
          .service-order-tabs button.active {
            color: #26324d;
            border-bottom: 2px solid #d93025;
          }
          .service-order-filter-panel {
            border: 1px solid #e6e9ef;
            padding: 16px 12px 18px;
            margin-bottom: 16px;
          }
          .service-order-filter-panel .form-label {
            font-size: 12px;
            color: #26324d;
          }
          .service-order-filter-panel .form-control,
          .service-order-filter-panel .form-select {
            min-height: 28px;
            border-radius: 0;
            font-size: 12px;
            padding: 4px 9px;
          }
          .service-order-date-range {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .service-order-filter-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 18px;
          }
          .service-order-outline-btn {
            border: 1px solid #11184a;
            color: #11184a;
            background: #fff;
            border-radius: 0;
            font-size: 12px;
            font-weight: 600;
          }
          .service-order-muted-btn {
            border: 1px solid #f0f0f0;
            color: #777f8c;
            background: #f0f0f0;
            border-radius: 0;
            font-size: 12px;
          }
          .service-order-list-summary {
            min-height: 108px;
            border: 1px solid #e6e9ef;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0;
            margin-bottom: 14px;
          }
          .service-order-list-summary > div {
            min-width: 96px;
            padding: 8px 16px;
            text-align: center;
            border-right: 1px solid #d7dce5;
          }
          .service-order-list-summary > div:last-child { border-right: 0; }
          .service-order-list-summary span {
            display: block;
            font-size: 12px;
            margin-bottom: 14px;
          }
          .service-order-list-summary strong {
            display: block;
            font-size: 13px;
            line-height: 1.8;
            font-weight: 500;
          }
          @media (max-width: 767.98px) {
            .service-order-action-row { grid-template-columns: 1fr; }
            .service-order-date-range { grid-template-columns: 1fr; }
          }
        `}),e.jsxs("div",{className:"service-order-action-row",children:[e.jsxs("button",{type:"button",className:"service-order-action-tile primary",onClick:()=>me(),children:[e.jsxs("span",{children:[e.jsx("i",{className:"mdi mdi-plus-circle-outline me-1"})," Registrar Orden de Servicio"]}),e.jsx("i",{className:"mdi mdi-calendar-month-outline fs-4"})]}),e.jsxs("button",{type:"button",className:"service-order-action-tile warning",onClick:()=>C.fire("Procesar actividades pendientes","Este proceso quedo listo como acceso del modulo. Falta conectar una regla automatica de actividades cuando se defina el flujo operativo.","info"),children:[e.jsxs("span",{children:[e.jsx("i",{className:"mdi mdi-plus-circle-outline me-1"})," Procesar Actividades Pendientes"]}),e.jsx("i",{className:"mdi mdi-calendar-month-outline fs-4"})]})]})]}),e.jsx($s,{gridRef:p,title:hs,rest:j,pageSize:25,filterValue:N?ct:null,onRefresh:N?Zt:void 0,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",onClick:()=>$(p.current).dxDataGrid("instance").refresh()}}),N||t.unshift({widget:"dxButton",location:"after",options:{icon:"add",onClick:()=>me()}})},columns:ms},N?`service-order-${z}`:`service-order-${l}`),B?e.jsxs(De,{modalRef:x,title:e.jsxs("span",{className:"storage-service-order-title",children:[e.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-service-order-dialog modal-dialog-scrollable",contentClass:"storage-service-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-service-order-body",hideFooter:!0,onSubmit:Ge,children:[e.jsx("style",{children:`
          .storage-service-order-dialog {
            width: calc(100vw - 34px);
            max-width: calc(100vw - 34px);
            margin: 7px auto;
            align-items: flex-start;
          }
          .storage-service-order-content {
            border: 0;
            border-radius: 0;
            min-height: calc(100vh - 38px);
          }
          .storage-service-order-header {
            background: #202146;
            color: #fff;
            min-height: 36px;
            padding: 7px 14px;
            border-bottom: 0;
          }
          .storage-service-order-header .btn-close {
            transform: scale(.72);
            opacity: .85;
          }
          .storage-service-order-title {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0;
          }
          .storage-service-order-body {
            padding: 0 30px 28px;
            color: #33394a;
          }
          .storage-service-order-actions {
            display: flex;
            justify-content: center;
            gap: 16px;
            padding: 22px 0 14px;
            border-bottom: 1px solid #e9ecef;
          }
          .storage-service-order-actions .btn {
            border-radius: 0;
            font-size: 12px;
            font-weight: 600;
            padding: 6px 16px;
            line-height: 1;
          }
          .storage-service-order-actions .btn-primary-outline {
            color: #11184a;
            background: #fff;
            border: 1px solid #11184a;
          }
          .storage-service-order-actions .btn-muted {
            color: #8f949a;
            background: #f0f0f0;
            border: 1px solid #f0f0f0;
          }
          .storage-service-order-heading {
            text-align: center;
            font-size: 22px;
            font-weight: 600;
            color: #555b66;
            margin: 32px 0 20px;
          }
          .storage-service-order-body .form-label {
            color: #26324d;
            font-size: 12px;
            margin-bottom: 5px;
          }
          .storage-service-order-body .form-control,
          .storage-service-order-body .form-select {
            border-radius: 2px;
            min-height: 26px;
            padding: 3px 10px;
            font-size: 12px;
          }
          .storage-service-order-body .form-control:disabled,
          .storage-service-order-body .form-select:disabled {
            background-color: #f5f5f5;
            color: #9ca3af;
          }
          .storage-service-order-separator {
            border-top: 1px solid #e9ecef;
            margin: 28px 0 16px;
          }
          .storage-service-card {
            border: 1px solid #e9ecef;
            background: #fff;
            min-height: 248px;
          }
          .storage-service-card-header {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #f7f7f7;
            padding: 11px 12px;
            min-height: 44px;
          }
          .storage-service-card-title {
            margin: 0;
            font-size: 14px;
            font-weight: 500;
            color: #3b4250;
          }
          .storage-service-card-body {
            padding: 13px 12px 20px;
          }
          .storage-location-picker {
            position: relative;
          }
          .storage-location-picker-toggle {
            width: 100%;
            min-height: 42px;
            border: 1px solid #cfd6df;
            border-radius: 2px;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 5px 8px;
            text-align: left;
          }
          .storage-location-picker-toggle:disabled {
            background: #f5f5f5;
            color: #9ca3af;
          }
          .storage-location-picker-values {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            min-width: 0;
          }
          .storage-location-picker-placeholder {
            color: #8b919b;
            font-size: 13px;
          }
          .storage-location-chip {
            background: #0ea5c6;
            color: #fff;
            border-radius: 2px;
            padding: 3px 7px;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.1;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .storage-location-picker-menu {
            position: absolute;
            z-index: 30;
            top: calc(100% + 3px);
            left: 0;
            right: 0;
            max-height: 230px;
            overflow-y: auto;
            border: 1px solid #cfd6df;
            background: #fff;
            box-shadow: 0 10px 24px rgba(15, 23, 42, .16);
          }
          .storage-location-option {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            margin: 0;
            cursor: pointer;
            font-size: 12px;
            color: #26324d;
          }
          .storage-location-option:hover {
            background: #eef7fb;
          }
          .storage-location-option input {
            margin: 0;
          }
          .storage-location-empty {
            padding: 10px;
            color: #8b919b;
            font-size: 12px;
          }
          .storage-order-checkbox {
            width: 22px;
            height: 22px;
            border-radius: 1px;
            margin: 0;
          }
          .storage-billing-schedule {
            margin-top: 16px;
            border: 1px solid #e9ecef;
            overflow-x: auto;
          }
          .storage-billing-schedule table {
            width: 100%;
            margin: 0;
            border-collapse: collapse;
            font-size: 11px;
          }
          .storage-billing-schedule th,
          .storage-billing-schedule td {
            border-bottom: 1px solid #eef0f2;
            padding: 8px;
            vertical-align: middle;
          }
          .storage-billing-schedule th {
            color: #26324d;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            background: #fff;
          }
          .storage-billing-schedule td:first-child {
            width: 86px;
            text-align: center;
          }
          .storage-billing-schedule tr:last-child td {
            border-bottom: 0;
          }
          @media (max-width: 767.98px) {
            .storage-service-order-dialog {
              width: calc(100vw - 12px);
              max-width: calc(100vw - 12px);
            }
            .storage-service-order-body {
              padding: 0 16px 24px;
            }
          }
        `}),e.jsx("input",{ref:S,hidden:!0}),e.jsx("input",{ref:_,hidden:!0}),e.jsx("input",{ref:O,type:"date",hidden:!0}),e.jsx("input",{ref:ee,type:"date",hidden:!0}),e.jsx("input",{ref:te,type:"date",hidden:!0}),e.jsx("input",{ref:G,hidden:!0}),e.jsx("input",{ref:se,hidden:!0}),e.jsx("input",{ref:ie,type:"number",hidden:!0}),e.jsx("input",{ref:U,hidden:!0}),e.jsx("input",{ref:W,hidden:!0}),e.jsx("input",{ref:re,type:"number",hidden:!0}),e.jsx("textarea",{ref:V,hidden:!0}),e.jsxs("div",{className:"storage-service-order-actions",children:[e.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]}),e.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[e.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),e.jsx("h3",{className:"storage-service-order-heading",children:"Orden de servicio N°"}),e.jsxs("div",{className:"row g-4 align-items-end",children:[e.jsxs("div",{className:"col-12 col-md-6 col-xl",children:[e.jsx("label",{className:"form-label",children:"Empresa"}),e.jsxs("select",{ref:H,className:"form-select",value:E,onChange:async t=>{var i;Pe(t.target.value);const s=await Re(t.target.value);oe((i=s[0])!=null&&i.id?`${s[0].id}`:"")},required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),ye.map(t=>e.jsx("option",{value:t.id,children:t.name},`storage-order-business-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:ne,className:"form-select",value:R,onChange:t=>{Ne(t.target.value),B&&(ze(""),de(s=>s.map(i=>({...i,location_id:"",location_ids:[],location_label:"",location_labels:[]}))))},required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),_e.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} | `:"",t.full_name]},`storage-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Tipo documento"}),e.jsxs("select",{ref:k,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:w,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"PEN",children:"Soles"}),e.jsx("option",{value:"USD",children:"Dolares"})]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Tipo de servicio"}),e.jsxs("select",{ref:et,className:"form-select",value:tt,onChange:t=>st(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),Qt.map(t=>e.jsx("option",{value:t.id,children:t.name},`storage-order-service-${t.id}`))]})]})]}),e.jsx("div",{className:"storage-service-order-separator"}),e.jsx("div",{className:"row g-3",children:mt.map(t=>{const s=jt(t),i=B&&!pt,n=!ue(R),a=!t.enabled||i||n,u=ke(t),m=s.filter(c=>u.includes(`${c.id}`)),o=Ht===t.key;return e.jsx("div",{className:"col-12 col-lg-4",children:e.jsxs("div",{className:"storage-service-card",children:[e.jsxs("div",{className:"storage-service-card-header",children:[e.jsx("input",{type:"checkbox",className:"form-check-input storage-order-checkbox",checked:t.enabled,onChange:c=>{Y(t.key,{enabled:c.target.checked}),c.target.checked||ze("")}}),e.jsx("p",{className:"storage-service-card-title",children:t.warehouse_name})]}),e.jsxs("div",{className:"storage-service-card-body",children:[e.jsxs("div",{className:"mb-3",children:[e.jsx("label",{className:"form-label",children:"Ubicación"}),e.jsxs("div",{className:"storage-location-picker",children:[e.jsxs("button",{type:"button",className:"storage-location-picker-toggle",disabled:a,onClick:()=>ze(c=>c===t.key?"":t.key),children:[e.jsxs("span",{className:"storage-location-picker-values",children:[i&&e.jsx("span",{className:"storage-location-picker-placeholder",children:"Cargando ubicaciones..."}),!i&&!m.length&&e.jsx("span",{className:"storage-location-picker-placeholder",children:n?"Seleccione cliente primero":s.length?"Seleccione ubicaciones":"Sin ubicaciones"}),m.map(c=>e.jsx("span",{className:"storage-location-chip",children:M(c)},`storage-order-location-chip-${t.key}-${c.id}`))]}),e.jsx("i",{className:"mdi mdi-chevron-down"})]}),o&&!a&&e.jsxs("div",{className:"storage-location-picker-menu",children:[!s.length&&e.jsx("div",{className:"storage-location-empty",children:"Sin ubicaciones"}),s.map(c=>{const g=`${c.id}`;return e.jsxs("label",{className:"storage-location-option",children:[e.jsx("input",{type:"checkbox",checked:u.includes(g),onChange:()=>ss(t,g)}),e.jsx("span",{children:M(c)})]},`storage-order-location-${t.key}-${c.id}`)})]})]})]}),e.jsxs("div",{className:"row g-3 mb-3",children:[e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Fecha de inicio"}),e.jsx("input",{type:"date",className:"form-control",value:t.start_date,disabled:a,onChange:c=>Y(t.key,{start_date:c.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Nro de meses"}),e.jsx("input",{type:"number",min:"1",className:"form-control",value:t.months,disabled:a,onChange:c=>Y(t.key,{months:c.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Fecha fin"}),e.jsx("input",{type:"date",className:"form-control",value:t.end_date,disabled:!0})]})]}),e.jsxs("div",{className:"row g-3",children:[e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Cantidad de m3"}),e.jsx("input",{type:"number",min:"0",step:"0.001",className:"form-control",value:t.quantity_m3,disabled:a,onChange:c=>Y(t.key,{quantity_m3:c.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Tarifa"}),e.jsx("input",{type:"number",min:"0",step:"0.01",className:"form-control",value:t.tariff,disabled:a,onChange:c=>Y(t.key,{tariff:c.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Importe mensual"}),e.jsx("input",{type:"number",className:"form-control",value:t.monthly_amount,disabled:!0})]})]}),t.enabled&&(t.billing_dates??[]).length>0&&e.jsx("div",{className:"storage-billing-schedule",children:e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"N° mes"}),e.jsx("th",{children:"Fecha facturación"})]})}),e.jsx("tbody",{children:t.billing_dates.map((c,g)=>e.jsxs("tr",{children:[e.jsx("td",{children:c.month}),e.jsx("td",{children:e.jsx("input",{type:"date",className:"form-control",value:c.date,onChange:h=>ts(t.key,g,h.target.value),required:t.enabled})})]},`storage-order-billing-${t.key}-${c.month}`))})]})})]})]})},`storage-order-block-${t.key}`)})})]}):F?e.jsxs(De,{modalRef:x,title:gt?"Editar orden de servicio general":"Registrar orden de servicio general",size:"xl",dialogClass:"modal-dialog-scrollable",bodyClass:"storage-general-order-body",btnCancelText:"Cerrar",btnSubmitText:"Guardar",onSubmit:Ge,children:[e.jsx("style",{children:`
          .storage-general-order-body {
            color: #374151;
          }
          .storage-general-order-body .form-label {
            color: #374151;
            font-weight: 600;
          }
          .storage-general-section-title {
            color: #313a46;
            font-size: 0.9rem;
            font-weight: 700;
            margin: 0;
          }
          .storage-general-service-selector {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 38px;
            gap: .5rem;
            align-items: center;
          }
          .storage-general-service-selector .form-select {
            min-width: 0;
          }
          .storage-general-service-add {
            width: 38px;
            min-width: 38px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
          }
          .storage-general-lines-wrap {
            border: 1px solid #e6ebf1;
            border-radius: 6px;
            overflow: auto;
          }
          .storage-general-lines {
            min-width: 980px;
          }
          .storage-general-lines th {
            color: #4b5563;
            font-size: .72rem;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .storage-general-lines td {
            vertical-align: middle;
          }
          .storage-general-lines .form-control,
          .storage-general-lines .form-select {
            min-height: 34px;
          }
          .storage-general-total-row {
            max-width: 320px;
            margin-left: auto;
          }
          .storage-general-total-row .storage-general-total-label {
            color: #313a46;
            font-weight: 700;
            text-align: right;
          }
        `}),e.jsx("input",{ref:S,hidden:!0}),e.jsx("input",{ref:_,hidden:!0}),e.jsx("input",{ref:O,type:"date",hidden:!0}),e.jsx("input",{ref:ee,type:"date",hidden:!0}),e.jsx("input",{ref:te,type:"date",hidden:!0}),e.jsx("input",{ref:G,hidden:!0}),e.jsx("input",{ref:se,hidden:!0}),e.jsx("input",{ref:ie,type:"number",hidden:!0}),e.jsx("input",{ref:U,hidden:!0}),e.jsx("input",{ref:W,hidden:!0}),e.jsx("input",{ref:re,type:"number",hidden:!0}),e.jsx("textarea",{ref:V,hidden:!0}),e.jsx("input",{ref:H,type:"hidden",value:ht,readOnly:!0}),e.jsx("input",{ref:ve,type:"hidden",value:K,readOnly:!0}),e.jsxs("div",{className:"row g-3",children:[e.jsx("div",{className:"col-12",children:e.jsx("h5",{className:"storage-general-section-title",children:"Datos de la orden"})}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[e.jsx("label",{className:"form-label",children:"Empresa"}),e.jsx("input",{className:"form-control bg-light",value:Jt,disabled:!0,readOnly:!0})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:ne,className:"form-select",value:R,onChange:t=>Ne(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),_e.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} | `:"",t.full_name]},`general-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[e.jsx("label",{className:"form-label",children:"Tipo documento"}),e.jsxs("select",{ref:k,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:w,className:"form-select",onChange:t=>_t(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"PEN",children:"Soles"}),e.jsx("option",{value:"USD",children:"Dolares"})]})]})]}),e.jsx("hr",{className:"my-4"}),e.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[e.jsx("h5",{className:"storage-general-section-title",children:"Detalle de servicios"}),e.jsxs("button",{type:"button",className:"btn btn-sm btn-primary",onClick:()=>P(t=>[...t,ge()]),children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Agregar item"]})]}),e.jsx("div",{className:"storage-general-lines-wrap",children:e.jsxs("table",{className:"table table-sm table-bordered align-middle storage-general-lines mb-0",children:[e.jsx("thead",{className:"table-light",children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:48},children:"#"}),e.jsx("th",{children:"Servicio"}),e.jsx("th",{style:{width:115},children:"Tarifa"}),e.jsx("th",{style:{width:115},children:"Cantidad"}),e.jsx("th",{style:{width:130},children:"Total"}),e.jsx("th",{style:{width:42}})]})}),e.jsxs("tbody",{children:[Q.length===0&&e.jsx("tr",{children:e.jsx("td",{colSpan:"6",className:"text-center text-muted py-4",children:"Agrega al menos un servicio."})}),Q.map((t,s)=>e.jsxs("tr",{children:[e.jsx("td",{children:s+1}),e.jsx("td",{children:e.jsxs("div",{className:"storage-general-service-selector",children:[e.jsxs("select",{className:"form-select",value:t.service_id,onChange:i=>A(t.uid,"service_id",i.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione servicio"}),le.map(i=>e.jsx("option",{value:i.id,children:i.name},`general-order-service-${i.id}`))]}),e.jsx("button",{type:"button",className:"btn btn-outline-primary storage-general-service-add",title:"Agregar servicio general",onClick:()=>is(t.uid),children:e.jsx("i",{className:"mdi mdi-plus"})})]})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.01",className:"form-control text-end",value:t.unit_price,onChange:i=>A(t.uid,"unit_price",i.target.value)})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.001",min:"0",className:"form-control text-end",value:t.quantity,onChange:i=>A(t.uid,"quantity",i.target.value)})}),e.jsx("td",{children:e.jsx("input",{className:"form-control text-end",value:Number(t.total||0).toFixed(2),disabled:!0})}),e.jsx("td",{children:e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>P(i=>i.filter(n=>n.uid!==t.uid)),children:e.jsx("i",{className:"mdi mdi-close"})})})]},`general-order-item-${t.uid}`))]})]})}),e.jsxs("div",{className:"storage-general-total-row mt-3",children:[e.jsx("label",{className:"storage-general-total-label form-label d-block mb-1",children:"Total"}),e.jsx("input",{className:"form-control text-end",value:ps.toFixed(2),disabled:!0})]})]}):e.jsxs(De,{modalRef:x,title:gt?"Editar orden de servicio":"Registrar orden de servicio",size:"xl",bodyClass:"service-order-form-modal-body",btnCancelText:"Cerrar",btnSubmitText:"Guardar",onSubmit:Ge,children:[e.jsx("style",{children:`
        .service-order-form-modal-body .form-label { color: #374151; font-weight: 600; }
        .service-order-form-section-title { color: #313a46; font-size: 0.9rem; font-weight: 700; margin: 0; }
        .service-order-items-wrapper { border: 1px solid #e6ebf1; border-radius: 6px; overflow: auto; }
        .service-order-items-table { min-width: 1120px; }
        .service-order-items-table th { color: #4b5563; font-size: .72rem; text-transform: uppercase; white-space: nowrap; }
        .service-order-items-table td { vertical-align: middle; }
        .service-order-items-table .form-control,
        .service-order-items-table .form-select { min-height: 34px; }
        .service-order-summary { max-width: 360px; margin-left: auto; }
        .service-order-summary-row { display: grid; grid-template-columns: 130px 1fr; align-items: center; gap: .75rem; margin-bottom: .5rem; }
        .service-order-summary-label { font-weight: 700; text-align: right; color: #313a46; }
        .service-order-detraction-options { display: flex; gap: 1rem; align-items: center; min-height: 38px; }
        @media (max-width: 767.98px) {
          .service-order-summary { max-width: none; }
          .service-order-summary-row { grid-template-columns: 1fr; gap: .25rem; }
          .service-order-summary-label { text-align: left; }
        }
      `}),e.jsx("input",{ref:S,hidden:!0}),e.jsx("input",{ref:_,hidden:!0,readOnly:!0}),e.jsx("input",{ref:H,type:"hidden",value:E,readOnly:!0}),e.jsx("input",{ref:ve,type:"hidden",value:K,readOnly:!0}),e.jsx("input",{ref:O,type:"hidden"}),e.jsx("input",{ref:ee,type:"hidden"}),e.jsx("input",{ref:te,type:"hidden"}),e.jsx("input",{ref:ie,type:"hidden",defaultValue:"1"}),e.jsx("input",{ref:U,type:"hidden",defaultValue:"draft"}),e.jsx("input",{ref:W,type:"hidden",defaultValue:"pending"}),e.jsx("input",{ref:re,type:"hidden"}),e.jsx("textarea",{ref:V,hidden:!0}),e.jsxs("div",{className:"row g-3",children:[e.jsx("div",{className:"col-12",children:e.jsx("h5",{className:"service-order-form-section-title",children:"Datos de la orden"})}),e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:ne,className:"form-select",value:R,onChange:t=>Ne(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),_e.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} - `:"",t.display_name??t.full_name]},`service-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Contrato"}),e.jsx("input",{ref:xe,className:"form-control",placeholder:"Seleccionar"})]}),e.jsxs("div",{className:"col-12 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Ciclo de facturación"}),e.jsxs("select",{ref:G,className:"form-select",required:!0,children:[e.jsx("option",{value:"Unico",children:"Unico"}),e.jsx("option",{value:"Mensual",children:"Mensual"}),e.jsx("option",{value:"Eventual",children:"Eventual"})]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:w,className:"form-select",onChange:t=>_t(t.target.value),required:!0,children:[e.jsx("option",{value:"PEN",children:"S/ | Soles"}),e.jsx("option",{value:"USD",children:"$ | Dolares"})]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Comprobante"}),e.jsxs("select",{ref:k,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]})]}),e.jsx("hr",{className:"my-4"}),e.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[e.jsx("h5",{className:"service-order-form-section-title",children:"Detalle de servicios"}),e.jsxs("button",{type:"button",className:"btn btn-sm btn-primary",onClick:()=>P(t=>[...t,ge()]),children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Agregar item"]})]}),e.jsx("div",{className:"service-order-items-wrapper",children:e.jsxs("table",{className:"table table-sm table-bordered align-middle service-order-items-table mb-0",children:[e.jsx("thead",{className:"table-light",children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:48},children:"#"}),e.jsx("th",{children:"Servicio"}),e.jsx("th",{style:{width:170},children:"Alcance"}),e.jsx("th",{children:"Glosa"}),e.jsxs("th",{style:{width:135},children:["P. Unit.",e.jsx("br",{}),"(Sin IGV)"]}),e.jsx("th",{style:{width:130},children:"Subtotal"}),e.jsx("th",{style:{width:42}})]})}),e.jsx("tbody",{children:Q.map((t,s)=>e.jsxs("tr",{children:[e.jsx("td",{children:s+1}),e.jsx("td",{children:e.jsxs("select",{className:"form-select",value:t.service_id,onChange:i=>A(t.uid,"service_id",i.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione servicio"}),le.map(i=>e.jsxs("option",{value:i.id,children:[i.code?`${i.code} - `:"",i.name]},`service-order-item-${i.id}`))]})}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:t.scope,onChange:i=>A(t.uid,"scope",i.target.value)})}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:t.gloss,onChange:i=>A(t.uid,"gloss",i.target.value)})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control text-end",value:t.unit_price,onChange:i=>A(t.uid,"unit_price",i.target.value)})}),e.jsx("td",{children:e.jsx("input",{className:"form-control text-end",value:Number(t.total||0).toFixed(2),disabled:!0})}),e.jsx("td",{children:e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>P(i=>i.length===1?[ge()]:i.filter(n=>n.uid!==t.uid)),children:e.jsx("i",{className:"mdi mdi-close"})})})]},`service-order-item-row-${t.uid}`))})]})}),e.jsxs("div",{className:"service-order-summary mt-3",children:[e.jsxs("div",{className:"service-order-summary-row",children:[e.jsxs("span",{className:"service-order-summary-label",children:["Gravadas: ",We]}),e.jsx("input",{className:"form-control text-end",value:Ue.toFixed(2),disabled:!0})]}),e.jsxs("div",{className:"service-order-summary-row",children:[e.jsxs("span",{className:"service-order-summary-label",children:["I.G.V.: ",We]}),e.jsx("input",{className:"form-control text-end",value:wt.toFixed(2),disabled:!0})]}),e.jsxs("div",{className:"service-order-summary-row",children:[e.jsxs("span",{className:"service-order-summary-label",children:["Total: ",We]}),e.jsx("input",{className:"form-control text-end",value:gs.toFixed(2),disabled:!0})]})]}),e.jsx("hr",{className:"my-4"}),e.jsxs("div",{className:"row g-3 align-items-end",children:[e.jsxs("div",{className:"col-12 col-lg-4",children:[e.jsx("label",{className:"form-label d-block",children:"Detracción"}),e.jsx("div",{className:"form-check form-switch service-order-detraction-options",children:e.jsx("input",{className:"form-check-input",id:"service-order-detraction-enabled",type:"checkbox",checked:Le,onChange:t=>rt(t.target.checked)})})]}),e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Forma de pago"}),e.jsxs("select",{ref:se,className:"form-select",children:[e.jsx("option",{value:"Contado",children:"Contado"}),e.jsx("option",{value:"Credito",children:"Credito"})]})]}),e.jsxs("div",{className:"col-12 col-lg-2",children:[e.jsx("label",{className:"form-label",children:"Día facturación"}),e.jsxs("select",{ref:fe,className:"form-select",children:[e.jsx("option",{value:"",children:"Seleccionar"}),Array.from({length:31},(t,s)=>s+1).map(t=>e.jsx("option",{value:t,children:t},`service-order-billing-day-${t}`))]})]})]})]}),F&&e.jsx(De,{modalRef:Oe,title:"Agregar servicio general",size:"md",btnCancelText:"Cerrar",btnSubmitText:"Guardar",zIndex:1070,onSubmit:rs,children:e.jsxs("div",{className:"row g-3",children:[e.jsxs("div",{className:"col-12",children:[e.jsx("label",{className:"form-label",children:"Nombre"}),e.jsx("input",{ref:ae,className:"form-control",required:!0})]}),e.jsxs("div",{className:"col-12",children:[e.jsx("label",{className:"form-label",children:"Descripcion"}),e.jsx("input",{ref:be,className:"form-control"})]}),e.jsxs("div",{className:"col-12",children:[e.jsx("label",{className:"form-label",children:"Tarifa"}),e.jsx("input",{ref:je,type:"number",min:"0",step:"0.01",className:"form-control",defaultValue:"0.00"})]})]})})]})};Ss((r,l)=>{const p=l.requiredPermission??"services-service-order";!l.can(p)&&!l.hasRole("Admin")&&(location.href="/admin/"),Cs(r).render(e.jsx(ws,{...l,title:l.moduleTitle??"Ordenes de servicio",children:e.jsx(Us,{...l})}))});
