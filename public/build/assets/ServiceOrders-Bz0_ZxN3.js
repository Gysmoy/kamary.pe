var yt=Object.defineProperty;var St=(a,l,d)=>l in a?yt(a,l,{enumerable:!0,configurable:!0,writable:!0,value:d}):a[l]=d;var C=(a,l,d)=>St(a,typeof l!="symbol"?l+"":l,d);import{m as Ct,t as wt,C as $t,c as Rt,j as e,r as m,S as q}from"./CreateReactScript-DzmYTmbr.js";import{B as Ft}from"./Base-BFIC9n1T.js";import{T as Bt,E as ye,l as Ve,t as he,g as It,q as Dt}from"./Table-Aq4oioSi.js";import{M as Se}from"./Modal-DGAB1eIb.js";import{D as Ce}from"./DxButton-CsjWvhyj.js";import{B as qt}from"./BasicRest-DlKnEI0V.js";import{a as G}from"./permissionScope-etO_1UXy.js";import{r as He}from"./renderGridEditLink-D8NGEeKJ.js";import{o as Ot,b as Et}from"./magistralesRecordPdf-CsQ09HN2.js";const ie=async(a,l={})=>{try{const{status:d,result:p}=await Ct.Fetch(a,{method:"POST",body:JSON.stringify({take:1e3,skip:0,isLoadingAll:!0,...l})});if(!d)throw new Error((p==null?void 0:p.message)||"No se pudo cargar la lista");return(p==null?void 0:p.data)??[]}catch(d){return wt.error("Error",{description:d.message,duration:3e3,richColors:!0}),[]}},kt=()=>location.pathname.includes("/admin/storage-general-service-orders"),Pt=()=>location.pathname.includes("/admin/storage-service-orders");class Tt extends qt{constructor(){super(...arguments);C(this,"path",G()?kt()?"admin/storage/general-service-orders":"admin/storage/service-orders":"admin/service-orders");C(this,"getBranchesByBusiness",async d=>d?await this.simpleGet(`/api/${this.path}/businesses/${d}/branches`)??[]:[]);C(this,"getBusinesses",async()=>await ie("/api/admin/businesses/paginate"));C(this,"getClients",async()=>await ie(G()?"/api/admin/storage/clients/paginate":"/api/admin/clients/paginate"));C(this,"getServices",async()=>await ie(G()?"/api/admin/storage/general-service/paginate":"/api/admin/services/paginate",Pt()?{storage_service_types:!0}:{}));C(this,"getStorageOptions",async()=>G()?await this.simpleGet("/api/admin/storage/kardex/options"):null);C(this,"getStorageWarehouses",async()=>G()?await ie("/api/admin/storage/kardex/paginate",{section:"warehouses",sort:[{selector:"warehouse_name",desc:!1}]}):[]);C(this,"getStorageLocations",async()=>G()?await ie("/api/admin/storage/kardex/paginate",{section:"locations"}):[])}}const v=new Tt,Lt=a=>(a==null?void 0:a.fullname)||[a==null?void 0:a.name,a==null?void 0:a.lastname].filter(Boolean).join(" ")||(a==null?void 0:a.username)||"",ne=()=>({uid:crypto.randomUUID(),service_id:"",description:"",quantity:1,unit_price:0,detraction_percent:0,commission_percent:0,total:0}),j=(a="")=>a.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""),zt=["Servicio de almacenamiento","Servicio de almacenamiento - Adicional"],At=[{value:"PEN",label:"Soles"},{value:"USD",label:"Dolares"}],Je=a=>(a==null?void 0:a.name)??(a==null?void 0:a.warehouse_name)??"",Mt=a=>(a==null?void 0:a.id)??(a==null?void 0:a.warehouse_id)??"",Wt=a=>a==="approved"?"Aprobado":Dt(a),Ut=a=>{const l=Mt(a),d=Je(a);return{key:l?`warehouse-${l}`:j(d),warehouse_name:d,warehouse_id:l?`${l}`:"",enabled:!1,location_id:"",location_ids:[],location_label:"",location_labels:[],start_date:"",months:"",end_date:"",billing_dates:[],quantity_m3:"",tariff:"",monthly_amount:""}},ge=(a=[])=>a.filter(l=>(l==null?void 0:l.status)!==null).map(Ut),we=a=>{var l,d,p;return((p=(l=a==null?void 0:a.toString)==null?void 0:(d=l.call(a)).slice)==null?void 0:p.call(d,0,10))??""},re=a=>Number(a||0),$e=(a,l,d=!1)=>{if(!a)return"";const p=Number(l);if(!Number.isFinite(p)||p<0||!d&&p<=0)return"";const b=new Date(`${a}T00:00:00`);if(Number.isNaN(b.getTime()))return"";const f=new Date(b),w=f.getDate();return f.setDate(1),f.setMonth(f.getMonth()+p),f.setDate(Math.min(w,new Date(f.getFullYear(),f.getMonth()+1,0).getDate())),f.toISOString().slice(0,10)},Ke=(a,l)=>{const d=Number.parseInt(l,10);return!a||!Number.isFinite(d)||d<=0?[]:Array.from({length:d},(p,b)=>({month:b+1,date:$e(a,b,!0)}))},O=a=>a?[a.code,a.temperature_range].filter(Boolean).join(" | "):"",Xe=(a="")=>a.split(",").map(l=>l.trim()).filter(Boolean),xe=a=>Array.isArray(a.location_ids)?a.location_ids.filter(Boolean).map(l=>`${l}`):a.location_id?[`${a.location_id}`]:[],Gt=(a,l)=>[a.warehouse_name,(Array.isArray(l)?l.map(O).filter(Boolean).join(", "):O(l))||a.location_label,`${a.start_date||""} - ${a.end_date||""}`,`${a.months||0} meses`,`${a.quantity_m3||0} m3`].filter(Boolean).join("; "),Vt=(a="")=>{const l=a.split(";").map(p=>p.trim()),d=(l[2]??"").split("-").map(p=>p.trim());return{warehouse_name:l[0]??"",location_label:l[1]??"",location_labels:Xe(l[1]??""),start_date:d.length>=3?`${d[0]}-${d[1]}-${d[2]}`.slice(0,10):"",end_date:d.length>=6?`${d[3]}-${d[4]}-${d[5]}`.slice(0,10):"",months:parseFloat(l[3])||"",quantity_m3:parseFloat(l[4])||""}},Ht=({moduleTitle:a="Ordenes de servicio",serviceOrderType:l="service"})=>{const d=m.useRef(),p=m.useRef(),b=m.useRef(),f=m.useRef(),w=m.useRef(),V=m.useRef(),H=m.useRef(),R=m.useRef(),N=m.useRef(),K=m.useRef(),J=m.useRef(),X=m.useRef(),E=m.useRef(),k=m.useRef(),Y=m.useRef(),P=m.useRef(),fe=m.useRef(null),Q=m.useRef(),le=m.useRef(),Z=m.useRef(),Re=m.useRef(),[ee,Ye]=m.useState([]),[Qe,Ze]=m.useState([]),[be,et]=m.useState([]),[oe,tt]=m.useState([]),[T,te]=m.useState(""),[L,z]=m.useState(""),[se,ce]=m.useState(""),[Fe,Be]=m.useState(""),[de,F]=m.useState([ne()]),[A,st]=m.useState([]),[M,at]=m.useState([]),[Ie,me]=m.useState(()=>ge()),[De,it]=m.useState(!1),[nt,qe]=m.useState(""),[rt,lt]=m.useState(!1),B=l==="storage_general",y=l==="storage_service",I=B||y,ot=oe.filter(t=>zt.some(s=>j(s)===j(t.name))),ve=Object.fromEntries(oe.map(t=>[`${t.id}`,t])),Oe=async()=>{if(!y)return{warehouseRows:[],locationRows:[]};fe.current||(fe.current=(async()=>{const n=await v.getStorageOptions();let r=((n==null?void 0:n.warehouses)??[]).filter(c=>c.status!==null),o=((n==null?void 0:n.locations)??[]).filter(c=>c.status!==null);if(!r.length||!o.length){const[c,h]=await Promise.all([o.length?Promise.resolve(o):v.getStorageLocations(),r.length?Promise.resolve(r):v.getStorageWarehouses()]);r=(r.length?r:h??[]).filter(i=>i.status!==null),o=(o.length?o:c??[]).filter(i=>i.status!==null)}return{warehouseRows:r,locationRows:o}})());const{warehouseRows:t,locationRows:s}=await fe.current;return st(t),at(s),it(!0),{warehouseRows:t,locationRows:s}};m.useEffect(()=>{(async()=>{var i;const s=y?Oe():Promise.resolve({warehouseRows:[],locationRows:[]}),[n,r,o,c]=await Promise.all([v.getBusinesses(),v.getClients(),v.getServices(),s]),h=n??[];if(Ye(h),et((r??[]).filter(u=>u.status!==null)),tt((o??[]).filter(u=>u.status!==null)),y){me(ge(c.warehouseRows));const u=h[0];if(u){te(`${u.id}`);const x=await ae(u.id);(i=x[0])!=null&&i.id&&z(`${x[0].id}`)}}})()},[]);const ae=async(t,s="")=>{const r=await v.getBranchesByBusiness(t)??[];return Ze(r),z(s?`${s}`:""),r},Ee=t=>({...t,total:Number(t.quantity||0)*Number(t.unit_price||0)}),D=(t,s="")=>{var n;return((n=t.current)==null?void 0:n.value)||s||""},ke=(t="")=>{const s=`${t??""}`.trim(),n=s.match(/^client-(\d+)$/i);return n?n[1]:s},Pe=(t,s=A)=>s.find(n=>j(Je(n))===j(t)),Te=(t,s=A)=>{var n;return t.warehouse_id||((n=Pe(t.warehouse_name,s))==null?void 0:n.id)||""},Le=(t,s=M,n=A)=>{const r=Te(t,n);return s.filter(o=>r&&`${o.warehouse_id}`==`${r}`?!0:j(o.warehouse_name)===j(t.warehouse_name))},ze=(t,s=M,n=A)=>{const r=Le(t,s,n),o=xe(t),c=o.length?r.filter(i=>o.includes(`${i.id}`)):[];return c.length?c:(Array.isArray(t.location_labels)&&t.location_labels.length?t.location_labels:Xe(t.location_label)).map(i=>r.find(u=>j(O(u))===j(i))).filter(Boolean)},ct=(t=[],s=A,n=M)=>{const r=ge(s);return t.forEach(o=>{var x,U;const c=Vt(o.description??""),h=r.findIndex(_=>j(_.warehouse_name)===j(c.warehouse_name));if(h<0)return;const i={...r[h],enabled:!0,warehouse_id:((x=Pe(r[h].warehouse_name,s))==null?void 0:x.id)??r[h].warehouse_id,location_label:c.location_label,location_labels:c.location_labels,start_date:c.start_date,months:c.months||"",end_date:c.end_date||$e(c.start_date,c.months),billing_dates:Ke(c.start_date,c.months),quantity_m3:c.quantity_m3||Number(o.quantity||0)||"",tariff:Number(o.unit_price||0)||"",monthly_amount:Number(o.total||0)||""},u=ze(i,n,s);r[h]={...i,location_id:(U=u[0])!=null&&U.id?`${u[0].id}`:"",location_ids:u.map(_=>`${_.id}`)}}),r},W=(t,s)=>{me(n=>n.map(r=>{if(r.key!==t)return r;const o="location_ids"in s?(Array.isArray(s.location_ids)?s.location_ids:[s.location_ids]).filter(Boolean).map(u=>`${u}`):null,c=s.location_id?M.find(u=>`${u.id}`==`${s.location_id}`):null,h=o?M.filter(u=>o.includes(`${u.id}`)):null,i={...r,...s,warehouse_id:Te(r)};if(c&&(i.location_label=O(c)),h&&(i.location_ids=o,i.location_id=o[0]??"",i.location_labels=h.map(O).filter(Boolean),i.location_label=i.location_labels.join(", ")),("start_date"in s||"months"in s)&&(i.end_date=$e(i.start_date,i.months),i.billing_dates=Ke(i.start_date,i.months)),"quantity_m3"in s||"tariff"in s){const u=re(i.quantity_m3)*re(i.tariff);i.monthly_amount=u?u.toFixed(2):""}return i}))},dt=(t,s,n)=>{me(r=>r.map(o=>o.key!==t?o:{...o,billing_dates:(o.billing_dates??[]).map((c,h)=>h===s?{...c,date:n}:c)}))},mt=(t,s)=>{const n=`${s}`,r=xe(t),o=r.includes(n)?r.filter(c=>c!==n):[...r,n];W(t.key,{location_ids:o})},ue=async(t=null)=>{var h,i,u;lt(!!(t!=null&&t.id)),b.current.value=(t==null?void 0:t.id)??"",f.current.value=(t==null?void 0:t.code)??"Se genera al guardar",w.current.value=we(t==null?void 0:t.issue_date)||new Date().toISOString().slice(0,10),V.current.value=we(t==null?void 0:t.scheduled_at),H.current.value=we(t==null?void 0:t.first_due_date),R.current.value=(t==null?void 0:t.expected_document_type)??(I?"":"Factura"),N.current.value=(t==null?void 0:t.currency)??(I?"":"PEN"),K.current.value=(t==null?void 0:t.billing_cycle)??"",J.current.value=(t==null?void 0:t.payment_condition)??"Contado",X.current.value=Number((t==null?void 0:t.installments)??1),E.current.value=(t==null?void 0:t.order_status)??(B?"approved":"draft"),k.current.value=(t==null?void 0:t.billing_status)??"pending",Y.current.value=Number((t==null?void 0:t.tax_amount)??0),P.current.value=(t==null?void 0:t.observations)??"";const s=t!=null&&t.business_id?`${t.business_id}`:T||((h=ee[0])!=null&&h.id?`${ee[0].id}`:"");te(s),ce(t!=null&&t.client_id?`${t.client_id}`:"");const n=await ae(s,(t==null?void 0:t.business_branch_id)??L);!(t!=null&&t.business_branch_id)&&!L&&((i=n[0])!=null&&i.id)&&z(`${n[0].id}`);const r=((t==null?void 0:t.items)??[]).map(x=>({uid:crypto.randomUUID(),service_id:`${x.service_id}`,description:x.description??"",quantity:Number(x.quantity||0),unit_price:Number(x.unit_price||0),detraction_percent:Number(x.detraction_percent||0),commission_percent:Number(x.commission_percent||0),total:Number(x.total||0)}));Be(((u=r[0])==null?void 0:u.service_id)??"");let o=A,c=M;if(y&&(!o.length||!c.length||!De)){const x=await Oe();o=x.warehouseRows,c=x.locationRows}me(y?ct((t==null?void 0:t.items)??[],o,c):ge()),F(r.length?r:B?[]:[ne()]),$(p.current).modal("show")},S=(t,s,n)=>{F(r=>r.map(o=>{var h;if(o.uid!==t)return o;const c={...o,[s]:n};if(s==="service_id"){const i=ve[n];c.description=c.description||(i==null?void 0:i.name)||"",c.unit_price=Number(((h=N.current)==null?void 0:h.value)==="USD"?i==null?void 0:i.unit_price_usd:i==null?void 0:i.unit_price_pen)||0}return Ee(c)}))},ut=t=>{F(s=>s.map(n=>{if(!n.service_id)return n;const r=ve[n.service_id];return Ee({...n,unit_price:Number(t==="USD"?r==null?void 0:r.unit_price_usd:r==null?void 0:r.unit_price_pen)||0})}))},je=async t=>{if(t.preventDefault(),y){const i=D(Q,T),u=D(le,L),x=ke(D(Z,se)),U=D(Re,Fe),_=Ie.filter(g=>g.enabled),Me=_.find(g=>!xe(g).length||!g.start_date||!g.months||!g.end_date||!g.quantity_m3||!g.tariff);if(!i||!u||!x||!R.current.value||!N.current.value||!U){q.fire("Formulario incompleto","Completa empresa, cliente, tipo documento, moneda y tipo de servicio.","warning");return}if(!_.length){q.fire("Formulario incompleto","Selecciona al menos un almacen.","warning");return}if(Me){q.fire("Formulario incompleto",`Completa los datos de ${Me.warehouse_name}.`,"warning");return}const We=_.find(g=>{const Ne=Number.parseInt(g.months,10);return!Array.isArray(g.billing_dates)||g.billing_dates.length!==Ne||g.billing_dates.some(pe=>!pe.date)});if(We){q.fire("Formulario incompleto",`Completa las fechas de facturacion de ${We.warehouse_name}.`,"warning");return}const Ue=_.map(g=>g.start_date).filter(Boolean).sort(),vt=Math.max(..._.map(g=>Number(g.months||1))),_e=ve[U],jt={id:b.current.value||void 0,business_id:i||null,business_branch_id:u||null,client_id:x||null,expected_document_type:R.current.value,currency:N.current.value,billing_cycle:(_e==null?void 0:_e.name)??"",payment_condition:"Contado",installments:vt||1,issue_date:w.current.value||new Date().toISOString().slice(0,10),scheduled_at:Ue[0]??null,first_due_date:Ue[0]??null,order_status:E.current.value||"draft",billing_status:k.current.value||"pending",tax_amount:0,observations:P.current.value.trim(),items:_.map(g=>{const Ne=ze(g),pe=re(g.quantity_m3),Ge=re(g.tariff),_t=re(g.monthly_amount)||pe*Ge;return{service_id:U,description:Gt(g,Ne),quantity:pe,unit_price:Ge,detraction_percent:0,commission_percent:0,total:_t,billing_dates:(g.billing_dates??[]).map(Nt=>Nt.date)}})};if(!await v.save(jt))return;$(d.current).dxDataGrid("instance").refresh(),$(p.current).modal("hide");return}const s=D(Q,T),n=D(le,L),r=ke(D(Z,se)),o=de.filter(i=>i.service_id).map(i=>({service_id:i.service_id,description:i.description,quantity:i.quantity,unit_price:i.unit_price,detraction_percent:i.detraction_percent,commission_percent:i.commission_percent,total:i.total}));if(B){if(!s||!n||!r||!R.current.value||!N.current.value){q.fire("Formulario incompleto","Completa empresa, cliente, tipo documento y moneda.","warning");return}if(!o.length){q.fire("Formulario incompleto","Agrega al menos un servicio general.","warning");return}}const c={id:b.current.value||void 0,business_id:s||null,business_branch_id:n||null,client_id:r||null,expected_document_type:R.current.value,currency:N.current.value,billing_cycle:K.current.value.trim(),payment_condition:J.current.value,installments:X.current.value,issue_date:w.current.value,scheduled_at:V.current.value||null,first_due_date:H.current.value||null,order_status:E.current.value,billing_status:k.current.value,tax_amount:Y.current.value,observations:P.current.value.trim(),items:o};await v.save(c)&&($(d.current).dxDataGrid("instance").refresh(),$(p.current).modal("hide"))},pt=async t=>{const{isConfirmed:s}=await q.fire({title:"Anular orden de servicio",text:"Se dara de baja la orden de servicio.",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, anular",cancelButtonText:"Cancelar"});!s||!await v.delete(t)||$(d.current).dxDataGrid("instance").refresh()},ht=(t,{data:s})=>{const n=(s==null?void 0:s.order_status)??"",r=document.createElement("span");r.className=`badge ${n==="approved"?"bg-soft-success text-success":n==="cancelled"?"bg-soft-danger text-danger":"bg-soft-warning text-warning"}`,r.textContent=Wt(n),t.append(r)},Ae={caption:"Acciones",width:I?92:170,allowFiltering:!1,allowExporting:!1,cellTemplate:(t,{data:s})=>{t.css("text-overflow","unset"),t.append(Ce({className:I?"btn btn-xs btn-soft-warning":"btn btn-xs btn-soft-primary",title:"Editar orden de servicio",icon:"mdi mdi-pencil",onClick:()=>ue(s)})),I||t.append(Ce({className:"btn btn-xs btn-soft-danger ms-1",title:"Imprimir PDF",icon:"mdi mdi-file-pdf-box",onClick:()=>Ot(Et.serviceOrder(s))})),t.append(Ce({className:"btn btn-xs btn-soft-danger ms-1",title:"Anular orden de servicio",icon:I?"mdi mdi-close":"mdi mdi-delete",onClick:()=>pt(s.id)}))}},gt=[{dataField:"id",caption:"ID",width:70},{dataField:"code",caption:"Codigo",width:120,cellTemplate:(t,{data:s})=>He(t,s==null?void 0:s.code,()=>ue(s),"Editar orden de servicio")},{dataField:"issue_date",caption:"Fecha",dataType:"date",width:110},{dataField:"scheduled_at",caption:"Programada",dataType:"date",width:115},{dataField:"business.name",caption:"Empresa",minWidth:140},{dataField:"branch.name",caption:"Sede",minWidth:130},{dataField:"client.full_name",caption:"Cliente",minWidth:200},{dataField:"billing_cycle",caption:"Ciclo",minWidth:130},{dataField:"expected_document_type",caption:"Comp.",width:100},{dataField:"currency",caption:"Moneda",width:90},{dataField:"subtotal",caption:"Subtotal",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"Impuesto",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{caption:"Detalle",minWidth:260,allowFiltering:!1,calculateCellValue:t=>(t.items??[]).map(s=>{var n,r;return`${Number(s.quantity||0).toFixed(3)} ${((n=s.service)==null?void 0:n.billing_unit)??""} ${s.description??((r=s.service)==null?void 0:r.name)??""}`.trim()}).join(" | ")},{dataField:"accounts_receivable_code",caption:"CXC",width:130,calculateCellValue:t=>{var s,n;return((s=t.accounts_receivable)==null?void 0:s.code)??((n=t.accountsReceivable)==null?void 0:n.code)??"-"}},{dataField:"payment_status",caption:"Cobranza",width:110,calculateCellValue:t=>{var s,n;return It(((s=t.accounts_receivable)==null?void 0:s.payment_status)??((n=t.accountsReceivable)==null?void 0:n.payment_status)??t.payment_status??"-")}},{dataField:"order_status",caption:"Estado",width:110,lookup:he(ye)},{dataField:"billing_status",caption:"Facturacion",width:110,lookup:he(Ve)},{dataField:"creator.fullname",caption:"Creado por",minWidth:140,visible:!1},{dataField:"updater.fullname",caption:"Actualizado por",minWidth:140,visible:!1},Ae],xt=[Ae,{dataField:"order_status",caption:"Estado",width:115,lookup:he(ye),cellTemplate:ht},{dataField:"code",caption:"Codigo",width:125,cellTemplate:(t,{data:s})=>He(t,s==null?void 0:s.code,()=>ue(s),"Editar orden de servicio")},{dataField:"business.name",caption:"Empresa",minWidth:170},{dataField:"client.full_name",caption:"Cliente",minWidth:220},{dataField:"expected_document_type",caption:"Tipo comprobante",width:160},{dataField:"currency",caption:"Moneda",width:105,lookup:he(At)},{dataField:"created_at",caption:"Fecha registro",dataType:"datetime",width:170,format:"yyyy-MM-dd HH:mm:ss"},{dataField:"creator.fullname",caption:"Usuario registro",minWidth:160,calculateCellValue:t=>Lt(t.creator)}],ft=I?xt:gt,bt=de.reduce((t,s)=>t+Number(s.total||0),0);return e.jsxs(e.Fragment,{children:[e.jsx(Bt,{gridRef:d,title:a,rest:v,pageSize:25,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",onClick:()=>$(d.current).dxDataGrid("instance").refresh()}}),t.unshift({widget:"dxButton",location:"after",options:{icon:"add",onClick:()=>ue()}})},columns:ft}),y?e.jsxs(Se,{modalRef:p,title:e.jsxs("span",{className:"storage-service-order-title",children:[e.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-service-order-dialog modal-dialog-scrollable",contentClass:"storage-service-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-service-order-body",hideFooter:!0,onSubmit:je,children:[e.jsx("style",{children:`
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
        `}),e.jsx("input",{ref:b,hidden:!0}),e.jsx("input",{ref:f,hidden:!0}),e.jsx("input",{ref:w,type:"date",hidden:!0}),e.jsx("input",{ref:V,type:"date",hidden:!0}),e.jsx("input",{ref:H,type:"date",hidden:!0}),e.jsx("input",{ref:K,hidden:!0}),e.jsx("input",{ref:J,hidden:!0}),e.jsx("input",{ref:X,type:"number",hidden:!0}),e.jsx("input",{ref:E,hidden:!0}),e.jsx("input",{ref:k,hidden:!0}),e.jsx("input",{ref:Y,type:"number",hidden:!0}),e.jsx("textarea",{ref:P,hidden:!0}),e.jsxs("div",{className:"storage-service-order-actions",children:[e.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]}),e.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[e.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),e.jsx("h3",{className:"storage-service-order-heading",children:"Orden de servicio N°"}),e.jsxs("div",{className:"row g-4 align-items-end",children:[e.jsxs("div",{className:"col-12 col-md-6 col-xl",children:[e.jsx("label",{className:"form-label",children:"Empresa"}),e.jsxs("select",{ref:Q,className:"form-select",value:T,onChange:async t=>{var n;te(t.target.value);const s=await ae(t.target.value);z((n=s[0])!=null&&n.id?`${s[0].id}`:"")},required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),ee.map(t=>e.jsx("option",{value:t.id,children:t.name},`storage-order-business-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:Z,className:"form-select",value:se,onChange:t=>ce(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),be.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} | `:"",t.full_name]},`storage-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Tipo documento"}),e.jsxs("select",{ref:R,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:N,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"PEN",children:"Soles"}),e.jsx("option",{value:"USD",children:"Dolares"})]})]}),e.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[e.jsx("label",{className:"form-label",children:"Tipo de servicio"}),e.jsxs("select",{ref:Re,className:"form-select",value:Fe,onChange:t=>Be(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),ot.map(t=>e.jsx("option",{value:t.id,children:t.name},`storage-order-service-${t.id}`))]})]})]}),e.jsx("div",{className:"storage-service-order-separator"}),e.jsx("div",{className:"row g-3",children:Ie.map(t=>{const s=Le(t),n=y&&!De,r=!t.enabled||n,o=xe(t),c=s.filter(i=>o.includes(`${i.id}`)),h=nt===t.key;return e.jsx("div",{className:"col-12 col-lg-4",children:e.jsxs("div",{className:"storage-service-card",children:[e.jsxs("div",{className:"storage-service-card-header",children:[e.jsx("input",{type:"checkbox",className:"form-check-input storage-order-checkbox",checked:t.enabled,onChange:i=>{W(t.key,{enabled:i.target.checked}),i.target.checked||qe("")}}),e.jsx("p",{className:"storage-service-card-title",children:t.warehouse_name})]}),e.jsxs("div",{className:"storage-service-card-body",children:[e.jsxs("div",{className:"mb-3",children:[e.jsx("label",{className:"form-label",children:"Ubicación"}),e.jsxs("div",{className:"storage-location-picker",children:[e.jsxs("button",{type:"button",className:"storage-location-picker-toggle",disabled:r,onClick:()=>qe(i=>i===t.key?"":t.key),children:[e.jsxs("span",{className:"storage-location-picker-values",children:[n&&e.jsx("span",{className:"storage-location-picker-placeholder",children:"Cargando ubicaciones..."}),!n&&!c.length&&e.jsx("span",{className:"storage-location-picker-placeholder",children:s.length?"Seleccione ubicaciones":"Sin ubicaciones"}),c.map(i=>e.jsx("span",{className:"storage-location-chip",children:O(i)},`storage-order-location-chip-${t.key}-${i.id}`))]}),e.jsx("i",{className:"mdi mdi-chevron-down"})]}),h&&!r&&e.jsxs("div",{className:"storage-location-picker-menu",children:[!s.length&&e.jsx("div",{className:"storage-location-empty",children:"Sin ubicaciones"}),s.map(i=>{const u=`${i.id}`;return e.jsxs("label",{className:"storage-location-option",children:[e.jsx("input",{type:"checkbox",checked:o.includes(u),onChange:()=>mt(t,u)}),e.jsx("span",{children:O(i)})]},`storage-order-location-${t.key}-${i.id}`)})]})]})]}),e.jsxs("div",{className:"row g-3 mb-3",children:[e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Fecha de inicio"}),e.jsx("input",{type:"date",className:"form-control",value:t.start_date,disabled:r,onChange:i=>W(t.key,{start_date:i.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Nro de meses"}),e.jsx("input",{type:"number",min:"1",className:"form-control",value:t.months,disabled:r,onChange:i=>W(t.key,{months:i.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Fecha fin"}),e.jsx("input",{type:"date",className:"form-control",value:t.end_date,disabled:!0})]})]}),e.jsxs("div",{className:"row g-3",children:[e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Cantidad de m3"}),e.jsx("input",{type:"number",min:"0",step:"0.001",className:"form-control",value:t.quantity_m3,disabled:r,onChange:i=>W(t.key,{quantity_m3:i.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Tarifa"}),e.jsx("input",{type:"number",min:"0",step:"0.01",className:"form-control",value:t.tariff,disabled:r,onChange:i=>W(t.key,{tariff:i.target.value}),required:t.enabled})]}),e.jsxs("div",{className:"col-12 col-sm-4",children:[e.jsx("label",{className:"form-label",children:"Importe mensual"}),e.jsx("input",{type:"number",className:"form-control",value:t.monthly_amount,disabled:!0})]})]}),t.enabled&&(t.billing_dates??[]).length>0&&e.jsx("div",{className:"storage-billing-schedule",children:e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"N° mes"}),e.jsx("th",{children:"Fecha facturación"})]})}),e.jsx("tbody",{children:t.billing_dates.map((i,u)=>e.jsxs("tr",{children:[e.jsx("td",{children:i.month}),e.jsx("td",{children:e.jsx("input",{type:"date",className:"form-control",value:i.date,onChange:x=>dt(t.key,u,x.target.value),required:t.enabled})})]},`storage-order-billing-${t.key}-${i.month}`))})]})})]})]})},`storage-order-block-${t.key}`)})})]}):B?e.jsxs(Se,{modalRef:p,title:e.jsxs("span",{className:"storage-service-order-title",children:[e.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-general-order-dialog modal-dialog-scrollable",contentClass:"storage-general-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-general-order-body",hideFooter:!0,onSubmit:je,children:[e.jsx("style",{children:`
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
        `}),e.jsx("input",{ref:b,hidden:!0}),e.jsx("input",{ref:f,hidden:!0}),e.jsx("input",{ref:w,type:"date",hidden:!0}),e.jsx("input",{ref:V,type:"date",hidden:!0}),e.jsx("input",{ref:H,type:"date",hidden:!0}),e.jsx("input",{ref:K,hidden:!0}),e.jsx("input",{ref:J,hidden:!0}),e.jsx("input",{ref:X,type:"number",hidden:!0}),e.jsx("input",{ref:E,hidden:!0}),e.jsx("input",{ref:k,hidden:!0}),e.jsx("input",{ref:Y,type:"number",hidden:!0}),e.jsx("textarea",{ref:P,hidden:!0}),e.jsx("input",{ref:le,type:"hidden",value:L,readOnly:!0}),e.jsxs("div",{className:"storage-general-order-actions",children:[e.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[e.jsx("i",{className:"mdi mdi-plus me-1"})," Guardar"]}),e.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[e.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),e.jsx("h3",{className:"storage-general-order-heading",children:"Orden de servicio N°"}),e.jsxs("div",{className:"row g-4 align-items-end",children:[e.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[e.jsx("label",{className:"form-label",children:"Empresa"}),e.jsxs("select",{ref:Q,className:"form-select",value:T,onChange:async t=>{var n;te(t.target.value);const s=await ae(t.target.value);z((n=s[0])!=null&&n.id?`${s[0].id}`:"")},required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),ee.map(t=>e.jsx("option",{value:t.id,children:t.name},`general-order-business-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:Z,className:"form-select",value:se,onChange:t=>ce(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),be.map(t=>e.jsxs("option",{value:t.entity_id??t.id,children:[t.document_number?`${t.document_number} | `:"",t.full_name]},`general-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[e.jsx("label",{className:"form-label",children:"Tipo documento"}),e.jsxs("select",{ref:R,className:"form-select",required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"}),e.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),e.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:N,className:"form-select",onChange:t=>ut(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),e.jsx("option",{value:"PEN",children:"Soles"}),e.jsx("option",{value:"USD",children:"Dolares"})]})]})]}),e.jsx("div",{className:"mt-4 mb-3",children:e.jsxs("button",{type:"button",className:"btn btn-outline-primary storage-general-insert",onClick:()=>F(t=>[...t,ne()]),children:[e.jsx("i",{className:"mdi mdi-plus-circle me-1"})," Insertar servicio general"]})}),e.jsx("div",{className:"table-responsive",children:e.jsxs("table",{className:"storage-general-lines",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Servicio"}),e.jsx("th",{style:{width:115},children:"Tarifa"}),e.jsx("th",{style:{width:115},children:"Cantidad"}),e.jsx("th",{style:{width:130},children:"Total"}),e.jsx("th",{style:{width:42}})]})}),e.jsx("tbody",{children:de.map(t=>e.jsxs("tr",{children:[e.jsx("td",{children:e.jsxs("select",{className:"form-select",value:t.service_id,onChange:s=>S(t.uid,"service_id",s.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione servicio"}),oe.map(s=>e.jsx("option",{value:s.id,children:s.name},`general-order-service-${s.id}`))]})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.01",className:"form-control",value:t.unit_price,onChange:s=>S(t.uid,"unit_price",s.target.value)})}),e.jsx("td",{children:e.jsx("input",{type:"number",step:"0.001",min:"0",className:"form-control",value:t.quantity,onChange:s=>S(t.uid,"quantity",s.target.value)})}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:Number(t.total||0).toFixed(2),disabled:!0})}),e.jsx("td",{children:e.jsx("button",{type:"button",className:"btn btn-outline-danger btn-sm",onClick:()=>F(s=>s.filter(n=>n.uid!==t.uid)),children:e.jsx("i",{className:"mdi mdi-close"})})})]},`general-order-item-${t.uid}`))}),e.jsx("tfoot",{children:e.jsxs("tr",{children:[e.jsx("td",{colSpan:"3",className:"storage-general-total-label",children:"Total"}),e.jsx("td",{children:e.jsx("input",{className:"form-control",value:bt.toFixed(2),disabled:!0})}),e.jsx("td",{})]})})]})})]}):e.jsx(Se,{modalRef:p,title:rt?`Editar ${B?"orden de servicio general":"orden de servicio"}`:`Agregar ${B?"orden de servicio general":"orden de servicio"}`,size:"xl",onSubmit:je,children:e.jsxs("div",{className:"row",children:[e.jsx("input",{ref:b,hidden:!0}),e.jsxs("div",{className:"col-md-3 mb-3",children:[e.jsx("label",{className:"form-label",children:"Código"}),e.jsx("input",{ref:f,className:"form-control",disabled:!0})]}),e.jsxs("div",{className:"col-md-3 mb-3",children:[e.jsx("label",{className:"form-label",children:"Empresa"}),e.jsxs("select",{ref:Q,className:"form-control",value:T,onChange:async t=>{te(t.target.value),await ae(t.target.value,"")},required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),ee.map(t=>e.jsx("option",{value:t.id,children:t.name},`service-order-business-${t.id}`))]})]}),e.jsxs("div",{className:"col-md-3 mb-3",children:[e.jsx("label",{className:"form-label",children:"Sede"}),e.jsxs("select",{ref:le,className:"form-control",value:L,onChange:t=>z(t.target.value),children:[e.jsx("option",{value:"",children:"Seleccione"}),Qe.map(t=>e.jsx("option",{value:t.id,children:t.name},`service-order-branch-${t.id}`))]})]}),e.jsxs("div",{className:"col-md-3 mb-3",children:[e.jsx("label",{className:"form-label",children:"Cliente"}),e.jsxs("select",{ref:Z,className:"form-control",value:se,onChange:t=>ce(t.target.value),required:!0,children:[e.jsx("option",{value:"",children:"Seleccione"}),be.map(t=>e.jsx("option",{value:t.entity_id??t.id,children:t.full_name},`service-order-client-${t.id}`))]})]}),e.jsxs("div",{className:"col-md-3 mb-3",children:[e.jsx("label",{className:"form-label",children:"Fecha"}),e.jsx("input",{ref:w,type:"date",className:"form-control",required:!0})]}),e.jsxs("div",{className:"col-md-3 mb-3",children:[e.jsx("label",{className:"form-label",children:"Programada"}),e.jsx("input",{ref:V,type:"date",className:"form-control"})]}),e.jsxs("div",{className:"col-md-3 mb-3",children:[e.jsx("label",{className:"form-label",children:"Primera cuota"}),e.jsx("input",{ref:H,type:"date",className:"form-control"})]}),e.jsxs("div",{className:"col-md-3 mb-3",children:[e.jsx("label",{className:"form-label",children:"Ciclo"}),e.jsx("input",{ref:K,className:"form-control"})]}),e.jsxs("div",{className:"col-md-3 mb-3",children:[e.jsx("label",{className:"form-label",children:"Comprobante"}),e.jsxs("select",{ref:R,className:"form-control",children:[e.jsx("option",{value:"Factura",children:"Factura"}),e.jsx("option",{value:"Boleta",children:"Boleta"})]})]}),e.jsxs("div",{className:"col-md-2 mb-3",children:[e.jsx("label",{className:"form-label",children:"Moneda"}),e.jsxs("select",{ref:N,className:"form-control",children:[e.jsx("option",{value:"PEN",children:"PEN"}),e.jsx("option",{value:"USD",children:"USD"})]})]}),e.jsxs("div",{className:"col-md-2 mb-3",children:[e.jsx("label",{className:"form-label",children:"Pago"}),e.jsxs("select",{ref:J,className:"form-control",children:[e.jsx("option",{value:"Contado",children:"Contado"}),e.jsx("option",{value:"Credito",children:"Crédito"})]})]}),e.jsxs("div",{className:"col-md-2 mb-3",children:[e.jsx("label",{className:"form-label",children:"Cuotas"}),e.jsx("input",{ref:X,type:"number",min:"1",className:"form-control"})]}),e.jsxs("div",{className:"col-md-3 mb-3",children:[e.jsx("label",{className:"form-label",children:"Estado"}),e.jsx("select",{ref:E,className:"form-control",children:ye.map(t=>e.jsx("option",{value:t.value,children:t.label},`service-order-status-${t.value}`))})]}),e.jsxs("div",{className:"col-md-3 mb-3",children:[e.jsx("label",{className:"form-label",children:"Facturación"}),e.jsx("select",{ref:k,className:"form-control",children:Ve.map(t=>e.jsx("option",{value:t.value,children:t.label},`service-order-billing-status-${t.value}`))})]}),e.jsxs("div",{className:"col-md-2 mb-3",children:[e.jsx("label",{className:"form-label",children:"Impuesto"}),e.jsx("input",{ref:Y,type:"number",step:"0.01",className:"form-control"})]}),e.jsxs("div",{className:"col-12 mb-3",children:[e.jsx("label",{className:"form-label",children:"Servicios"}),e.jsxs("div",{className:"border rounded p-2",children:[de.map(t=>e.jsxs("div",{className:"row align-items-end mb-2",children:[e.jsxs("div",{className:"col-md-4",children:[e.jsx("label",{className:"form-label",children:"Servicio"}),e.jsxs("select",{className:"form-control",value:t.service_id,onChange:s=>S(t.uid,"service_id",s.target.value),children:[e.jsx("option",{value:"",children:"Seleccione"}),oe.map(s=>e.jsxs("option",{value:s.id,children:[s.code," - ",s.name]},`service-order-item-${s.id}`))]})]}),e.jsxs("div",{className:"col-md-3",children:[e.jsx("label",{className:"form-label",children:"Descripción"}),e.jsx("input",{className:"form-control",value:t.description,onChange:s=>S(t.uid,"description",s.target.value)})]}),e.jsxs("div",{className:"col-md-1",children:[e.jsx("label",{className:"form-label",children:"Cant."}),e.jsx("input",{type:"number",step:"0.001",className:"form-control",value:t.quantity,onChange:s=>S(t.uid,"quantity",s.target.value)})]}),e.jsxs("div",{className:"col-md-1",children:[e.jsx("label",{className:"form-label",children:"PU"}),e.jsx("input",{type:"number",step:"0.01",className:"form-control",value:t.unit_price,onChange:s=>S(t.uid,"unit_price",s.target.value)})]}),e.jsxs("div",{className:"col-md-1",children:[e.jsx("label",{className:"form-label",children:"Det."}),e.jsx("input",{type:"number",step:"0.01",className:"form-control",value:t.detraction_percent,onChange:s=>S(t.uid,"detraction_percent",s.target.value)})]}),e.jsxs("div",{className:"col-md-1",children:[e.jsx("label",{className:"form-label",children:"Com."}),e.jsx("input",{type:"number",step:"0.01",className:"form-control",value:t.commission_percent,onChange:s=>S(t.uid,"commission_percent",s.target.value)})]}),e.jsxs("div",{className:"col-md-1",children:[e.jsx("label",{className:"form-label",children:"Total"}),e.jsx("input",{className:"form-control",value:Number(t.total||0).toFixed(2),disabled:!0})]}),e.jsx("div",{className:"col-md-1",children:e.jsx("button",{type:"button",className:"btn btn-outline-danger w-100",onClick:()=>F(s=>s.length===1?[ne()]:s.filter(n=>n.uid!==t.uid)),children:"-"})})]},t.uid)),e.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:()=>F(t=>[...t,ne()]),children:"Agregar servicio"})]})]}),e.jsxs("div",{className:"col-12 mb-1",children:[e.jsx("label",{className:"form-label",children:"Observaciones"}),e.jsx("textarea",{ref:P,className:"form-control",rows:"3"})]})]})})]})};$t((a,l)=>{const d=l.requiredPermission??"services-service-order";!l.can(d)&&!l.hasRole("Admin")&&(location.href="/admin/"),Rt(a).render(e.jsx(Ft,{...l,title:l.moduleTitle??"Ordenes de servicio",children:e.jsx(Ht,{...l})}))});
