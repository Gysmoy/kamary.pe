import{C as Mr,c as Br,j as r,r as s,S as Ue,G as Lr}from"./CreateReactScript-DQLVjp0V.js";import{L as Gr,G as qr,M as Ur}from"./esm-BhZAXbGk.js";import{B as zr}from"./Base-DpZFB5sy.js";import{T as Vr}from"./Table-7ynWM9VR.js";import{M as it}from"./Modal-CAfsOhZN.js";import{R as Wr}from"./ReactAppend-DIHzhAcr.js";import{a as Re,S as ke}from"./SetSelectValue-DfDyTYyl.js";import{S as Hr}from"./SelectFormGroup-CC2pGrXt.js";import{T as zt}from"./TextareaFormGroup-CdYAyehd.js";import{C as Kr}from"./CommercialOrdersRest-DKg4Dgc7.js";import{R as Qr}from"./ReferralGuidesRest-DPUoCWFG.js";import{o as ct,b as st}from"./magistralesRecordPdf-BLh28TRb.js";import{t as Yr,i as Jr,j as nr,k as Zr}from"./statusLabels-DafAwaKR.js";import"./BasicRest-EXKW_n5g.js";import"./tippy-react.esm-DZzWNIYv.js";import"./ubigeoInei-D0FnAslC.js";const O=new Kr,Vt=new Qr,Xr=["client_kind","=","regular"],en=[1,2,3,4,5],tn=["EFECTIVO [CONTADO]","TRANSFERENCIA [CONTADO]","YAPE [CONTADO]","PLIN [CONTADO]","TARJETA [CONTADO]","TRANSFERENCIA [CREDITO]"],be=(t,{variant:i,title:a,icon:d,onClick:f})=>{const w=$('<button type="button"></button>').addClass(`btn btn-xs btn-soft-${i} commercial-order-action-btn`).attr("title",a).attr("aria-label",a).append($("<i></i>").addClass(d)).on("click",u=>{u.preventDefault(),u.stopPropagation(),f()});t.append(w)},rn=t=>`commercial-order-status-badge commercial-order-status-${`${t??"empty"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-")||"empty"}`,Wt=(t,i,a)=>{t.addClass("commercial-order-status-cell"),Wr(t,r.jsx("span",{className:rn(i),children:a(i)}))},ze=()=>({uid:crypto.randomUUID(),article_id:"",article_label:"",article_code:"",article_lot:"",article_name:"",article_unit:"",article_laboratory:"",article_principle:"",presentations:[],presentation_id:"",presentation_units:1,stock_available:0,reserved_quantity:0,price_unit:0,quantity:1,gross_total:0,discount_type:"none",discount_value:0,discount_amount:0,total:0,price_source:"fallback",price_list_code:""}),nn=t=>{if(!t)return"";const i=(t.name??"").toString().trim().split(" ")[0]??"",a=(t.lastname??"").toString().trim().split(" ")[0]??"",d=`${i} ${a}`.trim(),f=(t.username??"").toString().trim();return d&&f?`${d} (@${f})`:d||(f?`@${f}`:"")},cn=t=>{if(!t)return"-";const i=(t.fullname??"").toString().trim();return i||`${t.name??""} ${t.lastname??""}`.trim()||(t.username??"").toString().trim()||"-"},sn=t=>t&&((t.username??"").toString().trim()||(t.fullname??"").toString().trim()||`${t.name??""} ${t.lastname??""}`.trim())||"-",Ve=t=>Number(Number(t||0).toFixed(2)),on=t=>$("<div>").text(t??"").html(),Se=t=>{const i=Number(Number(t||0).toFixed(3));return Number.isInteger(i)?`${i}`:`${i}`.replace(/\.?0+$/,"")},wt=t=>(t==null?void 0:t.price_source)==="manual",Ht=(t,i,a=!1)=>{const d=Number((t==null?void 0:t.price_unit)||0),f=Number(i==null?void 0:i.price_unit);return!a&&wt(t)||!Number.isFinite(f)||!a&&f<=0&&d>0?d:f},Kt=(t,i,a=!1)=>!a&&wt(t)?"manual":(i==null?void 0:i.source)||(t==null?void 0:t.price_source)||"fallback",an=t=>{const i=`${t??""}`.replace(",",".").replace(/[^\d.]/g,"");if(!i)return"";const[a,...d]=i.split("."),f=a.replace(/^0+(?=\d)/,"")||(a||d.length?"0":""),w=d.length?`.${d.join("")}`:"";return`${f}${w}`},Qt=t=>{const i=an(t.target.value);return t.target.value!==i&&(t.target.value=i),Number(i||0)},Yt=t=>{Number(t.target.value||0)===0&&t.target.select()},ln=(t,i,a)=>{const d=Ve(t),f=Number(a||0);return!Number.isFinite(f)||f<=0||d<=0?0:i==="percent"?Math.min(d,Ve(d*Math.min(f,100)/100)):i==="amount"?Math.min(d,Ve(f)):0},he=t=>{const i=Number(t.quantity||0),a=Number(t.price_unit||0),d=Number.isFinite(i*a)?Ve(i*a):0,f=ln(d,t.discount_type,t.discount_value);return{...t,discount_type:t.discount_type||"none",discount_value:t.discount_type==="none"?0:Number(t.discount_value||0),gross_total:d,discount_amount:f,total:Ve(Math.max(0,d-f))}},at=t=>{const i=`${t??""}`.trim().toLowerCase();return i==="boleta"?"Boleta":["nota de pedido","nota_pedido","note_order"].includes(i)?"Nota de pedido":"Factura"},dn=t=>(t==null?void 0:t.billing_documents)??(t==null?void 0:t.billingDocuments)??[],ir=t=>dn(t)[0]??null,un=t=>{const i=ir(t);return(i==null?void 0:i.code)||[i==null?void 0:i.series,i==null?void 0:i.sequence].filter(Boolean).join("-")||(t==null?void 0:t.referral_guide)||(t==null?void 0:t.guide_number)||(t==null?void 0:t.purchase_order)||"-"},mn=t=>{var i;return at(((i=ir(t))==null?void 0:i.document_type)??(t==null?void 0:t.document_type))},pn=t=>{const i=(t==null?void 0:t.client)??(t==null?void 0:t.eventual_client)??(t==null?void 0:t.eventualClient)??null,a=`${(i==null?void 0:i.document_number)??""}`.trim(),d=`${(i==null?void 0:i.full_name)??(i==null?void 0:i.business_name)??""}`.trim();return[a,d].filter(Boolean).join(" | ")||"-"},fn=t=>{const i=`${(t==null?void 0:t.payment_method)??""}`.trim(),a=`${(t==null?void 0:t.payment_condition)??""}`.trim();return!i&&!a?"-":!a||i.includes("[")?i||"-":`${i||"-"} [${a.toUpperCase()}]`},C=(t,i="")=>{if(t==null)return i;if(typeof t=="object")return t.address??t.reference??t.name??t.description??i;const a=`${t}`;return a==="[object Object]"?i:a},bn=t=>`${t??""}`.toUpperCase().includes("CREDITO")?"Credito":"Contado",hn=t=>{const i=`${t??""}`.trim();return i?i.toUpperCase()==="TRANSFERENCIA"?"TRANSFERENCIA [CONTADO]":i:"EFECTIVO [CONTADO]"},_n=t=>C(t==null?void 0:t.full_address,C(t==null?void 0:t.address,C(t==null?void 0:t.fiscal_address))),gn=t=>C(t==null?void 0:t.ubigeo,C(t==null?void 0:t.district_ubigeo,C(t==null?void 0:t.inei_ubigeo))),Jt=t=>{const i=`${t??""}`.trim(),a=i.match(/^(client|eventual)-(\d+)$/);return a?a[2]:i},Zt=t=>{var u,_,I;if(t.loading)return t.text;const i=t.data??{},a=t.text||i.name||"",d=(u=i.branch)==null?void 0:u.name,f=(I=(_=i.branch)==null?void 0:_.business)==null?void 0:I.name,w=$("<span>").text(a);return d&&w.append($("<small>").addClass("text-muted ms-1").text(`- ${d}`)),f&&w.append($("<small>").addClass("text-muted ms-1").text(`(${f})`)),w},Q=t=>{if(!(t!=null&&t.current))return;const i=$(t.current);i.empty().val(null),i.trigger(i.data("select2")?"change.select2":"change")},xn=t=>t.article_id?"Unidad base":"Sin presentacion",vn=(t,i)=>{const a=(t==null?void 0:t.name)||"Presentacion",d=Se((t==null?void 0:t.units)||1),f=i!=null&&i.article_unit?` ${i.article_unit}`:" unidad(es) base";return`${a} (${d}${f})`},yn=t=>["Factura","Boleta"].includes(at(t)),Xt=(t,i)=>{const a=Number(t||0);if(!yn(i))return{subtotal:Number(a.toFixed(2)),taxAmount:0,total:Number(a.toFixed(2))};const d=Number((a/1.18).toFixed(2));return{subtotal:d,taxAmount:Number((a-d).toFixed(2)),total:Number(a.toFixed(2))}},jn=(t,i="")=>{const a=new Map;return(t??[]).flatMap(d=>{if(!(d!=null&&d.article_id))return[];const f=`${d.article_id}:${d.warehouse_id||i||""}`,w=Number(d.quantity||0),u=Number(d.presentation_units||1)||1,_=Number((w*u).toFixed(3)),I=Number(d.stock_available||0),E=Number(a.get(f)||0),F=Math.max(0,I-E),S=Math.min(_,F),W=Math.max(0,_-S);return a.set(f,E+S),W<=1e-4?[]:[{article:d.article_name||d.article_label||d.article_code||"Articulo",quantity:_,lineQuantity:w,presentationUnits:u,available:F,shortage:W}]})},Nt=t=>(t==null?void 0:t.referral_guides)??(t==null?void 0:t.referralGuides)??[],cr=t=>(t==null?void 0:t.external_reference)||[t==null?void 0:t.series,t==null?void 0:t.sequence].filter(Boolean).join("-")||(t==null?void 0:t.code)||"-",Nn=t=>t&&!["accepted","cancelled"].includes(t.guide_status),wn=t=>(t==null?void 0:t.delivery_evidences)??(t==null?void 0:t.deliveryEvidences)??[],er=t=>wn(t)[0]??null,Cn=t=>(t==null?void 0:t.tracking_events)??(t==null?void 0:t.trackingEvents)??[],tr=t=>{const i=`${t??""}`.trim();return i.startsWith("blob:")||i.startsWith("data:image/")||/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(i)||i.includes("/delivery-evidence-media/")},rr=()=>{const t=new Date;return t.setMinutes(t.getMinutes()-t.getTimezoneOffset()),t.toISOString().slice(0,16)},ot={lat:-12.046374,lng:-77.042793},Y=t=>{const i=Number(t);return Number.isFinite(i)?i:null},lt=t=>{const i=Y(t);return i===null?"":i.toFixed(7)},J=t=>Y(t==null?void 0:t.lat)!==null&&Y(t==null?void 0:t.lng)!==null,$n=({modalRef:t,position:i,searchText:a,onPositionChange:d,onSearchTextChange:f,onAddressSelected:w,googleMapsApiKey:u})=>{const _=s.useRef(),[I,E]=s.useState(!1),[F,S]=s.useState(""),[W,oe]=s.useState([]),M=J(i)?{lat:Y(i.lat),lng:Y(i.lng)}:ot,A=(p,R=17)=>{const de=Y(p==null?void 0:p.lat),L=Y(p==null?void 0:p.lng);de===null||L===null||!_.current||(_.current.setCenter({lat:de,lng:L}),_.current.setZoom(R))},ae=p=>{d(p),A(p)};s.useEffect(()=>{if(J(i)){A(M);return}A(ot,13)},[i==null?void 0:i.lat,i==null?void 0:i.lng]),s.useEffect(()=>{const p=t==null?void 0:t.current;if(!p)return;const R=()=>{setTimeout(()=>{J(i)?A(M):A(ot,13)},180)};return $(p).on("shown.bs.modal",R),()=>$(p).off("shown.bs.modal",R)},[t,i==null?void 0:i.lat,i==null?void 0:i.lng]);const le=async()=>{var R,de;const p=`${a??""}`.trim();if(!p){oe([]),S("Escribe una direccion para buscar.");return}if(!((de=(R=window.google)==null?void 0:R.maps)!=null&&de.Geocoder)){S("Google Maps aun no termino de cargar.");return}E(!0),S("");try{new window.google.maps.Geocoder().geocode({address:`${p}, Peru`,componentRestrictions:{country:"PE"},region:"PE"},(Z,ue)=>{if(E(!1),ue!=="OK"||!Array.isArray(Z)||Z.length===0){oe([]),S("Sin resultados. Puedes marcar el punto manualmente en el mapa.");return}oe(Z.slice(0,5).map(H=>({place_id:H.place_id,display_name:H.formatted_address,lat:H.geometry.location.lat(),lng:H.geometry.location.lng()})))})}catch(L){E(!1),S(`${L.message}. Puedes marcar el punto manualmente en el mapa.`),oe([])}},_e=p=>{const R={lat:Y(p.lat),lng:Y(p.lng)};d(R),f(p.display_name??""),w(p.display_name??""),A(R),oe([])};return r.jsxs("div",{className:"commercial-order-map-picker",children:[r.jsxs("div",{className:"commercial-order-map-search",children:[r.jsxs("div",{children:[r.jsx("label",{className:"form-label",children:"Buscar direccion en mapa"}),r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:"text",className:"form-control",value:a,onChange:p=>f(p.target.value),onKeyDown:p=>{p.key==="Enter"&&(p.preventDefault(),le())},placeholder:"Ej. Av. Javier Prado 123, San Isidro"}),r.jsx("button",{type:"button",className:"btn btn-outline-primary",onClick:le,disabled:I,children:I?"Buscando...":"Buscar"})]})]}),r.jsxs("div",{className:"commercial-order-map-coordinates",children:[r.jsx("label",{className:"form-label",children:"Coordenadas"}),r.jsxs("div",{className:"commercial-order-map-coordinate-values",children:[r.jsx("span",{children:lt(i==null?void 0:i.lat)||"-"}),r.jsx("span",{children:lt(i==null?void 0:i.lng)||"-"})]})]})]}),W.length>0&&r.jsx("div",{className:"commercial-order-map-results",children:W.map(p=>r.jsx("button",{type:"button",className:"commercial-order-map-result",onClick:()=>_e(p),children:p.display_name},`${p.place_id}-${p.lat}-${p.lng}`))}),F&&r.jsx("small",{className:"text-muted d-block mt-1",children:F}),r.jsx(Gr,{googleMapsApiKey:u,language:"es",region:"PE",onError:()=>S("No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio."),children:r.jsx(qr,{mapContainerClassName:"commercial-order-map-canvas",center:M,zoom:J(i)?17:13,options:{clickableIcons:!0,fullscreenControl:!0,gestureHandling:"greedy",mapTypeControl:!0,scrollwheel:!0,streetViewControl:!1},onLoad:p=>{_.current=p,setTimeout(()=>{J(i)?A(M):A(ot,13)},120)},onClick:p=>{const R={lat:p.latLng.lat(),lng:p.latLng.lng()};ae(R)},children:J(i)&&r.jsx(Ur,{position:M,draggable:!0,onDragEnd:p=>ae({lat:p.latLng.lat(),lng:p.latLng.lng()})})})}),r.jsx("small",{className:"text-muted d-block mt-2",children:"Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega."})]})},Rn=t=>{const i=`${Lr.GMAPS_API_KEY??""}`.trim();return i?r.jsx($n,{...t,googleMapsApiKey:i}):r.jsx("div",{className:"commercial-order-map-picker",children:r.jsx("div",{className:"commercial-order-map-empty",children:"Configura Google Maps API Key en Sistemas > Datos generales > Integraciones para habilitar el mapa."})})},kn=t=>!t||t.status===null||`${t.order_status??""}`=="cancelled"?!1:`${t.dispatch_status??"pending"}`=="pending",Sn=t=>{if(!t)return[];const i=Cn(t).map(u=>({date:u.happened_at??u.created_at,status:[u.title,u.description].filter(Boolean).join(" - ")})),a=[{date:t.created_at,status:"La orden ingreso en el sistema"}];t.approved_at&&["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)?a.push({date:t.approved_at,status:"La orden paso a preparacion"}):t.approved_at&&t.order_status==="confirmed"?a.push({date:t.approved_at,status:"La orden fue confirmada"}):["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)&&a.push({date:t.updated_at,status:"La orden paso a preparacion"});const d=(t.dispatch_assignments??t.dispatchAssignments??[]).filter(u=>(u==null?void 0:u.status)!==!1&&(u==null?void 0:u.status)!==0&&(u==null?void 0:u.dispatch)).sort((u,_)=>{var I,E,F,S;return new Date(((I=u==null?void 0:u.dispatch)==null?void 0:I.departed_at)||((E=u==null?void 0:u.dispatch)==null?void 0:E.scheduled_date)||0)-new Date(((F=_==null?void 0:_.dispatch)==null?void 0:F.departed_at)||((S=_==null?void 0:_.dispatch)==null?void 0:S.scheduled_date)||0)}),f=d.find(u=>{var _;return["in_route","delivered","closed"].includes((_=u==null?void 0:u.dispatch)==null?void 0:_.dispatch_status)});f?(a.push({date:f.dispatch.departed_at??f.dispatch.updated_at??f.dispatch.created_at,status:`Manifiesto ${f.dispatch.manifest_code||f.dispatch.code||""}`.trim()}),a.push({date:f.dispatch.departed_at??f.dispatch.updated_at??f.dispatch.created_at,status:"El pedido salio en ruta"})):t.dispatch_status==="in_route"&&a.push({date:t.updated_at,status:"El pedido salio en ruta"}),(t.dispatch_status==="dispatched"||d.some(u=>{var _;return((_=u==null?void 0:u.dispatch)==null?void 0:_.dispatch_status)==="dispatched"}))&&a.push({date:t.updated_at,status:"El pedido paso a despacho"}),Nt(t).forEach(u=>{a.push({date:u.issue_date??u.created_at??t.updated_at,status:`Guia de remision ${cr(u)} - ${nr(u.guide_status)}`})});const w=d.find(u=>{var _;return["delivered","closed"].includes((_=u==null?void 0:u.dispatch)==null?void 0:_.dispatch_status)});return w?a.push({date:w.dispatch.delivered_at??w.dispatch.updated_at??w.dispatch.created_at,status:"El pedido fue entregado"}):t.dispatch_status==="delivered"&&a.push({date:t.updated_at,status:"El pedido fue entregado"}),(t.order_status==="cancelled"||t.dispatch_status==="cancelled")&&a.push({date:t.updated_at,status:"El pedido fue cancelado"}),[...i,...a].filter(u=>u.date).sort((u,_)=>new Date(u.date)-new Date(_.date))},En=({requiredPermission:t="orders",externalSource:i=null,pageTitle:a="Pedidos comerciales"})=>{O.externalSource=i||null;const d=s.useRef(),f=s.useRef(),w=s.useRef(),u=s.useRef(),_=s.useRef(),I=s.useRef(),E=s.useRef(),F=s.useRef(),S=s.useRef(),W=s.useRef(),oe=s.useRef(),M=s.useRef(),A=s.useRef(),ae=s.useRef(),le=s.useRef(),_e=s.useRef(),p=s.useRef(),R=s.useRef(),de=s.useRef(),L=s.useRef(),Z=s.useRef(),ue=s.useRef(),H=s.useRef(),We=s.useRef(),He=s.useRef(),Ke=s.useRef(),Qe=s.useRef(),Ye=s.useRef(),Je=s.useRef(),Ze=s.useRef(),sr=s.useRef(),G=s.useRef(),ge=s.useRef(),X=s.useRef(),xe=s.useRef(),ve=s.useRef(),Xe=s.useRef(),dt=s.useRef({}),[or,ar]=s.useState(!1),[ye,Ct]=s.useState(""),[q,et]=s.useState(""),[U,tt]=s.useState(""),[je,ut]=s.useState(""),[Ne,mt]=s.useState(""),[z,Ee]=s.useState(""),[lr,me]=s.useState(""),[pt,ft]=s.useState({lat:"",lng:""}),[dr,rt]=s.useState(""),[ur,$t]=s.useState([]),[Ie,nt]=s.useState([]),[In,we]=s.useState([]),[K,V]=s.useState([ze()]),[De,Rt]=s.useState("Factura"),[ee,bt]=s.useState(null),[kt,mr]=s.useState(null),[Ce,pr]=s.useState(null),[St,ht]=s.useState(null),[pe,_t]=s.useState(""),[N,gt]=s.useState({recipient_name:"",recipient_document_type:"DNI",recipient_document_number:"",recipient_phone:"",delivered_at:rr(),evidence_notes:"",evidence_url:"",latitude:"",longitude:""}),fr=s.useMemo(()=>{var n;const e=new URLSearchParams;return ye&&e.append("business_id",ye),q&&e.append("business_branch_id",q),U&&e.append("warehouse_id",U),je&&e.append("client_id",je),Ne&&e.append("eventual_client_id",Ne),z&&e.append("client_distribution_network_id",z),(n=p.current)!=null&&n.value&&e.append("issue_date",p.current.value),`/api/admin/commercial-orders/articles?${e.toString()}`},[ye,q,U,je,Ne,z]),br=s.useMemo(()=>q?["business_branch_id","=",Number(q)]:null,[q]);s.useEffect(()=>()=>{pe!=null&&pe.startsWith("blob:")&&URL.revokeObjectURL(pe)},[pe]),s.useEffect(()=>{if(!ee)return;const e=()=>bt(null),n=c=>{c.key==="Escape"&&e()};return document.addEventListener("click",e),document.addEventListener("keydown",n),window.addEventListener("resize",e),window.addEventListener("scroll",e,!0),()=>{document.removeEventListener("click",e),document.removeEventListener("keydown",n),window.removeEventListener("resize",e),window.removeEventListener("scroll",e,!0)}},[ee]);const Et=e=>(dt.current[e]||(dt.current[e]=s.createRef()),dt.current[e]);s.useEffect(()=>{K.forEach(e=>{const n=Et(e.uid);!n.current||!e.article_id||!e.article_label||`${$(n.current).val()}`==`${e.article_id}`||Re(n.current,e.article_id,e.article_label)})},[K]);const It=async(e,n=null)=>{if(!e){$t([]),et("");return}const m=(await O.getBranchesByBusiness(e)??[]).filter(l=>l.status!==null);if($t(m),n&&m.some(l=>`${l.id}`==`${n}`)){et(`${n}`);return}et("")},Dt=e=>{if(!e)return;const n=_n(e),c=gn(e);n&&G.current&&(G.current.value=n),c&&X.current&&(X.current.value=c),n&&rt(n)},Tt=async(e,n=null,c=null)=>{var v;if(!e){nt([]),Ee(""),we([]),me("");return}const l=(await O.getDistributionNetworks(e)??[]).filter(h=>h.status!==null);nt(l);const o=n||((v=l.find(h=>h.is_default))==null?void 0:v.id);if(o&&l.some(h=>`${h.id}`==`${o}`)){Ee(`${o}`),await Ft(o,null,l);return}Ee(""),we([]),me(""),Dt(c)},Ft=async(e,n=null,c=null)=>{var h,j;if(!e){we([]),me("");return}let m=[];const l=(c??Ie).find(g=>`${g.id}`==`${e}`);(((h=l==null?void 0:l.addresses)==null?void 0:h.length)??0)>0?m=l.addresses:m=await O.getDeliveryAddresses(e);const o=(m??[]).filter(g=>g.status!==null);we(o);const v=n||((j=o.find(g=>g.is_default))==null?void 0:j.id);if(v&&o.some(g=>`${g.id}`==`${v}`)){me(`${v}`),hr(o.find(g=>`${g.id}`==`${v}`));return}me("")},hr=e=>{e&&(G.current&&(G.current.value=C(e.address)),ge.current&&(ge.current.value=C(e.reference)),X.current&&(X.current.value=C(e.ubigeo)),xe.current&&(xe.current.value=C(e.contact_name)),ve.current&&(ve.current.value=C(e.contact_phone)),rt(C(e.address)),J({lat:e.latitude,lng:e.longitude})&&ft({lat:Number(e.latitude),lng:Number(e.longitude)}))},At=async(e,n={})=>{var o,v,h;const c=n.article_id??e.article_id,m=Number(n.quantity??e.quantity??0),l=n.presentation_id??e.presentation_id;return!c||!U||m<=0?null:await O.resolvePrice({article_id:c,presentation_id:l||null,quantity:m,business_id:ye||null,business_branch_id:q||null,warehouse_id:U||null,client_id:je||null,eventual_client_id:Ne||null,client_distribution_network_id:z||null,issue_date:((o=p.current)==null?void 0:o.value)||null,commercial_channel:((v=Ie.find(j=>`${j.id}`==`${z}`))==null?void 0:v.commercial_channel)||null,segment:((h=Ie.find(j=>`${j.id}`==`${z}`))==null?void 0:h.segment)||null})},xt=async(e=null)=>{const n=e??K;for(const c of n){if(!c.article_id)continue;const m=await At(c);m&&V(l=>l.map(o=>o.uid!==c.uid?o:he({...o,stock_available:Number(m.stock_available||0),price_unit:Ht(o,m),price_source:Kt(o,m),price_list_code:m.price_list_code||""})))}},Pt=e=>{e==="regular"?(mt(""),Q(ae)):e==="eventual"&&(ut(""),nt([]),Ee(""),we([]),me(""),Q(A))},Ot=async(e=null)=>{var h,j,g,B;ar(!!(e!=null&&e.id)),F.current&&(F.current.value=(e==null?void 0:e.id)??""),S.current&&(S.current.value=(e==null?void 0:e.code)??"Se genera al guardar"),p.current&&(p.current.value=e!=null&&e.issue_date?e.issue_date.toString().slice(0,10):new Date().toISOString().slice(0,10)),R.current&&(R.current.value=e!=null&&e.promised_delivery_at?e.promised_delivery_at.toString().slice(0,10):""),Rt(at((e==null?void 0:e.document_type)??"Factura")),L.current&&(L.current.value=(e==null?void 0:e.currency)??"PEN"),Z.current&&(Z.current.value=(e==null?void 0:e.payment_condition)??"Contado"),ue.current&&(ue.current.value=hn(e==null?void 0:e.payment_method)),Ke.current&&(Ke.current.value=(e==null?void 0:e.installments)??1),Qe.current&&(Qe.current.value=e!=null&&e.first_due_date?e.first_due_date.toString().slice(0,10):""),Ye.current&&(Ye.current.value=(e==null?void 0:e.order_status)??(e!=null&&e.external_source?"pending":"draft")),Je.current&&(Je.current.value=(e==null?void 0:e.dispatch_status)??"pending"),Ze.current&&(Ze.current.value=(e==null?void 0:e.billing_status)??"pending"),G.current&&(G.current.value=C(e==null?void 0:e.delivery_address)),ge.current&&(ge.current.value=C(e==null?void 0:e.delivery_reference)),X.current&&(X.current.value=C(e==null?void 0:e.ubigeo)),xe.current&&(xe.current.value=C(e==null?void 0:e.dispatch_contact_name)),ve.current&&(ve.current.value=C(e==null?void 0:e.dispatch_contact_phone)),H.current&&(H.current.value=(e==null?void 0:e.purchase_order)??""),We.current&&(We.current.value=(e==null?void 0:e.guide_number)??""),He.current&&(He.current.value=(e==null?void 0:e.referral_guide)??""),_e.current&&(_e.current.value=(e==null?void 0:e.doctor_name)??""),Xe.current&&(Xe.current.value=(e==null?void 0:e.observations)??""),ft({lat:J({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lat):"",lng:J({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lng):""}),rt(C(e==null?void 0:e.delivery_address));const n=e!=null&&e.business_id?`${e.business_id}`:"",c=e!=null&&e.warehouse_id?`${e.warehouse_id}`:"",m=e!=null&&e.client_id?`${e.client_id}`:"",l=e!=null&&e.eventual_client_id?`${e.eventual_client_id}`:"";Ct(n),tt(c),ut(m),mt(l),n&&((h=e==null?void 0:e.business)!=null&&h.name)?Re(W.current,n,e.business.name):Q(W),c&&((j=e==null?void 0:e.warehouse)!=null&&j.name)?Re(M.current,c,e.warehouse.name):Q(M),m&&((g=e==null?void 0:e.client)!=null&&g.full_name)?Re(A.current,m,`${e.client.document_number??""} - ${e.client.full_name}`.trim()):Q(A),l&&((B=e==null?void 0:e.eventual_client)!=null&&B.business_name)?Re(ae.current,l,`${e.eventual_client.document_number??""} - ${e.eventual_client.business_name}`.trim()):Q(ae),e!=null&&e.seller_id&&(e!=null&&e.seller)?Re(le.current,e.seller_id,nn(e.seller)):Q(le);const o=((e==null?void 0:e.items)??[]).map(y=>{var ne,ie,ce,se,x,k,Te,Fe,Ae,Pe,Oe,Me,Be,Le,Ge,qe;const b=y.article??null,re=((b==null?void 0:b.presentations)??[]).filter(D=>(D==null?void 0:D.status)!==!1&&(D==null?void 0:D.status)!==0),P=y.presentation??re[0]??null,fe=Number(y.presentation_units??(P==null?void 0:P.units)??1)||1;return he({uid:crypto.randomUUID(),article_id:y.article_id?`${y.article_id}`:"",article_label:b?`${b.code??""} - ${b.name??""}`.trim():"",article_code:(b==null?void 0:b.code)??y.external_sku??"",article_lot:(b==null?void 0:b.default_lot)??"",article_name:(b==null?void 0:b.name)??"",article_unit:((ne=b==null?void 0:b.unit)==null?void 0:ne.symbol)??((ie=b==null?void 0:b.unit)==null?void 0:ie.name)??"",article_laboratory:((ce=b==null?void 0:b.laboratory)==null?void 0:ce.name)??"",article_principle:((se=b==null?void 0:b.activePrinciple)==null?void 0:se.name)??((x=b==null?void 0:b.active_principle)==null?void 0:x.name)??"",presentations:re.map(D=>({id:`${D.id}`,name:D.name??"Presentacion",units:Number(D.units||1),price:Number(D.price||0)})),presentation_id:P!=null&&P.id?`${P.id}`:"",presentation_units:fe,stock_available:Number(y.stock_available||0),reserved_quantity:Number(y.reserved_quantity||0),price_unit:Number(y.price_unit||0),quantity:Number(y.quantity||1),discount_type:((Te=(k=y.external_payload)==null?void 0:k.commercial_form)==null?void 0:Te.discount_type)??"none",discount_value:Number(((Ae=(Fe=y.external_payload)==null?void 0:Fe.commercial_form)==null?void 0:Ae.discount_value)||0),discount_amount:Number(((Oe=(Pe=y.external_payload)==null?void 0:Pe.commercial_form)==null?void 0:Oe.discount_amount)||0),gross_total:Number(((Be=(Me=y.external_payload)==null?void 0:Me.commercial_form)==null?void 0:Be.gross_total)||0),total:Number(y.total||0),price_source:y.price_source||"fallback",price_list_code:((Ge=(Le=y==null?void 0:y.price_list_item)==null?void 0:Le.price_list)==null?void 0:Ge.code)||((qe=e==null?void 0:e.price_list)==null?void 0:qe.code)||""})}),v=o.length?o:[ze()];V(v),$(f.current).modal("show"),await It((e==null?void 0:e.business_id)??null,(e==null?void 0:e.business_branch_id)??null),m?(await Tt(m,(e==null?void 0:e.client_distribution_network_id)??null),e!=null&&e.client_distribution_network_id&&await Ft(e.client_distribution_network_id,(e==null?void 0:e.client_delivery_address_id)??null)):(nt([]),Ee(""),we([]),me(""))},_r=async e=>{var l,o,v,h,j,g,B,y,b,re,P,fe,ne,ie,ce,se,x,k,Te,Fe,Ae,Pe,Oe,Me,Be,Le,Ge,qe,D,Lt,Gt,qt,Ut;e.preventDefault();const n={id:((l=F.current)==null?void 0:l.value)||void 0,external_source:i||void 0,business_id:ye||null,business_branch_id:q||null,warehouse_id:U||null,client_id:je||null,eventual_client_id:Ne||null,seller_id:((o=le.current)==null?void 0:o.value)||null,client_distribution_network_id:z||null,client_delivery_address_id:lr||null,document_type:De,currency:((v=L.current)==null?void 0:v.value)||"PEN",payment_condition:bn(((h=ue.current)==null?void 0:h.value)||((j=Z.current)==null?void 0:j.value)||"Contado"),payment_method:((g=ue.current)==null?void 0:g.value)||"",purchase_order:((y=(B=H.current)==null?void 0:B.value)==null?void 0:y.trim())||"",guide_number:((re=(b=We.current)==null?void 0:b.value)==null?void 0:re.trim())||"",referral_guide:((fe=(P=He.current)==null?void 0:P.value)==null?void 0:fe.trim())||"",doctor_name:((ie=(ne=_e.current)==null?void 0:ne.value)==null?void 0:ie.trim())||"",issue_date:((ce=p.current)==null?void 0:ce.value)||"",promised_delivery_at:((se=R.current)==null?void 0:se.value)||null,installments:((x=Ke.current)==null?void 0:x.value)||1,first_due_date:((k=Qe.current)==null?void 0:k.value)||null,order_status:((Te=Ye.current)==null?void 0:Te.value)||(i?"pending":"draft"),dispatch_status:((Fe=Je.current)==null?void 0:Fe.value)||"pending",billing_status:((Ae=Ze.current)==null?void 0:Ae.value)||"pending",tax_amount:jt.taxAmount,delivery_address:((Oe=(Pe=G.current)==null?void 0:Pe.value)==null?void 0:Oe.trim())||"",delivery_reference:((Be=(Me=ge.current)==null?void 0:Me.value)==null?void 0:Be.trim())||"",ubigeo:((Ge=(Le=X.current)==null?void 0:Le.value)==null?void 0:Ge.trim())||"",map_lat:lt(pt.lat)||null,map_lng:lt(pt.lng)||null,dispatch_contact_name:((D=(qe=xe.current)==null?void 0:qe.value)==null?void 0:D.trim())||"",dispatch_contact_phone:((Gt=(Lt=ve.current)==null?void 0:Lt.value)==null?void 0:Gt.trim())||"",observations:((Ut=(qt=Xe.current)==null?void 0:qt.value)==null?void 0:Ut.trim())||"",items:K.map(T=>({article_id:T.article_id||null,presentation_id:T.presentation_id||null,warehouse_id:U||null,stock_available:T.stock_available,reserved_quantity:T.reserved_quantity,presentation_units:T.presentation_units,price_unit:T.price_unit,quantity:T.quantity,gross_total:T.gross_total,discount_type:T.discount_type,discount_value:T.discount_value,discount_amount:T.discount_amount,total:T.total,status:!0}))},c=jn(K,U);if(c.length>0){const T=`
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${c.map($e=>`<li><strong>${on($e.article)}</strong>: faltan ${Se($e.shortage)} unidad(es) base para completar ${Se($e.quantity)}. Cantidad: ${Se($e.lineQuantity)} x ${Se($e.presentationUnits)}. Disponible: ${Se($e.available)}.</li>`).join("")}
          </ul>
        </div>
      `,{isConfirmed:Or}=await Ue.fire({title:"Stock insuficiente",html:T,icon:"warning",showCancelButton:!0,confirmButtonText:"Crear de todas formas",cancelButtonText:"Revisar pedido"});if(!Or)return;n.allow_stock_shortage=!0}await O.save(n)&&($(d.current).dxDataGrid("instance").refresh(),$(f.current).modal("hide"))},gr=async e=>{const n=e.target.value||"";Ct(n),tt(""),Q(M),await It(n,null)},xr=e=>{const n=e.target.value||"";et(n),tt(""),Q(M)},vr=async e=>{const n=e.target.value||"";tt(n),await xt()},yr=async e=>{var m,l;const n=Jt(e.target.value),c=((l=(m=$(e.target).select2("data"))==null?void 0:m[0])==null?void 0:l.data)??null;ut(n),Pt("regular"),Dt(c),await Tt(n,null,c),await xt()},jr=async e=>{const n=Jt(e.target.value);mt(n),Pt("eventual"),await xt()},Nr=async({id:e,field:n,value:c})=>{await O.boolean({id:e,field:n,value:c})&&$(d.current).dxDataGrid("instance").refresh()},wr=e=>{mr(e),$(_.current).modal("show")},Cr=e=>{const n=er(e);pr(e),ht(null),_t(tr(n==null?void 0:n.evidence_url)?n.evidence_url:""),gt({recipient_name:(n==null?void 0:n.recipient_name)??(e==null?void 0:e.dispatch_contact_name)??"",recipient_document_type:(n==null?void 0:n.recipient_document_type)??"DNI",recipient_document_number:(n==null?void 0:n.recipient_document_number)??"",recipient_phone:(n==null?void 0:n.recipient_phone)??(e==null?void 0:e.dispatch_contact_phone)??"",delivered_at:n!=null&&n.delivered_at?`${n.delivered_at}`.replace(" ","T").slice(0,16):rr(),evidence_notes:(n==null?void 0:n.evidence_notes)??"",evidence_url:(n==null?void 0:n.evidence_url)??"",latitude:(n==null?void 0:n.latitude)??"",longitude:(n==null?void 0:n.longitude)??""}),navigator.geolocation&&navigator.geolocation.getCurrentPosition(c=>{gt(m=>({...m,latitude:m.latitude||c.coords.latitude,longitude:m.longitude||c.coords.longitude}))},()=>{},{enableHighAccuracy:!0,timeout:5e3}),setTimeout(()=>{E.current&&(E.current.value="")},0),$(I.current).modal("show")},$r=e=>{var c;const n=((c=e.target.files)==null?void 0:c[0])??null;ht(n),_t(n?URL.createObjectURL(n):tr(N.evidence_url)?N.evidence_url:"")},te=(e,n)=>gt(c=>({...c,[e]:n})),Rr=async e=>{if(e.preventDefault(),!(Ce!=null&&Ce.id))return;const n=(Ce.dispatch_assignments??Ce.dispatchAssignments??[]).filter(l=>(l==null?void 0:l.status)!==!1&&(l==null?void 0:l.status)!==0&&(l==null?void 0:l.dispatch)).sort((l,o)=>{var v,h;return new Date(((v=o==null?void 0:o.dispatch)==null?void 0:v.scheduled_date)||(o==null?void 0:o.created_at)||0)-new Date(((h=l==null?void 0:l.dispatch)==null?void 0:h.scheduled_date)||(l==null?void 0:l.created_at)||0)})[0],c=new FormData;n!=null&&n.dispatch_id&&c.append("dispatch_id",n.dispatch_id),c.append("recipient_name",N.recipient_name??""),c.append("recipient_document_type",N.recipient_document_type??"DNI"),c.append("recipient_document_number",N.recipient_document_number??""),c.append("recipient_phone",N.recipient_phone??""),c.append("delivered_at",N.delivered_at??""),c.append("evidence_notes",N.evidence_notes??""),c.append("evidence_url",N.evidence_url??""),c.append("latitude",N.latitude??""),c.append("longitude",N.longitude??""),St&&c.append("evidence_file",St),await O.saveDeliveryEvidence(Ce.id,c)&&(ht(null),_t(""),E.current&&(E.current.value=""),$(I.current).modal("hide"),$(d.current).dxDataGrid("instance").refresh())},kr=async e=>{const n=Nt(e)[0];if(n){if(Nn(n)){const m=await Ue.fire({title:"Guia de remision",text:`La guia ${cr(n)} esta ${nr(n.guide_status).toLowerCase()}.`,icon:"question",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Ver PDF",cancelButtonText:"Cancelar"});if(m.isConfirmed){const l=await Vt.issue(n.id);if(!(l!=null&&l.data))return;$(d.current).dxDataGrid("instance").refresh(),await ct(st.referralGuide(l.data));return}if(!m.isDenied)return}await ct(st.referralGuide(n));return}const c=await Vt.prepareFromCommercialOrder(e.id);c!=null&&c.data&&($(d.current).dxDataGrid("instance").refresh(),await ct(st.referralGuide(c.data)))},Sr=async e=>{const{isConfirmed:n}=await Ue.fire({title:"Eliminar pedido comercial",text:"Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!n||!await O.delete(e)||$(d.current).dxDataGrid("instance").refresh()},Er=()=>{u.current&&(u.current.value=""),$(w.current).modal("show"),setTimeout(()=>{var e;return(e=u.current)==null?void 0:e.focus()},150)},Ir=async e=>{var c,m;e.preventDefault();const n=((m=(c=u.current)==null?void 0:c.value)==null?void 0:m.trim())||"";if(!n){await Ue.fire({title:"CHECK OUT ID requerido",text:"Ingresa el CHECK OUT ID del pedido Multivende.",icon:"warning",confirmButtonText:"Entendido"});return}await Ue.fire({title:"Integracion pendiente",text:`El formulario ya captura el CHECK OUT ID ${n}. Falta conectar el servicio de Multivende para registrar el pedido automaticamente.`,icon:"info",confirmButtonText:"Aceptar"})},Dr=async(e,n)=>{var y,b,re,P,fe,ne,ie,ce,se;$(n.target).data("select2")&&$(n.target).select2("close");const c=(y=$(n.target).select2("data"))==null?void 0:y[0],m=(c==null?void 0:c.data)??null,l=n.target.value||"";if(!l){V(x=>x.map(k=>k.uid===e?{...ze(),uid:k.uid}:k));return}const o=m??await O.getArticleById(l),v=((o==null?void 0:o.presentations)??[]).filter(x=>(x==null?void 0:x.status)!==!1&&(x==null?void 0:x.status)!==0),h=v[0]??null,j=o?`${o.code??""} - ${o.name??""}`.trim():(c==null?void 0:c.text)??l,g={article_id:l,article_label:j,article_code:(o==null?void 0:o.code)??"",article_lot:(o==null?void 0:o.default_lot)??"",article_name:(o==null?void 0:o.name)??"",article_unit:((b=o==null?void 0:o.unit)==null?void 0:b.symbol)??((re=o==null?void 0:o.unit)==null?void 0:re.name)??"",article_laboratory:((P=o==null?void 0:o.laboratory)==null?void 0:P.name)??"",article_principle:((fe=o==null?void 0:o.activePrinciple)==null?void 0:fe.name)??((ne=o==null?void 0:o.active_principle)==null?void 0:ne.name)??"",presentations:v.map(x=>({id:`${x.id}`,name:x.name??"Presentacion",units:Number(x.units||1),price:Number(x.price||0)})),presentation_id:h?`${h.id}`:"",presentation_units:Number((h==null?void 0:h.units)||1),quantity:1};V(x=>x.map(k=>k.uid===e?he({...k,...g}):k));const B=await O.resolvePrice({article_id:l,presentation_id:h?`${h.id}`:null,quantity:1,business_id:ye||null,business_branch_id:q||null,warehouse_id:U||null,client_id:je||null,eventual_client_id:Ne||null,client_distribution_network_id:z||null,issue_date:((ie=p.current)==null?void 0:ie.value)||null,commercial_channel:((ce=Ie.find(x=>`${x.id}`==`${z}`))==null?void 0:ce.commercial_channel)||null,segment:((se=Ie.find(x=>`${x.id}`==`${z}`))==null?void 0:se.segment)||null});B&&V(x=>x.map(k=>k.uid===e?he({...k,...g,stock_available:Number(B.stock_available||0),price_unit:Number(B.price_unit||0),price_source:B.source||"fallback",price_list_code:B.price_list_code||""}):k))},vt=async(e,n,c)=>{const m=K.find(j=>j.uid===e);if(!m)return;const l=n==="presentation_id"?m.presentations.find(j=>`${j.id}`==`${c}`):null,o=he({...m,[n]:c,...n==="presentation_id"?{presentation_units:Number((l==null?void 0:l.units)||1)}:{}});if(n==="price_unit"&&(o.price_source="manual",o.price_list_code=""),V(j=>j.map(g=>g.uid===e?o:g)),!["quantity","presentation_id"].includes(n))return;const v=o.presentations.find(j=>`${j.id}`==`${n==="presentation_id"?c:o.presentation_id}`),h=await At(o,{quantity:n==="quantity"?c:o.quantity,presentation_id:n==="presentation_id"?c:o.presentation_id});h&&V(j=>j.map(g=>g.uid!==e?g:he({...g,presentation_units:Number((v==null?void 0:v.units)||g.presentation_units||1),stock_available:Number(h.stock_available||0),price_unit:Ht(g,h,n==="presentation_id"),price_source:Kt(g,h,n==="presentation_id"),price_list_code:n==="presentation_id"?h.price_list_code||"":wt(g)?g.price_list_code:h.price_list_code||""})))},Tr=(e,n)=>{const c=Number(n||0);V(m=>m.map(l=>l.uid!==e?l:he({...l,discount_type:c>0?"percent":"none",discount_value:c>0?c:0})))},Fr=(e,n)=>{n.preventDefault(),n.stopPropagation();const c=n.currentTarget.getBoundingClientRect();bt(m=>(m==null?void 0:m.uid)===e?null:{uid:e,top:c.bottom+4,left:c.left,width:Math.max(c.width,130)})},Mt=(e,n)=>{Tr(e,n),bt(null)},Ar=()=>V(e=>[...e,ze()]),Pr=e=>{V(n=>{const c=n.filter(m=>m.uid!==e);return c.length?c:[ze()]})},yt=s.useMemo(()=>K.reduce((e,n)=>e+Number(n.total||0),0),[K]),jt=s.useMemo(()=>Xt(yt,De),[yt,De]),Bt=s.useMemo(()=>Sn(kt),[kt]);return r.jsxs(r.Fragment,{children:[r.jsx("style",{children:`
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
        justify-content: flex-end;
        margin-bottom: 12px;
      }
      .commercial-order-multivende-action {
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
      .commercial-order-multivende-action span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .commercial-order-modal-header-primary {
        background: #28285b;
        border-bottom: 0;
        color: #fff;
      }
      .commercial-order-modal-header-primary .modal-title {
        align-items: center;
        display: flex;
        gap: 6px;
        font-size: 0.9rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .commercial-order-multivende-form {
        padding: 8px 2px 0;
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
        .commercial-order-multivende-action {
          width: 100%;
        }
      }
    `}),r.jsx("div",{className:"commercial-order-top-actions",children:r.jsxs("button",{type:"button",className:"btn btn-success commercial-order-multivende-action",title:"Ingresar pedido Multivende por CHECK OUT ID",onClick:Er,children:[r.jsxs("span",{children:[r.jsx("i",{className:"mdi mdi-plus-circle-outline"})," Ingresar pedido multivende"]}),r.jsx("i",{className:"mdi mdi-calendar-month-outline"})]})}),r.jsx(Vr,{gridRef:d,title:a,rest:O,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(d.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"add",title:"Agregar",hint:"Agregar pedido comercial",onClick:()=>Ot(null)}})},pageSize:25,columns:[{caption:"Acciones",width:300,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:n})=>{const c=Nt(n).length>0;e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),be(e,{variant:"primary",title:"Editar datos, cliente, entrega y productos del pedido comercial",icon:"mdi mdi-pencil",onClick:()=>Ot(n)}),kn(n)&&be(e,{variant:"success",title:"Enviar este pedido a preparacion para iniciar picking",icon:"mdi mdi-clipboard-check-outline",onClick:()=>Nr({id:n.id,field:"dispatch_status",value:"preparing"})}),be(e,{variant:"info",title:"Ver historial de estados, guia, ruta y entrega del pedido",icon:"mdi mdi-map-marker-path",onClick:()=>wr(n)}),be(e,{variant:c?"dark":"warning",title:c?"Ver, emitir o descargar la guia de remision asociada al pedido":"Generar guia de remision para este pedido",icon:c?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>kr(n)}),be(e,{variant:"success",title:er(n)?"Ver o actualizar foto y datos de evidencia de entrega":"Registrar foto y datos de evidencia de entrega",icon:"mdi mdi-camera",onClick:()=>Cr(n)}),be(e,{variant:"danger",title:"Imprimir o descargar PDF resumen del pedido comercial",icon:"mdi mdi-file-pdf-box",onClick:()=>ct(st.commercialOrder(n))}),be(e,{variant:"danger",title:"Eliminar este pedido comercial del listado",icon:"mdi mdi-delete",onClick:()=>Sr(n.id)})}},{dataField:"order_status",caption:"Estado",width:140,lookup:Yr(Jr),cellTemplate:(e,{value:n})=>Wt(e,n,Zr)},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:un},{dataField:"document_type",caption:"Tipo documento",width:130,calculateCellValue:mn,cellTemplate:(e,{value:n})=>Wt(e,n,c=>c||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:320,calculateCellValue:pn},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_label",caption:"Tipo de pago",width:170,calculateCellValue:fn},{dataField:"seller.fullname",caption:"Usuario",width:190,cellTemplate:(e,{data:n})=>e.text(cn(n.seller))},{dataField:"created_at",caption:"Fecha registro",width:130,dataType:"date"},{dataField:"creator.username",caption:"Usuario registro",width:150,cellTemplate:(e,{data:n})=>e.text(sn(n.creator))},{dataField:"code",caption:"Código",width:130},{dataField:"business.name",caption:"Empresa",minWidth:150}]}),r.jsx(it,{modalRef:f,title:or?"Editar pedido comercial":"Agregar pedido comercial",size:"xl",dialogClass:"commercial-order-modal-dialog modal-dialog-scrollable",bodyClass:"commercial-order-modal-body",bodyStyle:{maxHeight:"calc(100vh - 150px)",overflowY:"auto",overflowX:"hidden"},btnSubmitText:"Guardar",onSubmit:_r,children:r.jsxs("div",{id:"commercial-orders-form-container",children:[r.jsx("input",{ref:F,type:"hidden"}),r.jsx("input",{ref:S,type:"hidden"}),r.jsx("input",{ref:p,type:"hidden"}),r.jsx("input",{ref:R,type:"hidden"}),r.jsx("input",{ref:Z,type:"hidden"}),r.jsx("input",{ref:Ke,type:"hidden"}),r.jsx("input",{ref:Qe,type:"hidden"}),r.jsx("input",{ref:Ye,type:"hidden"}),r.jsx("input",{ref:Je,type:"hidden"}),r.jsx("input",{ref:Ze,type:"hidden"}),r.jsx("input",{ref:sr,type:"hidden",value:jt.taxAmount,readOnly:!0}),r.jsx("input",{ref:ge,type:"hidden"}),r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-file-document"}),r.jsx("span",{children:"Datos del pedido"})]}),r.jsxs("div",{className:"row g-2",children:[r.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:r.jsx(ke,{eRef:W,label:"Empresa",required:!0,searchAPI:"/api/admin/businesses/paginate",searchBy:"name",dropdownParent:"#commercial-orders-form-container",onChange:gr})}),r.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:r.jsxs(Hr,{eRef:oe,label:"Sede",dropdownParent:"#commercial-orders-form-container",value:q,onChange:xr,children:[r.jsx("option",{value:"",children:"Sin sede"}),ur.map(e=>r.jsx("option",{value:e.id,children:e.name},`commercial-order-branch-${e.id}`))]})}),r.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:r.jsx(ke,{eRef:M,label:"Almacen",required:!0,searchAPI:"/api/admin/warehouses/paginate",searchBy:"name",filter:br,dropdownParent:"#commercial-orders-form-container",onChange:vr,templateResult:Zt,templateSelection:Zt})}),r.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Doc. venta"}),r.jsxs("select",{ref:de,className:"form-control",value:De,onChange:e=>Rt(at(e.target.value)),children:[r.jsx("option",{value:"Factura",children:"Factura"}),r.jsx("option",{value:"Boleta",children:"Boleta"}),r.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),r.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Moneda"}),r.jsxs("select",{ref:L,className:"form-control",children:[r.jsx("option",{value:"PEN",children:"PEN"}),r.jsx("option",{value:"USD",children:"USD"}),r.jsx("option",{value:"EUR",children:"EUR"})]})]}),r.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Forma de pago"}),r.jsxs("select",{ref:ue,className:"form-control",children:[r.jsx("option",{value:"",children:"Seleccione"}),tn.map(e=>r.jsx("option",{value:e,children:e},`commercial-order-payment-${e}`))]})]})]})]}),r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-account"}),r.jsx("span",{children:"Cliente y entrega"})]}),r.jsxs("div",{className:"row g-2",children:[r.jsx("div",{className:"col-12 col-xl-6",children:r.jsx(ke,{eRef:A,label:"Cliente regular",searchAPI:"/api/admin/clients/paginate",searchBy:"full_name",selectBy:"entity_id",filter:Xr,dropdownParent:"#commercial-orders-form-container",onChange:yr})}),r.jsx("div",{className:"col-12 col-xl-6",children:r.jsx(ke,{eRef:ae,label:"Cliente eventual",searchAPI:"/api/admin/eventual-clients/paginate",searchBy:"business_name",dropdownParent:"#commercial-orders-form-container",onChange:jr})}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Orden de compra"}),r.jsx("input",{ref:H,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Numero de guia"}),r.jsx("input",{ref:We,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Guia remision"}),r.jsx("input",{ref:He,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Ubigeo"}),r.jsx("input",{ref:X,className:"form-control"})]}),r.jsx("div",{className:"col-12 col-xl-4",children:r.jsx(zt,{eRef:G,label:"Direccion de entrega",rows:2})}),r.jsx("div",{className:"col-12",children:r.jsx(Rn,{modalRef:f,position:pt,searchText:dr,onSearchTextChange:rt,onPositionChange:ft,onAddressSelected:e=>{G.current&&(G.current.value=e)}})}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[r.jsx("label",{className:"form-label",children:"Nombre contacto entrega"}),r.jsx("input",{ref:xe,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Celular contacto entrega"}),r.jsx("input",{ref:ve,className:"form-control"})]}),r.jsx(ke,{eRef:le,label:"Vendedor",col:"col-12 col-md-6 col-xl-2",searchAPI:"/api/admin/users/paginate",searchBy:"fullname",dropdownParent:"#commercial-orders-form-container"}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Medico"}),r.jsx("input",{ref:_e,className:"form-control"})]})]})]}),r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-detail-toolbar",children:[r.jsxs("div",{className:"commercial-order-section-title mb-0",children:[r.jsx("i",{className:"mdi mdi-format-list-bulleted"}),r.jsx("span",{children:"Detalle del pedido"})]}),r.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:Ar,children:"Agregar item"})]}),r.jsx("div",{className:"table-responsive border rounded commercial-order-detail-table","data-select2-local-dropdown":"true",children:r.jsxs("table",{className:"table table-sm align-middle mb-0",children:[r.jsx("thead",{children:r.jsxs("tr",{children:[r.jsx("th",{style:{minWidth:96},children:"Descuento"}),r.jsx("th",{style:{minWidth:104},children:"Codigo"}),r.jsx("th",{style:{minWidth:88},children:"Codigo lote"}),r.jsx("th",{style:{minWidth:280},children:"Nombre"}),r.jsx("th",{style:{minWidth:128},children:"Laboratorio"}),r.jsx("th",{style:{minWidth:130},children:"Principio activo"}),r.jsx("th",{style:{minWidth:110},children:"Unidad"}),r.jsx("th",{style:{minWidth:64},children:"Stock"}),r.jsx("th",{style:{minWidth:112},children:"P. venta con IGV"}),r.jsx("th",{style:{minWidth:112},children:"P. venta sin IGV"}),r.jsx("th",{style:{minWidth:92},children:"Cantidad"}),r.jsx("th",{style:{minWidth:96},children:"Total desc."}),r.jsx("th",{style:{minWidth:96},children:"Sub total"}),r.jsx("th",{style:{width:70}})]})}),r.jsx("tbody",{children:K.map(e=>r.jsxs("tr",{children:[r.jsx("td",{children:r.jsxs("div",{className:"commercial-order-discount-cell",children:[r.jsxs("button",{type:"button",className:"commercial-order-discount-trigger",onClick:n=>Fr(e.uid,n),children:[r.jsx("span",{children:e.discount_type==="percent"&&Number(e.discount_value||0)>0?`${Number(e.discount_value)}%`:"Seleccione"}),r.jsx("i",{className:"mdi mdi-chevron-down"})]}),(ee==null?void 0:ee.uid)===e.uid&&r.jsxs("div",{className:"commercial-order-discount-menu",style:{top:ee.top,left:ee.left,minWidth:ee.width},onClick:n=>n.stopPropagation(),children:[r.jsx("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type!=="percent"?"active":""}`,onClick:()=>Mt(e.uid,""),children:"Seleccione"}),en.map(n=>r.jsxs("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type==="percent"&&Number(e.discount_value||0)===n?"active":""}`,onClick:()=>Mt(e.uid,n),children:[n,"%"]},`commercial-order-discount-floating-${e.uid}-${n}`))]})]})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_code||"-"})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_lot||"-"})}),r.jsx("td",{className:"commercial-order-article-name",children:r.jsx(ke,{eRef:Et(e.uid),searchAPI:fr,searchBy:"name",dropdownParent:"#commercial-orders-form-container",disabled:!U,onChange:n=>Dr(e.uid,n)})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_laboratory||"-"})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_principle||"-"})}),r.jsx("td",{children:r.jsxs("div",{children:[r.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_unit||"-"}),e.presentations.length>0&&r.jsxs("select",{className:"form-control mt-1","data-no-select2":"true",value:e.presentation_id,disabled:!e.article_id,onChange:n=>vt(e.uid,"presentation_id",n.target.value),children:[r.jsx("option",{value:"",children:xn(e)}),e.presentations.map(n=>r.jsx("option",{value:n.id,children:vn(n,e)},`commercial-order-presentation-${e.uid}-${n.id}`))]})]})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:Number(e.stock_available||0).toFixed(2)})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:e.price_unit,onFocus:Yt,onChange:n=>vt(e.uid,"price_unit",Qt(n))})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Xt(Number(e.price_unit||0),De).subtotal.toFixed(2),readOnly:!0})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0.01",className:"form-control",value:e.quantity,onFocus:Yt,onChange:n=>vt(e.uid,"quantity",Qt(n))})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.discount_amount||0).toFixed(2),readOnly:!0})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.total||0).toFixed(2),readOnly:!0})}),r.jsx("td",{className:"text-end",children:r.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>Pr(e.uid),children:r.jsx("i",{className:"mdi mdi-close"})})})]},e.uid))}),r.jsxs("tfoot",{children:[r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:"Sub total"}),r.jsx("th",{children:yt.toFixed(2)}),r.jsx("th",{})]}),r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:"Descuento global"}),r.jsx("th",{children:"0.00"}),r.jsx("th",{})]}),r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:"Total"}),r.jsx("th",{children:jt.total.toFixed(2)}),r.jsx("th",{})]})]})]})})]}),r.jsxs("section",{className:"commercial-order-form-section mb-0",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-note-text"}),r.jsx("span",{children:"Observaciones"})]}),r.jsx(zt,{eRef:Xe,label:"Observaciones",rows:3})]})]})}),r.jsx(it,{modalRef:w,title:r.jsxs(r.Fragment,{children:[r.jsx("i",{className:"mdi mdi-plus-circle-outline"})," Ingresar pedido multivende"]}),size:"lg",headerClass:"commercial-order-modal-header-primary",closeButtonClass:"btn-close-white",btnSubmitText:"Registrar",onSubmit:Ir,children:r.jsx("div",{className:"commercial-order-multivende-form",children:r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-file-document-plus-outline"}),r.jsx("span",{children:"General"})]}),r.jsxs("div",{className:"mb-2",children:[r.jsxs("label",{className:"form-label",children:["Ingrese el ",r.jsx("strong",{children:"CHECK OUT ID"})]}),r.jsx("input",{ref:u,name:"external_checkout_id",className:"form-control",autoComplete:"off"})]})]})})}),r.jsx(it,{modalRef:_,title:"Tracking del pedido",size:"lg",hideButtonSubmit:!0,children:r.jsx("div",{className:"table-responsive",children:r.jsxs("table",{className:"table table-sm align-middle mb-0",children:[r.jsx("thead",{children:r.jsxs("tr",{children:[r.jsx("th",{children:"Fecha"}),r.jsx("th",{children:"Estado"})]})}),r.jsxs("tbody",{children:[Bt.length===0&&r.jsx("tr",{children:r.jsx("td",{colSpan:"2",className:"text-muted text-center py-3",children:"Sin eventos registrados."})}),Bt.map((e,n)=>r.jsxs("tr",{children:[r.jsx("td",{children:new Date(e.date).toLocaleString("es-PE")}),r.jsx("td",{children:e.status})]},`commercial-order-tracking-${n}`))]})]})})}),r.jsx(it,{modalRef:I,title:"Evidencia de entrega",size:"lg",btnSubmitText:"Registrar",onSubmit:Rr,children:r.jsxs("div",{className:"row",children:[r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Recibido por"}),r.jsx("input",{className:"form-control",value:N.recipient_name,onChange:e=>te("recipient_name",e.target.value)})]}),r.jsxs("div",{className:"col-md-3 mb-3",children:[r.jsx("label",{className:"form-label",children:"Tipo doc."}),r.jsxs("select",{className:"form-control",value:N.recipient_document_type,onChange:e=>te("recipient_document_type",e.target.value),children:[r.jsx("option",{value:"DNI",children:"DNI"}),r.jsx("option",{value:"RUC",children:"RUC"}),r.jsx("option",{value:"CE",children:"CE"}),r.jsx("option",{value:"OTRO",children:"Otro"})]})]}),r.jsxs("div",{className:"col-md-3 mb-3",children:[r.jsx("label",{className:"form-label",children:"Numero"}),r.jsx("input",{className:"form-control",value:N.recipient_document_number,onChange:e=>te("recipient_document_number",e.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Telefono"}),r.jsx("input",{className:"form-control",value:N.recipient_phone,onChange:e=>te("recipient_phone",e.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Fecha y hora entrega"}),r.jsx("input",{type:"datetime-local",className:"form-control",value:N.delivered_at,onChange:e=>te("delivered_at",e.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Foto / evidencia"}),r.jsx("input",{ref:E,className:"form-control",type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",capture:"environment",onChange:$r})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Latitud"}),r.jsx("input",{className:"form-control",value:N.latitude,onChange:e=>te("latitude",e.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Longitud"}),r.jsx("input",{className:"form-control",value:N.longitude,onChange:e=>te("longitude",e.target.value)})]}),r.jsxs("div",{className:"col-12 mb-3",children:[r.jsx("label",{className:"form-label",children:"Observaciones"}),r.jsx("textarea",{className:"form-control",rows:"3",value:N.evidence_notes,onChange:e=>te("evidence_notes",e.target.value)})]}),r.jsx("div",{className:"col-12",children:r.jsx("div",{className:"border rounded p-3",children:pe?r.jsx("img",{src:pe,alt:"Evidencia de entrega",className:"img-fluid rounded border bg-light",style:{maxHeight:360,width:"100%",objectFit:"contain"}}):N.evidence_url?r.jsx("a",{href:N.evidence_url,target:"_blank",rel:"noreferrer",children:"Abrir evidencia registrada"}):r.jsx("div",{className:"text-muted py-4 text-center",children:"Sin evidencia registrada"})})})]})})]})};Mr((t,i)=>{!i.can("orders")&&!i.hasRole("Admin")&&(location.href="/admin/"),Br(t).render(r.jsx(zr,{...i,title:i.pageTitle||"Pedidos comerciales",children:r.jsx(En,{...i})}))});
