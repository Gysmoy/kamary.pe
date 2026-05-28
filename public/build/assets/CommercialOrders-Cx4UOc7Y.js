var ar=Object.defineProperty;var rr=(t,a,s)=>a in t?ar(t,a,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[a]=s;var En=(t,a,s)=>rr(t,typeof a!="symbol"?a+"":a,s);import{C as ir,c as sr,j as n,r as l,S as Se,G as lr}from"./CreateReactScript-BQEmHc8B.js";import{L as cr,G as or,M as dr}from"./esm-XAA1TWCO.js";import{B as ur}from"./Base-BZJCfbcl.js";import{T as Wt}from"./Table-DsvFLxnp.js";import{M as Ke}from"./Modal-BpHRFSoz.js";import{R as mr}from"./ReactAppend-CmCssPze.js";import{a as ke,S as $e}from"./SetSelectValue-CKeZntsZ.js";import{S as pr}from"./SelectFormGroup-BeLjaap0.js";import{T as In}from"./TextareaFormGroup-COu0G6AX.js";import{B as hr}from"./BillingDocumentsRest-WW_N3DRe.js";import{C as aa}from"./CommercialOrdersRest-C3qyJH3l.js";import{B as fr}from"./BasicRest-BJmaHB2C.js";import{R as br}from"./ReferralGuidesRest-CIzM-URQ.js";import{o as ht,b as ft}from"./magistralesRecordPdf-C-x5GdgT.js";import{t as Dn,i as An,j as ra,k as On}from"./statusLabels-DafAwaKR.js";import"./tippy-react.esm-255dCUw_.js";import"./permissionScope-Be8AULz2.js";import"./ubigeoInei-D0FnAslC.js";class xr extends fr{constructor(){super(...arguments);En(this,"path","admin/delivery-delay-reasons")}}const B=new aa,Ht=new hr,Pn=new xr,Mn=new br,gr=["client_kind","=","regular"],_r=[1,2,3,4,5],vr=["EFECTIVO [CONTADO]","TRANSFERENCIA [CONTADO]","YAPE [CONTADO]","PLIN [CONTADO]","TARJETA [CONTADO]","TRANSFERENCIA [CREDITO]"],Ln="ecomsur_oms",bt=[{id:"orders",label:"Pedidos",kind:"orders"},{id:"issued",label:"Facturas Emitidas",kind:"billing"},{id:"cancelled",label:"Facturas Anuladas",kind:"billing"},{id:"credit-notes",label:"Notas de Credito",kind:"billing"},{id:"visitors",label:"Pedidos - Visitadores",kind:"static"},{id:"visitors-legacy",label:"Pedidos - Visitadores Legacy",kind:"static"},{id:"platforms",label:"Plataformas",kind:"static"},{id:"multivende",label:"Pedidos - Multivende",kind:"multivende"}],Bn={visitors:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"text"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},"visitors-legacy":{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["Todos","ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"text"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},platforms:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"text"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]}},V=(t,{variant:a,title:s,icon:c,onClick:p})=>{const _=$('<button type="button"></button>').addClass(`btn btn-xs btn-soft-${a} commercial-order-action-btn`).attr("title",s).attr("aria-label",s).append($("<i></i>").addClass(c)).on("click",u=>{u.preventDefault(),u.stopPropagation(),p()});t.append(_)},ia=t=>`commercial-order-status-badge commercial-order-status-${`${t??"empty"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-")||"empty"}`,xt=(t,a,s)=>{t.addClass("commercial-order-status-cell"),mr(t,n.jsx("span",{className:ia(a),children:s(a)}))},Qe=()=>({uid:crypto.randomUUID(),article_id:"",article_label:"",article_code:"",article_lot:"",article_name:"",article_unit:"",article_laboratory:"",article_principle:"",presentations:[],presentation_id:"",presentation_units:1,stock_available:0,reserved_quantity:0,price_unit:0,quantity:1,gross_total:0,discount_type:"none",discount_value:0,discount_amount:0,total:0,price_source:"fallback",price_list_code:""}),yr=t=>{if(!t)return"";const a=(t.name??"").toString().trim().split(" ")[0]??"",s=(t.lastname??"").toString().trim().split(" ")[0]??"",c=`${a} ${s}`.trim(),p=(t.username??"").toString().trim();return c&&p?`${c} (@${p})`:c||(p?`@${p}`:"")},jr=t=>{if(!t)return"-";const a=(t.fullname??"").toString().trim();return a||`${t.name??""} ${t.lastname??""}`.trim()||(t.username??"").toString().trim()||"-"},Kt=t=>t&&((t.username??"").toString().trim()||(t.fullname??"").toString().trim()||`${t.name??""} ${t.lastname??""}`.trim())||"-",Xe=t=>Number(Number(t||0).toFixed(2)),Nr=t=>$("<div>").text(t??"").html(),Te=t=>{const a=Number(Number(t||0).toFixed(3));return Number.isInteger(a)?`${a}`:`${a}`.replace(/\.?0+$/,"")},Jt=t=>(t==null?void 0:t.price_source)==="manual",Gn=(t,a,s=!1)=>{const c=Number((t==null?void 0:t.price_unit)||0),p=Number(a==null?void 0:a.price_unit);return!s&&Jt(t)||!Number.isFinite(p)||!s&&p<=0&&c>0?c:p},Vn=(t,a,s=!1)=>!s&&Jt(t)?"manual":(a==null?void 0:a.source)||(t==null?void 0:t.price_source)||"fallback",Cr=t=>{const a=`${t??""}`.replace(",",".").replace(/[^\d.]/g,"");if(!a)return"";const[s,...c]=a.split("."),p=s.replace(/^0+(?=\d)/,"")||(s||c.length?"0":""),_=c.length?`.${c.join("")}`:"";return`${p}${_}`},Un=t=>{const a=Cr(t.target.value);return t.target.value!==a&&(t.target.value=a),Number(a||0)},qn=t=>{Number(t.target.value||0)===0&&t.target.select()},Rr=(t,a,s)=>{const c=Xe(t),p=Number(s||0);return!Number.isFinite(p)||p<=0||c<=0?0:a==="percent"?Math.min(c,Xe(c*Math.min(p,100)/100)):a==="amount"?Math.min(c,Xe(p)):0},fe=t=>{const a=Number(t.quantity||0),s=Number(t.price_unit||0),c=Number.isFinite(a*s)?Xe(a*s):0,p=Rr(c,t.discount_type,t.discount_value);return{...t,discount_type:t.discount_type||"none",discount_value:t.discount_type==="none"?0:Number(t.discount_value||0),gross_total:c,discount_amount:p,total:Xe(Math.max(0,c-p))}},vt=t=>{const a=`${t??""}`.trim().toLowerCase();return a==="boleta"?"Boleta":["nota de pedido","nota_pedido","note_order"].includes(a)?"Nota de pedido":"Factura"},wr=t=>(t==null?void 0:t.billing_documents)??(t==null?void 0:t.billingDocuments)??[],yt=t=>wr(t)[0]??null,zn=t=>{const a=yt(t);return(a==null?void 0:a.code)||[a==null?void 0:a.series,a==null?void 0:a.sequence].filter(Boolean).join("-")||(t==null?void 0:t.referral_guide)||(t==null?void 0:t.guide_number)||(t==null?void 0:t.purchase_order)||"-"},Wn=t=>{var a;return vt(((a=yt(t))==null?void 0:a.document_type)??(t==null?void 0:t.document_type))},Hn=t=>{const a=(t==null?void 0:t.client)??(t==null?void 0:t.eventual_client)??(t==null?void 0:t.eventualClient)??null,s=`${(a==null?void 0:a.document_number)??""}`.trim(),c=`${(a==null?void 0:a.full_name)??(a==null?void 0:a.business_name)??""}`.trim();return[s,c].filter(Boolean).join(" | ")||"-"},Fr=t=>{const a=`${(t==null?void 0:t.payment_method)??""}`.trim(),s=`${(t==null?void 0:t.payment_condition)??""}`.trim();return!a&&!s?"-":!s||a.includes("[")?a||"-":`${a||"-"} [${s.toUpperCase()}]`},Kn=t=>{if(!t)return"-";const a=new Date(t);return Number.isNaN(a.getTime())?`${t}`:a.toLocaleString("es-PE",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})},Sr=()=>new Date().toISOString().slice(0,10).replaceAll("-","/"),be=()=>{const t=Sr();return`${t} - ${t}`},Qn=()=>({orders:{businessId:"",dateRange:"",laboratory:"",dispatchStatus:""},issued:{businessId:"",dateRange:be()},cancelled:{businessId:"",dateRange:be()},"credit-notes":{businessId:"",dateRange:be()},visitors:{visitor:"ALICIA ASTO ASTO",dateRange:be()},"visitors-legacy":{visitor:"",dateRange:be()},platforms:{businessId:"",dateRange:be()},multivende:{dateRange:be(),orderVtex:""}}),Xn=t=>{const a=`${t??""}`.trim();return a?a.replaceAll("/","-").slice(0,10):""},kr=t=>{const[a="",s=""]=`${t??""}`.split(/\s+-\s+/);return{start:Xn(a),end:Xn(s||a)}},Nt=t=>t.filter(Boolean).reduce((a,s)=>a?[a,"and",s]:s,null),Zt=(t,a="created_at")=>{const{start:s,end:c}=kr(t);return Nt([s?[a,">=",`${s} 00:00:00`]:null,c?[a,"<=",`${c} 23:59:59`]:null])},$r=t=>{const a=["document_type","<>","Nota de credito"];return t==="issued"?[[["local_status","=","sent"],"or",["local_status","=","accepted"],"or",["local_status","=","observed"],"or",["local_status","=","rejected"]],"and",a]:t==="cancelled"?[["local_status","=","cancelled"],"and",a]:t==="credit-notes"?["document_type","=","Nota de credito"]:null},Tr=(t,a)=>Nt([["source_type","=","commercial_order"],$r(t),a!=null&&a.businessId?["business_id","=",Number(a.businessId)]:null,Zt(a==null?void 0:a.dateRange,"created_at")]),Er=t=>Nt([t!=null&&t.businessId?["business_id","=",Number(t.businessId)]:null,t!=null&&t.dispatchStatus?["dispatch_status","=",t.dispatchStatus]:null,Zt(t==null?void 0:t.dateRange,"created_at")]),Ir=(t,a)=>{const s=`${(t==null?void 0:t.orderVtex)??""}`.trim();return Nt([["external_source","=",a],Zt(t==null?void 0:t.dateRange,"created_at"),s?[["external_order_id","contains",s],"or",["external_checkout_id","contains",s]]:null])},Qt=t=>{const a=(t==null?void 0:t.client)??(t==null?void 0:t.eventualClient)??(t==null?void 0:t.eventual_client)??null,s=`${(a==null?void 0:a.document_number)??""}`.trim(),c=`${(a==null?void 0:a.full_name)??(a==null?void 0:a.business_name)??""}`.trim();return[s,c].filter(Boolean).join(" | ")||"-"},Xt=t=>`${t??""}`.toUpperCase()==="USD"?"Dolares":"Soles",Yn=t=>(t==null?void 0:t.external_reference)||(t==null?void 0:t.external_id)||(t==null?void 0:t.external_status)||"-",Dr=t=>{var a,s;return((a=t==null?void 0:t.referenceDocument)==null?void 0:a.code)??((s=t==null?void 0:t.reference_document)==null?void 0:s.code)??"-"},Ar=t=>{var a,s;return(t==null?void 0:t.cancel_reason)??((a=t==null?void 0:t.metadata)==null?void 0:a.cancel_reason)??((s=t==null?void 0:t.metadata)==null?void 0:s.reason)??"-"},Or=t=>{var a,s;return((a=yt(t))==null?void 0:a.external_status)??((s=yt(t))==null?void 0:s.external_reference)??"-"},Pr=t=>(t==null?void 0:t.external_order_id)||(t==null?void 0:t.external_checkout_id)||"-",sa=t=>{var p;const a=Yt(t);if(a!=null&&a.delivered_at)return a.delivered_at;const c=((t==null?void 0:t.dispatchAssignments)??(t==null?void 0:t.dispatch_assignments)??[]).find(_=>{var u;return(u=_==null?void 0:_.dispatch)==null?void 0:u.delivered_at});return((p=c==null?void 0:c.dispatch)==null?void 0:p.delivered_at)??""},Mr=t=>{const a=t!=null&&t.created_at?new Date(t.created_at):null,s=sa(t)||(t==null?void 0:t.updated_at),c=s?new Date(s):null;if(!a||!c||Number.isNaN(a.getTime())||Number.isNaN(c.getTime()))return"-";const p=Math.max(0,Math.round((c-a)/6e4)),_=Math.floor(p/1440),u=Math.floor(p%1440/60);return _>0?`${_}d ${u}h`:u>0?`${u}h ${p%60}m`:`${p}m`},S=(t,a="")=>{if(t==null)return a;if(typeof t=="object")return t.address??t.reference??t.name??t.description??a;const s=`${t}`;return s==="[object Object]"?a:s},Lr=t=>`${t??""}`.toUpperCase().includes("CREDITO")?"Credito":"Contado",Br=t=>{const a=`${t??""}`.trim();return a?a.toUpperCase()==="TRANSFERENCIA"?"TRANSFERENCIA [CONTADO]":a:"EFECTIVO [CONTADO]"},Gr=t=>S(t==null?void 0:t.full_address,S(t==null?void 0:t.address,S(t==null?void 0:t.fiscal_address))),Vr=t=>S(t==null?void 0:t.ubigeo,S(t==null?void 0:t.district_ubigeo,S(t==null?void 0:t.inei_ubigeo))),Jn=t=>{const a=`${t??""}`.trim(),s=a.match(/^(client|eventual)-(\d+)$/);return s?s[2]:a},Zn=t=>{var u,x,T;if(t.loading)return t.text;const a=t.data??{},s=t.text||a.name||"",c=(u=a.branch)==null?void 0:u.name,p=(T=(x=a.branch)==null?void 0:x.business)==null?void 0:T.name,_=$("<span>").text(s);return c&&_.append($("<small>").addClass("text-muted ms-1").text(`- ${c}`)),p&&_.append($("<small>").addClass("text-muted ms-1").text(`(${p})`)),_},J=t=>{if(!(t!=null&&t.current))return;const a=$(t.current);a.empty().val(null),a.trigger(a.data("select2")?"change.select2":"change")},Ur=t=>t.article_id?"Unidad base":"Sin presentacion",qr=(t,a)=>{const s=(t==null?void 0:t.name)||"Presentacion",c=Te((t==null?void 0:t.units)||1),p=a!=null&&a.article_unit?` ${a.article_unit}`:" unidad(es) base";return`${s} (${c}${p})`},zr=t=>["Factura","Boleta"].includes(vt(t)),ea=(t,a)=>{const s=Number(t||0);if(!zr(a))return{subtotal:Number(s.toFixed(2)),taxAmount:0,total:Number(s.toFixed(2))};const c=Number((s/1.18).toFixed(2));return{subtotal:c,taxAmount:Number((s-c).toFixed(2)),total:Number(s.toFixed(2))}},Wr=(t,a="")=>{const s=new Map;return(t??[]).flatMap(c=>{if(!(c!=null&&c.article_id))return[];const p=`${c.article_id}:${c.warehouse_id||a||""}`,_=Number(c.quantity||0),u=Number(c.presentation_units||1)||1,x=Number((_*u).toFixed(3)),T=Number(c.stock_available||0),M=Number(s.get(p)||0),E=Math.max(0,T-M),C=Math.min(x,E),L=Math.max(0,x-C);return s.set(p,M+C),L<=1e-4?[]:[{article:c.article_name||c.article_label||c.article_code||"Articulo",quantity:x,lineQuantity:_,presentationUnits:u,available:E,shortage:L}]})},_t=t=>(t==null?void 0:t.referral_guides)??(t==null?void 0:t.referralGuides)??[],la=t=>(t==null?void 0:t.external_reference)||[t==null?void 0:t.series,t==null?void 0:t.sequence].filter(Boolean).join("-")||(t==null?void 0:t.code)||"-",Hr=t=>t&&!["accepted","cancelled"].includes(t.guide_status),Kr=t=>(t==null?void 0:t.delivery_evidences)??(t==null?void 0:t.deliveryEvidences)??[],Yt=t=>Kr(t)[0]??null,Qr=t=>(t==null?void 0:t.tracking_events)??(t==null?void 0:t.trackingEvents)??[],ta=t=>{const a=`${t??""}`.trim();return a.startsWith("blob:")||a.startsWith("data:image/")||/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(a)||a.includes("/delivery-evidence-media/")},na=()=>{const t=new Date;return t.setMinutes(t.getMinutes()-t.getTimezoneOffset()),t.toISOString().slice(0,16)},gt={lat:-12.046374,lng:-77.042793},Z=t=>{const a=Number(t);return Number.isFinite(a)?a:null},jt=t=>{const a=Z(t);return a===null?"":a.toFixed(7)},ee=t=>Z(t==null?void 0:t.lat)!==null&&Z(t==null?void 0:t.lng)!==null,Xr=({modalRef:t,position:a,searchText:s,onPositionChange:c,onSearchTextChange:p,onAddressSelected:_,googleMapsApiKey:u})=>{const x=l.useRef(),[T,M]=l.useState(!1),[E,C]=l.useState(""),[L,te]=l.useState([]),X=ee(a)?{lat:Z(a.lat),lng:Z(a.lng)}:gt,I=(h,F=17)=>{const U=Z(h==null?void 0:h.lat),q=Z(h==null?void 0:h.lng);U===null||q===null||!x.current||(x.current.setCenter({lat:U,lng:q}),x.current.setZoom(F))},ue=h=>{c(h),I(h)};l.useEffect(()=>{if(ee(a)){I(X);return}I(gt,13)},[a==null?void 0:a.lat,a==null?void 0:a.lng]),l.useEffect(()=>{const h=t==null?void 0:t.current;if(!h)return;const F=()=>{setTimeout(()=>{ee(a)?I(X):I(gt,13)},180)};return $(h).on("shown.bs.modal",F),()=>$(h).off("shown.bs.modal",F)},[t,a==null?void 0:a.lat,a==null?void 0:a.lng]);const xe=async()=>{var F,U;const h=`${s??""}`.trim();if(!h){te([]),C("Escribe una direccion para buscar.");return}if(!((U=(F=window.google)==null?void 0:F.maps)!=null&&U.Geocoder)){C("Google Maps aun no termino de cargar.");return}M(!0),C("");try{new window.google.maps.Geocoder().geocode({address:`${h}, Peru`,componentRestrictions:{country:"PE"},region:"PE"},(ne,ge)=>{if(M(!1),ge!=="OK"||!Array.isArray(ne)||ne.length===0){te([]),C("Sin resultados. Puedes marcar el punto manualmente en el mapa.");return}te(ne.slice(0,5).map(O=>({place_id:O.place_id,display_name:O.formatted_address,lat:O.geometry.location.lat(),lng:O.geometry.location.lng()})))})}catch(q){M(!1),C(`${q.message}. Puedes marcar el punto manualmente en el mapa.`),te([])}},Ee=h=>{const F={lat:Z(h.lat),lng:Z(h.lng)};c(F),p(h.display_name??""),_(h.display_name??""),I(F),te([])};return n.jsxs("div",{className:"commercial-order-map-picker",children:[n.jsxs("div",{className:"commercial-order-map-search",children:[n.jsxs("div",{children:[n.jsx("label",{className:"form-label",children:"Buscar direccion en mapa"}),n.jsxs("div",{className:"input-group",children:[n.jsx("input",{type:"text",className:"form-control",value:s,onChange:h=>p(h.target.value),onKeyDown:h=>{h.key==="Enter"&&(h.preventDefault(),xe())},placeholder:"Ej. Av. Javier Prado 123, San Isidro"}),n.jsx("button",{type:"button",className:"btn btn-outline-primary",onClick:xe,disabled:T,children:T?"Buscando...":"Buscar"})]})]}),n.jsxs("div",{className:"commercial-order-map-coordinates",children:[n.jsx("label",{className:"form-label",children:"Coordenadas"}),n.jsxs("div",{className:"commercial-order-map-coordinate-values",children:[n.jsx("span",{children:jt(a==null?void 0:a.lat)||"-"}),n.jsx("span",{children:jt(a==null?void 0:a.lng)||"-"})]})]})]}),L.length>0&&n.jsx("div",{className:"commercial-order-map-results",children:L.map(h=>n.jsx("button",{type:"button",className:"commercial-order-map-result",onClick:()=>Ee(h),children:h.display_name},`${h.place_id}-${h.lat}-${h.lng}`))}),E&&n.jsx("small",{className:"text-muted d-block mt-1",children:E}),n.jsx(cr,{googleMapsApiKey:u,language:"es",region:"PE",onError:()=>C("No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio."),children:n.jsx(or,{mapContainerClassName:"commercial-order-map-canvas",center:X,zoom:ee(a)?17:13,options:{clickableIcons:!0,fullscreenControl:!0,gestureHandling:"greedy",mapTypeControl:!0,scrollwheel:!0,streetViewControl:!1},onLoad:h=>{x.current=h,setTimeout(()=>{ee(a)?I(X):I(gt,13)},120)},onClick:h=>{const F={lat:h.latLng.lat(),lng:h.latLng.lng()};ue(F)},children:ee(a)&&n.jsx(dr,{position:X,draggable:!0,onDragEnd:h=>ue({lat:h.latLng.lat(),lng:h.latLng.lng()})})})}),n.jsx("small",{className:"text-muted d-block mt-2",children:"Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega."})]})},Yr=t=>{const a=`${lr.GMAPS_API_KEY??""}`.trim();return a?n.jsx(Xr,{...t,googleMapsApiKey:a}):n.jsx("div",{className:"commercial-order-map-picker",children:n.jsx("div",{className:"commercial-order-map-empty",children:"Configura Google Maps API Key en Sistemas > Datos generales > Integraciones para habilitar el mapa."})})},Jr=t=>!t||t.status===null||`${t.order_status??""}`=="cancelled"?!1:`${t.dispatch_status??"pending"}`=="pending",Zr=t=>{if(!t)return[];const a=Qr(t).map(u=>({date:u.happened_at??u.created_at,status:[u.title,u.description].filter(Boolean).join(" - ")})),s=[{date:t.created_at,status:"La orden ingreso en el sistema"}];t.approved_at&&["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)?s.push({date:t.approved_at,status:"La orden paso a preparacion"}):t.approved_at&&t.order_status==="confirmed"?s.push({date:t.approved_at,status:"La orden fue confirmada"}):["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)&&s.push({date:t.updated_at,status:"La orden paso a preparacion"});const c=(t.dispatch_assignments??t.dispatchAssignments??[]).filter(u=>(u==null?void 0:u.status)!==!1&&(u==null?void 0:u.status)!==0&&(u==null?void 0:u.dispatch)).sort((u,x)=>{var T,M,E,C;return new Date(((T=u==null?void 0:u.dispatch)==null?void 0:T.departed_at)||((M=u==null?void 0:u.dispatch)==null?void 0:M.scheduled_date)||0)-new Date(((E=x==null?void 0:x.dispatch)==null?void 0:E.departed_at)||((C=x==null?void 0:x.dispatch)==null?void 0:C.scheduled_date)||0)}),p=c.find(u=>{var x;return["in_route","delivered","closed"].includes((x=u==null?void 0:u.dispatch)==null?void 0:x.dispatch_status)});p?(s.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:`Manifiesto ${p.dispatch.manifest_code||p.dispatch.code||""}`.trim()}),s.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:"El pedido salio en ruta"})):t.dispatch_status==="in_route"&&s.push({date:t.updated_at,status:"El pedido salio en ruta"}),(t.dispatch_status==="dispatched"||c.some(u=>{var x;return((x=u==null?void 0:u.dispatch)==null?void 0:x.dispatch_status)==="dispatched"}))&&s.push({date:t.updated_at,status:"El pedido paso a despacho"}),_t(t).forEach(u=>{s.push({date:u.issue_date??u.created_at??t.updated_at,status:`Guia de remision ${la(u)} - ${ra(u.guide_status)}`})});const _=c.find(u=>{var x;return["delivered","closed"].includes((x=u==null?void 0:u.dispatch)==null?void 0:x.dispatch_status)});return _?s.push({date:_.dispatch.delivered_at??_.dispatch.updated_at??_.dispatch.created_at,status:"El pedido fue entregado"}):t.dispatch_status==="delivered"&&s.push({date:t.updated_at,status:"El pedido fue entregado"}),(t.order_status==="cancelled"||t.dispatch_status==="cancelled")&&s.push({date:t.updated_at,status:"El pedido fue cancelado"}),[...a,...s].filter(u=>u.date).sort((u,x)=>new Date(u.date)-new Date(x.date))},ei=({title:t,config:a})=>{const s=(a==null?void 0:a.pageSize)??20;return n.jsx("div",{className:"row",children:n.jsx("div",{className:"col-12",children:n.jsxs("div",{className:"card",children:[n.jsx("div",{className:"card-header",children:t}),n.jsxs("div",{className:"card-body",children:[n.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[n.jsxs("div",{className:"d-flex align-items-center gap-2",children:[n.jsx("label",{className:"form-label mb-0",children:"Elementos :"}),n.jsx("select",{className:"form-select form-select-sm commercial-order-page-size",defaultValue:s,children:[10,20,25,50].map(c=>n.jsx("option",{value:c,children:c},`commercial-list-size-${c}`))})]}),n.jsxs("div",{className:"d-flex align-items-center gap-2",children:[n.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),n.jsx("input",{className:"form-control form-control-sm commercial-order-list-search"})]})]}),((a==null?void 0:a.exports)??[]).length>0&&n.jsx("div",{className:"d-flex flex-wrap gap-1 mb-2",children:a.exports.map(c=>n.jsx("button",{type:"button",className:"btn btn-sm btn-light",children:c},`commercial-list-export-${c}`))}),n.jsx("div",{className:"table-responsive commercial-order-legacy-table",children:n.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[n.jsx("thead",{children:n.jsx("tr",{children:((a==null?void 0:a.headers)??[]).map(c=>n.jsx("th",{children:c},`commercial-list-header-${c}`))})}),n.jsx("tbody",{children:n.jsx("tr",{children:n.jsx("td",{colSpan:((a==null?void 0:a.headers)??[]).length||1,className:"text-muted",children:"No existen elementos"})})})]})}),n.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2",children:[n.jsx("span",{className:"text-muted",children:"No hay elementos a mostrar"}),n.jsxs("div",{className:"d-flex align-items-center gap-2 text-muted",children:[n.jsx("span",{children:"Anterior"}),n.jsx("button",{type:"button",className:"btn btn-sm btn-light active",children:"1"}),n.jsx("span",{children:"Siguiente"})]})]})]})]})})})},ti=({requiredPermission:t="orders",externalSource:a=null,pageTitle:s="Pedidos comerciales"})=>{var Fn;B.externalSource=null;const c=l.useRef(),p=l.useRef(),_=l.useRef(),u=l.useRef(),x=l.useRef(),T=l.useRef(),M=l.useRef(),E=l.useRef(),C=l.useRef(),L=l.useRef(),te=l.useRef(),X=l.useRef(),I=l.useRef(),ue=l.useRef(),xe=l.useRef(),Ee=l.useRef(),h=l.useRef(),F=l.useRef(),U=l.useRef(),q=l.useRef(),ne=l.useRef(),ge=l.useRef(),O=l.useRef(),Ye=l.useRef(),ca=l.useRef(),Je=l.useRef(),Ze=l.useRef(),Ie=l.useRef(),et=l.useRef(),tt=l.useRef(),nt=l.useRef(),at=l.useRef(),rt=l.useRef(),it=l.useRef(),st=l.useRef(),lt=l.useRef(),oa=l.useRef(),z=l.useRef(),_e=l.useRef(),ae=l.useRef(),ve=l.useRef(),ye=l.useRef(),ct=l.useRef(),Ct=l.useRef({}),[da,ua]=l.useState(!1),[je,en]=l.useState(""),[W,ot]=l.useState(""),[H,dt]=l.useState(""),[Ne,Rt]=l.useState(""),[Ce,wt]=l.useState(""),[K,De]=l.useState(""),[ma,me]=l.useState(""),[Ft,St]=l.useState({lat:"",lng:""}),[pa,ut]=l.useState(""),[ha,tn]=l.useState([]),[Ae,mt]=l.useState([]),[ni,Re]=l.useState([]),[Y,Q]=l.useState([Qe()]),[Oe,nn]=l.useState("Factura"),[re,kt]=l.useState(null),[an,fa]=l.useState(null),[we,ba]=l.useState(null),[rn,$t]=l.useState(null),[pe,Tt]=l.useState(""),[Et,xa]=l.useState([]),[It,sn]=l.useState(""),[Dt,ln]=l.useState(!1),[R,ga]=l.useState(a?"multivende":"orders"),[_a,va]=l.useState([]),[cn,ya]=l.useState(Qn()),[Pe,ja]=l.useState(Qn()),[w,At]=l.useState({recipient_name:"",recipient_document_type:"DNI",recipient_document_number:"",recipient_phone:"",delivered_at:na(),evidence_notes:"",evidence_url:"",latitude:"",longitude:""}),Na=l.useMemo(()=>{const e=new aa;return e.externalSource=a||Ln,e},[a]),on=bt.find(e=>e.id===R)??bt[0],Ot=cn[R]??{},dn=Pe[R]??{},Ca=l.useMemo(()=>Er(Pe.orders),[Pe.orders]),Ra=l.useMemo(()=>Tr(R,dn),[R,dn]),wa=l.useMemo(()=>Ir(Pe.multivende,a||Ln),[Pe.multivende,a]),Fa=l.useMemo(()=>{var r;const e=new URLSearchParams;return je&&e.append("business_id",je),W&&e.append("business_branch_id",W),H&&e.append("warehouse_id",H),Ne&&e.append("client_id",Ne),Ce&&e.append("eventual_client_id",Ce),K&&e.append("client_distribution_network_id",K),(r=O.current)!=null&&r.value&&e.append("issue_date",O.current.value),`/api/admin/commercial-orders/articles?${e.toString()}`},[je,W,H,Ne,Ce,K]),Sa=l.useMemo(()=>W?["business_branch_id","=",Number(W)]:null,[W]);l.useEffect(()=>()=>{pe!=null&&pe.startsWith("blob:")&&URL.revokeObjectURL(pe)},[pe]),l.useEffect(()=>{let e=!0;return Ht.getBusinesses().then(r=>{e&&va(r)}),()=>{e=!1}},[]),l.useEffect(()=>{if(!re)return;const e=()=>kt(null),r=i=>{i.key==="Escape"&&e()};return document.addEventListener("click",e),document.addEventListener("keydown",r),window.addEventListener("resize",e),window.addEventListener("scroll",e,!0),()=>{document.removeEventListener("click",e),document.removeEventListener("keydown",r),window.removeEventListener("resize",e),window.removeEventListener("scroll",e,!0)}},[re]);const un=e=>(Ct.current[e]||(Ct.current[e]=l.createRef()),Ct.current[e]);l.useEffect(()=>{Y.forEach(e=>{const r=un(e.uid);!r.current||!e.article_id||!e.article_label||`${$(r.current).val()}`==`${e.article_id}`||ke(r.current,e.article_id,e.article_label)})},[Y]);const mn=async(e,r=null)=>{if(!e){tn([]),ot("");return}const m=(await B.getBranchesByBusiness(e)??[]).filter(d=>d.status!==null);if(tn(m),r&&m.some(d=>`${d.id}`==`${r}`)){ot(`${r}`);return}ot("")},pn=e=>{if(!e)return;const r=Gr(e),i=Vr(e);r&&z.current&&(z.current.value=r),i&&ae.current&&(ae.current.value=i),r&&ut(r)},hn=async(e,r=null,i=null)=>{var y;if(!e){mt([]),De(""),Re([]),me("");return}const d=(await B.getDistributionNetworks(e)??[]).filter(b=>b.status!==null);mt(d);const o=r||((y=d.find(b=>b.is_default))==null?void 0:y.id);if(o&&d.some(b=>`${b.id}`==`${o}`)){De(`${o}`),await fn(o,null,d);return}De(""),Re([]),me(""),pn(i)},fn=async(e,r=null,i=null)=>{var b,N;if(!e){Re([]),me("");return}let m=[];const d=(i??Ae).find(g=>`${g.id}`==`${e}`);(((b=d==null?void 0:d.addresses)==null?void 0:b.length)??0)>0?m=d.addresses:m=await B.getDeliveryAddresses(e);const o=(m??[]).filter(g=>g.status!==null);Re(o);const y=r||((N=o.find(g=>g.is_default))==null?void 0:N.id);if(y&&o.some(g=>`${g.id}`==`${y}`)){me(`${y}`),ka(o.find(g=>`${g.id}`==`${y}`));return}me("")},ka=e=>{e&&(z.current&&(z.current.value=S(e.address)),_e.current&&(_e.current.value=S(e.reference)),ae.current&&(ae.current.value=S(e.ubigeo)),ve.current&&(ve.current.value=S(e.contact_name)),ye.current&&(ye.current.value=S(e.contact_phone)),ut(S(e.address)),ee({lat:e.latitude,lng:e.longitude})&&St({lat:Number(e.latitude),lng:Number(e.longitude)}))},bn=async(e,r={})=>{var o,y,b;const i=r.article_id??e.article_id,m=Number(r.quantity??e.quantity??0),d=r.presentation_id??e.presentation_id;return!i||!H||m<=0?null:await B.resolvePrice({article_id:i,presentation_id:d||null,quantity:m,business_id:je||null,business_branch_id:W||null,warehouse_id:H||null,client_id:Ne||null,eventual_client_id:Ce||null,client_distribution_network_id:K||null,issue_date:((o=O.current)==null?void 0:o.value)||null,commercial_channel:((y=Ae.find(N=>`${N.id}`==`${K}`))==null?void 0:y.commercial_channel)||null,segment:((b=Ae.find(N=>`${N.id}`==`${K}`))==null?void 0:b.segment)||null})},Pt=async(e=null)=>{const r=e??Y;for(const i of r){if(!i.article_id)continue;const m=await bn(i);m&&Q(d=>d.map(o=>o.uid!==i.uid?o:fe({...o,stock_available:Number(m.stock_available||0),price_unit:Gn(o,m),price_source:Vn(o,m),price_list_code:m.price_list_code||""})))}},xn=e=>{e==="regular"?(wt(""),J(q)):e==="eventual"&&(Rt(""),mt([]),De(""),Re([]),me(""),J(U))},Mt=async(e=null)=>{var b,N,g,G;ua(!!(e!=null&&e.id)),ue.current&&(ue.current.value=(e==null?void 0:e.id)??""),xe.current&&(xe.current.value=(e==null?void 0:e.code)??"Se genera al guardar"),O.current&&(O.current.value=e!=null&&e.issue_date?e.issue_date.toString().slice(0,10):new Date().toISOString().slice(0,10)),Ye.current&&(Ye.current.value=e!=null&&e.promised_delivery_at?e.promised_delivery_at.toString().slice(0,10):""),nn(vt((e==null?void 0:e.document_type)??"Factura")),Je.current&&(Je.current.value=(e==null?void 0:e.currency)??"PEN"),Ze.current&&(Ze.current.value=(e==null?void 0:e.payment_condition)??"Contado"),Ie.current&&(Ie.current.value=Br(e==null?void 0:e.payment_method)),at.current&&(at.current.value=(e==null?void 0:e.installments)??1),rt.current&&(rt.current.value=e!=null&&e.first_due_date?e.first_due_date.toString().slice(0,10):""),it.current&&(it.current.value=(e==null?void 0:e.order_status)??(e!=null&&e.external_source?"pending":"draft")),st.current&&(st.current.value=(e==null?void 0:e.dispatch_status)??"pending"),lt.current&&(lt.current.value=(e==null?void 0:e.billing_status)??"pending"),z.current&&(z.current.value=S(e==null?void 0:e.delivery_address)),_e.current&&(_e.current.value=S(e==null?void 0:e.delivery_reference)),ae.current&&(ae.current.value=S(e==null?void 0:e.ubigeo)),ve.current&&(ve.current.value=S(e==null?void 0:e.dispatch_contact_name)),ye.current&&(ye.current.value=S(e==null?void 0:e.dispatch_contact_phone)),et.current&&(et.current.value=(e==null?void 0:e.purchase_order)??""),tt.current&&(tt.current.value=(e==null?void 0:e.guide_number)??""),nt.current&&(nt.current.value=(e==null?void 0:e.referral_guide)??""),ge.current&&(ge.current.value=(e==null?void 0:e.doctor_name)??""),ct.current&&(ct.current.value=(e==null?void 0:e.observations)??""),St({lat:ee({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lat):"",lng:ee({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lng):""}),ut(S(e==null?void 0:e.delivery_address));const r=e!=null&&e.business_id?`${e.business_id}`:"",i=e!=null&&e.warehouse_id?`${e.warehouse_id}`:"",m=e!=null&&e.client_id?`${e.client_id}`:"",d=e!=null&&e.eventual_client_id?`${e.eventual_client_id}`:"";en(r),dt(i),Rt(m),wt(d),r&&((b=e==null?void 0:e.business)!=null&&b.name)?ke(Ee.current,r,e.business.name):J(Ee),i&&((N=e==null?void 0:e.warehouse)!=null&&N.name)?ke(F.current,i,e.warehouse.name):J(F),m&&((g=e==null?void 0:e.client)!=null&&g.full_name)?ke(U.current,m,`${e.client.document_number??""} - ${e.client.full_name}`.trim()):J(U),d&&((G=e==null?void 0:e.eventual_client)!=null&&G.business_name)?ke(q.current,d,`${e.eventual_client.document_number??""} - ${e.eventual_client.business_name}`.trim()):J(q),e!=null&&e.seller_id&&(e!=null&&e.seller)?ke(ne.current,e.seller_id,yr(e.seller)):J(ne);const o=((e==null?void 0:e.items)??[]).map(j=>{var le,ce,oe,de,v,k,Me,Le,Be,Ge,Ve,Ue,qe,ze,We,He;const f=j.article??null,se=((f==null?void 0:f.presentations)??[]).filter(D=>(D==null?void 0:D.status)!==!1&&(D==null?void 0:D.status)!==0),P=j.presentation??se[0]??null,he=Number(j.presentation_units??(P==null?void 0:P.units)??1)||1;return fe({uid:crypto.randomUUID(),article_id:j.article_id?`${j.article_id}`:"",article_label:f?`${f.code??""} - ${f.name??""}`.trim():"",article_code:(f==null?void 0:f.code)??j.external_sku??"",article_lot:(f==null?void 0:f.default_lot)??"",article_name:(f==null?void 0:f.name)??"",article_unit:((le=f==null?void 0:f.unit)==null?void 0:le.symbol)??((ce=f==null?void 0:f.unit)==null?void 0:ce.name)??"",article_laboratory:((oe=f==null?void 0:f.laboratory)==null?void 0:oe.name)??"",article_principle:((de=f==null?void 0:f.activePrinciple)==null?void 0:de.name)??((v=f==null?void 0:f.active_principle)==null?void 0:v.name)??"",presentations:se.map(D=>({id:`${D.id}`,name:D.name??"Presentacion",units:Number(D.units||1),price:Number(D.price||0)})),presentation_id:P!=null&&P.id?`${P.id}`:"",presentation_units:he,stock_available:Number(j.stock_available||0),reserved_quantity:Number(j.reserved_quantity||0),price_unit:Number(j.price_unit||0),quantity:Number(j.quantity||1),discount_type:((Me=(k=j.external_payload)==null?void 0:k.commercial_form)==null?void 0:Me.discount_type)??"none",discount_value:Number(((Be=(Le=j.external_payload)==null?void 0:Le.commercial_form)==null?void 0:Be.discount_value)||0),discount_amount:Number(((Ve=(Ge=j.external_payload)==null?void 0:Ge.commercial_form)==null?void 0:Ve.discount_amount)||0),gross_total:Number(((qe=(Ue=j.external_payload)==null?void 0:Ue.commercial_form)==null?void 0:qe.gross_total)||0),total:Number(j.total||0),price_source:j.price_source||"fallback",price_list_code:((We=(ze=j==null?void 0:j.price_list_item)==null?void 0:ze.price_list)==null?void 0:We.code)||((He=e==null?void 0:e.price_list)==null?void 0:He.code)||""})}),y=o.length?o:[Qe()];Q(y),$(u.current).modal("show"),await mn((e==null?void 0:e.business_id)??null,(e==null?void 0:e.business_branch_id)??null),m?(await hn(m,(e==null?void 0:e.client_distribution_network_id)??null),e!=null&&e.client_distribution_network_id&&await fn(e.client_distribution_network_id,(e==null?void 0:e.client_delivery_address_id)??null)):(mt([]),De(""),Re([]),me(""))},$a=async e=>{var d,o,y,b,N,g,G,j,f,se,P,he,le,ce,oe,de,v,k,Me,Le,Be,Ge,Ve,Ue,qe,ze,We,He,D,Sn,kn,$n,Tn;e.preventDefault();const r={id:((d=ue.current)==null?void 0:d.value)||void 0,external_source:a||void 0,business_id:je||null,business_branch_id:W||null,warehouse_id:H||null,client_id:Ne||null,eventual_client_id:Ce||null,seller_id:((o=ne.current)==null?void 0:o.value)||null,client_distribution_network_id:K||null,client_delivery_address_id:ma||null,document_type:Oe,currency:((y=Je.current)==null?void 0:y.value)||"PEN",payment_condition:Lr(((b=Ie.current)==null?void 0:b.value)||((N=Ze.current)==null?void 0:N.value)||"Contado"),payment_method:((g=Ie.current)==null?void 0:g.value)||"",purchase_order:((j=(G=et.current)==null?void 0:G.value)==null?void 0:j.trim())||"",guide_number:((se=(f=tt.current)==null?void 0:f.value)==null?void 0:se.trim())||"",referral_guide:((he=(P=nt.current)==null?void 0:P.value)==null?void 0:he.trim())||"",doctor_name:((ce=(le=ge.current)==null?void 0:le.value)==null?void 0:ce.trim())||"",issue_date:((oe=O.current)==null?void 0:oe.value)||"",promised_delivery_at:((de=Ye.current)==null?void 0:de.value)||null,installments:((v=at.current)==null?void 0:v.value)||1,first_due_date:((k=rt.current)==null?void 0:k.value)||null,order_status:((Me=it.current)==null?void 0:Me.value)||(a?"pending":"draft"),dispatch_status:((Le=st.current)==null?void 0:Le.value)||"pending",billing_status:((Be=lt.current)==null?void 0:Be.value)||"pending",tax_amount:Vt.taxAmount,delivery_address:((Ve=(Ge=z.current)==null?void 0:Ge.value)==null?void 0:Ve.trim())||"",delivery_reference:((qe=(Ue=_e.current)==null?void 0:Ue.value)==null?void 0:qe.trim())||"",ubigeo:((We=(ze=ae.current)==null?void 0:ze.value)==null?void 0:We.trim())||"",map_lat:jt(Ft.lat)||null,map_lng:jt(Ft.lng)||null,dispatch_contact_name:((D=(He=ve.current)==null?void 0:He.value)==null?void 0:D.trim())||"",dispatch_contact_phone:((kn=(Sn=ye.current)==null?void 0:Sn.value)==null?void 0:kn.trim())||"",observations:((Tn=($n=ct.current)==null?void 0:$n.value)==null?void 0:Tn.trim())||"",items:Y.map(A=>({article_id:A.article_id||null,presentation_id:A.presentation_id||null,warehouse_id:H||null,stock_available:A.stock_available,reserved_quantity:A.reserved_quantity,presentation_units:A.presentation_units,price_unit:A.price_unit,quantity:A.quantity,gross_total:A.gross_total,discount_type:A.discount_type,discount_value:A.discount_value,discount_amount:A.discount_amount,total:A.total,status:!0}))},i=Wr(Y,H);if(i.length>0){const A=`
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${i.map(Fe=>`<li><strong>${Nr(Fe.article)}</strong>: faltan ${Te(Fe.shortage)} unidad(es) base para completar ${Te(Fe.quantity)}. Cantidad: ${Te(Fe.lineQuantity)} x ${Te(Fe.presentationUnits)}. Disponible: ${Te(Fe.available)}.</li>`).join("")}
          </ul>
        </div>
      `,{isConfirmed:nr}=await Se.fire({title:"Stock insuficiente",html:A,icon:"warning",showCancelButton:!0,confirmButtonText:"Crear de todas formas",cancelButtonText:"Revisar pedido"});if(!nr)return;r.allow_stock_shortage=!0}await B.save(r)&&($(c.current).dxDataGrid("instance").refresh(),$(u.current).modal("hide"))},Ta=async e=>{const r=e.target.value||"";en(r),dt(""),J(F),await mn(r,null)},Ea=e=>{const r=e.target.value||"";ot(r),dt(""),J(F)},Ia=async e=>{const r=e.target.value||"";dt(r),await Pt()},Da=async e=>{var m,d;const r=Jn(e.target.value),i=((d=(m=$(e.target).select2("data"))==null?void 0:m[0])==null?void 0:d.data)??null;Rt(r),xn("regular"),pn(i),await hn(r,null,i),await Pt()},Aa=async e=>{const r=Jn(e.target.value);wt(r),xn("eventual"),await Pt()},Lt=(e,r,i)=>{ya(m=>({...m,[e]:{...m[e]??{},[r]:i}}))},gn=(e=R)=>{var m;const r=e==="multivende"?_:((m=bt.find(d=>d.id===e))==null?void 0:m.kind)==="billing"?p:c,i=r.current?$(r.current).dxDataGrid("instance"):null;i&&i.refresh()},Oa=e=>{var r;(r=e==null?void 0:e.preventDefault)==null||r.call(e),ja(i=>({...i,[R]:cn[R]??{}})),setTimeout(()=>gn(R),0)},Pa=async({id:e,field:r,value:i})=>{await B.boolean({id:e,field:r,value:i})&&$(c.current).dxDataGrid("instance").refresh()},_n=e=>{fa(e),$(te.current).modal("show")},Ma=e=>{const r=Yt(e);ba(e),$t(null),Tt(ta(r==null?void 0:r.evidence_url)?r.evidence_url:""),At({recipient_name:(r==null?void 0:r.recipient_name)??(e==null?void 0:e.dispatch_contact_name)??"",recipient_document_type:(r==null?void 0:r.recipient_document_type)??"DNI",recipient_document_number:(r==null?void 0:r.recipient_document_number)??"",recipient_phone:(r==null?void 0:r.recipient_phone)??(e==null?void 0:e.dispatch_contact_phone)??"",delivered_at:r!=null&&r.delivered_at?`${r.delivered_at}`.replace(" ","T").slice(0,16):na(),evidence_notes:(r==null?void 0:r.evidence_notes)??"",evidence_url:(r==null?void 0:r.evidence_url)??"",latitude:(r==null?void 0:r.latitude)??"",longitude:(r==null?void 0:r.longitude)??""}),navigator.geolocation&&navigator.geolocation.getCurrentPosition(i=>{At(m=>({...m,latitude:m.latitude||i.coords.latitude,longitude:m.longitude||i.coords.longitude}))},()=>{},{enableHighAccuracy:!0,timeout:5e3}),setTimeout(()=>{I.current&&(I.current.value="")},0),$(X.current).modal("show")},La=e=>{var i;const r=((i=e.target.files)==null?void 0:i[0])??null;$t(r),Tt(r?URL.createObjectURL(r):ta(w.evidence_url)?w.evidence_url:"")},ie=(e,r)=>At(i=>({...i,[e]:r})),Ba=async e=>{if(e.preventDefault(),!(we!=null&&we.id))return;const r=(we.dispatch_assignments??we.dispatchAssignments??[]).filter(d=>(d==null?void 0:d.status)!==!1&&(d==null?void 0:d.status)!==0&&(d==null?void 0:d.dispatch)).sort((d,o)=>{var y,b;return new Date(((y=o==null?void 0:o.dispatch)==null?void 0:y.scheduled_date)||(o==null?void 0:o.created_at)||0)-new Date(((b=d==null?void 0:d.dispatch)==null?void 0:b.scheduled_date)||(d==null?void 0:d.created_at)||0)})[0],i=new FormData;r!=null&&r.dispatch_id&&i.append("dispatch_id",r.dispatch_id),i.append("recipient_name",w.recipient_name??""),i.append("recipient_document_type",w.recipient_document_type??"DNI"),i.append("recipient_document_number",w.recipient_document_number??""),i.append("recipient_phone",w.recipient_phone??""),i.append("delivered_at",w.delivered_at??""),i.append("evidence_notes",w.evidence_notes??""),i.append("evidence_url",w.evidence_url??""),i.append("latitude",w.latitude??""),i.append("longitude",w.longitude??""),rn&&i.append("evidence_file",rn),await B.saveDeliveryEvidence(we.id,i)&&($t(null),Tt(""),I.current&&(I.current.value=""),$(X.current).modal("hide"),$(c.current).dxDataGrid("instance").refresh())},vn=async e=>{const r=_t(e)[0];if(r){if(Hr(r)){const m=await Se.fire({title:"Guia de remision",text:`La guia ${la(r)} esta ${ra(r.guide_status).toLowerCase()}.`,icon:"question",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Ver PDF",cancelButtonText:"Cancelar"});if(m.isConfirmed){const d=await Mn.issue(r.id);if(!(d!=null&&d.data))return;$(c.current).dxDataGrid("instance").refresh(),await ht(ft.referralGuide(d.data));return}if(!m.isDenied)return}await ht(ft.referralGuide(r));return}const i=await Mn.prepareFromCommercialOrder(e.id);i!=null&&i.data&&($(c.current).dxDataGrid("instance").refresh(),await ht(ft.referralGuide(i.data)))},Ga=async e=>{const{isConfirmed:r}=await Se.fire({title:"Eliminar pedido comercial",text:"Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!r||!await B.delete(e)||$(c.current).dxDataGrid("instance").refresh()},Va=()=>{T.current&&(T.current.value=""),$(x.current).modal("show"),setTimeout(()=>{var e;return(e=T.current)==null?void 0:e.focus()},150)},Ua=async e=>{var i,m;e.preventDefault();const r=((m=(i=T.current)==null?void 0:i.value)==null?void 0:m.trim())||"";if(!r){await Se.fire({title:"CHECK OUT ID requerido",text:"Ingresa el CHECK OUT ID del pedido Multivende.",icon:"warning",confirmButtonText:"Entendido"});return}await Se.fire({title:"Integracion pendiente",text:`El formulario ya captura el CHECK OUT ID ${r}. Falta conectar el servicio de Multivende para registrar el pedido automaticamente.`,icon:"info",confirmButtonText:"Aceptar"})},yn=()=>{E.current&&(E.current.value=""),C.current&&(C.current.value=""),L.current&&(L.current.value="1")},jn=async()=>{ln(!0);try{const e=await Pn.paginate({take:100,skip:0,requireTotalCount:!0,sort:[{selector:"id",desc:!1}]});xa((e==null?void 0:e.data)??[])}finally{ln(!1)}},qa=async()=>{yn(),sn(""),$(M.current).modal("show"),await jn(),setTimeout(()=>{var e;return(e=C.current)==null?void 0:e.focus()},150)},za=e=>{var r;E.current&&(E.current.value=(e==null?void 0:e.id)??""),C.current&&(C.current.value=(e==null?void 0:e.description)??""),L.current&&(L.current.value=e!=null&&e.status?"1":"0"),(r=C.current)==null||r.focus()},Wa=async()=>{var i,m,d,o;const e=((m=(i=C.current)==null?void 0:i.value)==null?void 0:m.trim())||"";if(!e){await Se.fire({title:"Motivo requerido",text:"Ingresa la descripcion del motivo de retraso.",icon:"warning",confirmButtonText:"Entendido"});return}await Pn.save({id:((d=E.current)==null?void 0:d.value)||void 0,description:e,status:((o=L.current)==null?void 0:o.value)==="1"})&&(yn(),await jn())},Ha=async(e,r)=>{var j,f,se,P,he,le,ce,oe,de;$(r.target).data("select2")&&$(r.target).select2("close");const i=(j=$(r.target).select2("data"))==null?void 0:j[0],m=(i==null?void 0:i.data)??null,d=r.target.value||"";if(!d){Q(v=>v.map(k=>k.uid===e?{...Qe(),uid:k.uid}:k));return}const o=m??await B.getArticleById(d),y=((o==null?void 0:o.presentations)??[]).filter(v=>(v==null?void 0:v.status)!==!1&&(v==null?void 0:v.status)!==0),b=y[0]??null,N=o?`${o.code??""} - ${o.name??""}`.trim():(i==null?void 0:i.text)??d,g={article_id:d,article_label:N,article_code:(o==null?void 0:o.code)??"",article_lot:(o==null?void 0:o.default_lot)??"",article_name:(o==null?void 0:o.name)??"",article_unit:((f=o==null?void 0:o.unit)==null?void 0:f.symbol)??((se=o==null?void 0:o.unit)==null?void 0:se.name)??"",article_laboratory:((P=o==null?void 0:o.laboratory)==null?void 0:P.name)??"",article_principle:((he=o==null?void 0:o.activePrinciple)==null?void 0:he.name)??((le=o==null?void 0:o.active_principle)==null?void 0:le.name)??"",presentations:y.map(v=>({id:`${v.id}`,name:v.name??"Presentacion",units:Number(v.units||1),price:Number(v.price||0)})),presentation_id:b?`${b.id}`:"",presentation_units:Number((b==null?void 0:b.units)||1),quantity:1};Q(v=>v.map(k=>k.uid===e?fe({...k,...g}):k));const G=await B.resolvePrice({article_id:d,presentation_id:b?`${b.id}`:null,quantity:1,business_id:je||null,business_branch_id:W||null,warehouse_id:H||null,client_id:Ne||null,eventual_client_id:Ce||null,client_distribution_network_id:K||null,issue_date:((ce=O.current)==null?void 0:ce.value)||null,commercial_channel:((oe=Ae.find(v=>`${v.id}`==`${K}`))==null?void 0:oe.commercial_channel)||null,segment:((de=Ae.find(v=>`${v.id}`==`${K}`))==null?void 0:de.segment)||null});G&&Q(v=>v.map(k=>k.uid===e?fe({...k,...g,stock_available:Number(G.stock_available||0),price_unit:Number(G.price_unit||0),price_source:G.source||"fallback",price_list_code:G.price_list_code||""}):k))},Bt=async(e,r,i)=>{const m=Y.find(N=>N.uid===e);if(!m)return;const d=r==="presentation_id"?m.presentations.find(N=>`${N.id}`==`${i}`):null,o=fe({...m,[r]:i,...r==="presentation_id"?{presentation_units:Number((d==null?void 0:d.units)||1)}:{}});if(r==="price_unit"&&(o.price_source="manual",o.price_list_code=""),Q(N=>N.map(g=>g.uid===e?o:g)),!["quantity","presentation_id"].includes(r))return;const y=o.presentations.find(N=>`${N.id}`==`${r==="presentation_id"?i:o.presentation_id}`),b=await bn(o,{quantity:r==="quantity"?i:o.quantity,presentation_id:r==="presentation_id"?i:o.presentation_id});b&&Q(N=>N.map(g=>g.uid!==e?g:fe({...g,presentation_units:Number((y==null?void 0:y.units)||g.presentation_units||1),stock_available:Number(b.stock_available||0),price_unit:Gn(g,b,r==="presentation_id"),price_source:Vn(g,b,r==="presentation_id"),price_list_code:r==="presentation_id"?b.price_list_code||"":Jt(g)?g.price_list_code:b.price_list_code||""})))},Ka=(e,r)=>{const i=Number(r||0);Q(m=>m.map(d=>d.uid!==e?d:fe({...d,discount_type:i>0?"percent":"none",discount_value:i>0?i:0})))},Qa=(e,r)=>{r.preventDefault(),r.stopPropagation();const i=r.currentTarget.getBoundingClientRect();kt(m=>(m==null?void 0:m.uid)===e?null:{uid:e,top:i.bottom+4,left:i.left,width:Math.max(i.width,130)})},Nn=(e,r)=>{Ka(e,r),kt(null)},Xa=()=>Q(e=>[...e,Qe()]),Ya=e=>{Q(r=>{const i=r.filter(m=>m.uid!==e);return i.length?i:[Qe()]})},Gt=l.useMemo(()=>Y.reduce((e,r)=>e+Number(r.total||0),0),[Y]),Vt=l.useMemo(()=>ea(Gt,Oe),[Gt,Oe]),Cn=l.useMemo(()=>Zr(an),[an]),Ut=l.useMemo(()=>{const e=It.trim().toLowerCase();return e?Et.filter(r=>[r.description,r.status?"Activo":"Inactivo",Kt(r.creator),Kn(r.created_at)].some(i=>`${i??""}`.toLowerCase().includes(e))):Et},[Et,It]),Ja=(e,r)=>n.jsxs("div",{className:"col-12 col-md-6 col-xl-4",children:[n.jsx("label",{className:"form-label",children:r.label}),r.type==="business"?n.jsxs("select",{className:"form-select",value:Ot[r.key]??"",onChange:i=>Lt(e,r.key,i.target.value),children:[n.jsx("option",{value:"",children:"Todos"}),_a.map(i=>n.jsx("option",{value:i.id,children:i.name},`commercial-order-filter-business-${i.id}`))]}):r.type==="select"?n.jsx("select",{className:"form-select",value:Ot[r.key]??"",onChange:i=>Lt(e,r.key,i.target.value),children:(r.options??[]).map(i=>n.jsx("option",{value:i.value??i,children:i.label??i},`commercial-order-filter-${r.key}-${i.value??i}`))}):n.jsx("input",{className:"form-control",value:Ot[r.key]??"",onChange:i=>Lt(e,r.key,i.target.value),placeholder:r.placeholder??""})]},`commercial-order-main-filter-${e}-${r.key}`),Rn={orders:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"text"},{key:"dispatchStatus",label:"Despachado",type:"select",options:[{value:"",label:"Seleccionar"},{value:"dispatched",label:"Pedidos despachados"},{value:"pending",label:"Pedidos sin despachar"}]}],issued:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"text"}],cancelled:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"text"}],"credit-notes":[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"text"}],multivende:[{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"text"},{key:"orderVtex",label:"Pedido VTEX",type:"text",placeholder:"Numero de pedido"}]}[R]??((Fn=Bn[R])==null?void 0:Fn.filters)??[],pt=n.jsxs("div",{className:"commercial-order-listing-header",children:[n.jsxs("div",{className:"d-flex align-items-center justify-content-between gap-2 mb-2",children:[n.jsx("h4",{className:"header-title mb-0",children:"Listado"}),n.jsx("button",{type:"button",className:"btn btn-xs btn-light",onClick:()=>gn(),title:"Refrescar listado",children:n.jsx("i",{className:"mdi mdi-refresh"})})]}),n.jsx("ul",{className:"nav nav-tabs nav-bordered flex-nowrap overflow-auto mb-3",children:bt.map(e=>n.jsx("li",{className:"nav-item",children:n.jsx("button",{type:"button",className:`nav-link text-nowrap ${R===e.id?"active":""}`,onClick:()=>ga(e.id),children:e.label})},`commercial-order-tab-${e.id}`))}),Rn.length>0&&n.jsxs("form",{className:"row g-3 align-items-end mb-2",onSubmit:Oa,children:[Rn.map(e=>Ja(R,e)),n.jsx("div",{className:"col-12 col-md-auto",children:n.jsxs("button",{type:"submit",className:"btn btn-outline-primary",children:[n.jsx("i",{className:"mdi mdi-magnify me-1"}),"Filtrar"]})}),R==="issued"&&n.jsx("div",{className:"col-12 col-md-auto",children:n.jsxs("button",{type:"button",className:"btn btn-outline-danger",children:[n.jsx("i",{className:"mdi mdi-file-pdf-box me-1"}),"Generar reporte"]})}),R==="multivende"&&n.jsx("div",{className:"col-12 col-md-auto",children:n.jsxs("button",{type:"button",className:"btn btn-outline-success",children:[n.jsx("i",{className:"mdi mdi-calendar-refresh me-1"}),"Actualizar fechas de entrega"]})})]}),R==="issued"&&n.jsx("div",{className:"row g-3 mt-1",children:["Total","IGV","IGV Recuperado"].map(e=>n.jsxs("div",{className:"col-12 col-md-4",children:[n.jsx("label",{className:"form-label",children:e}),n.jsx("input",{className:"form-control",value:"0.00",readOnly:!0})]},`commercial-order-total-${e}`))})]}),qt={caption:"Acciones",width:100,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowSorting:!1,cellTemplate:(e,{data:r})=>{e.addClass("commercial-order-actions"),V(e,{variant:"danger",title:"Descargar PDF del comprobante",icon:"mdi mdi-file-pdf-box",onClick:()=>window.open(Ht.downloadUrl(r.id,"pdf"),"_blank")})}},Za=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"dispatch_status",visible:!1,showInColumnChooser:!1}],zt=[{dataField:"source_type",visible:!1,showInColumnChooser:!1},{dataField:"local_status",visible:!1,showInColumnChooser:!1},{dataField:"document_type",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"created_at",visible:!1,showInColumnChooser:!1}],er=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"external_order_id",visible:!1,showInColumnChooser:!1},{dataField:"external_checkout_id",visible:!1,showInColumnChooser:!1}],wn={issued:[...zt,qt,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:Yn},{caption:"Cliente",minWidth:260,calculateCellValue:Qt},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>Xt(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}],cancelled:[...zt,qt,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"Cliente",minWidth:260,calculateCellValue:Qt},{caption:"Motivo",minWidth:180,calculateCellValue:Ar},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>Xt(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"F. Facturacion",dataType:"date",width:130},{dataField:"cancelled_at",caption:"F. Anulacion",dataType:"datetime",width:160}],"credit-notes":[...zt,qt,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:Yn},{caption:"Doc. Afecto",width:130,calculateCellValue:Dr},{caption:"Cliente",minWidth:260,calculateCellValue:Qt},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:e=>Xt(e.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}]},tr=[...er,{caption:"Acciones",width:230,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:r})=>{const i=_t(r).length>0;e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),V(e,{variant:"primary",title:"Editar pedido Multivende",icon:"mdi mdi-pencil",onClick:()=>Mt(r)}),V(e,{variant:"info",title:"Ver historial del pedido Multivende",icon:"mdi mdi-map-marker-path",onClick:()=>_n(r)}),V(e,{variant:i?"dark":"warning",title:i?"Ver guia de remision asociada":"Generar guia de remision",icon:i?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>vn(r)})}},{dataField:"order_status",caption:"E. Pedido",width:130,lookup:Dn(An),cellTemplate:(e,{value:r})=>xt(e,r,On)},{caption:"E. SUNAT",width:120,calculateCellValue:Or},{caption:"Pedido VTEX",width:150,calculateCellValue:Pr},{dataField:"external_channel",caption:"Canal",width:130},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:zn},{dataField:"document_type",caption:"Tipo Documento",width:140,calculateCellValue:Wn,cellTemplate:(e,{value:r})=>xt(e,r,i=>i||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:300,calculateCellValue:Hn},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"promised_delivery_at",caption:"F. Entrega Estimada",dataType:"date",width:160},{caption:"F. de Entrega",width:150,dataType:"date",calculateCellValue:sa},{caption:"Tiempo de Proceso",width:150,calculateCellValue:Mr},{dataField:"created_at",caption:"Fecha Registro",dataType:"date",width:140},{dataField:"code",caption:"Codigo",width:130}];return n.jsxs(n.Fragment,{children:[n.jsx("style",{children:`
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
    `}),n.jsxs("div",{className:"commercial-order-top-actions",children:[n.jsxs("button",{type:"button",className:"btn btn-success commercial-order-multivende-action",title:"Ingresar pedido Multivende por CHECK OUT ID",onClick:Va,children:[n.jsxs("span",{children:[n.jsx("i",{className:"mdi mdi-plus-circle-outline"})," Ingresar pedido multivende"]}),n.jsx("i",{className:"mdi mdi-calendar-month-outline"})]}),n.jsxs("button",{type:"button",className:"btn commercial-order-delay-action",title:"Abrir mantenedor de motivos de retraso de entrega",onClick:qa,children:[n.jsx("span",{children:"Mantenedor Retraso Entrega"}),n.jsx("i",{className:"mdi mdi-cog"})]})]}),R==="orders"&&n.jsx(Wt,{gridRef:c,title:pt,rest:B,filterValue:Ca,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(c.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"add",title:"Agregar",hint:"Agregar pedido comercial",onClick:()=>Mt(null)}})},pageSize:25,columns:[...Za,{caption:"Acciones",width:300,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:r})=>{const i=_t(r).length>0;e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),V(e,{variant:"primary",title:"Editar datos, cliente, entrega y productos del pedido comercial",icon:"mdi mdi-pencil",onClick:()=>Mt(r)}),Jr(r)&&V(e,{variant:"success",title:"Enviar este pedido a preparacion para iniciar picking",icon:"mdi mdi-clipboard-check-outline",onClick:()=>Pa({id:r.id,field:"dispatch_status",value:"preparing"})}),V(e,{variant:"info",title:"Ver historial de estados, guia, ruta y entrega del pedido",icon:"mdi mdi-map-marker-path",onClick:()=>_n(r)}),V(e,{variant:i?"dark":"warning",title:i?"Ver, emitir o descargar la guia de remision asociada al pedido":"Generar guia de remision para este pedido",icon:i?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>vn(r)}),V(e,{variant:"success",title:Yt(r)?"Ver o actualizar foto y datos de evidencia de entrega":"Registrar foto y datos de evidencia de entrega",icon:"mdi mdi-camera",onClick:()=>Ma(r)}),V(e,{variant:"danger",title:"Imprimir o descargar PDF resumen del pedido comercial",icon:"mdi mdi-file-pdf-box",onClick:()=>ht(ft.commercialOrder(r))}),V(e,{variant:"danger",title:"Eliminar este pedido comercial del listado",icon:"mdi mdi-delete",onClick:()=>Ga(r.id)})}},{dataField:"order_status",caption:"Estado",width:140,lookup:Dn(An),cellTemplate:(e,{value:r})=>xt(e,r,On)},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:zn},{dataField:"document_type",caption:"Tipo documento",width:130,calculateCellValue:Wn,cellTemplate:(e,{value:r})=>xt(e,r,i=>i||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:320,calculateCellValue:Hn},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_label",caption:"Tipo de pago",width:170,calculateCellValue:Fr},{dataField:"seller.fullname",caption:"Usuario",width:190,cellTemplate:(e,{data:r})=>e.text(jr(r.seller))},{dataField:"created_at",caption:"Fecha registro",width:130,dataType:"date"},{dataField:"creator.username",caption:"Usuario registro",width:150,cellTemplate:(e,{data:r})=>e.text(Kt(r.creator))},{dataField:"code",caption:"Código",width:130},{dataField:"business.name",caption:"Empresa",minWidth:150}]},"orders"),on.kind==="billing"&&n.jsx(Wt,{gridRef:p,title:pt,rest:Ht,filterValue:Ra,pageSize:20,exportable:!0,columns:wn[R]??wn.issued,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar listado",onClick:()=>$(p.current).dxDataGrid("instance").refresh()}})}},`billing-${R}`),R==="multivende"&&n.jsx(Wt,{gridRef:_,title:pt,rest:Na,filterValue:wa,pageSize:10,columns:tr,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar pedidos Multivende",onClick:()=>$(_.current).dxDataGrid("instance").refresh()}})}},"multivende"),on.kind==="static"&&n.jsx(ei,{title:pt,config:Bn[R]}),n.jsx(Ke,{modalRef:u,title:da?"Editar pedido comercial":"Agregar pedido comercial",size:"xl",dialogClass:"commercial-order-modal-dialog modal-dialog-scrollable",bodyClass:"commercial-order-modal-body",bodyStyle:{maxHeight:"calc(100vh - 150px)",overflowY:"auto",overflowX:"hidden"},btnSubmitText:"Guardar",onSubmit:$a,children:n.jsxs("div",{id:"commercial-orders-form-container",children:[n.jsx("input",{ref:ue,type:"hidden"}),n.jsx("input",{ref:xe,type:"hidden"}),n.jsx("input",{ref:O,type:"hidden"}),n.jsx("input",{ref:Ye,type:"hidden"}),n.jsx("input",{ref:Ze,type:"hidden"}),n.jsx("input",{ref:at,type:"hidden"}),n.jsx("input",{ref:rt,type:"hidden"}),n.jsx("input",{ref:it,type:"hidden"}),n.jsx("input",{ref:st,type:"hidden"}),n.jsx("input",{ref:lt,type:"hidden"}),n.jsx("input",{ref:oa,type:"hidden",value:Vt.taxAmount,readOnly:!0}),n.jsx("input",{ref:_e,type:"hidden"}),n.jsxs("section",{className:"commercial-order-form-section",children:[n.jsxs("div",{className:"commercial-order-section-title",children:[n.jsx("i",{className:"mdi mdi-file-document"}),n.jsx("span",{children:"Datos del pedido"})]}),n.jsxs("div",{className:"row g-2",children:[n.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:n.jsx($e,{eRef:Ee,label:"Empresa",required:!0,searchAPI:"/api/admin/businesses/paginate",searchBy:"name",dropdownParent:"#commercial-orders-form-container",onChange:Ta})}),n.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:n.jsxs(pr,{eRef:h,label:"Sede",dropdownParent:"#commercial-orders-form-container",value:W,onChange:Ea,children:[n.jsx("option",{value:"",children:"Sin sede"}),ha.map(e=>n.jsx("option",{value:e.id,children:e.name},`commercial-order-branch-${e.id}`))]})}),n.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:n.jsx($e,{eRef:F,label:"Almacen",required:!0,searchAPI:"/api/admin/warehouses/paginate",searchBy:"name",filter:Sa,dropdownParent:"#commercial-orders-form-container",onChange:Ia,templateResult:Zn,templateSelection:Zn})}),n.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[n.jsx("label",{className:"form-label",children:"Doc. venta"}),n.jsxs("select",{ref:ca,className:"form-control",value:Oe,onChange:e=>nn(vt(e.target.value)),children:[n.jsx("option",{value:"Factura",children:"Factura"}),n.jsx("option",{value:"Boleta",children:"Boleta"}),n.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),n.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[n.jsx("label",{className:"form-label",children:"Moneda"}),n.jsxs("select",{ref:Je,className:"form-control",children:[n.jsx("option",{value:"PEN",children:"PEN"}),n.jsx("option",{value:"USD",children:"USD"}),n.jsx("option",{value:"EUR",children:"EUR"})]})]}),n.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[n.jsx("label",{className:"form-label",children:"Forma de pago"}),n.jsxs("select",{ref:Ie,className:"form-control",children:[n.jsx("option",{value:"",children:"Seleccione"}),vr.map(e=>n.jsx("option",{value:e,children:e},`commercial-order-payment-${e}`))]})]})]})]}),n.jsxs("section",{className:"commercial-order-form-section",children:[n.jsxs("div",{className:"commercial-order-section-title",children:[n.jsx("i",{className:"mdi mdi-account"}),n.jsx("span",{children:"Cliente y entrega"})]}),n.jsxs("div",{className:"row g-2",children:[n.jsx("div",{className:"col-12 col-xl-6",children:n.jsx($e,{eRef:U,label:"Cliente regular",searchAPI:"/api/admin/clients/paginate",searchBy:"full_name",selectBy:"entity_id",filter:gr,dropdownParent:"#commercial-orders-form-container",onChange:Da})}),n.jsx("div",{className:"col-12 col-xl-6",children:n.jsx($e,{eRef:q,label:"Cliente eventual",searchAPI:"/api/admin/eventual-clients/paginate",searchBy:"business_name",dropdownParent:"#commercial-orders-form-container",onChange:Aa})}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Orden de compra"}),n.jsx("input",{ref:et,className:"form-control"})]}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Numero de guia"}),n.jsx("input",{ref:tt,className:"form-control"})]}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Guia remision"}),n.jsx("input",{ref:nt,className:"form-control"})]}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Ubigeo"}),n.jsx("input",{ref:ae,className:"form-control"})]}),n.jsx("div",{className:"col-12 col-xl-4",children:n.jsx(In,{eRef:z,label:"Direccion de entrega",rows:2})}),n.jsx("div",{className:"col-12",children:n.jsx(Yr,{modalRef:u,position:Ft,searchText:pa,onSearchTextChange:ut,onPositionChange:St,onAddressSelected:e=>{z.current&&(z.current.value=e)}})}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[n.jsx("label",{className:"form-label",children:"Nombre contacto entrega"}),n.jsx("input",{ref:ve,className:"form-control"})]}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[n.jsx("label",{className:"form-label",children:"Celular contacto entrega"}),n.jsx("input",{ref:ye,className:"form-control"})]}),n.jsx($e,{eRef:ne,label:"Vendedor",col:"col-12 col-md-6 col-xl-2",searchAPI:"/api/admin/users/paginate",searchBy:"fullname",dropdownParent:"#commercial-orders-form-container"}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Medico"}),n.jsx("input",{ref:ge,className:"form-control"})]})]})]}),n.jsxs("section",{className:"commercial-order-form-section",children:[n.jsxs("div",{className:"commercial-order-detail-toolbar",children:[n.jsxs("div",{className:"commercial-order-section-title mb-0",children:[n.jsx("i",{className:"mdi mdi-format-list-bulleted"}),n.jsx("span",{children:"Detalle del pedido"})]}),n.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:Xa,children:"Agregar item"})]}),n.jsx("div",{className:"table-responsive border rounded commercial-order-detail-table","data-select2-local-dropdown":"true",children:n.jsxs("table",{className:"table table-sm align-middle mb-0",children:[n.jsx("thead",{children:n.jsxs("tr",{children:[n.jsx("th",{style:{minWidth:96},children:"Descuento"}),n.jsx("th",{style:{minWidth:104},children:"Codigo"}),n.jsx("th",{style:{minWidth:88},children:"Codigo lote"}),n.jsx("th",{style:{minWidth:280},children:"Nombre"}),n.jsx("th",{style:{minWidth:128},children:"Laboratorio"}),n.jsx("th",{style:{minWidth:130},children:"Principio activo"}),n.jsx("th",{style:{minWidth:110},children:"Unidad"}),n.jsx("th",{style:{minWidth:64},children:"Stock"}),n.jsx("th",{style:{minWidth:112},children:"P. venta con IGV"}),n.jsx("th",{style:{minWidth:112},children:"P. venta sin IGV"}),n.jsx("th",{style:{minWidth:92},children:"Cantidad"}),n.jsx("th",{style:{minWidth:96},children:"Total desc."}),n.jsx("th",{style:{minWidth:96},children:"Sub total"}),n.jsx("th",{style:{width:70}})]})}),n.jsx("tbody",{children:Y.map(e=>n.jsxs("tr",{children:[n.jsx("td",{children:n.jsxs("div",{className:"commercial-order-discount-cell",children:[n.jsxs("button",{type:"button",className:"commercial-order-discount-trigger",onClick:r=>Qa(e.uid,r),children:[n.jsx("span",{children:e.discount_type==="percent"&&Number(e.discount_value||0)>0?`${Number(e.discount_value)}%`:"Seleccione"}),n.jsx("i",{className:"mdi mdi-chevron-down"})]}),(re==null?void 0:re.uid)===e.uid&&n.jsxs("div",{className:"commercial-order-discount-menu",style:{top:re.top,left:re.left,minWidth:re.width},onClick:r=>r.stopPropagation(),children:[n.jsx("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type!=="percent"?"active":""}`,onClick:()=>Nn(e.uid,""),children:"Seleccione"}),_r.map(r=>n.jsxs("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type==="percent"&&Number(e.discount_value||0)===r?"active":""}`,onClick:()=>Nn(e.uid,r),children:[r,"%"]},`commercial-order-discount-floating-${e.uid}-${r}`))]})]})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_code||"-"})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_lot||"-"})}),n.jsx("td",{className:"commercial-order-article-name",children:n.jsx($e,{eRef:un(e.uid),searchAPI:Fa,searchBy:"name",dropdownParent:"#commercial-orders-form-container",disabled:!H,onChange:r=>Ha(e.uid,r)})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_laboratory||"-"})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_principle||"-"})}),n.jsx("td",{children:n.jsxs("div",{children:[n.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_unit||"-"}),e.presentations.length>0&&n.jsxs("select",{className:"form-control mt-1","data-no-select2":"true",value:e.presentation_id,disabled:!e.article_id,onChange:r=>Bt(e.uid,"presentation_id",r.target.value),children:[n.jsx("option",{value:"",children:Ur(e)}),e.presentations.map(r=>n.jsx("option",{value:r.id,children:qr(r,e)},`commercial-order-presentation-${e.uid}-${r.id}`))]})]})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:Number(e.stock_available||0).toFixed(2)})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:e.price_unit,onFocus:qn,onChange:r=>Bt(e.uid,"price_unit",Un(r))})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:ea(Number(e.price_unit||0),Oe).subtotal.toFixed(2),readOnly:!0})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0.01",className:"form-control",value:e.quantity,onFocus:qn,onChange:r=>Bt(e.uid,"quantity",Un(r))})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.discount_amount||0).toFixed(2),readOnly:!0})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.total||0).toFixed(2),readOnly:!0})}),n.jsx("td",{className:"text-end",children:n.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>Ya(e.uid),children:n.jsx("i",{className:"mdi mdi-close"})})})]},e.uid))}),n.jsxs("tfoot",{children:[n.jsxs("tr",{children:[n.jsx("th",{colSpan:"12",className:"text-end",children:"Sub total"}),n.jsx("th",{children:Gt.toFixed(2)}),n.jsx("th",{})]}),n.jsxs("tr",{children:[n.jsx("th",{colSpan:"12",className:"text-end",children:"Descuento global"}),n.jsx("th",{children:"0.00"}),n.jsx("th",{})]}),n.jsxs("tr",{children:[n.jsx("th",{colSpan:"12",className:"text-end",children:"Total"}),n.jsx("th",{children:Vt.total.toFixed(2)}),n.jsx("th",{})]})]})]})})]}),n.jsxs("section",{className:"commercial-order-form-section mb-0",children:[n.jsxs("div",{className:"commercial-order-section-title",children:[n.jsx("i",{className:"mdi mdi-note-text"}),n.jsx("span",{children:"Observaciones"})]}),n.jsx(In,{eRef:ct,label:"Observaciones",rows:3})]})]})}),n.jsx(Ke,{modalRef:x,title:"Ingresar pedido multivende",size:"lg",btnSubmitText:"Registrar",onSubmit:Ua,children:n.jsx("div",{className:"commercial-order-multivende-form",children:n.jsxs("section",{className:"commercial-order-form-section",children:[n.jsxs("div",{className:"commercial-order-section-title",children:[n.jsx("i",{className:"mdi mdi-file-document-plus-outline"}),n.jsx("span",{children:"General"})]}),n.jsxs("div",{className:"mb-2",children:[n.jsxs("label",{className:"form-label",children:["Ingrese el ",n.jsx("strong",{children:"CHECK OUT ID"})]}),n.jsx("input",{ref:T,name:"external_checkout_id",className:"form-control",autoComplete:"off"})]})]})})}),n.jsx(Ke,{modalRef:M,title:"Mantenedor motivo retraso entrega",size:"lg",hideFooter:!0,onSubmit:e=>{e.preventDefault(),Wa()},children:n.jsxs("div",{className:"commercial-order-delay-maintainer",children:[n.jsxs("div",{className:"commercial-order-delay-actions",children:[n.jsxs("button",{type:"button",className:"btn btn-sm btn-light","data-bs-dismiss":"modal",children:[n.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]}),n.jsxs("button",{type:"submit",className:"btn btn-sm btn-outline-primary",children:[n.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]})]}),n.jsx("input",{ref:E,type:"hidden"}),n.jsxs("div",{className:"row",children:[n.jsxs("div",{className:"col-12 mb-3",children:[n.jsx("label",{className:"form-label",children:"Descripcion:"}),n.jsx("input",{ref:C,className:"form-control",autoComplete:"off"})]}),n.jsxs("div",{className:"col-12 mb-3",children:[n.jsx("label",{className:"form-label",children:"Estado:"}),n.jsxs("select",{ref:L,className:"form-control",defaultValue:"1",children:[n.jsx("option",{value:"1",children:"Activo"}),n.jsx("option",{value:"0",children:"Inactivo"})]})]})]}),n.jsx("hr",{}),n.jsxs("div",{className:"commercial-order-delay-filter",children:[n.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),n.jsx("input",{className:"form-control form-control-sm",value:It,onChange:e=>sn(e.target.value)})]}),n.jsx("div",{className:"table-responsive commercial-order-delay-table",children:n.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[n.jsx("thead",{children:n.jsxs("tr",{children:[n.jsx("th",{className:"text-center",children:"Acciones"}),n.jsx("th",{className:"text-center",children:"Estado"}),n.jsx("th",{children:"Motivo"}),n.jsx("th",{children:"Fecha registro"}),n.jsx("th",{children:"Usuario registro"})]})}),n.jsxs("tbody",{children:[Dt&&n.jsx("tr",{children:n.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"Cargando motivos..."})}),!Dt&&Ut.length===0&&n.jsx("tr",{children:n.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"No existen elementos"})}),!Dt&&Ut.map(e=>n.jsxs("tr",{children:[n.jsx("td",{className:"text-center",children:n.jsx("button",{type:"button",className:"btn btn-xs btn-outline-info",title:"Editar motivo de retraso",onClick:()=>za(e),children:n.jsx("i",{className:"mdi mdi-pencil"})})}),n.jsx("td",{className:"text-center",children:n.jsx("span",{className:ia(e.status?"billed":"cancelled"),children:e.status?"Activo":"Inactivo"})}),n.jsx("td",{children:e.description}),n.jsx("td",{children:Kn(e.created_at)}),n.jsx("td",{children:Kt(e.creator)})]},`delivery-delay-reason-${e.id}`))]})]})}),n.jsxs("div",{className:"commercial-order-delay-summary",children:[Ut.length," elementos (Pagina 1 de 1)"]})]})}),n.jsx(Ke,{modalRef:te,title:"Tracking del pedido",size:"lg",hideButtonSubmit:!0,children:n.jsx("div",{className:"table-responsive",children:n.jsxs("table",{className:"table table-sm align-middle mb-0",children:[n.jsx("thead",{children:n.jsxs("tr",{children:[n.jsx("th",{children:"Fecha"}),n.jsx("th",{children:"Estado"})]})}),n.jsxs("tbody",{children:[Cn.length===0&&n.jsx("tr",{children:n.jsx("td",{colSpan:"2",className:"text-muted text-center py-3",children:"Sin eventos registrados."})}),Cn.map((e,r)=>n.jsxs("tr",{children:[n.jsx("td",{children:new Date(e.date).toLocaleString("es-PE")}),n.jsx("td",{children:e.status})]},`commercial-order-tracking-${r}`))]})]})})}),n.jsx(Ke,{modalRef:X,title:"Evidencia de entrega",size:"lg",btnSubmitText:"Registrar",onSubmit:Ba,children:n.jsxs("div",{className:"row",children:[n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Recibido por"}),n.jsx("input",{className:"form-control",value:w.recipient_name,onChange:e=>ie("recipient_name",e.target.value)})]}),n.jsxs("div",{className:"col-md-3 mb-3",children:[n.jsx("label",{className:"form-label",children:"Tipo doc."}),n.jsxs("select",{className:"form-control",value:w.recipient_document_type,onChange:e=>ie("recipient_document_type",e.target.value),children:[n.jsx("option",{value:"DNI",children:"DNI"}),n.jsx("option",{value:"RUC",children:"RUC"}),n.jsx("option",{value:"CE",children:"CE"}),n.jsx("option",{value:"OTRO",children:"Otro"})]})]}),n.jsxs("div",{className:"col-md-3 mb-3",children:[n.jsx("label",{className:"form-label",children:"Numero"}),n.jsx("input",{className:"form-control",value:w.recipient_document_number,onChange:e=>ie("recipient_document_number",e.target.value)})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Telefono"}),n.jsx("input",{className:"form-control",value:w.recipient_phone,onChange:e=>ie("recipient_phone",e.target.value)})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Fecha y hora entrega"}),n.jsx("input",{type:"datetime-local",className:"form-control",value:w.delivered_at,onChange:e=>ie("delivered_at",e.target.value)})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Foto / evidencia"}),n.jsx("input",{ref:I,className:"form-control",type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",capture:"environment",onChange:La})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Latitud"}),n.jsx("input",{className:"form-control",value:w.latitude,onChange:e=>ie("latitude",e.target.value)})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Longitud"}),n.jsx("input",{className:"form-control",value:w.longitude,onChange:e=>ie("longitude",e.target.value)})]}),n.jsxs("div",{className:"col-12 mb-3",children:[n.jsx("label",{className:"form-label",children:"Observaciones"}),n.jsx("textarea",{className:"form-control",rows:"3",value:w.evidence_notes,onChange:e=>ie("evidence_notes",e.target.value)})]}),n.jsx("div",{className:"col-12",children:n.jsx("div",{className:"border rounded p-3",children:pe?n.jsx("img",{src:pe,alt:"Evidencia de entrega",className:"img-fluid rounded border bg-light",style:{maxHeight:360,width:"100%",objectFit:"contain"}}):w.evidence_url?n.jsx("a",{href:w.evidence_url,target:"_blank",rel:"noreferrer",children:"Abrir evidencia registrada"}):n.jsx("div",{className:"text-muted py-4 text-center",children:"Sin evidencia registrada"})})})]})})]})};ir((t,a)=>{!a.can("orders")&&!a.hasRole("Admin")&&(location.href="/admin/"),sr(t).render(n.jsx(ur,{...a,title:a.pageTitle||"Pedidos comerciales",children:n.jsx(ti,{...a})}))});
