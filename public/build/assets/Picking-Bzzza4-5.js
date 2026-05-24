import{C as _,c as w,j as a,r as u,S as $}from"./CreateReactScript-CY9by_Tt.js";import{B as D}from"./Base-CU7D3bVu.js";import{C as P}from"./CommercialOrdersRest-abmCOpnT.js";import"./BasicRest-CMSnDGzV.js";const b=new P,j=[{value:"pending",title:"En produccion",description:"Pedido en cola para ser preparado.",accent:"#0acf97",action:"Preparar",nextStatus:"preparing"},{value:"preparing",title:"Preparando",description:"Pedido en preparacion.",accent:"#f9bc0b",action:"Listo",nextStatus:"dispatched"}],C=[["order_status","<>","draft"],"and",["order_status","<>","cancelled"],"and",[["dispatch_status","=","pending"],"or",["dispatch_status","=","preparing"]]],O=e=>{var n,i,s;return((n=e==null?void 0:e.client)==null?void 0:n.full_name)??((i=e==null?void 0:e.eventual_client)==null?void 0:i.business_name)??((s=e==null?void 0:e.eventualClient)==null?void 0:s.business_name)??"-"},S=(e,n="")=>{if(e==null)return n;if(typeof e=="object")return e.address??e.reference??e.name??e.description??n;const i=`${e}`.trim();return i==="[object Object]"?n:i},y=e=>{if(!e)return"";const n=new Date(e);return Number.isNaN(n.getTime())?`${e}`.slice(0,10):n.toLocaleDateString("es-PE")},z=e=>{var n;return((n=e==null?void 0:e.article)==null?void 0:n.name)||(e==null?void 0:e.description)||(e==null?void 0:e.item_name)||"Articulo"},v=e=>{var n,i,s;return((n=e==null?void 0:e.presentation)==null?void 0:n.name)||(e==null?void 0:e.presentation_name)||((s=(i=e==null?void 0:e.article)==null?void 0:i.unit)==null?void 0:s.symbol)||""},k=e=>{const n=Number((e==null?void 0:e.quantity)||0);return Number.isInteger(n)?n.toFixed(0):n.toFixed(2)},R=({order:e,status:n,onMove:i,updatingId:s,onDragStart:m})=>{var x;const d=(e==null?void 0:e.items)??[],t=`${s??""}`==`${e.id}`,l=n==="pending";return a.jsxs("article",{className:`preparation-card ${t?"is-updating":""}`,draggable:!t,onDragStart:p=>m(p,e),children:[a.jsxs("div",{className:"preparation-card-header",children:[a.jsxs("div",{className:"preparation-code",children:[a.jsx("strong",{children:e.code??`Pedido ${e.id}`}),a.jsx("span",{children:y(e.promised_delivery_at||e.issue_date)})]}),a.jsx("button",{type:"button",className:"btn btn-sm btn-primary",disabled:t,onClick:()=>i(e,n.nextStatus),children:t?"...":n.action})]}),a.jsxs("div",{className:"preparation-meta",children:[a.jsxs("div",{children:[a.jsx("span",{children:"Cliente:"})," ",O(e)]}),a.jsxs("div",{children:[a.jsx("span",{children:"Almacen:"})," ",((x=e==null?void 0:e.warehouse)==null?void 0:x.name)??"-"]}),!l&&a.jsxs("div",{children:[a.jsx("span",{children:"Direccion:"})," ",S(e.delivery_address,"-")]}),!l&&a.jsxs("div",{children:[a.jsx("span",{children:"Contacto:"})," ",[e.dispatch_contact_name,e.dispatch_contact_phone].filter(Boolean).join(" | ")||"-"]})]}),!l&&a.jsxs("div",{className:"preparation-detail",children:[a.jsxs("div",{children:[a.jsx("span",{children:"Documento:"})," ",e.document_type??"-"]}),a.jsxs("div",{children:[a.jsx("span",{children:"Entrega:"})," ",y(e.promised_delivery_at)||"-"]}),a.jsxs("div",{children:[a.jsx("span",{children:"Total:"})," ",Number(e.total||0).toFixed(2)]})]}),a.jsxs("div",{className:"preparation-items",children:[d.length===0&&a.jsx("div",{className:"preparation-item muted",children:"Sin detalle"}),d.map(p=>a.jsxs("div",{className:"preparation-item",children:[a.jsxs("div",{children:[a.jsx("strong",{children:z(p)}),v(p)&&a.jsx("small",{children:v(p)})]}),a.jsxs("strong",{children:["x",k(p)]})]},`preparation-order-${e.id}-item-${p.id}`))]}),n.value==="preparing"&&a.jsx("div",{className:"preparation-card-footer",children:a.jsx("button",{type:"button",className:"btn btn-xs btn-outline-secondary",disabled:t,onClick:()=>i(e,"pending"),children:"Regresar a cola"})})]})},A=({status:e,orders:n,onMove:i,updatingId:s,onDropOrder:m,onDragStart:d})=>a.jsxs("section",{className:"preparation-column",style:{"--preparation-accent":e.accent},onDragOver:t=>t.preventDefault(),onDrop:t=>m(t,e.value),children:[a.jsxs("div",{className:"preparation-column-header",children:[a.jsxs("div",{children:[a.jsx("h4",{children:e.title}),a.jsx("p",{children:e.description})]}),a.jsxs("span",{children:[n.length," pedidos"]})]}),a.jsxs("div",{className:"preparation-list",children:[n.length===0&&a.jsx("div",{className:"preparation-empty",children:"No hay pedidos en este estado."}),n.map(t=>a.jsx(R,{order:t,status:e,onMove:i,updatingId:s,onDragStart:d},`preparation-order-${t.id}`))]})]}),E=()=>{const[e,n]=u.useState([]),[i,s]=u.useState(!1),[m,d]=u.useState(null),t=u.useMemo(()=>j.reduce((r,o)=>({...r,[o.value]:e.filter(h=>h.dispatch_status===o.value)}),{}),[e]),l=async()=>{s(!0);try{const r=await b.paginate({take:1e3,skip:0,isLoadingAll:!0,filter:C,sort:[{selector:"promised_delivery_at",desc:!1}]});n((r==null?void 0:r.data)??[])}finally{s(!1)}};u.useEffect(()=>{l()},[]);const x=async(r,o)=>{if(!(r!=null&&r.id)||r.dispatch_status===o||m)return;d(r.id);const h=e,f=o==="dispatched"?e.filter(g=>`${g.id}`!=`${r.id}`):e.map(g=>`${g.id}`==`${r.id}`?{...g,dispatch_status:o}:g);n(f);const c=await b.booleanResult({id:r.id,field:"dispatch_status",value:o});c!=null&&c.ok?await l():(n(h),$.fire(o==="dispatched"?"Stock insuficiente":"No se pudo mover",(c==null?void 0:c.message)||"El estado del pedido no se actualizo.","error")),d(null)},p=(r,o)=>{r.dataTransfer.setData("text/plain",`${o.id}`),r.dataTransfer.effectAllowed="move"},N=(r,o)=>{r.preventDefault();const h=r.dataTransfer.getData("text/plain"),f=e.find(c=>`${c.id}`==`${h}`);f&&x(f,o)};return a.jsxs(a.Fragment,{children:[a.jsx("style",{children:`
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
      `}),a.jsxs("div",{className:"preparation-page",children:[a.jsxs("div",{className:"preparation-toolbar",children:[a.jsx("h3",{children:"Preparacion"}),a.jsxs("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:l,disabled:i,children:[a.jsx("i",{className:"mdi mdi-refresh me-1"}),i?"Actualizando...":"Actualizar"]})]}),a.jsx("div",{className:"preparation-board",children:j.map(r=>a.jsx(A,{status:r,orders:t[r.value]??[],onMove:x,updatingId:m,onDropOrder:N,onDragStart:p},`preparation-column-${r.value}`))})]})]})};_((e,n)=>{if(!n.can("dispatch")&&!n.hasRole("Admin")){location.href="/admin/";return}w(e).render(a.jsx(D,{...n,title:"Preparacion",children:a.jsx(E,{...n})}))});
