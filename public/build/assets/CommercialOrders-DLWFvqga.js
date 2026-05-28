var an=Object.defineProperty;var sn=(r,i,o)=>i in r?an(r,i,{enumerable:!0,configurable:!0,writable:!0,value:o}):r[i]=o;var nr=(r,i,o)=>sn(r,typeof i!="symbol"?i+"":i,o);import{C as on,c as ln,j as t,r as a,S as Ce,G as dn}from"./CreateReactScript-DQLVjp0V.js";import{L as un,G as mn,M as pn}from"./esm-BhZAXbGk.js";import{B as fn}from"./Base-DpZFB5sy.js";import{T as bn}from"./Table-7ynWM9VR.js";import{M as ze}from"./Modal-CAfsOhZN.js";import{R as hn}from"./ReactAppend-DIHzhAcr.js";import{a as $e,S as ke}from"./SetSelectValue-DfDyTYyl.js";import{S as xn}from"./SelectFormGroup-CC2pGrXt.js";import{T as ir}from"./TextareaFormGroup-CdYAyehd.js";import{C as gn}from"./CommercialOrdersRest-DKg4Dgc7.js";import{B as _n}from"./BasicRest-EXKW_n5g.js";import{R as vn}from"./ReferralGuidesRest-DPUoCWFG.js";import{o as lt,b as dt}from"./magistralesRecordPdf-BLh28TRb.js";import{t as yn,i as jn,j as _r,k as Nn}from"./statusLabels-DafAwaKR.js";import"./tippy-react.esm-DZzWNIYv.js";import"./ubigeoInei-D0FnAslC.js";class wn extends _n{constructor(){super(...arguments);nr(this,"path","admin/delivery-delay-reasons")}}const B=new gn,cr=new wn,ar=new vn,Rn=["client_kind","=","regular"],Cn=[1,2,3,4,5],$n=["EFECTIVO [CONTADO]","TRANSFERENCIA [CONTADO]","YAPE [CONTADO]","PLIN [CONTADO]","TARJETA [CONTADO]","TRANSFERENCIA [CREDITO]"],me=(r,{variant:i,title:o,icon:d,onClick:p})=>{const w=$('<button type="button"></button>').addClass(`btn btn-xs btn-soft-${i} commercial-order-action-btn`).attr("title",o).attr("aria-label",o).append($("<i></i>").addClass(d)).on("click",u=>{u.preventDefault(),u.stopPropagation(),p()});r.append(w)},vr=r=>`commercial-order-status-badge commercial-order-status-${`${r??"empty"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-")||"empty"}`,sr=(r,i,o)=>{r.addClass("commercial-order-status-cell"),hn(r,t.jsx("span",{className:vr(i),children:o(i)}))},Ve=()=>({uid:crypto.randomUUID(),article_id:"",article_label:"",article_code:"",article_lot:"",article_name:"",article_unit:"",article_laboratory:"",article_principle:"",presentations:[],presentation_id:"",presentation_units:1,stock_available:0,reserved_quantity:0,price_unit:0,quantity:1,gross_total:0,discount_type:"none",discount_value:0,discount_amount:0,total:0,price_source:"fallback",price_list_code:""}),kn=r=>{if(!r)return"";const i=(r.name??"").toString().trim().split(" ")[0]??"",o=(r.lastname??"").toString().trim().split(" ")[0]??"",d=`${i} ${o}`.trim(),p=(r.username??"").toString().trim();return d&&p?`${d} (@${p})`:d||(p?`@${p}`:"")},Sn=r=>{if(!r)return"-";const i=(r.fullname??"").toString().trim();return i||`${r.name??""} ${r.lastname??""}`.trim()||(r.username??"").toString().trim()||"-"},Dt=r=>r&&((r.username??"").toString().trim()||(r.fullname??"").toString().trim()||`${r.name??""} ${r.lastname??""}`.trim())||"-",We=r=>Number(Number(r||0).toFixed(2)),En=r=>$("<div>").text(r??"").html(),Se=r=>{const i=Number(Number(r||0).toFixed(3));return Number.isInteger(i)?`${i}`:`${i}`.replace(/\.?0+$/,"")},Tt=r=>(r==null?void 0:r.price_source)==="manual",or=(r,i,o=!1)=>{const d=Number((r==null?void 0:r.price_unit)||0),p=Number(i==null?void 0:i.price_unit);return!o&&Tt(r)||!Number.isFinite(p)||!o&&p<=0&&d>0?d:p},lr=(r,i,o=!1)=>!o&&Tt(r)?"manual":(i==null?void 0:i.source)||(r==null?void 0:r.price_source)||"fallback",Dn=r=>{const i=`${r??""}`.replace(",",".").replace(/[^\d.]/g,"");if(!i)return"";const[o,...d]=i.split("."),p=o.replace(/^0+(?=\d)/,"")||(o||d.length?"0":""),w=d.length?`.${d.join("")}`:"";return`${p}${w}`},dr=r=>{const i=Dn(r.target.value);return r.target.value!==i&&(r.target.value=i),Number(i||0)},ur=r=>{Number(r.target.value||0)===0&&r.target.select()},In=(r,i,o)=>{const d=We(r),p=Number(o||0);return!Number.isFinite(p)||p<=0||d<=0?0:i==="percent"?Math.min(d,We(d*Math.min(p,100)/100)):i==="amount"?Math.min(d,We(p)):0},pe=r=>{const i=Number(r.quantity||0),o=Number(r.price_unit||0),d=Number.isFinite(i*o)?We(i*o):0,p=In(d,r.discount_type,r.discount_value);return{...r,discount_type:r.discount_type||"none",discount_value:r.discount_type==="none"?0:Number(r.discount_value||0),gross_total:d,discount_amount:p,total:We(Math.max(0,d-p))}},mt=r=>{const i=`${r??""}`.trim().toLowerCase();return i==="boleta"?"Boleta":["nota de pedido","nota_pedido","note_order"].includes(i)?"Nota de pedido":"Factura"},Tn=r=>(r==null?void 0:r.billing_documents)??(r==null?void 0:r.billingDocuments)??[],yr=r=>Tn(r)[0]??null,Fn=r=>{const i=yr(r);return(i==null?void 0:i.code)||[i==null?void 0:i.series,i==null?void 0:i.sequence].filter(Boolean).join("-")||(r==null?void 0:r.referral_guide)||(r==null?void 0:r.guide_number)||(r==null?void 0:r.purchase_order)||"-"},An=r=>{var i;return mt(((i=yr(r))==null?void 0:i.document_type)??(r==null?void 0:r.document_type))},Pn=r=>{const i=(r==null?void 0:r.client)??(r==null?void 0:r.eventual_client)??(r==null?void 0:r.eventualClient)??null,o=`${(i==null?void 0:i.document_number)??""}`.trim(),d=`${(i==null?void 0:i.full_name)??(i==null?void 0:i.business_name)??""}`.trim();return[o,d].filter(Boolean).join(" | ")||"-"},Mn=r=>{const i=`${(r==null?void 0:r.payment_method)??""}`.trim(),o=`${(r==null?void 0:r.payment_condition)??""}`.trim();return!i&&!o?"-":!o||i.includes("[")?i||"-":`${i||"-"} [${o.toUpperCase()}]`},mr=r=>{if(!r)return"-";const i=new Date(r);return Number.isNaN(i.getTime())?`${r}`:i.toLocaleString("es-PE",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})},C=(r,i="")=>{if(r==null)return i;if(typeof r=="object")return r.address??r.reference??r.name??r.description??i;const o=`${r}`;return o==="[object Object]"?i:o},Bn=r=>`${r??""}`.toUpperCase().includes("CREDITO")?"Credito":"Contado",On=r=>{const i=`${r??""}`.trim();return i?i.toUpperCase()==="TRANSFERENCIA"?"TRANSFERENCIA [CONTADO]":i:"EFECTIVO [CONTADO]"},Ln=r=>C(r==null?void 0:r.full_address,C(r==null?void 0:r.address,C(r==null?void 0:r.fiscal_address))),Gn=r=>C(r==null?void 0:r.ubigeo,C(r==null?void 0:r.district_ubigeo,C(r==null?void 0:r.inei_ubigeo))),pr=r=>{const i=`${r??""}`.trim(),o=i.match(/^(client|eventual)-(\d+)$/);return o?o[2]:i},fr=r=>{var u,x,k;if(r.loading)return r.text;const i=r.data??{},o=r.text||i.name||"",d=(u=i.branch)==null?void 0:u.name,p=(k=(x=i.branch)==null?void 0:x.business)==null?void 0:k.name,w=$("<span>").text(o);return d&&w.append($("<small>").addClass("text-muted ms-1").text(`- ${d}`)),p&&w.append($("<small>").addClass("text-muted ms-1").text(`(${p})`)),w},J=r=>{if(!(r!=null&&r.current))return;const i=$(r.current);i.empty().val(null),i.trigger(i.data("select2")?"change.select2":"change")},qn=r=>r.article_id?"Unidad base":"Sin presentacion",Un=(r,i)=>{const o=(r==null?void 0:r.name)||"Presentacion",d=Se((r==null?void 0:r.units)||1),p=i!=null&&i.article_unit?` ${i.article_unit}`:" unidad(es) base";return`${o} (${d}${p})`},zn=r=>["Factura","Boleta"].includes(mt(r)),br=(r,i)=>{const o=Number(r||0);if(!zn(i))return{subtotal:Number(o.toFixed(2)),taxAmount:0,total:Number(o.toFixed(2))};const d=Number((o/1.18).toFixed(2));return{subtotal:d,taxAmount:Number((o-d).toFixed(2)),total:Number(o.toFixed(2))}},Vn=(r,i="")=>{const o=new Map;return(r??[]).flatMap(d=>{if(!(d!=null&&d.article_id))return[];const p=`${d.article_id}:${d.warehouse_id||i||""}`,w=Number(d.quantity||0),u=Number(d.presentation_units||1)||1,x=Number((w*u).toFixed(3)),k=Number(d.stock_available||0),R=Number(o.get(p)||0),D=Math.max(0,k-R),I=Math.min(x,D),Q=Math.max(0,x-I);return o.set(p,R+I),Q<=1e-4?[]:[{article:d.article_name||d.article_label||d.article_code||"Articulo",quantity:x,lineQuantity:w,presentationUnits:u,available:D,shortage:Q}]})},It=r=>(r==null?void 0:r.referral_guides)??(r==null?void 0:r.referralGuides)??[],jr=r=>(r==null?void 0:r.external_reference)||[r==null?void 0:r.series,r==null?void 0:r.sequence].filter(Boolean).join("-")||(r==null?void 0:r.code)||"-",Wn=r=>r&&!["accepted","cancelled"].includes(r.guide_status),Hn=r=>(r==null?void 0:r.delivery_evidences)??(r==null?void 0:r.deliveryEvidences)??[],hr=r=>Hn(r)[0]??null,Kn=r=>(r==null?void 0:r.tracking_events)??(r==null?void 0:r.trackingEvents)??[],xr=r=>{const i=`${r??""}`.trim();return i.startsWith("blob:")||i.startsWith("data:image/")||/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(i)||i.includes("/delivery-evidence-media/")},gr=()=>{const r=new Date;return r.setMinutes(r.getMinutes()-r.getTimezoneOffset()),r.toISOString().slice(0,16)},ut={lat:-12.046374,lng:-77.042793},Z=r=>{const i=Number(r);return Number.isFinite(i)?i:null},pt=r=>{const i=Z(r);return i===null?"":i.toFixed(7)},X=r=>Z(r==null?void 0:r.lat)!==null&&Z(r==null?void 0:r.lng)!==null,Qn=({modalRef:r,position:i,searchText:o,onPositionChange:d,onSearchTextChange:p,onAddressSelected:w,googleMapsApiKey:u})=>{const x=a.useRef(),[k,R]=a.useState(!1),[D,I]=a.useState(""),[Q,O]=a.useState([]),G=X(i)?{lat:Z(i.lat),lng:Z(i.lng)}:ut,P=(f,S=17)=>{const q=Z(f==null?void 0:f.lat),U=Z(f==null?void 0:f.lng);q===null||U===null||!x.current||(x.current.setCenter({lat:q,lng:U}),x.current.setZoom(S))},fe=f=>{d(f),P(f)};a.useEffect(()=>{if(X(i)){P(G);return}P(ut,13)},[i==null?void 0:i.lat,i==null?void 0:i.lng]),a.useEffect(()=>{const f=r==null?void 0:r.current;if(!f)return;const S=()=>{setTimeout(()=>{X(i)?P(G):P(ut,13)},180)};return $(f).on("shown.bs.modal",S),()=>$(f).off("shown.bs.modal",S)},[r,i==null?void 0:i.lat,i==null?void 0:i.lng]);const He=async()=>{var S,q;const f=`${o??""}`.trim();if(!f){O([]),I("Escribe una direccion para buscar.");return}if(!((q=(S=window.google)==null?void 0:S.maps)!=null&&q.Geocoder)){I("Google Maps aun no termino de cargar.");return}R(!0),I("");try{new window.google.maps.Geocoder().geocode({address:`${f}, Peru`,componentRestrictions:{country:"PE"},region:"PE"},(M,be)=>{if(R(!1),be!=="OK"||!Array.isArray(M)||M.length===0){O([]),I("Sin resultados. Puedes marcar el punto manualmente en el mapa.");return}O(M.slice(0,5).map(he=>({place_id:he.place_id,display_name:he.formatted_address,lat:he.geometry.location.lat(),lng:he.geometry.location.lng()})))})}catch(U){R(!1),I(`${U.message}. Puedes marcar el punto manualmente en el mapa.`),O([])}},oe=f=>{const S={lat:Z(f.lat),lng:Z(f.lng)};d(S),p(f.display_name??""),w(f.display_name??""),P(S),O([])};return t.jsxs("div",{className:"commercial-order-map-picker",children:[t.jsxs("div",{className:"commercial-order-map-search",children:[t.jsxs("div",{children:[t.jsx("label",{className:"form-label",children:"Buscar direccion en mapa"}),t.jsxs("div",{className:"input-group",children:[t.jsx("input",{type:"text",className:"form-control",value:o,onChange:f=>p(f.target.value),onKeyDown:f=>{f.key==="Enter"&&(f.preventDefault(),He())},placeholder:"Ej. Av. Javier Prado 123, San Isidro"}),t.jsx("button",{type:"button",className:"btn btn-outline-primary",onClick:He,disabled:k,children:k?"Buscando...":"Buscar"})]})]}),t.jsxs("div",{className:"commercial-order-map-coordinates",children:[t.jsx("label",{className:"form-label",children:"Coordenadas"}),t.jsxs("div",{className:"commercial-order-map-coordinate-values",children:[t.jsx("span",{children:pt(i==null?void 0:i.lat)||"-"}),t.jsx("span",{children:pt(i==null?void 0:i.lng)||"-"})]})]})]}),Q.length>0&&t.jsx("div",{className:"commercial-order-map-results",children:Q.map(f=>t.jsx("button",{type:"button",className:"commercial-order-map-result",onClick:()=>oe(f),children:f.display_name},`${f.place_id}-${f.lat}-${f.lng}`))}),D&&t.jsx("small",{className:"text-muted d-block mt-1",children:D}),t.jsx(un,{googleMapsApiKey:u,language:"es",region:"PE",onError:()=>I("No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio."),children:t.jsx(mn,{mapContainerClassName:"commercial-order-map-canvas",center:G,zoom:X(i)?17:13,options:{clickableIcons:!0,fullscreenControl:!0,gestureHandling:"greedy",mapTypeControl:!0,scrollwheel:!0,streetViewControl:!1},onLoad:f=>{x.current=f,setTimeout(()=>{X(i)?P(G):P(ut,13)},120)},onClick:f=>{const S={lat:f.latLng.lat(),lng:f.latLng.lng()};fe(S)},children:X(i)&&t.jsx(pn,{position:G,draggable:!0,onDragEnd:f=>fe({lat:f.latLng.lat(),lng:f.latLng.lng()})})})}),t.jsx("small",{className:"text-muted d-block mt-2",children:"Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega."})]})},Yn=r=>{const i=`${dn.GMAPS_API_KEY??""}`.trim();return i?t.jsx(Qn,{...r,googleMapsApiKey:i}):t.jsx("div",{className:"commercial-order-map-picker",children:t.jsx("div",{className:"commercial-order-map-empty",children:"Configura Google Maps API Key en Sistemas > Datos generales > Integraciones para habilitar el mapa."})})},Jn=r=>!r||r.status===null||`${r.order_status??""}`=="cancelled"?!1:`${r.dispatch_status??"pending"}`=="pending",Zn=r=>{if(!r)return[];const i=Kn(r).map(u=>({date:u.happened_at??u.created_at,status:[u.title,u.description].filter(Boolean).join(" - ")})),o=[{date:r.created_at,status:"La orden ingreso en el sistema"}];r.approved_at&&["preparing","in_route","delivered","dispatched","billed","closed"].includes(r.order_status)?o.push({date:r.approved_at,status:"La orden paso a preparacion"}):r.approved_at&&r.order_status==="confirmed"?o.push({date:r.approved_at,status:"La orden fue confirmada"}):["preparing","in_route","delivered","dispatched","billed","closed"].includes(r.order_status)&&o.push({date:r.updated_at,status:"La orden paso a preparacion"});const d=(r.dispatch_assignments??r.dispatchAssignments??[]).filter(u=>(u==null?void 0:u.status)!==!1&&(u==null?void 0:u.status)!==0&&(u==null?void 0:u.dispatch)).sort((u,x)=>{var k,R,D,I;return new Date(((k=u==null?void 0:u.dispatch)==null?void 0:k.departed_at)||((R=u==null?void 0:u.dispatch)==null?void 0:R.scheduled_date)||0)-new Date(((D=x==null?void 0:x.dispatch)==null?void 0:D.departed_at)||((I=x==null?void 0:x.dispatch)==null?void 0:I.scheduled_date)||0)}),p=d.find(u=>{var x;return["in_route","delivered","closed"].includes((x=u==null?void 0:u.dispatch)==null?void 0:x.dispatch_status)});p?(o.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:`Manifiesto ${p.dispatch.manifest_code||p.dispatch.code||""}`.trim()}),o.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:"El pedido salio en ruta"})):r.dispatch_status==="in_route"&&o.push({date:r.updated_at,status:"El pedido salio en ruta"}),(r.dispatch_status==="dispatched"||d.some(u=>{var x;return((x=u==null?void 0:u.dispatch)==null?void 0:x.dispatch_status)==="dispatched"}))&&o.push({date:r.updated_at,status:"El pedido paso a despacho"}),It(r).forEach(u=>{o.push({date:u.issue_date??u.created_at??r.updated_at,status:`Guia de remision ${jr(u)} - ${_r(u.guide_status)}`})});const w=d.find(u=>{var x;return["delivered","closed"].includes((x=u==null?void 0:u.dispatch)==null?void 0:x.dispatch_status)});return w?o.push({date:w.dispatch.delivered_at??w.dispatch.updated_at??w.dispatch.created_at,status:"El pedido fue entregado"}):r.dispatch_status==="delivered"&&o.push({date:r.updated_at,status:"El pedido fue entregado"}),(r.order_status==="cancelled"||r.dispatch_status==="cancelled")&&o.push({date:r.updated_at,status:"El pedido fue cancelado"}),[...i,...o].filter(u=>u.date).sort((u,x)=>new Date(u.date)-new Date(x.date))},Xn=({requiredPermission:r="orders",externalSource:i=null,pageTitle:o="Pedidos comerciales"})=>{B.externalSource=i||null;const d=a.useRef(),p=a.useRef(),w=a.useRef(),u=a.useRef(),x=a.useRef(),k=a.useRef(),R=a.useRef(),D=a.useRef(),I=a.useRef(),Q=a.useRef(),O=a.useRef(),G=a.useRef(),P=a.useRef(),fe=a.useRef(),He=a.useRef(),oe=a.useRef(),f=a.useRef(),S=a.useRef(),q=a.useRef(),U=a.useRef(),M=a.useRef(),be=a.useRef(),he=a.useRef(),Ke=a.useRef(),Qe=a.useRef(),Ee=a.useRef(),Ye=a.useRef(),Je=a.useRef(),Ze=a.useRef(),Xe=a.useRef(),et=a.useRef(),tt=a.useRef(),rt=a.useRef(),nt=a.useRef(),Nr=a.useRef(),z=a.useRef(),xe=a.useRef(),ee=a.useRef(),ge=a.useRef(),_e=a.useRef(),it=a.useRef(),ft=a.useRef({}),[wr,Rr]=a.useState(!1),[ve,Ft]=a.useState(""),[V,ct]=a.useState(""),[W,at]=a.useState(""),[ye,bt]=a.useState(""),[je,ht]=a.useState(""),[H,De]=a.useState(""),[Cr,le]=a.useState(""),[xt,gt]=a.useState({lat:"",lng:""}),[$r,st]=a.useState(""),[kr,At]=a.useState([]),[Ie,ot]=a.useState([]),[ei,Ne]=a.useState([]),[Y,K]=a.useState([Ve()]),[Te,Pt]=a.useState("Factura"),[te,_t]=a.useState(null),[Mt,Sr]=a.useState(null),[we,Er]=a.useState(null),[Bt,vt]=a.useState(null),[de,yt]=a.useState(""),[jt,Dr]=a.useState([]),[Nt,Ot]=a.useState(""),[wt,Lt]=a.useState(!1),[N,Rt]=a.useState({recipient_name:"",recipient_document_type:"DNI",recipient_document_number:"",recipient_phone:"",delivered_at:gr(),evidence_notes:"",evidence_url:"",latitude:"",longitude:""}),Ir=a.useMemo(()=>{var n;const e=new URLSearchParams;return ve&&e.append("business_id",ve),V&&e.append("business_branch_id",V),W&&e.append("warehouse_id",W),ye&&e.append("client_id",ye),je&&e.append("eventual_client_id",je),H&&e.append("client_distribution_network_id",H),(n=M.current)!=null&&n.value&&e.append("issue_date",M.current.value),`/api/admin/commercial-orders/articles?${e.toString()}`},[ve,V,W,ye,je,H]),Tr=a.useMemo(()=>V?["business_branch_id","=",Number(V)]:null,[V]);a.useEffect(()=>()=>{de!=null&&de.startsWith("blob:")&&URL.revokeObjectURL(de)},[de]),a.useEffect(()=>{if(!te)return;const e=()=>_t(null),n=c=>{c.key==="Escape"&&e()};return document.addEventListener("click",e),document.addEventListener("keydown",n),window.addEventListener("resize",e),window.addEventListener("scroll",e,!0),()=>{document.removeEventListener("click",e),document.removeEventListener("keydown",n),window.removeEventListener("resize",e),window.removeEventListener("scroll",e,!0)}},[te]);const Gt=e=>(ft.current[e]||(ft.current[e]=a.createRef()),ft.current[e]);a.useEffect(()=>{Y.forEach(e=>{const n=Gt(e.uid);!n.current||!e.article_id||!e.article_label||`${$(n.current).val()}`==`${e.article_id}`||$e(n.current,e.article_id,e.article_label)})},[Y]);const qt=async(e,n=null)=>{if(!e){At([]),ct("");return}const m=(await B.getBranchesByBusiness(e)??[]).filter(l=>l.status!==null);if(At(m),n&&m.some(l=>`${l.id}`==`${n}`)){ct(`${n}`);return}ct("")},Ut=e=>{if(!e)return;const n=Ln(e),c=Gn(e);n&&z.current&&(z.current.value=n),c&&ee.current&&(ee.current.value=c),n&&st(n)},zt=async(e,n=null,c=null)=>{var v;if(!e){ot([]),De(""),Ne([]),le("");return}const l=(await B.getDistributionNetworks(e)??[]).filter(h=>h.status!==null);ot(l);const s=n||((v=l.find(h=>h.is_default))==null?void 0:v.id);if(s&&l.some(h=>`${h.id}`==`${s}`)){De(`${s}`),await Vt(s,null,l);return}De(""),Ne([]),le(""),Ut(c)},Vt=async(e,n=null,c=null)=>{var h,j;if(!e){Ne([]),le("");return}let m=[];const l=(c??Ie).find(g=>`${g.id}`==`${e}`);(((h=l==null?void 0:l.addresses)==null?void 0:h.length)??0)>0?m=l.addresses:m=await B.getDeliveryAddresses(e);const s=(m??[]).filter(g=>g.status!==null);Ne(s);const v=n||((j=s.find(g=>g.is_default))==null?void 0:j.id);if(v&&s.some(g=>`${g.id}`==`${v}`)){le(`${v}`),Fr(s.find(g=>`${g.id}`==`${v}`));return}le("")},Fr=e=>{e&&(z.current&&(z.current.value=C(e.address)),xe.current&&(xe.current.value=C(e.reference)),ee.current&&(ee.current.value=C(e.ubigeo)),ge.current&&(ge.current.value=C(e.contact_name)),_e.current&&(_e.current.value=C(e.contact_phone)),st(C(e.address)),X({lat:e.latitude,lng:e.longitude})&&gt({lat:Number(e.latitude),lng:Number(e.longitude)}))},Wt=async(e,n={})=>{var s,v,h;const c=n.article_id??e.article_id,m=Number(n.quantity??e.quantity??0),l=n.presentation_id??e.presentation_id;return!c||!W||m<=0?null:await B.resolvePrice({article_id:c,presentation_id:l||null,quantity:m,business_id:ve||null,business_branch_id:V||null,warehouse_id:W||null,client_id:ye||null,eventual_client_id:je||null,client_distribution_network_id:H||null,issue_date:((s=M.current)==null?void 0:s.value)||null,commercial_channel:((v=Ie.find(j=>`${j.id}`==`${H}`))==null?void 0:v.commercial_channel)||null,segment:((h=Ie.find(j=>`${j.id}`==`${H}`))==null?void 0:h.segment)||null})},Ct=async(e=null)=>{const n=e??Y;for(const c of n){if(!c.article_id)continue;const m=await Wt(c);m&&K(l=>l.map(s=>s.uid!==c.uid?s:pe({...s,stock_available:Number(m.stock_available||0),price_unit:or(s,m),price_source:lr(s,m),price_list_code:m.price_list_code||""})))}},Ht=e=>{e==="regular"?(ht(""),J(S)):e==="eventual"&&(bt(""),ot([]),De(""),Ne([]),le(""),J(f))},Kt=async(e=null)=>{var h,j,g,L;Rr(!!(e!=null&&e.id)),G.current&&(G.current.value=(e==null?void 0:e.id)??""),P.current&&(P.current.value=(e==null?void 0:e.code)??"Se genera al guardar"),M.current&&(M.current.value=e!=null&&e.issue_date?e.issue_date.toString().slice(0,10):new Date().toISOString().slice(0,10)),be.current&&(be.current.value=e!=null&&e.promised_delivery_at?e.promised_delivery_at.toString().slice(0,10):""),Pt(mt((e==null?void 0:e.document_type)??"Factura")),Ke.current&&(Ke.current.value=(e==null?void 0:e.currency)??"PEN"),Qe.current&&(Qe.current.value=(e==null?void 0:e.payment_condition)??"Contado"),Ee.current&&(Ee.current.value=On(e==null?void 0:e.payment_method)),Xe.current&&(Xe.current.value=(e==null?void 0:e.installments)??1),et.current&&(et.current.value=e!=null&&e.first_due_date?e.first_due_date.toString().slice(0,10):""),tt.current&&(tt.current.value=(e==null?void 0:e.order_status)??(e!=null&&e.external_source?"pending":"draft")),rt.current&&(rt.current.value=(e==null?void 0:e.dispatch_status)??"pending"),nt.current&&(nt.current.value=(e==null?void 0:e.billing_status)??"pending"),z.current&&(z.current.value=C(e==null?void 0:e.delivery_address)),xe.current&&(xe.current.value=C(e==null?void 0:e.delivery_reference)),ee.current&&(ee.current.value=C(e==null?void 0:e.ubigeo)),ge.current&&(ge.current.value=C(e==null?void 0:e.dispatch_contact_name)),_e.current&&(_e.current.value=C(e==null?void 0:e.dispatch_contact_phone)),Ye.current&&(Ye.current.value=(e==null?void 0:e.purchase_order)??""),Je.current&&(Je.current.value=(e==null?void 0:e.guide_number)??""),Ze.current&&(Ze.current.value=(e==null?void 0:e.referral_guide)??""),U.current&&(U.current.value=(e==null?void 0:e.doctor_name)??""),it.current&&(it.current.value=(e==null?void 0:e.observations)??""),gt({lat:X({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lat):"",lng:X({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lng):""}),st(C(e==null?void 0:e.delivery_address));const n=e!=null&&e.business_id?`${e.business_id}`:"",c=e!=null&&e.warehouse_id?`${e.warehouse_id}`:"",m=e!=null&&e.client_id?`${e.client_id}`:"",l=e!=null&&e.eventual_client_id?`${e.eventual_client_id}`:"";Ft(n),at(c),bt(m),ht(l),n&&((h=e==null?void 0:e.business)!=null&&h.name)?$e(fe.current,n,e.business.name):J(fe),c&&((j=e==null?void 0:e.warehouse)!=null&&j.name)?$e(oe.current,c,e.warehouse.name):J(oe),m&&((g=e==null?void 0:e.client)!=null&&g.full_name)?$e(f.current,m,`${e.client.document_number??""} - ${e.client.full_name}`.trim()):J(f),l&&((L=e==null?void 0:e.eventual_client)!=null&&L.business_name)?$e(S.current,l,`${e.eventual_client.document_number??""} - ${e.eventual_client.business_name}`.trim()):J(S),e!=null&&e.seller_id&&(e!=null&&e.seller)?$e(q.current,e.seller_id,kn(e.seller)):J(q);const s=((e==null?void 0:e.items)??[]).map(y=>{var ie,ce,ae,se,_,E,Fe,Ae,Pe,Me,Be,Oe,Le,Ge,qe,Ue;const b=y.article??null,ne=((b==null?void 0:b.presentations)??[]).filter(T=>(T==null?void 0:T.status)!==!1&&(T==null?void 0:T.status)!==0),A=y.presentation??ne[0]??null,ue=Number(y.presentation_units??(A==null?void 0:A.units)??1)||1;return pe({uid:crypto.randomUUID(),article_id:y.article_id?`${y.article_id}`:"",article_label:b?`${b.code??""} - ${b.name??""}`.trim():"",article_code:(b==null?void 0:b.code)??y.external_sku??"",article_lot:(b==null?void 0:b.default_lot)??"",article_name:(b==null?void 0:b.name)??"",article_unit:((ie=b==null?void 0:b.unit)==null?void 0:ie.symbol)??((ce=b==null?void 0:b.unit)==null?void 0:ce.name)??"",article_laboratory:((ae=b==null?void 0:b.laboratory)==null?void 0:ae.name)??"",article_principle:((se=b==null?void 0:b.activePrinciple)==null?void 0:se.name)??((_=b==null?void 0:b.active_principle)==null?void 0:_.name)??"",presentations:ne.map(T=>({id:`${T.id}`,name:T.name??"Presentacion",units:Number(T.units||1),price:Number(T.price||0)})),presentation_id:A!=null&&A.id?`${A.id}`:"",presentation_units:ue,stock_available:Number(y.stock_available||0),reserved_quantity:Number(y.reserved_quantity||0),price_unit:Number(y.price_unit||0),quantity:Number(y.quantity||1),discount_type:((Fe=(E=y.external_payload)==null?void 0:E.commercial_form)==null?void 0:Fe.discount_type)??"none",discount_value:Number(((Pe=(Ae=y.external_payload)==null?void 0:Ae.commercial_form)==null?void 0:Pe.discount_value)||0),discount_amount:Number(((Be=(Me=y.external_payload)==null?void 0:Me.commercial_form)==null?void 0:Be.discount_amount)||0),gross_total:Number(((Le=(Oe=y.external_payload)==null?void 0:Oe.commercial_form)==null?void 0:Le.gross_total)||0),total:Number(y.total||0),price_source:y.price_source||"fallback",price_list_code:((qe=(Ge=y==null?void 0:y.price_list_item)==null?void 0:Ge.price_list)==null?void 0:qe.code)||((Ue=e==null?void 0:e.price_list)==null?void 0:Ue.code)||""})}),v=s.length?s:[Ve()];K(v),$(p.current).modal("show"),await qt((e==null?void 0:e.business_id)??null,(e==null?void 0:e.business_branch_id)??null),m?(await zt(m,(e==null?void 0:e.client_distribution_network_id)??null),e!=null&&e.client_distribution_network_id&&await Vt(e.client_distribution_network_id,(e==null?void 0:e.client_delivery_address_id)??null)):(ot([]),De(""),Ne([]),le(""))},Ar=async e=>{var l,s,v,h,j,g,L,y,b,ne,A,ue,ie,ce,ae,se,_,E,Fe,Ae,Pe,Me,Be,Oe,Le,Ge,qe,Ue,T,Xt,er,tr,rr;e.preventDefault();const n={id:((l=G.current)==null?void 0:l.value)||void 0,external_source:i||void 0,business_id:ve||null,business_branch_id:V||null,warehouse_id:W||null,client_id:ye||null,eventual_client_id:je||null,seller_id:((s=q.current)==null?void 0:s.value)||null,client_distribution_network_id:H||null,client_delivery_address_id:Cr||null,document_type:Te,currency:((v=Ke.current)==null?void 0:v.value)||"PEN",payment_condition:Bn(((h=Ee.current)==null?void 0:h.value)||((j=Qe.current)==null?void 0:j.value)||"Contado"),payment_method:((g=Ee.current)==null?void 0:g.value)||"",purchase_order:((y=(L=Ye.current)==null?void 0:L.value)==null?void 0:y.trim())||"",guide_number:((ne=(b=Je.current)==null?void 0:b.value)==null?void 0:ne.trim())||"",referral_guide:((ue=(A=Ze.current)==null?void 0:A.value)==null?void 0:ue.trim())||"",doctor_name:((ce=(ie=U.current)==null?void 0:ie.value)==null?void 0:ce.trim())||"",issue_date:((ae=M.current)==null?void 0:ae.value)||"",promised_delivery_at:((se=be.current)==null?void 0:se.value)||null,installments:((_=Xe.current)==null?void 0:_.value)||1,first_due_date:((E=et.current)==null?void 0:E.value)||null,order_status:((Fe=tt.current)==null?void 0:Fe.value)||(i?"pending":"draft"),dispatch_status:((Ae=rt.current)==null?void 0:Ae.value)||"pending",billing_status:((Pe=nt.current)==null?void 0:Pe.value)||"pending",tax_amount:St.taxAmount,delivery_address:((Be=(Me=z.current)==null?void 0:Me.value)==null?void 0:Be.trim())||"",delivery_reference:((Le=(Oe=xe.current)==null?void 0:Oe.value)==null?void 0:Le.trim())||"",ubigeo:((qe=(Ge=ee.current)==null?void 0:Ge.value)==null?void 0:qe.trim())||"",map_lat:pt(xt.lat)||null,map_lng:pt(xt.lng)||null,dispatch_contact_name:((T=(Ue=ge.current)==null?void 0:Ue.value)==null?void 0:T.trim())||"",dispatch_contact_phone:((er=(Xt=_e.current)==null?void 0:Xt.value)==null?void 0:er.trim())||"",observations:((rr=(tr=it.current)==null?void 0:tr.value)==null?void 0:rr.trim())||"",items:Y.map(F=>({article_id:F.article_id||null,presentation_id:F.presentation_id||null,warehouse_id:W||null,stock_available:F.stock_available,reserved_quantity:F.reserved_quantity,presentation_units:F.presentation_units,price_unit:F.price_unit,quantity:F.quantity,gross_total:F.gross_total,discount_type:F.discount_type,discount_value:F.discount_value,discount_amount:F.discount_amount,total:F.total,status:!0}))},c=Vn(Y,W);if(c.length>0){const F=`
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${c.map(Re=>`<li><strong>${En(Re.article)}</strong>: faltan ${Se(Re.shortage)} unidad(es) base para completar ${Se(Re.quantity)}. Cantidad: ${Se(Re.lineQuantity)} x ${Se(Re.presentationUnits)}. Disponible: ${Se(Re.available)}.</li>`).join("")}
          </ul>
        </div>
      `,{isConfirmed:cn}=await Ce.fire({title:"Stock insuficiente",html:F,icon:"warning",showCancelButton:!0,confirmButtonText:"Crear de todas formas",cancelButtonText:"Revisar pedido"});if(!cn)return;n.allow_stock_shortage=!0}await B.save(n)&&($(d.current).dxDataGrid("instance").refresh(),$(p.current).modal("hide"))},Pr=async e=>{const n=e.target.value||"";Ft(n),at(""),J(oe),await qt(n,null)},Mr=e=>{const n=e.target.value||"";ct(n),at(""),J(oe)},Br=async e=>{const n=e.target.value||"";at(n),await Ct()},Or=async e=>{var m,l;const n=pr(e.target.value),c=((l=(m=$(e.target).select2("data"))==null?void 0:m[0])==null?void 0:l.data)??null;bt(n),Ht("regular"),Ut(c),await zt(n,null,c),await Ct()},Lr=async e=>{const n=pr(e.target.value);ht(n),Ht("eventual"),await Ct()},Gr=async({id:e,field:n,value:c})=>{await B.boolean({id:e,field:n,value:c})&&$(d.current).dxDataGrid("instance").refresh()},qr=e=>{Sr(e),$(I.current).modal("show")},Ur=e=>{const n=hr(e);Er(e),vt(null),yt(xr(n==null?void 0:n.evidence_url)?n.evidence_url:""),Rt({recipient_name:(n==null?void 0:n.recipient_name)??(e==null?void 0:e.dispatch_contact_name)??"",recipient_document_type:(n==null?void 0:n.recipient_document_type)??"DNI",recipient_document_number:(n==null?void 0:n.recipient_document_number)??"",recipient_phone:(n==null?void 0:n.recipient_phone)??(e==null?void 0:e.dispatch_contact_phone)??"",delivered_at:n!=null&&n.delivered_at?`${n.delivered_at}`.replace(" ","T").slice(0,16):gr(),evidence_notes:(n==null?void 0:n.evidence_notes)??"",evidence_url:(n==null?void 0:n.evidence_url)??"",latitude:(n==null?void 0:n.latitude)??"",longitude:(n==null?void 0:n.longitude)??""}),navigator.geolocation&&navigator.geolocation.getCurrentPosition(c=>{Rt(m=>({...m,latitude:m.latitude||c.coords.latitude,longitude:m.longitude||c.coords.longitude}))},()=>{},{enableHighAccuracy:!0,timeout:5e3}),setTimeout(()=>{O.current&&(O.current.value="")},0),$(Q.current).modal("show")},zr=e=>{var c;const n=((c=e.target.files)==null?void 0:c[0])??null;vt(n),yt(n?URL.createObjectURL(n):xr(N.evidence_url)?N.evidence_url:"")},re=(e,n)=>Rt(c=>({...c,[e]:n})),Vr=async e=>{if(e.preventDefault(),!(we!=null&&we.id))return;const n=(we.dispatch_assignments??we.dispatchAssignments??[]).filter(l=>(l==null?void 0:l.status)!==!1&&(l==null?void 0:l.status)!==0&&(l==null?void 0:l.dispatch)).sort((l,s)=>{var v,h;return new Date(((v=s==null?void 0:s.dispatch)==null?void 0:v.scheduled_date)||(s==null?void 0:s.created_at)||0)-new Date(((h=l==null?void 0:l.dispatch)==null?void 0:h.scheduled_date)||(l==null?void 0:l.created_at)||0)})[0],c=new FormData;n!=null&&n.dispatch_id&&c.append("dispatch_id",n.dispatch_id),c.append("recipient_name",N.recipient_name??""),c.append("recipient_document_type",N.recipient_document_type??"DNI"),c.append("recipient_document_number",N.recipient_document_number??""),c.append("recipient_phone",N.recipient_phone??""),c.append("delivered_at",N.delivered_at??""),c.append("evidence_notes",N.evidence_notes??""),c.append("evidence_url",N.evidence_url??""),c.append("latitude",N.latitude??""),c.append("longitude",N.longitude??""),Bt&&c.append("evidence_file",Bt),await B.saveDeliveryEvidence(we.id,c)&&(vt(null),yt(""),O.current&&(O.current.value=""),$(Q.current).modal("hide"),$(d.current).dxDataGrid("instance").refresh())},Wr=async e=>{const n=It(e)[0];if(n){if(Wn(n)){const m=await Ce.fire({title:"Guia de remision",text:`La guia ${jr(n)} esta ${_r(n.guide_status).toLowerCase()}.`,icon:"question",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Ver PDF",cancelButtonText:"Cancelar"});if(m.isConfirmed){const l=await ar.issue(n.id);if(!(l!=null&&l.data))return;$(d.current).dxDataGrid("instance").refresh(),await lt(dt.referralGuide(l.data));return}if(!m.isDenied)return}await lt(dt.referralGuide(n));return}const c=await ar.prepareFromCommercialOrder(e.id);c!=null&&c.data&&($(d.current).dxDataGrid("instance").refresh(),await lt(dt.referralGuide(c.data)))},Hr=async e=>{const{isConfirmed:n}=await Ce.fire({title:"Eliminar pedido comercial",text:"Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!n||!await B.delete(e)||$(d.current).dxDataGrid("instance").refresh()},Kr=()=>{u.current&&(u.current.value=""),$(w.current).modal("show"),setTimeout(()=>{var e;return(e=u.current)==null?void 0:e.focus()},150)},Qr=async e=>{var c,m;e.preventDefault();const n=((m=(c=u.current)==null?void 0:c.value)==null?void 0:m.trim())||"";if(!n){await Ce.fire({title:"CHECK OUT ID requerido",text:"Ingresa el CHECK OUT ID del pedido Multivende.",icon:"warning",confirmButtonText:"Entendido"});return}await Ce.fire({title:"Integracion pendiente",text:`El formulario ya captura el CHECK OUT ID ${n}. Falta conectar el servicio de Multivende para registrar el pedido automaticamente.`,icon:"info",confirmButtonText:"Aceptar"})},Qt=()=>{k.current&&(k.current.value=""),R.current&&(R.current.value=""),D.current&&(D.current.value="1")},Yt=async()=>{Lt(!0);try{const e=await cr.paginate({take:100,skip:0,requireTotalCount:!0,sort:[{selector:"id",desc:!1}]});Dr((e==null?void 0:e.data)??[])}finally{Lt(!1)}},Yr=async()=>{Qt(),Ot(""),$(x.current).modal("show"),await Yt(),setTimeout(()=>{var e;return(e=R.current)==null?void 0:e.focus()},150)},Jr=e=>{var n;k.current&&(k.current.value=(e==null?void 0:e.id)??""),R.current&&(R.current.value=(e==null?void 0:e.description)??""),D.current&&(D.current.value=e!=null&&e.status?"1":"0"),(n=R.current)==null||n.focus()},Zr=async()=>{var c,m,l,s;const e=((m=(c=R.current)==null?void 0:c.value)==null?void 0:m.trim())||"";if(!e){await Ce.fire({title:"Motivo requerido",text:"Ingresa la descripcion del motivo de retraso.",icon:"warning",confirmButtonText:"Entendido"});return}await cr.save({id:((l=k.current)==null?void 0:l.value)||void 0,description:e,status:((s=D.current)==null?void 0:s.value)==="1"})&&(Qt(),await Yt())},Xr=async(e,n)=>{var y,b,ne,A,ue,ie,ce,ae,se;$(n.target).data("select2")&&$(n.target).select2("close");const c=(y=$(n.target).select2("data"))==null?void 0:y[0],m=(c==null?void 0:c.data)??null,l=n.target.value||"";if(!l){K(_=>_.map(E=>E.uid===e?{...Ve(),uid:E.uid}:E));return}const s=m??await B.getArticleById(l),v=((s==null?void 0:s.presentations)??[]).filter(_=>(_==null?void 0:_.status)!==!1&&(_==null?void 0:_.status)!==0),h=v[0]??null,j=s?`${s.code??""} - ${s.name??""}`.trim():(c==null?void 0:c.text)??l,g={article_id:l,article_label:j,article_code:(s==null?void 0:s.code)??"",article_lot:(s==null?void 0:s.default_lot)??"",article_name:(s==null?void 0:s.name)??"",article_unit:((b=s==null?void 0:s.unit)==null?void 0:b.symbol)??((ne=s==null?void 0:s.unit)==null?void 0:ne.name)??"",article_laboratory:((A=s==null?void 0:s.laboratory)==null?void 0:A.name)??"",article_principle:((ue=s==null?void 0:s.activePrinciple)==null?void 0:ue.name)??((ie=s==null?void 0:s.active_principle)==null?void 0:ie.name)??"",presentations:v.map(_=>({id:`${_.id}`,name:_.name??"Presentacion",units:Number(_.units||1),price:Number(_.price||0)})),presentation_id:h?`${h.id}`:"",presentation_units:Number((h==null?void 0:h.units)||1),quantity:1};K(_=>_.map(E=>E.uid===e?pe({...E,...g}):E));const L=await B.resolvePrice({article_id:l,presentation_id:h?`${h.id}`:null,quantity:1,business_id:ve||null,business_branch_id:V||null,warehouse_id:W||null,client_id:ye||null,eventual_client_id:je||null,client_distribution_network_id:H||null,issue_date:((ce=M.current)==null?void 0:ce.value)||null,commercial_channel:((ae=Ie.find(_=>`${_.id}`==`${H}`))==null?void 0:ae.commercial_channel)||null,segment:((se=Ie.find(_=>`${_.id}`==`${H}`))==null?void 0:se.segment)||null});L&&K(_=>_.map(E=>E.uid===e?pe({...E,...g,stock_available:Number(L.stock_available||0),price_unit:Number(L.price_unit||0),price_source:L.source||"fallback",price_list_code:L.price_list_code||""}):E))},$t=async(e,n,c)=>{const m=Y.find(j=>j.uid===e);if(!m)return;const l=n==="presentation_id"?m.presentations.find(j=>`${j.id}`==`${c}`):null,s=pe({...m,[n]:c,...n==="presentation_id"?{presentation_units:Number((l==null?void 0:l.units)||1)}:{}});if(n==="price_unit"&&(s.price_source="manual",s.price_list_code=""),K(j=>j.map(g=>g.uid===e?s:g)),!["quantity","presentation_id"].includes(n))return;const v=s.presentations.find(j=>`${j.id}`==`${n==="presentation_id"?c:s.presentation_id}`),h=await Wt(s,{quantity:n==="quantity"?c:s.quantity,presentation_id:n==="presentation_id"?c:s.presentation_id});h&&K(j=>j.map(g=>g.uid!==e?g:pe({...g,presentation_units:Number((v==null?void 0:v.units)||g.presentation_units||1),stock_available:Number(h.stock_available||0),price_unit:or(g,h,n==="presentation_id"),price_source:lr(g,h,n==="presentation_id"),price_list_code:n==="presentation_id"?h.price_list_code||"":Tt(g)?g.price_list_code:h.price_list_code||""})))},en=(e,n)=>{const c=Number(n||0);K(m=>m.map(l=>l.uid!==e?l:pe({...l,discount_type:c>0?"percent":"none",discount_value:c>0?c:0})))},tn=(e,n)=>{n.preventDefault(),n.stopPropagation();const c=n.currentTarget.getBoundingClientRect();_t(m=>(m==null?void 0:m.uid)===e?null:{uid:e,top:c.bottom+4,left:c.left,width:Math.max(c.width,130)})},Jt=(e,n)=>{en(e,n),_t(null)},rn=()=>K(e=>[...e,Ve()]),nn=e=>{K(n=>{const c=n.filter(m=>m.uid!==e);return c.length?c:[Ve()]})},kt=a.useMemo(()=>Y.reduce((e,n)=>e+Number(n.total||0),0),[Y]),St=a.useMemo(()=>br(kt,Te),[kt,Te]),Zt=a.useMemo(()=>Zn(Mt),[Mt]),Et=a.useMemo(()=>{const e=Nt.trim().toLowerCase();return e?jt.filter(n=>[n.description,n.status?"Activo":"Inactivo",Dt(n.creator),mr(n.created_at)].some(c=>`${c??""}`.toLowerCase().includes(e))):jt},[jt,Nt]);return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:`
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
    `}),t.jsxs("div",{className:"commercial-order-top-actions",children:[t.jsxs("button",{type:"button",className:"btn btn-success commercial-order-multivende-action",title:"Ingresar pedido Multivende por CHECK OUT ID",onClick:Kr,children:[t.jsxs("span",{children:[t.jsx("i",{className:"mdi mdi-plus-circle-outline"})," Ingresar pedido multivende"]}),t.jsx("i",{className:"mdi mdi-calendar-month-outline"})]}),t.jsxs("button",{type:"button",className:"btn commercial-order-delay-action",title:"Abrir mantenedor de motivos de retraso de entrega",onClick:Yr,children:[t.jsx("span",{children:"Mantenedor Retraso Entrega"}),t.jsx("i",{className:"mdi mdi-cog"})]})]}),t.jsx(bn,{gridRef:d,title:o,rest:B,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(d.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"add",title:"Agregar",hint:"Agregar pedido comercial",onClick:()=>Kt(null)}})},pageSize:25,columns:[{caption:"Acciones",width:300,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:n})=>{const c=It(n).length>0;e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),me(e,{variant:"primary",title:"Editar datos, cliente, entrega y productos del pedido comercial",icon:"mdi mdi-pencil",onClick:()=>Kt(n)}),Jn(n)&&me(e,{variant:"success",title:"Enviar este pedido a preparacion para iniciar picking",icon:"mdi mdi-clipboard-check-outline",onClick:()=>Gr({id:n.id,field:"dispatch_status",value:"preparing"})}),me(e,{variant:"info",title:"Ver historial de estados, guia, ruta y entrega del pedido",icon:"mdi mdi-map-marker-path",onClick:()=>qr(n)}),me(e,{variant:c?"dark":"warning",title:c?"Ver, emitir o descargar la guia de remision asociada al pedido":"Generar guia de remision para este pedido",icon:c?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>Wr(n)}),me(e,{variant:"success",title:hr(n)?"Ver o actualizar foto y datos de evidencia de entrega":"Registrar foto y datos de evidencia de entrega",icon:"mdi mdi-camera",onClick:()=>Ur(n)}),me(e,{variant:"danger",title:"Imprimir o descargar PDF resumen del pedido comercial",icon:"mdi mdi-file-pdf-box",onClick:()=>lt(dt.commercialOrder(n))}),me(e,{variant:"danger",title:"Eliminar este pedido comercial del listado",icon:"mdi mdi-delete",onClick:()=>Hr(n.id)})}},{dataField:"order_status",caption:"Estado",width:140,lookup:yn(jn),cellTemplate:(e,{value:n})=>sr(e,n,Nn)},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:Fn},{dataField:"document_type",caption:"Tipo documento",width:130,calculateCellValue:An,cellTemplate:(e,{value:n})=>sr(e,n,c=>c||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:320,calculateCellValue:Pn},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_label",caption:"Tipo de pago",width:170,calculateCellValue:Mn},{dataField:"seller.fullname",caption:"Usuario",width:190,cellTemplate:(e,{data:n})=>e.text(Sn(n.seller))},{dataField:"created_at",caption:"Fecha registro",width:130,dataType:"date"},{dataField:"creator.username",caption:"Usuario registro",width:150,cellTemplate:(e,{data:n})=>e.text(Dt(n.creator))},{dataField:"code",caption:"Código",width:130},{dataField:"business.name",caption:"Empresa",minWidth:150}]}),t.jsx(ze,{modalRef:p,title:wr?"Editar pedido comercial":"Agregar pedido comercial",size:"xl",dialogClass:"commercial-order-modal-dialog modal-dialog-scrollable",bodyClass:"commercial-order-modal-body",bodyStyle:{maxHeight:"calc(100vh - 150px)",overflowY:"auto",overflowX:"hidden"},btnSubmitText:"Guardar",onSubmit:Ar,children:t.jsxs("div",{id:"commercial-orders-form-container",children:[t.jsx("input",{ref:G,type:"hidden"}),t.jsx("input",{ref:P,type:"hidden"}),t.jsx("input",{ref:M,type:"hidden"}),t.jsx("input",{ref:be,type:"hidden"}),t.jsx("input",{ref:Qe,type:"hidden"}),t.jsx("input",{ref:Xe,type:"hidden"}),t.jsx("input",{ref:et,type:"hidden"}),t.jsx("input",{ref:tt,type:"hidden"}),t.jsx("input",{ref:rt,type:"hidden"}),t.jsx("input",{ref:nt,type:"hidden"}),t.jsx("input",{ref:Nr,type:"hidden",value:St.taxAmount,readOnly:!0}),t.jsx("input",{ref:xe,type:"hidden"}),t.jsxs("section",{className:"commercial-order-form-section",children:[t.jsxs("div",{className:"commercial-order-section-title",children:[t.jsx("i",{className:"mdi mdi-file-document"}),t.jsx("span",{children:"Datos del pedido"})]}),t.jsxs("div",{className:"row g-2",children:[t.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:t.jsx(ke,{eRef:fe,label:"Empresa",required:!0,searchAPI:"/api/admin/businesses/paginate",searchBy:"name",dropdownParent:"#commercial-orders-form-container",onChange:Pr})}),t.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:t.jsxs(xn,{eRef:He,label:"Sede",dropdownParent:"#commercial-orders-form-container",value:V,onChange:Mr,children:[t.jsx("option",{value:"",children:"Sin sede"}),kr.map(e=>t.jsx("option",{value:e.id,children:e.name},`commercial-order-branch-${e.id}`))]})}),t.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:t.jsx(ke,{eRef:oe,label:"Almacen",required:!0,searchAPI:"/api/admin/warehouses/paginate",searchBy:"name",filter:Tr,dropdownParent:"#commercial-orders-form-container",onChange:Br,templateResult:fr,templateSelection:fr})}),t.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Doc. venta"}),t.jsxs("select",{ref:he,className:"form-control",value:Te,onChange:e=>Pt(mt(e.target.value)),children:[t.jsx("option",{value:"Factura",children:"Factura"}),t.jsx("option",{value:"Boleta",children:"Boleta"}),t.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),t.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Moneda"}),t.jsxs("select",{ref:Ke,className:"form-control",children:[t.jsx("option",{value:"PEN",children:"PEN"}),t.jsx("option",{value:"USD",children:"USD"}),t.jsx("option",{value:"EUR",children:"EUR"})]})]}),t.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Forma de pago"}),t.jsxs("select",{ref:Ee,className:"form-control",children:[t.jsx("option",{value:"",children:"Seleccione"}),$n.map(e=>t.jsx("option",{value:e,children:e},`commercial-order-payment-${e}`))]})]})]})]}),t.jsxs("section",{className:"commercial-order-form-section",children:[t.jsxs("div",{className:"commercial-order-section-title",children:[t.jsx("i",{className:"mdi mdi-account"}),t.jsx("span",{children:"Cliente y entrega"})]}),t.jsxs("div",{className:"row g-2",children:[t.jsx("div",{className:"col-12 col-xl-6",children:t.jsx(ke,{eRef:f,label:"Cliente regular",searchAPI:"/api/admin/clients/paginate",searchBy:"full_name",selectBy:"entity_id",filter:Rn,dropdownParent:"#commercial-orders-form-container",onChange:Or})}),t.jsx("div",{className:"col-12 col-xl-6",children:t.jsx(ke,{eRef:S,label:"Cliente eventual",searchAPI:"/api/admin/eventual-clients/paginate",searchBy:"business_name",dropdownParent:"#commercial-orders-form-container",onChange:Lr})}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Orden de compra"}),t.jsx("input",{ref:Ye,className:"form-control"})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Numero de guia"}),t.jsx("input",{ref:Je,className:"form-control"})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Guia remision"}),t.jsx("input",{ref:Ze,className:"form-control"})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Ubigeo"}),t.jsx("input",{ref:ee,className:"form-control"})]}),t.jsx("div",{className:"col-12 col-xl-4",children:t.jsx(ir,{eRef:z,label:"Direccion de entrega",rows:2})}),t.jsx("div",{className:"col-12",children:t.jsx(Yn,{modalRef:p,position:xt,searchText:$r,onSearchTextChange:st,onPositionChange:gt,onAddressSelected:e=>{z.current&&(z.current.value=e)}})}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[t.jsx("label",{className:"form-label",children:"Nombre contacto entrega"}),t.jsx("input",{ref:ge,className:"form-control"})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Celular contacto entrega"}),t.jsx("input",{ref:_e,className:"form-control"})]}),t.jsx(ke,{eRef:q,label:"Vendedor",col:"col-12 col-md-6 col-xl-2",searchAPI:"/api/admin/users/paginate",searchBy:"fullname",dropdownParent:"#commercial-orders-form-container"}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Medico"}),t.jsx("input",{ref:U,className:"form-control"})]})]})]}),t.jsxs("section",{className:"commercial-order-form-section",children:[t.jsxs("div",{className:"commercial-order-detail-toolbar",children:[t.jsxs("div",{className:"commercial-order-section-title mb-0",children:[t.jsx("i",{className:"mdi mdi-format-list-bulleted"}),t.jsx("span",{children:"Detalle del pedido"})]}),t.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:rn,children:"Agregar item"})]}),t.jsx("div",{className:"table-responsive border rounded commercial-order-detail-table","data-select2-local-dropdown":"true",children:t.jsxs("table",{className:"table table-sm align-middle mb-0",children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{style:{minWidth:96},children:"Descuento"}),t.jsx("th",{style:{minWidth:104},children:"Codigo"}),t.jsx("th",{style:{minWidth:88},children:"Codigo lote"}),t.jsx("th",{style:{minWidth:280},children:"Nombre"}),t.jsx("th",{style:{minWidth:128},children:"Laboratorio"}),t.jsx("th",{style:{minWidth:130},children:"Principio activo"}),t.jsx("th",{style:{minWidth:110},children:"Unidad"}),t.jsx("th",{style:{minWidth:64},children:"Stock"}),t.jsx("th",{style:{minWidth:112},children:"P. venta con IGV"}),t.jsx("th",{style:{minWidth:112},children:"P. venta sin IGV"}),t.jsx("th",{style:{minWidth:92},children:"Cantidad"}),t.jsx("th",{style:{minWidth:96},children:"Total desc."}),t.jsx("th",{style:{minWidth:96},children:"Sub total"}),t.jsx("th",{style:{width:70}})]})}),t.jsx("tbody",{children:Y.map(e=>t.jsxs("tr",{children:[t.jsx("td",{children:t.jsxs("div",{className:"commercial-order-discount-cell",children:[t.jsxs("button",{type:"button",className:"commercial-order-discount-trigger",onClick:n=>tn(e.uid,n),children:[t.jsx("span",{children:e.discount_type==="percent"&&Number(e.discount_value||0)>0?`${Number(e.discount_value)}%`:"Seleccione"}),t.jsx("i",{className:"mdi mdi-chevron-down"})]}),(te==null?void 0:te.uid)===e.uid&&t.jsxs("div",{className:"commercial-order-discount-menu",style:{top:te.top,left:te.left,minWidth:te.width},onClick:n=>n.stopPropagation(),children:[t.jsx("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type!=="percent"?"active":""}`,onClick:()=>Jt(e.uid,""),children:"Seleccione"}),Cn.map(n=>t.jsxs("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type==="percent"&&Number(e.discount_value||0)===n?"active":""}`,onClick:()=>Jt(e.uid,n),children:[n,"%"]},`commercial-order-discount-floating-${e.uid}-${n}`))]})]})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_code||"-"})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_lot||"-"})}),t.jsx("td",{className:"commercial-order-article-name",children:t.jsx(ke,{eRef:Gt(e.uid),searchAPI:Ir,searchBy:"name",dropdownParent:"#commercial-orders-form-container",disabled:!W,onChange:n=>Xr(e.uid,n)})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_laboratory||"-"})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_principle||"-"})}),t.jsx("td",{children:t.jsxs("div",{children:[t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_unit||"-"}),e.presentations.length>0&&t.jsxs("select",{className:"form-control mt-1","data-no-select2":"true",value:e.presentation_id,disabled:!e.article_id,onChange:n=>$t(e.uid,"presentation_id",n.target.value),children:[t.jsx("option",{value:"",children:qn(e)}),e.presentations.map(n=>t.jsx("option",{value:n.id,children:Un(n,e)},`commercial-order-presentation-${e.uid}-${n.id}`))]})]})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:Number(e.stock_available||0).toFixed(2)})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:e.price_unit,onFocus:ur,onChange:n=>$t(e.uid,"price_unit",dr(n))})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:br(Number(e.price_unit||0),Te).subtotal.toFixed(2),readOnly:!0})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0.01",className:"form-control",value:e.quantity,onFocus:ur,onChange:n=>$t(e.uid,"quantity",dr(n))})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.discount_amount||0).toFixed(2),readOnly:!0})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.total||0).toFixed(2),readOnly:!0})}),t.jsx("td",{className:"text-end",children:t.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>nn(e.uid),children:t.jsx("i",{className:"mdi mdi-close"})})})]},e.uid))}),t.jsxs("tfoot",{children:[t.jsxs("tr",{children:[t.jsx("th",{colSpan:"12",className:"text-end",children:"Sub total"}),t.jsx("th",{children:kt.toFixed(2)}),t.jsx("th",{})]}),t.jsxs("tr",{children:[t.jsx("th",{colSpan:"12",className:"text-end",children:"Descuento global"}),t.jsx("th",{children:"0.00"}),t.jsx("th",{})]}),t.jsxs("tr",{children:[t.jsx("th",{colSpan:"12",className:"text-end",children:"Total"}),t.jsx("th",{children:St.total.toFixed(2)}),t.jsx("th",{})]})]})]})})]}),t.jsxs("section",{className:"commercial-order-form-section mb-0",children:[t.jsxs("div",{className:"commercial-order-section-title",children:[t.jsx("i",{className:"mdi mdi-note-text"}),t.jsx("span",{children:"Observaciones"})]}),t.jsx(ir,{eRef:it,label:"Observaciones",rows:3})]})]})}),t.jsx(ze,{modalRef:w,title:t.jsxs(t.Fragment,{children:[t.jsx("i",{className:"mdi mdi-plus-circle-outline"})," Ingresar pedido multivende"]}),size:"lg",headerClass:"commercial-order-modal-header-primary",closeButtonClass:"btn-close-white",btnSubmitText:"Registrar",onSubmit:Qr,children:t.jsx("div",{className:"commercial-order-multivende-form",children:t.jsxs("section",{className:"commercial-order-form-section",children:[t.jsxs("div",{className:"commercial-order-section-title",children:[t.jsx("i",{className:"mdi mdi-file-document-plus-outline"}),t.jsx("span",{children:"General"})]}),t.jsxs("div",{className:"mb-2",children:[t.jsxs("label",{className:"form-label",children:["Ingrese el ",t.jsx("strong",{children:"CHECK OUT ID"})]}),t.jsx("input",{ref:u,name:"external_checkout_id",className:"form-control",autoComplete:"off"})]})]})})}),t.jsx(ze,{modalRef:x,title:t.jsxs(t.Fragment,{children:[t.jsx("i",{className:"mdi mdi-menu"})," Mantenedor motivo retraso entrega"]}),size:"lg",headerClass:"commercial-order-modal-header-primary",closeButtonClass:"btn-close-white",hideFooter:!0,onSubmit:e=>{e.preventDefault(),Zr()},children:t.jsxs("div",{className:"commercial-order-delay-maintainer",children:[t.jsxs("div",{className:"commercial-order-delay-actions",children:[t.jsxs("button",{type:"button",className:"btn btn-sm btn-light","data-bs-dismiss":"modal",children:[t.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]}),t.jsxs("button",{type:"submit",className:"btn btn-sm btn-outline-primary",children:[t.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]})]}),t.jsx("input",{ref:k,type:"hidden"}),t.jsxs("div",{className:"row",children:[t.jsxs("div",{className:"col-12 mb-3",children:[t.jsx("label",{className:"form-label",children:"Descripcion:"}),t.jsx("input",{ref:R,className:"form-control",autoComplete:"off"})]}),t.jsxs("div",{className:"col-12 mb-3",children:[t.jsx("label",{className:"form-label",children:"Estado:"}),t.jsxs("select",{ref:D,className:"form-control",defaultValue:"1",children:[t.jsx("option",{value:"1",children:"Activo"}),t.jsx("option",{value:"0",children:"Inactivo"})]})]})]}),t.jsx("hr",{}),t.jsxs("div",{className:"commercial-order-delay-filter",children:[t.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),t.jsx("input",{className:"form-control form-control-sm",value:Nt,onChange:e=>Ot(e.target.value)})]}),t.jsx("div",{className:"table-responsive commercial-order-delay-table",children:t.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{className:"text-center",children:"Acciones"}),t.jsx("th",{className:"text-center",children:"Estado"}),t.jsx("th",{children:"Motivo"}),t.jsx("th",{children:"Fecha registro"}),t.jsx("th",{children:"Usuario registro"})]})}),t.jsxs("tbody",{children:[wt&&t.jsx("tr",{children:t.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"Cargando motivos..."})}),!wt&&Et.length===0&&t.jsx("tr",{children:t.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"No existen elementos"})}),!wt&&Et.map(e=>t.jsxs("tr",{children:[t.jsx("td",{className:"text-center",children:t.jsx("button",{type:"button",className:"btn btn-xs btn-outline-info",title:"Editar motivo de retraso",onClick:()=>Jr(e),children:t.jsx("i",{className:"mdi mdi-pencil"})})}),t.jsx("td",{className:"text-center",children:t.jsx("span",{className:vr(e.status?"billed":"cancelled"),children:e.status?"Activo":"Inactivo"})}),t.jsx("td",{children:e.description}),t.jsx("td",{children:mr(e.created_at)}),t.jsx("td",{children:Dt(e.creator)})]},`delivery-delay-reason-${e.id}`))]})]})}),t.jsxs("div",{className:"commercial-order-delay-summary",children:[Et.length," elementos (Pagina 1 de 1)"]})]})}),t.jsx(ze,{modalRef:I,title:"Tracking del pedido",size:"lg",hideButtonSubmit:!0,children:t.jsx("div",{className:"table-responsive",children:t.jsxs("table",{className:"table table-sm align-middle mb-0",children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{children:"Fecha"}),t.jsx("th",{children:"Estado"})]})}),t.jsxs("tbody",{children:[Zt.length===0&&t.jsx("tr",{children:t.jsx("td",{colSpan:"2",className:"text-muted text-center py-3",children:"Sin eventos registrados."})}),Zt.map((e,n)=>t.jsxs("tr",{children:[t.jsx("td",{children:new Date(e.date).toLocaleString("es-PE")}),t.jsx("td",{children:e.status})]},`commercial-order-tracking-${n}`))]})]})})}),t.jsx(ze,{modalRef:Q,title:"Evidencia de entrega",size:"lg",btnSubmitText:"Registrar",onSubmit:Vr,children:t.jsxs("div",{className:"row",children:[t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Recibido por"}),t.jsx("input",{className:"form-control",value:N.recipient_name,onChange:e=>re("recipient_name",e.target.value)})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Tipo doc."}),t.jsxs("select",{className:"form-control",value:N.recipient_document_type,onChange:e=>re("recipient_document_type",e.target.value),children:[t.jsx("option",{value:"DNI",children:"DNI"}),t.jsx("option",{value:"RUC",children:"RUC"}),t.jsx("option",{value:"CE",children:"CE"}),t.jsx("option",{value:"OTRO",children:"Otro"})]})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Numero"}),t.jsx("input",{className:"form-control",value:N.recipient_document_number,onChange:e=>re("recipient_document_number",e.target.value)})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Telefono"}),t.jsx("input",{className:"form-control",value:N.recipient_phone,onChange:e=>re("recipient_phone",e.target.value)})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Fecha y hora entrega"}),t.jsx("input",{type:"datetime-local",className:"form-control",value:N.delivered_at,onChange:e=>re("delivered_at",e.target.value)})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Foto / evidencia"}),t.jsx("input",{ref:O,className:"form-control",type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",capture:"environment",onChange:zr})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Latitud"}),t.jsx("input",{className:"form-control",value:N.latitude,onChange:e=>re("latitude",e.target.value)})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Longitud"}),t.jsx("input",{className:"form-control",value:N.longitude,onChange:e=>re("longitude",e.target.value)})]}),t.jsxs("div",{className:"col-12 mb-3",children:[t.jsx("label",{className:"form-label",children:"Observaciones"}),t.jsx("textarea",{className:"form-control",rows:"3",value:N.evidence_notes,onChange:e=>re("evidence_notes",e.target.value)})]}),t.jsx("div",{className:"col-12",children:t.jsx("div",{className:"border rounded p-3",children:de?t.jsx("img",{src:de,alt:"Evidencia de entrega",className:"img-fluid rounded border bg-light",style:{maxHeight:360,width:"100%",objectFit:"contain"}}):N.evidence_url?t.jsx("a",{href:N.evidence_url,target:"_blank",rel:"noreferrer",children:"Abrir evidencia registrada"}):t.jsx("div",{className:"text-muted py-4 text-center",children:"Sin evidencia registrada"})})})]})})]})};on((r,i)=>{!i.can("orders")&&!i.hasRole("Admin")&&(location.href="/admin/"),ln(r).render(t.jsx(fn,{...i,title:i.pageTitle||"Pedidos comerciales",children:t.jsx(Xn,{...i})}))});
