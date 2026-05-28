var vn=Object.defineProperty;var _n=(t,n,s)=>n in t?vn(t,n,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[n]=s;var Ga=(t,n,s)=>_n(t,typeof n!="symbol"?n+"":n,s);import{C as yn,c as jn,j as a,r as c,S as U,G as Nn}from"./CreateReactScript-BQEmHc8B.js";import{L as Cn,G as wn,M as Rn}from"./esm-XAA1TWCO.js";import{B as $n}from"./Base-BZJCfbcl.js";import{T as Zt}from"./Table-DsvFLxnp.js";import{M as et}from"./Modal-BpHRFSoz.js";import{R as kn}from"./ReactAppend-CmCssPze.js";import{a as Ee,S as Ie}from"./SetSelectValue-CKeZntsZ.js";import{S as Fn}from"./SelectFormGroup-BeLjaap0.js";import{T as Va}from"./TextareaFormGroup-COu0G6AX.js";import{B as Sn}from"./BillingDocumentsRest-WW_N3DRe.js";import{C as ur}from"./CommercialOrdersRest-DArLGxwY.js";import{B as Dn}from"./BasicRest-BJmaHB2C.js";import{R as Tn}from"./ReferralGuidesRest-CIzM-URQ.js";import{o as yt,b as jt}from"./magistralesRecordPdf-C-x5GdgT.js";import{t as Ua,i as za,j as mr,k as qa}from"./statusLabels-DafAwaKR.js";import"./tippy-react.esm-255dCUw_.js";import"./permissionScope-Be8AULz2.js";import"./ubigeoInei-D0FnAslC.js";class En extends Dn{constructor(){super(...arguments);Ga(this,"path","admin/delivery-delay-reasons")}}const M=new ur,fe=new Sn,Ya=new En,Wa=new Tn,In=["client_kind","=","regular"],An=[1,2,3,4,5],On=["EFECTIVO [CONTADO]","TRANSFERENCIA [CONTADO]","YAPE [CONTADO]","PLIN [CONTADO]","TARJETA [CONTADO]","TRANSFERENCIA [CREDITO]"],Ha="ecomsur_oms",Nt=[{id:"orders",label:"Pedidos",kind:"orders"},{id:"issued",label:"Facturas Emitidas",kind:"billing"},{id:"cancelled",label:"Facturas Anuladas",kind:"billing"},{id:"credit-notes",label:"Notas de Credito",kind:"billing"},{id:"visitors",label:"Pedidos - Visitadores",kind:"static"},{id:"visitors-legacy",label:"Pedidos - Visitadores Legacy",kind:"static"},{id:"platforms",label:"Plataformas",kind:"static"},{id:"multivende",label:"Pedidos - Multivende",kind:"multivende"}],Ka={visitors:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},"visitors-legacy":{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["Todos","ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},platforms:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]}},z=(t,{variant:n,title:s,icon:l,onClick:p})=>{const v=$('<button type="button"></button>').addClass(`btn btn-xs btn-soft-${n} commercial-order-action-btn`).attr("title",s).attr("aria-label",s).append($("<i></i>").addClass(l)).on("click",m=>{m.preventDefault(),m.stopPropagation(),p()});t.append(v)},pr=t=>`commercial-order-status-badge commercial-order-status-${`${t??"empty"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-")||"empty"}`,Ct=(t,n,s)=>{t.addClass("commercial-order-status-cell"),kn(t,a.jsx("span",{className:pr(n),children:s(n)}))},tt=()=>({uid:crypto.randomUUID(),article_id:"",article_label:"",article_code:"",article_lot:"",article_name:"",article_unit:"",article_laboratory:"",article_principle:"",presentations:[],presentation_id:"",presentation_units:1,stock_available:0,reserved_quantity:0,price_unit:0,quantity:1,gross_total:0,discount_type:"none",discount_value:0,discount_amount:0,total:0,price_source:"fallback",price_list_code:""}),Pn=t=>{if(!t)return"";const n=(t.name??"").toString().trim().split(" ")[0]??"",s=(t.lastname??"").toString().trim().split(" ")[0]??"",l=`${n} ${s}`.trim(),p=(t.username??"").toString().trim();return l&&p?`${l} (@${p})`:l||(p?`@${p}`:"")},Mn=t=>{if(!t)return"-";const n=(t.fullname??"").toString().trim();return n||`${t.name??""} ${t.lastname??""}`.trim()||(t.username??"").toString().trim()||"-"},ea=t=>t&&((t.username??"").toString().trim()||(t.fullname??"").toString().trim()||`${t.name??""} ${t.lastname??""}`.trim())||"-",at=t=>Number(Number(t||0).toFixed(2)),T=t=>$("<div>").text(t??"").html(),Ae=t=>{const n=Number(Number(t||0).toFixed(3));return Number.isInteger(n)?`${n}`:`${n}`.replace(/\.?0+$/,"")},ia=t=>(t==null?void 0:t.price_source)==="manual",Ja=(t,n,s=!1)=>{const l=Number((t==null?void 0:t.price_unit)||0),p=Number(n==null?void 0:n.price_unit);return!s&&ia(t)||!Number.isFinite(p)||!s&&p<=0&&l>0?l:p},Qa=(t,n,s=!1)=>!s&&ia(t)?"manual":(n==null?void 0:n.source)||(t==null?void 0:t.price_source)||"fallback",Ln=t=>{const n=`${t??""}`.replace(",",".").replace(/[^\d.]/g,"");if(!n)return"";const[s,...l]=n.split("."),p=s.replace(/^0+(?=\d)/,"")||(s||l.length?"0":""),v=l.length?`.${l.join("")}`:"";return`${p}${v}`},Xa=t=>{const n=Ln(t.target.value);return t.target.value!==n&&(t.target.value=n),Number(n||0)},Za=t=>{Number(t.target.value||0)===0&&t.target.select()},Bn=(t,n,s)=>{const l=at(t),p=Number(s||0);return!Number.isFinite(p)||p<=0||l<=0?0:n==="percent"?Math.min(l,at(l*Math.min(p,100)/100)):n==="amount"?Math.min(l,at(p)):0},_e=t=>{const n=Number(t.quantity||0),s=Number(t.price_unit||0),l=Number.isFinite(n*s)?at(n*s):0,p=Bn(l,t.discount_type,t.discount_value);return{...t,discount_type:t.discount_type||"none",discount_value:t.discount_type==="none"?0:Number(t.discount_value||0),gross_total:l,discount_amount:p,total:at(Math.max(0,l-p))}},Ft=t=>{const n=`${t??""}`.trim().toLowerCase();return n==="boleta"?"Boleta":["nota de pedido","nota_pedido","note_order"].includes(n)?"Nota de pedido":"Factura"},Gn=t=>(t==null?void 0:t.billing_documents)??(t==null?void 0:t.billingDocuments)??[],Oe=t=>Gn(t)[0]??null,ye=t=>t&&([t==null?void 0:t.series,t==null?void 0:t.sequence].filter(Boolean).join("-")||(t==null?void 0:t.code))||"",$t=t=>!!(`${(t==null?void 0:t.series)??""}`.trim()&&`${(t==null?void 0:t.sequence)??""}`.trim()),er=t=>{const n=Oe(t);return ye(n)||(t==null?void 0:t.referral_guide)||(t==null?void 0:t.guide_number)||(t==null?void 0:t.purchase_order)||"-"},Vn=t=>{var n,s,l;return((n=t==null?void 0:t.client)==null?void 0:n.full_name)??((s=t==null?void 0:t.eventual_client)==null?void 0:s.business_name)??((l=t==null?void 0:t.eventualClient)==null?void 0:l.business_name)??"-"},Un=t=>{var n,s,l;return((n=t==null?void 0:t.commercial_order)==null?void 0:n.code)??((s=t==null?void 0:t.commercialOrder)==null?void 0:s.code)??((l=t==null?void 0:t.metadata)==null?void 0:l.source_code)??"-"},ta=t=>{var n;return Ft(((n=Oe(t))==null?void 0:n.document_type)??(t==null?void 0:t.document_type))},tr=t=>{const n=(t==null?void 0:t.client)??(t==null?void 0:t.eventual_client)??(t==null?void 0:t.eventualClient)??null,s=`${(n==null?void 0:n.document_number)??""}`.trim(),l=`${(n==null?void 0:n.full_name)??(n==null?void 0:n.business_name)??""}`.trim();return[s,l].filter(Boolean).join(" | ")||"-"},zn=t=>{const n=`${(t==null?void 0:t.payment_method)??""}`.trim(),s=`${(t==null?void 0:t.payment_condition)??""}`.trim();return!n&&!s?"-":!s||n.includes("[")?n||"-":`${n||"-"} [${s.toUpperCase()}]`},ar=t=>{if(!t)return"-";const n=new Date(t);return Number.isNaN(n.getTime())?`${t}`:n.toLocaleString("es-PE",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})},ra=()=>new Date().toISOString().slice(0,10).replaceAll("-","/"),ae=()=>{const t=ra();return`${t} - ${t}`},rr=(t,n)=>new Promise((s,l)=>{const p=document.getElementById(t);if(p){p.dataset.loaded==="true"?s():p.addEventListener("load",s,{once:!0});return}const v=document.createElement("script");v.id=t,v.src=n,v.async=!0,v.onload=()=>{v.dataset.loaded="true",s()},v.onerror=l,document.body.appendChild(v)}),qn=(t,n)=>{if(document.getElementById(t))return;const s=document.createElement("link");s.id=t,s.rel="stylesheet",s.href=n,document.head.appendChild(s)},Yn=async()=>{var t,n;qn("commercial-order-daterangepicker-css","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/css/daterangepicker.css"),window.moment||await rr("commercial-order-moment-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/moment.min.js"),(n=(t=window.$)==null?void 0:t.fn)!=null&&n.daterangepicker||await rr("commercial-order-daterangepicker-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/daterangepicker.js")},fr=()=>({orders:{businessId:"",dateRange:ae(),laboratoryId:"",dispatchStatus:""},issued:{businessId:"",dateRange:ae()},cancelled:{businessId:"",dateRange:ae()},"credit-notes":{businessId:"",dateRange:ae()},visitors:{visitor:"ALICIA ASTO ASTO",dateRange:ae()},"visitors-legacy":{visitor:"",dateRange:ae()},platforms:{businessId:"",dateRange:ae()},multivende:{dateRange:ae(),orderVtex:""}}),Wn=()=>{const t=fr();return{...t,orders:{...t.orders,dateRange:""}}},nr=t=>{const n=`${t??""}`.trim();return n?n.replaceAll("/","-").slice(0,10):""},hr=t=>{const[n="",s=""]=`${t??""}`.split(/\s+-\s+/);return{start:nr(n),end:nr(s||n)}},Dt=t=>t.filter(Boolean).reduce((n,s)=>n?[n,"and",s]:s,null),sa=(t,n="created_at")=>{const{start:s,end:l}=hr(t);return Dt([s?[n,">=",`${s} 00:00:00`]:null,l?[n,"<=",`${l} 23:59:59`]:null])},Hn=t=>{const n=["document_type","<>","Nota de credito"];return t==="issued"?[[["local_status","=","sent"],"or",["local_status","=","accepted"],"or",["local_status","=","observed"],"or",["local_status","=","rejected"]],"and",n]:t==="cancelled"?[["local_status","=","cancelled"],"and",n]:t==="credit-notes"?["document_type","=","Nota de credito"]:null},Kn=(t,n)=>Dt([["source_type","=","commercial_order"],Hn(t),n!=null&&n.businessId?["business_id","=",Number(n.businessId)]:null,sa(n==null?void 0:n.dateRange,"created_at")]),Jn=t=>Dt([t!=null&&t.businessId?["business_id","=",Number(t.businessId)]:null,t!=null&&t.dispatchStatus?["dispatch_status","=",t.dispatchStatus]:null,sa(t==null?void 0:t.dateRange,"created_at")]),Qn=(t,n)=>{const s=`${(t==null?void 0:t.orderVtex)??""}`.trim();return Dt([["external_source","=",n],sa(t==null?void 0:t.dateRange,"created_at"),s?[["external_order_id","contains",s],"or",["external_checkout_id","contains",s]]:null])},aa=t=>{const n=(t==null?void 0:t.client)??(t==null?void 0:t.eventualClient)??(t==null?void 0:t.eventual_client)??null,s=`${(n==null?void 0:n.document_number)??""}`.trim(),l=`${(n==null?void 0:n.full_name)??(n==null?void 0:n.business_name)??""}`.trim();return[s,l].filter(Boolean).join(" | ")||"-"},wt=t=>`${t??""}`.toUpperCase()==="USD"?"Dolares":"Soles",ir=t=>(t==null?void 0:t.external_reference)||(t==null?void 0:t.external_id)||(t==null?void 0:t.external_status)||"-",Xn=t=>{var n,s;return((n=t==null?void 0:t.referenceDocument)==null?void 0:n.code)??((s=t==null?void 0:t.reference_document)==null?void 0:s.code)??"-"},Zn=t=>{var n,s;return(t==null?void 0:t.cancel_reason)??((n=t==null?void 0:t.metadata)==null?void 0:n.cancel_reason)??((s=t==null?void 0:t.metadata)==null?void 0:s.reason)??"-"},ei=t=>{var n,s;return((n=Oe(t))==null?void 0:n.external_status)??((s=Oe(t))==null?void 0:s.external_reference)??"-"},ti=t=>(t==null?void 0:t.external_order_id)||(t==null?void 0:t.external_checkout_id)||"-",br=t=>{var p;const n=na(t);if(n!=null&&n.delivered_at)return n.delivered_at;const l=((t==null?void 0:t.dispatchAssignments)??(t==null?void 0:t.dispatch_assignments)??[]).find(v=>{var m;return(m=v==null?void 0:v.dispatch)==null?void 0:m.delivered_at});return((p=l==null?void 0:l.dispatch)==null?void 0:p.delivered_at)??""},ai=t=>{const n=t!=null&&t.created_at?new Date(t.created_at):null,s=br(t)||(t==null?void 0:t.updated_at),l=s?new Date(s):null;if(!n||!l||Number.isNaN(n.getTime())||Number.isNaN(l.getTime()))return"-";const p=Math.max(0,Math.round((l-n)/6e4)),v=Math.floor(p/1440),m=Math.floor(p%1440/60);return v>0?`${v}d ${m}h`:m>0?`${m}h ${p%60}m`:`${p}m`},F=(t,n="")=>{if(t==null)return n;if(typeof t=="object")return t.address??t.reference??t.name??t.description??n;const s=`${t}`;return s==="[object Object]"?n:s},ri=t=>`${t??""}`.toUpperCase().includes("CREDITO")?"Credito":"Contado",ni=t=>{const n=`${t??""}`.trim();return n?n.toUpperCase()==="TRANSFERENCIA"?"TRANSFERENCIA [CONTADO]":n:"EFECTIVO [CONTADO]"},ii=t=>F(t==null?void 0:t.full_address,F(t==null?void 0:t.address,F(t==null?void 0:t.fiscal_address))),si=t=>F(t==null?void 0:t.ubigeo,F(t==null?void 0:t.district_ubigeo,F(t==null?void 0:t.inei_ubigeo))),sr=t=>{const n=`${t??""}`.trim(),s=n.match(/^(client|eventual)-(\d+)$/);return s?s[2]:n},lr=t=>{var m,_,E;if(t.loading)return t.text;const n=t.data??{},s=t.text||n.name||"",l=(m=n.branch)==null?void 0:m.name,p=(E=(_=n.branch)==null?void 0:_.business)==null?void 0:E.name,v=$("<span>").text(s);return l&&v.append($("<small>").addClass("text-muted ms-1").text(`- ${l}`)),p&&v.append($("<small>").addClass("text-muted ms-1").text(`(${p})`)),v},te=t=>{if(!(t!=null&&t.current))return;const n=$(t.current);n.empty().val(null),n.trigger(n.data("select2")?"change.select2":"change")},li=t=>t.article_id?"Unidad base":"Sin presentacion",ci=(t,n)=>{const s=(t==null?void 0:t.name)||"Presentacion",l=Ae((t==null?void 0:t.units)||1),p=n!=null&&n.article_unit?` ${n.article_unit}`:" unidad(es) base";return`${s} (${l}${p})`},oi=t=>["Factura","Boleta"].includes(Ft(t)),cr=(t,n)=>{const s=Number(t||0);if(!oi(n))return{subtotal:Number(s.toFixed(2)),taxAmount:0,total:Number(s.toFixed(2))};const l=Number((s/1.18).toFixed(2));return{subtotal:l,taxAmount:Number((s-l).toFixed(2)),total:Number(s.toFixed(2))}},di=(t,n="")=>{const s=new Map;return(t??[]).flatMap(l=>{if(!(l!=null&&l.article_id))return[];const p=`${l.article_id}:${l.warehouse_id||n||""}`,v=Number(l.quantity||0),m=Number(l.presentation_units||1)||1,_=Number((v*m).toFixed(3)),E=Number(l.stock_available||0),G=Number(s.get(p)||0),I=Math.max(0,E-G),w=Math.min(_,I),V=Math.max(0,_-w);return s.set(p,G+w),V<=1e-4?[]:[{article:l.article_name||l.article_label||l.article_code||"Articulo",quantity:_,lineQuantity:v,presentationUnits:m,available:I,shortage:V}]})},kt=t=>(t==null?void 0:t.referral_guides)??(t==null?void 0:t.referralGuides)??[],xr=t=>(t==null?void 0:t.external_reference)||[t==null?void 0:t.series,t==null?void 0:t.sequence].filter(Boolean).join("-")||(t==null?void 0:t.code)||"-",ui=t=>t&&!["accepted","cancelled"].includes(t.guide_status),mi=t=>(t==null?void 0:t.delivery_evidences)??(t==null?void 0:t.deliveryEvidences)??[],na=t=>mi(t)[0]??null,pi=t=>(t==null?void 0:t.tracking_events)??(t==null?void 0:t.trackingEvents)??[],or=t=>{const n=`${t??""}`.trim();return n.startsWith("blob:")||n.startsWith("data:image/")||/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(n)||n.includes("/delivery-evidence-media/")},dr=()=>{const t=new Date;return t.setMinutes(t.getMinutes()-t.getTimezoneOffset()),t.toISOString().slice(0,16)},Rt={lat:-12.046374,lng:-77.042793},re=t=>{const n=Number(t);return Number.isFinite(n)?n:null},St=t=>{const n=re(t);return n===null?"":n.toFixed(7)},ne=t=>re(t==null?void 0:t.lat)!==null&&re(t==null?void 0:t.lng)!==null,fi=({modalRef:t,position:n,searchText:s,onPositionChange:l,onSearchTextChange:p,onAddressSelected:v,googleMapsApiKey:m})=>{const _=c.useRef(),[E,G]=c.useState(!1),[I,w]=c.useState(""),[V,ie]=c.useState([]),Z=ne(n)?{lat:re(n.lat),lng:re(n.lng)}:Rt,A=(b,k=17)=>{const Y=re(b==null?void 0:b.lat),W=re(b==null?void 0:b.lng);Y===null||W===null||!_.current||(_.current.setCenter({lat:Y,lng:W}),_.current.setZoom(k))},he=b=>{l(b),A(b)};c.useEffect(()=>{if(ne(n)){A(Z);return}A(Rt,13)},[n==null?void 0:n.lat,n==null?void 0:n.lng]),c.useEffect(()=>{const b=t==null?void 0:t.current;if(!b)return;const k=()=>{setTimeout(()=>{ne(n)?A(Z):A(Rt,13)},180)};return $(b).on("shown.bs.modal",k),()=>$(b).off("shown.bs.modal",k)},[t,n==null?void 0:n.lat,n==null?void 0:n.lng]);const je=async()=>{var k,Y;const b=`${s??""}`.trim();if(!b){ie([]),w("Escribe una direccion para buscar.");return}if(!((Y=(k=window.google)==null?void 0:k.maps)!=null&&Y.Geocoder)){w("Google Maps aun no termino de cargar.");return}G(!0),w("");try{new window.google.maps.Geocoder().geocode({address:`${b}, Peru`,componentRestrictions:{country:"PE"},region:"PE"},(se,Ne)=>{if(G(!1),Ne!=="OK"||!Array.isArray(se)||se.length===0){ie([]),w("Sin resultados. Puedes marcar el punto manualmente en el mapa.");return}ie(se.slice(0,5).map(L=>({place_id:L.place_id,display_name:L.formatted_address,lat:L.geometry.location.lat(),lng:L.geometry.location.lng()})))})}catch(W){G(!1),w(`${W.message}. Puedes marcar el punto manualmente en el mapa.`),ie([])}},Pe=b=>{const k={lat:re(b.lat),lng:re(b.lng)};l(k),p(b.display_name??""),v(b.display_name??""),A(k),ie([])};return a.jsxs("div",{className:"commercial-order-map-picker",children:[a.jsxs("div",{className:"commercial-order-map-search",children:[a.jsxs("div",{children:[a.jsx("label",{className:"form-label",children:"Buscar direccion en mapa"}),a.jsxs("div",{className:"input-group",children:[a.jsx("input",{type:"text",className:"form-control",value:s,onChange:b=>p(b.target.value),onKeyDown:b=>{b.key==="Enter"&&(b.preventDefault(),je())},placeholder:"Ej. Av. Javier Prado 123, San Isidro"}),a.jsx("button",{type:"button",className:"btn btn-outline-primary",onClick:je,disabled:E,children:E?"Buscando...":"Buscar"})]})]}),a.jsxs("div",{className:"commercial-order-map-coordinates",children:[a.jsx("label",{className:"form-label",children:"Coordenadas"}),a.jsxs("div",{className:"commercial-order-map-coordinate-values",children:[a.jsx("span",{children:St(n==null?void 0:n.lat)||"-"}),a.jsx("span",{children:St(n==null?void 0:n.lng)||"-"})]})]})]}),V.length>0&&a.jsx("div",{className:"commercial-order-map-results",children:V.map(b=>a.jsx("button",{type:"button",className:"commercial-order-map-result",onClick:()=>Pe(b),children:b.display_name},`${b.place_id}-${b.lat}-${b.lng}`))}),I&&a.jsx("small",{className:"text-muted d-block mt-1",children:I}),a.jsx(Cn,{googleMapsApiKey:m,language:"es",region:"PE",onError:()=>w("No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio."),children:a.jsx(wn,{mapContainerClassName:"commercial-order-map-canvas",center:Z,zoom:ne(n)?17:13,options:{clickableIcons:!0,fullscreenControl:!0,gestureHandling:"greedy",mapTypeControl:!0,scrollwheel:!0,streetViewControl:!1},onLoad:b=>{_.current=b,setTimeout(()=>{ne(n)?A(Z):A(Rt,13)},120)},onClick:b=>{const k={lat:b.latLng.lat(),lng:b.latLng.lng()};he(k)},children:ne(n)&&a.jsx(Rn,{position:Z,draggable:!0,onDragEnd:b=>he({lat:b.latLng.lat(),lng:b.latLng.lng()})})})}),a.jsx("small",{className:"text-muted d-block mt-2",children:"Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega."})]})},hi=t=>{const n=`${Nn.GMAPS_API_KEY??""}`.trim();return n?a.jsx(fi,{...t,googleMapsApiKey:n}):a.jsx("div",{className:"commercial-order-map-picker",children:a.jsx("div",{className:"commercial-order-map-empty",children:"Configura Google Maps API Key en Sistemas > Datos generales > Integraciones para habilitar el mapa."})})},bi=t=>!t||t.status===null||`${t.order_status??""}`=="cancelled"?!1:`${t.dispatch_status??"pending"}`=="pending",xi=t=>!t||t.status===null||t.status===!1||t.status===0?!1:!["draft","cancelled"].includes(`${t.order_status??""}`),gr=t=>{if(!t)return!1;const n=`${t.local_status??""}`;return["accepted","observed","cancelled"].includes(n)||!!t.external_id},gi=t=>{const n=Oe(t);return n?gr(n)?{icon:"mdi mdi-file-document-check-outline",title:`Descargar PDF del comprobante ${ye(n)||n.code}`}:$t(n)?{icon:"mdi mdi-printer",title:`Emitir o imprimir comprobante ${ye(n)||n.code}`}:{icon:"mdi mdi-send",title:`Emitir comprobante ${ye(n)||n.code}`}:{icon:"mdi mdi-file-send-outline",title:"Generar comprobante de venta para este pedido"}},vi=t=>{if(!t)return[];const n=pi(t).map(m=>({date:m.happened_at??m.created_at,status:[m.title,m.description].filter(Boolean).join(" - ")})),s=[{date:t.created_at,status:"La orden ingreso en el sistema"}];t.approved_at&&["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)?s.push({date:t.approved_at,status:"La orden paso a preparacion"}):t.approved_at&&t.order_status==="confirmed"?s.push({date:t.approved_at,status:"La orden fue confirmada"}):["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)&&s.push({date:t.updated_at,status:"La orden paso a preparacion"});const l=(t.dispatch_assignments??t.dispatchAssignments??[]).filter(m=>(m==null?void 0:m.status)!==!1&&(m==null?void 0:m.status)!==0&&(m==null?void 0:m.dispatch)).sort((m,_)=>{var E,G,I,w;return new Date(((E=m==null?void 0:m.dispatch)==null?void 0:E.departed_at)||((G=m==null?void 0:m.dispatch)==null?void 0:G.scheduled_date)||0)-new Date(((I=_==null?void 0:_.dispatch)==null?void 0:I.departed_at)||((w=_==null?void 0:_.dispatch)==null?void 0:w.scheduled_date)||0)}),p=l.find(m=>{var _;return["in_route","delivered","closed"].includes((_=m==null?void 0:m.dispatch)==null?void 0:_.dispatch_status)});p?(s.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:`Manifiesto ${p.dispatch.manifest_code||p.dispatch.code||""}`.trim()}),s.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:"El pedido salio en ruta"})):t.dispatch_status==="in_route"&&s.push({date:t.updated_at,status:"El pedido salio en ruta"}),(t.dispatch_status==="dispatched"||l.some(m=>{var _;return((_=m==null?void 0:m.dispatch)==null?void 0:_.dispatch_status)==="dispatched"}))&&s.push({date:t.updated_at,status:"El pedido paso a despacho"}),kt(t).forEach(m=>{s.push({date:m.issue_date??m.created_at??t.updated_at,status:`Guia de remision ${xr(m)} - ${mr(m.guide_status)}`})});const v=l.find(m=>{var _;return["delivered","closed"].includes((_=m==null?void 0:m.dispatch)==null?void 0:_.dispatch_status)});return v?s.push({date:v.dispatch.delivered_at??v.dispatch.updated_at??v.dispatch.created_at,status:"El pedido fue entregado"}):t.dispatch_status==="delivered"&&s.push({date:t.updated_at,status:"El pedido fue entregado"}),(t.order_status==="cancelled"||t.dispatch_status==="cancelled")&&s.push({date:t.updated_at,status:"El pedido fue cancelado"}),[...n,...s].filter(m=>m.date).sort((m,_)=>new Date(m.date)-new Date(_.date))},_i=({title:t,config:n})=>{const s=(n==null?void 0:n.pageSize)??20;return a.jsx("div",{className:"row",children:a.jsx("div",{className:"col-12",children:a.jsxs("div",{className:"card",children:[a.jsx("div",{className:"card-header",children:t}),a.jsxs("div",{className:"card-body",children:[a.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[a.jsxs("div",{className:"d-flex align-items-center gap-2",children:[a.jsx("label",{className:"form-label mb-0",children:"Elementos :"}),a.jsx("select",{className:"form-select form-select-sm commercial-order-page-size",defaultValue:s,children:[10,20,25,50].map(l=>a.jsx("option",{value:l,children:l},`commercial-list-size-${l}`))})]}),a.jsxs("div",{className:"d-flex align-items-center gap-2",children:[a.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),a.jsx("input",{className:"form-control form-control-sm commercial-order-list-search"})]})]}),((n==null?void 0:n.exports)??[]).length>0&&a.jsx("div",{className:"d-flex flex-wrap gap-1 mb-2",children:n.exports.map(l=>a.jsx("button",{type:"button",className:"btn btn-sm btn-light",children:l},`commercial-list-export-${l}`))}),a.jsx("div",{className:"table-responsive commercial-order-legacy-table",children:a.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[a.jsx("thead",{children:a.jsx("tr",{children:((n==null?void 0:n.headers)??[]).map(l=>a.jsx("th",{children:l},`commercial-list-header-${l}`))})}),a.jsx("tbody",{children:a.jsx("tr",{children:a.jsx("td",{colSpan:((n==null?void 0:n.headers)??[]).length||1,className:"text-muted",children:"No existen elementos"})})})]})}),a.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2",children:[a.jsx("span",{className:"text-muted",children:"No hay elementos a mostrar"}),a.jsxs("div",{className:"d-flex align-items-center gap-2 text-muted",children:[a.jsx("span",{children:"Anterior"}),a.jsx("button",{type:"button",className:"btn btn-sm btn-light active",children:"1"}),a.jsx("span",{children:"Siguiente"})]})]})]})]})})})},yi=({requiredPermission:t="orders",externalSource:n=null,pageTitle:s="Pedidos comerciales"})=>{var Oa;M.externalSource=null;const l=c.useRef(),p=c.useRef(),v=c.useRef(),m=c.useRef(),_=c.useRef(),E=c.useRef(),G=c.useRef(),I=c.useRef(),w=c.useRef(),V=c.useRef(),ie=c.useRef(),Z=c.useRef(),A=c.useRef(),he=c.useRef(),je=c.useRef(),Pe=c.useRef(),b=c.useRef(),k=c.useRef(),Y=c.useRef(),W=c.useRef(),se=c.useRef(),Ne=c.useRef(),L=c.useRef(),rt=c.useRef(),vr=c.useRef(),nt=c.useRef(),it=c.useRef(),Me=c.useRef(),st=c.useRef(),lt=c.useRef(),ct=c.useRef(),ot=c.useRef(),dt=c.useRef(),ut=c.useRef(),mt=c.useRef(),pt=c.useRef(),_r=c.useRef(),H=c.useRef(),Ce=c.useRef(),le=c.useRef(),we=c.useRef(),Re=c.useRef(),ft=c.useRef(),Tt=c.useRef({}),[yr,jr]=c.useState(!1),[$e,la]=c.useState(""),[K,ht]=c.useState(""),[J,bt]=c.useState(""),[ke,Et]=c.useState(""),[Fe,It]=c.useState(""),[Q,Le]=c.useState(""),[Nr,be]=c.useState(""),[At,Ot]=c.useState({lat:"",lng:""}),[Cr,xt]=c.useState(""),[wr,ca]=c.useState([]),[Be,gt]=c.useState([]),[ji,Se]=c.useState([]),[ee,X]=c.useState([tt()]),[Ge,oa]=c.useState("Factura"),[ce,Pt]=c.useState(null),[da,Rr]=c.useState(null),[De,$r]=c.useState(null),[ua,Mt]=c.useState(null),[xe,Lt]=c.useState(""),[Bt,kr]=c.useState([]),[Gt,ma]=c.useState(""),[Vt,pa]=c.useState(!1),[C,Fr]=c.useState(n?"multivende":"orders"),[Sr,Dr]=c.useState([]),[Tr,Er]=c.useState([]),[fa,Ir]=c.useState(fr()),[Ve,Ar]=c.useState(Wn()),[R,Ut]=c.useState({recipient_name:"",recipient_document_type:"DNI",recipient_document_number:"",recipient_phone:"",delivered_at:dr(),evidence_notes:"",evidence_url:"",latitude:"",longitude:""}),Or=c.useMemo(()=>{const e=new ur;return e.externalSource=n||Ha,e},[n]),vt=Nt.find(e=>e.id===C)??Nt[0],Ue=fa[C]??{},ha=Ve[C]??{},Pr=c.useMemo(()=>Jn(Ve.orders),[Ve.orders]),Mr=c.useMemo(()=>Kn(C,ha),[C,ha]),Lr=c.useMemo(()=>Qn(Ve.multivende,n||Ha),[Ve.multivende,n]),Br=c.useMemo(()=>{var r;const e=new URLSearchParams;return $e&&e.append("business_id",$e),K&&e.append("business_branch_id",K),J&&e.append("warehouse_id",J),ke&&e.append("client_id",ke),Fe&&e.append("eventual_client_id",Fe),Q&&e.append("client_distribution_network_id",Q),(r=L.current)!=null&&r.value&&e.append("issue_date",L.current.value),`/api/admin/commercial-orders/articles?${e.toString()}`},[$e,K,J,ke,Fe,Q]),Gr=c.useMemo(()=>K?["business_branch_id","=",Number(K)]:null,[K]);c.useEffect(()=>()=>{xe!=null&&xe.startsWith("blob:")&&URL.revokeObjectURL(xe)},[xe]),c.useEffect(()=>{let e=!0;return Promise.all([fe.getBusinesses(),M.getLaboratories()]).then(([r,i])=>{e&&(Dr(r),Er(i))}),()=>{e=!1}},[]),c.useEffect(()=>{if(!ce)return;const e=()=>Pt(null),r=i=>{i.key==="Escape"&&e()};return document.addEventListener("click",e),document.addEventListener("keydown",r),window.addEventListener("resize",e),window.addEventListener("scroll",e,!0),()=>{document.removeEventListener("click",e),document.removeEventListener("keydown",r),window.removeEventListener("resize",e),window.removeEventListener("scroll",e,!0)}},[ce]);const ba=e=>(Tt.current[e]||(Tt.current[e]=c.createRef()),Tt.current[e]);c.useEffect(()=>{ee.forEach(e=>{const r=ba(e.uid);!r.current||!e.article_id||!e.article_label||`${$(r.current).val()}`==`${e.article_id}`||Ee(r.current,e.article_id,e.article_label)})},[ee]);const xa=async(e,r=null)=>{if(!e){ca([]),ht("");return}const u=(await M.getBranchesByBusiness(e)??[]).filter(d=>d.status!==null);if(ca(u),r&&u.some(d=>`${d.id}`==`${r}`)){ht(`${r}`);return}ht("")},ga=e=>{if(!e)return;const r=ii(e),i=si(e);r&&H.current&&(H.current.value=r),i&&le.current&&(le.current.value=i),r&&xt(r)},va=async(e,r=null,i=null)=>{var g;if(!e){gt([]),Le(""),Se([]),be("");return}const d=(await M.getDistributionNetworks(e)??[]).filter(f=>f.status!==null);gt(d);const o=r||((g=d.find(f=>f.is_default))==null?void 0:g.id);if(o&&d.some(f=>`${f.id}`==`${o}`)){Le(`${o}`),await _a(o,null,d);return}Le(""),Se([]),be(""),ga(i)},_a=async(e,r=null,i=null)=>{var f,y;if(!e){Se([]),be("");return}let u=[];const d=(i??Be).find(h=>`${h.id}`==`${e}`);(((f=d==null?void 0:d.addresses)==null?void 0:f.length)??0)>0?u=d.addresses:u=await M.getDeliveryAddresses(e);const o=(u??[]).filter(h=>h.status!==null);Se(o);const g=r||((y=o.find(h=>h.is_default))==null?void 0:y.id);if(g&&o.some(h=>`${h.id}`==`${g}`)){be(`${g}`),Vr(o.find(h=>`${h.id}`==`${g}`));return}be("")},Vr=e=>{e&&(H.current&&(H.current.value=F(e.address)),Ce.current&&(Ce.current.value=F(e.reference)),le.current&&(le.current.value=F(e.ubigeo)),we.current&&(we.current.value=F(e.contact_name)),Re.current&&(Re.current.value=F(e.contact_phone)),xt(F(e.address)),ne({lat:e.latitude,lng:e.longitude})&&Ot({lat:Number(e.latitude),lng:Number(e.longitude)}))},ya=async(e,r={})=>{var o,g,f;const i=r.article_id??e.article_id,u=Number(r.quantity??e.quantity??0),d=r.presentation_id??e.presentation_id;return!i||!J||u<=0?null:await M.resolvePrice({article_id:i,presentation_id:d||null,quantity:u,business_id:$e||null,business_branch_id:K||null,warehouse_id:J||null,client_id:ke||null,eventual_client_id:Fe||null,client_distribution_network_id:Q||null,issue_date:((o=L.current)==null?void 0:o.value)||null,commercial_channel:((g=Be.find(y=>`${y.id}`==`${Q}`))==null?void 0:g.commercial_channel)||null,segment:((f=Be.find(y=>`${y.id}`==`${Q}`))==null?void 0:f.segment)||null})},zt=async(e=null)=>{const r=e??ee;for(const i of r){if(!i.article_id)continue;const u=await ya(i);u&&X(d=>d.map(o=>o.uid!==i.uid?o:_e({...o,stock_available:Number(u.stock_available||0),price_unit:Ja(o,u),price_source:Qa(o,u),price_list_code:u.price_list_code||""})))}},ja=e=>{e==="regular"?(It(""),te(W)):e==="eventual"&&(Et(""),gt([]),Le(""),Se([]),be(""),te(Y))},qt=async(e=null)=>{var f,y,h,S;jr(!!(e!=null&&e.id)),he.current&&(he.current.value=(e==null?void 0:e.id)??""),je.current&&(je.current.value=(e==null?void 0:e.code)??"Se genera al guardar"),L.current&&(L.current.value=e!=null&&e.issue_date?e.issue_date.toString().slice(0,10):new Date().toISOString().slice(0,10)),rt.current&&(rt.current.value=e!=null&&e.promised_delivery_at?e.promised_delivery_at.toString().slice(0,10):""),oa(Ft((e==null?void 0:e.document_type)??"Factura")),nt.current&&(nt.current.value=(e==null?void 0:e.currency)??"PEN"),it.current&&(it.current.value=(e==null?void 0:e.payment_condition)??"Contado"),Me.current&&(Me.current.value=ni(e==null?void 0:e.payment_method)),ot.current&&(ot.current.value=(e==null?void 0:e.installments)??1),dt.current&&(dt.current.value=e!=null&&e.first_due_date?e.first_due_date.toString().slice(0,10):""),ut.current&&(ut.current.value=(e==null?void 0:e.order_status)??(e!=null&&e.external_source?"pending":"draft")),mt.current&&(mt.current.value=(e==null?void 0:e.dispatch_status)??"pending"),pt.current&&(pt.current.value=(e==null?void 0:e.billing_status)??"pending"),H.current&&(H.current.value=F(e==null?void 0:e.delivery_address)),Ce.current&&(Ce.current.value=F(e==null?void 0:e.delivery_reference)),le.current&&(le.current.value=F(e==null?void 0:e.ubigeo)),we.current&&(we.current.value=F(e==null?void 0:e.dispatch_contact_name)),Re.current&&(Re.current.value=F(e==null?void 0:e.dispatch_contact_phone)),st.current&&(st.current.value=(e==null?void 0:e.purchase_order)??""),lt.current&&(lt.current.value=(e==null?void 0:e.guide_number)??""),ct.current&&(ct.current.value=(e==null?void 0:e.referral_guide)??""),Ne.current&&(Ne.current.value=(e==null?void 0:e.doctor_name)??""),ft.current&&(ft.current.value=(e==null?void 0:e.observations)??""),Ot({lat:ne({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lat):"",lng:ne({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lng):""}),xt(F(e==null?void 0:e.delivery_address));const r=e!=null&&e.business_id?`${e.business_id}`:"",i=e!=null&&e.warehouse_id?`${e.warehouse_id}`:"",u=e!=null&&e.client_id?`${e.client_id}`:"",d=e!=null&&e.eventual_client_id?`${e.eventual_client_id}`:"";la(r),bt(i),Et(u),It(d),r&&((f=e==null?void 0:e.business)!=null&&f.name)?Ee(Pe.current,r,e.business.name):te(Pe),i&&((y=e==null?void 0:e.warehouse)!=null&&y.name)?Ee(k.current,i,e.warehouse.name):te(k),u&&((h=e==null?void 0:e.client)!=null&&h.full_name)?Ee(Y.current,u,`${e.client.document_number??""} - ${e.client.full_name}`.trim()):te(Y),d&&((S=e==null?void 0:e.eventual_client)!=null&&S.business_name)?Ee(W.current,d,`${e.eventual_client.document_number??""} - ${e.eventual_client.business_name}`.trim()):te(W),e!=null&&e.seller_id&&(e!=null&&e.seller)?Ee(se.current,e.seller_id,Pn(e.seller)):te(se);const o=((e==null?void 0:e.items)??[]).map(j=>{var de,ue,me,pe,N,D,ze,qe,Ye,We,He,Ke,Je,Qe,Xe,Ze;const x=j.article??null,q=((x==null?void 0:x.presentations)??[]).filter(O=>(O==null?void 0:O.status)!==!1&&(O==null?void 0:O.status)!==0),B=j.presentation??q[0]??null,ve=Number(j.presentation_units??(B==null?void 0:B.units)??1)||1;return _e({uid:crypto.randomUUID(),article_id:j.article_id?`${j.article_id}`:"",article_label:x?`${x.code??""} - ${x.name??""}`.trim():"",article_code:(x==null?void 0:x.code)??j.external_sku??"",article_lot:(x==null?void 0:x.default_lot)??"",article_name:(x==null?void 0:x.name)??"",article_unit:((de=x==null?void 0:x.unit)==null?void 0:de.symbol)??((ue=x==null?void 0:x.unit)==null?void 0:ue.name)??"",article_laboratory:((me=x==null?void 0:x.laboratory)==null?void 0:me.name)??"",article_principle:((pe=x==null?void 0:x.activePrinciple)==null?void 0:pe.name)??((N=x==null?void 0:x.active_principle)==null?void 0:N.name)??"",presentations:q.map(O=>({id:`${O.id}`,name:O.name??"Presentacion",units:Number(O.units||1),price:Number(O.price||0)})),presentation_id:B!=null&&B.id?`${B.id}`:"",presentation_units:ve,stock_available:Number(j.stock_available||0),reserved_quantity:Number(j.reserved_quantity||0),price_unit:Number(j.price_unit||0),quantity:Number(j.quantity||1),discount_type:((ze=(D=j.external_payload)==null?void 0:D.commercial_form)==null?void 0:ze.discount_type)??"none",discount_value:Number(((Ye=(qe=j.external_payload)==null?void 0:qe.commercial_form)==null?void 0:Ye.discount_value)||0),discount_amount:Number(((He=(We=j.external_payload)==null?void 0:We.commercial_form)==null?void 0:He.discount_amount)||0),gross_total:Number(((Je=(Ke=j.external_payload)==null?void 0:Ke.commercial_form)==null?void 0:Je.gross_total)||0),total:Number(j.total||0),price_source:j.price_source||"fallback",price_list_code:((Xe=(Qe=j==null?void 0:j.price_list_item)==null?void 0:Qe.price_list)==null?void 0:Xe.code)||((Ze=e==null?void 0:e.price_list)==null?void 0:Ze.code)||""})}),g=o.length?o:[tt()];X(g),$(m.current).modal("show"),await xa((e==null?void 0:e.business_id)??null,(e==null?void 0:e.business_branch_id)??null),u?(await va(u,(e==null?void 0:e.client_distribution_network_id)??null),e!=null&&e.client_distribution_network_id&&await _a(e.client_distribution_network_id,(e==null?void 0:e.client_delivery_address_id)??null)):(gt([]),Le(""),Se([]),be(""))},Ur=async e=>{var d,o,g,f,y,h,S,j,x,q,B,ve,de,ue,me,pe,N,D,ze,qe,Ye,We,He,Ke,Je,Qe,Xe,Ze,O,Pa,Ma,La,Ba;e.preventDefault();const r={id:((d=he.current)==null?void 0:d.value)||void 0,external_source:n||void 0,business_id:$e||null,business_branch_id:K||null,warehouse_id:J||null,client_id:ke||null,eventual_client_id:Fe||null,seller_id:((o=se.current)==null?void 0:o.value)||null,client_distribution_network_id:Q||null,client_delivery_address_id:Nr||null,document_type:Ge,currency:((g=nt.current)==null?void 0:g.value)||"PEN",payment_condition:ri(((f=Me.current)==null?void 0:f.value)||((y=it.current)==null?void 0:y.value)||"Contado"),payment_method:((h=Me.current)==null?void 0:h.value)||"",purchase_order:((j=(S=st.current)==null?void 0:S.value)==null?void 0:j.trim())||"",guide_number:((q=(x=lt.current)==null?void 0:x.value)==null?void 0:q.trim())||"",referral_guide:((ve=(B=ct.current)==null?void 0:B.value)==null?void 0:ve.trim())||"",doctor_name:((ue=(de=Ne.current)==null?void 0:de.value)==null?void 0:ue.trim())||"",issue_date:((me=L.current)==null?void 0:me.value)||"",promised_delivery_at:((pe=rt.current)==null?void 0:pe.value)||null,installments:((N=ot.current)==null?void 0:N.value)||1,first_due_date:((D=dt.current)==null?void 0:D.value)||null,order_status:((ze=ut.current)==null?void 0:ze.value)||(n?"pending":"draft"),dispatch_status:((qe=mt.current)==null?void 0:qe.value)||"pending",billing_status:((Ye=pt.current)==null?void 0:Ye.value)||"pending",tax_amount:Ht.taxAmount,delivery_address:((He=(We=H.current)==null?void 0:We.value)==null?void 0:He.trim())||"",delivery_reference:((Je=(Ke=Ce.current)==null?void 0:Ke.value)==null?void 0:Je.trim())||"",ubigeo:((Xe=(Qe=le.current)==null?void 0:Qe.value)==null?void 0:Xe.trim())||"",map_lat:St(At.lat)||null,map_lng:St(At.lng)||null,dispatch_contact_name:((O=(Ze=we.current)==null?void 0:Ze.value)==null?void 0:O.trim())||"",dispatch_contact_phone:((Ma=(Pa=Re.current)==null?void 0:Pa.value)==null?void 0:Ma.trim())||"",observations:((Ba=(La=ft.current)==null?void 0:La.value)==null?void 0:Ba.trim())||"",items:ee.map(P=>({article_id:P.article_id||null,presentation_id:P.presentation_id||null,warehouse_id:J||null,stock_available:P.stock_available,reserved_quantity:P.reserved_quantity,presentation_units:P.presentation_units,price_unit:P.price_unit,quantity:P.quantity,gross_total:P.gross_total,discount_type:P.discount_type,discount_value:P.discount_value,discount_amount:P.discount_amount,total:P.total,status:!0}))},i=di(ee,J);if(i.length>0){const P=`
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${i.map(Te=>`<li><strong>${T(Te.article)}</strong>: faltan ${Ae(Te.shortage)} unidad(es) base para completar ${Ae(Te.quantity)}. Cantidad: ${Ae(Te.lineQuantity)} x ${Ae(Te.presentationUnits)}. Disponible: ${Ae(Te.available)}.</li>`).join("")}
          </ul>
        </div>
      `,{isConfirmed:gn}=await U.fire({title:"Stock insuficiente",html:P,icon:"warning",showCancelButton:!0,confirmButtonText:"Crear de todas formas",cancelButtonText:"Revisar pedido"});if(!gn)return;r.allow_stock_shortage=!0}await M.save(r)&&($(l.current).dxDataGrid("instance").refresh(),$(m.current).modal("hide"))},zr=async e=>{const r=e.target.value||"";la(r),bt(""),te(k),await xa(r,null)},qr=e=>{const r=e.target.value||"";ht(r),bt(""),te(k)},Yr=async e=>{const r=e.target.value||"";bt(r),await zt()},Wr=async e=>{var u,d;const r=sr(e.target.value),i=((d=(u=$(e.target).select2("data"))==null?void 0:u[0])==null?void 0:d.data)??null;Et(r),ja("regular"),ga(i),await va(r,null,i),await zt()},Hr=async e=>{const r=sr(e.target.value);It(r),ja("eventual"),await zt()},ge=(e,r,i)=>{Ir(u=>({...u,[e]:{...u[e]??{},[r]:i}}))},Na=(e=C)=>{var i;const r=e==="multivende"?v:((i=Nt.find(u=>u.id===e))==null?void 0:i.kind)==="billing"?p:l;return r.current?$(r.current).dxDataGrid("instance"):null},Ca=(e=C)=>{const r=Na(e);r&&r.refresh()},wa=(e=C)=>{const r=fa[e]??{};e==="orders"&&M.setFilters({laboratory_id:r.laboratoryId||""}),Ar(i=>({...i,[e]:r})),setTimeout(()=>Ca(e),0)},Kr=e=>{var r;(r=e==null?void 0:e.preventDefault)==null||r.call(e),wa(C)},Ra=(e=!1)=>{const r=C;e&&wa(r),setTimeout(()=>{const i=Na(r);i!=null&&i.exportToExcel&&i.exportToExcel(!1)},e?350:0)},Jr=async({id:e,field:r,value:i})=>{await M.boolean({id:e,field:r,value:i})&&$(l.current).dxDataGrid("instance").refresh()},$a=e=>{Rr(e),$(ie.current).modal("show")},Qr=e=>{const r=na(e);$r(e),Mt(null),Lt(or(r==null?void 0:r.evidence_url)?r.evidence_url:""),Ut({recipient_name:(r==null?void 0:r.recipient_name)??(e==null?void 0:e.dispatch_contact_name)??"",recipient_document_type:(r==null?void 0:r.recipient_document_type)??"DNI",recipient_document_number:(r==null?void 0:r.recipient_document_number)??"",recipient_phone:(r==null?void 0:r.recipient_phone)??(e==null?void 0:e.dispatch_contact_phone)??"",delivered_at:r!=null&&r.delivered_at?`${r.delivered_at}`.replace(" ","T").slice(0,16):dr(),evidence_notes:(r==null?void 0:r.evidence_notes)??"",evidence_url:(r==null?void 0:r.evidence_url)??"",latitude:(r==null?void 0:r.latitude)??"",longitude:(r==null?void 0:r.longitude)??""}),navigator.geolocation&&navigator.geolocation.getCurrentPosition(i=>{Ut(u=>({...u,latitude:u.latitude||i.coords.latitude,longitude:u.longitude||i.coords.longitude}))},()=>{},{enableHighAccuracy:!0,timeout:5e3}),setTimeout(()=>{A.current&&(A.current.value="")},0),$(Z.current).modal("show")},Xr=e=>{var i;const r=((i=e.target.files)==null?void 0:i[0])??null;Mt(r),Lt(r?URL.createObjectURL(r):or(R.evidence_url)?R.evidence_url:"")},oe=(e,r)=>Ut(i=>({...i,[e]:r})),Zr=async e=>{if(e.preventDefault(),!(De!=null&&De.id))return;const r=(De.dispatch_assignments??De.dispatchAssignments??[]).filter(d=>(d==null?void 0:d.status)!==!1&&(d==null?void 0:d.status)!==0&&(d==null?void 0:d.dispatch)).sort((d,o)=>{var g,f;return new Date(((g=o==null?void 0:o.dispatch)==null?void 0:g.scheduled_date)||(o==null?void 0:o.created_at)||0)-new Date(((f=d==null?void 0:d.dispatch)==null?void 0:f.scheduled_date)||(d==null?void 0:d.created_at)||0)})[0],i=new FormData;r!=null&&r.dispatch_id&&i.append("dispatch_id",r.dispatch_id),i.append("recipient_name",R.recipient_name??""),i.append("recipient_document_type",R.recipient_document_type??"DNI"),i.append("recipient_document_number",R.recipient_document_number??""),i.append("recipient_phone",R.recipient_phone??""),i.append("delivered_at",R.delivered_at??""),i.append("evidence_notes",R.evidence_notes??""),i.append("evidence_url",R.evidence_url??""),i.append("latitude",R.latitude??""),i.append("longitude",R.longitude??""),ua&&i.append("evidence_file",ua),await M.saveDeliveryEvidence(De.id,i)&&(Mt(null),Lt(""),A.current&&(A.current.value=""),$(Z.current).modal("hide"),$(l.current).dxDataGrid("instance").refresh())},ka=async e=>{const r=kt(e)[0];if(r){if(ui(r)){const u=await U.fire({title:"Guia de remision",text:`La guia ${xr(r)} esta ${mr(r.guide_status).toLowerCase()}.`,icon:"question",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Ver PDF",cancelButtonText:"Cancelar"});if(u.isConfirmed){const d=await Wa.issue(r.id);if(!(d!=null&&d.data))return;$(l.current).dxDataGrid("instance").refresh(),await yt(jt.referralGuide(d.data));return}if(!u.isDenied)return}await yt(jt.referralGuide(r));return}const i=await Wa.prepareFromCommercialOrder(e.id);i!=null&&i.data&&($(l.current).dxDataGrid("instance").refresh(),await yt(jt.referralGuide(i.data)))},en=async e=>{var i;if(!(e!=null&&e.id)||e.items&&(e.business||e.commercial_order||e.commercialOrder))return e;const r=await fe.paginate({skip:0,take:1,isLoadingAll:!0,filter:["id","=",Number(e.id)]});return((i=r==null?void 0:r.data)==null?void 0:i[0])??e},Fa=async e=>{var g,f,y;const r=await en(e);if(!$t(r)){await U.fire({title:"Comprobante no preparado",text:"Primero genera serie y correlativo del comprobante.",icon:"warning",confirmButtonText:"Entendido"});return}const i=window.open("","_blank");if(!i){await U.fire({title:"Impresion bloqueada",text:"El navegador bloqueo la ventana de impresion.",icon:"warning",confirmButtonText:"Entendido"});return}const u=h=>{var S,j,x;return((x=(S=h==null?void 0:h.toString)==null?void 0:(j=S.call(h)).slice)==null?void 0:x.call(j,0,10))??""},d=(r==null?void 0:r.items)??[],o=d.length?d.map(h=>`
        <tr>
          <td>${T(h.description)}</td>
          <td class="right">${Number(h.quantity??0).toFixed(2)}</td>
          <td class="right">${Number(h.unit_price??0).toFixed(2)}</td>
          <td class="right">${Number(h.total??0).toFixed(2)}</td>
        </tr>
      `).join(""):'<tr><td colspan="4" class="muted">Sin detalle de items</td></tr>';i.document.write(`<!doctype html>
      <html>
        <head>
          <title>${T(r.code)} - ${T(r.series)}-${T(r.sequence)}</title>
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
              <h1>${T(((g=r==null?void 0:r.business)==null?void 0:g.name)??"Empresa")}</h1>
              <div class="muted">${T(((f=r==null?void 0:r.branch)==null?void 0:f.address)??"")}</div>
              <div class="muted">${T(((y=r==null?void 0:r.business)==null?void 0:y.tax_number)??"")}</div>
            </div>
            <div class="number">
              ${T(r.document_type??"Comprobante")}<br>
              ${T(r.series)}-${T(r.sequence)}
            </div>
          </div>
          <div class="grid">
            <div><div class="label">Comprobante interno</div>${T(r.code)}</div>
            <div><div class="label">Fecha</div>${T(u(r.issue_date))}</div>
            <div><div class="label">Cliente</div>${T(Vn(r))}</div>
            <div><div class="label">Moneda</div>${T(wt(r.currency))}</div>
            <div><div class="label">Pedido comercial</div>${T(Un(r))}</div>
            <div><div class="label">Condicion</div>${T(r.payment_condition??"-")}</div>
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
            <tbody>${o}</tbody>
          </table>
          <table class="totals">
            <tr><th>Subtotal</th><td class="right">${Number(r.subtotal??0).toFixed(2)}</td></tr>
            <tr><th>IGV</th><td class="right">${Number(r.tax_amount??0).toFixed(2)}</td></tr>
            <tr><th>Total</th><td class="right">${Number(r.total??0).toFixed(2)}</td></tr>
          </table>
        </body>
      </html>`),i.document.close(),i.focus(),i.print()},tn=async e=>{var u;let r=Oe(e);if(r&&gr(r)){window.open(fe.downloadUrl(r.id,"pdf"),"_blank","noopener");return}if(r){const d=await U.fire({title:"Emitir comprobante",text:$t(r)?`El comprobante ${ye(r)||r.code} ya esta preparado. Puedes emitirlo o imprimirlo.`:`Se emitira ${ye(r)||r.code} usando el conector configurado.`,icon:"question",showCancelButton:!0,showDenyButton:$t(r),confirmButtonText:"Emitir",denyButtonText:"Imprimir",cancelButtonText:"Cancelar"});if(d.isDenied){await Fa(r);return}if(!d.isConfirmed)return}else{if(!xi(e)){await U.fire({title:"Comprobante no disponible",text:"Primero envia el pedido a preparacion o confirma el pedido. Los pedidos en borrador no se pueden facturar.",icon:"warning",confirmButtonText:"Entendido"});return}const d=ta(e);if(!(await U.fire({title:"Generar comprobante",text:`Se generara un comprobante ${d} para el pedido ${e.code}.`,icon:"question",showCancelButton:!0,confirmButtonText:"Generar",cancelButtonText:"Cancelar"})).isConfirmed)return;const g=await fe.save({commercial_order_id:e.id,document_type:d});if(!((u=g==null?void 0:g.data)!=null&&u.id))return;const f=await fe.prepareVoucher(g.data.id);r=(f==null?void 0:f.data)??g.data,$(l.current).dxDataGrid("instance").refresh();const y=await U.fire({title:"Comprobante generado",text:`Se genero ${ye(r)||r.code}. Puedes emitirlo o imprimirlo ahora.`,icon:"success",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Imprimir",cancelButtonText:"Cerrar"});if(y.isDenied){await Fa(r);return}if(!y.isConfirmed)return}await fe.issue(r.id)&&$(l.current).dxDataGrid("instance").refresh()},an=async e=>{const{isConfirmed:r}=await U.fire({title:"Eliminar pedido comercial",text:"Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!r||!await M.delete(e)||$(l.current).dxDataGrid("instance").refresh()},rn=()=>{E.current&&(E.current.value=""),$(_.current).modal("show"),setTimeout(()=>{var e;return(e=E.current)==null?void 0:e.focus()},150)},nn=async e=>{var i,u;e.preventDefault();const r=((u=(i=E.current)==null?void 0:i.value)==null?void 0:u.trim())||"";if(!r){await U.fire({title:"CHECK OUT ID requerido",text:"Ingresa el CHECK OUT ID del pedido Multivende.",icon:"warning",confirmButtonText:"Entendido"});return}await U.fire({title:"Integracion pendiente",text:`El formulario ya captura el CHECK OUT ID ${r}. Falta conectar el servicio de Multivende para registrar el pedido automaticamente.`,icon:"info",confirmButtonText:"Aceptar"})},Sa=()=>{I.current&&(I.current.value=""),w.current&&(w.current.value=""),V.current&&(V.current.value="1")},Da=async()=>{pa(!0);try{const e=await Ya.paginate({take:100,skip:0,requireTotalCount:!0,sort:[{selector:"id",desc:!1}]});kr((e==null?void 0:e.data)??[])}finally{pa(!1)}},sn=async()=>{Sa(),ma(""),$(G.current).modal("show"),await Da(),setTimeout(()=>{var e;return(e=w.current)==null?void 0:e.focus()},150)},ln=e=>{var r;I.current&&(I.current.value=(e==null?void 0:e.id)??""),w.current&&(w.current.value=(e==null?void 0:e.description)??""),V.current&&(V.current.value=e!=null&&e.status?"1":"0"),(r=w.current)==null||r.focus()},cn=async()=>{var i,u,d,o;const e=((u=(i=w.current)==null?void 0:i.value)==null?void 0:u.trim())||"";if(!e){await U.fire({title:"Motivo requerido",text:"Ingresa la descripcion del motivo de retraso.",icon:"warning",confirmButtonText:"Entendido"});return}await Ya.save({id:((d=I.current)==null?void 0:d.value)||void 0,description:e,status:((o=V.current)==null?void 0:o.value)==="1"})&&(Sa(),await Da())},on=async(e,r)=>{var j,x,q,B,ve,de,ue,me,pe;$(r.target).data("select2")&&$(r.target).select2("close");const i=(j=$(r.target).select2("data"))==null?void 0:j[0],u=(i==null?void 0:i.data)??null,d=r.target.value||"";if(!d){X(N=>N.map(D=>D.uid===e?{...tt(),uid:D.uid}:D));return}const o=u??await M.getArticleById(d),g=((o==null?void 0:o.presentations)??[]).filter(N=>(N==null?void 0:N.status)!==!1&&(N==null?void 0:N.status)!==0),f=g[0]??null,y=o?`${o.code??""} - ${o.name??""}`.trim():(i==null?void 0:i.text)??d,h={article_id:d,article_label:y,article_code:(o==null?void 0:o.code)??"",article_lot:(o==null?void 0:o.default_lot)??"",article_name:(o==null?void 0:o.name)??"",article_unit:((x=o==null?void 0:o.unit)==null?void 0:x.symbol)??((q=o==null?void 0:o.unit)==null?void 0:q.name)??"",article_laboratory:((B=o==null?void 0:o.laboratory)==null?void 0:B.name)??"",article_principle:((ve=o==null?void 0:o.activePrinciple)==null?void 0:ve.name)??((de=o==null?void 0:o.active_principle)==null?void 0:de.name)??"",presentations:g.map(N=>({id:`${N.id}`,name:N.name??"Presentacion",units:Number(N.units||1),price:Number(N.price||0)})),presentation_id:f?`${f.id}`:"",presentation_units:Number((f==null?void 0:f.units)||1),quantity:1};X(N=>N.map(D=>D.uid===e?_e({...D,...h}):D));const S=await M.resolvePrice({article_id:d,presentation_id:f?`${f.id}`:null,quantity:1,business_id:$e||null,business_branch_id:K||null,warehouse_id:J||null,client_id:ke||null,eventual_client_id:Fe||null,client_distribution_network_id:Q||null,issue_date:((ue=L.current)==null?void 0:ue.value)||null,commercial_channel:((me=Be.find(N=>`${N.id}`==`${Q}`))==null?void 0:me.commercial_channel)||null,segment:((pe=Be.find(N=>`${N.id}`==`${Q}`))==null?void 0:pe.segment)||null});S&&X(N=>N.map(D=>D.uid===e?_e({...D,...h,stock_available:Number(S.stock_available||0),price_unit:Number(S.price_unit||0),price_source:S.source||"fallback",price_list_code:S.price_list_code||""}):D))},Yt=async(e,r,i)=>{const u=ee.find(y=>y.uid===e);if(!u)return;const d=r==="presentation_id"?u.presentations.find(y=>`${y.id}`==`${i}`):null,o=_e({...u,[r]:i,...r==="presentation_id"?{presentation_units:Number((d==null?void 0:d.units)||1)}:{}});if(r==="price_unit"&&(o.price_source="manual",o.price_list_code=""),X(y=>y.map(h=>h.uid===e?o:h)),!["quantity","presentation_id"].includes(r))return;const g=o.presentations.find(y=>`${y.id}`==`${r==="presentation_id"?i:o.presentation_id}`),f=await ya(o,{quantity:r==="quantity"?i:o.quantity,presentation_id:r==="presentation_id"?i:o.presentation_id});f&&X(y=>y.map(h=>h.uid!==e?h:_e({...h,presentation_units:Number((g==null?void 0:g.units)||h.presentation_units||1),stock_available:Number(f.stock_available||0),price_unit:Ja(h,f,r==="presentation_id"),price_source:Qa(h,f,r==="presentation_id"),price_list_code:r==="presentation_id"?f.price_list_code||"":ia(h)?h.price_list_code:f.price_list_code||""})))},dn=(e,r)=>{const i=Number(r||0);X(u=>u.map(d=>d.uid!==e?d:_e({...d,discount_type:i>0?"percent":"none",discount_value:i>0?i:0})))},un=(e,r)=>{r.preventDefault(),r.stopPropagation();const i=r.currentTarget.getBoundingClientRect();Pt(u=>(u==null?void 0:u.uid)===e?null:{uid:e,top:i.bottom+4,left:i.left,width:Math.max(i.width,130)})},Ta=(e,r)=>{dn(e,r),Pt(null)},mn=()=>X(e=>[...e,tt()]),pn=e=>{X(r=>{const i=r.filter(u=>u.uid!==e);return i.length?i:[tt()]})},Wt=c.useMemo(()=>ee.reduce((e,r)=>e+Number(r.total||0),0),[ee]),Ht=c.useMemo(()=>cr(Wt,Ge),[Wt,Ge]),Ea=c.useMemo(()=>vi(da),[da]),Kt=c.useMemo(()=>{const e=Gt.trim().toLowerCase();return e?Bt.filter(r=>[r.description,r.status?"Activo":"Inactivo",ea(r.creator),ar(r.created_at)].some(i=>`${i??""}`.toLowerCase().includes(e))):Bt},[Bt,Gt]),fn=(e,r)=>a.jsxs("div",{className:`commercial-order-filter-field commercial-order-filter-${r.key}`,children:[a.jsxs("label",{className:"form-label",children:[r.label,r.helper&&a.jsxs("span",{className:"commercial-order-filter-helper",children:[" ",r.helper]})]}),r.type==="business"?a.jsxs("select",{className:"form-select",value:Ue[r.key]??"",onChange:i=>ge(e,r.key,i.target.value),children:[a.jsx("option",{value:"",children:"Todos"}),Sr.map(i=>a.jsx("option",{value:i.id,children:i.name},`commercial-order-filter-business-${i.id}`))]}):r.type==="laboratory"?a.jsxs("select",{className:"form-select",value:Ue[r.key]??"",onChange:i=>ge(e,r.key,i.target.value),children:[a.jsx("option",{value:"",children:"Todos"}),Tr.map(i=>a.jsx("option",{value:i.id,children:i.name},`commercial-order-filter-laboratory-${i.id}`))]}):r.type==="select"?a.jsx("select",{className:"form-select",value:Ue[r.key]??"",onChange:i=>ge(e,r.key,i.target.value),children:(r.options??[]).map(i=>a.jsx("option",{value:i.value??i,children:i.label??i},`commercial-order-filter-${r.key}-${i.value??i}`))}):r.type==="dateRange"?a.jsx("input",{className:"form-control commercial-order-date-range-input","data-tab-id":e,value:Ue[r.key]??"",onChange:i=>ge(e,r.key,i.target.value),placeholder:r.placeholder??"YYYY/MM/DD - YYYY/MM/DD"}):a.jsx("input",{className:"form-control",value:Ue[r.key]??"",onChange:i=>ge(e,r.key,i.target.value),placeholder:r.placeholder??""})]},`commercial-order-main-filter-${e}-${r.key}`),Jt={orders:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"laboratoryId",label:"Laboratorio",helper:"(Solo para Reporte con Visitadores)",type:"laboratory"},{key:"dispatchStatus",label:"Despachado",type:"select",options:[{value:"",label:"Seleccionar"},{value:"dispatched",label:"Pedidos despachados"},{value:"pending",label:"Pedidos sin despachar"}]}],issued:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],cancelled:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],"credit-notes":[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],multivende:[{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"orderVtex",label:"Pedido VTEX",type:"text",placeholder:"Numero de pedido"}]}[C]??((Oa=Ka[C])==null?void 0:Oa.filters)??[],Ia=Jt.some(e=>e.type==="dateRange");c.useEffect(()=>{if(!Ia)return;let e=!0;return Yn().then(()=>{var r,i;!e||!((i=(r=window.$)==null?void 0:r.fn)!=null&&i.daterangepicker)||!window.moment||(window.moment.locale("es"),$(".commercial-order-date-range-input").each(function(){const u=$(this),d=u.data("tab-id")||C,o=`${u.val()||ae()}`.trim(),{start:g,end:f}=hr(o),y=window.moment(g||ra().replaceAll("/","-"),"YYYY-MM-DD"),h=window.moment(f||g||ra().replaceAll("/","-"),"YYYY-MM-DD"),S=u.data("daterangepicker");S&&S.remove(),u.off(".commercialOrderDateRange"),u.daterangepicker({startDate:y,endDate:h,autoUpdateInput:!1,alwaysShowCalendars:!0,linkedCalendars:!1,opens:"center",locale:{format:"YYYY/MM/DD",separator:" - ",applyLabel:"Aplicar",cancelLabel:"Limpiar",fromLabel:"Desde",toLabel:"Hasta",customRangeLabel:"Personalizado",weekLabel:"S",daysOfWeek:["Do","Lu","Ma","Mi","Ju","Vi","Sa"],monthNames:["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"],firstDay:1}},(j,x)=>{const q=`${j.format("YYYY/MM/DD")} - ${x.format("YYYY/MM/DD")}`;u.val(q),ge(d,"dateRange",q)}),u.on("cancel.daterangepicker.commercialOrderDateRange",()=>{u.val(""),ge(d,"dateRange","")})}))}).catch(()=>{}),()=>{e=!1,$(".commercial-order-date-range-input").each(function(){const r=$(this).data("daterangepicker");r&&r.remove(),$(this).off(".commercialOrderDateRange")})}},[C,Ia]);const _t=a.jsxs("div",{className:"commercial-order-listing-header",children:[a.jsxs("div",{className:"d-flex align-items-center justify-content-between gap-2 mb-2",children:[a.jsx("h4",{className:"header-title mb-0",children:"Listado"}),a.jsx("button",{type:"button",className:"btn btn-xs btn-light",onClick:()=>Ca(),title:"Refrescar listado",children:a.jsx("i",{className:"mdi mdi-refresh"})})]}),a.jsx("ul",{className:"nav nav-tabs nav-bordered flex-nowrap overflow-auto mb-3",children:Nt.map(e=>a.jsx("li",{className:"nav-item",children:a.jsx("button",{type:"button",className:`nav-link text-nowrap ${C===e.id?"active":""}`,onClick:()=>Fr(e.id),children:e.label})},`commercial-order-tab-${e.id}`))}),Jt.length>0&&a.jsxs("form",{className:"commercial-order-filter-form mb-2",onSubmit:Kr,children:[Jt.map(e=>fn(C,e)),a.jsxs("div",{className:"commercial-order-filter-actions",children:[a.jsxs("button",{type:"submit",className:"btn btn-outline-primary",children:[a.jsx("i",{className:"mdi mdi-magnify me-1"}),"Filtrar"]}),vt.kind!=="static"&&a.jsxs("button",{type:"button",className:"btn btn-outline-danger",onClick:()=>Ra(!0),children:[a.jsx("i",{className:"mdi mdi-file-excel-box me-1"}),"Filtrar a Excel"]}),vt.kind!=="static"&&a.jsxs("button",{type:"button",className:"btn btn-outline-success",onClick:()=>Ra(!1),children:[a.jsx("i",{className:"mdi mdi-file-excel-box me-1"}),"Reporte"]}),C==="multivende"&&a.jsxs("button",{type:"button",className:"btn btn-outline-success",children:[a.jsx("i",{className:"mdi mdi-calendar-refresh me-1"}),"Actualizar fechas de entrega"]})]})]}),C==="issued"&&a.jsx("div",{className:"row g-3 mt-1",children:["Total","IGV","IGV Recuperado"].map(e=>a.jsxs("div",{className:"col-12 col-md-4",children:[a.jsx("label",{className:"form-label",children:e}),a.jsx("input",{className:"form-control",value:"0.00",readOnly:!0})]},`commercial-order-total-${e}`))})]}),Qt={caption:"Acciones",width:100,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowSorting:!1,cellTemplate:(e,{data:r})=>{e.addClass("commercial-order-actions"),z(e,{variant:"danger",title:"Descargar PDF del comprobante",icon:"mdi mdi-file-pdf-box",onClick:()=>window.open(fe.downloadUrl(r.id,"pdf"),"_blank")})}},hn=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"dispatch_status",visible:!1,showInColumnChooser:!1}],Xt=[{dataField:"source_type",visible:!1,showInColumnChooser:!1},{dataField:"local_status",visible:!1,showInColumnChooser:!1},{dataField:"document_type",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"created_at",visible:!1,showInColumnChooser:!1}],bn=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"external_order_id",visible:!1,showInColumnChooser:!1},{dataField:"external_checkout_id",visible:!1,showInColumnChooser:!1}],Aa={issued:[...Xt,Qt,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:ir},{caption:"Cliente",minWidth:260,calculateCellValue:aa},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>wt(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}],cancelled:[...Xt,Qt,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"Cliente",minWidth:260,calculateCellValue:aa},{caption:"Motivo",minWidth:180,calculateCellValue:Zn},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>wt(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"F. Facturacion",dataType:"date",width:130},{dataField:"cancelled_at",caption:"F. Anulacion",dataType:"datetime",width:160}],"credit-notes":[...Xt,Qt,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:ir},{caption:"Doc. Afecto",width:130,calculateCellValue:Xn},{caption:"Cliente",minWidth:260,calculateCellValue:aa},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>wt(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}]},xn=[...bn,{caption:"Acciones",width:230,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:r})=>{const i=kt(r).length>0;e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),z(e,{variant:"primary",title:"Editar pedido Multivende",icon:"mdi mdi-pencil",onClick:()=>qt(r)}),z(e,{variant:"info",title:"Ver historial del pedido Multivende",icon:"mdi mdi-map-marker-path",onClick:()=>$a(r)}),z(e,{variant:i?"dark":"warning",title:i?"Ver guia de remision asociada":"Generar guia de remision",icon:i?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>ka(r)})}},{dataField:"order_status",caption:"E. Pedido",width:130,lookup:Ua(za),cellTemplate:(e,{value:r})=>Ct(e,r,qa)},{caption:"E. SUNAT",width:120,calculateCellValue:ei},{caption:"Pedido VTEX",width:150,calculateCellValue:ti},{dataField:"external_channel",caption:"Canal",width:130},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:er},{dataField:"document_type",caption:"Tipo Documento",width:140,calculateCellValue:ta,cellTemplate:(e,{value:r})=>Ct(e,r,i=>i||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:300,calculateCellValue:tr},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"promised_delivery_at",caption:"F. Entrega Estimada",dataType:"date",width:160},{caption:"F. de Entrega",width:150,dataType:"date",calculateCellValue:br},{caption:"Tiempo de Proceso",width:150,calculateCellValue:ai},{dataField:"created_at",caption:"Fecha Registro",dataType:"date",width:140},{dataField:"code",caption:"Codigo",width:130}];return a.jsxs(a.Fragment,{children:[a.jsx("style",{children:`
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
    `}),a.jsxs("div",{className:"commercial-order-top-actions",children:[a.jsxs("button",{type:"button",className:"btn btn-success commercial-order-multivende-action",title:"Ingresar pedido Multivende por CHECK OUT ID",onClick:rn,children:[a.jsxs("span",{children:[a.jsx("i",{className:"mdi mdi-plus-circle-outline"})," Ingresar pedido multivende"]}),a.jsx("i",{className:"mdi mdi-calendar-month-outline"})]}),a.jsxs("button",{type:"button",className:"btn commercial-order-delay-action",title:"Abrir mantenedor de motivos de retraso de entrega",onClick:sn,children:[a.jsx("span",{children:"Mantenedor Retraso Entrega"}),a.jsx("i",{className:"mdi mdi-cog"})]})]}),C==="orders"&&a.jsx(Zt,{gridRef:l,title:_t,rest:M,filterValue:Pr,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(l.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"add",title:"Agregar",hint:"Agregar pedido comercial",onClick:()=>qt(null)}})},pageSize:25,exportable:!0,columns:[...hn,{caption:"Acciones",width:340,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:r})=>{const i=kt(r).length>0;e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),z(e,{variant:"primary",title:"Editar datos, cliente, entrega y productos del pedido comercial",icon:"mdi mdi-pencil",onClick:()=>qt(r)}),bi(r)&&z(e,{variant:"success",title:"Enviar este pedido a preparacion para iniciar picking",icon:"mdi mdi-clipboard-check-outline",onClick:()=>Jr({id:r.id,field:"dispatch_status",value:"preparing"})}),z(e,{variant:"info",title:"Ver historial de estados, guia, ruta y entrega del pedido",icon:"mdi mdi-map-marker-path",onClick:()=>$a(r)});const u=gi(r);z(e,{variant:"secondary",title:u.title,icon:u.icon,onClick:()=>tn(r)}),z(e,{variant:i?"dark":"warning",title:i?"Ver, emitir o descargar la guia de remision asociada al pedido":"Generar guia de remision para este pedido",icon:i?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>ka(r)}),z(e,{variant:"success",title:na(r)?"Ver o actualizar foto y datos de evidencia de entrega":"Registrar foto y datos de evidencia de entrega",icon:"mdi mdi-camera",onClick:()=>Qr(r)}),z(e,{variant:"danger",title:"Imprimir o descargar PDF resumen del pedido comercial",icon:"mdi mdi-file-pdf-box",onClick:()=>yt(jt.commercialOrder(r))}),z(e,{variant:"danger",title:"Eliminar este pedido comercial del listado",icon:"mdi mdi-delete",onClick:()=>an(r.id)})}},{dataField:"order_status",caption:"Estado",width:140,lookup:Ua(za),cellTemplate:(e,{value:r})=>Ct(e,r,qa)},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:er},{dataField:"document_type",caption:"Tipo documento",width:130,calculateCellValue:ta,cellTemplate:(e,{value:r})=>Ct(e,r,i=>i||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:320,calculateCellValue:tr},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_label",caption:"Tipo de pago",width:170,calculateCellValue:zn},{dataField:"seller.fullname",caption:"Usuario",width:190,cellTemplate:(e,{data:r})=>e.text(Mn(r.seller))},{dataField:"created_at",caption:"Fecha registro",width:130,dataType:"date"},{dataField:"creator.username",caption:"Usuario registro",width:150,cellTemplate:(e,{data:r})=>e.text(ea(r.creator))},{dataField:"code",caption:"Código",width:130},{dataField:"business.name",caption:"Empresa",minWidth:150}]},"orders"),vt.kind==="billing"&&a.jsx(Zt,{gridRef:p,title:_t,rest:fe,filterValue:Mr,pageSize:20,exportable:!0,columns:Aa[C]??Aa.issued,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar listado",onClick:()=>$(p.current).dxDataGrid("instance").refresh()}})}},`billing-${C}`),C==="multivende"&&a.jsx(Zt,{gridRef:v,title:_t,rest:Or,filterValue:Lr,pageSize:10,exportable:!0,columns:xn,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar pedidos Multivende",onClick:()=>$(v.current).dxDataGrid("instance").refresh()}})}},"multivende"),vt.kind==="static"&&a.jsx(_i,{title:_t,config:Ka[C]}),a.jsx(et,{modalRef:m,title:yr?"Editar pedido comercial":"Agregar pedido comercial",size:"xl",dialogClass:"commercial-order-modal-dialog modal-dialog-scrollable",bodyClass:"commercial-order-modal-body",bodyStyle:{maxHeight:"calc(100vh - 150px)",overflowY:"auto",overflowX:"hidden"},btnSubmitText:"Guardar",onSubmit:Ur,children:a.jsxs("div",{id:"commercial-orders-form-container",children:[a.jsx("input",{ref:he,type:"hidden"}),a.jsx("input",{ref:je,type:"hidden"}),a.jsx("input",{ref:L,type:"hidden"}),a.jsx("input",{ref:rt,type:"hidden"}),a.jsx("input",{ref:it,type:"hidden"}),a.jsx("input",{ref:ot,type:"hidden"}),a.jsx("input",{ref:dt,type:"hidden"}),a.jsx("input",{ref:ut,type:"hidden"}),a.jsx("input",{ref:mt,type:"hidden"}),a.jsx("input",{ref:pt,type:"hidden"}),a.jsx("input",{ref:_r,type:"hidden",value:Ht.taxAmount,readOnly:!0}),a.jsx("input",{ref:Ce,type:"hidden"}),a.jsxs("section",{className:"commercial-order-form-section",children:[a.jsxs("div",{className:"commercial-order-section-title",children:[a.jsx("i",{className:"mdi mdi-file-document"}),a.jsx("span",{children:"Datos del pedido"})]}),a.jsxs("div",{className:"row g-2",children:[a.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:a.jsx(Ie,{eRef:Pe,label:"Empresa",required:!0,searchAPI:"/api/admin/businesses/paginate",searchBy:"name",dropdownParent:"#commercial-orders-form-container",onChange:zr})}),a.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:a.jsxs(Fn,{eRef:b,label:"Sede",dropdownParent:"#commercial-orders-form-container",value:K,onChange:qr,children:[a.jsx("option",{value:"",children:"Sin sede"}),wr.map(e=>a.jsx("option",{value:e.id,children:e.name},`commercial-order-branch-${e.id}`))]})}),a.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:a.jsx(Ie,{eRef:k,label:"Almacen",required:!0,searchAPI:"/api/admin/warehouses/paginate",searchBy:"name",filter:Gr,dropdownParent:"#commercial-orders-form-container",onChange:Yr,templateResult:lr,templateSelection:lr})}),a.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[a.jsx("label",{className:"form-label",children:"Doc. venta"}),a.jsxs("select",{ref:vr,className:"form-control",value:Ge,onChange:e=>oa(Ft(e.target.value)),children:[a.jsx("option",{value:"Factura",children:"Factura"}),a.jsx("option",{value:"Boleta",children:"Boleta"}),a.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),a.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[a.jsx("label",{className:"form-label",children:"Moneda"}),a.jsxs("select",{ref:nt,className:"form-control",children:[a.jsx("option",{value:"PEN",children:"PEN"}),a.jsx("option",{value:"USD",children:"USD"}),a.jsx("option",{value:"EUR",children:"EUR"})]})]}),a.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[a.jsx("label",{className:"form-label",children:"Forma de pago"}),a.jsxs("select",{ref:Me,className:"form-control",children:[a.jsx("option",{value:"",children:"Seleccione"}),On.map(e=>a.jsx("option",{value:e,children:e},`commercial-order-payment-${e}`))]})]})]})]}),a.jsxs("section",{className:"commercial-order-form-section",children:[a.jsxs("div",{className:"commercial-order-section-title",children:[a.jsx("i",{className:"mdi mdi-account"}),a.jsx("span",{children:"Cliente y entrega"})]}),a.jsxs("div",{className:"row g-2",children:[a.jsx("div",{className:"col-12 col-xl-6",children:a.jsx(Ie,{eRef:Y,label:"Cliente regular",searchAPI:"/api/admin/clients/paginate",searchBy:"full_name",selectBy:"entity_id",filter:In,dropdownParent:"#commercial-orders-form-container",onChange:Wr})}),a.jsx("div",{className:"col-12 col-xl-6",children:a.jsx(Ie,{eRef:W,label:"Cliente eventual",searchAPI:"/api/admin/eventual-clients/paginate",searchBy:"business_name",dropdownParent:"#commercial-orders-form-container",onChange:Hr})}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Orden de compra"}),a.jsx("input",{ref:st,className:"form-control"})]}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Numero de guia"}),a.jsx("input",{ref:lt,className:"form-control"})]}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Guia remision"}),a.jsx("input",{ref:ct,className:"form-control"})]}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Ubigeo"}),a.jsx("input",{ref:le,className:"form-control"})]}),a.jsx("div",{className:"col-12 col-xl-4",children:a.jsx(Va,{eRef:H,label:"Direccion de entrega",rows:2})}),a.jsx("div",{className:"col-12",children:a.jsx(hi,{modalRef:m,position:At,searchText:Cr,onSearchTextChange:xt,onPositionChange:Ot,onAddressSelected:e=>{H.current&&(H.current.value=e)}})}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[a.jsx("label",{className:"form-label",children:"Nombre contacto entrega"}),a.jsx("input",{ref:we,className:"form-control"})]}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[a.jsx("label",{className:"form-label",children:"Celular contacto entrega"}),a.jsx("input",{ref:Re,className:"form-control"})]}),a.jsx(Ie,{eRef:se,label:"Vendedor",col:"col-12 col-md-6 col-xl-2",searchAPI:"/api/admin/users/paginate",searchBy:"fullname",dropdownParent:"#commercial-orders-form-container"}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Medico"}),a.jsx("input",{ref:Ne,className:"form-control"})]})]})]}),a.jsxs("section",{className:"commercial-order-form-section",children:[a.jsxs("div",{className:"commercial-order-detail-toolbar",children:[a.jsxs("div",{className:"commercial-order-section-title mb-0",children:[a.jsx("i",{className:"mdi mdi-format-list-bulleted"}),a.jsx("span",{children:"Detalle del pedido"})]}),a.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:mn,children:"Agregar item"})]}),a.jsx("div",{className:"table-responsive border rounded commercial-order-detail-table","data-select2-local-dropdown":"true",children:a.jsxs("table",{className:"table table-sm align-middle mb-0",children:[a.jsx("thead",{children:a.jsxs("tr",{children:[a.jsx("th",{style:{minWidth:96},children:"Descuento"}),a.jsx("th",{style:{minWidth:104},children:"Codigo"}),a.jsx("th",{style:{minWidth:88},children:"Codigo lote"}),a.jsx("th",{style:{minWidth:280},children:"Nombre"}),a.jsx("th",{style:{minWidth:128},children:"Laboratorio"}),a.jsx("th",{style:{minWidth:130},children:"Principio activo"}),a.jsx("th",{style:{minWidth:110},children:"Unidad"}),a.jsx("th",{style:{minWidth:64},children:"Stock"}),a.jsx("th",{style:{minWidth:112},children:"P. venta con IGV"}),a.jsx("th",{style:{minWidth:112},children:"P. venta sin IGV"}),a.jsx("th",{style:{minWidth:92},children:"Cantidad"}),a.jsx("th",{style:{minWidth:96},children:"Total desc."}),a.jsx("th",{style:{minWidth:96},children:"Sub total"}),a.jsx("th",{style:{width:70}})]})}),a.jsx("tbody",{children:ee.map(e=>a.jsxs("tr",{children:[a.jsx("td",{children:a.jsxs("div",{className:"commercial-order-discount-cell",children:[a.jsxs("button",{type:"button",className:"commercial-order-discount-trigger",onClick:r=>un(e.uid,r),children:[a.jsx("span",{children:e.discount_type==="percent"&&Number(e.discount_value||0)>0?`${Number(e.discount_value)}%`:"Seleccione"}),a.jsx("i",{className:"mdi mdi-chevron-down"})]}),(ce==null?void 0:ce.uid)===e.uid&&a.jsxs("div",{className:"commercial-order-discount-menu",style:{top:ce.top,left:ce.left,minWidth:ce.width},onClick:r=>r.stopPropagation(),children:[a.jsx("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type!=="percent"?"active":""}`,onClick:()=>Ta(e.uid,""),children:"Seleccione"}),An.map(r=>a.jsxs("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type==="percent"&&Number(e.discount_value||0)===r?"active":""}`,onClick:()=>Ta(e.uid,r),children:[r,"%"]},`commercial-order-discount-floating-${e.uid}-${r}`))]})]})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_code||"-"})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_lot||"-"})}),a.jsx("td",{className:"commercial-order-article-name",children:a.jsx(Ie,{eRef:ba(e.uid),searchAPI:Br,searchBy:"name",dropdownParent:"#commercial-orders-form-container",disabled:!J,onChange:r=>on(e.uid,r)})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_laboratory||"-"})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_principle||"-"})}),a.jsx("td",{children:a.jsxs("div",{children:[a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_unit||"-"}),e.presentations.length>0&&a.jsxs("select",{className:"form-control mt-1","data-no-select2":"true",value:e.presentation_id,disabled:!e.article_id,onChange:r=>Yt(e.uid,"presentation_id",r.target.value),children:[a.jsx("option",{value:"",children:li(e)}),e.presentations.map(r=>a.jsx("option",{value:r.id,children:ci(r,e)},`commercial-order-presentation-${e.uid}-${r.id}`))]})]})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:Number(e.stock_available||0).toFixed(2)})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:e.price_unit,onFocus:Za,onChange:r=>Yt(e.uid,"price_unit",Xa(r))})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:cr(Number(e.price_unit||0),Ge).subtotal.toFixed(2),readOnly:!0})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0.01",className:"form-control",value:e.quantity,onFocus:Za,onChange:r=>Yt(e.uid,"quantity",Xa(r))})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.discount_amount||0).toFixed(2),readOnly:!0})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.total||0).toFixed(2),readOnly:!0})}),a.jsx("td",{className:"text-end",children:a.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>pn(e.uid),children:a.jsx("i",{className:"mdi mdi-close"})})})]},e.uid))}),a.jsxs("tfoot",{children:[a.jsxs("tr",{children:[a.jsx("th",{colSpan:"12",className:"text-end",children:"Sub total"}),a.jsx("th",{children:Wt.toFixed(2)}),a.jsx("th",{})]}),a.jsxs("tr",{children:[a.jsx("th",{colSpan:"12",className:"text-end",children:"Descuento global"}),a.jsx("th",{children:"0.00"}),a.jsx("th",{})]}),a.jsxs("tr",{children:[a.jsx("th",{colSpan:"12",className:"text-end",children:"Total"}),a.jsx("th",{children:Ht.total.toFixed(2)}),a.jsx("th",{})]})]})]})})]}),a.jsxs("section",{className:"commercial-order-form-section mb-0",children:[a.jsxs("div",{className:"commercial-order-section-title",children:[a.jsx("i",{className:"mdi mdi-note-text"}),a.jsx("span",{children:"Observaciones"})]}),a.jsx(Va,{eRef:ft,label:"Observaciones",rows:3})]})]})}),a.jsx(et,{modalRef:_,title:"Ingresar pedido multivende",size:"lg",btnSubmitText:"Registrar",onSubmit:nn,children:a.jsx("div",{className:"commercial-order-multivende-form",children:a.jsxs("section",{className:"commercial-order-form-section",children:[a.jsxs("div",{className:"commercial-order-section-title",children:[a.jsx("i",{className:"mdi mdi-file-document-plus-outline"}),a.jsx("span",{children:"General"})]}),a.jsxs("div",{className:"mb-2",children:[a.jsxs("label",{className:"form-label",children:["Ingrese el ",a.jsx("strong",{children:"CHECK OUT ID"})]}),a.jsx("input",{ref:E,name:"external_checkout_id",className:"form-control",autoComplete:"off"})]})]})})}),a.jsx(et,{modalRef:G,title:"Mantenedor motivo retraso entrega",size:"lg",hideFooter:!0,onSubmit:e=>{e.preventDefault(),cn()},children:a.jsxs("div",{className:"commercial-order-delay-maintainer",children:[a.jsxs("div",{className:"commercial-order-delay-actions",children:[a.jsxs("button",{type:"button",className:"btn btn-sm btn-light","data-bs-dismiss":"modal",children:[a.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]}),a.jsxs("button",{type:"submit",className:"btn btn-sm btn-outline-primary",children:[a.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]})]}),a.jsx("input",{ref:I,type:"hidden"}),a.jsxs("div",{className:"row",children:[a.jsxs("div",{className:"col-12 mb-3",children:[a.jsx("label",{className:"form-label",children:"Descripcion:"}),a.jsx("input",{ref:w,className:"form-control",autoComplete:"off"})]}),a.jsxs("div",{className:"col-12 mb-3",children:[a.jsx("label",{className:"form-label",children:"Estado:"}),a.jsxs("select",{ref:V,className:"form-control",defaultValue:"1",children:[a.jsx("option",{value:"1",children:"Activo"}),a.jsx("option",{value:"0",children:"Inactivo"})]})]})]}),a.jsx("hr",{}),a.jsxs("div",{className:"commercial-order-delay-filter",children:[a.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),a.jsx("input",{className:"form-control form-control-sm",value:Gt,onChange:e=>ma(e.target.value)})]}),a.jsx("div",{className:"table-responsive commercial-order-delay-table",children:a.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[a.jsx("thead",{children:a.jsxs("tr",{children:[a.jsx("th",{className:"text-center",children:"Acciones"}),a.jsx("th",{className:"text-center",children:"Estado"}),a.jsx("th",{children:"Motivo"}),a.jsx("th",{children:"Fecha registro"}),a.jsx("th",{children:"Usuario registro"})]})}),a.jsxs("tbody",{children:[Vt&&a.jsx("tr",{children:a.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"Cargando motivos..."})}),!Vt&&Kt.length===0&&a.jsx("tr",{children:a.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"No existen elementos"})}),!Vt&&Kt.map(e=>a.jsxs("tr",{children:[a.jsx("td",{className:"text-center",children:a.jsx("button",{type:"button",className:"btn btn-xs btn-outline-info",title:"Editar motivo de retraso",onClick:()=>ln(e),children:a.jsx("i",{className:"mdi mdi-pencil"})})}),a.jsx("td",{className:"text-center",children:a.jsx("span",{className:pr(e.status?"billed":"cancelled"),children:e.status?"Activo":"Inactivo"})}),a.jsx("td",{children:e.description}),a.jsx("td",{children:ar(e.created_at)}),a.jsx("td",{children:ea(e.creator)})]},`delivery-delay-reason-${e.id}`))]})]})}),a.jsxs("div",{className:"commercial-order-delay-summary",children:[Kt.length," elementos (Pagina 1 de 1)"]})]})}),a.jsx(et,{modalRef:ie,title:"Tracking del pedido",size:"lg",hideButtonSubmit:!0,children:a.jsx("div",{className:"table-responsive",children:a.jsxs("table",{className:"table table-sm align-middle mb-0",children:[a.jsx("thead",{children:a.jsxs("tr",{children:[a.jsx("th",{children:"Fecha"}),a.jsx("th",{children:"Estado"})]})}),a.jsxs("tbody",{children:[Ea.length===0&&a.jsx("tr",{children:a.jsx("td",{colSpan:"2",className:"text-muted text-center py-3",children:"Sin eventos registrados."})}),Ea.map((e,r)=>a.jsxs("tr",{children:[a.jsx("td",{children:new Date(e.date).toLocaleString("es-PE")}),a.jsx("td",{children:e.status})]},`commercial-order-tracking-${r}`))]})]})})}),a.jsx(et,{modalRef:Z,title:"Evidencia de entrega",size:"lg",btnSubmitText:"Registrar",onSubmit:Zr,children:a.jsxs("div",{className:"row",children:[a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Recibido por"}),a.jsx("input",{className:"form-control",value:R.recipient_name,onChange:e=>oe("recipient_name",e.target.value)})]}),a.jsxs("div",{className:"col-md-3 mb-3",children:[a.jsx("label",{className:"form-label",children:"Tipo doc."}),a.jsxs("select",{className:"form-control",value:R.recipient_document_type,onChange:e=>oe("recipient_document_type",e.target.value),children:[a.jsx("option",{value:"DNI",children:"DNI"}),a.jsx("option",{value:"RUC",children:"RUC"}),a.jsx("option",{value:"CE",children:"CE"}),a.jsx("option",{value:"OTRO",children:"Otro"})]})]}),a.jsxs("div",{className:"col-md-3 mb-3",children:[a.jsx("label",{className:"form-label",children:"Numero"}),a.jsx("input",{className:"form-control",value:R.recipient_document_number,onChange:e=>oe("recipient_document_number",e.target.value)})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Telefono"}),a.jsx("input",{className:"form-control",value:R.recipient_phone,onChange:e=>oe("recipient_phone",e.target.value)})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Fecha y hora entrega"}),a.jsx("input",{type:"datetime-local",className:"form-control",value:R.delivered_at,onChange:e=>oe("delivered_at",e.target.value)})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Foto / evidencia"}),a.jsx("input",{ref:A,className:"form-control",type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",capture:"environment",onChange:Xr})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Latitud"}),a.jsx("input",{className:"form-control",value:R.latitude,onChange:e=>oe("latitude",e.target.value)})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Longitud"}),a.jsx("input",{className:"form-control",value:R.longitude,onChange:e=>oe("longitude",e.target.value)})]}),a.jsxs("div",{className:"col-12 mb-3",children:[a.jsx("label",{className:"form-label",children:"Observaciones"}),a.jsx("textarea",{className:"form-control",rows:"3",value:R.evidence_notes,onChange:e=>oe("evidence_notes",e.target.value)})]}),a.jsx("div",{className:"col-12",children:a.jsx("div",{className:"border rounded p-3",children:xe?a.jsx("img",{src:xe,alt:"Evidencia de entrega",className:"img-fluid rounded border bg-light",style:{maxHeight:360,width:"100%",objectFit:"contain"}}):R.evidence_url?a.jsx("a",{href:R.evidence_url,target:"_blank",rel:"noreferrer",children:"Abrir evidencia registrada"}):a.jsx("div",{className:"text-muted py-4 text-center",children:"Sin evidencia registrada"})})})]})})]})};yn((t,n)=>{!n.can("orders")&&!n.hasRole("Admin")&&(location.href="/admin/"),jn(t).render(a.jsx($n,{...n,title:n.pageTitle||"Pedidos comerciales",children:a.jsx(yi,{...n})}))});
