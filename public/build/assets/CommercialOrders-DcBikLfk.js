import{C as Pr,c as Or,j as t,r as s,S as jt,G as Mr}from"./CreateReactScript-BQEmHc8B.js";import{L as Br,G as Lr,M as Gr}from"./esm-XAA1TWCO.js";import{B as qr}from"./Base-BZJCfbcl.js";import{T as zr}from"./Table-BWb0AA-P.js";import{M as Nt}from"./Modal-BpHRFSoz.js";import{R as $t}from"./ReactAppend-CmCssPze.js";import{S as Ur}from"./SwitchFormGroup-BFsLqEe8.js";import{a as Re,S as ke}from"./SetSelectValue-CKeZntsZ.js";import{S as Wr}from"./SelectFormGroup-BeLjaap0.js";import{T as Kt}from"./TextareaFormGroup-COu0G6AX.js";import{C as Vr}from"./CommercialOrdersRest-C3qyJH3l.js";import{R as Hr}from"./ReferralGuidesRest-CIzM-URQ.js";import{r as Kr}from"./renderGridEditLink-D8NGEeKJ.js";import{o as tt,b as rt}from"./magistralesRecordPdf-DJD0Ell0.js";import{t as nt,i as Qr,j as Xr,k as Yr,p as Jr,l as sr,m as Zr,n as en}from"./statusLabels-DiZH1MPU.js";import"./BasicRest-BJmaHB2C.js";import"./tippy-react.esm-255dCUw_.js";import"./ubigeoInei-D0FnAslC.js";const O=new Vr,Qt=new Hr,tn=["client_kind","=","regular"],rn=[1,2,3,4,5],nn=["EFECTIVO [CONTADO]","TRANSFERENCIA [CONTADO]","YAPE [CONTADO]","PLIN [CONTADO]","TARJETA [CONTADO]","TRANSFERENCIA [CREDITO]"],fe=(r,{variant:i,title:m,icon:d,onClick:p})=>{const w=$('<button type="button"></button>').addClass(`btn btn-xs btn-soft-${i} commercial-order-action-btn`).attr("title",m).attr("aria-label",m).append($("<i></i>").addClass(d)).on("click",u=>{u.preventDefault(),u.stopPropagation(),p()});r.append(w)},cn=r=>`commercial-order-status-badge commercial-order-status-${`${r??"empty"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-")||"empty"}`,Xt=(r,i,m)=>{r.addClass("commercial-order-status-cell"),$t(r,t.jsx("span",{className:cn(i),children:m(i)}))},ze=()=>({uid:crypto.randomUUID(),article_id:"",article_label:"",article_code:"",article_lot:"",article_name:"",article_unit:"",article_laboratory:"",article_principle:"",presentations:[],presentation_id:"",presentation_units:1,stock_available:0,reserved_quantity:0,price_unit:0,quantity:1,gross_total:0,discount_type:"none",discount_value:0,discount_amount:0,total:0,price_source:"fallback",price_list_code:""}),wt=r=>{if(!r)return"";const i=(r.name??"").toString().trim().split(" ")[0]??"",m=(r.lastname??"").toString().trim().split(" ")[0]??"",d=`${i} ${m}`.trim(),p=(r.username??"").toString().trim();return d&&p?`${d} (@${p})`:d||(p?`@${p}`:"")},Ue=r=>Number(Number(r||0).toFixed(2)),sn=r=>$("<div>").text(r??"").html(),Se=r=>{const i=Number(Number(r||0).toFixed(3));return Number.isInteger(i)?`${i}`:`${i}`.replace(/\.?0+$/,"")},kt=r=>(r==null?void 0:r.price_source)==="manual",Yt=(r,i,m=!1)=>{const d=Number((r==null?void 0:r.price_unit)||0),p=Number(i==null?void 0:i.price_unit);return!m&&kt(r)||!Number.isFinite(p)||!m&&p<=0&&d>0?d:p},Jt=(r,i,m=!1)=>!m&&kt(r)?"manual":(i==null?void 0:i.source)||(r==null?void 0:r.price_source)||"fallback",on=r=>{const i=`${r??""}`.replace(",",".").replace(/[^\d.]/g,"");if(!i)return"";const[m,...d]=i.split("."),p=m.replace(/^0+(?=\d)/,"")||(m||d.length?"0":""),w=d.length?`.${d.join("")}`:"";return`${p}${w}`},Zt=r=>{const i=on(r.target.value);return r.target.value!==i&&(r.target.value=i),Number(i||0)},er=r=>{Number(r.target.value||0)===0&&r.target.select()},an=(r,i,m)=>{const d=Ue(r),p=Number(m||0);return!Number.isFinite(p)||p<=0||d<=0?0:i==="percent"?Math.min(d,Ue(d*Math.min(p,100)/100)):i==="amount"?Math.min(d,Ue(p)):0},he=r=>{const i=Number(r.quantity||0),m=Number(r.price_unit||0),d=Number.isFinite(i*m)?Ue(i*m):0,p=an(d,r.discount_type,r.discount_value);return{...r,discount_type:r.discount_type||"none",discount_value:r.discount_type==="none"?0:Number(r.discount_value||0),gross_total:d,discount_amount:p,total:Ue(Math.max(0,d-p))}},ct=r=>{const i=`${r??""}`.trim().toLowerCase();return i==="boleta"?"Boleta":["nota de pedido","nota_pedido","note_order"].includes(i)?"Nota de pedido":"Factura"},C=(r,i="")=>{if(r==null)return i;if(typeof r=="object")return r.address??r.reference??r.name??r.description??i;const m=`${r}`;return m==="[object Object]"?i:m},ln=r=>`${r??""}`.toUpperCase().includes("CREDITO")?"Credito":"Contado",dn=r=>{const i=`${r??""}`.trim();return i?i.toUpperCase()==="TRANSFERENCIA"?"TRANSFERENCIA [CONTADO]":i:"EFECTIVO [CONTADO]"},un=r=>C(r==null?void 0:r.full_address,C(r==null?void 0:r.address,C(r==null?void 0:r.fiscal_address))),mn=r=>C(r==null?void 0:r.ubigeo,C(r==null?void 0:r.district_ubigeo,C(r==null?void 0:r.inei_ubigeo))),tr=r=>{const i=`${r??""}`.trim(),m=i.match(/^(client|eventual)-(\d+)$/);return m?m[2]:i},rr=r=>{var u,b,S;if(r.loading)return r.text;const i=r.data??{},m=r.text||i.name||"",d=(u=i.branch)==null?void 0:u.name,p=(S=(b=i.branch)==null?void 0:b.business)==null?void 0:S.name,w=$("<span>").text(m);return d&&w.append($("<small>").addClass("text-muted ms-1").text(`- ${d}`)),p&&w.append($("<small>").addClass("text-muted ms-1").text(`(${p})`)),w},J=r=>{if(!(r!=null&&r.current))return;const i=$(r.current);i.empty().val(null),i.trigger(i.data("select2")?"change.select2":"change")},pn=r=>r.article_id?"Unidad base":"Sin presentacion",fn=(r,i)=>{const m=(r==null?void 0:r.name)||"Presentacion",d=Se((r==null?void 0:r.units)||1),p=i!=null&&i.article_unit?` ${i.article_unit}`:" unidad(es) base";return`${m} (${d}${p})`},hn=r=>["Factura","Boleta"].includes(ct(r)),nr=(r,i)=>{const m=Number(r||0);if(!hn(i))return{subtotal:Number(m.toFixed(2)),taxAmount:0,total:Number(m.toFixed(2))};const d=Number((m/1.18).toFixed(2));return{subtotal:d,taxAmount:Number((m-d).toFixed(2)),total:Number(m.toFixed(2))}},bn=(r,i="")=>{const m=new Map;return(r??[]).flatMap(d=>{if(!(d!=null&&d.article_id))return[];const p=`${d.article_id}:${d.warehouse_id||i||""}`,w=Number(d.quantity||0),u=Number(d.presentation_units||1)||1,b=Number((w*u).toFixed(3)),S=Number(d.stock_available||0),I=Number(m.get(p)||0),P=Math.max(0,S-I),E=Math.min(b,P),M=Math.max(0,b-E);return m.set(p,I+E),M<=1e-4?[]:[{article:d.article_name||d.article_label||d.article_code||"Articulo",quantity:b,lineQuantity:w,presentationUnits:u,available:P,shortage:M}]})},st=r=>(r==null?void 0:r.referral_guides)??(r==null?void 0:r.referralGuides)??[],Rt=r=>(r==null?void 0:r.external_reference)||[r==null?void 0:r.series,r==null?void 0:r.sequence].filter(Boolean).join("-")||(r==null?void 0:r.code)||"-",_n=r=>r&&!["accepted","cancelled"].includes(r.guide_status),gn=r=>(r==null?void 0:r.delivery_evidences)??(r==null?void 0:r.deliveryEvidences)??[],Ct=r=>gn(r)[0]??null,xn=r=>(r==null?void 0:r.tracking_events)??(r==null?void 0:r.trackingEvents)??[],ir=r=>{const i=`${r??""}`.trim();return i.startsWith("blob:")||i.startsWith("data:image/")||/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(i)||i.includes("/delivery-evidence-media/")},cr=()=>{const r=new Date;return r.setMinutes(r.getMinutes()-r.getTimezoneOffset()),r.toISOString().slice(0,16)},it={lat:-12.046374,lng:-77.042793},Z=r=>{const i=Number(r);return Number.isFinite(i)?i:null},ot=r=>{const i=Z(r);return i===null?"":i.toFixed(7)},ee=r=>Z(r==null?void 0:r.lat)!==null&&Z(r==null?void 0:r.lng)!==null,vn=({modalRef:r,position:i,searchText:m,onPositionChange:d,onSearchTextChange:p,onAddressSelected:w,googleMapsApiKey:u})=>{const b=s.useRef(),[S,I]=s.useState(!1),[P,E]=s.useState(""),[M,q]=s.useState([]),z=ee(i)?{lat:Z(i.lat),lng:Z(i.lng)}:it,T=(f,R=17)=>{const U=Z(f==null?void 0:f.lat),L=Z(f==null?void 0:f.lng);U===null||L===null||!b.current||(b.current.setCenter({lat:U,lng:L}),b.current.setZoom(R))},de=f=>{d(f),T(f)};s.useEffect(()=>{if(ee(i)){T(z);return}T(it,13)},[i==null?void 0:i.lat,i==null?void 0:i.lng]),s.useEffect(()=>{const f=r==null?void 0:r.current;if(!f)return;const R=()=>{setTimeout(()=>{ee(i)?T(z):T(it,13)},180)};return $(f).on("shown.bs.modal",R),()=>$(f).off("shown.bs.modal",R)},[r,i==null?void 0:i.lat,i==null?void 0:i.lng]);const B=async()=>{var R,U;const f=`${m??""}`.trim();if(!f){q([]),E("Escribe una direccion para buscar.");return}if(!((U=(R=window.google)==null?void 0:R.maps)!=null&&U.Geocoder)){E("Google Maps aun no termino de cargar.");return}I(!0),E("");try{new window.google.maps.Geocoder().geocode({address:`${f}, Peru`,componentRestrictions:{country:"PE"},region:"PE"},(te,_e)=>{if(I(!1),_e!=="OK"||!Array.isArray(te)||te.length===0){q([]),E("Sin resultados. Puedes marcar el punto manualmente en el mapa.");return}q(te.slice(0,5).map(X=>({place_id:X.place_id,display_name:X.formatted_address,lat:X.geometry.location.lat(),lng:X.geometry.location.lng()})))})}catch(L){I(!1),E(`${L.message}. Puedes marcar el punto manualmente en el mapa.`),q([])}},be=f=>{const R={lat:Z(f.lat),lng:Z(f.lng)};d(R),p(f.display_name??""),w(f.display_name??""),T(R),q([])};return t.jsxs("div",{className:"commercial-order-map-picker",children:[t.jsxs("div",{className:"commercial-order-map-search",children:[t.jsxs("div",{children:[t.jsx("label",{className:"form-label",children:"Buscar direccion en mapa"}),t.jsxs("div",{className:"input-group",children:[t.jsx("input",{type:"text",className:"form-control",value:m,onChange:f=>p(f.target.value),onKeyDown:f=>{f.key==="Enter"&&(f.preventDefault(),B())},placeholder:"Ej. Av. Javier Prado 123, San Isidro"}),t.jsx("button",{type:"button",className:"btn btn-outline-primary",onClick:B,disabled:S,children:S?"Buscando...":"Buscar"})]})]}),t.jsxs("div",{className:"commercial-order-map-coordinates",children:[t.jsx("label",{className:"form-label",children:"Coordenadas"}),t.jsxs("div",{className:"commercial-order-map-coordinate-values",children:[t.jsx("span",{children:ot(i==null?void 0:i.lat)||"-"}),t.jsx("span",{children:ot(i==null?void 0:i.lng)||"-"})]})]})]}),M.length>0&&t.jsx("div",{className:"commercial-order-map-results",children:M.map(f=>t.jsx("button",{type:"button",className:"commercial-order-map-result",onClick:()=>be(f),children:f.display_name},`${f.place_id}-${f.lat}-${f.lng}`))}),P&&t.jsx("small",{className:"text-muted d-block mt-1",children:P}),t.jsx(Br,{googleMapsApiKey:u,language:"es",region:"PE",onError:()=>E("No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio."),children:t.jsx(Lr,{mapContainerClassName:"commercial-order-map-canvas",center:z,zoom:ee(i)?17:13,options:{clickableIcons:!0,fullscreenControl:!0,gestureHandling:"greedy",mapTypeControl:!0,scrollwheel:!0,streetViewControl:!1},onLoad:f=>{b.current=f,setTimeout(()=>{ee(i)?T(z):T(it,13)},120)},onClick:f=>{const R={lat:f.latLng.lat(),lng:f.latLng.lng()};de(R)},children:ee(i)&&t.jsx(Gr,{position:z,draggable:!0,onDragEnd:f=>de({lat:f.latLng.lat(),lng:f.latLng.lng()})})})}),t.jsx("small",{className:"text-muted d-block mt-2",children:"Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega."})]})},yn=r=>{const i=`${Mr.GMAPS_API_KEY??""}`.trim();return i?t.jsx(vn,{...r,googleMapsApiKey:i}):t.jsx("div",{className:"commercial-order-map-picker",children:t.jsx("div",{className:"commercial-order-map-empty",children:"Configura Google Maps API Key en Sistemas > Datos generales > Integraciones para habilitar el mapa."})})},jn=r=>!r||r.status===null||`${r.order_status??""}`=="cancelled"?!1:`${r.dispatch_status??"pending"}`=="pending",Nn=r=>{if(!r)return[];const i=xn(r).map(u=>({date:u.happened_at??u.created_at,status:[u.title,u.description].filter(Boolean).join(" - ")})),m=[{date:r.created_at,status:"La orden ingreso en el sistema"}];r.approved_at&&["preparing","in_route","delivered","dispatched","billed","closed"].includes(r.order_status)?m.push({date:r.approved_at,status:"La orden paso a preparacion"}):r.approved_at&&r.order_status==="confirmed"?m.push({date:r.approved_at,status:"La orden fue confirmada"}):["preparing","in_route","delivered","dispatched","billed","closed"].includes(r.order_status)&&m.push({date:r.updated_at,status:"La orden paso a preparacion"});const d=(r.dispatch_assignments??r.dispatchAssignments??[]).filter(u=>(u==null?void 0:u.status)!==!1&&(u==null?void 0:u.status)!==0&&(u==null?void 0:u.dispatch)).sort((u,b)=>{var S,I,P,E;return new Date(((S=u==null?void 0:u.dispatch)==null?void 0:S.departed_at)||((I=u==null?void 0:u.dispatch)==null?void 0:I.scheduled_date)||0)-new Date(((P=b==null?void 0:b.dispatch)==null?void 0:P.departed_at)||((E=b==null?void 0:b.dispatch)==null?void 0:E.scheduled_date)||0)}),p=d.find(u=>{var b;return["in_route","delivered","closed"].includes((b=u==null?void 0:u.dispatch)==null?void 0:b.dispatch_status)});p?(m.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:`Manifiesto ${p.dispatch.manifest_code||p.dispatch.code||""}`.trim()}),m.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:"El pedido salio en ruta"})):r.dispatch_status==="in_route"&&m.push({date:r.updated_at,status:"El pedido salio en ruta"}),(r.dispatch_status==="dispatched"||d.some(u=>{var b;return((b=u==null?void 0:u.dispatch)==null?void 0:b.dispatch_status)==="dispatched"}))&&m.push({date:r.updated_at,status:"El pedido paso a despacho"}),st(r).forEach(u=>{m.push({date:u.issue_date??u.created_at??r.updated_at,status:`Guia de remision ${Rt(u)} - ${sr(u.guide_status)}`})});const w=d.find(u=>{var b;return["delivered","closed"].includes((b=u==null?void 0:u.dispatch)==null?void 0:b.dispatch_status)});return w?m.push({date:w.dispatch.delivered_at??w.dispatch.updated_at??w.dispatch.created_at,status:"El pedido fue entregado"}):r.dispatch_status==="delivered"&&m.push({date:r.updated_at,status:"El pedido fue entregado"}),(r.order_status==="cancelled"||r.dispatch_status==="cancelled")&&m.push({date:r.updated_at,status:"El pedido fue cancelado"}),[...i,...m].filter(u=>u.date).sort((u,b)=>new Date(u.date)-new Date(b.date))},wn=({requiredPermission:r="orders",externalSource:i=null,pageTitle:m="Pedidos comerciales"})=>{O.externalSource=i||null;const d=s.useRef(),p=s.useRef(),w=s.useRef(),u=s.useRef(),b=s.useRef(),S=s.useRef(),I=s.useRef(),P=s.useRef(),E=s.useRef(),M=s.useRef(),q=s.useRef(),z=s.useRef(),T=s.useRef(),de=s.useRef(),B=s.useRef(),be=s.useRef(),f=s.useRef(),R=s.useRef(),U=s.useRef(),L=s.useRef(),te=s.useRef(),_e=s.useRef(),X=s.useRef(),We=s.useRef(),Ve=s.useRef(),He=s.useRef(),Ke=s.useRef(),Qe=s.useRef(),or=s.useRef(),W=s.useRef(),ge=s.useRef(),re=s.useRef(),xe=s.useRef(),ve=s.useRef(),Xe=s.useRef(),at=s.useRef({}),[ar,lr]=s.useState(!1),[ye,St]=s.useState(""),[V,Ye]=s.useState(""),[H,Je]=s.useState(""),[je,lt]=s.useState(""),[Ne,dt]=s.useState(""),[K,Ee]=s.useState(""),[dr,ue]=s.useState(""),[ut,mt]=s.useState({lat:"",lng:""}),[ur,Ze]=s.useState(""),[mr,Et]=s.useState([]),[Fe,et]=s.useState([]),[Cn,we]=s.useState([]),[Y,Q]=s.useState([ze()]),[De,Ft]=s.useState("Factura"),[ne,pt]=s.useState(null),[Dt,pr]=s.useState(null),[Ce,fr]=s.useState(null),[It,ft]=s.useState(null),[me,ht]=s.useState(""),[N,bt]=s.useState({recipient_name:"",recipient_document_type:"DNI",recipient_document_number:"",recipient_phone:"",delivered_at:cr(),evidence_notes:"",evidence_url:"",latitude:"",longitude:""}),hr=s.useMemo(()=>{var n;const e=new URLSearchParams;return ye&&e.append("business_id",ye),V&&e.append("business_branch_id",V),H&&e.append("warehouse_id",H),je&&e.append("client_id",je),Ne&&e.append("eventual_client_id",Ne),K&&e.append("client_distribution_network_id",K),(n=B.current)!=null&&n.value&&e.append("issue_date",B.current.value),`/api/admin/commercial-orders/articles?${e.toString()}`},[ye,V,H,je,Ne,K]),br=s.useMemo(()=>V?["business_branch_id","=",Number(V)]:null,[V]);s.useEffect(()=>()=>{me!=null&&me.startsWith("blob:")&&URL.revokeObjectURL(me)},[me]),s.useEffect(()=>{if(!ne)return;const e=()=>pt(null),n=c=>{c.key==="Escape"&&e()};return document.addEventListener("click",e),document.addEventListener("keydown",n),window.addEventListener("resize",e),window.addEventListener("scroll",e,!0),()=>{document.removeEventListener("click",e),document.removeEventListener("keydown",n),window.removeEventListener("resize",e),window.removeEventListener("scroll",e,!0)}},[ne]);const Tt=e=>(at.current[e]||(at.current[e]=s.createRef()),at.current[e]);s.useEffect(()=>{Y.forEach(e=>{const n=Tt(e.uid);!n.current||!e.article_id||!e.article_label||`${$(n.current).val()}`==`${e.article_id}`||Re(n.current,e.article_id,e.article_label)})},[Y]);const At=async(e,n=null)=>{if(!e){Et([]),Ye("");return}const l=(await O.getBranchesByBusiness(e)??[]).filter(a=>a.status!==null);if(Et(l),n&&l.some(a=>`${a.id}`==`${n}`)){Ye(`${n}`);return}Ye("")},Pt=e=>{if(!e)return;const n=un(e),c=mn(e);n&&W.current&&(W.current.value=n),c&&re.current&&(re.current.value=c),n&&Ze(n)},Ot=async(e,n=null,c=null)=>{var v;if(!e){et([]),Ee(""),we([]),ue("");return}const a=(await O.getDistributionNetworks(e)??[]).filter(_=>_.status!==null);et(a);const o=n||((v=a.find(_=>_.is_default))==null?void 0:v.id);if(o&&a.some(_=>`${_.id}`==`${o}`)){Ee(`${o}`),await Mt(o,null,a);return}Ee(""),we([]),ue(""),Pt(c)},Mt=async(e,n=null,c=null)=>{var _,j;if(!e){we([]),ue("");return}let l=[];const a=(c??Fe).find(g=>`${g.id}`==`${e}`);(((_=a==null?void 0:a.addresses)==null?void 0:_.length)??0)>0?l=a.addresses:l=await O.getDeliveryAddresses(e);const o=(l??[]).filter(g=>g.status!==null);we(o);const v=n||((j=o.find(g=>g.is_default))==null?void 0:j.id);if(v&&o.some(g=>`${g.id}`==`${v}`)){ue(`${v}`),_r(o.find(g=>`${g.id}`==`${v}`));return}ue("")},_r=e=>{e&&(W.current&&(W.current.value=C(e.address)),ge.current&&(ge.current.value=C(e.reference)),re.current&&(re.current.value=C(e.ubigeo)),xe.current&&(xe.current.value=C(e.contact_name)),ve.current&&(ve.current.value=C(e.contact_phone)),Ze(C(e.address)),ee({lat:e.latitude,lng:e.longitude})&&mt({lat:Number(e.latitude),lng:Number(e.longitude)}))},Bt=async(e,n={})=>{var o,v,_;const c=n.article_id??e.article_id,l=Number(n.quantity??e.quantity??0),a=n.presentation_id??e.presentation_id;return!c||!H||l<=0?null:await O.resolvePrice({article_id:c,presentation_id:a||null,quantity:l,business_id:ye||null,business_branch_id:V||null,warehouse_id:H||null,client_id:je||null,eventual_client_id:Ne||null,client_distribution_network_id:K||null,issue_date:((o=B.current)==null?void 0:o.value)||null,commercial_channel:((v=Fe.find(j=>`${j.id}`==`${K}`))==null?void 0:v.commercial_channel)||null,segment:((_=Fe.find(j=>`${j.id}`==`${K}`))==null?void 0:_.segment)||null})},_t=async(e=null)=>{const n=e??Y;for(const c of n){if(!c.article_id)continue;const l=await Bt(c);l&&Q(a=>a.map(o=>o.uid!==c.uid?o:he({...o,stock_available:Number(l.stock_available||0),price_unit:Yt(o,l),price_source:Jt(o,l),price_list_code:l.price_list_code||""})))}},Lt=e=>{e==="regular"?(dt(""),J(z)):e==="eventual"&&(lt(""),et([]),Ee(""),we([]),ue(""),J(q))},gt=async(e=null)=>{var _,j,g,G;lr(!!(e!=null&&e.id)),S.current&&(S.current.value=(e==null?void 0:e.id)??""),I.current&&(I.current.value=(e==null?void 0:e.code)??"Se genera al guardar"),B.current&&(B.current.value=e!=null&&e.issue_date?e.issue_date.toString().slice(0,10):new Date().toISOString().slice(0,10)),be.current&&(be.current.value=e!=null&&e.promised_delivery_at?e.promised_delivery_at.toString().slice(0,10):""),Ft(ct((e==null?void 0:e.document_type)??"Factura")),R.current&&(R.current.value=(e==null?void 0:e.currency)??"PEN"),U.current&&(U.current.value=(e==null?void 0:e.payment_condition)??"Contado"),L.current&&(L.current.value=dn(e==null?void 0:e.payment_method)),We.current&&(We.current.value=(e==null?void 0:e.installments)??1),Ve.current&&(Ve.current.value=e!=null&&e.first_due_date?e.first_due_date.toString().slice(0,10):""),He.current&&(He.current.value=(e==null?void 0:e.order_status)??(e!=null&&e.external_source?"pending":"draft")),Ke.current&&(Ke.current.value=(e==null?void 0:e.dispatch_status)??"pending"),Qe.current&&(Qe.current.value=(e==null?void 0:e.billing_status)??"pending"),W.current&&(W.current.value=C(e==null?void 0:e.delivery_address)),ge.current&&(ge.current.value=C(e==null?void 0:e.delivery_reference)),re.current&&(re.current.value=C(e==null?void 0:e.ubigeo)),xe.current&&(xe.current.value=C(e==null?void 0:e.dispatch_contact_name)),ve.current&&(ve.current.value=C(e==null?void 0:e.dispatch_contact_phone)),te.current&&(te.current.value=(e==null?void 0:e.purchase_order)??""),_e.current&&(_e.current.value=(e==null?void 0:e.guide_number)??""),X.current&&(X.current.value=(e==null?void 0:e.referral_guide)??""),de.current&&(de.current.value=(e==null?void 0:e.doctor_name)??""),Xe.current&&(Xe.current.value=(e==null?void 0:e.observations)??""),mt({lat:ee({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lat):"",lng:ee({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lng):""}),Ze(C(e==null?void 0:e.delivery_address));const n=e!=null&&e.business_id?`${e.business_id}`:"",c=e!=null&&e.warehouse_id?`${e.warehouse_id}`:"",l=e!=null&&e.client_id?`${e.client_id}`:"",a=e!=null&&e.eventual_client_id?`${e.eventual_client_id}`:"";St(n),Je(c),lt(l),dt(a),n&&((_=e==null?void 0:e.business)!=null&&_.name)?Re(P.current,n,e.business.name):J(P),c&&((j=e==null?void 0:e.warehouse)!=null&&j.name)?Re(M.current,c,e.warehouse.name):J(M),l&&((g=e==null?void 0:e.client)!=null&&g.full_name)?Re(q.current,l,`${e.client.document_number??""} - ${e.client.full_name}`.trim()):J(q),a&&((G=e==null?void 0:e.eventual_client)!=null&&G.business_name)?Re(z.current,a,`${e.eventual_client.document_number??""} - ${e.eventual_client.business_name}`.trim()):J(z),e!=null&&e.seller_id&&(e!=null&&e.seller)?Re(T.current,e.seller_id,wt(e.seller)):J(T);const o=((e==null?void 0:e.items)??[]).map(y=>{var se,oe,ae,le,x,k,Ie,Te,Ae,Pe,Oe,Me,Be,Le,Ge,qe;const h=y.article??null,ce=((h==null?void 0:h.presentations)??[]).filter(F=>(F==null?void 0:F.status)!==!1&&(F==null?void 0:F.status)!==0),A=y.presentation??ce[0]??null,pe=Number(y.presentation_units??(A==null?void 0:A.units)??1)||1;return he({uid:crypto.randomUUID(),article_id:y.article_id?`${y.article_id}`:"",article_label:h?`${h.code??""} - ${h.name??""}`.trim():"",article_code:(h==null?void 0:h.code)??y.external_sku??"",article_lot:(h==null?void 0:h.default_lot)??"",article_name:(h==null?void 0:h.name)??"",article_unit:((se=h==null?void 0:h.unit)==null?void 0:se.symbol)??((oe=h==null?void 0:h.unit)==null?void 0:oe.name)??"",article_laboratory:((ae=h==null?void 0:h.laboratory)==null?void 0:ae.name)??"",article_principle:((le=h==null?void 0:h.activePrinciple)==null?void 0:le.name)??((x=h==null?void 0:h.active_principle)==null?void 0:x.name)??"",presentations:ce.map(F=>({id:`${F.id}`,name:F.name??"Presentacion",units:Number(F.units||1),price:Number(F.price||0)})),presentation_id:A!=null&&A.id?`${A.id}`:"",presentation_units:pe,stock_available:Number(y.stock_available||0),reserved_quantity:Number(y.reserved_quantity||0),price_unit:Number(y.price_unit||0),quantity:Number(y.quantity||1),discount_type:((Ie=(k=y.external_payload)==null?void 0:k.commercial_form)==null?void 0:Ie.discount_type)??"none",discount_value:Number(((Ae=(Te=y.external_payload)==null?void 0:Te.commercial_form)==null?void 0:Ae.discount_value)||0),discount_amount:Number(((Oe=(Pe=y.external_payload)==null?void 0:Pe.commercial_form)==null?void 0:Oe.discount_amount)||0),gross_total:Number(((Be=(Me=y.external_payload)==null?void 0:Me.commercial_form)==null?void 0:Be.gross_total)||0),total:Number(y.total||0),price_source:y.price_source||"fallback",price_list_code:((Ge=(Le=y==null?void 0:y.price_list_item)==null?void 0:Le.price_list)==null?void 0:Ge.code)||((qe=e==null?void 0:e.price_list)==null?void 0:qe.code)||""})}),v=o.length?o:[ze()];Q(v),$(p.current).modal("show"),await At((e==null?void 0:e.business_id)??null,(e==null?void 0:e.business_branch_id)??null),l?(await Ot(l,(e==null?void 0:e.client_distribution_network_id)??null),e!=null&&e.client_distribution_network_id&&await Mt(e.client_distribution_network_id,(e==null?void 0:e.client_delivery_address_id)??null)):(et([]),Ee(""),we([]),ue(""))},gr=async e=>{var a,o,v,_,j,g,G,y,h,ce,A,pe,se,oe,ae,le,x,k,Ie,Te,Ae,Pe,Oe,Me,Be,Le,Ge,qe,F,Ut,Wt,Vt,Ht;e.preventDefault();const n={id:((a=S.current)==null?void 0:a.value)||void 0,external_source:i||void 0,business_id:ye||null,business_branch_id:V||null,warehouse_id:H||null,client_id:je||null,eventual_client_id:Ne||null,seller_id:((o=T.current)==null?void 0:o.value)||null,client_distribution_network_id:K||null,client_delivery_address_id:dr||null,document_type:De,currency:((v=R.current)==null?void 0:v.value)||"PEN",payment_condition:ln(((_=L.current)==null?void 0:_.value)||((j=U.current)==null?void 0:j.value)||"Contado"),payment_method:((g=L.current)==null?void 0:g.value)||"",purchase_order:((y=(G=te.current)==null?void 0:G.value)==null?void 0:y.trim())||"",guide_number:((ce=(h=_e.current)==null?void 0:h.value)==null?void 0:ce.trim())||"",referral_guide:((pe=(A=X.current)==null?void 0:A.value)==null?void 0:pe.trim())||"",doctor_name:((oe=(se=de.current)==null?void 0:se.value)==null?void 0:oe.trim())||"",issue_date:((ae=B.current)==null?void 0:ae.value)||"",promised_delivery_at:((le=be.current)==null?void 0:le.value)||null,installments:((x=We.current)==null?void 0:x.value)||1,first_due_date:((k=Ve.current)==null?void 0:k.value)||null,order_status:((Ie=He.current)==null?void 0:Ie.value)||(i?"pending":"draft"),dispatch_status:((Te=Ke.current)==null?void 0:Te.value)||"pending",billing_status:((Ae=Qe.current)==null?void 0:Ae.value)||"pending",tax_amount:yt.taxAmount,delivery_address:((Oe=(Pe=W.current)==null?void 0:Pe.value)==null?void 0:Oe.trim())||"",delivery_reference:((Be=(Me=ge.current)==null?void 0:Me.value)==null?void 0:Be.trim())||"",ubigeo:((Ge=(Le=re.current)==null?void 0:Le.value)==null?void 0:Ge.trim())||"",map_lat:ot(ut.lat)||null,map_lng:ot(ut.lng)||null,dispatch_contact_name:((F=(qe=xe.current)==null?void 0:qe.value)==null?void 0:F.trim())||"",dispatch_contact_phone:((Wt=(Ut=ve.current)==null?void 0:Ut.value)==null?void 0:Wt.trim())||"",observations:((Ht=(Vt=Xe.current)==null?void 0:Vt.value)==null?void 0:Ht.trim())||"",items:Y.map(D=>({article_id:D.article_id||null,presentation_id:D.presentation_id||null,warehouse_id:H||null,stock_available:D.stock_available,reserved_quantity:D.reserved_quantity,presentation_units:D.presentation_units,price_unit:D.price_unit,quantity:D.quantity,gross_total:D.gross_total,discount_type:D.discount_type,discount_value:D.discount_value,discount_amount:D.discount_amount,total:D.total,status:!0}))},c=bn(Y,H);if(c.length>0){const D=`
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${c.map($e=>`<li><strong>${sn($e.article)}</strong>: faltan ${Se($e.shortage)} unidad(es) base para completar ${Se($e.quantity)}. Cantidad: ${Se($e.lineQuantity)} x ${Se($e.presentationUnits)}. Disponible: ${Se($e.available)}.</li>`).join("")}
          </ul>
        </div>
      `,{isConfirmed:Ar}=await jt.fire({title:"Stock insuficiente",html:D,icon:"warning",showCancelButton:!0,confirmButtonText:"Crear de todas formas",cancelButtonText:"Revisar pedido"});if(!Ar)return;n.allow_stock_shortage=!0}await O.save(n)&&($(d.current).dxDataGrid("instance").refresh(),$(p.current).modal("hide"))},xr=async e=>{const n=e.target.value||"";St(n),Je(""),J(M),await At(n,null)},vr=e=>{const n=e.target.value||"";Ye(n),Je(""),J(M)},yr=async e=>{const n=e.target.value||"";Je(n),await _t()},jr=async e=>{var l,a;const n=tr(e.target.value),c=((a=(l=$(e.target).select2("data"))==null?void 0:l[0])==null?void 0:a.data)??null;lt(n),Lt("regular"),Pt(c),await Ot(n,null,c),await _t()},Nr=async e=>{const n=tr(e.target.value);dt(n),Lt("eventual"),await _t()},Gt=async({id:e,field:n,value:c})=>{await O.boolean({id:e,field:n,value:c})&&$(d.current).dxDataGrid("instance").refresh()},wr=e=>{pr(e),$(w.current).modal("show")},Cr=e=>{const n=Ct(e);fr(e),ft(null),ht(ir(n==null?void 0:n.evidence_url)?n.evidence_url:""),bt({recipient_name:(n==null?void 0:n.recipient_name)??(e==null?void 0:e.dispatch_contact_name)??"",recipient_document_type:(n==null?void 0:n.recipient_document_type)??"DNI",recipient_document_number:(n==null?void 0:n.recipient_document_number)??"",recipient_phone:(n==null?void 0:n.recipient_phone)??(e==null?void 0:e.dispatch_contact_phone)??"",delivered_at:n!=null&&n.delivered_at?`${n.delivered_at}`.replace(" ","T").slice(0,16):cr(),evidence_notes:(n==null?void 0:n.evidence_notes)??"",evidence_url:(n==null?void 0:n.evidence_url)??"",latitude:(n==null?void 0:n.latitude)??"",longitude:(n==null?void 0:n.longitude)??""}),navigator.geolocation&&navigator.geolocation.getCurrentPosition(c=>{bt(l=>({...l,latitude:l.latitude||c.coords.latitude,longitude:l.longitude||c.coords.longitude}))},()=>{},{enableHighAccuracy:!0,timeout:5e3}),setTimeout(()=>{b.current&&(b.current.value="")},0),$(u.current).modal("show")},$r=e=>{var c;const n=((c=e.target.files)==null?void 0:c[0])??null;ft(n),ht(n?URL.createObjectURL(n):ir(N.evidence_url)?N.evidence_url:"")},ie=(e,n)=>bt(c=>({...c,[e]:n})),Rr=async e=>{if(e.preventDefault(),!(Ce!=null&&Ce.id))return;const n=(Ce.dispatch_assignments??Ce.dispatchAssignments??[]).filter(a=>(a==null?void 0:a.status)!==!1&&(a==null?void 0:a.status)!==0&&(a==null?void 0:a.dispatch)).sort((a,o)=>{var v,_;return new Date(((v=o==null?void 0:o.dispatch)==null?void 0:v.scheduled_date)||(o==null?void 0:o.created_at)||0)-new Date(((_=a==null?void 0:a.dispatch)==null?void 0:_.scheduled_date)||(a==null?void 0:a.created_at)||0)})[0],c=new FormData;n!=null&&n.dispatch_id&&c.append("dispatch_id",n.dispatch_id),c.append("recipient_name",N.recipient_name??""),c.append("recipient_document_type",N.recipient_document_type??"DNI"),c.append("recipient_document_number",N.recipient_document_number??""),c.append("recipient_phone",N.recipient_phone??""),c.append("delivered_at",N.delivered_at??""),c.append("evidence_notes",N.evidence_notes??""),c.append("evidence_url",N.evidence_url??""),c.append("latitude",N.latitude??""),c.append("longitude",N.longitude??""),It&&c.append("evidence_file",It),await O.saveDeliveryEvidence(Ce.id,c)&&(ft(null),ht(""),b.current&&(b.current.value=""),$(u.current).modal("hide"),$(d.current).dxDataGrid("instance").refresh())},kr=async e=>{const n=st(e)[0];if(n){if(_n(n)){const l=await jt.fire({title:"Guia de remision",text:`La guia ${Rt(n)} esta ${sr(n.guide_status).toLowerCase()}.`,icon:"question",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Ver PDF",cancelButtonText:"Cancelar"});if(l.isConfirmed){const a=await Qt.issue(n.id);if(!(a!=null&&a.data))return;$(d.current).dxDataGrid("instance").refresh(),await tt(rt.referralGuide(a.data));return}if(!l.isDenied)return}await tt(rt.referralGuide(n));return}const c=await Qt.prepareFromCommercialOrder(e.id);c!=null&&c.data&&($(d.current).dxDataGrid("instance").refresh(),await tt(rt.referralGuide(c.data)))},Sr=async e=>{const{isConfirmed:n}=await jt.fire({title:"Eliminar pedido comercial",text:"Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!n||!await O.delete(e)||$(d.current).dxDataGrid("instance").refresh()},Er=async(e,n)=>{var y,h,ce,A,pe,se,oe,ae,le;$(n.target).data("select2")&&$(n.target).select2("close");const c=(y=$(n.target).select2("data"))==null?void 0:y[0],l=(c==null?void 0:c.data)??null,a=n.target.value||"";if(!a){Q(x=>x.map(k=>k.uid===e?{...ze(),uid:k.uid}:k));return}const o=l??await O.getArticleById(a),v=((o==null?void 0:o.presentations)??[]).filter(x=>(x==null?void 0:x.status)!==!1&&(x==null?void 0:x.status)!==0),_=v[0]??null,j=o?`${o.code??""} - ${o.name??""}`.trim():(c==null?void 0:c.text)??a,g={article_id:a,article_label:j,article_code:(o==null?void 0:o.code)??"",article_lot:(o==null?void 0:o.default_lot)??"",article_name:(o==null?void 0:o.name)??"",article_unit:((h=o==null?void 0:o.unit)==null?void 0:h.symbol)??((ce=o==null?void 0:o.unit)==null?void 0:ce.name)??"",article_laboratory:((A=o==null?void 0:o.laboratory)==null?void 0:A.name)??"",article_principle:((pe=o==null?void 0:o.activePrinciple)==null?void 0:pe.name)??((se=o==null?void 0:o.active_principle)==null?void 0:se.name)??"",presentations:v.map(x=>({id:`${x.id}`,name:x.name??"Presentacion",units:Number(x.units||1),price:Number(x.price||0)})),presentation_id:_?`${_.id}`:"",presentation_units:Number((_==null?void 0:_.units)||1),quantity:1};Q(x=>x.map(k=>k.uid===e?he({...k,...g}):k));const G=await O.resolvePrice({article_id:a,presentation_id:_?`${_.id}`:null,quantity:1,business_id:ye||null,business_branch_id:V||null,warehouse_id:H||null,client_id:je||null,eventual_client_id:Ne||null,client_distribution_network_id:K||null,issue_date:((oe=B.current)==null?void 0:oe.value)||null,commercial_channel:((ae=Fe.find(x=>`${x.id}`==`${K}`))==null?void 0:ae.commercial_channel)||null,segment:((le=Fe.find(x=>`${x.id}`==`${K}`))==null?void 0:le.segment)||null});G&&Q(x=>x.map(k=>k.uid===e?he({...k,...g,stock_available:Number(G.stock_available||0),price_unit:Number(G.price_unit||0),price_source:G.source||"fallback",price_list_code:G.price_list_code||""}):k))},xt=async(e,n,c)=>{const l=Y.find(j=>j.uid===e);if(!l)return;const a=n==="presentation_id"?l.presentations.find(j=>`${j.id}`==`${c}`):null,o=he({...l,[n]:c,...n==="presentation_id"?{presentation_units:Number((a==null?void 0:a.units)||1)}:{}});if(n==="price_unit"&&(o.price_source="manual",o.price_list_code=""),Q(j=>j.map(g=>g.uid===e?o:g)),!["quantity","presentation_id"].includes(n))return;const v=o.presentations.find(j=>`${j.id}`==`${n==="presentation_id"?c:o.presentation_id}`),_=await Bt(o,{quantity:n==="quantity"?c:o.quantity,presentation_id:n==="presentation_id"?c:o.presentation_id});_&&Q(j=>j.map(g=>g.uid!==e?g:he({...g,presentation_units:Number((v==null?void 0:v.units)||g.presentation_units||1),stock_available:Number(_.stock_available||0),price_unit:Yt(g,_,n==="presentation_id"),price_source:Jt(g,_,n==="presentation_id"),price_list_code:n==="presentation_id"?_.price_list_code||"":kt(g)?g.price_list_code:_.price_list_code||""})))},Fr=(e,n)=>{const c=Number(n||0);Q(l=>l.map(a=>a.uid!==e?a:he({...a,discount_type:c>0?"percent":"none",discount_value:c>0?c:0})))},Dr=(e,n)=>{n.preventDefault(),n.stopPropagation();const c=n.currentTarget.getBoundingClientRect();pt(l=>(l==null?void 0:l.uid)===e?null:{uid:e,top:c.bottom+4,left:c.left,width:Math.max(c.width,130)})},qt=(e,n)=>{Fr(e,n),pt(null)},Ir=()=>Q(e=>[...e,ze()]),Tr=e=>{Q(n=>{const c=n.filter(l=>l.uid!==e);return c.length?c:[ze()]})},vt=s.useMemo(()=>Y.reduce((e,n)=>e+Number(n.total||0),0),[Y]),yt=s.useMemo(()=>nr(vt,De),[vt,De]),zt=s.useMemo(()=>Nn(Dt),[Dt]);return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:`
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
      .commercial-order-status-closed {
        background: #ecfdf5;
        border-color: #6ee7b7;
        color: #047857;
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
    `}),t.jsx(zr,{gridRef:d,title:m,rest:O,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(d.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"add",title:"Agregar",hint:"Agregar pedido comercial",onClick:()=>gt(null)}})},pageSize:25,columns:[{dataField:"id",caption:"ID",width:80},{dataField:"code",caption:"Codigo",width:170,cellTemplate:(e,{data:n})=>Kr(e,n==null?void 0:n.code,()=>gt(n),"Editar pedido")},{dataField:"external_source",caption:"Origen externo",visible:!1,showInColumnChooser:!1},{dataField:"external_order_id",caption:"Pedido VTEX",width:150,visible:!!i},{dataField:"external_ecommerce",caption:"Ecommerce",width:140,visible:!!i},{dataField:"external_channel",caption:"Canal",width:130,visible:!!i},{dataField:"external_subservice",caption:"Subservicio",width:130,visible:!!i},{dataField:"external_sync_status",caption:"Sync",width:110,visible:!!i},{dataField:"issue_date",caption:"F. emision",width:110,dataType:"date"},{dataField:"promised_delivery_at",caption:"F. entrega",width:110,dataType:"date"},{dataField:"business.name",caption:"Empresa",minWidth:140},{dataField:"warehouse.name",caption:"Almacen",minWidth:120},{dataField:"customer",caption:"Cliente",minWidth:240,calculateCellValue:e=>{var n,c;return((n=e.client)==null?void 0:n.full_name)??((c=e.eventual_client)==null?void 0:c.business_name)??"-"}},{dataField:"distribution_network_name",caption:"Red",minWidth:160,calculateCellValue:e=>{var n,c;return((n=e.distribution_network)==null?void 0:n.name)??((c=e.distributionNetwork)==null?void 0:c.name)??"-"}},{dataField:"order_status",caption:"Estado comercial",width:140,lookup:nt(Qr),cellTemplate:(e,{value:n})=>Xt(e,n,Zr)},{dataField:"dispatch_status",caption:"Estado entrega",width:140,lookup:nt(Xr),cellTemplate:(e,{value:n})=>Xt(e,n,en)},{dataField:"billing_status",caption:"Facturacion",width:110,lookup:nt(Yr)},{dataField:"payment_status",caption:"Cobranza",width:110,lookup:nt(Jr)},{dataField:"document_type",caption:"Doc. venta",width:120,calculateCellValue:e=>ct(e==null?void 0:e.document_type)},{caption:"Guia",width:140,calculateCellValue:e=>{const n=st(e);return n.length===0?"-":n.length===1?Rt(n[0]):`${n.length} guias`}},{caption:"Evidencia",width:150,calculateCellValue:e=>{const n=Ct(e);return n?n.recipient_name||n.code||"Registrada":"-"}},{dataField:"currency",caption:"Moneda",width:90},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"accounts_receivable_code",caption:"CXC",width:140,calculateCellValue:e=>{var n,c;return((n=e.accounts_receivable)==null?void 0:n.code)??((c=e.accountsReceivable)==null?void 0:c.code)??"-"}},{dataField:"items.id",caption:"Detalle",minWidth:280,allowFiltering:!1,cellTemplate:(e,{data:n})=>{const c=((n==null?void 0:n.items)??[]).map(l=>{var a;return`${((a=l==null?void 0:l.article)==null?void 0:a.name)||"Articulo"} | Cant. ${Number((l==null?void 0:l.quantity)||0).toFixed(2)} | ${n.currency} ${Number((l==null?void 0:l.total)||0).toFixed(2)}`});$t(e,t.jsxs("div",{children:[c.length===0&&t.jsx("small",{className:"text-muted",children:"Sin detalle"}),c.map((l,a)=>t.jsx("div",{children:t.jsx("small",{children:l})},`commercial-order-${n.id}-${a}`))]}))}},{dataField:"creator.fullname",caption:"Creado por",visible:!1,cellTemplate:(e,{data:n})=>e.text(wt(n.creator))},{dataField:"updater.fullname",caption:"Actualizado por",visible:!1,cellTemplate:(e,{data:n})=>e.text(wt(n.updater))},{dataField:"status",caption:"Activo",dataType:"boolean",width:95,cellTemplate:(e,{data:n})=>{$(e).empty(),n.status!==null&&$t(e,t.jsx(Ur,{checked:n.status==1,onChange:()=>Gt({id:n.id,field:"status",value:!n.status})}))}},{caption:"Acciones",width:360,fixed:!0,fixedPosition:"right",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:n})=>{e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),fe(e,{variant:"primary",title:"Editar datos, cliente, entrega y productos del pedido comercial",icon:"mdi mdi-pencil",onClick:()=>gt(n)}),jn(n)&&fe(e,{variant:"success",title:"Enviar este pedido a preparacion para iniciar picking",icon:"mdi mdi-clipboard-check-outline",onClick:()=>Gt({id:n.id,field:"dispatch_status",value:"preparing"})}),fe(e,{variant:"info",title:"Ver historial de estados, guia, ruta y entrega del pedido",icon:"mdi mdi-map-marker-path",onClick:()=>wr(n)}),fe(e,{variant:"warning",title:st(n).length?"Ver, emitir o descargar la guia de remision asociada al pedido":"Generar guia de remision para este pedido",icon:"mdi mdi-file-document",onClick:()=>kr(n)}),fe(e,{variant:"success",title:Ct(n)?"Ver o actualizar foto y datos de evidencia de entrega":"Registrar foto y datos de evidencia de entrega",icon:"mdi mdi-camera",onClick:()=>Cr(n)}),fe(e,{variant:"danger",title:"Imprimir o descargar PDF resumen del pedido comercial",icon:"mdi mdi-file-pdf-box",onClick:()=>tt(rt.commercialOrder(n))}),fe(e,{variant:"danger",title:"Eliminar este pedido comercial del listado",icon:"mdi mdi-delete",onClick:()=>Sr(n.id)})}}]}),t.jsx(Nt,{modalRef:p,title:ar?"Editar pedido comercial":"Agregar pedido comercial",size:"xl",dialogClass:"commercial-order-modal-dialog modal-dialog-scrollable",bodyClass:"commercial-order-modal-body",bodyStyle:{maxHeight:"calc(100vh - 150px)",overflowY:"auto",overflowX:"hidden"},btnSubmitText:"Guardar",onSubmit:gr,children:t.jsxs("div",{id:"commercial-orders-form-container",children:[t.jsx("input",{ref:S,type:"hidden"}),t.jsx("input",{ref:I,type:"hidden"}),t.jsx("input",{ref:B,type:"hidden"}),t.jsx("input",{ref:be,type:"hidden"}),t.jsx("input",{ref:U,type:"hidden"}),t.jsx("input",{ref:We,type:"hidden"}),t.jsx("input",{ref:Ve,type:"hidden"}),t.jsx("input",{ref:He,type:"hidden"}),t.jsx("input",{ref:Ke,type:"hidden"}),t.jsx("input",{ref:Qe,type:"hidden"}),t.jsx("input",{ref:or,type:"hidden",value:yt.taxAmount,readOnly:!0}),t.jsx("input",{ref:ge,type:"hidden"}),t.jsxs("section",{className:"commercial-order-form-section",children:[t.jsxs("div",{className:"commercial-order-section-title",children:[t.jsx("i",{className:"mdi mdi-file-document"}),t.jsx("span",{children:"Datos del pedido"})]}),t.jsxs("div",{className:"row g-2",children:[t.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:t.jsx(ke,{eRef:P,label:"Empresa",required:!0,searchAPI:"/api/admin/businesses/paginate",searchBy:"name",dropdownParent:"#commercial-orders-form-container",onChange:xr})}),t.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:t.jsxs(Wr,{eRef:E,label:"Sede",dropdownParent:"#commercial-orders-form-container",value:V,onChange:vr,children:[t.jsx("option",{value:"",children:"Sin sede"}),mr.map(e=>t.jsx("option",{value:e.id,children:e.name},`commercial-order-branch-${e.id}`))]})}),t.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:t.jsx(ke,{eRef:M,label:"Almacen",required:!0,searchAPI:"/api/admin/warehouses/paginate",searchBy:"name",filter:br,dropdownParent:"#commercial-orders-form-container",onChange:yr,templateResult:rr,templateSelection:rr})}),t.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Doc. venta"}),t.jsxs("select",{ref:f,className:"form-control",value:De,onChange:e=>Ft(ct(e.target.value)),children:[t.jsx("option",{value:"Factura",children:"Factura"}),t.jsx("option",{value:"Boleta",children:"Boleta"}),t.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),t.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Moneda"}),t.jsxs("select",{ref:R,className:"form-control",children:[t.jsx("option",{value:"PEN",children:"PEN"}),t.jsx("option",{value:"USD",children:"USD"}),t.jsx("option",{value:"EUR",children:"EUR"})]})]}),t.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Forma de pago"}),t.jsxs("select",{ref:L,className:"form-control",children:[t.jsx("option",{value:"",children:"Seleccione"}),nn.map(e=>t.jsx("option",{value:e,children:e},`commercial-order-payment-${e}`))]})]})]})]}),t.jsxs("section",{className:"commercial-order-form-section",children:[t.jsxs("div",{className:"commercial-order-section-title",children:[t.jsx("i",{className:"mdi mdi-account"}),t.jsx("span",{children:"Cliente y entrega"})]}),t.jsxs("div",{className:"row g-2",children:[t.jsx("div",{className:"col-12 col-xl-6",children:t.jsx(ke,{eRef:q,label:"Cliente regular",searchAPI:"/api/admin/clients/paginate",searchBy:"full_name",selectBy:"entity_id",filter:tn,dropdownParent:"#commercial-orders-form-container",onChange:jr})}),t.jsx("div",{className:"col-12 col-xl-6",children:t.jsx(ke,{eRef:z,label:"Cliente eventual",searchAPI:"/api/admin/eventual-clients/paginate",searchBy:"business_name",dropdownParent:"#commercial-orders-form-container",onChange:Nr})}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Orden de compra"}),t.jsx("input",{ref:te,className:"form-control"})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Numero de guia"}),t.jsx("input",{ref:_e,className:"form-control"})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Guia remision"}),t.jsx("input",{ref:X,className:"form-control"})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Ubigeo"}),t.jsx("input",{ref:re,className:"form-control"})]}),t.jsx("div",{className:"col-12 col-xl-4",children:t.jsx(Kt,{eRef:W,label:"Direccion de entrega",rows:2})}),t.jsx("div",{className:"col-12",children:t.jsx(yn,{modalRef:p,position:ut,searchText:ur,onSearchTextChange:Ze,onPositionChange:mt,onAddressSelected:e=>{W.current&&(W.current.value=e)}})}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[t.jsx("label",{className:"form-label",children:"Nombre contacto entrega"}),t.jsx("input",{ref:xe,className:"form-control"})]}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[t.jsx("label",{className:"form-label",children:"Celular contacto entrega"}),t.jsx("input",{ref:ve,className:"form-control"})]}),t.jsx(ke,{eRef:T,label:"Vendedor",col:"col-12 col-md-6 col-xl-2",searchAPI:"/api/admin/users/paginate",searchBy:"fullname",dropdownParent:"#commercial-orders-form-container"}),t.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[t.jsx("label",{className:"form-label",children:"Medico"}),t.jsx("input",{ref:de,className:"form-control"})]})]})]}),t.jsxs("section",{className:"commercial-order-form-section",children:[t.jsxs("div",{className:"commercial-order-detail-toolbar",children:[t.jsxs("div",{className:"commercial-order-section-title mb-0",children:[t.jsx("i",{className:"mdi mdi-format-list-bulleted"}),t.jsx("span",{children:"Detalle del pedido"})]}),t.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:Ir,children:"Agregar item"})]}),t.jsx("div",{className:"table-responsive border rounded commercial-order-detail-table","data-select2-local-dropdown":"true",children:t.jsxs("table",{className:"table table-sm align-middle mb-0",children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{style:{minWidth:96},children:"Descuento"}),t.jsx("th",{style:{minWidth:104},children:"Codigo"}),t.jsx("th",{style:{minWidth:88},children:"Codigo lote"}),t.jsx("th",{style:{minWidth:280},children:"Nombre"}),t.jsx("th",{style:{minWidth:128},children:"Laboratorio"}),t.jsx("th",{style:{minWidth:130},children:"Principio activo"}),t.jsx("th",{style:{minWidth:110},children:"Unidad"}),t.jsx("th",{style:{minWidth:64},children:"Stock"}),t.jsx("th",{style:{minWidth:112},children:"P. venta con IGV"}),t.jsx("th",{style:{minWidth:112},children:"P. venta sin IGV"}),t.jsx("th",{style:{minWidth:92},children:"Cantidad"}),t.jsx("th",{style:{minWidth:96},children:"Total desc."}),t.jsx("th",{style:{minWidth:96},children:"Sub total"}),t.jsx("th",{style:{width:70}})]})}),t.jsx("tbody",{children:Y.map(e=>t.jsxs("tr",{children:[t.jsx("td",{children:t.jsxs("div",{className:"commercial-order-discount-cell",children:[t.jsxs("button",{type:"button",className:"commercial-order-discount-trigger",onClick:n=>Dr(e.uid,n),children:[t.jsx("span",{children:e.discount_type==="percent"&&Number(e.discount_value||0)>0?`${Number(e.discount_value)}%`:"Seleccione"}),t.jsx("i",{className:"mdi mdi-chevron-down"})]}),(ne==null?void 0:ne.uid)===e.uid&&t.jsxs("div",{className:"commercial-order-discount-menu",style:{top:ne.top,left:ne.left,minWidth:ne.width},onClick:n=>n.stopPropagation(),children:[t.jsx("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type!=="percent"?"active":""}`,onClick:()=>qt(e.uid,""),children:"Seleccione"}),rn.map(n=>t.jsxs("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type==="percent"&&Number(e.discount_value||0)===n?"active":""}`,onClick:()=>qt(e.uid,n),children:[n,"%"]},`commercial-order-discount-floating-${e.uid}-${n}`))]})]})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_code||"-"})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_lot||"-"})}),t.jsx("td",{className:"commercial-order-article-name",children:t.jsx(ke,{eRef:Tt(e.uid),searchAPI:hr,searchBy:"name",dropdownParent:"#commercial-orders-form-container",disabled:!H,onChange:n=>Er(e.uid,n)})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_laboratory||"-"})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_principle||"-"})}),t.jsx("td",{children:t.jsxs("div",{children:[t.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_unit||"-"}),e.presentations.length>0&&t.jsxs("select",{className:"form-control mt-1","data-no-select2":"true",value:e.presentation_id,disabled:!e.article_id,onChange:n=>xt(e.uid,"presentation_id",n.target.value),children:[t.jsx("option",{value:"",children:pn(e)}),e.presentations.map(n=>t.jsx("option",{value:n.id,children:fn(n,e)},`commercial-order-presentation-${e.uid}-${n.id}`))]})]})}),t.jsx("td",{children:t.jsx("div",{className:"commercial-order-readonly-cell",children:Number(e.stock_available||0).toFixed(2)})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:e.price_unit,onFocus:er,onChange:n=>xt(e.uid,"price_unit",Zt(n))})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:nr(Number(e.price_unit||0),De).subtotal.toFixed(2),readOnly:!0})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0.01",className:"form-control",value:e.quantity,onFocus:er,onChange:n=>xt(e.uid,"quantity",Zt(n))})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.discount_amount||0).toFixed(2),readOnly:!0})}),t.jsx("td",{children:t.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.total||0).toFixed(2),readOnly:!0})}),t.jsx("td",{className:"text-end",children:t.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>Tr(e.uid),children:t.jsx("i",{className:"mdi mdi-close"})})})]},e.uid))}),t.jsxs("tfoot",{children:[t.jsxs("tr",{children:[t.jsx("th",{colSpan:"12",className:"text-end",children:"Sub total"}),t.jsx("th",{children:vt.toFixed(2)}),t.jsx("th",{})]}),t.jsxs("tr",{children:[t.jsx("th",{colSpan:"12",className:"text-end",children:"Descuento global"}),t.jsx("th",{children:"0.00"}),t.jsx("th",{})]}),t.jsxs("tr",{children:[t.jsx("th",{colSpan:"12",className:"text-end",children:"Total"}),t.jsx("th",{children:yt.total.toFixed(2)}),t.jsx("th",{})]})]})]})})]}),t.jsxs("section",{className:"commercial-order-form-section mb-0",children:[t.jsxs("div",{className:"commercial-order-section-title",children:[t.jsx("i",{className:"mdi mdi-note-text"}),t.jsx("span",{children:"Observaciones"})]}),t.jsx(Kt,{eRef:Xe,label:"Observaciones",rows:3})]})]})}),t.jsx(Nt,{modalRef:w,title:"Tracking del pedido",size:"lg",hideButtonSubmit:!0,children:t.jsx("div",{className:"table-responsive",children:t.jsxs("table",{className:"table table-sm align-middle mb-0",children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{children:"Fecha"}),t.jsx("th",{children:"Estado"})]})}),t.jsxs("tbody",{children:[zt.length===0&&t.jsx("tr",{children:t.jsx("td",{colSpan:"2",className:"text-muted text-center py-3",children:"Sin eventos registrados."})}),zt.map((e,n)=>t.jsxs("tr",{children:[t.jsx("td",{children:new Date(e.date).toLocaleString("es-PE")}),t.jsx("td",{children:e.status})]},`commercial-order-tracking-${n}`))]})]})})}),t.jsx(Nt,{modalRef:u,title:"Evidencia de entrega",size:"lg",btnSubmitText:"Registrar",onSubmit:Rr,children:t.jsxs("div",{className:"row",children:[t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Recibido por"}),t.jsx("input",{className:"form-control",value:N.recipient_name,onChange:e=>ie("recipient_name",e.target.value)})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Tipo doc."}),t.jsxs("select",{className:"form-control",value:N.recipient_document_type,onChange:e=>ie("recipient_document_type",e.target.value),children:[t.jsx("option",{value:"DNI",children:"DNI"}),t.jsx("option",{value:"RUC",children:"RUC"}),t.jsx("option",{value:"CE",children:"CE"}),t.jsx("option",{value:"OTRO",children:"Otro"})]})]}),t.jsxs("div",{className:"col-md-3 mb-3",children:[t.jsx("label",{className:"form-label",children:"Numero"}),t.jsx("input",{className:"form-control",value:N.recipient_document_number,onChange:e=>ie("recipient_document_number",e.target.value)})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Telefono"}),t.jsx("input",{className:"form-control",value:N.recipient_phone,onChange:e=>ie("recipient_phone",e.target.value)})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Fecha y hora entrega"}),t.jsx("input",{type:"datetime-local",className:"form-control",value:N.delivered_at,onChange:e=>ie("delivered_at",e.target.value)})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Foto / evidencia"}),t.jsx("input",{ref:b,className:"form-control",type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",capture:"environment",onChange:$r})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Latitud"}),t.jsx("input",{className:"form-control",value:N.latitude,onChange:e=>ie("latitude",e.target.value)})]}),t.jsxs("div",{className:"col-md-6 mb-3",children:[t.jsx("label",{className:"form-label",children:"Longitud"}),t.jsx("input",{className:"form-control",value:N.longitude,onChange:e=>ie("longitude",e.target.value)})]}),t.jsxs("div",{className:"col-12 mb-3",children:[t.jsx("label",{className:"form-label",children:"Observaciones"}),t.jsx("textarea",{className:"form-control",rows:"3",value:N.evidence_notes,onChange:e=>ie("evidence_notes",e.target.value)})]}),t.jsx("div",{className:"col-12",children:t.jsx("div",{className:"border rounded p-3",children:me?t.jsx("img",{src:me,alt:"Evidencia de entrega",className:"img-fluid rounded border bg-light",style:{maxHeight:360,width:"100%",objectFit:"contain"}}):N.evidence_url?t.jsx("a",{href:N.evidence_url,target:"_blank",rel:"noreferrer",children:"Abrir evidencia registrada"}):t.jsx("div",{className:"text-muted py-4 text-center",children:"Sin evidencia registrada"})})})]})})]})};Pr((r,i)=>{!i.can("orders")&&!i.hasRole("Admin")&&(location.href="/admin/"),Or(r).render(t.jsx(qr,{...i,title:i.pageTitle||"Pedidos comerciales",children:t.jsx(wn,{...i})}))});
