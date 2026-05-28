var dr=Object.defineProperty;var ur=(t,r,s)=>r in t?dr(t,r,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[r]=s;var Oa=(t,r,s)=>ur(t,typeof r!="symbol"?r+"":r,s);import{C as mr,c as pr,j as a,r as l,S as Se,G as fr}from"./CreateReactScript-BQEmHc8B.js";import{L as hr,G as br,M as xr}from"./esm-XAA1TWCO.js";import{B as gr}from"./Base-BZJCfbcl.js";import{T as Ht}from"./Table-DsvFLxnp.js";import{M as Ke}from"./Modal-BpHRFSoz.js";import{R as _r}from"./ReactAppend-CmCssPze.js";import{a as $e,S as Ee}from"./SetSelectValue-CKeZntsZ.js";import{S as vr}from"./SelectFormGroup-BeLjaap0.js";import{T as Pa}from"./TextareaFormGroup-COu0G6AX.js";import{B as yr}from"./BillingDocumentsRest-WW_N3DRe.js";import{C as cn}from"./CommercialOrdersRest-C3qyJH3l.js";import{B as jr}from"./BasicRest-BJmaHB2C.js";import{R as Nr}from"./ReferralGuidesRest-CIzM-URQ.js";import{o as xt,b as gt}from"./magistralesRecordPdf-C-x5GdgT.js";import{t as Ma,i as La,j as on,k as Ba}from"./statusLabels-DafAwaKR.js";import"./tippy-react.esm-255dCUw_.js";import"./permissionScope-Be8AULz2.js";import"./ubigeoInei-D0FnAslC.js";class Cr extends jr{constructor(){super(...arguments);Oa(this,"path","admin/delivery-delay-reasons")}}const G=new cn,Kt=new yr,Ga=new Cr,Va=new Nr,Rr=["client_kind","=","regular"],wr=[1,2,3,4,5],kr=["EFECTIVO [CONTADO]","TRANSFERENCIA [CONTADO]","YAPE [CONTADO]","PLIN [CONTADO]","TARJETA [CONTADO]","TRANSFERENCIA [CREDITO]"],Ua="ecomsur_oms",_t=[{id:"orders",label:"Pedidos",kind:"orders"},{id:"issued",label:"Facturas Emitidas",kind:"billing"},{id:"cancelled",label:"Facturas Anuladas",kind:"billing"},{id:"credit-notes",label:"Notas de Credito",kind:"billing"},{id:"visitors",label:"Pedidos - Visitadores",kind:"static"},{id:"visitors-legacy",label:"Pedidos - Visitadores Legacy",kind:"static"},{id:"platforms",label:"Plataformas",kind:"static"},{id:"multivende",label:"Pedidos - Multivende",kind:"multivende"}],za={visitors:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},"visitors-legacy":{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["Todos","ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},platforms:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]}},U=(t,{variant:r,title:s,icon:c,onClick:p})=>{const x=$('<button type="button"></button>').addClass(`btn btn-xs btn-soft-${r} commercial-order-action-btn`).attr("title",s).attr("aria-label",s).append($("<i></i>").addClass(c)).on("click",m=>{m.preventDefault(),m.stopPropagation(),p()});t.append(x)},dn=t=>`commercial-order-status-badge commercial-order-status-${`${t??"empty"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-")||"empty"}`,vt=(t,r,s)=>{t.addClass("commercial-order-status-cell"),_r(t,a.jsx("span",{className:dn(r),children:s(r)}))},Je=()=>({uid:crypto.randomUUID(),article_id:"",article_label:"",article_code:"",article_lot:"",article_name:"",article_unit:"",article_laboratory:"",article_principle:"",presentations:[],presentation_id:"",presentation_units:1,stock_available:0,reserved_quantity:0,price_unit:0,quantity:1,gross_total:0,discount_type:"none",discount_value:0,discount_amount:0,total:0,price_source:"fallback",price_list_code:""}),Fr=t=>{if(!t)return"";const r=(t.name??"").toString().trim().split(" ")[0]??"",s=(t.lastname??"").toString().trim().split(" ")[0]??"",c=`${r} ${s}`.trim(),p=(t.username??"").toString().trim();return c&&p?`${c} (@${p})`:c||(p?`@${p}`:"")},Sr=t=>{if(!t)return"-";const r=(t.fullname??"").toString().trim();return r||`${t.name??""} ${t.lastname??""}`.trim()||(t.username??"").toString().trim()||"-"},Jt=t=>t&&((t.username??"").toString().trim()||(t.fullname??"").toString().trim()||`${t.name??""} ${t.lastname??""}`.trim())||"-",Qe=t=>Number(Number(t||0).toFixed(2)),$r=t=>$("<div>").text(t??"").html(),Te=t=>{const r=Number(Number(t||0).toFixed(3));return Number.isInteger(r)?`${r}`:`${r}`.replace(/\.?0+$/,"")},ta=t=>(t==null?void 0:t.price_source)==="manual",qa=(t,r,s=!1)=>{const c=Number((t==null?void 0:t.price_unit)||0),p=Number(r==null?void 0:r.price_unit);return!s&&ta(t)||!Number.isFinite(p)||!s&&p<=0&&c>0?c:p},Ya=(t,r,s=!1)=>!s&&ta(t)?"manual":(r==null?void 0:r.source)||(t==null?void 0:t.price_source)||"fallback",Er=t=>{const r=`${t??""}`.replace(",",".").replace(/[^\d.]/g,"");if(!r)return"";const[s,...c]=r.split("."),p=s.replace(/^0+(?=\d)/,"")||(s||c.length?"0":""),x=c.length?`.${c.join("")}`:"";return`${p}${x}`},Wa=t=>{const r=Er(t.target.value);return t.target.value!==r&&(t.target.value=r),Number(r||0)},Ha=t=>{Number(t.target.value||0)===0&&t.target.select()},Tr=(t,r,s)=>{const c=Qe(t),p=Number(s||0);return!Number.isFinite(p)||p<=0||c<=0?0:r==="percent"?Math.min(c,Qe(c*Math.min(p,100)/100)):r==="amount"?Math.min(c,Qe(p)):0},be=t=>{const r=Number(t.quantity||0),s=Number(t.price_unit||0),c=Number.isFinite(r*s)?Qe(r*s):0,p=Tr(c,t.discount_type,t.discount_value);return{...t,discount_type:t.discount_type||"none",discount_value:t.discount_type==="none"?0:Number(t.discount_value||0),gross_total:c,discount_amount:p,total:Qe(Math.max(0,c-p))}},Nt=t=>{const r=`${t??""}`.trim().toLowerCase();return r==="boleta"?"Boleta":["nota de pedido","nota_pedido","note_order"].includes(r)?"Nota de pedido":"Factura"},Dr=t=>(t==null?void 0:t.billing_documents)??(t==null?void 0:t.billingDocuments)??[],Ct=t=>Dr(t)[0]??null,Ka=t=>{const r=Ct(t);return(r==null?void 0:r.code)||[r==null?void 0:r.series,r==null?void 0:r.sequence].filter(Boolean).join("-")||(t==null?void 0:t.referral_guide)||(t==null?void 0:t.guide_number)||(t==null?void 0:t.purchase_order)||"-"},Ja=t=>{var r;return Nt(((r=Ct(t))==null?void 0:r.document_type)??(t==null?void 0:t.document_type))},Qa=t=>{const r=(t==null?void 0:t.client)??(t==null?void 0:t.eventual_client)??(t==null?void 0:t.eventualClient)??null,s=`${(r==null?void 0:r.document_number)??""}`.trim(),c=`${(r==null?void 0:r.full_name)??(r==null?void 0:r.business_name)??""}`.trim();return[s,c].filter(Boolean).join(" | ")||"-"},Ir=t=>{const r=`${(t==null?void 0:t.payment_method)??""}`.trim(),s=`${(t==null?void 0:t.payment_condition)??""}`.trim();return!r&&!s?"-":!s||r.includes("[")?r||"-":`${r||"-"} [${s.toUpperCase()}]`},Xa=t=>{if(!t)return"-";const r=new Date(t);return Number.isNaN(r.getTime())?`${t}`:r.toLocaleString("es-PE",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})},Zt=()=>new Date().toISOString().slice(0,10).replaceAll("-","/"),ee=()=>{const t=Zt();return`${t} - ${t}`},Za=(t,r)=>new Promise((s,c)=>{const p=document.getElementById(t);if(p){p.dataset.loaded==="true"?s():p.addEventListener("load",s,{once:!0});return}const x=document.createElement("script");x.id=t,x.src=r,x.async=!0,x.onload=()=>{x.dataset.loaded="true",s()},x.onerror=c,document.body.appendChild(x)}),Ar=(t,r)=>{if(document.getElementById(t))return;const s=document.createElement("link");s.id=t,s.rel="stylesheet",s.href=r,document.head.appendChild(s)},Or=async()=>{var t,r;Ar("commercial-order-daterangepicker-css","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/css/daterangepicker.css"),window.moment||await Za("commercial-order-moment-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/moment.min.js"),(r=(t=window.$)==null?void 0:t.fn)!=null&&r.daterangepicker||await Za("commercial-order-daterangepicker-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/daterangepicker.js")},un=()=>({orders:{businessId:"",dateRange:ee(),laboratory:"",dispatchStatus:""},issued:{businessId:"",dateRange:ee()},cancelled:{businessId:"",dateRange:ee()},"credit-notes":{businessId:"",dateRange:ee()},visitors:{visitor:"ALICIA ASTO ASTO",dateRange:ee()},"visitors-legacy":{visitor:"",dateRange:ee()},platforms:{businessId:"",dateRange:ee()},multivende:{dateRange:ee(),orderVtex:""}}),Pr=()=>{const t=un();return{...t,orders:{...t.orders,dateRange:""}}},en=t=>{const r=`${t??""}`.trim();return r?r.replaceAll("/","-").slice(0,10):""},mn=t=>{const[r="",s=""]=`${t??""}`.split(/\s+-\s+/);return{start:en(r),end:en(s||r)}},wt=t=>t.filter(Boolean).reduce((r,s)=>r?[r,"and",s]:s,null),aa=(t,r="created_at")=>{const{start:s,end:c}=mn(t);return wt([s?[r,">=",`${s} 00:00:00`]:null,c?[r,"<=",`${c} 23:59:59`]:null])},Mr=t=>{const r=["document_type","<>","Nota de credito"];return t==="issued"?[[["local_status","=","sent"],"or",["local_status","=","accepted"],"or",["local_status","=","observed"],"or",["local_status","=","rejected"]],"and",r]:t==="cancelled"?[["local_status","=","cancelled"],"and",r]:t==="credit-notes"?["document_type","=","Nota de credito"]:null},Lr=(t,r)=>wt([["source_type","=","commercial_order"],Mr(t),r!=null&&r.businessId?["business_id","=",Number(r.businessId)]:null,aa(r==null?void 0:r.dateRange,"created_at")]),Br=t=>wt([t!=null&&t.businessId?["business_id","=",Number(t.businessId)]:null,t!=null&&t.dispatchStatus?["dispatch_status","=",t.dispatchStatus]:null,aa(t==null?void 0:t.dateRange,"created_at")]),Gr=(t,r)=>{const s=`${(t==null?void 0:t.orderVtex)??""}`.trim();return wt([["external_source","=",r],aa(t==null?void 0:t.dateRange,"created_at"),s?[["external_order_id","contains",s],"or",["external_checkout_id","contains",s]]:null])},Qt=t=>{const r=(t==null?void 0:t.client)??(t==null?void 0:t.eventualClient)??(t==null?void 0:t.eventual_client)??null,s=`${(r==null?void 0:r.document_number)??""}`.trim(),c=`${(r==null?void 0:r.full_name)??(r==null?void 0:r.business_name)??""}`.trim();return[s,c].filter(Boolean).join(" | ")||"-"},Xt=t=>`${t??""}`.toUpperCase()==="USD"?"Dolares":"Soles",tn=t=>(t==null?void 0:t.external_reference)||(t==null?void 0:t.external_id)||(t==null?void 0:t.external_status)||"-",Vr=t=>{var r,s;return((r=t==null?void 0:t.referenceDocument)==null?void 0:r.code)??((s=t==null?void 0:t.reference_document)==null?void 0:s.code)??"-"},Ur=t=>{var r,s;return(t==null?void 0:t.cancel_reason)??((r=t==null?void 0:t.metadata)==null?void 0:r.cancel_reason)??((s=t==null?void 0:t.metadata)==null?void 0:s.reason)??"-"},zr=t=>{var r,s;return((r=Ct(t))==null?void 0:r.external_status)??((s=Ct(t))==null?void 0:s.external_reference)??"-"},qr=t=>(t==null?void 0:t.external_order_id)||(t==null?void 0:t.external_checkout_id)||"-",pn=t=>{var p;const r=ea(t);if(r!=null&&r.delivered_at)return r.delivered_at;const c=((t==null?void 0:t.dispatchAssignments)??(t==null?void 0:t.dispatch_assignments)??[]).find(x=>{var m;return(m=x==null?void 0:x.dispatch)==null?void 0:m.delivered_at});return((p=c==null?void 0:c.dispatch)==null?void 0:p.delivered_at)??""},Yr=t=>{const r=t!=null&&t.created_at?new Date(t.created_at):null,s=pn(t)||(t==null?void 0:t.updated_at),c=s?new Date(s):null;if(!r||!c||Number.isNaN(r.getTime())||Number.isNaN(c.getTime()))return"-";const p=Math.max(0,Math.round((c-r)/6e4)),x=Math.floor(p/1440),m=Math.floor(p%1440/60);return x>0?`${x}d ${m}h`:m>0?`${m}h ${p%60}m`:`${p}m`},F=(t,r="")=>{if(t==null)return r;if(typeof t=="object")return t.address??t.reference??t.name??t.description??r;const s=`${t}`;return s==="[object Object]"?r:s},Wr=t=>`${t??""}`.toUpperCase().includes("CREDITO")?"Credito":"Contado",Hr=t=>{const r=`${t??""}`.trim();return r?r.toUpperCase()==="TRANSFERENCIA"?"TRANSFERENCIA [CONTADO]":r:"EFECTIVO [CONTADO]"},Kr=t=>F(t==null?void 0:t.full_address,F(t==null?void 0:t.address,F(t==null?void 0:t.fiscal_address))),Jr=t=>F(t==null?void 0:t.ubigeo,F(t==null?void 0:t.district_ubigeo,F(t==null?void 0:t.inei_ubigeo))),an=t=>{const r=`${t??""}`.trim(),s=r.match(/^(client|eventual)-(\d+)$/);return s?s[2]:r},nn=t=>{var m,g,E;if(t.loading)return t.text;const r=t.data??{},s=t.text||r.name||"",c=(m=r.branch)==null?void 0:m.name,p=(E=(g=r.branch)==null?void 0:g.business)==null?void 0:E.name,x=$("<span>").text(s);return c&&x.append($("<small>").addClass("text-muted ms-1").text(`- ${c}`)),p&&x.append($("<small>").addClass("text-muted ms-1").text(`(${p})`)),x},Z=t=>{if(!(t!=null&&t.current))return;const r=$(t.current);r.empty().val(null),r.trigger(r.data("select2")?"change.select2":"change")},Qr=t=>t.article_id?"Unidad base":"Sin presentacion",Xr=(t,r)=>{const s=(t==null?void 0:t.name)||"Presentacion",c=Te((t==null?void 0:t.units)||1),p=r!=null&&r.article_unit?` ${r.article_unit}`:" unidad(es) base";return`${s} (${c}${p})`},Zr=t=>["Factura","Boleta"].includes(Nt(t)),rn=(t,r)=>{const s=Number(t||0);if(!Zr(r))return{subtotal:Number(s.toFixed(2)),taxAmount:0,total:Number(s.toFixed(2))};const c=Number((s/1.18).toFixed(2));return{subtotal:c,taxAmount:Number((s-c).toFixed(2)),total:Number(s.toFixed(2))}},ei=(t,r="")=>{const s=new Map;return(t??[]).flatMap(c=>{if(!(c!=null&&c.article_id))return[];const p=`${c.article_id}:${c.warehouse_id||r||""}`,x=Number(c.quantity||0),m=Number(c.presentation_units||1)||1,g=Number((x*m).toFixed(3)),E=Number(c.stock_available||0),L=Number(s.get(p)||0),T=Math.max(0,E-L),R=Math.min(g,T),B=Math.max(0,g-R);return s.set(p,L+R),B<=1e-4?[]:[{article:c.article_name||c.article_label||c.article_code||"Articulo",quantity:g,lineQuantity:x,presentationUnits:m,available:T,shortage:B}]})},jt=t=>(t==null?void 0:t.referral_guides)??(t==null?void 0:t.referralGuides)??[],fn=t=>(t==null?void 0:t.external_reference)||[t==null?void 0:t.series,t==null?void 0:t.sequence].filter(Boolean).join("-")||(t==null?void 0:t.code)||"-",ti=t=>t&&!["accepted","cancelled"].includes(t.guide_status),ai=t=>(t==null?void 0:t.delivery_evidences)??(t==null?void 0:t.deliveryEvidences)??[],ea=t=>ai(t)[0]??null,ni=t=>(t==null?void 0:t.tracking_events)??(t==null?void 0:t.trackingEvents)??[],sn=t=>{const r=`${t??""}`.trim();return r.startsWith("blob:")||r.startsWith("data:image/")||/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(r)||r.includes("/delivery-evidence-media/")},ln=()=>{const t=new Date;return t.setMinutes(t.getMinutes()-t.getTimezoneOffset()),t.toISOString().slice(0,16)},yt={lat:-12.046374,lng:-77.042793},te=t=>{const r=Number(t);return Number.isFinite(r)?r:null},Rt=t=>{const r=te(t);return r===null?"":r.toFixed(7)},ae=t=>te(t==null?void 0:t.lat)!==null&&te(t==null?void 0:t.lng)!==null,ri=({modalRef:t,position:r,searchText:s,onPositionChange:c,onSearchTextChange:p,onAddressSelected:x,googleMapsApiKey:m})=>{const g=l.useRef(),[E,L]=l.useState(!1),[T,R]=l.useState(""),[B,ne]=l.useState([]),Q=ae(r)?{lat:te(r.lat),lng:te(r.lng)}:yt,D=(f,k=17)=>{const z=te(f==null?void 0:f.lat),q=te(f==null?void 0:f.lng);z===null||q===null||!g.current||(g.current.setCenter({lat:z,lng:q}),g.current.setZoom(k))},me=f=>{c(f),D(f)};l.useEffect(()=>{if(ae(r)){D(Q);return}D(yt,13)},[r==null?void 0:r.lat,r==null?void 0:r.lng]),l.useEffect(()=>{const f=t==null?void 0:t.current;if(!f)return;const k=()=>{setTimeout(()=>{ae(r)?D(Q):D(yt,13)},180)};return $(f).on("shown.bs.modal",k),()=>$(f).off("shown.bs.modal",k)},[t,r==null?void 0:r.lat,r==null?void 0:r.lng]);const xe=async()=>{var k,z;const f=`${s??""}`.trim();if(!f){ne([]),R("Escribe una direccion para buscar.");return}if(!((z=(k=window.google)==null?void 0:k.maps)!=null&&z.Geocoder)){R("Google Maps aun no termino de cargar.");return}L(!0),R("");try{new window.google.maps.Geocoder().geocode({address:`${f}, Peru`,componentRestrictions:{country:"PE"},region:"PE"},(re,ge)=>{if(L(!1),ge!=="OK"||!Array.isArray(re)||re.length===0){ne([]),R("Sin resultados. Puedes marcar el punto manualmente en el mapa.");return}ne(re.slice(0,5).map(P=>({place_id:P.place_id,display_name:P.formatted_address,lat:P.geometry.location.lat(),lng:P.geometry.location.lng()})))})}catch(q){L(!1),R(`${q.message}. Puedes marcar el punto manualmente en el mapa.`),ne([])}},De=f=>{const k={lat:te(f.lat),lng:te(f.lng)};c(k),p(f.display_name??""),x(f.display_name??""),D(k),ne([])};return a.jsxs("div",{className:"commercial-order-map-picker",children:[a.jsxs("div",{className:"commercial-order-map-search",children:[a.jsxs("div",{children:[a.jsx("label",{className:"form-label",children:"Buscar direccion en mapa"}),a.jsxs("div",{className:"input-group",children:[a.jsx("input",{type:"text",className:"form-control",value:s,onChange:f=>p(f.target.value),onKeyDown:f=>{f.key==="Enter"&&(f.preventDefault(),xe())},placeholder:"Ej. Av. Javier Prado 123, San Isidro"}),a.jsx("button",{type:"button",className:"btn btn-outline-primary",onClick:xe,disabled:E,children:E?"Buscando...":"Buscar"})]})]}),a.jsxs("div",{className:"commercial-order-map-coordinates",children:[a.jsx("label",{className:"form-label",children:"Coordenadas"}),a.jsxs("div",{className:"commercial-order-map-coordinate-values",children:[a.jsx("span",{children:Rt(r==null?void 0:r.lat)||"-"}),a.jsx("span",{children:Rt(r==null?void 0:r.lng)||"-"})]})]})]}),B.length>0&&a.jsx("div",{className:"commercial-order-map-results",children:B.map(f=>a.jsx("button",{type:"button",className:"commercial-order-map-result",onClick:()=>De(f),children:f.display_name},`${f.place_id}-${f.lat}-${f.lng}`))}),T&&a.jsx("small",{className:"text-muted d-block mt-1",children:T}),a.jsx(hr,{googleMapsApiKey:m,language:"es",region:"PE",onError:()=>R("No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio."),children:a.jsx(br,{mapContainerClassName:"commercial-order-map-canvas",center:Q,zoom:ae(r)?17:13,options:{clickableIcons:!0,fullscreenControl:!0,gestureHandling:"greedy",mapTypeControl:!0,scrollwheel:!0,streetViewControl:!1},onLoad:f=>{g.current=f,setTimeout(()=>{ae(r)?D(Q):D(yt,13)},120)},onClick:f=>{const k={lat:f.latLng.lat(),lng:f.latLng.lng()};me(k)},children:ae(r)&&a.jsx(xr,{position:Q,draggable:!0,onDragEnd:f=>me({lat:f.latLng.lat(),lng:f.latLng.lng()})})})}),a.jsx("small",{className:"text-muted d-block mt-2",children:"Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega."})]})},ii=t=>{const r=`${fr.GMAPS_API_KEY??""}`.trim();return r?a.jsx(ri,{...t,googleMapsApiKey:r}):a.jsx("div",{className:"commercial-order-map-picker",children:a.jsx("div",{className:"commercial-order-map-empty",children:"Configura Google Maps API Key en Sistemas > Datos generales > Integraciones para habilitar el mapa."})})},si=t=>!t||t.status===null||`${t.order_status??""}`=="cancelled"?!1:`${t.dispatch_status??"pending"}`=="pending",li=t=>{if(!t)return[];const r=ni(t).map(m=>({date:m.happened_at??m.created_at,status:[m.title,m.description].filter(Boolean).join(" - ")})),s=[{date:t.created_at,status:"La orden ingreso en el sistema"}];t.approved_at&&["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)?s.push({date:t.approved_at,status:"La orden paso a preparacion"}):t.approved_at&&t.order_status==="confirmed"?s.push({date:t.approved_at,status:"La orden fue confirmada"}):["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)&&s.push({date:t.updated_at,status:"La orden paso a preparacion"});const c=(t.dispatch_assignments??t.dispatchAssignments??[]).filter(m=>(m==null?void 0:m.status)!==!1&&(m==null?void 0:m.status)!==0&&(m==null?void 0:m.dispatch)).sort((m,g)=>{var E,L,T,R;return new Date(((E=m==null?void 0:m.dispatch)==null?void 0:E.departed_at)||((L=m==null?void 0:m.dispatch)==null?void 0:L.scheduled_date)||0)-new Date(((T=g==null?void 0:g.dispatch)==null?void 0:T.departed_at)||((R=g==null?void 0:g.dispatch)==null?void 0:R.scheduled_date)||0)}),p=c.find(m=>{var g;return["in_route","delivered","closed"].includes((g=m==null?void 0:m.dispatch)==null?void 0:g.dispatch_status)});p?(s.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:`Manifiesto ${p.dispatch.manifest_code||p.dispatch.code||""}`.trim()}),s.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:"El pedido salio en ruta"})):t.dispatch_status==="in_route"&&s.push({date:t.updated_at,status:"El pedido salio en ruta"}),(t.dispatch_status==="dispatched"||c.some(m=>{var g;return((g=m==null?void 0:m.dispatch)==null?void 0:g.dispatch_status)==="dispatched"}))&&s.push({date:t.updated_at,status:"El pedido paso a despacho"}),jt(t).forEach(m=>{s.push({date:m.issue_date??m.created_at??t.updated_at,status:`Guia de remision ${fn(m)} - ${on(m.guide_status)}`})});const x=c.find(m=>{var g;return["delivered","closed"].includes((g=m==null?void 0:m.dispatch)==null?void 0:g.dispatch_status)});return x?s.push({date:x.dispatch.delivered_at??x.dispatch.updated_at??x.dispatch.created_at,status:"El pedido fue entregado"}):t.dispatch_status==="delivered"&&s.push({date:t.updated_at,status:"El pedido fue entregado"}),(t.order_status==="cancelled"||t.dispatch_status==="cancelled")&&s.push({date:t.updated_at,status:"El pedido fue cancelado"}),[...r,...s].filter(m=>m.date).sort((m,g)=>new Date(m.date)-new Date(g.date))},ci=({title:t,config:r})=>{const s=(r==null?void 0:r.pageSize)??20;return a.jsx("div",{className:"row",children:a.jsx("div",{className:"col-12",children:a.jsxs("div",{className:"card",children:[a.jsx("div",{className:"card-header",children:t}),a.jsxs("div",{className:"card-body",children:[a.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[a.jsxs("div",{className:"d-flex align-items-center gap-2",children:[a.jsx("label",{className:"form-label mb-0",children:"Elementos :"}),a.jsx("select",{className:"form-select form-select-sm commercial-order-page-size",defaultValue:s,children:[10,20,25,50].map(c=>a.jsx("option",{value:c,children:c},`commercial-list-size-${c}`))})]}),a.jsxs("div",{className:"d-flex align-items-center gap-2",children:[a.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),a.jsx("input",{className:"form-control form-control-sm commercial-order-list-search"})]})]}),((r==null?void 0:r.exports)??[]).length>0&&a.jsx("div",{className:"d-flex flex-wrap gap-1 mb-2",children:r.exports.map(c=>a.jsx("button",{type:"button",className:"btn btn-sm btn-light",children:c},`commercial-list-export-${c}`))}),a.jsx("div",{className:"table-responsive commercial-order-legacy-table",children:a.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[a.jsx("thead",{children:a.jsx("tr",{children:((r==null?void 0:r.headers)??[]).map(c=>a.jsx("th",{children:c},`commercial-list-header-${c}`))})}),a.jsx("tbody",{children:a.jsx("tr",{children:a.jsx("td",{colSpan:((r==null?void 0:r.headers)??[]).length||1,className:"text-muted",children:"No existen elementos"})})})]})}),a.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2",children:[a.jsx("span",{className:"text-muted",children:"No hay elementos a mostrar"}),a.jsxs("div",{className:"d-flex align-items-center gap-2 text-muted",children:[a.jsx("span",{children:"Anterior"}),a.jsx("button",{type:"button",className:"btn btn-sm btn-light active",children:"1"}),a.jsx("span",{children:"Siguiente"})]})]})]})]})})})},oi=({requiredPermission:t="orders",externalSource:r=null,pageTitle:s="Pedidos comerciales"})=>{var Ea;G.externalSource=null;const c=l.useRef(),p=l.useRef(),x=l.useRef(),m=l.useRef(),g=l.useRef(),E=l.useRef(),L=l.useRef(),T=l.useRef(),R=l.useRef(),B=l.useRef(),ne=l.useRef(),Q=l.useRef(),D=l.useRef(),me=l.useRef(),xe=l.useRef(),De=l.useRef(),f=l.useRef(),k=l.useRef(),z=l.useRef(),q=l.useRef(),re=l.useRef(),ge=l.useRef(),P=l.useRef(),Xe=l.useRef(),hn=l.useRef(),Ze=l.useRef(),et=l.useRef(),Ie=l.useRef(),tt=l.useRef(),at=l.useRef(),nt=l.useRef(),rt=l.useRef(),it=l.useRef(),st=l.useRef(),lt=l.useRef(),ct=l.useRef(),bn=l.useRef(),Y=l.useRef(),_e=l.useRef(),ie=l.useRef(),ve=l.useRef(),ye=l.useRef(),ot=l.useRef(),kt=l.useRef({}),[xn,gn]=l.useState(!1),[je,na]=l.useState(""),[W,dt]=l.useState(""),[H,ut]=l.useState(""),[Ne,Ft]=l.useState(""),[Ce,St]=l.useState(""),[K,Ae]=l.useState(""),[_n,pe]=l.useState(""),[$t,Et]=l.useState({lat:"",lng:""}),[vn,mt]=l.useState(""),[yn,ra]=l.useState([]),[Oe,pt]=l.useState([]),[di,Re]=l.useState([]),[X,J]=l.useState([Je()]),[Pe,ia]=l.useState("Factura"),[se,Tt]=l.useState(null),[sa,jn]=l.useState(null),[we,Nn]=l.useState(null),[la,Dt]=l.useState(null),[fe,It]=l.useState(""),[At,Cn]=l.useState([]),[Ot,ca]=l.useState(""),[Pt,oa]=l.useState(!1),[C,Rn]=l.useState(r?"multivende":"orders"),[wn,kn]=l.useState([]),[da,Fn]=l.useState(un()),[Me,Sn]=l.useState(Pr()),[w,Mt]=l.useState({recipient_name:"",recipient_document_type:"DNI",recipient_document_number:"",recipient_phone:"",delivered_at:ln(),evidence_notes:"",evidence_url:"",latitude:"",longitude:""}),$n=l.useMemo(()=>{const e=new cn;return e.externalSource=r||Ua,e},[r]),ft=_t.find(e=>e.id===C)??_t[0],ht=da[C]??{},ua=Me[C]??{},En=l.useMemo(()=>Br(Me.orders),[Me.orders]),Tn=l.useMemo(()=>Lr(C,ua),[C,ua]),Dn=l.useMemo(()=>Gr(Me.multivende,r||Ua),[Me.multivende,r]),In=l.useMemo(()=>{var n;const e=new URLSearchParams;return je&&e.append("business_id",je),W&&e.append("business_branch_id",W),H&&e.append("warehouse_id",H),Ne&&e.append("client_id",Ne),Ce&&e.append("eventual_client_id",Ce),K&&e.append("client_distribution_network_id",K),(n=P.current)!=null&&n.value&&e.append("issue_date",P.current.value),`/api/admin/commercial-orders/articles?${e.toString()}`},[je,W,H,Ne,Ce,K]),An=l.useMemo(()=>W?["business_branch_id","=",Number(W)]:null,[W]);l.useEffect(()=>()=>{fe!=null&&fe.startsWith("blob:")&&URL.revokeObjectURL(fe)},[fe]),l.useEffect(()=>{let e=!0;return Kt.getBusinesses().then(n=>{e&&kn(n)}),()=>{e=!1}},[]),l.useEffect(()=>{if(!se)return;const e=()=>Tt(null),n=i=>{i.key==="Escape"&&e()};return document.addEventListener("click",e),document.addEventListener("keydown",n),window.addEventListener("resize",e),window.addEventListener("scroll",e,!0),()=>{document.removeEventListener("click",e),document.removeEventListener("keydown",n),window.removeEventListener("resize",e),window.removeEventListener("scroll",e,!0)}},[se]);const ma=e=>(kt.current[e]||(kt.current[e]=l.createRef()),kt.current[e]);l.useEffect(()=>{X.forEach(e=>{const n=ma(e.uid);!n.current||!e.article_id||!e.article_label||`${$(n.current).val()}`==`${e.article_id}`||$e(n.current,e.article_id,e.article_label)})},[X]);const pa=async(e,n=null)=>{if(!e){ra([]),dt("");return}const d=(await G.getBranchesByBusiness(e)??[]).filter(u=>u.status!==null);if(ra(d),n&&d.some(u=>`${u.id}`==`${n}`)){dt(`${n}`);return}dt("")},fa=e=>{if(!e)return;const n=Kr(e),i=Jr(e);n&&Y.current&&(Y.current.value=n),i&&ie.current&&(ie.current.value=i),n&&mt(n)},ha=async(e,n=null,i=null)=>{var v;if(!e){pt([]),Ae(""),Re([]),pe("");return}const u=(await G.getDistributionNetworks(e)??[]).filter(b=>b.status!==null);pt(u);const o=n||((v=u.find(b=>b.is_default))==null?void 0:v.id);if(o&&u.some(b=>`${b.id}`==`${o}`)){Ae(`${o}`),await ba(o,null,u);return}Ae(""),Re([]),pe(""),fa(i)},ba=async(e,n=null,i=null)=>{var b,N;if(!e){Re([]),pe("");return}let d=[];const u=(i??Oe).find(_=>`${_.id}`==`${e}`);(((b=u==null?void 0:u.addresses)==null?void 0:b.length)??0)>0?d=u.addresses:d=await G.getDeliveryAddresses(e);const o=(d??[]).filter(_=>_.status!==null);Re(o);const v=n||((N=o.find(_=>_.is_default))==null?void 0:N.id);if(v&&o.some(_=>`${_.id}`==`${v}`)){pe(`${v}`),On(o.find(_=>`${_.id}`==`${v}`));return}pe("")},On=e=>{e&&(Y.current&&(Y.current.value=F(e.address)),_e.current&&(_e.current.value=F(e.reference)),ie.current&&(ie.current.value=F(e.ubigeo)),ve.current&&(ve.current.value=F(e.contact_name)),ye.current&&(ye.current.value=F(e.contact_phone)),mt(F(e.address)),ae({lat:e.latitude,lng:e.longitude})&&Et({lat:Number(e.latitude),lng:Number(e.longitude)}))},xa=async(e,n={})=>{var o,v,b;const i=n.article_id??e.article_id,d=Number(n.quantity??e.quantity??0),u=n.presentation_id??e.presentation_id;return!i||!H||d<=0?null:await G.resolvePrice({article_id:i,presentation_id:u||null,quantity:d,business_id:je||null,business_branch_id:W||null,warehouse_id:H||null,client_id:Ne||null,eventual_client_id:Ce||null,client_distribution_network_id:K||null,issue_date:((o=P.current)==null?void 0:o.value)||null,commercial_channel:((v=Oe.find(N=>`${N.id}`==`${K}`))==null?void 0:v.commercial_channel)||null,segment:((b=Oe.find(N=>`${N.id}`==`${K}`))==null?void 0:b.segment)||null})},Lt=async(e=null)=>{const n=e??X;for(const i of n){if(!i.article_id)continue;const d=await xa(i);d&&J(u=>u.map(o=>o.uid!==i.uid?o:be({...o,stock_available:Number(d.stock_available||0),price_unit:qa(o,d),price_source:Ya(o,d),price_list_code:d.price_list_code||""})))}},ga=e=>{e==="regular"?(St(""),Z(q)):e==="eventual"&&(Ft(""),pt([]),Ae(""),Re([]),pe(""),Z(z))},Bt=async(e=null)=>{var b,N,_,I;gn(!!(e!=null&&e.id)),me.current&&(me.current.value=(e==null?void 0:e.id)??""),xe.current&&(xe.current.value=(e==null?void 0:e.code)??"Se genera al guardar"),P.current&&(P.current.value=e!=null&&e.issue_date?e.issue_date.toString().slice(0,10):new Date().toISOString().slice(0,10)),Xe.current&&(Xe.current.value=e!=null&&e.promised_delivery_at?e.promised_delivery_at.toString().slice(0,10):""),ia(Nt((e==null?void 0:e.document_type)??"Factura")),Ze.current&&(Ze.current.value=(e==null?void 0:e.currency)??"PEN"),et.current&&(et.current.value=(e==null?void 0:e.payment_condition)??"Contado"),Ie.current&&(Ie.current.value=Hr(e==null?void 0:e.payment_method)),rt.current&&(rt.current.value=(e==null?void 0:e.installments)??1),it.current&&(it.current.value=e!=null&&e.first_due_date?e.first_due_date.toString().slice(0,10):""),st.current&&(st.current.value=(e==null?void 0:e.order_status)??(e!=null&&e.external_source?"pending":"draft")),lt.current&&(lt.current.value=(e==null?void 0:e.dispatch_status)??"pending"),ct.current&&(ct.current.value=(e==null?void 0:e.billing_status)??"pending"),Y.current&&(Y.current.value=F(e==null?void 0:e.delivery_address)),_e.current&&(_e.current.value=F(e==null?void 0:e.delivery_reference)),ie.current&&(ie.current.value=F(e==null?void 0:e.ubigeo)),ve.current&&(ve.current.value=F(e==null?void 0:e.dispatch_contact_name)),ye.current&&(ye.current.value=F(e==null?void 0:e.dispatch_contact_phone)),tt.current&&(tt.current.value=(e==null?void 0:e.purchase_order)??""),at.current&&(at.current.value=(e==null?void 0:e.guide_number)??""),nt.current&&(nt.current.value=(e==null?void 0:e.referral_guide)??""),ge.current&&(ge.current.value=(e==null?void 0:e.doctor_name)??""),ot.current&&(ot.current.value=(e==null?void 0:e.observations)??""),Et({lat:ae({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lat):"",lng:ae({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lng):""}),mt(F(e==null?void 0:e.delivery_address));const n=e!=null&&e.business_id?`${e.business_id}`:"",i=e!=null&&e.warehouse_id?`${e.warehouse_id}`:"",d=e!=null&&e.client_id?`${e.client_id}`:"",u=e!=null&&e.eventual_client_id?`${e.eventual_client_id}`:"";na(n),ut(i),Ft(d),St(u),n&&((b=e==null?void 0:e.business)!=null&&b.name)?$e(De.current,n,e.business.name):Z(De),i&&((N=e==null?void 0:e.warehouse)!=null&&N.name)?$e(k.current,i,e.warehouse.name):Z(k),d&&((_=e==null?void 0:e.client)!=null&&_.full_name)?$e(z.current,d,`${e.client.document_number??""} - ${e.client.full_name}`.trim()):Z(z),u&&((I=e==null?void 0:e.eventual_client)!=null&&I.business_name)?$e(q.current,u,`${e.eventual_client.document_number??""} - ${e.eventual_client.business_name}`.trim()):Z(q),e!=null&&e.seller_id&&(e!=null&&e.seller)?$e(re.current,e.seller_id,Fr(e.seller)):Z(re);const o=((e==null?void 0:e.items)??[]).map(y=>{var ce,oe,de,ue,j,S,Le,Be,Ge,Ve,Ue,ze,qe,Ye,We,He;const h=y.article??null,V=((h==null?void 0:h.presentations)??[]).filter(A=>(A==null?void 0:A.status)!==!1&&(A==null?void 0:A.status)!==0),M=y.presentation??V[0]??null,he=Number(y.presentation_units??(M==null?void 0:M.units)??1)||1;return be({uid:crypto.randomUUID(),article_id:y.article_id?`${y.article_id}`:"",article_label:h?`${h.code??""} - ${h.name??""}`.trim():"",article_code:(h==null?void 0:h.code)??y.external_sku??"",article_lot:(h==null?void 0:h.default_lot)??"",article_name:(h==null?void 0:h.name)??"",article_unit:((ce=h==null?void 0:h.unit)==null?void 0:ce.symbol)??((oe=h==null?void 0:h.unit)==null?void 0:oe.name)??"",article_laboratory:((de=h==null?void 0:h.laboratory)==null?void 0:de.name)??"",article_principle:((ue=h==null?void 0:h.activePrinciple)==null?void 0:ue.name)??((j=h==null?void 0:h.active_principle)==null?void 0:j.name)??"",presentations:V.map(A=>({id:`${A.id}`,name:A.name??"Presentacion",units:Number(A.units||1),price:Number(A.price||0)})),presentation_id:M!=null&&M.id?`${M.id}`:"",presentation_units:he,stock_available:Number(y.stock_available||0),reserved_quantity:Number(y.reserved_quantity||0),price_unit:Number(y.price_unit||0),quantity:Number(y.quantity||1),discount_type:((Le=(S=y.external_payload)==null?void 0:S.commercial_form)==null?void 0:Le.discount_type)??"none",discount_value:Number(((Ge=(Be=y.external_payload)==null?void 0:Be.commercial_form)==null?void 0:Ge.discount_value)||0),discount_amount:Number(((Ue=(Ve=y.external_payload)==null?void 0:Ve.commercial_form)==null?void 0:Ue.discount_amount)||0),gross_total:Number(((qe=(ze=y.external_payload)==null?void 0:ze.commercial_form)==null?void 0:qe.gross_total)||0),total:Number(y.total||0),price_source:y.price_source||"fallback",price_list_code:((We=(Ye=y==null?void 0:y.price_list_item)==null?void 0:Ye.price_list)==null?void 0:We.code)||((He=e==null?void 0:e.price_list)==null?void 0:He.code)||""})}),v=o.length?o:[Je()];J(v),$(m.current).modal("show"),await pa((e==null?void 0:e.business_id)??null,(e==null?void 0:e.business_branch_id)??null),d?(await ha(d,(e==null?void 0:e.client_distribution_network_id)??null),e!=null&&e.client_distribution_network_id&&await ba(e.client_distribution_network_id,(e==null?void 0:e.client_delivery_address_id)??null)):(pt([]),Ae(""),Re([]),pe(""))},Pn=async e=>{var u,o,v,b,N,_,I,y,h,V,M,he,ce,oe,de,ue,j,S,Le,Be,Ge,Ve,Ue,ze,qe,Ye,We,He,A,Ta,Da,Ia,Aa;e.preventDefault();const n={id:((u=me.current)==null?void 0:u.value)||void 0,external_source:r||void 0,business_id:je||null,business_branch_id:W||null,warehouse_id:H||null,client_id:Ne||null,eventual_client_id:Ce||null,seller_id:((o=re.current)==null?void 0:o.value)||null,client_distribution_network_id:K||null,client_delivery_address_id:_n||null,document_type:Pe,currency:((v=Ze.current)==null?void 0:v.value)||"PEN",payment_condition:Wr(((b=Ie.current)==null?void 0:b.value)||((N=et.current)==null?void 0:N.value)||"Contado"),payment_method:((_=Ie.current)==null?void 0:_.value)||"",purchase_order:((y=(I=tt.current)==null?void 0:I.value)==null?void 0:y.trim())||"",guide_number:((V=(h=at.current)==null?void 0:h.value)==null?void 0:V.trim())||"",referral_guide:((he=(M=nt.current)==null?void 0:M.value)==null?void 0:he.trim())||"",doctor_name:((oe=(ce=ge.current)==null?void 0:ce.value)==null?void 0:oe.trim())||"",issue_date:((de=P.current)==null?void 0:de.value)||"",promised_delivery_at:((ue=Xe.current)==null?void 0:ue.value)||null,installments:((j=rt.current)==null?void 0:j.value)||1,first_due_date:((S=it.current)==null?void 0:S.value)||null,order_status:((Le=st.current)==null?void 0:Le.value)||(r?"pending":"draft"),dispatch_status:((Be=lt.current)==null?void 0:Be.value)||"pending",billing_status:((Ge=ct.current)==null?void 0:Ge.value)||"pending",tax_amount:Ut.taxAmount,delivery_address:((Ue=(Ve=Y.current)==null?void 0:Ve.value)==null?void 0:Ue.trim())||"",delivery_reference:((qe=(ze=_e.current)==null?void 0:ze.value)==null?void 0:qe.trim())||"",ubigeo:((We=(Ye=ie.current)==null?void 0:Ye.value)==null?void 0:We.trim())||"",map_lat:Rt($t.lat)||null,map_lng:Rt($t.lng)||null,dispatch_contact_name:((A=(He=ve.current)==null?void 0:He.value)==null?void 0:A.trim())||"",dispatch_contact_phone:((Da=(Ta=ye.current)==null?void 0:Ta.value)==null?void 0:Da.trim())||"",observations:((Aa=(Ia=ot.current)==null?void 0:Ia.value)==null?void 0:Aa.trim())||"",items:X.map(O=>({article_id:O.article_id||null,presentation_id:O.presentation_id||null,warehouse_id:H||null,stock_available:O.stock_available,reserved_quantity:O.reserved_quantity,presentation_units:O.presentation_units,price_unit:O.price_unit,quantity:O.quantity,gross_total:O.gross_total,discount_type:O.discount_type,discount_value:O.discount_value,discount_amount:O.discount_amount,total:O.total,status:!0}))},i=ei(X,H);if(i.length>0){const O=`
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${i.map(Fe=>`<li><strong>${$r(Fe.article)}</strong>: faltan ${Te(Fe.shortage)} unidad(es) base para completar ${Te(Fe.quantity)}. Cantidad: ${Te(Fe.lineQuantity)} x ${Te(Fe.presentationUnits)}. Disponible: ${Te(Fe.available)}.</li>`).join("")}
          </ul>
        </div>
      `,{isConfirmed:or}=await Se.fire({title:"Stock insuficiente",html:O,icon:"warning",showCancelButton:!0,confirmButtonText:"Crear de todas formas",cancelButtonText:"Revisar pedido"});if(!or)return;n.allow_stock_shortage=!0}await G.save(n)&&($(c.current).dxDataGrid("instance").refresh(),$(m.current).modal("hide"))},Mn=async e=>{const n=e.target.value||"";na(n),ut(""),Z(k),await pa(n,null)},Ln=e=>{const n=e.target.value||"";dt(n),ut(""),Z(k)},Bn=async e=>{const n=e.target.value||"";ut(n),await Lt()},Gn=async e=>{var d,u;const n=an(e.target.value),i=((u=(d=$(e.target).select2("data"))==null?void 0:d[0])==null?void 0:u.data)??null;Ft(n),ga("regular"),fa(i),await ha(n,null,i),await Lt()},Vn=async e=>{const n=an(e.target.value);St(n),ga("eventual"),await Lt()},ke=(e,n,i)=>{Fn(d=>({...d,[e]:{...d[e]??{},[n]:i}}))},_a=(e=C)=>{var i;const n=e==="multivende"?x:((i=_t.find(d=>d.id===e))==null?void 0:i.kind)==="billing"?p:c;return n.current?$(n.current).dxDataGrid("instance"):null},va=(e=C)=>{const n=_a(e);n&&n.refresh()},ya=(e=C)=>{Sn(n=>({...n,[e]:da[e]??{}})),setTimeout(()=>va(e),0)},Un=e=>{var n;(n=e==null?void 0:e.preventDefault)==null||n.call(e),ya(C)},ja=(e=!1)=>{const n=C;e&&ya(n),setTimeout(()=>{const i=_a(n);i!=null&&i.exportToExcel&&i.exportToExcel(!1)},e?350:0)},zn=async({id:e,field:n,value:i})=>{await G.boolean({id:e,field:n,value:i})&&$(c.current).dxDataGrid("instance").refresh()},Na=e=>{jn(e),$(ne.current).modal("show")},qn=e=>{const n=ea(e);Nn(e),Dt(null),It(sn(n==null?void 0:n.evidence_url)?n.evidence_url:""),Mt({recipient_name:(n==null?void 0:n.recipient_name)??(e==null?void 0:e.dispatch_contact_name)??"",recipient_document_type:(n==null?void 0:n.recipient_document_type)??"DNI",recipient_document_number:(n==null?void 0:n.recipient_document_number)??"",recipient_phone:(n==null?void 0:n.recipient_phone)??(e==null?void 0:e.dispatch_contact_phone)??"",delivered_at:n!=null&&n.delivered_at?`${n.delivered_at}`.replace(" ","T").slice(0,16):ln(),evidence_notes:(n==null?void 0:n.evidence_notes)??"",evidence_url:(n==null?void 0:n.evidence_url)??"",latitude:(n==null?void 0:n.latitude)??"",longitude:(n==null?void 0:n.longitude)??""}),navigator.geolocation&&navigator.geolocation.getCurrentPosition(i=>{Mt(d=>({...d,latitude:d.latitude||i.coords.latitude,longitude:d.longitude||i.coords.longitude}))},()=>{},{enableHighAccuracy:!0,timeout:5e3}),setTimeout(()=>{D.current&&(D.current.value="")},0),$(Q.current).modal("show")},Yn=e=>{var i;const n=((i=e.target.files)==null?void 0:i[0])??null;Dt(n),It(n?URL.createObjectURL(n):sn(w.evidence_url)?w.evidence_url:"")},le=(e,n)=>Mt(i=>({...i,[e]:n})),Wn=async e=>{if(e.preventDefault(),!(we!=null&&we.id))return;const n=(we.dispatch_assignments??we.dispatchAssignments??[]).filter(u=>(u==null?void 0:u.status)!==!1&&(u==null?void 0:u.status)!==0&&(u==null?void 0:u.dispatch)).sort((u,o)=>{var v,b;return new Date(((v=o==null?void 0:o.dispatch)==null?void 0:v.scheduled_date)||(o==null?void 0:o.created_at)||0)-new Date(((b=u==null?void 0:u.dispatch)==null?void 0:b.scheduled_date)||(u==null?void 0:u.created_at)||0)})[0],i=new FormData;n!=null&&n.dispatch_id&&i.append("dispatch_id",n.dispatch_id),i.append("recipient_name",w.recipient_name??""),i.append("recipient_document_type",w.recipient_document_type??"DNI"),i.append("recipient_document_number",w.recipient_document_number??""),i.append("recipient_phone",w.recipient_phone??""),i.append("delivered_at",w.delivered_at??""),i.append("evidence_notes",w.evidence_notes??""),i.append("evidence_url",w.evidence_url??""),i.append("latitude",w.latitude??""),i.append("longitude",w.longitude??""),la&&i.append("evidence_file",la),await G.saveDeliveryEvidence(we.id,i)&&(Dt(null),It(""),D.current&&(D.current.value=""),$(Q.current).modal("hide"),$(c.current).dxDataGrid("instance").refresh())},Ca=async e=>{const n=jt(e)[0];if(n){if(ti(n)){const d=await Se.fire({title:"Guia de remision",text:`La guia ${fn(n)} esta ${on(n.guide_status).toLowerCase()}.`,icon:"question",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Ver PDF",cancelButtonText:"Cancelar"});if(d.isConfirmed){const u=await Va.issue(n.id);if(!(u!=null&&u.data))return;$(c.current).dxDataGrid("instance").refresh(),await xt(gt.referralGuide(u.data));return}if(!d.isDenied)return}await xt(gt.referralGuide(n));return}const i=await Va.prepareFromCommercialOrder(e.id);i!=null&&i.data&&($(c.current).dxDataGrid("instance").refresh(),await xt(gt.referralGuide(i.data)))},Hn=async e=>{const{isConfirmed:n}=await Se.fire({title:"Eliminar pedido comercial",text:"Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!n||!await G.delete(e)||$(c.current).dxDataGrid("instance").refresh()},Kn=()=>{E.current&&(E.current.value=""),$(g.current).modal("show"),setTimeout(()=>{var e;return(e=E.current)==null?void 0:e.focus()},150)},Jn=async e=>{var i,d;e.preventDefault();const n=((d=(i=E.current)==null?void 0:i.value)==null?void 0:d.trim())||"";if(!n){await Se.fire({title:"CHECK OUT ID requerido",text:"Ingresa el CHECK OUT ID del pedido Multivende.",icon:"warning",confirmButtonText:"Entendido"});return}await Se.fire({title:"Integracion pendiente",text:`El formulario ya captura el CHECK OUT ID ${n}. Falta conectar el servicio de Multivende para registrar el pedido automaticamente.`,icon:"info",confirmButtonText:"Aceptar"})},Ra=()=>{T.current&&(T.current.value=""),R.current&&(R.current.value=""),B.current&&(B.current.value="1")},wa=async()=>{oa(!0);try{const e=await Ga.paginate({take:100,skip:0,requireTotalCount:!0,sort:[{selector:"id",desc:!1}]});Cn((e==null?void 0:e.data)??[])}finally{oa(!1)}},Qn=async()=>{Ra(),ca(""),$(L.current).modal("show"),await wa(),setTimeout(()=>{var e;return(e=R.current)==null?void 0:e.focus()},150)},Xn=e=>{var n;T.current&&(T.current.value=(e==null?void 0:e.id)??""),R.current&&(R.current.value=(e==null?void 0:e.description)??""),B.current&&(B.current.value=e!=null&&e.status?"1":"0"),(n=R.current)==null||n.focus()},Zn=async()=>{var i,d,u,o;const e=((d=(i=R.current)==null?void 0:i.value)==null?void 0:d.trim())||"";if(!e){await Se.fire({title:"Motivo requerido",text:"Ingresa la descripcion del motivo de retraso.",icon:"warning",confirmButtonText:"Entendido"});return}await Ga.save({id:((u=T.current)==null?void 0:u.value)||void 0,description:e,status:((o=B.current)==null?void 0:o.value)==="1"})&&(Ra(),await wa())},er=async(e,n)=>{var y,h,V,M,he,ce,oe,de,ue;$(n.target).data("select2")&&$(n.target).select2("close");const i=(y=$(n.target).select2("data"))==null?void 0:y[0],d=(i==null?void 0:i.data)??null,u=n.target.value||"";if(!u){J(j=>j.map(S=>S.uid===e?{...Je(),uid:S.uid}:S));return}const o=d??await G.getArticleById(u),v=((o==null?void 0:o.presentations)??[]).filter(j=>(j==null?void 0:j.status)!==!1&&(j==null?void 0:j.status)!==0),b=v[0]??null,N=o?`${o.code??""} - ${o.name??""}`.trim():(i==null?void 0:i.text)??u,_={article_id:u,article_label:N,article_code:(o==null?void 0:o.code)??"",article_lot:(o==null?void 0:o.default_lot)??"",article_name:(o==null?void 0:o.name)??"",article_unit:((h=o==null?void 0:o.unit)==null?void 0:h.symbol)??((V=o==null?void 0:o.unit)==null?void 0:V.name)??"",article_laboratory:((M=o==null?void 0:o.laboratory)==null?void 0:M.name)??"",article_principle:((he=o==null?void 0:o.activePrinciple)==null?void 0:he.name)??((ce=o==null?void 0:o.active_principle)==null?void 0:ce.name)??"",presentations:v.map(j=>({id:`${j.id}`,name:j.name??"Presentacion",units:Number(j.units||1),price:Number(j.price||0)})),presentation_id:b?`${b.id}`:"",presentation_units:Number((b==null?void 0:b.units)||1),quantity:1};J(j=>j.map(S=>S.uid===e?be({...S,..._}):S));const I=await G.resolvePrice({article_id:u,presentation_id:b?`${b.id}`:null,quantity:1,business_id:je||null,business_branch_id:W||null,warehouse_id:H||null,client_id:Ne||null,eventual_client_id:Ce||null,client_distribution_network_id:K||null,issue_date:((oe=P.current)==null?void 0:oe.value)||null,commercial_channel:((de=Oe.find(j=>`${j.id}`==`${K}`))==null?void 0:de.commercial_channel)||null,segment:((ue=Oe.find(j=>`${j.id}`==`${K}`))==null?void 0:ue.segment)||null});I&&J(j=>j.map(S=>S.uid===e?be({...S,..._,stock_available:Number(I.stock_available||0),price_unit:Number(I.price_unit||0),price_source:I.source||"fallback",price_list_code:I.price_list_code||""}):S))},Gt=async(e,n,i)=>{const d=X.find(N=>N.uid===e);if(!d)return;const u=n==="presentation_id"?d.presentations.find(N=>`${N.id}`==`${i}`):null,o=be({...d,[n]:i,...n==="presentation_id"?{presentation_units:Number((u==null?void 0:u.units)||1)}:{}});if(n==="price_unit"&&(o.price_source="manual",o.price_list_code=""),J(N=>N.map(_=>_.uid===e?o:_)),!["quantity","presentation_id"].includes(n))return;const v=o.presentations.find(N=>`${N.id}`==`${n==="presentation_id"?i:o.presentation_id}`),b=await xa(o,{quantity:n==="quantity"?i:o.quantity,presentation_id:n==="presentation_id"?i:o.presentation_id});b&&J(N=>N.map(_=>_.uid!==e?_:be({..._,presentation_units:Number((v==null?void 0:v.units)||_.presentation_units||1),stock_available:Number(b.stock_available||0),price_unit:qa(_,b,n==="presentation_id"),price_source:Ya(_,b,n==="presentation_id"),price_list_code:n==="presentation_id"?b.price_list_code||"":ta(_)?_.price_list_code:b.price_list_code||""})))},tr=(e,n)=>{const i=Number(n||0);J(d=>d.map(u=>u.uid!==e?u:be({...u,discount_type:i>0?"percent":"none",discount_value:i>0?i:0})))},ar=(e,n)=>{n.preventDefault(),n.stopPropagation();const i=n.currentTarget.getBoundingClientRect();Tt(d=>(d==null?void 0:d.uid)===e?null:{uid:e,top:i.bottom+4,left:i.left,width:Math.max(i.width,130)})},ka=(e,n)=>{tr(e,n),Tt(null)},nr=()=>J(e=>[...e,Je()]),rr=e=>{J(n=>{const i=n.filter(d=>d.uid!==e);return i.length?i:[Je()]})},Vt=l.useMemo(()=>X.reduce((e,n)=>e+Number(n.total||0),0),[X]),Ut=l.useMemo(()=>rn(Vt,Pe),[Vt,Pe]),Fa=l.useMemo(()=>li(sa),[sa]),zt=l.useMemo(()=>{const e=Ot.trim().toLowerCase();return e?At.filter(n=>[n.description,n.status?"Activo":"Inactivo",Jt(n.creator),Xa(n.created_at)].some(i=>`${i??""}`.toLowerCase().includes(e))):At},[At,Ot]),ir=(e,n)=>a.jsxs("div",{className:`commercial-order-filter-field commercial-order-filter-${n.key}`,children:[a.jsx("label",{className:"form-label",children:n.label}),n.type==="business"?a.jsxs("select",{className:"form-select",value:ht[n.key]??"",onChange:i=>ke(e,n.key,i.target.value),children:[a.jsx("option",{value:"",children:"Todos"}),wn.map(i=>a.jsx("option",{value:i.id,children:i.name},`commercial-order-filter-business-${i.id}`))]}):n.type==="select"?a.jsx("select",{className:"form-select",value:ht[n.key]??"",onChange:i=>ke(e,n.key,i.target.value),children:(n.options??[]).map(i=>a.jsx("option",{value:i.value??i,children:i.label??i},`commercial-order-filter-${n.key}-${i.value??i}`))}):n.type==="dateRange"?a.jsx("input",{className:"form-control commercial-order-date-range-input","data-tab-id":e,value:ht[n.key]??"",onChange:i=>ke(e,n.key,i.target.value),placeholder:n.placeholder??"YYYY/MM/DD - YYYY/MM/DD"}):a.jsx("input",{className:"form-control",value:ht[n.key]??"",onChange:i=>ke(e,n.key,i.target.value),placeholder:n.placeholder??""})]},`commercial-order-main-filter-${e}-${n.key}`),qt={orders:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"dispatchStatus",label:"Despachado",type:"select",options:[{value:"",label:"Seleccionar"},{value:"dispatched",label:"Pedidos despachados"},{value:"pending",label:"Pedidos sin despachar"}]}],issued:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],cancelled:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],"credit-notes":[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],multivende:[{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"orderVtex",label:"Pedido VTEX",type:"text",placeholder:"Numero de pedido"}]}[C]??((Ea=za[C])==null?void 0:Ea.filters)??[],Sa=qt.some(e=>e.type==="dateRange");l.useEffect(()=>{if(!Sa)return;let e=!0;return Or().then(()=>{var n,i;!e||!((i=(n=window.$)==null?void 0:n.fn)!=null&&i.daterangepicker)||!window.moment||(window.moment.locale("es"),$(".commercial-order-date-range-input").each(function(){const d=$(this),u=d.data("tab-id")||C,o=`${d.val()||ee()}`.trim(),{start:v,end:b}=mn(o),N=window.moment(v||Zt().replaceAll("/","-"),"YYYY-MM-DD"),_=window.moment(b||v||Zt().replaceAll("/","-"),"YYYY-MM-DD"),I=d.data("daterangepicker");I&&I.remove(),d.off(".commercialOrderDateRange"),d.daterangepicker({startDate:N,endDate:_,autoUpdateInput:!1,alwaysShowCalendars:!0,linkedCalendars:!1,opens:"center",locale:{format:"YYYY/MM/DD",separator:" - ",applyLabel:"Aplicar",cancelLabel:"Limpiar",fromLabel:"Desde",toLabel:"Hasta",customRangeLabel:"Personalizado",weekLabel:"S",daysOfWeek:["Do","Lu","Ma","Mi","Ju","Vi","Sa"],monthNames:["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"],firstDay:1}},(y,h)=>{const V=`${y.format("YYYY/MM/DD")} - ${h.format("YYYY/MM/DD")}`;d.val(V),ke(u,"dateRange",V)}),d.on("cancel.daterangepicker.commercialOrderDateRange",()=>{d.val(""),ke(u,"dateRange","")})}))}).catch(()=>{}),()=>{e=!1,$(".commercial-order-date-range-input").each(function(){const n=$(this).data("daterangepicker");n&&n.remove(),$(this).off(".commercialOrderDateRange")})}},[C,Sa]);const bt=a.jsxs("div",{className:"commercial-order-listing-header",children:[a.jsxs("div",{className:"d-flex align-items-center justify-content-between gap-2 mb-2",children:[a.jsx("h4",{className:"header-title mb-0",children:"Listado"}),a.jsx("button",{type:"button",className:"btn btn-xs btn-light",onClick:()=>va(),title:"Refrescar listado",children:a.jsx("i",{className:"mdi mdi-refresh"})})]}),a.jsx("ul",{className:"nav nav-tabs nav-bordered flex-nowrap overflow-auto mb-3",children:_t.map(e=>a.jsx("li",{className:"nav-item",children:a.jsx("button",{type:"button",className:`nav-link text-nowrap ${C===e.id?"active":""}`,onClick:()=>Rn(e.id),children:e.label})},`commercial-order-tab-${e.id}`))}),qt.length>0&&a.jsxs("form",{className:"commercial-order-filter-form mb-2",onSubmit:Un,children:[qt.map(e=>ir(C,e)),a.jsxs("div",{className:"commercial-order-filter-actions",children:[a.jsxs("button",{type:"submit",className:"btn btn-outline-primary",children:[a.jsx("i",{className:"mdi mdi-magnify me-1"}),"Filtrar"]}),ft.kind!=="static"&&a.jsxs("button",{type:"button",className:"btn btn-outline-danger",onClick:()=>ja(!0),children:[a.jsx("i",{className:"mdi mdi-file-excel-box me-1"}),"Filtrar a Excel"]}),ft.kind!=="static"&&a.jsxs("button",{type:"button",className:"btn btn-outline-success",onClick:()=>ja(!1),children:[a.jsx("i",{className:"mdi mdi-file-excel-box me-1"}),"Reporte"]}),C==="multivende"&&a.jsxs("button",{type:"button",className:"btn btn-outline-success",children:[a.jsx("i",{className:"mdi mdi-calendar-refresh me-1"}),"Actualizar fechas de entrega"]})]})]}),C==="issued"&&a.jsx("div",{className:"row g-3 mt-1",children:["Total","IGV","IGV Recuperado"].map(e=>a.jsxs("div",{className:"col-12 col-md-4",children:[a.jsx("label",{className:"form-label",children:e}),a.jsx("input",{className:"form-control",value:"0.00",readOnly:!0})]},`commercial-order-total-${e}`))})]}),Yt={caption:"Acciones",width:100,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowSorting:!1,cellTemplate:(e,{data:n})=>{e.addClass("commercial-order-actions"),U(e,{variant:"danger",title:"Descargar PDF del comprobante",icon:"mdi mdi-file-pdf-box",onClick:()=>window.open(Kt.downloadUrl(n.id,"pdf"),"_blank")})}},sr=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"dispatch_status",visible:!1,showInColumnChooser:!1}],Wt=[{dataField:"source_type",visible:!1,showInColumnChooser:!1},{dataField:"local_status",visible:!1,showInColumnChooser:!1},{dataField:"document_type",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"created_at",visible:!1,showInColumnChooser:!1}],lr=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"external_order_id",visible:!1,showInColumnChooser:!1},{dataField:"external_checkout_id",visible:!1,showInColumnChooser:!1}],$a={issued:[...Wt,Yt,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:tn},{caption:"Cliente",minWidth:260,calculateCellValue:Qt},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>Xt(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}],cancelled:[...Wt,Yt,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"Cliente",minWidth:260,calculateCellValue:Qt},{caption:"Motivo",minWidth:180,calculateCellValue:Ur},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>Xt(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"F. Facturacion",dataType:"date",width:130},{dataField:"cancelled_at",caption:"F. Anulacion",dataType:"datetime",width:160}],"credit-notes":[...Wt,Yt,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:tn},{caption:"Doc. Afecto",width:130,calculateCellValue:Vr},{caption:"Cliente",minWidth:260,calculateCellValue:Qt},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>Xt(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}]},cr=[...lr,{caption:"Acciones",width:230,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:n})=>{const i=jt(n).length>0;e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),U(e,{variant:"primary",title:"Editar pedido Multivende",icon:"mdi mdi-pencil",onClick:()=>Bt(n)}),U(e,{variant:"info",title:"Ver historial del pedido Multivende",icon:"mdi mdi-map-marker-path",onClick:()=>Na(n)}),U(e,{variant:i?"dark":"warning",title:i?"Ver guia de remision asociada":"Generar guia de remision",icon:i?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>Ca(n)})}},{dataField:"order_status",caption:"E. Pedido",width:130,lookup:Ma(La),cellTemplate:(e,{value:n})=>vt(e,n,Ba)},{caption:"E. SUNAT",width:120,calculateCellValue:zr},{caption:"Pedido VTEX",width:150,calculateCellValue:qr},{dataField:"external_channel",caption:"Canal",width:130},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:Ka},{dataField:"document_type",caption:"Tipo Documento",width:140,calculateCellValue:Ja,cellTemplate:(e,{value:n})=>vt(e,n,i=>i||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:300,calculateCellValue:Qa},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"promised_delivery_at",caption:"F. Entrega Estimada",dataType:"date",width:160},{caption:"F. de Entrega",width:150,dataType:"date",calculateCellValue:pn},{caption:"Tiempo de Proceso",width:150,calculateCellValue:Yr},{dataField:"created_at",caption:"Fecha Registro",dataType:"date",width:140},{dataField:"code",caption:"Codigo",width:130}];return a.jsxs(a.Fragment,{children:[a.jsx("style",{children:`
      .commercial-order-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 312px;
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
            minmax(230px, 1.1fr)
            minmax(260px, 1fr)
            minmax(210px, 1fr)
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
    `}),a.jsxs("div",{className:"commercial-order-top-actions",children:[a.jsxs("button",{type:"button",className:"btn btn-success commercial-order-multivende-action",title:"Ingresar pedido Multivende por CHECK OUT ID",onClick:Kn,children:[a.jsxs("span",{children:[a.jsx("i",{className:"mdi mdi-plus-circle-outline"})," Ingresar pedido multivende"]}),a.jsx("i",{className:"mdi mdi-calendar-month-outline"})]}),a.jsxs("button",{type:"button",className:"btn commercial-order-delay-action",title:"Abrir mantenedor de motivos de retraso de entrega",onClick:Qn,children:[a.jsx("span",{children:"Mantenedor Retraso Entrega"}),a.jsx("i",{className:"mdi mdi-cog"})]})]}),C==="orders"&&a.jsx(Ht,{gridRef:c,title:bt,rest:G,filterValue:En,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(c.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"add",title:"Agregar",hint:"Agregar pedido comercial",onClick:()=>Bt(null)}})},pageSize:25,exportable:!0,columns:[...sr,{caption:"Acciones",width:300,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:n})=>{const i=jt(n).length>0;e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),U(e,{variant:"primary",title:"Editar datos, cliente, entrega y productos del pedido comercial",icon:"mdi mdi-pencil",onClick:()=>Bt(n)}),si(n)&&U(e,{variant:"success",title:"Enviar este pedido a preparacion para iniciar picking",icon:"mdi mdi-clipboard-check-outline",onClick:()=>zn({id:n.id,field:"dispatch_status",value:"preparing"})}),U(e,{variant:"info",title:"Ver historial de estados, guia, ruta y entrega del pedido",icon:"mdi mdi-map-marker-path",onClick:()=>Na(n)}),U(e,{variant:i?"dark":"warning",title:i?"Ver, emitir o descargar la guia de remision asociada al pedido":"Generar guia de remision para este pedido",icon:i?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>Ca(n)}),U(e,{variant:"success",title:ea(n)?"Ver o actualizar foto y datos de evidencia de entrega":"Registrar foto y datos de evidencia de entrega",icon:"mdi mdi-camera",onClick:()=>qn(n)}),U(e,{variant:"danger",title:"Imprimir o descargar PDF resumen del pedido comercial",icon:"mdi mdi-file-pdf-box",onClick:()=>xt(gt.commercialOrder(n))}),U(e,{variant:"danger",title:"Eliminar este pedido comercial del listado",icon:"mdi mdi-delete",onClick:()=>Hn(n.id)})}},{dataField:"order_status",caption:"Estado",width:140,lookup:Ma(La),cellTemplate:(e,{value:n})=>vt(e,n,Ba)},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:Ka},{dataField:"document_type",caption:"Tipo documento",width:130,calculateCellValue:Ja,cellTemplate:(e,{value:n})=>vt(e,n,i=>i||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:320,calculateCellValue:Qa},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_label",caption:"Tipo de pago",width:170,calculateCellValue:Ir},{dataField:"seller.fullname",caption:"Usuario",width:190,cellTemplate:(e,{data:n})=>e.text(Sr(n.seller))},{dataField:"created_at",caption:"Fecha registro",width:130,dataType:"date"},{dataField:"creator.username",caption:"Usuario registro",width:150,cellTemplate:(e,{data:n})=>e.text(Jt(n.creator))},{dataField:"code",caption:"Código",width:130},{dataField:"business.name",caption:"Empresa",minWidth:150}]},"orders"),ft.kind==="billing"&&a.jsx(Ht,{gridRef:p,title:bt,rest:Kt,filterValue:Tn,pageSize:20,exportable:!0,columns:$a[C]??$a.issued,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar listado",onClick:()=>$(p.current).dxDataGrid("instance").refresh()}})}},`billing-${C}`),C==="multivende"&&a.jsx(Ht,{gridRef:x,title:bt,rest:$n,filterValue:Dn,pageSize:10,exportable:!0,columns:cr,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar pedidos Multivende",onClick:()=>$(x.current).dxDataGrid("instance").refresh()}})}},"multivende"),ft.kind==="static"&&a.jsx(ci,{title:bt,config:za[C]}),a.jsx(Ke,{modalRef:m,title:xn?"Editar pedido comercial":"Agregar pedido comercial",size:"xl",dialogClass:"commercial-order-modal-dialog modal-dialog-scrollable",bodyClass:"commercial-order-modal-body",bodyStyle:{maxHeight:"calc(100vh - 150px)",overflowY:"auto",overflowX:"hidden"},btnSubmitText:"Guardar",onSubmit:Pn,children:a.jsxs("div",{id:"commercial-orders-form-container",children:[a.jsx("input",{ref:me,type:"hidden"}),a.jsx("input",{ref:xe,type:"hidden"}),a.jsx("input",{ref:P,type:"hidden"}),a.jsx("input",{ref:Xe,type:"hidden"}),a.jsx("input",{ref:et,type:"hidden"}),a.jsx("input",{ref:rt,type:"hidden"}),a.jsx("input",{ref:it,type:"hidden"}),a.jsx("input",{ref:st,type:"hidden"}),a.jsx("input",{ref:lt,type:"hidden"}),a.jsx("input",{ref:ct,type:"hidden"}),a.jsx("input",{ref:bn,type:"hidden",value:Ut.taxAmount,readOnly:!0}),a.jsx("input",{ref:_e,type:"hidden"}),a.jsxs("section",{className:"commercial-order-form-section",children:[a.jsxs("div",{className:"commercial-order-section-title",children:[a.jsx("i",{className:"mdi mdi-file-document"}),a.jsx("span",{children:"Datos del pedido"})]}),a.jsxs("div",{className:"row g-2",children:[a.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:a.jsx(Ee,{eRef:De,label:"Empresa",required:!0,searchAPI:"/api/admin/businesses/paginate",searchBy:"name",dropdownParent:"#commercial-orders-form-container",onChange:Mn})}),a.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:a.jsxs(vr,{eRef:f,label:"Sede",dropdownParent:"#commercial-orders-form-container",value:W,onChange:Ln,children:[a.jsx("option",{value:"",children:"Sin sede"}),yn.map(e=>a.jsx("option",{value:e.id,children:e.name},`commercial-order-branch-${e.id}`))]})}),a.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:a.jsx(Ee,{eRef:k,label:"Almacen",required:!0,searchAPI:"/api/admin/warehouses/paginate",searchBy:"name",filter:An,dropdownParent:"#commercial-orders-form-container",onChange:Bn,templateResult:nn,templateSelection:nn})}),a.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[a.jsx("label",{className:"form-label",children:"Doc. venta"}),a.jsxs("select",{ref:hn,className:"form-control",value:Pe,onChange:e=>ia(Nt(e.target.value)),children:[a.jsx("option",{value:"Factura",children:"Factura"}),a.jsx("option",{value:"Boleta",children:"Boleta"}),a.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),a.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[a.jsx("label",{className:"form-label",children:"Moneda"}),a.jsxs("select",{ref:Ze,className:"form-control",children:[a.jsx("option",{value:"PEN",children:"PEN"}),a.jsx("option",{value:"USD",children:"USD"}),a.jsx("option",{value:"EUR",children:"EUR"})]})]}),a.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[a.jsx("label",{className:"form-label",children:"Forma de pago"}),a.jsxs("select",{ref:Ie,className:"form-control",children:[a.jsx("option",{value:"",children:"Seleccione"}),kr.map(e=>a.jsx("option",{value:e,children:e},`commercial-order-payment-${e}`))]})]})]})]}),a.jsxs("section",{className:"commercial-order-form-section",children:[a.jsxs("div",{className:"commercial-order-section-title",children:[a.jsx("i",{className:"mdi mdi-account"}),a.jsx("span",{children:"Cliente y entrega"})]}),a.jsxs("div",{className:"row g-2",children:[a.jsx("div",{className:"col-12 col-xl-6",children:a.jsx(Ee,{eRef:z,label:"Cliente regular",searchAPI:"/api/admin/clients/paginate",searchBy:"full_name",selectBy:"entity_id",filter:Rr,dropdownParent:"#commercial-orders-form-container",onChange:Gn})}),a.jsx("div",{className:"col-12 col-xl-6",children:a.jsx(Ee,{eRef:q,label:"Cliente eventual",searchAPI:"/api/admin/eventual-clients/paginate",searchBy:"business_name",dropdownParent:"#commercial-orders-form-container",onChange:Vn})}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Orden de compra"}),a.jsx("input",{ref:tt,className:"form-control"})]}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Numero de guia"}),a.jsx("input",{ref:at,className:"form-control"})]}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Guia remision"}),a.jsx("input",{ref:nt,className:"form-control"})]}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Ubigeo"}),a.jsx("input",{ref:ie,className:"form-control"})]}),a.jsx("div",{className:"col-12 col-xl-4",children:a.jsx(Pa,{eRef:Y,label:"Direccion de entrega",rows:2})}),a.jsx("div",{className:"col-12",children:a.jsx(ii,{modalRef:m,position:$t,searchText:vn,onSearchTextChange:mt,onPositionChange:Et,onAddressSelected:e=>{Y.current&&(Y.current.value=e)}})}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[a.jsx("label",{className:"form-label",children:"Nombre contacto entrega"}),a.jsx("input",{ref:ve,className:"form-control"})]}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[a.jsx("label",{className:"form-label",children:"Celular contacto entrega"}),a.jsx("input",{ref:ye,className:"form-control"})]}),a.jsx(Ee,{eRef:re,label:"Vendedor",col:"col-12 col-md-6 col-xl-2",searchAPI:"/api/admin/users/paginate",searchBy:"fullname",dropdownParent:"#commercial-orders-form-container"}),a.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[a.jsx("label",{className:"form-label",children:"Medico"}),a.jsx("input",{ref:ge,className:"form-control"})]})]})]}),a.jsxs("section",{className:"commercial-order-form-section",children:[a.jsxs("div",{className:"commercial-order-detail-toolbar",children:[a.jsxs("div",{className:"commercial-order-section-title mb-0",children:[a.jsx("i",{className:"mdi mdi-format-list-bulleted"}),a.jsx("span",{children:"Detalle del pedido"})]}),a.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:nr,children:"Agregar item"})]}),a.jsx("div",{className:"table-responsive border rounded commercial-order-detail-table","data-select2-local-dropdown":"true",children:a.jsxs("table",{className:"table table-sm align-middle mb-0",children:[a.jsx("thead",{children:a.jsxs("tr",{children:[a.jsx("th",{style:{minWidth:96},children:"Descuento"}),a.jsx("th",{style:{minWidth:104},children:"Codigo"}),a.jsx("th",{style:{minWidth:88},children:"Codigo lote"}),a.jsx("th",{style:{minWidth:280},children:"Nombre"}),a.jsx("th",{style:{minWidth:128},children:"Laboratorio"}),a.jsx("th",{style:{minWidth:130},children:"Principio activo"}),a.jsx("th",{style:{minWidth:110},children:"Unidad"}),a.jsx("th",{style:{minWidth:64},children:"Stock"}),a.jsx("th",{style:{minWidth:112},children:"P. venta con IGV"}),a.jsx("th",{style:{minWidth:112},children:"P. venta sin IGV"}),a.jsx("th",{style:{minWidth:92},children:"Cantidad"}),a.jsx("th",{style:{minWidth:96},children:"Total desc."}),a.jsx("th",{style:{minWidth:96},children:"Sub total"}),a.jsx("th",{style:{width:70}})]})}),a.jsx("tbody",{children:X.map(e=>a.jsxs("tr",{children:[a.jsx("td",{children:a.jsxs("div",{className:"commercial-order-discount-cell",children:[a.jsxs("button",{type:"button",className:"commercial-order-discount-trigger",onClick:n=>ar(e.uid,n),children:[a.jsx("span",{children:e.discount_type==="percent"&&Number(e.discount_value||0)>0?`${Number(e.discount_value)}%`:"Seleccione"}),a.jsx("i",{className:"mdi mdi-chevron-down"})]}),(se==null?void 0:se.uid)===e.uid&&a.jsxs("div",{className:"commercial-order-discount-menu",style:{top:se.top,left:se.left,minWidth:se.width},onClick:n=>n.stopPropagation(),children:[a.jsx("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type!=="percent"?"active":""}`,onClick:()=>ka(e.uid,""),children:"Seleccione"}),wr.map(n=>a.jsxs("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type==="percent"&&Number(e.discount_value||0)===n?"active":""}`,onClick:()=>ka(e.uid,n),children:[n,"%"]},`commercial-order-discount-floating-${e.uid}-${n}`))]})]})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_code||"-"})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_lot||"-"})}),a.jsx("td",{className:"commercial-order-article-name",children:a.jsx(Ee,{eRef:ma(e.uid),searchAPI:In,searchBy:"name",dropdownParent:"#commercial-orders-form-container",disabled:!H,onChange:n=>er(e.uid,n)})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_laboratory||"-"})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_principle||"-"})}),a.jsx("td",{children:a.jsxs("div",{children:[a.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_unit||"-"}),e.presentations.length>0&&a.jsxs("select",{className:"form-control mt-1","data-no-select2":"true",value:e.presentation_id,disabled:!e.article_id,onChange:n=>Gt(e.uid,"presentation_id",n.target.value),children:[a.jsx("option",{value:"",children:Qr(e)}),e.presentations.map(n=>a.jsx("option",{value:n.id,children:Xr(n,e)},`commercial-order-presentation-${e.uid}-${n.id}`))]})]})}),a.jsx("td",{children:a.jsx("div",{className:"commercial-order-readonly-cell",children:Number(e.stock_available||0).toFixed(2)})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:e.price_unit,onFocus:Ha,onChange:n=>Gt(e.uid,"price_unit",Wa(n))})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:rn(Number(e.price_unit||0),Pe).subtotal.toFixed(2),readOnly:!0})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0.01",className:"form-control",value:e.quantity,onFocus:Ha,onChange:n=>Gt(e.uid,"quantity",Wa(n))})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.discount_amount||0).toFixed(2),readOnly:!0})}),a.jsx("td",{children:a.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.total||0).toFixed(2),readOnly:!0})}),a.jsx("td",{className:"text-end",children:a.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>rr(e.uid),children:a.jsx("i",{className:"mdi mdi-close"})})})]},e.uid))}),a.jsxs("tfoot",{children:[a.jsxs("tr",{children:[a.jsx("th",{colSpan:"12",className:"text-end",children:"Sub total"}),a.jsx("th",{children:Vt.toFixed(2)}),a.jsx("th",{})]}),a.jsxs("tr",{children:[a.jsx("th",{colSpan:"12",className:"text-end",children:"Descuento global"}),a.jsx("th",{children:"0.00"}),a.jsx("th",{})]}),a.jsxs("tr",{children:[a.jsx("th",{colSpan:"12",className:"text-end",children:"Total"}),a.jsx("th",{children:Ut.total.toFixed(2)}),a.jsx("th",{})]})]})]})})]}),a.jsxs("section",{className:"commercial-order-form-section mb-0",children:[a.jsxs("div",{className:"commercial-order-section-title",children:[a.jsx("i",{className:"mdi mdi-note-text"}),a.jsx("span",{children:"Observaciones"})]}),a.jsx(Pa,{eRef:ot,label:"Observaciones",rows:3})]})]})}),a.jsx(Ke,{modalRef:g,title:"Ingresar pedido multivende",size:"lg",btnSubmitText:"Registrar",onSubmit:Jn,children:a.jsx("div",{className:"commercial-order-multivende-form",children:a.jsxs("section",{className:"commercial-order-form-section",children:[a.jsxs("div",{className:"commercial-order-section-title",children:[a.jsx("i",{className:"mdi mdi-file-document-plus-outline"}),a.jsx("span",{children:"General"})]}),a.jsxs("div",{className:"mb-2",children:[a.jsxs("label",{className:"form-label",children:["Ingrese el ",a.jsx("strong",{children:"CHECK OUT ID"})]}),a.jsx("input",{ref:E,name:"external_checkout_id",className:"form-control",autoComplete:"off"})]})]})})}),a.jsx(Ke,{modalRef:L,title:"Mantenedor motivo retraso entrega",size:"lg",hideFooter:!0,onSubmit:e=>{e.preventDefault(),Zn()},children:a.jsxs("div",{className:"commercial-order-delay-maintainer",children:[a.jsxs("div",{className:"commercial-order-delay-actions",children:[a.jsxs("button",{type:"button",className:"btn btn-sm btn-light","data-bs-dismiss":"modal",children:[a.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]}),a.jsxs("button",{type:"submit",className:"btn btn-sm btn-outline-primary",children:[a.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]})]}),a.jsx("input",{ref:T,type:"hidden"}),a.jsxs("div",{className:"row",children:[a.jsxs("div",{className:"col-12 mb-3",children:[a.jsx("label",{className:"form-label",children:"Descripcion:"}),a.jsx("input",{ref:R,className:"form-control",autoComplete:"off"})]}),a.jsxs("div",{className:"col-12 mb-3",children:[a.jsx("label",{className:"form-label",children:"Estado:"}),a.jsxs("select",{ref:B,className:"form-control",defaultValue:"1",children:[a.jsx("option",{value:"1",children:"Activo"}),a.jsx("option",{value:"0",children:"Inactivo"})]})]})]}),a.jsx("hr",{}),a.jsxs("div",{className:"commercial-order-delay-filter",children:[a.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),a.jsx("input",{className:"form-control form-control-sm",value:Ot,onChange:e=>ca(e.target.value)})]}),a.jsx("div",{className:"table-responsive commercial-order-delay-table",children:a.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[a.jsx("thead",{children:a.jsxs("tr",{children:[a.jsx("th",{className:"text-center",children:"Acciones"}),a.jsx("th",{className:"text-center",children:"Estado"}),a.jsx("th",{children:"Motivo"}),a.jsx("th",{children:"Fecha registro"}),a.jsx("th",{children:"Usuario registro"})]})}),a.jsxs("tbody",{children:[Pt&&a.jsx("tr",{children:a.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"Cargando motivos..."})}),!Pt&&zt.length===0&&a.jsx("tr",{children:a.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"No existen elementos"})}),!Pt&&zt.map(e=>a.jsxs("tr",{children:[a.jsx("td",{className:"text-center",children:a.jsx("button",{type:"button",className:"btn btn-xs btn-outline-info",title:"Editar motivo de retraso",onClick:()=>Xn(e),children:a.jsx("i",{className:"mdi mdi-pencil"})})}),a.jsx("td",{className:"text-center",children:a.jsx("span",{className:dn(e.status?"billed":"cancelled"),children:e.status?"Activo":"Inactivo"})}),a.jsx("td",{children:e.description}),a.jsx("td",{children:Xa(e.created_at)}),a.jsx("td",{children:Jt(e.creator)})]},`delivery-delay-reason-${e.id}`))]})]})}),a.jsxs("div",{className:"commercial-order-delay-summary",children:[zt.length," elementos (Pagina 1 de 1)"]})]})}),a.jsx(Ke,{modalRef:ne,title:"Tracking del pedido",size:"lg",hideButtonSubmit:!0,children:a.jsx("div",{className:"table-responsive",children:a.jsxs("table",{className:"table table-sm align-middle mb-0",children:[a.jsx("thead",{children:a.jsxs("tr",{children:[a.jsx("th",{children:"Fecha"}),a.jsx("th",{children:"Estado"})]})}),a.jsxs("tbody",{children:[Fa.length===0&&a.jsx("tr",{children:a.jsx("td",{colSpan:"2",className:"text-muted text-center py-3",children:"Sin eventos registrados."})}),Fa.map((e,n)=>a.jsxs("tr",{children:[a.jsx("td",{children:new Date(e.date).toLocaleString("es-PE")}),a.jsx("td",{children:e.status})]},`commercial-order-tracking-${n}`))]})]})})}),a.jsx(Ke,{modalRef:Q,title:"Evidencia de entrega",size:"lg",btnSubmitText:"Registrar",onSubmit:Wn,children:a.jsxs("div",{className:"row",children:[a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Recibido por"}),a.jsx("input",{className:"form-control",value:w.recipient_name,onChange:e=>le("recipient_name",e.target.value)})]}),a.jsxs("div",{className:"col-md-3 mb-3",children:[a.jsx("label",{className:"form-label",children:"Tipo doc."}),a.jsxs("select",{className:"form-control",value:w.recipient_document_type,onChange:e=>le("recipient_document_type",e.target.value),children:[a.jsx("option",{value:"DNI",children:"DNI"}),a.jsx("option",{value:"RUC",children:"RUC"}),a.jsx("option",{value:"CE",children:"CE"}),a.jsx("option",{value:"OTRO",children:"Otro"})]})]}),a.jsxs("div",{className:"col-md-3 mb-3",children:[a.jsx("label",{className:"form-label",children:"Numero"}),a.jsx("input",{className:"form-control",value:w.recipient_document_number,onChange:e=>le("recipient_document_number",e.target.value)})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Telefono"}),a.jsx("input",{className:"form-control",value:w.recipient_phone,onChange:e=>le("recipient_phone",e.target.value)})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Fecha y hora entrega"}),a.jsx("input",{type:"datetime-local",className:"form-control",value:w.delivered_at,onChange:e=>le("delivered_at",e.target.value)})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Foto / evidencia"}),a.jsx("input",{ref:D,className:"form-control",type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",capture:"environment",onChange:Yn})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Latitud"}),a.jsx("input",{className:"form-control",value:w.latitude,onChange:e=>le("latitude",e.target.value)})]}),a.jsxs("div",{className:"col-md-6 mb-3",children:[a.jsx("label",{className:"form-label",children:"Longitud"}),a.jsx("input",{className:"form-control",value:w.longitude,onChange:e=>le("longitude",e.target.value)})]}),a.jsxs("div",{className:"col-12 mb-3",children:[a.jsx("label",{className:"form-label",children:"Observaciones"}),a.jsx("textarea",{className:"form-control",rows:"3",value:w.evidence_notes,onChange:e=>le("evidence_notes",e.target.value)})]}),a.jsx("div",{className:"col-12",children:a.jsx("div",{className:"border rounded p-3",children:fe?a.jsx("img",{src:fe,alt:"Evidencia de entrega",className:"img-fluid rounded border bg-light",style:{maxHeight:360,width:"100%",objectFit:"contain"}}):w.evidence_url?a.jsx("a",{href:w.evidence_url,target:"_blank",rel:"noreferrer",children:"Abrir evidencia registrada"}):a.jsx("div",{className:"text-muted py-4 text-center",children:"Sin evidencia registrada"})})})]})})]})};mr((t,r)=>{!r.can("orders")&&!r.hasRole("Admin")&&(location.href="/admin/"),pr(t).render(a.jsx(gr,{...r,title:r.pageTitle||"Pedidos comerciales",children:a.jsx(oi,{...r})}))});
