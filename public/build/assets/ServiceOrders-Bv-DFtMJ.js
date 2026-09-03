var Ss=Object.defineProperty;var Cs=(r,o,m)=>o in r?Ss(r,o,{enumerable:!0,configurable:!0,writable:!0,value:m}):r[o]=m;var I=(r,o,m)=>(Cs(r,typeof o!="symbol"?o+"":o,m),m);import{m as $s,t as ks,C as Rs,c as ws,j as t,r as u,S as k}from"./CreateReactScript-Dsy5wuVZ.js";import{B as Fs}from"./Base-C3ZagMIh.js";import{V as Bs}from"./VdTable-CPa4vXwz.js";import{V as v}from"./VdSelect-CfZRXqkw.js";import{M as Be}from"./Modal-BoI0NHeM.js";import{B as Is}from"./BasicRest-DKNLE_pE.js";import{a as X}from"./permissionScope-DOiR_Kst.js";import{o as Ts,b as Ds}from"./magistralesRecordPdf-NYUunHpD.js";import{y as qs,F as Os}from"./statusLabels-q_RKFE8l.js";import"./ubigeoInei-D0FnAslC.js";const ue=async(r,o={})=>{try{const{status:m,result:f}=await $s.Fetch(r,{method:"POST",body:JSON.stringify({take:1e3,skip:0,isLoadingAll:!0,...o})});if(!m)throw new Error((f==null?void 0:f.message)||"No se pudo cargar la lista");return(f==null?void 0:f.data)??[]}catch(m){return ks.error("Error",{description:m.message,duration:3e3,richColors:!0}),[]}},Ps=()=>location.pathname.includes("/admin/storage-general-service-orders"),Es=()=>location.pathname.includes("/admin/storage-service-orders");class As extends Is{constructor(){super(...arguments);I(this,"path",X()?Ps()?"admin/storage/general-service-orders":"admin/storage/service-orders":"admin/service-orders");I(this,"deleted",!1);I(this,"getBranchesByBusiness",async m=>m?await this.simpleGet(`/api/${this.path}/businesses/${m}/branches`)??[]:[]);I(this,"getBusinesses",async()=>await ue("/api/admin/businesses/paginate"));I(this,"getClients",async()=>await ue(X()?"/api/admin/storage/clients/paginate":"/api/admin/services-client/paginate"));I(this,"getServices",async()=>await ue(X()?"/api/admin/storage/general-service/paginate":"/api/admin/services/paginate",Es()?{storage_service_types:!0}:{}));I(this,"saveStorageGeneralService",async m=>{const f=this.path;this.path="admin/storage/general-service-orders/services";try{return await this.save(m)}finally{this.path=f}});I(this,"getStorageOptions",async()=>X()?await this.simpleGet("/api/admin/storage/kardex/options"):null);I(this,"getStorageWarehouses",async()=>X()?await ue("/api/admin/storage/kardex/paginate",{section:"warehouses",sort:[{selector:"warehouse_name",desc:!1}]}):[]);I(this,"getStorageLocations",async()=>X()?await ue("/api/admin/storage/kardex/paginate",{section:"locations"}):[])}async paginate(m){return await super.paginate({...m,deleted:this.deleted})}}const y=new As,Mt=r=>(r==null?void 0:r.fullname)||[r==null?void 0:r.name,r==null?void 0:r.lastname].filter(Boolean).join(" ")||(r==null?void 0:r.username)||"",me=()=>({uid:crypto.randomUUID(),service_id:"",scope:"",gloss:"",description:"",quantity:1,unit_price:0,detraction_percent:0,commission_percent:0,total:0}),_=(r="")=>r.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""),Ls=["Servicio de almacenamiento","Servicio de almacenamiento - Adicional"],Ie=[{value:"PEN",label:"Soles"},{value:"USD",label:"Dolares"}],zs="kamary_medicals",Ut=r=>(r==null?void 0:r.name)??(r==null?void 0:r.warehouse_name)??"",Ms=r=>(r==null?void 0:r.id)??(r==null?void 0:r.warehouse_id)??"",Gs=r=>r==="approved"?"Aprobado":qs(r),He=(r=[])=>r.find(o=>`${o.business_key??""}`===zs)??r.find(o=>_([o.name,o.trade_name].filter(Boolean).join(" ")).includes("kamarymedicals"))??r[0],Us=r=>{const o=Ms(r),m=Ut(r);return{key:o?`warehouse-${o}`:_(m),warehouse_name:m,warehouse_id:o?`${o}`:"",enabled:!1,location_id:"",location_ids:[],location_label:"",location_labels:[],start_date:"",months:"",end_date:"",billing_dates:[],quantity_m3:"",tariff:"",monthly_amount:""}},Te=(r=[])=>r.filter(o=>(o==null?void 0:o.status)!==null).map(Us),Xe=r=>{var o,m,f;return((f=(o=r==null?void 0:r.toString)==null?void 0:(m=o.call(r)).slice)==null?void 0:f.call(m,0,10))??""},pe=r=>Number(r||0),Ze=(r,o,m=!1)=>{if(!r)return"";const f=Number(o);if(!Number.isFinite(f)||f<0||!m&&f<=0)return"";const C=new Date(`${r}T00:00:00`);if(Number.isNaN(C.getTime()))return"";const S=new Date(C),q=S.getDate();return S.setDate(1),S.setMonth(S.getMonth()+f),S.setDate(Math.min(q,new Date(S.getFullYear(),S.getMonth()+1,0).getDate())),S.toISOString().slice(0,10)},Gt=(r,o)=>{const m=Number.parseInt(o,10);return!r||!Number.isFinite(m)||m<=0?[]:Array.from({length:m},(f,C)=>({month:C+1,date:Ze(r,C,!0)}))},M=r=>r?[r.code,r.temperature_range].filter(Boolean).join(" | "):"",Vt=(r="")=>r.split(",").map(o=>o.trim()).filter(Boolean),De=r=>Array.isArray(r.location_ids)?r.location_ids.filter(Boolean).map(o=>`${o}`):r.location_id?[`${r.location_id}`]:[],Vs=(r,o)=>[r.warehouse_name,(Array.isArray(o)?o.map(M).filter(Boolean).join(", "):M(o))||r.location_label,`${r.start_date||""} - ${r.end_date||""}`,`${r.months||0} meses`,`${r.quantity_m3||0} m3`].filter(Boolean).join("; "),Ws=(r="")=>{const o=r.split(";").map(f=>f.trim()),m=(o[2]??"").split("-").map(f=>f.trim());return{warehouse_name:o[0]??"",location_label:o[1]??"",location_labels:Vt(o[1]??""),start_date:m.length>=3?`${m[0]}-${m[1]}-${m[2]}`.slice(0,10):"",end_date:m.length>=6?`${m[3]}-${m[4]}-${m[5]}`.slice(0,10):"",months:parseFloat(o[3])||"",quantity_m3:parseFloat(o[4])||""}},Ks=({moduleTitle:r="Ordenes de servicio",serviceOrderType:o="service"})=>{const m=u.useRef(),f=u.useRef(),C=u.useRef(),S=u.useRef(),q=u.useRef(),Z=u.useRef(),ee=u.useRef(),ge=u.useRef(),te=u.useRef(),G=u.useRef(),U=u.useRef(),se=u.useRef(),V=u.useRef(),qe=u.useRef(null),ie=u.useRef(),he=u.useRef(),Oe=u.useRef(),Pe=u.useRef(""),re=u.useRef(),fe=u.useRef(),xe=u.useRef(),[be,Wt]=u.useState([]),[Qs,Kt]=u.useState([]),[ve,Qt]=u.useState([]),[ne,Jt]=u.useState([]),[O,Ee]=u.useState(""),[W,le]=u.useState(""),[R,ye]=u.useState(""),[et,tt]=u.useState(""),[w,Ae]=u.useState("PEN"),[P,_e]=u.useState(""),[Le,st]=u.useState("Unico"),[it,rt]=u.useState("Contado"),[nt,lt]=u.useState(""),[ze,at]=u.useState(!1),[L,Yt]=u.useState("services"),[je,ot]=u.useState(""),[Ne,ct]=u.useState(""),[Se,dt]=u.useState(""),[Ce,ut]=u.useState(null),[$e,mt]=u.useState({penTotal:0,penBilled:0,usdTotal:0,usdBilled:0}),[K,E]=u.useState([me()]),[Q,Ht]=u.useState([]),[ae,Xt]=u.useState([]),[pt,oe]=u.useState(()=>Te()),[gt,Zt]=u.useState(!1),[es,Me]=u.useState(""),[ht,ts]=u.useState(!1),F=o==="storage_general",T=o==="storage_service",N=F||T,j=!N,ss=ne.filter(e=>Ls.some(i=>_(i)===_(e.name))),Ge=Object.fromEntries(ne.map(e=>[`${e.id}`,e])),D=N?He(be):null,ft=F&&D!=null&&D.id?`${D.id}`:O,is=F?(D==null?void 0:D.name)??(D==null?void 0:D.trade_name)??"Kamary Medicals":"",xt=async()=>{if(!T)return{warehouseRows:[],locationRows:[]};qe.current||(qe.current=(async()=>{const s=await y.getStorageOptions();let n=((s==null?void 0:s.warehouses)??[]).filter(d=>d.status!==null),l=((s==null?void 0:s.locations)??[]).filter(d=>d.status!==null);if(!n.length||!l.length){const[d,a]=await Promise.all([l.length?Promise.resolve(l):y.getStorageLocations(),n.length?Promise.resolve(n):y.getStorageWarehouses()]);n=(n.length?n:a??[]).filter(g=>g.status!==null),l=(l.length?l:d??[]).filter(g=>g.status!==null)}return{warehouseRows:n,locationRows:l}})());const{warehouseRows:e,locationRows:i}=await qe.current;return Ht(e),Xt(i),Zt(!0),{warehouseRows:e,locationRows:i}};u.useEffect(()=>{(async()=>{var a;const i=T?xt():Promise.resolve({warehouseRows:[],locationRows:[]}),[s,n,,l]=await Promise.all([y.getBusinesses(),y.getClients(),bt(),i]),d=s??[];if(Wt(d),Qt((n??[]).filter(g=>g.status!==null)),T&&oe(Te(l.warehouseRows)),N||j){const g=N?He(d):d[0];if(g){Ee(`${g.id}`);const c=await ke(g.id);(a=c[0])!=null&&a.id&&le(`${c[0].id}`)}}})()},[]);const rs=async()=>{var i;if(!j||L!=="services")return;const e=await((i=m.current)==null?void 0:i.loadAll())??[];as({data:e})};u.useEffect(()=>{j&&rs()},[L,Ce]),u.useEffect(()=>{var e;j&&((e=m.current)==null||e.refresh())},[Ce]);const ns=()=>{const e=[];je&&e.push(["client_id","=",Number(je)]),Ne&&e.push(["created_at",">=",`${Ne} 00:00:00`]),Se&&e.push(["created_at","<=",`${Se} 23:59:59`]),ut(e.length?e.reduce((i,s)=>i.length?[...i,"and",s]:s,[]):null)},ls=()=>{ot(""),ct(""),dt(""),ut(null)},as=e=>{const s=((e==null?void 0:e.data)??[]).reduce((n,l)=>{const d=`${l.currency??"PEN"}`.toUpperCase(),a=Number(l.total||0),g=l.billing_status==="billed"||l.order_status==="invoiced"?a:Number(l.paid_amount||0);return d==="USD"?(n.usdTotal+=a,n.usdBilled+=g):(n.penTotal+=a,n.penBilled+=g),n},{penTotal:0,penBilled:0,usdTotal:0,usdBilled:0});mt(s)},ke=async(e,i="")=>{const n=await y.getBranchesByBusiness(e)??[];return Kt(n),le(i?`${i}`:""),n},bt=async()=>{const i=(await y.getServices()??[]).filter(s=>s.status!==null);return Jt(i),i},Ue=e=>({...e,total:Number(e.quantity||0)*Number(e.unit_price||0)}),ce=(e,i="")=>{var s;return((s=e.current)==null?void 0:s.value)||i||""},de=(e="")=>{const i=`${e??""}`.trim(),s=i.match(/^client-(\d+)$/i);return s?s[1]:i},vt=(e,i=Q)=>i.find(s=>_(Ut(s))===_(e)),yt=(e,i=Q)=>{var s;return e.warehouse_id||((s=vt(e.warehouse_name,i))==null?void 0:s.id)||""},_t=(e,i=ae,s=Q,n=R)=>{const l=yt(e,s),d=de(n);return i.filter(a=>!d||`${a.client_id??""}`!=`${d}`?!1:l&&`${a.warehouse_id}`==`${l}`?!0:_(a.warehouse_name)===_(e.warehouse_name))},jt=(e,i=ae,s=Q,n=R)=>{const l=_t(e,i,s,n),d=De(e),a=d.length?l.filter(c=>d.includes(`${c.id}`)):[];return a.length?a:(Array.isArray(e.location_labels)&&e.location_labels.length?e.location_labels:Vt(e.location_label)).map(c=>l.find(p=>_(M(p))===_(c))).filter(Boolean)},os=(e=[],i=Q,s=ae,n=R)=>{const l=Te(i);return e.forEach(d=>{var h,A;const a=Ws(d.description??""),g=l.findIndex(B=>_(B.warehouse_name)===_(a.warehouse_name));if(g<0)return;const c={...l[g],enabled:!0,warehouse_id:((h=vt(l[g].warehouse_name,i))==null?void 0:h.id)??l[g].warehouse_id,location_label:a.location_label,location_labels:a.location_labels,start_date:a.start_date,months:a.months||"",end_date:a.end_date||Ze(a.start_date,a.months),billing_dates:Gt(a.start_date,a.months),quantity_m3:a.quantity_m3||Number(d.quantity||0)||"",tariff:Number(d.unit_price||0)||"",monthly_amount:Number(d.total||0)||""},p=jt(c,s,i,n);l[g]={...c,location_id:(A=p[0])!=null&&A.id?`${p[0].id}`:"",location_ids:p.map(B=>`${B.id}`)}}),l},J=(e,i)=>{oe(s=>s.map(n=>{if(n.key!==e)return n;const l="location_ids"in i?(Array.isArray(i.location_ids)?i.location_ids:[i.location_ids]).filter(Boolean).map(h=>`${h}`):null,d=de(R),a=ae.filter(h=>d&&`${h.client_id??""}`==`${d}`),g=i.location_id?a.find(h=>`${h.id}`==`${i.location_id}`):null,c=l?a.filter(h=>l.includes(`${h.id}`)):null,p={...n,...i,warehouse_id:yt(n)};if(g&&(p.location_label=M(g)),c&&(p.location_ids=l,p.location_id=l[0]??"",p.location_labels=c.map(M).filter(Boolean),p.location_label=p.location_labels.join(", ")),("start_date"in i||"months"in i)&&(p.end_date=Ze(p.start_date,p.months),p.billing_dates=Gt(p.start_date,p.months)),"quantity_m3"in i||"tariff"in i){const h=pe(p.quantity_m3)*pe(p.tariff);p.monthly_amount=h?h.toFixed(2):""}return p}))},cs=(e,i,s)=>{oe(n=>n.map(l=>l.key!==e?l:{...l,billing_dates:(l.billing_dates??[]).map((d,a)=>a===i?{...d,date:s}:d)}))},ds=(e,i)=>{const s=`${i}`,n=De(e),l=n.includes(s)?n.filter(d=>d!==s):[...n,s];J(e.key,{location_ids:l})},Y=async(e=null)=>{var c,p;ts(!!(e!=null&&e.id)),C.current.value=(e==null?void 0:e.id)??"",S.current.value=(e==null?void 0:e.code)??"Se genera al guardar",q.current.value=Xe(e==null?void 0:e.issue_date)||new Date().toISOString().slice(0,10),Z.current.value=Xe(e==null?void 0:e.scheduled_at),ee.current.value=Xe(e==null?void 0:e.first_due_date),_e((e==null?void 0:e.expected_document_type)??(N?"":"Factura"));const i=(e==null?void 0:e.currency)??(F?"PEN":N?"":"PEN");Ae(i),st((e==null?void 0:e.billing_cycle)??(j?"Unico":"")),ge.current&&(ge.current.value=(e==null?void 0:e.contract_label)??""),rt((e==null?void 0:e.payment_condition)??"Contado"),te.current.value=Number((e==null?void 0:e.installments)??1),lt(e!=null&&e.billing_day?`${e.billing_day}`:""),G.current.value=(e==null?void 0:e.order_status)??(F?"approved":"draft"),U.current.value=(e==null?void 0:e.billing_status)??"pending",se.current.value=Number((e==null?void 0:e.tax_amount)??0),V.current.value=(e==null?void 0:e.observations)??"",at(!!((e==null?void 0:e.detraction_enabled)??((e==null?void 0:e.items)??[]).some(h=>Number(h.detraction_percent||0)>0)));const s=N?He(be):be[0],n=F?s!=null&&s.id?`${s.id}`:O:e!=null&&e.business_id?`${e.business_id}`:O||(s!=null&&s.id?`${s.id}`:"");Ee(n),ye(e!=null&&e.client_id?`${e.client_id}`:"");const l=await ke(n,(e==null?void 0:e.business_branch_id)??W);!(e!=null&&e.business_branch_id)&&!W&&((c=l[0])!=null&&c.id)&&le(`${l[0].id}`);const d=((e==null?void 0:e.items)??[]).map(h=>{var A,B;return{uid:crypto.randomUUID(),service_id:`${h.service_id}`,scope:h.scope??((A=h.service)==null?void 0:A.category)??"",gloss:h.gloss??h.description??((B=h.service)==null?void 0:B.name)??"",description:h.description??"",quantity:Number(h.quantity||0),unit_price:Number(h.unit_price||0),detraction_percent:Number(h.detraction_percent||0),commission_percent:Number(h.commission_percent||0),total:Number(h.total||0)}});tt(((p=d[0])==null?void 0:p.service_id)??"");let a=Q,g=ae;if(T&&(!a.length||!g.length||!gt)){const h=await xt();a=h.warehouseRows,g=h.locationRows}oe(T?os((e==null?void 0:e.items)??[],a,g,e!=null&&e.client_id?`${e.client_id}`:R):Te()),E(d.length?d:F?[]:[me()]),$(f.current).modal("show")},z=(e,i,s)=>{E(n=>n.map(l=>{if(l.uid!==e)return l;const d={...l,[i]:s};if(i==="service_id"){const a=Ge[s];d.scope=d.scope||(a==null?void 0:a.category)||"",d.gloss=d.gloss||(a==null?void 0:a.name)||"",d.description=d.gloss||d.description||(a==null?void 0:a.name)||"",d.unit_price=Number(w==="USD"?a==null?void 0:a.unit_price_usd:a==null?void 0:a.unit_price_pen)||0}return i==="gloss"&&(d.description=s),Ue(d)}))},Nt=e=>{Ae(e||"PEN"),E(i=>i.map(s=>{if(!s.service_id)return s;const n=Ge[s.service_id];return Ue({...s,unit_price:Number(e==="USD"?n==null?void 0:n.unit_price_usd:n==null?void 0:n.unit_price_pen)||0})}))},us=e=>{Pe.current=e,re.current&&(re.current.value=""),fe.current&&(fe.current.value=""),xe.current&&(xe.current.value="0.00"),$(Oe.current).modal("show"),setTimeout(()=>{var i;return(i=re.current)==null?void 0:i.focus()},150)},ms=async e=>{e.preventDefault();const i=re.current.value.trim(),s=fe.current.value.trim(),n=xe.current.value||0;if(!i){k.fire("Formulario incompleto","Ingresa el nombre del servicio general.","warning");return}const l=new Set(ne.map(c=>`${c.id}`));if(!await y.saveStorageGeneralService({name:i,category:"General",service_type:"General",billing_unit:"Servicio",unit_price_pen:n,unit_price_usd:0,observations:s,status:!0}))return;const a=await bt(),g=a.find(c=>!l.has(`${c.id}`)&&_(c.name)===_(i))??[...a].reverse().find(c=>_(c.name)===_(i));g&&Pe.current&&E(c=>c.map(p=>p.uid!==Pe.current?p:Ue({...p,service_id:`${g.id}`,scope:p.scope||g.category||"",gloss:p.gloss||g.name||"",description:p.description||p.gloss||g.name||"",unit_price:Number(w==="USD"?g.unit_price_usd:g.unit_price_pen)||0}))),$(Oe.current).modal("hide")},St=e=>{k.fire({icon:"success",title:"Correcto",text:(e==null?void 0:e.message)||"Orden de servicio guardada correctamente.",timer:1800,showConfirmButton:!1})},Ct=async e=>{const i=y.showSavedMessage;y.showSavedMessage=!1;try{return await y.save(e)}finally{y.showSavedMessage=i}},Ve=async e=>{var p,h,A,B,Dt,qt;if(e.preventDefault(),T){const b=ce(ie,O),we=ce(he,W),Ot=de(R),Qe=et,H=pt.filter(x=>x.enabled),Pt=H.find(x=>!De(x).length||!x.start_date||!x.months||!x.end_date||!x.quantity_m3||!x.tariff);if(!b||!we||!Ot||!P||!w||!Qe){k.fire("Formulario incompleto","Completa empresa, cliente, tipo documento, moneda y tipo de servicio.","warning");return}if(!H.length){k.fire("Formulario incompleto","Selecciona al menos un almacen.","warning");return}if(Pt){k.fire("Formulario incompleto",`Completa los datos de ${Pt.warehouse_name}.`,"warning");return}const Et=H.find(x=>{const Ye=Number.parseInt(x.months,10);return!Array.isArray(x.billing_dates)||x.billing_dates.length!==Ye||x.billing_dates.some(Fe=>!Fe.date)});if(Et){k.fire("Formulario incompleto",`Completa las fechas de facturacion de ${Et.warehouse_name}.`,"warning");return}const At=H.map(x=>x.start_date).filter(Boolean).sort(),ys=Math.max(...H.map(x=>Number(x.months||1))),Je=Ge[Qe],_s={id:C.current.value||void 0,business_id:b||null,business_branch_id:we||null,client_id:Ot||null,expected_document_type:P,currency:w,billing_cycle:(Je==null?void 0:Je.name)??"",payment_condition:"Contado",installments:ys||1,issue_date:q.current.value||new Date().toISOString().slice(0,10),scheduled_at:At[0]??null,first_due_date:At[0]??null,order_status:G.current.value||"draft",billing_status:U.current.value||"pending",tax_amount:0,observations:V.current.value.trim(),items:H.map(x=>{const Ye=jt(x),Fe=pe(x.quantity_m3),zt=pe(x.tariff),js=pe(x.monthly_amount)||Fe*zt;return{service_id:Qe,description:Vs(x,Ye),quantity:Fe,unit_price:zt,detraction_percent:0,commission_percent:0,total:js,billing_dates:(x.billing_dates??[]).map(Ns=>Ns.date)}})},Lt=await Ct(_s);if(!Lt)return;(p=m.current)==null||p.refresh(),$(f.current).modal("hide"),St(Lt);return}const i=F?ce(ie,ft):ce(ie,O);let s=ce(he,W);const n=de(R),l=K.filter(b=>b.service_id).map(b=>({service_id:b.service_id,scope:b.scope,gloss:b.gloss,description:b.gloss||b.description,quantity:b.quantity,unit_price:b.unit_price,detraction_percent:j&&ze?b.detraction_percent||12:b.detraction_percent,commission_percent:b.commission_percent,total:b.total}));if(F){if(i&&!s){const b=await ke(i);s=(h=b[0])!=null&&h.id?`${b[0].id}`:"",s&&le(s)}if(!i||!s||!n||!P||!w){k.fire("Formulario incompleto","Completa empresa, cliente, tipo documento y moneda.","warning");return}if(!l.length){k.fire("Formulario incompleto","Agrega al menos un servicio general.","warning");return}}else if(j){if(!i||!s||!n||!P||!w||!Le){k.fire("Formulario incompleto","Completa cliente, comprobante, moneda y ciclo de facturacion.","warning");return}if(!l.length){k.fire("Formulario incompleto","Agrega al menos un item de servicio.","warning");return}}const d=l.reduce((b,we)=>b+Number(we.total||0),0),a=Number(j?(d*.18).toFixed(2):se.current.value||0),g={id:C.current.value||void 0,business_id:i||null,business_branch_id:s||null,client_id:n||null,contract_label:((Dt=(B=(A=ge.current)==null?void 0:A.value)==null?void 0:B.trim)==null?void 0:Dt.call(B))||null,expected_document_type:P,currency:w,billing_cycle:(Le||"").trim(),payment_condition:it,installments:te.current.value,billing_day:nt||null,detraction_enabled:j?ze:!1,issue_date:q.current.value,scheduled_at:Z.current.value||null,first_due_date:ee.current.value||null,order_status:G.current.value,billing_status:U.current.value,tax_amount:a,observations:V.current.value.trim(),items:l},c=await Ct(g);c&&((qt=m.current)==null||qt.refresh(),$(f.current).modal("hide"),St(c))},$t=async e=>{var l;const i=typeof e=="object"?e==null?void 0:e.id:e;if(!i||(e==null?void 0:e.order_status)==="cancelled"||(e==null?void 0:e.status)===null)return;const{isConfirmed:s}=await k.fire({title:"Anular orden de servicio",text:N?"La orden quedara anulada y se mantendra visible en el historial.":"Se dara de baja la orden de servicio.",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, anular",cancelButtonText:"Cancelar"});!s||!(N?await y.boolean({id:i,field:"order_status",value:"cancelled"}):await y.delete(i))||(l=m.current)==null||l.refresh()},kt=e=>{const i=(e==null?void 0:e.order_status)??"",s=i==="approved"?"bg-soft-success text-success":i==="cancelled"?"bg-soft-danger text-danger":"bg-soft-warning text-warning";return t.jsx("span",{className:`badge ${s}`,children:Gs(i)})},Rt=e=>{const i=(e==null?void 0:e.billing_status)==="billed"||(e==null?void 0:e.order_status)==="invoiced";return t.jsx("span",{className:`badge ${i?"bg-soft-success text-success":"bg-soft-warning text-warning"}`,children:i?"Facturado":"Pendiente"})},wt=e=>t.jsx("a",{className:"admin-grid-edit-link",style:{cursor:"pointer",fontWeight:600},onClick:()=>Y(e),title:"Editar orden de servicio",children:(e==null?void 0:e.code)??"-"}),ps=e=>(e.items??[]).map(i=>{var s;return i.gloss||i.description||((s=i.service)==null?void 0:s.name)}).filter(Boolean).join(" | "),gs=e=>(e==null?void 0:e.billing_status)==="billed"||(e==null?void 0:e.order_status)==="invoiced"?Number((e==null?void 0:e.total)||0):0,hs=e=>{const i=(e==null?void 0:e.order_status)==="cancelled"||(e==null?void 0:e.status)===null;return N?[{icon:"mdi mdi-pencil",title:"Editar orden de servicio",bg:"#e7f2fd",color:"#188ae2",onClick:s=>Y(s)},{icon:"mdi mdi-close",title:"Anular orden de servicio",bg:"#fcebeb",color:"#e24b4a",onClick:s=>$t(s),hidden:i}]:[{icon:"mdi mdi-pencil",title:"Editar orden de servicio",bg:"#e7f2fd",color:"#188ae2",onClick:s=>Y(s)},{icon:"mdi mdi-file-pdf-box",title:"Imprimir PDF",bg:"#eef0f4",color:"#5b69bc",onClick:s=>Ts(Ds.serviceOrder(s))},{icon:"mdi mdi-delete",title:"Anular orden de servicio",bg:"#fcebeb",color:"#e24b4a",onClick:s=>$t(s),hidden:i}]},Ft=e=>e?`${e}`.slice(0,19).replace("T"," "):"",fs=N?[{key:"order_status",label:"Estado",field:"order_status",width:"145px",filter:{type:"select",options:Os},render:kt},{key:"code",label:"Codigo",field:"code",width:"185px",filter:{type:"text"},render:wt},{key:"empresa",label:"Empresa",field:"business.name",width:"210px",filter:{type:"text",field:"business.name"}},{key:"cliente",label:"Cliente",field:"client.full_name",width:"330px",filter:{type:"text",field:"client.full_name"}},{key:"tipo_comprobante",label:"Tipo comprobante",field:"expected_document_type",width:"170px",filter:{type:"text"}},{key:"moneda",label:"Moneda",field:"currency",width:"105px",filter:{type:"select",options:Ie},render:e=>{var i;return((i=Ie.find(s=>s.value===e.currency))==null?void 0:i.label)??e.currency}},{key:"fecha_registro",label:"Fecha registro",field:"created_at",width:"185px",filter:{type:"date"},render:e=>Ft(e.created_at)},{key:"usuario_registro",label:"Usuario registro",field:"creator.fullname",width:"185px",sortable:!1,filter:{type:"text",field:"creator.fullname"},render:e=>Mt(e.creator)}]:[{key:"row_number",label:"#",field:"id",width:"56px",sortable:!1},{key:"billing_status",label:"Estado",field:"billing_status",width:"130px",filter:{type:"select",options:[{value:"pending",label:"Pendiente"},{value:"billed",label:"Facturado"}]},render:Rt},{key:"code",label:"Orden Servicio",field:"code",width:"150px",filter:{type:"text"},render:wt},{key:"billing_cycle",label:"Ciclo Facturación",field:"billing_cycle",width:"155px",filter:{type:"text"}},{key:"doc_cliente",label:"Doc. Cliente",field:"client.document_number",width:"140px",filter:{type:"text",field:"client.document_number"}},{key:"cliente",label:"Cliente",field:"client.full_name",width:"200px",filter:{type:"text",field:"client.full_name"}},{key:"servicios",label:"Servicios",field:"services_text",width:"260px",sortable:!1,render:e=>ps(e)},{key:"total_prefactures",label:"Total Prefacturas",field:"total",width:"150px",align:"right",sortable:!1,render:e=>Number(e.total||0).toFixed(2)},{key:"total",label:"Total Servicio",field:"total",width:"145px",align:"right",filter:{type:"number"},render:e=>Number(e.total||0).toFixed(2)},{key:"total_billed",label:"Total Facturado",field:"total_billed",width:"150px",align:"right",sortable:!1,render:e=>gs(e).toFixed(2)},{key:"contrato",label:"Contrato",field:"contract_label",width:"150px",filter:{type:"text"}},{key:"usuario_registro",label:"Usuario Registro",field:"creator.fullname",width:"150px",sortable:!1,filter:{type:"text",field:"creator.fullname"},render:e=>Mt(e.creator)},{key:"fecha_registro",label:"Fecha Registro",field:"created_at",width:"170px",filter:{type:"date"},render:e=>Ft(e.created_at)}],xs=N?["code","business.name","client.full_name","client.document_number"]:["code","billing_cycle","client.full_name","client.document_number","contract_label"],bs=K.reduce((e,i)=>e+Number(i.total||0),0),We=K.reduce((e,i)=>e+Number(i.total||0),0),Bt=Number((We*.18).toFixed(2)),vs=Number((We+Bt).toFixed(2)),Ke=w==="USD"?"$":"S/",Re=e=>Number(e||0).toFixed(5),It=e=>{y.deleted=e==="deleted",mt({penTotal:0,penBilled:0,usdTotal:0,usdBilled:0}),Yt(e)},Tt=j?t.jsxs("div",{className:"service-order-list-panel",children:[t.jsxs("div",{className:"service-order-tabs",children:[t.jsx("button",{type:"button",className:L==="services"?"active":"",onClick:()=>It("services"),children:"Servicios"}),t.jsx("button",{type:"button",className:L==="deleted"?"active":"",onClick:()=>It("deleted"),children:"OS Eliminadas"})]}),t.jsxs("div",{className:"service-order-filter-panel",children:[t.jsxs("div",{className:"row g-3 align-items-end",children:[t.jsx(v,{label:"Cliente",col:"col-12 col-lg-6",value:je,onChange:ot,options:ve.map(e=>({value:`${e.entity_id??e.id}`,label:`${e.document_number?e.document_number+" - ":""}${e.full_name}`})),placeholder:L==="deleted"?"Seleccione":"Todos"}),t.jsxs("div",{className:"col-12 col-lg-6",children:[t.jsx("label",{className:"form-label",children:"Fecha Registro (Inicio - Fin):"}),t.jsxs("div",{className:"service-order-date-range",children:[t.jsx("input",{type:"date",className:"form-control",value:Ne,onChange:e=>ct(e.target.value)}),t.jsx("input",{type:"date",className:"form-control",value:Se,onChange:e=>dt(e.target.value)})]})]})]}),t.jsxs("div",{className:"service-order-filter-actions",children:[t.jsxs("button",{type:"button",className:"btn service-order-outline-btn",onClick:ns,children:[t.jsx("i",{className:"mdi mdi-filter me-1"})," Filtrar"]}),(je||Ne||Se||Ce)&&t.jsx("button",{type:"button",className:"btn service-order-muted-btn",onClick:ls,children:"Limpiar"})]})]}),L==="services"&&t.jsxs("div",{className:"service-order-list-summary",children:[t.jsxs("div",{children:[t.jsx("span",{children:"Importe Total"}),t.jsxs("strong",{className:"text-success",children:["S/ ",Re($e.penTotal)]}),t.jsxs("strong",{className:"text-success",children:["$ ",Re($e.usdTotal)]})]}),t.jsxs("div",{children:[t.jsx("span",{children:"Total Facturado"}),t.jsxs("strong",{className:"text-warning",children:["S/ ",Re($e.penBilled)]}),t.jsxs("strong",{className:"text-warning",children:["$ ",Re($e.usdBilled)]})]})]})]}):null;return t.jsxs(t.Fragment,{children:[j&&t.jsxs(t.Fragment,{children:[t.jsx("style",{children:`
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
        `}),t.jsxs("div",{className:"service-order-action-row",children:[t.jsxs("button",{type:"button",className:"service-order-action-tile primary",onClick:()=>Y(),children:[t.jsxs("span",{children:[t.jsx("i",{className:"mdi mdi-plus-circle-outline me-1"})," Registrar Orden de Servicio"]}),t.jsx("i",{className:"mdi mdi-calendar-month-outline fs-4"})]}),t.jsxs("button",{type:"button",className:"service-order-action-tile warning",onClick:()=>k.fire("Procesar actividades pendientes","Este proceso quedo listo como acceso del modulo. Falta conectar una regla automatica de actividades cuando se defina el flujo operativo.","info"),children:[t.jsxs("span",{children:[t.jsx("i",{className:"mdi mdi-plus-circle-outline me-1"})," Procesar Actividades Pendientes"]}),t.jsx("i",{className:"mdi mdi-calendar-month-outline fs-4"})]})]})]}),Tt&&t.jsx("div",{className:"card mb-3",children:t.jsx("div",{className:"card-body",children:Tt})}),t.jsx(Bs,{ref:m,rest:y,icon:"mdi mdi-clipboard-text-outline",title:j?"Órdenes de servicio":r,unit:"ordenes",defaultPageSize:25,baseFilter:j?Ce:null,searchFields:xs,searchPlaceholder:"Buscar por codigo, cliente…",emptyText:"No se encontraron ordenes de servicio.",headerActions:t.jsxs(t.Fragment,{children:[t.jsx("button",{type:"button",className:"vdt-btn-soft vdt-btn-icon",title:"Refrescar",onClick:()=>{var e;return(e=m.current)==null?void 0:e.refresh()},children:t.jsx("i",{className:"mdi mdi-refresh"})}),!j&&t.jsxs("button",{type:"button",className:"vdt-btn-pri",onClick:()=>Y(),children:[t.jsx("i",{className:"mdi mdi-plus"})," Nueva orden"]})]}),actions:hs,columns:fs,renderCard:(e,i)=>{var s,n;return t.jsxs("div",{className:"vdt-card",children:[t.jsxs("div",{className:"d-flex justify-content-between align-items-start",style:{gap:8},children:[t.jsxs("div",{style:{minWidth:0},children:[t.jsx("a",{className:"admin-grid-edit-link fw-semibold",style:{cursor:"pointer"},onClick:()=>Y(e),children:e.code}),t.jsx("div",{children:t.jsx("small",{className:"text-muted",children:(s=e.client)==null?void 0:s.full_name})})]}),N?kt(e):Rt(e)]}),t.jsx("small",{className:"text-muted d-block mt-2",children:N?(n=e.business)==null?void 0:n.name:e.billing_cycle}),t.jsxs("p",{className:"fw-semibold mb-0 mt-2",children:["Total: ",Number(e.total||0).toFixed(2)]}),i&&t.jsx("div",{className:"d-flex mt-3 pt-3",style:{gap:8,borderTop:"1px solid #f1f1f6"},children:i})]})}},j?`service-order-${L}`:`service-order-${o}`),T?t.jsxs(Be,{modalRef:f,title:t.jsxs("span",{className:"storage-service-order-title",children:[t.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-service-order-dialog modal-dialog-scrollable",contentClass:"storage-service-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-service-order-body",hideFooter:!0,onSubmit:Ve,children:[t.jsx("style",{children:`
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
        `}),t.jsx("input",{ref:C,hidden:!0}),t.jsx("input",{ref:S,hidden:!0}),t.jsx("input",{ref:q,type:"date",hidden:!0}),t.jsx("input",{ref:Z,type:"date",hidden:!0}),t.jsx("input",{ref:ee,type:"date",hidden:!0}),t.jsx("input",{ref:te,type:"number",hidden:!0}),t.jsx("input",{ref:G,hidden:!0}),t.jsx("input",{ref:U,hidden:!0}),t.jsx("input",{ref:se,type:"number",hidden:!0}),t.jsx("textarea",{ref:V,hidden:!0}),t.jsxs("div",{className:"storage-service-order-actions",children:[t.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[t.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]}),t.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[t.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),t.jsx("h3",{className:"storage-service-order-heading",children:"Orden de servicio N°"}),t.jsxs("div",{className:"row g-4 align-items-end",children:[t.jsx(v,{label:"Empresa",col:"col-12 col-md-6 col-xl",required:!0,value:O,onChange:async e=>{var s;Ee(e);const i=await ke(e);le((s=i[0])!=null&&s.id?`${i[0].id}`:"")},options:be.map(e=>({value:`${e.id}`,label:e.name})),placeholder:"Seleccione"}),t.jsx(v,{label:"Cliente",col:"col-12 col-md-6 col-xl-4",required:!0,value:R,onChange:e=>{ye(e),T&&(Me(""),oe(i=>i.map(s=>({...s,location_id:"",location_ids:[],location_label:"",location_labels:[]}))))},options:ve.map(e=>({value:`${e.entity_id??e.id}`,label:`${e.document_number?e.document_number+" | ":""}${e.full_name}`})),placeholder:"Seleccione"}),t.jsx(v,{label:"Tipo documento",col:"col-12 col-md-4 col-xl",required:!0,value:P,onChange:_e,options:[{value:"Factura",label:"Factura"},{value:"Boleta",label:"Boleta"},{value:"Nota de pedido",label:"Nota de pedido"}],placeholder:"Seleccione"}),t.jsx(v,{label:"Moneda",col:"col-12 col-md-4 col-xl",required:!0,value:w,onChange:Ae,options:Ie,placeholder:"Seleccione"}),t.jsx(v,{label:"Tipo de servicio",col:"col-12 col-md-4 col-xl",required:!0,value:et,onChange:tt,options:ss.map(e=>({value:`${e.id}`,label:e.name})),placeholder:"Seleccione"})]}),t.jsx("div",{className:"storage-service-order-separator"}),t.jsx("div",{className:"row g-3",children:pt.map(e=>{const i=_t(e),s=T&&!gt,n=!de(R),l=!e.enabled||s||n,d=De(e),a=i.filter(c=>d.includes(`${c.id}`)),g=es===e.key;return t.jsx("div",{className:"col-12 col-lg-4",children:t.jsxs("div",{className:"storage-service-card",children:[t.jsxs("div",{className:"storage-service-card-header",children:[t.jsx("input",{type:"checkbox",className:"form-check-input storage-order-checkbox",checked:e.enabled,onChange:c=>{J(e.key,{enabled:c.target.checked}),c.target.checked||Me("")}}),t.jsx("p",{className:"storage-service-card-title",children:e.warehouse_name})]}),t.jsxs("div",{className:"storage-service-card-body",children:[t.jsxs("div",{className:"mb-3",children:[t.jsx("label",{className:"form-label",children:"Ubicación"}),t.jsxs("div",{className:"storage-location-picker",children:[t.jsxs("button",{type:"button",className:"storage-location-picker-toggle",disabled:l,onClick:()=>Me(c=>c===e.key?"":e.key),children:[t.jsxs("span",{className:"storage-location-picker-values",children:[s&&t.jsx("span",{className:"storage-location-picker-placeholder",children:"Cargando ubicaciones..."}),!s&&!a.length&&t.jsx("span",{className:"storage-location-picker-placeholder",children:n?"Seleccione cliente primero":i.length?"Seleccione ubicaciones":"Sin ubicaciones"}),a.map(c=>t.jsx("span",{className:"storage-location-chip",children:M(c)},`storage-order-location-chip-${e.key}-${c.id}`))]}),t.jsx("i",{className:"mdi mdi-chevron-down"})]}),g&&!l&&t.jsxs("div",{className:"storage-location-picker-menu",children:[!i.length&&t.jsx("div",{className:"storage-location-empty",children:"Sin ubicaciones"}),i.map(c=>{const p=`${c.id}`;return t.jsxs("label",{className:"storage-location-option",children:[t.jsx("input",{type:"checkbox",checked:d.includes(p),onChange:()=>ds(e,p)}),t.jsx("span",{children:M(c)})]},`storage-order-location-${e.key}-${c.id}`)})]})]})]}),t.jsxs("div",{className:"row g-3 mb-3",children:[t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Fecha de inicio"}),t.jsx("input",{type:"date",className:"form-control",value:e.start_date,disabled:l,onChange:c=>J(e.key,{start_date:c.target.value}),required:e.enabled})]}),t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Nro de meses"}),t.jsx("input",{type:"number",min:"1",className:"form-control",value:e.months,disabled:l,onChange:c=>J(e.key,{months:c.target.value}),required:e.enabled})]}),t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Fecha fin"}),t.jsx("input",{type:"date",className:"form-control",value:e.end_date,disabled:!0})]})]}),t.jsxs("div",{className:"row g-3",children:[t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Cantidad de m3"}),t.jsx("input",{type:"number",min:"0",step:"0.001",className:"form-control",value:e.quantity_m3,disabled:l,onChange:c=>J(e.key,{quantity_m3:c.target.value}),required:e.enabled})]}),t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Tarifa"}),t.jsx("input",{type:"number",min:"0",step:"0.01",className:"form-control",value:e.tariff,disabled:l,onChange:c=>J(e.key,{tariff:c.target.value}),required:e.enabled})]}),t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Importe mensual"}),t.jsx("input",{type:"number",className:"form-control",value:e.monthly_amount,disabled:!0})]})]}),e.enabled&&(e.billing_dates??[]).length>0&&t.jsx("div",{className:"storage-billing-schedule",children:t.jsxs("table",{children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{children:"N° mes"}),t.jsx("th",{children:"Fecha facturación"})]})}),t.jsx("tbody",{children:e.billing_dates.map((c,p)=>t.jsxs("tr",{children:[t.jsx("td",{children:c.month}),t.jsx("td",{children:t.jsx("input",{type:"date",className:"form-control",value:c.date,onChange:h=>cs(e.key,p,h.target.value),required:e.enabled})})]},`storage-order-billing-${e.key}-${c.month}`))})]})})]})]})},`storage-order-block-${e.key}`)})})]}):F?t.jsxs(Be,{modalRef:f,title:ht?"Editar orden de servicio general":"Registrar orden de servicio general",size:"xl",dialogClass:"modal-dialog-scrollable",bodyClass:"storage-general-order-body",btnCancelText:"Cerrar",btnSubmitText:"Guardar",onSubmit:Ve,children:[t.jsx("style",{children:`
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
        `}),t.jsx("input",{ref:C,hidden:!0}),t.jsx("input",{ref:S,hidden:!0}),t.jsx("input",{ref:q,type:"date",hidden:!0}),t.jsx("input",{ref:Z,type:"date",hidden:!0}),t.jsx("input",{ref:ee,type:"date",hidden:!0}),t.jsx("input",{ref:te,type:"number",hidden:!0}),t.jsx("input",{ref:G,hidden:!0}),t.jsx("input",{ref:U,hidden:!0}),t.jsx("input",{ref:se,type:"number",hidden:!0}),t.jsx("textarea",{ref:V,hidden:!0}),t.jsx("input",{ref:ie,type:"hidden",value:ft,readOnly:!0}),t.jsx("input",{ref:he,type:"hidden",value:W,readOnly:!0}),t.jsxs("div",{className:"row g-3",children:[t.jsx("div",{className:"col-12",children:t.jsx("h5",{className:"storage-general-section-title",children:"Datos de la orden"})}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Empresa"}),t.jsx("input",{className:"form-control bg-light",value:is,disabled:!0,readOnly:!0})]}),t.jsx(v,{label:"Cliente",col:"col-12 col-md-6 col-xl-5",required:!0,value:R,onChange:ye,options:ve.map(e=>({value:`${e.entity_id??e.id}`,label:`${e.document_number?e.document_number+" | ":""}${e.full_name}`})),placeholder:"Seleccione"}),t.jsx(v,{label:"Tipo documento",col:"col-12 col-md-6 col-xl-2",required:!0,value:P,onChange:_e,options:[{value:"Factura",label:"Factura"},{value:"Boleta",label:"Boleta"},{value:"Nota de pedido",label:"Nota de pedido"}],placeholder:"Seleccione"}),t.jsx(v,{label:"Moneda",col:"col-12 col-md-6 col-xl-2",required:!0,value:w,onChange:Nt,options:Ie,placeholder:"Seleccione"})]}),t.jsx("hr",{className:"my-4"}),t.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[t.jsx("h5",{className:"storage-general-section-title",children:"Detalle de servicios"}),t.jsxs("button",{type:"button",className:"btn btn-sm btn-primary",onClick:()=>E(e=>[...e,me()]),children:[t.jsx("i",{className:"mdi mdi-plus me-1"})," Agregar item"]})]}),t.jsx("div",{className:"storage-general-lines-wrap",children:t.jsxs("table",{className:"table table-sm table-bordered align-middle storage-general-lines mb-0",children:[t.jsx("thead",{className:"table-light",children:t.jsxs("tr",{children:[t.jsx("th",{style:{width:48},children:"#"}),t.jsx("th",{children:"Servicio"}),t.jsx("th",{style:{width:115},children:"Tarifa"}),t.jsx("th",{style:{width:115},children:"Cantidad"}),t.jsx("th",{style:{width:130},children:"Total"}),t.jsx("th",{style:{width:42}})]})}),t.jsxs("tbody",{children:[K.length===0&&t.jsx("tr",{children:t.jsx("td",{colSpan:"6",className:"text-center text-muted py-4",children:"Agrega al menos un servicio."})}),K.map((e,i)=>t.jsxs("tr",{children:[t.jsx("td",{children:i+1}),t.jsx("td",{children:t.jsxs("div",{className:"storage-general-service-selector",children:[t.jsx(v,{noMargin:!0,required:!0,value:e.service_id,onChange:s=>z(e.uid,"service_id",s),options:ne.map(s=>({value:`${s.id}`,label:s.name})),placeholder:"Seleccione servicio"}),t.jsx("button",{type:"button",className:"btn btn-outline-primary storage-general-service-add",title:"Agregar servicio general",onClick:()=>us(e.uid),children:t.jsx("i",{className:"mdi mdi-plus"})})]})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",className:"form-control text-end",value:e.unit_price,onChange:s=>z(e.uid,"unit_price",s.target.value)})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.001",min:"0",className:"form-control text-end",value:e.quantity,onChange:s=>z(e.uid,"quantity",s.target.value)})}),t.jsx("td",{children:t.jsx("input",{className:"form-control text-end",value:Number(e.total||0).toFixed(2),disabled:!0})}),t.jsx("td",{children:t.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>E(s=>s.filter(n=>n.uid!==e.uid)),children:t.jsx("i",{className:"mdi mdi-close"})})})]},`general-order-item-${e.uid}`))]})]})}),t.jsxs("div",{className:"storage-general-total-row mt-3",children:[t.jsx("label",{className:"storage-general-total-label form-label d-block mb-1",children:"Total"}),t.jsx("input",{className:"form-control text-end",value:bs.toFixed(2),disabled:!0})]})]}):t.jsxs(Be,{modalRef:f,title:ht?"Editar orden de servicio":"Registrar orden de servicio",size:"xl",bodyClass:"service-order-form-modal-body",btnCancelText:"Cerrar",btnSubmitText:"Guardar",onSubmit:Ve,children:[t.jsx("style",{children:`
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
      `}),t.jsx("input",{ref:C,hidden:!0}),t.jsx("input",{ref:S,hidden:!0,readOnly:!0}),t.jsx("input",{ref:ie,type:"hidden",value:O,readOnly:!0}),t.jsx("input",{ref:he,type:"hidden",value:W,readOnly:!0}),t.jsx("input",{ref:q,type:"hidden"}),t.jsx("input",{ref:Z,type:"hidden"}),t.jsx("input",{ref:ee,type:"hidden"}),t.jsx("input",{ref:te,type:"hidden",defaultValue:"1"}),t.jsx("input",{ref:G,type:"hidden",defaultValue:"draft"}),t.jsx("input",{ref:U,type:"hidden",defaultValue:"pending"}),t.jsx("input",{ref:se,type:"hidden"}),t.jsx("textarea",{ref:V,hidden:!0}),t.jsxs("div",{className:"row g-3",children:[t.jsx("div",{className:"col-12",children:t.jsx("h5",{className:"service-order-form-section-title",children:"Datos de la orden"})}),t.jsx(v,{label:"Cliente",col:"col-12 col-lg-6",required:!0,value:R,onChange:ye,options:ve.map(e=>({value:`${e.entity_id??e.id}`,label:`${e.document_number?e.document_number+" - ":""}${e.display_name??e.full_name}`})),placeholder:"Seleccione"}),t.jsxs("div",{className:"col-12 col-lg-3",children:[t.jsx("label",{className:"form-label",children:"Contrato"}),t.jsx("input",{ref:ge,className:"form-control",placeholder:"Seleccionar"})]}),t.jsx(v,{label:"Ciclo de facturación",col:"col-12 col-lg-3",required:!0,value:Le,onChange:st,options:[{value:"Unico",label:"Unico"},{value:"Mensual",label:"Mensual"},{value:"Eventual",label:"Eventual"}]}),t.jsx(v,{label:"Moneda",col:"col-12 col-md-6 col-lg-3",required:!0,value:w,onChange:Nt,options:[{value:"PEN",label:"S/ | Soles"},{value:"USD",label:"$ | Dolares"}]}),t.jsx(v,{label:"Comprobante",col:"col-12 col-md-6 col-lg-3",required:!0,value:P,onChange:_e,options:[{value:"Factura",label:"Factura"},{value:"Boleta",label:"Boleta"},{value:"Nota de pedido",label:"Nota de pedido"}],placeholder:"Seleccione"})]}),t.jsx("hr",{className:"my-4"}),t.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[t.jsx("h5",{className:"service-order-form-section-title",children:"Detalle de servicios"}),t.jsxs("button",{type:"button",className:"btn btn-sm btn-primary",onClick:()=>E(e=>[...e,me()]),children:[t.jsx("i",{className:"mdi mdi-plus me-1"})," Agregar item"]})]}),t.jsx("div",{className:"service-order-items-wrapper",children:t.jsxs("table",{className:"table table-sm table-bordered align-middle service-order-items-table mb-0",children:[t.jsx("thead",{className:"table-light",children:t.jsxs("tr",{children:[t.jsx("th",{style:{width:48},children:"#"}),t.jsx("th",{children:"Servicio"}),t.jsx("th",{style:{width:170},children:"Alcance"}),t.jsx("th",{children:"Glosa"}),t.jsxs("th",{style:{width:135},children:["P. Unit.",t.jsx("br",{}),"(Sin IGV)"]}),t.jsx("th",{style:{width:130},children:"Subtotal"}),t.jsx("th",{style:{width:42}})]})}),t.jsx("tbody",{children:K.map((e,i)=>t.jsxs("tr",{children:[t.jsx("td",{children:i+1}),t.jsx("td",{children:t.jsx(v,{noMargin:!0,required:!0,value:e.service_id,onChange:s=>z(e.uid,"service_id",s),options:ne.map(s=>({value:`${s.id}`,label:`${s.code?s.code+" - ":""}${s.name}`})),placeholder:"Seleccione servicio"})}),t.jsx("td",{children:t.jsx("input",{className:"form-control",value:e.scope,onChange:s=>z(e.uid,"scope",s.target.value)})}),t.jsx("td",{children:t.jsx("input",{className:"form-control",value:e.gloss,onChange:s=>z(e.uid,"gloss",s.target.value)})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control text-end",value:e.unit_price,onChange:s=>z(e.uid,"unit_price",s.target.value)})}),t.jsx("td",{children:t.jsx("input",{className:"form-control text-end",value:Number(e.total||0).toFixed(2),disabled:!0})}),t.jsx("td",{children:t.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>E(s=>s.length===1?[me()]:s.filter(n=>n.uid!==e.uid)),children:t.jsx("i",{className:"mdi mdi-close"})})})]},`service-order-item-row-${e.uid}`))})]})}),t.jsxs("div",{className:"service-order-summary mt-3",children:[t.jsxs("div",{className:"service-order-summary-row",children:[t.jsxs("span",{className:"service-order-summary-label",children:["Gravadas: ",Ke]}),t.jsx("input",{className:"form-control text-end",value:We.toFixed(2),disabled:!0})]}),t.jsxs("div",{className:"service-order-summary-row",children:[t.jsxs("span",{className:"service-order-summary-label",children:["I.G.V.: ",Ke]}),t.jsx("input",{className:"form-control text-end",value:Bt.toFixed(2),disabled:!0})]}),t.jsxs("div",{className:"service-order-summary-row",children:[t.jsxs("span",{className:"service-order-summary-label",children:["Total: ",Ke]}),t.jsx("input",{className:"form-control text-end",value:vs.toFixed(2),disabled:!0})]})]}),t.jsx("hr",{className:"my-4"}),t.jsxs("div",{className:"row g-3 align-items-end",children:[t.jsxs("div",{className:"col-12 col-lg-4",children:[t.jsx("label",{className:"form-label d-block",children:"Detracción"}),t.jsx("div",{className:"form-check form-switch service-order-detraction-options",children:t.jsx("input",{className:"form-check-input",id:"service-order-detraction-enabled",type:"checkbox",checked:ze,onChange:e=>at(e.target.checked)})})]}),t.jsx(v,{label:"Forma de pago",col:"col-12 col-lg-6",value:it,onChange:rt,options:[{value:"Contado",label:"Contado"},{value:"Credito",label:"Credito"}]}),t.jsx(v,{label:"Día facturación",col:"col-12 col-lg-2",value:nt,onChange:lt,options:Array.from({length:31},(e,i)=>i+1).map(e=>({value:`${e}`,label:`${e}`})),placeholder:"Seleccionar"})]})]}),F&&t.jsx(Be,{modalRef:Oe,title:"Agregar servicio general",size:"md",btnCancelText:"Cerrar",btnSubmitText:"Guardar",zIndex:1070,onSubmit:ms,children:t.jsxs("div",{className:"row g-3",children:[t.jsxs("div",{className:"col-12",children:[t.jsx("label",{className:"form-label",children:"Nombre"}),t.jsx("input",{ref:re,className:"form-control",required:!0})]}),t.jsxs("div",{className:"col-12",children:[t.jsx("label",{className:"form-label",children:"Descripcion"}),t.jsx("input",{ref:fe,className:"form-control"})]}),t.jsxs("div",{className:"col-12",children:[t.jsx("label",{className:"form-label",children:"Tarifa"}),t.jsx("input",{ref:xe,type:"number",min:"0",step:"0.01",className:"form-control",defaultValue:"0.00"})]})]})})]})};Rs((r,o)=>{const m=o.requiredPermission??"services-service-order";!o.can(m)&&!o.hasRole("Admin")&&(location.href="/admin/"),ws(r).render(t.jsx(Fs,{...o,title:o.moduleTitle??"Ordenes de servicio",children:t.jsx(Ks,{...o})}))});
