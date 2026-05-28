var Ba=Object.defineProperty;var Ga=(e,r,i)=>r in e?Ba(e,r,{enumerable:!0,configurable:!0,writable:!0,value:i}):e[r]=i;var Zn=(e,r,i)=>Ga(e,typeof r!="symbol"?r+"":r,i);import{C as Ua,c as Va,j as n,r as c,S as U,G as za}from"./CreateReactScript-BQEmHc8B.js";import{L as Wa,G as qa,M as Ya}from"./esm-XAA1TWCO.js";import{B as Ha}from"./Base-BZJCfbcl.js";import{T as sn}from"./Table-DsvFLxnp.js";import{M as st}from"./Modal-BpHRFSoz.js";import{R as Ka}from"./ReactAppend-CmCssPze.js";import{a as Le,S as Be}from"./SetSelectValue-CKeZntsZ.js";import{S as Ja}from"./SelectFormGroup-BeLjaap0.js";import{T as er}from"./TextareaFormGroup-cWhYtz_1.js";import{B as Qa}from"./BillingDocumentsRest-WW_N3DRe.js";import{C as Er}from"./CommercialOrdersRest-DArLGxwY.js";import{B as Xa}from"./BasicRest-BJmaHB2C.js";import{R as Za}from"./ReferralGuidesRest-CIzM-URQ.js";import{o as Ft,b as St}from"./magistralesRecordPdf-C-x5GdgT.js";import{t as tr,i as nr,j as Fr,k as rr}from"./statusLabels-DafAwaKR.js";import"./tippy-react.esm-255dCUw_.js";import"./permissionScope-Be8AULz2.js";import"./ubigeoInei-D0FnAslC.js";class ei extends Xa{constructor(){super(...arguments);Zn(this,"path","admin/delivery-delay-reasons")}}const ar="billing-voucher-preview-modal",un="billing-voucher-preview-frame";let _e=null;const v=(e,r,i="")=>r.split(".").reduce((o,f)=>o==null?void 0:o[f],e)??i,Ve=(e,r="-")=>e==null||e===""?r:`${e}`,mn=e=>{if(!e)return"-";const r=`${e}`;return r.includes("T"),r.slice(0,10)},ot=(e,r=2)=>Number(e||0).toFixed(r),ti=(e="PEN")=>{const r=`${e??"PEN"}`.toUpperCase();return r==="USD"?"US$":r==="EUR"?"EUR":"S/."},Ge=(e,r="PEN")=>`${ti(r)} ${ot(e)}`,Sr=e=>[e==null?void 0:e.series,e==null?void 0:e.sequence].filter(Boolean).join("-")||(e==null?void 0:e.code)||"-",$r=e=>{const r=`${e??""}`.trim().toLowerCase();return r.includes("boleta")?`BOLETA DE VENTA
ELECTRONICA`:r.includes("nota")?`NOTA DE CREDITO
ELECTRONICA`:`FACTURA
ELECTRONICA`},ni=e=>v(e,"client.full_name")||v(e,"eventual_client.business_name")||v(e,"eventualClient.business_name")||"-",ri=e=>v(e,"client.document_number")||v(e,"eventual_client.document_number")||v(e,"eventualClient.document_number")||"-",Tr=e=>v(e,"metadata.delivery_address")||v(e,"commercial_order.delivery_address")||v(e,"commercialOrder.delivery_address")||v(e,"client.full_address")||v(e,"eventual_client.address")||v(e,"eventualClient.address")||"-",ai=e=>v(e,"metadata.dispatch_contact_name")||v(e,"commercial_order.dispatch_contact_name")||v(e,"commercialOrder.dispatch_contact_name")||"-",ii=e=>v(e,"metadata.dispatch_contact_phone")||v(e,"commercial_order.dispatch_contact_phone")||v(e,"commercialOrder.dispatch_contact_phone")||v(e,"client.phone")||v(e,"eventual_client.phone")||v(e,"eventualClient.phone")||"-",si=e=>v(e,"metadata.delivery_reference")||v(e,"commercial_order.delivery_reference")||v(e,"commercialOrder.delivery_reference")||"-",li=e=>v(e,"metadata.source_code")||v(e,"commercial_order.code")||v(e,"commercialOrder.code")||v(e,"service_order.code")||v(e,"serviceOrder.code")||"-",oi=e=>{const r=Number(e||0);return Number.isInteger(r),r.toFixed(4)},Dt=e=>{const r=["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve"],i=["diez","once","doce","trece","catorce","quince","dieciseis","diecisiete","dieciocho","diecinueve"],l=["","","veinte","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"],o=["","ciento","doscientos","trescientos","cuatrocientos","quinientos","seiscientos","setecientos","ochocientos","novecientos"];if(e<10)return r[e];if(e<20)return i[e-10];if(e===20)return"veinte";if(e<30)return`veinti${r[e-20]}`;if(e<100){const h=Math.floor(e/10),R=e%10;return R?`${l[h]} y ${r[R]}`:l[h]}if(e===100)return"cien";const f=Math.floor(e/100),d=e%100;return d?`${o[f]} ${Dt(d)}`:o[f]},pn=e=>{const r=Math.max(0,Math.floor(Number(e||0)));if(r<1e3)return Dt(r);if(r<1e6){const f=Math.floor(r/1e3),d=r%1e3,h=f===1?"mil":`${Dt(f)} mil`;return d?`${h} ${Dt(d)}`:h}const i=Math.floor(r/1e6),l=r%1e6,o=i===1?"un millon":`${pn(i)} millones`;return l?`${o} ${pn(l)}`:o},ci=(e,r="PEN")=>{const i=Number(e||0),l=Math.floor(Math.abs(i)),o=Math.round((Math.abs(i)-l)*100),f=`${r}`.toUpperCase()==="PEN"?"SOLES":`${r}`.toUpperCase();return`IMPORTE EN LETRAS: ${pn(l).toUpperCase()} CON ${String(o).padStart(2,"0")}/100 ${f}`},di=()=>{var i;const e=((i=window.jspdf)==null?void 0:i.jsPDF)||window.jsPDF;if(!e)throw new Error("jsPDF no esta disponible");const r=new e({orientation:"portrait",unit:"pt",format:"a4"});if(!r.autoTable)throw new Error("AutoTable no esta disponible");return r},ir=(e,r=90)=>[e,"#toolbar=1","&navpanes=0","&pagemode=none","&scrollbar=1",`&zoom=${r}`].join(""),ui=()=>{let e=document.getElementById(ar);return e||(e=document.createElement("div"),e.id=ar,e.className="modal fade",e.tabIndex=-1,e.setAttribute("aria-hidden","true"),e.innerHTML=`
    <div class="modal-dialog modal-dialog-centered" style="width: 1040px; max-width: calc(100vw - 64px);">
      <div class="modal-content" style="height: min(780px, calc(100vh - 80px));">
        <div class="modal-header py-2">
          <h4 class="modal-title mb-0" data-pdf-title>Comprobante</h4>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body p-0" style="height: calc(100% - 53px); overflow: hidden; background: #525659;">
          <iframe
            id="${un}"
            title="Vista previa PDF"
            style="width: 100%; height: 100%; border: 0; display: block;"
            allow="fullscreen"
          ></iframe>
        </div>
      </div>
    </div>
  `,document.body.appendChild(e),$(e).on("hidden.bs.modal",()=>{const r=document.getElementById(un);r&&r.removeAttribute("src"),_e&&(URL.revokeObjectURL(_e),_e=null)}),e)},kr=(e,r,i=!1)=>{const l=ui(),o=l.querySelector(`#${un}`),f=l.querySelector("[data-pdf-title]");if(!o)throw new Error("No se encontro el visor PDF");_e&&(URL.revokeObjectURL(_e),_e=null),i?(_e=URL.createObjectURL(e),o.src=ir(_e)):o.src=ir(e),f.textContent=r,$(l).modal("show")},sr=(e,r="Comprobante PDF")=>{kr(e,r,!1)},z=(e,r,i,l,o,f)=>{e.setFont("helvetica","bold"),e.text(`${r} :`,l,o),e.setFont("helvetica","normal");const d=e.splitTextToSize(Ve(i,""),f);return e.text(d,l+86,o),Math.max(11,d.length*9)},mi=(e,r)=>{const i=e.internal.pageSize.getWidth(),l=28,o=182,f=v(r,"business.name","KAMARY PERU SAC"),d=v(r,"branch.address")||v(r,"business.address")||"",h=v(r,"business.tax_number");e.setFont("helvetica","bold"),e.setFontSize(11),e.text(f,l,35),e.setFont("helvetica","normal"),e.setFontSize(8),d&&e.text(e.splitTextToSize(d,300),l,49),h&&(e.setFont("helvetica","bold"),e.text(`RUC ${h}`,l,78)),e.setDrawColor(0,0,0),e.setLineWidth(.8),e.rect(i-l-o,24,o,78),e.setFont("helvetica","bold"),e.setFontSize(13),e.text($r(r.document_type),i-l-o/2,48,{align:"center"}),e.setFontSize(11),e.text(Sr(r),i-l-o/2,86,{align:"center"})},pi=(e,r)=>{e.setFont("helvetica","bold"),e.setFontSize(9),e.text("DATOS DEL CLIENTE",28,124),e.setFontSize(8);let o=142;o+=z(e,"DOCUMENTO",ri(r),28,o,392),o+=z(e,"DENOMINACION",ni(r),28,o,392),o+=z(e,"DIRECCION",Tr(r),28,o,392);const f=360;return o=142,o+=z(e,"FECHA EMISION",mn(r.issue_date),f,o,130),o+=z(e,"MONEDA",r.currency==="PEN"?"Soles":r.currency,f,o,130),o+=z(e,"FECHA VENCIMIENTO",mn(r.due_date||r.issue_date),f,o,130),z(e,"ORDEN DE COMPRA",v(r,"metadata.purchase_order",""),f,o,130),202},fi=e=>{const r=Number(e.subtotal||0)===0?0:Math.max(0,Number(e.tax_amount||0)/Number(e.subtotal||1)),i=e.source_type==="commercial_order"&&r>0;return(e.items??[]).filter(l=>(l==null?void 0:l.status)!==!1&&(l==null?void 0:l.status)!==0).map(l=>{var S,F,T,de;const o=Number(l.quantity||0),f=Number(l.unit_price||0),d=Number(l.total||0),h=i?f:f*(1+r),R=i&&r>0?f/(1+r):f,L=i?d:d*(1+r);return[Ve(l.item_code,""),Ve(l.description,""),Ve(((S=l.metadata)==null?void 0:S.unit)||((F=l.metadata)==null?void 0:F.unit_code)||"UNIDAD","UNIDAD"),Ve(((T=l.metadata)==null?void 0:T.lot)||l.item_code,"-"),mn((de=l.metadata)==null?void 0:de.expiration_date),oi(o),ot(R,4),ot(h,4),ot(L,4)]})},hi=(e,r,i)=>{const l=e.internal.pageSize.getWidth(),o=r.currency||"PEN",f=[["DESCUENTO GLOBAL",Ge(0,o)],["INAFECTO",Ge(0,o)],["GRAVADA",Ge(r.subtotal,o)],[`IGV ${ot(Number(r.subtotal||0)?Number(r.tax_amount||0)/Number(r.subtotal||1)*100:0)} %`,Ge(r.tax_amount,o)],["TOTAL",Ge(r.total,o)]];return e.autoTable({startY:i,body:f,theme:"plain",margin:{left:l-210,right:28},styles:{fontSize:8,cellPadding:2},columnStyles:{0:{fontStyle:"bold",halign:"right",cellWidth:110},1:{halign:"right",cellWidth:72}}}),e.lastAutoTable.finalY+12},bi=(e,r,i)=>{const o=r.currency||"PEN",f=[r.payment_method,r.payment_condition].filter(Boolean).join(" | ")||"-";e.setFont("helvetica","bold"),e.setFontSize(8),e.text(ci(r.total,o),28,i),i+=15,e.text(`FORMA DE PAGO AL FACTURAR: ${f} ${Ge(r.total,o)}`,28,i),i+=18,e.text("OBSERVACIONES:",28,i),e.setFont("helvetica","normal"),e.text(Ve(r.observations,""),104,i),i+=32,e.setFont("helvetica","bold"),e.text("DATOS DE ENTREGA",28,i),i+=14,e.setFontSize(8),i+=z(e,"NOMBRE",ai(r),28,i,410),i+=z(e,"CELULAR",ii(r),28,i,410),i+=z(e,"DIRECCION",Tr(r),28,i,410),i+=z(e,"REFERENCIA",si(r),28,i,410),i+=z(e,"FORMA DE PAGO (REF)",f,28,i,410),i+=14,e.setFont("helvetica","normal"),e.setFontSize(7),e.text(`Representacion impresa de la ${$r(r.document_type).replace(`
`," ")}, pedido ${li(r)}`,28,i)},gi=e=>{const r=di(),i=r.internal.pageSize.getWidth(),l=28;mi(r,e);const o=pi(r,e);r.autoTable({startY:o,head:[["PRODUCTO","DESCRIPCION","MEDIDA","LOTE","F.V.","CANT.","P. SIN IGV","P. CON IGV","IMPORTE"]],body:fi(e),theme:"grid",margin:{left:l,right:l},styles:{fontSize:6.7,cellPadding:3,lineColor:[170,170,170],lineWidth:.25,overflow:"linebreak"},headStyles:{fillColor:[255,255,255],textColor:[0,0,0],fontStyle:"bold",lineColor:[120,120,120]},columnStyles:{0:{cellWidth:48},1:{cellWidth:126},2:{cellWidth:48},3:{cellWidth:52},4:{cellWidth:50},5:{cellWidth:42,halign:"right"},6:{cellWidth:54,halign:"right"},7:{cellWidth:54,halign:"right"},8:{cellWidth:54,halign:"right"}}});let f=hi(r,e,r.lastAutoTable.finalY+8);f>640&&(r.addPage(),f=40),bi(r,e,f),r.setFont("helvetica","normal"),r.setFontSize(7),r.text(`Pagina 1 de ${r.getNumberOfPages()}`,i-l,r.internal.pageSize.getHeight()-18,{align:"right"}),kr(r.output("blob"),`Vista previa ${Sr(e)}`,!0)},M=new Er,ie=new Qa,lr=new ei,or=new Za,xi=["client_kind","=","regular"],_i=[1,2,3,4,5],vi=["EFECTIVO [CONTADO]","TRANSFERENCIA [CONTADO]","YAPE [CONTADO]","PLIN [CONTADO]","TARJETA [CONTADO]","TRANSFERENCIA [CREDITO]"],cr="ecomsur_oms",$t=[{id:"orders",label:"Pedidos",kind:"orders"},{id:"issued",label:"Facturas Emitidas",kind:"billing"},{id:"cancelled",label:"Facturas Anuladas",kind:"billing"},{id:"credit-notes",label:"Notas de Credito",kind:"billing"},{id:"visitors",label:"Pedidos - Visitadores",kind:"static"},{id:"visitors-legacy",label:"Pedidos - Visitadores Legacy",kind:"static"},{id:"platforms",label:"Plataformas",kind:"static"},{id:"multivende",label:"Pedidos - Multivende",kind:"multivende"}],dr={visitors:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},"visitors-legacy":{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["Todos","ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},platforms:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]}},V=(e,{variant:r,title:i,icon:l,onClick:o})=>{const f=$('<button type="button"></button>').addClass(`btn btn-xs btn-soft-${r} commercial-order-action-btn`).attr("title",i).attr("aria-label",i).append($("<i></i>").addClass(l)).on("click",d=>{d.preventDefault(),d.stopPropagation(),o()});e.append(f)},Dr=e=>`commercial-order-status-badge commercial-order-status-${`${e??"empty"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-")||"empty"}`,Tt=(e,r,i)=>{e.addClass("commercial-order-status-cell"),Ka(e,n.jsx("span",{className:Dr(r),children:i(r)}))},lt=()=>({uid:crypto.randomUUID(),article_id:"",article_label:"",article_code:"",article_lot:"",article_name:"",article_unit:"",article_laboratory:"",article_principle:"",presentations:[],presentation_id:"",presentation_units:1,stock_available:0,reserved_quantity:0,price_unit:0,quantity:1,gross_total:0,discount_type:"none",discount_value:0,discount_amount:0,total:0,price_source:"fallback",price_list_code:""}),yi=e=>{if(!e)return"";const r=(e.name??"").toString().trim().split(" ")[0]??"",i=(e.lastname??"").toString().trim().split(" ")[0]??"",l=`${r} ${i}`.trim(),o=(e.username??"").toString().trim();return l&&o?`${l} (@${o})`:l||(o?`@${o}`:"")},Ni=e=>{if(!e)return"-";const r=(e.fullname??"").toString().trim();return r||`${e.name??""} ${e.lastname??""}`.trim()||(e.username??"").toString().trim()||"-"},ln=e=>e&&((e.username??"").toString().trim()||(e.fullname??"").toString().trim()||`${e.name??""} ${e.lastname??""}`.trim())||"-",ct=e=>Number(Number(e||0).toFixed(2)),ji=e=>$("<div>").text(e??"").html(),Ue=e=>{const r=Number(Number(e||0).toFixed(3));return Number.isInteger(r)?`${r}`:`${r}`.replace(/\.?0+$/,"")},bn=e=>(e==null?void 0:e.price_source)==="manual",ur=(e,r,i=!1)=>{const l=Number((e==null?void 0:e.price_unit)||0),o=Number(r==null?void 0:r.price_unit);return!i&&bn(e)||!Number.isFinite(o)||!i&&o<=0&&l>0?l:o},mr=(e,r,i=!1)=>!i&&bn(e)?"manual":(r==null?void 0:r.source)||(e==null?void 0:e.price_source)||"fallback",Ci=e=>{const r=`${e??""}`.replace(",",".").replace(/[^\d.]/g,"");if(!r)return"";const[i,...l]=r.split("."),o=i.replace(/^0+(?=\d)/,"")||(i||l.length?"0":""),f=l.length?`.${l.join("")}`:"";return`${o}${f}`},pr=e=>{const r=Ci(e.target.value);return e.target.value!==r&&(e.target.value=r),Number(r||0)},fr=e=>{Number(e.target.value||0)===0&&e.target.select()},Ri=(e,r,i)=>{const l=ct(e),o=Number(i||0);return!Number.isFinite(o)||o<=0||l<=0?0:r==="percent"?Math.min(l,ct(l*Math.min(o,100)/100)):r==="amount"?Math.min(l,ct(o)):0},Re=e=>{const r=Number(e.quantity||0),i=Number(e.price_unit||0),l=Number.isFinite(r*i)?ct(r*i):0,o=Ri(l,e.discount_type,e.discount_value);return{...e,discount_type:e.discount_type||"none",discount_value:e.discount_type==="none"?0:Number(e.discount_value||0),gross_total:l,discount_amount:o,total:ct(Math.max(0,l-o))}},Ot=e=>{const r=`${e??""}`.trim().toLowerCase();return r==="boleta"?"Boleta":["nota de pedido","nota_pedido","note_order"].includes(r)?"Nota de pedido":"Factura"},wi=e=>(e==null?void 0:e.billing_documents)??(e==null?void 0:e.billingDocuments)??[],we=e=>wi(e)[0]??null,te=e=>e&&([e==null?void 0:e.series,e==null?void 0:e.sequence].filter(Boolean).join("-")||(e==null?void 0:e.code))||"",It=e=>!!(`${(e==null?void 0:e.series)??""}`.trim()&&`${(e==null?void 0:e.sequence)??""}`.trim()),hr=e=>{const r=we(e);return te(r)||(e==null?void 0:e.referral_guide)||(e==null?void 0:e.guide_number)||(e==null?void 0:e.purchase_order)||"-"},on=e=>{var r;return Ot(((r=we(e))==null?void 0:r.document_type)??(e==null?void 0:e.document_type))},br=e=>{const r=(e==null?void 0:e.client)??(e==null?void 0:e.eventual_client)??(e==null?void 0:e.eventualClient)??null,i=`${(r==null?void 0:r.document_number)??""}`.trim(),l=`${(r==null?void 0:r.full_name)??(r==null?void 0:r.business_name)??""}`.trim();return[i,l].filter(Boolean).join(" | ")||"-"},Ei=e=>{const r=`${(e==null?void 0:e.payment_method)??""}`.trim(),i=`${(e==null?void 0:e.payment_condition)??""}`.trim();return!r&&!i?"-":!i||r.includes("[")?r||"-":`${r||"-"} [${i.toUpperCase()}]`},gr=e=>{if(!e)return"-";const r=new Date(e);return Number.isNaN(r.getTime())?`${e}`:r.toLocaleString("es-PE",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})},fn=()=>new Date().toISOString().slice(0,10).replaceAll("-","/"),le=()=>{const e=fn();return`${e} - ${e}`},xr=(e,r)=>new Promise((i,l)=>{const o=document.getElementById(e);if(o){o.dataset.loaded==="true"?i():o.addEventListener("load",i,{once:!0});return}const f=document.createElement("script");f.id=e,f.src=r,f.async=!0,f.onload=()=>{f.dataset.loaded="true",i()},f.onerror=l,document.body.appendChild(f)}),Fi=(e,r)=>{if(document.getElementById(e))return;const i=document.createElement("link");i.id=e,i.rel="stylesheet",i.href=r,document.head.appendChild(i)},Si=async()=>{var e,r;Fi("commercial-order-daterangepicker-css","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/css/daterangepicker.css"),window.moment||await xr("commercial-order-moment-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/moment.min.js"),(r=(e=window.$)==null?void 0:e.fn)!=null&&r.daterangepicker||await xr("commercial-order-daterangepicker-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/daterangepicker.js")},Ir=()=>({orders:{businessId:"",dateRange:le(),laboratoryId:"",dispatchStatus:""},issued:{businessId:"",dateRange:le()},cancelled:{businessId:"",dateRange:le()},"credit-notes":{businessId:"",dateRange:le()},visitors:{visitor:"ALICIA ASTO ASTO",dateRange:le()},"visitors-legacy":{visitor:"",dateRange:le()},platforms:{businessId:"",dateRange:le()},multivende:{dateRange:le(),orderVtex:""}}),$i=()=>{const e=Ir();return{...e,orders:{...e.orders,dateRange:""}}},_r=e=>{const r=`${e??""}`.trim();return r?r.replaceAll("/","-").slice(0,10):""},Ar=e=>{const[r="",i=""]=`${e??""}`.split(/\s+-\s+/);return{start:_r(r),end:_r(i||r)}},Mt=e=>e.filter(Boolean).reduce((r,i)=>r?[r,"and",i]:i,null),gn=(e,r="created_at")=>{const{start:i,end:l}=Ar(e);return Mt([i?[r,">=",`${i} 00:00:00`]:null,l?[r,"<=",`${l} 23:59:59`]:null])},Ti=e=>{const r=["document_type","<>","Nota de credito"];return e==="issued"?[[["local_status","=","sent"],"or",["local_status","=","accepted"],"or",["local_status","=","observed"],"or",["local_status","=","rejected"]],"and",r]:e==="cancelled"?[["local_status","=","cancelled"],"and",r]:e==="credit-notes"?["document_type","=","Nota de credito"]:null},ki=(e,r)=>Mt([["source_type","=","commercial_order"],Ti(e),r!=null&&r.businessId?["business_id","=",Number(r.businessId)]:null,gn(r==null?void 0:r.dateRange,"created_at")]),Di=e=>Mt([e!=null&&e.businessId?["business_id","=",Number(e.businessId)]:null,e!=null&&e.dispatchStatus?["dispatch_status","=",e.dispatchStatus]:null,gn(e==null?void 0:e.dateRange,"created_at")]),Ii=(e,r)=>{const i=`${(e==null?void 0:e.orderVtex)??""}`.trim();return Mt([["external_source","=",r],gn(e==null?void 0:e.dateRange,"created_at"),i?[["external_order_id","contains",i],"or",["external_checkout_id","contains",i]]:null])},cn=e=>{const r=(e==null?void 0:e.client)??(e==null?void 0:e.eventualClient)??(e==null?void 0:e.eventual_client)??null,i=`${(r==null?void 0:r.document_number)??""}`.trim(),l=`${(r==null?void 0:r.full_name)??(r==null?void 0:r.business_name)??""}`.trim();return[i,l].filter(Boolean).join(" | ")||"-"},dn=e=>`${e??""}`.toUpperCase()==="USD"?"Dolares":"Soles",vr=e=>(e==null?void 0:e.external_reference)||(e==null?void 0:e.external_id)||(e==null?void 0:e.external_status)||"-",Ai=e=>{var r,i;return((r=e==null?void 0:e.referenceDocument)==null?void 0:r.code)??((i=e==null?void 0:e.reference_document)==null?void 0:i.code)??"-"},Oi=e=>{var r,i;return(e==null?void 0:e.cancel_reason)??((r=e==null?void 0:e.metadata)==null?void 0:r.cancel_reason)??((i=e==null?void 0:e.metadata)==null?void 0:i.reason)??"-"},Pi=e=>{var r,i;return((r=we(e))==null?void 0:r.external_status)??((i=we(e))==null?void 0:i.external_reference)??"-"},Mi=e=>(e==null?void 0:e.external_order_id)||(e==null?void 0:e.external_checkout_id)||"-",Or=e=>{var o;const r=hn(e);if(r!=null&&r.delivered_at)return r.delivered_at;const l=((e==null?void 0:e.dispatchAssignments)??(e==null?void 0:e.dispatch_assignments)??[]).find(f=>{var d;return(d=f==null?void 0:f.dispatch)==null?void 0:d.delivered_at});return((o=l==null?void 0:l.dispatch)==null?void 0:o.delivered_at)??""},Li=e=>{const r=e!=null&&e.created_at?new Date(e.created_at):null,i=Or(e)||(e==null?void 0:e.updated_at),l=i?new Date(i):null;if(!r||!l||Number.isNaN(r.getTime())||Number.isNaN(l.getTime()))return"-";const o=Math.max(0,Math.round((l-r)/6e4)),f=Math.floor(o/1440),d=Math.floor(o%1440/60);return f>0?`${f}d ${d}h`:d>0?`${d}h ${o%60}m`:`${o}m`},k=(e,r="")=>{if(e==null)return r;if(typeof e=="object")return e.address??e.reference??e.name??e.description??r;const i=`${e}`;return i==="[object Object]"?r:i},Bi=e=>`${e??""}`.toUpperCase().includes("CREDITO")?"Credito":"Contado",Gi=e=>{const r=`${e??""}`.trim();return r?r.toUpperCase()==="TRANSFERENCIA"?"TRANSFERENCIA [CONTADO]":r:"EFECTIVO [CONTADO]"},Ui=e=>k(e==null?void 0:e.full_address,k(e==null?void 0:e.address,k(e==null?void 0:e.fiscal_address))),Vi=e=>k(e==null?void 0:e.ubigeo,k(e==null?void 0:e.district_ubigeo,k(e==null?void 0:e.inei_ubigeo))),yr=e=>{const r=`${e??""}`.trim(),i=r.match(/^(client|eventual)-(\d+)$/);return i?i[2]:r},Nr=e=>{var d,h,R;if(e.loading)return e.text;const r=e.data??{},i=e.text||r.name||"",l=(d=r.branch)==null?void 0:d.name,o=(R=(h=r.branch)==null?void 0:h.business)==null?void 0:R.name,f=$("<span>").text(i);return l&&f.append($("<small>").addClass("text-muted ms-1").text(`- ${l}`)),o&&f.append($("<small>").addClass("text-muted ms-1").text(`(${o})`)),f},se=e=>{if(!(e!=null&&e.current))return;const r=$(e.current);r.empty().val(null),r.trigger(r.data("select2")?"change.select2":"change")},zi=e=>e.article_id?"Unidad base":"Sin presentacion",Wi=(e,r)=>{const i=(e==null?void 0:e.name)||"Presentacion",l=Ue((e==null?void 0:e.units)||1),o=r!=null&&r.article_unit?` ${r.article_unit}`:" unidad(es) base";return`${i} (${l}${o})`},Pr=e=>["Factura","Boleta"].includes(Ot(e)),jr=(e,r)=>{const i=Number(e||0);if(!Pr(r))return{subtotal:Number(i.toFixed(2)),taxAmount:0,total:Number(i.toFixed(2))};const l=Number((i/1.18).toFixed(2));return{subtotal:l,taxAmount:Number((i-l).toFixed(2)),total:Number(i.toFixed(2))}},qi=(e,r="")=>{const i=new Map;return(e??[]).flatMap(l=>{if(!(l!=null&&l.article_id))return[];const o=`${l.article_id}:${l.warehouse_id||r||""}`,f=Number(l.quantity||0),d=Number(l.presentation_units||1)||1,h=Number((f*d).toFixed(3)),R=Number(l.stock_available||0),L=Number(i.get(o)||0),S=Math.max(0,R-L),F=Math.min(h,S),T=Math.max(0,h-F);return i.set(o,L+F),T<=1e-4?[]:[{article:l.article_name||l.article_label||l.article_code||"Articulo",quantity:h,lineQuantity:f,presentationUnits:d,available:S,shortage:T}]})},At=e=>(e==null?void 0:e.referral_guides)??(e==null?void 0:e.referralGuides)??[],Mr=e=>(e==null?void 0:e.external_reference)||[e==null?void 0:e.series,e==null?void 0:e.sequence].filter(Boolean).join("-")||(e==null?void 0:e.code)||"-",Yi=e=>e&&!["accepted","cancelled"].includes(e.guide_status),Hi=e=>(e==null?void 0:e.delivery_evidences)??(e==null?void 0:e.deliveryEvidences)??[],hn=e=>Hi(e)[0]??null,Ki=e=>(e==null?void 0:e.tracking_events)??(e==null?void 0:e.trackingEvents)??[],Cr=e=>{const r=`${e??""}`.trim();return r.startsWith("blob:")||r.startsWith("data:image/")||/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(r)||r.includes("/delivery-evidence-media/")},Rr=()=>{const e=new Date;return e.setMinutes(e.getMinutes()-e.getTimezoneOffset()),e.toISOString().slice(0,16)},kt={lat:-12.046374,lng:-77.042793},oe=e=>{const r=Number(e);return Number.isFinite(r)?r:null},Pt=e=>{const r=oe(e);return r===null?"":r.toFixed(7)},ce=e=>oe(e==null?void 0:e.lat)!==null&&oe(e==null?void 0:e.lng)!==null,Ji=({modalRef:e,position:r,searchText:i,onPositionChange:l,onSearchTextChange:o,onAddressSelected:f,googleMapsApiKey:d,disabled:h=!1})=>{const R=c.useRef(),[L,S]=c.useState(!1),[F,T]=c.useState(""),[de,ne]=c.useState([]),W=ce(r)?{lat:oe(r.lat),lng:oe(r.lng)}:kt,B=(b,D=17)=>{const Y=oe(b==null?void 0:b.lat),H=oe(b==null?void 0:b.lng);Y===null||H===null||!R.current||(R.current.setCenter({lat:Y,lng:H}),R.current.setZoom(D))},Ee=b=>{h||(l(b),B(b))};c.useEffect(()=>{if(ce(r)){B(W);return}B(kt,13)},[r==null?void 0:r.lat,r==null?void 0:r.lng]),c.useEffect(()=>{const b=e==null?void 0:e.current;if(!b)return;const D=()=>{setTimeout(()=>{ce(r)?B(W):B(kt,13)},180)};return $(b).on("shown.bs.modal",D),()=>$(b).off("shown.bs.modal",D)},[e,r==null?void 0:r.lat,r==null?void 0:r.lng]);const Fe=async()=>{var D,Y;if(h)return;const b=`${i??""}`.trim();if(!b){ne([]),T("Escribe una direccion para buscar.");return}if(!((Y=(D=window.google)==null?void 0:D.maps)!=null&&Y.Geocoder)){T("Google Maps aun no termino de cargar.");return}S(!0),T("");try{new window.google.maps.Geocoder().geocode({address:`${b}, Peru`,componentRestrictions:{country:"PE"},region:"PE"},(ue,K)=>{if(S(!1),K!=="OK"||!Array.isArray(ue)||ue.length===0){ne([]),T("Sin resultados. Puedes marcar el punto manualmente en el mapa.");return}ne(ue.slice(0,5).map(re=>({place_id:re.place_id,display_name:re.formatted_address,lat:re.geometry.location.lat(),lng:re.geometry.location.lng()})))})}catch(H){S(!1),T(`${H.message}. Puedes marcar el punto manualmente en el mapa.`),ne([])}},Lt=b=>{if(h)return;const D={lat:oe(b.lat),lng:oe(b.lng)};l(D),o(b.display_name??""),f(b.display_name??""),B(D),ne([])};return n.jsxs("div",{className:"commercial-order-map-picker",children:[n.jsxs("div",{className:"commercial-order-map-search",children:[n.jsxs("div",{children:[n.jsx("label",{className:"form-label",children:"Buscar direccion en mapa"}),n.jsxs("div",{className:"input-group",children:[n.jsx("input",{type:"text",className:"form-control",value:i,disabled:h,onChange:b=>o(b.target.value),onKeyDown:b=>{b.key==="Enter"&&(b.preventDefault(),Fe())},placeholder:"Ej. Av. Javier Prado 123, San Isidro"}),n.jsx("button",{type:"button",className:"btn btn-outline-primary",onClick:Fe,disabled:L||h,children:L?"Buscando...":"Buscar"})]})]}),n.jsxs("div",{className:"commercial-order-map-coordinates",children:[n.jsx("label",{className:"form-label",children:"Coordenadas"}),n.jsxs("div",{className:"commercial-order-map-coordinate-values",children:[n.jsx("span",{children:Pt(r==null?void 0:r.lat)||"-"}),n.jsx("span",{children:Pt(r==null?void 0:r.lng)||"-"})]})]})]}),de.length>0&&n.jsx("div",{className:"commercial-order-map-results",children:de.map(b=>n.jsx("button",{type:"button",className:"commercial-order-map-result",disabled:h,onClick:()=>Lt(b),children:b.display_name},`${b.place_id}-${b.lat}-${b.lng}`))}),F&&n.jsx("small",{className:"text-muted d-block mt-1",children:F}),n.jsx(Wa,{googleMapsApiKey:d,language:"es",region:"PE",onError:()=>T("No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio."),children:n.jsx(qa,{mapContainerClassName:"commercial-order-map-canvas",center:W,zoom:ce(r)?17:13,options:{clickableIcons:!h,fullscreenControl:!0,gestureHandling:h?"none":"greedy",mapTypeControl:!0,scrollwheel:!h,streetViewControl:!1},onLoad:b=>{R.current=b,setTimeout(()=>{ce(r)?B(W):B(kt,13)},120)},onClick:b=>{if(h)return;const D={lat:b.latLng.lat(),lng:b.latLng.lng()};Ee(D)},children:ce(r)&&n.jsx(Ya,{position:W,draggable:!h,onDragEnd:b=>Ee({lat:b.latLng.lat(),lng:b.latLng.lng()})})})}),n.jsx("small",{className:"text-muted d-block mt-2",children:"Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega."})]})},Qi=e=>{const r=`${za.GMAPS_API_KEY??""}`.trim();return r?n.jsx(Ji,{...e,googleMapsApiKey:r}):n.jsx("div",{className:"commercial-order-map-picker",children:n.jsx("div",{className:"commercial-order-map-empty",children:"Configura Google Maps API Key en Sistemas > Datos generales > Integraciones para habilitar el mapa."})})},Xi=e=>!e||e.status===null||`${e.order_status??""}`=="cancelled"?!1:`${e.dispatch_status??"pending"}`=="pending",Zi=e=>!e||e.status===null||e.status===!1||e.status===0?!1:!["draft","cancelled"].includes(`${e.order_status??""}`),Lr=e=>{if(!e)return!1;const r=`${e.local_status??""}`;return["accepted","observed","cancelled"].includes(r)||!!e.external_id},es=e=>{if(!e)return!1;const r=`${e.local_status??""}`;return["accepted","sent","observed"].includes(r)||!!e.external_id},wr=e=>{if(!(e!=null&&e.id))return"";const r=we(e);return es(r)||`${e.billing_status??""}`=="billed"?`Este pedido ya tiene comprobante ${te(r)||(r==null?void 0:r.code)||"emitido"}. No se pueden modificar datos ni productos despues de emitir.`:""},ts=e=>{const r=we(e);return r?Lr(r)?{icon:"mdi mdi-file-eye-outline",title:`Previsualizar PDF del comprobante ${te(r)||r.code}`}:It(r)?{icon:"mdi mdi-file-eye-outline",title:`Emitir o previsualizar comprobante ${te(r)||r.code}`}:{icon:"mdi mdi-send",title:`Emitir comprobante ${te(r)||r.code}`}:{icon:"mdi mdi-file-send-outline",title:"Generar comprobante de venta para este pedido"}},ns=e=>{if(!e)return[];const r=Ki(e).map(d=>({date:d.happened_at??d.created_at,status:[d.title,d.description].filter(Boolean).join(" - ")})),i=[{date:e.created_at,status:"La orden ingreso en el sistema"}];e.approved_at&&["preparing","in_route","delivered","dispatched","billed","closed"].includes(e.order_status)?i.push({date:e.approved_at,status:"La orden paso a preparacion"}):e.approved_at&&e.order_status==="confirmed"?i.push({date:e.approved_at,status:"La orden fue confirmada"}):["preparing","in_route","delivered","dispatched","billed","closed"].includes(e.order_status)&&i.push({date:e.updated_at,status:"La orden paso a preparacion"});const l=(e.dispatch_assignments??e.dispatchAssignments??[]).filter(d=>(d==null?void 0:d.status)!==!1&&(d==null?void 0:d.status)!==0&&(d==null?void 0:d.dispatch)).sort((d,h)=>{var R,L,S,F;return new Date(((R=d==null?void 0:d.dispatch)==null?void 0:R.departed_at)||((L=d==null?void 0:d.dispatch)==null?void 0:L.scheduled_date)||0)-new Date(((S=h==null?void 0:h.dispatch)==null?void 0:S.departed_at)||((F=h==null?void 0:h.dispatch)==null?void 0:F.scheduled_date)||0)}),o=l.find(d=>{var h;return["in_route","delivered","closed"].includes((h=d==null?void 0:d.dispatch)==null?void 0:h.dispatch_status)});o?(i.push({date:o.dispatch.departed_at??o.dispatch.updated_at??o.dispatch.created_at,status:`Manifiesto ${o.dispatch.manifest_code||o.dispatch.code||""}`.trim()}),i.push({date:o.dispatch.departed_at??o.dispatch.updated_at??o.dispatch.created_at,status:"El pedido salio en ruta"})):e.dispatch_status==="in_route"&&i.push({date:e.updated_at,status:"El pedido salio en ruta"}),(e.dispatch_status==="dispatched"||l.some(d=>{var h;return((h=d==null?void 0:d.dispatch)==null?void 0:h.dispatch_status)==="dispatched"}))&&i.push({date:e.updated_at,status:"El pedido paso a despacho"}),At(e).forEach(d=>{i.push({date:d.issue_date??d.created_at??e.updated_at,status:`Guia de remision ${Mr(d)} - ${Fr(d.guide_status)}`})});const f=l.find(d=>{var h;return["delivered","closed"].includes((h=d==null?void 0:d.dispatch)==null?void 0:h.dispatch_status)});return f?i.push({date:f.dispatch.delivered_at??f.dispatch.updated_at??f.dispatch.created_at,status:"El pedido fue entregado"}):e.dispatch_status==="delivered"&&i.push({date:e.updated_at,status:"El pedido fue entregado"}),(e.order_status==="cancelled"||e.dispatch_status==="cancelled")&&i.push({date:e.updated_at,status:"El pedido fue cancelado"}),[...r,...i].filter(d=>d.date).sort((d,h)=>new Date(d.date)-new Date(h.date))},rs=({title:e,config:r})=>{const i=(r==null?void 0:r.pageSize)??20;return n.jsx("div",{className:"row",children:n.jsx("div",{className:"col-12",children:n.jsxs("div",{className:"card",children:[n.jsx("div",{className:"card-header",children:e}),n.jsxs("div",{className:"card-body",children:[n.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[n.jsxs("div",{className:"d-flex align-items-center gap-2",children:[n.jsx("label",{className:"form-label mb-0",children:"Elementos :"}),n.jsx("select",{className:"form-select form-select-sm commercial-order-page-size",defaultValue:i,children:[10,20,25,50].map(l=>n.jsx("option",{value:l,children:l},`commercial-list-size-${l}`))})]}),n.jsxs("div",{className:"d-flex align-items-center gap-2",children:[n.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),n.jsx("input",{className:"form-control form-control-sm commercial-order-list-search"})]})]}),((r==null?void 0:r.exports)??[]).length>0&&n.jsx("div",{className:"d-flex flex-wrap gap-1 mb-2",children:r.exports.map(l=>n.jsx("button",{type:"button",className:"btn btn-sm btn-light",children:l},`commercial-list-export-${l}`))}),n.jsx("div",{className:"table-responsive commercial-order-legacy-table",children:n.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[n.jsx("thead",{children:n.jsx("tr",{children:((r==null?void 0:r.headers)??[]).map(l=>n.jsx("th",{children:l},`commercial-list-header-${l}`))})}),n.jsx("tbody",{children:n.jsx("tr",{children:n.jsx("td",{colSpan:((r==null?void 0:r.headers)??[]).length||1,className:"text-muted",children:"No existen elementos"})})})]})}),n.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2",children:[n.jsx("span",{className:"text-muted",children:"No hay elementos a mostrar"}),n.jsxs("div",{className:"d-flex align-items-center gap-2 text-muted",children:[n.jsx("span",{children:"Anterior"}),n.jsx("button",{type:"button",className:"btn btn-sm btn-light active",children:"1"}),n.jsx("span",{children:"Siguiente"})]})]})]})]})})})},as=({requiredPermission:e="orders",externalSource:r=null,pageTitle:i="Pedidos comerciales"})=>{var Hn;M.externalSource=null;const l=c.useRef(),o=c.useRef(),f=c.useRef(),d=c.useRef(),h=c.useRef(),R=c.useRef(),L=c.useRef(),S=c.useRef(),F=c.useRef(),T=c.useRef(),de=c.useRef(),ne=c.useRef(),W=c.useRef(),B=c.useRef(),Ee=c.useRef(),Fe=c.useRef(),Lt=c.useRef(),b=c.useRef(),D=c.useRef(),Y=c.useRef(),H=c.useRef(),ue=c.useRef(),K=c.useRef(),re=c.useRef(),Br=c.useRef(),dt=c.useRef(),ut=c.useRef(),ze=c.useRef(),mt=c.useRef(),pt=c.useRef(),ft=c.useRef(),ht=c.useRef(),bt=c.useRef(),gt=c.useRef(),xt=c.useRef(),_t=c.useRef(),Gr=c.useRef(),J=c.useRef(),Se=c.useRef(),me=c.useRef(),$e=c.useRef(),Te=c.useRef(),vt=c.useRef(),Bt=c.useRef({}),[Ur,Vr]=c.useState(!1),[ke,xn]=c.useState(""),[Q,yt]=c.useState(""),[X,Nt]=c.useState(""),[De,Gt]=c.useState(""),[Ie,Ut]=c.useState(""),[Z,We]=c.useState(""),[zr,ve]=c.useState(""),[Vt,zt]=c.useState({lat:"",lng:""}),[Wr,jt]=c.useState(""),[qr,_n]=c.useState([]),[qe,Ct]=c.useState([]),[is,Ae]=c.useState([]),[ae,ee]=c.useState([lt()]),[Oe,vn]=c.useState("Factura"),[pe,Wt]=c.useState(null),[yn,Yr]=c.useState(null),[Pe,Hr]=c.useState(null),[Nn,qt]=c.useState(null),[ye,Yt]=c.useState(""),[Ht,Kr]=c.useState([]),[Kt,jn]=c.useState(""),[Jt,Cn]=c.useState(!1),[w,Jr]=c.useState(r?"multivende":"orders"),[Qr,Xr]=c.useState([]),[Zr,ea]=c.useState([]),[Rn,ta]=c.useState(Ir()),[Ye,na]=c.useState($i()),[Rt,ra]=c.useState(""),[E,Qt]=c.useState({recipient_name:"",recipient_document_type:"DNI",recipient_document_number:"",recipient_phone:"",delivered_at:Rr(),evidence_notes:"",evidence_url:"",latitude:"",longitude:""}),aa=c.useMemo(()=>{const t=new Er;return t.externalSource=r||cr,t},[r]),wt=$t.find(t=>t.id===w)??$t[0],He=Rn[w]??{},wn=Ye[w]??{},ia=c.useMemo(()=>Di(Ye.orders),[Ye.orders]),sa=c.useMemo(()=>ki(w,wn),[w,wn]),la=c.useMemo(()=>Ii(Ye.multivende,r||cr),[Ye.multivende,r]),oa=c.useMemo(()=>{var a;const t=new URLSearchParams;return ke&&t.append("business_id",ke),Q&&t.append("business_branch_id",Q),X&&t.append("warehouse_id",X),De&&t.append("client_id",De),Ie&&t.append("eventual_client_id",Ie),Z&&t.append("client_distribution_network_id",Z),(a=K.current)!=null&&a.value&&t.append("issue_date",K.current.value),`/api/admin/commercial-orders/articles?${t.toString()}`},[ke,Q,X,De,Ie,Z]),ca=c.useMemo(()=>Q?["business_branch_id","=",Number(Q)]:null,[Q]);c.useEffect(()=>()=>{ye!=null&&ye.startsWith("blob:")&&URL.revokeObjectURL(ye)},[ye]),c.useEffect(()=>{let t=!0;return Promise.all([ie.getBusinesses(),M.getLaboratories()]).then(([a,s])=>{t&&(Xr(a),ea(s))}),()=>{t=!1}},[]),c.useEffect(()=>{if(!pe)return;const t=()=>Wt(null),a=s=>{s.key==="Escape"&&t()};return document.addEventListener("click",t),document.addEventListener("keydown",a),window.addEventListener("resize",t),window.addEventListener("scroll",t,!0),()=>{document.removeEventListener("click",t),document.removeEventListener("keydown",a),window.removeEventListener("resize",t),window.removeEventListener("scroll",t,!0)}},[pe]);const En=t=>(Bt.current[t]||(Bt.current[t]=c.createRef()),Bt.current[t]);c.useEffect(()=>{ae.forEach(t=>{const a=En(t.uid);!a.current||!t.article_id||!t.article_label||`${$(a.current).val()}`==`${t.article_id}`||Le(a.current,t.article_id,t.article_label)})},[ae]);const Fn=async(t,a=null)=>{if(!t){_n([]),yt("");return}const u=(await M.getBranchesByBusiness(t)??[]).filter(m=>m.status!==null);if(_n(u),a&&u.some(m=>`${m.id}`==`${a}`)){yt(`${a}`);return}yt("")},Sn=t=>{if(!t)return;const a=Ui(t),s=Vi(t);a&&J.current&&(J.current.value=a),s&&me.current&&(me.current.value=s),a&&jt(a)},$n=async(t,a=null,s=null)=>{var _;if(!t){Ct([]),We(""),Ae([]),ve("");return}const m=(await M.getDistributionNetworks(t)??[]).filter(g=>g.status!==null);Ct(m);const p=a||((_=m.find(g=>g.is_default))==null?void 0:_.id);if(p&&m.some(g=>`${g.id}`==`${p}`)){We(`${p}`),await Tn(p,null,m);return}We(""),Ae([]),ve(""),Sn(s)},Tn=async(t,a=null,s=null)=>{var g,N;if(!t){Ae([]),ve("");return}let u=[];const m=(s??qe).find(y=>`${y.id}`==`${t}`);(((g=m==null?void 0:m.addresses)==null?void 0:g.length)??0)>0?u=m.addresses:u=await M.getDeliveryAddresses(t);const p=(u??[]).filter(y=>y.status!==null);Ae(p);const _=a||((N=p.find(y=>y.is_default))==null?void 0:N.id);if(_&&p.some(y=>`${y.id}`==`${_}`)){ve(`${_}`),da(p.find(y=>`${y.id}`==`${_}`));return}ve("")},da=t=>{t&&(J.current&&(J.current.value=k(t.address)),Se.current&&(Se.current.value=k(t.reference)),me.current&&(me.current.value=k(t.ubigeo)),$e.current&&($e.current.value=k(t.contact_name)),Te.current&&(Te.current.value=k(t.contact_phone)),jt(k(t.address)),ce({lat:t.latitude,lng:t.longitude})&&zt({lat:Number(t.latitude),lng:Number(t.longitude)}))},kn=async(t,a={})=>{var p,_,g;const s=a.article_id??t.article_id,u=Number(a.quantity??t.quantity??0),m=a.presentation_id??t.presentation_id;return!s||!X||u<=0?null:await M.resolvePrice({article_id:s,presentation_id:m||null,quantity:u,business_id:ke||null,business_branch_id:Q||null,warehouse_id:X||null,client_id:De||null,eventual_client_id:Ie||null,client_distribution_network_id:Z||null,issue_date:((p=K.current)==null?void 0:p.value)||null,commercial_channel:((_=qe.find(N=>`${N.id}`==`${Z}`))==null?void 0:_.commercial_channel)||null,segment:((g=qe.find(N=>`${N.id}`==`${Z}`))==null?void 0:g.segment)||null})},Xt=async(t=null)=>{const a=t??ae;for(const s of a){if(!s.article_id)continue;const u=await kn(s);u&&ee(m=>m.map(p=>p.uid!==s.uid?p:Re({...p,stock_available:Number(u.stock_available||0),price_unit:ur(p,u),price_source:mr(p,u),price_list_code:u.price_list_code||""})))}},Dn=t=>{t==="regular"?(Ut(""),se(Y)):t==="eventual"&&(Gt(""),Ct([]),We(""),Ae([]),ve(""),se(D))},Zt=async(t=null)=>{var g,N,y,A;Vr(!!(t!=null&&t.id)),ra(wr(t)),B.current&&(B.current.value=(t==null?void 0:t.id)??""),Ee.current&&(Ee.current.value=(t==null?void 0:t.code)??"Se genera al guardar"),K.current&&(K.current.value=t!=null&&t.issue_date?t.issue_date.toString().slice(0,10):new Date().toISOString().slice(0,10)),re.current&&(re.current.value=t!=null&&t.promised_delivery_at?t.promised_delivery_at.toString().slice(0,10):""),vn(Ot((t==null?void 0:t.document_type)??"Factura")),dt.current&&(dt.current.value=(t==null?void 0:t.currency)??"PEN"),ut.current&&(ut.current.value=(t==null?void 0:t.payment_condition)??"Contado"),ze.current&&(ze.current.value=Gi(t==null?void 0:t.payment_method)),ht.current&&(ht.current.value=(t==null?void 0:t.installments)??1),bt.current&&(bt.current.value=t!=null&&t.first_due_date?t.first_due_date.toString().slice(0,10):""),gt.current&&(gt.current.value=(t==null?void 0:t.order_status)??(t!=null&&t.external_source?"pending":"draft")),xt.current&&(xt.current.value=(t==null?void 0:t.dispatch_status)??"pending"),_t.current&&(_t.current.value=(t==null?void 0:t.billing_status)??"pending"),J.current&&(J.current.value=k(t==null?void 0:t.delivery_address)),Se.current&&(Se.current.value=k(t==null?void 0:t.delivery_reference)),me.current&&(me.current.value=k(t==null?void 0:t.ubigeo)),$e.current&&($e.current.value=k(t==null?void 0:t.dispatch_contact_name)),Te.current&&(Te.current.value=k(t==null?void 0:t.dispatch_contact_phone)),mt.current&&(mt.current.value=(t==null?void 0:t.purchase_order)??""),pt.current&&(pt.current.value=(t==null?void 0:t.guide_number)??""),ft.current&&(ft.current.value=(t==null?void 0:t.referral_guide)??""),ue.current&&(ue.current.value=(t==null?void 0:t.doctor_name)??""),vt.current&&(vt.current.value=(t==null?void 0:t.observations)??""),zt({lat:ce({lat:t==null?void 0:t.map_lat,lng:t==null?void 0:t.map_lng})?Number(t.map_lat):"",lng:ce({lat:t==null?void 0:t.map_lat,lng:t==null?void 0:t.map_lng})?Number(t.map_lng):""}),jt(k(t==null?void 0:t.delivery_address));const a=t!=null&&t.business_id?`${t.business_id}`:"",s=t!=null&&t.warehouse_id?`${t.warehouse_id}`:"",u=t!=null&&t.client_id?`${t.client_id}`:"",m=t!=null&&t.eventual_client_id?`${t.eventual_client_id}`:"";xn(a),Nt(s),Gt(u),Ut(m),a&&((g=t==null?void 0:t.business)!=null&&g.name)?Le(Fe.current,a,t.business.name):se(Fe),s&&((N=t==null?void 0:t.warehouse)!=null&&N.name)?Le(b.current,s,t.warehouse.name):se(b),u&&((y=t==null?void 0:t.client)!=null&&y.full_name)?Le(D.current,u,`${t.client.document_number??""} - ${t.client.full_name}`.trim()):se(D),m&&((A=t==null?void 0:t.eventual_client)!=null&&A.business_name)?Le(Y.current,m,`${t.eventual_client.document_number??""} - ${t.eventual_client.business_name}`.trim()):se(Y),t!=null&&t.seller_id&&(t!=null&&t.seller)?Le(H.current,t.seller_id,yi(t.seller)):se(H);const p=((t==null?void 0:t.items)??[]).map(j=>{var he,be,ge,xe,C,I,Je,Qe,Xe,Ze,et,tt,nt,rt,at,it;const x=j.article??null,q=((x==null?void 0:x.presentations)??[]).filter(O=>(O==null?void 0:O.status)!==!1&&(O==null?void 0:O.status)!==0),G=j.presentation??q[0]??null,Ce=Number(j.presentation_units??(G==null?void 0:G.units)??1)||1;return Re({uid:crypto.randomUUID(),article_id:j.article_id?`${j.article_id}`:"",article_label:x?`${x.code??""} - ${x.name??""}`.trim():"",article_code:(x==null?void 0:x.code)??j.external_sku??"",article_lot:(x==null?void 0:x.default_lot)??"",article_name:(x==null?void 0:x.name)??"",article_unit:((he=x==null?void 0:x.unit)==null?void 0:he.symbol)??((be=x==null?void 0:x.unit)==null?void 0:be.name)??"",article_laboratory:((ge=x==null?void 0:x.laboratory)==null?void 0:ge.name)??"",article_principle:((xe=x==null?void 0:x.activePrinciple)==null?void 0:xe.name)??((C=x==null?void 0:x.active_principle)==null?void 0:C.name)??"",presentations:q.map(O=>({id:`${O.id}`,name:O.name??"Presentacion",units:Number(O.units||1),price:Number(O.price||0)})),presentation_id:G!=null&&G.id?`${G.id}`:"",presentation_units:Ce,stock_available:Number(j.stock_available||0),reserved_quantity:Number(j.reserved_quantity||0),price_unit:Number(j.price_unit||0),quantity:Number(j.quantity||1),discount_type:((Je=(I=j.external_payload)==null?void 0:I.commercial_form)==null?void 0:Je.discount_type)??"none",discount_value:Number(((Xe=(Qe=j.external_payload)==null?void 0:Qe.commercial_form)==null?void 0:Xe.discount_value)||0),discount_amount:Number(((et=(Ze=j.external_payload)==null?void 0:Ze.commercial_form)==null?void 0:et.discount_amount)||0),gross_total:Number(((nt=(tt=j.external_payload)==null?void 0:tt.commercial_form)==null?void 0:nt.gross_total)||0),total:Number(j.total||0),price_source:j.price_source||"fallback",price_list_code:((at=(rt=j==null?void 0:j.price_list_item)==null?void 0:rt.price_list)==null?void 0:at.code)||((it=t==null?void 0:t.price_list)==null?void 0:it.code)||""})}),_=p.length?p:[lt()];ee(_),$(d.current).modal("show"),await Fn((t==null?void 0:t.business_id)??null,(t==null?void 0:t.business_branch_id)??null),u?(await $n(u,(t==null?void 0:t.client_distribution_network_id)??null),t!=null&&t.client_distribution_network_id&&await Tn(t.client_distribution_network_id,(t==null?void 0:t.client_delivery_address_id)??null)):(Ct([]),We(""),Ae([]),ve(""))},ua=async t=>{var m,p,_,g,N,y,A,j,x,q,G,Ce,he,be,ge,xe,C,I,Je,Qe,Xe,Ze,et,tt,nt,rt,at,it,O,Kn,Jn,Qn,Xn;if(t.preventDefault(),Rt){U.fire("Pedido bloqueado",Rt,"info");return}const a={id:((m=B.current)==null?void 0:m.value)||void 0,external_source:r||void 0,business_id:ke||null,business_branch_id:Q||null,warehouse_id:X||null,client_id:De||null,eventual_client_id:Ie||null,seller_id:((p=H.current)==null?void 0:p.value)||null,client_distribution_network_id:Z||null,client_delivery_address_id:zr||null,document_type:Oe,currency:((_=dt.current)==null?void 0:_.value)||"PEN",payment_condition:Bi(((g=ze.current)==null?void 0:g.value)||((N=ut.current)==null?void 0:N.value)||"Contado"),payment_method:((y=ze.current)==null?void 0:y.value)||"",purchase_order:((j=(A=mt.current)==null?void 0:A.value)==null?void 0:j.trim())||"",guide_number:((q=(x=pt.current)==null?void 0:x.value)==null?void 0:q.trim())||"",referral_guide:((Ce=(G=ft.current)==null?void 0:G.value)==null?void 0:Ce.trim())||"",doctor_name:((be=(he=ue.current)==null?void 0:he.value)==null?void 0:be.trim())||"",issue_date:((ge=K.current)==null?void 0:ge.value)||"",promised_delivery_at:((xe=re.current)==null?void 0:xe.value)||null,installments:((C=ht.current)==null?void 0:C.value)||1,first_due_date:((I=bt.current)==null?void 0:I.value)||null,order_status:((Je=gt.current)==null?void 0:Je.value)||(r?"pending":"draft"),dispatch_status:((Qe=xt.current)==null?void 0:Qe.value)||"pending",billing_status:((Xe=_t.current)==null?void 0:Xe.value)||"pending",tax_amount:Ke.taxAmount,delivery_address:((et=(Ze=J.current)==null?void 0:Ze.value)==null?void 0:et.trim())||"",delivery_reference:((nt=(tt=Se.current)==null?void 0:tt.value)==null?void 0:nt.trim())||"",ubigeo:((at=(rt=me.current)==null?void 0:rt.value)==null?void 0:at.trim())||"",map_lat:Pt(Vt.lat)||null,map_lng:Pt(Vt.lng)||null,dispatch_contact_name:((O=(it=$e.current)==null?void 0:it.value)==null?void 0:O.trim())||"",dispatch_contact_phone:((Jn=(Kn=Te.current)==null?void 0:Kn.value)==null?void 0:Jn.trim())||"",observations:((Xn=(Qn=vt.current)==null?void 0:Qn.value)==null?void 0:Xn.trim())||"",items:ae.map(P=>({article_id:P.article_id||null,presentation_id:P.presentation_id||null,warehouse_id:X||null,stock_available:P.stock_available,reserved_quantity:P.reserved_quantity,presentation_units:P.presentation_units,price_unit:P.price_unit,quantity:P.quantity,gross_total:P.gross_total,discount_type:P.discount_type,discount_value:P.discount_value,discount_amount:P.discount_amount,total:P.total,status:!0}))},s=qi(ae,X);if(s.length>0){const P=`
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${s.map(Me=>`<li><strong>${ji(Me.article)}</strong>: faltan ${Ue(Me.shortage)} unidad(es) base para completar ${Ue(Me.quantity)}. Cantidad: ${Ue(Me.lineQuantity)} x ${Ue(Me.presentationUnits)}. Disponible: ${Ue(Me.available)}.</li>`).join("")}
          </ul>
        </div>
      `,{isConfirmed:La}=await U.fire({title:"Stock insuficiente",html:P,icon:"warning",showCancelButton:!0,confirmButtonText:"Crear de todas formas",cancelButtonText:"Revisar pedido"});if(!La)return;a.allow_stock_shortage=!0}await M.save(a)&&($(l.current).dxDataGrid("instance").refresh(),$(d.current).modal("hide"))},ma=async t=>{const a=t.target.value||"";xn(a),Nt(""),se(b),await Fn(a,null)},pa=t=>{const a=t.target.value||"";yt(a),Nt(""),se(b)},fa=async t=>{const a=t.target.value||"";Nt(a),await Xt()},ha=async t=>{var u,m;const a=yr(t.target.value),s=((m=(u=$(t.target).select2("data"))==null?void 0:u[0])==null?void 0:m.data)??null;Gt(a),Dn("regular"),Sn(s),await $n(a,null,s),await Xt()},ba=async t=>{const a=yr(t.target.value);Ut(a),Dn("eventual"),await Xt()},Ne=(t,a,s)=>{ta(u=>({...u,[t]:{...u[t]??{},[a]:s}}))},In=(t=w)=>{var s;const a=t==="multivende"?f:((s=$t.find(u=>u.id===t))==null?void 0:s.kind)==="billing"?o:l;return a.current?$(a.current).dxDataGrid("instance"):null},An=(t=w)=>{const a=In(t);a&&a.refresh()},On=(t=w)=>{const a=Rn[t]??{};t==="orders"&&M.setFilters({laboratory_id:a.laboratoryId||""}),na(s=>({...s,[t]:a})),setTimeout(()=>An(t),0)},ga=t=>{var a;(a=t==null?void 0:t.preventDefault)==null||a.call(t),On(w)},Pn=(t=!1)=>{const a=w;t&&On(a),setTimeout(()=>{const s=In(a);s!=null&&s.exportToExcel&&s.exportToExcel(!1)},t?350:0)},xa=async({id:t,field:a,value:s})=>{await M.boolean({id:t,field:a,value:s})&&$(l.current).dxDataGrid("instance").refresh()},Mn=t=>{Yr(t),$(de.current).modal("show")},_a=t=>{const a=hn(t);Hr(t),qt(null),Yt(Cr(a==null?void 0:a.evidence_url)?a.evidence_url:""),Qt({recipient_name:(a==null?void 0:a.recipient_name)??(t==null?void 0:t.dispatch_contact_name)??"",recipient_document_type:(a==null?void 0:a.recipient_document_type)??"DNI",recipient_document_number:(a==null?void 0:a.recipient_document_number)??"",recipient_phone:(a==null?void 0:a.recipient_phone)??(t==null?void 0:t.dispatch_contact_phone)??"",delivered_at:a!=null&&a.delivered_at?`${a.delivered_at}`.replace(" ","T").slice(0,16):Rr(),evidence_notes:(a==null?void 0:a.evidence_notes)??"",evidence_url:(a==null?void 0:a.evidence_url)??"",latitude:(a==null?void 0:a.latitude)??"",longitude:(a==null?void 0:a.longitude)??""}),navigator.geolocation&&navigator.geolocation.getCurrentPosition(s=>{Qt(u=>({...u,latitude:u.latitude||s.coords.latitude,longitude:u.longitude||s.coords.longitude}))},()=>{},{enableHighAccuracy:!0,timeout:5e3}),setTimeout(()=>{W.current&&(W.current.value="")},0),$(ne.current).modal("show")},va=t=>{var s;const a=((s=t.target.files)==null?void 0:s[0])??null;qt(a),Yt(a?URL.createObjectURL(a):Cr(E.evidence_url)?E.evidence_url:"")},fe=(t,a)=>Qt(s=>({...s,[t]:a})),ya=async t=>{if(t.preventDefault(),!(Pe!=null&&Pe.id))return;const a=(Pe.dispatch_assignments??Pe.dispatchAssignments??[]).filter(m=>(m==null?void 0:m.status)!==!1&&(m==null?void 0:m.status)!==0&&(m==null?void 0:m.dispatch)).sort((m,p)=>{var _,g;return new Date(((_=p==null?void 0:p.dispatch)==null?void 0:_.scheduled_date)||(p==null?void 0:p.created_at)||0)-new Date(((g=m==null?void 0:m.dispatch)==null?void 0:g.scheduled_date)||(m==null?void 0:m.created_at)||0)})[0],s=new FormData;a!=null&&a.dispatch_id&&s.append("dispatch_id",a.dispatch_id),s.append("recipient_name",E.recipient_name??""),s.append("recipient_document_type",E.recipient_document_type??"DNI"),s.append("recipient_document_number",E.recipient_document_number??""),s.append("recipient_phone",E.recipient_phone??""),s.append("delivered_at",E.delivered_at??""),s.append("evidence_notes",E.evidence_notes??""),s.append("evidence_url",E.evidence_url??""),s.append("latitude",E.latitude??""),s.append("longitude",E.longitude??""),Nn&&s.append("evidence_file",Nn),await M.saveDeliveryEvidence(Pe.id,s)&&(qt(null),Yt(""),W.current&&(W.current.value=""),$(ne.current).modal("hide"),$(l.current).dxDataGrid("instance").refresh())},Ln=async t=>{const a=At(t)[0];if(a){if(Yi(a)){const u=await U.fire({title:"Guia de remision",text:`La guia ${Mr(a)} esta ${Fr(a.guide_status).toLowerCase()}.`,icon:"question",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Ver PDF",cancelButtonText:"Cancelar"});if(u.isConfirmed){const m=await or.issue(a.id);if(!(m!=null&&m.data))return;$(l.current).dxDataGrid("instance").refresh(),await Ft(St.referralGuide(m.data));return}if(!u.isDenied)return}await Ft(St.referralGuide(a));return}const s=await or.prepareFromCommercialOrder(t.id);s!=null&&s.data&&($(l.current).dxDataGrid("instance").refresh(),await Ft(St.referralGuide(s.data)))},Na=async t=>{var s;if(!(t!=null&&t.id)||t.items&&(t.business||t.commercial_order||t.commercialOrder))return t;const a=await ie.paginate({skip:0,take:1,isLoadingAll:!0,filter:["id","=",Number(t.id)]});return((s=a==null?void 0:a.data)==null?void 0:s[0])??t},Bn=async t=>{var u;const a=`${(t==null?void 0:t.local_status)??"pending"}`=="pending"?((u=await ie.prepareVoucher(t.id))==null?void 0:u.data)??t:t,s=await Na(a);if(!It(s)){await U.fire({title:"Comprobante no preparado",text:"Primero genera serie y correlativo del comprobante.",icon:"warning",confirmButtonText:"Entendido"});return}gi(s)},ja=async t=>{var u;let a=we(t);if(a&&Lr(a)){sr(ie.downloadUrl(a.id,"pdf"),`Comprobante ${te(a)||a.code}`);return}if(a){const m=await U.fire({title:"Emitir comprobante",text:It(a)?`El comprobante ${te(a)||a.code} ya esta preparado. Puedes emitirlo o previsualizarlo.`:`Se emitira ${te(a)||a.code} usando el conector configurado.`,icon:"question",showCancelButton:!0,showDenyButton:It(a),confirmButtonText:"Emitir",denyButtonText:"Previsualizar PDF",cancelButtonText:"Cancelar"});if(m.isDenied){await Bn(a);return}if(!m.isConfirmed)return}else{if(!Zi(t)){await U.fire({title:"Comprobante no disponible",text:"Primero envia el pedido a preparacion o confirma el pedido. Los pedidos en borrador no se pueden facturar.",icon:"warning",confirmButtonText:"Entendido"});return}const m=on(t);if(!(await U.fire({title:"Generar comprobante",text:`Se generara un comprobante ${m} para el pedido ${t.code}.`,icon:"question",showCancelButton:!0,confirmButtonText:"Generar",cancelButtonText:"Cancelar"})).isConfirmed)return;const _=await ie.save({commercial_order_id:t.id,document_type:m});if(!((u=_==null?void 0:_.data)!=null&&u.id))return;const g=await ie.prepareVoucher(_.data.id);a=(g==null?void 0:g.data)??_.data,$(l.current).dxDataGrid("instance").refresh();const N=await U.fire({title:"Comprobante generado",text:`Se genero ${te(a)||a.code}. Puedes emitirlo o previsualizarlo ahora.`,icon:"success",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Previsualizar PDF",cancelButtonText:"Cerrar"});if(N.isDenied){await Bn(a);return}if(!N.isConfirmed)return}await ie.issue(a.id)&&$(l.current).dxDataGrid("instance").refresh()},Ca=async t=>{const{isConfirmed:a}=await U.fire({title:"Eliminar pedido comercial",text:"Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!a||!await M.delete(t)||$(l.current).dxDataGrid("instance").refresh()},Ra=()=>{R.current&&(R.current.value=""),$(h.current).modal("show"),setTimeout(()=>{var t;return(t=R.current)==null?void 0:t.focus()},150)},wa=async t=>{var s,u;t.preventDefault();const a=((u=(s=R.current)==null?void 0:s.value)==null?void 0:u.trim())||"";if(!a){await U.fire({title:"CHECK OUT ID requerido",text:"Ingresa el CHECK OUT ID del pedido Multivende.",icon:"warning",confirmButtonText:"Entendido"});return}await U.fire({title:"Integracion pendiente",text:`El formulario ya captura el CHECK OUT ID ${a}. Falta conectar el servicio de Multivende para registrar el pedido automaticamente.`,icon:"info",confirmButtonText:"Aceptar"})},Gn=()=>{S.current&&(S.current.value=""),F.current&&(F.current.value=""),T.current&&(T.current.value="1")},Un=async()=>{Cn(!0);try{const t=await lr.paginate({take:100,skip:0,requireTotalCount:!0,sort:[{selector:"id",desc:!1}]});Kr((t==null?void 0:t.data)??[])}finally{Cn(!1)}},Ea=async()=>{Gn(),jn(""),$(L.current).modal("show"),await Un(),setTimeout(()=>{var t;return(t=F.current)==null?void 0:t.focus()},150)},Fa=t=>{var a;S.current&&(S.current.value=(t==null?void 0:t.id)??""),F.current&&(F.current.value=(t==null?void 0:t.description)??""),T.current&&(T.current.value=t!=null&&t.status?"1":"0"),(a=F.current)==null||a.focus()},Sa=async()=>{var s,u,m,p;const t=((u=(s=F.current)==null?void 0:s.value)==null?void 0:u.trim())||"";if(!t){await U.fire({title:"Motivo requerido",text:"Ingresa la descripcion del motivo de retraso.",icon:"warning",confirmButtonText:"Entendido"});return}await lr.save({id:((m=S.current)==null?void 0:m.value)||void 0,description:t,status:((p=T.current)==null?void 0:p.value)==="1"})&&(Gn(),await Un())},$a=async(t,a)=>{var j,x,q,G,Ce,he,be,ge,xe;$(a.target).data("select2")&&$(a.target).select2("close");const s=(j=$(a.target).select2("data"))==null?void 0:j[0],u=(s==null?void 0:s.data)??null,m=a.target.value||"";if(!m){ee(C=>C.map(I=>I.uid===t?{...lt(),uid:I.uid}:I));return}const p=u??await M.getArticleById(m),_=((p==null?void 0:p.presentations)??[]).filter(C=>(C==null?void 0:C.status)!==!1&&(C==null?void 0:C.status)!==0),g=_[0]??null,N=p?`${p.code??""} - ${p.name??""}`.trim():(s==null?void 0:s.text)??m,y={article_id:m,article_label:N,article_code:(p==null?void 0:p.code)??"",article_lot:(p==null?void 0:p.default_lot)??"",article_name:(p==null?void 0:p.name)??"",article_unit:((x=p==null?void 0:p.unit)==null?void 0:x.symbol)??((q=p==null?void 0:p.unit)==null?void 0:q.name)??"",article_laboratory:((G=p==null?void 0:p.laboratory)==null?void 0:G.name)??"",article_principle:((Ce=p==null?void 0:p.activePrinciple)==null?void 0:Ce.name)??((he=p==null?void 0:p.active_principle)==null?void 0:he.name)??"",presentations:_.map(C=>({id:`${C.id}`,name:C.name??"Presentacion",units:Number(C.units||1),price:Number(C.price||0)})),presentation_id:g?`${g.id}`:"",presentation_units:Number((g==null?void 0:g.units)||1),quantity:1};ee(C=>C.map(I=>I.uid===t?Re({...I,...y}):I));const A=await M.resolvePrice({article_id:m,presentation_id:g?`${g.id}`:null,quantity:1,business_id:ke||null,business_branch_id:Q||null,warehouse_id:X||null,client_id:De||null,eventual_client_id:Ie||null,client_distribution_network_id:Z||null,issue_date:((be=K.current)==null?void 0:be.value)||null,commercial_channel:((ge=qe.find(C=>`${C.id}`==`${Z}`))==null?void 0:ge.commercial_channel)||null,segment:((xe=qe.find(C=>`${C.id}`==`${Z}`))==null?void 0:xe.segment)||null});A&&ee(C=>C.map(I=>I.uid===t?Re({...I,...y,stock_available:Number(A.stock_available||0),price_unit:Number(A.price_unit||0),price_source:A.source||"fallback",price_list_code:A.price_list_code||""}):I))},en=async(t,a,s)=>{const u=ae.find(N=>N.uid===t);if(!u)return;const m=a==="presentation_id"?u.presentations.find(N=>`${N.id}`==`${s}`):null,p=Re({...u,[a]:s,...a==="presentation_id"?{presentation_units:Number((m==null?void 0:m.units)||1)}:{}});if(a==="price_unit"&&(p.price_source="manual",p.price_list_code=""),ee(N=>N.map(y=>y.uid===t?p:y)),!["quantity","presentation_id"].includes(a))return;const _=p.presentations.find(N=>`${N.id}`==`${a==="presentation_id"?s:p.presentation_id}`),g=await kn(p,{quantity:a==="quantity"?s:p.quantity,presentation_id:a==="presentation_id"?s:p.presentation_id});g&&ee(N=>N.map(y=>y.uid!==t?y:Re({...y,presentation_units:Number((_==null?void 0:_.units)||y.presentation_units||1),stock_available:Number(g.stock_available||0),price_unit:ur(y,g,a==="presentation_id"),price_source:mr(y,g,a==="presentation_id"),price_list_code:a==="presentation_id"?g.price_list_code||"":bn(y)?y.price_list_code:g.price_list_code||""})))},Ta=(t,a)=>{const s=Number(a||0);ee(u=>u.map(m=>m.uid!==t?m:Re({...m,discount_type:s>0?"percent":"none",discount_value:s>0?s:0})))},ka=(t,a)=>{a.preventDefault(),a.stopPropagation();const s=a.currentTarget.getBoundingClientRect();Wt(u=>(u==null?void 0:u.uid)===t?null:{uid:t,top:s.bottom+4,left:s.left,width:Math.max(s.width,130)})},Vn=(t,a)=>{Ta(t,a),Wt(null)},Da=()=>ee(t=>[...t,lt()]),Ia=t=>{ee(a=>{const s=a.filter(u=>u.uid!==t);return s.length?s:[lt()]})},zn=c.useMemo(()=>ae.reduce((t,a)=>t+Number(a.total||0),0),[ae]),Ke=c.useMemo(()=>jr(zn,Oe),[zn,Oe]),je=Rt!=="",Wn=c.useMemo(()=>ns(yn),[yn]),tn=c.useMemo(()=>{const t=Kt.trim().toLowerCase();return t?Ht.filter(a=>[a.description,a.status?"Activo":"Inactivo",ln(a.creator),gr(a.created_at)].some(s=>`${s??""}`.toLowerCase().includes(t))):Ht},[Ht,Kt]),Aa=(t,a)=>n.jsxs("div",{className:`commercial-order-filter-field commercial-order-filter-${a.key}`,children:[n.jsxs("label",{className:"form-label",children:[a.label,a.helper&&n.jsxs("span",{className:"commercial-order-filter-helper",children:[" ",a.helper]})]}),a.type==="business"?n.jsxs("select",{className:"form-select",value:He[a.key]??"",onChange:s=>Ne(t,a.key,s.target.value),children:[n.jsx("option",{value:"",children:"Todos"}),Qr.map(s=>n.jsx("option",{value:s.id,children:s.name},`commercial-order-filter-business-${s.id}`))]}):a.type==="laboratory"?n.jsxs("select",{className:"form-select",value:He[a.key]??"",onChange:s=>Ne(t,a.key,s.target.value),children:[n.jsx("option",{value:"",children:"Todos"}),Zr.map(s=>n.jsx("option",{value:s.id,children:s.name},`commercial-order-filter-laboratory-${s.id}`))]}):a.type==="select"?n.jsx("select",{className:"form-select",value:He[a.key]??"",onChange:s=>Ne(t,a.key,s.target.value),children:(a.options??[]).map(s=>n.jsx("option",{value:s.value??s,children:s.label??s},`commercial-order-filter-${a.key}-${s.value??s}`))}):a.type==="dateRange"?n.jsx("input",{className:"form-control commercial-order-date-range-input","data-tab-id":t,value:He[a.key]??"",onChange:s=>Ne(t,a.key,s.target.value),placeholder:a.placeholder??"YYYY/MM/DD - YYYY/MM/DD"}):n.jsx("input",{className:"form-control",value:He[a.key]??"",onChange:s=>Ne(t,a.key,s.target.value),placeholder:a.placeholder??""})]},`commercial-order-main-filter-${t}-${a.key}`),nn={orders:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"laboratoryId",label:"Laboratorio",helper:"(Solo para Reporte con Visitadores)",type:"laboratory"},{key:"dispatchStatus",label:"Despachado",type:"select",options:[{value:"",label:"Seleccionar"},{value:"dispatched",label:"Pedidos despachados"},{value:"pending",label:"Pedidos sin despachar"}]}],issued:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],cancelled:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],"credit-notes":[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],multivende:[{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"orderVtex",label:"Pedido VTEX",type:"text",placeholder:"Numero de pedido"}]}[w]??((Hn=dr[w])==null?void 0:Hn.filters)??[],qn=nn.some(t=>t.type==="dateRange");c.useEffect(()=>{if(!qn)return;let t=!0;return Si().then(()=>{var a,s;!t||!((s=(a=window.$)==null?void 0:a.fn)!=null&&s.daterangepicker)||!window.moment||(window.moment.locale("es"),$(".commercial-order-date-range-input").each(function(){const u=$(this),m=u.data("tab-id")||w,p=`${u.val()||le()}`.trim(),{start:_,end:g}=Ar(p),N=window.moment(_||fn().replaceAll("/","-"),"YYYY-MM-DD"),y=window.moment(g||_||fn().replaceAll("/","-"),"YYYY-MM-DD"),A=u.data("daterangepicker");A&&A.remove(),u.off(".commercialOrderDateRange"),u.daterangepicker({startDate:N,endDate:y,autoUpdateInput:!1,alwaysShowCalendars:!0,linkedCalendars:!1,opens:"center",locale:{format:"YYYY/MM/DD",separator:" - ",applyLabel:"Aplicar",cancelLabel:"Limpiar",fromLabel:"Desde",toLabel:"Hasta",customRangeLabel:"Personalizado",weekLabel:"S",daysOfWeek:["Do","Lu","Ma","Mi","Ju","Vi","Sa"],monthNames:["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"],firstDay:1}},(j,x)=>{const q=`${j.format("YYYY/MM/DD")} - ${x.format("YYYY/MM/DD")}`;u.val(q),Ne(m,"dateRange",q)}),u.on("cancel.daterangepicker.commercialOrderDateRange",()=>{u.val(""),Ne(m,"dateRange","")})}))}).catch(()=>{}),()=>{t=!1,$(".commercial-order-date-range-input").each(function(){const a=$(this).data("daterangepicker");a&&a.remove(),$(this).off(".commercialOrderDateRange")})}},[w,qn]);const Et=n.jsxs("div",{className:"commercial-order-listing-header",children:[n.jsxs("div",{className:"d-flex align-items-center justify-content-between gap-2 mb-2",children:[n.jsx("h4",{className:"header-title mb-0",children:"Listado"}),n.jsx("button",{type:"button",className:"btn btn-xs btn-light",onClick:()=>An(),title:"Refrescar listado",children:n.jsx("i",{className:"mdi mdi-refresh"})})]}),n.jsx("ul",{className:"nav nav-tabs nav-bordered flex-nowrap overflow-auto mb-3",children:$t.map(t=>n.jsx("li",{className:"nav-item",children:n.jsx("button",{type:"button",className:`nav-link text-nowrap ${w===t.id?"active":""}`,onClick:()=>Jr(t.id),children:t.label})},`commercial-order-tab-${t.id}`))}),nn.length>0&&n.jsxs("form",{className:"commercial-order-filter-form mb-2",onSubmit:ga,children:[nn.map(t=>Aa(w,t)),n.jsxs("div",{className:"commercial-order-filter-actions",children:[n.jsxs("button",{type:"submit",className:"btn btn-outline-primary",children:[n.jsx("i",{className:"mdi mdi-magnify me-1"}),"Filtrar"]}),wt.kind!=="static"&&n.jsxs("button",{type:"button",className:"btn btn-outline-danger",onClick:()=>Pn(!0),children:[n.jsx("i",{className:"mdi mdi-file-excel-box me-1"}),"Filtrar a Excel"]}),wt.kind!=="static"&&n.jsxs("button",{type:"button",className:"btn btn-outline-success",onClick:()=>Pn(!1),children:[n.jsx("i",{className:"mdi mdi-file-excel-box me-1"}),"Reporte"]}),w==="multivende"&&n.jsxs("button",{type:"button",className:"btn btn-outline-success",children:[n.jsx("i",{className:"mdi mdi-calendar-refresh me-1"}),"Actualizar fechas de entrega"]})]})]}),w==="issued"&&n.jsx("div",{className:"row g-3 mt-1",children:["Total","IGV","IGV Recuperado"].map(t=>n.jsxs("div",{className:"col-12 col-md-4",children:[n.jsx("label",{className:"form-label",children:t}),n.jsx("input",{className:"form-control",value:"0.00",readOnly:!0})]},`commercial-order-total-${t}`))})]}),rn={caption:"Acciones",width:100,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowSorting:!1,cellTemplate:(t,{data:a})=>{t.addClass("commercial-order-actions"),V(t,{variant:"danger",title:"Previsualizar PDF del comprobante",icon:"mdi mdi-file-eye-outline",onClick:()=>sr(ie.downloadUrl(a.id,"pdf"),`Comprobante ${te(a)||a.code}`)})}},Oa=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"dispatch_status",visible:!1,showInColumnChooser:!1}],an=[{dataField:"source_type",visible:!1,showInColumnChooser:!1},{dataField:"local_status",visible:!1,showInColumnChooser:!1},{dataField:"document_type",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"created_at",visible:!1,showInColumnChooser:!1}],Pa=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"external_order_id",visible:!1,showInColumnChooser:!1},{dataField:"external_checkout_id",visible:!1,showInColumnChooser:!1}],Yn={issued:[...an,rn,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:vr},{caption:"Cliente",minWidth:260,calculateCellValue:cn},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:t=>dn(t.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}],cancelled:[...an,rn,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"Cliente",minWidth:260,calculateCellValue:cn},{caption:"Motivo",minWidth:180,calculateCellValue:Oi},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:t=>dn(t.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"F. Facturacion",dataType:"date",width:130},{dataField:"cancelled_at",caption:"F. Anulacion",dataType:"datetime",width:160}],"credit-notes":[...an,rn,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:vr},{caption:"Doc. Afecto",width:130,calculateCellValue:Ai},{caption:"Cliente",minWidth:260,calculateCellValue:cn},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:t=>dn(t.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}]},Ma=[...Pa,{caption:"Acciones",width:230,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(t,{data:a})=>{const s=At(a).length>0;t.css("text-overflow","unset"),t.addClass("commercial-order-actions"),V(t,{variant:"primary",title:"Editar pedido Multivende",icon:"mdi mdi-pencil",onClick:()=>Zt(a)}),V(t,{variant:"info",title:"Ver historial del pedido Multivende",icon:"mdi mdi-map-marker-path",onClick:()=>Mn(a)}),V(t,{variant:s?"dark":"warning",title:s?"Ver guia de remision asociada":"Generar guia de remision",icon:s?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>Ln(a)})}},{dataField:"order_status",caption:"E. Pedido",width:130,lookup:tr(nr),cellTemplate:(t,{value:a})=>Tt(t,a,rr)},{caption:"E. SUNAT",width:120,calculateCellValue:Pi},{caption:"Pedido VTEX",width:150,calculateCellValue:Mi},{dataField:"external_channel",caption:"Canal",width:130},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:hr},{dataField:"document_type",caption:"Tipo Documento",width:140,calculateCellValue:on,cellTemplate:(t,{value:a})=>Tt(t,a,s=>s||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:300,calculateCellValue:br},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"promised_delivery_at",caption:"F. Entrega Estimada",dataType:"date",width:160},{caption:"F. de Entrega",width:150,dataType:"date",calculateCellValue:Or},{caption:"Tiempo de Proceso",width:150,calculateCellValue:Li},{dataField:"created_at",caption:"Fecha Registro",dataType:"date",width:140},{dataField:"code",caption:"Codigo",width:130}];return n.jsxs(n.Fragment,{children:[n.jsx("style",{children:`
      .commercial-order-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 352px;
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
      .commercial-order-form-readonly {
        pointer-events: none;
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
      .commercial-order-filter-helper {
        color: var(--ct-success);
        font-size: 0.78rem;
        font-weight: 700;
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
            minmax(190px, 0.95fr)
            minmax(250px, 1fr)
            minmax(260px, 1fr)
            minmax(180px, 0.85fr)
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
    `}),n.jsxs("div",{className:"commercial-order-top-actions",children:[n.jsxs("button",{type:"button",className:"btn btn-success commercial-order-multivende-action",title:"Ingresar pedido Multivende por CHECK OUT ID",onClick:Ra,children:[n.jsxs("span",{children:[n.jsx("i",{className:"mdi mdi-plus-circle-outline"})," Ingresar pedido multivende"]}),n.jsx("i",{className:"mdi mdi-calendar-month-outline"})]}),n.jsxs("button",{type:"button",className:"btn commercial-order-delay-action",title:"Abrir mantenedor de motivos de retraso de entrega",onClick:Ea,children:[n.jsx("span",{children:"Mantenedor Retraso Entrega"}),n.jsx("i",{className:"mdi mdi-cog"})]})]}),w==="orders"&&n.jsx(sn,{gridRef:l,title:Et,rest:M,filterValue:ia,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(l.current).dxDataGrid("instance").refresh()}}),t.unshift({widget:"dxButton",location:"after",options:{icon:"add",title:"Agregar",hint:"Agregar pedido comercial",onClick:()=>Zt(null)}})},pageSize:25,exportable:!0,columns:[...Oa,{caption:"Acciones",width:340,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(t,{data:a})=>{const s=At(a).length>0,u=wr(a);t.css("text-overflow","unset"),t.addClass("commercial-order-actions"),V(t,{variant:"primary",title:u||"Editar datos, cliente, entrega y productos del pedido comercial",icon:u?"mdi mdi-eye-outline":"mdi mdi-pencil",onClick:()=>Zt(a)}),Xi(a)&&V(t,{variant:"success",title:"Enviar este pedido a preparacion para iniciar picking",icon:"mdi mdi-clipboard-check-outline",onClick:()=>xa({id:a.id,field:"dispatch_status",value:"preparing"})}),V(t,{variant:"info",title:"Ver historial de estados, guia, ruta y entrega del pedido",icon:"mdi mdi-map-marker-path",onClick:()=>Mn(a)});const m=ts(a);V(t,{variant:"secondary",title:m.title,icon:m.icon,onClick:()=>ja(a)}),V(t,{variant:s?"dark":"warning",title:s?"Ver, emitir o descargar la guia de remision asociada al pedido":"Generar guia de remision para este pedido",icon:s?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>Ln(a)}),V(t,{variant:"success",title:hn(a)?"Ver o actualizar foto y datos de evidencia de entrega":"Registrar foto y datos de evidencia de entrega",icon:"mdi mdi-camera",onClick:()=>_a(a)}),V(t,{variant:"danger",title:"Previsualizar o descargar PDF resumen del pedido comercial",icon:"mdi mdi-file-pdf-box",onClick:()=>Ft(St.commercialOrder(a))}),V(t,{variant:"danger",title:"Eliminar este pedido comercial del listado",icon:"mdi mdi-delete",onClick:()=>Ca(a.id)})}},{dataField:"order_status",caption:"Estado",width:140,lookup:tr(nr),cellTemplate:(t,{value:a})=>Tt(t,a,rr)},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:hr},{dataField:"document_type",caption:"Tipo documento",width:130,calculateCellValue:on,cellTemplate:(t,{value:a})=>Tt(t,a,s=>s||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:320,calculateCellValue:br},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_label",caption:"Tipo de pago",width:170,calculateCellValue:Ei},{dataField:"seller.fullname",caption:"Usuario",width:190,cellTemplate:(t,{data:a})=>t.text(Ni(a.seller))},{dataField:"created_at",caption:"Fecha registro",width:130,dataType:"date"},{dataField:"creator.username",caption:"Usuario registro",width:150,cellTemplate:(t,{data:a})=>t.text(ln(a.creator))},{dataField:"code",caption:"Código",width:130},{dataField:"business.name",caption:"Empresa",minWidth:150}]},"orders"),wt.kind==="billing"&&n.jsx(sn,{gridRef:o,title:Et,rest:ie,filterValue:sa,pageSize:20,exportable:!0,columns:Yn[w]??Yn.issued,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar listado",onClick:()=>$(o.current).dxDataGrid("instance").refresh()}})}},`billing-${w}`),w==="multivende"&&n.jsx(sn,{gridRef:f,title:Et,rest:aa,filterValue:la,pageSize:10,exportable:!0,columns:Ma,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar pedidos Multivende",onClick:()=>$(f.current).dxDataGrid("instance").refresh()}})}},"multivende"),wt.kind==="static"&&n.jsx(rs,{title:Et,config:dr[w]}),n.jsx(st,{modalRef:d,title:je?"Ver pedido comercial":Ur?"Editar pedido comercial":"Agregar pedido comercial",size:"xl",dialogClass:"commercial-order-modal-dialog modal-dialog-scrollable",bodyClass:"commercial-order-modal-body",bodyStyle:{maxHeight:"calc(100vh - 150px)",overflowY:"auto",overflowX:"hidden"},btnSubmitText:"Guardar",hideButtonSubmit:je,onSubmit:ua,children:n.jsxs("div",{id:"commercial-orders-form-container",children:[n.jsx("input",{ref:B,type:"hidden"}),n.jsx("input",{ref:Ee,type:"hidden"}),n.jsx("input",{ref:K,type:"hidden"}),n.jsx("input",{ref:re,type:"hidden"}),n.jsx("input",{ref:ut,type:"hidden"}),n.jsx("input",{ref:ht,type:"hidden"}),n.jsx("input",{ref:bt,type:"hidden"}),n.jsx("input",{ref:gt,type:"hidden"}),n.jsx("input",{ref:xt,type:"hidden"}),n.jsx("input",{ref:_t,type:"hidden"}),n.jsx("input",{ref:Gr,type:"hidden",value:Ke.taxAmount,readOnly:!0}),n.jsx("input",{ref:Se,type:"hidden"}),je&&n.jsxs("div",{className:"alert alert-warning py-2 mb-2",children:[n.jsx("i",{className:"mdi mdi-lock-outline me-1"}),Rt]}),n.jsxs("fieldset",{className:je?"commercial-order-form-readonly":"",disabled:je,style:{border:0,margin:0,padding:0,minWidth:0},children:[n.jsxs("section",{className:"commercial-order-form-section",children:[n.jsxs("div",{className:"commercial-order-section-title",children:[n.jsx("i",{className:"mdi mdi-file-document"}),n.jsx("span",{children:"Datos del pedido"})]}),n.jsxs("div",{className:"row g-2",children:[n.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:n.jsx(Be,{eRef:Fe,label:"Empresa",required:!0,searchAPI:"/api/admin/businesses/paginate",searchBy:"name",dropdownParent:"#commercial-orders-form-container",onChange:ma})}),n.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:n.jsxs(Ja,{eRef:Lt,label:"Sede",dropdownParent:"#commercial-orders-form-container",value:Q,onChange:pa,children:[n.jsx("option",{value:"",children:"Sin sede"}),qr.map(t=>n.jsx("option",{value:t.id,children:t.name},`commercial-order-branch-${t.id}`))]})}),n.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:n.jsx(Be,{eRef:b,label:"Almacen",required:!0,searchAPI:"/api/admin/warehouses/paginate",searchBy:"name",filter:ca,dropdownParent:"#commercial-orders-form-container",onChange:fa,templateResult:Nr,templateSelection:Nr})}),n.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[n.jsx("label",{className:"form-label",children:"Doc. venta"}),n.jsxs("select",{ref:Br,className:"form-control",value:Oe,onChange:t=>vn(Ot(t.target.value)),children:[n.jsx("option",{value:"Factura",children:"Factura"}),n.jsx("option",{value:"Boleta",children:"Boleta"}),n.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),n.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[n.jsx("label",{className:"form-label",children:"Moneda"}),n.jsxs("select",{ref:dt,className:"form-control",children:[n.jsx("option",{value:"PEN",children:"PEN"}),n.jsx("option",{value:"USD",children:"USD"}),n.jsx("option",{value:"EUR",children:"EUR"})]})]}),n.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[n.jsx("label",{className:"form-label",children:"Forma de pago"}),n.jsxs("select",{ref:ze,className:"form-control",children:[n.jsx("option",{value:"",children:"Seleccione"}),vi.map(t=>n.jsx("option",{value:t,children:t},`commercial-order-payment-${t}`))]})]})]})]}),n.jsxs("section",{className:"commercial-order-form-section",children:[n.jsxs("div",{className:"commercial-order-section-title",children:[n.jsx("i",{className:"mdi mdi-account"}),n.jsx("span",{children:"Cliente y entrega"})]}),n.jsxs("div",{className:"row g-2",children:[n.jsx("div",{className:"col-12 col-xl-6",children:n.jsx(Be,{eRef:D,label:"Cliente regular",searchAPI:"/api/admin/clients/paginate",searchBy:"full_name",selectBy:"entity_id",filter:xi,dropdownParent:"#commercial-orders-form-container",onChange:ha})}),n.jsx("div",{className:"col-12 col-xl-6",children:n.jsx(Be,{eRef:Y,label:"Cliente eventual",searchAPI:"/api/admin/eventual-clients/paginate",searchBy:"business_name",dropdownParent:"#commercial-orders-form-container",onChange:ba})}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Orden de compra"}),n.jsx("input",{ref:mt,className:"form-control"})]}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Numero de guia"}),n.jsx("input",{ref:pt,className:"form-control"})]}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Guia remision"}),n.jsx("input",{ref:ft,className:"form-control"})]}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Ubigeo"}),n.jsx("input",{ref:me,className:"form-control"})]}),n.jsx("div",{className:"col-12 col-xl-4",children:n.jsx(er,{eRef:J,label:"Direccion de entrega",rows:2})}),n.jsx("div",{className:"col-12",children:n.jsx(Qi,{modalRef:d,position:Vt,searchText:Wr,onSearchTextChange:jt,onPositionChange:zt,onAddressSelected:t=>{J.current&&(J.current.value=t)},disabled:je})}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[n.jsx("label",{className:"form-label",children:"Nombre contacto entrega"}),n.jsx("input",{ref:$e,className:"form-control"})]}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[n.jsx("label",{className:"form-label",children:"Celular contacto entrega"}),n.jsx("input",{ref:Te,className:"form-control"})]}),n.jsx(Be,{eRef:H,label:"Vendedor",col:"col-12 col-md-6 col-xl-2",searchAPI:"/api/admin/users/paginate",searchBy:"fullname",dropdownParent:"#commercial-orders-form-container"}),n.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[n.jsx("label",{className:"form-label",children:"Medico"}),n.jsx("input",{ref:ue,className:"form-control"})]})]})]}),n.jsxs("section",{className:"commercial-order-form-section",children:[n.jsxs("div",{className:"commercial-order-detail-toolbar",children:[n.jsxs("div",{className:"commercial-order-section-title mb-0",children:[n.jsx("i",{className:"mdi mdi-format-list-bulleted"}),n.jsx("span",{children:"Detalle del pedido"})]}),n.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:Da,children:"Agregar item"})]}),n.jsx("div",{className:"table-responsive border rounded commercial-order-detail-table","data-select2-local-dropdown":"true",children:n.jsxs("table",{className:"table table-sm align-middle mb-0",children:[n.jsx("thead",{children:n.jsxs("tr",{children:[n.jsx("th",{style:{minWidth:96},children:"Descuento"}),n.jsx("th",{style:{minWidth:104},children:"Codigo"}),n.jsx("th",{style:{minWidth:88},children:"Codigo lote"}),n.jsx("th",{style:{minWidth:280},children:"Nombre"}),n.jsx("th",{style:{minWidth:128},children:"Laboratorio"}),n.jsx("th",{style:{minWidth:130},children:"Principio activo"}),n.jsx("th",{style:{minWidth:110},children:"Unidad"}),n.jsx("th",{style:{minWidth:64},children:"Stock"}),n.jsx("th",{style:{minWidth:112},children:"P. venta con IGV"}),n.jsx("th",{style:{minWidth:112},children:"P. venta sin IGV"}),n.jsx("th",{style:{minWidth:92},children:"Cantidad"}),n.jsx("th",{style:{minWidth:96},children:"Total desc."}),n.jsx("th",{style:{minWidth:96},children:"Sub total"}),n.jsx("th",{style:{width:70}})]})}),n.jsx("tbody",{children:ae.map(t=>n.jsxs("tr",{children:[n.jsx("td",{children:n.jsxs("div",{className:"commercial-order-discount-cell",children:[n.jsxs("button",{type:"button",className:"commercial-order-discount-trigger",onClick:a=>ka(t.uid,a),children:[n.jsx("span",{children:t.discount_type==="percent"&&Number(t.discount_value||0)>0?`${Number(t.discount_value)}%`:"Seleccione"}),n.jsx("i",{className:"mdi mdi-chevron-down"})]}),(pe==null?void 0:pe.uid)===t.uid&&n.jsxs("div",{className:"commercial-order-discount-menu",style:{top:pe.top,left:pe.left,minWidth:pe.width},onClick:a=>a.stopPropagation(),children:[n.jsx("button",{type:"button",className:`commercial-order-discount-option ${t.discount_type!=="percent"?"active":""}`,onClick:()=>Vn(t.uid,""),children:"Seleccione"}),_i.map(a=>n.jsxs("button",{type:"button",className:`commercial-order-discount-option ${t.discount_type==="percent"&&Number(t.discount_value||0)===a?"active":""}`,onClick:()=>Vn(t.uid,a),children:[a,"%"]},`commercial-order-discount-floating-${t.uid}-${a}`))]})]})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_code||"-"})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_lot||"-"})}),n.jsx("td",{className:"commercial-order-article-name",children:n.jsx(Be,{eRef:En(t.uid),searchAPI:oa,searchBy:"name",dropdownParent:"#commercial-orders-form-container",disabled:!X,onChange:a=>$a(t.uid,a)})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_laboratory||"-"})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_principle||"-"})}),n.jsx("td",{children:n.jsxs("div",{children:[n.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_unit||"-"}),t.presentations.length>0&&n.jsxs("select",{className:"form-control mt-1","data-no-select2":"true",value:t.presentation_id,disabled:!t.article_id,onChange:a=>en(t.uid,"presentation_id",a.target.value),children:[n.jsx("option",{value:"",children:zi(t)}),t.presentations.map(a=>n.jsx("option",{value:a.id,children:Wi(a,t)},`commercial-order-presentation-${t.uid}-${a.id}`))]})]})}),n.jsx("td",{children:n.jsx("div",{className:"commercial-order-readonly-cell",children:Number(t.stock_available||0).toFixed(2)})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:t.price_unit,onFocus:fr,onChange:a=>en(t.uid,"price_unit",pr(a))})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:jr(Number(t.price_unit||0),Oe).subtotal.toFixed(2),readOnly:!0})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0.01",className:"form-control",value:t.quantity,onFocus:fr,onChange:a=>en(t.uid,"quantity",pr(a))})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(t.discount_amount||0).toFixed(2),readOnly:!0})}),n.jsx("td",{children:n.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(t.total||0).toFixed(2),readOnly:!0})}),n.jsx("td",{className:"text-end",children:n.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>Ia(t.uid),children:n.jsx("i",{className:"mdi mdi-close"})})})]},t.uid))}),n.jsxs("tfoot",{children:[n.jsxs("tr",{children:[n.jsx("th",{colSpan:"12",className:"text-end",children:Pr(Oe)?"Total gravada":"Sub total"}),n.jsx("th",{children:Ke.subtotal.toFixed(2)}),n.jsx("th",{})]}),n.jsxs("tr",{children:[n.jsx("th",{colSpan:"12",className:"text-end",children:"Descuento global"}),n.jsx("th",{children:"0.00"}),n.jsx("th",{})]}),n.jsxs("tr",{children:[n.jsx("th",{colSpan:"12",className:"text-end",children:"IGV"}),n.jsx("th",{children:Ke.taxAmount.toFixed(2)}),n.jsx("th",{})]}),n.jsxs("tr",{children:[n.jsx("th",{colSpan:"12",className:"text-end",children:"Total"}),n.jsx("th",{children:Ke.total.toFixed(2)}),n.jsx("th",{})]})]})]})})]}),n.jsxs("section",{className:"commercial-order-form-section mb-0",children:[n.jsxs("div",{className:"commercial-order-section-title",children:[n.jsx("i",{className:"mdi mdi-note-text"}),n.jsx("span",{children:"Observaciones"})]}),n.jsx(er,{eRef:vt,label:"Observaciones",rows:3,disabled:je})]})]})]})}),n.jsx(st,{modalRef:h,title:"Ingresar pedido multivende",size:"lg",btnSubmitText:"Registrar",onSubmit:wa,children:n.jsx("div",{className:"commercial-order-multivende-form",children:n.jsxs("section",{className:"commercial-order-form-section",children:[n.jsxs("div",{className:"commercial-order-section-title",children:[n.jsx("i",{className:"mdi mdi-file-document-plus-outline"}),n.jsx("span",{children:"General"})]}),n.jsxs("div",{className:"mb-2",children:[n.jsxs("label",{className:"form-label",children:["Ingrese el ",n.jsx("strong",{children:"CHECK OUT ID"})]}),n.jsx("input",{ref:R,name:"external_checkout_id",className:"form-control",autoComplete:"off"})]})]})})}),n.jsx(st,{modalRef:L,title:"Mantenedor motivo retraso entrega",size:"lg",hideFooter:!0,onSubmit:t=>{t.preventDefault(),Sa()},children:n.jsxs("div",{className:"commercial-order-delay-maintainer",children:[n.jsxs("div",{className:"commercial-order-delay-actions",children:[n.jsxs("button",{type:"button",className:"btn btn-sm btn-light","data-bs-dismiss":"modal",children:[n.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]}),n.jsxs("button",{type:"submit",className:"btn btn-sm btn-outline-primary",children:[n.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]})]}),n.jsx("input",{ref:S,type:"hidden"}),n.jsxs("div",{className:"row",children:[n.jsxs("div",{className:"col-12 mb-3",children:[n.jsx("label",{className:"form-label",children:"Descripcion:"}),n.jsx("input",{ref:F,className:"form-control",autoComplete:"off"})]}),n.jsxs("div",{className:"col-12 mb-3",children:[n.jsx("label",{className:"form-label",children:"Estado:"}),n.jsxs("select",{ref:T,className:"form-control",defaultValue:"1",children:[n.jsx("option",{value:"1",children:"Activo"}),n.jsx("option",{value:"0",children:"Inactivo"})]})]})]}),n.jsx("hr",{}),n.jsxs("div",{className:"commercial-order-delay-filter",children:[n.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),n.jsx("input",{className:"form-control form-control-sm",value:Kt,onChange:t=>jn(t.target.value)})]}),n.jsx("div",{className:"table-responsive commercial-order-delay-table",children:n.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[n.jsx("thead",{children:n.jsxs("tr",{children:[n.jsx("th",{className:"text-center",children:"Acciones"}),n.jsx("th",{className:"text-center",children:"Estado"}),n.jsx("th",{children:"Motivo"}),n.jsx("th",{children:"Fecha registro"}),n.jsx("th",{children:"Usuario registro"})]})}),n.jsxs("tbody",{children:[Jt&&n.jsx("tr",{children:n.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"Cargando motivos..."})}),!Jt&&tn.length===0&&n.jsx("tr",{children:n.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"No existen elementos"})}),!Jt&&tn.map(t=>n.jsxs("tr",{children:[n.jsx("td",{className:"text-center",children:n.jsx("button",{type:"button",className:"btn btn-xs btn-outline-info",title:"Editar motivo de retraso",onClick:()=>Fa(t),children:n.jsx("i",{className:"mdi mdi-pencil"})})}),n.jsx("td",{className:"text-center",children:n.jsx("span",{className:Dr(t.status?"billed":"cancelled"),children:t.status?"Activo":"Inactivo"})}),n.jsx("td",{children:t.description}),n.jsx("td",{children:gr(t.created_at)}),n.jsx("td",{children:ln(t.creator)})]},`delivery-delay-reason-${t.id}`))]})]})}),n.jsxs("div",{className:"commercial-order-delay-summary",children:[tn.length," elementos (Pagina 1 de 1)"]})]})}),n.jsx(st,{modalRef:de,title:"Tracking del pedido",size:"lg",hideButtonSubmit:!0,children:n.jsx("div",{className:"table-responsive",children:n.jsxs("table",{className:"table table-sm align-middle mb-0",children:[n.jsx("thead",{children:n.jsxs("tr",{children:[n.jsx("th",{children:"Fecha"}),n.jsx("th",{children:"Estado"})]})}),n.jsxs("tbody",{children:[Wn.length===0&&n.jsx("tr",{children:n.jsx("td",{colSpan:"2",className:"text-muted text-center py-3",children:"Sin eventos registrados."})}),Wn.map((t,a)=>n.jsxs("tr",{children:[n.jsx("td",{children:new Date(t.date).toLocaleString("es-PE")}),n.jsx("td",{children:t.status})]},`commercial-order-tracking-${a}`))]})]})})}),n.jsx(st,{modalRef:ne,title:"Evidencia de entrega",size:"lg",btnSubmitText:"Registrar",onSubmit:ya,children:n.jsxs("div",{className:"row",children:[n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Recibido por"}),n.jsx("input",{className:"form-control",value:E.recipient_name,onChange:t=>fe("recipient_name",t.target.value)})]}),n.jsxs("div",{className:"col-md-3 mb-3",children:[n.jsx("label",{className:"form-label",children:"Tipo doc."}),n.jsxs("select",{className:"form-control",value:E.recipient_document_type,onChange:t=>fe("recipient_document_type",t.target.value),children:[n.jsx("option",{value:"DNI",children:"DNI"}),n.jsx("option",{value:"RUC",children:"RUC"}),n.jsx("option",{value:"CE",children:"CE"}),n.jsx("option",{value:"OTRO",children:"Otro"})]})]}),n.jsxs("div",{className:"col-md-3 mb-3",children:[n.jsx("label",{className:"form-label",children:"Numero"}),n.jsx("input",{className:"form-control",value:E.recipient_document_number,onChange:t=>fe("recipient_document_number",t.target.value)})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Telefono"}),n.jsx("input",{className:"form-control",value:E.recipient_phone,onChange:t=>fe("recipient_phone",t.target.value)})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Fecha y hora entrega"}),n.jsx("input",{type:"datetime-local",className:"form-control",value:E.delivered_at,onChange:t=>fe("delivered_at",t.target.value)})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Foto / evidencia"}),n.jsx("input",{ref:W,className:"form-control",type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",capture:"environment",onChange:va})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Latitud"}),n.jsx("input",{className:"form-control",value:E.latitude,onChange:t=>fe("latitude",t.target.value)})]}),n.jsxs("div",{className:"col-md-6 mb-3",children:[n.jsx("label",{className:"form-label",children:"Longitud"}),n.jsx("input",{className:"form-control",value:E.longitude,onChange:t=>fe("longitude",t.target.value)})]}),n.jsxs("div",{className:"col-12 mb-3",children:[n.jsx("label",{className:"form-label",children:"Observaciones"}),n.jsx("textarea",{className:"form-control",rows:"3",value:E.evidence_notes,onChange:t=>fe("evidence_notes",t.target.value)})]}),n.jsx("div",{className:"col-12",children:n.jsx("div",{className:"border rounded p-3",children:ye?n.jsx("img",{src:ye,alt:"Evidencia de entrega",className:"img-fluid rounded border bg-light",style:{maxHeight:360,width:"100%",objectFit:"contain"}}):E.evidence_url?n.jsx("a",{href:E.evidence_url,target:"_blank",rel:"noreferrer",children:"Abrir evidencia registrada"}):n.jsx("div",{className:"text-muted py-4 text-center",children:"Sin evidencia registrada"})})})]})})]})};Ua((e,r)=>{!r.can("orders")&&!r.hasRole("Admin")&&(location.href="/admin/"),Va(e).render(n.jsx(Ha,{...r,title:r.pageTitle||"Pedidos comerciales",children:n.jsx(as,{...r})}))});
