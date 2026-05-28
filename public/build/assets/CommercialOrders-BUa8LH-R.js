import{C as Pr,c as Or,j as t,r as s,S as Nt,G as Mr}from"./CreateReactScript-DQLVjp0V.js";import{L as Br,G as Lr,M as Gr}from"./esm-BhZAXbGk.js";import{B as qr}from"./Base-DpZFB5sy.js";import{T as zr}from"./Table-DUfi_WfN.js";import{M as wt}from"./Modal-CAfsOhZN.js";import{R as Rt}from"./ReactAppend-DIHzhAcr.js";import{S as Ur}from"./SwitchFormGroup-BGd4U0oE.js";import{a as Re,S as ke}from"./SetSelectValue-DfDyTYyl.js";import{S as Wr}from"./SelectFormGroup-CC2pGrXt.js";import{T as Qt}from"./TextareaFormGroup-CdYAyehd.js";import{C as Vr}from"./CommercialOrdersRest-DKg4Dgc7.js";import{R as Hr}from"./ReferralGuidesRest-DPUoCWFG.js";import{r as Kr}from"./renderGridEditLink-D8NGEeKJ.js";import{o as rt,b as nt}from"./magistralesRecordPdf-Drw1vFH8.js";import{t as it,i as Qr,j as Xr,k as Yr,p as Jr,l as sr,m as Zr,n as en,o as tn,g as rn}from"./statusLabels-BJ32pkWe.js";import"./BasicRest-EXKW_n5g.js";import"./tippy-react.esm-DZzWNIYv.js";import"./ubigeoInei-D0FnAslC.js";const O=new Vr,Xt=new Hr,nn=["client_kind","=","regular"],cn=[1,2,3,4,5],sn=["EFECTIVO [CONTADO]","TRANSFERENCIA [CONTADO]","YAPE [CONTADO]","PLIN [CONTADO]","TARJETA [CONTADO]","TRANSFERENCIA [CREDITO]"],fe=(n,{variant:i,title:m,icon:d,onClick:p})=>{const w=$('<button type="button"></button>').addClass(`btn btn-xs btn-soft-${i} commercial-order-action-btn`).attr("title",m).attr("aria-label",m).append($("<i></i>").addClass(d)).on("click",u=>{u.preventDefault(),u.stopPropagation(),p()});n.append(w)},on=n=>`commercial-order-status-badge commercial-order-status-${`${n??"empty"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-")||"empty"}`,ze=(n,i,m)=>{n.addClass("commercial-order-status-cell"),Rt(n,t.jsx("span",{className:on(i),children:m(i)}))},Ue=()=>({uid:crypto.randomUUID(),article_id:"",article_label:"",article_code:"",article_lot:"",article_name:"",article_unit:"",article_laboratory:"",article_principle:"",presentations:[],presentation_id:"",presentation_units:1,stock_available:0,reserved_quantity:0,price_unit:0,quantity:1,gross_total:0,discount_type:"none",discount_value:0,discount_amount:0,total:0,price_source:"fallback",price_list_code:""}),Ct=n=>{if(!n)return"";const i=(n.name??"").toString().trim().split(" ")[0]??"",m=(n.lastname??"").toString().trim().split(" ")[0]??"",d=`${i} ${m}`.trim(),p=(n.username??"").toString().trim();return d&&p?`${d} (@${p})`:d||(p?`@${p}`:"")},We=n=>Number(Number(n||0).toFixed(2)),an=n=>$("<div>").text(n??"").html(),Se=n=>{const i=Number(Number(n||0).toFixed(3));return Number.isInteger(i)?`${i}`:`${i}`.replace(/\.?0+$/,"")},St=n=>(n==null?void 0:n.price_source)==="manual",Yt=(n,i,m=!1)=>{const d=Number((n==null?void 0:n.price_unit)||0),p=Number(i==null?void 0:i.price_unit);return!m&&St(n)||!Number.isFinite(p)||!m&&p<=0&&d>0?d:p},Jt=(n,i,m=!1)=>!m&&St(n)?"manual":(i==null?void 0:i.source)||(n==null?void 0:n.price_source)||"fallback",ln=n=>{const i=`${n??""}`.replace(",",".").replace(/[^\d.]/g,"");if(!i)return"";const[m,...d]=i.split("."),p=m.replace(/^0+(?=\d)/,"")||(m||d.length?"0":""),w=d.length?`.${d.join("")}`:"";return`${p}${w}`},Zt=n=>{const i=ln(n.target.value);return n.target.value!==i&&(n.target.value=i),Number(i||0)},er=n=>{Number(n.target.value||0)===0&&n.target.select()},dn=(n,i,m)=>{const d=We(n),p=Number(m||0);return!Number.isFinite(p)||p<=0||d<=0?0:i==="percent"?Math.min(d,We(d*Math.min(p,100)/100)):i==="amount"?Math.min(d,We(p)):0},be=n=>{const i=Number(n.quantity||0),m=Number(n.price_unit||0),d=Number.isFinite(i*m)?We(i*m):0,p=dn(d,n.discount_type,n.discount_value);return{...n,discount_type:n.discount_type||"none",discount_value:n.discount_type==="none"?0:Number(n.discount_value||0),gross_total:d,discount_amount:p,total:We(Math.max(0,d-p))}},st=n=>{const i=`${n??""}`.trim().toLowerCase();return i==="boleta"?"Boleta":["nota de pedido","nota_pedido","note_order"].includes(i)?"Nota de pedido":"Factura"},C=(n,i="")=>{if(n==null)return i;if(typeof n=="object")return n.address??n.reference??n.name??n.description??i;const m=`${n}`;return m==="[object Object]"?i:m},un=n=>`${n??""}`.toUpperCase().includes("CREDITO")?"Credito":"Contado",mn=n=>{const i=`${n??""}`.trim();return i?i.toUpperCase()==="TRANSFERENCIA"?"TRANSFERENCIA [CONTADO]":i:"EFECTIVO [CONTADO]"},pn=n=>C(n==null?void 0:n.full_address,C(n==null?void 0:n.address,C(n==null?void 0:n.fiscal_address))),fn=n=>C(n==null?void 0:n.ubigeo,C(n==null?void 0:n.district_ubigeo,C(n==null?void 0:n.inei_ubigeo))),tr=n=>{const i=`${n??""}`.trim(),m=i.match(/^(client|eventual)-(\d+)$/);return m?m[2]:i},rr=n=>{var u,h,S;if(n.loading)return n.text;const i=n.data??{},m=n.text||i.name||"",d=(u=i.branch)==null?void 0:u.name,p=(S=(h=i.branch)==null?void 0:h.business)==null?void 0:S.name,w=$("<span>").text(m);return d&&w.append($("<small>").addClass("text-muted ms-1").text(`- ${d}`)),p&&w.append($("<small>").addClass("text-muted ms-1").text(`(${p})`)),w},J=n=>{if(!(n!=null&&n.current))return;const i=$(n.current);i.empty().val(null),i.trigger(i.data("select2")?"change.select2":"change")},bn=n=>n.article_id?"Unidad base":"Sin presentacion",hn=(n,i)=>{const m=(n==null?void 0:n.name)||"Presentacion",d=Se((n==null?void 0:n.units)||1),p=i!=null&&i.article_unit?` ${i.article_unit}`:" unidad(es) base";return`${m} (${d}${p})`},_n=n=>["Factura","Boleta"].includes(st(n)),nr=(n,i)=>{const m=Number(n||0);if(!_n(i))return{subtotal:Number(m.toFixed(2)),taxAmount:0,total:Number(m.toFixed(2))};const d=Number((m/1.18).toFixed(2));return{subtotal:d,taxAmount:Number((m-d).toFixed(2)),total:Number(m.toFixed(2))}},gn=(n,i="")=>{const m=new Map;return(n??[]).flatMap(d=>{if(!(d!=null&&d.article_id))return[];const p=`${d.article_id}:${d.warehouse_id||i||""}`,w=Number(d.quantity||0),u=Number(d.presentation_units||1)||1,h=Number((w*u).toFixed(3)),S=Number(d.stock_available||0),I=Number(m.get(p)||0),P=Math.max(0,S-I),E=Math.min(h,P),M=Math.max(0,h-E);return m.set(p,I+E),M<=1e-4?[]:[{article:d.article_name||d.article_label||d.article_code||"Articulo",quantity:h,lineQuantity:w,presentationUnits:u,available:P,shortage:M}]})},ot=n=>(n==null?void 0:n.referral_guides)??(n==null?void 0:n.referralGuides)??[],kt=n=>(n==null?void 0:n.external_reference)||[n==null?void 0:n.series,n==null?void 0:n.sequence].filter(Boolean).join("-")||(n==null?void 0:n.code)||"-",xn=n=>n&&!["accepted","cancelled"].includes(n.guide_status),vn=n=>(n==null?void 0:n.delivery_evidences)??(n==null?void 0:n.deliveryEvidences)??[],$t=n=>vn(n)[0]??null,yn=n=>(n==null?void 0:n.tracking_events)??(n==null?void 0:n.trackingEvents)??[],ir=n=>{const i=`${n??""}`.trim();return i.startsWith("blob:")||i.startsWith("data:image/")||/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(i)||i.includes("/delivery-evidence-media/")},cr=()=>{const n=new Date;return n.setMinutes(n.getMinutes()-n.getTimezoneOffset()),n.toISOString().slice(0,16)},ct={lat:-12.046374,lng:-77.042793},Z=n=>{const i=Number(n);return Number.isFinite(i)?i:null},at=n=>{const i=Z(n);return i===null?"":i.toFixed(7)},ee=n=>Z(n==null?void 0:n.lat)!==null&&Z(n==null?void 0:n.lng)!==null,jn=({modalRef:n,position:i,searchText:m,onPositionChange:d,onSearchTextChange:p,onAddressSelected:w,googleMapsApiKey:u})=>{const h=s.useRef(),[S,I]=s.useState(!1),[P,E]=s.useState(""),[M,q]=s.useState([]),z=ee(i)?{lat:Z(i.lat),lng:Z(i.lng)}:ct,T=(f,R=17)=>{const U=Z(f==null?void 0:f.lat),L=Z(f==null?void 0:f.lng);U===null||L===null||!h.current||(h.current.setCenter({lat:U,lng:L}),h.current.setZoom(R))},de=f=>{d(f),T(f)};s.useEffect(()=>{if(ee(i)){T(z);return}T(ct,13)},[i==null?void 0:i.lat,i==null?void 0:i.lng]),s.useEffect(()=>{const f=n==null?void 0:n.current;if(!f)return;const R=()=>{setTimeout(()=>{ee(i)?T(z):T(ct,13)},180)};return $(f).on("shown.bs.modal",R),()=>$(f).off("shown.bs.modal",R)},[n,i==null?void 0:i.lat,i==null?void 0:i.lng]);const B=async()=>{var R,U;const f=`${m??""}`.trim();if(!f){q([]),E("Escribe una direccion para buscar.");return}if(!((U=(R=window.google)==null?void 0:R.maps)!=null&&U.Geocoder)){E("Google Maps aun no termino de cargar.");return}I(!0),E("");try{new window.google.maps.Geocoder().geocode({address:`${f}, Peru`,componentRestrictions:{country:"PE"},region:"PE"},(te,_e)=>{if(I(!1),_e!=="OK"||!Array.isArray(te)||te.length===0){q([]),E("Sin resultados. Puedes marcar el punto manualmente en el mapa.");return}q(te.slice(0,5).map(X=>({place_id:X.place_id,display_name:X.formatted_address,lat:X.geometry.location.lat(),lng:X.geometry.location.lng()})))})}catch(L){I(!1),E(`${L.message}. Puedes marcar el punto manualmente en el mapa.`),q([])}},he=f=>{const R={lat:Z(f.lat),lng:Z(f.lng)};d(R),p(f.display_name??""),w(f.display_name??""),T(R),q([])};return t.jsxs("div",{className:"commercial-order-map-picker",children:[t.jsxs("div",{className:"commercial-order-map-search",children:[t.jsxs("div",{children:[t.jsx("label",{className:"form-label",children:"Buscar direccion en mapa"}),t.jsxs("div",{className:"input-group",children:[t.jsx("input",{type:"text",className:"form-control",value:m,onChange:f=>p(f.target.value),onKeyDown:f=>{f.key==="Enter"&&(f.preventDefault(),B())},placeholder:"Ej. Av. Javier Prado 123, San Isidro"}),t.jsx("button",{type:"button",className:"btn btn-outline-primary",onClick:B,disabled:S,children:S?"Buscando...":"Buscar"})]})]}),t.jsxs("div",{className:"commercial-order-map-coordinates",children:[t.jsx("label",{className:"form-label",children:"Coordenadas"}),t.jsxs("div",{className:"commercial-order-map-coordinate-values",children:[t.jsx("span",{children:at(i==null?void 0:i.lat)||"-"}),t.jsx("span",{children:at(i==null?void 0:i.lng)||"-"})]})]})]}),M.length>0&&t.jsx("div",{className:"commercial-order-map-results",children:M.map(f=>t.jsx("button",{type:"button",className:"commercial-order-map-result",onClick:()=>he(f),children:f.display_name},`${f.place_id}-${f.lat}-${f.lng}`))}),P&&t.jsx("small",{className:"text-muted d-block mt-1",children:P}),t.jsx(Br,{googleMapsApiKey:u,language:"es",region:"PE",onError:()=>E("No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio."),children:t.jsx(Lr,{mapContainerClassName:"commercial-order-map-canvas",center:z,zoom:ee(i)?17:13,options:{clickableIcons:!0,fullscreenControl:!0,gestureHandling:"greedy",mapTypeControl:!0,scrollwheel:!0,streetViewControl:!1},onLoad:f=>{h.current=f,setTimeout(()=>{ee(i)?T(z):T(ct,13)},120)},onClick:f=>{const R={lat:f.latLng.lat(),lng:f.latLng.lng()};de(R)},children:ee(i)&&t.jsx(Gr,{position:z,draggable:!0,onDragEnd:f=>de({lat:f.latLng.lat(),lng:f.latLng.lng()})})})}),t.jsx("small",{className:"text-muted d-block mt-2",children:"Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega."})]})},Nn=n=>{const i=`${Mr.GMAPS_API_KEY??""}`.trim();return i?t.jsx(jn,{...n,googleMapsApiKey:i}):t.jsx("div",{className:"commercial-order-map-picker",children:t.jsx("div",{className:"commercial-order-map-empty",children:"Configura Google Maps API Key en Sistemas > Datos generales > Integraciones para habilitar el mapa."})})},wn=n=>!n||n.status===null||`${n.order_status??""}`=="cancelled"?!1:`${n.dispatch_status??"pending"}`=="pending",Cn=n=>{if(!n)return[];const i=yn(n).map(u=>({date:u.happened_at??u.created_at,status:[u.title,u.description].filter(Boolean).join(" - ")})),m=[{date:n.created_at,status:"La orden ingreso en el sistema"}];n.approved_at&&["preparing","in_route","delivered","dispatched","billed","closed"].includes(n.order_status)?m.push({date:n.approved_at,status:"La orden paso a preparacion"}):n.approved_at&&n.order_status==="confirmed"?m.push({date:n.approved_at,status:"La orden fue confirmada"}):["preparing","in_route","delivered","dispatched","billed","closed"].includes(n.order_status)&&m.push({date:n.updated_at,status:"La orden paso a preparacion"});const d=(n.dispatch_assignments??n.dispatchAssignments??[]).filter(u=>(u==null?void 0:u.status)!==!1&&(u==null?void 0:u.status)!==0&&(u==null?void 0:u.dispatch)).sort((u,h)=>{var S,I,P,E;return new Date(((S=u==null?void 0:u.dispatch)==null?void 0:S.departed_at)||((I=u==null?void 0:u.dispatch)==null?void 0:I.scheduled_date)||0)-new Date(((P=h==null?void 0:h.dispatch)==null?void 0:P.departed_at)||((E=h==null?void 0:h.dispatch)==null?void 0:E.scheduled_date)||0)}),p=d.find(u=>{var h;return["in_route","delivered","closed"].includes((h=u==null?void 0:u.dispatch)==null?void 0:h.dispatch_status)});p?(m.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:`Manifiesto ${p.dispatch.manifest_code||p.dispatch.code||""}`.trim()}),m.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:"El pedido salio en ruta"})):n.dispatch_status==="in_route"&&m.push({date:n.updated_at,status:"El pedido salio en ruta"}),(n.dispatch_status==="dispatched"||d.some(u=>{var h;return((h=u==null?void 0:u.dispatch)==null?void 0:h.dispatch_status)==="dispatched"}))&&m.push({date:n.updated_at,status:"El pedido paso a despacho"}),ot(n).forEach(u=>{m.push({date:u.issue_date??u.created_at??n.updated_at,status:`Guia de remision ${kt(u)} - ${sr(u.guide_status)}`})});const w=d.find(u=>{var h;return["delivered","closed"].includes((h=u==null?void 0:u.dispatch)==null?void 0:h.dispatch_status)});return w?m.push({date:w.dispatch.delivered_at??w.dispatch.updated_at??w.dispatch.created_at,status:"El pedido fue entregado"}):n.dispatch_status==="delivered"&&m.push({date:n.updated_at,status:"El pedido fue entregado"}),(n.order_status==="cancelled"||n.dispatch_status==="cancelled")&&m.push({date:n.updated_at,status:"El pedido fue cancelado"}),[...i,...m].filter(u=>u.date).sort((u,h)=>new Date(u.date)-new Date(h.date))},$n=({requiredPermission:n="orders",externalSource:i=null,pageTitle:m="Pedidos comerciales"})=>{O.externalSource=i||null;const d=s.useRef(),p=s.useRef(),w=s.useRef(),u=s.useRef(),h=s.useRef(),S=s.useRef(),I=s.useRef(),P=s.useRef(),E=s.useRef(),M=s.useRef(),q=s.useRef(),z=s.useRef(),T=s.useRef(),de=s.useRef(),B=s.useRef(),he=s.useRef(),f=s.useRef(),R=s.useRef(),U=s.useRef(),L=s.useRef(),te=s.useRef(),_e=s.useRef(),X=s.useRef(),Ve=s.useRef(),He=s.useRef(),Ke=s.useRef(),Qe=s.useRef(),Xe=s.useRef(),or=s.useRef(),W=s.useRef(),ge=s.useRef(),re=s.useRef(),xe=s.useRef(),ve=s.useRef(),Ye=s.useRef(),lt=s.useRef({}),[ar,lr]=s.useState(!1),[ye,Et]=s.useState(""),[V,Je]=s.useState(""),[H,Ze]=s.useState(""),[je,dt]=s.useState(""),[Ne,ut]=s.useState(""),[K,Ee]=s.useState(""),[dr,ue]=s.useState(""),[mt,pt]=s.useState({lat:"",lng:""}),[ur,et]=s.useState(""),[mr,Ft]=s.useState([]),[Fe,tt]=s.useState([]),[Rn,we]=s.useState([]),[Y,Q]=s.useState([Ue()]),[De,Dt]=s.useState("Factura"),[ne,ft]=s.useState(null),[It,pr]=s.useState(null),[Ce,fr]=s.useState(null),[Tt,bt]=s.useState(null),[me,ht]=s.useState(""),[N,_t]=s.useState({recipient_name:"",recipient_document_type:"DNI",recipient_document_number:"",recipient_phone:"",delivered_at:cr(),evidence_notes:"",evidence_url:"",latitude:"",longitude:""}),br=s.useMemo(()=>{var r;const e=new URLSearchParams;return ye&&e.append("business_id",ye),V&&e.append("business_branch_id",V),H&&e.append("warehouse_id",H),je&&e.append("client_id",je),Ne&&e.append("eventual_client_id",Ne),K&&e.append("client_distribution_network_id",K),(r=B.current)!=null&&r.value&&e.append("issue_date",B.current.value),`/api/admin/commercial-orders/articles?${e.toString()}`},[ye,V,H,je,Ne,K]),hr=s.useMemo(()=>V?["business_branch_id","=",Number(V)]:null,[V]);s.useEffect(()=>()=>{me!=null&&me.startsWith("blob:")&&URL.revokeObjectURL(me)},[me]),s.useEffect(()=>{if(!ne)return;const e=()=>ft(null),r=c=>{c.key==="Escape"&&e()};return document.addEventListener("click",e),document.addEventListener("keydown",r),window.addEventListener("resize",e),window.addEventListener("scroll",e,!0),()=>{document.removeEventListener("click",e),document.removeEventListener("keydown",r),window.removeEventListener("resize",e),window.removeEventListener("scroll",e,!0)}},[ne]);const At=e=>(lt.current[e]||(lt.current[e]=s.createRef()),lt.current[e]);s.useEffect(()=>{Y.forEach(e=>{const r=At(e.uid);!r.current||!e.article_id||!e.article_label||`${$(r.current).val()}`==`${e.article_id}`||Re(r.current,e.article_id,e.article_label)})},[Y]);const Pt=async(e,r=null)=>{if(!e){Ft([]),Je("");return}const l=(await O.getBranchesByBusiness(e)??[]).filter(a=>a.status!==null);if(Ft(l),r&&l.some(a=>`${a.id}`==`${r}`)){Je(`${r}`);return}Je("")},Ot=e=>{if(!e)return;const r=pn(e),c=fn(e);r&&W.current&&(W.current.value=r),c&&re.current&&(re.current.value=c),r&&et(r)},Mt=async(e,r=null,c=null)=>{var v;if(!e){tt([]),Ee(""),we([]),ue("");return}const a=(await O.getDistributionNetworks(e)??[]).filter(_=>_.status!==null);tt(a);const o=r||((v=a.find(_=>_.is_default))==null?void 0:v.id);if(o&&a.some(_=>`${_.id}`==`${o}`)){Ee(`${o}`),await Bt(o,null,a);return}Ee(""),we([]),ue(""),Ot(c)},Bt=async(e,r=null,c=null)=>{var _,j;if(!e){we([]),ue("");return}let l=[];const a=(c??Fe).find(g=>`${g.id}`==`${e}`);(((_=a==null?void 0:a.addresses)==null?void 0:_.length)??0)>0?l=a.addresses:l=await O.getDeliveryAddresses(e);const o=(l??[]).filter(g=>g.status!==null);we(o);const v=r||((j=o.find(g=>g.is_default))==null?void 0:j.id);if(v&&o.some(g=>`${g.id}`==`${v}`)){ue(`${v}`),_r(o.find(g=>`${g.id}`==`${v}`));return}ue("")},_r=e=>{e&&(W.current&&(W.current.value=C(e.address)),ge.current&&(ge.current.value=C(e.reference)),re.current&&(re.current.value=C(e.ubigeo)),xe.current&&(xe.current.value=C(e.contact_name)),ve.current&&(ve.current.value=C(e.contact_phone)),et(C(e.address)),ee({lat:e.latitude,lng:e.longitude})&&pt({lat:Number(e.latitude),lng:Number(e.longitude)}))},Lt=async(e,r={})=>{var o,v,_;const c=r.article_id??e.article_id,l=Number(r.quantity??e.quantity??0),a=r.presentation_id??e.presentation_id;return!c||!H||l<=0?null:await O.resolvePrice({article_id:c,presentation_id:a||null,quantity:l,business_id:ye||null,business_branch_id:V||null,warehouse_id:H||null,client_id:je||null,eventual_client_id:Ne||null,client_distribution_network_id:K||null,issue_date:((o=B.current)==null?void 0:o.value)||null,commercial_channel:((v=Fe.find(j=>`${j.id}`==`${K}`))==null?void 0:v.commercial_channel)||null,segment:((_=Fe.find(j=>`${j.id}`==`${K}`))==null?void 0:_.segment)||null})},gt=async(e=null)=>{const r=e??Y;for(const c of r){if(!c.article_id)continue;const l=await Lt(c);l&&Q(a=>a.map(o=>o.uid!==c.uid?o:be({...o,stock_available:Number(l.stock_available||0),price_unit:Yt(o,l),price_source:Jt(o,l),price_list_code:l.price_list_code||""})))}},Gt=e=>{e==="regular"?(ut(""),J(z)):e==="eventual"&&(dt(""),tt([]),Ee(""),we([]),ue(""),J(q))},xt=async(e=null)=>{var _,j,g,G;lr(!!(e!=null&&e.id)),S.current&&(S.current.value=(e==null?void 0:e.id)??""),I.current&&(I.current.value=(e==null?void 0:e.code)??"Se genera al guardar"),B.current&&(B.current.value=e!=null&&e.issue_date?e.issue_date.toString().slice(0,10):new Date().toISOString().slice(0,10)),he.current&&(he.current.value=e!=null&&e.promised_delivery_at?e.promised_delivery_at.toString().slice(0,10):""),Dt(st((e==null?void 0:e.document_type)??"Factura")),R.current&&(R.current.value=(e==null?void 0:e.currency)??"PEN"),U.current&&(U.current.value=(e==null?void 0:e.payment_condition)??"Contado"),L.current&&(L.current.value=mn(e==null?void 0:e.payment_method)),Ve.current&&(Ve.current.value=(e==null?void 0:e.installments)??1),He.current&&(He.current.value=e!=null&&e.first_due_date?e.first_due_date.toString().slice(0,10):""),Ke.current&&(Ke.current.value=(e==null?void 0:e.order_status)??(e!=null&&e.external_source?"pending":"draft")),Qe.current&&(Qe.current.value=(e==null?void 0:e.dispatch_status)??"pending"),Xe.current&&(Xe.current.value=(e==null?void 0:e.billing_status)??"pending"),W.current&&(W.current.value=C(e==null?void 0:e.delivery_address)),ge.current&&(ge.current.value=C(e==null?void 0:e.delivery_reference)),re.current&&(re.current.value=C(e==null?void 0:e.ubigeo)),xe.current&&(xe.current.value=C(e==null?void 0:e.dispatch_contact_name)),ve.current&&(ve.current.value=C(e==null?void 0:e.dispatch_contact_phone)),te.current&&(te.current.value=(e==null?void 0:e.purchase_order)??""),_e.current&&(_e.current.value=(e==null?void 0:e.guide_number)??""),X.current&&(X.current.value=(e==null?void 0:e.referral_guide)??""),de.current&&(de.current.value=(e==null?void 0:e.doctor_name)??""),Ye.current&&(Ye.current.value=(e==null?void 0:e.observations)??""),pt({lat:ee({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lat):"",lng:ee({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lng):""}),et(C(e==null?void 0:e.delivery_address));const r=e!=null&&e.business_id?`${e.business_id}`:"",c=e!=null&&e.warehouse_id?`${e.warehouse_id}`:"",l=e!=null&&e.client_id?`${e.client_id}`:"",a=e!=null&&e.eventual_client_id?`${e.eventual_client_id}`:"";Et(r),Ze(c),dt(l),ut(a),r&&((_=e==null?void 0:e.business)!=null&&_.name)?Re(P.current,r,e.business.name):J(P),c&&((j=e==null?void 0:e.warehouse)!=null&&j.name)?Re(M.current,c,e.warehouse.name):J(M),l&&((g=e==null?void 0:e.client)!=null&&g.full_name)?Re(q.current,l,`${e.client.document_number??""} - ${e.client.full_name}`.trim()):J(q),a&&((G=e==null?void 0:e.eventual_client)!=null&&G.business_name)?Re(z.current,a,`${e.eventual_client.document_number??""} - ${e.eventual_client.business_name}`.trim()):J(z),e!=null&&e.seller_id&&(e!=null&&e.seller)?Re(T.current,e.seller_id,Ct(e.seller)):J(T);const o=((e==null?void 0:e.items)??[]).map(y=>{var se,oe,ae,le,x,k,Ie,Te,Ae,Pe,Oe,Me,Be,Le,Ge,qe;const b=y.article??null,ce=((b==null?void 0:b.presentations)??[]).filter(F=>(F==null?void 0:F.status)!==!1&&(F==null?void 0:F.status)!==0),A=y.presentation??ce[0]??null,pe=Number(y.presentation_units??(A==null?void 0:A.units)??1)||1;return be({uid:crypto.randomUUID(),article_id:y.article_id?`${y.article_id}`:"",article_label:b?`${b.code??""} - ${b.name??""}`.trim():"",article_code:(b==null?void 0:b.code)??y.external_sku??"",article_lot:(b==null?void 0:b.default_lot)??"",article_name:(b==null?void 0:b.name)??"",article_unit:((se=b==null?void 0:b.unit)==null?void 0:se.symbol)??((oe=b==null?void 0:b.unit)==null?void 0:oe.name)??"",article_laboratory:((ae=b==null?void 0:b.laboratory)==null?void 0:ae.name)??"",article_principle:((le=b==null?void 0:b.activePrinciple)==null?void 0:le.name)??((x=b==null?void 0:b.active_principle)==null?void 0:x.name)??"",presentations:ce.map(F=>({id:`${F.id}`,name:F.name??"Presentacion",units:Number(F.units||1),price:Number(F.price||0)})),presentation_id:A!=null&&A.id?`${A.id}`:"",presentation_units:pe,stock_available:Number(y.stock_available||0),reserved_quantity:Number(y.reserved_quantity||0),price_unit:Number(y.price_unit||0),quantity:Number(y.quantity||1),discount_type:((Ie=(k=y.external_payload)==null?void 0:k.commercial_form)==null?void 0:Ie.discount_type)??"none",discount_value:Number(((Ae=(Te=y.external_payload)==null?void 0:Te.commercial_form)==null?void 0:Ae.discount_value)||0),discount_amount:Number(((Oe=(Pe=y.external_payload)==null?void 0:Pe.commercial_form)==null?void 0:Oe.discount_amount)||0),gross_total:Number(((Be=(Me=y.external_payload)==null?void 0:Me.commercial_form)==null?void 0:Be.gross_total)||0),total:Number(y.total||0),price_source:y.price_source||"fallback",price_list_code:((Ge=(Le=y==null?void 0:y.price_list_item)==null?void 0:Le.price_list)==null?void 0:Ge.code)||((qe=e==null?void 0:e.price_list)==null?void 0:qe.code)||""})}),v=o.length?o:[Ue()];Q(v),$(p.current).modal("show"),await Pt((e==null?void 0:e.business_id)??null,(e==null?void 0:e.business_branch_id)??null),l?(await Mt(l,(e==null?void 0:e.client_distribution_network_id)??null),e!=null&&e.client_distribution_network_id&&await Bt(e.client_distribution_network_id,(e==null?void 0:e.client_delivery_address_id)??null)):(tt([]),Ee(""),we([]),ue(""))},gr=async e=>{var a,o,v,_,j,g,G,y,b,ce,A,pe,se,oe,ae,le,x,k,Ie,Te,Ae,Pe,Oe,Me,Be,Le,Ge,qe,F,Wt,Vt,Ht,Kt;e.preventDefault();const r={id:((a=S.current)==null?void 0:a.value)||void 0,external_source:i||void 0,business_id:ye||null,business_branch_id:V||null,warehouse_id:H||null,client_id:je||null,eventual_client_id:Ne||null,seller_id:((o=T.current)==null?void 0:o.value)||null,client_distribution_network_id:K||null,client_delivery_address_id:dr||null,document_type:De,currency:((v=R.current)==null?void 0:v.value)||"PEN",payment_condition:un(((_=L.current)==null?void 0:_.value)||((j=U.current)==null?void 0:j.value)||"Contado"),payment_method:((g=L.current)==null?void 0:g.value)||"",purchase_order:((y=(G=te.current)==null?void 0:G.value)==null?void 0:y.trim())||"",guide_number:((ce=(b=_e.current)==null?void 0:b.value)==null?void 0:ce.trim())||"",referral_guide:((pe=(A=X.current)==null?void 0:A.value)==null?void 0:pe.trim())||"",doctor_name:((oe=(se=de.current)==null?void 0:se.value)==null?void 0:oe.trim())||"",issue_date:((ae=B.current)==null?void 0:ae.value)||"",promised_delivery_at:((le=he.current)==null?void 0:le.value)||null,installments:((x=Ve.current)==null?void 0:x.value)||1,first_due_date:((k=He.current)==null?void 0:k.value)||null,order_status:((Ie=Ke.current)==null?void 0:Ie.value)||(i?"pending":"draft"),dispatch_status:((Te=Qe.current)==null?void 0:Te.value)||"pending",billing_status:((Ae=Xe.current)==null?void 0:Ae.value)||"pending",tax_amount:jt.taxAmount,delivery_address:((Oe=(Pe=W.current)==null?void 0:Pe.value)==null?void 0:Oe.trim())||"",delivery_reference:((Be=(Me=ge.current)==null?void 0:Me.value)==null?void 0:Be.trim())||"",ubigeo:((Ge=(Le=re.current)==null?void 0:Le.value)==null?void 0:Ge.trim())||"",map_lat:at(mt.lat)||null,map_lng:at(mt.lng)||null,dispatch_contact_name:((F=(qe=xe.current)==null?void 0:qe.value)==null?void 0:F.trim())||"",dispatch_contact_phone:((Vt=(Wt=ve.current)==null?void 0:Wt.value)==null?void 0:Vt.trim())||"",observations:((Kt=(Ht=Ye.current)==null?void 0:Ht.value)==null?void 0:Kt.trim())||"",items:Y.map(D=>({article_id:D.article_id||null,presentation_id:D.presentation_id||null,warehouse_id:H||null,stock_available:D.stock_available,reserved_quantity:D.reserved_quantity,presentation_units:D.presentation_units,price_unit:D.price_unit,quantity:D.quantity,gross_total:D.gross_total,discount_type:D.discount_type,discount_value:D.discount_value,discount_amount:D.discount_amount,total:D.total,status:!0}))},c=gn(Y,H);if(c.length>0){const D=`
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${c.map($e=>`<li><strong>${an($e.article)}</strong>: faltan ${Se($e.shortage)} unidad(es) base para completar ${Se($e.quantity)}. Cantidad: ${Se($e.lineQuantity)} x ${Se($e.presentationUnits)}. Disponible: ${Se($e.available)}.</li>`).join("")}
          </ul>
        </div>
      `,{isConfirmed:Ar}=await Nt.fire({title:"Stock insuficiente",html:D,icon:"warning",showCancelButton:!0,confirmButtonText:"Crear de todas formas",cancelButtonText:"Revisar pedido"});if(!Ar)return;r.allow_stock_shortage=!0}await O.save(r)&&($(d.current).dxDataGrid("instance").refresh(),$(p.current).modal("hide"))},xr=async e=>{const r=e.target.value||"";Et(r),Ze(""),J(M),await Pt(r,null)},vr=e=>{const r=e.target.value||"";Je(r),Ze(""),J(M)},yr=async e=>{const r=e.target.value||"";Ze(r),await gt()},jr=async e=>{var l,a;const r=tr(e.target.value),c=((a=(l=$(e.target).select2("data"))==null?void 0:l[0])==null?void 0:a.data)??null;dt(r),Gt("regular"),Ot(c),await Mt(r,null,c),await gt()},Nr=async e=>{const r=tr(e.target.value);ut(r),Gt("eventual"),await gt()},qt=async({id:e,field:r,value:c})=>{await O.boolean({id:e,field:r,value:c})&&$(d.current).dxDataGrid("instance").refresh()},wr=e=>{pr(e),$(w.current).modal("show")},Cr=e=>{const r=$t(e);fr(e),bt(null),ht(ir(r==null?void 0:r.evidence_url)?r.evidence_url:""),_t({recipient_name:(r==null?void 0:r.recipient_name)??(e==null?void 0:e.dispatch_contact_name)??"",recipient_document_type:(r==null?void 0:r.recipient_document_type)??"DNI",recipient_document_number:(r==null?void 0:r.recipient_document_number)??"",recipient_phone:(r==null?void 0:r.recipient_phone)??(e==null?void 0:e.dispatch_contact_phone)??"",delivered_at:r!=null&&r.delivered_at?`${r.delivered_at}`.replace(" ","T").slice(0,16):cr(),evidence_notes:(r==null?void 0:r.evidence_notes)??"",evidence_url:(r==null?void 0:r.evidence_url)??"",latitude:(r==null?void 0:r.latitude)??"",longitude:(r==null?void 0:r.longitude)??""}),navigator.geolocation&&navigator.geolocation.getCurrentPosition(c=>{_t(l=>({...l,latitude:l.latitude||c.coords.latitude,longitude:l.longitude||c.coords.longitude}))},()=>{},{enableHighAccuracy:!0,timeout:5e3}),setTimeout(()=>{h.current&&(h.current.value="")},0),$(u.current).modal("show")},$r=e=>{var c;const r=((c=e.target.files)==null?void 0:c[0])??null;bt(r),ht(r?URL.createObjectURL(r):ir(N.evidence_url)?N.evidence_url:"")},ie=(e,r)=>_t(c=>({...c,[e]:r})),Rr=async e=>{if(e.preventDefault(),!(Ce!=null&&Ce.id))return;const r=(Ce.dispatch_assignments??Ce.dispatchAssignments??[]).filter(a=>(a==null?void 0:a.status)!==!1&&(a==null?void 0:a.status)!==0&&(a==null?void 0:a.dispatch)).sort((a,o)=>{var v,_;return new Date(((v=o==null?void 0:o.dispatch)==null?void 0:v.scheduled_date)||(o==null?void 0:o.created_at)||0)-new Date(((_=a==null?void 0:a.dispatch)==null?void 0:_.scheduled_date)||(a==null?void 0:a.created_at)||0)})[0],c=new FormData;r!=null&&r.dispatch_id&&c.append("dispatch_id",r.dispatch_id),c.append("recipient_name",N.recipient_name??""),c.append("recipient_document_type",N.recipient_document_type??"DNI"),c.append("recipient_document_number",N.recipient_document_number??""),c.append("recipient_phone",N.recipient_phone??""),c.append("delivered_at",N.delivered_at??""),c.append("evidence_notes",N.evidence_notes??""),c.append("evidence_url",N.evidence_url??""),c.append("latitude",N.latitude??""),c.append("longitude",N.longitude??""),Tt&&c.append("evidence_file",Tt),await O.saveDeliveryEvidence(Ce.id,c)&&(bt(null),ht(""),h.current&&(h.current.value=""),$(u.current).modal("hide"),$(d.current).dxDataGrid("instance").refresh())},kr=async e=>{const r=ot(e)[0];if(r){if(xn(r)){const l=await Nt.fire({title:"Guia de remision",text:`La guia ${kt(r)} esta ${sr(r.guide_status).toLowerCase()}.`,icon:"question",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Ver PDF",cancelButtonText:"Cancelar"});if(l.isConfirmed){const a=await Xt.issue(r.id);if(!(a!=null&&a.data))return;$(d.current).dxDataGrid("instance").refresh(),await rt(nt.referralGuide(a.data));return}if(!l.isDenied)return}await rt(nt.referralGuide(r));return}const c=await Xt.prepareFromCommercialOrder(e.id);c!=null&&c.data&&($(d.current).dxDataGrid("instance").refresh(),await rt(nt.referralGuide(c.data)))},Sr=async e=>{const{isConfirmed:r}=await Nt.fire({title:"Eliminar pedido comercial",text:"Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!r||!await O.delete(e)||$(d.current).dxDataGrid("instance").refresh()},Er=async(e,r)=>{var y,b,ce,A,pe,se,oe,ae,le;$(r.target).data("select2")&&$(r.target).select2("close");const c=(y=$(r.target).select2("data"))==null?void 0:y[0],l=(c==null?void 0:c.data)??null,a=r.target.value||"";if(!a){Q(x=>x.map(k=>k.uid===e?{...Ue(),uid:k.uid}:k));return}const o=l??await O.getArticleById(a),v=((o==null?void 0:o.presentations)??[]).filter(x=>(x==null?void 0:x.status)!==!1&&(x==null?void 0:x.status)!==0),_=v[0]??null,j=o?`${o.code??""} - ${o.name??""}`.trim():(c==null?void 0:c.text)??a,g={article_id:a,article_label:j,article_code:(o==null?void 0:o.code)??"",article_lot:(o==null?void 0:o.default_lot)??"",article_name:(o==null?void 0:o.name)??"",article_unit:((b=o==null?void 0:o.unit)==null?void 0:b.symbol)??((ce=o==null?void 0:o.unit)==null?void 0:ce.name)??"",article_laboratory:((A=o==null?void 0:o.laboratory)==null?void 0:A.name)??"",article_principle:((pe=o==null?void 0:o.activePrinciple)==null?void 0:pe.name)??((se=o==null?void 0:o.active_principle)==null?void 0:se.name)??"",presentations:v.map(x=>({id:`${x.id}`,name:x.name??"Presentacion",units:Number(x.units||1),price:Number(x.price||0)})),presentation_id:_?`${_.id}`:"",presentation_units:Number((_==null?void 0:_.units)||1),quantity:1};Q(x=>x.map(k=>k.uid===e?be({...k,...g}):k));const G=await O.resolvePrice({article_id:a,presentation_id:_?`${_.id}`:null,quantity:1,business_id:ye||null,business_branch_id:V||null,warehouse_id:H||null,client_id:je||null,eventual_client_id:Ne||null,client_distribution_network_id:K||null,issue_date:((oe=B.current)==null?void 0:oe.value)||null,commercial_channel:((ae=Fe.find(x=>`${x.id}`==`${K}`))==null?void 0:ae.commercial_channel)||null,segment:((le=Fe.find(x=>`${x.id}`==`${K}`))==null?void 0:le.segment)||null});G&&Q(x=>x.map(k=>k.uid===e?be({...k,...g,stock_available:Number(G.stock_available||0),price_unit:Number(G.price_unit||0),price_source:G.source||"fallback",price_list_code:G.price_list_code||""}):k))},vt=async(e,r,c)=>{const l=Y.find(j=>j.uid===e);if(!l)return;const a=r==="presentation_id"?l.presentations.find(j=>`${j.id}`==`${c}`):null,o=be({...l,[r]:c,...r==="presentation_id"?{presentation_units:Number((a==null?void 0:a.units)||1)}:{}});if(r==="price_unit"&&(o.price_source="manual",o.price_list_code=""),Q(j=>j.map(g=>g.uid===e?o:g)),!["quantity","presentation_id"].includes(r))return;const v=o.presentations.find(j=>`${j.id}`==`${r==="presentation_id"?c:o.presentation_id}`),_=await Lt(o,{quantity:r==="quantity"?c:o.quantity,presentation_id:r==="presentation_id"?c:o.presentation_id});_&&Q(j=>j.map(g=>g.uid!==e?g:be({...g,presentation_units:Number((v==null?void 0:v.units)||g.presentation_units||1),stock_available:Number(_.stock_available||0),price_unit:Yt(g,_,r==="presentation_id"),price_source:Jt(g,_,r==="presentation_id"),price_list_code:r==="presentation_id"?_.price_list_code||"":St(g)?g.price_list_code:_.price_list_code||""})))},Fr=(e,r)=>{const c=Number(r||0);Q(l=>l.map(a=>a.uid!==e?a:be({...a,discount_type:c>0?"percent":"none",discount_value:c>0?c:0})))},Dr=(e,r)=>{r.preventDefault(),r.stopPropagation();const c=r.currentTarget.getBoundingClientRect();ft(l=>(l==null?void 0:l.uid)===e?null:{uid:e,top:c.bottom+4,left:c.left,width:Math.max(c.width,130)})},zt=(e,r)=>{Fr(e,r),ft(null)},Ir=()=>Q(e=>[...e,Ue()]),Tr=e=>{Q(r=>{const c=r.filter(l=>l.uid!==e);return c.length?c:[Ue()]})},yt=s.useMemo(()=>Y.reduce((e,r)=>e+Number(r.total||0),0),[Y]),jt=s.useMemo(()=>nr(yt,De),[yt,De]),Ut=s.useMemo(()=>Cn(It),[It]);return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:`
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
      }
    `}),t.jsx(zr,{gridRef:d,title:m,rest:O,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(d.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"add",title:"Agregar",hint:"Agregar pedido comercial",onClick:()=>xt(null)}})},pageSize:25,columns:[{dataField:"id",caption:"ID",width:80},{dataField:"code",caption:"Codigo",width:170,cellTemplate:(e,{data:r})=>Kr(e,r==null?void 0:r.code,()=>xt(r),"Editar pedido")},{dataField:"external_source",caption:"Origen externo",visible:!1,showInColumnChooser:!1},{dataField:"external_order_id",caption:"Pedido VTEX",width:150,visible:!!i},{dataField:"external_ecommerce",caption:"Ecommerce",width:140,visible:!!i},{dataField:"external_channel",caption:"Canal",width:130,visible:!!i},{dataField:"external_subservice",caption:"Subservicio",width:130,visible:!!i},{dataField:"external_sync_status",caption:"Sync",width:110,visible:!!i},{dataField:"issue_date",caption:"F. emision",width:110,dataType:"date"},{dataField:"promised_delivery_at",caption:"F. entrega",width:110,dataType:"date"},{dataField:"business.name",caption:"Empresa",minWidth:140},{dataField:"warehouse.name",caption:"Almacen",minWidth:120},{dataField:"customer",caption:"Cliente",minWidth:240,calculateCellValue:e=>{var r,c;return((r=e.client)==null?void 0:r.full_name)??((c=e.eventual_client)==null?void 0:c.business_name)??"-"}},{dataField:"distribution_network_name",caption:"Red",minWidth:160,calculateCellValue:e=>{var r,c;return((r=e.distribution_network)==null?void 0:r.name)??((c=e.distributionNetwork)==null?void 0:c.name)??"-"}},{dataField:"order_status",caption:"Estado comercial",width:140,lookup:it(Qr),cellTemplate:(e,{value:r})=>ze(e,r,Zr)},{dataField:"dispatch_status",caption:"Estado entrega",width:140,lookup:it(Xr),cellTemplate:(e,{value:r})=>ze(e,r,en)},{dataField:"billing_status",caption:"Facturacion",width:110,lookup:it(Yr),cellTemplate:(e,{value:r})=>ze(e,r,tn)},{dataField:"payment_status",caption:"Cobranza",width:110,lookup:it(Jr),cellTemplate:(e,{value:r})=>ze(e,r,rn)},{dataField:"document_type",caption:"Doc. venta",width:120,calculateCellValue:e=>st(e==null?void 0:e.document_type),cellTemplate:(e,{value:r})=>ze(e,r,c=>c||"-")},{caption:"Guia",width:140,calculateCellValue:e=>{const r=ot(e);return r.length===0?"-":r.length===1?kt(r[0]):`${r.length} guias`}},{caption:"Evidencia",width:150,calculateCellValue:e=>{const r=$t(e);return r?r.recipient_name||r.code||"Registrada":"-"}},{dataField:"currency",caption:"Moneda",width:90},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"accounts_receivable_code",caption:"CXC",width:140,calculateCellValue:e=>{var r,c;return((r=e.accounts_receivable)==null?void 0:r.code)??((c=e.accountsReceivable)==null?void 0:c.code)??"-"}},{dataField:"items.id",caption:"Detalle",minWidth:280,allowFiltering:!1,cellTemplate:(e,{data:r})=>{const c=((r==null?void 0:r.items)??[]).map(l=>{var a;return`${((a=l==null?void 0:l.article)==null?void 0:a.name)||"Articulo"} | Cant. ${Number((l==null?void 0:l.quantity)||0).toFixed(2)} | ${r.currency} ${Number((l==null?void 0:l.total)||0).toFixed(2)}`});Rt(e,t.jsxs("div",{children:[c.length===0&&t.jsx("small",{className:"text-muted",children:"Sin detalle"}),c.map((l,a)=>t.jsx("div",{children:t.jsx("small",{children:l})},`commercial-order-${r.id}-${a}`))]}))}},{dataField:"creator.fullname",caption:"Creado por",visible:!1,cellTemplate:(e,{data:r})=>e.text(Ct(r.creator))},{dataField:"updater.fullname",caption:"Actualizado por",visible:!1,cellTemplate:(e,{data:r})=>e.text(Ct(r.updater))},{dataField:"status",caption:"Activo",dataType:"boolean",width:95,cellTemplate:(e,{data:r})=>{$(e).empty(),r.status!==null&&Rt(e,t.jsx(Ur,{checked:r.status==1,onChange:()=>qt({id:r.id,field:"status",value:!r.status})}))}},{caption:"Acciones",width:360,fixed:!0,fixedPosition:"right",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:r})=>{const c=ot(r).length>0;e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),fe(e,{variant:"primary",title:"Editar datos, cliente, entrega y productos del pedido comercial",icon:"mdi mdi-pencil",onClick:()=>xt(r)}),wn(r)&&fe(e,{variant:"success",title:"Enviar este pedido a preparacion para iniciar picking",icon:"mdi mdi-clipboard-check-outline",onClick:()=>qt({id:r.id,field:"dispatch_status",value:"preparing"})}),fe(e,{variant:"info",title:"Ver historial de estados, guia, ruta y entrega del pedido",icon:"mdi mdi-map-marker-path",onClick:()=>wr(r)}),fe(e,{variant:c?"dark":"warning",title:c?"Ver, emitir o descargar la guia de remision asociada al pedido":"Generar guia de remision para este pedido",icon:c?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>kr(r)}),fe(e,{variant:"success",title:$t(r)?"Ver o actualizar foto y datos de evidencia de entrega":"Registrar foto y datos de evidencia de entrega",icon:"mdi mdi-camera",onClick:()=>Cr(r)}),fe(e,{variant:"danger",title:"Imprimir o descargar PDF resumen del pedido comercial",icon:"mdi mdi-file-pdf-box",onClick:()=>rt(nt.commercialOrder(r))}),fe(e,{variant:"danger",title:"Eliminar este pedido comercial del listado",icon:"mdi mdi-delete",onClick:()=>Sr(r.id)})}}]}),t.jsx(wt,{modalRef:p,title:ar?"Editar pedido comercial":"Agregar pedido comercial",size:"xl",dialogClass:"commercial-order-modal-dialog modal-dialog-scrollable",bodyClass:"commercial-order-modal-body",bodyStyle:{maxHeight:"calc(100vh - 150px)",overflowY:"auto",overflowX:"hidden"},btnSubmitText:"Guardar",onSubmit:gr,children:t.jsxs("div",{id:"commercial-orders-form-container",children:[t.jsx("input",{ref:S,type:"hidden"}),t.jsx("input",{ref:I,type:"hidden"}),t.jsx("input",{ref:B,type:"hidden"}),t.jsx("input",{ref:he,type:"hidden"}),t.jsx("input",{ref:U,type:"hidden"}),t.jsx("input",{ref:Ve,type:"hidden"}),t.jsx("input",{ref:He,type:"hidden"}),t.jsx("input",{ref:Ke,type:"hidden"}),t.jsx("input",{ref:Qe,type:"hidden"}),t.jsx("input",{ref:Xe,type:"hidden"}),t.jsx("input",{ref:or,type:"hidden",value:jt.taxAmount,readOnly:!0}),t.jsx("input",{ref:ge,type:"hidden"}),t.jsxs("section",{className:"commercial-order-form-section",children:[t.jsxs("div",{className:"commercial-order-section-title",children:[t.jsx("i",{className:"mdi mdi-file-document"}),t.jsx("span",{children:"Datos del pedido"})]}),t.jsxs("div",{className:"row g-2",children:[t.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:t.jsx(ke,{eRef:P,label:"Empresa",required:!0,searchAPI:"/api/admin/businesses/paginate",searchBy:"name",dropdownParent:"#commercial-orders-form-container",onChange:xr})}),t.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:t.jsxs(Wr,{eRef:E,label:"Sede",dropdownParent:"#commercial-orders-form-container",value:V,onChange:vr,children:[t.jsx("option",{value:"",children:"Sin sede"}),mr.map(e=>t.jsx("option",{value:e.id,children:e.name},`commercial-order-branch-${e.id}`))]})}),t.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:t.jsx(ke,{eRef:M,label:"Almacen",required:!0,searchAPI:"/api/admin/warehouses/paginate",searchBy:"name",filter:hr,dropdownParent:"#commercial-orders-form-container",onChange:yr,templateResult:rr,templateSelection:rr})}),t.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Doc. venta"}),t.jsxs("select",{ref:f,className:"form-control",value:De,onChange:e=>Dt(st(e.target.value)),children:[t.jsx("option",{value:"Factura",children:"Factura"}),t.jsx("option",{value:"Boleta",children:"Boleta"}),t.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),t.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Moneda"}),t.jsxs("select",{ref:R,className:"form-control",children:[t.jsx("option",{value:"PEN",children:"PEN"}),t.jsx("option",{value:"USD",children:"USD"}),t.jsx("option",{value:"EUR",children:"EUR"})]})]}),t.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Forma de pago"}),t.jsxs("select",{ref:L,className:"form-control",children:[t.jsx("option",{value:"",children:"Seleccione"}),sn.map(e=>t.jsx("option",{value:e,children:e},`commercial-order-payment-${e}`))]})]})]})]}),t.jsxs("section",{className:"commercial-order-form-section",children:[t.jsxs("div",{className:"commercial-order-section-title",children:[t.jsx("i",{className:"mdi mdi-account"}),t.jsx("span",{children:"Cliente y entrega"})]}),t.jsxs("div",{className:"row g-2",children:[t.jsx("div",{className:"col-12 col-xl-6",children:t.jsx(ke,{eRef:q,label:"Cliente regular",searchAPI:"/api/admin/clients/paginate",searchBy:"full_name",selectBy:"entity_id",filter:nn,dropdownParent:"#commercial-orders-form-container",onChange:jr})}),t.jsx("div",{className:"col-12 col-xl-6",children:t.jsx(ke,{eRef:z,label:"Cliente eventual",searchAPI:"/api/admin/eventual-clients/paginate",searchBy:"business_name",dropdownParent:"#commercial-orders-form-container",onChange:Nr})}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Orden de compra"}),t.jsx("input",{ref:te,className:"form-control"})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Numero de guia"}),t.jsx("input",{ref:_e,className:"form-control"})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Guia remision"}),t.jsx("input",{ref:X,className:"form-control"})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Ubigeo"}),t.jsx("input",{ref:re,className:"form-control"})]}),t.jsx("div",{className:"col-12 col-xl-4",children:t.jsx(Qt,{eRef:W,label:"Direccion de entrega",rows:2})}),t.jsx("div",{className:"col-12",children:t.jsx(Nn,{modalRef:p,position:mt,searchText:ur,onSearchTextChange:et,onPositionChange:pt,onAddressSelected:e=>{W.current&&(W.current.value=e)}})}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[t.jsx("label",{className:"form-label",children:"Nombre contacto entrega"}),t.jsx("input",{ref:xe,className:"form-control"})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Celular contacto entrega"}),t.jsx("input",{ref:ve,className:"form-control"})]}),t.jsx(ke,{eRef:T,label:"Vendedor",col:"col-12 col-md-6 col-xl-2",searchAPI:"/api/admin/users/paginate",searchBy:"fullname",dropdownParent:"#commercial-orders-form-container"}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Medico"}),t.jsx("input",{ref:de,className:"form-control"})]})]})]}),t.jsxs("section",{className:"commercial-order-form-section",children:[t.jsxs("div",{className:"commercial-order-detail-toolbar",children:[t.jsxs("div",{className:"commercial-order-section-title mb-0",children:[t.jsx("i",{className:"mdi mdi-format-list-bulleted"}),t.jsx("span",{children:"Detalle del pedido"})]}),t.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:Ir,children:"Agregar item"})]}),t.jsx("div",{className:"table-responsive border rounded commercial-order-detail-table","data-select2-local-dropdown":"true",children:t.jsxs("table",{className:"table table-sm align-middle mb-0",children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{style:{minWidth:96},children:"Descuento"}),t.jsx("th",{style:{minWidth:104},children:"Codigo"}),t.jsx("th",{style:{minWidth:88},children:"Codigo lote"}),t.jsx("th",{style:{minWidth:280},children:"Nombre"}),t.jsx("th",{style:{minWidth:128},children:"Laboratorio"}),t.jsx("th",{style:{minWidth:130},children:"Principio activo"}),t.jsx("th",{style:{minWidth:110},children:"Unidad"}),t.jsx("th",{style:{minWidth:64},children:"Stock"}),t.jsx("th",{style:{minWidth:112},children:"P. venta con IGV"}),t.jsx("th",{style:{minWidth:112},children:"P. venta sin IGV"}),t.jsx("th",{style:{minWidth:92},children:"Cantidad"}),t.jsx("th",{style:{minWidth:96},children:"Total desc."}),t.jsx("th",{style:{minWidth:96},children:"Sub total"}),t.jsx("th",{style:{width:70}})]})}),t.jsx("tbody",{children:Y.map(e=>t.jsxs("tr",{children:[t.jsx("td",{children:t.jsxs("div",{className:"commercial-order-discount-cell",children:[t.jsxs("button",{type:"button",className:"commercial-order-discount-trigger",onClick:r=>Dr(e.uid,r),children:[t.jsx("span",{children:e.discount_type==="percent"&&Number(e.discount_value||0)>0?`${Number(e.discount_value)}%`:"Seleccione"}),t.jsx("i",{className:"mdi mdi-chevron-down"})]}),(ne==null?void 0:ne.uid)===e.uid&&t.jsxs("div",{className:"commercial-order-discount-menu",style:{top:ne.top,left:ne.left,minWidth:ne.width},onClick:r=>r.stopPropagation(),children:[t.jsx("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type!=="percent"?"active":""}`,onClick:()=>zt(e.uid,""),children:"Seleccione"}),cn.map(r=>t.jsxs("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type==="percent"&&Number(e.discount_value||0)===r?"active":""}`,onClick:()=>zt(e.uid,r),children:[r,"%"]},`commercial-order-discount-floating-${e.uid}-${r}`))]})]})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_code||"-"})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_lot||"-"})}),t.jsx("td",{className:"commercial-order-article-name",children:t.jsx(ke,{eRef:At(e.uid),searchAPI:br,searchBy:"name",dropdownParent:"#commercial-orders-form-container",disabled:!H,onChange:r=>Er(e.uid,r)})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_laboratory||"-"})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_principle||"-"})}),t.jsx("td",{children:t.jsxs("div",{children:[t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_unit||"-"}),e.presentations.length>0&&t.jsxs("select",{className:"form-control mt-1","data-no-select2":"true",value:e.presentation_id,disabled:!e.article_id,onChange:r=>vt(e.uid,"presentation_id",r.target.value),children:[t.jsx("option",{value:"",children:bn(e)}),e.presentations.map(r=>t.jsx("option",{value:r.id,children:hn(r,e)},`commercial-order-presentation-${e.uid}-${r.id}`))]})]})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:Number(e.stock_available||0).toFixed(2)})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:e.price_unit,onFocus:er,onChange:r=>vt(e.uid,"price_unit",Zt(r))})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:nr(Number(e.price_unit||0),De).subtotal.toFixed(2),readOnly:!0})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0.01",className:"form-control",value:e.quantity,onFocus:er,onChange:r=>vt(e.uid,"quantity",Zt(r))})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.discount_amount||0).toFixed(2),readOnly:!0})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.total||0).toFixed(2),readOnly:!0})}),t.jsx("td",{className:"text-end",children:t.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>Tr(e.uid),children:t.jsx("i",{className:"mdi mdi-close"})})})]},e.uid))}),t.jsxs("tfoot",{children:[t.jsxs("tr",{children:[t.jsx("th",{colSpan:"12",className:"text-end",children:"Sub total"}),t.jsx("th",{children:yt.toFixed(2)}),t.jsx("th",{})]}),t.jsxs("tr",{children:[t.jsx("th",{colSpan:"12",className:"text-end",children:"Descuento global"}),t.jsx("th",{children:"0.00"}),t.jsx("th",{})]}),t.jsxs("tr",{children:[t.jsx("th",{colSpan:"12",className:"text-end",children:"Total"}),t.jsx("th",{children:jt.total.toFixed(2)}),t.jsx("th",{})]})]})]})})]}),t.jsxs("section",{className:"commercial-order-form-section mb-0",children:[t.jsxs("div",{className:"commercial-order-section-title",children:[t.jsx("i",{className:"mdi mdi-note-text"}),t.jsx("span",{children:"Observaciones"})]}),t.jsx(Qt,{eRef:Ye,label:"Observaciones",rows:3})]})]})}),t.jsx(wt,{modalRef:w,title:"Tracking del pedido",size:"lg",hideButtonSubmit:!0,children:t.jsx("div",{className:"table-responsive",children:t.jsxs("table",{className:"table table-sm align-middle mb-0",children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{children:"Fecha"}),t.jsx("th",{children:"Estado"})]})}),t.jsxs("tbody",{children:[Ut.length===0&&t.jsx("tr",{children:t.jsx("td",{colSpan:"2",className:"text-muted text-center py-3",children:"Sin eventos registrados."})}),Ut.map((e,r)=>t.jsxs("tr",{children:[t.jsx("td",{children:new Date(e.date).toLocaleString("es-PE")}),t.jsx("td",{children:e.status})]},`commercial-order-tracking-${r}`))]})]})})}),t.jsx(wt,{modalRef:u,title:"Evidencia de entrega",size:"lg",btnSubmitText:"Registrar",onSubmit:Rr,children:t.jsxs("div",{className:"row",children:[t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Recibido por"}),t.jsx("input",{className:"form-control",value:N.recipient_name,onChange:e=>ie("recipient_name",e.target.value)})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Tipo doc."}),t.jsxs("select",{className:"form-control",value:N.recipient_document_type,onChange:e=>ie("recipient_document_type",e.target.value),children:[t.jsx("option",{value:"DNI",children:"DNI"}),t.jsx("option",{value:"RUC",children:"RUC"}),t.jsx("option",{value:"CE",children:"CE"}),t.jsx("option",{value:"OTRO",children:"Otro"})]})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Numero"}),t.jsx("input",{className:"form-control",value:N.recipient_document_number,onChange:e=>ie("recipient_document_number",e.target.value)})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Telefono"}),t.jsx("input",{className:"form-control",value:N.recipient_phone,onChange:e=>ie("recipient_phone",e.target.value)})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Fecha y hora entrega"}),t.jsx("input",{type:"datetime-local",className:"form-control",value:N.delivered_at,onChange:e=>ie("delivered_at",e.target.value)})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Foto / evidencia"}),t.jsx("input",{ref:h,className:"form-control",type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",capture:"environment",onChange:$r})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Latitud"}),t.jsx("input",{className:"form-control",value:N.latitude,onChange:e=>ie("latitude",e.target.value)})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Longitud"}),t.jsx("input",{className:"form-control",value:N.longitude,onChange:e=>ie("longitude",e.target.value)})]}),t.jsxs("div",{className:"col-12 mb-3",children:[t.jsx("label",{className:"form-label",children:"Observaciones"}),t.jsx("textarea",{className:"form-control",rows:"3",value:N.evidence_notes,onChange:e=>ie("evidence_notes",e.target.value)})]}),t.jsx("div",{className:"col-12",children:t.jsx("div",{className:"border rounded p-3",children:me?t.jsx("img",{src:me,alt:"Evidencia de entrega",className:"img-fluid rounded border bg-light",style:{maxHeight:360,width:"100%",objectFit:"contain"}}):N.evidence_url?t.jsx("a",{href:N.evidence_url,target:"_blank",rel:"noreferrer",children:"Abrir evidencia registrada"}):t.jsx("div",{className:"text-muted py-4 text-center",children:"Sin evidencia registrada"})})})]})})]})};Pr((n,i)=>{!i.can("orders")&&!i.hasRole("Admin")&&(location.href="/admin/"),Or(n).render(t.jsx(qr,{...i,title:i.pageTitle||"Pedidos comerciales",children:t.jsx($n,{...i})}))});
