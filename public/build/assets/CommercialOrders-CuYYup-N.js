var Cr=Object.defineProperty;var wr=(t,r,s)=>r in t?Cr(t,r,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[r]=s;var Ua=(t,r,s)=>wr(t,typeof r!="symbol"?r+"":r,s);import{C as Rr,c as kr,j as a,r as o,S as V,G as $r}from"./CreateReactScript-BQEmHc8B.js";import{L as Fr,G as Sr,M as Dr}from"./esm-XAA1TWCO.js";import{B as Er}from"./Base-BZJCfbcl.js";import{T as ea}from"./Table-DsvFLxnp.js";import{M as at}from"./Modal-BpHRFSoz.js";import{R as Tr}from"./ReactAppend-CmCssPze.js";import{a as Oe,S as Pe}from"./SetSelectValue-CKeZntsZ.js";import{S as Ir}from"./SelectFormGroup-BeLjaap0.js";import{T as qa}from"./TextareaFormGroup-cWhYtz_1.js";import{B as Ar}from"./BillingDocumentsRest-WW_N3DRe.js";import{C as hn}from"./CommercialOrdersRest-DArLGxwY.js";import{B as Or}from"./BasicRest-BJmaHB2C.js";import{R as Pr}from"./ReferralGuidesRest-CIzM-URQ.js";import{o as Nt,b as Ct}from"./magistralesRecordPdf-C-x5GdgT.js";import{t as za,i as Ya,j as bn,k as Wa}from"./statusLabels-DafAwaKR.js";import"./tippy-react.esm-255dCUw_.js";import"./permissionScope-Be8AULz2.js";import"./ubigeoInei-D0FnAslC.js";class Mr extends Or{constructor(){super(...arguments);Ua(this,"path","admin/delivery-delay-reasons")}}const B=new hn,ne=new Ar,Ha=new Mr,Ka=new Pr,Lr=["client_kind","=","regular"],Br=[1,2,3,4,5],Gr=["EFECTIVO [CONTADO]","TRANSFERENCIA [CONTADO]","YAPE [CONTADO]","PLIN [CONTADO]","TARJETA [CONTADO]","TRANSFERENCIA [CREDITO]"],Ja="ecomsur_oms",wt=[{id:"orders",label:"Pedidos",kind:"orders"},{id:"issued",label:"Facturas Emitidas",kind:"billing"},{id:"cancelled",label:"Facturas Anuladas",kind:"billing"},{id:"credit-notes",label:"Notas de Credito",kind:"billing"},{id:"visitors",label:"Pedidos - Visitadores",kind:"static"},{id:"visitors-legacy",label:"Pedidos - Visitadores Legacy",kind:"static"},{id:"platforms",label:"Plataformas",kind:"static"},{id:"multivende",label:"Pedidos - Multivende",kind:"multivende"}],Qa={visitors:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},"visitors-legacy":{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["Todos","ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},platforms:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]}},U=(t,{variant:r,title:s,icon:l,onClick:p})=>{const v=$('<button type="button"></button>').addClass(`btn btn-xs btn-soft-${r} commercial-order-action-btn`).attr("title",s).attr("aria-label",s).append($("<i></i>").addClass(l)).on("click",m=>{m.preventDefault(),m.stopPropagation(),p()});t.append(v)},xn=t=>`commercial-order-status-badge commercial-order-status-${`${t??"empty"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-")||"empty"}`,Rt=(t,r,s)=>{t.addClass("commercial-order-status-cell"),Tr(t,a.jsx("span",{className:xn(r),children:s(r)}))},nt=()=>({uid:crypto.randomUUID(),article_id:"",article_label:"",article_code:"",article_lot:"",article_name:"",article_unit:"",article_laboratory:"",article_principle:"",presentations:[],presentation_id:"",presentation_units:1,stock_available:0,reserved_quantity:0,price_unit:0,quantity:1,gross_total:0,discount_type:"none",discount_value:0,discount_amount:0,total:0,price_source:"fallback",price_list_code:""}),Vr=t=>{if(!t)return"";const r=(t.name??"").toString().trim().split(" ")[0]??"",s=(t.lastname??"").toString().trim().split(" ")[0]??"",l=`${r} ${s}`.trim(),p=(t.username??"").toString().trim();return l&&p?`${l} (@${p})`:l||(p?`@${p}`:"")},Ur=t=>{if(!t)return"-";const r=(t.fullname??"").toString().trim();return r||`${t.name??""} ${t.lastname??""}`.trim()||(t.username??"").toString().trim()||"-"},ta=t=>t&&((t.username??"").toString().trim()||(t.fullname??"").toString().trim()||`${t.name??""} ${t.lastname??""}`.trim())||"-",rt=t=>Number(Number(t||0).toFixed(2)),T=t=>$("<div>").text(t??"").html(),Me=t=>{const r=Number(Number(t||0).toFixed(3));return Number.isInteger(r)?`${r}`:`${r}`.replace(/\.?0+$/,"")},sa=t=>(t==null?void 0:t.price_source)==="manual",Xa=(t,r,s=!1)=>{const l=Number((t==null?void 0:t.price_unit)||0),p=Number(r==null?void 0:r.price_unit);return!s&&sa(t)||!Number.isFinite(p)||!s&&p<=0&&l>0?l:p},Za=(t,r,s=!1)=>!s&&sa(t)?"manual":(r==null?void 0:r.source)||(t==null?void 0:t.price_source)||"fallback",qr=t=>{const r=`${t??""}`.replace(",",".").replace(/[^\d.]/g,"");if(!r)return"";const[s,...l]=r.split("."),p=s.replace(/^0+(?=\d)/,"")||(s||l.length?"0":""),v=l.length?`.${l.join("")}`:"";return`${p}${v}`},en=t=>{const r=qr(t.target.value);return t.target.value!==r&&(t.target.value=r),Number(r||0)},tn=t=>{Number(t.target.value||0)===0&&t.target.select()},zr=(t,r,s)=>{const l=rt(t),p=Number(s||0);return!Number.isFinite(p)||p<=0||l<=0?0:r==="percent"?Math.min(l,rt(l*Math.min(p,100)/100)):r==="amount"?Math.min(l,rt(p)):0},je=t=>{const r=Number(t.quantity||0),s=Number(t.price_unit||0),l=Number.isFinite(r*s)?rt(r*s):0,p=zr(l,t.discount_type,t.discount_value);return{...t,discount_type:t.discount_type||"none",discount_value:t.discount_type==="none"?0:Number(t.discount_value||0),gross_total:l,discount_amount:p,total:rt(Math.max(0,l-p))}},Dt=t=>{const r=`${t??""}`.trim().toLowerCase();return r==="boleta"?"Boleta":["nota de pedido","nota_pedido","note_order"].includes(r)?"Nota de pedido":"Factura"},Yr=t=>(t==null?void 0:t.billing_documents)??(t==null?void 0:t.billingDocuments)??[],Ne=t=>Yr(t)[0]??null,be=t=>t&&([t==null?void 0:t.series,t==null?void 0:t.sequence].filter(Boolean).join("-")||(t==null?void 0:t.code))||"",Ft=t=>!!(`${(t==null?void 0:t.series)??""}`.trim()&&`${(t==null?void 0:t.sequence)??""}`.trim()),an=t=>{const r=Ne(t);return be(r)||(t==null?void 0:t.referral_guide)||(t==null?void 0:t.guide_number)||(t==null?void 0:t.purchase_order)||"-"},Wr=t=>{var r,s,l;return((r=t==null?void 0:t.client)==null?void 0:r.full_name)??((s=t==null?void 0:t.eventual_client)==null?void 0:s.business_name)??((l=t==null?void 0:t.eventualClient)==null?void 0:l.business_name)??"-"},Hr=t=>{var r,s,l;return((r=t==null?void 0:t.commercial_order)==null?void 0:r.code)??((s=t==null?void 0:t.commercialOrder)==null?void 0:s.code)??((l=t==null?void 0:t.metadata)==null?void 0:l.source_code)??"-"},aa=t=>{var r;return Dt(((r=Ne(t))==null?void 0:r.document_type)??(t==null?void 0:t.document_type))},nn=t=>{const r=(t==null?void 0:t.client)??(t==null?void 0:t.eventual_client)??(t==null?void 0:t.eventualClient)??null,s=`${(r==null?void 0:r.document_number)??""}`.trim(),l=`${(r==null?void 0:r.full_name)??(r==null?void 0:r.business_name)??""}`.trim();return[s,l].filter(Boolean).join(" | ")||"-"},Kr=t=>{const r=`${(t==null?void 0:t.payment_method)??""}`.trim(),s=`${(t==null?void 0:t.payment_condition)??""}`.trim();return!r&&!s?"-":!s||r.includes("[")?r||"-":`${r||"-"} [${s.toUpperCase()}]`},rn=t=>{if(!t)return"-";const r=new Date(t);return Number.isNaN(r.getTime())?`${t}`:r.toLocaleString("es-PE",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})},ra=()=>new Date().toISOString().slice(0,10).replaceAll("-","/"),ie=()=>{const t=ra();return`${t} - ${t}`},sn=(t,r)=>new Promise((s,l)=>{const p=document.getElementById(t);if(p){p.dataset.loaded==="true"?s():p.addEventListener("load",s,{once:!0});return}const v=document.createElement("script");v.id=t,v.src=r,v.async=!0,v.onload=()=>{v.dataset.loaded="true",s()},v.onerror=l,document.body.appendChild(v)}),Jr=(t,r)=>{if(document.getElementById(t))return;const s=document.createElement("link");s.id=t,s.rel="stylesheet",s.href=r,document.head.appendChild(s)},Qr=async()=>{var t,r;Jr("commercial-order-daterangepicker-css","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/css/daterangepicker.css"),window.moment||await sn("commercial-order-moment-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/moment.min.js"),(r=(t=window.$)==null?void 0:t.fn)!=null&&r.daterangepicker||await sn("commercial-order-daterangepicker-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/daterangepicker.js")},gn=()=>({orders:{businessId:"",dateRange:ie(),laboratoryId:"",dispatchStatus:""},issued:{businessId:"",dateRange:ie()},cancelled:{businessId:"",dateRange:ie()},"credit-notes":{businessId:"",dateRange:ie()},visitors:{visitor:"ALICIA ASTO ASTO",dateRange:ie()},"visitors-legacy":{visitor:"",dateRange:ie()},platforms:{businessId:"",dateRange:ie()},multivende:{dateRange:ie(),orderVtex:""}}),Xr=()=>{const t=gn();return{...t,orders:{...t.orders,dateRange:""}}},ln=t=>{const r=`${t??""}`.trim();return r?r.replaceAll("/","-").slice(0,10):""},vn=t=>{const[r="",s=""]=`${t??""}`.split(/\s+-\s+/);return{start:ln(r),end:ln(s||r)}},Tt=t=>t.filter(Boolean).reduce((r,s)=>r?[r,"and",s]:s,null),la=(t,r="created_at")=>{const{start:s,end:l}=vn(t);return Tt([s?[r,">=",`${s} 00:00:00`]:null,l?[r,"<=",`${l} 23:59:59`]:null])},Zr=t=>{const r=["document_type","<>","Nota de credito"];return t==="issued"?[[["local_status","=","sent"],"or",["local_status","=","accepted"],"or",["local_status","=","observed"],"or",["local_status","=","rejected"]],"and",r]:t==="cancelled"?[["local_status","=","cancelled"],"and",r]:t==="credit-notes"?["document_type","=","Nota de credito"]:null},ei=(t,r)=>Tt([["source_type","=","commercial_order"],Zr(t),r!=null&&r.businessId?["business_id","=",Number(r.businessId)]:null,la(r==null?void 0:r.dateRange,"created_at")]),ti=t=>Tt([t!=null&&t.businessId?["business_id","=",Number(t.businessId)]:null,t!=null&&t.dispatchStatus?["dispatch_status","=",t.dispatchStatus]:null,la(t==null?void 0:t.dateRange,"created_at")]),ai=(t,r)=>{const s=`${(t==null?void 0:t.orderVtex)??""}`.trim();return Tt([["external_source","=",r],la(t==null?void 0:t.dateRange,"created_at"),s?[["external_order_id","contains",s],"or",["external_checkout_id","contains",s]]:null])},na=t=>{const r=(t==null?void 0:t.client)??(t==null?void 0:t.eventualClient)??(t==null?void 0:t.eventual_client)??null,s=`${(r==null?void 0:r.document_number)??""}`.trim(),l=`${(r==null?void 0:r.full_name)??(r==null?void 0:r.business_name)??""}`.trim();return[s,l].filter(Boolean).join(" | ")||"-"},kt=t=>`${t??""}`.toUpperCase()==="USD"?"Dolares":"Soles",on=t=>(t==null?void 0:t.external_reference)||(t==null?void 0:t.external_id)||(t==null?void 0:t.external_status)||"-",ni=t=>{var r,s;return((r=t==null?void 0:t.referenceDocument)==null?void 0:r.code)??((s=t==null?void 0:t.reference_document)==null?void 0:s.code)??"-"},ri=t=>{var r,s;return(t==null?void 0:t.cancel_reason)??((r=t==null?void 0:t.metadata)==null?void 0:r.cancel_reason)??((s=t==null?void 0:t.metadata)==null?void 0:s.reason)??"-"},ii=t=>{var r,s;return((r=Ne(t))==null?void 0:r.external_status)??((s=Ne(t))==null?void 0:s.external_reference)??"-"},si=t=>(t==null?void 0:t.external_order_id)||(t==null?void 0:t.external_checkout_id)||"-",_n=t=>{var p;const r=ia(t);if(r!=null&&r.delivered_at)return r.delivered_at;const l=((t==null?void 0:t.dispatchAssignments)??(t==null?void 0:t.dispatch_assignments)??[]).find(v=>{var m;return(m=v==null?void 0:v.dispatch)==null?void 0:m.delivered_at});return((p=l==null?void 0:l.dispatch)==null?void 0:p.delivered_at)??""},li=t=>{const r=t!=null&&t.created_at?new Date(t.created_at):null,s=_n(t)||(t==null?void 0:t.updated_at),l=s?new Date(s):null;if(!r||!l||Number.isNaN(r.getTime())||Number.isNaN(l.getTime()))return"-";const p=Math.max(0,Math.round((l-r)/6e4)),v=Math.floor(p/1440),m=Math.floor(p%1440/60);return v>0?`${v}d ${m}h`:m>0?`${m}h ${p%60}m`:`${p}m`},k=(t,r="")=>{if(t==null)return r;if(typeof t=="object")return t.address??t.reference??t.name??t.description??r;const s=`${t}`;return s==="[object Object]"?r:s},oi=t=>`${t??""}`.toUpperCase().includes("CREDITO")?"Credito":"Contado",ci=t=>{const r=`${t??""}`.trim();return r?r.toUpperCase()==="TRANSFERENCIA"?"TRANSFERENCIA [CONTADO]":r:"EFECTIVO [CONTADO]"},di=t=>k(t==null?void 0:t.full_address,k(t==null?void 0:t.address,k(t==null?void 0:t.fiscal_address))),ui=t=>k(t==null?void 0:t.ubigeo,k(t==null?void 0:t.district_ubigeo,k(t==null?void 0:t.inei_ubigeo))),cn=t=>{const r=`${t??""}`.trim(),s=r.match(/^(client|eventual)-(\d+)$/);return s?s[2]:r},dn=t=>{var m,x,R;if(t.loading)return t.text;const r=t.data??{},s=t.text||r.name||"",l=(m=r.branch)==null?void 0:m.name,p=(R=(x=r.branch)==null?void 0:x.business)==null?void 0:R.name,v=$("<span>").text(s);return l&&v.append($("<small>").addClass("text-muted ms-1").text(`- ${l}`)),p&&v.append($("<small>").addClass("text-muted ms-1").text(`(${p})`)),v},re=t=>{if(!(t!=null&&t.current))return;const r=$(t.current);r.empty().val(null),r.trigger(r.data("select2")?"change.select2":"change")},mi=t=>t.article_id?"Unidad base":"Sin presentacion",pi=(t,r)=>{const s=(t==null?void 0:t.name)||"Presentacion",l=Me((t==null?void 0:t.units)||1),p=r!=null&&r.article_unit?` ${r.article_unit}`:" unidad(es) base";return`${s} (${l}${p})`},yn=t=>["Factura","Boleta"].includes(Dt(t)),un=(t,r)=>{const s=Number(t||0);if(!yn(r))return{subtotal:Number(s.toFixed(2)),taxAmount:0,total:Number(s.toFixed(2))};const l=Number((s/1.18).toFixed(2));return{subtotal:l,taxAmount:Number((s-l).toFixed(2)),total:Number(s.toFixed(2))}},fi=(t,r="")=>{const s=new Map;return(t??[]).flatMap(l=>{if(!(l!=null&&l.article_id))return[];const p=`${l.article_id}:${l.warehouse_id||r||""}`,v=Number(l.quantity||0),m=Number(l.presentation_units||1)||1,x=Number((v*m).toFixed(3)),R=Number(l.stock_available||0),q=Number(s.get(p)||0),I=Math.max(0,R-q),F=Math.min(x,I),A=Math.max(0,x-F);return s.set(p,q+F),A<=1e-4?[]:[{article:l.article_name||l.article_label||l.article_code||"Articulo",quantity:x,lineQuantity:v,presentationUnits:m,available:I,shortage:A}]})},St=t=>(t==null?void 0:t.referral_guides)??(t==null?void 0:t.referralGuides)??[],jn=t=>(t==null?void 0:t.external_reference)||[t==null?void 0:t.series,t==null?void 0:t.sequence].filter(Boolean).join("-")||(t==null?void 0:t.code)||"-",hi=t=>t&&!["accepted","cancelled"].includes(t.guide_status),bi=t=>(t==null?void 0:t.delivery_evidences)??(t==null?void 0:t.deliveryEvidences)??[],ia=t=>bi(t)[0]??null,xi=t=>(t==null?void 0:t.tracking_events)??(t==null?void 0:t.trackingEvents)??[],mn=t=>{const r=`${t??""}`.trim();return r.startsWith("blob:")||r.startsWith("data:image/")||/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(r)||r.includes("/delivery-evidence-media/")},pn=()=>{const t=new Date;return t.setMinutes(t.getMinutes()-t.getTimezoneOffset()),t.toISOString().slice(0,16)},$t={lat:-12.046374,lng:-77.042793},se=t=>{const r=Number(t);return Number.isFinite(r)?r:null},Et=t=>{const r=se(t);return r===null?"":r.toFixed(7)},le=t=>se(t==null?void 0:t.lat)!==null&&se(t==null?void 0:t.lng)!==null,gi=({modalRef:t,position:r,searchText:s,onPositionChange:l,onSearchTextChange:p,onAddressSelected:v,googleMapsApiKey:m,disabled:x=!1})=>{const R=o.useRef(),[q,I]=o.useState(!1),[F,A]=o.useState(""),[Le,ee]=o.useState([]),z=le(r)?{lat:se(r.lat),lng:se(r.lng)}:$t,G=(f,S=17)=>{const Y=se(f==null?void 0:f.lat),W=se(f==null?void 0:f.lng);Y===null||W===null||!R.current||(R.current.setCenter({lat:Y,lng:W}),R.current.setZoom(S))},Ce=f=>{x||(l(f),G(f))};o.useEffect(()=>{if(le(r)){G(z);return}G($t,13)},[r==null?void 0:r.lat,r==null?void 0:r.lng]),o.useEffect(()=>{const f=t==null?void 0:t.current;if(!f)return;const S=()=>{setTimeout(()=>{le(r)?G(z):G($t,13)},180)};return $(f).on("shown.bs.modal",S),()=>$(f).off("shown.bs.modal",S)},[t,r==null?void 0:r.lat,r==null?void 0:r.lng]);const we=async()=>{var S,Y;if(x)return;const f=`${s??""}`.trim();if(!f){ee([]),A("Escribe una direccion para buscar.");return}if(!((Y=(S=window.google)==null?void 0:S.maps)!=null&&Y.Geocoder)){A("Google Maps aun no termino de cargar.");return}I(!0),A("");try{new window.google.maps.Geocoder().geocode({address:`${f}, Peru`,componentRestrictions:{country:"PE"},region:"PE"},(oe,H)=>{if(I(!1),H!=="OK"||!Array.isArray(oe)||oe.length===0){ee([]),A("Sin resultados. Puedes marcar el punto manualmente en el mapa.");return}ee(oe.slice(0,5).map(te=>({place_id:te.place_id,display_name:te.formatted_address,lat:te.geometry.location.lat(),lng:te.geometry.location.lng()})))})}catch(W){I(!1),A(`${W.message}. Puedes marcar el punto manualmente en el mapa.`),ee([])}},It=f=>{if(x)return;const S={lat:se(f.lat),lng:se(f.lng)};l(S),p(f.display_name??""),v(f.display_name??""),G(S),ee([])};return a.jsxs("div",{className:"commercial-order-map-picker",children:[a.jsxs("div",{className:"commercial-order-map-search",children:[a.jsxs("div",{children:[a.jsx("label",{className:"form-label",children:"Buscar direccion en mapa"}),a.jsxs("div",{className:"input-group",children:[a.jsx("input",{type:"text",className:"form-control",value:s,disabled:x,onChange:f=>p(f.target.value),onKeyDown:f=>{f.key==="Enter"&&(f.preventDefault(),we())},placeholder:"Ej. Av. Javier Prado 123, San Isidro"}),a.jsx("button",{type:"button",className:"btn btn-outline-primary",onClick:we,disabled:q||x,children:q?"Buscando...":"Buscar"})]})]}),a.jsxs("div",{className:"commercial-order-map-coordinates",children:[a.jsx("label",{className:"form-label",children:"Coordenadas"}),a.jsxs("div",{className:"commercial-order-map-coordinate-values",children:[a.jsx("span",{children:Et(r==null?void 0:r.lat)||"-"}),a.jsx("span",{children:Et(r==null?void 0:r.lng)||"-"})]})]})]}),Le.length>0&&a.jsx("div",{className:"commercial-order-map-results",children:Le.map(f=>a.jsx("button",{type:"button",className:"commercial-order-map-result",disabled:x,onClick:()=>It(f),children:f.display_name},`${f.place_id}-${f.lat}-${f.lng}`))}),F&&a.jsx("small",{className:"text-muted d-block mt-1",children:F}),a.jsx(Fr,{googleMapsApiKey:m,language:"es",region:"PE",onError:()=>A("No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio."),children:a.jsx(Sr,{mapContainerClassName:"commercial-order-map-canvas",center:z,zoom:le(r)?17:13,options:{clickableIcons:!x,fullscreenControl:!0,gestureHandling:x?"none":"greedy",mapTypeControl:!0,scrollwheel:!x,streetViewControl:!1},onLoad:f=>{R.current=f,setTimeout(()=>{le(r)?G(z):G($t,13)},120)},onClick:f=>{if(x)return;const S={lat:f.latLng.lat(),lng:f.latLng.lng()};Ce(S)},children:le(r)&&a.jsx(Dr,{position:z,draggable:!x,onDragEnd:f=>Ce({lat:f.latLng.lat(),lng:f.latLng.lng()})})})}),a.jsx("small",{className:"text-muted d-block mt-2",children:"Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega."})]})},vi=t=>{const r=`${$r.GMAPS_API_KEY??""}`.trim();return r?a.jsx(gi,{...t,googleMapsApiKey:r}):a.jsx("div",{className:"commercial-order-map-picker",children:a.jsx("div",{className:"commercial-order-map-empty",children:"Configura Google Maps API Key en Sistemas > Datos generales > Integraciones para habilitar el mapa."})})},_i=t=>!t||t.status===null||`${t.order_status??""}`=="cancelled"?!1:`${t.dispatch_status??"pending"}`=="pending",yi=t=>!t||t.status===null||t.status===!1||t.status===0?!1:!["draft","cancelled"].includes(`${t.order_status??""}`),Nn=t=>{if(!t)return!1;const r=`${t.local_status??""}`;return["accepted","observed","cancelled"].includes(r)||!!t.external_id},ji=t=>{if(!t)return!1;const r=`${t.local_status??""}`;return["accepted","sent","observed"].includes(r)||!!t.external_id},fn=t=>{if(!(t!=null&&t.id))return"";const r=Ne(t);return ji(r)||`${t.billing_status??""}`=="billed"?`Este pedido ya tiene comprobante ${be(r)||(r==null?void 0:r.code)||"emitido"}. No se pueden modificar datos ni productos despues de emitir.`:""},Ni=t=>{const r=Ne(t);return r?Nn(r)?{icon:"mdi mdi-file-document-check-outline",title:`Descargar PDF del comprobante ${be(r)||r.code}`}:Ft(r)?{icon:"mdi mdi-printer",title:`Emitir o imprimir comprobante ${be(r)||r.code}`}:{icon:"mdi mdi-send",title:`Emitir comprobante ${be(r)||r.code}`}:{icon:"mdi mdi-file-send-outline",title:"Generar comprobante de venta para este pedido"}},Ci=t=>{if(!t)return[];const r=xi(t).map(m=>({date:m.happened_at??m.created_at,status:[m.title,m.description].filter(Boolean).join(" - ")})),s=[{date:t.created_at,status:"La orden ingreso en el sistema"}];t.approved_at&&["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)?s.push({date:t.approved_at,status:"La orden paso a preparacion"}):t.approved_at&&t.order_status==="confirmed"?s.push({date:t.approved_at,status:"La orden fue confirmada"}):["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)&&s.push({date:t.updated_at,status:"La orden paso a preparacion"});const l=(t.dispatch_assignments??t.dispatchAssignments??[]).filter(m=>(m==null?void 0:m.status)!==!1&&(m==null?void 0:m.status)!==0&&(m==null?void 0:m.dispatch)).sort((m,x)=>{var R,q,I,F;return new Date(((R=m==null?void 0:m.dispatch)==null?void 0:R.departed_at)||((q=m==null?void 0:m.dispatch)==null?void 0:q.scheduled_date)||0)-new Date(((I=x==null?void 0:x.dispatch)==null?void 0:I.departed_at)||((F=x==null?void 0:x.dispatch)==null?void 0:F.scheduled_date)||0)}),p=l.find(m=>{var x;return["in_route","delivered","closed"].includes((x=m==null?void 0:m.dispatch)==null?void 0:x.dispatch_status)});p?(s.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:`Manifiesto ${p.dispatch.manifest_code||p.dispatch.code||""}`.trim()}),s.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:"El pedido salio en ruta"})):t.dispatch_status==="in_route"&&s.push({date:t.updated_at,status:"El pedido salio en ruta"}),(t.dispatch_status==="dispatched"||l.some(m=>{var x;return((x=m==null?void 0:m.dispatch)==null?void 0:x.dispatch_status)==="dispatched"}))&&s.push({date:t.updated_at,status:"El pedido paso a despacho"}),St(t).forEach(m=>{s.push({date:m.issue_date??m.created_at??t.updated_at,status:`Guia de remision ${jn(m)} - ${bn(m.guide_status)}`})});const v=l.find(m=>{var x;return["delivered","closed"].includes((x=m==null?void 0:m.dispatch)==null?void 0:x.dispatch_status)});return v?s.push({date:v.dispatch.delivered_at??v.dispatch.updated_at??v.dispatch.created_at,status:"El pedido fue entregado"}):t.dispatch_status==="delivered"&&s.push({date:t.updated_at,status:"El pedido fue entregado"}),(t.order_status==="cancelled"||t.dispatch_status==="cancelled")&&s.push({date:t.updated_at,status:"El pedido fue cancelado"}),[...r,...s].filter(m=>m.date).sort((m,x)=>new Date(m.date)-new Date(x.date))},wi=({title:t,config:r})=>{const s=(r==null?void 0:r.pageSize)??20;return a.jsx("div",{className:"row",children:a.jsx("div",{className:"col-12",children:a.jsxs("div",{className:"card",children:[a.jsx("div",{className:"card-header",children:t}),a.jsxs("div",{className:"card-body",children:[a.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[a.jsxs("div",{className:"d-flex align-items-center gap-2",children:[a.jsx("label",{className:"form-label mb-0",children:"Elementos :"}),a.jsx("select",{className:"form-select form-select-sm commercial-order-page-size",defaultValue:s,children:[10,20,25,50].map(l=>a.jsx("option",{value:l,children:l},`commercial-list-size-${l}`))})]}),a.jsxs("div",{className:"d-flex align-items-center gap-2",children:[a.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),a.jsx("input",{className:"form-control form-control-sm commercial-order-list-search"})]})]}),((r==null?void 0:r.exports)??[]).length>0&&a.jsx("div",{className:"d-flex flex-wrap gap-1 mb-2",children:r.exports.map(l=>a.jsx("button",{type:"button",className:"btn btn-sm btn-light",children:l},`commercial-list-export-${l}`))}),a.jsx("div",{className:"table-responsive commercial-order-legacy-table",children:a.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[a.jsx("thead",{children:a.jsx("tr",{children:((r==null?void 0:r.headers)??[]).map(l=>a.jsx("th",{children:l},`commercial-list-header-${l}`))})}),a.jsx("tbody",{children:a.jsx("tr",{children:a.jsx("td",{colSpan:((r==null?void 0:r.headers)??[]).length||1,className:"text-muted",children:"No existen elementos"})})})]})}),a.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2",children:[a.jsx("span",{className:"text-muted",children:"No hay elementos a mostrar"}),a.jsxs("div",{className:"d-flex align-items-center gap-2 text-muted",children:[a.jsx("span",{children:"Anterior"}),a.jsx("button",{type:"button",className:"btn btn-sm btn-light active",children:"1"}),a.jsx("span",{children:"Siguiente"})]})]})]})]})})})},Ri=({requiredPermission:t="orders",externalSource:r=null,pageTitle:s="Pedidos comerciales"})=>{var Ma;B.externalSource=null;const l=o.useRef(),p=o.useRef(),v=o.useRef(),m=o.useRef(),x=o.useRef(),R=o.useRef(),q=o.useRef(),I=o.useRef(),F=o.useRef(),A=o.useRef(),Le=o.useRef(),ee=o.useRef(),z=o.useRef(),G=o.useRef(),Ce=o.useRef(),we=o.useRef(),It=o.useRef(),f=o.useRef(),S=o.useRef(),Y=o.useRef(),W=o.useRef(),oe=o.useRef(),H=o.useRef(),te=o.useRef(),Cn=o.useRef(),it=o.useRef(),st=o.useRef(),Be=o.useRef(),lt=o.useRef(),ot=o.useRef(),ct=o.useRef(),dt=o.useRef(),ut=o.useRef(),mt=o.useRef(),pt=o.useRef(),ft=o.useRef(),wn=o.useRef(),K=o.useRef(),Re=o.useRef(),ce=o.useRef(),ke=o.useRef(),$e=o.useRef(),ht=o.useRef(),At=o.useRef({}),[Rn,kn]=o.useState(!1),[Fe,oa]=o.useState(""),[J,bt]=o.useState(""),[Q,xt]=o.useState(""),[Se,Ot]=o.useState(""),[De,Pt]=o.useState(""),[X,Ge]=o.useState(""),[$n,xe]=o.useState(""),[Mt,Lt]=o.useState({lat:"",lng:""}),[Fn,gt]=o.useState(""),[Sn,ca]=o.useState([]),[Ve,vt]=o.useState([]),[ki,Ee]=o.useState([]),[ae,Z]=o.useState([nt()]),[Te,da]=o.useState("Factura"),[de,Bt]=o.useState(null),[ua,Dn]=o.useState(null),[Ie,En]=o.useState(null),[ma,Gt]=o.useState(null),[ge,Vt]=o.useState(""),[Ut,Tn]=o.useState([]),[qt,pa]=o.useState(""),[zt,fa]=o.useState(!1),[C,In]=o.useState(r?"multivende":"orders"),[An,On]=o.useState([]),[Pn,Mn]=o.useState([]),[ha,Ln]=o.useState(gn()),[Ue,Bn]=o.useState(Xr()),[_t,Gn]=o.useState(""),[w,Yt]=o.useState({recipient_name:"",recipient_document_type:"DNI",recipient_document_number:"",recipient_phone:"",delivered_at:pn(),evidence_notes:"",evidence_url:"",latitude:"",longitude:""}),Vn=o.useMemo(()=>{const e=new hn;return e.externalSource=r||Ja,e},[r]),yt=wt.find(e=>e.id===C)??wt[0],qe=ha[C]??{},ba=Ue[C]??{},Un=o.useMemo(()=>ti(Ue.orders),[Ue.orders]),qn=o.useMemo(()=>ei(C,ba),[C,ba]),zn=o.useMemo(()=>ai(Ue.multivende,r||Ja),[Ue.multivende,r]),Yn=o.useMemo(()=>{var n;const e=new URLSearchParams;return Fe&&e.append("business_id",Fe),J&&e.append("business_branch_id",J),Q&&e.append("warehouse_id",Q),Se&&e.append("client_id",Se),De&&e.append("eventual_client_id",De),X&&e.append("client_distribution_network_id",X),(n=H.current)!=null&&n.value&&e.append("issue_date",H.current.value),`/api/admin/commercial-orders/articles?${e.toString()}`},[Fe,J,Q,Se,De,X]),Wn=o.useMemo(()=>J?["business_branch_id","=",Number(J)]:null,[J]);o.useEffect(()=>()=>{ge!=null&&ge.startsWith("blob:")&&URL.revokeObjectURL(ge)},[ge]),o.useEffect(()=>{let e=!0;return Promise.all([ne.getBusinesses(),B.getLaboratories()]).then(([n,i])=>{e&&(On(n),Mn(i))}),()=>{e=!1}},[]),o.useEffect(()=>{if(!de)return;const e=()=>Bt(null),n=i=>{i.key==="Escape"&&e()};return document.addEventListener("click",e),document.addEventListener("keydown",n),window.addEventListener("resize",e),window.addEventListener("scroll",e,!0),()=>{document.removeEventListener("click",e),document.removeEventListener("keydown",n),window.removeEventListener("resize",e),window.removeEventListener("scroll",e,!0)}},[de]);const xa=e=>(At.current[e]||(At.current[e]=o.createRef()),At.current[e]);o.useEffect(()=>{ae.forEach(e=>{const n=xa(e.uid);!n.current||!e.article_id||!e.article_label||`${$(n.current).val()}`==`${e.article_id}`||Oe(n.current,e.article_id,e.article_label)})},[ae]);const ga=async(e,n=null)=>{if(!e){ca([]),bt("");return}const c=(await B.getBranchesByBusiness(e)??[]).filter(d=>d.status!==null);if(ca(c),n&&c.some(d=>`${d.id}`==`${n}`)){bt(`${n}`);return}bt("")},va=e=>{if(!e)return;const n=di(e),i=ui(e);n&&K.current&&(K.current.value=n),i&&ce.current&&(ce.current.value=i),n&&gt(n)},_a=async(e,n=null,i=null)=>{var _;if(!e){vt([]),Ge(""),Ee([]),xe("");return}const d=(await B.getDistributionNetworks(e)??[]).filter(h=>h.status!==null);vt(d);const u=n||((_=d.find(h=>h.is_default))==null?void 0:_.id);if(u&&d.some(h=>`${h.id}`==`${u}`)){Ge(`${u}`),await ya(u,null,d);return}Ge(""),Ee([]),xe(""),va(i)},ya=async(e,n=null,i=null)=>{var h,j;if(!e){Ee([]),xe("");return}let c=[];const d=(i??Ve).find(y=>`${y.id}`==`${e}`);(((h=d==null?void 0:d.addresses)==null?void 0:h.length)??0)>0?c=d.addresses:c=await B.getDeliveryAddresses(e);const u=(c??[]).filter(y=>y.status!==null);Ee(u);const _=n||((j=u.find(y=>y.is_default))==null?void 0:j.id);if(_&&u.some(y=>`${y.id}`==`${_}`)){xe(`${_}`),Hn(u.find(y=>`${y.id}`==`${_}`));return}xe("")},Hn=e=>{e&&(K.current&&(K.current.value=k(e.address)),Re.current&&(Re.current.value=k(e.reference)),ce.current&&(ce.current.value=k(e.ubigeo)),ke.current&&(ke.current.value=k(e.contact_name)),$e.current&&($e.current.value=k(e.contact_phone)),gt(k(e.address)),le({lat:e.latitude,lng:e.longitude})&&Lt({lat:Number(e.latitude),lng:Number(e.longitude)}))},ja=async(e,n={})=>{var u,_,h;const i=n.article_id??e.article_id,c=Number(n.quantity??e.quantity??0),d=n.presentation_id??e.presentation_id;return!i||!Q||c<=0?null:await B.resolvePrice({article_id:i,presentation_id:d||null,quantity:c,business_id:Fe||null,business_branch_id:J||null,warehouse_id:Q||null,client_id:Se||null,eventual_client_id:De||null,client_distribution_network_id:X||null,issue_date:((u=H.current)==null?void 0:u.value)||null,commercial_channel:((_=Ve.find(j=>`${j.id}`==`${X}`))==null?void 0:_.commercial_channel)||null,segment:((h=Ve.find(j=>`${j.id}`==`${X}`))==null?void 0:h.segment)||null})},Wt=async(e=null)=>{const n=e??ae;for(const i of n){if(!i.article_id)continue;const c=await ja(i);c&&Z(d=>d.map(u=>u.uid!==i.uid?u:je({...u,stock_available:Number(c.stock_available||0),price_unit:Xa(u,c),price_source:Za(u,c),price_list_code:c.price_list_code||""})))}},Na=e=>{e==="regular"?(Pt(""),re(Y)):e==="eventual"&&(Ot(""),vt([]),Ge(""),Ee([]),xe(""),re(S))},Ht=async(e=null)=>{var h,j,y,D;kn(!!(e!=null&&e.id)),Gn(fn(e)),G.current&&(G.current.value=(e==null?void 0:e.id)??""),Ce.current&&(Ce.current.value=(e==null?void 0:e.code)??"Se genera al guardar"),H.current&&(H.current.value=e!=null&&e.issue_date?e.issue_date.toString().slice(0,10):new Date().toISOString().slice(0,10)),te.current&&(te.current.value=e!=null&&e.promised_delivery_at?e.promised_delivery_at.toString().slice(0,10):""),da(Dt((e==null?void 0:e.document_type)??"Factura")),it.current&&(it.current.value=(e==null?void 0:e.currency)??"PEN"),st.current&&(st.current.value=(e==null?void 0:e.payment_condition)??"Contado"),Be.current&&(Be.current.value=ci(e==null?void 0:e.payment_method)),dt.current&&(dt.current.value=(e==null?void 0:e.installments)??1),ut.current&&(ut.current.value=e!=null&&e.first_due_date?e.first_due_date.toString().slice(0,10):""),mt.current&&(mt.current.value=(e==null?void 0:e.order_status)??(e!=null&&e.external_source?"pending":"draft")),pt.current&&(pt.current.value=(e==null?void 0:e.dispatch_status)??"pending"),ft.current&&(ft.current.value=(e==null?void 0:e.billing_status)??"pending"),K.current&&(K.current.value=k(e==null?void 0:e.delivery_address)),Re.current&&(Re.current.value=k(e==null?void 0:e.delivery_reference)),ce.current&&(ce.current.value=k(e==null?void 0:e.ubigeo)),ke.current&&(ke.current.value=k(e==null?void 0:e.dispatch_contact_name)),$e.current&&($e.current.value=k(e==null?void 0:e.dispatch_contact_phone)),lt.current&&(lt.current.value=(e==null?void 0:e.purchase_order)??""),ot.current&&(ot.current.value=(e==null?void 0:e.guide_number)??""),ct.current&&(ct.current.value=(e==null?void 0:e.referral_guide)??""),oe.current&&(oe.current.value=(e==null?void 0:e.doctor_name)??""),ht.current&&(ht.current.value=(e==null?void 0:e.observations)??""),Lt({lat:le({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lat):"",lng:le({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lng):""}),gt(k(e==null?void 0:e.delivery_address));const n=e!=null&&e.business_id?`${e.business_id}`:"",i=e!=null&&e.warehouse_id?`${e.warehouse_id}`:"",c=e!=null&&e.client_id?`${e.client_id}`:"",d=e!=null&&e.eventual_client_id?`${e.eventual_client_id}`:"";oa(n),xt(i),Ot(c),Pt(d),n&&((h=e==null?void 0:e.business)!=null&&h.name)?Oe(we.current,n,e.business.name):re(we),i&&((j=e==null?void 0:e.warehouse)!=null&&j.name)?Oe(f.current,i,e.warehouse.name):re(f),c&&((y=e==null?void 0:e.client)!=null&&y.full_name)?Oe(S.current,c,`${e.client.document_number??""} - ${e.client.full_name}`.trim()):re(S),d&&((D=e==null?void 0:e.eventual_client)!=null&&D.business_name)?Oe(Y.current,d,`${e.eventual_client.document_number??""} - ${e.eventual_client.business_name}`.trim()):re(Y),e!=null&&e.seller_id&&(e!=null&&e.seller)?Oe(W.current,e.seller_id,Vr(e.seller)):re(W);const u=((e==null?void 0:e.items)??[]).map(g=>{var me,pe,fe,he,N,E,Ye,We,He,Ke,Je,Qe,Xe,Ze,et,tt;const b=g.article??null,P=((b==null?void 0:b.presentations)??[]).filter(M=>(M==null?void 0:M.status)!==!1&&(M==null?void 0:M.status)!==0),O=g.presentation??P[0]??null,ye=Number(g.presentation_units??(O==null?void 0:O.units)??1)||1;return je({uid:crypto.randomUUID(),article_id:g.article_id?`${g.article_id}`:"",article_label:b?`${b.code??""} - ${b.name??""}`.trim():"",article_code:(b==null?void 0:b.code)??g.external_sku??"",article_lot:(b==null?void 0:b.default_lot)??"",article_name:(b==null?void 0:b.name)??"",article_unit:((me=b==null?void 0:b.unit)==null?void 0:me.symbol)??((pe=b==null?void 0:b.unit)==null?void 0:pe.name)??"",article_laboratory:((fe=b==null?void 0:b.laboratory)==null?void 0:fe.name)??"",article_principle:((he=b==null?void 0:b.activePrinciple)==null?void 0:he.name)??((N=b==null?void 0:b.active_principle)==null?void 0:N.name)??"",presentations:P.map(M=>({id:`${M.id}`,name:M.name??"Presentacion",units:Number(M.units||1),price:Number(M.price||0)})),presentation_id:O!=null&&O.id?`${O.id}`:"",presentation_units:ye,stock_available:Number(g.stock_available||0),reserved_quantity:Number(g.reserved_quantity||0),price_unit:Number(g.price_unit||0),quantity:Number(g.quantity||1),discount_type:((Ye=(E=g.external_payload)==null?void 0:E.commercial_form)==null?void 0:Ye.discount_type)??"none",discount_value:Number(((He=(We=g.external_payload)==null?void 0:We.commercial_form)==null?void 0:He.discount_value)||0),discount_amount:Number(((Je=(Ke=g.external_payload)==null?void 0:Ke.commercial_form)==null?void 0:Je.discount_amount)||0),gross_total:Number(((Xe=(Qe=g.external_payload)==null?void 0:Qe.commercial_form)==null?void 0:Xe.gross_total)||0),total:Number(g.total||0),price_source:g.price_source||"fallback",price_list_code:((et=(Ze=g==null?void 0:g.price_list_item)==null?void 0:Ze.price_list)==null?void 0:et.code)||((tt=e==null?void 0:e.price_list)==null?void 0:tt.code)||""})}),_=u.length?u:[nt()];Z(_),$(m.current).modal("show"),await ga((e==null?void 0:e.business_id)??null,(e==null?void 0:e.business_branch_id)??null),c?(await _a(c,(e==null?void 0:e.client_distribution_network_id)??null),e!=null&&e.client_distribution_network_id&&await ya(e.client_distribution_network_id,(e==null?void 0:e.client_delivery_address_id)??null)):(vt([]),Ge(""),Ee([]),xe(""))},Kn=async e=>{var d,u,_,h,j,y,D,g,b,P,O,ye,me,pe,fe,he,N,E,Ye,We,He,Ke,Je,Qe,Xe,Ze,et,tt,M,La,Ba,Ga,Va;if(e.preventDefault(),_t){V.fire("Pedido bloqueado",_t,"info");return}const n={id:((d=G.current)==null?void 0:d.value)||void 0,external_source:r||void 0,business_id:Fe||null,business_branch_id:J||null,warehouse_id:Q||null,client_id:Se||null,eventual_client_id:De||null,seller_id:((u=W.current)==null?void 0:u.value)||null,client_distribution_network_id:X||null,client_delivery_address_id:$n||null,document_type:Te,currency:((_=it.current)==null?void 0:_.value)||"PEN",payment_condition:oi(((h=Be.current)==null?void 0:h.value)||((j=st.current)==null?void 0:j.value)||"Contado"),payment_method:((y=Be.current)==null?void 0:y.value)||"",purchase_order:((g=(D=lt.current)==null?void 0:D.value)==null?void 0:g.trim())||"",guide_number:((P=(b=ot.current)==null?void 0:b.value)==null?void 0:P.trim())||"",referral_guide:((ye=(O=ct.current)==null?void 0:O.value)==null?void 0:ye.trim())||"",doctor_name:((pe=(me=oe.current)==null?void 0:me.value)==null?void 0:pe.trim())||"",issue_date:((fe=H.current)==null?void 0:fe.value)||"",promised_delivery_at:((he=te.current)==null?void 0:he.value)||null,installments:((N=dt.current)==null?void 0:N.value)||1,first_due_date:((E=ut.current)==null?void 0:E.value)||null,order_status:((Ye=mt.current)==null?void 0:Ye.value)||(r?"pending":"draft"),dispatch_status:((We=pt.current)==null?void 0:We.value)||"pending",billing_status:((He=ft.current)==null?void 0:He.value)||"pending",tax_amount:ze.taxAmount,delivery_address:((Je=(Ke=K.current)==null?void 0:Ke.value)==null?void 0:Je.trim())||"",delivery_reference:((Xe=(Qe=Re.current)==null?void 0:Qe.value)==null?void 0:Xe.trim())||"",ubigeo:((et=(Ze=ce.current)==null?void 0:Ze.value)==null?void 0:et.trim())||"",map_lat:Et(Mt.lat)||null,map_lng:Et(Mt.lng)||null,dispatch_contact_name:((M=(tt=ke.current)==null?void 0:tt.value)==null?void 0:M.trim())||"",dispatch_contact_phone:((Ba=(La=$e.current)==null?void 0:La.value)==null?void 0:Ba.trim())||"",observations:((Va=(Ga=ht.current)==null?void 0:Ga.value)==null?void 0:Va.trim())||"",items:ae.map(L=>({article_id:L.article_id||null,presentation_id:L.presentation_id||null,warehouse_id:Q||null,stock_available:L.stock_available,reserved_quantity:L.reserved_quantity,presentation_units:L.presentation_units,price_unit:L.price_unit,quantity:L.quantity,gross_total:L.gross_total,discount_type:L.discount_type,discount_value:L.discount_value,discount_amount:L.discount_amount,total:L.total,status:!0}))},i=fi(ae,Q);if(i.length>0){const L=`
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${i.map(Ae=>`<li><strong>${T(Ae.article)}</strong>: faltan ${Me(Ae.shortage)} unidad(es) base para completar ${Me(Ae.quantity)}. Cantidad: ${Me(Ae.lineQuantity)} x ${Me(Ae.presentationUnits)}. Disponible: ${Me(Ae.available)}.</li>`).join("")}
          </ul>
        </div>
      `,{isConfirmed:Nr}=await V.fire({title:"Stock insuficiente",html:L,icon:"warning",showCancelButton:!0,confirmButtonText:"Crear de todas formas",cancelButtonText:"Revisar pedido"});if(!Nr)return;n.allow_stock_shortage=!0}await B.save(n)&&($(l.current).dxDataGrid("instance").refresh(),$(m.current).modal("hide"))},Jn=async e=>{const n=e.target.value||"";oa(n),xt(""),re(f),await ga(n,null)},Qn=e=>{const n=e.target.value||"";bt(n),xt(""),re(f)},Xn=async e=>{const n=e.target.value||"";xt(n),await Wt()},Zn=async e=>{var c,d;const n=cn(e.target.value),i=((d=(c=$(e.target).select2("data"))==null?void 0:c[0])==null?void 0:d.data)??null;Ot(n),Na("regular"),va(i),await _a(n,null,i),await Wt()},er=async e=>{const n=cn(e.target.value);Pt(n),Na("eventual"),await Wt()},ve=(e,n,i)=>{Ln(c=>({...c,[e]:{...c[e]??{},[n]:i}}))},Ca=(e=C)=>{var i;const n=e==="multivende"?v:((i=wt.find(c=>c.id===e))==null?void 0:i.kind)==="billing"?p:l;return n.current?$(n.current).dxDataGrid("instance"):null},wa=(e=C)=>{const n=Ca(e);n&&n.refresh()},Ra=(e=C)=>{const n=ha[e]??{};e==="orders"&&B.setFilters({laboratory_id:n.laboratoryId||""}),Bn(i=>({...i,[e]:n})),setTimeout(()=>wa(e),0)},tr=e=>{var n;(n=e==null?void 0:e.preventDefault)==null||n.call(e),Ra(C)},ka=(e=!1)=>{const n=C;e&&Ra(n),setTimeout(()=>{const i=Ca(n);i!=null&&i.exportToExcel&&i.exportToExcel(!1)},e?350:0)},ar=async({id:e,field:n,value:i})=>{await B.boolean({id:e,field:n,value:i})&&$(l.current).dxDataGrid("instance").refresh()},$a=e=>{Dn(e),$(Le.current).modal("show")},nr=e=>{const n=ia(e);En(e),Gt(null),Vt(mn(n==null?void 0:n.evidence_url)?n.evidence_url:""),Yt({recipient_name:(n==null?void 0:n.recipient_name)??(e==null?void 0:e.dispatch_contact_name)??"",recipient_document_type:(n==null?void 0:n.recipient_document_type)??"DNI",recipient_document_number:(n==null?void 0:n.recipient_document_number)??"",recipient_phone:(n==null?void 0:n.recipient_phone)??(e==null?void 0:e.dispatch_contact_phone)??"",delivered_at:n!=null&&n.delivered_at?`${n.delivered_at}`.replace(" ","T").slice(0,16):pn(),evidence_notes:(n==null?void 0:n.evidence_notes)??"",evidence_url:(n==null?void 0:n.evidence_url)??"",latitude:(n==null?void 0:n.latitude)??"",longitude:(n==null?void 0:n.longitude)??""}),navigator.geolocation&&navigator.geolocation.getCurrentPosition(i=>{Yt(c=>({...c,latitude:c.latitude||i.coords.latitude,longitude:c.longitude||i.coords.longitude}))},()=>{},{enableHighAccuracy:!0,timeout:5e3}),setTimeout(()=>{z.current&&(z.current.value="")},0),$(ee.current).modal("show")},rr=e=>{var i;const n=((i=e.target.files)==null?void 0:i[0])??null;Gt(n),Vt(n?URL.createObjectURL(n):mn(w.evidence_url)?w.evidence_url:"")},ue=(e,n)=>Yt(i=>({...i,[e]:n})),ir=async e=>{if(e.preventDefault(),!(Ie!=null&&Ie.id))return;const n=(Ie.dispatch_assignments??Ie.dispatchAssignments??[]).filter(d=>(d==null?void 0:d.status)!==!1&&(d==null?void 0:d.status)!==0&&(d==null?void 0:d.dispatch)).sort((d,u)=>{var _,h;return new Date(((_=u==null?void 0:u.dispatch)==null?void 0:_.scheduled_date)||(u==null?void 0:u.created_at)||0)-new Date(((h=d==null?void 0:d.dispatch)==null?void 0:h.scheduled_date)||(d==null?void 0:d.created_at)||0)})[0],i=new FormData;n!=null&&n.dispatch_id&&i.append("dispatch_id",n.dispatch_id),i.append("recipient_name",w.recipient_name??""),i.append("recipient_document_type",w.recipient_document_type??"DNI"),i.append("recipient_document_number",w.recipient_document_number??""),i.append("recipient_phone",w.recipient_phone??""),i.append("delivered_at",w.delivered_at??""),i.append("evidence_notes",w.evidence_notes??""),i.append("evidence_url",w.evidence_url??""),i.append("latitude",w.latitude??""),i.append("longitude",w.longitude??""),ma&&i.append("evidence_file",ma),await B.saveDeliveryEvidence(Ie.id,i)&&(Gt(null),Vt(""),z.current&&(z.current.value=""),$(ee.current).modal("hide"),$(l.current).dxDataGrid("instance").refresh())},Fa=async e=>{const n=St(e)[0];if(n){if(hi(n)){const c=await V.fire({title:"Guia de remision",text:`La guia ${jn(n)} esta ${bn(n.guide_status).toLowerCase()}.`,icon:"question",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Ver PDF",cancelButtonText:"Cancelar"});if(c.isConfirmed){const d=await Ka.issue(n.id);if(!(d!=null&&d.data))return;$(l.current).dxDataGrid("instance").refresh(),await Nt(Ct.referralGuide(d.data));return}if(!c.isDenied)return}await Nt(Ct.referralGuide(n));return}const i=await Ka.prepareFromCommercialOrder(e.id);i!=null&&i.data&&($(l.current).dxDataGrid("instance").refresh(),await Nt(Ct.referralGuide(i.data)))},sr=async e=>{var i;if(!(e!=null&&e.id)||e.items&&(e.business||e.commercial_order||e.commercialOrder))return e;const n=await ne.paginate({skip:0,take:1,isLoadingAll:!0,filter:["id","=",Number(e.id)]});return((i=n==null?void 0:n.data)==null?void 0:i[0])??e},Sa=async e=>{var h,j,y,D;const n=`${(e==null?void 0:e.local_status)??"pending"}`=="pending"?((h=await ne.prepareVoucher(e.id))==null?void 0:h.data)??e:e,i=await sr(n);if(!Ft(i)){await V.fire({title:"Comprobante no preparado",text:"Primero genera serie y correlativo del comprobante.",icon:"warning",confirmButtonText:"Entendido"});return}const c=window.open("","_blank");if(!c){await V.fire({title:"Impresion bloqueada",text:"El navegador bloqueo la ventana de impresion.",icon:"warning",confirmButtonText:"Entendido"});return}const d=g=>{var b,P,O;return((O=(b=g==null?void 0:g.toString)==null?void 0:(P=b.call(g)).slice)==null?void 0:O.call(P,0,10))??""},u=(i==null?void 0:i.items)??[],_=u.length?u.map(g=>`
        <tr>
          <td>${T(g.description)}</td>
          <td class="right">${Number(g.quantity??0).toFixed(2)}</td>
          <td class="right">${Number(g.unit_price??0).toFixed(2)}</td>
          <td class="right">${Number(g.total??0).toFixed(2)}</td>
        </tr>
      `).join(""):'<tr><td colspan="4" class="muted">Sin detalle de items</td></tr>';c.document.write(`<!doctype html>
      <html>
        <head>
          <title>${T(i.code)} - ${T(i.series)}-${T(i.sequence)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #222; margin: 28px; font-size: 12px; }
            h1 { font-size: 20px; margin: 0 0 4px; }
            h2 { font-size: 15px; margin: 20px 0 8px; }
            .muted { color: #666; }
            .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 1px solid #ddd; padding-bottom: 14px; }
            .number { text-align: right; font-size: 16px; font-weight: 700; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-top: 18px; }
            .label { color: #666; font-size: 11px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
            th { background: #f5f5f5; text-align: left; }
            .right { text-align: right; }
            .totals { width: 260px; margin-left: auto; margin-top: 14px; }
            @media print { button { display: none; } body { margin: 0; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()">Imprimir</button>
          <div class="header">
            <div>
              <h1>${T(((j=i==null?void 0:i.business)==null?void 0:j.name)??"Empresa")}</h1>
              <div class="muted">${T(((y=i==null?void 0:i.branch)==null?void 0:y.address)??"")}</div>
              <div class="muted">${T(((D=i==null?void 0:i.business)==null?void 0:D.tax_number)??"")}</div>
            </div>
            <div class="number">
              ${T(i.document_type??"Comprobante")}<br>
              ${T(i.series)}-${T(i.sequence)}
            </div>
          </div>
          <div class="grid">
            <div><div class="label">Comprobante interno</div>${T(i.code)}</div>
            <div><div class="label">Fecha</div>${T(d(i.issue_date))}</div>
            <div><div class="label">Cliente</div>${T(Wr(i))}</div>
            <div><div class="label">Moneda</div>${T(kt(i.currency))}</div>
            <div><div class="label">Pedido comercial</div>${T(Hr(i))}</div>
            <div><div class="label">Condicion</div>${T(i.payment_condition??"-")}</div>
          </div>
          <h2>Detalle</h2>
          <table>
            <thead>
              <tr>
                <th>Descripcion</th>
                <th class="right">Cantidad</th>
                <th class="right">P. Unitario</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>${_}</tbody>
          </table>
          <table class="totals">
            <tr><th>Subtotal</th><td class="right">${Number(i.subtotal??0).toFixed(2)}</td></tr>
            <tr><th>IGV</th><td class="right">${Number(i.tax_amount??0).toFixed(2)}</td></tr>
            <tr><th>Total</th><td class="right">${Number(i.total??0).toFixed(2)}</td></tr>
          </table>
        </body>
      </html>`),c.document.close(),c.focus(),c.print()},lr=async e=>{var c;let n=Ne(e);if(n&&Nn(n)){window.open(ne.downloadUrl(n.id,"pdf"),"_blank","noopener");return}if(n){const d=await V.fire({title:"Emitir comprobante",text:Ft(n)?`El comprobante ${be(n)||n.code} ya esta preparado. Puedes emitirlo o imprimirlo.`:`Se emitira ${be(n)||n.code} usando el conector configurado.`,icon:"question",showCancelButton:!0,showDenyButton:Ft(n),confirmButtonText:"Emitir",denyButtonText:"Imprimir",cancelButtonText:"Cancelar"});if(d.isDenied){await Sa(n);return}if(!d.isConfirmed)return}else{if(!yi(e)){await V.fire({title:"Comprobante no disponible",text:"Primero envia el pedido a preparacion o confirma el pedido. Los pedidos en borrador no se pueden facturar.",icon:"warning",confirmButtonText:"Entendido"});return}const d=aa(e);if(!(await V.fire({title:"Generar comprobante",text:`Se generara un comprobante ${d} para el pedido ${e.code}.`,icon:"question",showCancelButton:!0,confirmButtonText:"Generar",cancelButtonText:"Cancelar"})).isConfirmed)return;const _=await ne.save({commercial_order_id:e.id,document_type:d});if(!((c=_==null?void 0:_.data)!=null&&c.id))return;const h=await ne.prepareVoucher(_.data.id);n=(h==null?void 0:h.data)??_.data,$(l.current).dxDataGrid("instance").refresh();const j=await V.fire({title:"Comprobante generado",text:`Se genero ${be(n)||n.code}. Puedes emitirlo o imprimirlo ahora.`,icon:"success",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Imprimir",cancelButtonText:"Cerrar"});if(j.isDenied){await Sa(n);return}if(!j.isConfirmed)return}await ne.issue(n.id)&&$(l.current).dxDataGrid("instance").refresh()},or=async e=>{const{isConfirmed:n}=await V.fire({title:"Eliminar pedido comercial",text:"Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!n||!await B.delete(e)||$(l.current).dxDataGrid("instance").refresh()},cr=()=>{R.current&&(R.current.value=""),$(x.current).modal("show"),setTimeout(()=>{var e;return(e=R.current)==null?void 0:e.focus()},150)},dr=async e=>{var i,c;e.preventDefault();const n=((c=(i=R.current)==null?void 0:i.value)==null?void 0:c.trim())||"";if(!n){await V.fire({title:"CHECK OUT ID requerido",text:"Ingresa el CHECK OUT ID del pedido Multivende.",icon:"warning",confirmButtonText:"Entendido"});return}await V.fire({title:"Integracion pendiente",text:`El formulario ya captura el CHECK OUT ID ${n}. Falta conectar el servicio de Multivende para registrar el pedido automaticamente.`,icon:"info",confirmButtonText:"Aceptar"})},Da=()=>{I.current&&(I.current.value=""),F.current&&(F.current.value=""),A.current&&(A.current.value="1")},Ea=async()=>{fa(!0);try{const e=await Ha.paginate({take:100,skip:0,requireTotalCount:!0,sort:[{selector:"id",desc:!1}]});Tn((e==null?void 0:e.data)??[])}finally{fa(!1)}},ur=async()=>{Da(),pa(""),$(q.current).modal("show"),await Ea(),setTimeout(()=>{var e;return(e=F.current)==null?void 0:e.focus()},150)},mr=e=>{var n;I.current&&(I.current.value=(e==null?void 0:e.id)??""),F.current&&(F.current.value=(e==null?void 0:e.description)??""),A.current&&(A.current.value=e!=null&&e.status?"1":"0"),(n=F.current)==null||n.focus()},pr=async()=>{var i,c,d,u;const e=((c=(i=F.current)==null?void 0:i.value)==null?void 0:c.trim())||"";if(!e){await V.fire({title:"Motivo requerido",text:"Ingresa la descripcion del motivo de retraso.",icon:"warning",confirmButtonText:"Entendido"});return}await Ha.save({id:((d=I.current)==null?void 0:d.value)||void 0,description:e,status:((u=A.current)==null?void 0:u.value)==="1"})&&(Da(),await Ea())},fr=async(e,n)=>{var g,b,P,O,ye,me,pe,fe,he;$(n.target).data("select2")&&$(n.target).select2("close");const i=(g=$(n.target).select2("data"))==null?void 0:g[0],c=(i==null?void 0:i.data)??null,d=n.target.value||"";if(!d){Z(N=>N.map(E=>E.uid===e?{...nt(),uid:E.uid}:E));return}const u=c??await B.getArticleById(d),_=((u==null?void 0:u.presentations)??[]).filter(N=>(N==null?void 0:N.status)!==!1&&(N==null?void 0:N.status)!==0),h=_[0]??null,j=u?`${u.code??""} - ${u.name??""}`.trim():(i==null?void 0:i.text)??d,y={article_id:d,article_label:j,article_code:(u==null?void 0:u.code)??"",article_lot:(u==null?void 0:u.default_lot)??"",article_name:(u==null?void 0:u.name)??"",article_unit:((b=u==null?void 0:u.unit)==null?void 0:b.symbol)??((P=u==null?void 0:u.unit)==null?void 0:P.name)??"",article_laboratory:((O=u==null?void 0:u.laboratory)==null?void 0:O.name)??"",article_principle:((ye=u==null?void 0:u.activePrinciple)==null?void 0:ye.name)??((me=u==null?void 0:u.active_principle)==null?void 0:me.name)??"",presentations:_.map(N=>({id:`${N.id}`,name:N.name??"Presentacion",units:Number(N.units||1),price:Number(N.price||0)})),presentation_id:h?`${h.id}`:"",presentation_units:Number((h==null?void 0:h.units)||1),quantity:1};Z(N=>N.map(E=>E.uid===e?je({...E,...y}):E));const D=await B.resolvePrice({article_id:d,presentation_id:h?`${h.id}`:null,quantity:1,business_id:Fe||null,business_branch_id:J||null,warehouse_id:Q||null,client_id:Se||null,eventual_client_id:De||null,client_distribution_network_id:X||null,issue_date:((pe=H.current)==null?void 0:pe.value)||null,commercial_channel:((fe=Ve.find(N=>`${N.id}`==`${X}`))==null?void 0:fe.commercial_channel)||null,segment:((he=Ve.find(N=>`${N.id}`==`${X}`))==null?void 0:he.segment)||null});D&&Z(N=>N.map(E=>E.uid===e?je({...E,...y,stock_available:Number(D.stock_available||0),price_unit:Number(D.price_unit||0),price_source:D.source||"fallback",price_list_code:D.price_list_code||""}):E))},Kt=async(e,n,i)=>{const c=ae.find(j=>j.uid===e);if(!c)return;const d=n==="presentation_id"?c.presentations.find(j=>`${j.id}`==`${i}`):null,u=je({...c,[n]:i,...n==="presentation_id"?{presentation_units:Number((d==null?void 0:d.units)||1)}:{}});if(n==="price_unit"&&(u.price_source="manual",u.price_list_code=""),Z(j=>j.map(y=>y.uid===e?u:y)),!["quantity","presentation_id"].includes(n))return;const _=u.presentations.find(j=>`${j.id}`==`${n==="presentation_id"?i:u.presentation_id}`),h=await ja(u,{quantity:n==="quantity"?i:u.quantity,presentation_id:n==="presentation_id"?i:u.presentation_id});h&&Z(j=>j.map(y=>y.uid!==e?y:je({...y,presentation_units:Number((_==null?void 0:_.units)||y.presentation_units||1),stock_available:Number(h.stock_available||0),price_unit:Xa(y,h,n==="presentation_id"),price_source:Za(y,h,n==="presentation_id"),price_list_code:n==="presentation_id"?h.price_list_code||"":sa(y)?y.price_list_code:h.price_list_code||""})))},hr=(e,n)=>{const i=Number(n||0);Z(c=>c.map(d=>d.uid!==e?d:je({...d,discount_type:i>0?"percent":"none",discount_value:i>0?i:0})))},br=(e,n)=>{n.preventDefault(),n.stopPropagation();const i=n.currentTarget.getBoundingClientRect();Bt(c=>(c==null?void 0:c.uid)===e?null:{uid:e,top:i.bottom+4,left:i.left,width:Math.max(i.width,130)})},Ta=(e,n)=>{hr(e,n),Bt(null)},xr=()=>Z(e=>[...e,nt()]),gr=e=>{Z(n=>{const i=n.filter(c=>c.uid!==e);return i.length?i:[nt()]})},Ia=o.useMemo(()=>ae.reduce((e,n)=>e+Number(n.total||0),0),[ae]),ze=o.useMemo(()=>un(Ia,Te),[Ia,Te]),_e=_t!=="",Aa=o.useMemo(()=>Ci(ua),[ua]),Jt=o.useMemo(()=>{const e=qt.trim().toLowerCase();return e?Ut.filter(n=>[n.description,n.status?"Activo":"Inactivo",ta(n.creator),rn(n.created_at)].some(i=>`${i??""}`.toLowerCase().includes(e))):Ut},[Ut,qt]),vr=(e,n)=>a.jsxs("div",{className:`commercial-order-filter-field commercial-order-filter-${n.key}`,children:[a.jsxs("label",{className:"form-label",children:[n.label,n.helper&&a.jsxs("span",{className:"commercial-order-filter-helper",children:[" ",n.helper]})]}),n.type==="business"?a.jsxs("select",{className:"form-select",value:qe[n.key]??"",onChange:i=>ve(e,n.key,i.target.value),children:[a.jsx("option",{value:"",children:"Todos"}),An.map(i=>a.jsx("option",{value:i.id,children:i.name},`commercial-order-filter-business-${i.id}`))]}):n.type==="laboratory"?a.jsxs("select",{className:"form-select",value:qe[n.key]??"",onChange:i=>ve(e,n.key,i.target.value),children:[a.jsx("option",{value:"",children:"Todos"}),Pn.map(i=>a.jsx("option",{value:i.id,children:i.name},`commercial-order-filter-laboratory-${i.id}`))]}):n.type==="select"?a.jsx("select",{className:"form-select",value:qe[n.key]??"",onChange:i=>ve(e,n.key,i.target.value),children:(n.options??[]).map(i=>a.jsx("option",{value:i.value??i,children:i.label??i},`commercial-order-filter-${n.key}-${i.value??i}`))}):n.type==="dateRange"?a.jsx("input",{className:"form-control commercial-order-date-range-input","data-tab-id":e,value:qe[n.key]??"",onChange:i=>ve(e,n.key,i.target.value),placeholder:n.placeholder??"YYYY/MM/DD - YYYY/MM/DD"}):a.jsx("input",{className:"form-control",value:qe[n.key]??"",onChange:i=>ve(e,n.key,i.target.value),placeholder:n.placeholder??""})]},`commercial-order-main-filter-${e}-${n.key}`),Qt={orders:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"laboratoryId",label:"Laboratorio",helper:"(Solo para Reporte con Visitadores)",type:"laboratory"},{key:"dispatchStatus",label:"Despachado",type:"select",options:[{value:"",label:"Seleccionar"},{value:"dispatched",label:"Pedidos despachados"},{value:"pending",label:"Pedidos sin despachar"}]}],issued:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],cancelled:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],"credit-notes":[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],multivende:[{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"orderVtex",label:"Pedido VTEX",type:"text",placeholder:"Numero de pedido"}]}[C]??((Ma=Qa[C])==null?void 0:Ma.filters)??[],Oa=Qt.some(e=>e.type==="dateRange");o.useEffect(()=>{if(!Oa)return;let e=!0;return Qr().then(()=>{var n,i;!e||!((i=(n=window.$)==null?void 0:n.fn)!=null&&i.daterangepicker)||!window.moment||(window.moment.locale("es"),$(".commercial-order-date-range-input").each(function(){const c=$(this),d=c.data("tab-id")||C,u=`${c.val()||ie()}`.trim(),{start:_,end:h}=vn(u),j=window.moment(_||ra().replaceAll("/","-"),"YYYY-MM-DD"),y=window.moment(h||_||ra().replaceAll("/","-"),"YYYY-MM-DD"),D=c.data("daterangepicker");D&&D.remove(),c.off(".commercialOrderDateRange"),c.daterangepicker({startDate:j,endDate:y,autoUpdateInput:!1,alwaysShowCalendars:!0,linkedCalendars:!1,opens:"center",locale:{format:"YYYY/MM/DD",separator:" - ",applyLabel:"Aplicar",cancelLabel:"Limpiar",fromLabel:"Desde",toLabel:"Hasta",customRangeLabel:"Personalizado",weekLabel:"S",daysOfWeek:["Do","Lu","Ma","Mi","Ju","Vi","Sa"],monthNames:["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"],firstDay:1}},(g,b)=>{const P=`${g.format("YYYY/MM/DD")} - ${b.format("YYYY/MM/DD")}`;c.val(P),ve(d,"dateRange",P)}),c.on("cancel.daterangepicker.commercialOrderDateRange",()=>{c.val(""),ve(d,"dateRange","")})}))}).catch(()=>{}),()=>{e=!1,$(".commercial-order-date-range-input").each(function(){const n=$(this).data("daterangepicker");n&&n.remove(),$(this).off(".commercialOrderDateRange")})}},[C,Oa]);const jt=a.jsxs("div",{className:"commercial-order-listing-header",children:[a.jsxs("div",{className:"d-flex align-items-center justify-content-between gap-2 mb-2",children:[a.jsx("h4",{className:"header-title mb-0",children:"Listado"}),a.jsx("button",{type:"button",className:"btn btn-xs btn-light",onClick:()=>wa(),title:"Refrescar listado",children:a.jsx("i",{className:"mdi mdi-refresh"})})]}),a.jsx("ul",{className:"nav nav-tabs nav-bordered flex-nowrap overflow-auto mb-3",children:wt.map(e=>a.jsx("li",{className:"nav-item",children:a.jsx("button",{type:"button",className:`nav-link text-nowrap ${C===e.id?"active":""}`,onClick:()=>In(e.id),children:e.label})},`commercial-order-tab-${e.id}`))}),Qt.length>0&&a.jsxs("form",{className:"commercial-order-filter-form mb-2",onSubmit:tr,children:[Qt.map(e=>vr(C,e)),a.jsxs("div",{className:"commercial-order-filter-actions",children:[a.jsxs("button",{type:"submit",className:"btn btn-outline-primary",children:[a.jsx("i",{className:"mdi mdi-magnify me-1"}),"Filtrar"]}),yt.kind!=="static"&&a.jsxs("button",{type:"button",className:"btn btn-outline-danger",onClick:()=>ka(!0),children:[a.jsx("i",{className:"mdi mdi-file-excel-box me-1"}),"Filtrar a Excel"]}),yt.kind!=="static"&&a.jsxs("button",{type:"button",className:"btn btn-outline-success",onClick:()=>ka(!1),children:[a.jsx("i",{className:"mdi mdi-file-excel-box me-1"}),"Reporte"]}),C==="multivende"&&a.jsxs("button",{type:"button",className:"btn btn-outline-success",children:[a.jsx("i",{className:"mdi mdi-calendar-refresh me-1"}),"Actualizar fechas de entrega"]})]})]}),C==="issued"&&a.jsx("div",{className:"row g-3 mt-1",children:["Total","IGV","IGV Recuperado"].map(e=>a.jsxs("div",{className:"col-12 col-md-4",children:[a.jsx("label",{className:"form-label",children:e}),a.jsx("input",{className:"form-control",value:"0.00",readOnly:!0})]},`commercial-order-total-${e}`))})]}),Xt={caption:"Acciones",width:100,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowSorting:!1,cellTemplate:(e,{data:n})=>{e.addClass("commercial-order-actions"),U(e,{variant:"danger",title:"Descargar PDF del comprobante",icon:"mdi mdi-file-pdf-box",onClick:()=>window.open(ne.downloadUrl(n.id,"pdf"),"_blank")})}},_r=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"dispatch_status",visible:!1,showInColumnChooser:!1}],Zt=[{dataField:"source_type",visible:!1,showInColumnChooser:!1},{dataField:"local_status",visible:!1,showInColumnChooser:!1},{dataField:"document_type",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"created_at",visible:!1,showInColumnChooser:!1}],yr=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"external_order_id",visible:!1,showInColumnChooser:!1},{dataField:"external_checkout_id",visible:!1,showInColumnChooser:!1}],Pa={issued:[...Zt,Xt,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:on},{caption:"Cliente",minWidth:260,calculateCellValue:na},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>kt(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}],cancelled:[...Zt,Xt,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"Cliente",minWidth:260,calculateCellValue:na},{caption:"Motivo",minWidth:180,calculateCellValue:ri},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>kt(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"F. Facturacion",dataType:"date",width:130},{dataField:"cancelled_at",caption:"F. Anulacion",dataType:"datetime",width:160}],"credit-notes":[...Zt,Xt,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:on},{caption:"Doc. Afecto",width:130,calculateCellValue:ni},{caption:"Cliente",minWidth:260,calculateCellValue:na},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>kt(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}]},jr=[...yr,{caption:"Acciones",width:230,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:n})=>{const i=St(n).length>0;e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),U(e,{variant:"primary",title:"Editar pedido Multivende",icon:"mdi mdi-pencil",onClick:()=>Ht(n)}),U(e,{variant:"info",title:"Ver historial del pedido Multivende",icon:"mdi mdi-map-marker-path",onClick:()=>$a(n)}),U(e,{variant:i?"dark":"warning",title:i?"Ver guia de remision asociada":"Generar guia de remision",icon:i?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>Fa(n)})}},{dataField:"order_status",caption:"E. Pedido",width:130,lookup:za(Ya),cellTemplate:(e,{value:n})=>Rt(e,n,Wa)},{caption:"E. SUNAT",width:120,calculateCellValue:ii},{caption:"Pedido VTEX",width:150,calculateCellValue:si},{dataField:"external_channel",caption:"Canal",width:130},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:an},{dataField:"document_type",caption:"Tipo Documento",width:140,calculateCellValue:aa,cellTemplate:(e,{value:n})=>Rt(e,n,i=>i||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:300,calculateCellValue:nn},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"promised_delivery_at",caption:"F. Entrega Estimada",dataType:"date",width:160},{caption:"F. de Entrega",width:150,dataType:"date",calculateCellValue:_n},{caption:"Tiempo de Proceso",width:150,calculateCellValue:li},{dataField:"created_at",caption:"Fecha Registro",dataType:"date",width:140},{dataField:"code",caption:"Codigo",width:130}];return a.jsxs(a.Fragment,{children:[a.jsx("style",{children:`
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
      .commercial-order-form-readonly {
        pointer-events: none;
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
    `}),a.jsxs("div",{className:"commercial-order-top-actions",children:[a.jsxs("button",{type:"button",className:"btn btn-success commercial-order-multivende-action",title:"Ingresar pedido Multivende por CHECK OUT ID",onClick:cr,children:[a.jsxs("span",{children:[a.jsx("i",{className:"mdi mdi-plus-circle-outline"})," Ingresar pedido multivende"]}),a.jsx("i",{className:"mdi mdi-calendar-month-outline"})]}),a.jsxs("button",{type:"button",className:"btn commercial-order-delay-action",title:"Abrir mantenedor de motivos de retraso de entrega",onClick:ur,children:[a.jsx("span",{children:"Mantenedor Retraso Entrega"}),a.jsx("i",{className:"mdi mdi-cog"})]})]}),C==="orders"&&a.jsx(ea,{gridRef:l,title:jt,rest:B,filterValue:Un,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(l.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"add",title:"Agregar",hint:"Agregar pedido comercial",onClick:()=>Ht(null)}})},pageSize:25,exportable:!0,columns:[..._r,{caption:"Acciones",width:340,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:n})=>{const i=St(n).length>0,c=fn(n);e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),U(e,{variant:"primary",title:c||"Editar datos, cliente, entrega y productos del pedido comercial",icon:c?"mdi mdi-eye-outline":"mdi mdi-pencil",onClick:()=>Ht(n)}),_i(n)&&U(e,{variant:"success",title:"Enviar este pedido a preparacion para iniciar picking",icon:"mdi mdi-clipboard-check-outline",onClick:()=>ar({id:n.id,field:"dispatch_status",value:"preparing"})}),U(e,{variant:"info",title:"Ver historial de estados, guia, ruta y entrega del pedido",icon:"mdi mdi-map-marker-path",onClick:()=>$a(n)});const d=Ni(n);U(e,{variant:"secondary",title:d.title,icon:d.icon,onClick:()=>lr(n)}),U(e,{variant:i?"dark":"warning",title:i?"Ver, emitir o descargar la guia de remision asociada al pedido":"Generar guia de remision para este pedido",icon:i?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>Fa(n)}),U(e,{variant:"success",title:ia(n)?"Ver o actualizar foto y datos de evidencia de entrega":"Registrar foto y datos de evidencia de entrega",icon:"mdi mdi-camera",onClick:()=>nr(n)}),U(e,{variant:"danger",title:"Imprimir o descargar PDF resumen del pedido comercial",icon:"mdi mdi-file-pdf-box",onClick:()=>Nt(Ct.commercialOrder(n))}),U(e,{variant:"danger",title:"Eliminar este pedido comercial del listado",icon:"mdi mdi-delete",onClick:()=>or(n.id)})}},{dataField:"order_status",caption:"Estado",width:140,lookup:za(Ya),cellTemplate:(e,{value:n})=>Rt(e,n,Wa)},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:an},{dataField:"document_type",caption:"Tipo documento",width:130,calculateCellValue:aa,cellTemplate:(e,{value:n})=>Rt(e,n,i=>i||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:320,calculateCellValue:nn},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_label",caption:"Tipo de pago",width:170,calculateCellValue:Kr},{dataField:"seller.fullname",caption:"Usuario",width:190,cellTemplate:(e,{data:n})=>e.text(Ur(n.seller))},{dataField:"created_at",caption:"Fecha registro",width:130,dataType:"date"},{dataField:"creator.username",caption:"Usuario registro",width:150,cellTemplate:(e,{data:n})=>e.text(ta(n.creator))},{dataField:"code",caption:"Código",width:130},{dataField:"business.name",caption:"Empresa",minWidth:150}]},"orders"),yt.kind==="billing"&&a.jsx(ea,{gridRef:p,title:jt,rest:ne,filterValue:qn,pageSize:20,exportable:!0,columns:Pa[C]??Pa.issued,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar listado",onClick:()=>$(p.current).dxDataGrid("instance").refresh()}})}},`billing-${C}`),C==="multivende"&&a.jsx(ea,{gridRef:v,title:jt,rest:Vn,filterValue:zn,pageSize:10,exportable:!0,columns:jr,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar pedidos Multivende",onClick:()=>$(v.current).dxDataGrid("instance").refresh()}})}},"multivende"),yt.kind==="static"&&a.jsx(wi,{title:jt,config:Qa[C]}),a.jsx(at,{modalRef:m,title:_e?"Ver pedido comercial":Rn?"Editar pedido comercial":"Agregar pedido comercial",size:"xl",dialogClass:"commercial-order-modal-dialog modal-dialog-scrollable",bodyClass:"commercial-order-modal-body",bodyStyle:{maxHeight:"calc(100vh - 150px)",overflowY:"auto",overflowX:"hidden"},btnSubmitText:"Guardar",hideButtonSubmit:_e,onSubmit:Kn,children:a.jsxs("div",{id:"commercial-orders-form-container",children:[a.jsx("input",{ref:G,type:"hidden"}),a.jsx("input",{ref:Ce,type:"hidden"}),a.jsx("input",{ref:H,type:"hidden"}),a.jsx("input",{ref:te,type:"hidden"}),a.jsx("input",{ref:st,type:"hidden"}),a.jsx("input",{ref:dt,type:"hidden"}),a.jsx("input",{ref:ut,type:"hidden"}),a.jsx("input",{ref:mt,type:"hidden"}),a.jsx("input",{ref:pt,type:"hidden"}),a.jsx("input",{ref:ft,type:"hidden"}),a.jsx("input",{ref:wn,type:"hidden",value:ze.taxAmount,readOnly:!0}),a.jsx("input",{ref:Re,type:"hidden"}),_e&&a.jsxs("div",{className:"alert alert-warning py-2 mb-2",children:[a.jsx("i",{className:"mdi mdi-lock-outline me-1"}),_t]}),a.jsxs("fieldset",{className:_e?"commercial-order-form-readonly":"",disabled:_e,style:{border:0,margin:0,padding:0,minWidth:0},children:[a.jsxs("section",{className:"commercial-order-form-section",children:[a.jsxs("div",{className:"commercial-order-section-title",children:[a.jsx("i",{className:"mdi mdi-file-document"}),a.jsx("span",{children:"Datos del pedido"})]}),a.jsxs("div",{className:"row g-2",children:[a.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:a.jsx(Pe,{eRef:we,label:"Empresa",required:!0,searchAPI:"/api/admin/businesses/paginate",searchBy:"name",dropdownParent:"#commercial-orders-form-container",onChange:Jn})}),a.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:a.jsxs(Ir,{eRef:It,label:"Sede",dropdownParent:"#commercial-orders-form-container",value:J,onChange:Qn,children:[a.jsx("option",{value:"",children:"Sin sede"}),Sn.map(e=>a.jsx("option",{value:e.id,children:e.name},`commercial-order-branch-${e.id}`))]})}),a.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:a.jsx(Pe,{eRef:f,label:"Almacen",required:!0,searchAPI:"/api/admin/warehouses/paginate",searchBy:"name",filter:Wn,dropdownParent:"#commercial-orders-form-container",onChange:Xn,templateResult:dn,templateSelection:dn})}),a.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[a.jsx("label",{className:"form-label",children:"Doc. venta"}),a.jsxs("select",{ref:Cn,className:"form-control",value:Te,onChange:e=>da(Dt(e.target.value)),children:[a.jsx("option",{value:"Factura",children:"Factura"}),a.jsx("option",{value:"Boleta",children:"Boleta"}),a.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),a.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[a.jsx("label",{className:"form-label",children:"Moneda"}),a.jsxs("select",{ref:it,className:"form-control",children:[a.jsx("option",{value:"PEN",children:"PEN"}),a.jsx("option",{value:"USD",children:"USD"}),a.jsx("option",{value:"EUR",children:"EUR"})]})]}),a.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[a.jsx("label",{className:"form-label",children:"Forma de pago"}),a.jsxs("select",{ref:Be,className:"form-control",children:[a.jsx("option",{value:"",children:"Seleccione"}),Gr.map(e=>a.jsx("option",{value:e,children:e},`commercial-order-payment-${e}`))]})]})]})]}),a.jsxs("section",{className:"commercial-order-form-section",children:[a.jsxs("div",{className:"commercial-order-section-title",children:[a.jsx("i",{className:"mdi mdi-account"}),a.jsx("span",{children:"Cliente y entrega"})]}),a.jsxs("div",{className:"row g-2",children:[a.jsx("div",{className:"col-12 col-xl-6",children:a.jsx(Pe,{eRef:S,label:"Cliente regular",searchAPI:"/api/admin/clients/paginate",searchBy:"full_name",selectBy:"entity_id",filter:Lr,dropdownParent:"#commercial-orders-form-container",onChange:Zn})}),a.jsx("div",{className:"col-12 col-xl-6",children:a.jsx(Pe,{eRef:Y,label:"Cliente eventual",searchAPI:"/api/admin/eventual-clients/paginate",searchBy:"business_name",dropdownParent:"#commercial-orders-form-container",onChange:er})}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Orden de compra"}),a.jsx("input",{ref:lt,className:"form-control"})]}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Numero de guia"}),a.jsx("input",{ref:ot,className:"form-control"})]}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Guia remision"}),a.jsx("input",{ref:ct,className:"form-control"})]}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Ubigeo"}),a.jsx("input",{ref:ce,className:"form-control"})]}),a.jsx("div",{className:"col-12 col-xl-4",children:a.jsx(qa,{eRef:K,label:"Direccion de entrega",rows:2})}),a.jsx("div",{className:"col-12",children:a.jsx(vi,{modalRef:m,position:Mt,searchText:Fn,onSearchTextChange:gt,onPositionChange:Lt,onAddressSelected:e=>{K.current&&(K.current.value=e)},disabled:_e})}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[a.jsx("label",{className:"form-label",children:"Nombre contacto entrega"}),a.jsx("input",{ref:ke,className:"form-control"})]}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[a.jsx("label",{className:"form-label",children:"Celular contacto entrega"}),a.jsx("input",{ref:$e,className:"form-control"})]}),a.jsx(Pe,{eRef:W,label:"Vendedor",col:"col-12 col-md-6 col-xl-2",searchAPI:"/api/admin/users/paginate",searchBy:"fullname",dropdownParent:"#commercial-orders-form-container"}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Medico"}),a.jsx("input",{ref:oe,className:"form-control"})]})]})]}),a.jsxs("section",{className:"commercial-order-form-section",children:[a.jsxs("div",{className:"commercial-order-detail-toolbar",children:[a.jsxs("div",{className:"commercial-order-section-title mb-0",children:[a.jsx("i",{className:"mdi mdi-format-list-bulleted"}),a.jsx("span",{children:"Detalle del pedido"})]}),a.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:xr,children:"Agregar item"})]}),a.jsx("div",{className:"table-responsive border rounded commercial-order-detail-table","data-select2-local-dropdown":"true",children:a.jsxs("table",{className:"table table-sm align-middle mb-0",children:[a.jsx("thead",{children:a.jsxs("tr",{children:[a.jsx("th",{style:{minWidth:96},children:"Descuento"}),a.jsx("th",{style:{minWidth:104},children:"Codigo"}),a.jsx("th",{style:{minWidth:88},children:"Codigo lote"}),a.jsx("th",{style:{minWidth:280},children:"Nombre"}),a.jsx("th",{style:{minWidth:128},children:"Laboratorio"}),a.jsx("th",{style:{minWidth:130},children:"Principio activo"}),a.jsx("th",{style:{minWidth:110},children:"Unidad"}),a.jsx("th",{style:{minWidth:64},children:"Stock"}),a.jsx("th",{style:{minWidth:112},children:"P. venta con IGV"}),a.jsx("th",{style:{minWidth:112},children:"P. venta sin IGV"}),a.jsx("th",{style:{minWidth:92},children:"Cantidad"}),a.jsx("th",{style:{minWidth:96},children:"Total desc."}),a.jsx("th",{style:{minWidth:96},children:"Sub total"}),a.jsx("th",{style:{width:70}})]})}),a.jsx("tbody",{children:ae.map(e=>a.jsxs("tr",{children:[a.jsx("td",{children:a.jsxs("div",{className:"commercial-order-discount-cell",children:[a.jsxs("button",{type:"button",className:"commercial-order-discount-trigger",onClick:n=>br(e.uid,n),children:[a.jsx("span",{children:e.discount_type==="percent"&&Number(e.discount_value||0)>0?`${Number(e.discount_value)}%`:"Seleccione"}),a.jsx("i",{className:"mdi mdi-chevron-down"})]}),(de==null?void 0:de.uid)===e.uid&&a.jsxs("div",{className:"commercial-order-discount-menu",style:{top:de.top,left:de.left,minWidth:de.width},onClick:n=>n.stopPropagation(),children:[a.jsx("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type!=="percent"?"active":""}`,onClick:()=>Ta(e.uid,""),children:"Seleccione"}),Br.map(n=>a.jsxs("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type==="percent"&&Number(e.discount_value||0)===n?"active":""}`,onClick:()=>Ta(e.uid,n),children:[n,"%"]},`commercial-order-discount-floating-${e.uid}-${n}`))]})]})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_code||"-"})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_lot||"-"})}),a.jsx("td",{className:"commercial-order-article-name",children:a.jsx(Pe,{eRef:xa(e.uid),searchAPI:Yn,searchBy:"name",dropdownParent:"#commercial-orders-form-container",disabled:!Q,onChange:n=>fr(e.uid,n)})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_laboratory||"-"})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_principle||"-"})}),a.jsx("td",{children:a.jsxs("div",{children:[a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_unit||"-"}),e.presentations.length>0&&a.jsxs("select",{className:"form-control mt-1","data-no-select2":"true",value:e.presentation_id,disabled:!e.article_id,onChange:n=>Kt(e.uid,"presentation_id",n.target.value),children:[a.jsx("option",{value:"",children:mi(e)}),e.presentations.map(n=>a.jsx("option",{value:n.id,children:pi(n,e)},`commercial-order-presentation-${e.uid}-${n.id}`))]})]})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:Number(e.stock_available||0).toFixed(2)})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:e.price_unit,onFocus:tn,onChange:n=>Kt(e.uid,"price_unit",en(n))})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:un(Number(e.price_unit||0),Te).subtotal.toFixed(2),readOnly:!0})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0.01",className:"form-control",value:e.quantity,onFocus:tn,onChange:n=>Kt(e.uid,"quantity",en(n))})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.discount_amount||0).toFixed(2),readOnly:!0})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.total||0).toFixed(2),readOnly:!0})}),a.jsx("td",{className:"text-end",children:a.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>gr(e.uid),children:a.jsx("i",{className:"mdi mdi-close"})})})]},e.uid))}),a.jsxs("tfoot",{children:[a.jsxs("tr",{children:[a.jsx("th",{colSpan:"12",className:"text-end",children:yn(Te)?"Total gravada":"Sub total"}),a.jsx("th",{children:ze.subtotal.toFixed(2)}),a.jsx("th",{})]}),a.jsxs("tr",{children:[a.jsx("th",{colSpan:"12",className:"text-end",children:"Descuento global"}),a.jsx("th",{children:"0.00"}),a.jsx("th",{})]}),a.jsxs("tr",{children:[a.jsx("th",{colSpan:"12",className:"text-end",children:"IGV"}),a.jsx("th",{children:ze.taxAmount.toFixed(2)}),a.jsx("th",{})]}),a.jsxs("tr",{children:[a.jsx("th",{colSpan:"12",className:"text-end",children:"Total"}),a.jsx("th",{children:ze.total.toFixed(2)}),a.jsx("th",{})]})]})]})})]}),a.jsxs("section",{className:"commercial-order-form-section mb-0",children:[a.jsxs("div",{className:"commercial-order-section-title",children:[a.jsx("i",{className:"mdi mdi-note-text"}),a.jsx("span",{children:"Observaciones"})]}),a.jsx(qa,{eRef:ht,label:"Observaciones",rows:3,disabled:_e})]})]})]})}),a.jsx(at,{modalRef:x,title:"Ingresar pedido multivende",size:"lg",btnSubmitText:"Registrar",onSubmit:dr,children:a.jsx("div",{className:"commercial-order-multivende-form",children:a.jsxs("section",{className:"commercial-order-form-section",children:[a.jsxs("div",{className:"commercial-order-section-title",children:[a.jsx("i",{className:"mdi mdi-file-document-plus-outline"}),a.jsx("span",{children:"General"})]}),a.jsxs("div",{className:"mb-2",children:[a.jsxs("label",{className:"form-label",children:["Ingrese el ",a.jsx("strong",{children:"CHECK OUT ID"})]}),a.jsx("input",{ref:R,name:"external_checkout_id",className:"form-control",autoComplete:"off"})]})]})})}),a.jsx(at,{modalRef:q,title:"Mantenedor motivo retraso entrega",size:"lg",hideFooter:!0,onSubmit:e=>{e.preventDefault(),pr()},children:a.jsxs("div",{className:"commercial-order-delay-maintainer",children:[a.jsxs("div",{className:"commercial-order-delay-actions",children:[a.jsxs("button",{type:"button",className:"btn btn-sm btn-light","data-bs-dismiss":"modal",children:[a.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]}),a.jsxs("button",{type:"submit",className:"btn btn-sm btn-outline-primary",children:[a.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]})]}),a.jsx("input",{ref:I,type:"hidden"}),a.jsxs("div",{className:"row",children:[a.jsxs("div",{className:"col-12 mb-3",children:[a.jsx("label",{className:"form-label",children:"Descripcion:"}),a.jsx("input",{ref:F,className:"form-control",autoComplete:"off"})]}),a.jsxs("div",{className:"col-12 mb-3",children:[a.jsx("label",{className:"form-label",children:"Estado:"}),a.jsxs("select",{ref:A,className:"form-control",defaultValue:"1",children:[a.jsx("option",{value:"1",children:"Activo"}),a.jsx("option",{value:"0",children:"Inactivo"})]})]})]}),a.jsx("hr",{}),a.jsxs("div",{className:"commercial-order-delay-filter",children:[a.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),a.jsx("input",{className:"form-control form-control-sm",value:qt,onChange:e=>pa(e.target.value)})]}),a.jsx("div",{className:"table-responsive commercial-order-delay-table",children:a.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[a.jsx("thead",{children:a.jsxs("tr",{children:[a.jsx("th",{className:"text-center",children:"Acciones"}),a.jsx("th",{className:"text-center",children:"Estado"}),a.jsx("th",{children:"Motivo"}),a.jsx("th",{children:"Fecha registro"}),a.jsx("th",{children:"Usuario registro"})]})}),a.jsxs("tbody",{children:[zt&&a.jsx("tr",{children:a.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"Cargando motivos..."})}),!zt&&Jt.length===0&&a.jsx("tr",{children:a.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"No existen elementos"})}),!zt&&Jt.map(e=>a.jsxs("tr",{children:[a.jsx("td",{className:"text-center",children:a.jsx("button",{type:"button",className:"btn btn-xs btn-outline-info",title:"Editar motivo de retraso",onClick:()=>mr(e),children:a.jsx("i",{className:"mdi mdi-pencil"})})}),a.jsx("td",{className:"text-center",children:a.jsx("span",{className:xn(e.status?"billed":"cancelled"),children:e.status?"Activo":"Inactivo"})}),a.jsx("td",{children:e.description}),a.jsx("td",{children:rn(e.created_at)}),a.jsx("td",{children:ta(e.creator)})]},`delivery-delay-reason-${e.id}`))]})]})}),a.jsxs("div",{className:"commercial-order-delay-summary",children:[Jt.length," elementos (Pagina 1 de 1)"]})]})}),a.jsx(at,{modalRef:Le,title:"Tracking del pedido",size:"lg",hideButtonSubmit:!0,children:a.jsx("div",{className:"table-responsive",children:a.jsxs("table",{className:"table table-sm align-middle mb-0",children:[a.jsx("thead",{children:a.jsxs("tr",{children:[a.jsx("th",{children:"Fecha"}),a.jsx("th",{children:"Estado"})]})}),a.jsxs("tbody",{children:[Aa.length===0&&a.jsx("tr",{children:a.jsx("td",{colSpan:"2",className:"text-muted text-center py-3",children:"Sin eventos registrados."})}),Aa.map((e,n)=>a.jsxs("tr",{children:[a.jsx("td",{children:new Date(e.date).toLocaleString("es-PE")}),a.jsx("td",{children:e.status})]},`commercial-order-tracking-${n}`))]})]})})}),a.jsx(at,{modalRef:ee,title:"Evidencia de entrega",size:"lg",btnSubmitText:"Registrar",onSubmit:ir,children:a.jsxs("div",{className:"row",children:[a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Recibido por"}),a.jsx("input",{className:"form-control",value:w.recipient_name,onChange:e=>ue("recipient_name",e.target.value)})]}),a.jsxs("div",{className:"col-md-3 mb-3",children:[a.jsx("label",{className:"form-label",children:"Tipo doc."}),a.jsxs("select",{className:"form-control",value:w.recipient_document_type,onChange:e=>ue("recipient_document_type",e.target.value),children:[a.jsx("option",{value:"DNI",children:"DNI"}),a.jsx("option",{value:"RUC",children:"RUC"}),a.jsx("option",{value:"CE",children:"CE"}),a.jsx("option",{value:"OTRO",children:"Otro"})]})]}),a.jsxs("div",{className:"col-md-3 mb-3",children:[a.jsx("label",{className:"form-label",children:"Numero"}),a.jsx("input",{className:"form-control",value:w.recipient_document_number,onChange:e=>ue("recipient_document_number",e.target.value)})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Telefono"}),a.jsx("input",{className:"form-control",value:w.recipient_phone,onChange:e=>ue("recipient_phone",e.target.value)})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Fecha y hora entrega"}),a.jsx("input",{type:"datetime-local",className:"form-control",value:w.delivered_at,onChange:e=>ue("delivered_at",e.target.value)})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Foto / evidencia"}),a.jsx("input",{ref:z,className:"form-control",type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",capture:"environment",onChange:rr})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Latitud"}),a.jsx("input",{className:"form-control",value:w.latitude,onChange:e=>ue("latitude",e.target.value)})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Longitud"}),a.jsx("input",{className:"form-control",value:w.longitude,onChange:e=>ue("longitude",e.target.value)})]}),a.jsxs("div",{className:"col-12 mb-3",children:[a.jsx("label",{className:"form-label",children:"Observaciones"}),a.jsx("textarea",{className:"form-control",rows:"3",value:w.evidence_notes,onChange:e=>ue("evidence_notes",e.target.value)})]}),a.jsx("div",{className:"col-12",children:a.jsx("div",{className:"border rounded p-3",children:ge?a.jsx("img",{src:ge,alt:"Evidencia de entrega",className:"img-fluid rounded border bg-light",style:{maxHeight:360,width:"100%",objectFit:"contain"}}):w.evidence_url?a.jsx("a",{href:w.evidence_url,target:"_blank",rel:"noreferrer",children:"Abrir evidencia registrada"}):a.jsx("div",{className:"text-muted py-4 text-center",children:"Sin evidencia registrada"})})})]})})]})};Rr((t,r)=>{!r.can("orders")&&!r.hasRole("Admin")&&(location.href="/admin/"),kr(t).render(a.jsx(Er,{...r,title:r.pageTitle||"Pedidos comerciales",children:a.jsx(Ri,{...r})}))});
