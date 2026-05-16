var os=Object.defineProperty;var ls=(i,c,u)=>c in i?os(i,c,{enumerable:!0,configurable:!0,writable:!0,value:u}):i[c]=u;var F=(i,c,u)=>ls(i,typeof c!="symbol"?c+"":c,u);import{m as cs,t as ds,C as us,c as ms,j as e,r as d,S as _}from"./CreateReactScript-DzmYTmbr.js";import{B as ps}from"./Base-BFIC9n1T.js";import{T as gs,t as Le,E as hs,q as xs}from"./Table-CO65K1hT.js";import{M as Ae}from"./Modal-DGAB1eIb.js";import{D as Me}from"./DxButton-CsjWvhyj.js";import{B as fs}from"./BasicRest-DlKnEI0V.js";import{a as H}from"./permissionScope-etO_1UXy.js";import{r as Nt}from"./renderGridEditLink-D8NGEeKJ.js";import{o as bs,b as vs}from"./magistralesRecordPdf-u2rK0s4i.js";const oe=async(i,c={})=>{try{const{status:u,result:g}=await cs.Fetch(i,{method:"POST",body:JSON.stringify({take:1e3,skip:0,isLoadingAll:!0,...c})});if(!u)throw new Error((g==null?void 0:g.message)||"No se pudo cargar la lista");return(g==null?void 0:g.data)??[]}catch(u){return ds.error("Error",{description:u.message,duration:3e3,richColors:!0}),[]}},js=()=>location.pathname.includes("/admin/storage-general-service-orders"),ys=()=>location.pathname.includes("/admin/storage-service-orders");class Ns extends fs{constructor(){super(...arguments);F(this,"path",H()?js()?"admin/storage/general-service-orders":"admin/storage/service-orders":"admin/service-orders");F(this,"deleted",!1);F(this,"getBranchesByBusiness",async u=>u?await this.simpleGet(`/api/${this.path}/businesses/${u}/branches`)??[]:[]);F(this,"getBusinesses",async()=>await oe("/api/admin/businesses/paginate"));F(this,"getClients",async()=>await oe(H()?"/api/admin/storage/clients/paginate":"/api/admin/services-client/paginate"));F(this,"getServices",async()=>await oe(H()?"/api/admin/storage/general-service/paginate":"/api/admin/services/paginate",ys()?{storage_service_types:!0}:{}));F(this,"getStorageOptions",async()=>H()?await this.simpleGet("/api/admin/storage/kardex/options"):null);F(this,"getStorageWarehouses",async()=>H()?await oe("/api/admin/storage/kardex/paginate",{section:"warehouses",sort:[{selector:"warehouse_name",desc:!1}]}):[]);F(this,"getStorageLocations",async()=>H()?await oe("/api/admin/storage/kardex/paginate",{section:"locations"}):[])}async paginate(u){return await super.paginate({...u,deleted:this.deleted})}}const b=new Ns,_t=i=>(i==null?void 0:i.fullname)||[i==null?void 0:i.name,i==null?void 0:i.lastname].filter(Boolean).join(" ")||(i==null?void 0:i.username)||"",le=()=>({uid:crypto.randomUUID(),service_id:"",scope:"",gloss:"",description:"",quantity:1,unit_price:0,detraction_percent:0,commission_percent:0,total:0}),S=(i="")=>i.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""),_s=["Servicio de almacenamiento","Servicio de almacenamiento - Adicional"],Ss=[{value:"PEN",label:"Soles"},{value:"USD",label:"Dolares"}],Ct=i=>(i==null?void 0:i.name)??(i==null?void 0:i.warehouse_name)??"",Cs=i=>(i==null?void 0:i.id)??(i==null?void 0:i.warehouse_id)??"",ws=i=>i==="approved"?"Aprobado":xs(i),Fs=i=>{const c=Cs(i),u=Ct(i);return{key:c?`warehouse-${c}`:S(u),warehouse_name:u,warehouse_id:c?`${c}`:"",enabled:!1,location_id:"",location_ids:[],location_label:"",location_labels:[],start_date:"",months:"",end_date:"",billing_dates:[],quantity_m3:"",tariff:"",monthly_amount:""}},$e=(i=[])=>i.filter(c=>(c==null?void 0:c.status)!==null).map(Fs),Ge=i=>{var c,u,g;return((g=(c=i==null?void 0:i.toString)==null?void 0:(u=c.call(i)).slice)==null?void 0:g.call(u,0,10))??""},ce=i=>Number(i||0),Ue=(i,c,u=!1)=>{if(!i)return"";const g=Number(c);if(!Number.isFinite(g)||g<0||!u&&g<=0)return"";const y=new Date(`${i}T00:00:00`);if(Number.isNaN(y.getTime()))return"";const v=new Date(y),I=v.getDate();return v.setDate(1),v.setMonth(v.getMonth()+g),v.setDate(Math.min(I,new Date(v.getFullYear(),v.getMonth()+1,0).getDate())),v.toISOString().slice(0,10)},St=(i,c)=>{const u=Number.parseInt(c,10);return!i||!Number.isFinite(u)||u<=0?[]:Array.from({length:u},(g,y)=>({month:y+1,date:Ue(i,y,!0)}))},q=i=>i?[i.code,i.temperature_range].filter(Boolean).join(" | "):"",wt=(i="")=>i.split(",").map(c=>c.trim()).filter(Boolean),Be=i=>Array.isArray(i.location_ids)?i.location_ids.filter(Boolean).map(c=>`${c}`):i.location_id?[`${i.location_id}`]:[],Rs=(i,c)=>[i.warehouse_name,(Array.isArray(c)?c.map(q).filter(Boolean).join(", "):q(c))||i.location_label,`${i.start_date||""} - ${i.end_date||""}`,`${i.months||0} meses`,`${i.quantity_m3||0} m3`].filter(Boolean).join("; "),$s=(i="")=>{const c=i.split(";").map(g=>g.trim()),u=(c[2]??"").split("-").map(g=>g.trim());return{warehouse_name:c[0]??"",location_label:c[1]??"",location_labels:wt(c[1]??""),start_date:u.length>=3?`${u[0]}-${u[1]}-${u[2]}`.slice(0,10):"",end_date:u.length>=6?`${u[3]}-${u[4]}-${u[5]}`.slice(0,10):"",months:parseFloat(c[3])||"",quantity_m3:parseFloat(c[4])||""}},Bs=({moduleTitle:i="Ordenes de servicio",serviceOrderType:c="service"})=>{const u=d.useRef(),g=d.useRef(),y=d.useRef(),v=d.useRef(),I=d.useRef(),K=d.useRef(),J=d.useRef(),R=d.useRef(),C=d.useRef(),E=d.useRef(),de=d.useRef(),Y=d.useRef(),Q=d.useRef(),ue=d.useRef(),P=d.useRef(),z=d.useRef(),X=d.useRef(),L=d.useRef(),Ie=d.useRef(null),Z=d.useRef(),me=d.useRef(),ee=d.useRef(),We=d.useRef(),[pe,Ft]=d.useState([]),[Is,Rt]=d.useState([]),[ge,$t]=d.useState([]),[he,Bt]=d.useState([]),[A,xe]=d.useState(""),[M,te]=d.useState(""),[se,fe]=d.useState(""),[Ve,He]=d.useState(""),[It,Ke]=d.useState("PEN"),[be,De]=d.useState(!1),[ve,Je]=d.useState("services"),[je,Ye]=d.useState(""),[ye,Qe]=d.useState(""),[Ne,Xe]=d.useState(""),[Ze,et]=d.useState(null),[_e,Dt]=d.useState({penTotal:0,penBilled:0,usdTotal:0,usdBilled:0}),[re,T]=d.useState([le()]),[G,Tt]=d.useState([]),[U,kt]=d.useState([]),[tt,Se]=d.useState(()=>$e()),[st,Ot]=d.useState(!1),[qt,rt]=d.useState(""),[Et,Pt]=d.useState(!1),ie=c==="storage_general",w=c==="storage_service",D=ie||w,N=!D,zt=he.filter(t=>_s.some(s=>S(s)===S(t.name))),Te=Object.fromEntries(he.map(t=>[`${t.id}`,t])),it=async()=>{if(!w)return{warehouseRows:[],locationRows:[]};Ie.current||(Ie.current=(async()=>{const r=await b.getStorageOptions();let a=((r==null?void 0:r.warehouses)??[]).filter(l=>l.status!==null),o=((r==null?void 0:r.locations)??[]).filter(l=>l.status!==null);if(!a.length||!o.length){const[l,p]=await Promise.all([o.length?Promise.resolve(o):b.getStorageLocations(),a.length?Promise.resolve(a):b.getStorageWarehouses()]);a=(a.length?a:p??[]).filter(n=>n.status!==null),o=(o.length?o:l??[]).filter(n=>n.status!==null)}return{warehouseRows:a,locationRows:o}})());const{warehouseRows:t,locationRows:s}=await Ie.current;return Tt(t),kt(s),Ot(!0),{warehouseRows:t,locationRows:s}};d.useEffect(()=>{(async()=>{var n;const s=w?it():Promise.resolve({warehouseRows:[],locationRows:[]}),[r,a,o,l]=await Promise.all([b.getBusinesses(),b.getClients(),b.getServices(),s]),p=r??[];if(Ft(p),$t((a??[]).filter(m=>m.status!==null)),Bt((o??[]).filter(m=>m.status!==null)),w&&Se($e(l.warehouseRows)),w||N){const m=p[0];if(m){xe(`${m.id}`);const j=await Ce(m.id);(n=j[0])!=null&&n.id&&te(`${j[0].id}`)}}})()},[]),d.useEffect(()=>{if(!N)return;b.deleted=ve==="deleted";const t=u.current?$(u.current).dxDataGrid("instance"):null;t&&t.refresh()},[ve]);const Lt=()=>{const t=[];je&&t.push(["client_id","=",Number(je)]),ye&&t.push(["created_at",">=",`${ye} 00:00:00`]),Ne&&t.push(["created_at","<=",`${Ne} 23:59:59`]),et(t.length?t.reduce((s,r)=>s.length?[...s,"and",r]:r,[]):null)},At=()=>{Ye(""),Qe(""),Xe(""),et(null)},Mt=t=>{const r=((t==null?void 0:t.data)??[]).reduce((a,o)=>{const l=`${o.currency??"PEN"}`.toUpperCase(),p=Number(o.total||0),n=o.billing_status==="billed"||o.order_status==="invoiced"?p:Number(o.paid_amount||0);return l==="USD"?(a.usdTotal+=p,a.usdBilled+=n):(a.penTotal+=p,a.penBilled+=n),a},{penTotal:0,penBilled:0,usdTotal:0,usdBilled:0});Dt(r)},Ce=async(t,s="")=>{const a=await b.getBranchesByBusiness(t)??[];return Rt(a),te(s?`${s}`:""),a},nt=t=>({...t,total:Number(t.quantity||0)*Number(t.unit_price||0)}),k=(t,s="")=>{var r;return((r=t.current)==null?void 0:r.value)||s||""},at=(t="")=>{const s=`${t??""}`.trim(),r=s.match(/^client-(\d+)$/i);return r?r[1]:s},ot=(t,s=G)=>s.find(r=>S(Ct(r))===S(t)),lt=(t,s=G)=>{var r;return t.warehouse_id||((r=ot(t.warehouse_name,s))==null?void 0:r.id)||""},ct=(t,s=U,r=G)=>{const a=lt(t,r);return s.filter(o=>a&&`${o.warehouse_id}`==`${a}`?!0:S(o.warehouse_name)===S(t.warehouse_name))},dt=(t,s=U,r=G)=>{const a=ct(t,s,r),o=Be(t),l=o.length?a.filter(n=>o.includes(`${n.id}`)):[];return l.length?l:(Array.isArray(t.location_labels)&&t.location_labels.length?t.location_labels:wt(t.location_label)).map(n=>a.find(m=>S(q(m))===S(n))).filter(Boolean)},Gt=(t=[],s=G,r=U)=>{const a=$e(s);return t.forEach(o=>{var j,h;const l=$s(o.description??""),p=a.findIndex(B=>S(B.warehouse_name)===S(l.warehouse_name));if(p<0)return;const n={...a[p],enabled:!0,warehouse_id:((j=ot(a[p].warehouse_name,s))==null?void 0:j.id)??a[p].warehouse_id,location_label:l.location_label,location_labels:l.location_labels,start_date:l.start_date,months:l.months||"",end_date:l.end_date||Ue(l.start_date,l.months),billing_dates:St(l.start_date,l.months),quantity_m3:l.quantity_m3||Number(o.quantity||0)||"",tariff:Number(o.unit_price||0)||"",monthly_amount:Number(o.total||0)||""},m=dt(n,r,s);a[p]={...n,location_id:(h=m[0])!=null&&h.id?`${m[0].id}`:"",location_ids:m.map(B=>`${B.id}`)}}),a},W=(t,s)=>{Se(r=>r.map(a=>{if(a.key!==t)return a;const o="location_ids"in s?(Array.isArray(s.location_ids)?s.location_ids:[s.location_ids]).filter(Boolean).map(m=>`${m}`):null,l=s.location_id?U.find(m=>`${m.id}`==`${s.location_id}`):null,p=o?U.filter(m=>o.includes(`${m.id}`)):null,n={...a,...s,warehouse_id:lt(a)};if(l&&(n.location_label=q(l)),p&&(n.location_ids=o,n.location_id=o[0]??"",n.location_labels=p.map(q).filter(Boolean),n.location_label=n.location_labels.join(", ")),("start_date"in s||"months"in s)&&(n.end_date=Ue(n.start_date,n.months),n.billing_dates=St(n.start_date,n.months)),"quantity_m3"in s||"tariff"in s){const m=ce(n.quantity_m3)*ce(n.tariff);n.monthly_amount=m?m.toFixed(2):""}return n}))},Ut=(t,s,r)=>{Se(a=>a.map(o=>o.key!==t?o:{...o,billing_dates:(o.billing_dates??[]).map((l,p)=>p===s?{...l,date:r}:l)}))},Wt=(t,s)=>{const r=`${s}`,a=Be(t),o=a.includes(r)?a.filter(l=>l!==r):[...a,r];W(t.key,{location_ids:o})},ne=async(t=null)=>{var n,m,j;Pt(!!(t!=null&&t.id)),y.current.value=(t==null?void 0:t.id)??"",v.current.value=(t==null?void 0:t.code)??"Se genera al guardar",I.current.value=Ge(t==null?void 0:t.issue_date)||new Date().toISOString().slice(0,10),K.current.value=Ge(t==null?void 0:t.scheduled_at),J.current.value=Ge(t==null?void 0:t.first_due_date),R.current.value=(t==null?void 0:t.expected_document_type)??(D?"":"Factura");const s=(t==null?void 0:t.currency)??(D?"":"PEN");C.current.value=s,Ke(s||"PEN"),E.current.value=(t==null?void 0:t.billing_cycle)??(N?"Unico":""),de.current&&(de.current.value=(t==null?void 0:t.contract_label)??""),Y.current.value=(t==null?void 0:t.payment_condition)??"Contado",Q.current.value=Number((t==null?void 0:t.installments)??1),ue.current&&(ue.current.value=(t==null?void 0:t.billing_day)??""),P.current.value=(t==null?void 0:t.order_status)??(ie?"approved":"draft"),z.current.value=(t==null?void 0:t.billing_status)??"pending",X.current.value=Number((t==null?void 0:t.tax_amount)??0),L.current.value=(t==null?void 0:t.observations)??"",De(!!((t==null?void 0:t.detraction_enabled)??((t==null?void 0:t.items)??[]).some(h=>Number(h.detraction_percent||0)>0)));const r=t!=null&&t.business_id?`${t.business_id}`:A||((n=pe[0])!=null&&n.id?`${pe[0].id}`:"");xe(r),fe(t!=null&&t.client_id?`${t.client_id}`:"");const a=await Ce(r,(t==null?void 0:t.business_branch_id)??M);!(t!=null&&t.business_branch_id)&&!M&&((m=a[0])!=null&&m.id)&&te(`${a[0].id}`);const o=((t==null?void 0:t.items)??[]).map(h=>{var B,ae;return{uid:crypto.randomUUID(),service_id:`${h.service_id}`,scope:h.scope??((B=h.service)==null?void 0:B.category)??"",gloss:h.gloss??h.description??((ae=h.service)==null?void 0:ae.name)??"",description:h.description??"",quantity:Number(h.quantity||0),unit_price:Number(h.unit_price||0),detraction_percent:Number(h.detraction_percent||0),commission_percent:Number(h.commission_percent||0),total:Number(h.total||0)}});He(((j=o[0])==null?void 0:j.service_id)??"");let l=G,p=U;if(w&&(!l.length||!p.length||!st)){const h=await it();l=h.warehouseRows,p=h.locationRows}Se(w?Gt((t==null?void 0:t.items)??[],l,p):$e()),T(o.length?o:ie?[]:[le()]),$(g.current).modal("show")},O=(t,s,r)=>{T(a=>a.map(o=>{var p;if(o.uid!==t)return o;const l={...o,[s]:r};if(s==="service_id"){const n=Te[r];l.scope=l.scope||(n==null?void 0:n.category)||"",l.gloss=l.gloss||(n==null?void 0:n.name)||"",l.description=l.gloss||l.description||(n==null?void 0:n.name)||"",l.unit_price=Number(((p=C.current)==null?void 0:p.value)==="USD"?n==null?void 0:n.unit_price_usd:n==null?void 0:n.unit_price_pen)||0}return s==="gloss"&&(l.description=r),nt(l)}))},ut=t=>{Ke(t||"PEN"),T(s=>s.map(r=>{if(!r.service_id)return r;const a=Te[r.service_id];return nt({...r,unit_price:Number(t==="USD"?a==null?void 0:a.unit_price_usd:a==null?void 0:a.unit_price_pen)||0})}))},mt=t=>{_.fire({icon:"success",title:"Correcto",text:(t==null?void 0:t.message)||"Orden de servicio guardada correctamente.",timer:1800,showConfirmButton:!1})},pt=async t=>{const s=b.showSavedMessage;b.showSavedMessage=!1;try{return await b.save(t)}finally{b.showSavedMessage=s}},ke=async t=>{var j,h,B,ae;if(t.preventDefault(),w){const f=k(Z,A),Fe=k(me,M),xt=at(k(ee,se)),Ee=k(We,Ve),V=tt.filter(x=>x.enabled),ft=V.find(x=>!Be(x).length||!x.start_date||!x.months||!x.end_date||!x.quantity_m3||!x.tariff);if(!f||!Fe||!xt||!R.current.value||!C.current.value||!Ee){_.fire("Formulario incompleto","Completa empresa, cliente, tipo documento, moneda y tipo de servicio.","warning");return}if(!V.length){_.fire("Formulario incompleto","Selecciona al menos un almacen.","warning");return}if(ft){_.fire("Formulario incompleto",`Completa los datos de ${ft.warehouse_name}.`,"warning");return}const bt=V.find(x=>{const ze=Number.parseInt(x.months,10);return!Array.isArray(x.billing_dates)||x.billing_dates.length!==ze||x.billing_dates.some(Re=>!Re.date)});if(bt){_.fire("Formulario incompleto",`Completa las fechas de facturacion de ${bt.warehouse_name}.`,"warning");return}const vt=V.map(x=>x.start_date).filter(Boolean).sort(),rs=Math.max(...V.map(x=>Number(x.months||1))),Pe=Te[Ee],is={id:y.current.value||void 0,business_id:f||null,business_branch_id:Fe||null,client_id:xt||null,expected_document_type:R.current.value,currency:C.current.value,billing_cycle:(Pe==null?void 0:Pe.name)??"",payment_condition:"Contado",installments:rs||1,issue_date:I.current.value||new Date().toISOString().slice(0,10),scheduled_at:vt[0]??null,first_due_date:vt[0]??null,order_status:P.current.value||"draft",billing_status:z.current.value||"pending",tax_amount:0,observations:L.current.value.trim(),items:V.map(x=>{const ze=dt(x),Re=ce(x.quantity_m3),yt=ce(x.tariff),ns=ce(x.monthly_amount)||Re*yt;return{service_id:Ee,description:Rs(x,ze),quantity:Re,unit_price:yt,detraction_percent:0,commission_percent:0,total:ns,billing_dates:(x.billing_dates??[]).map(as=>as.date)}})},jt=await pt(is);if(!jt)return;$(u.current).dxDataGrid("instance").refresh(),$(g.current).modal("hide"),mt(jt);return}const s=k(Z,A),r=k(me,M),a=at(k(ee,se)),o=re.filter(f=>f.service_id).map(f=>({service_id:f.service_id,scope:f.scope,gloss:f.gloss,description:f.gloss||f.description,quantity:f.quantity,unit_price:f.unit_price,detraction_percent:N&&be?f.detraction_percent||12:f.detraction_percent,commission_percent:f.commission_percent,total:f.total}));if(ie){if(!s||!r||!a||!R.current.value||!C.current.value){_.fire("Formulario incompleto","Completa empresa, cliente, tipo documento y moneda.","warning");return}if(!o.length){_.fire("Formulario incompleto","Agrega al menos un servicio general.","warning");return}}else if(N){if(!s||!r||!a||!R.current.value||!C.current.value||!E.current.value){_.fire("Formulario incompleto","Completa cliente, comprobante, moneda y ciclo de facturacion.","warning");return}if(!o.length){_.fire("Formulario incompleto","Agrega al menos un item de servicio.","warning");return}}const l=o.reduce((f,Fe)=>f+Number(Fe.total||0),0),p=Number(N?(l*.18).toFixed(2):X.current.value||0),n={id:y.current.value||void 0,business_id:s||null,business_branch_id:r||null,client_id:a||null,contract_label:((B=(h=(j=de.current)==null?void 0:j.value)==null?void 0:h.trim)==null?void 0:B.call(h))||null,expected_document_type:R.current.value,currency:C.current.value,billing_cycle:E.current.value.trim(),payment_condition:Y.current.value,installments:Q.current.value,billing_day:((ae=ue.current)==null?void 0:ae.value)||null,detraction_enabled:N?be:!1,issue_date:I.current.value,scheduled_at:K.current.value||null,first_due_date:J.current.value||null,order_status:P.current.value,billing_status:z.current.value,tax_amount:p,observations:L.current.value.trim(),items:o},m=await pt(n);m&&($(u.current).dxDataGrid("instance").refresh(),$(g.current).modal("hide"),mt(m))},Vt=async t=>{const{isConfirmed:s}=await _.fire({title:"Anular orden de servicio",text:"Se dara de baja la orden de servicio.",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, anular",cancelButtonText:"Cancelar"});!s||!await b.delete(t)||$(u.current).dxDataGrid("instance").refresh()},Ht=(t,{data:s})=>{const r=(s==null?void 0:s.order_status)??"",a=document.createElement("span");a.className=`badge ${r==="approved"?"bg-soft-success text-success":r==="cancelled"?"bg-soft-danger text-danger":"bg-soft-warning text-warning"}`,a.textContent=ws(r),t.append(a)},Kt=(t,{data:s})=>{const r=(s==null?void 0:s.billing_status)==="billed"||(s==null?void 0:s.order_status)==="invoiced",a=document.createElement("span");a.className=`badge ${r?"bg-soft-success text-success":"bg-soft-warning text-warning"}`,a.textContent=r?"Facturado":"Pendiente",t.append(a)},Jt=t=>(t.items??[]).map(s=>{var r;return s.gloss||s.description||((r=s.service)==null?void 0:r.name)}).filter(Boolean).join(" | "),Yt=t=>(t==null?void 0:t.billing_status)==="billed"||(t==null?void 0:t.order_status)==="invoiced"?Number((t==null?void 0:t.total)||0):0,gt={caption:"Acciones",width:D?92:150,allowFiltering:!1,allowExporting:!1,cellTemplate:(t,{data:s})=>{t.css("text-overflow","unset"),t.append(Me({className:D?"btn btn-xs btn-soft-warning":"btn btn-xs btn-soft-primary",title:"Editar orden de servicio",icon:"mdi mdi-pencil",onClick:()=>ne(s)})),D||t.append(Me({className:"btn btn-xs btn-soft-danger ms-1",title:"Imprimir PDF",icon:"mdi mdi-file-pdf-box",onClick:()=>bs(vs.serviceOrder(s))})),t.append(Me({className:"btn btn-xs btn-soft-danger ms-1",title:"Anular orden de servicio",icon:D?"mdi mdi-close":"mdi mdi-delete",onClick:()=>Vt(s.id)}))}},Qt=[{dataField:"row_number",caption:"#",width:56,allowFiltering:!1,calculateCellValue:t=>t.id},gt,{dataField:"billing_status",caption:"Estado",width:130,lookup:Le([{value:"pending",label:"Pendiente"},{value:"billed",label:"Facturado"}]),cellTemplate:Kt},{dataField:"code",caption:"Orden Servicio",width:150,cellTemplate:(t,{data:s})=>Nt(t,s==null?void 0:s.code,()=>ne(s),"Editar orden de servicio")},{dataField:"billing_cycle",caption:"Ciclo Facturación",width:155},{dataField:"client.document_number",caption:"Doc. Cliente",width:140},{dataField:"client.full_name",caption:"Cliente",minWidth:200},{dataField:"services_text",caption:"Servicios",minWidth:260,calculateCellValue:Jt},{dataField:"total_prefactures",caption:"Total Prefacturas",width:150,dataType:"number",format:{type:"fixedPoint",precision:2},calculateCellValue:t=>Number(t.total||0)},{dataField:"total",caption:"Total Servicio",width:145,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total_billed",caption:"Total Facturado",width:150,dataType:"number",format:{type:"fixedPoint",precision:2},calculateCellValue:Yt},{dataField:"contract_label",caption:"Contrato",width:150},{dataField:"creator.fullname",caption:"Usuario Registro",minWidth:150,calculateCellValue:t=>_t(t.creator)},{dataField:"created_at",caption:"Fecha Registro",dataType:"datetime",width:170,format:"yyyy-MM-dd HH:mm:ss"}],Xt=[gt,{dataField:"order_status",caption:"Estado",width:115,lookup:Le(hs),cellTemplate:Ht},{dataField:"code",caption:"Codigo",width:125,cellTemplate:(t,{data:s})=>Nt(t,s==null?void 0:s.code,()=>ne(s),"Editar orden de servicio")},{dataField:"business.name",caption:"Empresa",minWidth:170},{dataField:"client.full_name",caption:"Cliente",minWidth:220},{dataField:"expected_document_type",caption:"Tipo comprobante",width:160},{dataField:"currency",caption:"Moneda",width:105,lookup:Le(Ss)},{dataField:"created_at",caption:"Fecha registro",dataType:"datetime",width:170,format:"yyyy-MM-dd HH:mm:ss"},{dataField:"creator.fullname",caption:"Usuario registro",minWidth:160,calculateCellValue:t=>_t(t.creator)}],Zt=D?Xt:Qt,es=re.reduce((t,s)=>t+Number(s.total||0),0),Oe=re.reduce((t,s)=>t+Number(s.total||0),0),ht=Number((Oe*.18).toFixed(2)),ts=Number((Oe+ht).toFixed(2)),qe=It==="USD"?"$":"S/",we=t=>Number(t||0).toFixed(5),ss=N?e.jsxs("div",{className:"service-order-list-panel",children:[e.jsxs("div",{className:"service-order-tabs",children:[e.jsx("button",{type:"button",className:ve==="services"?"active":"",onClick:()=>Je("services"),children:"Servicios"}),e.jsx("button",{type:"button",className:ve==="deleted"?"active":"",onClick:()=>Je("deleted"),children:"OS Eliminadas"})]}),e.jsxs("div",{className:"service-order-filter-panel",children:[e.jsxs("div",{className:"row g-3 align-items-end",children:[e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{className:"form-select",value:je,onChange:t=>Ye(t.target.value),children:[e.jsx("option",{value:"",children:"Todos"}),ge.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} - `:"",t.full_name]},`service-order-filter-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Fecha Registro (Inicio - Fin):"}),e.jsxs("div",{className:"service-order-date-range",children:[e.jsx("input",{type:"date",className:"form-control",value:ye,onChange:t=>Qe(t.target.value)}),e.jsx("input",{type:"date",className:"form-control",value:Ne,onChange:t=>Xe(t.target.value)})]})]})]}),e.jsxs("div",{className:"service-order-filter-actions",children:[e.jsxs("button",{type:"button",className:"btn service-order-outline-btn",onClick:Lt,children:[e.jsx("i",{className:"mdi mdi-filter me-1"})," Filtrar"]}),(je||ye||Ne||Ze)&&e.jsx("button",{type:"button",className:"btn service-order-muted-btn",onClick:At,children:"Limpiar"})]})]}),e.jsxs("div",{className:"service-order-summary",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Importe Total"}),e.jsxs("strong",{className:"text-success",children:["S/ ",we(_e.penTotal)]}),e.jsxs("strong",{className:"text-success",children:["$ ",we(_e.usdTotal)]})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Total Facturado"}),e.jsxs("strong",{className:"text-warning",children:["S/ ",we(_e.penBilled)]}),e.jsxs("strong",{className:"text-warning",children:["$ ",we(_e.usdBilled)]})]})]})]}):i;return e.jsxs(e.Fragment,{children:[N&&e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
        `}),e.jsxs("div",{className:"service-order-action-row",children:[e.jsxs("button",{type:"button",className:"service-order-action-tile primary",onClick:()=>ne(),children:[e.jsxs("span",{children:[e.jsx("i",{className:"mdi mdi-plus-circle-outline me-1"})," Registrar Orden de Servicio"]}),e.jsx("i",{className:"mdi mdi-calendar-month-outline fs-4"})]}),e.jsxs("button",{type:"button",className:"service-order-action-tile warning",onClick:()=>_.fire("Procesar actividades pendientes","Este proceso quedo listo como acceso del modulo. Falta conectar una regla automatica de actividades cuando se defina el flujo operativo.","info"),children:[e.jsxs("span",{children:[e.jsx("i",{className:"mdi mdi-plus-circle-outline me-1"})," Procesar Actividades Pendientes"]}),e.jsx("i",{className:"mdi mdi-calendar-month-outline fs-4"})]})]})]}),e.jsx(gs,{gridRef:u,title:ss,rest:b,pageSize:25,filterValue:N?Ze:null,onRefresh:N?Mt:void 0,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",onClick:()=>$(u.current).dxDataGrid("instance").refresh()}}),N||t.unshift({widget:"dxButton",location:"after",options:{icon:"add",onClick:()=>ne()}})},columns:Zt}),w?e.jsxs(Ae,{modalRef:g,title:e.jsxs("span",{className:"storage-service-order-title",children:[e.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-service-order-dialog modal-dialog-scrollable",contentClass:"storage-service-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-service-order-body",hideFooter:!0,onSubmit:ke,children:[e.jsx("style",{children:`
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
        `}),e.jsx("input",{ref:y,hidden:!0}),e.jsx("input",{ref:v,hidden:!0}),e.jsx("input",{ref:I,type:"date",hidden:!0}),e.jsx("input",{ref:K,type:"date",hidden:!0}),e.jsx("input",{ref:J,type:"date",hidden:!0}),e.jsx("input",{ref:E,hidden:!0}),e.jsx("input",{ref:Y,hidden:!0}),e.jsx("input",{ref:Q,type:"number",hidden:!0}),e.jsx("input",{ref:P,hidden:!0}),e.jsx("input",{ref:z,hidden:!0}),e.jsx("input",{ref:X,type:"number",hidden:!0}),e.jsx("textarea",{ref:L,hidden:!0}),e.jsxs("div",{className:"storage-service-order-actions",children:[e.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]}),e.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[e.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),e.jsx("h3",{className:"storage-service-order-heading",children:"Orden de servicio N°"}),e.jsxs("div",{className:"row g-4 align-items-end",children:[e.jsxs("div",{className:"col-12 col-md-6 col-xl",children:[e.jsx("label",{className:"form-label",children:"Empresa"}),e.jsxs("select",{ref:Z,className:"form-select",value:A,onChange:async t=>{var r;xe(t.target.value);const s=await Ce(t.target.value);te((r=s[0])!=null&&r.id?`${s[0].id}`:"")},required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),pe.map(t=>e.jsx("option",{value:t.id,children:t.name},`storage-order-business-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:ee,className:"form-select",value:se,onChange:t=>fe(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),ge.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} | `:"",t.full_name]},`storage-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Tipo documento"}),e.jsxs("select",{ref:R,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:C,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"PEN",children:"Soles"}),e.jsx("option",{value:"USD",children:"Dolares"})]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Tipo de servicio"}),e.jsxs("select",{ref:We,className:"form-select",value:Ve,onChange:t=>He(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),zt.map(t=>e.jsx("option",{value:t.id,children:t.name},`storage-order-service-${t.id}`))]})]})]}),e.jsx("div",{className:"storage-service-order-separator"}),e.jsx("div",{className:"row g-3",children:tt.map(t=>{const s=ct(t),r=w&&!st,a=!t.enabled||r,o=Be(t),l=s.filter(n=>o.includes(`${n.id}`)),p=qt===t.key;return e.jsx("div",{className:"col-12 col-lg-4",children:e.jsxs("div",{className:"storage-service-card",children:[e.jsxs("div",{className:"storage-service-card-header",children:[e.jsx("input",{type:"checkbox",className:"form-check-input storage-order-checkbox",checked:t.enabled,onChange:n=>{W(t.key,{enabled:n.target.checked}),n.target.checked||rt("")}}),e.jsx("p",{className:"storage-service-card-title",children:t.warehouse_name})]}),e.jsxs("div",{className:"storage-service-card-body",children:[e.jsxs("div",{className:"mb-3",children:[e.jsx("label",{className:"form-label",children:"Ubicación"}),e.jsxs("div",{className:"storage-location-picker",children:[e.jsxs("button",{type:"button",className:"storage-location-picker-toggle",disabled:a,onClick:()=>rt(n=>n===t.key?"":t.key),children:[e.jsxs("span",{className:"storage-location-picker-values",children:[r&&e.jsx("span",{className:"storage-location-picker-placeholder",children:"Cargando ubicaciones..."}),!r&&!l.length&&e.jsx("span",{className:"storage-location-picker-placeholder",children:s.length?"Seleccione ubicaciones":"Sin ubicaciones"}),l.map(n=>e.jsx("span",{className:"storage-location-chip",children:q(n)},`storage-order-location-chip-${t.key}-${n.id}`))]}),e.jsx("i",{className:"mdi mdi-chevron-down"})]}),p&&!a&&e.jsxs("div",{className:"storage-location-picker-menu",children:[!s.length&&e.jsx("div",{className:"storage-location-empty",children:"Sin ubicaciones"}),s.map(n=>{const m=`${n.id}`;return e.jsxs("label",{className:"storage-location-option",children:[e.jsx("input",{type:"checkbox",checked:o.includes(m),onChange:()=>Wt(t,m)}),e.jsx("span",{children:q(n)})]},`storage-order-location-${t.key}-${n.id}`)})]})]})]}),e.jsxs("div",{className:"row g-3 mb-3",children:[e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Fecha de inicio"}),e.jsx("input",{type:"date",className:"form-control",value:t.start_date,disabled:a,onChange:n=>W(t.key,{start_date:n.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Nro de meses"}),e.jsx("input",{type:"number",min:"1",className:"form-control",value:t.months,disabled:a,onChange:n=>W(t.key,{months:n.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Fecha fin"}),e.jsx("input",{type:"date",className:"form-control",value:t.end_date,disabled:!0})]})]}),e.jsxs("div",{className:"row g-3",children:[e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Cantidad de m3"}),e.jsx("input",{type:"number",min:"0",step:"0.001",className:"form-control",value:t.quantity_m3,disabled:a,onChange:n=>W(t.key,{quantity_m3:n.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Tarifa"}),e.jsx("input",{type:"number",min:"0",step:"0.01",className:"form-control",value:t.tariff,disabled:a,onChange:n=>W(t.key,{tariff:n.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Importe mensual"}),e.jsx("input",{type:"number",className:"form-control",value:t.monthly_amount,disabled:!0})]})]}),t.enabled&&(t.billing_dates??[]).length>0&&e.jsx("div",{className:"storage-billing-schedule",children:e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"N° mes"}),e.jsx("th",{children:"Fecha facturación"})]})}),e.jsx("tbody",{children:t.billing_dates.map((n,m)=>e.jsxs("tr",{children:[e.jsx("td",{children:n.month}),e.jsx("td",{children:e.jsx("input",{type:"date",className:"form-control",value:n.date,onChange:j=>Ut(t.key,m,j.target.value),required:t.enabled})})]},`storage-order-billing-${t.key}-${n.month}`))})]})})]})]})},`storage-order-block-${t.key}`)})})]}):ie?e.jsxs(Ae,{modalRef:g,title:e.jsxs("span",{className:"storage-service-order-title",children:[e.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-general-order-dialog modal-dialog-scrollable",contentClass:"storage-general-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-general-order-body",hideFooter:!0,onSubmit:ke,children:[e.jsx("style",{children:`
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
        `}),e.jsx("input",{ref:y,hidden:!0}),e.jsx("input",{ref:v,hidden:!0}),e.jsx("input",{ref:I,type:"date",hidden:!0}),e.jsx("input",{ref:K,type:"date",hidden:!0}),e.jsx("input",{ref:J,type:"date",hidden:!0}),e.jsx("input",{ref:E,hidden:!0}),e.jsx("input",{ref:Y,hidden:!0}),e.jsx("input",{ref:Q,type:"number",hidden:!0}),e.jsx("input",{ref:P,hidden:!0}),e.jsx("input",{ref:z,hidden:!0}),e.jsx("input",{ref:X,type:"number",hidden:!0}),e.jsx("textarea",{ref:L,hidden:!0}),e.jsx("input",{ref:me,type:"hidden",value:M,readOnly:!0}),e.jsxs("div",{className:"storage-general-order-actions",children:[e.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Guardar"]}),e.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[e.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),e.jsx("h3",{className:"storage-general-order-heading",children:"Orden de servicio N°"}),e.jsxs("div",{className:"row g-4 align-items-end",children:[e.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[e.jsx("label",{className:"form-label",children:"Empresa"}),e.jsxs("select",{ref:Z,className:"form-select",value:A,onChange:async t=>{var r;xe(t.target.value);const s=await Ce(t.target.value);te((r=s[0])!=null&&r.id?`${s[0].id}`:"")},required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),pe.map(t=>e.jsx("option",{value:t.id,children:t.name},`general-order-business-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:ee,className:"form-select",value:se,onChange:t=>fe(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),ge.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} | `:"",t.full_name]},`general-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[e.jsx("label",{className:"form-label",children:"Tipo documento"}),e.jsxs("select",{ref:R,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:C,className:"form-select",onChange:t=>ut(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"PEN",children:"Soles"}),e.jsx("option",{value:"USD",children:"Dolares"})]})]})]}),e.jsx("div",{className:"mt-4 mb-3",children:e.jsxs("button",{type:"button",className:"btn btn-outline-primary storage-general-insert",onClick:()=>T(t=>[...t,le()]),children:[e.jsx("i",{className:"mdi mdi-plus-circle me-1"})," Insertar servicio general"]})}),e.jsx("div",{className:"table-responsive",children:e.jsxs("table",{className:"storage-general-lines",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Servicio"}),e.jsx("th",{style:{width:115},children:"Tarifa"}),e.jsx("th",{style:{width:115},children:"Cantidad"}),e.jsx("th",{style:{width:130},children:"Total"}),e.jsx("th",{style:{width:42}})]})}),e.jsx("tbody",{children:re.map(t=>e.jsxs("tr",{children:[e.jsx("td",{children:e.jsxs("select",{className:"form-select",value:t.service_id,onChange:s=>O(t.uid,"service_id",s.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione servicio"}),he.map(s=>e.jsx("option",{value:s.id,children:s.name},`general-order-service-${s.id}`))]})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.01",className:"form-control",value:t.unit_price,onChange:s=>O(t.uid,"unit_price",s.target.value)})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.001",min:"0",className:"form-control",value:t.quantity,onChange:s=>O(t.uid,"quantity",s.target.value)})}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:Number(t.total||0).toFixed(2),disabled:!0})}),e.jsx("td",{children:e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>T(s=>s.filter(r=>r.uid!==t.uid)),children:e.jsx("i",{className:"mdi mdi-close"})})})]},`general-order-item-${t.uid}`))}),e.jsx("tfoot",{children:e.jsxs("tr",{children:[e.jsx("td",{colSpan:"3",className:"storage-general-total-label",children:"Total"}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:es.toFixed(2),disabled:!0})}),e.jsx("td",{})]})})]})})]}):e.jsxs(Ae,{modalRef:g,title:Et?"Editar orden de servicio":"Registrar orden de servicio",size:"xl",bodyClass:"service-order-form-modal-body",btnCancelText:"Cerrar",btnSubmitText:"Guardar",onSubmit:ke,children:[e.jsx("style",{children:`
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
      `}),e.jsx("input",{ref:y,hidden:!0}),e.jsx("input",{ref:v,hidden:!0,readOnly:!0}),e.jsx("input",{ref:Z,type:"hidden",value:A,readOnly:!0}),e.jsx("input",{ref:me,type:"hidden",value:M,readOnly:!0}),e.jsx("input",{ref:I,type:"hidden"}),e.jsx("input",{ref:K,type:"hidden"}),e.jsx("input",{ref:J,type:"hidden"}),e.jsx("input",{ref:Q,type:"hidden",defaultValue:"1"}),e.jsx("input",{ref:P,type:"hidden",defaultValue:"draft"}),e.jsx("input",{ref:z,type:"hidden",defaultValue:"pending"}),e.jsx("input",{ref:X,type:"hidden"}),e.jsx("textarea",{ref:L,hidden:!0}),e.jsxs("div",{className:"row g-3",children:[e.jsx("div",{className:"col-12",children:e.jsx("h5",{className:"service-order-form-section-title",children:"Datos de la orden"})}),e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:ee,className:"form-select",value:se,onChange:t=>fe(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),ge.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} - `:"",t.display_name??t.full_name]},`service-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Contrato"}),e.jsx("input",{ref:de,className:"form-control",placeholder:"Seleccionar"})]}),e.jsxs("div",{className:"col-12 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Ciclo de facturación"}),e.jsxs("select",{ref:E,className:"form-select",required:!0,children:[e.jsx("option",{value:"Unico",children:"Unico"}),e.jsx("option",{value:"Mensual",children:"Mensual"}),e.jsx("option",{value:"Eventual",children:"Eventual"})]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:C,className:"form-select",onChange:t=>ut(t.target.value),required:!0,children:[e.jsx("option",{value:"PEN",children:"S/ | Soles"}),e.jsx("option",{value:"USD",children:"$ | Dolares"})]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-lg-3",children:[e.jsx("label",{className:"form-label",children:"Comprobante"}),e.jsxs("select",{ref:R,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]})]}),e.jsx("hr",{className:"my-4"}),e.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[e.jsx("h5",{className:"service-order-form-section-title",children:"Detalle de servicios"}),e.jsxs("button",{type:"button",className:"btn btn-sm btn-primary",onClick:()=>T(t=>[...t,le()]),children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Agregar item"]})]}),e.jsx("div",{className:"service-order-items-wrapper",children:e.jsxs("table",{className:"table table-sm table-bordered align-middle service-order-items-table mb-0",children:[e.jsx("thead",{className:"table-light",children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:48},children:"#"}),e.jsx("th",{children:"Servicio"}),e.jsx("th",{style:{width:170},children:"Alcance"}),e.jsx("th",{children:"Glosa"}),e.jsxs("th",{style:{width:135},children:["P. Unit.",e.jsx("br",{}),"(Sin IGV)"]}),e.jsx("th",{style:{width:130},children:"Subtotal"}),e.jsx("th",{style:{width:42}})]})}),e.jsx("tbody",{children:re.map((t,s)=>e.jsxs("tr",{children:[e.jsx("td",{children:s+1}),e.jsx("td",{children:e.jsxs("select",{className:"form-select",value:t.service_id,onChange:r=>O(t.uid,"service_id",r.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione servicio"}),he.map(r=>e.jsxs("option",{value:r.id,children:[r.code?`${r.code} - `:"",r.name]},`service-order-item-${r.id}`))]})}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:t.scope,onChange:r=>O(t.uid,"scope",r.target.value)})}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:t.gloss,onChange:r=>O(t.uid,"gloss",r.target.value)})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control text-end",value:t.unit_price,onChange:r=>O(t.uid,"unit_price",r.target.value)})}),e.jsx("td",{children:e.jsx("input",{className:"form-control text-end",value:Number(t.total||0).toFixed(2),disabled:!0})}),e.jsx("td",{children:e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>T(r=>r.length===1?[le()]:r.filter(a=>a.uid!==t.uid)),children:e.jsx("i",{className:"mdi mdi-close"})})})]},`service-order-item-row-${t.uid}`))})]})}),e.jsxs("div",{className:"service-order-summary mt-3",children:[e.jsxs("div",{className:"service-order-summary-row",children:[e.jsxs("span",{className:"service-order-summary-label",children:["Gravadas: ",qe]}),e.jsx("input",{className:"form-control text-end",value:Oe.toFixed(2),disabled:!0})]}),e.jsxs("div",{className:"service-order-summary-row",children:[e.jsxs("span",{className:"service-order-summary-label",children:["I.G.V.: ",qe]}),e.jsx("input",{className:"form-control text-end",value:ht.toFixed(2),disabled:!0})]}),e.jsxs("div",{className:"service-order-summary-row",children:[e.jsxs("span",{className:"service-order-summary-label",children:["Total: ",qe]}),e.jsx("input",{className:"form-control text-end",value:ts.toFixed(2),disabled:!0})]})]}),e.jsx("hr",{className:"my-4"}),e.jsxs("div",{className:"row g-3 align-items-end",children:[e.jsxs("div",{className:"col-12 col-lg-4",children:[e.jsx("label",{className:"form-label",children:"Detracción"}),e.jsxs("div",{className:"service-order-detraction-options",children:[e.jsxs("div",{className:"form-check",children:[e.jsx("input",{className:"form-check-input",id:"service-order-detraction-no",type:"radio",name:"service-order-detraction",checked:!be,onChange:()=>De(!1)}),e.jsx("label",{className:"form-check-label",htmlFor:"service-order-detraction-no",children:"No"})]}),e.jsxs("div",{className:"form-check",children:[e.jsx("input",{className:"form-check-input",id:"service-order-detraction-yes",type:"radio",name:"service-order-detraction",checked:be,onChange:()=>De(!0)}),e.jsx("label",{className:"form-check-label",htmlFor:"service-order-detraction-yes",children:"Si"})]})]})]}),e.jsxs("div",{className:"col-12 col-lg-6",children:[e.jsx("label",{className:"form-label",children:"Forma de pago"}),e.jsxs("select",{ref:Y,className:"form-select",children:[e.jsx("option",{value:"Contado",children:"Contado"}),e.jsx("option",{value:"Credito",children:"Credito"})]})]}),e.jsxs("div",{className:"col-12 col-lg-2",children:[e.jsx("label",{className:"form-label",children:"Día facturación"}),e.jsxs("select",{ref:ue,className:"form-select",children:[e.jsx("option",{value:"",children:"Seleccionar"}),Array.from({length:31},(t,s)=>s+1).map(t=>e.jsx("option",{value:t,children:t},`service-order-billing-day-${t}`))]})]})]})]})]})};us((i,c)=>{const u=c.requiredPermission??"services-service-order";!c.can(u)&&!c.hasRole("Admin")&&(location.href="/admin/"),ms(i).render(e.jsx(ps,{...c,title:c.moduleTitle??"Ordenes de servicio",children:e.jsx(Bs,{...c})}))});
