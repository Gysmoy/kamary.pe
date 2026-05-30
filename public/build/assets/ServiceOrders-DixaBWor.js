var ls=Object.defineProperty;var os=(r,l,u)=>l in r?ls(r,l,{enumerable:!0,configurable:!0,writable:!0,value:u}):r[l]=u;var B=(r,l,u)=>os(r,typeof l!="symbol"?l+"":l,u);import{m as cs,t as ds,C as us,c as ms,j as t,r as d,S as w}from"./CreateReactScript-Cised0hN.js";import{B as ps}from"./Base-BZoBWQyI.js";import{T as gs,t as Ae,G as hs,u as xs}from"./Table-dHEiAauX.js";import{M as Me}from"./Modal-CYm1KmYg.js";import{D as Ge}from"./DxButton-CsjWvhyj.js";import{B as fs}from"./BasicRest-D5Ch2D2X.js";import{a as J}from"./permissionScope-Be8AULz2.js";import{r as Nt}from"./renderGridEditLink-D8NGEeKJ.js";import{o as bs,b as vs}from"./magistralesRecordPdf-BK5vD7lh.js";import"./ubigeoInei-D0FnAslC.js";const de=async(r,l={})=>{try{const{status:u,result:x}=await cs.Fetch(r,{method:"POST",body:JSON.stringify({take:1e3,skip:0,isLoadingAll:!0,...l})});if(!u)throw new Error((x==null?void 0:x.message)||"No se pudo cargar la lista");return(x==null?void 0:x.data)??[]}catch(u){return ds.error("Error",{description:u.message,duration:3e3,richColors:!0}),[]}},js=()=>location.pathname.includes("/admin/storage-general-service-orders"),ys=()=>location.pathname.includes("/admin/storage-service-orders");class _s extends fs{constructor(){super(...arguments);B(this,"path",J()?js()?"admin/storage/general-service-orders":"admin/storage/service-orders":"admin/service-orders");B(this,"deleted",!1);B(this,"getBranchesByBusiness",async u=>u?await this.simpleGet(`/api/${this.path}/businesses/${u}/branches`)??[]:[]);B(this,"getBusinesses",async()=>await de("/api/admin/businesses/paginate"));B(this,"getClients",async()=>await de(J()?"/api/admin/storage/clients/paginate":"/api/admin/services-client/paginate"));B(this,"getServices",async()=>await de(J()?"/api/admin/storage/general-service/paginate":"/api/admin/services/paginate",ys()?{storage_service_types:!0}:{}));B(this,"getStorageOptions",async()=>J()?await this.simpleGet("/api/admin/storage/kardex/options"):null);B(this,"getStorageWarehouses",async()=>J()?await de("/api/admin/storage/kardex/paginate",{section:"warehouses",sort:[{selector:"warehouse_name",desc:!1}]}):[]);B(this,"getStorageLocations",async()=>J()?await de("/api/admin/storage/kardex/paginate",{section:"locations"}):[])}async paginate(u){return await super.paginate({...u,deleted:this.deleted})}}const v=new _s,St=r=>(r==null?void 0:r.fullname)||[r==null?void 0:r.name,r==null?void 0:r.lastname].filter(Boolean).join(" ")||(r==null?void 0:r.username)||"",ue=()=>({uid:crypto.randomUUID(),service_id:"",scope:"",gloss:"",description:"",quantity:1,unit_price:0,detraction_percent:0,commission_percent:0,total:0}),F=(r="")=>r.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""),Ns=["Servicio de almacenamiento","Servicio de almacenamiento - Adicional"],Ss=[{value:"PEN",label:"Soles"},{value:"USD",label:"Dolares"}],wt=r=>(r==null?void 0:r.name)??(r==null?void 0:r.warehouse_name)??"",Cs=r=>(r==null?void 0:r.id)??(r==null?void 0:r.warehouse_id)??"",ws=r=>r==="approved"?"Aprobado":xs(r),$s=r=>{const l=Cs(r),u=wt(r);return{key:l?`warehouse-${l}`:F(u),warehouse_name:u,warehouse_id:l?`${l}`:"",enabled:!1,location_id:"",location_ids:[],location_label:"",location_labels:[],start_date:"",months:"",end_date:"",billing_dates:[],quantity_m3:"",tariff:"",monthly_amount:""}},Re=(r=[])=>r.filter(l=>(l==null?void 0:l.status)!==null).map($s),We=r=>{var l,u,x;return((x=(l=r==null?void 0:r.toString)==null?void 0:(u=l.call(r)).slice)==null?void 0:x.call(u,0,10))??""},me=r=>Number(r||0),Ue=(r,l,u=!1)=>{if(!r)return"";const x=Number(l);if(!Number.isFinite(x)||x<0||!u&&x<=0)return"";const _=new Date(`${r}T00:00:00`);if(Number.isNaN(_.getTime()))return"";const j=new Date(_),T=j.getDate();return j.setDate(1),j.setMonth(j.getMonth()+x),j.setDate(Math.min(T,new Date(j.getFullYear(),j.getMonth()+1,0).getDate())),j.toISOString().slice(0,10)},Ct=(r,l)=>{const u=Number.parseInt(l,10);return!r||!Number.isFinite(u)||u<=0?[]:Array.from({length:u},(x,_)=>({month:_+1,date:Ue(r,_,!0)}))},z=r=>r?[r.code,r.temperature_range].filter(Boolean).join(" | "):"",$t=(r="")=>r.split(",").map(l=>l.trim()).filter(Boolean),Be=r=>Array.isArray(r.location_ids)?r.location_ids.filter(Boolean).map(l=>`${l}`):r.location_id?[`${r.location_id}`]:[],Fs=(r,l)=>[r.warehouse_name,(Array.isArray(l)?l.map(z).filter(Boolean).join(", "):z(l))||r.location_label,`${r.start_date||""} - ${r.end_date||""}`,`${r.months||0} meses`,`${r.quantity_m3||0} m3`].filter(Boolean).join("; "),Rs=(r="")=>{const l=r.split(";").map(x=>x.trim()),u=(l[2]??"").split("-").map(x=>x.trim());return{warehouse_name:l[0]??"",location_label:l[1]??"",location_labels:$t(l[1]??""),start_date:u.length>=3?`${u[0]}-${u[1]}-${u[2]}`.slice(0,10):"",end_date:u.length>=6?`${u[3]}-${u[4]}-${u[5]}`.slice(0,10):"",months:parseFloat(l[3])||"",quantity_m3:parseFloat(l[4])||""}},Bs=({moduleTitle:r="Ordenes de servicio",serviceOrderType:l="service"})=>{const u=d.useRef(),x=d.useRef(),_=d.useRef(),j=d.useRef(),T=d.useRef(),Y=d.useRef(),Q=d.useRef(),I=d.useRef(),R=d.useRef(),L=d.useRef(),pe=d.useRef(),X=d.useRef(),Z=d.useRef(),ge=d.useRef(),A=d.useRef(),M=d.useRef(),ee=d.useRef(),G=d.useRef(),Ie=d.useRef(null),te=d.useRef(),he=d.useRef(),se=d.useRef(),Ve=d.useRef(),[xe,Ft]=d.useState([]),[Is,Rt]=d.useState([]),[fe,Bt]=d.useState([]),[be,It]=d.useState([]),[W,ve]=d.useState(""),[U,ie]=d.useState(""),[S,je]=d.useState(""),[He,Ke]=d.useState(""),[Dt,Je]=d.useState("PEN"),[De,Ye]=d.useState(!1),[O,Qe]=d.useState("services"),[ye,Xe]=d.useState(""),[_e,Ze]=d.useState(""),[Ne,et]=d.useState(""),[tt,st]=d.useState(null),[Se,it]=d.useState({penTotal:0,penBilled:0,usdTotal:0,usdBilled:0}),[re,q]=d.useState([ue()]),[V,Tt]=d.useState([]),[ne,kt]=d.useState([]),[rt,ae]=d.useState(()=>Re()),[nt,Ot]=d.useState(!1),[qt,Te]=d.useState(""),[Et,Pt]=d.useState(!1),le=l==="storage_general",C=l==="storage_service",N=le||C,y=!N,zt=be.filter(e=>Ns.some(s=>F(s)===F(e.name))),ke=Object.fromEntries(be.map(e=>[`${e.id}`,e])),at=async()=>{if(!C)return{warehouseRows:[],locationRows:[]};Ie.current||(Ie.current=(async()=>{const i=await v.getStorageOptions();let n=((i==null?void 0:i.warehouses)??[]).filter(c=>c.status!==null),a=((i==null?void 0:i.locations)??[]).filter(c=>c.status!==null);if(!n.length||!a.length){const[c,m]=await Promise.all([a.length?Promise.resolve(a):v.getStorageLocations(),n.length?Promise.resolve(n):v.getStorageWarehouses()]);n=(n.length?n:m??[]).filter(p=>p.status!==null),a=(a.length?a:c??[]).filter(p=>p.status!==null)}return{warehouseRows:n,locationRows:a}})());const{warehouseRows:e,locationRows:s}=await Ie.current;return Tt(e),kt(s),Ot(!0),{warehouseRows:e,locationRows:s}};d.useEffect(()=>{(async()=>{var p;const s=C?at():Promise.resolve({warehouseRows:[],locationRows:[]}),[i,n,a,c]=await Promise.all([v.getBusinesses(),v.getClients(),v.getServices(),s]),m=i??[];if(Ft(m),Bt((n??[]).filter(o=>o.status!==null)),It((a??[]).filter(o=>o.status!==null)),C&&ae(Re(c.warehouseRows)),C||y){const o=m[0];if(o){ve(`${o.id}`);const h=await Ce(o.id);(p=h[0])!=null&&p.id&&ie(`${h[0].id}`)}}})()},[]),d.useLayoutEffect(()=>{if(!y)return;v.deleted=O==="deleted",it({penTotal:0,penBilled:0,usdTotal:0,usdBilled:0});const e=u.current?$(u.current).dxDataGrid("instance"):null;e&&(e.pageIndex(0),e.getDataSource().reload())},[O]);const Lt=()=>{const e=[];ye&&e.push(["client_id","=",Number(ye)]),_e&&e.push(["created_at",">=",`${_e} 00:00:00`]),Ne&&e.push(["created_at","<=",`${Ne} 23:59:59`]),st(e.length?e.reduce((s,i)=>s.length?[...s,"and",i]:i,[]):null)},At=()=>{Xe(""),Ze(""),et(""),st(null)},Mt=e=>{const i=((e==null?void 0:e.data)??[]).reduce((n,a)=>{const c=`${a.currency??"PEN"}`.toUpperCase(),m=Number(a.total||0),p=a.billing_status==="billed"||a.order_status==="invoiced"?m:Number(a.paid_amount||0);return c==="USD"?(n.usdTotal+=m,n.usdBilled+=p):(n.penTotal+=m,n.penBilled+=p),n},{penTotal:0,penBilled:0,usdTotal:0,usdBilled:0});it(i)},Ce=async(e,s="")=>{const n=await v.getBranchesByBusiness(e)??[];return Rt(n),ie(s?`${s}`:""),n},lt=e=>({...e,total:Number(e.quantity||0)*Number(e.unit_price||0)}),E=(e,s="")=>{var i;return((i=e.current)==null?void 0:i.value)||s||""},oe=(e="")=>{const s=`${e??""}`.trim(),i=s.match(/^client-(\d+)$/i);return i?i[1]:s},ot=(e,s=V)=>s.find(i=>F(wt(i))===F(e)),ct=(e,s=V)=>{var i;return e.warehouse_id||((i=ot(e.warehouse_name,s))==null?void 0:i.id)||""},dt=(e,s=ne,i=V,n=S)=>{const a=ct(e,i),c=oe(n);return s.filter(m=>!c||`${m.client_id??""}`!=`${c}`?!1:a&&`${m.warehouse_id}`==`${a}`?!0:F(m.warehouse_name)===F(e.warehouse_name))},ut=(e,s=ne,i=V,n=S)=>{const a=dt(e,s,i,n),c=Be(e),m=c.length?a.filter(o=>c.includes(`${o.id}`)):[];return m.length?m:(Array.isArray(e.location_labels)&&e.location_labels.length?e.location_labels:$t(e.location_label)).map(o=>a.find(h=>F(z(h))===F(o))).filter(Boolean)},Gt=(e=[],s=V,i=ne,n=S)=>{const a=Re(s);return e.forEach(c=>{var g,k;const m=Rs(c.description??""),p=a.findIndex(D=>F(D.warehouse_name)===F(m.warehouse_name));if(p<0)return;const o={...a[p],enabled:!0,warehouse_id:((g=ot(a[p].warehouse_name,s))==null?void 0:g.id)??a[p].warehouse_id,location_label:m.location_label,location_labels:m.location_labels,start_date:m.start_date,months:m.months||"",end_date:m.end_date||Ue(m.start_date,m.months),billing_dates:Ct(m.start_date,m.months),quantity_m3:m.quantity_m3||Number(c.quantity||0)||"",tariff:Number(c.unit_price||0)||"",monthly_amount:Number(c.total||0)||""},h=ut(o,i,s,n);a[p]={...o,location_id:(k=h[0])!=null&&k.id?`${h[0].id}`:"",location_ids:h.map(D=>`${D.id}`)}}),a},H=(e,s)=>{ae(i=>i.map(n=>{if(n.key!==e)return n;const a="location_ids"in s?(Array.isArray(s.location_ids)?s.location_ids:[s.location_ids]).filter(Boolean).map(g=>`${g}`):null,c=oe(S),m=ne.filter(g=>c&&`${g.client_id??""}`==`${c}`),p=s.location_id?m.find(g=>`${g.id}`==`${s.location_id}`):null,o=a?m.filter(g=>a.includes(`${g.id}`)):null,h={...n,...s,warehouse_id:ct(n)};if(p&&(h.location_label=z(p)),o&&(h.location_ids=a,h.location_id=a[0]??"",h.location_labels=o.map(z).filter(Boolean),h.location_label=h.location_labels.join(", ")),("start_date"in s||"months"in s)&&(h.end_date=Ue(h.start_date,h.months),h.billing_dates=Ct(h.start_date,h.months)),"quantity_m3"in s||"tariff"in s){const g=me(h.quantity_m3)*me(h.tariff);h.monthly_amount=g?g.toFixed(2):""}return h}))},Wt=(e,s,i)=>{ae(n=>n.map(a=>a.key!==e?a:{...a,billing_dates:(a.billing_dates??[]).map((c,m)=>m===s?{...c,date:i}:c)}))},Ut=(e,s)=>{const i=`${s}`,n=Be(e),a=n.includes(i)?n.filter(c=>c!==i):[...n,i];H(e.key,{location_ids:a})},ce=async(e=null)=>{var p,o,h;Pt(!!(e!=null&&e.id)),_.current.value=(e==null?void 0:e.id)??"",j.current.value=(e==null?void 0:e.code)??"Se genera al guardar",T.current.value=We(e==null?void 0:e.issue_date)||new Date().toISOString().slice(0,10),Y.current.value=We(e==null?void 0:e.scheduled_at),Q.current.value=We(e==null?void 0:e.first_due_date),I.current.value=(e==null?void 0:e.expected_document_type)??(N?"":"Factura");const s=(e==null?void 0:e.currency)??(N?"":"PEN");R.current.value=s,Je(s||"PEN"),L.current.value=(e==null?void 0:e.billing_cycle)??(y?"Unico":""),pe.current&&(pe.current.value=(e==null?void 0:e.contract_label)??""),X.current.value=(e==null?void 0:e.payment_condition)??"Contado",Z.current.value=Number((e==null?void 0:e.installments)??1),ge.current&&(ge.current.value=(e==null?void 0:e.billing_day)??""),A.current.value=(e==null?void 0:e.order_status)??(le?"approved":"draft"),M.current.value=(e==null?void 0:e.billing_status)??"pending",ee.current.value=Number((e==null?void 0:e.tax_amount)??0),G.current.value=(e==null?void 0:e.observations)??"",Ye(!!((e==null?void 0:e.detraction_enabled)??((e==null?void 0:e.items)??[]).some(g=>Number(g.detraction_percent||0)>0)));const i=e!=null&&e.business_id?`${e.business_id}`:W||((p=xe[0])!=null&&p.id?`${xe[0].id}`:"");ve(i),je(e!=null&&e.client_id?`${e.client_id}`:"");const n=await Ce(i,(e==null?void 0:e.business_branch_id)??U);!(e!=null&&e.business_branch_id)&&!U&&((o=n[0])!=null&&o.id)&&ie(`${n[0].id}`);const a=((e==null?void 0:e.items)??[]).map(g=>{var k,D;return{uid:crypto.randomUUID(),service_id:`${g.service_id}`,scope:g.scope??((k=g.service)==null?void 0:k.category)??"",gloss:g.gloss??g.description??((D=g.service)==null?void 0:D.name)??"",description:g.description??"",quantity:Number(g.quantity||0),unit_price:Number(g.unit_price||0),detraction_percent:Number(g.detraction_percent||0),commission_percent:Number(g.commission_percent||0),total:Number(g.total||0)}});Ke(((h=a[0])==null?void 0:h.service_id)??"");let c=V,m=ne;if(C&&(!c.length||!m.length||!nt)){const g=await at();c=g.warehouseRows,m=g.locationRows}ae(C?Gt((e==null?void 0:e.items)??[],c,m,e!=null&&e.client_id?`${e.client_id}`:S):Re()),q(a.length?a:le?[]:[ue()]),$(x.current).modal("show")},P=(e,s,i)=>{q(n=>n.map(a=>{var m;if(a.uid!==e)return a;const c={...a,[s]:i};if(s==="service_id"){const p=ke[i];c.scope=c.scope||(p==null?void 0:p.category)||"",c.gloss=c.gloss||(p==null?void 0:p.name)||"",c.description=c.gloss||c.description||(p==null?void 0:p.name)||"",c.unit_price=Number(((m=R.current)==null?void 0:m.value)==="USD"?p==null?void 0:p.unit_price_usd:p==null?void 0:p.unit_price_pen)||0}return s==="gloss"&&(c.description=i),lt(c)}))},mt=e=>{Je(e||"PEN"),q(s=>s.map(i=>{if(!i.service_id)return i;const n=ke[i.service_id];return lt({...i,unit_price:Number(e==="USD"?n==null?void 0:n.unit_price_usd:n==null?void 0:n.unit_price_pen)||0})}))},pt=e=>{w.fire({icon:"success",title:"Correcto",text:(e==null?void 0:e.message)||"Orden de servicio guardada correctamente.",timer:1800,showConfirmButton:!1})},gt=async e=>{const s=v.showSavedMessage;v.showSavedMessage=!1;try{return await v.save(e)}finally{v.showSavedMessage=s}},Oe=async e=>{var h,g,k,D;if(e.preventDefault(),C){const b=E(te,W),$e=E(he,U),ft=oe(E(se,S)),Pe=E(Ve,He),K=rt.filter(f=>f.enabled),bt=K.find(f=>!Be(f).length||!f.start_date||!f.months||!f.end_date||!f.quantity_m3||!f.tariff);if(!b||!$e||!ft||!I.current.value||!R.current.value||!Pe){w.fire("Formulario incompleto","Completa empresa, cliente, tipo documento, moneda y tipo de servicio.","warning");return}if(!K.length){w.fire("Formulario incompleto","Selecciona al menos un almacen.","warning");return}if(bt){w.fire("Formulario incompleto",`Completa los datos de ${bt.warehouse_name}.`,"warning");return}const vt=K.find(f=>{const Le=Number.parseInt(f.months,10);return!Array.isArray(f.billing_dates)||f.billing_dates.length!==Le||f.billing_dates.some(Fe=>!Fe.date)});if(vt){w.fire("Formulario incompleto",`Completa las fechas de facturacion de ${vt.warehouse_name}.`,"warning");return}const jt=K.map(f=>f.start_date).filter(Boolean).sort(),is=Math.max(...K.map(f=>Number(f.months||1))),ze=ke[Pe],rs={id:_.current.value||void 0,business_id:b||null,business_branch_id:$e||null,client_id:ft||null,expected_document_type:I.current.value,currency:R.current.value,billing_cycle:(ze==null?void 0:ze.name)??"",payment_condition:"Contado",installments:is||1,issue_date:T.current.value||new Date().toISOString().slice(0,10),scheduled_at:jt[0]??null,first_due_date:jt[0]??null,order_status:A.current.value||"draft",billing_status:M.current.value||"pending",tax_amount:0,observations:G.current.value.trim(),items:K.map(f=>{const Le=ut(f),Fe=me(f.quantity_m3),_t=me(f.tariff),ns=me(f.monthly_amount)||Fe*_t;return{service_id:Pe,description:Fs(f,Le),quantity:Fe,unit_price:_t,detraction_percent:0,commission_percent:0,total:ns,billing_dates:(f.billing_dates??[]).map(as=>as.date)}})},yt=await gt(rs);if(!yt)return;$(u.current).dxDataGrid("instance").refresh(),$(x.current).modal("hide"),pt(yt);return}const s=E(te,W),i=E(he,U),n=oe(E(se,S)),a=re.filter(b=>b.service_id).map(b=>({service_id:b.service_id,scope:b.scope,gloss:b.gloss,description:b.gloss||b.description,quantity:b.quantity,unit_price:b.unit_price,detraction_percent:y&&De?b.detraction_percent||12:b.detraction_percent,commission_percent:b.commission_percent,total:b.total}));if(le){if(!s||!i||!n||!I.current.value||!R.current.value){w.fire("Formulario incompleto","Completa empresa, cliente, tipo documento y moneda.","warning");return}if(!a.length){w.fire("Formulario incompleto","Agrega al menos un servicio general.","warning");return}}else if(y){if(!s||!i||!n||!I.current.value||!R.current.value||!L.current.value){w.fire("Formulario incompleto","Completa cliente, comprobante, moneda y ciclo de facturacion.","warning");return}if(!a.length){w.fire("Formulario incompleto","Agrega al menos un item de servicio.","warning");return}}const c=a.reduce((b,$e)=>b+Number($e.total||0),0),m=Number(y?(c*.18).toFixed(2):ee.current.value||0),p={id:_.current.value||void 0,business_id:s||null,business_branch_id:i||null,client_id:n||null,contract_label:((k=(g=(h=pe.current)==null?void 0:h.value)==null?void 0:g.trim)==null?void 0:k.call(g))||null,expected_document_type:I.current.value,currency:R.current.value,billing_cycle:L.current.value.trim(),payment_condition:X.current.value,installments:Z.current.value,billing_day:((D=ge.current)==null?void 0:D.value)||null,detraction_enabled:y?De:!1,issue_date:T.current.value,scheduled_at:Y.current.value||null,first_due_date:Q.current.value||null,order_status:A.current.value,billing_status:M.current.value,tax_amount:m,observations:G.current.value.trim(),items:a},o=await gt(p);o&&($(u.current).dxDataGrid("instance").refresh(),$(x.current).modal("hide"),pt(o))},Vt=async e=>{const s=typeof e=="object"?e==null?void 0:e.id:e;if(!s||(e==null?void 0:e.order_status)==="cancelled"||(e==null?void 0:e.status)===null)return;const{isConfirmed:i}=await w.fire({title:"Anular orden de servicio",text:N?"La orden quedara anulada y se mantendra visible en el historial.":"Se dara de baja la orden de servicio.",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, anular",cancelButtonText:"Cancelar"});!i||!(N?await v.boolean({id:s,field:"order_status",value:"cancelled"}):await v.delete(s))||$(u.current).dxDataGrid("instance").refresh()},Ht=(e,{data:s})=>{const i=(s==null?void 0:s.order_status)??"",n=document.createElement("span");n.className=`badge ${i==="approved"?"bg-soft-success text-success":i==="cancelled"?"bg-soft-danger text-danger":"bg-soft-warning text-warning"}`,n.textContent=ws(i),e.append(n)},Kt=(e,{data:s})=>{const i=(s==null?void 0:s.billing_status)==="billed"||(s==null?void 0:s.order_status)==="invoiced",n=document.createElement("span");n.className=`badge ${i?"bg-soft-success text-success":"bg-soft-warning text-warning"}`,n.textContent=i?"Facturado":"Pendiente",e.append(n)},Jt=e=>(e.items??[]).map(s=>{var i;return s.gloss||s.description||((i=s.service)==null?void 0:i.name)}).filter(Boolean).join(" | "),Yt=e=>(e==null?void 0:e.billing_status)==="billed"||(e==null?void 0:e.order_status)==="invoiced"?Number((e==null?void 0:e.total)||0):0,ht={caption:"Acciones",width:N?136:150,minWidth:N?136:150,fixed:N,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:s})=>{const i=(s==null?void 0:s.order_status)==="cancelled"||(s==null?void 0:s.status)===null;e.css({overflow:"visible",textOverflow:"unset",whiteSpace:"nowrap"});const n=$("<div>").css({display:"flex",alignItems:"center",gap:"0.35rem",minWidth:"max-content"});e.append(n),n.append(Ge({className:N?"btn btn-xs btn-soft-warning":"btn btn-xs btn-soft-primary",title:"Editar orden de servicio",icon:"mdi mdi-pencil",onClick:()=>ce(s)})),N||n.append(Ge({className:"btn btn-xs btn-soft-danger",title:"Imprimir PDF",icon:"mdi mdi-file-pdf-box",onClick:()=>bs(vs.serviceOrder(s))})),i||n.append(Ge({className:"btn btn-xs btn-soft-danger",title:"Anular orden de servicio",icon:N?"mdi mdi-close":"mdi mdi-delete",onClick:()=>Vt(s)}))}},Qt=[{dataField:"client_id",caption:"Cliente ID",visible:!1,showInColumnChooser:!1},{dataField:"row_number",caption:"#",width:56,allowFiltering:!1,calculateCellValue:e=>e.id},ht,{dataField:"billing_status",caption:"Estado",width:130,lookup:Ae([{value:"pending",label:"Pendiente"},{value:"billed",label:"Facturado"}]),cellTemplate:Kt},{dataField:"code",caption:"Orden Servicio",width:150,cellTemplate:(e,{data:s})=>Nt(e,s==null?void 0:s.code,()=>ce(s),"Editar orden de servicio")},{dataField:"billing_cycle",caption:"Ciclo Facturación",width:155},{dataField:"client.document_number",caption:"Doc. Cliente",width:140},{dataField:"client.full_name",caption:"Cliente",minWidth:200},{dataField:"services_text",caption:"Servicios",minWidth:260,calculateCellValue:Jt},{dataField:"total_prefactures",caption:"Total Prefacturas",width:150,dataType:"number",format:{type:"fixedPoint",precision:2},calculateCellValue:e=>Number(e.total||0)},{dataField:"total",caption:"Total Servicio",width:145,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total_billed",caption:"Total Facturado",width:150,dataType:"number",format:{type:"fixedPoint",precision:2},calculateCellValue:Yt},{dataField:"contract_label",caption:"Contrato",width:150},{dataField:"creator.fullname",caption:"Usuario Registro",minWidth:150,calculateCellValue:e=>St(e.creator)},{dataField:"created_at",caption:"Fecha Registro",dataType:"datetime",width:170,format:"yyyy-MM-dd HH:mm:ss"}],Xt=[{dataField:"client_id",caption:"Cliente ID",visible:!1,showInColumnChooser:!1},ht,{dataField:"order_status",caption:"Estado",width:145,minWidth:145,lookup:Ae(hs),cellTemplate:Ht},{dataField:"code",caption:"Codigo",width:185,minWidth:185,cellTemplate:(e,{data:s})=>Nt(e,s==null?void 0:s.code,()=>ce(s),"Editar orden de servicio")},{dataField:"business.name",caption:"Empresa",minWidth:210},{dataField:"client.full_name",caption:"Cliente",minWidth:330},{dataField:"expected_document_type",caption:"Tipo comprobante",width:170,minWidth:170},{dataField:"currency",caption:"Moneda",width:105,lookup:Ae(Ss)},{dataField:"created_at",caption:"Fecha registro",dataType:"datetime",width:185,minWidth:185,format:"yyyy-MM-dd HH:mm:ss"},{dataField:"creator.fullname",caption:"Usuario registro",minWidth:185,calculateCellValue:e=>St(e.creator)}],Zt=N?Xt:Qt,es=re.reduce((e,s)=>e+Number(s.total||0),0),qe=re.reduce((e,s)=>e+Number(s.total||0),0),xt=Number((qe*.18).toFixed(2)),ts=Number((qe+xt).toFixed(2)),Ee=Dt==="USD"?"$":"S/",we=e=>Number(e||0).toFixed(5),ss=y?t.jsxs("div",{className:"service-order-list-panel",children:[t.jsxs("div",{className:"service-order-tabs",children:[t.jsx("button",{type:"button",className:O==="services"?"active":"",onClick:()=>Qe("services"),children:"Servicios"}),t.jsx("button",{type:"button",className:O==="deleted"?"active":"",onClick:()=>Qe("deleted"),children:"OS Eliminadas"})]}),t.jsxs("div",{className:"service-order-filter-panel",children:[t.jsxs("div",{className:"row g-3 align-items-end",children:[t.jsxs("div",{className:"col-12 col-lg-6",children:[t.jsx("label",{className:"form-label",children:"Cliente"}),t.jsxs("select",{className:"form-select",value:ye,onChange:e=>Xe(e.target.value),children:[t.jsx("option",{value:"",children:O==="deleted"?"Seleccione":"Todos"}),fe.map(e=>t.jsxs("option",{value:e.entity_id??e.id,children:[e.document_number?`${e.document_number} - `:"",e.full_name]},`service-order-filter-client-${e.id}`))]})]}),t.jsxs("div",{className:"col-12 col-lg-6",children:[t.jsx("label",{className:"form-label",children:"Fecha Registro (Inicio - Fin):"}),t.jsxs("div",{className:"service-order-date-range",children:[t.jsx("input",{type:"date",className:"form-control",value:_e,onChange:e=>Ze(e.target.value)}),t.jsx("input",{type:"date",className:"form-control",value:Ne,onChange:e=>et(e.target.value)})]})]})]}),t.jsxs("div",{className:"service-order-filter-actions",children:[t.jsxs("button",{type:"button",className:"btn service-order-outline-btn",onClick:Lt,children:[t.jsx("i",{className:"mdi mdi-filter me-1"})," Filtrar"]}),(ye||_e||Ne||tt)&&t.jsx("button",{type:"button",className:"btn service-order-muted-btn",onClick:At,children:"Limpiar"})]})]}),O==="services"&&t.jsxs("div",{className:"service-order-list-summary",children:[t.jsxs("div",{children:[t.jsx("span",{children:"Importe Total"}),t.jsxs("strong",{className:"text-success",children:["S/ ",we(Se.penTotal)]}),t.jsxs("strong",{className:"text-success",children:["$ ",we(Se.usdTotal)]})]}),t.jsxs("div",{children:[t.jsx("span",{children:"Total Facturado"}),t.jsxs("strong",{className:"text-warning",children:["S/ ",we(Se.penBilled)]}),t.jsxs("strong",{className:"text-warning",children:["$ ",we(Se.usdBilled)]})]})]})]}):r;return t.jsxs(t.Fragment,{children:[y&&t.jsxs(t.Fragment,{children:[t.jsx("style",{children:`
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
        `}),t.jsxs("div",{className:"service-order-action-row",children:[t.jsxs("button",{type:"button",className:"service-order-action-tile primary",onClick:()=>ce(),children:[t.jsxs("span",{children:[t.jsx("i",{className:"mdi mdi-plus-circle-outline me-1"})," Registrar Orden de Servicio"]}),t.jsx("i",{className:"mdi mdi-calendar-month-outline fs-4"})]}),t.jsxs("button",{type:"button",className:"service-order-action-tile warning",onClick:()=>w.fire("Procesar actividades pendientes","Este proceso quedo listo como acceso del modulo. Falta conectar una regla automatica de actividades cuando se defina el flujo operativo.","info"),children:[t.jsxs("span",{children:[t.jsx("i",{className:"mdi mdi-plus-circle-outline me-1"})," Procesar Actividades Pendientes"]}),t.jsx("i",{className:"mdi mdi-calendar-month-outline fs-4"})]})]})]}),t.jsx(gs,{gridRef:u,title:ss,rest:v,pageSize:25,filterValue:y?tt:null,onRefresh:y?Mt:void 0,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",onClick:()=>$(u.current).dxDataGrid("instance").refresh()}}),y||e.unshift({widget:"dxButton",location:"after",options:{icon:"add",onClick:()=>ce()}})},columns:Zt},y?`service-order-${O}`:`service-order-${l}`),C?t.jsxs(Me,{modalRef:x,title:t.jsxs("span",{className:"storage-service-order-title",children:[t.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-service-order-dialog modal-dialog-scrollable",contentClass:"storage-service-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-service-order-body",hideFooter:!0,onSubmit:Oe,children:[t.jsx("style",{children:`
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
        `}),t.jsx("input",{ref:_,hidden:!0}),t.jsx("input",{ref:j,hidden:!0}),t.jsx("input",{ref:T,type:"date",hidden:!0}),t.jsx("input",{ref:Y,type:"date",hidden:!0}),t.jsx("input",{ref:Q,type:"date",hidden:!0}),t.jsx("input",{ref:L,hidden:!0}),t.jsx("input",{ref:X,hidden:!0}),t.jsx("input",{ref:Z,type:"number",hidden:!0}),t.jsx("input",{ref:A,hidden:!0}),t.jsx("input",{ref:M,hidden:!0}),t.jsx("input",{ref:ee,type:"number",hidden:!0}),t.jsx("textarea",{ref:G,hidden:!0}),t.jsxs("div",{className:"storage-service-order-actions",children:[t.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[t.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]}),t.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[t.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),t.jsx("h3",{className:"storage-service-order-heading",children:"Orden de servicio N°"}),t.jsxs("div",{className:"row g-4 align-items-end",children:[t.jsxs("div",{className:"col-12 col-md-6 col-xl",children:[t.jsx("label",{className:"form-label",children:"Empresa"}),t.jsxs("select",{ref:te,className:"form-select",value:W,onChange:async e=>{var i;ve(e.target.value);const s=await Ce(e.target.value);ie((i=s[0])!=null&&i.id?`${s[0].id}`:"")},required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),xe.map(e=>t.jsx("option",{value:e.id,children:e.name},`storage-order-business-${e.id}`))]})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[t.jsx("label",{className:"form-label",children:"Cliente"}),t.jsxs("select",{ref:se,className:"form-select",value:S,onChange:e=>{je(e.target.value),C&&(Te(""),ae(s=>s.map(i=>({...i,location_id:"",location_ids:[],location_label:"",location_labels:[]}))))},required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),fe.map(e=>t.jsxs("option",{value:e.entity_id??e.id,children:[e.document_number?`${e.document_number} | `:"",e.full_name]},`storage-order-client-${e.id}`))]})]}),t.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[t.jsx("label",{className:"form-label",children:"Tipo documento"}),t.jsxs("select",{ref:I,className:"form-select",required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),t.jsx("option",{value:"Factura",children:"Factura"}),t.jsx("option",{value:"Boleta",children:"Boleta"}),t.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),t.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[t.jsx("label",{className:"form-label",children:"Moneda"}),t.jsxs("select",{ref:R,className:"form-select",required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),t.jsx("option",{value:"PEN",children:"Soles"}),t.jsx("option",{value:"USD",children:"Dolares"})]})]}),t.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[t.jsx("label",{className:"form-label",children:"Tipo de servicio"}),t.jsxs("select",{ref:Ve,className:"form-select",value:He,onChange:e=>Ke(e.target.value),required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),zt.map(e=>t.jsx("option",{value:e.id,children:e.name},`storage-order-service-${e.id}`))]})]})]}),t.jsx("div",{className:"storage-service-order-separator"}),t.jsx("div",{className:"row g-3",children:rt.map(e=>{const s=dt(e),i=C&&!nt,n=!oe(S),a=!e.enabled||i||n,c=Be(e),m=s.filter(o=>c.includes(`${o.id}`)),p=qt===e.key;return t.jsx("div",{className:"col-12 col-lg-4",children:t.jsxs("div",{className:"storage-service-card",children:[t.jsxs("div",{className:"storage-service-card-header",children:[t.jsx("input",{type:"checkbox",className:"form-check-input storage-order-checkbox",checked:e.enabled,onChange:o=>{H(e.key,{enabled:o.target.checked}),o.target.checked||Te("")}}),t.jsx("p",{className:"storage-service-card-title",children:e.warehouse_name})]}),t.jsxs("div",{className:"storage-service-card-body",children:[t.jsxs("div",{className:"mb-3",children:[t.jsx("label",{className:"form-label",children:"Ubicación"}),t.jsxs("div",{className:"storage-location-picker",children:[t.jsxs("button",{type:"button",className:"storage-location-picker-toggle",disabled:a,onClick:()=>Te(o=>o===e.key?"":e.key),children:[t.jsxs("span",{className:"storage-location-picker-values",children:[i&&t.jsx("span",{className:"storage-location-picker-placeholder",children:"Cargando ubicaciones..."}),!i&&!m.length&&t.jsx("span",{className:"storage-location-picker-placeholder",children:n?"Seleccione cliente primero":s.length?"Seleccione ubicaciones":"Sin ubicaciones"}),m.map(o=>t.jsx("span",{className:"storage-location-chip",children:z(o)},`storage-order-location-chip-${e.key}-${o.id}`))]}),t.jsx("i",{className:"mdi mdi-chevron-down"})]}),p&&!a&&t.jsxs("div",{className:"storage-location-picker-menu",children:[!s.length&&t.jsx("div",{className:"storage-location-empty",children:"Sin ubicaciones"}),s.map(o=>{const h=`${o.id}`;return t.jsxs("label",{className:"storage-location-option",children:[t.jsx("input",{type:"checkbox",checked:c.includes(h),onChange:()=>Ut(e,h)}),t.jsx("span",{children:z(o)})]},`storage-order-location-${e.key}-${o.id}`)})]})]})]}),t.jsxs("div",{className:"row g-3 mb-3",children:[t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Fecha de inicio"}),t.jsx("input",{type:"date",className:"form-control",value:e.start_date,disabled:a,onChange:o=>H(e.key,{start_date:o.target.value}),required:e.enabled})]}),t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Nro de meses"}),t.jsx("input",{type:"number",min:"1",className:"form-control",value:e.months,disabled:a,onChange:o=>H(e.key,{months:o.target.value}),required:e.enabled})]}),t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Fecha fin"}),t.jsx("input",{type:"date",className:"form-control",value:e.end_date,disabled:!0})]})]}),t.jsxs("div",{className:"row g-3",children:[t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Cantidad de m3"}),t.jsx("input",{type:"number",min:"0",step:"0.001",className:"form-control",value:e.quantity_m3,disabled:a,onChange:o=>H(e.key,{quantity_m3:o.target.value}),required:e.enabled})]}),t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Tarifa"}),t.jsx("input",{type:"number",min:"0",step:"0.01",className:"form-control",value:e.tariff,disabled:a,onChange:o=>H(e.key,{tariff:o.target.value}),required:e.enabled})]}),t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Importe mensual"}),t.jsx("input",{type:"number",className:"form-control",value:e.monthly_amount,disabled:!0})]})]}),e.enabled&&(e.billing_dates??[]).length>0&&t.jsx("div",{className:"storage-billing-schedule",children:t.jsxs("table",{children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{children:"N° mes"}),t.jsx("th",{children:"Fecha facturación"})]})}),t.jsx("tbody",{children:e.billing_dates.map((o,h)=>t.jsxs("tr",{children:[t.jsx("td",{children:o.month}),t.jsx("td",{children:t.jsx("input",{type:"date",className:"form-control",value:o.date,onChange:g=>Wt(e.key,h,g.target.value),required:e.enabled})})]},`storage-order-billing-${e.key}-${o.month}`))})]})})]})]})},`storage-order-block-${e.key}`)})})]}):le?t.jsxs(Me,{modalRef:x,title:t.jsxs("span",{className:"storage-service-order-title",children:[t.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-general-order-dialog modal-dialog-scrollable",contentClass:"storage-general-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-general-order-body",hideFooter:!0,onSubmit:Oe,children:[t.jsx("style",{children:`
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
        `}),t.jsx("input",{ref:_,hidden:!0}),t.jsx("input",{ref:j,hidden:!0}),t.jsx("input",{ref:T,type:"date",hidden:!0}),t.jsx("input",{ref:Y,type:"date",hidden:!0}),t.jsx("input",{ref:Q,type:"date",hidden:!0}),t.jsx("input",{ref:L,hidden:!0}),t.jsx("input",{ref:X,hidden:!0}),t.jsx("input",{ref:Z,type:"number",hidden:!0}),t.jsx("input",{ref:A,hidden:!0}),t.jsx("input",{ref:M,hidden:!0}),t.jsx("input",{ref:ee,type:"number",hidden:!0}),t.jsx("textarea",{ref:G,hidden:!0}),t.jsx("input",{ref:he,type:"hidden",value:U,readOnly:!0}),t.jsxs("div",{className:"storage-general-order-actions",children:[t.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[t.jsx("i",{className:"mdi mdi-plus me-1"})," Guardar"]}),t.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[t.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),t.jsx("h3",{className:"storage-general-order-heading",children:"Orden de servicio N°"}),t.jsxs("div",{className:"row g-4 align-items-end",children:[t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Empresa"}),t.jsxs("select",{ref:te,className:"form-select",value:W,onChange:async e=>{var i;ve(e.target.value);const s=await Ce(e.target.value);ie((i=s[0])!=null&&i.id?`${s[0].id}`:"")},required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),xe.map(e=>t.jsx("option",{value:e.id,children:e.name},`general-order-business-${e.id}`))]})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[t.jsx("label",{className:"form-label",children:"Cliente"}),t.jsxs("select",{ref:se,className:"form-select",value:S,onChange:e=>je(e.target.value),required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),fe.map(e=>t.jsxs("option",{value:e.entity_id??e.id,children:[e.document_number?`${e.document_number} | `:"",e.full_name]},`general-order-client-${e.id}`))]})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Tipo documento"}),t.jsxs("select",{ref:I,className:"form-select",required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),t.jsx("option",{value:"Factura",children:"Factura"}),t.jsx("option",{value:"Boleta",children:"Boleta"}),t.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Moneda"}),t.jsxs("select",{ref:R,className:"form-select",onChange:e=>mt(e.target.value),required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),t.jsx("option",{value:"PEN",children:"Soles"}),t.jsx("option",{value:"USD",children:"Dolares"})]})]})]}),t.jsx("div",{className:"mt-4 mb-3",children:t.jsxs("button",{type:"button",className:"btn btn-outline-primary storage-general-insert",onClick:()=>q(e=>[...e,ue()]),children:[t.jsx("i",{className:"mdi mdi-plus-circle me-1"})," Insertar servicio general"]})}),t.jsx("div",{className:"storage-general-lines-wrap",children:t.jsxs("table",{className:"storage-general-lines",children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{children:"Servicio"}),t.jsx("th",{style:{width:115},children:"Tarifa"}),t.jsx("th",{style:{width:115},children:"Cantidad"}),t.jsx("th",{style:{width:130},children:"Total"}),t.jsx("th",{style:{width:42}})]})}),t.jsx("tbody",{children:re.map(e=>t.jsxs("tr",{children:[t.jsx("td",{children:t.jsxs("select",{className:"form-select",value:e.service_id,onChange:s=>P(e.uid,"service_id",s.target.value),required:!0,children:[t.jsx("option",{value:"",children:"Seleccione servicio"}),be.map(s=>t.jsx("option",{value:s.id,children:s.name},`general-order-service-${s.id}`))]})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",className:"form-control",value:e.unit_price,onChange:s=>P(e.uid,"unit_price",s.target.value)})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.001",min:"0",className:"form-control",value:e.quantity,onChange:s=>P(e.uid,"quantity",s.target.value)})}),t.jsx("td",{children:t.jsx("input",{className:"form-control",value:Number(e.total||0).toFixed(2),disabled:!0})}),t.jsx("td",{children:t.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>q(s=>s.filter(i=>i.uid!==e.uid)),children:t.jsx("i",{className:"mdi mdi-close"})})})]},`general-order-item-${e.uid}`))}),t.jsx("tfoot",{children:t.jsxs("tr",{children:[t.jsx("td",{colSpan:"3",className:"storage-general-total-label",children:"Total"}),t.jsx("td",{children:t.jsx("input",{className:"form-control",value:es.toFixed(2),disabled:!0})}),t.jsx("td",{})]})})]})})]}):t.jsxs(Me,{modalRef:x,title:Et?"Editar orden de servicio":"Registrar orden de servicio",size:"xl",bodyClass:"service-order-form-modal-body",btnCancelText:"Cerrar",btnSubmitText:"Guardar",onSubmit:Oe,children:[t.jsx("style",{children:`
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
      `}),t.jsx("input",{ref:_,hidden:!0}),t.jsx("input",{ref:j,hidden:!0,readOnly:!0}),t.jsx("input",{ref:te,type:"hidden",value:W,readOnly:!0}),t.jsx("input",{ref:he,type:"hidden",value:U,readOnly:!0}),t.jsx("input",{ref:T,type:"hidden"}),t.jsx("input",{ref:Y,type:"hidden"}),t.jsx("input",{ref:Q,type:"hidden"}),t.jsx("input",{ref:Z,type:"hidden",defaultValue:"1"}),t.jsx("input",{ref:A,type:"hidden",defaultValue:"draft"}),t.jsx("input",{ref:M,type:"hidden",defaultValue:"pending"}),t.jsx("input",{ref:ee,type:"hidden"}),t.jsx("textarea",{ref:G,hidden:!0}),t.jsxs("div",{className:"row g-3",children:[t.jsx("div",{className:"col-12",children:t.jsx("h5",{className:"service-order-form-section-title",children:"Datos de la orden"})}),t.jsxs("div",{className:"col-12 col-lg-6",children:[t.jsx("label",{className:"form-label",children:"Cliente"}),t.jsxs("select",{ref:se,className:"form-select",value:S,onChange:e=>je(e.target.value),required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),fe.map(e=>t.jsxs("option",{value:e.entity_id??e.id,children:[e.document_number?`${e.document_number} - `:"",e.display_name??e.full_name]},`service-order-client-${e.id}`))]})]}),t.jsxs("div",{className:"col-12 col-lg-3",children:[t.jsx("label",{className:"form-label",children:"Contrato"}),t.jsx("input",{ref:pe,className:"form-control",placeholder:"Seleccionar"})]}),t.jsxs("div",{className:"col-12 col-lg-3",children:[t.jsx("label",{className:"form-label",children:"Ciclo de facturación"}),t.jsxs("select",{ref:L,className:"form-select",required:!0,children:[t.jsx("option",{value:"Unico",children:"Unico"}),t.jsx("option",{value:"Mensual",children:"Mensual"}),t.jsx("option",{value:"Eventual",children:"Eventual"})]})]}),t.jsxs("div",{className:"col-12 col-md-6 col-lg-3",children:[t.jsx("label",{className:"form-label",children:"Moneda"}),t.jsxs("select",{ref:R,className:"form-select",onChange:e=>mt(e.target.value),required:!0,children:[t.jsx("option",{value:"PEN",children:"S/ | Soles"}),t.jsx("option",{value:"USD",children:"$ | Dolares"})]})]}),t.jsxs("div",{className:"col-12 col-md-6 col-lg-3",children:[t.jsx("label",{className:"form-label",children:"Comprobante"}),t.jsxs("select",{ref:I,className:"form-select",required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),t.jsx("option",{value:"Factura",children:"Factura"}),t.jsx("option",{value:"Boleta",children:"Boleta"}),t.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]})]}),t.jsx("hr",{className:"my-4"}),t.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[t.jsx("h5",{className:"service-order-form-section-title",children:"Detalle de servicios"}),t.jsxs("button",{type:"button",className:"btn btn-sm btn-primary",onClick:()=>q(e=>[...e,ue()]),children:[t.jsx("i",{className:"mdi mdi-plus me-1"})," Agregar item"]})]}),t.jsx("div",{className:"service-order-items-wrapper",children:t.jsxs("table",{className:"table table-sm table-bordered align-middle service-order-items-table mb-0",children:[t.jsx("thead",{className:"table-light",children:t.jsxs("tr",{children:[t.jsx("th",{style:{width:48},children:"#"}),t.jsx("th",{children:"Servicio"}),t.jsx("th",{style:{width:170},children:"Alcance"}),t.jsx("th",{children:"Glosa"}),t.jsxs("th",{style:{width:135},children:["P. Unit.",t.jsx("br",{}),"(Sin IGV)"]}),t.jsx("th",{style:{width:130},children:"Subtotal"}),t.jsx("th",{style:{width:42}})]})}),t.jsx("tbody",{children:re.map((e,s)=>t.jsxs("tr",{children:[t.jsx("td",{children:s+1}),t.jsx("td",{children:t.jsxs("select",{className:"form-select",value:e.service_id,onChange:i=>P(e.uid,"service_id",i.target.value),required:!0,children:[t.jsx("option",{value:"",children:"Seleccione servicio"}),be.map(i=>t.jsxs("option",{value:i.id,children:[i.code?`${i.code} - `:"",i.name]},`service-order-item-${i.id}`))]})}),t.jsx("td",{children:t.jsx("input",{className:"form-control",value:e.scope,onChange:i=>P(e.uid,"scope",i.target.value)})}),t.jsx("td",{children:t.jsx("input",{className:"form-control",value:e.gloss,onChange:i=>P(e.uid,"gloss",i.target.value)})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control text-end",value:e.unit_price,onChange:i=>P(e.uid,"unit_price",i.target.value)})}),t.jsx("td",{children:t.jsx("input",{className:"form-control text-end",value:Number(e.total||0).toFixed(2),disabled:!0})}),t.jsx("td",{children:t.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>q(i=>i.length===1?[ue()]:i.filter(n=>n.uid!==e.uid)),children:t.jsx("i",{className:"mdi mdi-close"})})})]},`service-order-item-row-${e.uid}`))})]})}),t.jsxs("div",{className:"service-order-summary mt-3",children:[t.jsxs("div",{className:"service-order-summary-row",children:[t.jsxs("span",{className:"service-order-summary-label",children:["Gravadas: ",Ee]}),t.jsx("input",{className:"form-control text-end",value:qe.toFixed(2),disabled:!0})]}),t.jsxs("div",{className:"service-order-summary-row",children:[t.jsxs("span",{className:"service-order-summary-label",children:["I.G.V.: ",Ee]}),t.jsx("input",{className:"form-control text-end",value:xt.toFixed(2),disabled:!0})]}),t.jsxs("div",{className:"service-order-summary-row",children:[t.jsxs("span",{className:"service-order-summary-label",children:["Total: ",Ee]}),t.jsx("input",{className:"form-control text-end",value:ts.toFixed(2),disabled:!0})]})]}),t.jsx("hr",{className:"my-4"}),t.jsxs("div",{className:"row g-3 align-items-end",children:[t.jsxs("div",{className:"col-12 col-lg-4",children:[t.jsx("label",{className:"form-label d-block",children:"Detracción"}),t.jsx("div",{className:"form-check form-switch service-order-detraction-options",children:t.jsx("input",{className:"form-check-input",id:"service-order-detraction-enabled",type:"checkbox",checked:De,onChange:e=>Ye(e.target.checked)})})]}),t.jsxs("div",{className:"col-12 col-lg-6",children:[t.jsx("label",{className:"form-label",children:"Forma de pago"}),t.jsxs("select",{ref:X,className:"form-select",children:[t.jsx("option",{value:"Contado",children:"Contado"}),t.jsx("option",{value:"Credito",children:"Credito"})]})]}),t.jsxs("div",{className:"col-12 col-lg-2",children:[t.jsx("label",{className:"form-label",children:"Día facturación"}),t.jsxs("select",{ref:ge,className:"form-select",children:[t.jsx("option",{value:"",children:"Seleccionar"}),Array.from({length:31},(e,s)=>s+1).map(e=>t.jsx("option",{value:e,children:e},`service-order-billing-day-${e}`))]})]})]})]})]})};us((r,l)=>{const u=l.requiredPermission??"services-service-order";!l.can(u)&&!l.hasRole("Admin")&&(location.href="/admin/"),ms(r).render(t.jsx(ps,{...l,title:l.moduleTitle??"Ordenes de servicio",children:t.jsx(Bs,{...l})}))});
