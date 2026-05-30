import{C as O,c as k,j as a,r as f,S as D}from"./CreateReactScript-Cised0hN.js";import{B as P}from"./Base-BZoBWQyI.js";import{C}from"./CommercialOrdersRest-DZjOYV71.js";import{S}from"./SampleOrdersRest-BQJKkOrK.js";import"./BasicRest-D5Ch2D2X.js";const _=new C,y=new S,v=[{value:"pending",title:"En cola",description:"Pedido en cola para ser preparado.",accent:"#0acf97",action:"Preparar",nextStatus:"preparing"},{value:"preparing",title:"Preparando",description:"Pedido en preparacion.",accent:"#f9bc0b",action:"Listo",nextStatus:"dispatched"}],z=[["order_status","<>","draft"],"and",["order_status","<>","cancelled"],"and",[["dispatch_status","=","pending"],"or",["dispatch_status","=","preparing"]]],R=e=>{var n,r,p;return((n=e==null?void 0:e.client)==null?void 0:n.full_name)??((r=e==null?void 0:e.eventual_client)==null?void 0:r.business_name)??((p=e==null?void 0:e.eventualClient)==null?void 0:p.business_name)??(e==null?void 0:e.client_name)??"-"},A=(e,n="")=>{if(e==null)return n;if(typeof e=="object")return e.address??e.reference??e.name??e.description??n;const r=`${e}`.trim();return r==="[object Object]"?n:r},N=e=>{if(!e)return"";const n=new Date(e);return Number.isNaN(n.getTime())?`${e}`.slice(0,10):n.toLocaleDateString("es-PE")},E=e=>{var n;return((n=e==null?void 0:e.article)==null?void 0:n.name)||(e==null?void 0:e.description)||(e==null?void 0:e.item_name)||"Articulo"},w=e=>{var n,r,p;return((n=e==null?void 0:e.presentation)==null?void 0:n.name)||(e==null?void 0:e.presentation_name)||((p=(r=e==null?void 0:e.article)==null?void 0:r.unit)==null?void 0:p.symbol)||""},B=e=>{const n=Number((e==null?void 0:e.quantity)||0);return Number.isInteger(n)?n.toFixed(0):n.toFixed(2)},$=e=>`${(e==null?void 0:e.source_type)??"commercial"}:${(e==null?void 0:e.id)??""}`,F=({order:e,status:n,onMove:r,updatingId:p,onDragStart:u})=>{var b,i,t,c;const m=(e==null?void 0:e.items)??[],o=`${p??""}`===$(e),x=n==="pending",h=(e==null?void 0:e.source_type)==="sample",j=((b=e==null?void 0:e.warehouse)==null?void 0:b.name)??((c=(t=(i=e==null?void 0:e.items)==null?void 0:i.find)==null?void 0:t.call(i,s=>s==null?void 0:s.warehouse))==null?void 0:c.warehouse)??"-";return a.jsxs("article",{className:`preparation-card ${o?"is-updating":""}`,draggable:!o,onDragStart:s=>u(s,e),children:[a.jsxs("div",{className:"preparation-card-header",children:[a.jsxs("div",{className:"preparation-code",children:[a.jsx("strong",{children:e.code??e.order_number??`Pedido ${e.id}`}),h&&a.jsx("small",{className:"preparation-source",children:"Muestras"}),a.jsx("span",{children:N(e.promised_delivery_at||e.issue_date)})]}),a.jsx("button",{type:"button",className:"btn btn-sm btn-primary",disabled:o,onClick:()=>r(e,n.nextStatus),children:o?"...":n.action})]}),a.jsxs("div",{className:"preparation-meta",children:[a.jsxs("div",{children:[a.jsx("span",{children:"Cliente:"})," ",R(e)]}),a.jsxs("div",{children:[a.jsx("span",{children:"Almacen:"})," ",j]}),!x&&a.jsxs("div",{children:[a.jsx("span",{children:"Direccion:"})," ",A(e.delivery_address,"-")]}),!x&&a.jsxs("div",{children:[a.jsx("span",{children:"Contacto:"})," ",[e.dispatch_contact_name,e.dispatch_contact_phone].filter(Boolean).join(" | ")||"-"]})]}),!x&&a.jsxs("div",{className:"preparation-detail",children:[a.jsxs("div",{children:[a.jsx("span",{children:"Documento:"})," ",e.document_type??"-"]}),a.jsxs("div",{children:[a.jsx("span",{children:"Entrega:"})," ",N(e.promised_delivery_at||e.delivered_at)||"-"]}),a.jsxs("div",{children:[a.jsx("span",{children:"Total:"})," ",Number(e.total||e.total_gross_weight||0).toFixed(2)]})]}),a.jsxs("div",{className:"preparation-items",children:[m.length===0&&a.jsx("div",{className:"preparation-item muted",children:"Sin detalle"}),m.map(s=>a.jsxs("div",{className:"preparation-item",children:[a.jsxs("div",{children:[a.jsx("strong",{children:E(s)}),w(s)&&a.jsx("small",{children:w(s)})]}),a.jsxs("strong",{children:["x",B(s)]})]},`preparation-order-${e.source_type??"commercial"}-${e.id}-item-${s.id??s.stock_key??s.code??s.name}`))]}),n.value==="preparing"&&!h&&a.jsx("div",{className:"preparation-card-footer",children:a.jsx("button",{type:"button",className:"btn btn-xs btn-outline-secondary",disabled:o,onClick:()=>r(e,"pending"),children:"Regresar a cola"})})]})},L=({status:e,orders:n,onMove:r,updatingId:p,onDropOrder:u,onDragStart:m})=>a.jsxs("section",{className:"preparation-column",style:{"--preparation-accent":e.accent},onDragOver:o=>o.preventDefault(),onDrop:o=>u(o,e.value),children:[a.jsxs("div",{className:"preparation-column-header",children:[a.jsxs("div",{children:[a.jsx("h4",{children:e.title}),a.jsx("p",{children:e.description})]}),a.jsxs("span",{children:[n.length," pedidos"]})]}),a.jsxs("div",{className:"preparation-list",children:[n.length===0&&a.jsx("div",{className:"preparation-empty",children:"No hay pedidos en este estado."}),n.map(o=>a.jsx(F,{order:o,status:e,onMove:r,updatingId:p,onDragStart:m},`preparation-order-${o.source_type??"commercial"}-${o.id}`))]})]}),T=()=>{const[e,n]=f.useState([]),[r,p]=f.useState(!1),[u,m]=f.useState(null),o=f.useMemo(()=>v.reduce((i,t)=>({...i,[t.value]:e.filter(c=>c.dispatch_status===t.value)}),{}),[e]),x=async()=>{p(!0);try{const[i,t]=await Promise.all([_.paginate({take:1e3,skip:0,isLoadingAll:!0,filter:z,sort:[{selector:"promised_delivery_at",desc:!1}]}),y.paginate({take:1e3,skip:0,isLoadingAll:!0,filter:["order_status","=","preparing"],sort:[{selector:"delivered_at",desc:!1}]})]),c=((i==null?void 0:i.data)??[]).map(l=>({...l,source_type:"commercial"})),s=((t==null?void 0:t.data)??[]).map(l=>({...l,source_type:"sample",dispatch_status:"preparing",code:l.order_number,promised_delivery_at:l.delivered_at,dispatch_contact_name:l.contact_name,dispatch_contact_phone:l.contact_phone}));n([...c,...s])}finally{p(!1)}};f.useEffect(()=>{x()},[]);const h=async(i,t)=>{if(!(i!=null&&i.id)||i.dispatch_status===t||u)return;m($(i));const c=e,l=t==="dispatched"||i.source_type==="sample"&&t==="pending"?e.filter(g=>`${g.id}`!=`${i.id}`):e.map(g=>`${g.id}`==`${i.id}`?{...g,dispatch_status:t}:g);n(l);const d=i.source_type==="sample"?await y.booleanResult({id:i.id,field:"order_status",value:t==="dispatched"?"in_route":t==="pending"?"approved":t}):await _.booleanResult({id:i.id,field:"dispatch_status",value:t});d!=null&&d.ok?await x():(n(c),D.fire(t==="dispatched"?"Stock insuficiente":"No se pudo mover",(d==null?void 0:d.message)||"El estado del pedido no se actualizo.","error")),m(null)},j=(i,t)=>{i.dataTransfer.setData("text/plain",JSON.stringify({id:t.id,source_type:t.source_type??"commercial"})),i.dataTransfer.effectAllowed="move"},b=(i,t)=>{i.preventDefault();const c=i.dataTransfer.getData("text/plain");let s={id:c,source_type:"commercial"};try{s=JSON.parse(c)}catch{s={id:c,source_type:"commercial"}}const l=e.find(d=>`${d.id}`==`${s.id}`&&`${d.source_type??"commercial"}`==`${s.source_type??"commercial"}`);l&&h(l,t)};return a.jsxs(a.Fragment,{children:[a.jsx("style",{children:`
        .preparation-page {
          min-height: calc(100vh - 175px);
        }
        .preparation-toolbar {
          align-items: center;
          display: flex;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .preparation-toolbar h3 {
          color: #263238;
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0;
        }
        .preparation-board {
          display: grid;
          gap: 22px;
          grid-template-columns: minmax(320px, 0.95fr) minmax(420px, 1.55fr);
        }
        .preparation-column {
          border-left: 4px solid var(--preparation-accent);
          min-width: 0;
          padding-left: 10px;
        }
        .preparation-column-header {
          align-items: start;
          display: flex;
          gap: 12px;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .preparation-column-header h4 {
          color: #263238;
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0;
        }
        .preparation-column-header p {
          color: #6c7a86;
          margin: 2px 0 0;
        }
        .preparation-column-header span {
          color: #98a6ad;
          font-size: 0.9rem;
          white-space: nowrap;
        }
        .preparation-list {
          display: grid;
          gap: 8px;
        }
        .preparation-card {
          background: #fff;
          border: 1px solid #edf1f4;
          border-radius: 5px;
          box-shadow: 0 1px 2px rgba(31, 45, 61, 0.04);
          cursor: grab;
          padding: 13px 14px;
        }
        .preparation-card.is-updating {
          opacity: 0.65;
          pointer-events: none;
        }
        .preparation-card-header {
          align-items: start;
          display: flex;
          gap: 12px;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .preparation-code {
          align-items: baseline;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          min-width: 0;
        }
        .preparation-code strong {
          color: #313a46;
          font-size: 0.98rem;
        }
        .preparation-code span {
          color: #98a6ad;
          font-size: 0.82rem;
        }
        .preparation-source {
          background: #e8f3ff;
          border: 1px solid #b8dcff;
          border-radius: 999px;
          color: #1473c9;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 1px 7px;
        }
        .preparation-meta {
          color: #6c7a86;
          display: grid;
          gap: 3px;
          margin-bottom: 12px;
        }
        .preparation-meta span,
        .preparation-detail span {
          color: #98a6ad;
          font-weight: 600;
        }
        .preparation-detail {
          border: 1px solid #dfe6ed;
          border-radius: 4px;
          color: #6c7a86;
          display: grid;
          gap: 4px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-bottom: 8px;
          padding: 10px 12px;
        }
        .preparation-items {
          display: grid;
        }
        .preparation-item {
          align-items: center;
          border-top: 1px solid #eef2f5;
          color: #313a46;
          display: flex;
          gap: 10px;
          justify-content: space-between;
          min-height: 32px;
        }
        .preparation-item:first-child {
          border-top: 0;
        }
        .preparation-item strong {
          font-size: 0.95rem;
        }
        .preparation-item small {
          color: #98a6ad;
          display: block;
          font-size: 0.78rem;
        }
        .preparation-item.muted {
          color: #98a6ad;
        }
        .preparation-card-footer {
          margin-top: 10px;
        }
        .preparation-empty {
          background: rgba(255, 255, 255, 0.65);
          border: 1px dashed #cfd8df;
          border-radius: 5px;
          color: #7f8c96;
          padding: 18px;
          text-align: center;
        }
        @media (max-width: 991.98px) {
          .preparation-board {
            grid-template-columns: 1fr;
          }
          .preparation-detail {
            grid-template-columns: 1fr;
          }
        }
      `}),a.jsxs("div",{className:"preparation-page",children:[a.jsxs("div",{className:"preparation-toolbar",children:[a.jsx("h3",{children:"Preparacion"}),a.jsxs("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:x,disabled:r,children:[a.jsx("i",{className:"mdi mdi-refresh me-1"}),r?"Actualizando...":"Actualizar"]})]}),a.jsx("div",{className:"preparation-board",children:v.map(i=>a.jsx(L,{status:i,orders:o[i.value]??[],onMove:h,updatingId:u,onDropOrder:b,onDragStart:j},`preparation-column-${i.value}`))})]})]})};O((e,n)=>{if(!n.can("dispatch")&&!n.hasRole("Admin")){location.href="/admin/";return}k(e).render(a.jsx(P,{...n,title:"Preparacion",children:a.jsx(T,{...n})}))});
