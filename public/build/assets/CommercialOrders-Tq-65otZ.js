var hr=Object.defineProperty;var br=(t,r,s)=>r in t?hr(t,r,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[r]=s;var Ln=(t,r,s)=>br(t,typeof r!="symbol"?r+"":r,s);import{C as xr,c as gr,j as n,r as l,S as Q,G as _r}from"./CreateReactScript-DQLVjp0V.js";import{L as vr,G as yr,M as jr}from"./esm-BhZAXbGk.js";import{B as Nr}from"./Base-DpZFB5sy.js";import{T as Jt}from"./Table-7ynWM9VR.js";import{M as Xe}from"./Modal-CAfsOhZN.js";import{R as Cr}from"./ReactAppend-DIHzhAcr.js";import{a as Ee,S as Te}from"./SetSelectValue-DfDyTYyl.js";import{S as Rr}from"./SelectFormGroup-CC2pGrXt.js";import{T as Bn}from"./TextareaFormGroup-CdYAyehd.js";import{B as wr}from"./BillingDocumentsRest-BxeZz_F6.js";import{C as oa}from"./CommercialOrdersRest-9ZrUmq6K.js";import{B as kr}from"./BasicRest-EXKW_n5g.js";import{R as Fr}from"./ReferralGuidesRest-DPUoCWFG.js";import{o as vt,b as yt}from"./magistralesRecordPdf-BLh28TRb.js";import{t as Gn,i as Vn,j as da,k as Un}from"./statusLabels-DafAwaKR.js";import"./tippy-react.esm-DZzWNIYv.js";import"./permissionScope-Be8AULz2.js";import"./ubigeoInei-D0FnAslC.js";class $r extends kr{constructor(){super(...arguments);Ln(this,"path","admin/delivery-delay-reasons")}}const P=new oa,ge=new wr,zn=new $r,qn=new Fr,Sr=["client_kind","=","regular"],Er=[1,2,3,4,5],Tr=["EFECTIVO [CONTADO]","TRANSFERENCIA [CONTADO]","YAPE [CONTADO]","PLIN [CONTADO]","TARJETA [CONTADO]","TRANSFERENCIA [CREDITO]"],Yn="ecomsur_oms",jt=[{id:"orders",label:"Pedidos",kind:"orders"},{id:"issued",label:"Facturas Emitidas",kind:"billing"},{id:"cancelled",label:"Facturas Anuladas",kind:"billing"},{id:"credit-notes",label:"Notas de Credito",kind:"billing"},{id:"visitors",label:"Pedidos - Visitadores",kind:"static"},{id:"visitors-legacy",label:"Pedidos - Visitadores Legacy",kind:"static"},{id:"platforms",label:"Plataformas",kind:"static"},{id:"multivende",label:"Pedidos - Multivende",kind:"multivende"}],Wn={visitors:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},"visitors-legacy":{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["Todos","ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},platforms:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]}},V=(t,{variant:r,title:s,icon:c,onClick:p})=>{const x=$('<button type="button"></button>').addClass(`btn btn-xs btn-soft-${r} commercial-order-action-btn`).attr("title",s).attr("aria-label",s).append($("<i></i>").addClass(c)).on("click",m=>{m.preventDefault(),m.stopPropagation(),p()});t.append(x)},ua=t=>`commercial-order-status-badge commercial-order-status-${`${t??"empty"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-")||"empty"}`,Nt=(t,r,s)=>{t.addClass("commercial-order-status-cell"),Cr(t,n.jsx("span",{className:ua(r),children:s(r)}))},Ze=()=>({uid:crypto.randomUUID(),article_id:"",article_label:"",article_code:"",article_lot:"",article_name:"",article_unit:"",article_laboratory:"",article_principle:"",presentations:[],presentation_id:"",presentation_units:1,stock_available:0,reserved_quantity:0,price_unit:0,quantity:1,gross_total:0,discount_type:"none",discount_value:0,discount_amount:0,total:0,price_source:"fallback",price_list_code:""}),Dr=t=>{if(!t)return"";const r=(t.name??"").toString().trim().split(" ")[0]??"",s=(t.lastname??"").toString().trim().split(" ")[0]??"",c=`${r} ${s}`.trim(),p=(t.username??"").toString().trim();return c&&p?`${c} (@${p})`:c||(p?`@${p}`:"")},Ir=t=>{if(!t)return"-";const r=(t.fullname??"").toString().trim();return r||`${t.name??""} ${t.lastname??""}`.trim()||(t.username??"").toString().trim()||"-"},Qt=t=>t&&((t.username??"").toString().trim()||(t.fullname??"").toString().trim()||`${t.name??""} ${t.lastname??""}`.trim())||"-",et=t=>Number(Number(t||0).toFixed(2)),Ar=t=>$("<div>").text(t??"").html(),De=t=>{const r=Number(Number(t||0).toFixed(3));return Number.isInteger(r)?`${r}`:`${r}`.replace(/\.?0+$/,"")},an=t=>(t==null?void 0:t.price_source)==="manual",Hn=(t,r,s=!1)=>{const c=Number((t==null?void 0:t.price_unit)||0),p=Number(r==null?void 0:r.price_unit);return!s&&an(t)||!Number.isFinite(p)||!s&&p<=0&&c>0?c:p},Kn=(t,r,s=!1)=>!s&&an(t)?"manual":(r==null?void 0:r.source)||(t==null?void 0:t.price_source)||"fallback",Or=t=>{const r=`${t??""}`.replace(",",".").replace(/[^\d.]/g,"");if(!r)return"";const[s,...c]=r.split("."),p=s.replace(/^0+(?=\d)/,"")||(s||c.length?"0":""),x=c.length?`.${c.join("")}`:"";return`${p}${x}`},Jn=t=>{const r=Or(t.target.value);return t.target.value!==r&&(t.target.value=r),Number(r||0)},Qn=t=>{Number(t.target.value||0)===0&&t.target.select()},Pr=(t,r,s)=>{const c=et(t),p=Number(s||0);return!Number.isFinite(p)||p<=0||c<=0?0:r==="percent"?Math.min(c,et(c*Math.min(p,100)/100)):r==="amount"?Math.min(c,et(p)):0},_e=t=>{const r=Number(t.quantity||0),s=Number(t.price_unit||0),c=Number.isFinite(r*s)?et(r*s):0,p=Pr(c,t.discount_type,t.discount_value);return{...t,discount_type:t.discount_type||"none",discount_value:t.discount_type==="none"?0:Number(t.discount_value||0),gross_total:c,discount_amount:p,total:et(Math.max(0,c-p))}},wt=t=>{const r=`${t??""}`.trim().toLowerCase();return r==="boleta"?"Boleta":["nota de pedido","nota_pedido","note_order"].includes(r)?"Nota de pedido":"Factura"},Mr=t=>(t==null?void 0:t.billing_documents)??(t==null?void 0:t.billingDocuments)??[],Ie=t=>Mr(t)[0]??null,tt=t=>t&&([t==null?void 0:t.series,t==null?void 0:t.sequence].filter(Boolean).join("-")||(t==null?void 0:t.code))||"",Xn=t=>{const r=Ie(t);return tt(r)||(t==null?void 0:t.referral_guide)||(t==null?void 0:t.guide_number)||(t==null?void 0:t.purchase_order)||"-"},Xt=t=>{var r;return wt(((r=Ie(t))==null?void 0:r.document_type)??(t==null?void 0:t.document_type))},Zn=t=>{const r=(t==null?void 0:t.client)??(t==null?void 0:t.eventual_client)??(t==null?void 0:t.eventualClient)??null,s=`${(r==null?void 0:r.document_number)??""}`.trim(),c=`${(r==null?void 0:r.full_name)??(r==null?void 0:r.business_name)??""}`.trim();return[s,c].filter(Boolean).join(" | ")||"-"},Lr=t=>{const r=`${(t==null?void 0:t.payment_method)??""}`.trim(),s=`${(t==null?void 0:t.payment_condition)??""}`.trim();return!r&&!s?"-":!s||r.includes("[")?r||"-":`${r||"-"} [${s.toUpperCase()}]`},ea=t=>{if(!t)return"-";const r=new Date(t);return Number.isNaN(r.getTime())?`${t}`:r.toLocaleString("es-PE",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})},tn=()=>new Date().toISOString().slice(0,10).replaceAll("-","/"),te=()=>{const t=tn();return`${t} - ${t}`},ta=(t,r)=>new Promise((s,c)=>{const p=document.getElementById(t);if(p){p.dataset.loaded==="true"?s():p.addEventListener("load",s,{once:!0});return}const x=document.createElement("script");x.id=t,x.src=r,x.async=!0,x.onload=()=>{x.dataset.loaded="true",s()},x.onerror=c,document.body.appendChild(x)}),Br=(t,r)=>{if(document.getElementById(t))return;const s=document.createElement("link");s.id=t,s.rel="stylesheet",s.href=r,document.head.appendChild(s)},Gr=async()=>{var t,r;Br("commercial-order-daterangepicker-css","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/css/daterangepicker.css"),window.moment||await ta("commercial-order-moment-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/moment.min.js"),(r=(t=window.$)==null?void 0:t.fn)!=null&&r.daterangepicker||await ta("commercial-order-daterangepicker-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/daterangepicker.js")},ma=()=>({orders:{businessId:"",dateRange:te(),laboratoryId:"",dispatchStatus:""},issued:{businessId:"",dateRange:te()},cancelled:{businessId:"",dateRange:te()},"credit-notes":{businessId:"",dateRange:te()},visitors:{visitor:"ALICIA ASTO ASTO",dateRange:te()},"visitors-legacy":{visitor:"",dateRange:te()},platforms:{businessId:"",dateRange:te()},multivende:{dateRange:te(),orderVtex:""}}),Vr=()=>{const t=ma();return{...t,orders:{...t.orders,dateRange:""}}},na=t=>{const r=`${t??""}`.trim();return r?r.replaceAll("/","-").slice(0,10):""},pa=t=>{const[r="",s=""]=`${t??""}`.split(/\s+-\s+/);return{start:na(r),end:na(s||r)}},Ft=t=>t.filter(Boolean).reduce((r,s)=>r?[r,"and",s]:s,null),rn=(t,r="created_at")=>{const{start:s,end:c}=pa(t);return Ft([s?[r,">=",`${s} 00:00:00`]:null,c?[r,"<=",`${c} 23:59:59`]:null])},Ur=t=>{const r=["document_type","<>","Nota de credito"];return t==="issued"?[[["local_status","=","sent"],"or",["local_status","=","accepted"],"or",["local_status","=","observed"],"or",["local_status","=","rejected"]],"and",r]:t==="cancelled"?[["local_status","=","cancelled"],"and",r]:t==="credit-notes"?["document_type","=","Nota de credito"]:null},zr=(t,r)=>Ft([["source_type","=","commercial_order"],Ur(t),r!=null&&r.businessId?["business_id","=",Number(r.businessId)]:null,rn(r==null?void 0:r.dateRange,"created_at")]),qr=t=>Ft([t!=null&&t.businessId?["business_id","=",Number(t.businessId)]:null,t!=null&&t.dispatchStatus?["dispatch_status","=",t.dispatchStatus]:null,rn(t==null?void 0:t.dateRange,"created_at")]),Yr=(t,r)=>{const s=`${(t==null?void 0:t.orderVtex)??""}`.trim();return Ft([["external_source","=",r],rn(t==null?void 0:t.dateRange,"created_at"),s?[["external_order_id","contains",s],"or",["external_checkout_id","contains",s]]:null])},Zt=t=>{const r=(t==null?void 0:t.client)??(t==null?void 0:t.eventualClient)??(t==null?void 0:t.eventual_client)??null,s=`${(r==null?void 0:r.document_number)??""}`.trim(),c=`${(r==null?void 0:r.full_name)??(r==null?void 0:r.business_name)??""}`.trim();return[s,c].filter(Boolean).join(" | ")||"-"},en=t=>`${t??""}`.toUpperCase()==="USD"?"Dolares":"Soles",aa=t=>(t==null?void 0:t.external_reference)||(t==null?void 0:t.external_id)||(t==null?void 0:t.external_status)||"-",Wr=t=>{var r,s;return((r=t==null?void 0:t.referenceDocument)==null?void 0:r.code)??((s=t==null?void 0:t.reference_document)==null?void 0:s.code)??"-"},Hr=t=>{var r,s;return(t==null?void 0:t.cancel_reason)??((r=t==null?void 0:t.metadata)==null?void 0:r.cancel_reason)??((s=t==null?void 0:t.metadata)==null?void 0:s.reason)??"-"},Kr=t=>{var r,s;return((r=Ie(t))==null?void 0:r.external_status)??((s=Ie(t))==null?void 0:s.external_reference)??"-"},Jr=t=>(t==null?void 0:t.external_order_id)||(t==null?void 0:t.external_checkout_id)||"-",fa=t=>{var p;const r=nn(t);if(r!=null&&r.delivered_at)return r.delivered_at;const c=((t==null?void 0:t.dispatchAssignments)??(t==null?void 0:t.dispatch_assignments)??[]).find(x=>{var m;return(m=x==null?void 0:x.dispatch)==null?void 0:m.delivered_at});return((p=c==null?void 0:c.dispatch)==null?void 0:p.delivered_at)??""},Qr=t=>{const r=t!=null&&t.created_at?new Date(t.created_at):null,s=fa(t)||(t==null?void 0:t.updated_at),c=s?new Date(s):null;if(!r||!c||Number.isNaN(r.getTime())||Number.isNaN(c.getTime()))return"-";const p=Math.max(0,Math.round((c-r)/6e4)),x=Math.floor(p/1440),m=Math.floor(p%1440/60);return x>0?`${x}d ${m}h`:m>0?`${m}h ${p%60}m`:`${p}m`},F=(t,r="")=>{if(t==null)return r;if(typeof t=="object")return t.address??t.reference??t.name??t.description??r;const s=`${t}`;return s==="[object Object]"?r:s},Xr=t=>`${t??""}`.toUpperCase().includes("CREDITO")?"Credito":"Contado",Zr=t=>{const r=`${t??""}`.trim();return r?r.toUpperCase()==="TRANSFERENCIA"?"TRANSFERENCIA [CONTADO]":r:"EFECTIVO [CONTADO]"},ei=t=>F(t==null?void 0:t.full_address,F(t==null?void 0:t.address,F(t==null?void 0:t.fiscal_address))),ti=t=>F(t==null?void 0:t.ubigeo,F(t==null?void 0:t.district_ubigeo,F(t==null?void 0:t.inei_ubigeo))),ra=t=>{const r=`${t??""}`.trim(),s=r.match(/^(client|eventual)-(\d+)$/);return s?s[2]:r},ia=t=>{var m,_,E;if(t.loading)return t.text;const r=t.data??{},s=t.text||r.name||"",c=(m=r.branch)==null?void 0:m.name,p=(E=(_=r.branch)==null?void 0:_.business)==null?void 0:E.name,x=$("<span>").text(s);return c&&x.append($("<small>").addClass("text-muted ms-1").text(`- ${c}`)),p&&x.append($("<small>").addClass("text-muted ms-1").text(`(${p})`)),x},ee=t=>{if(!(t!=null&&t.current))return;const r=$(t.current);r.empty().val(null),r.trigger(r.data("select2")?"change.select2":"change")},ni=t=>t.article_id?"Unidad base":"Sin presentacion",ai=(t,r)=>{const s=(t==null?void 0:t.name)||"Presentacion",c=De((t==null?void 0:t.units)||1),p=r!=null&&r.article_unit?` ${r.article_unit}`:" unidad(es) base";return`${s} (${c}${p})`},ri=t=>["Factura","Boleta"].includes(wt(t)),sa=(t,r)=>{const s=Number(t||0);if(!ri(r))return{subtotal:Number(s.toFixed(2)),taxAmount:0,total:Number(s.toFixed(2))};const c=Number((s/1.18).toFixed(2));return{subtotal:c,taxAmount:Number((s-c).toFixed(2)),total:Number(s.toFixed(2))}},ii=(t,r="")=>{const s=new Map;return(t??[]).flatMap(c=>{if(!(c!=null&&c.article_id))return[];const p=`${c.article_id}:${c.warehouse_id||r||""}`,x=Number(c.quantity||0),m=Number(c.presentation_units||1)||1,_=Number((x*m).toFixed(3)),E=Number(c.stock_available||0),B=Number(s.get(p)||0),T=Math.max(0,E-B),R=Math.min(_,T),G=Math.max(0,_-R);return s.set(p,B+R),G<=1e-4?[]:[{article:c.article_name||c.article_label||c.article_code||"Articulo",quantity:_,lineQuantity:x,presentationUnits:m,available:T,shortage:G}]})},Rt=t=>(t==null?void 0:t.referral_guides)??(t==null?void 0:t.referralGuides)??[],ha=t=>(t==null?void 0:t.external_reference)||[t==null?void 0:t.series,t==null?void 0:t.sequence].filter(Boolean).join("-")||(t==null?void 0:t.code)||"-",si=t=>t&&!["accepted","cancelled"].includes(t.guide_status),li=t=>(t==null?void 0:t.delivery_evidences)??(t==null?void 0:t.deliveryEvidences)??[],nn=t=>li(t)[0]??null,ci=t=>(t==null?void 0:t.tracking_events)??(t==null?void 0:t.trackingEvents)??[],la=t=>{const r=`${t??""}`.trim();return r.startsWith("blob:")||r.startsWith("data:image/")||/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(r)||r.includes("/delivery-evidence-media/")},ca=()=>{const t=new Date;return t.setMinutes(t.getMinutes()-t.getTimezoneOffset()),t.toISOString().slice(0,16)},Ct={lat:-12.046374,lng:-77.042793},ne=t=>{const r=Number(t);return Number.isFinite(r)?r:null},kt=t=>{const r=ne(t);return r===null?"":r.toFixed(7)},ae=t=>ne(t==null?void 0:t.lat)!==null&&ne(t==null?void 0:t.lng)!==null,oi=({modalRef:t,position:r,searchText:s,onPositionChange:c,onSearchTextChange:p,onAddressSelected:x,googleMapsApiKey:m})=>{const _=l.useRef(),[E,B]=l.useState(!1),[T,R]=l.useState(""),[G,re]=l.useState([]),X=ae(r)?{lat:ne(r.lat),lng:ne(r.lng)}:Ct,D=(f,k=17)=>{const z=ne(f==null?void 0:f.lat),q=ne(f==null?void 0:f.lng);z===null||q===null||!_.current||(_.current.setCenter({lat:z,lng:q}),_.current.setZoom(k))},pe=f=>{c(f),D(f)};l.useEffect(()=>{if(ae(r)){D(X);return}D(Ct,13)},[r==null?void 0:r.lat,r==null?void 0:r.lng]),l.useEffect(()=>{const f=t==null?void 0:t.current;if(!f)return;const k=()=>{setTimeout(()=>{ae(r)?D(X):D(Ct,13)},180)};return $(f).on("shown.bs.modal",k),()=>$(f).off("shown.bs.modal",k)},[t,r==null?void 0:r.lat,r==null?void 0:r.lng]);const ve=async()=>{var k,z;const f=`${s??""}`.trim();if(!f){re([]),R("Escribe una direccion para buscar.");return}if(!((z=(k=window.google)==null?void 0:k.maps)!=null&&z.Geocoder)){R("Google Maps aun no termino de cargar.");return}B(!0),R("");try{new window.google.maps.Geocoder().geocode({address:`${f}, Peru`,componentRestrictions:{country:"PE"},region:"PE"},(ie,ye)=>{if(B(!1),ye!=="OK"||!Array.isArray(ie)||ie.length===0){re([]),R("Sin resultados. Puedes marcar el punto manualmente en el mapa.");return}re(ie.slice(0,5).map(M=>({place_id:M.place_id,display_name:M.formatted_address,lat:M.geometry.location.lat(),lng:M.geometry.location.lng()})))})}catch(q){B(!1),R(`${q.message}. Puedes marcar el punto manualmente en el mapa.`),re([])}},Ae=f=>{const k={lat:ne(f.lat),lng:ne(f.lng)};c(k),p(f.display_name??""),x(f.display_name??""),D(k),re([])};return n.jsxs("div",{className:"commercial-order-map-picker",children:[n.jsxs("div",{className:"commercial-order-map-search",children:[n.jsxs("div",{children:[n.jsx("label",{className:"form-label",children:"Buscar direccion en mapa"}),n.jsxs("div",{className:"input-group",children:[n.jsx("input",{type:"text",className:"form-control",value:s,onChange:f=>p(f.target.value),onKeyDown:f=>{f.key==="Enter"&&(f.preventDefault(),ve())},placeholder:"Ej. Av. Javier Prado 123, San Isidro"}),n.jsx("button",{type:"button",className:"btn btn-outline-primary",onClick:ve,disabled:E,children:E?"Buscando...":"Buscar"})]})]}),n.jsxs("div",{className:"commercial-order-map-coordinates",children:[n.jsx("label",{className:"form-label",children:"Coordenadas"}),n.jsxs("div",{className:"commercial-order-map-coordinate-values",children:[n.jsx("span",{children:kt(r==null?void 0:r.lat)||"-"}),n.jsx("span",{children:kt(r==null?void 0:r.lng)||"-"})]})]})]}),G.length>0&&n.jsx("div",{className:"commercial-order-map-results",children:G.map(f=>n.jsx("button",{type:"button",className:"commercial-order-map-result",onClick:()=>Ae(f),children:f.display_name},`${f.place_id}-${f.lat}-${f.lng}`))}),T&&n.jsx("small",{className:"text-muted d-block mt-1",children:T}),n.jsx(vr,{googleMapsApiKey:m,language:"es",region:"PE",onError:()=>R("No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio."),children:n.jsx(yr,{mapContainerClassName:"commercial-order-map-canvas",center:X,zoom:ae(r)?17:13,options:{clickableIcons:!0,fullscreenControl:!0,gestureHandling:"greedy",mapTypeControl:!0,scrollwheel:!0,streetViewControl:!1},onLoad:f=>{_.current=f,setTimeout(()=>{ae(r)?D(X):D(Ct,13)},120)},onClick:f=>{const k={lat:f.latLng.lat(),lng:f.latLng.lng()};pe(k)},children:ae(r)&&n.jsx(jr,{position:X,draggable:!0,onDragEnd:f=>pe({lat:f.latLng.lat(),lng:f.latLng.lng()})})})}),n.jsx("small",{className:"text-muted d-block mt-2",children:"Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega."})]})},di=t=>{const r=`${_r.GMAPS_API_KEY??""}`.trim();return r?n.jsx(oi,{...t,googleMapsApiKey:r}):n.jsx("div",{className:"commercial-order-map-picker",children:n.jsx("div",{className:"commercial-order-map-empty",children:"Configura Google Maps API Key en Sistemas > Datos generales > Integraciones para habilitar el mapa."})})},ui=t=>!t||t.status===null||`${t.order_status??""}`=="cancelled"?!1:`${t.dispatch_status??"pending"}`=="pending",mi=t=>!t||t.status===null||t.status===!1||t.status===0?!1:!["draft","cancelled"].includes(`${t.order_status??""}`),ba=t=>{if(!t)return!1;const r=`${t.local_status??""}`;return["accepted","observed","cancelled"].includes(r)||!!t.external_id},pi=t=>{const r=Ie(t);return r?ba(r)?{icon:"mdi mdi-file-document-check-outline",title:`Descargar PDF del comprobante ${tt(r)||r.code}`}:{icon:"mdi mdi-send",title:`Emitir comprobante ${tt(r)||r.code}`}:{icon:"mdi mdi-file-send-outline",title:"Generar comprobante de venta para este pedido"}},fi=t=>{if(!t)return[];const r=ci(t).map(m=>({date:m.happened_at??m.created_at,status:[m.title,m.description].filter(Boolean).join(" - ")})),s=[{date:t.created_at,status:"La orden ingreso en el sistema"}];t.approved_at&&["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)?s.push({date:t.approved_at,status:"La orden paso a preparacion"}):t.approved_at&&t.order_status==="confirmed"?s.push({date:t.approved_at,status:"La orden fue confirmada"}):["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)&&s.push({date:t.updated_at,status:"La orden paso a preparacion"});const c=(t.dispatch_assignments??t.dispatchAssignments??[]).filter(m=>(m==null?void 0:m.status)!==!1&&(m==null?void 0:m.status)!==0&&(m==null?void 0:m.dispatch)).sort((m,_)=>{var E,B,T,R;return new Date(((E=m==null?void 0:m.dispatch)==null?void 0:E.departed_at)||((B=m==null?void 0:m.dispatch)==null?void 0:B.scheduled_date)||0)-new Date(((T=_==null?void 0:_.dispatch)==null?void 0:T.departed_at)||((R=_==null?void 0:_.dispatch)==null?void 0:R.scheduled_date)||0)}),p=c.find(m=>{var _;return["in_route","delivered","closed"].includes((_=m==null?void 0:m.dispatch)==null?void 0:_.dispatch_status)});p?(s.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:`Manifiesto ${p.dispatch.manifest_code||p.dispatch.code||""}`.trim()}),s.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:"El pedido salio en ruta"})):t.dispatch_status==="in_route"&&s.push({date:t.updated_at,status:"El pedido salio en ruta"}),(t.dispatch_status==="dispatched"||c.some(m=>{var _;return((_=m==null?void 0:m.dispatch)==null?void 0:_.dispatch_status)==="dispatched"}))&&s.push({date:t.updated_at,status:"El pedido paso a despacho"}),Rt(t).forEach(m=>{s.push({date:m.issue_date??m.created_at??t.updated_at,status:`Guia de remision ${ha(m)} - ${da(m.guide_status)}`})});const x=c.find(m=>{var _;return["delivered","closed"].includes((_=m==null?void 0:m.dispatch)==null?void 0:_.dispatch_status)});return x?s.push({date:x.dispatch.delivered_at??x.dispatch.updated_at??x.dispatch.created_at,status:"El pedido fue entregado"}):t.dispatch_status==="delivered"&&s.push({date:t.updated_at,status:"El pedido fue entregado"}),(t.order_status==="cancelled"||t.dispatch_status==="cancelled")&&s.push({date:t.updated_at,status:"El pedido fue cancelado"}),[...r,...s].filter(m=>m.date).sort((m,_)=>new Date(m.date)-new Date(_.date))},hi=({title:t,config:r})=>{const s=(r==null?void 0:r.pageSize)??20;return n.jsx("div",{className:"row",children:n.jsx("div",{className:"col-12",children:n.jsxs("div",{className:"card",children:[n.jsx("div",{className:"card-header",children:t}),n.jsxs("div",{className:"card-body",children:[n.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[n.jsxs("div",{className:"d-flex align-items-center gap-2",children:[n.jsx("label",{className:"form-label mb-0",children:"Elementos :"}),n.jsx("select",{className:"form-select form-select-sm commercial-order-page-size",defaultValue:s,children:[10,20,25,50].map(c=>n.jsx("option",{value:c,children:c},`commercial-list-size-${c}`))})]}),n.jsxs("div",{className:"d-flex align-items-center gap-2",children:[n.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),n.jsx("input",{className:"form-control form-control-sm commercial-order-list-search"})]})]}),((r==null?void 0:r.exports)??[]).length>0&&n.jsx("div",{className:"d-flex flex-wrap gap-1 mb-2",children:r.exports.map(c=>n.jsx("button",{type:"button",className:"btn btn-sm btn-light",children:c},`commercial-list-export-${c}`))}),n.jsx("div",{className:"table-responsive commercial-order-legacy-table",children:n.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[n.jsx("thead",{children:n.jsx("tr",{children:((r==null?void 0:r.headers)??[]).map(c=>n.jsx("th",{children:c},`commercial-list-header-${c}`))})}),n.jsx("tbody",{children:n.jsx("tr",{children:n.jsx("td",{colSpan:((r==null?void 0:r.headers)??[]).length||1,className:"text-muted",children:"No existen elementos"})})})]})}),n.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2",children:[n.jsx("span",{className:"text-muted",children:"No hay elementos a mostrar"}),n.jsxs("div",{className:"d-flex align-items-center gap-2 text-muted",children:[n.jsx("span",{children:"Anterior"}),n.jsx("button",{type:"button",className:"btn btn-sm btn-light active",children:"1"}),n.jsx("span",{children:"Siguiente"})]})]})]})]})})})},bi=({requiredPermission:t="orders",externalSource:r=null,pageTitle:s="Pedidos comerciales"})=>{var In;P.externalSource=null;const c=l.useRef(),p=l.useRef(),x=l.useRef(),m=l.useRef(),_=l.useRef(),E=l.useRef(),B=l.useRef(),T=l.useRef(),R=l.useRef(),G=l.useRef(),re=l.useRef(),X=l.useRef(),D=l.useRef(),pe=l.useRef(),ve=l.useRef(),Ae=l.useRef(),f=l.useRef(),k=l.useRef(),z=l.useRef(),q=l.useRef(),ie=l.useRef(),ye=l.useRef(),M=l.useRef(),nt=l.useRef(),xa=l.useRef(),at=l.useRef(),rt=l.useRef(),Oe=l.useRef(),it=l.useRef(),st=l.useRef(),lt=l.useRef(),ct=l.useRef(),ot=l.useRef(),dt=l.useRef(),ut=l.useRef(),mt=l.useRef(),ga=l.useRef(),Y=l.useRef(),je=l.useRef(),se=l.useRef(),Ne=l.useRef(),Ce=l.useRef(),pt=l.useRef(),$t=l.useRef({}),[_a,va]=l.useState(!1),[Re,sn]=l.useState(""),[W,ft]=l.useState(""),[H,ht]=l.useState(""),[we,St]=l.useState(""),[ke,Et]=l.useState(""),[K,Pe]=l.useState(""),[ya,fe]=l.useState(""),[Tt,Dt]=l.useState({lat:"",lng:""}),[ja,bt]=l.useState(""),[Na,ln]=l.useState([]),[Me,xt]=l.useState([]),[xi,Fe]=l.useState([]),[Z,J]=l.useState([Ze()]),[Le,cn]=l.useState("Factura"),[le,It]=l.useState(null),[on,Ca]=l.useState(null),[$e,Ra]=l.useState(null),[dn,At]=l.useState(null),[he,Ot]=l.useState(""),[Pt,wa]=l.useState([]),[Mt,un]=l.useState(""),[Lt,mn]=l.useState(!1),[C,ka]=l.useState(r?"multivende":"orders"),[Fa,$a]=l.useState([]),[Sa,Ea]=l.useState([]),[pn,Ta]=l.useState(ma()),[Be,Da]=l.useState(Vr()),[w,Bt]=l.useState({recipient_name:"",recipient_document_type:"DNI",recipient_document_number:"",recipient_phone:"",delivered_at:ca(),evidence_notes:"",evidence_url:"",latitude:"",longitude:""}),Ia=l.useMemo(()=>{const e=new oa;return e.externalSource=r||Yn,e},[r]),gt=jt.find(e=>e.id===C)??jt[0],Ge=pn[C]??{},fn=Be[C]??{},Aa=l.useMemo(()=>qr(Be.orders),[Be.orders]),Oa=l.useMemo(()=>zr(C,fn),[C,fn]),Pa=l.useMemo(()=>Yr(Be.multivende,r||Yn),[Be.multivende,r]),Ma=l.useMemo(()=>{var a;const e=new URLSearchParams;return Re&&e.append("business_id",Re),W&&e.append("business_branch_id",W),H&&e.append("warehouse_id",H),we&&e.append("client_id",we),ke&&e.append("eventual_client_id",ke),K&&e.append("client_distribution_network_id",K),(a=M.current)!=null&&a.value&&e.append("issue_date",M.current.value),`/api/admin/commercial-orders/articles?${e.toString()}`},[Re,W,H,we,ke,K]),La=l.useMemo(()=>W?["business_branch_id","=",Number(W)]:null,[W]);l.useEffect(()=>()=>{he!=null&&he.startsWith("blob:")&&URL.revokeObjectURL(he)},[he]),l.useEffect(()=>{let e=!0;return Promise.all([ge.getBusinesses(),P.getLaboratories()]).then(([a,i])=>{e&&($a(a),Ea(i))}),()=>{e=!1}},[]),l.useEffect(()=>{if(!le)return;const e=()=>It(null),a=i=>{i.key==="Escape"&&e()};return document.addEventListener("click",e),document.addEventListener("keydown",a),window.addEventListener("resize",e),window.addEventListener("scroll",e,!0),()=>{document.removeEventListener("click",e),document.removeEventListener("keydown",a),window.removeEventListener("resize",e),window.removeEventListener("scroll",e,!0)}},[le]);const hn=e=>($t.current[e]||($t.current[e]=l.createRef()),$t.current[e]);l.useEffect(()=>{Z.forEach(e=>{const a=hn(e.uid);!a.current||!e.article_id||!e.article_label||`${$(a.current).val()}`==`${e.article_id}`||Ee(a.current,e.article_id,e.article_label)})},[Z]);const bn=async(e,a=null)=>{if(!e){ln([]),ft("");return}const d=(await P.getBranchesByBusiness(e)??[]).filter(u=>u.status!==null);if(ln(d),a&&d.some(u=>`${u.id}`==`${a}`)){ft(`${a}`);return}ft("")},xn=e=>{if(!e)return;const a=ei(e),i=ti(e);a&&Y.current&&(Y.current.value=a),i&&se.current&&(se.current.value=i),a&&bt(a)},gn=async(e,a=null,i=null)=>{var g;if(!e){xt([]),Pe(""),Fe([]),fe("");return}const u=(await P.getDistributionNetworks(e)??[]).filter(h=>h.status!==null);xt(u);const o=a||((g=u.find(h=>h.is_default))==null?void 0:g.id);if(o&&u.some(h=>`${h.id}`==`${o}`)){Pe(`${o}`),await _n(o,null,u);return}Pe(""),Fe([]),fe(""),xn(i)},_n=async(e,a=null,i=null)=>{var h,y;if(!e){Fe([]),fe("");return}let d=[];const u=(i??Me).find(v=>`${v.id}`==`${e}`);(((h=u==null?void 0:u.addresses)==null?void 0:h.length)??0)>0?d=u.addresses:d=await P.getDeliveryAddresses(e);const o=(d??[]).filter(v=>v.status!==null);Fe(o);const g=a||((y=o.find(v=>v.is_default))==null?void 0:y.id);if(g&&o.some(v=>`${v.id}`==`${g}`)){fe(`${g}`),Ba(o.find(v=>`${v.id}`==`${g}`));return}fe("")},Ba=e=>{e&&(Y.current&&(Y.current.value=F(e.address)),je.current&&(je.current.value=F(e.reference)),se.current&&(se.current.value=F(e.ubigeo)),Ne.current&&(Ne.current.value=F(e.contact_name)),Ce.current&&(Ce.current.value=F(e.contact_phone)),bt(F(e.address)),ae({lat:e.latitude,lng:e.longitude})&&Dt({lat:Number(e.latitude),lng:Number(e.longitude)}))},vn=async(e,a={})=>{var o,g,h;const i=a.article_id??e.article_id,d=Number(a.quantity??e.quantity??0),u=a.presentation_id??e.presentation_id;return!i||!H||d<=0?null:await P.resolvePrice({article_id:i,presentation_id:u||null,quantity:d,business_id:Re||null,business_branch_id:W||null,warehouse_id:H||null,client_id:we||null,eventual_client_id:ke||null,client_distribution_network_id:K||null,issue_date:((o=M.current)==null?void 0:o.value)||null,commercial_channel:((g=Me.find(y=>`${y.id}`==`${K}`))==null?void 0:g.commercial_channel)||null,segment:((h=Me.find(y=>`${y.id}`==`${K}`))==null?void 0:h.segment)||null})},Gt=async(e=null)=>{const a=e??Z;for(const i of a){if(!i.article_id)continue;const d=await vn(i);d&&J(u=>u.map(o=>o.uid!==i.uid?o:_e({...o,stock_available:Number(d.stock_available||0),price_unit:Hn(o,d),price_source:Kn(o,d),price_list_code:d.price_list_code||""})))}},yn=e=>{e==="regular"?(Et(""),ee(q)):e==="eventual"&&(St(""),xt([]),Pe(""),Fe([]),fe(""),ee(z))},Vt=async(e=null)=>{var h,y,v,I;va(!!(e!=null&&e.id)),pe.current&&(pe.current.value=(e==null?void 0:e.id)??""),ve.current&&(ve.current.value=(e==null?void 0:e.code)??"Se genera al guardar"),M.current&&(M.current.value=e!=null&&e.issue_date?e.issue_date.toString().slice(0,10):new Date().toISOString().slice(0,10)),nt.current&&(nt.current.value=e!=null&&e.promised_delivery_at?e.promised_delivery_at.toString().slice(0,10):""),cn(wt((e==null?void 0:e.document_type)??"Factura")),at.current&&(at.current.value=(e==null?void 0:e.currency)??"PEN"),rt.current&&(rt.current.value=(e==null?void 0:e.payment_condition)??"Contado"),Oe.current&&(Oe.current.value=Zr(e==null?void 0:e.payment_method)),ct.current&&(ct.current.value=(e==null?void 0:e.installments)??1),ot.current&&(ot.current.value=e!=null&&e.first_due_date?e.first_due_date.toString().slice(0,10):""),dt.current&&(dt.current.value=(e==null?void 0:e.order_status)??(e!=null&&e.external_source?"pending":"draft")),ut.current&&(ut.current.value=(e==null?void 0:e.dispatch_status)??"pending"),mt.current&&(mt.current.value=(e==null?void 0:e.billing_status)??"pending"),Y.current&&(Y.current.value=F(e==null?void 0:e.delivery_address)),je.current&&(je.current.value=F(e==null?void 0:e.delivery_reference)),se.current&&(se.current.value=F(e==null?void 0:e.ubigeo)),Ne.current&&(Ne.current.value=F(e==null?void 0:e.dispatch_contact_name)),Ce.current&&(Ce.current.value=F(e==null?void 0:e.dispatch_contact_phone)),it.current&&(it.current.value=(e==null?void 0:e.purchase_order)??""),st.current&&(st.current.value=(e==null?void 0:e.guide_number)??""),lt.current&&(lt.current.value=(e==null?void 0:e.referral_guide)??""),ye.current&&(ye.current.value=(e==null?void 0:e.doctor_name)??""),pt.current&&(pt.current.value=(e==null?void 0:e.observations)??""),Dt({lat:ae({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lat):"",lng:ae({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lng):""}),bt(F(e==null?void 0:e.delivery_address));const a=e!=null&&e.business_id?`${e.business_id}`:"",i=e!=null&&e.warehouse_id?`${e.warehouse_id}`:"",d=e!=null&&e.client_id?`${e.client_id}`:"",u=e!=null&&e.eventual_client_id?`${e.eventual_client_id}`:"";sn(a),ht(i),St(d),Et(u),a&&((h=e==null?void 0:e.business)!=null&&h.name)?Ee(Ae.current,a,e.business.name):ee(Ae),i&&((y=e==null?void 0:e.warehouse)!=null&&y.name)?Ee(k.current,i,e.warehouse.name):ee(k),d&&((v=e==null?void 0:e.client)!=null&&v.full_name)?Ee(z.current,d,`${e.client.document_number??""} - ${e.client.full_name}`.trim()):ee(z),u&&((I=e==null?void 0:e.eventual_client)!=null&&I.business_name)?Ee(q.current,u,`${e.eventual_client.document_number??""} - ${e.eventual_client.business_name}`.trim()):ee(q),e!=null&&e.seller_id&&(e!=null&&e.seller)?Ee(ie.current,e.seller_id,Dr(e.seller)):ee(ie);const o=((e==null?void 0:e.items)??[]).map(j=>{var oe,de,ue,me,N,S,Ve,Ue,ze,qe,Ye,We,He,Ke,Je,Qe;const b=j.article??null,U=((b==null?void 0:b.presentations)??[]).filter(A=>(A==null?void 0:A.status)!==!1&&(A==null?void 0:A.status)!==0),L=j.presentation??U[0]??null,xe=Number(j.presentation_units??(L==null?void 0:L.units)??1)||1;return _e({uid:crypto.randomUUID(),article_id:j.article_id?`${j.article_id}`:"",article_label:b?`${b.code??""} - ${b.name??""}`.trim():"",article_code:(b==null?void 0:b.code)??j.external_sku??"",article_lot:(b==null?void 0:b.default_lot)??"",article_name:(b==null?void 0:b.name)??"",article_unit:((oe=b==null?void 0:b.unit)==null?void 0:oe.symbol)??((de=b==null?void 0:b.unit)==null?void 0:de.name)??"",article_laboratory:((ue=b==null?void 0:b.laboratory)==null?void 0:ue.name)??"",article_principle:((me=b==null?void 0:b.activePrinciple)==null?void 0:me.name)??((N=b==null?void 0:b.active_principle)==null?void 0:N.name)??"",presentations:U.map(A=>({id:`${A.id}`,name:A.name??"Presentacion",units:Number(A.units||1),price:Number(A.price||0)})),presentation_id:L!=null&&L.id?`${L.id}`:"",presentation_units:xe,stock_available:Number(j.stock_available||0),reserved_quantity:Number(j.reserved_quantity||0),price_unit:Number(j.price_unit||0),quantity:Number(j.quantity||1),discount_type:((Ve=(S=j.external_payload)==null?void 0:S.commercial_form)==null?void 0:Ve.discount_type)??"none",discount_value:Number(((ze=(Ue=j.external_payload)==null?void 0:Ue.commercial_form)==null?void 0:ze.discount_value)||0),discount_amount:Number(((Ye=(qe=j.external_payload)==null?void 0:qe.commercial_form)==null?void 0:Ye.discount_amount)||0),gross_total:Number(((He=(We=j.external_payload)==null?void 0:We.commercial_form)==null?void 0:He.gross_total)||0),total:Number(j.total||0),price_source:j.price_source||"fallback",price_list_code:((Je=(Ke=j==null?void 0:j.price_list_item)==null?void 0:Ke.price_list)==null?void 0:Je.code)||((Qe=e==null?void 0:e.price_list)==null?void 0:Qe.code)||""})}),g=o.length?o:[Ze()];J(g),$(m.current).modal("show"),await bn((e==null?void 0:e.business_id)??null,(e==null?void 0:e.business_branch_id)??null),d?(await gn(d,(e==null?void 0:e.client_distribution_network_id)??null),e!=null&&e.client_distribution_network_id&&await _n(e.client_distribution_network_id,(e==null?void 0:e.client_delivery_address_id)??null)):(xt([]),Pe(""),Fe([]),fe(""))},Ga=async e=>{var u,o,g,h,y,v,I,j,b,U,L,xe,oe,de,ue,me,N,S,Ve,Ue,ze,qe,Ye,We,He,Ke,Je,Qe,A,An,On,Pn,Mn;e.preventDefault();const a={id:((u=pe.current)==null?void 0:u.value)||void 0,external_source:r||void 0,business_id:Re||null,business_branch_id:W||null,warehouse_id:H||null,client_id:we||null,eventual_client_id:ke||null,seller_id:((o=ie.current)==null?void 0:o.value)||null,client_distribution_network_id:K||null,client_delivery_address_id:ya||null,document_type:Le,currency:((g=at.current)==null?void 0:g.value)||"PEN",payment_condition:Xr(((h=Oe.current)==null?void 0:h.value)||((y=rt.current)==null?void 0:y.value)||"Contado"),payment_method:((v=Oe.current)==null?void 0:v.value)||"",purchase_order:((j=(I=it.current)==null?void 0:I.value)==null?void 0:j.trim())||"",guide_number:((U=(b=st.current)==null?void 0:b.value)==null?void 0:U.trim())||"",referral_guide:((xe=(L=lt.current)==null?void 0:L.value)==null?void 0:xe.trim())||"",doctor_name:((de=(oe=ye.current)==null?void 0:oe.value)==null?void 0:de.trim())||"",issue_date:((ue=M.current)==null?void 0:ue.value)||"",promised_delivery_at:((me=nt.current)==null?void 0:me.value)||null,installments:((N=ct.current)==null?void 0:N.value)||1,first_due_date:((S=ot.current)==null?void 0:S.value)||null,order_status:((Ve=dt.current)==null?void 0:Ve.value)||(r?"pending":"draft"),dispatch_status:((Ue=ut.current)==null?void 0:Ue.value)||"pending",billing_status:((ze=mt.current)==null?void 0:ze.value)||"pending",tax_amount:qt.taxAmount,delivery_address:((Ye=(qe=Y.current)==null?void 0:qe.value)==null?void 0:Ye.trim())||"",delivery_reference:((He=(We=je.current)==null?void 0:We.value)==null?void 0:He.trim())||"",ubigeo:((Je=(Ke=se.current)==null?void 0:Ke.value)==null?void 0:Je.trim())||"",map_lat:kt(Tt.lat)||null,map_lng:kt(Tt.lng)||null,dispatch_contact_name:((A=(Qe=Ne.current)==null?void 0:Qe.value)==null?void 0:A.trim())||"",dispatch_contact_phone:((On=(An=Ce.current)==null?void 0:An.value)==null?void 0:On.trim())||"",observations:((Mn=(Pn=pt.current)==null?void 0:Pn.value)==null?void 0:Mn.trim())||"",items:Z.map(O=>({article_id:O.article_id||null,presentation_id:O.presentation_id||null,warehouse_id:H||null,stock_available:O.stock_available,reserved_quantity:O.reserved_quantity,presentation_units:O.presentation_units,price_unit:O.price_unit,quantity:O.quantity,gross_total:O.gross_total,discount_type:O.discount_type,discount_value:O.discount_value,discount_amount:O.discount_amount,total:O.total,status:!0}))},i=ii(Z,H);if(i.length>0){const O=`
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${i.map(Se=>`<li><strong>${Ar(Se.article)}</strong>: faltan ${De(Se.shortage)} unidad(es) base para completar ${De(Se.quantity)}. Cantidad: ${De(Se.lineQuantity)} x ${De(Se.presentationUnits)}. Disponible: ${De(Se.available)}.</li>`).join("")}
          </ul>
        </div>
      `,{isConfirmed:fr}=await Q.fire({title:"Stock insuficiente",html:O,icon:"warning",showCancelButton:!0,confirmButtonText:"Crear de todas formas",cancelButtonText:"Revisar pedido"});if(!fr)return;a.allow_stock_shortage=!0}await P.save(a)&&($(c.current).dxDataGrid("instance").refresh(),$(m.current).modal("hide"))},Va=async e=>{const a=e.target.value||"";sn(a),ht(""),ee(k),await bn(a,null)},Ua=e=>{const a=e.target.value||"";ft(a),ht(""),ee(k)},za=async e=>{const a=e.target.value||"";ht(a),await Gt()},qa=async e=>{var d,u;const a=ra(e.target.value),i=((u=(d=$(e.target).select2("data"))==null?void 0:d[0])==null?void 0:u.data)??null;St(a),yn("regular"),xn(i),await gn(a,null,i),await Gt()},Ya=async e=>{const a=ra(e.target.value);Et(a),yn("eventual"),await Gt()},be=(e,a,i)=>{Ta(d=>({...d,[e]:{...d[e]??{},[a]:i}}))},jn=(e=C)=>{var i;const a=e==="multivende"?x:((i=jt.find(d=>d.id===e))==null?void 0:i.kind)==="billing"?p:c;return a.current?$(a.current).dxDataGrid("instance"):null},Nn=(e=C)=>{const a=jn(e);a&&a.refresh()},Cn=(e=C)=>{const a=pn[e]??{};e==="orders"&&P.setFilters({laboratory_id:a.laboratoryId||""}),Da(i=>({...i,[e]:a})),setTimeout(()=>Nn(e),0)},Wa=e=>{var a;(a=e==null?void 0:e.preventDefault)==null||a.call(e),Cn(C)},Rn=(e=!1)=>{const a=C;e&&Cn(a),setTimeout(()=>{const i=jn(a);i!=null&&i.exportToExcel&&i.exportToExcel(!1)},e?350:0)},Ha=async({id:e,field:a,value:i})=>{await P.boolean({id:e,field:a,value:i})&&$(c.current).dxDataGrid("instance").refresh()},wn=e=>{Ca(e),$(re.current).modal("show")},Ka=e=>{const a=nn(e);Ra(e),At(null),Ot(la(a==null?void 0:a.evidence_url)?a.evidence_url:""),Bt({recipient_name:(a==null?void 0:a.recipient_name)??(e==null?void 0:e.dispatch_contact_name)??"",recipient_document_type:(a==null?void 0:a.recipient_document_type)??"DNI",recipient_document_number:(a==null?void 0:a.recipient_document_number)??"",recipient_phone:(a==null?void 0:a.recipient_phone)??(e==null?void 0:e.dispatch_contact_phone)??"",delivered_at:a!=null&&a.delivered_at?`${a.delivered_at}`.replace(" ","T").slice(0,16):ca(),evidence_notes:(a==null?void 0:a.evidence_notes)??"",evidence_url:(a==null?void 0:a.evidence_url)??"",latitude:(a==null?void 0:a.latitude)??"",longitude:(a==null?void 0:a.longitude)??""}),navigator.geolocation&&navigator.geolocation.getCurrentPosition(i=>{Bt(d=>({...d,latitude:d.latitude||i.coords.latitude,longitude:d.longitude||i.coords.longitude}))},()=>{},{enableHighAccuracy:!0,timeout:5e3}),setTimeout(()=>{D.current&&(D.current.value="")},0),$(X.current).modal("show")},Ja=e=>{var i;const a=((i=e.target.files)==null?void 0:i[0])??null;At(a),Ot(a?URL.createObjectURL(a):la(w.evidence_url)?w.evidence_url:"")},ce=(e,a)=>Bt(i=>({...i,[e]:a})),Qa=async e=>{if(e.preventDefault(),!($e!=null&&$e.id))return;const a=($e.dispatch_assignments??$e.dispatchAssignments??[]).filter(u=>(u==null?void 0:u.status)!==!1&&(u==null?void 0:u.status)!==0&&(u==null?void 0:u.dispatch)).sort((u,o)=>{var g,h;return new Date(((g=o==null?void 0:o.dispatch)==null?void 0:g.scheduled_date)||(o==null?void 0:o.created_at)||0)-new Date(((h=u==null?void 0:u.dispatch)==null?void 0:h.scheduled_date)||(u==null?void 0:u.created_at)||0)})[0],i=new FormData;a!=null&&a.dispatch_id&&i.append("dispatch_id",a.dispatch_id),i.append("recipient_name",w.recipient_name??""),i.append("recipient_document_type",w.recipient_document_type??"DNI"),i.append("recipient_document_number",w.recipient_document_number??""),i.append("recipient_phone",w.recipient_phone??""),i.append("delivered_at",w.delivered_at??""),i.append("evidence_notes",w.evidence_notes??""),i.append("evidence_url",w.evidence_url??""),i.append("latitude",w.latitude??""),i.append("longitude",w.longitude??""),dn&&i.append("evidence_file",dn),await P.saveDeliveryEvidence($e.id,i)&&(At(null),Ot(""),D.current&&(D.current.value=""),$(X.current).modal("hide"),$(c.current).dxDataGrid("instance").refresh())},kn=async e=>{const a=Rt(e)[0];if(a){if(si(a)){const d=await Q.fire({title:"Guia de remision",text:`La guia ${ha(a)} esta ${da(a.guide_status).toLowerCase()}.`,icon:"question",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Ver PDF",cancelButtonText:"Cancelar"});if(d.isConfirmed){const u=await qn.issue(a.id);if(!(u!=null&&u.data))return;$(c.current).dxDataGrid("instance").refresh(),await vt(yt.referralGuide(u.data));return}if(!d.isDenied)return}await vt(yt.referralGuide(a));return}const i=await qn.prepareFromCommercialOrder(e.id);i!=null&&i.data&&($(c.current).dxDataGrid("instance").refresh(),await vt(yt.referralGuide(i.data)))},Xa=async e=>{var d;let a=Ie(e);if(a&&ba(a)){window.open(ge.downloadUrl(a.id,"pdf"),"_blank","noopener");return}if(a){if(!(await Q.fire({title:"Emitir comprobante",text:`Se emitira ${tt(a)||a.code} usando el conector configurado.`,icon:"question",showCancelButton:!0,confirmButtonText:"Emitir",cancelButtonText:"Cancelar"})).isConfirmed)return}else{if(!mi(e)){await Q.fire({title:"Comprobante no disponible",text:"Primero envia el pedido a preparacion o confirma el pedido. Los pedidos en borrador no se pueden facturar.",icon:"warning",confirmButtonText:"Entendido"});return}const u=Xt(e);if(!(await Q.fire({title:"Generar comprobante",text:`Se generara un comprobante ${u} para el pedido ${e.code}.`,icon:"question",showCancelButton:!0,confirmButtonText:"Generar",cancelButtonText:"Cancelar"})).isConfirmed)return;const g=await ge.save({commercial_order_id:e.id,document_type:u});if(!((d=g==null?void 0:g.data)!=null&&d.id))return;const h=await ge.prepareVoucher(g.data.id);if(a=(h==null?void 0:h.data)??g.data,$(c.current).dxDataGrid("instance").refresh(),!(await Q.fire({title:"Comprobante generado",text:`Se genero ${tt(a)||a.code}. Deseas emitirlo ahora?`,icon:"success",showCancelButton:!0,confirmButtonText:"Emitir",cancelButtonText:"Cerrar"})).isConfirmed)return}await ge.issue(a.id)&&$(c.current).dxDataGrid("instance").refresh()},Za=async e=>{const{isConfirmed:a}=await Q.fire({title:"Eliminar pedido comercial",text:"Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!a||!await P.delete(e)||$(c.current).dxDataGrid("instance").refresh()},er=()=>{E.current&&(E.current.value=""),$(_.current).modal("show"),setTimeout(()=>{var e;return(e=E.current)==null?void 0:e.focus()},150)},tr=async e=>{var i,d;e.preventDefault();const a=((d=(i=E.current)==null?void 0:i.value)==null?void 0:d.trim())||"";if(!a){await Q.fire({title:"CHECK OUT ID requerido",text:"Ingresa el CHECK OUT ID del pedido Multivende.",icon:"warning",confirmButtonText:"Entendido"});return}await Q.fire({title:"Integracion pendiente",text:`El formulario ya captura el CHECK OUT ID ${a}. Falta conectar el servicio de Multivende para registrar el pedido automaticamente.`,icon:"info",confirmButtonText:"Aceptar"})},Fn=()=>{T.current&&(T.current.value=""),R.current&&(R.current.value=""),G.current&&(G.current.value="1")},$n=async()=>{mn(!0);try{const e=await zn.paginate({take:100,skip:0,requireTotalCount:!0,sort:[{selector:"id",desc:!1}]});wa((e==null?void 0:e.data)??[])}finally{mn(!1)}},nr=async()=>{Fn(),un(""),$(B.current).modal("show"),await $n(),setTimeout(()=>{var e;return(e=R.current)==null?void 0:e.focus()},150)},ar=e=>{var a;T.current&&(T.current.value=(e==null?void 0:e.id)??""),R.current&&(R.current.value=(e==null?void 0:e.description)??""),G.current&&(G.current.value=e!=null&&e.status?"1":"0"),(a=R.current)==null||a.focus()},rr=async()=>{var i,d,u,o;const e=((d=(i=R.current)==null?void 0:i.value)==null?void 0:d.trim())||"";if(!e){await Q.fire({title:"Motivo requerido",text:"Ingresa la descripcion del motivo de retraso.",icon:"warning",confirmButtonText:"Entendido"});return}await zn.save({id:((u=T.current)==null?void 0:u.value)||void 0,description:e,status:((o=G.current)==null?void 0:o.value)==="1"})&&(Fn(),await $n())},ir=async(e,a)=>{var j,b,U,L,xe,oe,de,ue,me;$(a.target).data("select2")&&$(a.target).select2("close");const i=(j=$(a.target).select2("data"))==null?void 0:j[0],d=(i==null?void 0:i.data)??null,u=a.target.value||"";if(!u){J(N=>N.map(S=>S.uid===e?{...Ze(),uid:S.uid}:S));return}const o=d??await P.getArticleById(u),g=((o==null?void 0:o.presentations)??[]).filter(N=>(N==null?void 0:N.status)!==!1&&(N==null?void 0:N.status)!==0),h=g[0]??null,y=o?`${o.code??""} - ${o.name??""}`.trim():(i==null?void 0:i.text)??u,v={article_id:u,article_label:y,article_code:(o==null?void 0:o.code)??"",article_lot:(o==null?void 0:o.default_lot)??"",article_name:(o==null?void 0:o.name)??"",article_unit:((b=o==null?void 0:o.unit)==null?void 0:b.symbol)??((U=o==null?void 0:o.unit)==null?void 0:U.name)??"",article_laboratory:((L=o==null?void 0:o.laboratory)==null?void 0:L.name)??"",article_principle:((xe=o==null?void 0:o.activePrinciple)==null?void 0:xe.name)??((oe=o==null?void 0:o.active_principle)==null?void 0:oe.name)??"",presentations:g.map(N=>({id:`${N.id}`,name:N.name??"Presentacion",units:Number(N.units||1),price:Number(N.price||0)})),presentation_id:h?`${h.id}`:"",presentation_units:Number((h==null?void 0:h.units)||1),quantity:1};J(N=>N.map(S=>S.uid===e?_e({...S,...v}):S));const I=await P.resolvePrice({article_id:u,presentation_id:h?`${h.id}`:null,quantity:1,business_id:Re||null,business_branch_id:W||null,warehouse_id:H||null,client_id:we||null,eventual_client_id:ke||null,client_distribution_network_id:K||null,issue_date:((de=M.current)==null?void 0:de.value)||null,commercial_channel:((ue=Me.find(N=>`${N.id}`==`${K}`))==null?void 0:ue.commercial_channel)||null,segment:((me=Me.find(N=>`${N.id}`==`${K}`))==null?void 0:me.segment)||null});I&&J(N=>N.map(S=>S.uid===e?_e({...S,...v,stock_available:Number(I.stock_available||0),price_unit:Number(I.price_unit||0),price_source:I.source||"fallback",price_list_code:I.price_list_code||""}):S))},Ut=async(e,a,i)=>{const d=Z.find(y=>y.uid===e);if(!d)return;const u=a==="presentation_id"?d.presentations.find(y=>`${y.id}`==`${i}`):null,o=_e({...d,[a]:i,...a==="presentation_id"?{presentation_units:Number((u==null?void 0:u.units)||1)}:{}});if(a==="price_unit"&&(o.price_source="manual",o.price_list_code=""),J(y=>y.map(v=>v.uid===e?o:v)),!["quantity","presentation_id"].includes(a))return;const g=o.presentations.find(y=>`${y.id}`==`${a==="presentation_id"?i:o.presentation_id}`),h=await vn(o,{quantity:a==="quantity"?i:o.quantity,presentation_id:a==="presentation_id"?i:o.presentation_id});h&&J(y=>y.map(v=>v.uid!==e?v:_e({...v,presentation_units:Number((g==null?void 0:g.units)||v.presentation_units||1),stock_available:Number(h.stock_available||0),price_unit:Hn(v,h,a==="presentation_id"),price_source:Kn(v,h,a==="presentation_id"),price_list_code:a==="presentation_id"?h.price_list_code||"":an(v)?v.price_list_code:h.price_list_code||""})))},sr=(e,a)=>{const i=Number(a||0);J(d=>d.map(u=>u.uid!==e?u:_e({...u,discount_type:i>0?"percent":"none",discount_value:i>0?i:0})))},lr=(e,a)=>{a.preventDefault(),a.stopPropagation();const i=a.currentTarget.getBoundingClientRect();It(d=>(d==null?void 0:d.uid)===e?null:{uid:e,top:i.bottom+4,left:i.left,width:Math.max(i.width,130)})},Sn=(e,a)=>{sr(e,a),It(null)},cr=()=>J(e=>[...e,Ze()]),or=e=>{J(a=>{const i=a.filter(d=>d.uid!==e);return i.length?i:[Ze()]})},zt=l.useMemo(()=>Z.reduce((e,a)=>e+Number(a.total||0),0),[Z]),qt=l.useMemo(()=>sa(zt,Le),[zt,Le]),En=l.useMemo(()=>fi(on),[on]),Yt=l.useMemo(()=>{const e=Mt.trim().toLowerCase();return e?Pt.filter(a=>[a.description,a.status?"Activo":"Inactivo",Qt(a.creator),ea(a.created_at)].some(i=>`${i??""}`.toLowerCase().includes(e))):Pt},[Pt,Mt]),dr=(e,a)=>n.jsxs("div",{className:`commercial-order-filter-field commercial-order-filter-${a.key}`,children:[n.jsxs("label",{className:"form-label",children:[a.label,a.helper&&n.jsxs("span",{className:"commercial-order-filter-helper",children:[" ",a.helper]})]}),a.type==="business"?n.jsxs("select",{className:"form-select",value:Ge[a.key]??"",onChange:i=>be(e,a.key,i.target.value),children:[n.jsx("option",{value:"",children:"Todos"}),Fa.map(i=>n.jsx("option",{value:i.id,children:i.name},`commercial-order-filter-business-${i.id}`))]}):a.type==="laboratory"?n.jsxs("select",{className:"form-select",value:Ge[a.key]??"",onChange:i=>be(e,a.key,i.target.value),children:[n.jsx("option",{value:"",children:"Todos"}),Sa.map(i=>n.jsx("option",{value:i.id,children:i.name},`commercial-order-filter-laboratory-${i.id}`))]}):a.type==="select"?n.jsx("select",{className:"form-select",value:Ge[a.key]??"",onChange:i=>be(e,a.key,i.target.value),children:(a.options??[]).map(i=>n.jsx("option",{value:i.value??i,children:i.label??i},`commercial-order-filter-${a.key}-${i.value??i}`))}):a.type==="dateRange"?n.jsx("input",{className:"form-control commercial-order-date-range-input","data-tab-id":e,value:Ge[a.key]??"",onChange:i=>be(e,a.key,i.target.value),placeholder:a.placeholder??"YYYY/MM/DD - YYYY/MM/DD"}):n.jsx("input",{className:"form-control",value:Ge[a.key]??"",onChange:i=>be(e,a.key,i.target.value),placeholder:a.placeholder??""})]},`commercial-order-main-filter-${e}-${a.key}`),Wt={orders:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"laboratoryId",label:"Laboratorio",helper:"(Solo para Reporte con Visitadores)",type:"laboratory"},{key:"dispatchStatus",label:"Despachado",type:"select",options:[{value:"",label:"Seleccionar"},{value:"dispatched",label:"Pedidos despachados"},{value:"pending",label:"Pedidos sin despachar"}]}],issued:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],cancelled:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],"credit-notes":[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],multivende:[{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"orderVtex",label:"Pedido VTEX",type:"text",placeholder:"Numero de pedido"}]}[C]??((In=Wn[C])==null?void 0:In.filters)??[],Tn=Wt.some(e=>e.type==="dateRange");l.useEffect(()=>{if(!Tn)return;let e=!0;return Gr().then(()=>{var a,i;!e||!((i=(a=window.$)==null?void 0:a.fn)!=null&&i.daterangepicker)||!window.moment||(window.moment.locale("es"),$(".commercial-order-date-range-input").each(function(){const d=$(this),u=d.data("tab-id")||C,o=`${d.val()||te()}`.trim(),{start:g,end:h}=pa(o),y=window.moment(g||tn().replaceAll("/","-"),"YYYY-MM-DD"),v=window.moment(h||g||tn().replaceAll("/","-"),"YYYY-MM-DD"),I=d.data("daterangepicker");I&&I.remove(),d.off(".commercialOrderDateRange"),d.daterangepicker({startDate:y,endDate:v,autoUpdateInput:!1,alwaysShowCalendars:!0,linkedCalendars:!1,opens:"center",locale:{format:"YYYY/MM/DD",separator:" - ",applyLabel:"Aplicar",cancelLabel:"Limpiar",fromLabel:"Desde",toLabel:"Hasta",customRangeLabel:"Personalizado",weekLabel:"S",daysOfWeek:["Do","Lu","Ma","Mi","Ju","Vi","Sa"],monthNames:["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"],firstDay:1}},(j,b)=>{const U=`${j.format("YYYY/MM/DD")} - ${b.format("YYYY/MM/DD")}`;d.val(U),be(u,"dateRange",U)}),d.on("cancel.daterangepicker.commercialOrderDateRange",()=>{d.val(""),be(u,"dateRange","")})}))}).catch(()=>{}),()=>{e=!1,$(".commercial-order-date-range-input").each(function(){const a=$(this).data("daterangepicker");a&&a.remove(),$(this).off(".commercialOrderDateRange")})}},[C,Tn]);const _t=n.jsxs("div",{className:"commercial-order-listing-header",children:[n.jsxs("div",{className:"d-flex align-items-center justify-content-between gap-2 mb-2",children:[n.jsx("h4",{className:"header-title mb-0",children:"Listado"}),n.jsx("button",{type:"button",className:"btn btn-xs btn-light",onClick:()=>Nn(),title:"Refrescar listado",children:n.jsx("i",{className:"mdi mdi-refresh"})})]}),n.jsx("ul",{className:"nav nav-tabs nav-bordered flex-nowrap overflow-auto mb-3",children:jt.map(e=>n.jsx("li",{className:"nav-item",children:n.jsx("button",{type:"button",className:`nav-link text-nowrap ${C===e.id?"active":""}`,onClick:()=>ka(e.id),children:e.label})},`commercial-order-tab-${e.id}`))}),Wt.length>0&&n.jsxs("form",{className:"commercial-order-filter-form mb-2",onSubmit:Wa,children:[Wt.map(e=>dr(C,e)),n.jsxs("div",{className:"commercial-order-filter-actions",children:[n.jsxs("button",{type:"submit",className:"btn btn-outline-primary",children:[n.jsx("i",{className:"mdi mdi-magnify me-1"}),"Filtrar"]}),gt.kind!=="static"&&n.jsxs("button",{type:"button",className:"btn btn-outline-danger",onClick:()=>Rn(!0),children:[n.jsx("i",{className:"mdi mdi-file-excel-box me-1"}),"Filtrar a Excel"]}),gt.kind!=="static"&&n.jsxs("button",{type:"button",className:"btn btn-outline-success",onClick:()=>Rn(!1),children:[n.jsx("i",{className:"mdi mdi-file-excel-box me-1"}),"Reporte"]}),C==="multivende"&&n.jsxs("button",{type:"button",className:"btn btn-outline-success",children:[n.jsx("i",{className:"mdi mdi-calendar-refresh me-1"}),"Actualizar fechas de entrega"]})]})]}),C==="issued"&&n.jsx("div",{className:"row g-3 mt-1",children:["Total","IGV","IGV Recuperado"].map(e=>n.jsxs("div",{className:"col-12 col-md-4",children:[n.jsx("label",{className:"form-label",children:e}),n.jsx("input",{className:"form-control",value:"0.00",readOnly:!0})]},`commercial-order-total-${e}`))})]}),Ht={caption:"Acciones",width:100,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowSorting:!1,cellTemplate:(e,{data:a})=>{e.addClass("commercial-order-actions"),V(e,{variant:"danger",title:"Descargar PDF del comprobante",icon:"mdi mdi-file-pdf-box",onClick:()=>window.open(ge.downloadUrl(a.id,"pdf"),"_blank")})}},ur=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"dispatch_status",visible:!1,showInColumnChooser:!1}],Kt=[{dataField:"source_type",visible:!1,showInColumnChooser:!1},{dataField:"local_status",visible:!1,showInColumnChooser:!1},{dataField:"document_type",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"created_at",visible:!1,showInColumnChooser:!1}],mr=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"external_order_id",visible:!1,showInColumnChooser:!1},{dataField:"external_checkout_id",visible:!1,showInColumnChooser:!1}],Dn={issued:[...Kt,Ht,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:aa},{caption:"Cliente",minWidth:260,calculateCellValue:Zt},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>en(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}],cancelled:[...Kt,Ht,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"Cliente",minWidth:260,calculateCellValue:Zt},{caption:"Motivo",minWidth:180,calculateCellValue:Hr},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>en(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"F. Facturacion",dataType:"date",width:130},{dataField:"cancelled_at",caption:"F. Anulacion",dataType:"datetime",width:160}],"credit-notes":[...Kt,Ht,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:aa},{caption:"Doc. Afecto",width:130,calculateCellValue:Wr},{caption:"Cliente",minWidth:260,calculateCellValue:Zt},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>en(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}]},pr=[...mr,{caption:"Acciones",width:230,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:a})=>{const i=Rt(a).length>0;e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),V(e,{variant:"primary",title:"Editar pedido Multivende",icon:"mdi mdi-pencil",onClick:()=>Vt(a)}),V(e,{variant:"info",title:"Ver historial del pedido Multivende",icon:"mdi mdi-map-marker-path",onClick:()=>wn(a)}),V(e,{variant:i?"dark":"warning",title:i?"Ver guia de remision asociada":"Generar guia de remision",icon:i?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>kn(a)})}},{dataField:"order_status",caption:"E. Pedido",width:130,lookup:Gn(Vn),cellTemplate:(e,{value:a})=>Nt(e,a,Un)},{caption:"E. SUNAT",width:120,calculateCellValue:Kr},{caption:"Pedido VTEX",width:150,calculateCellValue:Jr},{dataField:"external_channel",caption:"Canal",width:130},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:Xn},{dataField:"document_type",caption:"Tipo Documento",width:140,calculateCellValue:Xt,cellTemplate:(e,{value:a})=>Nt(e,a,i=>i||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:300,calculateCellValue:Zn},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"promised_delivery_at",caption:"F. Entrega Estimada",dataType:"date",width:160},{caption:"F. de Entrega",width:150,dataType:"date",calculateCellValue:fa},{caption:"Tiempo de Proceso",width:150,calculateCellValue:Qr},{dataField:"created_at",caption:"Fecha Registro",dataType:"date",width:140},{dataField:"code",caption:"Codigo",width:130}];return n.jsxs(n.Fragment,{children:[n.jsx("style",{children:`
      .commercial-order-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 352px;
        white-space: nowrap;
        overflow: visible !important;
      }
      .commercial-order-action-btn {
        width: 34px;
        height: 30px;
        padding: 0 !important;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        line-height: 1;
        flex: 0 0 34px;
      }
      .commercial-order-action-btn i {
        display: inline-flex;
        font-size: 16px;
        line-height: 1;
      }
      .commercial-order-status-cell {
        overflow: visible !important;
      }
      .commercial-order-status-badge {
        align-items: center;
        border: 1px solid transparent;
        border-radius: 999px;
        display: inline-flex;
        font-size: 0.78rem;
        font-weight: 700;
        justify-content: center;
        line-height: 1.15;
        max-width: 100%;
        min-height: 24px;
        padding: 4px 9px;
        white-space: nowrap;
      }
      .commercial-order-status-draft {
        background: #f1f5f9;
        border-color: #cbd5e1;
        color: #475569;
      }
      .commercial-order-status-pending {
        background: #fff7ed;
        border-color: #fed7aa;
        color: #9a3412;
      }
      .commercial-order-status-confirmed {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #1d4ed8;
      }
      .commercial-order-status-partial {
        background: #f5f3ff;
        border-color: #c4b5fd;
        color: #6d28d9;
      }
      .commercial-order-status-preparing {
        background: #fef3c7;
        border-color: #fbbf24;
        color: #92400e;
      }
      .commercial-order-status-dispatched {
        background: #ede9fe;
        border-color: #c4b5fd;
        color: #6d28d9;
      }
      .commercial-order-status-in_route {
        background: #e0f2fe;
        border-color: #7dd3fc;
        color: #0369a1;
      }
      .commercial-order-status-delivered {
        background: #dcfce7;
        border-color: #86efac;
        color: #166534;
      }
      .commercial-order-status-cancelled {
        background: #fee2e2;
        border-color: #fca5a5;
        color: #b91c1c;
      }
      .commercial-order-status-billed,
      .commercial-order-status-closed,
      .commercial-order-status-paid {
        background: #ecfdf5;
        border-color: #6ee7b7;
        color: #047857;
      }
      .commercial-order-status-factura {
        background: #eef2ff;
        border-color: #a5b4fc;
        color: #3730a3;
      }
      .commercial-order-status-boleta {
        background: #ccfbf1;
        border-color: #5eead4;
        color: #0f766e;
      }
      .commercial-order-status-nota-de-pedido {
        background: #f8fafc;
        border-color: #94a3b8;
        color: #334155;
      }
      .commercial-order-status-empty {
        background: #f8fafc;
        border-color: #e2e8f0;
        color: #64748b;
      }
      .commercial-order-action-btn:hover,
      .commercial-order-action-btn:focus,
      .commercial-order-action-btn:active {
        box-shadow: none !important;
        opacity: 1 !important;
      }
      .commercial-order-action-btn.btn-soft-primary,
      .commercial-order-action-btn.btn-soft-primary:hover,
      .commercial-order-action-btn.btn-soft-primary:focus,
      .commercial-order-action-btn.btn-soft-primary:active {
        background-color: rgba(59, 130, 246, 0.14) !important;
        border-color: rgba(59, 130, 246, 0.18) !important;
        color: #3b82f6 !important;
      }
      .commercial-order-action-btn.btn-soft-success,
      .commercial-order-action-btn.btn-soft-success:hover,
      .commercial-order-action-btn.btn-soft-success:focus,
      .commercial-order-action-btn.btn-soft-success:active {
        background-color: rgba(16, 196, 105, 0.14) !important;
        border-color: rgba(16, 196, 105, 0.18) !important;
        color: #10c469 !important;
      }
      .commercial-order-action-btn.btn-soft-info,
      .commercial-order-action-btn.btn-soft-info:hover,
      .commercial-order-action-btn.btn-soft-info:focus,
      .commercial-order-action-btn.btn-soft-info:active {
        background-color: rgba(53, 184, 224, 0.14) !important;
        border-color: rgba(53, 184, 224, 0.18) !important;
        color: #35b8e0 !important;
      }
      .commercial-order-action-btn.btn-soft-warning,
      .commercial-order-action-btn.btn-soft-warning:hover,
      .commercial-order-action-btn.btn-soft-warning:focus,
      .commercial-order-action-btn.btn-soft-warning:active {
        background-color: rgba(247, 184, 75, 0.16) !important;
        border-color: rgba(247, 184, 75, 0.2) !important;
        color: #f7b84b !important;
      }
      .commercial-order-action-btn.btn-soft-danger,
      .commercial-order-action-btn.btn-soft-danger:hover,
      .commercial-order-action-btn.btn-soft-danger:focus,
      .commercial-order-action-btn.btn-soft-danger:active {
        background-color: rgba(255, 91, 91, 0.14) !important;
        border-color: rgba(255, 91, 91, 0.18) !important;
        color: #ff5b5b !important;
      }
      .commercial-order-action-btn i,
      .commercial-order-action-btn:hover i,
      .commercial-order-action-btn:focus i,
      .commercial-order-action-btn:active i {
        color: inherit !important;
      }
      .commercial-order-top-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: flex-end;
        margin-bottom: 12px;
      }
      .commercial-order-multivende-action,
      .commercial-order-delay-action {
        min-height: 46px;
        min-width: min(100%, 360px);
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        border-radius: 4px;
        padding: 0 16px;
        font-weight: 600;
      }
      .commercial-order-delay-action {
        background: #f7b84b;
        border-color: #f7b84b;
        color: #fff;
      }
      .commercial-order-delay-action:hover,
      .commercial-order-delay-action:focus {
        background: #eba934;
        border-color: #eba934;
        color: #fff;
      }
      .commercial-order-multivende-action span,
      .commercial-order-delay-action span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .commercial-order-multivende-form {
        padding: 8px 2px 0;
      }
      .commercial-order-delay-maintainer {
        padding: 4px 4px 0;
      }
      .commercial-order-delay-actions {
        display: flex;
        gap: 6px;
        justify-content: center;
        margin-bottom: 22px;
      }
      .commercial-order-delay-filter {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        margin-bottom: 8px;
      }
      .commercial-order-delay-filter .form-control {
        max-width: 220px;
      }
      .commercial-order-delay-table {
        max-height: 380px;
        overflow: auto;
      }
      .commercial-order-delay-table table {
        min-width: 780px;
      }
      .commercial-order-delay-table th {
        color: var(--ct-gray-700);
        font-size: 0.78rem;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .commercial-order-delay-summary {
        color: var(--ct-gray-700);
        font-size: 0.86rem;
        margin-top: 10px;
      }
      .commercial-order-listing-header .nav-link {
        background: transparent;
        border: 0;
      }
      .commercial-order-filter-form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 12px 16px;
        align-items: end;
      }
      .commercial-order-filter-field {
        min-width: 0;
      }
      .commercial-order-filter-field .form-label {
        margin-bottom: 6px;
        font-weight: 600;
      }
      .commercial-order-filter-helper {
        color: var(--ct-success);
        font-size: 0.78rem;
        font-weight: 700;
      }
      .commercial-order-filter-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .commercial-order-filter-actions .btn {
        min-height: 38px;
        white-space: nowrap;
      }
      .daterangepicker {
        z-index: 1080;
      }
      @media (min-width: 1200px) {
        .commercial-order-filter-form {
          grid-template-columns:
            minmax(190px, 0.95fr)
            minmax(250px, 1fr)
            minmax(260px, 1fr)
            minmax(180px, 0.85fr)
            auto;
        }
        .commercial-order-filter-actions {
          justify-content: flex-start;
        }
      }
      .commercial-order-page-size {
        width: 76px;
      }
      .commercial-order-list-search {
        width: 220px;
      }
      .commercial-order-legacy-table table {
        min-width: 1180px;
      }
      .commercial-order-legacy-table th {
        color: var(--ct-gray-700);
        font-size: 0.76rem;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .commercial-order-modal-dialog {
        width: calc(100vw - 10px);
        max-width: calc(100vw - 10px);
      }
      .commercial-order-modal-dialog.modal-dialog-centered {
        align-items: flex-start;
        margin-top: 0.35rem;
        margin-bottom: 0.35rem;
      }
      .commercial-order-modal-body {
        padding: 12px 14px;
      }
      .commercial-order-modal-body .form-label {
        font-weight: 600;
        margin-bottom: 4px;
      }
      .commercial-order-form-section {
        border: 1px solid var(--ct-border-color);
        border-radius: 8px;
        padding: 14px 16px 16px;
        margin-bottom: 14px;
        background: var(--ct-secondary-bg);
      }
      .commercial-order-section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 12px;
        color: var(--ct-gray-700);
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .commercial-order-section-title i {
        color: var(--ct-primary);
        font-size: 16px;
      }
      .commercial-order-detail-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }
      .commercial-order-map-picker {
        border: 1px solid var(--ct-border-color);
        border-radius: 8px;
        padding: 10px;
        background: #fff;
      }
      .commercial-order-map-search {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 220px;
        gap: 10px;
        align-items: end;
        margin-bottom: 8px;
      }
      .commercial-order-map-coordinate-values {
        min-height: 38px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 2px;
        padding: 5px 10px;
        border: 1px solid var(--ct-border-color);
        border-radius: 6px;
        color: var(--ct-gray-700);
        background: var(--ct-light);
        font-size: 0.82rem;
        line-height: 1.2;
      }
      .commercial-order-map-canvas {
        width: 100%;
        height: 320px;
        border-radius: 6px;
        border: 1px solid var(--ct-border-color);
        overflow: hidden;
        background: var(--ct-light);
      }
      .commercial-order-map-empty {
        min-height: 160px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        border: 1px dashed var(--ct-border-color);
        border-radius: 6px;
        color: var(--ct-gray-600);
        background: var(--ct-light);
        text-align: center;
      }
      .commercial-order-map-results {
        max-height: 142px;
        overflow-y: auto;
        border: 1px solid var(--ct-border-color);
        border-radius: 6px;
        margin-bottom: 8px;
        background: #fff;
      }
      .commercial-order-map-result {
        display: block;
        width: 100%;
        padding: 7px 10px;
        border: 0;
        border-bottom: 1px solid var(--ct-border-color);
        background: #fff;
        color: var(--ct-gray-800);
        text-align: left;
        font-size: 0.86rem;
      }
      .commercial-order-map-result:hover,
      .commercial-order-map-result:focus {
        background: var(--ct-light);
      }
      .commercial-order-map-result:last-child {
        border-bottom: 0;
      }
      #commercial-orders-form-container .commercial-order-detail-table table {
        min-width: 1540px;
      }
      #commercial-orders-form-container .commercial-order-detail-table th {
        color: var(--ct-gray-700);
        font-size: 0.78rem;
        text-transform: uppercase;
        white-space: nowrap;
      }
      #commercial-orders-form-container .commercial-order-detail-table td {
        vertical-align: middle;
      }
      #commercial-orders-form-container .commercial-order-detail-table tfoot th,
      #commercial-orders-form-container .commercial-order-detail-table tfoot td {
        background: var(--ct-light);
        vertical-align: middle;
      }
      #commercial-orders-form-container .commercial-order-detail-table .form-group {
        position: relative;
        margin-bottom: 0 !important;
      }
      .commercial-order-detail-table .commercial-order-readonly-cell {
        min-height: 38px;
        display: flex;
        align-items: center;
        color: var(--ct-gray-700);
        font-size: 0.84rem;
      }
      .commercial-order-detail-table .commercial-order-article-name .select2-container .select2-selection--single {
        min-height: 38px;
      }
      .commercial-order-discount-cell {
        min-width: 92px;
      }
      .commercial-order-discount-trigger {
        min-width: 92px;
        width: 100%;
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border: 1px solid var(--ct-border-color);
        border-radius: 4px;
        background: #fff;
        color: var(--ct-gray-700);
        padding: 0.45rem 0.7rem;
        text-align: left;
      }
      .commercial-order-discount-trigger:hover,
      .commercial-order-discount-trigger:focus {
        border-color: var(--ct-primary);
        color: var(--ct-gray-800);
      }
      .commercial-order-discount-menu {
        position: fixed;
        z-index: 3000;
        padding: 4px;
        border: 1px solid var(--ct-border-color);
        border-radius: 6px;
        background: #fff;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.16);
      }
      .commercial-order-discount-option {
        width: 100%;
        min-height: 34px;
        display: block;
        border: 0;
        border-radius: 4px;
        background: #fff;
        color: var(--ct-gray-700);
        padding: 6px 10px;
        text-align: left;
      }
      .commercial-order-discount-option:hover,
      .commercial-order-discount-option:focus,
      .commercial-order-discount-option.active {
        background: rgba(59, 130, 246, 0.12);
        color: var(--ct-primary);
      }
      #commercial-orders-form-container .commercial-order-detail-table .select2-container {
        width: 100% !important;
      }
      #commercial-orders-form-container .commercial-order-detail-table .select2-dropdown {
        min-width: 260px;
        z-index: 1065;
      }
      @media (max-width: 767.98px) {
        .commercial-order-modal-dialog {
          width: calc(100vw - 12px);
          max-width: calc(100vw - 12px);
          margin: 0.5rem auto;
        }
        .commercial-order-modal-body {
          padding: 12px;
        }
        .commercial-order-form-section {
          padding: 12px;
        }
        .commercial-order-detail-toolbar {
          align-items: flex-start;
          flex-direction: column;
        }
        .commercial-order-map-search {
          grid-template-columns: 1fr;
        }
        .commercial-order-top-actions {
          justify-content: stretch;
        }
        .commercial-order-multivende-action,
        .commercial-order-delay-action {
          width: 100%;
        }
      }
    `}),n.jsxs("div",{className:"commercial-order-top-actions",children:[n.jsxs("button",{type:"button",className:"btn btn-success commercial-order-multivende-action",title:"Ingresar pedido Multivende por CHECK OUT ID",onClick:er,children:[n.jsxs("span",{children:[n.jsx("i",{className:"mdi mdi-plus-circle-outline"})," Ingresar pedido multivende"]}),n.jsx("i",{className:"mdi mdi-calendar-month-outline"})]}),n.jsxs("button",{type:"button",className:"btn commercial-order-delay-action",title:"Abrir mantenedor de motivos de retraso de entrega",onClick:nr,children:[n.jsx("span",{children:"Mantenedor Retraso Entrega"}),n.jsx("i",{className:"mdi mdi-cog"})]})]}),C==="orders"&&n.jsx(Jt,{gridRef:c,title:_t,rest:P,filterValue:Aa,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(c.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"add",title:"Agregar",hint:"Agregar pedido comercial",onClick:()=>Vt(null)}})},pageSize:25,exportable:!0,columns:[...ur,{caption:"Acciones",width:340,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:a})=>{const i=Rt(a).length>0;e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),V(e,{variant:"primary",title:"Editar datos, cliente, entrega y productos del pedido comercial",icon:"mdi mdi-pencil",onClick:()=>Vt(a)}),ui(a)&&V(e,{variant:"success",title:"Enviar este pedido a preparacion para iniciar picking",icon:"mdi mdi-clipboard-check-outline",onClick:()=>Ha({id:a.id,field:"dispatch_status",value:"preparing"})}),V(e,{variant:"info",title:"Ver historial de estados, guia, ruta y entrega del pedido",icon:"mdi mdi-map-marker-path",onClick:()=>wn(a)});const d=pi(a);V(e,{variant:"secondary",title:d.title,icon:d.icon,onClick:()=>Xa(a)}),V(e,{variant:i?"dark":"warning",title:i?"Ver, emitir o descargar la guia de remision asociada al pedido":"Generar guia de remision para este pedido",icon:i?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>kn(a)}),V(e,{variant:"success",title:nn(a)?"Ver o actualizar foto y datos de evidencia de entrega":"Registrar foto y datos de evidencia de entrega",icon:"mdi mdi-camera",onClick:()=>Ka(a)}),V(e,{variant:"danger",title:"Imprimir o descargar PDF resumen del pedido comercial",icon:"mdi mdi-file-pdf-box",onClick:()=>vt(yt.commercialOrder(a))}),V(e,{variant:"danger",title:"Eliminar este pedido comercial del listado",icon:"mdi mdi-delete",onClick:()=>Za(a.id)})}},{dataField:"order_status",caption:"Estado",width:140,lookup:Gn(Vn),cellTemplate:(e,{value:a})=>Nt(e,a,Un)},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:Xn},{dataField:"document_type",caption:"Tipo documento",width:130,calculateCellValue:Xt,cellTemplate:(e,{value:a})=>Nt(e,a,i=>i||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:320,calculateCellValue:Zn},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_label",caption:"Tipo de pago",width:170,calculateCellValue:Lr},{dataField:"seller.fullname",caption:"Usuario",width:190,cellTemplate:(e,{data:a})=>e.text(Ir(a.seller))},{dataField:"created_at",caption:"Fecha registro",width:130,dataType:"date"},{dataField:"creator.username",caption:"Usuario registro",width:150,cellTemplate:(e,{data:a})=>e.text(Qt(a.creator))},{dataField:"code",caption:"Código",width:130},{dataField:"business.name",caption:"Empresa",minWidth:150}]},"orders"),gt.kind==="billing"&&n.jsx(Jt,{gridRef:p,title:_t,rest:ge,filterValue:Oa,pageSize:20,exportable:!0,columns:Dn[C]??Dn.issued,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar listado",onClick:()=>$(p.current).dxDataGrid("instance").refresh()}})}},`billing-${C}`),C==="multivende"&&n.jsx(Jt,{gridRef:x,title:_t,rest:Ia,filterValue:Pa,pageSize:10,exportable:!0,columns:pr,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar pedidos Multivende",onClick:()=>$(x.current).dxDataGrid("instance").refresh()}})}},"multivende"),gt.kind==="static"&&n.jsx(hi,{title:_t,config:Wn[C]}),n.jsx(Xe,{modalRef:m,title:_a?"Editar pedido comercial":"Agregar pedido comercial",size:"xl",dialogClass:"commercial-order-modal-dialog modal-dialog-scrollable",bodyClass:"commercial-order-modal-body",bodyStyle:{maxHeight:"calc(100vh - 150px)",overflowY:"auto",overflowX:"hidden"},btnSubmitText:"Guardar",onSubmit:Ga,children:n.jsxs("div",{id:"commercial-orders-form-container",children:[n.jsx("input",{ref:pe,type:"hidden"}),n.jsx("input",{ref:ve,type:"hidden"}),n.jsx("input",{ref:M,type:"hidden"}),n.jsx("input",{ref:nt,type:"hidden"}),n.jsx("input",{ref:rt,type:"hidden"}),n.jsx("input",{ref:ct,type:"hidden"}),n.jsx("input",{ref:ot,type:"hidden"}),n.jsx("input",{ref:dt,type:"hidden"}),n.jsx("input",{ref:ut,type:"hidden"}),n.jsx("input",{ref:mt,type:"hidden"}),n.jsx("input",{ref:ga,type:"hidden",value:qt.taxAmount,readOnly:!0}),n.jsx("input",{ref:je,type:"hidden"}),n.jsxs("section",{className:"commercial-order-form-section",children:[n.jsxs("div",{className:"commercial-order-section-title",children:[n.jsx("i",{className:"mdi mdi-file-document"}),n.jsx("span",{children:"Datos del pedido"})]}),n.jsxs("div",{className:"row g-2",children:[n.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:n.jsx(Te,{eRef:Ae,label:"Empresa",required:!0,searchAPI:"/api/admin/businesses/paginate",searchBy:"name",dropdownParent:"#commercial-orders-form-container",onChange:Va})}),n.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:n.jsxs(Rr,{eRef:f,label:"Sede",dropdownParent:"#commercial-orders-form-container",value:W,onChange:Ua,children:[n.jsx("option",{value:"",children:"Sin sede"}),Na.map(e=>n.jsx("option",{value:e.id,children:e.name},`commercial-order-branch-${e.id}`))]})}),n.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:n.jsx(Te,{eRef:k,label:"Almacen",required:!0,searchAPI:"/api/admin/warehouses/paginate",searchBy:"name",filter:La,dropdownParent:"#commercial-orders-form-container",onChange:za,templateResult:ia,templateSelection:ia})}),n.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[n.jsx("label",{className:"form-label",children:"Doc. venta"}),n.jsxs("select",{ref:xa,className:"form-control",value:Le,onChange:e=>cn(wt(e.target.value)),children:[n.jsx("option",{value:"Factura",children:"Factura"}),n.jsx("option",{value:"Boleta",children:"Boleta"}),n.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),n.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[n.jsx("label",{className:"form-label",children:"Moneda"}),n.jsxs("select",{ref:at,className:"form-control",children:[n.jsx("option",{value:"PEN",children:"PEN"}),n.jsx("option",{value:"USD",children:"USD"}),n.jsx("option",{value:"EUR",children:"EUR"})]})]}),n.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[n.jsx("label",{className:"form-label",children:"Forma de pago"}),n.jsxs("select",{ref:Oe,className:"form-control",children:[n.jsx("option",{value:"",children:"Seleccione"}),Tr.map(e=>n.jsx("option",{value:e,children:e},`commercial-order-payment-${e}`))]})]})]})]}),n.jsxs("section",{className:"commercial-order-form-section",children:[n.jsxs("div",{className:"commercial-order-section-title",children:[n.jsx("i",{className:"mdi mdi-account"}),n.jsx("span",{children:"Cliente y entrega"})]}),n.jsxs("div",{className:"row g-2",children:[n.jsx("div",{className:"col-12 col-xl-6",children:n.jsx(Te,{eRef:z,label:"Cliente regular",searchAPI:"/api/admin/clients/paginate",searchBy:"full_name",selectBy:"entity_id",filter:Sr,dropdownParent:"#commercial-orders-form-container",onChange:qa})}),n.jsx("div",{className:"col-12 col-xl-6",children:n.jsx(Te,{eRef:q,label:"Cliente eventual",searchAPI:"/api/admin/eventual-clients/paginate",searchBy:"business_name",dropdownParent:"#commercial-orders-form-container",onChange:Ya})}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Orden de compra"}),n.jsx("input",{ref:it,className:"form-control"})]}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Numero de guia"}),n.jsx("input",{ref:st,className:"form-control"})]}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Guia remision"}),n.jsx("input",{ref:lt,className:"form-control"})]}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Ubigeo"}),n.jsx("input",{ref:se,className:"form-control"})]}),n.jsx("div",{className:"col-12 col-xl-4",children:n.jsx(Bn,{eRef:Y,label:"Direccion de entrega",rows:2})}),n.jsx("div",{className:"col-12",children:n.jsx(di,{modalRef:m,position:Tt,searchText:ja,onSearchTextChange:bt,onPositionChange:Dt,onAddressSelected:e=>{Y.current&&(Y.current.value=e)}})}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[n.jsx("label",{className:"form-label",children:"Nombre contacto entrega"}),n.jsx("input",{ref:Ne,className:"form-control"})]}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[n.jsx("label",{className:"form-label",children:"Celular contacto entrega"}),n.jsx("input",{ref:Ce,className:"form-control"})]}),n.jsx(Te,{eRef:ie,label:"Vendedor",col:"col-12 col-md-6 col-xl-2",searchAPI:"/api/admin/users/paginate",searchBy:"fullname",dropdownParent:"#commercial-orders-form-container"}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Medico"}),n.jsx("input",{ref:ye,className:"form-control"})]})]})]}),n.jsxs("section",{className:"commercial-order-form-section",children:[n.jsxs("div",{className:"commercial-order-detail-toolbar",children:[n.jsxs("div",{className:"commercial-order-section-title mb-0",children:[n.jsx("i",{className:"mdi mdi-format-list-bulleted"}),n.jsx("span",{children:"Detalle del pedido"})]}),n.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:cr,children:"Agregar item"})]}),n.jsx("div",{className:"table-responsive border rounded commercial-order-detail-table","data-select2-local-dropdown":"true",children:n.jsxs("table",{className:"table table-sm align-middle mb-0",children:[n.jsx("thead",{children:n.jsxs("tr",{children:[n.jsx("th",{style:{minWidth:96},children:"Descuento"}),n.jsx("th",{style:{minWidth:104},children:"Codigo"}),n.jsx("th",{style:{minWidth:88},children:"Codigo lote"}),n.jsx("th",{style:{minWidth:280},children:"Nombre"}),n.jsx("th",{style:{minWidth:128},children:"Laboratorio"}),n.jsx("th",{style:{minWidth:130},children:"Principio activo"}),n.jsx("th",{style:{minWidth:110},children:"Unidad"}),n.jsx("th",{style:{minWidth:64},children:"Stock"}),n.jsx("th",{style:{minWidth:112},children:"P. venta con IGV"}),n.jsx("th",{style:{minWidth:112},children:"P. venta sin IGV"}),n.jsx("th",{style:{minWidth:92},children:"Cantidad"}),n.jsx("th",{style:{minWidth:96},children:"Total desc."}),n.jsx("th",{style:{minWidth:96},children:"Sub total"}),n.jsx("th",{style:{width:70}})]})}),n.jsx("tbody",{children:Z.map(e=>n.jsxs("tr",{children:[n.jsx("td",{children:n.jsxs("div",{className:"commercial-order-discount-cell",children:[n.jsxs("button",{type:"button",className:"commercial-order-discount-trigger",onClick:a=>lr(e.uid,a),children:[n.jsx("span",{children:e.discount_type==="percent"&&Number(e.discount_value||0)>0?`${Number(e.discount_value)}%`:"Seleccione"}),n.jsx("i",{className:"mdi mdi-chevron-down"})]}),(le==null?void 0:le.uid)===e.uid&&n.jsxs("div",{className:"commercial-order-discount-menu",style:{top:le.top,left:le.left,minWidth:le.width},onClick:a=>a.stopPropagation(),children:[n.jsx("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type!=="percent"?"active":""}`,onClick:()=>Sn(e.uid,""),children:"Seleccione"}),Er.map(a=>n.jsxs("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type==="percent"&&Number(e.discount_value||0)===a?"active":""}`,onClick:()=>Sn(e.uid,a),children:[a,"%"]},`commercial-order-discount-floating-${e.uid}-${a}`))]})]})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_code||"-"})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_lot||"-"})}),n.jsx("td",{className:"commercial-order-article-name",children:n.jsx(Te,{eRef:hn(e.uid),searchAPI:Ma,searchBy:"name",dropdownParent:"#commercial-orders-form-container",disabled:!H,onChange:a=>ir(e.uid,a)})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_laboratory||"-"})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_principle||"-"})}),n.jsx("td",{children:n.jsxs("div",{children:[n.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_unit||"-"}),e.presentations.length>0&&n.jsxs("select",{className:"form-control mt-1","data-no-select2":"true",value:e.presentation_id,disabled:!e.article_id,onChange:a=>Ut(e.uid,"presentation_id",a.target.value),children:[n.jsx("option",{value:"",children:ni(e)}),e.presentations.map(a=>n.jsx("option",{value:a.id,children:ai(a,e)},`commercial-order-presentation-${e.uid}-${a.id}`))]})]})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:Number(e.stock_available||0).toFixed(2)})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:e.price_unit,onFocus:Qn,onChange:a=>Ut(e.uid,"price_unit",Jn(a))})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:sa(Number(e.price_unit||0),Le).subtotal.toFixed(2),readOnly:!0})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0.01",className:"form-control",value:e.quantity,onFocus:Qn,onChange:a=>Ut(e.uid,"quantity",Jn(a))})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.discount_amount||0).toFixed(2),readOnly:!0})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.total||0).toFixed(2),readOnly:!0})}),n.jsx("td",{className:"text-end",children:n.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>or(e.uid),children:n.jsx("i",{className:"mdi mdi-close"})})})]},e.uid))}),n.jsxs("tfoot",{children:[n.jsxs("tr",{children:[n.jsx("th",{colSpan:"12",className:"text-end",children:"Sub total"}),n.jsx("th",{children:zt.toFixed(2)}),n.jsx("th",{})]}),n.jsxs("tr",{children:[n.jsx("th",{colSpan:"12",className:"text-end",children:"Descuento global"}),n.jsx("th",{children:"0.00"}),n.jsx("th",{})]}),n.jsxs("tr",{children:[n.jsx("th",{colSpan:"12",className:"text-end",children:"Total"}),n.jsx("th",{children:qt.total.toFixed(2)}),n.jsx("th",{})]})]})]})})]}),n.jsxs("section",{className:"commercial-order-form-section mb-0",children:[n.jsxs("div",{className:"commercial-order-section-title",children:[n.jsx("i",{className:"mdi mdi-note-text"}),n.jsx("span",{children:"Observaciones"})]}),n.jsx(Bn,{eRef:pt,label:"Observaciones",rows:3})]})]})}),n.jsx(Xe,{modalRef:_,title:"Ingresar pedido multivende",size:"lg",btnSubmitText:"Registrar",onSubmit:tr,children:n.jsx("div",{className:"commercial-order-multivende-form",children:n.jsxs("section",{className:"commercial-order-form-section",children:[n.jsxs("div",{className:"commercial-order-section-title",children:[n.jsx("i",{className:"mdi mdi-file-document-plus-outline"}),n.jsx("span",{children:"General"})]}),n.jsxs("div",{className:"mb-2",children:[n.jsxs("label",{className:"form-label",children:["Ingrese el ",n.jsx("strong",{children:"CHECK OUT ID"})]}),n.jsx("input",{ref:E,name:"external_checkout_id",className:"form-control",autoComplete:"off"})]})]})})}),n.jsx(Xe,{modalRef:B,title:"Mantenedor motivo retraso entrega",size:"lg",hideFooter:!0,onSubmit:e=>{e.preventDefault(),rr()},children:n.jsxs("div",{className:"commercial-order-delay-maintainer",children:[n.jsxs("div",{className:"commercial-order-delay-actions",children:[n.jsxs("button",{type:"button",className:"btn btn-sm btn-light","data-bs-dismiss":"modal",children:[n.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]}),n.jsxs("button",{type:"submit",className:"btn btn-sm btn-outline-primary",children:[n.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]})]}),n.jsx("input",{ref:T,type:"hidden"}),n.jsxs("div",{className:"row",children:[n.jsxs("div",{className:"col-12 mb-3",children:[n.jsx("label",{className:"form-label",children:"Descripcion:"}),n.jsx("input",{ref:R,className:"form-control",autoComplete:"off"})]}),n.jsxs("div",{className:"col-12 mb-3",children:[n.jsx("label",{className:"form-label",children:"Estado:"}),n.jsxs("select",{ref:G,className:"form-control",defaultValue:"1",children:[n.jsx("option",{value:"1",children:"Activo"}),n.jsx("option",{value:"0",children:"Inactivo"})]})]})]}),n.jsx("hr",{}),n.jsxs("div",{className:"commercial-order-delay-filter",children:[n.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),n.jsx("input",{className:"form-control form-control-sm",value:Mt,onChange:e=>un(e.target.value)})]}),n.jsx("div",{className:"table-responsive commercial-order-delay-table",children:n.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[n.jsx("thead",{children:n.jsxs("tr",{children:[n.jsx("th",{className:"text-center",children:"Acciones"}),n.jsx("th",{className:"text-center",children:"Estado"}),n.jsx("th",{children:"Motivo"}),n.jsx("th",{children:"Fecha registro"}),n.jsx("th",{children:"Usuario registro"})]})}),n.jsxs("tbody",{children:[Lt&&n.jsx("tr",{children:n.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"Cargando motivos..."})}),!Lt&&Yt.length===0&&n.jsx("tr",{children:n.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"No existen elementos"})}),!Lt&&Yt.map(e=>n.jsxs("tr",{children:[n.jsx("td",{className:"text-center",children:n.jsx("button",{type:"button",className:"btn btn-xs btn-outline-info",title:"Editar motivo de retraso",onClick:()=>ar(e),children:n.jsx("i",{className:"mdi mdi-pencil"})})}),n.jsx("td",{className:"text-center",children:n.jsx("span",{className:ua(e.status?"billed":"cancelled"),children:e.status?"Activo":"Inactivo"})}),n.jsx("td",{children:e.description}),n.jsx("td",{children:ea(e.created_at)}),n.jsx("td",{children:Qt(e.creator)})]},`delivery-delay-reason-${e.id}`))]})]})}),n.jsxs("div",{className:"commercial-order-delay-summary",children:[Yt.length," elementos (Pagina 1 de 1)"]})]})}),n.jsx(Xe,{modalRef:re,title:"Tracking del pedido",size:"lg",hideButtonSubmit:!0,children:n.jsx("div",{className:"table-responsive",children:n.jsxs("table",{className:"table table-sm align-middle mb-0",children:[n.jsx("thead",{children:n.jsxs("tr",{children:[n.jsx("th",{children:"Fecha"}),n.jsx("th",{children:"Estado"})]})}),n.jsxs("tbody",{children:[En.length===0&&n.jsx("tr",{children:n.jsx("td",{colSpan:"2",className:"text-muted text-center py-3",children:"Sin eventos registrados."})}),En.map((e,a)=>n.jsxs("tr",{children:[n.jsx("td",{children:new Date(e.date).toLocaleString("es-PE")}),n.jsx("td",{children:e.status})]},`commercial-order-tracking-${a}`))]})]})})}),n.jsx(Xe,{modalRef:X,title:"Evidencia de entrega",size:"lg",btnSubmitText:"Registrar",onSubmit:Qa,children:n.jsxs("div",{className:"row",children:[n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Recibido por"}),n.jsx("input",{className:"form-control",value:w.recipient_name,onChange:e=>ce("recipient_name",e.target.value)})]}),n.jsxs("div",{className:"col-md-3 mb-3",children:[n.jsx("label",{className:"form-label",children:"Tipo doc."}),n.jsxs("select",{className:"form-control",value:w.recipient_document_type,onChange:e=>ce("recipient_document_type",e.target.value),children:[n.jsx("option",{value:"DNI",children:"DNI"}),n.jsx("option",{value:"RUC",children:"RUC"}),n.jsx("option",{value:"CE",children:"CE"}),n.jsx("option",{value:"OTRO",children:"Otro"})]})]}),n.jsxs("div",{className:"col-md-3 mb-3",children:[n.jsx("label",{className:"form-label",children:"Numero"}),n.jsx("input",{className:"form-control",value:w.recipient_document_number,onChange:e=>ce("recipient_document_number",e.target.value)})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Telefono"}),n.jsx("input",{className:"form-control",value:w.recipient_phone,onChange:e=>ce("recipient_phone",e.target.value)})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Fecha y hora entrega"}),n.jsx("input",{type:"datetime-local",className:"form-control",value:w.delivered_at,onChange:e=>ce("delivered_at",e.target.value)})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Foto / evidencia"}),n.jsx("input",{ref:D,className:"form-control",type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",capture:"environment",onChange:Ja})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Latitud"}),n.jsx("input",{className:"form-control",value:w.latitude,onChange:e=>ce("latitude",e.target.value)})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Longitud"}),n.jsx("input",{className:"form-control",value:w.longitude,onChange:e=>ce("longitude",e.target.value)})]}),n.jsxs("div",{className:"col-12 mb-3",children:[n.jsx("label",{className:"form-label",children:"Observaciones"}),n.jsx("textarea",{className:"form-control",rows:"3",value:w.evidence_notes,onChange:e=>ce("evidence_notes",e.target.value)})]}),n.jsx("div",{className:"col-12",children:n.jsx("div",{className:"border rounded p-3",children:he?n.jsx("img",{src:he,alt:"Evidencia de entrega",className:"img-fluid rounded border bg-light",style:{maxHeight:360,width:"100%",objectFit:"contain"}}):w.evidence_url?n.jsx("a",{href:w.evidence_url,target:"_blank",rel:"noreferrer",children:"Abrir evidencia registrada"}):n.jsx("div",{className:"text-muted py-4 text-center",children:"Sin evidencia registrada"})})})]})})]})};xr((t,r)=>{!r.can("orders")&&!r.hasRole("Admin")&&(location.href="/admin/"),gr(t).render(n.jsx(Nr,{...r,title:r.pageTitle||"Pedidos comerciales",children:n.jsx(bi,{...r})}))});
