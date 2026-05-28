var ls=Object.defineProperty;var os=(r,o,u)=>o in r?ls(r,o,{enumerable:!0,configurable:!0,writable:!0,value:u}):r[o]=u;var R=(r,o,u)=>os(r,typeof o!="symbol"?o+"":o,u);import{m as cs,t as ds,C as us,c as ms,j as e,r as d,S}from"./CreateReactScript-BQEmHc8B.js";import{B as ps}from"./Base-BZJCfbcl.js";import{T as gs}from"./Table-BwS8S_mo.js";import{M as ze}from"./Modal-BpHRFSoz.js";import{D as Le}from"./DxButton-CsjWvhyj.js";import{B as hs}from"./BasicRest-BJmaHB2C.js";import{a as K}from"./permissionScope-Be8AULz2.js";import{r as Nt}from"./renderGridEditLink-D8NGEeKJ.js";import{o as xs,b as fs}from"./magistralesRecordPdf-BahM45BG.js";import{t as Ae,E as bs,w as vs}from"./statusLabels-BJ32pkWe.js";import"./ubigeoInei-D0FnAslC.js";const oe=async(r,o={})=>{try{const{status:u,result:g}=await cs.Fetch(r,{method:"POST",body:JSON.stringify({take:1e3,skip:0,isLoadingAll:!0,...o})});if(!u)throw new Error((g==null?void 0:g.message)||"No se pudo cargar la lista");return(g==null?void 0:g.data)??[]}catch(u){return ds.error("Error",{description:u.message,duration:3e3,richColors:!0}),[]}},js=()=>location.pathname.includes("/admin/storage-general-service-orders"),ys=()=>location.pathname.includes("/admin/storage-service-orders");class _s extends hs{constructor(){super(...arguments);R(this,"path",K()?js()?"admin/storage/general-service-orders":"admin/storage/service-orders":"admin/service-orders");R(this,"deleted",!1);R(this,"getBranchesByBusiness",async u=>u?await this.simpleGet(`/api/${this.path}/businesses/${u}/branches`)??[]:[]);R(this,"getBusinesses",async()=>await oe("/api/admin/businesses/paginate"));R(this,"getClients",async()=>await oe(K()?"/api/admin/storage/clients/paginate":"/api/admin/services-client/paginate"));R(this,"getServices",async()=>await oe(K()?"/api/admin/storage/general-service/paginate":"/api/admin/services/paginate",ys()?{storage_service_types:!0}:{}));R(this,"getStorageOptions",async()=>K()?await this.simpleGet("/api/admin/storage/kardex/options"):null);R(this,"getStorageWarehouses",async()=>K()?await oe("/api/admin/storage/kardex/paginate",{section:"warehouses",sort:[{selector:"warehouse_name",desc:!1}]}):[]);R(this,"getStorageLocations",async()=>K()?await oe("/api/admin/storage/kardex/paginate",{section:"locations"}):[])}async paginate(u){return await super.paginate({...u,deleted:this.deleted})}}const b=new _s,St=r=>(r==null?void 0:r.fullname)||[r==null?void 0:r.name,r==null?void 0:r.lastname].filter(Boolean).join(" ")||(r==null?void 0:r.username)||"",ce=()=>({uid:crypto.randomUUID(),service_id:"",scope:"",gloss:"",description:"",quantity:1,unit_price:0,detraction_percent:0,commission_percent:0,total:0}),C=(r="")=>r.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""),Ns=["Servicio de almacenamiento","Servicio de almacenamiento - Adicional"],Ss=[{value:"PEN",label:"Soles"},{value:"USD",label:"Dolares"}],wt=r=>(r==null?void 0:r.name)??(r==null?void 0:r.warehouse_name)??"",Cs=r=>(r==null?void 0:r.id)??(r==null?void 0:r.warehouse_id)??"",ws=r=>r==="approved"?"Aprobado":vs(r),Fs=r=>{const o=Cs(r),u=wt(r);return{key:o?`warehouse-${o}`:C(u),warehouse_name:u,warehouse_id:o?`${o}`:"",enabled:!1,location_id:"",location_ids:[],location_label:"",location_labels:[],start_date:"",months:"",end_date:"",billing_dates:[],quantity_m3:"",tariff:"",monthly_amount:""}},$e=(r=[])=>r.filter(o=>(o==null?void 0:o.status)!==null).map(Fs),Me=r=>{var o,u,g;return((g=(o=r==null?void 0:r.toString)==null?void 0:(u=o.call(r)).slice)==null?void 0:g.call(u,0,10))??""},de=r=>Number(r||0),We=(r,o,u=!1)=>{if(!r)return"";const g=Number(o);if(!Number.isFinite(g)||g<0||!u&&g<=0)return"";const _=new Date(`${r}T00:00:00`);if(Number.isNaN(_.getTime()))return"";const v=new Date(_),D=v.getDate();return v.setDate(1),v.setMonth(v.getMonth()+g),v.setDate(Math.min(D,new Date(v.getFullYear(),v.getMonth()+1,0).getDate())),v.toISOString().slice(0,10)},Ct=(r,o)=>{const u=Number.parseInt(o,10);return!r||!Number.isFinite(u)||u<=0?[]:Array.from({length:u},(g,_)=>({month:_+1,date:We(r,_,!0)}))},E=r=>r?[r.code,r.temperature_range].filter(Boolean).join(" | "):"",Ft=(r="")=>r.split(",").map(o=>o.trim()).filter(Boolean),Re=r=>Array.isArray(r.location_ids)?r.location_ids.filter(Boolean).map(o=>`${o}`):r.location_id?[`${r.location_id}`]:[],$s=(r,o)=>[r.warehouse_name,(Array.isArray(o)?o.map(E).filter(Boolean).join(", "):E(o))||r.location_label,`${r.start_date||""} - ${r.end_date||""}`,`${r.months||0} meses`,`${r.quantity_m3||0} m3`].filter(Boolean).join("; "),Rs=(r="")=>{const o=r.split(";").map(g=>g.trim()),u=(o[2]??"").split("-").map(g=>g.trim());return{warehouse_name:o[0]??"",location_label:o[1]??"",location_labels:Ft(o[1]??""),start_date:u.length>=3?`${u[0]}-${u[1]}-${u[2]}`.slice(0,10):"",end_date:u.length>=6?`${u[3]}-${u[4]}-${u[5]}`.slice(0,10):"",months:parseFloat(o[3])||"",quantity_m3:parseFloat(o[4])||""}},Bs=({moduleTitle:r="Ordenes de servicio",serviceOrderType:o="service"})=>{const u=d.useRef(),g=d.useRef(),_=d.useRef(),v=d.useRef(),D=d.useRef(),J=d.useRef(),Y=d.useRef(),B=d.useRef(),w=d.useRef(),P=d.useRef(),ue=d.useRef(),Q=d.useRef(),X=d.useRef(),me=d.useRef(),z=d.useRef(),L=d.useRef(),Z=d.useRef(),A=d.useRef(),Be=d.useRef(null),ee=d.useRef(),pe=d.useRef(),te=d.useRef(),Ge=d.useRef(),[ge,$t]=d.useState([]),[Is,Rt]=d.useState([]),[he,Bt]=d.useState([]),[xe,It]=d.useState([]),[M,fe]=d.useState(""),[W,se]=d.useState(""),[ie,be]=d.useState(""),[Ue,Ve]=d.useState(""),[Dt,He]=d.useState("PEN"),[Ie,Ke]=d.useState(!1),[T,Je]=d.useState("services"),[ve,Ye]=d.useState(""),[je,Qe]=d.useState(""),[ye,Xe]=d.useState(""),[Ze,et]=d.useState(null),[_e,tt]=d.useState({penTotal:0,penBilled:0,usdTotal:0,usdBilled:0}),[re,k]=d.useState([ce()]),[G,Tt]=d.useState([]),[U,kt]=d.useState([]),[st,Ne]=d.useState(()=>$e()),[it,Ot]=d.useState(!1),[qt,rt]=d.useState(""),[Et,Pt]=d.useState(!1),ne=o==="storage_general",F=o==="storage_service",N=ne||F,j=!N,zt=xe.filter(t=>Ns.some(s=>C(s)===C(t.name))),De=Object.fromEntries(xe.map(t=>[`${t.id}`,t])),nt=async()=>{if(!F)return{warehouseRows:[],locationRows:[]};Be.current||(Be.current=(async()=>{const i=await b.getStorageOptions();let n=((i==null?void 0:i.warehouses)??[]).filter(c=>c.status!==null),l=((i==null?void 0:i.locations)??[]).filter(c=>c.status!==null);if(!n.length||!l.length){const[c,p]=await Promise.all([l.length?Promise.resolve(l):b.getStorageLocations(),n.length?Promise.resolve(n):b.getStorageWarehouses()]);n=(n.length?n:p??[]).filter(a=>a.status!==null),l=(l.length?l:c??[]).filter(a=>a.status!==null)}return{warehouseRows:n,locationRows:l}})());const{warehouseRows:t,locationRows:s}=await Be.current;return Tt(t),kt(s),Ot(!0),{warehouseRows:t,locationRows:s}};d.useEffect(()=>{(async()=>{var a;const s=F?nt():Promise.resolve({warehouseRows:[],locationRows:[]}),[i,n,l,c]=await Promise.all([b.getBusinesses(),b.getClients(),b.getServices(),s]),p=i??[];if($t(p),Bt((n??[]).filter(m=>m.status!==null)),It((l??[]).filter(m=>m.status!==null)),F&&Ne($e(c.warehouseRows)),F||j){const m=p[0];if(m){fe(`${m.id}`);const y=await Se(m.id);(a=y[0])!=null&&a.id&&se(`${y[0].id}`)}}})()},[]),d.useLayoutEffect(()=>{if(!j)return;b.deleted=T==="deleted",tt({penTotal:0,penBilled:0,usdTotal:0,usdBilled:0});const t=u.current?$(u.current).dxDataGrid("instance"):null;t&&(t.pageIndex(0),t.getDataSource().reload())},[T]);const Lt=()=>{const t=[];ve&&t.push(["client_id","=",Number(ve)]),je&&t.push(["created_at",">=",`${je} 00:00:00`]),ye&&t.push(["created_at","<=",`${ye} 23:59:59`]),et(t.length?t.reduce((s,i)=>s.length?[...s,"and",i]:i,[]):null)},At=()=>{Ye(""),Qe(""),Xe(""),et(null)},Mt=t=>{const i=((t==null?void 0:t.data)??[]).reduce((n,l)=>{const c=`${l.currency??"PEN"}`.toUpperCase(),p=Number(l.total||0),a=l.billing_status==="billed"||l.order_status==="invoiced"?p:Number(l.paid_amount||0);return c==="USD"?(n.usdTotal+=p,n.usdBilled+=a):(n.penTotal+=p,n.penBilled+=a),n},{penTotal:0,penBilled:0,usdTotal:0,usdBilled:0});tt(i)},Se=async(t,s="")=>{const n=await b.getBranchesByBusiness(t)??[];return Rt(n),se(s?`${s}`:""),n},at=t=>({...t,total:Number(t.quantity||0)*Number(t.unit_price||0)}),O=(t,s="")=>{var i;return((i=t.current)==null?void 0:i.value)||s||""},lt=(t="")=>{const s=`${t??""}`.trim(),i=s.match(/^client-(\d+)$/i);return i?i[1]:s},ot=(t,s=G)=>s.find(i=>C(wt(i))===C(t)),ct=(t,s=G)=>{var i;return t.warehouse_id||((i=ot(t.warehouse_name,s))==null?void 0:i.id)||""},dt=(t,s=U,i=G)=>{const n=ct(t,i);return s.filter(l=>n&&`${l.warehouse_id}`==`${n}`?!0:C(l.warehouse_name)===C(t.warehouse_name))},ut=(t,s=U,i=G)=>{const n=dt(t,s,i),l=Re(t),c=l.length?n.filter(a=>l.includes(`${a.id}`)):[];return c.length?c:(Array.isArray(t.location_labels)&&t.location_labels.length?t.location_labels:Ft(t.location_label)).map(a=>n.find(m=>C(E(m))===C(a))).filter(Boolean)},Wt=(t=[],s=G,i=U)=>{const n=$e(s);return t.forEach(l=>{var y,h;const c=Rs(l.description??""),p=n.findIndex(I=>C(I.warehouse_name)===C(c.warehouse_name));if(p<0)return;const a={...n[p],enabled:!0,warehouse_id:((y=ot(n[p].warehouse_name,s))==null?void 0:y.id)??n[p].warehouse_id,location_label:c.location_label,location_labels:c.location_labels,start_date:c.start_date,months:c.months||"",end_date:c.end_date||We(c.start_date,c.months),billing_dates:Ct(c.start_date,c.months),quantity_m3:c.quantity_m3||Number(l.quantity||0)||"",tariff:Number(l.unit_price||0)||"",monthly_amount:Number(l.total||0)||""},m=ut(a,i,s);n[p]={...a,location_id:(h=m[0])!=null&&h.id?`${m[0].id}`:"",location_ids:m.map(I=>`${I.id}`)}}),n},V=(t,s)=>{Ne(i=>i.map(n=>{if(n.key!==t)return n;const l="location_ids"in s?(Array.isArray(s.location_ids)?s.location_ids:[s.location_ids]).filter(Boolean).map(m=>`${m}`):null,c=s.location_id?U.find(m=>`${m.id}`==`${s.location_id}`):null,p=l?U.filter(m=>l.includes(`${m.id}`)):null,a={...n,...s,warehouse_id:ct(n)};if(c&&(a.location_label=E(c)),p&&(a.location_ids=l,a.location_id=l[0]??"",a.location_labels=p.map(E).filter(Boolean),a.location_label=a.location_labels.join(", ")),("start_date"in s||"months"in s)&&(a.end_date=We(a.start_date,a.months),a.billing_dates=Ct(a.start_date,a.months)),"quantity_m3"in s||"tariff"in s){const m=de(a.quantity_m3)*de(a.tariff);a.monthly_amount=m?m.toFixed(2):""}return a}))},Gt=(t,s,i)=>{Ne(n=>n.map(l=>l.key!==t?l:{...l,billing_dates:(l.billing_dates??[]).map((c,p)=>p===s?{...c,date:i}:c)}))},Ut=(t,s)=>{const i=`${s}`,n=Re(t),l=n.includes(i)?n.filter(c=>c!==i):[...n,i];V(t.key,{location_ids:l})},ae=async(t=null)=>{var a,m,y;Pt(!!(t!=null&&t.id)),_.current.value=(t==null?void 0:t.id)??"",v.current.value=(t==null?void 0:t.code)??"Se genera al guardar",D.current.value=Me(t==null?void 0:t.issue_date)||new Date().toISOString().slice(0,10),J.current.value=Me(t==null?void 0:t.scheduled_at),Y.current.value=Me(t==null?void 0:t.first_due_date),B.current.value=(t==null?void 0:t.expected_document_type)??(N?"":"Factura");const s=(t==null?void 0:t.currency)??(N?"":"PEN");w.current.value=s,He(s||"PEN"),P.current.value=(t==null?void 0:t.billing_cycle)??(j?"Unico":""),ue.current&&(ue.current.value=(t==null?void 0:t.contract_label)??""),Q.current.value=(t==null?void 0:t.payment_condition)??"Contado",X.current.value=Number((t==null?void 0:t.installments)??1),me.current&&(me.current.value=(t==null?void 0:t.billing_day)??""),z.current.value=(t==null?void 0:t.order_status)??(ne?"approved":"draft"),L.current.value=(t==null?void 0:t.billing_status)??"pending",Z.current.value=Number((t==null?void 0:t.tax_amount)??0),A.current.value=(t==null?void 0:t.observations)??"",Ke(!!((t==null?void 0:t.detraction_enabled)??((t==null?void 0:t.items)??[]).some(h=>Number(h.detraction_percent||0)>0)));const i=t!=null&&t.business_id?`${t.business_id}`:M||((a=ge[0])!=null&&a.id?`${ge[0].id}`:"");fe(i),be(t!=null&&t.client_id?`${t.client_id}`:"");const n=await Se(i,(t==null?void 0:t.business_branch_id)??W);!(t!=null&&t.business_branch_id)&&!W&&((m=n[0])!=null&&m.id)&&se(`${n[0].id}`);const l=((t==null?void 0:t.items)??[]).map(h=>{var I,le;return{uid:crypto.randomUUID(),service_id:`${h.service_id}`,scope:h.scope??((I=h.service)==null?void 0:I.category)??"",gloss:h.gloss??h.description??((le=h.service)==null?void 0:le.name)??"",description:h.description??"",quantity:Number(h.quantity||0),unit_price:Number(h.unit_price||0),detraction_percent:Number(h.detraction_percent||0),commission_percent:Number(h.commission_percent||0),total:Number(h.total||0)}});Ve(((y=l[0])==null?void 0:y.service_id)??"");let c=G,p=U;if(F&&(!c.length||!p.length||!it)){const h=await nt();c=h.warehouseRows,p=h.locationRows}Ne(F?Wt((t==null?void 0:t.items)??[],c,p):$e()),k(l.length?l:ne?[]:[ce()]),$(g.current).modal("show")},q=(t,s,i)=>{k(n=>n.map(l=>{var p;if(l.uid!==t)return l;const c={...l,[s]:i};if(s==="service_id"){const a=De[i];c.scope=c.scope||(a==null?void 0:a.category)||"",c.gloss=c.gloss||(a==null?void 0:a.name)||"",c.description=c.gloss||c.description||(a==null?void 0:a.name)||"",c.unit_price=Number(((p=w.current)==null?void 0:p.value)==="USD"?a==null?void 0:a.unit_price_usd:a==null?void 0:a.unit_price_pen)||0}return s==="gloss"&&(c.description=i),at(c)}))},mt=t=>{He(t||"PEN"),k(s=>s.map(i=>{if(!i.service_id)return i;const n=De[i.service_id];return at({...i,unit_price:Number(t==="USD"?n==null?void 0:n.unit_price_usd:n==null?void 0:n.unit_price_pen)||0})}))},pt=t=>{S.fire({icon:"success",title:"Correcto",text:(t==null?void 0:t.message)||"Orden de servicio guardada correctamente.",timer:1800,showConfirmButton:!1})},gt=async t=>{const s=b.showSavedMessage;b.showSavedMessage=!1;try{return await b.save(t)}finally{b.showSavedMessage=s}},Te=async t=>{var y,h,I,le;if(t.preventDefault(),F){const f=O(ee,M),we=O(pe,W),ft=lt(O(te,ie)),qe=O(Ge,Ue),H=st.filter(x=>x.enabled),bt=H.find(x=>!Re(x).length||!x.start_date||!x.months||!x.end_date||!x.quantity_m3||!x.tariff);if(!f||!we||!ft||!B.current.value||!w.current.value||!qe){S.fire("Formulario incompleto","Completa empresa, cliente, tipo documento, moneda y tipo de servicio.","warning");return}if(!H.length){S.fire("Formulario incompleto","Selecciona al menos un almacen.","warning");return}if(bt){S.fire("Formulario incompleto",`Completa los datos de ${bt.warehouse_name}.`,"warning");return}const vt=H.find(x=>{const Pe=Number.parseInt(x.months,10);return!Array.isArray(x.billing_dates)||x.billing_dates.length!==Pe||x.billing_dates.some(Fe=>!Fe.date)});if(vt){S.fire("Formulario incompleto",`Completa las fechas de facturacion de ${vt.warehouse_name}.`,"warning");return}const jt=H.map(x=>x.start_date).filter(Boolean).sort(),is=Math.max(...H.map(x=>Number(x.months||1))),Ee=De[qe],rs={id:_.current.value||void 0,business_id:f||null,business_branch_id:we||null,client_id:ft||null,expected_document_type:B.current.value,currency:w.current.value,billing_cycle:(Ee==null?void 0:Ee.name)??"",payment_condition:"Contado",installments:is||1,issue_date:D.current.value||new Date().toISOString().slice(0,10),scheduled_at:jt[0]??null,first_due_date:jt[0]??null,order_status:z.current.value||"draft",billing_status:L.current.value||"pending",tax_amount:0,observations:A.current.value.trim(),items:H.map(x=>{const Pe=ut(x),Fe=de(x.quantity_m3),_t=de(x.tariff),ns=de(x.monthly_amount)||Fe*_t;return{service_id:qe,description:$s(x,Pe),quantity:Fe,unit_price:_t,detraction_percent:0,commission_percent:0,total:ns,billing_dates:(x.billing_dates??[]).map(as=>as.date)}})},yt=await gt(rs);if(!yt)return;$(u.current).dxDataGrid("instance").refresh(),$(g.current).modal("hide"),pt(yt);return}const s=O(ee,M),i=O(pe,W),n=lt(O(te,ie)),l=re.filter(f=>f.service_id).map(f=>({service_id:f.service_id,scope:f.scope,gloss:f.gloss,description:f.gloss||f.description,quantity:f.quantity,unit_price:f.unit_price,detraction_percent:j&&Ie?f.detraction_percent||12:f.detraction_percent,commission_percent:f.commission_percent,total:f.total}));if(ne){if(!s||!i||!n||!B.current.value||!w.current.value){S.fire("Formulario incompleto","Completa empresa, cliente, tipo documento y moneda.","warning");return}if(!l.length){S.fire("Formulario incompleto","Agrega al menos un servicio general.","warning");return}}else if(j){if(!s||!i||!n||!B.current.value||!w.current.value||!P.current.value){S.fire("Formulario incompleto","Completa cliente, comprobante, moneda y ciclo de facturacion.","warning");return}if(!l.length){S.fire("Formulario incompleto","Agrega al menos un item de servicio.","warning");return}}const c=l.reduce((f,we)=>f+Number(we.total||0),0),p=Number(j?(c*.18).toFixed(2):Z.current.value||0),a={id:_.current.value||void 0,business_id:s||null,business_branch_id:i||null,client_id:n||null,contract_label:((I=(h=(y=ue.current)==null?void 0:y.value)==null?void 0:h.trim)==null?void 0:I.call(h))||null,expected_document_type:B.current.value,currency:w.current.value,billing_cycle:P.current.value.trim(),payment_condition:Q.current.value,installments:X.current.value,billing_day:((le=me.current)==null?void 0:le.value)||null,detraction_enabled:j?Ie:!1,issue_date:D.current.value,scheduled_at:J.current.value||null,first_due_date:Y.current.value||null,order_status:z.current.value,billing_status:L.current.value,tax_amount:p,observations:A.current.value.trim(),items:l},m=await gt(a);m&&($(u.current).dxDataGrid("instance").refresh(),$(g.current).modal("hide"),pt(m))},Vt=async t=>{const s=typeof t=="object"?t==null?void 0:t.id:t;if(!s||(t==null?void 0:t.order_status)==="cancelled"||(t==null?void 0:t.status)===null)return;const{isConfirmed:i}=await S.fire({title:"Anular orden de servicio",text:N?"La orden quedara anulada y se mantendra visible en el historial.":"Se dara de baja la orden de servicio.",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, anular",cancelButtonText:"Cancelar"});!i||!(N?await b.boolean({id:s,field:"order_status",value:"cancelled"}):await b.delete(s))||$(u.current).dxDataGrid("instance").refresh()},Ht=(t,{data:s})=>{const i=(s==null?void 0:s.order_status)??"",n=document.createElement("span");n.className=`badge ${i==="approved"?"bg-soft-success text-success":i==="cancelled"?"bg-soft-danger text-danger":"bg-soft-warning text-warning"}`,n.textContent=ws(i),t.append(n)},Kt=(t,{data:s})=>{const i=(s==null?void 0:s.billing_status)==="billed"||(s==null?void 0:s.order_status)==="invoiced",n=document.createElement("span");n.className=`badge ${i?"bg-soft-success text-success":"bg-soft-warning text-warning"}`,n.textContent=i?"Facturado":"Pendiente",t.append(n)},Jt=t=>(t.items??[]).map(s=>{var i;return s.gloss||s.description||((i=s.service)==null?void 0:i.name)}).filter(Boolean).join(" | "),Yt=t=>(t==null?void 0:t.billing_status)==="billed"||(t==null?void 0:t.order_status)==="invoiced"?Number((t==null?void 0:t.total)||0):0,ht={caption:"Acciones",width:N?136:150,minWidth:N?136:150,fixed:N,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(t,{data:s})=>{const i=(s==null?void 0:s.order_status)==="cancelled"||(s==null?void 0:s.status)===null;t.css({overflow:"visible",textOverflow:"unset",whiteSpace:"nowrap"});const n=$("<div>").css({display:"flex",alignItems:"center",gap:"0.35rem",minWidth:"max-content"});t.append(n),n.append(Le({className:N?"btn btn-xs btn-soft-warning":"btn btn-xs btn-soft-primary",title:"Editar orden de servicio",icon:"mdi mdi-pencil",onClick:()=>ae(s)})),N||n.append(Le({className:"btn btn-xs btn-soft-danger",title:"Imprimir PDF",icon:"mdi mdi-file-pdf-box",onClick:()=>xs(fs.serviceOrder(s))})),i||n.append(Le({className:"btn btn-xs btn-soft-danger",title:"Anular orden de servicio",icon:N?"mdi mdi-close":"mdi mdi-delete",onClick:()=>Vt(s)}))}},Qt=[{dataField:"client_id",caption:"Cliente ID",visible:!1,showInColumnChooser:!1},{dataField:"row_number",caption:"#",width:56,allowFiltering:!1,calculateCellValue:t=>t.id},ht,{dataField:"billing_status",caption:"Estado",width:130,lookup:Ae([{value:"pending",label:"Pendiente"},{value:"billed",label:"Facturado"}]),cellTemplate:Kt},{dataField:"code",caption:"Orden Servicio",width:150,cellTemplate:(t,{data:s})=>Nt(t,s==null?void 0:s.code,()=>ae(s),"Editar orden de servicio")},{dataField:"billing_cycle",caption:"Ciclo Facturación",width:155},{dataField:"client.document_number",caption:"Doc. Cliente",width:140},{dataField:"client.full_name",caption:"Cliente",minWidth:200},{dataField:"services_text",caption:"Servicios",minWidth:260,calculateCellValue:Jt},{dataField:"total_prefactures",caption:"Total Prefacturas",width:150,dataType:"number",format:{type:"fixedPoint",precision:2},calculateCellValue:t=>Number(t.total||0)},{dataField:"total",caption:"Total Servicio",width:145,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total_billed",caption:"Total Facturado",width:150,dataType:"number",format:{type:"fixedPoint",precision:2},calculateCellValue:Yt},{dataField:"contract_label",caption:"Contrato",width:150},{dataField:"creator.fullname",caption:"Usuario Registro",minWidth:150,calculateCellValue:t=>St(t.creator)},{dataField:"created_at",caption:"Fecha Registro",dataType:"datetime",width:170,format:"yyyy-MM-dd HH:mm:ss"}],Xt=[{dataField:"client_id",caption:"Cliente ID",visible:!1,showInColumnChooser:!1},ht,{dataField:"order_status",caption:"Estado",width:145,minWidth:145,lookup:Ae(bs),cellTemplate:Ht},{dataField:"code",caption:"Codigo",width:185,minWidth:185,cellTemplate:(t,{data:s})=>Nt(t,s==null?void 0:s.code,()=>ae(s),"Editar orden de servicio")},{dataField:"business.name",caption:"Empresa",minWidth:210},{dataField:"client.full_name",caption:"Cliente",minWidth:330},{dataField:"expected_document_type",caption:"Tipo comprobante",width:170,minWidth:170},{dataField:"currency",caption:"Moneda",width:105,lookup:Ae(Ss)},{dataField:"created_at",caption:"Fecha registro",dataType:"datetime",width:185,minWidth:185,format:"yyyy-MM-dd HH:mm:ss"},{dataField:"creator.fullname",caption:"Usuario registro",minWidth:185,calculateCellValue:t=>St(t.creator)}],Zt=N?Xt:Qt,es=re.reduce((t,s)=>t+Number(s.total||0),0),ke=re.reduce((t,s)=>t+Number(s.total||0),0),xt=Number((ke*.18).toFixed(2)),ts=Number((ke+xt).toFixed(2)),Oe=Dt==="USD"?"$":"S/",Ce=t=>Number(t||0).toFixed(5),ss=j?e.jsxs("div",{className:"service-order-list-panel",children:[e.jsxs("div",{className:"service-order-tabs",children:[e.jsx("button",{type:"button",className:T==="services"?"active":"",onClick:()=>Je("services"),children:"Servicios"}),e.jsx("button",{type:"button",className:T==="deleted"?"active":"",onClick:()=>Je("deleted"),children:"OS Eliminadas"})]}),e.jsxs("div",{className:"service-order-filter-panel",children:[e.jsxs("div",{className:"row g-3 align-items-end",children:[e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{className:"form-select",value:ve,onChange:t=>Ye(t.target.value),children:[e.jsx("option",{value:"",children:T==="deleted"?"Seleccione":"Todos"}),he.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} - `:"",t.full_name]},`service-order-filter-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Fecha Registro (Inicio - Fin):"}),e.jsxs("div",{className:"service-order-date-range",children:[e.jsx("input",{type:"date",className:"form-control",value:je,onChange:t=>Qe(t.target.value)}),e.jsx("input",{type:"date",className:"form-control",value:ye,onChange:t=>Xe(t.target.value)})]})]})]}),e.jsxs("div",{className:"service-order-filter-actions",children:[e.jsxs("button",{type:"button",className:"btn service-order-outline-btn",onClick:Lt,children:[e.jsx("i",{className:"mdi mdi-filter me-1"})," Filtrar"]}),(ve||je||ye||Ze)&&e.jsx("button",{type:"button",className:"btn service-order-muted-btn",onClick:At,children:"Limpiar"})]})]}),T==="services"&&e.jsxs("div",{className:"service-order-list-summary",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Importe Total"}),e.jsxs("strong",{className:"text-success",children:["S/ ",Ce(_e.penTotal)]}),e.jsxs("strong",{className:"text-success",children:["$ ",Ce(_e.usdTotal)]})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Total Facturado"}),e.jsxs("strong",{className:"text-warning",children:["S/ ",Ce(_e.penBilled)]}),e.jsxs("strong",{className:"text-warning",children:["$ ",Ce(_e.usdBilled)]})]})]})]}):r;return e.jsxs(e.Fragment,{children:[j&&e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
        `}),e.jsxs("div",{className:"service-order-action-row",children:[e.jsxs("button",{type:"button",className:"service-order-action-tile primary",onClick:()=>ae(),children:[e.jsxs("span",{children:[e.jsx("i",{className:"mdi mdi-plus-circle-outline me-1"})," Registrar Orden de Servicio"]}),e.jsx("i",{className:"mdi mdi-calendar-month-outline fs-4"})]}),e.jsxs("button",{type:"button",className:"service-order-action-tile warning",onClick:()=>S.fire("Procesar actividades pendientes","Este proceso quedo listo como acceso del modulo. Falta conectar una regla automatica de actividades cuando se defina el flujo operativo.","info"),children:[e.jsxs("span",{children:[e.jsx("i",{className:"mdi mdi-plus-circle-outline me-1"})," Procesar Actividades Pendientes"]}),e.jsx("i",{className:"mdi mdi-calendar-month-outline fs-4"})]})]})]}),e.jsx(gs,{gridRef:u,title:ss,rest:b,pageSize:25,filterValue:j?Ze:null,onRefresh:j?Mt:void 0,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",onClick:()=>$(u.current).dxDataGrid("instance").refresh()}}),j||t.unshift({widget:"dxButton",location:"after",options:{icon:"add",onClick:()=>ae()}})},columns:Zt},j?`service-order-${T}`:`service-order-${o}`),F?e.jsxs(ze,{modalRef:g,title:e.jsxs("span",{className:"storage-service-order-title",children:[e.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-service-order-dialog modal-dialog-scrollable",contentClass:"storage-service-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-service-order-body",hideFooter:!0,onSubmit:Te,children:[e.jsx("style",{children:`
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
        `}),e.jsx("input",{ref:_,hidden:!0}),e.jsx("input",{ref:v,hidden:!0}),e.jsx("input",{ref:D,type:"date",hidden:!0}),e.jsx("input",{ref:J,type:"date",hidden:!0}),e.jsx("input",{ref:Y,type:"date",hidden:!0}),e.jsx("input",{ref:P,hidden:!0}),e.jsx("input",{ref:Q,hidden:!0}),e.jsx("input",{ref:X,type:"number",hidden:!0}),e.jsx("input",{ref:z,hidden:!0}),e.jsx("input",{ref:L,hidden:!0}),e.jsx("input",{ref:Z,type:"number",hidden:!0}),e.jsx("textarea",{ref:A,hidden:!0}),e.jsxs("div",{className:"storage-service-order-actions",children:[e.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]}),e.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[e.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),e.jsx("h3",{className:"storage-service-order-heading",children:"Orden de servicio N°"}),e.jsxs("div",{className:"row g-4 align-items-end",children:[e.jsxs("div",{className:"col-12 col-md-6 col-xl",children:[e.jsx("label",{className:"form-label",children:"Empresa"}),e.jsxs("select",{ref:ee,className:"form-select",value:M,onChange:async t=>{var i;fe(t.target.value);const s=await Se(t.target.value);se((i=s[0])!=null&&i.id?`${s[0].id}`:"")},required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),ge.map(t=>e.jsx("option",{value:t.id,children:t.name},`storage-order-business-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:te,className:"form-select",value:ie,onChange:t=>be(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),he.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} | `:"",t.full_name]},`storage-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Tipo documento"}),e.jsxs("select",{ref:B,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:w,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"PEN",children:"Soles"}),e.jsx("option",{value:"USD",children:"Dolares"})]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Tipo de servicio"}),e.jsxs("select",{ref:Ge,className:"form-select",value:Ue,onChange:t=>Ve(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),zt.map(t=>e.jsx("option",{value:t.id,children:t.name},`storage-order-service-${t.id}`))]})]})]}),e.jsx("div",{className:"storage-service-order-separator"}),e.jsx("div",{className:"row g-3",children:st.map(t=>{const s=dt(t),i=F&&!it,n=!t.enabled||i,l=Re(t),c=s.filter(a=>l.includes(`${a.id}`)),p=qt===t.key;return e.jsx("div",{className:"col-12 col-lg-4",children:e.jsxs("div",{className:"storage-service-card",children:[e.jsxs("div",{className:"storage-service-card-header",children:[e.jsx("input",{type:"checkbox",className:"form-check-input storage-order-checkbox",checked:t.enabled,onChange:a=>{V(t.key,{enabled:a.target.checked}),a.target.checked||rt("")}}),e.jsx("p",{className:"storage-service-card-title",children:t.warehouse_name})]}),e.jsxs("div",{className:"storage-service-card-body",children:[e.jsxs("div",{className:"mb-3",children:[e.jsx("label",{className:"form-label",children:"Ubicación"}),e.jsxs("div",{className:"storage-location-picker",children:[e.jsxs("button",{type:"button",className:"storage-location-picker-toggle",disabled:n,onClick:()=>rt(a=>a===t.key?"":t.key),children:[e.jsxs("span",{className:"storage-location-picker-values",children:[i&&e.jsx("span",{className:"storage-location-picker-placeholder",children:"Cargando ubicaciones..."}),!i&&!c.length&&e.jsx("span",{className:"storage-location-picker-placeholder",children:s.length?"Seleccione ubicaciones":"Sin ubicaciones"}),c.map(a=>e.jsx("span",{className:"storage-location-chip",children:E(a)},`storage-order-location-chip-${t.key}-${a.id}`))]}),e.jsx("i",{className:"mdi mdi-chevron-down"})]}),p&&!n&&e.jsxs("div",{className:"storage-location-picker-menu",children:[!s.length&&e.jsx("div",{className:"storage-location-empty",children:"Sin ubicaciones"}),s.map(a=>{const m=`${a.id}`;return e.jsxs("label",{className:"storage-location-option",children:[e.jsx("input",{type:"checkbox",checked:l.includes(m),onChange:()=>Ut(t,m)}),e.jsx("span",{children:E(a)})]},`storage-order-location-${t.key}-${a.id}`)})]})]})]}),e.jsxs("div",{className:"row g-3 mb-3",children:[e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Fecha de inicio"}),e.jsx("input",{type:"date",className:"form-control",value:t.start_date,disabled:n,onChange:a=>V(t.key,{start_date:a.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Nro de meses"}),e.jsx("input",{type:"number",min:"1",className:"form-control",value:t.months,disabled:n,onChange:a=>V(t.key,{months:a.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Fecha fin"}),e.jsx("input",{type:"date",className:"form-control",value:t.end_date,disabled:!0})]})]}),e.jsxs("div",{className:"row g-3",children:[e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Cantidad de m3"}),e.jsx("input",{type:"number",min:"0",step:"0.001",className:"form-control",value:t.quantity_m3,disabled:n,onChange:a=>V(t.key,{quantity_m3:a.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Tarifa"}),e.jsx("input",{type:"number",min:"0",step:"0.01",className:"form-control",value:t.tariff,disabled:n,onChange:a=>V(t.key,{tariff:a.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Importe mensual"}),e.jsx("input",{type:"number",className:"form-control",value:t.monthly_amount,disabled:!0})]})]}),t.enabled&&(t.billing_dates??[]).length>0&&e.jsx("div",{className:"storage-billing-schedule",children:e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"N° mes"}),e.jsx("th",{children:"Fecha facturación"})]})}),e.jsx("tbody",{children:t.billing_dates.map((a,m)=>e.jsxs("tr",{children:[e.jsx("td",{children:a.month}),e.jsx("td",{children:e.jsx("input",{type:"date",className:"form-control",value:a.date,onChange:y=>Gt(t.key,m,y.target.value),required:t.enabled})})]},`storage-order-billing-${t.key}-${a.month}`))})]})})]})]})},`storage-order-block-${t.key}`)})})]}):ne?e.jsxs(ze,{modalRef:g,title:e.jsxs("span",{className:"storage-service-order-title",children:[e.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-general-order-dialog modal-dialog-scrollable",contentClass:"storage-general-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-general-order-body",hideFooter:!0,onSubmit:Te,children:[e.jsx("style",{children:`
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
          .storage-general-lines-wrap {
            border: 1px solid #e9ecef;
            border-radius: 4px;
            overflow: auto;
          }
          .storage-general-lines {
            width: 100%;
            min-width: 980px;
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
        `}),e.jsx("input",{ref:_,hidden:!0}),e.jsx("input",{ref:v,hidden:!0}),e.jsx("input",{ref:D,type:"date",hidden:!0}),e.jsx("input",{ref:J,type:"date",hidden:!0}),e.jsx("input",{ref:Y,type:"date",hidden:!0}),e.jsx("input",{ref:P,hidden:!0}),e.jsx("input",{ref:Q,hidden:!0}),e.jsx("input",{ref:X,type:"number",hidden:!0}),e.jsx("input",{ref:z,hidden:!0}),e.jsx("input",{ref:L,hidden:!0}),e.jsx("input",{ref:Z,type:"number",hidden:!0}),e.jsx("textarea",{ref:A,hidden:!0}),e.jsx("input",{ref:pe,type:"hidden",value:W,readOnly:!0}),e.jsxs("div",{className:"storage-general-order-actions",children:[e.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Guardar"]}),e.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[e.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),e.jsx("h3",{className:"storage-general-order-heading",children:"Orden de servicio N°"}),e.jsxs("div",{className:"row g-4 align-items-end",children:[e.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[e.jsx("label",{className:"form-label",children:"Empresa"}),e.jsxs("select",{ref:ee,className:"form-select",value:M,onChange:async t=>{var i;fe(t.target.value);const s=await Se(t.target.value);se((i=s[0])!=null&&i.id?`${s[0].id}`:"")},required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),ge.map(t=>e.jsx("option",{value:t.id,children:t.name},`general-order-business-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:te,className:"form-select",value:ie,onChange:t=>be(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),he.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} | `:"",t.full_name]},`general-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[e.jsx("label",{className:"form-label",children:"Tipo documento"}),e.jsxs("select",{ref:B,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:w,className:"form-select",onChange:t=>mt(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"PEN",children:"Soles"}),e.jsx("option",{value:"USD",children:"Dolares"})]})]})]}),e.jsx("div",{className:"mt-4 mb-3",children:e.jsxs("button",{type:"button",className:"btn btn-outline-primary storage-general-insert",onClick:()=>k(t=>[...t,ce()]),children:[e.jsx("i",{className:"mdi mdi-plus-circle me-1"})," Insertar servicio general"]})}),e.jsx("div",{className:"storage-general-lines-wrap",children:e.jsxs("table",{className:"storage-general-lines",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Servicio"}),e.jsx("th",{style:{width:115},children:"Tarifa"}),e.jsx("th",{style:{width:115},children:"Cantidad"}),e.jsx("th",{style:{width:130},children:"Total"}),e.jsx("th",{style:{width:42}})]})}),e.jsx("tbody",{children:re.map(t=>e.jsxs("tr",{children:[e.jsx("td",{children:e.jsxs("select",{className:"form-select",value:t.service_id,onChange:s=>q(t.uid,"service_id",s.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione servicio"}),xe.map(s=>e.jsx("option",{value:s.id,children:s.name},`general-order-service-${s.id}`))]})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.01",className:"form-control",value:t.unit_price,onChange:s=>q(t.uid,"unit_price",s.target.value)})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.001",min:"0",className:"form-control",value:t.quantity,onChange:s=>q(t.uid,"quantity",s.target.value)})}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:Number(t.total||0).toFixed(2),disabled:!0})}),e.jsx("td",{children:e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>k(s=>s.filter(i=>i.uid!==t.uid)),children:e.jsx("i",{className:"mdi mdi-close"})})})]},`general-order-item-${t.uid}`))}),e.jsx("tfoot",{children:e.jsxs("tr",{children:[e.jsx("td",{colSpan:"3",className:"storage-general-total-label",children:"Total"}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:es.toFixed(2),disabled:!0})}),e.jsx("td",{})]})})]})})]}):e.jsxs(ze,{modalRef:g,title:Et?"Editar orden de servicio":"Registrar orden de servicio",size:"xl",bodyClass:"service-order-form-modal-body",btnCancelText:"Cerrar",btnSubmitText:"Guardar",onSubmit:Te,children:[e.jsx("style",{children:`
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
      `}),e.jsx("input",{ref:_,hidden:!0}),e.jsx("input",{ref:v,hidden:!0,readOnly:!0}),e.jsx("input",{ref:ee,type:"hidden",value:M,readOnly:!0}),e.jsx("input",{ref:pe,type:"hidden",value:W,readOnly:!0}),e.jsx("input",{ref:D,type:"hidden"}),e.jsx("input",{ref:J,type:"hidden"}),e.jsx("input",{ref:Y,type:"hidden"}),e.jsx("input",{ref:X,type:"hidden",defaultValue:"1"}),e.jsx("input",{ref:z,type:"hidden",defaultValue:"draft"}),e.jsx("input",{ref:L,type:"hidden",defaultValue:"pending"}),e.jsx("input",{ref:Z,type:"hidden"}),e.jsx("textarea",{ref:A,hidden:!0}),e.jsxs("div",{className:"row g-3",children:[e.jsx("div",{className:"col-12",children:e.jsx("h5",{className:"service-order-form-section-title",children:"Datos de la orden"})}),e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:te,className:"form-select",value:ie,onChange:t=>be(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),he.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} - `:"",t.display_name??t.full_name]},`service-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Contrato"}),e.jsx("input",{ref:ue,className:"form-control",placeholder:"Seleccionar"})]}),e.jsxs("div",{className:"col-12 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Ciclo de facturación"}),e.jsxs("select",{ref:P,className:"form-select",required:!0,children:[e.jsx("option",{value:"Unico",children:"Unico"}),e.jsx("option",{value:"Mensual",children:"Mensual"}),e.jsx("option",{value:"Eventual",children:"Eventual"})]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:w,className:"form-select",onChange:t=>mt(t.target.value),required:!0,children:[e.jsx("option",{value:"PEN",children:"S/ | Soles"}),e.jsx("option",{value:"USD",children:"$ | Dolares"})]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Comprobante"}),e.jsxs("select",{ref:B,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]})]}),e.jsx("hr",{className:"my-4"}),e.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[e.jsx("h5",{className:"service-order-form-section-title",children:"Detalle de servicios"}),e.jsxs("button",{type:"button",className:"btn btn-sm btn-primary",onClick:()=>k(t=>[...t,ce()]),children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Agregar item"]})]}),e.jsx("div",{className:"service-order-items-wrapper",children:e.jsxs("table",{className:"table table-sm table-bordered align-middle service-order-items-table mb-0",children:[e.jsx("thead",{className:"table-light",children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:48},children:"#"}),e.jsx("th",{children:"Servicio"}),e.jsx("th",{style:{width:170},children:"Alcance"}),e.jsx("th",{children:"Glosa"}),e.jsxs("th",{style:{width:135},children:["P. Unit.",e.jsx("br",{}),"(Sin IGV)"]}),e.jsx("th",{style:{width:130},children:"Subtotal"}),e.jsx("th",{style:{width:42}})]})}),e.jsx("tbody",{children:re.map((t,s)=>e.jsxs("tr",{children:[e.jsx("td",{children:s+1}),e.jsx("td",{children:e.jsxs("select",{className:"form-select",value:t.service_id,onChange:i=>q(t.uid,"service_id",i.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione servicio"}),xe.map(i=>e.jsxs("option",{value:i.id,children:[i.code?`${i.code} - `:"",i.name]},`service-order-item-${i.id}`))]})}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:t.scope,onChange:i=>q(t.uid,"scope",i.target.value)})}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:t.gloss,onChange:i=>q(t.uid,"gloss",i.target.value)})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control text-end",value:t.unit_price,onChange:i=>q(t.uid,"unit_price",i.target.value)})}),e.jsx("td",{children:e.jsx("input",{className:"form-control text-end",value:Number(t.total||0).toFixed(2),disabled:!0})}),e.jsx("td",{children:e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>k(i=>i.length===1?[ce()]:i.filter(n=>n.uid!==t.uid)),children:e.jsx("i",{className:"mdi mdi-close"})})})]},`service-order-item-row-${t.uid}`))})]})}),e.jsxs("div",{className:"service-order-summary mt-3",children:[e.jsxs("div",{className:"service-order-summary-row",children:[e.jsxs("span",{className:"service-order-summary-label",children:["Gravadas: ",Oe]}),e.jsx("input",{className:"form-control text-end",value:ke.toFixed(2),disabled:!0})]}),e.jsxs("div",{className:"service-order-summary-row",children:[e.jsxs("span",{className:"service-order-summary-label",children:["I.G.V.: ",Oe]}),e.jsx("input",{className:"form-control text-end",value:xt.toFixed(2),disabled:!0})]}),e.jsxs("div",{className:"service-order-summary-row",children:[e.jsxs("span",{className:"service-order-summary-label",children:["Total: ",Oe]}),e.jsx("input",{className:"form-control text-end",value:ts.toFixed(2),disabled:!0})]})]}),e.jsx("hr",{className:"my-4"}),e.jsxs("div",{className:"row g-3 align-items-end",children:[e.jsxs("div",{className:"col-12 col-lg-4",children:[e.jsx("label",{className:"form-label d-block",children:"Detracción"}),e.jsx("div",{className:"form-check form-switch service-order-detraction-options",children:e.jsx("input",{className:"form-check-input",id:"service-order-detraction-enabled",type:"checkbox",checked:Ie,onChange:t=>Ke(t.target.checked)})})]}),e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Forma de pago"}),e.jsxs("select",{ref:Q,className:"form-select",children:[e.jsx("option",{value:"Contado",children:"Contado"}),e.jsx("option",{value:"Credito",children:"Credito"})]})]}),e.jsxs("div",{className:"col-12 col-lg-2",children:[e.jsx("label",{className:"form-label",children:"Día facturación"}),e.jsxs("select",{ref:me,className:"form-select",children:[e.jsx("option",{value:"",children:"Seleccionar"}),Array.from({length:31},(t,s)=>s+1).map(t=>e.jsx("option",{value:t,children:t},`service-order-billing-day-${t}`))]})]})]})]})]})};us((r,o)=>{const u=o.requiredPermission??"services-service-order";!o.can(u)&&!o.hasRole("Admin")&&(location.href="/admin/"),ms(r).render(e.jsx(ps,{...o,title:o.moduleTitle??"Ordenes de servicio",children:e.jsx(Bs,{...o})}))});
