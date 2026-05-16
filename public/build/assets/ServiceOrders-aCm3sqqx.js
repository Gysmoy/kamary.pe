var rs=Object.defineProperty;var is=(i,c,u)=>c in i?rs(i,c,{enumerable:!0,configurable:!0,writable:!0,value:u}):i[c]=u;var w=(i,c,u)=>is(i,typeof c!="symbol"?c+"":c,u);import{m as ns,t as as,C as os,c as ls,j as e,r as d,S as F}from"./CreateReactScript-DzmYTmbr.js";import{B as cs}from"./Base-BFIC9n1T.js";import{T as ds,t as Le,E as us,q as ms}from"./Table-CO65K1hT.js";import{M as Ae}from"./Modal-DGAB1eIb.js";import{D as Me}from"./DxButton-CsjWvhyj.js";import{B as ps}from"./BasicRest-DlKnEI0V.js";import{a as H}from"./permissionScope-etO_1UXy.js";import{r as vt}from"./renderGridEditLink-D8NGEeKJ.js";import{o as gs,b as xs}from"./magistralesRecordPdf-u2rK0s4i.js";const oe=async(i,c={})=>{try{const{status:u,result:g}=await ns.Fetch(i,{method:"POST",body:JSON.stringify({take:1e3,skip:0,isLoadingAll:!0,...c})});if(!u)throw new Error((g==null?void 0:g.message)||"No se pudo cargar la lista");return(g==null?void 0:g.data)??[]}catch(u){return as.error("Error",{description:u.message,duration:3e3,richColors:!0}),[]}},hs=()=>location.pathname.includes("/admin/storage-general-service-orders"),fs=()=>location.pathname.includes("/admin/storage-service-orders");class bs extends ps{constructor(){super(...arguments);w(this,"path",H()?hs()?"admin/storage/general-service-orders":"admin/storage/service-orders":"admin/service-orders");w(this,"deleted",!1);w(this,"getBranchesByBusiness",async u=>u?await this.simpleGet(`/api/${this.path}/businesses/${u}/branches`)??[]:[]);w(this,"getBusinesses",async()=>await oe("/api/admin/businesses/paginate"));w(this,"getClients",async()=>await oe(H()?"/api/admin/storage/clients/paginate":"/api/admin/services-client/paginate"));w(this,"getServices",async()=>await oe(H()?"/api/admin/storage/general-service/paginate":"/api/admin/services/paginate",fs()?{storage_service_types:!0}:{}));w(this,"getStorageOptions",async()=>H()?await this.simpleGet("/api/admin/storage/kardex/options"):null);w(this,"getStorageWarehouses",async()=>H()?await oe("/api/admin/storage/kardex/paginate",{section:"warehouses",sort:[{selector:"warehouse_name",desc:!1}]}):[]);w(this,"getStorageLocations",async()=>H()?await oe("/api/admin/storage/kardex/paginate",{section:"locations"}):[])}async paginate(u){return await super.paginate({...u,deleted:this.deleted})}}const _=new bs,jt=i=>(i==null?void 0:i.fullname)||[i==null?void 0:i.name,i==null?void 0:i.lastname].filter(Boolean).join(" ")||(i==null?void 0:i.username)||"",le=()=>({uid:crypto.randomUUID(),service_id:"",scope:"",gloss:"",description:"",quantity:1,unit_price:0,detraction_percent:0,commission_percent:0,total:0}),N=(i="")=>i.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""),vs=["Servicio de almacenamiento","Servicio de almacenamiento - Adicional"],js=[{value:"PEN",label:"Soles"},{value:"USD",label:"Dolares"}],_t=i=>(i==null?void 0:i.name)??(i==null?void 0:i.warehouse_name)??"",ys=i=>(i==null?void 0:i.id)??(i==null?void 0:i.warehouse_id)??"",_s=i=>i==="approved"?"Aprobado":ms(i),Ns=i=>{const c=ys(i),u=_t(i);return{key:c?`warehouse-${c}`:N(u),warehouse_name:u,warehouse_id:c?`${c}`:"",enabled:!1,location_id:"",location_ids:[],location_label:"",location_labels:[],start_date:"",months:"",end_date:"",billing_dates:[],quantity_m3:"",tariff:"",monthly_amount:""}},$e=(i=[])=>i.filter(c=>(c==null?void 0:c.status)!==null).map(Ns),Ge=i=>{var c,u,g;return((g=(c=i==null?void 0:i.toString)==null?void 0:(u=c.call(i)).slice)==null?void 0:g.call(u,0,10))??""},ce=i=>Number(i||0),Ue=(i,c,u=!1)=>{if(!i)return"";const g=Number(c);if(!Number.isFinite(g)||g<0||!u&&g<=0)return"";const j=new Date(`${i}T00:00:00`);if(Number.isNaN(j.getTime()))return"";const b=new Date(j),I=b.getDate();return b.setDate(1),b.setMonth(b.getMonth()+g),b.setDate(Math.min(I,new Date(b.getFullYear(),b.getMonth()+1,0).getDate())),b.toISOString().slice(0,10)},yt=(i,c)=>{const u=Number.parseInt(c,10);return!i||!Number.isFinite(u)||u<=0?[]:Array.from({length:u},(g,j)=>({month:j+1,date:Ue(i,j,!0)}))},O=i=>i?[i.code,i.temperature_range].filter(Boolean).join(" | "):"",Nt=(i="")=>i.split(",").map(c=>c.trim()).filter(Boolean),Be=i=>Array.isArray(i.location_ids)?i.location_ids.filter(Boolean).map(c=>`${c}`):i.location_id?[`${i.location_id}`]:[],Ss=(i,c)=>[i.warehouse_name,(Array.isArray(c)?c.map(O).filter(Boolean).join(", "):O(c))||i.location_label,`${i.start_date||""} - ${i.end_date||""}`,`${i.months||0} meses`,`${i.quantity_m3||0} m3`].filter(Boolean).join("; "),Cs=(i="")=>{const c=i.split(";").map(g=>g.trim()),u=(c[2]??"").split("-").map(g=>g.trim());return{warehouse_name:c[0]??"",location_label:c[1]??"",location_labels:Nt(c[1]??""),start_date:u.length>=3?`${u[0]}-${u[1]}-${u[2]}`.slice(0,10):"",end_date:u.length>=6?`${u[3]}-${u[4]}-${u[5]}`.slice(0,10):"",months:parseFloat(c[3])||"",quantity_m3:parseFloat(c[4])||""}},ws=({moduleTitle:i="Ordenes de servicio",serviceOrderType:c="service"})=>{const u=d.useRef(),g=d.useRef(),j=d.useRef(),b=d.useRef(),I=d.useRef(),K=d.useRef(),J=d.useRef(),R=d.useRef(),S=d.useRef(),q=d.useRef(),de=d.useRef(),Y=d.useRef(),Q=d.useRef(),ue=d.useRef(),z=d.useRef(),P=d.useRef(),X=d.useRef(),L=d.useRef(),Ie=d.useRef(null),Z=d.useRef(),me=d.useRef(),ee=d.useRef(),Ve=d.useRef(),[pe,St]=d.useState([]),[Fs,Ct]=d.useState([]),[ge,wt]=d.useState([]),[xe,Ft]=d.useState([]),[A,he]=d.useState(""),[M,te]=d.useState(""),[se,fe]=d.useState(""),[We,He]=d.useState(""),[Rt,Ke]=d.useState("PEN"),[be,De]=d.useState(!1),[ve,Je]=d.useState("services"),[je,Ye]=d.useState(""),[ye,Qe]=d.useState(""),[_e,Xe]=d.useState(""),[Ze,et]=d.useState(null),[Ne,$t]=d.useState({penTotal:0,penBilled:0,usdTotal:0,usdBilled:0}),[re,k]=d.useState([le()]),[G,Bt]=d.useState([]),[U,It]=d.useState([]),[tt,Se]=d.useState(()=>$e()),[st,Dt]=d.useState(!1),[kt,rt]=d.useState(""),[Rs,Tt]=d.useState(!1),ie=c==="storage_general",C=c==="storage_service",D=ie||C,y=!D,Et=xe.filter(t=>vs.some(s=>N(s)===N(t.name))),ke=Object.fromEntries(xe.map(t=>[`${t.id}`,t])),it=async()=>{if(!C)return{warehouseRows:[],locationRows:[]};Ie.current||(Ie.current=(async()=>{const r=await _.getStorageOptions();let a=((r==null?void 0:r.warehouses)??[]).filter(l=>l.status!==null),o=((r==null?void 0:r.locations)??[]).filter(l=>l.status!==null);if(!a.length||!o.length){const[l,m]=await Promise.all([o.length?Promise.resolve(o):_.getStorageLocations(),a.length?Promise.resolve(a):_.getStorageWarehouses()]);a=(a.length?a:m??[]).filter(n=>n.status!==null),o=(o.length?o:l??[]).filter(n=>n.status!==null)}return{warehouseRows:a,locationRows:o}})());const{warehouseRows:t,locationRows:s}=await Ie.current;return Bt(t),It(s),Dt(!0),{warehouseRows:t,locationRows:s}};d.useEffect(()=>{(async()=>{var n;const s=C?it():Promise.resolve({warehouseRows:[],locationRows:[]}),[r,a,o,l]=await Promise.all([_.getBusinesses(),_.getClients(),_.getServices(),s]),m=r??[];if(St(m),wt((a??[]).filter(p=>p.status!==null)),Ft((o??[]).filter(p=>p.status!==null)),C&&Se($e(l.warehouseRows)),C||y){const p=m[0];if(p){he(`${p.id}`);const v=await Ce(p.id);(n=v[0])!=null&&n.id&&te(`${v[0].id}`)}}})()},[]),d.useEffect(()=>{if(!y)return;_.deleted=ve==="deleted";const t=u.current?$(u.current).dxDataGrid("instance"):null;t&&t.refresh()},[ve]);const Ot=()=>{const t=[];je&&t.push(["client_id","=",Number(je)]),ye&&t.push(["created_at",">=",`${ye} 00:00:00`]),_e&&t.push(["created_at","<=",`${_e} 23:59:59`]),et(t.length?t.reduce((s,r)=>s.length?[...s,"and",r]:r,[]):null)},qt=()=>{Ye(""),Qe(""),Xe(""),et(null)},zt=t=>{const r=((t==null?void 0:t.data)??[]).reduce((a,o)=>{const l=`${o.currency??"PEN"}`.toUpperCase(),m=Number(o.total||0),n=o.billing_status==="billed"||o.order_status==="invoiced"?m:Number(o.paid_amount||0);return l==="USD"?(a.usdTotal+=m,a.usdBilled+=n):(a.penTotal+=m,a.penBilled+=n),a},{penTotal:0,penBilled:0,usdTotal:0,usdBilled:0});$t(r)},Ce=async(t,s="")=>{const a=await _.getBranchesByBusiness(t)??[];return Ct(a),te(s?`${s}`:""),a},nt=t=>({...t,total:Number(t.quantity||0)*Number(t.unit_price||0)}),T=(t,s="")=>{var r;return((r=t.current)==null?void 0:r.value)||s||""},at=(t="")=>{const s=`${t??""}`.trim(),r=s.match(/^client-(\d+)$/i);return r?r[1]:s},ot=(t,s=G)=>s.find(r=>N(_t(r))===N(t)),lt=(t,s=G)=>{var r;return t.warehouse_id||((r=ot(t.warehouse_name,s))==null?void 0:r.id)||""},ct=(t,s=U,r=G)=>{const a=lt(t,r);return s.filter(o=>a&&`${o.warehouse_id}`==`${a}`?!0:N(o.warehouse_name)===N(t.warehouse_name))},dt=(t,s=U,r=G)=>{const a=ct(t,s,r),o=Be(t),l=o.length?a.filter(n=>o.includes(`${n.id}`)):[];return l.length?l:(Array.isArray(t.location_labels)&&t.location_labels.length?t.location_labels:Nt(t.location_label)).map(n=>a.find(p=>N(O(p))===N(n))).filter(Boolean)},Pt=(t=[],s=G,r=U)=>{const a=$e(s);return t.forEach(o=>{var v,x;const l=Cs(o.description??""),m=a.findIndex(B=>N(B.warehouse_name)===N(l.warehouse_name));if(m<0)return;const n={...a[m],enabled:!0,warehouse_id:((v=ot(a[m].warehouse_name,s))==null?void 0:v.id)??a[m].warehouse_id,location_label:l.location_label,location_labels:l.location_labels,start_date:l.start_date,months:l.months||"",end_date:l.end_date||Ue(l.start_date,l.months),billing_dates:yt(l.start_date,l.months),quantity_m3:l.quantity_m3||Number(o.quantity||0)||"",tariff:Number(o.unit_price||0)||"",monthly_amount:Number(o.total||0)||""},p=dt(n,r,s);a[m]={...n,location_id:(x=p[0])!=null&&x.id?`${p[0].id}`:"",location_ids:p.map(B=>`${B.id}`)}}),a},V=(t,s)=>{Se(r=>r.map(a=>{if(a.key!==t)return a;const o="location_ids"in s?(Array.isArray(s.location_ids)?s.location_ids:[s.location_ids]).filter(Boolean).map(p=>`${p}`):null,l=s.location_id?U.find(p=>`${p.id}`==`${s.location_id}`):null,m=o?U.filter(p=>o.includes(`${p.id}`)):null,n={...a,...s,warehouse_id:lt(a)};if(l&&(n.location_label=O(l)),m&&(n.location_ids=o,n.location_id=o[0]??"",n.location_labels=m.map(O).filter(Boolean),n.location_label=n.location_labels.join(", ")),("start_date"in s||"months"in s)&&(n.end_date=Ue(n.start_date,n.months),n.billing_dates=yt(n.start_date,n.months)),"quantity_m3"in s||"tariff"in s){const p=ce(n.quantity_m3)*ce(n.tariff);n.monthly_amount=p?p.toFixed(2):""}return n}))},Lt=(t,s,r)=>{Se(a=>a.map(o=>o.key!==t?o:{...o,billing_dates:(o.billing_dates??[]).map((l,m)=>m===s?{...l,date:r}:l)}))},At=(t,s)=>{const r=`${s}`,a=Be(t),o=a.includes(r)?a.filter(l=>l!==r):[...a,r];V(t.key,{location_ids:o})},ne=async(t=null)=>{var n,p,v;Tt(!!(t!=null&&t.id)),j.current.value=(t==null?void 0:t.id)??"",b.current.value=(t==null?void 0:t.code)??"Se genera al guardar",I.current.value=Ge(t==null?void 0:t.issue_date)||new Date().toISOString().slice(0,10),K.current.value=Ge(t==null?void 0:t.scheduled_at),J.current.value=Ge(t==null?void 0:t.first_due_date),R.current.value=(t==null?void 0:t.expected_document_type)??(D?"":"Factura");const s=(t==null?void 0:t.currency)??(D?"":"PEN");S.current.value=s,Ke(s||"PEN"),q.current.value=(t==null?void 0:t.billing_cycle)??(y?"Unico":""),de.current&&(de.current.value=(t==null?void 0:t.contract_label)??""),Y.current.value=(t==null?void 0:t.payment_condition)??"Contado",Q.current.value=Number((t==null?void 0:t.installments)??1),ue.current&&(ue.current.value=(t==null?void 0:t.billing_day)??""),z.current.value=(t==null?void 0:t.order_status)??(ie?"approved":"draft"),P.current.value=(t==null?void 0:t.billing_status)??"pending",X.current.value=Number((t==null?void 0:t.tax_amount)??0),L.current.value=(t==null?void 0:t.observations)??"",De(!!((t==null?void 0:t.detraction_enabled)??((t==null?void 0:t.items)??[]).some(x=>Number(x.detraction_percent||0)>0)));const r=t!=null&&t.business_id?`${t.business_id}`:A||((n=pe[0])!=null&&n.id?`${pe[0].id}`:"");he(r),fe(t!=null&&t.client_id?`${t.client_id}`:"");const a=await Ce(r,(t==null?void 0:t.business_branch_id)??M);!(t!=null&&t.business_branch_id)&&!M&&((p=a[0])!=null&&p.id)&&te(`${a[0].id}`);const o=((t==null?void 0:t.items)??[]).map(x=>{var B,ae;return{uid:crypto.randomUUID(),service_id:`${x.service_id}`,scope:x.scope??((B=x.service)==null?void 0:B.category)??"",gloss:x.gloss??x.description??((ae=x.service)==null?void 0:ae.name)??"",description:x.description??"",quantity:Number(x.quantity||0),unit_price:Number(x.unit_price||0),detraction_percent:Number(x.detraction_percent||0),commission_percent:Number(x.commission_percent||0),total:Number(x.total||0)}});He(((v=o[0])==null?void 0:v.service_id)??"");let l=G,m=U;if(C&&(!l.length||!m.length||!st)){const x=await it();l=x.warehouseRows,m=x.locationRows}Se(C?Pt((t==null?void 0:t.items)??[],l,m):$e()),k(o.length?o:ie?[]:[le()]),$(g.current).modal("show")},E=(t,s,r)=>{k(a=>a.map(o=>{var m;if(o.uid!==t)return o;const l={...o,[s]:r};if(s==="service_id"){const n=ke[r];l.scope=l.scope||(n==null?void 0:n.category)||"",l.gloss=l.gloss||(n==null?void 0:n.name)||"",l.description=l.gloss||l.description||(n==null?void 0:n.name)||"",l.unit_price=Number(((m=S.current)==null?void 0:m.value)==="USD"?n==null?void 0:n.unit_price_usd:n==null?void 0:n.unit_price_pen)||0}return s==="gloss"&&(l.description=r),nt(l)}))},ut=t=>{Ke(t||"PEN"),k(s=>s.map(r=>{if(!r.service_id)return r;const a=ke[r.service_id];return nt({...r,unit_price:Number(t==="USD"?a==null?void 0:a.unit_price_usd:a==null?void 0:a.unit_price_pen)||0})}))},Te=async t=>{var v,x,B,ae;if(t.preventDefault(),C){const f=T(Z,A),Fe=T(me,M),gt=at(T(ee,se)),qe=T(Ve,We),W=tt.filter(h=>h.enabled),xt=W.find(h=>!Be(h).length||!h.start_date||!h.months||!h.end_date||!h.quantity_m3||!h.tariff);if(!f||!Fe||!gt||!R.current.value||!S.current.value||!qe){F.fire("Formulario incompleto","Completa empresa, cliente, tipo documento, moneda y tipo de servicio.","warning");return}if(!W.length){F.fire("Formulario incompleto","Selecciona al menos un almacen.","warning");return}if(xt){F.fire("Formulario incompleto",`Completa los datos de ${xt.warehouse_name}.`,"warning");return}const ht=W.find(h=>{const Pe=Number.parseInt(h.months,10);return!Array.isArray(h.billing_dates)||h.billing_dates.length!==Pe||h.billing_dates.some(Re=>!Re.date)});if(ht){F.fire("Formulario incompleto",`Completa las fechas de facturacion de ${ht.warehouse_name}.`,"warning");return}const ft=W.map(h=>h.start_date).filter(Boolean).sort(),Zt=Math.max(...W.map(h=>Number(h.months||1))),ze=ke[qe],es={id:j.current.value||void 0,business_id:f||null,business_branch_id:Fe||null,client_id:gt||null,expected_document_type:R.current.value,currency:S.current.value,billing_cycle:(ze==null?void 0:ze.name)??"",payment_condition:"Contado",installments:Zt||1,issue_date:I.current.value||new Date().toISOString().slice(0,10),scheduled_at:ft[0]??null,first_due_date:ft[0]??null,order_status:z.current.value||"draft",billing_status:P.current.value||"pending",tax_amount:0,observations:L.current.value.trim(),items:W.map(h=>{const Pe=dt(h),Re=ce(h.quantity_m3),bt=ce(h.tariff),ts=ce(h.monthly_amount)||Re*bt;return{service_id:qe,description:Ss(h,Pe),quantity:Re,unit_price:bt,detraction_percent:0,commission_percent:0,total:ts,billing_dates:(h.billing_dates??[]).map(ss=>ss.date)}})};if(!await _.save(es))return;$(u.current).dxDataGrid("instance").refresh(),$(g.current).modal("hide");return}const s=T(Z,A),r=T(me,M),a=at(T(ee,se)),o=re.filter(f=>f.service_id).map(f=>({service_id:f.service_id,scope:f.scope,gloss:f.gloss,description:f.gloss||f.description,quantity:f.quantity,unit_price:f.unit_price,detraction_percent:y&&be?f.detraction_percent||12:f.detraction_percent,commission_percent:f.commission_percent,total:f.total}));if(ie){if(!s||!r||!a||!R.current.value||!S.current.value){F.fire("Formulario incompleto","Completa empresa, cliente, tipo documento y moneda.","warning");return}if(!o.length){F.fire("Formulario incompleto","Agrega al menos un servicio general.","warning");return}}else if(y){if(!s||!r||!a||!R.current.value||!S.current.value||!q.current.value){F.fire("Formulario incompleto","Completa cliente, comprobante, moneda y ciclo de facturacion.","warning");return}if(!o.length){F.fire("Formulario incompleto","Agrega al menos un item de servicio.","warning");return}}const l=o.reduce((f,Fe)=>f+Number(Fe.total||0),0),m=Number(y?(l*.18).toFixed(2):X.current.value||0),n={id:j.current.value||void 0,business_id:s||null,business_branch_id:r||null,client_id:a||null,contract_label:((B=(x=(v=de.current)==null?void 0:v.value)==null?void 0:x.trim)==null?void 0:B.call(x))||null,expected_document_type:R.current.value,currency:S.current.value,billing_cycle:q.current.value.trim(),payment_condition:Y.current.value,installments:Q.current.value,billing_day:((ae=ue.current)==null?void 0:ae.value)||null,detraction_enabled:y?be:!1,issue_date:I.current.value,scheduled_at:K.current.value||null,first_due_date:J.current.value||null,order_status:z.current.value,billing_status:P.current.value,tax_amount:m,observations:L.current.value.trim(),items:o};await _.save(n)&&($(u.current).dxDataGrid("instance").refresh(),$(g.current).modal("hide"))},Mt=async t=>{const{isConfirmed:s}=await F.fire({title:"Anular orden de servicio",text:"Se dara de baja la orden de servicio.",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, anular",cancelButtonText:"Cancelar"});!s||!await _.delete(t)||$(u.current).dxDataGrid("instance").refresh()},Gt=(t,{data:s})=>{const r=(s==null?void 0:s.order_status)??"",a=document.createElement("span");a.className=`badge ${r==="approved"?"bg-soft-success text-success":r==="cancelled"?"bg-soft-danger text-danger":"bg-soft-warning text-warning"}`,a.textContent=_s(r),t.append(a)},Ut=(t,{data:s})=>{const r=(s==null?void 0:s.billing_status)==="billed"||(s==null?void 0:s.order_status)==="invoiced",a=document.createElement("span");a.className=`badge ${r?"bg-soft-success text-success":"bg-soft-warning text-warning"}`,a.textContent=r?"Facturado":"Pendiente",t.append(a)},Vt=t=>(t.items??[]).map(s=>{var r;return s.gloss||s.description||((r=s.service)==null?void 0:r.name)}).filter(Boolean).join(" | "),Wt=t=>(t==null?void 0:t.billing_status)==="billed"||(t==null?void 0:t.order_status)==="invoiced"?Number((t==null?void 0:t.total)||0):0,mt={caption:"Acciones",width:D?92:150,allowFiltering:!1,allowExporting:!1,cellTemplate:(t,{data:s})=>{t.css("text-overflow","unset"),t.append(Me({className:D?"btn btn-xs btn-soft-warning":"btn btn-xs btn-soft-primary",title:"Editar orden de servicio",icon:"mdi mdi-pencil",onClick:()=>ne(s)})),D||t.append(Me({className:"btn btn-xs btn-soft-danger ms-1",title:"Imprimir PDF",icon:"mdi mdi-file-pdf-box",onClick:()=>gs(xs.serviceOrder(s))})),t.append(Me({className:"btn btn-xs btn-soft-danger ms-1",title:"Anular orden de servicio",icon:D?"mdi mdi-close":"mdi mdi-delete",onClick:()=>Mt(s.id)}))}},Ht=[{dataField:"row_number",caption:"#",width:56,allowFiltering:!1,calculateCellValue:t=>t.id},mt,{dataField:"billing_status",caption:"Estado",width:130,lookup:Le([{value:"pending",label:"Pendiente"},{value:"billed",label:"Facturado"}]),cellTemplate:Ut},{dataField:"code",caption:"Orden Servicio",width:150,cellTemplate:(t,{data:s})=>vt(t,s==null?void 0:s.code,()=>ne(s),"Editar orden de servicio")},{dataField:"billing_cycle",caption:"Ciclo Facturación",width:155},{dataField:"client.document_number",caption:"Doc. Cliente",width:140},{dataField:"client.full_name",caption:"Cliente",minWidth:200},{dataField:"services_text",caption:"Servicios",minWidth:260,calculateCellValue:Vt},{dataField:"total_prefactures",caption:"Total Prefacturas",width:150,dataType:"number",format:{type:"fixedPoint",precision:2},calculateCellValue:t=>Number(t.total||0)},{dataField:"total",caption:"Total Servicio",width:145,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total_billed",caption:"Total Facturado",width:150,dataType:"number",format:{type:"fixedPoint",precision:2},calculateCellValue:Wt},{dataField:"contract_label",caption:"Contrato",width:150},{dataField:"creator.fullname",caption:"Usuario Registro",minWidth:150,calculateCellValue:t=>jt(t.creator)},{dataField:"created_at",caption:"Fecha Registro",dataType:"datetime",width:170,format:"yyyy-MM-dd HH:mm:ss"}],Kt=[mt,{dataField:"order_status",caption:"Estado",width:115,lookup:Le(us),cellTemplate:Gt},{dataField:"code",caption:"Codigo",width:125,cellTemplate:(t,{data:s})=>vt(t,s==null?void 0:s.code,()=>ne(s),"Editar orden de servicio")},{dataField:"business.name",caption:"Empresa",minWidth:170},{dataField:"client.full_name",caption:"Cliente",minWidth:220},{dataField:"expected_document_type",caption:"Tipo comprobante",width:160},{dataField:"currency",caption:"Moneda",width:105,lookup:Le(js)},{dataField:"created_at",caption:"Fecha registro",dataType:"datetime",width:170,format:"yyyy-MM-dd HH:mm:ss"},{dataField:"creator.fullname",caption:"Usuario registro",minWidth:160,calculateCellValue:t=>jt(t.creator)}],Jt=D?Kt:Ht,Yt=re.reduce((t,s)=>t+Number(s.total||0),0),Ee=re.reduce((t,s)=>t+Number(s.total||0),0),pt=Number((Ee*.18).toFixed(2)),Qt=Number((Ee+pt).toFixed(2)),Oe=Rt==="USD"?"$":"S/",we=t=>Number(t||0).toFixed(5),Xt=y?e.jsxs("div",{className:"service-order-list-panel",children:[e.jsxs("div",{className:"service-order-tabs",children:[e.jsx("button",{type:"button",className:ve==="services"?"active":"",onClick:()=>Je("services"),children:"Servicios"}),e.jsx("button",{type:"button",className:ve==="deleted"?"active":"",onClick:()=>Je("deleted"),children:"OS Eliminadas"})]}),e.jsxs("div",{className:"service-order-filter-panel",children:[e.jsxs("div",{className:"row g-3 align-items-end",children:[e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{className:"form-select",value:je,onChange:t=>Ye(t.target.value),children:[e.jsx("option",{value:"",children:"Todos"}),ge.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} - `:"",t.full_name]},`service-order-filter-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Fecha Registro (Inicio - Fin):"}),e.jsxs("div",{className:"service-order-date-range",children:[e.jsx("input",{type:"date",className:"form-control",value:ye,onChange:t=>Qe(t.target.value)}),e.jsx("input",{type:"date",className:"form-control",value:_e,onChange:t=>Xe(t.target.value)})]})]})]}),e.jsxs("div",{className:"service-order-filter-actions",children:[e.jsxs("button",{type:"button",className:"btn service-order-outline-btn",onClick:Ot,children:[e.jsx("i",{className:"mdi mdi-filter me-1"})," Filtrar"]}),(je||ye||_e||Ze)&&e.jsx("button",{type:"button",className:"btn service-order-muted-btn",onClick:qt,children:"Limpiar"})]})]}),e.jsxs("div",{className:"service-order-summary",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Importe Total"}),e.jsxs("strong",{className:"text-success",children:["S/ ",we(Ne.penTotal)]}),e.jsxs("strong",{className:"text-success",children:["$ ",we(Ne.usdTotal)]})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Total Facturado"}),e.jsxs("strong",{className:"text-warning",children:["S/ ",we(Ne.penBilled)]}),e.jsxs("strong",{className:"text-warning",children:["$ ",we(Ne.usdBilled)]})]})]})]}):i;return e.jsxs(e.Fragment,{children:[y&&e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
          .service-order-summary {
            min-height: 108px;
            border: 1px solid #e6e9ef;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0;
            margin-bottom: 14px;
          }
          .service-order-summary > div {
            min-width: 96px;
            padding: 8px 16px;
            text-align: center;
            border-right: 1px solid #d7dce5;
          }
          .service-order-summary > div:last-child { border-right: 0; }
          .service-order-summary span {
            display: block;
            font-size: 12px;
            margin-bottom: 14px;
          }
          .service-order-summary strong {
            display: block;
            font-size: 13px;
            line-height: 1.8;
            font-weight: 500;
          }
          @media (max-width: 767.98px) {
            .service-order-action-row { grid-template-columns: 1fr; }
            .service-order-date-range { grid-template-columns: 1fr; }
          }
        `}),e.jsxs("div",{className:"service-order-action-row",children:[e.jsxs("button",{type:"button",className:"service-order-action-tile primary",onClick:()=>ne(),children:[e.jsxs("span",{children:[e.jsx("i",{className:"mdi mdi-plus-circle-outline me-1"})," Registrar Orden de Servicio"]}),e.jsx("i",{className:"mdi mdi-calendar-month-outline fs-4"})]}),e.jsxs("button",{type:"button",className:"service-order-action-tile warning",onClick:()=>F.fire("Procesar actividades pendientes","Este proceso quedo listo como acceso del modulo. Falta conectar una regla automatica de actividades cuando se defina el flujo operativo.","info"),children:[e.jsxs("span",{children:[e.jsx("i",{className:"mdi mdi-plus-circle-outline me-1"})," Procesar Actividades Pendientes"]}),e.jsx("i",{className:"mdi mdi-calendar-month-outline fs-4"})]})]})]}),e.jsx(ds,{gridRef:u,title:Xt,rest:_,pageSize:25,filterValue:y?Ze:null,onRefresh:y?zt:void 0,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",onClick:()=>$(u.current).dxDataGrid("instance").refresh()}}),y||t.unshift({widget:"dxButton",location:"after",options:{icon:"add",onClick:()=>ne()}})},columns:Jt}),C?e.jsxs(Ae,{modalRef:g,title:e.jsxs("span",{className:"storage-service-order-title",children:[e.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-service-order-dialog modal-dialog-scrollable",contentClass:"storage-service-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-service-order-body",hideFooter:!0,onSubmit:Te,children:[e.jsx("style",{children:`
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
        `}),e.jsx("input",{ref:j,hidden:!0}),e.jsx("input",{ref:b,hidden:!0}),e.jsx("input",{ref:I,type:"date",hidden:!0}),e.jsx("input",{ref:K,type:"date",hidden:!0}),e.jsx("input",{ref:J,type:"date",hidden:!0}),e.jsx("input",{ref:q,hidden:!0}),e.jsx("input",{ref:Y,hidden:!0}),e.jsx("input",{ref:Q,type:"number",hidden:!0}),e.jsx("input",{ref:z,hidden:!0}),e.jsx("input",{ref:P,hidden:!0}),e.jsx("input",{ref:X,type:"number",hidden:!0}),e.jsx("textarea",{ref:L,hidden:!0}),e.jsxs("div",{className:"storage-service-order-actions",children:[e.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]}),e.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[e.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),e.jsx("h3",{className:"storage-service-order-heading",children:"Orden de servicio N°"}),e.jsxs("div",{className:"row g-4 align-items-end",children:[e.jsxs("div",{className:"col-12 col-md-6 col-xl",children:[e.jsx("label",{className:"form-label",children:"Empresa"}),e.jsxs("select",{ref:Z,className:"form-select",value:A,onChange:async t=>{var r;he(t.target.value);const s=await Ce(t.target.value);te((r=s[0])!=null&&r.id?`${s[0].id}`:"")},required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),pe.map(t=>e.jsx("option",{value:t.id,children:t.name},`storage-order-business-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:ee,className:"form-select",value:se,onChange:t=>fe(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),ge.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} | `:"",t.full_name]},`storage-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Tipo documento"}),e.jsxs("select",{ref:R,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:S,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"PEN",children:"Soles"}),e.jsx("option",{value:"USD",children:"Dolares"})]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Tipo de servicio"}),e.jsxs("select",{ref:Ve,className:"form-select",value:We,onChange:t=>He(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),Et.map(t=>e.jsx("option",{value:t.id,children:t.name},`storage-order-service-${t.id}`))]})]})]}),e.jsx("div",{className:"storage-service-order-separator"}),e.jsx("div",{className:"row g-3",children:tt.map(t=>{const s=ct(t),r=C&&!st,a=!t.enabled||r,o=Be(t),l=s.filter(n=>o.includes(`${n.id}`)),m=kt===t.key;return e.jsx("div",{className:"col-12 col-lg-4",children:e.jsxs("div",{className:"storage-service-card",children:[e.jsxs("div",{className:"storage-service-card-header",children:[e.jsx("input",{type:"checkbox",className:"form-check-input storage-order-checkbox",checked:t.enabled,onChange:n=>{V(t.key,{enabled:n.target.checked}),n.target.checked||rt("")}}),e.jsx("p",{className:"storage-service-card-title",children:t.warehouse_name})]}),e.jsxs("div",{className:"storage-service-card-body",children:[e.jsxs("div",{className:"mb-3",children:[e.jsx("label",{className:"form-label",children:"Ubicación"}),e.jsxs("div",{className:"storage-location-picker",children:[e.jsxs("button",{type:"button",className:"storage-location-picker-toggle",disabled:a,onClick:()=>rt(n=>n===t.key?"":t.key),children:[e.jsxs("span",{className:"storage-location-picker-values",children:[r&&e.jsx("span",{className:"storage-location-picker-placeholder",children:"Cargando ubicaciones..."}),!r&&!l.length&&e.jsx("span",{className:"storage-location-picker-placeholder",children:s.length?"Seleccione ubicaciones":"Sin ubicaciones"}),l.map(n=>e.jsx("span",{className:"storage-location-chip",children:O(n)},`storage-order-location-chip-${t.key}-${n.id}`))]}),e.jsx("i",{className:"mdi mdi-chevron-down"})]}),m&&!a&&e.jsxs("div",{className:"storage-location-picker-menu",children:[!s.length&&e.jsx("div",{className:"storage-location-empty",children:"Sin ubicaciones"}),s.map(n=>{const p=`${n.id}`;return e.jsxs("label",{className:"storage-location-option",children:[e.jsx("input",{type:"checkbox",checked:o.includes(p),onChange:()=>At(t,p)}),e.jsx("span",{children:O(n)})]},`storage-order-location-${t.key}-${n.id}`)})]})]})]}),e.jsxs("div",{className:"row g-3 mb-3",children:[e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Fecha de inicio"}),e.jsx("input",{type:"date",className:"form-control",value:t.start_date,disabled:a,onChange:n=>V(t.key,{start_date:n.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Nro de meses"}),e.jsx("input",{type:"number",min:"1",className:"form-control",value:t.months,disabled:a,onChange:n=>V(t.key,{months:n.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Fecha fin"}),e.jsx("input",{type:"date",className:"form-control",value:t.end_date,disabled:!0})]})]}),e.jsxs("div",{className:"row g-3",children:[e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Cantidad de m3"}),e.jsx("input",{type:"number",min:"0",step:"0.001",className:"form-control",value:t.quantity_m3,disabled:a,onChange:n=>V(t.key,{quantity_m3:n.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Tarifa"}),e.jsx("input",{type:"number",min:"0",step:"0.01",className:"form-control",value:t.tariff,disabled:a,onChange:n=>V(t.key,{tariff:n.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Importe mensual"}),e.jsx("input",{type:"number",className:"form-control",value:t.monthly_amount,disabled:!0})]})]}),t.enabled&&(t.billing_dates??[]).length>0&&e.jsx("div",{className:"storage-billing-schedule",children:e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"N° mes"}),e.jsx("th",{children:"Fecha facturación"})]})}),e.jsx("tbody",{children:t.billing_dates.map((n,p)=>e.jsxs("tr",{children:[e.jsx("td",{children:n.month}),e.jsx("td",{children:e.jsx("input",{type:"date",className:"form-control",value:n.date,onChange:v=>Lt(t.key,p,v.target.value),required:t.enabled})})]},`storage-order-billing-${t.key}-${n.month}`))})]})})]})]})},`storage-order-block-${t.key}`)})})]}):ie?e.jsxs(Ae,{modalRef:g,title:e.jsxs("span",{className:"storage-service-order-title",children:[e.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-general-order-dialog modal-dialog-scrollable",contentClass:"storage-general-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-general-order-body",hideFooter:!0,onSubmit:Te,children:[e.jsx("style",{children:`
          .storage-general-order-dialog {
            width: calc(100vw - 34px);
            max-width: calc(100vw - 34px);
            margin: 7px auto;
            align-items: flex-start;
          }
          .storage-general-order-content {
            border: 0;
            border-radius: 0;
            min-height: auto;
          }
          .storage-general-order-body {
            padding: 0 30px 28px;
            color: #33394a;
          }
          .storage-general-order-actions {
            display: flex;
            justify-content: center;
            gap: 16px;
            padding: 22px 0 14px;
            border-bottom: 1px solid #e9ecef;
          }
          .storage-general-order-actions .btn {
            border-radius: 0;
            font-size: 12px;
            font-weight: 600;
            padding: 6px 16px;
            line-height: 1;
          }
          .storage-general-order-actions .btn-primary-outline {
            color: #11184a;
            background: #fff;
            border: 1px solid #11184a;
          }
          .storage-general-order-actions .btn-muted {
            color: #8f949a;
            background: #f0f0f0;
            border: 1px solid #f0f0f0;
          }
          .storage-general-order-heading {
            text-align: center;
            font-size: 22px;
            font-weight: 600;
            color: #555b66;
            margin: 32px 0 20px;
          }
          .storage-general-order-body .form-label {
            color: #26324d;
            font-size: 12px;
            margin-bottom: 5px;
          }
          .storage-general-order-body .form-control,
          .storage-general-order-body .form-select {
            border-radius: 2px;
            min-height: 26px;
            padding: 3px 10px;
            font-size: 12px;
          }
          .storage-general-insert {
            border-radius: 0;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .storage-general-lines {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          .storage-general-lines th,
          .storage-general-lines td {
            border: 1px solid #e9ecef;
            padding: 8px;
            vertical-align: middle;
          }
          .storage-general-lines th {
            font-size: 11px;
            font-weight: 700;
            color: #26324d;
            text-transform: uppercase;
            background: #fff;
          }
          .storage-general-lines tfoot td {
            background: #fff;
          }
          .storage-general-total-label {
            font-style: italic;
            font-weight: 700;
            text-align: right;
          }
          @media (max-width: 767.98px) {
            .storage-general-order-dialog {
              width: calc(100vw - 12px);
              max-width: calc(100vw - 12px);
            }
            .storage-general-order-body {
              padding: 0 16px 24px;
            }
          }
        `}),e.jsx("input",{ref:j,hidden:!0}),e.jsx("input",{ref:b,hidden:!0}),e.jsx("input",{ref:I,type:"date",hidden:!0}),e.jsx("input",{ref:K,type:"date",hidden:!0}),e.jsx("input",{ref:J,type:"date",hidden:!0}),e.jsx("input",{ref:q,hidden:!0}),e.jsx("input",{ref:Y,hidden:!0}),e.jsx("input",{ref:Q,type:"number",hidden:!0}),e.jsx("input",{ref:z,hidden:!0}),e.jsx("input",{ref:P,hidden:!0}),e.jsx("input",{ref:X,type:"number",hidden:!0}),e.jsx("textarea",{ref:L,hidden:!0}),e.jsx("input",{ref:me,type:"hidden",value:M,readOnly:!0}),e.jsxs("div",{className:"storage-general-order-actions",children:[e.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Guardar"]}),e.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[e.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),e.jsx("h3",{className:"storage-general-order-heading",children:"Orden de servicio N°"}),e.jsxs("div",{className:"row g-4 align-items-end",children:[e.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[e.jsx("label",{className:"form-label",children:"Empresa"}),e.jsxs("select",{ref:Z,className:"form-select",value:A,onChange:async t=>{var r;he(t.target.value);const s=await Ce(t.target.value);te((r=s[0])!=null&&r.id?`${s[0].id}`:"")},required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),pe.map(t=>e.jsx("option",{value:t.id,children:t.name},`general-order-business-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:ee,className:"form-select",value:se,onChange:t=>fe(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),ge.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} | `:"",t.full_name]},`general-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[e.jsx("label",{className:"form-label",children:"Tipo documento"}),e.jsxs("select",{ref:R,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:S,className:"form-select",onChange:t=>ut(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"PEN",children:"Soles"}),e.jsx("option",{value:"USD",children:"Dolares"})]})]})]}),e.jsx("div",{className:"mt-4 mb-3",children:e.jsxs("button",{type:"button",className:"btn btn-outline-primary storage-general-insert",onClick:()=>k(t=>[...t,le()]),children:[e.jsx("i",{className:"mdi mdi-plus-circle me-1"})," Insertar servicio general"]})}),e.jsx("div",{className:"table-responsive",children:e.jsxs("table",{className:"storage-general-lines",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Servicio"}),e.jsx("th",{style:{width:115},children:"Tarifa"}),e.jsx("th",{style:{width:115},children:"Cantidad"}),e.jsx("th",{style:{width:130},children:"Total"}),e.jsx("th",{style:{width:42}})]})}),e.jsx("tbody",{children:re.map(t=>e.jsxs("tr",{children:[e.jsx("td",{children:e.jsxs("select",{className:"form-select",value:t.service_id,onChange:s=>E(t.uid,"service_id",s.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione servicio"}),xe.map(s=>e.jsx("option",{value:s.id,children:s.name},`general-order-service-${s.id}`))]})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.01",className:"form-control",value:t.unit_price,onChange:s=>E(t.uid,"unit_price",s.target.value)})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.001",min:"0",className:"form-control",value:t.quantity,onChange:s=>E(t.uid,"quantity",s.target.value)})}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:Number(t.total||0).toFixed(2),disabled:!0})}),e.jsx("td",{children:e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>k(s=>s.filter(r=>r.uid!==t.uid)),children:e.jsx("i",{className:"mdi mdi-close"})})})]},`general-order-item-${t.uid}`))}),e.jsx("tfoot",{children:e.jsxs("tr",{children:[e.jsx("td",{colSpan:"3",className:"storage-general-total-label",children:"Total"}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:Yt.toFixed(2),disabled:!0})}),e.jsx("td",{})]})})]})})]}):e.jsxs(Ae,{modalRef:g,title:e.jsxs("span",{className:"service-order-modal-title",children:[e.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"service-order-modal-dialog modal-dialog-scrollable",contentClass:"service-order-modal-content",headerClass:"service-order-modal-header",closeButtonClass:"btn-close-white",bodyClass:"service-order-modal-body",hideFooter:!0,onSubmit:Te,children:[e.jsx("style",{children:`
        .service-order-modal-dialog { width: calc(100vw - 28px); max-width: calc(100vw - 28px); margin: 8px auto; align-items: flex-start; }
        .service-order-modal-content { border: 0; border-radius: 0; min-height: calc(100vh - 36px); }
        .service-order-modal-header { background: #202146; color: #fff; min-height: 36px; padding: 7px 14px; border-bottom: 0; }
        .service-order-modal-header .btn-close { transform: scale(.72); opacity: .85; }
        .service-order-modal-title { font-size: 11px; font-weight: 700; }
        .service-order-modal-body { padding: 0 26px 26px; color: #26324d; }
        .service-order-modal-actions { display: flex; justify-content: center; gap: 16px; padding: 22px 0 14px; border-bottom: 1px solid #e9ecef; }
        .service-order-modal-actions .btn { border-radius: 0; font-size: 12px; font-weight: 700; padding: 6px 18px; line-height: 1; }
        .service-order-modal-actions .btn-primary-outline { color: #11184a; background: #fff; border: 1px solid #11184a; }
        .service-order-modal-actions .btn-muted { color: #8f949a; background: #f0f0f0; border: 1px solid #f0f0f0; }
        .service-order-form-title { text-align: center; font-size: 22px; font-weight: 600; color: #555b66; margin: 32px 0 20px; }
        .service-order-modal-body .form-label { color: #26324d; font-size: 12px; margin-bottom: 5px; }
        .service-order-modal-body .form-control, .service-order-modal-body .form-select { border-radius: 0; min-height: 26px; padding: 3px 10px; font-size: 12px; }
        .service-order-modal-body .form-control:disabled, .service-order-modal-body .form-select:disabled { background-color: #f5f5f5; color: #7d8490; }
        .service-order-form-separator { border-top: 1px solid #e9ecef; margin: 28px 0 16px; }
        .service-order-add-item { border: 1px solid #11184a; color: #11184a; background: #fff; border-radius: 0; font-size: 11px; font-weight: 700; padding: 7px 13px; }
        .service-order-items-table { width: 100%; border-collapse: collapse; font-size: 12px; color: #26324d; margin-top: 14px; }
        .service-order-items-table th, .service-order-items-table td { border: 1px solid #e4e8ee; padding: 8px; vertical-align: middle; }
        .service-order-items-table th { font-size: 10px; text-transform: uppercase; font-weight: 700; background: #fff; }
        .service-order-items-table .form-control, .service-order-items-table .form-select { min-height: 28px; }
        .service-order-totals-row { display: grid; grid-template-columns: 1fr 140px 120px; justify-content: end; align-items: center; gap: 12px; margin: 10px 0 22px; }
        .service-order-total-label { text-align: right; font-weight: 700; font-size: 12px; }
        .service-order-detraction { display: flex; gap: 18px; align-items: center; margin: 18px 0; font-size: 12px; }
        .service-order-detraction label { margin: 0; }
        @media (max-width: 767.98px) { .service-order-modal-body { padding: 0 16px 20px; } .service-order-totals-row { grid-template-columns: 1fr; } .service-order-total-label { text-align: left; } }
      `}),e.jsx("input",{ref:j,hidden:!0}),e.jsx("input",{ref:b,hidden:!0,readOnly:!0}),e.jsx("input",{ref:Z,type:"hidden",value:A,readOnly:!0}),e.jsx("input",{ref:me,type:"hidden",value:M,readOnly:!0}),e.jsx("input",{ref:I,type:"hidden"}),e.jsx("input",{ref:K,type:"hidden"}),e.jsx("input",{ref:J,type:"hidden"}),e.jsx("input",{ref:Q,type:"hidden",defaultValue:"1"}),e.jsx("input",{ref:z,type:"hidden",defaultValue:"draft"}),e.jsx("input",{ref:P,type:"hidden",defaultValue:"pending"}),e.jsx("input",{ref:X,type:"hidden"}),e.jsx("textarea",{ref:L,hidden:!0}),e.jsxs("div",{className:"service-order-modal-actions",children:[e.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Guardar"]}),e.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[e.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),e.jsx("h3",{className:"service-order-form-title",children:"Orden de Servicio N°"}),e.jsxs("div",{className:"row g-4 align-items-end",children:[e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:ee,className:"form-select",value:se,onChange:t=>fe(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),ge.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} - `:"",t.display_name??t.full_name]},`service-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Contrato:"}),e.jsx("input",{ref:de,className:"form-control",placeholder:"Seleccionar"})]}),e.jsxs("div",{className:"col-12 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Ciclo Facturación:"}),e.jsxs("select",{ref:q,className:"form-select",required:!0,children:[e.jsx("option",{value:"Unico",children:"Unico"}),e.jsx("option",{value:"Mensual",children:"Mensual"}),e.jsx("option",{value:"Eventual",children:"Eventual"})]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Moneda:"}),e.jsxs("select",{ref:S,className:"form-select",onChange:t=>ut(t.target.value),required:!0,children:[e.jsx("option",{value:"PEN",children:"S/ | Soles"}),e.jsx("option",{value:"USD",children:"$ | Dolares"})]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Comprobante:"}),e.jsxs("select",{ref:R,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]})]}),e.jsx("div",{className:"service-order-form-separator"}),e.jsx("div",{className:"table-responsive",children:e.jsxs("table",{className:"service-order-items-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:120},children:e.jsx("button",{type:"button",className:"service-order-add-item",onClick:()=>k(t=>[...t,le()]),children:"AGREGAR ITEM"})}),e.jsx("th",{style:{width:48},children:"#"}),e.jsx("th",{children:"Servicio"}),e.jsx("th",{style:{width:170},children:"Alcance"}),e.jsx("th",{children:"Glosa"}),e.jsxs("th",{style:{width:135},children:["P. Unit.",e.jsx("br",{}),"(Sin IGV)"]}),e.jsx("th",{style:{width:130},children:"Subtotal"}),e.jsx("th",{style:{width:42}})]})}),e.jsx("tbody",{children:re.map((t,s)=>e.jsxs("tr",{children:[e.jsx("td",{}),e.jsx("td",{children:s+1}),e.jsx("td",{children:e.jsxs("select",{className:"form-select",value:t.service_id,onChange:r=>E(t.uid,"service_id",r.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione servicio"}),xe.map(r=>e.jsxs("option",{value:r.id,children:[r.code?`${r.code} - `:"",r.name]},`service-order-item-${r.id}`))]})}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:t.scope,onChange:r=>E(t.uid,"scope",r.target.value)})}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:t.gloss,onChange:r=>E(t.uid,"gloss",r.target.value)})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control text-end",value:t.unit_price,onChange:r=>E(t.uid,"unit_price",r.target.value)})}),e.jsx("td",{children:e.jsx("input",{className:"form-control text-end",value:Number(t.total||0).toFixed(2),disabled:!0})}),e.jsx("td",{children:e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>k(r=>r.length===1?[le()]:r.filter(a=>a.uid!==t.uid)),children:e.jsx("i",{className:"mdi mdi-close"})})})]},`service-order-item-row-${t.uid}`))})]})}),e.jsxs("div",{className:"service-order-totals-row",children:[e.jsx("div",{}),e.jsxs("div",{className:"service-order-total-label",children:["Gravadas: ",Oe]}),e.jsx("input",{className:"form-control text-end",value:Ee.toFixed(2),disabled:!0}),e.jsx("div",{}),e.jsxs("div",{className:"service-order-total-label",children:["I.G.V.: ",Oe]}),e.jsx("input",{className:"form-control text-end",value:pt.toFixed(2),disabled:!0}),e.jsx("div",{}),e.jsxs("div",{className:"service-order-total-label",children:["Total: ",Oe]}),e.jsx("input",{className:"form-control text-end",value:Qt.toFixed(2),disabled:!0})]}),e.jsxs("div",{className:"service-order-detraction",children:[e.jsx("span",{children:"Detracción:"}),e.jsxs("label",{children:[e.jsx("input",{type:"radio",name:"service-order-detraction",checked:!be,onChange:()=>De(!1)})," No"]}),e.jsxs("label",{children:[e.jsx("input",{type:"radio",name:"service-order-detraction",checked:be,onChange:()=>De(!0)})," Si"]})]}),e.jsxs("div",{className:"row g-4 align-items-end",children:[e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Forma de Pago:"}),e.jsxs("select",{ref:Y,className:"form-select",children:[e.jsx("option",{value:"Contado",children:"Contado"}),e.jsx("option",{value:"Credito",children:"Credito"})]})]}),e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Día Facturación:"}),e.jsxs("select",{ref:ue,className:"form-select",children:[e.jsx("option",{value:"",children:"Seleccionar"}),Array.from({length:31},(t,s)=>s+1).map(t=>e.jsx("option",{value:t,children:t},`service-order-billing-day-${t}`))]})]})]})]})]})};os((i,c)=>{const u=c.requiredPermission??"services-service-order";!c.can(u)&&!c.hasRole("Admin")&&(location.href="/admin/"),ls(i).render(e.jsx(cs,{...c,title:c.moduleTitle??"Ordenes de servicio",children:e.jsx(ws,{...c})}))});
