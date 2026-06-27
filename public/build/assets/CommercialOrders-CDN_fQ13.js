var Ja=Object.defineProperty;var Xa=(e,n,i)=>n in e?Ja(e,n,{enumerable:!0,configurable:!0,writable:!0,value:i}):e[n]=i;var tr=(e,n,i)=>Xa(e,typeof n!="symbol"?n+"":n,i);import{C as Qa,c as Za,j as r,r as d,S as A,G as ei}from"./CreateReactScript-Di1kuK03.js";import{L as ti,G as ni,M as ri}from"./esm-DKHzvBm5.js";import{B as ai}from"./Base-CQEuVcZ7.js";import{T as ln,t as nr,k as rr,l as Er,m as ar}from"./Table-B1pz7BSu.js";import{M as Ge}from"./Modal-Zx87HGSA.js";import{R as ii}from"./ReactAppend-DoFYb-Jc.js";import{a as Ue,S as $e}from"./SetSelectValue-B6rHpmkN.js";import{S as si}from"./SelectFormGroup-Dorv_sJe.js";import{T as on}from"./TextareaFormGroup-iJHqgfLU.js";import{B as li}from"./BillingDocumentsRest-_AuHe9gv.js";import{C as kr}from"./CommercialOrdersRest-Vj0uVLPr.js";import{B as oi}from"./BasicRest-BX743yrP.js";import{R as ci}from"./ReferralGuidesRest-CUa_dk-T.js";import{o as kt,b as Dt}from"./magistralesRecordPdf-B0idVlQp.js";import"./tippy-react.esm-Dl7v7VoT.js";import"./permissionScope-Be8AULz2.js";import"./ubigeoInei-D0FnAslC.js";class di extends oi{constructor(){super(...arguments);tr(this,"path","admin/delivery-delay-reasons")}}const ir="billing-voucher-preview-modal",mn="billing-voucher-preview-frame";let ge=null;const _=(e,n,i="")=>n.split(".").reduce((o,h)=>o==null?void 0:o[h],e)??i,oe=(e,n="-")=>e==null||e===""?n:`${e}`,pn=e=>{if(!e)return"-";const n=`${e}`;return n.includes("T"),n.slice(0,10)},qe=(e,n=2)=>Number(e||0).toFixed(n),Dr=(e="PEN")=>{const n=`${e??"PEN"}`.toUpperCase();return n==="USD"?"US$":n==="EUR"?"EUR":"S/."},ui=(e,n="PEN")=>`${Dr(n)} ${qe(e)}`,Tr=e=>[e==null?void 0:e.series,e==null?void 0:e.sequence].filter(Boolean).join("-")||(e==null?void 0:e.code)||"-",Ir=e=>{const n=`${e??""}`.trim().toLowerCase();return n.includes("boleta")?`BOLETA DE VENTA
ELECTRÓNICA`:n.includes("nota")?`NOTA DE CRÉDITO
ELECTRÓNICA`:`FACTURA
ELECTRÓNICA`},sr=e=>Ir(e).replace(`
`," "),mi=e=>_(e,"client.full_name")||_(e,"eventual_client.business_name")||_(e,"eventualClient.business_name")||"-",pi=e=>_(e,"client.document_number")||_(e,"eventual_client.document_number")||_(e,"eventualClient.document_number")||"-",Ar=e=>_(e,"metadata.delivery_address")||_(e,"commercial_order.delivery_address")||_(e,"commercialOrder.delivery_address")||_(e,"client.full_address")||_(e,"eventual_client.address")||_(e,"eventualClient.address")||"-",fi=e=>_(e,"metadata.dispatch_contact_name")||_(e,"commercial_order.dispatch_contact_name")||_(e,"commercialOrder.dispatch_contact_name")||"-",hi=e=>_(e,"metadata.dispatch_contact_phone")||_(e,"commercial_order.dispatch_contact_phone")||_(e,"commercialOrder.dispatch_contact_phone")||_(e,"client.phone")||_(e,"eventual_client.phone")||_(e,"eventualClient.phone")||"-",bi=e=>_(e,"metadata.delivery_reference")||_(e,"commercial_order.delivery_reference")||_(e,"commercialOrder.delivery_reference")||"-",xi=e=>_(e,"metadata.source_code")||_(e,"commercial_order.code")||_(e,"commercialOrder.code")||_(e,"service_order.code")||_(e,"serviceOrder.code")||"-",gi=e=>{const n=Number(e||0);return Number.isInteger(n),n.toFixed(4)},Pt=e=>{const n=["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve"],i=["diez","once","doce","trece","catorce","quince","dieciseis","diecisiete","dieciocho","diecinueve"],s=["","","veinte","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"],o=["","ciento","doscientos","trescientos","cuatrocientos","quinientos","seiscientos","setecientos","ochocientos","novecientos"];if(e<10)return n[e];if(e<20)return i[e-10];if(e===20)return"veinte";if(e<30)return`veinti${n[e-20]}`;if(e<100){const u=Math.floor(e/10),b=e%10;return b?`${s[u]} y ${n[b]}`:s[u]}if(e===100)return"cien";const h=Math.floor(e/100),c=e%100;return c?`${o[h]} ${Pt(c)}`:o[h]},fn=e=>{const n=Math.max(0,Math.floor(Number(e||0)));if(n<1e3)return Pt(n);if(n<1e6){const h=Math.floor(n/1e3),c=n%1e3,u=h===1?"mil":`${Pt(h)} mil`;return c?`${u} ${Pt(c)}`:u}const i=Math.floor(n/1e6),s=n%1e6,o=i===1?"un millon":`${fn(i)} millones`;return s?`${o} ${fn(s)}`:o},vi=(e,n="PEN")=>{const i=Number(e||0),s=Math.floor(Math.abs(i)),o=Math.round((Math.abs(i)-s)*100),h=`${n}`.toUpperCase()==="PEN"?"SOLES":`${n}`.toUpperCase();return`IMPORTE EN LETRAS: ${fn(s).toUpperCase()} CON ${String(o).padStart(2,"0")}/100 ${h}`},Pr=e=>{if(!e)return null;if(typeof e=="string")try{e=JSON.parse(e)}catch{e={lines:e.split(/\r?\n/)}}if(!e||typeof e!="object")return null;const n=oe(e.title,"").trim(),i=oe(e.subtitle,"").trim(),s=(Array.isArray(e.lines)?e.lines:[]).map(o=>oe(o,"").trim()).filter(Boolean);return!n&&!i&&s.length===0?null:{title:n,subtitle:i,lines:s}},_i=()=>{var i;const e=((i=window.jspdf)==null?void 0:i.jsPDF)||window.jsPDF;if(!e)throw new Error("jsPDF no esta disponible");const n=new e({orientation:"portrait",unit:"pt",format:"a4"});if(!n.autoTable)throw new Error("AutoTable no esta disponible");return n},lr=(e,n=90)=>[e,"#toolbar=1","&navpanes=0","&pagemode=none","&scrollbar=1",`&zoom=${n}`].join(""),yi=()=>{let e=document.getElementById(ir);return e||(e=document.createElement("div"),e.id=ir,e.className="modal fade",e.tabIndex=-1,e.setAttribute("aria-hidden","true"),e.innerHTML=`
    <div class="modal-dialog modal-dialog-centered" style="width: 1040px; max-width: calc(100vw - 64px);">
      <div class="modal-content" style="height: min(780px, calc(100vh - 80px));">
        <div class="modal-header py-2">
          <h4 class="modal-title mb-0" data-pdf-title>Comprobante</h4>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body p-0" style="height: calc(100% - 53px); overflow: hidden; background: #525659;">
          <iframe
            id="${mn}"
            title="Vista previa PDF"
            style="width: 100%; height: 100%; border: 0; display: block;"
            allow="fullscreen"
          ></iframe>
        </div>
      </div>
    </div>
  `,document.body.appendChild(e),$(e).on("hidden.bs.modal",()=>{const n=document.getElementById(mn);n&&n.removeAttribute("src"),ge&&(URL.revokeObjectURL(ge),ge=null)}),e)},Or=(e,n,i=!1)=>{const s=yi(),o=s.querySelector(`#${mn}`),h=s.querySelector("[data-pdf-title]");if(!o)throw new Error("No se encontro el visor PDF");ge&&(URL.revokeObjectURL(ge),ge=null),i?(ge=URL.createObjectURL(e),o.src=lr(ge)):o.src=lr(e),h.textContent=n,$(s).modal("show")},or=(e,n="Comprobante PDF")=>{Or(e,n,!1)},W=(e,n,i,s,o,h=82,c=200)=>{e.setFont("helvetica","bold"),e.text(n,s,o),e.text(":",s+h-8,o),e.setFont("helvetica","normal");const u=e.splitTextToSize(oe(i,""),c);return e.text(u,s+h,o),Math.max(11,u.length*9)},Ni=(e,n)=>{const i=e.internal.pageSize.getWidth(),s=40,o=178,h=_(n,"business.name","KAMARY PERU SAC"),c=_(n,"branch.address")||_(n,"business.address")||"",u=_(n,"business.tax_number");e.setFont("helvetica","bold"),e.setFontSize(13),e.text(h,s,45),e.setFont("helvetica","normal"),e.setFontSize(8),c&&e.text(e.splitTextToSize(c,330),s,65),e.setDrawColor(0,0,0),e.setLineWidth(.8),e.rect(i-s-o,28,o,78),e.setFont("helvetica","bold"),e.setFontSize(12),u&&e.text(`RUC ${u}`,i-s-o/2,45,{align:"center"}),e.text(Ir(n.document_type),i-s-o/2,64,{align:"center"}),e.text(Tr(n),i-s-o/2,94,{align:"center"})},ji=(e,n)=>{const i=e.internal.pageSize.getWidth(),s=40,o=124,h=354,c=s+h+10,u=i-c-s;e.setDrawColor(0,0,0),e.rect(s,o,h,76),e.rect(c,o,u,76),e.setFont("helvetica","bold"),e.setFontSize(8),e.text("DATOS DEL CLIENTE",s+5,o+13),e.setFontSize(8);let b=o+26;return b+=W(e,"DOCUMENTO",pi(n),s+5,b,84,h-96),b+=W(e,"DENOMINACIÓN",mi(n),s+5,b,84,h-96),W(e,"DIRECCIÓN",Ar(n),s+5,b,84,h-96),b=o+18,b+=W(e,"FECHA EMISIÓN",pn(n.issue_date),c+5,b,92,u-104),b+=W(e,"MONEDA",n.currency==="PEN"?"Soles":n.currency,c+5,b,92,u-104),b+=W(e,"FECHA VENCIMIENTO",pn(n.due_date||n.issue_date),c+5,b,92,u-104),W(e,"ORDEN DE COMPRA",_(n,"metadata.purchase_order",""),c+5,b,92,u-104),224},Ci=e=>{const n=Number(e.subtotal||0)===0?0:Math.max(0,Number(e.tax_amount||0)/Number(e.subtotal||1)),i=e.source_type==="commercial_order"&&n>0;return(e.items??[]).filter(s=>(s==null?void 0:s.status)!==!1&&(s==null?void 0:s.status)!==0).map(s=>{var C,E,k,X;const o=Number(s.quantity||0),h=Number(s.unit_price||0),c=Number(s.total||0),u=i?h:h*(1+n),b=i&&n>0?h/(1+n):h,j=i?c:c*(1+n);return[oe(s.item_code,""),oe(s.description,""),oe(((C=s.metadata)==null?void 0:C.unit)||((E=s.metadata)==null?void 0:E.unit_code)||"UNIDAD","UNIDAD"),oe(((k=s.metadata)==null?void 0:k.lot)||s.item_code,"-"),pn((X=s.metadata)==null?void 0:X.expiration_date),gi(o),qe(b,4),qe(u,4),qe(j,4)]})},wi=(e,n,i)=>{const s=e.internal.pageSize.getWidth(),o=40,h=n.currency||"PEN",c=Number(n.subtotal||0)?Number(n.tax_amount||0)/Number(n.subtotal||1)*100:0,u=[["DESCUENTO GLOBAL",0],["INAFECTO",0],["GRAVADA",n.subtotal],[`IGV ${qe(c)} %`,n.tax_amount],["TOTAL",n.total]],b=s-o-152,j=s-o-72,C=s-o-8;return e.setFontSize(8),u.forEach(([E,k],X)=>{const z=i+X*11;e.setFont("helvetica","bold"),e.text(E,b,z,{align:"right"}),e.text(Dr(h),j,z),e.text(qe(k),C,z,{align:"right"})}),i+u.length*11},Ri=(e,n,i,s,o)=>{const h=n.match(/^((?:Banco|Interbank)[^\d:]*)(.*)$/i);if(!h){e.setFont("helvetica","normal");const j=e.splitTextToSize(n,o);return e.text(j,i,s),Math.max(9,j.length*9)}const[,c,u]=h;e.setFont("helvetica","bold"),e.text(c.trim(),i,s);const b=e.getTextWidth(c.trim());return e.setFont("helvetica","normal"),e.text(u.trim(),i+b+3,s),9},$i=(e,n,i,s,o,h)=>{var b;const c=Pr(_(n,"business.payment_accounts")||_(n,"business.paymentAccounts"));if(e.rect(i,s,o,h),!((b=c==null?void 0:c.lines)!=null&&b.length))return;let u=s+14;e.setFont("helvetica","bold"),e.setFontSize(8),c.title&&(e.text(c.title,i+5,u),u+=10),c.subtitle&&(e.text(c.subtitle,i+5,u),u+=10),e.setFontSize(7.5),c.lines.forEach(j=>{u+=Ri(e,j,i+5,u,o-10)})},Fi=(e,n,i,s,o,h,c)=>{e.rect(i,s,o,h),e.setFont("helvetica","bold"),e.setFontSize(8),e.text("DATOS DE ENTREGA",i+o/2,s+14,{align:"center"});let u=s+30;u+=W(e,"NOMBRE",fi(n),i+5,u,92,o-104),u+=W(e,"CELULAR",hi(n),i+5,u,92,o-104),u+=W(e,"DIRECCIÓN",Ar(n),i+5,u,92,o-104),u+=W(e,"REFERENCIA",bi(n),i+5,u,92,o-104),W(e,"FORMA DE PAGO (REF)",c,i+5,u,92,o-104)},Si=(e,n,i)=>{const s=e.internal.pageSize.getWidth(),o=40,h=[n.payment_method,n.payment_condition].filter(Boolean).join(" | ")||"-",c=n.currency||"PEN";e.rect(o,i,s-o*2,20),e.setFont("helvetica","bold"),e.setFontSize(8),e.text("FORMA DE PAGO AL FACTURAR:",o+5,i+13),e.setFont("helvetica","normal"),e.text(`${h} ${ui(n.total,c)}`,o+160,i+13),i+=32;const u=oe(n.observations,""),b=e.splitTextToSize(u,s-o*2-92),j=Math.max(20,b.length*10+10);return e.rect(o,i,s-o*2,j),e.setFont("helvetica","bold"),e.text("OBSERVACIONES:",o+5,i+13),e.setFont("helvetica","normal"),u&&e.text(b,o+92,i+13),i+j+12},Mr=e=>{var i;const n=Pr(_(e,"business.payment_accounts")||_(e,"business.paymentAccounts"));return Math.max(92,22+((n!=null&&n.title?1:0)+(n!=null&&n.subtitle?1:0)+(((i=n==null?void 0:n.lines)==null?void 0:i.length)??0))*10)},Ei=(e,n,i)=>{const s=e.internal.pageSize.getWidth(),o=40,h=[n.payment_method,n.payment_condition].filter(Boolean).join(" | ")||"-",c=10,u=(s-o*2-c)/2,b=Math.max(92,Mr(n));$i(e,n,o,i,u,b),Fi(e,n,o+u+c,i,u,b,h),i+=b+12;const j=54;return e.rect(o,i,s-o*2,j),e.setFont("helvetica","normal"),e.setFontSize(7),e.text("Representacion impresa de la ",o+5,i+18),e.setFont("helvetica","bold"),e.text(sr(n.document_type),o+122,i+18),e.setFont("helvetica","normal"),e.text(`, pedido ${xi(n)}`,o+122+e.getTextWidth(sr(n.document_type)),i+18),i+j},ki=e=>{const n=_i(),i=n.internal.pageSize.getWidth(),s=40;Ni(n,e);const o=ji(n,e),h=i-s*2;n.autoTable({startY:o,head:[["PRODUCTO","DESCRIPCION","MEDIDA","LOTE","F.V.","CANT.","P. SIN IGV","P. CON IGV","IMPORTE"]],body:Ci(e),theme:"plain",margin:{left:s,right:s},styles:{fontSize:6.7,cellPadding:3,lineColor:[120,120,120],lineWidth:0,overflow:"linebreak"},headStyles:{fillColor:[255,255,255],textColor:[0,0,0],fontStyle:"bold",lineWidth:{bottom:.5}},columnStyles:{0:{cellWidth:52},1:{cellWidth:126},2:{cellWidth:48},3:{cellWidth:52},4:{cellWidth:50},5:{cellWidth:42,halign:"right"},6:{cellWidth:54,halign:"right"},7:{cellWidth:54,halign:"right"},8:{cellWidth:54,halign:"right"}}});const c=n.lastAutoTable.finalY,u=Math.max(c+18,o+72),b=wi(n,e,u),j=Math.max(b+26,c+44);n.setDrawColor(0,0,0),n.setLineWidth(.8),n.rect(s,o,h,j-o),n.line(s+5,c+5,s+h-5,c+5),n.setFont("helvetica","bold"),n.setFontSize(8),n.text(vi(e.total,e.currency||"PEN"),s,j-9);let C=j+12;C>620&&(n.addPage(),C=40),C=Si(n,e,C),C+Math.max(92,Mr(e))+75>n.internal.pageSize.getHeight()&&(n.addPage(),C=40),Ei(n,e,C),n.setFont("helvetica","normal"),n.setFontSize(7),n.text(`Pagina 1 de ${n.getNumberOfPages()}`,i-s,n.internal.pageSize.getHeight()-18,{align:"right"}),Or(n.output("blob"),`Vista previa ${Tr(e)}`,!0)},B=new kr,K=new li,cr=new di,dr=new ci,Di=["client_kind","=","regular"],Ti=[1,2,3,4,5],Ii=["EFECTIVO [CONTADO]","TRANSFERENCIA [CONTADO]","YAPE [CONTADO]","PLIN [CONTADO]","TARJETA [CONTADO]","TRANSFERENCIA [CREDITO]"],ur="ecomsur_oms",Tt=[{id:"orders",label:"Pedidos",kind:"orders"},{id:"issued",label:"Facturas Emitidas",kind:"billing"},{id:"credit-notes",label:"Notas de Credito",kind:"billing"},{id:"visitors",label:"Pedidos - Visitadores",kind:"static"},{id:"multivende",label:"Pedidos - Multivende",kind:"multivende"}],mr={visitors:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]}},U=(e,{variant:n,title:i,icon:s,onClick:o})=>{const h=$('<button type="button"></button>').addClass(`btn btn-xs btn-soft-${n} commercial-order-action-btn tippy-here`).attr("title",i).attr("aria-label",i).attr("data-tippy-content",i).append($("<i></i>").addClass(s)).on("click",c=>{c.preventDefault(),c.stopPropagation(),o()});e.append(h)},Lr=e=>`commercial-order-status-badge commercial-order-status-${`${e??"empty"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-")||"empty"}`,It=(e,n,i)=>{e.addClass("commercial-order-status-cell"),ii(e,r.jsx("span",{className:Lr(n),children:i(n)}))},ct=()=>({uid:crypto.randomUUID(),article_id:"",article_label:"",article_code:"",article_lot:"",article_name:"",article_unit:"",article_laboratory:"",article_principle:"",presentations:[],presentation_id:"",presentation_units:1,stock_available:0,reserved_quantity:0,price_unit:0,quantity:1,gross_total:0,discount_type:"none",discount_value:0,discount_amount:0,total:0,price_source:"fallback",price_list_code:""}),Ai=e=>{if(!e)return"";const n=(e.name??"").toString().trim().split(" ")[0]??"",i=(e.lastname??"").toString().trim().split(" ")[0]??"",s=`${n} ${i}`.trim(),o=(e.username??"").toString().trim();return s&&o?`${s} (@${o})`:s||(o?`@${o}`:"")},Pi=e=>{if(!e)return"-";const n=(e.fullname??"").toString().trim();return n||`${e.name??""} ${e.lastname??""}`.trim()||(e.username??"").toString().trim()||"-"},cn=e=>e&&((e.username??"").toString().trim()||(e.fullname??"").toString().trim()||`${e.name??""} ${e.lastname??""}`.trim())||"-",dt=e=>Number(Number(e||0).toFixed(2)),Oi=e=>$("<div>").text(e??"").html(),Ve=e=>{const n=Number(Number(e||0).toFixed(3));return Number.isInteger(n)?`${n}`:`${n}`.replace(/\.?0+$/,"")},xn=e=>(e==null?void 0:e.price_source)==="manual",pr=(e,n,i=!1)=>{const s=Number((e==null?void 0:e.price_unit)||0),o=Number(n==null?void 0:n.price_unit);return!i&&xn(e)||!Number.isFinite(o)||!i&&o<=0&&s>0?s:o},fr=(e,n,i=!1)=>!i&&xn(e)?"manual":(n==null?void 0:n.source)||(e==null?void 0:e.price_source)||"fallback",Mi=e=>{const n=`${e??""}`.replace(",",".").replace(/[^\d.]/g,"");if(!n)return"";const[i,...s]=n.split("."),o=i.replace(/^0+(?=\d)/,"")||(i||s.length?"0":""),h=s.length?`.${s.join("")}`:"";return`${o}${h}`},hr=e=>{const n=Mi(e.target.value);return e.target.value!==n&&(e.target.value=n),Number(n||0)},br=e=>{Number(e.target.value||0)===0&&e.target.select()},Li=(e,n,i)=>{const s=dt(e),o=Number(i||0);return!Number.isFinite(o)||o<=0||s<=0?0:n==="percent"?Math.min(s,dt(s*Math.min(o,100)/100)):n==="amount"?Math.min(s,dt(o)):0},Fe=e=>{const n=Number(e.quantity||0),i=Number(e.price_unit||0),s=Number.isFinite(n*i)?dt(n*i):0,o=Li(s,e.discount_type,e.discount_value);return{...e,discount_type:e.discount_type||"none",discount_value:e.discount_type==="none"?0:Number(e.discount_value||0),gross_total:s,discount_amount:o,total:dt(Math.max(0,s-o))}},Lt=e=>{const n=`${e??""}`.trim().toLowerCase();return n==="boleta"?"Boleta":["nota de pedido","nota_pedido","note_order"].includes(n)?"Nota de pedido":"Factura"},Bi=e=>(e==null?void 0:e.billing_documents)??(e==null?void 0:e.billingDocuments)??[],Se=e=>Bi(e)[0]??null,J=e=>e&&([e==null?void 0:e.series,e==null?void 0:e.sequence].filter(Boolean).join("-")||(e==null?void 0:e.code))||"",Ot=e=>!!(`${(e==null?void 0:e.series)??""}`.trim()&&`${(e==null?void 0:e.sequence)??""}`.trim()),xr=e=>{const n=Se(e);return J(n)||(e==null?void 0:e.referral_guide)||(e==null?void 0:e.guide_number)||(e==null?void 0:e.purchase_order)||"-"},dn=e=>{var n;return Lt(((n=Se(e))==null?void 0:n.document_type)??(e==null?void 0:e.document_type))},gr=e=>{const n=(e==null?void 0:e.client)??(e==null?void 0:e.eventual_client)??(e==null?void 0:e.eventualClient)??null,i=`${(n==null?void 0:n.document_number)??""}`.trim(),s=`${(n==null?void 0:n.full_name)??(n==null?void 0:n.business_name)??""}`.trim();return[i,s].filter(Boolean).join(" | ")||"-"},zi=e=>{const n=`${(e==null?void 0:e.payment_method)??""}`.trim(),i=`${(e==null?void 0:e.payment_condition)??""}`.trim();return!n&&!i?"-":!i||n.includes("[")?n||"-":`${n||"-"} [${i.toUpperCase()}]`},vr=e=>{if(!e)return"-";const n=new Date(e);return Number.isNaN(n.getTime())?`${e}`:n.toLocaleString("es-PE",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})},hn=()=>new Date().toISOString().slice(0,10).replaceAll("-","/"),We=()=>{const e=hn();return`${e} - ${e}`},_r=(e,n)=>new Promise((i,s)=>{const o=document.getElementById(e);if(o){o.dataset.loaded==="true"?i():o.addEventListener("load",i,{once:!0});return}const h=document.createElement("script");h.id=e,h.src=n,h.async=!0,h.onload=()=>{h.dataset.loaded="true",i()},h.onerror=s,document.body.appendChild(h)}),Gi=(e,n)=>{if(document.getElementById(e))return;const i=document.createElement("link");i.id=e,i.rel="stylesheet",i.href=n,document.head.appendChild(i)},Ui=async()=>{var e,n;Gi("commercial-order-daterangepicker-css","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/css/daterangepicker.css"),window.moment||await _r("commercial-order-moment-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/moment.min.js"),(n=(e=window.$)==null?void 0:e.fn)!=null&&n.daterangepicker||await _r("commercial-order-daterangepicker-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/daterangepicker.js")},Br=()=>({orders:{businessId:"",dateRange:We(),laboratoryId:"",dispatchStatus:""},issued:{businessId:"",dateRange:We()},"credit-notes":{businessId:"",dateRange:We()},visitors:{visitor:"ALICIA ASTO ASTO",dateRange:We()},multivende:{dateRange:We(),orderVtex:""}}),Vi=()=>{const e=Br();return{...e,orders:{...e.orders,dateRange:""}}},yr=e=>{const n=`${e??""}`.trim();return n?n.replaceAll("/","-").slice(0,10):""},zr=e=>{const[n="",i=""]=`${e??""}`.split(/\s+-\s+/);return{start:yr(n),end:yr(i||n)}},zt=e=>e.filter(Boolean).reduce((n,i)=>n?[n,"and",i]:i,null),gn=(e,n="created_at")=>{const{start:i,end:s}=zr(e);return zt([i?[n,">=",`${i} 00:00:00`]:null,s?[n,"<=",`${s} 23:59:59`]:null])},Wi=e=>{const n=["document_type","<>","Nota de credito"];return e==="issued"?[[["local_status","=","sent"],"or",["local_status","=","accepted"],"or",["local_status","=","observed"],"or",["local_status","=","rejected"]],"and",n]:e==="credit-notes"?["document_type","=","Nota de credito"]:null},qi=(e,n)=>zt([["source_type","=","commercial_order"],Wi(e),n!=null&&n.businessId?["business_id","=",Number(n.businessId)]:null,gn(n==null?void 0:n.dateRange,"created_at")]),Yi=e=>zt([e!=null&&e.businessId?["business_id","=",Number(e.businessId)]:null,e!=null&&e.dispatchStatus?["dispatch_status","=",e.dispatchStatus]:null,gn(e==null?void 0:e.dateRange,"created_at")]),Hi=(e,n)=>{const i=`${(e==null?void 0:e.orderVtex)??""}`.trim();return zt([["external_source","=",n],gn(e==null?void 0:e.dateRange,"created_at"),i?[["external_order_id","contains",i],"or",["external_checkout_id","contains",i]]:null])},un=e=>{const n=(e==null?void 0:e.client)??(e==null?void 0:e.eventualClient)??(e==null?void 0:e.eventual_client)??null,i=`${(n==null?void 0:n.document_number)??""}`.trim(),s=`${(n==null?void 0:n.full_name)??(n==null?void 0:n.business_name)??""}`.trim();return[i,s].filter(Boolean).join(" | ")||"-"},Nr=e=>`${e??""}`.toUpperCase()==="USD"?"Dolares":"Soles",jr=e=>(e==null?void 0:e.external_reference)||(e==null?void 0:e.external_id)||(e==null?void 0:e.external_status)||"-",Ki=e=>{var n,i;return((n=e==null?void 0:e.referenceDocument)==null?void 0:n.code)??((i=e==null?void 0:e.reference_document)==null?void 0:i.code)??"-"},Ji=e=>{var n,i;return((n=Se(e))==null?void 0:n.external_status)??((i=Se(e))==null?void 0:i.external_reference)??"-"},Xi=e=>(e==null?void 0:e.external_order_id)||(e==null?void 0:e.external_checkout_id)||"-",Gr=e=>{var o;const n=bn(e);if(n!=null&&n.delivered_at)return n.delivered_at;const s=((e==null?void 0:e.dispatchAssignments)??(e==null?void 0:e.dispatch_assignments)??[]).find(h=>{var c;return(c=h==null?void 0:h.dispatch)==null?void 0:c.delivered_at});return((o=s==null?void 0:s.dispatch)==null?void 0:o.delivered_at)??""},Qi=e=>{const n=e!=null&&e.created_at?new Date(e.created_at):null,i=Gr(e)||(e==null?void 0:e.updated_at),s=i?new Date(i):null;if(!n||!s||Number.isNaN(n.getTime())||Number.isNaN(s.getTime()))return"-";const o=Math.max(0,Math.round((s-n)/6e4)),h=Math.floor(o/1440),c=Math.floor(o%1440/60);return h>0?`${h}d ${c}h`:c>0?`${c}h ${o%60}m`:`${o}m`},T=(e,n="")=>{if(e==null)return n;if(typeof e=="object")return e.address??e.reference??e.name??e.description??n;const i=`${e}`;return i==="[object Object]"?n:i},Zi=e=>`${e??""}`.toUpperCase().includes("CREDITO")?"Credito":"Contado",es=e=>{const n=`${e??""}`.trim();return n?n.toUpperCase()==="TRANSFERENCIA"?"TRANSFERENCIA [CONTADO]":n:"EFECTIVO [CONTADO]"},ts=e=>T(e==null?void 0:e.full_address,T(e==null?void 0:e.address,T(e==null?void 0:e.fiscal_address))),ns=e=>T(e==null?void 0:e.ubigeo,T(e==null?void 0:e.district_ubigeo,T(e==null?void 0:e.inei_ubigeo))),Cr=e=>{const n=`${e??""}`.trim(),i=n.match(/^(client|eventual)-(\d+)$/);return i?i[2]:n},wr=e=>{var c,u,b;if(e.loading)return e.text;const n=e.data??{},i=e.text||n.name||"",s=(c=n.branch)==null?void 0:c.name,o=(b=(u=n.branch)==null?void 0:u.business)==null?void 0:b.name,h=$("<span>").text(i);return s&&h.append($("<small>").addClass("text-muted ms-1").text(`- ${s}`)),o&&h.append($("<small>").addClass("text-muted ms-1").text(`(${o})`)),h},ie=e=>{if(!(e!=null&&e.current))return;const n=$(e.current);n.empty().val(null),n.trigger(n.data("select2")?"change.select2":"change")},rs=e=>e.article_id?"Unidad base":"Sin presentacion",as=(e,n)=>{const i=(e==null?void 0:e.name)||"Presentacion",s=Ve((e==null?void 0:e.units)||1),o=n!=null&&n.article_unit?` ${n.article_unit}`:" unidad(es) base";return`${i} (${s}${o})`},Ur=e=>["Factura","Boleta"].includes(Lt(e)),Rr=(e,n)=>{const i=Number(e||0);if(!Ur(n))return{subtotal:Number(i.toFixed(2)),taxAmount:0,total:Number(i.toFixed(2))};const s=Number((i/1.18).toFixed(2));return{subtotal:s,taxAmount:Number((i-s).toFixed(2)),total:Number(i.toFixed(2))}},is=(e,n="")=>{const i=new Map;return(e??[]).flatMap(s=>{if(!(s!=null&&s.article_id))return[];const o=`${s.article_id}:${s.warehouse_id||n||""}`,h=Number(s.quantity||0),c=Number(s.presentation_units||1)||1,u=Number((h*c).toFixed(3)),b=Number(s.stock_available||0),j=Number(i.get(o)||0),C=Math.max(0,b-j),E=Math.min(u,C),k=Math.max(0,u-E);return i.set(o,j+E),k<=1e-4?[]:[{article:s.article_name||s.article_label||s.article_code||"Articulo",quantity:u,lineQuantity:h,presentationUnits:c,available:C,shortage:k}]})},Mt=e=>(e==null?void 0:e.referral_guides)??(e==null?void 0:e.referralGuides)??[],Vr=e=>(e==null?void 0:e.external_reference)||[e==null?void 0:e.series,e==null?void 0:e.sequence].filter(Boolean).join("-")||(e==null?void 0:e.code)||"-",ss=e=>e&&!["accepted","cancelled"].includes(e.guide_status),ls=e=>(e==null?void 0:e.delivery_evidences)??(e==null?void 0:e.deliveryEvidences)??[],bn=e=>ls(e)[0]??null,os=e=>(e==null?void 0:e.tracking_events)??(e==null?void 0:e.trackingEvents)??[],$r=e=>{const n=`${e??""}`.trim();return n.startsWith("blob:")||n.startsWith("data:image/")||/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(n)||n.includes("/delivery-evidence-media/")},Fr=()=>{const e=new Date;return e.setMinutes(e.getMinutes()-e.getTimezoneOffset()),e.toISOString().slice(0,16)},At={lat:-12.046374,lng:-77.042793},se=e=>{const n=Number(e);return Number.isFinite(n)?n:null},Bt=e=>{const n=se(e);return n===null?"":n.toFixed(7)},le=e=>se(e==null?void 0:e.lat)!==null&&se(e==null?void 0:e.lng)!==null,cs=({modalRef:e,position:n,searchText:i,onPositionChange:s,onSearchTextChange:o,onAddressSelected:h,googleMapsApiKey:c,disabled:u=!1})=>{const b=d.useRef(),[j,C]=d.useState(!1),[E,k]=d.useState(""),[X,z]=d.useState([]),q=le(n)?{lat:se(n.lat),lng:se(n.lng)}:At,V=(x,P=17)=>{const ye=se(x==null?void 0:x.lat),Y=se(x==null?void 0:x.lng);ye===null||Y===null||!b.current||(b.current.setCenter({lat:ye,lng:Y}),b.current.setZoom(P))},ve=x=>{u||(s(x),V(x))};d.useEffect(()=>{if(le(n)){V(q);return}V(At,13)},[n==null?void 0:n.lat,n==null?void 0:n.lng]),d.useEffect(()=>{const x=e==null?void 0:e.current;if(!x)return;const P=()=>{setTimeout(()=>{le(n)?V(q):V(At,13)},180)};return $(x).on("shown.bs.modal",P),()=>$(x).off("shown.bs.modal",P)},[e,n==null?void 0:n.lat,n==null?void 0:n.lng]);const _e=async()=>{var P,ye;if(u)return;const x=`${i??""}`.trim();if(!x){z([]),k("Escribe una direccion para buscar.");return}if(!((ye=(P=window.google)==null?void 0:P.maps)!=null&&ye.Geocoder)){k("Google Maps aun no termino de cargar.");return}C(!0),k("");try{new window.google.maps.Geocoder().geocode({address:`${x}, Peru`,componentRestrictions:{country:"PE"},region:"PE"},(ce,ke)=>{if(C(!1),ke!=="OK"||!Array.isArray(ce)||ce.length===0){z([]),k("Sin resultados. Puedes marcar el punto manualmente en el mapa.");return}z(ce.slice(0,5).map(re=>({place_id:re.place_id,display_name:re.formatted_address,lat:re.geometry.location.lat(),lng:re.geometry.location.lng()})))})}catch(Y){C(!1),k(`${Y.message}. Puedes marcar el punto manualmente en el mapa.`),z([])}},Ee=x=>{if(u)return;const P={lat:se(x.lat),lng:se(x.lng)};s(P),o(x.display_name??""),h(x.display_name??""),V(P),z([])};return r.jsxs("div",{className:"commercial-order-map-picker",children:[r.jsxs("div",{className:"commercial-order-map-search",children:[r.jsxs("div",{children:[r.jsx("label",{className:"form-label",children:"Buscar direccion en mapa"}),r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:"text",className:"form-control",value:i,disabled:u,onChange:x=>o(x.target.value),onKeyDown:x=>{x.key==="Enter"&&(x.preventDefault(),_e())},placeholder:"Ej. Av. Javier Prado 123, San Isidro"}),r.jsx("button",{type:"button",className:"btn btn-outline-primary",onClick:_e,disabled:j||u,children:j?"Buscando...":"Buscar"})]})]}),r.jsxs("div",{className:"commercial-order-map-coordinates",children:[r.jsx("label",{className:"form-label",children:"Coordenadas"}),r.jsxs("div",{className:"commercial-order-map-coordinate-values",children:[r.jsx("span",{children:Bt(n==null?void 0:n.lat)||"-"}),r.jsx("span",{children:Bt(n==null?void 0:n.lng)||"-"})]})]})]}),X.length>0&&r.jsx("div",{className:"commercial-order-map-results",children:X.map(x=>r.jsx("button",{type:"button",className:"commercial-order-map-result",disabled:u,onClick:()=>Ee(x),children:x.display_name},`${x.place_id}-${x.lat}-${x.lng}`))}),E&&r.jsx("small",{className:"text-muted d-block mt-1",children:E}),r.jsx(ti,{googleMapsApiKey:c,language:"es",region:"PE",onError:()=>k("No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio."),children:r.jsx(ni,{mapContainerClassName:"commercial-order-map-canvas",center:q,zoom:le(n)?17:13,options:{clickableIcons:!u,fullscreenControl:!0,gestureHandling:u?"none":"greedy",mapTypeControl:!0,scrollwheel:!u,streetViewControl:!1},onLoad:x=>{b.current=x,setTimeout(()=>{le(n)?V(q):V(At,13)},120)},onClick:x=>{if(u)return;const P={lat:x.latLng.lat(),lng:x.latLng.lng()};ve(P)},children:le(n)&&r.jsx(ri,{position:q,draggable:!u,onDragEnd:x=>ve({lat:x.latLng.lat(),lng:x.latLng.lng()})})})}),r.jsx("small",{className:"text-muted d-block mt-2",children:"Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega."})]})},ds=e=>{const n=`${ei.GMAPS_API_KEY??""}`.trim();return n?r.jsx(cs,{...e,googleMapsApiKey:n}):r.jsx("div",{className:"commercial-order-map-picker",children:r.jsx("div",{className:"commercial-order-map-empty",children:"Configura Google Maps API Key en Sistemas > Datos generales > Integraciones para habilitar el mapa."})})},us=e=>!e||e.status===null||`${e.order_status??""}`=="cancelled"?!1:`${e.dispatch_status??"pending"}`=="pending",ms=e=>!e||e.status===null||e.status===!1||e.status===0?!1:!["draft","cancelled"].includes(`${e.order_status??""}`),Wr=e=>{if(!e)return!1;const n=`${e.local_status??""}`;return["accepted","observed","cancelled"].includes(n)||!!e.external_id},ps=e=>{if(!e)return!1;const n=`${e.local_status??""}`;return["accepted","sent","observed"].includes(n)||!!e.external_id},Sr=e=>{if(!(e!=null&&e.id))return"";const n=Se(e);return ps(n)||`${e.billing_status??""}`=="billed"?`Este pedido ya tiene comprobante ${J(n)||(n==null?void 0:n.code)||"emitido"}. No se pueden modificar datos ni productos despues de emitir.`:""},fs=e=>{const n=Se(e);return n?Wr(n)?{icon:"mdi mdi-file-eye-outline",title:`Previsualizar PDF del comprobante ${J(n)||n.code}`}:Ot(n)?{icon:"mdi mdi-file-eye-outline",title:`Emitir o previsualizar comprobante ${J(n)||n.code}`}:{icon:"mdi mdi-send",title:`Emitir comprobante ${J(n)||n.code}`}:{icon:"mdi mdi-file-send-outline",title:"Generar comprobante de venta para este pedido"}},hs=e=>{if(!e)return[];const n=os(e).map(c=>({date:c.happened_at??c.created_at,status:[c.title,c.description].filter(Boolean).join(" - ")})),i=[{date:e.created_at,status:"La orden ingreso en el sistema"}];e.approved_at&&["preparing","in_route","delivered","dispatched","billed","closed"].includes(e.order_status)?i.push({date:e.approved_at,status:"La orden paso a preparacion"}):e.approved_at&&e.order_status==="confirmed"?i.push({date:e.approved_at,status:"La orden fue confirmada"}):["preparing","in_route","delivered","dispatched","billed","closed"].includes(e.order_status)&&i.push({date:e.updated_at,status:"La orden paso a preparacion"});const s=(e.dispatch_assignments??e.dispatchAssignments??[]).filter(c=>(c==null?void 0:c.status)!==!1&&(c==null?void 0:c.status)!==0&&(c==null?void 0:c.dispatch)).sort((c,u)=>{var b,j,C,E;return new Date(((b=c==null?void 0:c.dispatch)==null?void 0:b.departed_at)||((j=c==null?void 0:c.dispatch)==null?void 0:j.scheduled_date)||0)-new Date(((C=u==null?void 0:u.dispatch)==null?void 0:C.departed_at)||((E=u==null?void 0:u.dispatch)==null?void 0:E.scheduled_date)||0)}),o=s.find(c=>{var u;return["in_route","delivered","closed"].includes((u=c==null?void 0:c.dispatch)==null?void 0:u.dispatch_status)});o?(i.push({date:o.dispatch.departed_at??o.dispatch.updated_at??o.dispatch.created_at,status:`Manifiesto ${o.dispatch.manifest_code||o.dispatch.code||""}`.trim()}),i.push({date:o.dispatch.departed_at??o.dispatch.updated_at??o.dispatch.created_at,status:"El pedido salio en ruta"})):e.dispatch_status==="in_route"&&i.push({date:e.updated_at,status:"El pedido salio en ruta"}),(e.dispatch_status==="dispatched"||s.some(c=>{var u;return((u=c==null?void 0:c.dispatch)==null?void 0:u.dispatch_status)==="dispatched"}))&&i.push({date:e.updated_at,status:"El pedido paso a despacho"}),Mt(e).forEach(c=>{i.push({date:c.issue_date??c.created_at??e.updated_at,status:`Guia de remision ${Vr(c)} - ${Er(c.guide_status)}`})});const h=s.find(c=>{var u;return["delivered","closed"].includes((u=c==null?void 0:c.dispatch)==null?void 0:u.dispatch_status)});return h?i.push({date:h.dispatch.delivered_at??h.dispatch.updated_at??h.dispatch.created_at,status:"El pedido fue entregado"}):e.dispatch_status==="delivered"&&i.push({date:e.updated_at,status:"El pedido fue entregado"}),(e.order_status==="cancelled"||e.dispatch_status==="cancelled")&&i.push({date:e.updated_at,status:"El pedido fue cancelado"}),[...n,...i].filter(c=>c.date).sort((c,u)=>new Date(c.date)-new Date(u.date))},bs=({title:e,config:n})=>{const i=(n==null?void 0:n.pageSize)??20;return r.jsx("div",{className:"row",children:r.jsx("div",{className:"col-12",children:r.jsxs("div",{className:"card",children:[r.jsx("div",{className:"card-header",children:e}),r.jsxs("div",{className:"card-body",children:[r.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[r.jsxs("div",{className:"d-flex align-items-center gap-2",children:[r.jsx("label",{className:"form-label mb-0",children:"Elementos :"}),r.jsx("select",{className:"form-select form-select-sm commercial-order-page-size",defaultValue:i,children:[10,20,25,50].map(s=>r.jsx("option",{value:s,children:s},`commercial-list-size-${s}`))})]}),r.jsxs("div",{className:"d-flex align-items-center gap-2",children:[r.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),r.jsx("input",{className:"form-control form-control-sm commercial-order-list-search"})]})]}),((n==null?void 0:n.exports)??[]).length>0&&r.jsx("div",{className:"d-flex flex-wrap gap-1 mb-2",children:n.exports.map(s=>r.jsx("button",{type:"button",className:"btn btn-sm btn-light",children:s},`commercial-list-export-${s}`))}),r.jsx("div",{className:"table-responsive commercial-order-legacy-table",children:r.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[r.jsx("thead",{children:r.jsx("tr",{children:((n==null?void 0:n.headers)??[]).map(s=>r.jsx("th",{children:s},`commercial-list-header-${s}`))})}),r.jsx("tbody",{children:r.jsx("tr",{children:r.jsx("td",{colSpan:((n==null?void 0:n.headers)??[]).length||1,className:"text-muted",children:"No existen elementos"})})})]})}),r.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2",children:[r.jsx("span",{className:"text-muted",children:"No hay elementos a mostrar"}),r.jsxs("div",{className:"d-flex align-items-center gap-2 text-muted",children:[r.jsx("span",{children:"Anterior"}),r.jsx("button",{type:"button",className:"btn btn-sm btn-light active",children:"1"}),r.jsx("span",{children:"Siguiente"})]})]})]})]})})})},xs=({requiredPermission:e="orders",externalSource:n=null,pageTitle:i="Pedidos comerciales"})=>{var Jn;B.externalSource=null;const s=d.useRef(),o=d.useRef(),h=d.useRef(),c=d.useRef(),u=d.useRef(),b=d.useRef(),j=d.useRef(),C=d.useRef(),E=d.useRef(),k=d.useRef(),X=d.useRef(),z=d.useRef(),q=d.useRef(),V=d.useRef(),ve=d.useRef(),_e=d.useRef(),Ee=d.useRef(),x=d.useRef(),P=d.useRef(),ye=d.useRef(),Y=d.useRef(),ce=d.useRef(),ke=d.useRef(),re=d.useRef(),ut=d.useRef(),de=d.useRef(),mt=d.useRef(),qr=d.useRef(),pt=d.useRef(),ft=d.useRef(),Ye=d.useRef(),ht=d.useRef(),bt=d.useRef(),xt=d.useRef(),gt=d.useRef(),vt=d.useRef(),_t=d.useRef(),yt=d.useRef(),Nt=d.useRef(),Yr=d.useRef(),Q=d.useRef(),De=d.useRef(),ue=d.useRef(),Te=d.useRef(),Ie=d.useRef(),jt=d.useRef(),Gt=d.useRef({}),[Hr,Kr]=d.useState(!1),[Ae,vn]=d.useState(""),[Z,Ct]=d.useState(""),[ee,wt]=d.useState(""),[Pe,Ut]=d.useState(""),[Oe,Vt]=d.useState(""),[te,He]=d.useState(""),[Jr,Ne]=d.useState(""),[Wt,qt]=d.useState({lat:"",lng:""}),[Xr,Rt]=d.useState(""),[Qr,_n]=d.useState([]),[Ke,$t]=d.useState([]),[gs,Me]=d.useState([]),[ae,ne]=d.useState([ct()]),[Le,yn]=d.useState("Factura"),[me,Yt]=d.useState(null),[Nn,Zr]=d.useState(null),[Be,ea]=d.useState(null),[jn,Ht]=d.useState(null),[je,Kt]=d.useState(""),[Jt,ta]=d.useState([]),[Xt,Cn]=d.useState(""),[Qt,wn]=d.useState(!1),[S,na]=d.useState(n?"multivende":"orders"),[ra,aa]=d.useState([]),[ia,sa]=d.useState([]),[Rn,la]=d.useState(Br()),[Je,oa]=d.useState(Vi()),[Ft,ca]=d.useState(""),[D,Zt]=d.useState({recipient_name:"",recipient_document_type:"DNI",recipient_document_number:"",recipient_phone:"",delivered_at:Fr(),evidence_notes:"",evidence_url:"",latitude:"",longitude:""}),da=d.useMemo(()=>{const t=new kr;return t.externalSource=n||ur,t},[n]),en=Tt.find(t=>t.id===S)??Tt[0],Xe=Rn[S]??{},$n=Je[S]??{},ua=d.useMemo(()=>Yi(Je.orders),[Je.orders]),ma=d.useMemo(()=>qi(S,$n),[S,$n]),pa=d.useMemo(()=>Hi(Je.multivende,n||ur),[Je.multivende,n]),fa=d.useMemo(()=>{var a;const t=new URLSearchParams;return Ae&&t.append("business_id",Ae),Z&&t.append("business_branch_id",Z),ee&&t.append("warehouse_id",ee),Pe&&t.append("client_id",Pe),Oe&&t.append("eventual_client_id",Oe),te&&t.append("client_distribution_network_id",te),(a=de.current)!=null&&a.value&&t.append("issue_date",de.current.value),`/api/admin/commercial-orders/articles?${t.toString()}`},[Ae,Z,ee,Pe,Oe,te]),ha=d.useMemo(()=>Z?["business_branch_id","=",Number(Z)]:null,[Z]);d.useEffect(()=>()=>{je!=null&&je.startsWith("blob:")&&URL.revokeObjectURL(je)},[je]),d.useEffect(()=>{let t=!0;return Promise.all([K.getBusinesses(),B.getLaboratories()]).then(([a,l])=>{t&&(aa(a),sa(l))}),()=>{t=!1}},[]),d.useEffect(()=>{if(!me)return;const t=()=>Yt(null),a=l=>{l.key==="Escape"&&t()};return document.addEventListener("click",t),document.addEventListener("keydown",a),window.addEventListener("resize",t),window.addEventListener("scroll",t,!0),()=>{document.removeEventListener("click",t),document.removeEventListener("keydown",a),window.removeEventListener("resize",t),window.removeEventListener("scroll",t,!0)}},[me]);const Fn=t=>(Gt.current[t]||(Gt.current[t]=d.createRef()),Gt.current[t]);d.useEffect(()=>{ae.forEach(t=>{const a=Fn(t.uid);!a.current||!t.article_id||!t.article_label||`${$(a.current).val()}`==`${t.article_id}`||Ue(a.current,t.article_id,t.article_label)})},[ae]);const Sn=async(t,a=null)=>{if(!t){_n([]),Ct("");return}const m=(await B.getBranchesByBusiness(t)??[]).filter(f=>f.status!==null);if(_n(m),a&&m.some(f=>`${f.id}`==`${a}`)){Ct(`${a}`);return}Ct("")},En=t=>{if(!t)return;const a=ts(t),l=ns(t);a&&Q.current&&(Q.current.value=a),l&&ue.current&&(ue.current.value=l),a&&Rt(a)},kn=async(t,a=null,l=null)=>{var y;if(!t){$t([]),He(""),Me([]),Ne("");return}const f=(await B.getDistributionNetworks(t)??[]).filter(g=>g.status!==null);$t(f);const p=a||((y=f.find(g=>g.is_default))==null?void 0:y.id);if(p&&f.some(g=>`${g.id}`==`${p}`)){He(`${p}`),await Dn(p,null,f);return}He(""),Me([]),Ne(""),En(l)},Dn=async(t,a=null,l=null)=>{var g,w;if(!t){Me([]),Ne("");return}let m=[];const f=(l??Ke).find(N=>`${N.id}`==`${t}`);(((g=f==null?void 0:f.addresses)==null?void 0:g.length)??0)>0?m=f.addresses:m=await B.getDeliveryAddresses(t);const p=(m??[]).filter(N=>N.status!==null);Me(p);const y=a||((w=p.find(N=>N.is_default))==null?void 0:w.id);if(y&&p.some(N=>`${N.id}`==`${y}`)){Ne(`${y}`),ba(p.find(N=>`${N.id}`==`${y}`));return}Ne("")},ba=t=>{t&&(Q.current&&(Q.current.value=T(t.address)),De.current&&(De.current.value=T(t.reference)),ue.current&&(ue.current.value=T(t.ubigeo)),Te.current&&(Te.current.value=T(t.contact_name)),Ie.current&&(Ie.current.value=T(t.contact_phone)),Rt(T(t.address)),le({lat:t.latitude,lng:t.longitude})&&qt({lat:Number(t.latitude),lng:Number(t.longitude)}))},Tn=async(t,a={})=>{var p,y,g;const l=a.article_id??t.article_id,m=Number(a.quantity??t.quantity??0),f=a.presentation_id??t.presentation_id;return!l||!ee||m<=0?null:await B.resolvePrice({article_id:l,presentation_id:f||null,quantity:m,business_id:Ae||null,business_branch_id:Z||null,warehouse_id:ee||null,client_id:Pe||null,eventual_client_id:Oe||null,client_distribution_network_id:te||null,issue_date:((p=de.current)==null?void 0:p.value)||null,commercial_channel:((y=Ke.find(w=>`${w.id}`==`${te}`))==null?void 0:y.commercial_channel)||null,segment:((g=Ke.find(w=>`${w.id}`==`${te}`))==null?void 0:g.segment)||null})},tn=async(t=null)=>{const a=t??ae;for(const l of a){if(!l.article_id)continue;const m=await Tn(l);m&&ne(f=>f.map(p=>p.uid!==l.uid?p:Fe({...p,stock_available:Number(m.stock_available||0),price_unit:pr(p,m),price_source:fr(p,m),price_list_code:m.price_list_code||""})))}},In=t=>{t==="regular"?(Vt(""),ie(ke)):t==="eventual"&&(Ut(""),$t([]),He(""),Me([]),Ne(""),ie(ce))},nn=async(t=null)=>{var g,w,N,O;Kr(!!(t!=null&&t.id)),ca(Sr(t)),Ee.current&&(Ee.current.value=(t==null?void 0:t.id)??""),x.current&&(x.current.value=(t==null?void 0:t.code)??"Se genera al guardar"),de.current&&(de.current.value=t!=null&&t.issue_date?t.issue_date.toString().slice(0,10):new Date().toISOString().slice(0,10)),mt.current&&(mt.current.value=t!=null&&t.promised_delivery_at?t.promised_delivery_at.toString().slice(0,10):""),yn(Lt((t==null?void 0:t.document_type)??"Factura")),pt.current&&(pt.current.value=(t==null?void 0:t.currency)??"PEN"),ft.current&&(ft.current.value=(t==null?void 0:t.payment_condition)??"Contado"),Ye.current&&(Ye.current.value=es(t==null?void 0:t.payment_method)),gt.current&&(gt.current.value=(t==null?void 0:t.installments)??1),vt.current&&(vt.current.value=t!=null&&t.first_due_date?t.first_due_date.toString().slice(0,10):""),_t.current&&(_t.current.value=(t==null?void 0:t.order_status)??(t!=null&&t.external_source?"pending":"draft")),yt.current&&(yt.current.value=(t==null?void 0:t.dispatch_status)??"pending"),Nt.current&&(Nt.current.value=(t==null?void 0:t.billing_status)??"pending"),Q.current&&(Q.current.value=T(t==null?void 0:t.delivery_address)),De.current&&(De.current.value=T(t==null?void 0:t.delivery_reference)),ue.current&&(ue.current.value=T(t==null?void 0:t.ubigeo)),Te.current&&(Te.current.value=T(t==null?void 0:t.dispatch_contact_name)),Ie.current&&(Ie.current.value=T(t==null?void 0:t.dispatch_contact_phone)),ht.current&&(ht.current.value=(t==null?void 0:t.purchase_order)??""),bt.current&&(bt.current.value=(t==null?void 0:t.guide_number)??""),xt.current&&(xt.current.value=(t==null?void 0:t.referral_guide)??""),ut.current&&(ut.current.value=(t==null?void 0:t.doctor_name)??""),jt.current&&(jt.current.value=(t==null?void 0:t.observations)??""),qt({lat:le({lat:t==null?void 0:t.map_lat,lng:t==null?void 0:t.map_lng})?Number(t.map_lat):"",lng:le({lat:t==null?void 0:t.map_lat,lng:t==null?void 0:t.map_lng})?Number(t.map_lng):""}),Rt(T(t==null?void 0:t.delivery_address));const a=t!=null&&t.business_id?`${t.business_id}`:"",l=t!=null&&t.warehouse_id?`${t.warehouse_id}`:"",m=t!=null&&t.client_id?`${t.client_id}`:"",f=t!=null&&t.eventual_client_id?`${t.eventual_client_id}`:"";vn(a),wt(l),Ut(m),Vt(f),a&&((g=t==null?void 0:t.business)!=null&&g.name)?Ue(P.current,a,t.business.name):ie(P),l&&((w=t==null?void 0:t.warehouse)!=null&&w.name)?Ue(Y.current,l,t.warehouse.name):ie(Y),m&&((N=t==null?void 0:t.client)!=null&&N.full_name)?Ue(ce.current,m,`${t.client.document_number??""} - ${t.client.full_name}`.trim()):ie(ce),f&&((O=t==null?void 0:t.eventual_client)!=null&&O.business_name)?Ue(ke.current,f,`${t.eventual_client.document_number??""} - ${t.eventual_client.business_name}`.trim()):ie(ke),t!=null&&t.seller_id&&(t!=null&&t.seller)?Ue(re.current,t.seller_id,Ai(t.seller)):ie(re);const p=((t==null?void 0:t.items)??[]).map(R=>{var fe,he,be,xe,F,I,Ze,et,tt,nt,rt,at,it,st,lt,ot;const v=R.article??null,H=((v==null?void 0:v.presentations)??[]).filter(M=>(M==null?void 0:M.status)!==!1&&(M==null?void 0:M.status)!==0),G=R.presentation??H[0]??null,Re=Number(R.presentation_units??(G==null?void 0:G.units)??1)||1;return Fe({uid:crypto.randomUUID(),article_id:R.article_id?`${R.article_id}`:"",article_label:v?`${v.code??""} - ${v.name??""}`.trim():"",article_code:(v==null?void 0:v.code)??R.external_sku??"",article_lot:(v==null?void 0:v.default_lot)??"",article_name:(v==null?void 0:v.name)??"",article_unit:((fe=v==null?void 0:v.unit)==null?void 0:fe.symbol)??((he=v==null?void 0:v.unit)==null?void 0:he.name)??"",article_laboratory:((be=v==null?void 0:v.laboratory)==null?void 0:be.name)??"",article_principle:((xe=v==null?void 0:v.activePrinciple)==null?void 0:xe.name)??((F=v==null?void 0:v.active_principle)==null?void 0:F.name)??"",presentations:H.map(M=>({id:`${M.id}`,name:M.name??"Presentacion",units:Number(M.units||1),price:Number(M.price||0)})),presentation_id:G!=null&&G.id?`${G.id}`:"",presentation_units:Re,stock_available:Number(R.stock_available||0),reserved_quantity:Number(R.reserved_quantity||0),price_unit:Number(R.price_unit||0),quantity:Number(R.quantity||1),discount_type:((Ze=(I=R.external_payload)==null?void 0:I.commercial_form)==null?void 0:Ze.discount_type)??"none",discount_value:Number(((tt=(et=R.external_payload)==null?void 0:et.commercial_form)==null?void 0:tt.discount_value)||0),discount_amount:Number(((rt=(nt=R.external_payload)==null?void 0:nt.commercial_form)==null?void 0:rt.discount_amount)||0),gross_total:Number(((it=(at=R.external_payload)==null?void 0:at.commercial_form)==null?void 0:it.gross_total)||0),total:Number(R.total||0),price_source:R.price_source||"fallback",price_list_code:((lt=(st=R==null?void 0:R.price_list_item)==null?void 0:st.price_list)==null?void 0:lt.code)||((ot=t==null?void 0:t.price_list)==null?void 0:ot.code)||""})}),y=p.length?p:[ct()];ne(y),$(c.current).modal("show"),await Sn((t==null?void 0:t.business_id)??null,(t==null?void 0:t.business_branch_id)??null),m?(await kn(m,(t==null?void 0:t.client_distribution_network_id)??null),t!=null&&t.client_distribution_network_id&&await Dn(t.client_distribution_network_id,(t==null?void 0:t.client_delivery_address_id)??null)):($t([]),He(""),Me([]),Ne(""))},xa=async t=>{var f,p,y,g,w,N,O,R,v,H,G,Re,fe,he,be,xe,F,I,Ze,et,tt,nt,rt,at,it,st,lt,ot,M,Xn,Qn,Zn,er;if(t.preventDefault(),Ft){A.fire("Pedido bloqueado",Ft,"info");return}const a={id:((f=Ee.current)==null?void 0:f.value)||void 0,external_source:n||void 0,business_id:Ae||null,business_branch_id:Z||null,warehouse_id:ee||null,client_id:Pe||null,eventual_client_id:Oe||null,seller_id:((p=re.current)==null?void 0:p.value)||null,client_distribution_network_id:te||null,client_delivery_address_id:Jr||null,document_type:Le,currency:((y=pt.current)==null?void 0:y.value)||"PEN",payment_condition:Zi(((g=Ye.current)==null?void 0:g.value)||((w=ft.current)==null?void 0:w.value)||"Contado"),payment_method:((N=Ye.current)==null?void 0:N.value)||"",purchase_order:((R=(O=ht.current)==null?void 0:O.value)==null?void 0:R.trim())||"",guide_number:((H=(v=bt.current)==null?void 0:v.value)==null?void 0:H.trim())||"",referral_guide:((Re=(G=xt.current)==null?void 0:G.value)==null?void 0:Re.trim())||"",doctor_name:((he=(fe=ut.current)==null?void 0:fe.value)==null?void 0:he.trim())||"",issue_date:((be=de.current)==null?void 0:be.value)||"",promised_delivery_at:((xe=mt.current)==null?void 0:xe.value)||null,installments:((F=gt.current)==null?void 0:F.value)||1,first_due_date:((I=vt.current)==null?void 0:I.value)||null,order_status:((Ze=_t.current)==null?void 0:Ze.value)||(n?"pending":"draft"),dispatch_status:((et=yt.current)==null?void 0:et.value)||"pending",billing_status:((tt=Nt.current)==null?void 0:tt.value)||"pending",tax_amount:Qe.taxAmount,delivery_address:((rt=(nt=Q.current)==null?void 0:nt.value)==null?void 0:rt.trim())||"",delivery_reference:((it=(at=De.current)==null?void 0:at.value)==null?void 0:it.trim())||"",ubigeo:((lt=(st=ue.current)==null?void 0:st.value)==null?void 0:lt.trim())||"",map_lat:Bt(Wt.lat)||null,map_lng:Bt(Wt.lng)||null,dispatch_contact_name:((M=(ot=Te.current)==null?void 0:ot.value)==null?void 0:M.trim())||"",dispatch_contact_phone:((Qn=(Xn=Ie.current)==null?void 0:Xn.value)==null?void 0:Qn.trim())||"",observations:((er=(Zn=jt.current)==null?void 0:Zn.value)==null?void 0:er.trim())||"",items:ae.map(L=>({article_id:L.article_id||null,presentation_id:L.presentation_id||null,warehouse_id:ee||null,stock_available:L.stock_available,reserved_quantity:L.reserved_quantity,presentation_units:L.presentation_units,price_unit:L.price_unit,quantity:L.quantity,gross_total:L.gross_total,discount_type:L.discount_type,discount_value:L.discount_value,discount_amount:L.discount_amount,total:L.total,status:!0}))},l=is(ae,ee);if(l.length>0){const L=`
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${l.map(ze=>`<li><strong>${Oi(ze.article)}</strong>: faltan ${Ve(ze.shortage)} unidad(es) base para completar ${Ve(ze.quantity)}. Cantidad: ${Ve(ze.lineQuantity)} x ${Ve(ze.presentationUnits)}. Disponible: ${Ve(ze.available)}.</li>`).join("")}
          </ul>
        </div>
      `,{isConfirmed:Ka}=await A.fire({title:"Stock insuficiente",html:L,icon:"warning",showCancelButton:!0,confirmButtonText:"Crear de todas formas",cancelButtonText:"Revisar pedido"});if(!Ka)return;a.allow_stock_shortage=!0}await B.save(a)&&($(s.current).dxDataGrid("instance").refresh(),$(c.current).modal("hide"))},ga=async t=>{const a=t.target.value||"";vn(a),wt(""),ie(Y),await Sn(a,null)},va=t=>{const a=t.target.value||"";Ct(a),wt(""),ie(Y)},_a=async t=>{const a=t.target.value||"";wt(a),await tn()},ya=async t=>{var m,f;const a=Cr(t.target.value),l=((f=(m=$(t.target).select2("data"))==null?void 0:m[0])==null?void 0:f.data)??null;Ut(a),In("regular"),En(l),await kn(a,null,l),await tn()},Na=async t=>{const a=Cr(t.target.value);Vt(a),In("eventual"),await tn()},Ce=(t,a,l)=>{la(m=>({...m,[t]:{...m[t]??{},[a]:l}}))},An=(t=S)=>{var l;const a=t==="multivende"?h:((l=Tt.find(m=>m.id===t))==null?void 0:l.kind)==="billing"?o:s;return a.current?$(a.current).dxDataGrid("instance"):null},St=(t=S)=>{const a=An(t);a&&a.refresh()},Pn=(t=S)=>{const a=Rn[t]??{};t==="orders"&&B.setFilters({laboratory_id:a.laboratoryId||""}),oa(l=>({...l,[t]:a})),setTimeout(()=>St(t),0)},ja=t=>{var a;(a=t==null?void 0:t.preventDefault)==null||a.call(t),Pn(S)},Ca=(t=!1)=>{const a=S;t&&Pn(a),setTimeout(()=>{const l=An(a);l!=null&&l.exportToExcel&&l.exportToExcel(!1)},t?350:0)},wa=async({id:t,field:a,value:l})=>{await B.boolean({id:t,field:a,value:l})&&$(s.current).dxDataGrid("instance").refresh()},On=t=>{Zr(t),$(X.current).modal("show")},Ra=t=>{const a=bn(t);ea(t),Ht(null),Kt($r(a==null?void 0:a.evidence_url)?a.evidence_url:""),Zt({recipient_name:(a==null?void 0:a.recipient_name)??(t==null?void 0:t.dispatch_contact_name)??"",recipient_document_type:(a==null?void 0:a.recipient_document_type)??"DNI",recipient_document_number:(a==null?void 0:a.recipient_document_number)??"",recipient_phone:(a==null?void 0:a.recipient_phone)??(t==null?void 0:t.dispatch_contact_phone)??"",delivered_at:a!=null&&a.delivered_at?`${a.delivered_at}`.replace(" ","T").slice(0,16):Fr(),evidence_notes:(a==null?void 0:a.evidence_notes)??"",evidence_url:(a==null?void 0:a.evidence_url)??"",latitude:(a==null?void 0:a.latitude)??"",longitude:(a==null?void 0:a.longitude)??""}),navigator.geolocation&&navigator.geolocation.getCurrentPosition(l=>{Zt(m=>({...m,latitude:m.latitude||l.coords.latitude,longitude:m.longitude||l.coords.longitude}))},()=>{},{enableHighAccuracy:!0,timeout:5e3}),setTimeout(()=>{q.current&&(q.current.value="")},0),$(z.current).modal("show")},$a=t=>{var l;const a=((l=t.target.files)==null?void 0:l[0])??null;Ht(a),Kt(a?URL.createObjectURL(a):$r(D.evidence_url)?D.evidence_url:"")},pe=(t,a)=>Zt(l=>({...l,[t]:a})),Fa=async t=>{if(t.preventDefault(),!(Be!=null&&Be.id))return;const a=(Be.dispatch_assignments??Be.dispatchAssignments??[]).filter(f=>(f==null?void 0:f.status)!==!1&&(f==null?void 0:f.status)!==0&&(f==null?void 0:f.dispatch)).sort((f,p)=>{var y,g;return new Date(((y=p==null?void 0:p.dispatch)==null?void 0:y.scheduled_date)||(p==null?void 0:p.created_at)||0)-new Date(((g=f==null?void 0:f.dispatch)==null?void 0:g.scheduled_date)||(f==null?void 0:f.created_at)||0)})[0],l=new FormData;a!=null&&a.dispatch_id&&l.append("dispatch_id",a.dispatch_id),l.append("recipient_name",D.recipient_name??""),l.append("recipient_document_type",D.recipient_document_type??"DNI"),l.append("recipient_document_number",D.recipient_document_number??""),l.append("recipient_phone",D.recipient_phone??""),l.append("delivered_at",D.delivered_at??""),l.append("evidence_notes",D.evidence_notes??""),l.append("evidence_url",D.evidence_url??""),l.append("latitude",D.latitude??""),l.append("longitude",D.longitude??""),jn&&l.append("evidence_file",jn),await B.saveDeliveryEvidence(Be.id,l)&&(Ht(null),Kt(""),q.current&&(q.current.value=""),$(z.current).modal("hide"),$(s.current).dxDataGrid("instance").refresh())},Mn=async t=>{const a=Mt(t)[0];if(a){if(ss(a)){const m=await A.fire({title:"Guia de remision",text:`La guia ${Vr(a)} esta ${Er(a.guide_status).toLowerCase()}.`,icon:"question",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Ver PDF",cancelButtonText:"Cancelar"});if(m.isConfirmed){const f=await dr.issue(a.id);if(!(f!=null&&f.data))return;$(s.current).dxDataGrid("instance").refresh(),await kt(Dt.referralGuide(f.data));return}if(!m.isDenied)return}await kt(Dt.referralGuide(a));return}const l=await dr.prepareFromCommercialOrder(t.id);l!=null&&l.data&&($(s.current).dxDataGrid("instance").refresh(),await kt(Dt.referralGuide(l.data)))},Sa=async t=>{var l;if(!(t!=null&&t.id)||t.items&&(t.business||t.commercial_order||t.commercialOrder))return t;const a=await K.paginate({skip:0,take:1,isLoadingAll:!0,filter:["id","=",Number(t.id)]});return((l=a==null?void 0:a.data)==null?void 0:l[0])??t},Ln=async t=>{var m;const a=`${(t==null?void 0:t.local_status)??"pending"}`=="pending"?((m=await K.prepareVoucher(t.id))==null?void 0:m.data)??t:t,l=await Sa(a);if(!Ot(l)){await A.fire({title:"Comprobante no preparado",text:"Primero genera serie y correlativo del comprobante.",icon:"warning",confirmButtonText:"Entendido"});return}ki(l)},Ea=async t=>{var m;let a=Se(t);if(a&&Wr(a)){or(K.downloadUrl(a.id,"pdf"),`Comprobante ${J(a)||a.code}`);return}if(a){const f=await A.fire({title:"Emitir comprobante",text:Ot(a)?`El comprobante ${J(a)||a.code} ya esta preparado. Puedes emitirlo o previsualizarlo.`:`Se emitira ${J(a)||a.code} usando el conector configurado.`,icon:"question",showCancelButton:!0,showDenyButton:Ot(a),confirmButtonText:"Emitir",denyButtonText:"Previsualizar PDF",cancelButtonText:"Cancelar"});if(f.isDenied){await Ln(a);return}if(!f.isConfirmed)return}else{if(!ms(t)){await A.fire({title:"Comprobante no disponible",text:"Primero envia el pedido a preparacion o confirma el pedido. Los pedidos en borrador no se pueden facturar.",icon:"warning",confirmButtonText:"Entendido"});return}const f=dn(t);if(!(await A.fire({title:"Generar comprobante",text:`Se generara un comprobante ${f} para el pedido ${t.code}.`,icon:"question",showCancelButton:!0,confirmButtonText:"Generar",cancelButtonText:"Cancelar"})).isConfirmed)return;const y=await K.save({commercial_order_id:t.id,document_type:f});if(!((m=y==null?void 0:y.data)!=null&&m.id))return;const g=await K.prepareVoucher(y.data.id);a=(g==null?void 0:g.data)??y.data,$(s.current).dxDataGrid("instance").refresh();const w=await A.fire({title:"Comprobante generado",text:`Se genero ${J(a)||a.code}. Puedes emitirlo o previsualizarlo ahora.`,icon:"success",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Previsualizar PDF",cancelButtonText:"Cerrar"});if(w.isDenied){await Ln(a);return}if(!w.isConfirmed)return}await K.issue(a.id)&&$(s.current).dxDataGrid("instance").refresh()},ka=async t=>{const{isConfirmed:a}=await A.fire({title:"Eliminar pedido comercial",text:"Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!a||!await B.delete(t)||$(s.current).dxDataGrid("instance").refresh()},Da=()=>{b.current&&(b.current.value=""),$(u.current).modal("show"),setTimeout(()=>{var t;return(t=b.current)==null?void 0:t.focus()},150)},Ta=async t=>{var l,m;t.preventDefault();const a=((m=(l=b.current)==null?void 0:l.value)==null?void 0:m.trim())||"";if(!a){await A.fire({title:"CHECK OUT ID requerido",text:"Ingresa el CHECK OUT ID del pedido Multivende.",icon:"warning",confirmButtonText:"Entendido"});return}await A.fire({title:"Integracion pendiente",text:`El formulario ya captura el CHECK OUT ID ${a}. Falta conectar el servicio de Multivende para registrar el pedido automaticamente.`,icon:"info",confirmButtonText:"Aceptar"})},Bn=()=>{C.current&&(C.current.value=""),E.current&&(E.current.value=""),k.current&&(k.current.value="1")},zn=async()=>{wn(!0);try{const t=await cr.paginate({take:100,skip:0,requireTotalCount:!0,sort:[{selector:"id",desc:!1}]});ta((t==null?void 0:t.data)??[])}finally{wn(!1)}},Ia=async()=>{Bn(),Cn(""),$(j.current).modal("show"),await zn(),setTimeout(()=>{var t;return(t=E.current)==null?void 0:t.focus()},150)},Aa=t=>{var a;C.current&&(C.current.value=(t==null?void 0:t.id)??""),E.current&&(E.current.value=(t==null?void 0:t.description)??""),k.current&&(k.current.value=t!=null&&t.status?"1":"0"),(a=E.current)==null||a.focus()},Pa=async()=>{var l,m,f,p;const t=((m=(l=E.current)==null?void 0:l.value)==null?void 0:m.trim())||"";if(!t){await A.fire({title:"Motivo requerido",text:"Ingresa la descripcion del motivo de retraso.",icon:"warning",confirmButtonText:"Entendido"});return}await cr.save({id:((f=C.current)==null?void 0:f.value)||void 0,description:t,status:((p=k.current)==null?void 0:p.value)==="1"})&&(Bn(),await zn())},Oa=async(t,a)=>{var R,v,H,G,Re,fe,he,be,xe;$(a.target).data("select2")&&$(a.target).select2("close");const l=(R=$(a.target).select2("data"))==null?void 0:R[0],m=(l==null?void 0:l.data)??null,f=a.target.value||"";if(!f){ne(F=>F.map(I=>I.uid===t?{...ct(),uid:I.uid}:I));return}const p=m??await B.getArticleById(f),y=((p==null?void 0:p.presentations)??[]).filter(F=>(F==null?void 0:F.status)!==!1&&(F==null?void 0:F.status)!==0),g=y[0]??null,w=p?`${p.code??""} - ${p.name??""}`.trim():(l==null?void 0:l.text)??f,N={article_id:f,article_label:w,article_code:(p==null?void 0:p.code)??"",article_lot:(p==null?void 0:p.default_lot)??"",article_name:(p==null?void 0:p.name)??"",article_unit:((v=p==null?void 0:p.unit)==null?void 0:v.symbol)??((H=p==null?void 0:p.unit)==null?void 0:H.name)??"",article_laboratory:((G=p==null?void 0:p.laboratory)==null?void 0:G.name)??"",article_principle:((Re=p==null?void 0:p.activePrinciple)==null?void 0:Re.name)??((fe=p==null?void 0:p.active_principle)==null?void 0:fe.name)??"",presentations:y.map(F=>({id:`${F.id}`,name:F.name??"Presentacion",units:Number(F.units||1),price:Number(F.price||0)})),presentation_id:g?`${g.id}`:"",presentation_units:Number((g==null?void 0:g.units)||1),quantity:1};ne(F=>F.map(I=>I.uid===t?Fe({...I,...N}):I));const O=await B.resolvePrice({article_id:f,presentation_id:g?`${g.id}`:null,quantity:1,business_id:Ae||null,business_branch_id:Z||null,warehouse_id:ee||null,client_id:Pe||null,eventual_client_id:Oe||null,client_distribution_network_id:te||null,issue_date:((he=de.current)==null?void 0:he.value)||null,commercial_channel:((be=Ke.find(F=>`${F.id}`==`${te}`))==null?void 0:be.commercial_channel)||null,segment:((xe=Ke.find(F=>`${F.id}`==`${te}`))==null?void 0:xe.segment)||null});O&&ne(F=>F.map(I=>I.uid===t?Fe({...I,...N,stock_available:Number(O.stock_available||0),price_unit:Number(O.price_unit||0),price_source:O.source||"fallback",price_list_code:O.price_list_code||""}):I))},rn=async(t,a,l)=>{const m=ae.find(w=>w.uid===t);if(!m)return;const f=a==="presentation_id"?m.presentations.find(w=>`${w.id}`==`${l}`):null,p=Fe({...m,[a]:l,...a==="presentation_id"?{presentation_units:Number((f==null?void 0:f.units)||1)}:{}});if(a==="price_unit"&&(p.price_source="manual",p.price_list_code=""),ne(w=>w.map(N=>N.uid===t?p:N)),!["quantity","presentation_id"].includes(a))return;const y=p.presentations.find(w=>`${w.id}`==`${a==="presentation_id"?l:p.presentation_id}`),g=await Tn(p,{quantity:a==="quantity"?l:p.quantity,presentation_id:a==="presentation_id"?l:p.presentation_id});g&&ne(w=>w.map(N=>N.uid!==t?N:Fe({...N,presentation_units:Number((y==null?void 0:y.units)||N.presentation_units||1),stock_available:Number(g.stock_available||0),price_unit:pr(N,g,a==="presentation_id"),price_source:fr(N,g,a==="presentation_id"),price_list_code:a==="presentation_id"?g.price_list_code||"":xn(N)?N.price_list_code:g.price_list_code||""})))},Ma=(t,a)=>{const l=Number(a||0);ne(m=>m.map(f=>f.uid!==t?f:Fe({...f,discount_type:l>0?"percent":"none",discount_value:l>0?l:0})))},La=(t,a)=>{a.preventDefault(),a.stopPropagation();const l=a.currentTarget.getBoundingClientRect();Yt(m=>(m==null?void 0:m.uid)===t?null:{uid:t,top:l.bottom+4,left:l.left,width:Math.max(l.width,130)})},Gn=(t,a)=>{Ma(t,a),Yt(null)},Ba=()=>ne(t=>[...t,ct()]),za=t=>{ne(a=>{const l=a.filter(m=>m.uid!==t);return l.length?l:[ct()]})},Un=d.useMemo(()=>ae.reduce((t,a)=>t+Number(a.total||0),0),[ae]),Qe=d.useMemo(()=>Rr(Un,Le),[Un,Le]),we=Ft!=="",Vn=d.useMemo(()=>hs(Nn),[Nn]),an=d.useMemo(()=>{const t=Xt.trim().toLowerCase();return t?Jt.filter(a=>[a.description,a.status?"Activo":"Inactivo",cn(a.creator),vr(a.created_at)].some(l=>`${l??""}`.toLowerCase().includes(t))):Jt},[Jt,Xt]),Ga=(t,a)=>r.jsxs("div",{className:`commercial-order-filter-field commercial-order-filter-${a.key}`,children:[r.jsxs("label",{className:"form-label",children:[a.label,a.helper&&r.jsxs("span",{className:"commercial-order-filter-helper",children:[" ",a.helper]})]}),a.type==="business"?r.jsxs("select",{className:"form-select",value:Xe[a.key]??"",onChange:l=>Ce(t,a.key,l.target.value),children:[r.jsx("option",{value:"",children:"Todos"}),ra.map(l=>r.jsx("option",{value:l.id,children:l.name},`commercial-order-filter-business-${l.id}`))]}):a.type==="laboratory"?r.jsxs("select",{className:"form-select",value:Xe[a.key]??"",onChange:l=>Ce(t,a.key,l.target.value),children:[r.jsx("option",{value:"",children:"Todos"}),ia.map(l=>r.jsx("option",{value:l.id,children:l.name},`commercial-order-filter-laboratory-${l.id}`))]}):a.type==="select"?r.jsx("select",{className:"form-select",value:Xe[a.key]??"",onChange:l=>Ce(t,a.key,l.target.value),children:(a.options??[]).map(l=>r.jsx("option",{value:l.value??l,children:l.label??l},`commercial-order-filter-${a.key}-${l.value??l}`))}):a.type==="dateRange"?r.jsx("input",{className:"form-control commercial-order-date-range-input","data-tab-id":t,value:Xe[a.key]??"",onChange:l=>Ce(t,a.key,l.target.value),placeholder:a.placeholder??"YYYY/MM/DD - YYYY/MM/DD"}):r.jsx("input",{className:"form-control",value:Xe[a.key]??"",onChange:l=>Ce(t,a.key,l.target.value),placeholder:a.placeholder??""})]},`commercial-order-main-filter-${t}-${a.key}`),sn={orders:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"laboratoryId",label:"Laboratorio",helper:"(Solo para Reporte con Visitadores)",type:"laboratory"},{key:"dispatchStatus",label:"Despachado",type:"select",options:[{value:"",label:"Seleccionar"},{value:"dispatched",label:"Pedidos despachados"},{value:"pending",label:"Pedidos sin despachar"}]}],issued:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],"credit-notes":[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],multivende:[{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"orderVtex",label:"Pedido VTEX",type:"text",placeholder:"Numero de pedido"}]}[S]??((Jn=mr[S])==null?void 0:Jn.filters)??[],Wn=sn.some(t=>t.type==="dateRange");d.useEffect(()=>{if(!Wn)return;let t=!0;return Ui().then(()=>{var a,l;!t||!((l=(a=window.$)==null?void 0:a.fn)!=null&&l.daterangepicker)||!window.moment||(window.moment.locale("es"),$(".commercial-order-date-range-input").each(function(){const m=$(this),f=m.data("tab-id")||S,p=`${m.val()||We()}`.trim(),{start:y,end:g}=zr(p),w=window.moment(y||hn().replaceAll("/","-"),"YYYY-MM-DD"),N=window.moment(g||y||hn().replaceAll("/","-"),"YYYY-MM-DD"),O=m.data("daterangepicker");O&&O.remove(),m.off(".commercialOrderDateRange"),m.daterangepicker({startDate:w,endDate:N,autoUpdateInput:!1,alwaysShowCalendars:!0,linkedCalendars:!1,opens:"center",locale:{format:"YYYY/MM/DD",separator:" - ",applyLabel:"Aplicar",cancelLabel:"Limpiar",fromLabel:"Desde",toLabel:"Hasta",customRangeLabel:"Personalizado",weekLabel:"S",daysOfWeek:["Do","Lu","Ma","Mi","Ju","Vi","Sa"],monthNames:["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"],firstDay:1}},(R,v)=>{const H=`${R.format("YYYY/MM/DD")} - ${v.format("YYYY/MM/DD")}`;m.val(H),Ce(f,"dateRange",H)}),m.on("cancel.daterangepicker.commercialOrderDateRange",()=>{m.val(""),Ce(f,"dateRange","")})}))}).catch(()=>{}),()=>{t=!1,$(".commercial-order-date-range-input").each(function(){const a=$(this).data("daterangepicker");a&&a.remove(),$(this).off(".commercialOrderDateRange")})}},[S,Wn]);const qn=t=>{const a=t==null?void 0:t.data;if(!a)return(t==null?void 0:t.text)??"";const l=[a.series,a.sequence].filter(Boolean).join("-")||a.code||`#${a.id}`,m=un(a);return $(`<span><b>${l}</b>${m!=="-"?" · "+m:""}</span>`)},Ua=()=>{ve.current&&$(ve.current).val(null).trigger("change"),_e.current&&(_e.current.value="Anulacion de la operacion"),$(V.current).modal("show")},Va=async t=>{var f,p;t.preventDefault();const a=(f=ve.current)==null?void 0:f.value,l=(((p=_e.current)==null?void 0:p.value)??"").trim();if(!a){A.fire({icon:"warning",title:"Selecciona un comprobante",text:"Elige la factura o boleta a anular."});return}if(!l){A.fire({icon:"warning",title:"Motivo requerido",text:"Indica el motivo de la anulacion."});return}await K.creditNote(a,{reason:l})&&($(V.current).modal("hide"),A.fire({icon:"success",title:"Nota de credito generada",timer:2200,showConfirmButton:!1}),St())},Et=r.jsxs("div",{className:"commercial-order-listing-header",children:[r.jsxs("div",{className:"d-flex align-items-center justify-content-between gap-2 mb-2",children:[r.jsx("h4",{className:"header-title mb-0",children:"Listado"}),r.jsx("button",{type:"button",className:"btn btn-xs btn-light",onClick:()=>St(),title:"Refrescar listado",children:r.jsx("i",{className:"mdi mdi-refresh"})})]}),r.jsx("ul",{className:"nav nav-tabs nav-bordered flex-nowrap overflow-auto mb-3",children:Tt.map(t=>r.jsx("li",{className:"nav-item",children:r.jsx("button",{type:"button",className:`nav-link text-nowrap ${S===t.id?"active":""}`,onClick:()=>na(t.id),children:t.label})},`commercial-order-tab-${t.id}`))}),sn.length>0&&r.jsxs("form",{className:"commercial-order-filter-form mb-2",onSubmit:ja,children:[sn.map(t=>Ga(S,t)),r.jsxs("div",{className:"commercial-order-filter-actions",children:[S==="credit-notes"&&r.jsxs("button",{type:"button",className:"btn btn-primary",onClick:Ua,children:[r.jsx("i",{className:"mdi mdi-plus me-1"}),"Crear Nota de Crédito"]}),r.jsxs("button",{type:"submit",className:"btn btn-outline-primary",children:[r.jsx("i",{className:"mdi mdi-magnify me-1"}),"Filtrar"]}),en.kind!=="static"&&r.jsxs("button",{type:"button",className:"btn btn-outline-success",onClick:()=>Ca(!1),children:[r.jsx("i",{className:"mdi mdi-file-excel-box me-1"}),"Exportar a Excel"]}),S==="multivende"&&r.jsxs("button",{type:"button",className:"btn btn-outline-success",children:[r.jsx("i",{className:"mdi mdi-calendar-refresh me-1"}),"Actualizar fechas de entrega"]})]})]}),S==="issued"&&r.jsx("div",{className:"row g-3 mt-1",children:["Total","IGV","IGV Recuperado"].map(t=>r.jsxs("div",{className:"col-12 col-md-4",children:[r.jsx("label",{className:"form-label",children:t}),r.jsx("input",{className:"form-control",value:"0.00",readOnly:!0})]},`commercial-order-total-${t}`))})]}),Wa=async t=>{const a=J(t)||t.code,{value:l,isConfirmed:m}=await A.fire({title:"Generar nota de credito",html:`Se anulara el comprobante <b>${a}</b> generando una nota de credito que lo deja sin efecto.`,icon:"warning",input:"textarea",inputLabel:"Motivo de la anulacion",inputValue:"Anulacion de la operacion",inputPlaceholder:"Describe el motivo de la anulacion",showCancelButton:!0,confirmButtonText:"Generar nota de credito",cancelButtonText:"Cancelar",inputValidator:p=>!p||!p.trim()?"El motivo es obligatorio":void 0});!m||!await K.creditNote(t.id,{reason:l.trim()})||(A.fire({icon:"success",title:"Nota de credito generada",text:"Revisala en la pestaña Notas de Credito.",timer:2500,showConfirmButton:!1}),St())},Yn={caption:"Acciones",width:100,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowSorting:!1,cellTemplate:(t,{data:a})=>{t.addClass("commercial-order-actions"),U(t,{variant:"danger",title:"Previsualizar PDF del comprobante",icon:"mdi mdi-file-eye-outline",onClick:()=>or(K.downloadUrl(a.id,"pdf"),`Comprobante ${J(a)||a.code}`)}),`${a.document_type??""}`.trim().toLowerCase()!=="nota de credito"&&U(t,{variant:"warning",title:"Anular: generar nota de credito de este comprobante",icon:"mdi mdi-file-cancel-outline",onClick:()=>Wa(a)})}},qa=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"dispatch_status",visible:!1,showInColumnChooser:!1}],Hn=[{dataField:"source_type",visible:!1,showInColumnChooser:!1},{dataField:"local_status",visible:!1,showInColumnChooser:!1},{dataField:"document_type",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"created_at",visible:!1,showInColumnChooser:!1}],Ya=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"external_order_id",visible:!1,showInColumnChooser:!1},{dataField:"external_checkout_id",visible:!1,showInColumnChooser:!1}],Kn={issued:[...Hn,Yn,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:jr},{caption:"Cliente",minWidth:260,calculateCellValue:un},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:t=>Nr(t.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}],"credit-notes":[...Hn,Yn,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:jr},{caption:"Doc. Afecto",width:130,calculateCellValue:Ki},{caption:"Cliente",minWidth:260,calculateCellValue:un},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:t=>Nr(t.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}]},Ha=[...Ya,{caption:"Acciones",width:230,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(t,{data:a})=>{const l=Mt(a).length>0;t.css("text-overflow","unset"),t.addClass("commercial-order-actions"),U(t,{variant:"primary",title:"Editar pedido Multivende",icon:"mdi mdi-pencil",onClick:()=>nn(a)}),U(t,{variant:"info",title:"Ver tracking del pedido Multivende",icon:"mdi mdi-timeline-clock-outline",onClick:()=>On(a)}),U(t,{variant:l?"dark":"warning",title:l?"Ver guia de remision asociada":"Generar guia de remision",icon:l?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>Mn(a)})}},{dataField:"order_status",caption:"E. Pedido",width:130,lookup:nr(rr),cellTemplate:(t,{value:a})=>It(t,a,ar)},{caption:"E. SUNAT",width:120,calculateCellValue:Ji},{caption:"Pedido VTEX",width:150,calculateCellValue:Xi},{dataField:"external_channel",caption:"Canal",width:130},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:xr},{dataField:"document_type",caption:"Tipo Documento",width:140,calculateCellValue:dn,cellTemplate:(t,{value:a})=>It(t,a,l=>l||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:300,calculateCellValue:gr},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"promised_delivery_at",caption:"F. Entrega Estimada",dataType:"date",width:160},{caption:"F. de Entrega",width:150,dataType:"date",calculateCellValue:Gr},{caption:"Tiempo de Proceso",width:150,calculateCellValue:Qi},{dataField:"created_at",caption:"Fecha Registro",dataType:"date",width:140},{dataField:"code",caption:"Codigo",width:130}];return r.jsxs(r.Fragment,{children:[r.jsx("style",{children:`
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
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
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
          justify-content: flex-end;
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
    `}),r.jsxs("div",{className:"commercial-order-top-actions",children:[r.jsxs("button",{type:"button",className:"btn btn-success commercial-order-multivende-action",title:"Ingresar pedido Multivende por CHECK OUT ID",onClick:Da,children:[r.jsxs("span",{children:[r.jsx("i",{className:"mdi mdi-plus-circle-outline"})," Ingresar pedido multivende"]}),r.jsx("i",{className:"mdi mdi-calendar-month-outline"})]}),r.jsxs("button",{type:"button",className:"btn commercial-order-delay-action",title:"Abrir mantenedor de motivos de retraso de entrega",onClick:Ia,children:[r.jsx("span",{children:"Mantenedor Retraso Entrega"}),r.jsx("i",{className:"mdi mdi-cog"})]})]}),S==="orders"&&r.jsx(ln,{gridRef:s,title:Et,rest:B,baseFilterValue:ua,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(s.current).dxDataGrid("instance").refresh()}}),t.unshift({widget:"dxButton",location:"after",options:{icon:"add",title:"Agregar",hint:"Agregar pedido comercial",onClick:()=>nn(null)}})},pageSize:25,exportable:!0,columns:[...qa,{caption:"Acciones",width:340,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(t,{data:a})=>{const l=Mt(a).length>0,m=Sr(a);t.css("text-overflow","unset"),t.addClass("commercial-order-actions"),U(t,{variant:"primary",title:m||"Editar datos, cliente, entrega y productos del pedido comercial",icon:m?"mdi mdi-eye-outline":"mdi mdi-pencil",onClick:()=>nn(a)}),us(a)&&U(t,{variant:"success",title:"Enviar este pedido a preparacion para iniciar picking",icon:"mdi mdi-clipboard-check-outline",onClick:()=>wa({id:a.id,field:"dispatch_status",value:"preparing"})}),U(t,{variant:"info",title:"Ver tracking del pedido: estados, guia, ruta y entrega",icon:"mdi mdi-timeline-clock-outline",onClick:()=>On(a)});const f=fs(a);U(t,{variant:"secondary",title:f.title,icon:f.icon,onClick:()=>Ea(a)}),U(t,{variant:l?"dark":"warning",title:l?"Ver, emitir o descargar la guia de remision asociada al pedido":"Generar guia de remision para este pedido",icon:l?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>Mn(a)}),U(t,{variant:"success",title:bn(a)?"Ver o actualizar foto y datos de evidencia de entrega":"Registrar foto y datos de evidencia de entrega",icon:"mdi mdi-camera",onClick:()=>Ra(a)}),U(t,{variant:"danger",title:"Previsualizar o descargar PDF resumen del pedido comercial",icon:"mdi mdi-file-pdf-box",onClick:()=>kt(Dt.commercialOrder(a))}),U(t,{variant:"danger",title:"Eliminar este pedido comercial del listado",icon:"mdi mdi-delete",onClick:()=>ka(a.id)})}},{dataField:"order_status",caption:"Estado",width:140,lookup:nr(rr),cellTemplate:(t,{value:a})=>It(t,a,ar)},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:xr},{dataField:"document_type",caption:"Tipo documento",width:130,calculateCellValue:dn,cellTemplate:(t,{value:a})=>It(t,a,l=>l||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:320,calculateCellValue:gr},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_label",caption:"Tipo de pago",width:170,calculateCellValue:zi},{dataField:"seller.fullname",caption:"Usuario",width:190,cellTemplate:(t,{data:a})=>t.text(Pi(a.seller))},{dataField:"created_at",caption:"Fecha registro",width:130,dataType:"date"},{dataField:"creator.username",caption:"Usuario registro",width:150,cellTemplate:(t,{data:a})=>t.text(cn(a.creator))},{dataField:"code",caption:"Código",width:130},{dataField:"business.name",caption:"Empresa",minWidth:150}]},"orders"),en.kind==="billing"&&r.jsx(ln,{gridRef:o,title:Et,rest:K,baseFilterValue:ma,pageSize:20,exportable:!0,columns:Kn[S]??Kn.issued,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar listado",onClick:()=>$(o.current).dxDataGrid("instance").refresh()}})}},`billing-${S}`),S==="multivende"&&r.jsx(ln,{gridRef:h,title:Et,rest:da,baseFilterValue:pa,pageSize:10,exportable:!0,columns:Ha,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar pedidos Multivende",onClick:()=>$(h.current).dxDataGrid("instance").refresh()}})}},"multivende"),en.kind==="static"&&r.jsx(bs,{title:Et,config:mr[S]}),r.jsx(Ge,{modalRef:c,title:we?"Ver pedido comercial":Hr?"Editar pedido comercial":"Agregar pedido comercial",size:"xl",dialogClass:"commercial-order-modal-dialog modal-dialog-scrollable",bodyClass:"commercial-order-modal-body",bodyStyle:{maxHeight:"calc(100vh - 150px)",overflowY:"auto",overflowX:"hidden"},btnSubmitText:"Guardar",hideButtonSubmit:we,onSubmit:xa,children:r.jsxs("div",{id:"commercial-orders-form-container",children:[r.jsx("input",{ref:Ee,type:"hidden"}),r.jsx("input",{ref:x,type:"hidden"}),r.jsx("input",{ref:de,type:"hidden"}),r.jsx("input",{ref:mt,type:"hidden"}),r.jsx("input",{ref:ft,type:"hidden"}),r.jsx("input",{ref:gt,type:"hidden"}),r.jsx("input",{ref:vt,type:"hidden"}),r.jsx("input",{ref:_t,type:"hidden"}),r.jsx("input",{ref:yt,type:"hidden"}),r.jsx("input",{ref:Nt,type:"hidden"}),r.jsx("input",{ref:Yr,type:"hidden",value:Qe.taxAmount,readOnly:!0}),r.jsx("input",{ref:De,type:"hidden"}),we&&r.jsxs("div",{className:"alert alert-warning py-2 mb-2",children:[r.jsx("i",{className:"mdi mdi-lock-outline me-1"}),Ft]}),r.jsxs("fieldset",{className:we?"commercial-order-form-readonly":"",disabled:we,style:{border:0,margin:0,padding:0,minWidth:0},children:[r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-file-document"}),r.jsx("span",{children:"Datos del pedido"})]}),r.jsxs("div",{className:"row g-2",children:[r.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:r.jsx($e,{eRef:P,label:"Empresa",required:!0,searchAPI:"/api/admin/businesses/paginate",searchBy:"name",dropdownParent:"#commercial-orders-form-container",onChange:ga})}),r.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:r.jsxs(si,{eRef:ye,label:"Sede",dropdownParent:"#commercial-orders-form-container",value:Z,onChange:va,children:[r.jsx("option",{value:"",children:"Sin sede"}),Qr.map(t=>r.jsx("option",{value:t.id,children:t.name},`commercial-order-branch-${t.id}`))]})}),r.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:r.jsx($e,{eRef:Y,label:"Almacen",required:!0,searchAPI:"/api/admin/warehouses/paginate",searchBy:"name",filter:ha,dropdownParent:"#commercial-orders-form-container",onChange:_a,templateResult:wr,templateSelection:wr})}),r.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Doc. venta"}),r.jsxs("select",{ref:qr,className:"form-control",value:Le,onChange:t=>yn(Lt(t.target.value)),children:[r.jsx("option",{value:"Factura",children:"Factura"}),r.jsx("option",{value:"Boleta",children:"Boleta"}),r.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),r.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Moneda"}),r.jsxs("select",{ref:pt,className:"form-control",children:[r.jsx("option",{value:"PEN",children:"PEN"}),r.jsx("option",{value:"USD",children:"USD"}),r.jsx("option",{value:"EUR",children:"EUR"})]})]}),r.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Forma de pago"}),r.jsxs("select",{ref:Ye,className:"form-control",children:[r.jsx("option",{value:"",children:"Seleccione"}),Ii.map(t=>r.jsx("option",{value:t,children:t},`commercial-order-payment-${t}`))]})]})]})]}),r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-account"}),r.jsx("span",{children:"Cliente y entrega"})]}),r.jsxs("div",{className:"row g-2",children:[r.jsx("div",{className:"col-12 col-xl-6",children:r.jsx($e,{eRef:ce,label:"Cliente regular",searchAPI:"/api/admin/clients/paginate",searchBy:"full_name",selectBy:"entity_id",filter:Di,dropdownParent:"#commercial-orders-form-container",onChange:ya})}),r.jsx("div",{className:"col-12 col-xl-6",children:r.jsx($e,{eRef:ke,label:"Cliente eventual",searchAPI:"/api/admin/eventual-clients/paginate",searchBy:"business_name",dropdownParent:"#commercial-orders-form-container",onChange:Na})}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Orden de compra"}),r.jsx("input",{ref:ht,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Numero de guia"}),r.jsx("input",{ref:bt,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Guia remision"}),r.jsx("input",{ref:xt,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Ubigeo"}),r.jsx("input",{ref:ue,className:"form-control"})]}),r.jsx("div",{className:"col-12 col-xl-4",children:r.jsx(on,{eRef:Q,label:"Direccion de entrega",rows:2})}),r.jsx("div",{className:"col-12",children:r.jsx(ds,{modalRef:c,position:Wt,searchText:Xr,onSearchTextChange:Rt,onPositionChange:qt,onAddressSelected:t=>{Q.current&&(Q.current.value=t)},disabled:we})}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[r.jsx("label",{className:"form-label",children:"Nombre contacto entrega"}),r.jsx("input",{ref:Te,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Celular contacto entrega"}),r.jsx("input",{ref:Ie,className:"form-control"})]}),r.jsx($e,{eRef:re,label:"Vendedor",col:"col-12 col-md-6 col-xl-2",searchAPI:"/api/admin/users/paginate",searchBy:"fullname",dropdownParent:"#commercial-orders-form-container"}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Medico"}),r.jsx("input",{ref:ut,className:"form-control"})]})]})]}),r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-detail-toolbar",children:[r.jsxs("div",{className:"commercial-order-section-title mb-0",children:[r.jsx("i",{className:"mdi mdi-format-list-bulleted"}),r.jsx("span",{children:"Detalle del pedido"})]}),r.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:Ba,children:"Agregar item"})]}),r.jsx("div",{className:"table-responsive border rounded commercial-order-detail-table","data-select2-local-dropdown":"true",children:r.jsxs("table",{className:"table table-sm align-middle mb-0",children:[r.jsx("thead",{children:r.jsxs("tr",{children:[r.jsx("th",{style:{minWidth:96},children:"Descuento"}),r.jsx("th",{style:{minWidth:104},children:"Codigo"}),r.jsx("th",{style:{minWidth:88},children:"Codigo lote"}),r.jsx("th",{style:{minWidth:280},children:"Nombre"}),r.jsx("th",{style:{minWidth:128},children:"Laboratorio"}),r.jsx("th",{style:{minWidth:130},children:"Principio activo"}),r.jsx("th",{style:{minWidth:110},children:"Unidad"}),r.jsx("th",{style:{minWidth:64},children:"Stock"}),r.jsx("th",{style:{minWidth:112},children:"P. venta con IGV"}),r.jsx("th",{style:{minWidth:112},children:"P. venta sin IGV"}),r.jsx("th",{style:{minWidth:92},children:"Cantidad"}),r.jsx("th",{style:{minWidth:96},children:"Total desc."}),r.jsx("th",{style:{minWidth:96},children:"Sub total"}),r.jsx("th",{style:{width:70}})]})}),r.jsx("tbody",{children:ae.map(t=>r.jsxs("tr",{children:[r.jsx("td",{children:r.jsxs("div",{className:"commercial-order-discount-cell",children:[r.jsxs("button",{type:"button",className:"commercial-order-discount-trigger",onClick:a=>La(t.uid,a),children:[r.jsx("span",{children:t.discount_type==="percent"&&Number(t.discount_value||0)>0?`${Number(t.discount_value)}%`:"Seleccione"}),r.jsx("i",{className:"mdi mdi-chevron-down"})]}),(me==null?void 0:me.uid)===t.uid&&r.jsxs("div",{className:"commercial-order-discount-menu",style:{top:me.top,left:me.left,minWidth:me.width},onClick:a=>a.stopPropagation(),children:[r.jsx("button",{type:"button",className:`commercial-order-discount-option ${t.discount_type!=="percent"?"active":""}`,onClick:()=>Gn(t.uid,""),children:"Seleccione"}),Ti.map(a=>r.jsxs("button",{type:"button",className:`commercial-order-discount-option ${t.discount_type==="percent"&&Number(t.discount_value||0)===a?"active":""}`,onClick:()=>Gn(t.uid,a),children:[a,"%"]},`commercial-order-discount-floating-${t.uid}-${a}`))]})]})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_code||"-"})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_lot||"-"})}),r.jsx("td",{className:"commercial-order-article-name",children:r.jsx($e,{eRef:Fn(t.uid),searchAPI:fa,searchBy:"name",dropdownParent:"#commercial-orders-form-container",disabled:!ee,onChange:a=>Oa(t.uid,a)})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_laboratory||"-"})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_principle||"-"})}),r.jsx("td",{children:r.jsxs("div",{children:[r.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_unit||"-"}),t.presentations.length>0&&r.jsxs("select",{className:"form-control mt-1","data-no-select2":"true",value:t.presentation_id,disabled:!t.article_id,onChange:a=>rn(t.uid,"presentation_id",a.target.value),children:[r.jsx("option",{value:"",children:rs(t)}),t.presentations.map(a=>r.jsx("option",{value:a.id,children:as(a,t)},`commercial-order-presentation-${t.uid}-${a.id}`))]})]})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:Number(t.stock_available||0).toFixed(2)})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:t.price_unit,onFocus:br,onChange:a=>rn(t.uid,"price_unit",hr(a))})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Rr(Number(t.price_unit||0),Le).subtotal.toFixed(2),readOnly:!0})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0.01",className:"form-control",value:t.quantity,onFocus:br,onChange:a=>rn(t.uid,"quantity",hr(a))})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(t.discount_amount||0).toFixed(2),readOnly:!0})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(t.total||0).toFixed(2),readOnly:!0})}),r.jsx("td",{className:"text-end",children:r.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>za(t.uid),children:r.jsx("i",{className:"mdi mdi-close"})})})]},t.uid))}),r.jsxs("tfoot",{children:[r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:Ur(Le)?"Total gravada":"Sub total"}),r.jsx("th",{children:Qe.subtotal.toFixed(2)}),r.jsx("th",{})]}),r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:"Descuento global"}),r.jsx("th",{children:"0.00"}),r.jsx("th",{})]}),r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:"IGV"}),r.jsx("th",{children:Qe.taxAmount.toFixed(2)}),r.jsx("th",{})]}),r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:"Total"}),r.jsx("th",{children:Qe.total.toFixed(2)}),r.jsx("th",{})]})]})]})})]}),r.jsxs("section",{className:"commercial-order-form-section mb-0",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-note-text"}),r.jsx("span",{children:"Observaciones"})]}),r.jsx(on,{eRef:jt,label:"Observaciones",rows:3,disabled:we})]})]})]})}),r.jsx(Ge,{modalRef:u,title:"Ingresar pedido multivende",size:"lg",btnSubmitText:"Registrar",onSubmit:Ta,children:r.jsx("div",{className:"commercial-order-multivende-form",children:r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-file-document-plus-outline"}),r.jsx("span",{children:"General"})]}),r.jsxs("div",{className:"mb-2",children:[r.jsxs("label",{className:"form-label",children:["Ingrese el ",r.jsx("strong",{children:"CHECK OUT ID"})]}),r.jsx("input",{ref:b,name:"external_checkout_id",className:"form-control",autoComplete:"off"})]})]})})}),r.jsx(Ge,{modalRef:j,title:"Mantenedor motivo retraso entrega",size:"lg",hideFooter:!0,onSubmit:t=>{t.preventDefault(),Pa()},children:r.jsxs("div",{className:"commercial-order-delay-maintainer",children:[r.jsxs("div",{className:"commercial-order-delay-actions",children:[r.jsxs("button",{type:"button",className:"btn btn-sm btn-light","data-bs-dismiss":"modal",children:[r.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]}),r.jsxs("button",{type:"submit",className:"btn btn-sm btn-outline-primary",children:[r.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]})]}),r.jsx("input",{ref:C,type:"hidden"}),r.jsxs("div",{className:"row",children:[r.jsxs("div",{className:"col-12 mb-3",children:[r.jsx("label",{className:"form-label",children:"Descripcion:"}),r.jsx("input",{ref:E,className:"form-control",autoComplete:"off"})]}),r.jsxs("div",{className:"col-12 mb-3",children:[r.jsx("label",{className:"form-label",children:"Estado:"}),r.jsxs("select",{ref:k,className:"form-control",defaultValue:"1",children:[r.jsx("option",{value:"1",children:"Activo"}),r.jsx("option",{value:"0",children:"Inactivo"})]})]})]}),r.jsx("hr",{}),r.jsxs("div",{className:"commercial-order-delay-filter",children:[r.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),r.jsx("input",{className:"form-control form-control-sm",value:Xt,onChange:t=>Cn(t.target.value)})]}),r.jsx("div",{className:"table-responsive commercial-order-delay-table",children:r.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[r.jsx("thead",{children:r.jsxs("tr",{children:[r.jsx("th",{className:"text-center",children:"Acciones"}),r.jsx("th",{className:"text-center",children:"Estado"}),r.jsx("th",{children:"Motivo"}),r.jsx("th",{children:"Fecha registro"}),r.jsx("th",{children:"Usuario registro"})]})}),r.jsxs("tbody",{children:[Qt&&r.jsx("tr",{children:r.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"Cargando motivos..."})}),!Qt&&an.length===0&&r.jsx("tr",{children:r.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"No existen elementos"})}),!Qt&&an.map(t=>r.jsxs("tr",{children:[r.jsx("td",{className:"text-center",children:r.jsx("button",{type:"button",className:"btn btn-xs btn-outline-info",title:"Editar motivo de retraso",onClick:()=>Aa(t),children:r.jsx("i",{className:"mdi mdi-pencil"})})}),r.jsx("td",{className:"text-center",children:r.jsx("span",{className:Lr(t.status?"billed":"cancelled"),children:t.status?"Activo":"Inactivo"})}),r.jsx("td",{children:t.description}),r.jsx("td",{children:vr(t.created_at)}),r.jsx("td",{children:cn(t.creator)})]},`delivery-delay-reason-${t.id}`))]})]})}),r.jsxs("div",{className:"commercial-order-delay-summary",children:[an.length," elementos (Pagina 1 de 1)"]})]})}),r.jsx(Ge,{modalRef:X,title:"Tracking del pedido",size:"lg",hideButtonSubmit:!0,children:r.jsx("div",{className:"table-responsive",children:r.jsxs("table",{className:"table table-sm align-middle mb-0",children:[r.jsx("thead",{children:r.jsxs("tr",{children:[r.jsx("th",{children:"Fecha"}),r.jsx("th",{children:"Estado"})]})}),r.jsxs("tbody",{children:[Vn.length===0&&r.jsx("tr",{children:r.jsx("td",{colSpan:"2",className:"text-muted text-center py-3",children:"Sin eventos registrados."})}),Vn.map((t,a)=>r.jsxs("tr",{children:[r.jsx("td",{children:new Date(t.date).toLocaleString("es-PE")}),r.jsx("td",{children:t.status})]},`commercial-order-tracking-${a}`))]})]})})}),r.jsx(Ge,{modalRef:z,title:"Evidencia de entrega",size:"lg",btnSubmitText:"Registrar",onSubmit:Fa,children:r.jsxs("div",{className:"row",children:[r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Recibido por"}),r.jsx("input",{className:"form-control",value:D.recipient_name,onChange:t=>pe("recipient_name",t.target.value)})]}),r.jsxs("div",{className:"col-md-3 mb-3",children:[r.jsx("label",{className:"form-label",children:"Tipo doc."}),r.jsxs("select",{className:"form-control",value:D.recipient_document_type,onChange:t=>pe("recipient_document_type",t.target.value),children:[r.jsx("option",{value:"DNI",children:"DNI"}),r.jsx("option",{value:"RUC",children:"RUC"}),r.jsx("option",{value:"CE",children:"CE"}),r.jsx("option",{value:"OTRO",children:"Otro"})]})]}),r.jsxs("div",{className:"col-md-3 mb-3",children:[r.jsx("label",{className:"form-label",children:"Numero"}),r.jsx("input",{className:"form-control",value:D.recipient_document_number,onChange:t=>pe("recipient_document_number",t.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Telefono"}),r.jsx("input",{className:"form-control",value:D.recipient_phone,onChange:t=>pe("recipient_phone",t.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Fecha y hora entrega"}),r.jsx("input",{type:"datetime-local",className:"form-control",value:D.delivered_at,onChange:t=>pe("delivered_at",t.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Foto / evidencia"}),r.jsx("input",{ref:q,className:"form-control",type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",capture:"environment",onChange:$a})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Latitud"}),r.jsx("input",{className:"form-control",value:D.latitude,onChange:t=>pe("latitude",t.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Longitud"}),r.jsx("input",{className:"form-control",value:D.longitude,onChange:t=>pe("longitude",t.target.value)})]}),r.jsxs("div",{className:"col-12 mb-3",children:[r.jsx("label",{className:"form-label",children:"Observaciones"}),r.jsx("textarea",{className:"form-control",rows:"3",value:D.evidence_notes,onChange:t=>pe("evidence_notes",t.target.value)})]}),r.jsx("div",{className:"col-12",children:r.jsx("div",{className:"border rounded p-3",children:je?r.jsx("img",{src:je,alt:"Evidencia de entrega",className:"img-fluid rounded border bg-light",style:{maxHeight:360,width:"100%",objectFit:"contain"}}):D.evidence_url?r.jsx("a",{href:D.evidence_url,target:"_blank",rel:"noreferrer",children:"Abrir evidencia registrada"}):r.jsx("div",{className:"text-muted py-4 text-center",children:"Sin evidencia registrada"})})})]})}),r.jsx(Ge,{modalRef:V,title:"Crear nota de credito",size:"md",btnSubmitText:"Generar nota de credito",onSubmit:Va,children:r.jsxs("div",{className:"row",children:[r.jsx($e,{eRef:ve,label:"Comprobante a anular (Factura / Boleta)",col:"col-12",required:!0,searchAPI:"/api/admin/billing-documents/paginate",searchBy:"sequence",filter:[["document_type","<>","Nota de credito"],"and",["source_type","=","commercial_order"]],templateResult:qn,templateSelection:qn}),r.jsx(on,{eRef:_e,label:"Motivo de la anulacion",col:"col-12",rows:3,required:!0})]})})]})};Qa((e,n)=>{!n.can("orders")&&!n.hasRole("Admin")&&(location.href="/admin/"),Za(e).render(r.jsx(ai,{...n,title:n.pageTitle||"Pedidos comerciales",children:r.jsx(xs,{...n})}))});
