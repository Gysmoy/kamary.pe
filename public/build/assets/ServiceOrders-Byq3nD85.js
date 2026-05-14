var bt=Object.defineProperty;var vt=(i,o,d)=>o in i?bt(i,o,{enumerable:!0,configurable:!0,writable:!0,value:d}):i[o]=d;var y=(i,o,d)=>vt(i,typeof o!="symbol"?o+"":o,d);import{m as _t,t as jt,C as Nt,c as yt,j as t,r as u,S as W}from"./CreateReactScript-BENswndG.js";import{B as St}from"./Base-CX9Q2b96.js";import{T as Ct,E as xe,l as We,t as oe,g as wt}from"./Table-u9H_2qBG.js";import{M as Me}from"./Modal-CbPjkQWl.js";import{D as be}from"./DxButton-CsjWvhyj.js";import{B as Rt}from"./BasicRest-DykgTud3.js";import{a as P}from"./permissionScope-etO_1UXy.js";import{r as Ue}from"./renderGridEditLink-D8NGEeKJ.js";import{o as $t,b as Ft}from"./magistralesRecordPdf-JjK8YfQl.js";const M=async(i,o={})=>{try{const{status:d,result:h}=await _t.Fetch(i,{method:"POST",body:JSON.stringify({take:1e3,skip:0,isLoadingAll:!0,...o})});if(!d)throw new Error((h==null?void 0:h.message)||"No se pudo cargar la lista");return(h==null?void 0:h.data)??[]}catch(d){return jt.error("Error",{description:d.message,duration:3e3,richColors:!0}),[]}},Bt=()=>location.pathname.includes("/admin/storage-general-service-orders"),It=()=>location.pathname.includes("/admin/storage-service-orders");class Dt extends Rt{constructor(){super(...arguments);y(this,"path",P()?Bt()?"admin/storage/general-service-orders":"admin/storage/service-orders":"admin/service-orders");y(this,"getBranchesByBusiness",async d=>d?await this.simpleGet(`/api/${this.path}/businesses/${d}/branches`)??[]:[]);y(this,"getBusinesses",async()=>await M("/api/admin/businesses/paginate"));y(this,"getClients",async()=>await M(P()?"/api/admin/storage/clients/paginate":"/api/admin/clients/paginate"));y(this,"getServices",async()=>await M(P()?"/api/admin/storage/general-service/paginate":"/api/admin/services/paginate",It()?{storage_service_types:!0}:{}));y(this,"getStorageOptions",async()=>P()?await this.simpleGet("/api/admin/storage/kardex/options"):null);y(this,"getStorageWarehouses",async()=>P()?await M("/api/admin/storage/kardex/paginate",{section:"warehouses",sort:[{selector:"warehouse_name",desc:!1}]}):[]);y(this,"getStorageLocations",async()=>P()?await M("/api/admin/storage/kardex/paginate",{section:"locations"}):[])}}const _=new Dt,qt=i=>(i==null?void 0:i.fullname)||[i==null?void 0:i.name,i==null?void 0:i.lastname].filter(Boolean).join(" ")||(i==null?void 0:i.username)||"",le=()=>({uid:crypto.randomUUID(),service_id:"",description:"",quantity:1,unit_price:0,detraction_percent:0,commission_percent:0,total:0}),j=(i="")=>i.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""),Et=["Servicio de almacenamiento","Servicio de almacenamiento - Adicional"],Pt=[{value:"PEN",label:"Soles"},{value:"USD",label:"Dolares"}],Ve=i=>(i==null?void 0:i.name)??(i==null?void 0:i.warehouse_name)??"",Ot=i=>(i==null?void 0:i.id)??(i==null?void 0:i.warehouse_id)??"",kt=i=>{const o=Ot(i),d=Ve(i);return{key:o?`warehouse-${o}`:j(d),warehouse_name:d,warehouse_id:o?`${o}`:"",enabled:!1,location_id:"",location_ids:[],location_label:"",location_labels:[],start_date:"",months:"",end_date:"",billing_dates:[],quantity_m3:"",tariff:"",monthly_amount:""}},ce=(i=[])=>i.filter(o=>(o==null?void 0:o.status)!==null).map(kt),ve=i=>{var o,d,h;return((h=(o=i==null?void 0:i.toString)==null?void 0:(d=o.call(i)).slice)==null?void 0:h.call(d,0,10))??""},U=i=>Number(i||0),_e=(i,o,d=!1)=>{if(!i)return"";const h=Number(o);if(!Number.isFinite(h)||h<0||!d&&h<=0)return"";const v=new Date(`${i}T00:00:00`);if(Number.isNaN(v.getTime()))return"";const b=new Date(v),S=b.getDate();return b.setDate(1),b.setMonth(b.getMonth()+h),b.setDate(Math.min(S,new Date(b.getFullYear(),b.getMonth()+1,0).getDate())),b.toISOString().slice(0,10)},Ge=(i,o)=>{const d=Number.parseInt(o,10);return!i||!Number.isFinite(d)||d<=0?[]:Array.from({length:d},(h,v)=>({month:v+1,date:_e(i,v,!0)}))},R=i=>i?[i.code,i.temperature_range].filter(Boolean).join(" | "):"",He=(i="")=>i.split(",").map(o=>o.trim()).filter(Boolean),de=i=>Array.isArray(i.location_ids)?i.location_ids.filter(Boolean).map(o=>`${o}`):i.location_id?[`${i.location_id}`]:[],Lt=(i,o)=>[i.warehouse_name,(Array.isArray(o)?o.map(R).filter(Boolean).join(", "):R(o))||i.location_label,`${i.start_date||""} - ${i.end_date||""}`,`${i.months||0} meses`,`${i.quantity_m3||0} m3`].filter(Boolean).join("; "),Tt=(i="")=>{const o=i.split(";").map(h=>h.trim()),d=(o[2]??"").split("-").map(h=>h.trim());return{warehouse_name:o[0]??"",location_label:o[1]??"",location_labels:He(o[1]??""),start_date:d.length>=3?`${d[0]}-${d[1]}-${d[2]}`.slice(0,10):"",end_date:d.length>=6?`${d[3]}-${d[4]}-${d[5]}`.slice(0,10):"",months:parseFloat(o[3])||"",quantity_m3:parseFloat(o[4])||""}},zt=({moduleTitle:i="Ordenes de servicio",serviceOrderType:o="service"})=>{const d=u.useRef(),h=u.useRef(),v=u.useRef(),b=u.useRef(),S=u.useRef(),G=u.useRef(),V=u.useRef(),F=u.useRef(),C=u.useRef(),H=u.useRef(),K=u.useRef(),J=u.useRef(),O=u.useRef(),k=u.useRef(),X=u.useRef(),L=u.useRef(),me=u.useRef(null),Y=u.useRef(),ue=u.useRef(),Q=u.useRef(),je=u.useRef(),[Z,Ke]=u.useState([]),[Je,Xe]=u.useState([]),[Ne,Ye]=u.useState([]),[pe,Qe]=u.useState([]),[T,ee]=u.useState(""),[z,A]=u.useState(""),[te,he]=u.useState(""),[ye,Se]=u.useState(""),[Ce,se]=u.useState([le()]),[B,Ze]=u.useState([]),[I,et]=u.useState([]),[we,ie]=u.useState(()=>ce()),[Re,tt]=u.useState(!1),[st,$e]=u.useState(""),[it,at]=u.useState(!1),Fe=o==="storage_general",x=o==="storage_service",nt=pe.filter(e=>Et.some(s=>j(s)===j(e.name))),Be=Object.fromEntries(pe.map(e=>[`${e.id}`,e])),Ie=async()=>{if(!x)return{warehouseRows:[],locationRows:[]};me.current||(me.current=(async()=>{const n=await _.getStorageOptions();let r=((n==null?void 0:n.warehouses)??[]).filter(c=>c.status!==null),l=((n==null?void 0:n.locations)??[]).filter(c=>c.status!==null);if(!r.length||!l.length){const[c,m]=await Promise.all([l.length?Promise.resolve(l):_.getStorageLocations(),r.length?Promise.resolve(r):_.getStorageWarehouses()]);r=(r.length?r:m??[]).filter(a=>a.status!==null),l=(l.length?l:c??[]).filter(a=>a.status!==null)}return{warehouseRows:r,locationRows:l}})());const{warehouseRows:e,locationRows:s}=await me.current;return Ze(e),et(s),tt(!0),{warehouseRows:e,locationRows:s}};u.useEffect(()=>{(async()=>{var a;const s=x?Ie():Promise.resolve({warehouseRows:[],locationRows:[]}),[n,r,l,c]=await Promise.all([_.getBusinesses(),_.getClients(),_.getServices(),s]),m=n??[];if(Ke(m),Ye((r??[]).filter(p=>p.status!==null)),Qe((l??[]).filter(p=>p.status!==null)),x){ie(ce(c.warehouseRows));const p=m[0];if(p){ee(`${p.id}`);const f=await ae(p.id);(a=f[0])!=null&&a.id&&A(`${f[0].id}`)}}})()},[]);const ae=async(e,s="")=>{const r=await _.getBranchesByBusiness(e)??[];return Xe(r),A(s?`${s}`:""),r},rt=e=>({...e,total:Number(e.quantity||0)*Number(e.unit_price||0)}),w=(e,s="")=>{var n;return((n=e.current)==null?void 0:n.value)||s||""},De=(e="")=>{const s=`${e??""}`.trim(),n=s.match(/^client-(\d+)$/i);return n?n[1]:s},qe=(e,s=B)=>s.find(n=>j(Ve(n))===j(e)),Ee=(e,s=B)=>{var n;return e.warehouse_id||((n=qe(e.warehouse_name,s))==null?void 0:n.id)||""},Pe=(e,s=I,n=B)=>{const r=Ee(e,n);return s.filter(l=>r&&`${l.warehouse_id}`==`${r}`?!0:j(l.warehouse_name)===j(e.warehouse_name))},Oe=(e,s=I,n=B)=>{const r=Pe(e,s,n),l=de(e),c=l.length?r.filter(a=>l.includes(`${a.id}`)):[];return c.length?c:(Array.isArray(e.location_labels)&&e.location_labels.length?e.location_labels:He(e.location_label)).map(a=>r.find(p=>j(R(p))===j(a))).filter(Boolean)},ot=(e=[],s=B,n=I)=>{const r=ce(s);return e.forEach(l=>{var f,N;const c=Tt(l.description??""),m=r.findIndex(E=>j(E.warehouse_name)===j(c.warehouse_name));if(m<0)return;const a={...r[m],enabled:!0,warehouse_id:((f=qe(r[m].warehouse_name,s))==null?void 0:f.id)??r[m].warehouse_id,location_label:c.location_label,location_labels:c.location_labels,start_date:c.start_date,months:c.months||"",end_date:c.end_date||_e(c.start_date,c.months),billing_dates:Ge(c.start_date,c.months),quantity_m3:c.quantity_m3||Number(l.quantity||0)||"",tariff:Number(l.unit_price||0)||"",monthly_amount:Number(l.total||0)||""},p=Oe(a,n,s);r[m]={...a,location_id:(N=p[0])!=null&&N.id?`${p[0].id}`:"",location_ids:p.map(E=>`${E.id}`)}}),r},D=(e,s)=>{ie(n=>n.map(r=>{if(r.key!==e)return r;const l="location_ids"in s?(Array.isArray(s.location_ids)?s.location_ids:[s.location_ids]).filter(Boolean).map(p=>`${p}`):null,c=s.location_id?I.find(p=>`${p.id}`==`${s.location_id}`):null,m=l?I.filter(p=>l.includes(`${p.id}`)):null,a={...r,...s,warehouse_id:Ee(r)};if(c&&(a.location_label=R(c)),m&&(a.location_ids=l,a.location_id=l[0]??"",a.location_labels=m.map(R).filter(Boolean),a.location_label=a.location_labels.join(", ")),("start_date"in s||"months"in s)&&(a.end_date=_e(a.start_date,a.months),a.billing_dates=Ge(a.start_date,a.months)),"quantity_m3"in s||"tariff"in s){const p=U(a.quantity_m3)*U(a.tariff);a.monthly_amount=p?p.toFixed(2):""}return a}))},lt=(e,s,n)=>{ie(r=>r.map(l=>l.key!==e?l:{...l,billing_dates:(l.billing_dates??[]).map((c,m)=>m===s?{...c,date:n}:c)}))},ct=(e,s)=>{const n=`${s}`,r=de(e),l=r.includes(n)?r.filter(c=>c!==n):[...r,n];D(e.key,{location_ids:l})},ne=async(e=null)=>{var m,a,p;at(!!(e!=null&&e.id)),v.current.value=(e==null?void 0:e.id)??"",b.current.value=(e==null?void 0:e.code)??"Se genera al guardar",S.current.value=ve(e==null?void 0:e.issue_date)||new Date().toISOString().slice(0,10),G.current.value=ve(e==null?void 0:e.scheduled_at),V.current.value=ve(e==null?void 0:e.first_due_date),F.current.value=(e==null?void 0:e.expected_document_type)??(x?"":"Factura"),C.current.value=(e==null?void 0:e.currency)??(x?"":"PEN"),H.current.value=(e==null?void 0:e.billing_cycle)??"",K.current.value=(e==null?void 0:e.payment_condition)??"Contado",J.current.value=Number((e==null?void 0:e.installments)??1),O.current.value=(e==null?void 0:e.order_status)??"draft",k.current.value=(e==null?void 0:e.billing_status)??"pending",X.current.value=Number((e==null?void 0:e.tax_amount)??0),L.current.value=(e==null?void 0:e.observations)??"";const s=e!=null&&e.business_id?`${e.business_id}`:T||((m=Z[0])!=null&&m.id?`${Z[0].id}`:"");ee(s),he(e!=null&&e.client_id?`${e.client_id}`:"");const n=await ae(s,(e==null?void 0:e.business_branch_id)??z);!(e!=null&&e.business_branch_id)&&!z&&((a=n[0])!=null&&a.id)&&A(`${n[0].id}`);const r=((e==null?void 0:e.items)??[]).map(f=>({uid:crypto.randomUUID(),service_id:`${f.service_id}`,description:f.description??"",quantity:Number(f.quantity||0),unit_price:Number(f.unit_price||0),detraction_percent:Number(f.detraction_percent||0),commission_percent:Number(f.commission_percent||0),total:Number(f.total||0)}));Se(((p=r[0])==null?void 0:p.service_id)??"");let l=B,c=I;if(x&&(!l.length||!c.length||!Re)){const f=await Ie();l=f.warehouseRows,c=f.locationRows}ie(x?ot((e==null?void 0:e.items)??[],l,c):ce()),se(r.length?r:[le()]),$(h.current).modal("show")},q=(e,s,n)=>{se(r=>r.map(l=>{var m;if(l.uid!==e)return l;const c={...l,[s]:n};if(s==="service_id"){const a=Be[n];c.description=c.description||(a==null?void 0:a.name)||"",c.unit_price=Number(((m=C.current)==null?void 0:m.value)==="USD"?a==null?void 0:a.unit_price_usd:a==null?void 0:a.unit_price_pen)||0}return rt(c)}))},ke=async e=>{if(e.preventDefault(),x){const m=w(Y,T),a=w(ue,z),p=De(w(Q,te)),f=w(je,ye),N=we.filter(g=>g.enabled),E=N.find(g=>!de(g).length||!g.start_date||!g.months||!g.end_date||!g.quantity_m3||!g.tariff);if(!m||!a||!p||!F.current.value||!C.current.value||!f){W.fire("Formulario incompleto","Completa empresa, cliente, tipo documento, moneda y tipo de servicio.","warning");return}if(!N.length){W.fire("Formulario incompleto","Selecciona al menos un almacen.","warning");return}if(E){W.fire("Formulario incompleto",`Completa los datos de ${E.warehouse_name}.`,"warning");return}const Te=N.find(g=>{const fe=Number.parseInt(g.months,10);return!Array.isArray(g.billing_dates)||g.billing_dates.length!==fe||g.billing_dates.some(re=>!re.date)});if(Te){W.fire("Formulario incompleto",`Completa las fechas de facturacion de ${Te.warehouse_name}.`,"warning");return}const ze=N.map(g=>g.start_date).filter(Boolean).sort(),ht=Math.max(...N.map(g=>Number(g.months||1))),ge=Be[f],gt={id:v.current.value||void 0,business_id:m||null,business_branch_id:a||null,client_id:p||null,expected_document_type:F.current.value,currency:C.current.value,billing_cycle:(ge==null?void 0:ge.name)??"",payment_condition:"Contado",installments:ht||1,issue_date:S.current.value||new Date().toISOString().slice(0,10),scheduled_at:ze[0]??null,first_due_date:ze[0]??null,order_status:O.current.value||"draft",billing_status:k.current.value||"pending",tax_amount:0,observations:L.current.value.trim(),items:N.map(g=>{const fe=Oe(g),re=U(g.quantity_m3),Ae=U(g.tariff),ft=U(g.monthly_amount)||re*Ae;return{service_id:f,description:Lt(g,fe),quantity:re,unit_price:Ae,detraction_percent:0,commission_percent:0,total:ft,billing_dates:(g.billing_dates??[]).map(xt=>xt.date)}})};if(!await _.save(gt))return;$(d.current).dxDataGrid("instance").refresh(),$(h.current).modal("hide");return}const s=w(Y,T),n=w(ue,z),r=De(w(Q,te)),l={id:v.current.value||void 0,business_id:s||null,business_branch_id:n||null,client_id:r||null,expected_document_type:F.current.value,currency:C.current.value,billing_cycle:H.current.value.trim(),payment_condition:K.current.value,installments:J.current.value,issue_date:S.current.value,scheduled_at:G.current.value||null,first_due_date:V.current.value||null,order_status:O.current.value,billing_status:k.current.value,tax_amount:X.current.value,observations:L.current.value.trim(),items:Ce.filter(m=>m.service_id).map(m=>({service_id:m.service_id,description:m.description,quantity:m.quantity,unit_price:m.unit_price,detraction_percent:m.detraction_percent,commission_percent:m.commission_percent,total:m.total}))};await _.save(l)&&($(d.current).dxDataGrid("instance").refresh(),$(h.current).modal("hide"))},dt=async e=>{const{isConfirmed:s}=await W.fire({title:"Eliminar orden de servicio",text:"Se dara de baja la orden.",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!s||!await _.delete(e)||$(d.current).dxDataGrid("instance").refresh()},Le={caption:"Acciones",width:x?105:170,allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:s})=>{e.css("text-overflow","unset"),e.append(be({className:x?"btn btn-xs btn-soft-warning":"btn btn-xs btn-soft-primary",title:"Editar",icon:x?"mdi mdi-format-list-bulleted":"mdi mdi-pencil",onClick:()=>ne(s)})),x||e.append(be({className:"btn btn-xs btn-soft-danger ms-1",title:"Imprimir PDF",icon:"mdi mdi-file-pdf-box",onClick:()=>$t(Ft.serviceOrder(s))})),e.append(be({className:"btn btn-xs btn-soft-danger ms-1",title:"Eliminar",icon:"mdi mdi-delete",onClick:()=>dt(s.id)}))}},mt=[{dataField:"id",caption:"ID",width:70},{dataField:"code",caption:"Codigo",width:120,cellTemplate:(e,{data:s})=>Ue(e,s==null?void 0:s.code,()=>ne(s),"Editar orden de servicio")},{dataField:"issue_date",caption:"Fecha",dataType:"date",width:110},{dataField:"scheduled_at",caption:"Programada",dataType:"date",width:115},{dataField:"business.name",caption:"Empresa",minWidth:140},{dataField:"branch.name",caption:"Sede",minWidth:130},{dataField:"client.full_name",caption:"Cliente",minWidth:200},{dataField:"billing_cycle",caption:"Ciclo",minWidth:130},{dataField:"expected_document_type",caption:"Comp.",width:100},{dataField:"currency",caption:"Moneda",width:90},{dataField:"subtotal",caption:"Subtotal",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"Impuesto",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{caption:"Detalle",minWidth:260,allowFiltering:!1,calculateCellValue:e=>(e.items??[]).map(s=>{var n,r;return`${Number(s.quantity||0).toFixed(3)} ${((n=s.service)==null?void 0:n.billing_unit)??""} ${s.description??((r=s.service)==null?void 0:r.name)??""}`.trim()}).join(" | ")},{dataField:"accounts_receivable_code",caption:"CXC",width:130,calculateCellValue:e=>{var s,n;return((s=e.accounts_receivable)==null?void 0:s.code)??((n=e.accountsReceivable)==null?void 0:n.code)??"-"}},{dataField:"payment_status",caption:"Cobranza",width:110,calculateCellValue:e=>{var s,n;return wt(((s=e.accounts_receivable)==null?void 0:s.payment_status)??((n=e.accountsReceivable)==null?void 0:n.payment_status)??e.payment_status??"-")}},{dataField:"order_status",caption:"Estado",width:110,lookup:oe(xe)},{dataField:"billing_status",caption:"Facturacion",width:110,lookup:oe(We)},{dataField:"creator.fullname",caption:"Creado por",minWidth:140,visible:!1},{dataField:"updater.fullname",caption:"Actualizado por",minWidth:140,visible:!1},Le],ut=[Le,{dataField:"order_status",caption:"Estado",width:115,lookup:oe(xe)},{dataField:"code",caption:"Codigo",width:125,cellTemplate:(e,{data:s})=>Ue(e,s==null?void 0:s.code,()=>ne(s),"Editar orden de servicio")},{dataField:"business.name",caption:"Empresa",minWidth:170},{dataField:"client.full_name",caption:"Cliente",minWidth:220},{dataField:"expected_document_type",caption:"Tipo comprobante",width:160},{dataField:"currency",caption:"Moneda",width:105,lookup:oe(Pt)},{dataField:"created_at",caption:"Fecha registro",dataType:"datetime",width:170,format:"yyyy-MM-dd HH:mm:ss"},{dataField:"creator.fullname",caption:"Usuario registro",minWidth:160,calculateCellValue:e=>qt(e.creator)}],pt=x?ut:mt;return t.jsxs(t.Fragment,{children:[t.jsx(Ct,{gridRef:d,title:i,rest:_,pageSize:25,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",onClick:()=>$(d.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"add",onClick:()=>ne()}})},columns:pt}),x?t.jsxs(Me,{modalRef:h,title:t.jsxs("span",{className:"storage-service-order-title",children:[t.jsx("i",{className:"mdi mdi-menu me-1"})," ORDEN DE SERVICIO"]}),size:"full-width",dialogClass:"storage-service-order-dialog modal-dialog-scrollable",contentClass:"storage-service-order-content",headerClass:"storage-service-order-header",closeButtonClass:"btn-close-white",bodyClass:"storage-service-order-body",hideFooter:!0,onSubmit:ke,children:[t.jsx("style",{children:`
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
        `}),t.jsx("input",{ref:v,hidden:!0}),t.jsx("input",{ref:b,hidden:!0}),t.jsx("input",{ref:S,type:"date",hidden:!0}),t.jsx("input",{ref:G,type:"date",hidden:!0}),t.jsx("input",{ref:V,type:"date",hidden:!0}),t.jsx("input",{ref:H,hidden:!0}),t.jsx("input",{ref:K,hidden:!0}),t.jsx("input",{ref:J,type:"number",hidden:!0}),t.jsx("input",{ref:O,hidden:!0}),t.jsx("input",{ref:k,hidden:!0}),t.jsx("input",{ref:X,type:"number",hidden:!0}),t.jsx("textarea",{ref:L,hidden:!0}),t.jsxs("div",{className:"storage-service-order-actions",children:[t.jsxs("button",{type:"submit",className:"btn btn-primary-outline",children:[t.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]}),t.jsxs("button",{type:"button",className:"btn btn-muted","data-bs-dismiss":"modal",children:[t.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]})]}),t.jsx("h3",{className:"storage-service-order-heading",children:"Orden de servicio N°"}),t.jsxs("div",{className:"row g-4 align-items-end",children:[t.jsxs("div",{className:"col-12 col-md-6 col-xl",children:[t.jsx("label",{className:"form-label",children:"Empresa"}),t.jsxs("select",{ref:Y,className:"form-select",value:T,onChange:async e=>{var n;ee(e.target.value);const s=await ae(e.target.value);A((n=s[0])!=null&&n.id?`${s[0].id}`:"")},required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),Z.map(e=>t.jsx("option",{value:e.id,children:e.name},`storage-order-business-${e.id}`))]})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[t.jsx("label",{className:"form-label",children:"Cliente"}),t.jsxs("select",{ref:Q,className:"form-select",value:te,onChange:e=>he(e.target.value),required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),Ne.map(e=>t.jsxs("option",{value:e.entity_id??e.id,children:[e.document_number?`${e.document_number} | `:"",e.full_name]},`storage-order-client-${e.id}`))]})]}),t.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[t.jsx("label",{className:"form-label",children:"Tipo documento"}),t.jsxs("select",{ref:F,className:"form-select",required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),t.jsx("option",{value:"Factura",children:"Factura"}),t.jsx("option",{value:"Boleta",children:"Boleta"}),t.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),t.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[t.jsx("label",{className:"form-label",children:"Moneda"}),t.jsxs("select",{ref:C,className:"form-select",required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),t.jsx("option",{value:"PEN",children:"Soles"}),t.jsx("option",{value:"USD",children:"Dolares"})]})]}),t.jsxs("div",{className:"col-12 col-md-4 col-xl",children:[t.jsx("label",{className:"form-label",children:"Tipo de servicio"}),t.jsxs("select",{ref:je,className:"form-select",value:ye,onChange:e=>Se(e.target.value),required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),nt.map(e=>t.jsx("option",{value:e.id,children:e.name},`storage-order-service-${e.id}`))]})]})]}),t.jsx("div",{className:"storage-service-order-separator"}),t.jsx("div",{className:"row g-3",children:we.map(e=>{const s=Pe(e),n=x&&!Re,r=!e.enabled||n,l=de(e),c=s.filter(a=>l.includes(`${a.id}`)),m=st===e.key;return t.jsx("div",{className:"col-12 col-lg-4",children:t.jsxs("div",{className:"storage-service-card",children:[t.jsxs("div",{className:"storage-service-card-header",children:[t.jsx("input",{type:"checkbox",className:"form-check-input storage-order-checkbox",checked:e.enabled,onChange:a=>{D(e.key,{enabled:a.target.checked}),a.target.checked||$e("")}}),t.jsx("p",{className:"storage-service-card-title",children:e.warehouse_name})]}),t.jsxs("div",{className:"storage-service-card-body",children:[t.jsxs("div",{className:"mb-3",children:[t.jsx("label",{className:"form-label",children:"Ubicación"}),t.jsxs("div",{className:"storage-location-picker",children:[t.jsxs("button",{type:"button",className:"storage-location-picker-toggle",disabled:r,onClick:()=>$e(a=>a===e.key?"":e.key),children:[t.jsxs("span",{className:"storage-location-picker-values",children:[n&&t.jsx("span",{className:"storage-location-picker-placeholder",children:"Cargando ubicaciones..."}),!n&&!c.length&&t.jsx("span",{className:"storage-location-picker-placeholder",children:s.length?"Seleccione ubicaciones":"Sin ubicaciones"}),c.map(a=>t.jsx("span",{className:"storage-location-chip",children:R(a)},`storage-order-location-chip-${e.key}-${a.id}`))]}),t.jsx("i",{className:"mdi mdi-chevron-down"})]}),m&&!r&&t.jsxs("div",{className:"storage-location-picker-menu",children:[!s.length&&t.jsx("div",{className:"storage-location-empty",children:"Sin ubicaciones"}),s.map(a=>{const p=`${a.id}`;return t.jsxs("label",{className:"storage-location-option",children:[t.jsx("input",{type:"checkbox",checked:l.includes(p),onChange:()=>ct(e,p)}),t.jsx("span",{children:R(a)})]},`storage-order-location-${e.key}-${a.id}`)})]})]})]}),t.jsxs("div",{className:"row g-3 mb-3",children:[t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Fecha de inicio"}),t.jsx("input",{type:"date",className:"form-control",value:e.start_date,disabled:r,onChange:a=>D(e.key,{start_date:a.target.value}),required:e.enabled})]}),t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Nro de meses"}),t.jsx("input",{type:"number",min:"1",className:"form-control",value:e.months,disabled:r,onChange:a=>D(e.key,{months:a.target.value}),required:e.enabled})]}),t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Fecha fin"}),t.jsx("input",{type:"date",className:"form-control",value:e.end_date,disabled:!0})]})]}),t.jsxs("div",{className:"row g-3",children:[t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Cantidad de m3"}),t.jsx("input",{type:"number",min:"0",step:"0.001",className:"form-control",value:e.quantity_m3,disabled:r,onChange:a=>D(e.key,{quantity_m3:a.target.value}),required:e.enabled})]}),t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Tarifa"}),t.jsx("input",{type:"number",min:"0",step:"0.01",className:"form-control",value:e.tariff,disabled:r,onChange:a=>D(e.key,{tariff:a.target.value}),required:e.enabled})]}),t.jsxs("div",{className:"col-12 col-sm-4",children:[t.jsx("label",{className:"form-label",children:"Importe mensual"}),t.jsx("input",{type:"number",className:"form-control",value:e.monthly_amount,disabled:!0})]})]}),e.enabled&&(e.billing_dates??[]).length>0&&t.jsx("div",{className:"storage-billing-schedule",children:t.jsxs("table",{children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{children:"N° mes"}),t.jsx("th",{children:"Fecha facturación"})]})}),t.jsx("tbody",{children:e.billing_dates.map((a,p)=>t.jsxs("tr",{children:[t.jsx("td",{children:a.month}),t.jsx("td",{children:t.jsx("input",{type:"date",className:"form-control",value:a.date,onChange:f=>lt(e.key,p,f.target.value),required:e.enabled})})]},`storage-order-billing-${e.key}-${a.month}`))})]})})]})]})},`storage-order-block-${e.key}`)})})]}):t.jsx(Me,{modalRef:h,title:it?`Editar ${Fe?"orden de servicio general":"orden de servicio"}`:`Agregar ${Fe?"orden de servicio general":"orden de servicio"}`,size:"xl",onSubmit:ke,children:t.jsxs("div",{className:"row",children:[t.jsx("input",{ref:v,hidden:!0}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Código"}),t.jsx("input",{ref:b,className:"form-control",disabled:!0})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Empresa"}),t.jsxs("select",{ref:Y,className:"form-control",value:T,onChange:async e=>{ee(e.target.value),await ae(e.target.value,"")},required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),Z.map(e=>t.jsx("option",{value:e.id,children:e.name},`service-order-business-${e.id}`))]})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Sede"}),t.jsxs("select",{ref:ue,className:"form-control",value:z,onChange:e=>A(e.target.value),children:[t.jsx("option",{value:"",children:"Seleccione"}),Je.map(e=>t.jsx("option",{value:e.id,children:e.name},`service-order-branch-${e.id}`))]})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Cliente"}),t.jsxs("select",{ref:Q,className:"form-control",value:te,onChange:e=>he(e.target.value),required:!0,children:[t.jsx("option",{value:"",children:"Seleccione"}),Ne.map(e=>t.jsx("option",{value:e.entity_id??e.id,children:e.full_name},`service-order-client-${e.id}`))]})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Fecha"}),t.jsx("input",{ref:S,type:"date",className:"form-control",required:!0})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Programada"}),t.jsx("input",{ref:G,type:"date",className:"form-control"})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Primera cuota"}),t.jsx("input",{ref:V,type:"date",className:"form-control"})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Ciclo"}),t.jsx("input",{ref:H,className:"form-control"})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Comprobante"}),t.jsxs("select",{ref:F,className:"form-control",children:[t.jsx("option",{value:"Factura",children:"Factura"}),t.jsx("option",{value:"Boleta",children:"Boleta"})]})]}),t.jsxs("div",{className:"col-md-2 mb-3",children:[t.jsx("label",{className:"form-label",children:"Moneda"}),t.jsxs("select",{ref:C,className:"form-control",children:[t.jsx("option",{value:"PEN",children:"PEN"}),t.jsx("option",{value:"USD",children:"USD"})]})]}),t.jsxs("div",{className:"col-md-2 mb-3",children:[t.jsx("label",{className:"form-label",children:"Pago"}),t.jsxs("select",{ref:K,className:"form-control",children:[t.jsx("option",{value:"Contado",children:"Contado"}),t.jsx("option",{value:"Credito",children:"Crédito"})]})]}),t.jsxs("div",{className:"col-md-2 mb-3",children:[t.jsx("label",{className:"form-label",children:"Cuotas"}),t.jsx("input",{ref:J,type:"number",min:"1",className:"form-control"})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Estado"}),t.jsx("select",{ref:O,className:"form-control",children:xe.map(e=>t.jsx("option",{value:e.value,children:e.label},`service-order-status-${e.value}`))})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Facturación"}),t.jsx("select",{ref:k,className:"form-control",children:We.map(e=>t.jsx("option",{value:e.value,children:e.label},`service-order-billing-status-${e.value}`))})]}),t.jsxs("div",{className:"col-md-2 mb-3",children:[t.jsx("label",{className:"form-label",children:"Impuesto"}),t.jsx("input",{ref:X,type:"number",step:"0.01",className:"form-control"})]}),t.jsxs("div",{className:"col-12 mb-3",children:[t.jsx("label",{className:"form-label",children:"Servicios"}),t.jsxs("div",{className:"border rounded p-2",children:[Ce.map(e=>t.jsxs("div",{className:"row align-items-end mb-2",children:[t.jsxs("div",{className:"col-md-4",children:[t.jsx("label",{className:"form-label",children:"Servicio"}),t.jsxs("select",{className:"form-control",value:e.service_id,onChange:s=>q(e.uid,"service_id",s.target.value),children:[t.jsx("option",{value:"",children:"Seleccione"}),pe.map(s=>t.jsxs("option",{value:s.id,children:[s.code," - ",s.name]},`service-order-item-${s.id}`))]})]}),t.jsxs("div",{className:"col-md-3",children:[t.jsx("label",{className:"form-label",children:"Descripción"}),t.jsx("input",{className:"form-control",value:e.description,onChange:s=>q(e.uid,"description",s.target.value)})]}),t.jsxs("div",{className:"col-md-1",children:[t.jsx("label",{className:"form-label",children:"Cant."}),t.jsx("input",{type:"number",step:"0.001",className:"form-control",value:e.quantity,onChange:s=>q(e.uid,"quantity",s.target.value)})]}),t.jsxs("div",{className:"col-md-1",children:[t.jsx("label",{className:"form-label",children:"PU"}),t.jsx("input",{type:"number",step:"0.01",className:"form-control",value:e.unit_price,onChange:s=>q(e.uid,"unit_price",s.target.value)})]}),t.jsxs("div",{className:"col-md-1",children:[t.jsx("label",{className:"form-label",children:"Det."}),t.jsx("input",{type:"number",step:"0.01",className:"form-control",value:e.detraction_percent,onChange:s=>q(e.uid,"detraction_percent",s.target.value)})]}),t.jsxs("div",{className:"col-md-1",children:[t.jsx("label",{className:"form-label",children:"Com."}),t.jsx("input",{type:"number",step:"0.01",className:"form-control",value:e.commission_percent,onChange:s=>q(e.uid,"commission_percent",s.target.value)})]}),t.jsxs("div",{className:"col-md-1",children:[t.jsx("label",{className:"form-label",children:"Total"}),t.jsx("input",{className:"form-control",value:Number(e.total||0).toFixed(2),disabled:!0})]}),t.jsx("div",{className:"col-md-1",children:t.jsx("button",{type:"button",className:"btn btn-outline-danger w-100",onClick:()=>se(s=>s.length===1?[le()]:s.filter(n=>n.uid!==e.uid)),children:"-"})})]},e.uid)),t.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:()=>se(e=>[...e,le()]),children:"Agregar servicio"})]})]}),t.jsxs("div",{className:"col-12 mb-1",children:[t.jsx("label",{className:"form-label",children:"Observaciones"}),t.jsx("textarea",{ref:L,className:"form-control",rows:"3"})]})]})})]})};Nt((i,o)=>{const d=o.requiredPermission??"services-service-order";!o.can(d)&&!o.hasRole("Admin")&&(location.href="/admin/"),yt(i).render(t.jsx(St,{...o,title:o.moduleTitle??"Ordenes de servicio",children:t.jsx(zt,{...o})}))});
