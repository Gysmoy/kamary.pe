import{C as Fr,c as Ar,j as r,r as s,S as xt,G as Pr}from"./CreateReactScript-BQEmHc8B.js";import{L as Br,G as Or,M as Mr}from"./esm-XAA1TWCO.js";import{B as Lr}from"./Base-BZJCfbcl.js";import{T as Gr}from"./Table-DsvFLxnp.js";import{M as vt}from"./Modal-BpHRFSoz.js";import{R as qr}from"./ReactAppend-CmCssPze.js";import{a as Re,S as ke}from"./SetSelectValue-CKeZntsZ.js";import{S as Ur}from"./SelectFormGroup-BeLjaap0.js";import{T as qt}from"./TextareaFormGroup-COu0G6AX.js";import{C as zr}from"./CommercialOrdersRest-C3qyJH3l.js";import{R as Vr}from"./ReferralGuidesRest-CIzM-URQ.js";import{o as tt,b as rt}from"./magistralesRecordPdf-C-x5GdgT.js";import{t as Wr,i as Hr,j as tr,k as Kr}from"./statusLabels-DafAwaKR.js";import"./BasicRest-BJmaHB2C.js";import"./tippy-react.esm-255dCUw_.js";import"./ubigeoInei-D0FnAslC.js";const B=new zr,Ut=new Vr,Qr=["client_kind","=","regular"],Yr=[1,2,3,4,5],Jr=["EFECTIVO [CONTADO]","TRANSFERENCIA [CONTADO]","YAPE [CONTADO]","PLIN [CONTADO]","TARJETA [CONTADO]","TRANSFERENCIA [CREDITO]"],fe=(t,{variant:i,title:a,icon:d,onClick:p})=>{const w=$('<button type="button"></button>').addClass(`btn btn-xs btn-soft-${i} commercial-order-action-btn`).attr("title",a).attr("aria-label",a).append($("<i></i>").addClass(d)).on("click",u=>{u.preventDefault(),u.stopPropagation(),p()});t.append(w)},Zr=t=>`commercial-order-status-badge commercial-order-status-${`${t??"empty"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-")||"empty"}`,zt=(t,i,a)=>{t.addClass("commercial-order-status-cell"),qr(t,r.jsx("span",{className:Zr(i),children:a(i)}))},Ue=()=>({uid:crypto.randomUUID(),article_id:"",article_label:"",article_code:"",article_lot:"",article_name:"",article_unit:"",article_laboratory:"",article_principle:"",presentations:[],presentation_id:"",presentation_units:1,stock_available:0,reserved_quantity:0,price_unit:0,quantity:1,gross_total:0,discount_type:"none",discount_value:0,discount_amount:0,total:0,price_source:"fallback",price_list_code:""}),Xr=t=>{if(!t)return"";const i=(t.name??"").toString().trim().split(" ")[0]??"",a=(t.lastname??"").toString().trim().split(" ")[0]??"",d=`${i} ${a}`.trim(),p=(t.username??"").toString().trim();return d&&p?`${d} (@${p})`:d||(p?`@${p}`:"")},en=t=>{if(!t)return"-";const i=(t.fullname??"").toString().trim();return i||`${t.name??""} ${t.lastname??""}`.trim()||(t.username??"").toString().trim()||"-"},tn=t=>t&&((t.username??"").toString().trim()||(t.fullname??"").toString().trim()||`${t.name??""} ${t.lastname??""}`.trim())||"-",ze=t=>Number(Number(t||0).toFixed(2)),rn=t=>$("<div>").text(t??"").html(),Se=t=>{const i=Number(Number(t||0).toFixed(3));return Number.isInteger(i)?`${i}`:`${i}`.replace(/\.?0+$/,"")},jt=t=>(t==null?void 0:t.price_source)==="manual",Vt=(t,i,a=!1)=>{const d=Number((t==null?void 0:t.price_unit)||0),p=Number(i==null?void 0:i.price_unit);return!a&&jt(t)||!Number.isFinite(p)||!a&&p<=0&&d>0?d:p},Wt=(t,i,a=!1)=>!a&&jt(t)?"manual":(i==null?void 0:i.source)||(t==null?void 0:t.price_source)||"fallback",nn=t=>{const i=`${t??""}`.replace(",",".").replace(/[^\d.]/g,"");if(!i)return"";const[a,...d]=i.split("."),p=a.replace(/^0+(?=\d)/,"")||(a||d.length?"0":""),w=d.length?`.${d.join("")}`:"";return`${p}${w}`},Ht=t=>{const i=nn(t.target.value);return t.target.value!==i&&(t.target.value=i),Number(i||0)},Kt=t=>{Number(t.target.value||0)===0&&t.target.select()},cn=(t,i,a)=>{const d=ze(t),p=Number(a||0);return!Number.isFinite(p)||p<=0||d<=0?0:i==="percent"?Math.min(d,ze(d*Math.min(p,100)/100)):i==="amount"?Math.min(d,ze(p)):0},be=t=>{const i=Number(t.quantity||0),a=Number(t.price_unit||0),d=Number.isFinite(i*a)?ze(i*a):0,p=cn(d,t.discount_type,t.discount_value);return{...t,discount_type:t.discount_type||"none",discount_value:t.discount_type==="none"?0:Number(t.discount_value||0),gross_total:d,discount_amount:p,total:ze(Math.max(0,d-p))}},it=t=>{const i=`${t??""}`.trim().toLowerCase();return i==="boleta"?"Boleta":["nota de pedido","nota_pedido","note_order"].includes(i)?"Nota de pedido":"Factura"},sn=t=>(t==null?void 0:t.billing_documents)??(t==null?void 0:t.billingDocuments)??[],rr=t=>sn(t)[0]??null,on=t=>{const i=rr(t);return(i==null?void 0:i.code)||[i==null?void 0:i.series,i==null?void 0:i.sequence].filter(Boolean).join("-")||(t==null?void 0:t.referral_guide)||(t==null?void 0:t.guide_number)||(t==null?void 0:t.purchase_order)||"-"},an=t=>{var i;return it(((i=rr(t))==null?void 0:i.document_type)??(t==null?void 0:t.document_type))},ln=t=>{const i=(t==null?void 0:t.client)??(t==null?void 0:t.eventual_client)??(t==null?void 0:t.eventualClient)??null,a=`${(i==null?void 0:i.document_number)??""}`.trim(),d=`${(i==null?void 0:i.full_name)??(i==null?void 0:i.business_name)??""}`.trim();return[a,d].filter(Boolean).join(" | ")||"-"},dn=t=>{const i=`${(t==null?void 0:t.payment_method)??""}`.trim(),a=`${(t==null?void 0:t.payment_condition)??""}`.trim();return!i&&!a?"-":!a||i.includes("[")?i||"-":`${i||"-"} [${a.toUpperCase()}]`},C=(t,i="")=>{if(t==null)return i;if(typeof t=="object")return t.address??t.reference??t.name??t.description??i;const a=`${t}`;return a==="[object Object]"?i:a},un=t=>`${t??""}`.toUpperCase().includes("CREDITO")?"Credito":"Contado",mn=t=>{const i=`${t??""}`.trim();return i?i.toUpperCase()==="TRANSFERENCIA"?"TRANSFERENCIA [CONTADO]":i:"EFECTIVO [CONTADO]"},pn=t=>C(t==null?void 0:t.full_address,C(t==null?void 0:t.address,C(t==null?void 0:t.fiscal_address))),fn=t=>C(t==null?void 0:t.ubigeo,C(t==null?void 0:t.district_ubigeo,C(t==null?void 0:t.inei_ubigeo))),Qt=t=>{const i=`${t??""}`.trim(),a=i.match(/^(client|eventual)-(\d+)$/);return a?a[2]:i},Yt=t=>{var u,h,S;if(t.loading)return t.text;const i=t.data??{},a=t.text||i.name||"",d=(u=i.branch)==null?void 0:u.name,p=(S=(h=i.branch)==null?void 0:h.business)==null?void 0:S.name,w=$("<span>").text(a);return d&&w.append($("<small>").addClass("text-muted ms-1").text(`- ${d}`)),p&&w.append($("<small>").addClass("text-muted ms-1").text(`(${p})`)),w},Z=t=>{if(!(t!=null&&t.current))return;const i=$(t.current);i.empty().val(null),i.trigger(i.data("select2")?"change.select2":"change")},bn=t=>t.article_id?"Unidad base":"Sin presentacion",hn=(t,i)=>{const a=(t==null?void 0:t.name)||"Presentacion",d=Se((t==null?void 0:t.units)||1),p=i!=null&&i.article_unit?` ${i.article_unit}`:" unidad(es) base";return`${a} (${d}${p})`},_n=t=>["Factura","Boleta"].includes(it(t)),Jt=(t,i)=>{const a=Number(t||0);if(!_n(i))return{subtotal:Number(a.toFixed(2)),taxAmount:0,total:Number(a.toFixed(2))};const d=Number((a/1.18).toFixed(2));return{subtotal:d,taxAmount:Number((a-d).toFixed(2)),total:Number(a.toFixed(2))}},gn=(t,i="")=>{const a=new Map;return(t??[]).flatMap(d=>{if(!(d!=null&&d.article_id))return[];const p=`${d.article_id}:${d.warehouse_id||i||""}`,w=Number(d.quantity||0),u=Number(d.presentation_units||1)||1,h=Number((w*u).toFixed(3)),S=Number(d.stock_available||0),T=Number(a.get(p)||0),P=Math.max(0,S-T),E=Math.min(h,P),O=Math.max(0,h-E);return a.set(p,T+E),O<=1e-4?[]:[{article:d.article_name||d.article_label||d.article_code||"Articulo",quantity:h,lineQuantity:w,presentationUnits:u,available:P,shortage:O}]})},yt=t=>(t==null?void 0:t.referral_guides)??(t==null?void 0:t.referralGuides)??[],nr=t=>(t==null?void 0:t.external_reference)||[t==null?void 0:t.series,t==null?void 0:t.sequence].filter(Boolean).join("-")||(t==null?void 0:t.code)||"-",xn=t=>t&&!["accepted","cancelled"].includes(t.guide_status),vn=t=>(t==null?void 0:t.delivery_evidences)??(t==null?void 0:t.deliveryEvidences)??[],Zt=t=>vn(t)[0]??null,yn=t=>(t==null?void 0:t.tracking_events)??(t==null?void 0:t.trackingEvents)??[],Xt=t=>{const i=`${t??""}`.trim();return i.startsWith("blob:")||i.startsWith("data:image/")||/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(i)||i.includes("/delivery-evidence-media/")},er=()=>{const t=new Date;return t.setMinutes(t.getMinutes()-t.getTimezoneOffset()),t.toISOString().slice(0,16)},nt={lat:-12.046374,lng:-77.042793},X=t=>{const i=Number(t);return Number.isFinite(i)?i:null},ct=t=>{const i=X(t);return i===null?"":i.toFixed(7)},ee=t=>X(t==null?void 0:t.lat)!==null&&X(t==null?void 0:t.lng)!==null,jn=({modalRef:t,position:i,searchText:a,onPositionChange:d,onSearchTextChange:p,onAddressSelected:w,googleMapsApiKey:u})=>{const h=s.useRef(),[S,T]=s.useState(!1),[P,E]=s.useState(""),[O,q]=s.useState([]),U=ee(i)?{lat:X(i.lat),lng:X(i.lng)}:nt,F=(f,R=17)=>{const z=X(f==null?void 0:f.lat),L=X(f==null?void 0:f.lng);z===null||L===null||!h.current||(h.current.setCenter({lat:z,lng:L}),h.current.setZoom(R))},de=f=>{d(f),F(f)};s.useEffect(()=>{if(ee(i)){F(U);return}F(nt,13)},[i==null?void 0:i.lat,i==null?void 0:i.lng]),s.useEffect(()=>{const f=t==null?void 0:t.current;if(!f)return;const R=()=>{setTimeout(()=>{ee(i)?F(U):F(nt,13)},180)};return $(f).on("shown.bs.modal",R),()=>$(f).off("shown.bs.modal",R)},[t,i==null?void 0:i.lat,i==null?void 0:i.lng]);const M=async()=>{var R,z;const f=`${a??""}`.trim();if(!f){q([]),E("Escribe una direccion para buscar.");return}if(!((z=(R=window.google)==null?void 0:R.maps)!=null&&z.Geocoder)){E("Google Maps aun no termino de cargar.");return}T(!0),E("");try{new window.google.maps.Geocoder().geocode({address:`${f}, Peru`,componentRestrictions:{country:"PE"},region:"PE"},(te,_e)=>{if(T(!1),_e!=="OK"||!Array.isArray(te)||te.length===0){q([]),E("Sin resultados. Puedes marcar el punto manualmente en el mapa.");return}q(te.slice(0,5).map(Y=>({place_id:Y.place_id,display_name:Y.formatted_address,lat:Y.geometry.location.lat(),lng:Y.geometry.location.lng()})))})}catch(L){T(!1),E(`${L.message}. Puedes marcar el punto manualmente en el mapa.`),q([])}},he=f=>{const R={lat:X(f.lat),lng:X(f.lng)};d(R),p(f.display_name??""),w(f.display_name??""),F(R),q([])};return r.jsxs("div",{className:"commercial-order-map-picker",children:[r.jsxs("div",{className:"commercial-order-map-search",children:[r.jsxs("div",{children:[r.jsx("label",{className:"form-label",children:"Buscar direccion en mapa"}),r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:"text",className:"form-control",value:a,onChange:f=>p(f.target.value),onKeyDown:f=>{f.key==="Enter"&&(f.preventDefault(),M())},placeholder:"Ej. Av. Javier Prado 123, San Isidro"}),r.jsx("button",{type:"button",className:"btn btn-outline-primary",onClick:M,disabled:S,children:S?"Buscando...":"Buscar"})]})]}),r.jsxs("div",{className:"commercial-order-map-coordinates",children:[r.jsx("label",{className:"form-label",children:"Coordenadas"}),r.jsxs("div",{className:"commercial-order-map-coordinate-values",children:[r.jsx("span",{children:ct(i==null?void 0:i.lat)||"-"}),r.jsx("span",{children:ct(i==null?void 0:i.lng)||"-"})]})]})]}),O.length>0&&r.jsx("div",{className:"commercial-order-map-results",children:O.map(f=>r.jsx("button",{type:"button",className:"commercial-order-map-result",onClick:()=>he(f),children:f.display_name},`${f.place_id}-${f.lat}-${f.lng}`))}),P&&r.jsx("small",{className:"text-muted d-block mt-1",children:P}),r.jsx(Br,{googleMapsApiKey:u,language:"es",region:"PE",onError:()=>E("No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio."),children:r.jsx(Or,{mapContainerClassName:"commercial-order-map-canvas",center:U,zoom:ee(i)?17:13,options:{clickableIcons:!0,fullscreenControl:!0,gestureHandling:"greedy",mapTypeControl:!0,scrollwheel:!0,streetViewControl:!1},onLoad:f=>{h.current=f,setTimeout(()=>{ee(i)?F(U):F(nt,13)},120)},onClick:f=>{const R={lat:f.latLng.lat(),lng:f.latLng.lng()};de(R)},children:ee(i)&&r.jsx(Mr,{position:U,draggable:!0,onDragEnd:f=>de({lat:f.latLng.lat(),lng:f.latLng.lng()})})})}),r.jsx("small",{className:"text-muted d-block mt-2",children:"Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega."})]})},Nn=t=>{const i=`${Pr.GMAPS_API_KEY??""}`.trim();return i?r.jsx(jn,{...t,googleMapsApiKey:i}):r.jsx("div",{className:"commercial-order-map-picker",children:r.jsx("div",{className:"commercial-order-map-empty",children:"Configura Google Maps API Key en Sistemas > Datos generales > Integraciones para habilitar el mapa."})})},wn=t=>!t||t.status===null||`${t.order_status??""}`=="cancelled"?!1:`${t.dispatch_status??"pending"}`=="pending",Cn=t=>{if(!t)return[];const i=yn(t).map(u=>({date:u.happened_at??u.created_at,status:[u.title,u.description].filter(Boolean).join(" - ")})),a=[{date:t.created_at,status:"La orden ingreso en el sistema"}];t.approved_at&&["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)?a.push({date:t.approved_at,status:"La orden paso a preparacion"}):t.approved_at&&t.order_status==="confirmed"?a.push({date:t.approved_at,status:"La orden fue confirmada"}):["preparing","in_route","delivered","dispatched","billed","closed"].includes(t.order_status)&&a.push({date:t.updated_at,status:"La orden paso a preparacion"});const d=(t.dispatch_assignments??t.dispatchAssignments??[]).filter(u=>(u==null?void 0:u.status)!==!1&&(u==null?void 0:u.status)!==0&&(u==null?void 0:u.dispatch)).sort((u,h)=>{var S,T,P,E;return new Date(((S=u==null?void 0:u.dispatch)==null?void 0:S.departed_at)||((T=u==null?void 0:u.dispatch)==null?void 0:T.scheduled_date)||0)-new Date(((P=h==null?void 0:h.dispatch)==null?void 0:P.departed_at)||((E=h==null?void 0:h.dispatch)==null?void 0:E.scheduled_date)||0)}),p=d.find(u=>{var h;return["in_route","delivered","closed"].includes((h=u==null?void 0:u.dispatch)==null?void 0:h.dispatch_status)});p?(a.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:`Manifiesto ${p.dispatch.manifest_code||p.dispatch.code||""}`.trim()}),a.push({date:p.dispatch.departed_at??p.dispatch.updated_at??p.dispatch.created_at,status:"El pedido salio en ruta"})):t.dispatch_status==="in_route"&&a.push({date:t.updated_at,status:"El pedido salio en ruta"}),(t.dispatch_status==="dispatched"||d.some(u=>{var h;return((h=u==null?void 0:u.dispatch)==null?void 0:h.dispatch_status)==="dispatched"}))&&a.push({date:t.updated_at,status:"El pedido paso a despacho"}),yt(t).forEach(u=>{a.push({date:u.issue_date??u.created_at??t.updated_at,status:`Guia de remision ${nr(u)} - ${tr(u.guide_status)}`})});const w=d.find(u=>{var h;return["delivered","closed"].includes((h=u==null?void 0:u.dispatch)==null?void 0:h.dispatch_status)});return w?a.push({date:w.dispatch.delivered_at??w.dispatch.updated_at??w.dispatch.created_at,status:"El pedido fue entregado"}):t.dispatch_status==="delivered"&&a.push({date:t.updated_at,status:"El pedido fue entregado"}),(t.order_status==="cancelled"||t.dispatch_status==="cancelled")&&a.push({date:t.updated_at,status:"El pedido fue cancelado"}),[...i,...a].filter(u=>u.date).sort((u,h)=>new Date(u.date)-new Date(h.date))},$n=({requiredPermission:t="orders",externalSource:i=null,pageTitle:a="Pedidos comerciales"})=>{B.externalSource=i||null;const d=s.useRef(),p=s.useRef(),w=s.useRef(),u=s.useRef(),h=s.useRef(),S=s.useRef(),T=s.useRef(),P=s.useRef(),E=s.useRef(),O=s.useRef(),q=s.useRef(),U=s.useRef(),F=s.useRef(),de=s.useRef(),M=s.useRef(),he=s.useRef(),f=s.useRef(),R=s.useRef(),z=s.useRef(),L=s.useRef(),te=s.useRef(),_e=s.useRef(),Y=s.useRef(),Ve=s.useRef(),We=s.useRef(),He=s.useRef(),Ke=s.useRef(),Qe=s.useRef(),ir=s.useRef(),V=s.useRef(),ge=s.useRef(),re=s.useRef(),xe=s.useRef(),ve=s.useRef(),Ye=s.useRef(),st=s.useRef({}),[cr,sr]=s.useState(!1),[ye,Nt]=s.useState(""),[W,Je]=s.useState(""),[H,Ze]=s.useState(""),[je,ot]=s.useState(""),[Ne,at]=s.useState(""),[K,Ee]=s.useState(""),[or,ue]=s.useState(""),[lt,dt]=s.useState({lat:"",lng:""}),[ar,Xe]=s.useState(""),[lr,wt]=s.useState([]),[De,et]=s.useState([]),[Rn,we]=s.useState([]),[J,Q]=s.useState([Ue()]),[Ie,Ct]=s.useState("Factura"),[ne,ut]=s.useState(null),[$t,dr]=s.useState(null),[Ce,ur]=s.useState(null),[Rt,mt]=s.useState(null),[me,pt]=s.useState(""),[N,ft]=s.useState({recipient_name:"",recipient_document_type:"DNI",recipient_document_number:"",recipient_phone:"",delivered_at:er(),evidence_notes:"",evidence_url:"",latitude:"",longitude:""}),mr=s.useMemo(()=>{var n;const e=new URLSearchParams;return ye&&e.append("business_id",ye),W&&e.append("business_branch_id",W),H&&e.append("warehouse_id",H),je&&e.append("client_id",je),Ne&&e.append("eventual_client_id",Ne),K&&e.append("client_distribution_network_id",K),(n=M.current)!=null&&n.value&&e.append("issue_date",M.current.value),`/api/admin/commercial-orders/articles?${e.toString()}`},[ye,W,H,je,Ne,K]),pr=s.useMemo(()=>W?["business_branch_id","=",Number(W)]:null,[W]);s.useEffect(()=>()=>{me!=null&&me.startsWith("blob:")&&URL.revokeObjectURL(me)},[me]),s.useEffect(()=>{if(!ne)return;const e=()=>ut(null),n=c=>{c.key==="Escape"&&e()};return document.addEventListener("click",e),document.addEventListener("keydown",n),window.addEventListener("resize",e),window.addEventListener("scroll",e,!0),()=>{document.removeEventListener("click",e),document.removeEventListener("keydown",n),window.removeEventListener("resize",e),window.removeEventListener("scroll",e,!0)}},[ne]);const kt=e=>(st.current[e]||(st.current[e]=s.createRef()),st.current[e]);s.useEffect(()=>{J.forEach(e=>{const n=kt(e.uid);!n.current||!e.article_id||!e.article_label||`${$(n.current).val()}`==`${e.article_id}`||Re(n.current,e.article_id,e.article_label)})},[J]);const St=async(e,n=null)=>{if(!e){wt([]),Je("");return}const m=(await B.getBranchesByBusiness(e)??[]).filter(l=>l.status!==null);if(wt(m),n&&m.some(l=>`${l.id}`==`${n}`)){Je(`${n}`);return}Je("")},Et=e=>{if(!e)return;const n=pn(e),c=fn(e);n&&V.current&&(V.current.value=n),c&&re.current&&(re.current.value=c),n&&Xe(n)},Dt=async(e,n=null,c=null)=>{var v;if(!e){et([]),Ee(""),we([]),ue("");return}const l=(await B.getDistributionNetworks(e)??[]).filter(_=>_.status!==null);et(l);const o=n||((v=l.find(_=>_.is_default))==null?void 0:v.id);if(o&&l.some(_=>`${_.id}`==`${o}`)){Ee(`${o}`),await It(o,null,l);return}Ee(""),we([]),ue(""),Et(c)},It=async(e,n=null,c=null)=>{var _,j;if(!e){we([]),ue("");return}let m=[];const l=(c??De).find(g=>`${g.id}`==`${e}`);(((_=l==null?void 0:l.addresses)==null?void 0:_.length)??0)>0?m=l.addresses:m=await B.getDeliveryAddresses(e);const o=(m??[]).filter(g=>g.status!==null);we(o);const v=n||((j=o.find(g=>g.is_default))==null?void 0:j.id);if(v&&o.some(g=>`${g.id}`==`${v}`)){ue(`${v}`),fr(o.find(g=>`${g.id}`==`${v}`));return}ue("")},fr=e=>{e&&(V.current&&(V.current.value=C(e.address)),ge.current&&(ge.current.value=C(e.reference)),re.current&&(re.current.value=C(e.ubigeo)),xe.current&&(xe.current.value=C(e.contact_name)),ve.current&&(ve.current.value=C(e.contact_phone)),Xe(C(e.address)),ee({lat:e.latitude,lng:e.longitude})&&dt({lat:Number(e.latitude),lng:Number(e.longitude)}))},Tt=async(e,n={})=>{var o,v,_;const c=n.article_id??e.article_id,m=Number(n.quantity??e.quantity??0),l=n.presentation_id??e.presentation_id;return!c||!H||m<=0?null:await B.resolvePrice({article_id:c,presentation_id:l||null,quantity:m,business_id:ye||null,business_branch_id:W||null,warehouse_id:H||null,client_id:je||null,eventual_client_id:Ne||null,client_distribution_network_id:K||null,issue_date:((o=M.current)==null?void 0:o.value)||null,commercial_channel:((v=De.find(j=>`${j.id}`==`${K}`))==null?void 0:v.commercial_channel)||null,segment:((_=De.find(j=>`${j.id}`==`${K}`))==null?void 0:_.segment)||null})},bt=async(e=null)=>{const n=e??J;for(const c of n){if(!c.article_id)continue;const m=await Tt(c);m&&Q(l=>l.map(o=>o.uid!==c.uid?o:be({...o,stock_available:Number(m.stock_available||0),price_unit:Vt(o,m),price_source:Wt(o,m),price_list_code:m.price_list_code||""})))}},Ft=e=>{e==="regular"?(at(""),Z(U)):e==="eventual"&&(ot(""),et([]),Ee(""),we([]),ue(""),Z(q))},At=async(e=null)=>{var _,j,g,G;sr(!!(e!=null&&e.id)),S.current&&(S.current.value=(e==null?void 0:e.id)??""),T.current&&(T.current.value=(e==null?void 0:e.code)??"Se genera al guardar"),M.current&&(M.current.value=e!=null&&e.issue_date?e.issue_date.toString().slice(0,10):new Date().toISOString().slice(0,10)),he.current&&(he.current.value=e!=null&&e.promised_delivery_at?e.promised_delivery_at.toString().slice(0,10):""),Ct(it((e==null?void 0:e.document_type)??"Factura")),R.current&&(R.current.value=(e==null?void 0:e.currency)??"PEN"),z.current&&(z.current.value=(e==null?void 0:e.payment_condition)??"Contado"),L.current&&(L.current.value=mn(e==null?void 0:e.payment_method)),Ve.current&&(Ve.current.value=(e==null?void 0:e.installments)??1),We.current&&(We.current.value=e!=null&&e.first_due_date?e.first_due_date.toString().slice(0,10):""),He.current&&(He.current.value=(e==null?void 0:e.order_status)??(e!=null&&e.external_source?"pending":"draft")),Ke.current&&(Ke.current.value=(e==null?void 0:e.dispatch_status)??"pending"),Qe.current&&(Qe.current.value=(e==null?void 0:e.billing_status)??"pending"),V.current&&(V.current.value=C(e==null?void 0:e.delivery_address)),ge.current&&(ge.current.value=C(e==null?void 0:e.delivery_reference)),re.current&&(re.current.value=C(e==null?void 0:e.ubigeo)),xe.current&&(xe.current.value=C(e==null?void 0:e.dispatch_contact_name)),ve.current&&(ve.current.value=C(e==null?void 0:e.dispatch_contact_phone)),te.current&&(te.current.value=(e==null?void 0:e.purchase_order)??""),_e.current&&(_e.current.value=(e==null?void 0:e.guide_number)??""),Y.current&&(Y.current.value=(e==null?void 0:e.referral_guide)??""),de.current&&(de.current.value=(e==null?void 0:e.doctor_name)??""),Ye.current&&(Ye.current.value=(e==null?void 0:e.observations)??""),dt({lat:ee({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lat):"",lng:ee({lat:e==null?void 0:e.map_lat,lng:e==null?void 0:e.map_lng})?Number(e.map_lng):""}),Xe(C(e==null?void 0:e.delivery_address));const n=e!=null&&e.business_id?`${e.business_id}`:"",c=e!=null&&e.warehouse_id?`${e.warehouse_id}`:"",m=e!=null&&e.client_id?`${e.client_id}`:"",l=e!=null&&e.eventual_client_id?`${e.eventual_client_id}`:"";Nt(n),Ze(c),ot(m),at(l),n&&((_=e==null?void 0:e.business)!=null&&_.name)?Re(P.current,n,e.business.name):Z(P),c&&((j=e==null?void 0:e.warehouse)!=null&&j.name)?Re(O.current,c,e.warehouse.name):Z(O),m&&((g=e==null?void 0:e.client)!=null&&g.full_name)?Re(q.current,m,`${e.client.document_number??""} - ${e.client.full_name}`.trim()):Z(q),l&&((G=e==null?void 0:e.eventual_client)!=null&&G.business_name)?Re(U.current,l,`${e.eventual_client.document_number??""} - ${e.eventual_client.business_name}`.trim()):Z(U),e!=null&&e.seller_id&&(e!=null&&e.seller)?Re(F.current,e.seller_id,Xr(e.seller)):Z(F);const o=((e==null?void 0:e.items)??[]).map(y=>{var se,oe,ae,le,x,k,Te,Fe,Ae,Pe,Be,Oe,Me,Le,Ge,qe;const b=y.article??null,ce=((b==null?void 0:b.presentations)??[]).filter(D=>(D==null?void 0:D.status)!==!1&&(D==null?void 0:D.status)!==0),A=y.presentation??ce[0]??null,pe=Number(y.presentation_units??(A==null?void 0:A.units)??1)||1;return be({uid:crypto.randomUUID(),article_id:y.article_id?`${y.article_id}`:"",article_label:b?`${b.code??""} - ${b.name??""}`.trim():"",article_code:(b==null?void 0:b.code)??y.external_sku??"",article_lot:(b==null?void 0:b.default_lot)??"",article_name:(b==null?void 0:b.name)??"",article_unit:((se=b==null?void 0:b.unit)==null?void 0:se.symbol)??((oe=b==null?void 0:b.unit)==null?void 0:oe.name)??"",article_laboratory:((ae=b==null?void 0:b.laboratory)==null?void 0:ae.name)??"",article_principle:((le=b==null?void 0:b.activePrinciple)==null?void 0:le.name)??((x=b==null?void 0:b.active_principle)==null?void 0:x.name)??"",presentations:ce.map(D=>({id:`${D.id}`,name:D.name??"Presentacion",units:Number(D.units||1),price:Number(D.price||0)})),presentation_id:A!=null&&A.id?`${A.id}`:"",presentation_units:pe,stock_available:Number(y.stock_available||0),reserved_quantity:Number(y.reserved_quantity||0),price_unit:Number(y.price_unit||0),quantity:Number(y.quantity||1),discount_type:((Te=(k=y.external_payload)==null?void 0:k.commercial_form)==null?void 0:Te.discount_type)??"none",discount_value:Number(((Ae=(Fe=y.external_payload)==null?void 0:Fe.commercial_form)==null?void 0:Ae.discount_value)||0),discount_amount:Number(((Be=(Pe=y.external_payload)==null?void 0:Pe.commercial_form)==null?void 0:Be.discount_amount)||0),gross_total:Number(((Me=(Oe=y.external_payload)==null?void 0:Oe.commercial_form)==null?void 0:Me.gross_total)||0),total:Number(y.total||0),price_source:y.price_source||"fallback",price_list_code:((Ge=(Le=y==null?void 0:y.price_list_item)==null?void 0:Le.price_list)==null?void 0:Ge.code)||((qe=e==null?void 0:e.price_list)==null?void 0:qe.code)||""})}),v=o.length?o:[Ue()];Q(v),$(p.current).modal("show"),await St((e==null?void 0:e.business_id)??null,(e==null?void 0:e.business_branch_id)??null),m?(await Dt(m,(e==null?void 0:e.client_distribution_network_id)??null),e!=null&&e.client_distribution_network_id&&await It(e.client_distribution_network_id,(e==null?void 0:e.client_delivery_address_id)??null)):(et([]),Ee(""),we([]),ue(""))},br=async e=>{var l,o,v,_,j,g,G,y,b,ce,A,pe,se,oe,ae,le,x,k,Te,Fe,Ae,Pe,Be,Oe,Me,Le,Ge,qe,D,Ot,Mt,Lt,Gt;e.preventDefault();const n={id:((l=S.current)==null?void 0:l.value)||void 0,external_source:i||void 0,business_id:ye||null,business_branch_id:W||null,warehouse_id:H||null,client_id:je||null,eventual_client_id:Ne||null,seller_id:((o=F.current)==null?void 0:o.value)||null,client_distribution_network_id:K||null,client_delivery_address_id:or||null,document_type:Ie,currency:((v=R.current)==null?void 0:v.value)||"PEN",payment_condition:un(((_=L.current)==null?void 0:_.value)||((j=z.current)==null?void 0:j.value)||"Contado"),payment_method:((g=L.current)==null?void 0:g.value)||"",purchase_order:((y=(G=te.current)==null?void 0:G.value)==null?void 0:y.trim())||"",guide_number:((ce=(b=_e.current)==null?void 0:b.value)==null?void 0:ce.trim())||"",referral_guide:((pe=(A=Y.current)==null?void 0:A.value)==null?void 0:pe.trim())||"",doctor_name:((oe=(se=de.current)==null?void 0:se.value)==null?void 0:oe.trim())||"",issue_date:((ae=M.current)==null?void 0:ae.value)||"",promised_delivery_at:((le=he.current)==null?void 0:le.value)||null,installments:((x=Ve.current)==null?void 0:x.value)||1,first_due_date:((k=We.current)==null?void 0:k.value)||null,order_status:((Te=He.current)==null?void 0:Te.value)||(i?"pending":"draft"),dispatch_status:((Fe=Ke.current)==null?void 0:Fe.value)||"pending",billing_status:((Ae=Qe.current)==null?void 0:Ae.value)||"pending",tax_amount:gt.taxAmount,delivery_address:((Be=(Pe=V.current)==null?void 0:Pe.value)==null?void 0:Be.trim())||"",delivery_reference:((Me=(Oe=ge.current)==null?void 0:Oe.value)==null?void 0:Me.trim())||"",ubigeo:((Ge=(Le=re.current)==null?void 0:Le.value)==null?void 0:Ge.trim())||"",map_lat:ct(lt.lat)||null,map_lng:ct(lt.lng)||null,dispatch_contact_name:((D=(qe=xe.current)==null?void 0:qe.value)==null?void 0:D.trim())||"",dispatch_contact_phone:((Mt=(Ot=ve.current)==null?void 0:Ot.value)==null?void 0:Mt.trim())||"",observations:((Gt=(Lt=Ye.current)==null?void 0:Lt.value)==null?void 0:Gt.trim())||"",items:J.map(I=>({article_id:I.article_id||null,presentation_id:I.presentation_id||null,warehouse_id:H||null,stock_available:I.stock_available,reserved_quantity:I.reserved_quantity,presentation_units:I.presentation_units,price_unit:I.price_unit,quantity:I.quantity,gross_total:I.gross_total,discount_type:I.discount_type,discount_value:I.discount_value,discount_amount:I.discount_amount,total:I.total,status:!0}))},c=gn(J,H);if(c.length>0){const I=`
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${c.map($e=>`<li><strong>${rn($e.article)}</strong>: faltan ${Se($e.shortage)} unidad(es) base para completar ${Se($e.quantity)}. Cantidad: ${Se($e.lineQuantity)} x ${Se($e.presentationUnits)}. Disponible: ${Se($e.available)}.</li>`).join("")}
          </ul>
        </div>
      `,{isConfirmed:Tr}=await xt.fire({title:"Stock insuficiente",html:I,icon:"warning",showCancelButton:!0,confirmButtonText:"Crear de todas formas",cancelButtonText:"Revisar pedido"});if(!Tr)return;n.allow_stock_shortage=!0}await B.save(n)&&($(d.current).dxDataGrid("instance").refresh(),$(p.current).modal("hide"))},hr=async e=>{const n=e.target.value||"";Nt(n),Ze(""),Z(O),await St(n,null)},_r=e=>{const n=e.target.value||"";Je(n),Ze(""),Z(O)},gr=async e=>{const n=e.target.value||"";Ze(n),await bt()},xr=async e=>{var m,l;const n=Qt(e.target.value),c=((l=(m=$(e.target).select2("data"))==null?void 0:m[0])==null?void 0:l.data)??null;ot(n),Ft("regular"),Et(c),await Dt(n,null,c),await bt()},vr=async e=>{const n=Qt(e.target.value);at(n),Ft("eventual"),await bt()},yr=async({id:e,field:n,value:c})=>{await B.boolean({id:e,field:n,value:c})&&$(d.current).dxDataGrid("instance").refresh()},jr=e=>{dr(e),$(w.current).modal("show")},Nr=e=>{const n=Zt(e);ur(e),mt(null),pt(Xt(n==null?void 0:n.evidence_url)?n.evidence_url:""),ft({recipient_name:(n==null?void 0:n.recipient_name)??(e==null?void 0:e.dispatch_contact_name)??"",recipient_document_type:(n==null?void 0:n.recipient_document_type)??"DNI",recipient_document_number:(n==null?void 0:n.recipient_document_number)??"",recipient_phone:(n==null?void 0:n.recipient_phone)??(e==null?void 0:e.dispatch_contact_phone)??"",delivered_at:n!=null&&n.delivered_at?`${n.delivered_at}`.replace(" ","T").slice(0,16):er(),evidence_notes:(n==null?void 0:n.evidence_notes)??"",evidence_url:(n==null?void 0:n.evidence_url)??"",latitude:(n==null?void 0:n.latitude)??"",longitude:(n==null?void 0:n.longitude)??""}),navigator.geolocation&&navigator.geolocation.getCurrentPosition(c=>{ft(m=>({...m,latitude:m.latitude||c.coords.latitude,longitude:m.longitude||c.coords.longitude}))},()=>{},{enableHighAccuracy:!0,timeout:5e3}),setTimeout(()=>{h.current&&(h.current.value="")},0),$(u.current).modal("show")},wr=e=>{var c;const n=((c=e.target.files)==null?void 0:c[0])??null;mt(n),pt(n?URL.createObjectURL(n):Xt(N.evidence_url)?N.evidence_url:"")},ie=(e,n)=>ft(c=>({...c,[e]:n})),Cr=async e=>{if(e.preventDefault(),!(Ce!=null&&Ce.id))return;const n=(Ce.dispatch_assignments??Ce.dispatchAssignments??[]).filter(l=>(l==null?void 0:l.status)!==!1&&(l==null?void 0:l.status)!==0&&(l==null?void 0:l.dispatch)).sort((l,o)=>{var v,_;return new Date(((v=o==null?void 0:o.dispatch)==null?void 0:v.scheduled_date)||(o==null?void 0:o.created_at)||0)-new Date(((_=l==null?void 0:l.dispatch)==null?void 0:_.scheduled_date)||(l==null?void 0:l.created_at)||0)})[0],c=new FormData;n!=null&&n.dispatch_id&&c.append("dispatch_id",n.dispatch_id),c.append("recipient_name",N.recipient_name??""),c.append("recipient_document_type",N.recipient_document_type??"DNI"),c.append("recipient_document_number",N.recipient_document_number??""),c.append("recipient_phone",N.recipient_phone??""),c.append("delivered_at",N.delivered_at??""),c.append("evidence_notes",N.evidence_notes??""),c.append("evidence_url",N.evidence_url??""),c.append("latitude",N.latitude??""),c.append("longitude",N.longitude??""),Rt&&c.append("evidence_file",Rt),await B.saveDeliveryEvidence(Ce.id,c)&&(mt(null),pt(""),h.current&&(h.current.value=""),$(u.current).modal("hide"),$(d.current).dxDataGrid("instance").refresh())},$r=async e=>{const n=yt(e)[0];if(n){if(xn(n)){const m=await xt.fire({title:"Guia de remision",text:`La guia ${nr(n)} esta ${tr(n.guide_status).toLowerCase()}.`,icon:"question",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Ver PDF",cancelButtonText:"Cancelar"});if(m.isConfirmed){const l=await Ut.issue(n.id);if(!(l!=null&&l.data))return;$(d.current).dxDataGrid("instance").refresh(),await tt(rt.referralGuide(l.data));return}if(!m.isDenied)return}await tt(rt.referralGuide(n));return}const c=await Ut.prepareFromCommercialOrder(e.id);c!=null&&c.data&&($(d.current).dxDataGrid("instance").refresh(),await tt(rt.referralGuide(c.data)))},Rr=async e=>{const{isConfirmed:n}=await xt.fire({title:"Eliminar pedido comercial",text:"Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!n||!await B.delete(e)||$(d.current).dxDataGrid("instance").refresh()},kr=async(e,n)=>{var y,b,ce,A,pe,se,oe,ae,le;$(n.target).data("select2")&&$(n.target).select2("close");const c=(y=$(n.target).select2("data"))==null?void 0:y[0],m=(c==null?void 0:c.data)??null,l=n.target.value||"";if(!l){Q(x=>x.map(k=>k.uid===e?{...Ue(),uid:k.uid}:k));return}const o=m??await B.getArticleById(l),v=((o==null?void 0:o.presentations)??[]).filter(x=>(x==null?void 0:x.status)!==!1&&(x==null?void 0:x.status)!==0),_=v[0]??null,j=o?`${o.code??""} - ${o.name??""}`.trim():(c==null?void 0:c.text)??l,g={article_id:l,article_label:j,article_code:(o==null?void 0:o.code)??"",article_lot:(o==null?void 0:o.default_lot)??"",article_name:(o==null?void 0:o.name)??"",article_unit:((b=o==null?void 0:o.unit)==null?void 0:b.symbol)??((ce=o==null?void 0:o.unit)==null?void 0:ce.name)??"",article_laboratory:((A=o==null?void 0:o.laboratory)==null?void 0:A.name)??"",article_principle:((pe=o==null?void 0:o.activePrinciple)==null?void 0:pe.name)??((se=o==null?void 0:o.active_principle)==null?void 0:se.name)??"",presentations:v.map(x=>({id:`${x.id}`,name:x.name??"Presentacion",units:Number(x.units||1),price:Number(x.price||0)})),presentation_id:_?`${_.id}`:"",presentation_units:Number((_==null?void 0:_.units)||1),quantity:1};Q(x=>x.map(k=>k.uid===e?be({...k,...g}):k));const G=await B.resolvePrice({article_id:l,presentation_id:_?`${_.id}`:null,quantity:1,business_id:ye||null,business_branch_id:W||null,warehouse_id:H||null,client_id:je||null,eventual_client_id:Ne||null,client_distribution_network_id:K||null,issue_date:((oe=M.current)==null?void 0:oe.value)||null,commercial_channel:((ae=De.find(x=>`${x.id}`==`${K}`))==null?void 0:ae.commercial_channel)||null,segment:((le=De.find(x=>`${x.id}`==`${K}`))==null?void 0:le.segment)||null});G&&Q(x=>x.map(k=>k.uid===e?be({...k,...g,stock_available:Number(G.stock_available||0),price_unit:Number(G.price_unit||0),price_source:G.source||"fallback",price_list_code:G.price_list_code||""}):k))},ht=async(e,n,c)=>{const m=J.find(j=>j.uid===e);if(!m)return;const l=n==="presentation_id"?m.presentations.find(j=>`${j.id}`==`${c}`):null,o=be({...m,[n]:c,...n==="presentation_id"?{presentation_units:Number((l==null?void 0:l.units)||1)}:{}});if(n==="price_unit"&&(o.price_source="manual",o.price_list_code=""),Q(j=>j.map(g=>g.uid===e?o:g)),!["quantity","presentation_id"].includes(n))return;const v=o.presentations.find(j=>`${j.id}`==`${n==="presentation_id"?c:o.presentation_id}`),_=await Tt(o,{quantity:n==="quantity"?c:o.quantity,presentation_id:n==="presentation_id"?c:o.presentation_id});_&&Q(j=>j.map(g=>g.uid!==e?g:be({...g,presentation_units:Number((v==null?void 0:v.units)||g.presentation_units||1),stock_available:Number(_.stock_available||0),price_unit:Vt(g,_,n==="presentation_id"),price_source:Wt(g,_,n==="presentation_id"),price_list_code:n==="presentation_id"?_.price_list_code||"":jt(g)?g.price_list_code:_.price_list_code||""})))},Sr=(e,n)=>{const c=Number(n||0);Q(m=>m.map(l=>l.uid!==e?l:be({...l,discount_type:c>0?"percent":"none",discount_value:c>0?c:0})))},Er=(e,n)=>{n.preventDefault(),n.stopPropagation();const c=n.currentTarget.getBoundingClientRect();ut(m=>(m==null?void 0:m.uid)===e?null:{uid:e,top:c.bottom+4,left:c.left,width:Math.max(c.width,130)})},Pt=(e,n)=>{Sr(e,n),ut(null)},Dr=()=>Q(e=>[...e,Ue()]),Ir=e=>{Q(n=>{const c=n.filter(m=>m.uid!==e);return c.length?c:[Ue()]})},_t=s.useMemo(()=>J.reduce((e,n)=>e+Number(n.total||0),0),[J]),gt=s.useMemo(()=>Jt(_t,Ie),[_t,Ie]),Bt=s.useMemo(()=>Cn($t),[$t]);return r.jsxs(r.Fragment,{children:[r.jsx("style",{children:`
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
    `}),r.jsx(Gr,{gridRef:d,title:a,rest:B,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(d.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"add",title:"Agregar",hint:"Agregar pedido comercial",onClick:()=>At(null)}})},pageSize:25,columns:[{caption:"Acciones",width:300,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(e,{data:n})=>{const c=yt(n).length>0;e.css("text-overflow","unset"),e.addClass("commercial-order-actions"),fe(e,{variant:"primary",title:"Editar datos, cliente, entrega y productos del pedido comercial",icon:"mdi mdi-pencil",onClick:()=>At(n)}),wn(n)&&fe(e,{variant:"success",title:"Enviar este pedido a preparacion para iniciar picking",icon:"mdi mdi-clipboard-check-outline",onClick:()=>yr({id:n.id,field:"dispatch_status",value:"preparing"})}),fe(e,{variant:"info",title:"Ver historial de estados, guia, ruta y entrega del pedido",icon:"mdi mdi-map-marker-path",onClick:()=>jr(n)}),fe(e,{variant:c?"dark":"warning",title:c?"Ver, emitir o descargar la guia de remision asociada al pedido":"Generar guia de remision para este pedido",icon:c?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>$r(n)}),fe(e,{variant:"success",title:Zt(n)?"Ver o actualizar foto y datos de evidencia de entrega":"Registrar foto y datos de evidencia de entrega",icon:"mdi mdi-camera",onClick:()=>Nr(n)}),fe(e,{variant:"danger",title:"Imprimir o descargar PDF resumen del pedido comercial",icon:"mdi mdi-file-pdf-box",onClick:()=>tt(rt.commercialOrder(n))}),fe(e,{variant:"danger",title:"Eliminar este pedido comercial del listado",icon:"mdi mdi-delete",onClick:()=>Rr(n.id)})}},{dataField:"order_status",caption:"Estado",width:140,lookup:Wr(Hr),cellTemplate:(e,{value:n})=>zt(e,n,Kr)},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:on},{dataField:"document_type",caption:"Tipo documento",width:130,calculateCellValue:an,cellTemplate:(e,{value:n})=>zt(e,n,c=>c||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:320,calculateCellValue:ln},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_label",caption:"Tipo de pago",width:170,calculateCellValue:dn},{dataField:"seller.fullname",caption:"Usuario",width:190,cellTemplate:(e,{data:n})=>e.text(en(n.seller))},{dataField:"created_at",caption:"Fecha registro",width:130,dataType:"date"},{dataField:"creator.username",caption:"Usuario registro",width:150,cellTemplate:(e,{data:n})=>e.text(tn(n.creator))},{dataField:"code",caption:"Código",width:130},{dataField:"business.name",caption:"Empresa",minWidth:150}]}),r.jsx(vt,{modalRef:p,title:cr?"Editar pedido comercial":"Agregar pedido comercial",size:"xl",dialogClass:"commercial-order-modal-dialog modal-dialog-scrollable",bodyClass:"commercial-order-modal-body",bodyStyle:{maxHeight:"calc(100vh - 150px)",overflowY:"auto",overflowX:"hidden"},btnSubmitText:"Guardar",onSubmit:br,children:r.jsxs("div",{id:"commercial-orders-form-container",children:[r.jsx("input",{ref:S,type:"hidden"}),r.jsx("input",{ref:T,type:"hidden"}),r.jsx("input",{ref:M,type:"hidden"}),r.jsx("input",{ref:he,type:"hidden"}),r.jsx("input",{ref:z,type:"hidden"}),r.jsx("input",{ref:Ve,type:"hidden"}),r.jsx("input",{ref:We,type:"hidden"}),r.jsx("input",{ref:He,type:"hidden"}),r.jsx("input",{ref:Ke,type:"hidden"}),r.jsx("input",{ref:Qe,type:"hidden"}),r.jsx("input",{ref:ir,type:"hidden",value:gt.taxAmount,readOnly:!0}),r.jsx("input",{ref:ge,type:"hidden"}),r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-file-document"}),r.jsx("span",{children:"Datos del pedido"})]}),r.jsxs("div",{className:"row g-2",children:[r.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:r.jsx(ke,{eRef:P,label:"Empresa",required:!0,searchAPI:"/api/admin/businesses/paginate",searchBy:"name",dropdownParent:"#commercial-orders-form-container",onChange:hr})}),r.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:r.jsxs(Ur,{eRef:E,label:"Sede",dropdownParent:"#commercial-orders-form-container",value:W,onChange:_r,children:[r.jsx("option",{value:"",children:"Sin sede"}),lr.map(e=>r.jsx("option",{value:e.id,children:e.name},`commercial-order-branch-${e.id}`))]})}),r.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:r.jsx(ke,{eRef:O,label:"Almacen",required:!0,searchAPI:"/api/admin/warehouses/paginate",searchBy:"name",filter:pr,dropdownParent:"#commercial-orders-form-container",onChange:gr,templateResult:Yt,templateSelection:Yt})}),r.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Doc. venta"}),r.jsxs("select",{ref:f,className:"form-control",value:Ie,onChange:e=>Ct(it(e.target.value)),children:[r.jsx("option",{value:"Factura",children:"Factura"}),r.jsx("option",{value:"Boleta",children:"Boleta"}),r.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),r.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Moneda"}),r.jsxs("select",{ref:R,className:"form-control",children:[r.jsx("option",{value:"PEN",children:"PEN"}),r.jsx("option",{value:"USD",children:"USD"}),r.jsx("option",{value:"EUR",children:"EUR"})]})]}),r.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Forma de pago"}),r.jsxs("select",{ref:L,className:"form-control",children:[r.jsx("option",{value:"",children:"Seleccione"}),Jr.map(e=>r.jsx("option",{value:e,children:e},`commercial-order-payment-${e}`))]})]})]})]}),r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-account"}),r.jsx("span",{children:"Cliente y entrega"})]}),r.jsxs("div",{className:"row g-2",children:[r.jsx("div",{className:"col-12 col-xl-6",children:r.jsx(ke,{eRef:q,label:"Cliente regular",searchAPI:"/api/admin/clients/paginate",searchBy:"full_name",selectBy:"entity_id",filter:Qr,dropdownParent:"#commercial-orders-form-container",onChange:xr})}),r.jsx("div",{className:"col-12 col-xl-6",children:r.jsx(ke,{eRef:U,label:"Cliente eventual",searchAPI:"/api/admin/eventual-clients/paginate",searchBy:"business_name",dropdownParent:"#commercial-orders-form-container",onChange:vr})}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Orden de compra"}),r.jsx("input",{ref:te,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Numero de guia"}),r.jsx("input",{ref:_e,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Guia remision"}),r.jsx("input",{ref:Y,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Ubigeo"}),r.jsx("input",{ref:re,className:"form-control"})]}),r.jsx("div",{className:"col-12 col-xl-4",children:r.jsx(qt,{eRef:V,label:"Direccion de entrega",rows:2})}),r.jsx("div",{className:"col-12",children:r.jsx(Nn,{modalRef:p,position:lt,searchText:ar,onSearchTextChange:Xe,onPositionChange:dt,onAddressSelected:e=>{V.current&&(V.current.value=e)}})}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[r.jsx("label",{className:"form-label",children:"Nombre contacto entrega"}),r.jsx("input",{ref:xe,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Celular contacto entrega"}),r.jsx("input",{ref:ve,className:"form-control"})]}),r.jsx(ke,{eRef:F,label:"Vendedor",col:"col-12 col-md-6 col-xl-2",searchAPI:"/api/admin/users/paginate",searchBy:"fullname",dropdownParent:"#commercial-orders-form-container"}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Medico"}),r.jsx("input",{ref:de,className:"form-control"})]})]})]}),r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-detail-toolbar",children:[r.jsxs("div",{className:"commercial-order-section-title mb-0",children:[r.jsx("i",{className:"mdi mdi-format-list-bulleted"}),r.jsx("span",{children:"Detalle del pedido"})]}),r.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:Dr,children:"Agregar item"})]}),r.jsx("div",{className:"table-responsive border rounded commercial-order-detail-table","data-select2-local-dropdown":"true",children:r.jsxs("table",{className:"table table-sm align-middle mb-0",children:[r.jsx("thead",{children:r.jsxs("tr",{children:[r.jsx("th",{style:{minWidth:96},children:"Descuento"}),r.jsx("th",{style:{minWidth:104},children:"Codigo"}),r.jsx("th",{style:{minWidth:88},children:"Codigo lote"}),r.jsx("th",{style:{minWidth:280},children:"Nombre"}),r.jsx("th",{style:{minWidth:128},children:"Laboratorio"}),r.jsx("th",{style:{minWidth:130},children:"Principio activo"}),r.jsx("th",{style:{minWidth:110},children:"Unidad"}),r.jsx("th",{style:{minWidth:64},children:"Stock"}),r.jsx("th",{style:{minWidth:112},children:"P. venta con IGV"}),r.jsx("th",{style:{minWidth:112},children:"P. venta sin IGV"}),r.jsx("th",{style:{minWidth:92},children:"Cantidad"}),r.jsx("th",{style:{minWidth:96},children:"Total desc."}),r.jsx("th",{style:{minWidth:96},children:"Sub total"}),r.jsx("th",{style:{width:70}})]})}),r.jsx("tbody",{children:J.map(e=>r.jsxs("tr",{children:[r.jsx("td",{children:r.jsxs("div",{className:"commercial-order-discount-cell",children:[r.jsxs("button",{type:"button",className:"commercial-order-discount-trigger",onClick:n=>Er(e.uid,n),children:[r.jsx("span",{children:e.discount_type==="percent"&&Number(e.discount_value||0)>0?`${Number(e.discount_value)}%`:"Seleccione"}),r.jsx("i",{className:"mdi mdi-chevron-down"})]}),(ne==null?void 0:ne.uid)===e.uid&&r.jsxs("div",{className:"commercial-order-discount-menu",style:{top:ne.top,left:ne.left,minWidth:ne.width},onClick:n=>n.stopPropagation(),children:[r.jsx("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type!=="percent"?"active":""}`,onClick:()=>Pt(e.uid,""),children:"Seleccione"}),Yr.map(n=>r.jsxs("button",{type:"button",className:`commercial-order-discount-option ${e.discount_type==="percent"&&Number(e.discount_value||0)===n?"active":""}`,onClick:()=>Pt(e.uid,n),children:[n,"%"]},`commercial-order-discount-floating-${e.uid}-${n}`))]})]})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_code||"-"})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_lot||"-"})}),r.jsx("td",{className:"commercial-order-article-name",children:r.jsx(ke,{eRef:kt(e.uid),searchAPI:mr,searchBy:"name",dropdownParent:"#commercial-orders-form-container",disabled:!H,onChange:n=>kr(e.uid,n)})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_laboratory||"-"})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_principle||"-"})}),r.jsx("td",{children:r.jsxs("div",{children:[r.jsx("div",{className:"commercial-order-readonly-cell",children:e.article_unit||"-"}),e.presentations.length>0&&r.jsxs("select",{className:"form-control mt-1","data-no-select2":"true",value:e.presentation_id,disabled:!e.article_id,onChange:n=>ht(e.uid,"presentation_id",n.target.value),children:[r.jsx("option",{value:"",children:bn(e)}),e.presentations.map(n=>r.jsx("option",{value:n.id,children:hn(n,e)},`commercial-order-presentation-${e.uid}-${n.id}`))]})]})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:Number(e.stock_available||0).toFixed(2)})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:e.price_unit,onFocus:Kt,onChange:n=>ht(e.uid,"price_unit",Ht(n))})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Jt(Number(e.price_unit||0),Ie).subtotal.toFixed(2),readOnly:!0})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0.01",className:"form-control",value:e.quantity,onFocus:Kt,onChange:n=>ht(e.uid,"quantity",Ht(n))})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.discount_amount||0).toFixed(2),readOnly:!0})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(e.total||0).toFixed(2),readOnly:!0})}),r.jsx("td",{className:"text-end",children:r.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>Ir(e.uid),children:r.jsx("i",{className:"mdi mdi-close"})})})]},e.uid))}),r.jsxs("tfoot",{children:[r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:"Sub total"}),r.jsx("th",{children:_t.toFixed(2)}),r.jsx("th",{})]}),r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:"Descuento global"}),r.jsx("th",{children:"0.00"}),r.jsx("th",{})]}),r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:"Total"}),r.jsx("th",{children:gt.total.toFixed(2)}),r.jsx("th",{})]})]})]})})]}),r.jsxs("section",{className:"commercial-order-form-section mb-0",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-note-text"}),r.jsx("span",{children:"Observaciones"})]}),r.jsx(qt,{eRef:Ye,label:"Observaciones",rows:3})]})]})}),r.jsx(vt,{modalRef:w,title:"Tracking del pedido",size:"lg",hideButtonSubmit:!0,children:r.jsx("div",{className:"table-responsive",children:r.jsxs("table",{className:"table table-sm align-middle mb-0",children:[r.jsx("thead",{children:r.jsxs("tr",{children:[r.jsx("th",{children:"Fecha"}),r.jsx("th",{children:"Estado"})]})}),r.jsxs("tbody",{children:[Bt.length===0&&r.jsx("tr",{children:r.jsx("td",{colSpan:"2",className:"text-muted text-center py-3",children:"Sin eventos registrados."})}),Bt.map((e,n)=>r.jsxs("tr",{children:[r.jsx("td",{children:new Date(e.date).toLocaleString("es-PE")}),r.jsx("td",{children:e.status})]},`commercial-order-tracking-${n}`))]})]})})}),r.jsx(vt,{modalRef:u,title:"Evidencia de entrega",size:"lg",btnSubmitText:"Registrar",onSubmit:Cr,children:r.jsxs("div",{className:"row",children:[r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Recibido por"}),r.jsx("input",{className:"form-control",value:N.recipient_name,onChange:e=>ie("recipient_name",e.target.value)})]}),r.jsxs("div",{className:"col-md-3 mb-3",children:[r.jsx("label",{className:"form-label",children:"Tipo doc."}),r.jsxs("select",{className:"form-control",value:N.recipient_document_type,onChange:e=>ie("recipient_document_type",e.target.value),children:[r.jsx("option",{value:"DNI",children:"DNI"}),r.jsx("option",{value:"RUC",children:"RUC"}),r.jsx("option",{value:"CE",children:"CE"}),r.jsx("option",{value:"OTRO",children:"Otro"})]})]}),r.jsxs("div",{className:"col-md-3 mb-3",children:[r.jsx("label",{className:"form-label",children:"Numero"}),r.jsx("input",{className:"form-control",value:N.recipient_document_number,onChange:e=>ie("recipient_document_number",e.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Telefono"}),r.jsx("input",{className:"form-control",value:N.recipient_phone,onChange:e=>ie("recipient_phone",e.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Fecha y hora entrega"}),r.jsx("input",{type:"datetime-local",className:"form-control",value:N.delivered_at,onChange:e=>ie("delivered_at",e.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Foto / evidencia"}),r.jsx("input",{ref:h,className:"form-control",type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",capture:"environment",onChange:wr})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Latitud"}),r.jsx("input",{className:"form-control",value:N.latitude,onChange:e=>ie("latitude",e.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Longitud"}),r.jsx("input",{className:"form-control",value:N.longitude,onChange:e=>ie("longitude",e.target.value)})]}),r.jsxs("div",{className:"col-12 mb-3",children:[r.jsx("label",{className:"form-label",children:"Observaciones"}),r.jsx("textarea",{className:"form-control",rows:"3",value:N.evidence_notes,onChange:e=>ie("evidence_notes",e.target.value)})]}),r.jsx("div",{className:"col-12",children:r.jsx("div",{className:"border rounded p-3",children:me?r.jsx("img",{src:me,alt:"Evidencia de entrega",className:"img-fluid rounded border bg-light",style:{maxHeight:360,width:"100%",objectFit:"contain"}}):N.evidence_url?r.jsx("a",{href:N.evidence_url,target:"_blank",rel:"noreferrer",children:"Abrir evidencia registrada"}):r.jsx("div",{className:"text-muted py-4 text-center",children:"Sin evidencia registrada"})})})]})})]})};Fr((t,i)=>{!i.can("orders")&&!i.hasRole("Admin")&&(location.href="/admin/"),Ar(t).render(r.jsx(Lr,{...i,title:i.pageTitle||"Pedidos comerciales",children:r.jsx($n,{...i})}))});
