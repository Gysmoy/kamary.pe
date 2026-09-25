import{C as B,c as L,j as a,r as g,S as z}from"./CreateReactScript-Dsy5wuVZ.js";import{B as A}from"./Base-CRSj-urF.js";import{C as E}from"./CommercialOrdersRest-BkYZHjb2.js";import{S as F}from"./SampleOrdersRest-DCkrL5Q_.js";/* empty css                */import"./BasicRest-DKNLE_pE.js";const O=new E,C=new F,w=[{value:"pending",title:"En cola",description:"Pedido en cola para ser preparado.",accent:"#0acf97",action:"Preparar",icon:"mdi mdi-play",nextStatus:"preparing"},{value:"preparing",title:"Preparando",description:"Pedido en preparacion.",accent:"#f9bc0b",action:"Listo",icon:"mdi mdi-check",nextStatus:"dispatched"}],T=[["order_status","<>","draft"],"and",["order_status","<>","cancelled"],"and",[["dispatch_status","=","pending"],"or",["dispatch_status","=","preparing"]]],$=e=>{var t,r,p;return((t=e==null?void 0:e.client)==null?void 0:t.full_name)??((r=e==null?void 0:e.eventual_client)==null?void 0:r.business_name)??((p=e==null?void 0:e.eventualClient)==null?void 0:p.business_name)??(e==null?void 0:e.client_name)??"-"},P=(e,t="")=>{if(e==null)return t;if(typeof e=="object")return e.address??e.reference??e.name??e.description??t;const r=`${e}`.trim();return r==="[object Object]"?t:r},q=e=>{if(!e)return"";const t=new Date(e);return Number.isNaN(t.getTime())?`${e}`.slice(0,10):t.toLocaleDateString("es-PE")},S=e=>{var t;return((t=e==null?void 0:e.article)==null?void 0:t.name)||(e==null?void 0:e.description)||(e==null?void 0:e.item_name)||"Articulo"},D=e=>{var t,r,p;return((t=e==null?void 0:e.presentation)==null?void 0:t.name)||(e==null?void 0:e.presentation_name)||((p=(r=e==null?void 0:e.article)==null?void 0:r.unit)==null?void 0:p.symbol)||""},M=e=>{const t=Number((e==null?void 0:e.quantity)||0);return Number.isInteger(t)?t.toFixed(0):t.toFixed(2)},R=e=>`${(e==null?void 0:e.source_type)??"commercial"}:${(e==null?void 0:e.id)??""}`,W=({order:e,status:t,onMove:r,updatingId:p,onDragStart:f})=>{var b,h,N,_;const u=(e==null?void 0:e.items)??[],m=`${p??""}`===R(e),o=t.value==="pending",y=(e==null?void 0:e.source_type)==="sample",k=((b=e==null?void 0:e.warehouse)==null?void 0:b.name)??((_=(N=(h=e==null?void 0:e.items)==null?void 0:h.find)==null?void 0:N.call(h,c=>c==null?void 0:c.warehouse))==null?void 0:_.warehouse)??"-",v=[e.dispatch_contact_name,e.dispatch_contact_phone].filter(Boolean).join(" · ");return a.jsxs("article",{className:`vdt-card preparation-card ${m?"is-updating":""}`,draggable:!m,onDragStart:c=>f(c,e),children:[a.jsxs("div",{className:"d-flex justify-content-between align-items-start",style:{gap:8},children:[a.jsxs("div",{style:{minWidth:0},children:[a.jsxs("div",{className:"d-flex align-items-center flex-wrap",style:{gap:6},children:[a.jsx("span",{className:"fw-semibold",style:{color:"var(--vd-ink)"},children:e.code??e.order_number??`Pedido ${e.id}`}),y&&a.jsx("span",{className:"badge badge-soft-info",children:"Muestras"})]}),a.jsxs("small",{className:"text-muted",children:[a.jsx("i",{className:"mdi mdi-calendar-blank-outline me-1"}),q(e.promised_delivery_at||e.issue_date)||"Sin fecha"]})]}),a.jsx("button",{type:"button",className:"vdt-btn-pri preparation-action",disabled:m,onClick:()=>r(e,t.nextStatus),children:m?a.jsx("i",{className:"mdi mdi-loading mdi-spin"}):a.jsxs(a.Fragment,{children:[a.jsx("i",{className:t.icon})," ",t.action]})})]}),a.jsxs("div",{className:"preparation-meta",children:[a.jsxs("div",{className:"text-truncate",title:$(e),children:[a.jsx("i",{className:"mdi mdi-account-outline"}),$(e)]}),a.jsxs("div",{className:"text-truncate",children:[a.jsx("i",{className:"mdi mdi-warehouse"}),k]}),!o&&a.jsxs("div",{className:"text-truncate",title:P(e.delivery_address,""),children:[a.jsx("i",{className:"mdi mdi-map-marker-outline"}),P(e.delivery_address,"-")]}),!o&&v&&a.jsxs("div",{className:"text-truncate",children:[a.jsx("i",{className:"mdi mdi-phone-outline"}),v]})]}),!o&&a.jsxs("div",{className:"d-flex flex-wrap mt-2",style:{gap:6},children:[a.jsx("span",{className:"badge badge-soft-secondary",children:e.document_type??"Sin documento"}),a.jsxs("span",{className:"badge badge-soft-secondary",children:["Total ",Number(e.total||e.total_gross_weight||0).toFixed(2)]})]}),a.jsxs("div",{className:"preparation-items",children:[u.length===0&&a.jsx("div",{className:"preparation-item text-muted",children:"Sin detalle"}),u.map(c=>a.jsxs("div",{className:"preparation-item",children:[a.jsxs("div",{style:{minWidth:0},children:[a.jsx("div",{className:"text-truncate",title:S(c),children:S(c)}),D(c)&&a.jsx("small",{className:"text-muted",children:D(c)})]}),a.jsxs("span",{className:"preparation-qty",children:["x",M(c)]})]},`preparation-order-${e.source_type??"commercial"}-${e.id}-item-${c.id??c.stock_key??c.code??c.name}`))]}),t.value==="preparing"&&!y&&a.jsx("div",{className:"mt-2 pt-2",style:{borderTop:"1px solid #f1f1f6"},children:a.jsxs("button",{type:"button",className:"vdt-btn-soft",style:{height:32},disabled:m,onClick:()=>r(e,"pending"),children:[a.jsx("i",{className:"mdi mdi-undo"})," Regresar a cola"]})})]})},I=({status:e,orders:t,onMove:r,updatingId:p,onDropOrder:f,onDragStart:u,hiddenOnMobile:m})=>a.jsxs("section",{className:`preparation-column ${m?"d-none d-lg-flex":"d-flex"}`,onDragOver:o=>o.preventDefault(),onDrop:o=>f(o,e.value),children:[a.jsxs("div",{className:"preparation-column-header",children:[a.jsxs("div",{className:"d-flex align-items-center",style:{gap:8},children:[a.jsx("span",{className:"preparation-dot",style:{background:e.accent}}),a.jsxs("div",{children:[a.jsx("div",{className:"fw-semibold",style:{color:"var(--vd-ink)"},children:e.title}),a.jsx("small",{className:"text-muted",children:e.description})]})]}),a.jsx("span",{className:"preparation-count",children:t.length})]}),a.jsxs("div",{className:"preparation-list",children:[t.length===0&&a.jsx("p",{className:"vdt-empty mb-0",children:"No hay pedidos en este estado."}),t.map(o=>a.jsx(W,{order:o,status:e,onMove:r,updatingId:p,onDragStart:u},`preparation-order-${o.source_type??"commercial"}-${o.id}`))]})]}),J=()=>{const[e,t]=g.useState([]),[r,p]=g.useState(!1),[f,u]=g.useState(null),[m,o]=g.useState(""),[y,k]=g.useState("pending"),v=g.useMemo(()=>{const s=m.trim().toLowerCase(),i=n=>{var d;return!s||[n.code,n.order_number,$(n),(d=n==null?void 0:n.warehouse)==null?void 0:d.name,...(n.items??[]).map(S)].filter(Boolean).some(l=>`${l}`.toLowerCase().includes(s))};return w.reduce((n,d)=>({...n,[d.value]:e.filter(l=>l.dispatch_status===d.value&&i(l))}),{})},[e,m]),b=async()=>{p(!0);try{const[s,i]=await Promise.all([O.paginate({take:1e3,skip:0,isLoadingAll:!0,filter:T,sort:[{selector:"promised_delivery_at",desc:!1}]}),C.paginate({take:1e3,skip:0,isLoadingAll:!0,filter:["order_status","=","preparing"],sort:[{selector:"delivered_at",desc:!1}]})]),n=((s==null?void 0:s.data)??[]).map(l=>({...l,source_type:"commercial"})),d=((i==null?void 0:i.data)??[]).map(l=>({...l,source_type:"sample",dispatch_status:"preparing",code:l.order_number,promised_delivery_at:l.delivered_at,dispatch_contact_name:l.contact_name,dispatch_contact_phone:l.contact_phone}));t([...n,...d])}finally{p(!1)}};g.useEffect(()=>{b()},[]);const h=async(s,i)=>{if(!(s!=null&&s.id)||s.dispatch_status===i||f)return;u(R(s));const n=e,l=i==="dispatched"||s.source_type==="sample"&&i==="pending"?e.filter(j=>`${j.id}`!=`${s.id}`):e.map(j=>`${j.id}`==`${s.id}`?{...j,dispatch_status:i}:j);t(l);const x=s.source_type==="sample"?await C.booleanResult({id:s.id,field:"order_status",value:i==="dispatched"?"in_route":i==="pending"?"approved":i}):await O.booleanResult({id:s.id,field:"dispatch_status",value:i});x!=null&&x.ok?await b():(t(n),z.fire(i==="dispatched"?"Stock insuficiente":"No se pudo mover",(x==null?void 0:x.message)||"El estado del pedido no se actualizo.","error")),u(null)},N=(s,i)=>{s.dataTransfer.setData("text/plain",JSON.stringify({id:i.id,source_type:i.source_type??"commercial"})),s.dataTransfer.effectAllowed="move"},_=(s,i)=>{s.preventDefault();const n=s.dataTransfer.getData("text/plain");let d={id:n,source_type:"commercial"};try{d=JSON.parse(n)}catch{d={id:n,source_type:"commercial"}}const l=e.find(x=>`${x.id}`==`${d.id}`&&`${x.source_type??"commercial"}`==`${d.source_type??"commercial"}`);l&&h(l,i)},c=w.reduce((s,i)=>{var n;return s+(((n=v[i.value])==null?void 0:n.length)??0)},0);return a.jsxs(a.Fragment,{children:[a.jsx("style",{children:`
        .preparation-board {
          display: grid;
          gap: 16px;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.4fr);
          margin-top: 16px;
        }
        .preparation-column {
          background: #f8f9fb;
          border: 1px solid #eeeef4;
          border-radius: 14px;
          flex-direction: column;
          min-width: 0;
          padding: 12px;
        }
        .preparation-column-header {
          align-items: center;
          display: flex;
          gap: 12px;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .preparation-dot { border-radius: 50%; flex-shrink: 0; height: 10px; width: 10px; }
        .preparation-count {
          background: #fff;
          border: 1px solid #eeeef4;
          border-radius: 999px;
          color: var(--vd-ink);
          font-size: 12px;
          font-weight: 700;
          min-width: 32px;
          padding: 3px 10px;
          text-align: center;
        }
        .preparation-list { display: grid; gap: 10px; }
        .preparation-card { cursor: grab; }
        .preparation-card.is-updating { opacity: .6; pointer-events: none; }
        .preparation-action { height: 34px; padding: 0 12px; flex-shrink: 0; }
        .preparation-meta { color: #6b6b7b; display: grid; font-size: 12.5px; gap: 3px; margin-top: 10px; }
        .preparation-meta i { color: #b6b6c2; margin-right: 6px; }
        .preparation-items { margin-top: 10px; }
        .preparation-item {
          align-items: center;
          border-top: 1px solid #f1f1f6;
          display: flex;
          font-size: 13px;
          gap: 10px;
          justify-content: space-between;
          padding: 6px 0;
        }
        .preparation-item:first-child { border-top: 0; }
        .preparation-qty {
          background: var(--vd-secondary-soft);
          border-radius: 8px;
          color: var(--vd-secondary);
          flex-shrink: 0;
          font-weight: 700;
          padding: 2px 8px;
        }
        .preparation-tabs { display: none; }
        @media (max-width: 991.98px) {
          .preparation-board { grid-template-columns: 1fr; }
          .preparation-tabs { display: flex; }
        }
      `}),a.jsxs("div",{className:"vd-card vd-panel vd-fade-up",style:{padding:16},children:[a.jsxs("div",{className:"d-flex align-items-center justify-content-between flex-wrap",style:{gap:12},children:[a.jsxs("div",{className:"d-flex align-items-center",style:{gap:12},children:[a.jsx("span",{className:"vdt-chip",children:a.jsx("i",{className:"mdi mdi-package-variant-closed"})}),a.jsxs("div",{children:[a.jsx("h4",{className:"mb-0",style:{fontSize:16,fontWeight:700,color:"var(--vd-ink)"},children:"Picking"}),a.jsxs("small",{style:{color:"var(--vd-muted)"},children:[c," pedidos por preparar"]})]})]}),a.jsx("button",{type:"button",className:"vdt-btn-soft vdt-btn-icon",title:"Actualizar",onClick:b,disabled:r,children:a.jsx("i",{className:`mdi mdi-refresh ${r?"mdi-spin":""}`})})]}),a.jsxs("div",{className:"d-flex align-items-center flex-wrap mt-3",style:{gap:8},children:[a.jsxs("div",{className:"position-relative",style:{flex:"1 1 260px",maxWidth:420},children:[a.jsx("i",{className:"mdi mdi-magnify vdt-search-ico"}),a.jsx("input",{className:"vdt-search",placeholder:"Buscar por pedido, cliente o producto…",value:m,onChange:s=>o(s.target.value)})]}),a.jsx("div",{className:"preparation-tabs flex-wrap",style:{gap:8},children:w.map(s=>{var i;return a.jsxs("button",{type:"button",className:y===s.value?"vdt-btn-acc":"vdt-btn-soft",onClick:()=>k(s.value),children:[s.title," ",a.jsx("span",{className:"badge bg-white text-dark ms-1",children:((i=v[s.value])==null?void 0:i.length)??0})]},`preparation-tab-${s.value}`)})})]}),a.jsx("div",{className:"preparation-board",children:w.map(s=>a.jsx(I,{status:s,orders:v[s.value]??[],onMove:h,updatingId:f,onDropOrder:_,onDragStart:N,hiddenOnMobile:y!==s.value},`preparation-column-${s.value}`))})]})]})};B((e,t)=>{if(!t.can("dispatch")&&!t.hasRole("Admin")){location.href="/admin/";return}L(e).render(a.jsx(A,{...t,title:"Preparacion",children:a.jsx(J,{...t})}))});
