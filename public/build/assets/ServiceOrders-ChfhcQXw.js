var us=Object.defineProperty;var ps=(a,l,d)=>l in a?us(a,l,{enumerable:!0,configurable:!0,writable:!0,value:d}):a[l]=d;var y=(a,l,d)=>ps(a,typeof l!="symbol"?l+"":l,d);import{m as hs,t as gs,C as fs,c as xs,j as s,r as u,S as W}from"./CreateReactScript-DzmYTmbr.js";import{B as bs}from"./Base-B52FG9I8.js";import{T as vs,g as _s,t as Oe,E as Te,l as ze}from"./Table-Aq4oioSi.js";import{M as Ae}from"./Modal-DGAB1eIb.js";import{D as fe}from"./DxButton-CsjWvhyj.js";import{B as js}from"./BasicRest-DlKnEI0V.js";import{a as E}from"./permissionScope-etO_1UXy.js";import{r as Ns}from"./renderGridEditLink-D8NGEeKJ.js";import{o as ys,b as Ss}from"./magistralesRecordPdf-BE_i2dlL.js";const M=async(a,l={})=>{try{const{status:d,result:h}=await hs.Fetch(a,{method:"POST",body:JSON.stringify({take:1e3,skip:0,isLoadingAll:!0,...l})});if(!d)throw new Error((h==null?void 0:h.message)||"No se pudo cargar la lista");return(h==null?void 0:h.data)??[]}catch(d){return gs.error("Error",{description:d.message,duration:3e3,richColors:!0}),[]}},Cs=()=>location.pathname.includes("/admin/storage-general-service-orders"),Rs=()=>location.pathname.includes("/admin/storage-service-orders");class ws extends js{constructor(){super(...arguments);y(this,"path",E()?Cs()?"admin/storage/general-service-orders":"admin/storage/service-orders":"admin/service-orders");y(this,"getBranchesByBusiness",async d=>d?await this.simpleGet(`/api/${this.path}/businesses/${d}/branches`)??[]:[]);y(this,"getBusinesses",async()=>await M("/api/admin/businesses/paginate"));y(this,"getClients",async()=>await M(E()?"/api/admin/storage/clients/paginate":"/api/admin/clients/paginate"));y(this,"getServices",async()=>await M(E()?"/api/admin/storage/general-service/paginate":"/api/admin/services/paginate",Rs()?{storage_service_types:!0}:{}));y(this,"getStorageOptions",async()=>E()?await this.simpleGet("/api/admin/storage/kardex/options"):null);y(this,"getStorageWarehouses",async()=>E()?await M("/api/admin/storage/kardex/paginate",{section:"warehouses",sort:[{selector:"warehouse_name",desc:!1}]}):[]);y(this,"getStorageLocations",async()=>E()?await M("/api/admin/storage/kardex/paginate",{section:"locations"}):[])}}const v=new ws,re=()=>({uid:crypto.randomUUID(),service_id:"",description:"",quantity:1,unit_price:0,detraction_percent:0,commission_percent:0,total:0}),_=(a="")=>a.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""),$s=["Servicio de almacenamiento","Servicio de almacenamiento - Adicional"],Me=a=>(a==null?void 0:a.name)??(a==null?void 0:a.warehouse_name)??"",Bs=a=>(a==null?void 0:a.id)??(a==null?void 0:a.warehouse_id)??"",Fs=a=>{const l=Bs(a),d=Me(a);return{key:l?`warehouse-${l}`:_(d),warehouse_name:d,warehouse_id:l?`${l}`:"",enabled:!1,location_id:"",location_ids:[],location_label:"",location_labels:[],start_date:"",months:"",end_date:"",billing_dates:[],quantity_m3:"",tariff:"",monthly_amount:""}},le=(a=[])=>a.filter(l=>(l==null?void 0:l.status)!==null).map(Fs),xe=a=>{var l,d,h;return((h=(l=a==null?void 0:a.toString)==null?void 0:(d=l.call(a)).slice)==null?void 0:h.call(d,0,10))??""},U=a=>Number(a||0),be=(a,l,d=!1)=>{if(!a)return"";const h=Number(l);if(!Number.isFinite(h)||h<0||!d&&h<=0)return"";const b=new Date(`${a}T00:00:00`);if(Number.isNaN(b.getTime()))return"";const x=new Date(b),S=x.getDate();return x.setDate(1),x.setMonth(x.getMonth()+h),x.setDate(Math.min(S,new Date(x.getFullYear(),x.getMonth()+1,0).getDate())),x.toISOString().slice(0,10)},We=(a,l)=>{const d=Number.parseInt(l,10);return!a||!Number.isFinite(d)||d<=0?[]:Array.from({length:d},(h,b)=>({month:b+1,date:be(a,b,!0)}))},w=a=>a?[a.code,a.temperature_range].filter(Boolean).join(" | "):"",Ue=(a="")=>a.split(",").map(l=>l.trim()).filter(Boolean),oe=a=>Array.isArray(a.location_ids)?a.location_ids.filter(Boolean).map(l=>`${l}`):a.location_id?[`${a.location_id}`]:[],Is=(a,l)=>[a.warehouse_name,(Array.isArray(l)?l.map(w).filter(Boolean).join(", "):w(l))||a.location_label,`${a.start_date||""} - ${a.end_date||""}`,`${a.months||0} meses`,`${a.quantity_m3||0} m3`].filter(Boolean).join("; "),Ds=(a="")=>{const l=a.split(";").map(h=>h.trim()),d=(l[2]??"").split("-").map(h=>h.trim());return{warehouse_name:l[0]??"",location_label:l[1]??"",location_labels:Ue(l[1]??""),start_date:d.length>=3?`${d[0]}-${d[1]}-${d[2]}`.slice(0,10):"",end_date:d.length>=6?`${d[3]}-${d[4]}-${d[5]}`.slice(0,10):"",months:parseFloat(l[3])||"",quantity_m3:parseFloat(l[4])||""}},qs=({moduleTitle:a="Ordenes de servicio",serviceOrderType:l="service"})=>{const d=u.useRef(),h=u.useRef(),b=u.useRef(),x=u.useRef(),S=u.useRef(),G=u.useRef(),V=u.useRef(),B=u.useRef(),C=u.useRef(),K=u.useRef(),J=u.useRef(),X=u.useRef(),L=u.useRef(),k=u.useRef(),Y=u.useRef(),O=u.useRef(),ce=u.useRef(null),H=u.useRef(),de=u.useRef(),Q=u.useRef(),ve=u.useRef(),[Z,Ge]=u.useState([]),[Ve,Ke]=u.useState([]),[_e,Je]=u.useState([]),[me,Xe]=u.useState([]),[T,ee]=u.useState(""),[z,A]=u.useState(""),[se,ue]=u.useState(""),[je,Ne]=u.useState(""),[ye,te]=u.useState([re()]),[F,Ye]=u.useState([]),[I,He]=u.useState([]),[Se,ie]=u.useState(()=>le()),[Ce,Qe]=u.useState(!1),[Ze,Re]=u.useState(""),[es,ss]=u.useState(!1),we=l==="storage_general",j=l==="storage_service",ts=me.filter(e=>$s.some(t=>_(t)===_(e.name))),$e=Object.fromEntries(me.map(e=>[`${e.id}`,e])),Be=async()=>{if(!j)return{warehouseRows:[],locationRows:[]};ce.current||(ce.current=(async()=>{const n=await v.getStorageOptions();let r=((n==null?void 0:n.warehouses)??[]).filter(c=>c.status!==null),o=((n==null?void 0:n.locations)??[]).filter(c=>c.status!==null);if(!r.length||!o.length){const[c,m]=await Promise.all([o.length?Promise.resolve(o):v.getStorageLocations(),r.length?Promise.resolve(r):v.getStorageWarehouses()]);r=(r.length?r:m??[]).filter(i=>i.status!==null),o=(o.length?o:c??[]).filter(i=>i.status!==null)}return{warehouseRows:r,locationRows:o}})());const{warehouseRows:e,locationRows:t}=await ce.current;return Ye(e),He(t),Qe(!0),{warehouseRows:e,locationRows:t}};u.useEffect(()=>{(async()=>{var i;const t=j?Be():Promise.resolve({warehouseRows:[],locationRows:[]}),[n,r,o,c]=await Promise.all([v.getBusinesses(),v.getClients(),v.getServices(),t]),m=n??[];if(Ge(m),Je((r??[]).filter(p=>p.status!==null)),Xe((o??[]).filter(p=>p.status!==null)),j){ie(le(c.warehouseRows));const p=m[0];if(p){ee(`${p.id}`);const f=await ae(p.id);(i=f[0])!=null&&i.id&&A(`${f[0].id}`)}}})()},[]);const ae=async(e,t="")=>{const r=await v.getBranchesByBusiness(e)??[];return Ke(r),A(t?`${t}`:""),r},is=e=>({...e,total:Number(e.quantity||0)*Number(e.unit_price||0)}),R=(e,t="")=>{var n;return((n=e.current)==null?void 0:n.value)||t||""},Fe=(e,t=F)=>t.find(n=>_(Me(n))===_(e)),Ie=(e,t=F)=>{var n;return e.warehouse_id||((n=Fe(e.warehouse_name,t))==null?void 0:n.id)||""},De=(e,t=I,n=F)=>{const r=Ie(e,n);return t.filter(o=>r&&`${o.warehouse_id}`==`${r}`?!0:_(o.warehouse_name)===_(e.warehouse_name))},qe=(e,t=I,n=F)=>{const r=De(e,t,n),o=oe(e),c=o.length?r.filter(i=>o.includes(`${i.id}`)):[];return c.length?c:(Array.isArray(e.location_labels)&&e.location_labels.length?e.location_labels:Ue(e.location_label)).map(i=>r.find(p=>_(w(p))===_(i))).filter(Boolean)},as=(e=[],t=F,n=I)=>{const r=le(t);return e.forEach(o=>{var f,N;const c=Ds(o.description??""),m=r.findIndex(P=>_(P.warehouse_name)===_(c.warehouse_name));if(m<0)return;const i={...r[m],enabled:!0,warehouse_id:((f=Fe(r[m].warehouse_name,t))==null?void 0:f.id)??r[m].warehouse_id,location_label:c.location_label,location_labels:c.location_labels,start_date:c.start_date,months:c.months||"",end_date:c.end_date||be(c.start_date,c.months),billing_dates:We(c.start_date,c.months),quantity_m3:c.quantity_m3||Number(o.quantity||0)||"",tariff:Number(o.unit_price||0)||"",monthly_amount:Number(o.total||0)||""},p=qe(i,n,t);r[m]={...i,location_id:(N=p[0])!=null&&N.id?`${p[0].id}`:"",location_ids:p.map(P=>`${P.id}`)}}),r},D=(e,t)=>{ie(n=>n.map(r=>{if(r.key!==e)return r;const o="location_ids"in t?(Array.isArray(t.location_ids)?t.location_ids:[t.location_ids]).filter(Boolean).map(p=>`${p}`):null,c=t.location_id?I.find(p=>`${p.id}`==`${t.location_id}`):null,m=o?I.filter(p=>o.includes(`${p.id}`)):null,i={...r,...t,warehouse_id:Ie(r)};if(c&&(i.location_label=w(c)),m&&(i.location_ids=o,i.location_id=o[0]??"",i.location_labels=m.map(w).filter(Boolean),i.location_label=i.location_labels.join(", ")),("start_date"in t||"months"in t)&&(i.end_date=be(i.start_date,i.months),i.billing_dates=We(i.start_date,i.months)),"quantity_m3"in t||"tariff"in t){const p=U(i.quantity_m3)*U(i.tariff);i.monthly_amount=p?p.toFixed(2):""}return i}))},ns=(e,t,n)=>{ie(r=>r.map(o=>o.key!==e?o:{...o,billing_dates:(o.billing_dates??[]).map((c,m)=>m===t?{...c,date:n}:c)}))},rs=(e,t)=>{const n=`${t}`,r=oe(e),o=r.includes(n)?r.filter(c=>c!==n):[...r,n];D(e.key,{location_ids:o})},pe=async(e=null)=>{var m,i,p;ss(!!(e!=null&&e.id)),b.current.value=(e==null?void 0:e.id)??"",x.current.value=(e==null?void 0:e.code)??"Se genera al guardar",S.current.value=xe(e==null?void 0:e.issue_date)||new Date().toISOString().slice(0,10),G.current.value=xe(e==null?void 0:e.scheduled_at),V.current.value=xe(e==null?void 0:e.first_due_date),B.current.value=(e==null?void 0:e.expected_document_type)??(j?"":"Factura"),C.current.value=(e==null?void 0:e.currency)??(j?"":"PEN"),K.current.value=(e==null?void 0:e.billing_cycle)??"",J.current.value=(e==null?void 0:e.payment_condition)??"Contado",X.current.value=Number((e==null?void 0:e.installments)??1),L.current.value=(e==null?void 0:e.order_status)??"draft",k.current.value=(e==null?void 0:e.billing_status)??"pending",Y.current.value=Number((e==null?void 0:e.tax_amount)??0),O.current.value=(e==null?void 0:e.observations)??"";const t=e!=null&&e.business_id?`${e.business_id}`:T||((m=Z[0])!=null&&m.id?`${Z[0].id}`:"");ee(t),ue(e!=null&&e.client_id?`${e.client_id}`:"");const n=await ae(t,(e==null?void 0:e.business_branch_id)??z);!(e!=null&&e.business_branch_id)&&!z&&((i=n[0])!=null&&i.id)&&A(`${n[0].id}`);const r=((e==null?void 0:e.items)??[]).map(f=>({uid:crypto.randomUUID(),service_id:`${f.service_id}`,description:f.description??"",quantity:Number(f.quantity||0),unit_price:Number(f.unit_price||0),detraction_percent:Number(f.detraction_percent||0),commission_percent:Number(f.commission_percent||0),total:Number(f.total||0)}));Ne(((p=r[0])==null?void 0:p.service_id)??"");let o=F,c=I;if(j&&(!o.length||!c.length||!Ce)){const f=await Be();o=f.warehouseRows,c=f.locationRows}ie(j?as((e==null?void 0:e.items)??[],o,c):le()),te(r.length?r:[re()]),$(h.current).modal("show")},q=(e,t,n)=>{te(r=>r.map(o=>{var m;if(o.uid!==e)return o;const c={...o,[t]:n};if(t==="service_id"){const i=$e[n];c.description=c.description||(i==null?void 0:i.name)||"",c.unit_price=Number(((m=C.current)==null?void 0:m.value)==="USD"?i==null?void 0:i.unit_price_usd:i==null?void 0:i.unit_price_pen)||0}return is(c)}))},Pe=async e=>{if(e.preventDefault(),j){const m=R(H,T),i=R(de,z),p=R(Q,se),f=R(ve,je),N=Se.filter(g=>g.enabled),P=N.find(g=>!oe(g).length||!g.start_date||!g.months||!g.end_date||!g.quantity_m3||!g.tariff);if(!m||!i||!p||!B.current.value||!C.current.value||!f){W.fire("Formulario incompleto","Completa empresa, cliente, tipo documento, moneda y tipo de servicio.","warning");return}if(!N.length){W.fire("Formulario incompleto","Selecciona al menos un almacen.","warning");return}if(P){W.fire("Formulario incompleto",`Completa los datos de ${P.warehouse_name}.`,"warning");return}const Ee=N.find(g=>{const ge=Number.parseInt(g.months,10);return!Array.isArray(g.billing_dates)||g.billing_dates.length!==ge||g.billing_dates.some(ne=>!ne.date)});if(Ee){W.fire("Formulario incompleto",`Completa las fechas de facturacion de ${Ee.warehouse_name}.`,"warning");return}const Le=N.map(g=>g.start_date).filter(Boolean).sort(),os=Math.max(...N.map(g=>Number(g.months||1))),he=$e[f],cs={id:b.current.value||void 0,business_id:m||null,business_branch_id:i||null,client_id:p||null,expected_document_type:B.current.value,currency:C.current.value,billing_cycle:(he==null?void 0:he.name)??"",payment_condition:"Contado",installments:os||1,issue_date:S.current.value||new Date().toISOString().slice(0,10),scheduled_at:Le[0]??null,first_due_date:Le[0]??null,order_status:L.current.value||"draft",billing_status:k.current.value||"pending",tax_amount:0,observations:O.current.value.trim(),items:N.map(g=>{const ge=qe(g),ne=U(g.quantity_m3),ke=U(g.tariff),ds=U(g.monthly_amount)||ne*ke;return{service_id:f,description:Is(g,ge),quantity:ne,unit_price:ke,detraction_percent:0,commission_percent:0,total:ds,billing_dates:(g.billing_dates??[]).map(ms=>ms.date)}})};if(!await v.save(cs))return;$(d.current).dxDataGrid("instance").refresh(),$(h.current).modal("hide");return}const t=R(H,T),n=R(de,z),r=R(Q,se),o={id:b.current.value||void 0,business_id:t||null,business_branch_id:n||null,client_id:r||null,expected_document_type:B.current.value,currency:C.current.value,billing_cycle:K.current.value.trim(),payment_condition:J.current.value,installments:X.current.value,issue_date:S.current.value,scheduled_at:G.current.value||null,first_due_date:V.current.value||null,order_status:L.current.value,billing_status:k.current.value,tax_amount:Y.current.value,observations:O.current.value.trim(),items:ye.filter(m=>m.service_id).map(m=>({service_id:m.service_id,description:m.description,quantity:m.quantity,unit_price:m.unit_price,detraction_percent:m.detraction_percent,commission_percent:m.commission_percent,total:m.total}))};await v.save(o)&&($(d.current).dxDataGrid("instance").refresh(),$(h.current).modal("hide"))},ls=async e=>{const{isConfirmed:t}=await W.fire({title:"Eliminar orden de servicio",text:"Se dara de baja la orden.",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!t||!await v.delete(e)||$(d.current).dxDataGrid("instance").refresh()};return s.jsxs(s.Fragment,{children:[s.jsx(vs,{gridRef:d,title:a,rest:v,pageSize:25,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",onClick:()=>$(d.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"add",onClick:()=>pe()}})},columns:[{dataField:"id",caption:"ID",width:70},{dataField:"code",caption:"Codigo",width:120,cellTemplate:(e,{data:t})=>Ns(e,t==null?void 0:t.code,()=>pe(t),"Editar orden de servicio")},{dataField:"issue_date",caption:"Fecha",dataType:"date",width:110},{dataField:"scheduled_at",caption:"Programada",dataType:"date",width:115},{dataField:"business.name",caption:"Empresa",minWidth:140},{dataField:"branch.name",caption:"Sede",minWidth:130},{dataField:"client.full_name",caption:"Cliente",minWidth:200},{dataField:"billing_cycle",caption:"Ciclo",minWidth:130},{dataField:"expected_document_type",caption:"Comp.",width:100},{dataField:"currency",caption:"Moneda",width:90},{dataField:"subtotal",caption:"Subtotal",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"Impuesto",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{caption:"Detalle",minWidth:260,allowFiltering:!1,calculateCellValue:e=>(e.items??[]).map(t=>{var n,r;return`${Number(t.quantity||0).toFixed(3)} ${((n=t.service)==null?void 0:n.billing_unit)??""} ${t.description??((r=t.service)==null?void 0:r.name)??""}`.trim()}).join(" | ")},{dataField:"accounts_receivable_code",caption:"CXC",width:130,calculateCellValue:e=>{var t,n;return((t=e.accounts_receivable)==null?void 0:t.code)??((n=e.accountsReceivable)==null?void 0:n.code)??"-"}},{dataField:"payment_status",caption:"Cobranza",width:110,calculateCellValue:e=>{var t,n;return _s(((t=e.accounts_receivable)==null?void 0:t.payment_status)??((n=e.accountsReceivable)==null?void 0:n.payment_status)??e.payment_status??"-")}},{dataField:"order_status",caption:"Estado",width:110,lookup:Oe(Te)},{dataField:"billing_status",caption:"Facturacion",width:110,lookup:Oe(ze)},{dataField:"creator.fullname",caption:"Creado por",minWidth:140,visible:!1},{dataField:"updater.fullname",caption:"Actualizado por",minWidth:140,visible:!1},{caption:"Acciones",width:170,allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:t})=>{e.css("text-overflow","unset"),e.append(fe({className:"btn btn-xs btn-soft-primary",title:"Editar",icon:"mdi mdi-pencil",onClick:()=>pe(t)})),e.append(fe({className:"btn btn-xs btn-soft-danger ms-1",title:"Imprimir PDF",icon:"mdi mdi-file-pdf-box",onClick:()=>ys(Ss.serviceOrder(t))})),e.append(fe({className:"btn btn-xs btn-soft-danger ms-1",title:"Eliminar",icon:"mdi mdi-delete",onClick:()=>ls(t.id)}))}}]}),j?s.jsxs(Ae,{modalRef:h,title:s.jsxs("span",{className:"storage-service-order-title",children:[s.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-service-order-dialog modal-dialog-scrollable",contentClass:"storage-service-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-service-order-body",hideFooter:!0,onSubmit:Pe,children:[s.jsx("style",{children:`
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
        `}),s.jsx("input",{ref:b,hidden:!0}),s.jsx("input",{ref:x,hidden:!0}),s.jsx("input",{ref:S,type:"date",hidden:!0}),s.jsx("input",{ref:G,type:"date",hidden:!0}),s.jsx("input",{ref:V,type:"date",hidden:!0}),s.jsx("input",{ref:K,hidden:!0}),s.jsx("input",{ref:J,hidden:!0}),s.jsx("input",{ref:X,type:"number",hidden:!0}),s.jsx("input",{ref:L,hidden:!0}),s.jsx("input",{ref:k,hidden:!0}),s.jsx("input",{ref:Y,type:"number",hidden:!0}),s.jsx("textarea",{ref:O,hidden:!0}),s.jsxs("div",{className:"storage-service-order-actions",children:[s.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[s.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]}),s.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[s.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),s.jsx("h3",{className:"storage-service-order-heading",children:"Orden de servicio N°"}),s.jsxs("div",{className:"row g-4 align-items-end",children:[s.jsxs("div",{className:"col-12 col-md-6 col-xl",children:[s.jsx("label",{className:"form-label",children:"Empresa"}),s.jsxs("select",{ref:H,className:"form-select",value:T,onChange:async e=>{var n;ee(e.target.value);const t=await ae(e.target.value);A((n=t[0])!=null&&n.id?`${t[0].id}`:"")},required:!0,children:[s.jsx("option",{value:"",children:"Seleccione"}),Z.map(e=>s.jsx("option",{value:e.id,children:e.name},`storage-order-business-${e.id}`))]})]}),s.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[s.jsx("label",{className:"form-label",children:"Cliente"}),s.jsxs("select",{ref:Q,className:"form-select",value:se,onChange:e=>ue(e.target.value),required:!0,children:[s.jsx("option",{value:"",children:"Seleccione"}),_e.map(e=>s.jsxs("option",{value:e.id,children:[e.document_number?`${e.document_number} | `:"",e.full_name]},`storage-order-client-${e.id}`))]})]}),s.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[s.jsx("label",{className:"form-label",children:"Tipo documento"}),s.jsxs("select",{ref:B,className:"form-select",required:!0,children:[s.jsx("option",{value:"",children:"Seleccione"}),s.jsx("option",{value:"Factura",children:"Factura"}),s.jsx("option",{value:"Boleta",children:"Boleta"}),s.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),s.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[s.jsx("label",{className:"form-label",children:"Moneda"}),s.jsxs("select",{ref:C,className:"form-select",required:!0,children:[s.jsx("option",{value:"",children:"Seleccione"}),s.jsx("option",{value:"PEN",children:"Soles"}),s.jsx("option",{value:"USD",children:"Dolares"})]})]}),s.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[s.jsx("label",{className:"form-label",children:"Tipo de servicio"}),s.jsxs("select",{ref:ve,className:"form-select",value:je,onChange:e=>Ne(e.target.value),required:!0,children:[s.jsx("option",{value:"",children:"Seleccione"}),ts.map(e=>s.jsx("option",{value:e.id,children:e.name},`storage-order-service-${e.id}`))]})]})]}),s.jsx("div",{className:"storage-service-order-separator"}),s.jsx("div",{className:"row g-3",children:Se.map(e=>{const t=De(e),n=j&&!Ce,r=!e.enabled||n,o=oe(e),c=t.filter(i=>o.includes(`${i.id}`)),m=Ze===e.key;return s.jsx("div",{className:"col-12 col-lg-4",children:s.jsxs("div",{className:"storage-service-card",children:[s.jsxs("div",{className:"storage-service-card-header",children:[s.jsx("input",{type:"checkbox",className:"form-check-input storage-order-checkbox",checked:e.enabled,onChange:i=>{D(e.key,{enabled:i.target.checked}),i.target.checked||Re("")}}),s.jsx("p",{className:"storage-service-card-title",children:e.warehouse_name})]}),s.jsxs("div",{className:"storage-service-card-body",children:[s.jsxs("div",{className:"mb-3",children:[s.jsx("label",{className:"form-label",children:"Ubicación"}),s.jsxs("div",{className:"storage-location-picker",children:[s.jsxs("button",{type:"button",className:"storage-location-picker-toggle",disabled:r,onClick:()=>Re(i=>i===e.key?"":e.key),children:[s.jsxs("span",{className:"storage-location-picker-values",children:[n&&s.jsx("span",{className:"storage-location-picker-placeholder",children:"Cargando ubicaciones..."}),!n&&!c.length&&s.jsx("span",{className:"storage-location-picker-placeholder",children:t.length?"Seleccione ubicaciones":"Sin ubicaciones"}),c.map(i=>s.jsx("span",{className:"storage-location-chip",children:w(i)},`storage-order-location-chip-${e.key}-${i.id}`))]}),s.jsx("i",{className:"mdi mdi-chevron-down"})]}),m&&!r&&s.jsxs("div",{className:"storage-location-picker-menu",children:[!t.length&&s.jsx("div",{className:"storage-location-empty",children:"Sin ubicaciones"}),t.map(i=>{const p=`${i.id}`;return s.jsxs("label",{className:"storage-location-option",children:[s.jsx("input",{type:"checkbox",checked:o.includes(p),onChange:()=>rs(e,p)}),s.jsx("span",{children:w(i)})]},`storage-order-location-${e.key}-${i.id}`)})]})]})]}),s.jsxs("div",{className:"row g-3 mb-3",children:[s.jsxs("div",{className:"col-12 col-sm-4",children:[s.jsx("label",{className:"form-label",children:"Fecha de inicio"}),s.jsx("input",{type:"date",className:"form-control",value:e.start_date,disabled:r,onChange:i=>D(e.key,{start_date:i.target.value}),required:e.enabled})]}),s.jsxs("div",{className:"col-12 col-sm-4",children:[s.jsx("label",{className:"form-label",children:"Nro de meses"}),s.jsx("input",{type:"number",min:"1",className:"form-control",value:e.months,disabled:r,onChange:i=>D(e.key,{months:i.target.value}),required:e.enabled})]}),s.jsxs("div",{className:"col-12 col-sm-4",children:[s.jsx("label",{className:"form-label",children:"Fecha fin"}),s.jsx("input",{type:"date",className:"form-control",value:e.end_date,disabled:!0})]})]}),s.jsxs("div",{className:"row g-3",children:[s.jsxs("div",{className:"col-12 col-sm-4",children:[s.jsx("label",{className:"form-label",children:"Cantidad de m3"}),s.jsx("input",{type:"number",min:"0",step:"0.001",className:"form-control",value:e.quantity_m3,disabled:r,onChange:i=>D(e.key,{quantity_m3:i.target.value}),required:e.enabled})]}),s.jsxs("div",{className:"col-12 col-sm-4",children:[s.jsx("label",{className:"form-label",children:"Tarifa"}),s.jsx("input",{type:"number",min:"0",step:"0.01",className:"form-control",value:e.tariff,disabled:r,onChange:i=>D(e.key,{tariff:i.target.value}),required:e.enabled})]}),s.jsxs("div",{className:"col-12 col-sm-4",children:[s.jsx("label",{className:"form-label",children:"Importe mensual"}),s.jsx("input",{type:"number",className:"form-control",value:e.monthly_amount,disabled:!0})]})]}),e.enabled&&(e.billing_dates??[]).length>0&&s.jsx("div",{className:"storage-billing-schedule",children:s.jsxs("table",{children:[s.jsx("thead",{children:s.jsxs("tr",{children:[s.jsx("th",{children:"N° mes"}),s.jsx("th",{children:"Fecha facturación"})]})}),s.jsx("tbody",{children:e.billing_dates.map((i,p)=>s.jsxs("tr",{children:[s.jsx("td",{children:i.month}),s.jsx("td",{children:s.jsx("input",{type:"date",className:"form-control",value:i.date,onChange:f=>ns(e.key,p,f.target.value),required:e.enabled})})]},`storage-order-billing-${e.key}-${i.month}`))})]})})]})]})},`storage-order-block-${e.key}`)})})]}):s.jsx(Ae,{modalRef:h,title:es?`Editar ${we?"orden de servicio general":"orden de servicio"}`:`Agregar ${we?"orden de servicio general":"orden de servicio"}`,size:"xl",onSubmit:Pe,children:s.jsxs("div",{className:"row",children:[s.jsx("input",{ref:b,hidden:!0}),s.jsxs("div",{className:"col-md-3 mb-3",children:[s.jsx("label",{className:"form-label",children:"Código"}),s.jsx("input",{ref:x,className:"form-control",disabled:!0})]}),s.jsxs("div",{className:"col-md-3 mb-3",children:[s.jsx("label",{className:"form-label",children:"Empresa"}),s.jsxs("select",{ref:H,className:"form-control",value:T,onChange:async e=>{ee(e.target.value),await ae(e.target.value,"")},required:!0,children:[s.jsx("option",{value:"",children:"Seleccione"}),Z.map(e=>s.jsx("option",{value:e.id,children:e.name},`service-order-business-${e.id}`))]})]}),s.jsxs("div",{className:"col-md-3 mb-3",children:[s.jsx("label",{className:"form-label",children:"Sede"}),s.jsxs("select",{ref:de,className:"form-control",value:z,onChange:e=>A(e.target.value),children:[s.jsx("option",{value:"",children:"Seleccione"}),Ve.map(e=>s.jsx("option",{value:e.id,children:e.name},`service-order-branch-${e.id}`))]})]}),s.jsxs("div",{className:"col-md-3 mb-3",children:[s.jsx("label",{className:"form-label",children:"Cliente"}),s.jsxs("select",{ref:Q,className:"form-control",value:se,onChange:e=>ue(e.target.value),required:!0,children:[s.jsx("option",{value:"",children:"Seleccione"}),_e.map(e=>s.jsx("option",{value:e.id,children:e.full_name},`service-order-client-${e.id}`))]})]}),s.jsxs("div",{className:"col-md-3 mb-3",children:[s.jsx("label",{className:"form-label",children:"Fecha"}),s.jsx("input",{ref:S,type:"date",className:"form-control",required:!0})]}),s.jsxs("div",{className:"col-md-3 mb-3",children:[s.jsx("label",{className:"form-label",children:"Programada"}),s.jsx("input",{ref:G,type:"date",className:"form-control"})]}),s.jsxs("div",{className:"col-md-3 mb-3",children:[s.jsx("label",{className:"form-label",children:"Primera cuota"}),s.jsx("input",{ref:V,type:"date",className:"form-control"})]}),s.jsxs("div",{className:"col-md-3 mb-3",children:[s.jsx("label",{className:"form-label",children:"Ciclo"}),s.jsx("input",{ref:K,className:"form-control"})]}),s.jsxs("div",{className:"col-md-3 mb-3",children:[s.jsx("label",{className:"form-label",children:"Comprobante"}),s.jsxs("select",{ref:B,className:"form-control",children:[s.jsx("option",{value:"Factura",children:"Factura"}),s.jsx("option",{value:"Boleta",children:"Boleta"})]})]}),s.jsxs("div",{className:"col-md-2 mb-3",children:[s.jsx("label",{className:"form-label",children:"Moneda"}),s.jsxs("select",{ref:C,className:"form-control",children:[s.jsx("option",{value:"PEN",children:"PEN"}),s.jsx("option",{value:"USD",children:"USD"})]})]}),s.jsxs("div",{className:"col-md-2 mb-3",children:[s.jsx("label",{className:"form-label",children:"Pago"}),s.jsxs("select",{ref:J,className:"form-control",children:[s.jsx("option",{value:"Contado",children:"Contado"}),s.jsx("option",{value:"Credito",children:"Crédito"})]})]}),s.jsxs("div",{className:"col-md-2 mb-3",children:[s.jsx("label",{className:"form-label",children:"Cuotas"}),s.jsx("input",{ref:X,type:"number",min:"1",className:"form-control"})]}),s.jsxs("div",{className:"col-md-3 mb-3",children:[s.jsx("label",{className:"form-label",children:"Estado"}),s.jsx("select",{ref:L,className:"form-control",children:Te.map(e=>s.jsx("option",{value:e.value,children:e.label},`service-order-status-${e.value}`))})]}),s.jsxs("div",{className:"col-md-3 mb-3",children:[s.jsx("label",{className:"form-label",children:"Facturación"}),s.jsx("select",{ref:k,className:"form-control",children:ze.map(e=>s.jsx("option",{value:e.value,children:e.label},`service-order-billing-status-${e.value}`))})]}),s.jsxs("div",{className:"col-md-2 mb-3",children:[s.jsx("label",{className:"form-label",children:"Impuesto"}),s.jsx("input",{ref:Y,type:"number",step:"0.01",className:"form-control"})]}),s.jsxs("div",{className:"col-12 mb-3",children:[s.jsx("label",{className:"form-label",children:"Servicios"}),s.jsxs("div",{className:"border rounded p-2",children:[ye.map(e=>s.jsxs("div",{className:"row align-items-end mb-2",children:[s.jsxs("div",{className:"col-md-4",children:[s.jsx("label",{className:"form-label",children:"Servicio"}),s.jsxs("select",{className:"form-control",value:e.service_id,onChange:t=>q(e.uid,"service_id",t.target.value),children:[s.jsx("option",{value:"",children:"Seleccione"}),me.map(t=>s.jsxs("option",{value:t.id,children:[t.code," - ",t.name]},`service-order-item-${t.id}`))]})]}),s.jsxs("div",{className:"col-md-3",children:[s.jsx("label",{className:"form-label",children:"Descripción"}),s.jsx("input",{className:"form-control",value:e.description,onChange:t=>q(e.uid,"description",t.target.value)})]}),s.jsxs("div",{className:"col-md-1",children:[s.jsx("label",{className:"form-label",children:"Cant."}),s.jsx("input",{type:"number",step:"0.001",className:"form-control",value:e.quantity,onChange:t=>q(e.uid,"quantity",t.target.value)})]}),s.jsxs("div",{className:"col-md-1",children:[s.jsx("label",{className:"form-label",children:"PU"}),s.jsx("input",{type:"number",step:"0.01",className:"form-control",value:e.unit_price,onChange:t=>q(e.uid,"unit_price",t.target.value)})]}),s.jsxs("div",{className:"col-md-1",children:[s.jsx("label",{className:"form-label",children:"Det."}),s.jsx("input",{type:"number",step:"0.01",className:"form-control",value:e.detraction_percent,onChange:t=>q(e.uid,"detraction_percent",t.target.value)})]}),s.jsxs("div",{className:"col-md-1",children:[s.jsx("label",{className:"form-label",children:"Com."}),s.jsx("input",{type:"number",step:"0.01",className:"form-control",value:e.commission_percent,onChange:t=>q(e.uid,"commission_percent",t.target.value)})]}),s.jsxs("div",{className:"col-md-1",children:[s.jsx("label",{className:"form-label",children:"Total"}),s.jsx("input",{className:"form-control",value:Number(e.total||0).toFixed(2),disabled:!0})]}),s.jsx("div",{className:"col-md-1",children:s.jsx("button",{type:"button",className:"btn btn-outline-danger w-100",onClick:()=>te(t=>t.length===1?[re()]:t.filter(n=>n.uid!==e.uid)),children:"-"})})]},e.uid)),s.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:()=>te(e=>[...e,re()]),children:"Agregar servicio"})]})]}),s.jsxs("div",{className:"col-12 mb-1",children:[s.jsx("label",{className:"form-label",children:"Observaciones"}),s.jsx("textarea",{ref:O,className:"form-control",rows:"3"})]})]})})]})};fs((a,l)=>{const d=l.requiredPermission??"services-service-order";!l.can(d)&&!l.hasRole("Admin")&&(location.href="/admin/"),xs(a).render(s.jsx(bs,{...l,title:l.moduleTitle??"Ordenes de servicio",children:s.jsx(qs,{...l})}))});
