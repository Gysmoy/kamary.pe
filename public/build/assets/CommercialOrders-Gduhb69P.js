var za=Object.defineProperty;var Va=(e,n,i)=>n in e?za(e,n,{enumerable:!0,configurable:!0,writable:!0,value:i}):e[n]=i;var Qn=(e,n,i)=>Va(e,typeof n!="symbol"?n+"":n,i);import{C as Wa,c as qa,j as r,r as d,S as z,G as Ya}from"./CreateReactScript-D9pmrPNT.js";import{L as Ha,G as Ka,M as Ja}from"./esm-kNVJ7Zu8.js";import{B as Xa}from"./Base-Gceq41S5.js";import{T as an,t as Zn,k as er,l as Fr,m as tr}from"./Table-DYUUwZfK.js";import{M as st}from"./Modal-DN0RjxDN.js";import{R as Qa}from"./ReactAppend-B1ftBgow.js";import{a as Be,S as Ge}from"./SetSelectValue-CqxgF8PM.js";import{S as Za}from"./SelectFormGroup-oBRBUlsH.js";import{T as nr}from"./TextareaFormGroup-XpRE9Dgn.js";import{B as ei}from"./BillingDocumentsRest-D86fzCq8.js";import{C as Er}from"./CommercialOrdersRest-C6qYNIty.js";import{B as ti}from"./BasicRest-DFEA_Zn9.js";import{R as ni}from"./ReferralGuidesRest-DXAZw9tJ.js";import{o as Ft,b as Et}from"./magistralesRecordPdf-BLbbUJgP.js";import"./tippy-react.esm-C5v8zKfk.js";import"./permissionScope-Be8AULz2.js";import"./ubigeoInei-D0FnAslC.js";class ri extends ti{constructor(){super(...arguments);Qn(this,"path","admin/delivery-delay-reasons")}}const rr="billing-voucher-preview-modal",dn="billing-voucher-preview-frame";let ve=null;const v=(e,n,i="")=>n.split(".").reduce((o,m)=>o==null?void 0:o[m],e)??i,ue=(e,n="-")=>e==null||e===""?n:`${e}`,un=e=>{if(!e)return"-";const n=`${e}`;return n.includes("T"),n.slice(0,10)},ze=(e,n=2)=>Number(e||0).toFixed(n),Sr=(e="PEN")=>{const n=`${e??"PEN"}`.toUpperCase();return n==="USD"?"US$":n==="EUR"?"EUR":"S/."},ai=(e,n="PEN")=>`${Sr(n)} ${ze(e)}`,$r=e=>[e==null?void 0:e.series,e==null?void 0:e.sequence].filter(Boolean).join("-")||(e==null?void 0:e.code)||"-",Tr=e=>{const n=`${e??""}`.trim().toLowerCase();return n.includes("boleta")?`BOLETA DE VENTA
ELECTRÓNICA`:n.includes("nota")?`NOTA DE CRÉDITO
ELECTRÓNICA`:`FACTURA
ELECTRÓNICA`},ar=e=>Tr(e).replace(`
`," "),ii=e=>v(e,"client.full_name")||v(e,"eventual_client.business_name")||v(e,"eventualClient.business_name")||"-",si=e=>v(e,"client.document_number")||v(e,"eventual_client.document_number")||v(e,"eventualClient.document_number")||"-",kr=e=>v(e,"metadata.delivery_address")||v(e,"commercial_order.delivery_address")||v(e,"commercialOrder.delivery_address")||v(e,"client.full_address")||v(e,"eventual_client.address")||v(e,"eventualClient.address")||"-",li=e=>v(e,"metadata.dispatch_contact_name")||v(e,"commercial_order.dispatch_contact_name")||v(e,"commercialOrder.dispatch_contact_name")||"-",oi=e=>v(e,"metadata.dispatch_contact_phone")||v(e,"commercial_order.dispatch_contact_phone")||v(e,"commercialOrder.dispatch_contact_phone")||v(e,"client.phone")||v(e,"eventual_client.phone")||v(e,"eventualClient.phone")||"-",ci=e=>v(e,"metadata.delivery_reference")||v(e,"commercial_order.delivery_reference")||v(e,"commercialOrder.delivery_reference")||"-",di=e=>v(e,"metadata.source_code")||v(e,"commercial_order.code")||v(e,"commercialOrder.code")||v(e,"service_order.code")||v(e,"serviceOrder.code")||"-",ui=e=>{const n=Number(e||0);return Number.isInteger(n),n.toFixed(4)},kt=e=>{const n=["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve"],i=["diez","once","doce","trece","catorce","quince","dieciseis","diecisiete","dieciocho","diecinueve"],s=["","","veinte","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"],o=["","ciento","doscientos","trescientos","cuatrocientos","quinientos","seiscientos","setecientos","ochocientos","novecientos"];if(e<10)return n[e];if(e<20)return i[e-10];if(e===20)return"veinte";if(e<30)return`veinti${n[e-20]}`;if(e<100){const u=Math.floor(e/10),b=e%10;return b?`${s[u]} y ${n[b]}`:s[u]}if(e===100)return"cien";const m=Math.floor(e/100),c=e%100;return c?`${o[m]} ${kt(c)}`:o[m]},mn=e=>{const n=Math.max(0,Math.floor(Number(e||0)));if(n<1e3)return kt(n);if(n<1e6){const m=Math.floor(n/1e3),c=n%1e3,u=m===1?"mil":`${kt(m)} mil`;return c?`${u} ${kt(c)}`:u}const i=Math.floor(n/1e6),s=n%1e6,o=i===1?"un millon":`${mn(i)} millones`;return s?`${o} ${mn(s)}`:o},mi=(e,n="PEN")=>{const i=Number(e||0),s=Math.floor(Math.abs(i)),o=Math.round((Math.abs(i)-s)*100),m=`${n}`.toUpperCase()==="PEN"?"SOLES":`${n}`.toUpperCase();return`IMPORTE EN LETRAS: ${mn(s).toUpperCase()} CON ${String(o).padStart(2,"0")}/100 ${m}`},Dr=e=>{if(!e)return null;if(typeof e=="string")try{e=JSON.parse(e)}catch{e={lines:e.split(/\r?\n/)}}if(!e||typeof e!="object")return null;const n=ue(e.title,"").trim(),i=ue(e.subtitle,"").trim(),s=(Array.isArray(e.lines)?e.lines:[]).map(o=>ue(o,"").trim()).filter(Boolean);return!n&&!i&&s.length===0?null:{title:n,subtitle:i,lines:s}},pi=()=>{var i;const e=((i=window.jspdf)==null?void 0:i.jsPDF)||window.jsPDF;if(!e)throw new Error("jsPDF no esta disponible");const n=new e({orientation:"portrait",unit:"pt",format:"a4"});if(!n.autoTable)throw new Error("AutoTable no esta disponible");return n},ir=(e,n=90)=>[e,"#toolbar=1","&navpanes=0","&pagemode=none","&scrollbar=1",`&zoom=${n}`].join(""),hi=()=>{let e=document.getElementById(rr);return e||(e=document.createElement("div"),e.id=rr,e.className="modal fade",e.tabIndex=-1,e.setAttribute("aria-hidden","true"),e.innerHTML=`
    <div class="modal-dialog modal-dialog-centered" style="width: 1040px; max-width: calc(100vw - 64px);">
      <div class="modal-content" style="height: min(780px, calc(100vh - 80px));">
        <div class="modal-header py-2">
          <h4 class="modal-title mb-0" data-pdf-title>Comprobante</h4>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body p-0" style="height: calc(100% - 53px); overflow: hidden; background: #525659;">
          <iframe
            id="${dn}"
            title="Vista previa PDF"
            style="width: 100%; height: 100%; border: 0; display: block;"
            allow="fullscreen"
          ></iframe>
        </div>
      </div>
    </div>
  `,document.body.appendChild(e),$(e).on("hidden.bs.modal",()=>{const n=document.getElementById(dn);n&&n.removeAttribute("src"),ve&&(URL.revokeObjectURL(ve),ve=null)}),e)},Ir=(e,n,i=!1)=>{const s=hi(),o=s.querySelector(`#${dn}`),m=s.querySelector("[data-pdf-title]");if(!o)throw new Error("No se encontro el visor PDF");ve&&(URL.revokeObjectURL(ve),ve=null),i?(ve=URL.createObjectURL(e),o.src=ir(ve)):o.src=ir(e),m.textContent=n,$(s).modal("show")},sr=(e,n="Comprobante PDF")=>{Ir(e,n,!1)},W=(e,n,i,s,o,m=82,c=200)=>{e.setFont("helvetica","bold"),e.text(n,s,o),e.text(":",s+m-8,o),e.setFont("helvetica","normal");const u=e.splitTextToSize(ue(i,""),c);return e.text(u,s+m,o),Math.max(11,u.length*9)},fi=(e,n)=>{const i=e.internal.pageSize.getWidth(),s=40,o=178,m=v(n,"business.name","KAMARY PERU SAC"),c=v(n,"branch.address")||v(n,"business.address")||"",u=v(n,"business.tax_number");e.setFont("helvetica","bold"),e.setFontSize(13),e.text(m,s,45),e.setFont("helvetica","normal"),e.setFontSize(8),c&&e.text(e.splitTextToSize(c,330),s,65),e.setDrawColor(0,0,0),e.setLineWidth(.8),e.rect(i-s-o,28,o,78),e.setFont("helvetica","bold"),e.setFontSize(12),u&&e.text(`RUC ${u}`,i-s-o/2,45,{align:"center"}),e.text(Tr(n.document_type),i-s-o/2,64,{align:"center"}),e.text($r(n),i-s-o/2,94,{align:"center"})},bi=(e,n)=>{const i=e.internal.pageSize.getWidth(),s=40,o=124,m=354,c=s+m+10,u=i-c-s;e.setDrawColor(0,0,0),e.rect(s,o,m,76),e.rect(c,o,u,76),e.setFont("helvetica","bold"),e.setFontSize(8),e.text("DATOS DEL CLIENTE",s+5,o+13),e.setFontSize(8);let b=o+26;return b+=W(e,"DOCUMENTO",si(n),s+5,b,84,m-96),b+=W(e,"DENOMINACIÓN",ii(n),s+5,b,84,m-96),W(e,"DIRECCIÓN",kr(n),s+5,b,84,m-96),b=o+18,b+=W(e,"FECHA EMISIÓN",un(n.issue_date),c+5,b,92,u-104),b+=W(e,"MONEDA",n.currency==="PEN"?"Soles":n.currency,c+5,b,92,u-104),b+=W(e,"FECHA VENCIMIENTO",un(n.due_date||n.issue_date),c+5,b,92,u-104),W(e,"ORDEN DE COMPRA",v(n,"metadata.purchase_order",""),c+5,b,92,u-104),224},gi=e=>{const n=Number(e.subtotal||0)===0?0:Math.max(0,Number(e.tax_amount||0)/Number(e.subtotal||1)),i=e.source_type==="commercial_order"&&n>0;return(e.items??[]).filter(s=>(s==null?void 0:s.status)!==!1&&(s==null?void 0:s.status)!==0).map(s=>{var C,S,T,H;const o=Number(s.quantity||0),m=Number(s.unit_price||0),c=Number(s.total||0),u=i?m:m*(1+n),b=i&&n>0?m/(1+n):m,j=i?c:c*(1+n);return[ue(s.item_code,""),ue(s.description,""),ue(((C=s.metadata)==null?void 0:C.unit)||((S=s.metadata)==null?void 0:S.unit_code)||"UNIDAD","UNIDAD"),ue(((T=s.metadata)==null?void 0:T.lot)||s.item_code,"-"),un((H=s.metadata)==null?void 0:H.expiration_date),ui(o),ze(b,4),ze(u,4),ze(j,4)]})},xi=(e,n,i)=>{const s=e.internal.pageSize.getWidth(),o=40,m=n.currency||"PEN",c=Number(n.subtotal||0)?Number(n.tax_amount||0)/Number(n.subtotal||1)*100:0,u=[["DESCUENTO GLOBAL",0],["INAFECTO",0],["GRAVADA",n.subtotal],[`IGV ${ze(c)} %`,n.tax_amount],["TOTAL",n.total]],b=s-o-152,j=s-o-72,C=s-o-8;return e.setFontSize(8),u.forEach(([S,T],H)=>{const B=i+H*11;e.setFont("helvetica","bold"),e.text(S,b,B,{align:"right"}),e.text(Sr(m),j,B),e.text(ze(T),C,B,{align:"right"})}),i+u.length*11},_i=(e,n,i,s,o)=>{const m=n.match(/^((?:Banco|Interbank)[^\d:]*)(.*)$/i);if(!m){e.setFont("helvetica","normal");const j=e.splitTextToSize(n,o);return e.text(j,i,s),Math.max(9,j.length*9)}const[,c,u]=m;e.setFont("helvetica","bold"),e.text(c.trim(),i,s);const b=e.getTextWidth(c.trim());return e.setFont("helvetica","normal"),e.text(u.trim(),i+b+3,s),9},vi=(e,n,i,s,o,m)=>{var b;const c=Dr(v(n,"business.payment_accounts")||v(n,"business.paymentAccounts"));if(e.rect(i,s,o,m),!((b=c==null?void 0:c.lines)!=null&&b.length))return;let u=s+14;e.setFont("helvetica","bold"),e.setFontSize(8),c.title&&(e.text(c.title,i+5,u),u+=10),c.subtitle&&(e.text(c.subtitle,i+5,u),u+=10),e.setFontSize(7.5),c.lines.forEach(j=>{u+=_i(e,j,i+5,u,o-10)})},yi=(e,n,i,s,o,m,c)=>{e.rect(i,s,o,m),e.setFont("helvetica","bold"),e.setFontSize(8),e.text("DATOS DE ENTREGA",i+o/2,s+14,{align:"center"});let u=s+30;u+=W(e,"NOMBRE",li(n),i+5,u,92,o-104),u+=W(e,"CELULAR",oi(n),i+5,u,92,o-104),u+=W(e,"DIRECCIÓN",kr(n),i+5,u,92,o-104),u+=W(e,"REFERENCIA",ci(n),i+5,u,92,o-104),W(e,"FORMA DE PAGO (REF)",c,i+5,u,92,o-104)},Ni=(e,n,i)=>{const s=e.internal.pageSize.getWidth(),o=40,m=[n.payment_method,n.payment_condition].filter(Boolean).join(" | ")||"-",c=n.currency||"PEN";e.rect(o,i,s-o*2,20),e.setFont("helvetica","bold"),e.setFontSize(8),e.text("FORMA DE PAGO AL FACTURAR:",o+5,i+13),e.setFont("helvetica","normal"),e.text(`${m} ${ai(n.total,c)}`,o+160,i+13),i+=32;const u=ue(n.observations,""),b=e.splitTextToSize(u,s-o*2-92),j=Math.max(20,b.length*10+10);return e.rect(o,i,s-o*2,j),e.setFont("helvetica","bold"),e.text("OBSERVACIONES:",o+5,i+13),e.setFont("helvetica","normal"),u&&e.text(b,o+92,i+13),i+j+12},Ar=e=>{var i;const n=Dr(v(e,"business.payment_accounts")||v(e,"business.paymentAccounts"));return Math.max(92,22+((n!=null&&n.title?1:0)+(n!=null&&n.subtitle?1:0)+(((i=n==null?void 0:n.lines)==null?void 0:i.length)??0))*10)},ji=(e,n,i)=>{const s=e.internal.pageSize.getWidth(),o=40,m=[n.payment_method,n.payment_condition].filter(Boolean).join(" | ")||"-",c=10,u=(s-o*2-c)/2,b=Math.max(92,Ar(n));vi(e,n,o,i,u,b),yi(e,n,o+u+c,i,u,b,m),i+=b+12;const j=54;return e.rect(o,i,s-o*2,j),e.setFont("helvetica","normal"),e.setFontSize(7),e.text("Representacion impresa de la ",o+5,i+18),e.setFont("helvetica","bold"),e.text(ar(n.document_type),o+122,i+18),e.setFont("helvetica","normal"),e.text(`, pedido ${di(n)}`,o+122+e.getTextWidth(ar(n.document_type)),i+18),i+j},Ci=e=>{const n=pi(),i=n.internal.pageSize.getWidth(),s=40;fi(n,e);const o=bi(n,e),m=i-s*2;n.autoTable({startY:o,head:[["PRODUCTO","DESCRIPCION","MEDIDA","LOTE","F.V.","CANT.","P. SIN IGV","P. CON IGV","IMPORTE"]],body:gi(e),theme:"plain",margin:{left:s,right:s},styles:{fontSize:6.7,cellPadding:3,lineColor:[120,120,120],lineWidth:0,overflow:"linebreak"},headStyles:{fillColor:[255,255,255],textColor:[0,0,0],fontStyle:"bold",lineWidth:{bottom:.5}},columnStyles:{0:{cellWidth:52},1:{cellWidth:126},2:{cellWidth:48},3:{cellWidth:52},4:{cellWidth:50},5:{cellWidth:42,halign:"right"},6:{cellWidth:54,halign:"right"},7:{cellWidth:54,halign:"right"},8:{cellWidth:54,halign:"right"}}});const c=n.lastAutoTable.finalY,u=Math.max(c+18,o+72),b=xi(n,e,u),j=Math.max(b+26,c+44);n.setDrawColor(0,0,0),n.setLineWidth(.8),n.rect(s,o,m,j-o),n.line(s+5,c+5,s+m-5,c+5),n.setFont("helvetica","bold"),n.setFontSize(8),n.text(mi(e.total,e.currency||"PEN"),s,j-9);let C=j+12;C>620&&(n.addPage(),C=40),C=Ni(n,e,C),C+Math.max(92,Ar(e))+75>n.internal.pageSize.getHeight()&&(n.addPage(),C=40),ji(n,e,C),n.setFont("helvetica","normal"),n.setFontSize(7),n.text(`Pagina 1 de ${n.getNumberOfPages()}`,i-s,n.internal.pageSize.getHeight()-18,{align:"right"}),Ir(n.output("blob"),`Vista previa ${$r(e)}`,!0)},L=new Er,se=new ei,lr=new ri,or=new ni,Ri=["client_kind","=","regular"],wi=[1,2,3,4,5],Fi=["EFECTIVO [CONTADO]","TRANSFERENCIA [CONTADO]","YAPE [CONTADO]","PLIN [CONTADO]","TARJETA [CONTADO]","TRANSFERENCIA [CREDITO]"],cr="ecomsur_oms",St=[{id:"orders",label:"Pedidos",kind:"orders"},{id:"issued",label:"Facturas Emitidas",kind:"billing"},{id:"cancelled",label:"Facturas Anuladas",kind:"billing"},{id:"credit-notes",label:"Notas de Credito",kind:"billing"},{id:"visitors",label:"Pedidos - Visitadores",kind:"static"},{id:"visitors-legacy",label:"Pedidos - Visitadores Legacy",kind:"static"},{id:"platforms",label:"Plataformas",kind:"static"},{id:"multivende",label:"Pedidos - Multivende",kind:"multivende"}],dr={visitors:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},"visitors-legacy":{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"visitor",label:"Visitador",type:"select",options:["Todos","ALICIA ASTO ASTO"]},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","F.E COMPROBANTE","F.E GUIA","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]},platforms:{pageSize:20,exports:["Copiar","Excel"],filters:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],headers:["ACCIONES","ESTADO","COMPROBANTE","TIPO DOCUMENTO","CLIENTE","TOTAL","TIPO DE PAGO","USUARIO","FECHA REGISTRO","USUARIO REGISTRO","CODIGO","EMPRESA"]}},V=(e,{variant:n,title:i,icon:s,onClick:o})=>{const m=$('<button type="button"></button>').addClass(`btn btn-xs btn-soft-${n} commercial-order-action-btn`).attr("title",i).attr("aria-label",i).append($("<i></i>").addClass(s)).on("click",c=>{c.preventDefault(),c.stopPropagation(),o()});e.append(m)},Or=e=>`commercial-order-status-badge commercial-order-status-${`${e??"empty"}`.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-")||"empty"}`,$t=(e,n,i)=>{e.addClass("commercial-order-status-cell"),Qa(e,r.jsx("span",{className:Or(n),children:i(n)}))},lt=()=>({uid:crypto.randomUUID(),article_id:"",article_label:"",article_code:"",article_lot:"",article_name:"",article_unit:"",article_laboratory:"",article_principle:"",presentations:[],presentation_id:"",presentation_units:1,stock_available:0,reserved_quantity:0,price_unit:0,quantity:1,gross_total:0,discount_type:"none",discount_value:0,discount_amount:0,total:0,price_source:"fallback",price_list_code:""}),Ei=e=>{if(!e)return"";const n=(e.name??"").toString().trim().split(" ")[0]??"",i=(e.lastname??"").toString().trim().split(" ")[0]??"",s=`${n} ${i}`.trim(),o=(e.username??"").toString().trim();return s&&o?`${s} (@${o})`:s||(o?`@${o}`:"")},Si=e=>{if(!e)return"-";const n=(e.fullname??"").toString().trim();return n||`${e.name??""} ${e.lastname??""}`.trim()||(e.username??"").toString().trim()||"-"},sn=e=>e&&((e.username??"").toString().trim()||(e.fullname??"").toString().trim()||`${e.name??""} ${e.lastname??""}`.trim())||"-",ot=e=>Number(Number(e||0).toFixed(2)),$i=e=>$("<div>").text(e??"").html(),Ue=e=>{const n=Number(Number(e||0).toFixed(3));return Number.isInteger(n)?`${n}`:`${n}`.replace(/\.?0+$/,"")},fn=e=>(e==null?void 0:e.price_source)==="manual",ur=(e,n,i=!1)=>{const s=Number((e==null?void 0:e.price_unit)||0),o=Number(n==null?void 0:n.price_unit);return!i&&fn(e)||!Number.isFinite(o)||!i&&o<=0&&s>0?s:o},mr=(e,n,i=!1)=>!i&&fn(e)?"manual":(n==null?void 0:n.source)||(e==null?void 0:e.price_source)||"fallback",Ti=e=>{const n=`${e??""}`.replace(",",".").replace(/[^\d.]/g,"");if(!n)return"";const[i,...s]=n.split("."),o=i.replace(/^0+(?=\d)/,"")||(i||s.length?"0":""),m=s.length?`.${s.join("")}`:"";return`${o}${m}`},pr=e=>{const n=Ti(e.target.value);return e.target.value!==n&&(e.target.value=n),Number(n||0)},hr=e=>{Number(e.target.value||0)===0&&e.target.select()},ki=(e,n,i)=>{const s=ot(e),o=Number(i||0);return!Number.isFinite(o)||o<=0||s<=0?0:n==="percent"?Math.min(s,ot(s*Math.min(o,100)/100)):n==="amount"?Math.min(s,ot(o)):0},we=e=>{const n=Number(e.quantity||0),i=Number(e.price_unit||0),s=Number.isFinite(n*i)?ot(n*i):0,o=ki(s,e.discount_type,e.discount_value);return{...e,discount_type:e.discount_type||"none",discount_value:e.discount_type==="none"?0:Number(e.discount_value||0),gross_total:s,discount_amount:o,total:ot(Math.max(0,s-o))}},At=e=>{const n=`${e??""}`.trim().toLowerCase();return n==="boleta"?"Boleta":["nota de pedido","nota_pedido","note_order"].includes(n)?"Nota de pedido":"Factura"},Di=e=>(e==null?void 0:e.billing_documents)??(e==null?void 0:e.billingDocuments)??[],Fe=e=>Di(e)[0]??null,re=e=>e&&([e==null?void 0:e.series,e==null?void 0:e.sequence].filter(Boolean).join("-")||(e==null?void 0:e.code))||"",Dt=e=>!!(`${(e==null?void 0:e.series)??""}`.trim()&&`${(e==null?void 0:e.sequence)??""}`.trim()),fr=e=>{const n=Fe(e);return re(n)||(e==null?void 0:e.referral_guide)||(e==null?void 0:e.guide_number)||(e==null?void 0:e.purchase_order)||"-"},ln=e=>{var n;return At(((n=Fe(e))==null?void 0:n.document_type)??(e==null?void 0:e.document_type))},br=e=>{const n=(e==null?void 0:e.client)??(e==null?void 0:e.eventual_client)??(e==null?void 0:e.eventualClient)??null,i=`${(n==null?void 0:n.document_number)??""}`.trim(),s=`${(n==null?void 0:n.full_name)??(n==null?void 0:n.business_name)??""}`.trim();return[i,s].filter(Boolean).join(" | ")||"-"},Ii=e=>{const n=`${(e==null?void 0:e.payment_method)??""}`.trim(),i=`${(e==null?void 0:e.payment_condition)??""}`.trim();return!n&&!i?"-":!i||n.includes("[")?n||"-":`${n||"-"} [${i.toUpperCase()}]`},gr=e=>{if(!e)return"-";const n=new Date(e);return Number.isNaN(n.getTime())?`${e}`:n.toLocaleString("es-PE",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})},pn=()=>new Date().toISOString().slice(0,10).replaceAll("-","/"),oe=()=>{const e=pn();return`${e} - ${e}`},xr=(e,n)=>new Promise((i,s)=>{const o=document.getElementById(e);if(o){o.dataset.loaded==="true"?i():o.addEventListener("load",i,{once:!0});return}const m=document.createElement("script");m.id=e,m.src=n,m.async=!0,m.onload=()=>{m.dataset.loaded="true",i()},m.onerror=s,document.body.appendChild(m)}),Ai=(e,n)=>{if(document.getElementById(e))return;const i=document.createElement("link");i.id=e,i.rel="stylesheet",i.href=n,document.head.appendChild(i)},Oi=async()=>{var e,n;Ai("commercial-order-daterangepicker-css","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/css/daterangepicker.css"),window.moment||await xr("commercial-order-moment-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/moment.min.js"),(n=(e=window.$)==null?void 0:e.fn)!=null&&n.daterangepicker||await xr("commercial-order-daterangepicker-js","/lte-v1/assets/libs/admin-resources/bootstrap-datepicker/js/daterangepicker.js")},Pr=()=>({orders:{businessId:"",dateRange:oe(),laboratoryId:"",dispatchStatus:""},issued:{businessId:"",dateRange:oe()},cancelled:{businessId:"",dateRange:oe()},"credit-notes":{businessId:"",dateRange:oe()},visitors:{visitor:"ALICIA ASTO ASTO",dateRange:oe()},"visitors-legacy":{visitor:"",dateRange:oe()},platforms:{businessId:"",dateRange:oe()},multivende:{dateRange:oe(),orderVtex:""}}),Pi=()=>{const e=Pr();return{...e,orders:{...e.orders,dateRange:""}}},_r=e=>{const n=`${e??""}`.trim();return n?n.replaceAll("/","-").slice(0,10):""},Mr=e=>{const[n="",i=""]=`${e??""}`.split(/\s+-\s+/);return{start:_r(n),end:_r(i||n)}},Pt=e=>e.filter(Boolean).reduce((n,i)=>n?[n,"and",i]:i,null),bn=(e,n="created_at")=>{const{start:i,end:s}=Mr(e);return Pt([i?[n,">=",`${i} 00:00:00`]:null,s?[n,"<=",`${s} 23:59:59`]:null])},Mi=e=>{const n=["document_type","<>","Nota de credito"];return e==="issued"?[[["local_status","=","sent"],"or",["local_status","=","accepted"],"or",["local_status","=","observed"],"or",["local_status","=","rejected"]],"and",n]:e==="cancelled"?[["local_status","=","cancelled"],"and",n]:e==="credit-notes"?["document_type","=","Nota de credito"]:null},Li=(e,n)=>Pt([["source_type","=","commercial_order"],Mi(e),n!=null&&n.businessId?["business_id","=",Number(n.businessId)]:null,bn(n==null?void 0:n.dateRange,"created_at")]),Bi=e=>Pt([e!=null&&e.businessId?["business_id","=",Number(e.businessId)]:null,e!=null&&e.dispatchStatus?["dispatch_status","=",e.dispatchStatus]:null,bn(e==null?void 0:e.dateRange,"created_at")]),Gi=(e,n)=>{const i=`${(e==null?void 0:e.orderVtex)??""}`.trim();return Pt([["external_source","=",n],bn(e==null?void 0:e.dateRange,"created_at"),i?[["external_order_id","contains",i],"or",["external_checkout_id","contains",i]]:null])},on=e=>{const n=(e==null?void 0:e.client)??(e==null?void 0:e.eventualClient)??(e==null?void 0:e.eventual_client)??null,i=`${(n==null?void 0:n.document_number)??""}`.trim(),s=`${(n==null?void 0:n.full_name)??(n==null?void 0:n.business_name)??""}`.trim();return[i,s].filter(Boolean).join(" | ")||"-"},cn=e=>`${e??""}`.toUpperCase()==="USD"?"Dolares":"Soles",vr=e=>(e==null?void 0:e.external_reference)||(e==null?void 0:e.external_id)||(e==null?void 0:e.external_status)||"-",Ui=e=>{var n,i;return((n=e==null?void 0:e.referenceDocument)==null?void 0:n.code)??((i=e==null?void 0:e.reference_document)==null?void 0:i.code)??"-"},zi=e=>{var n,i;return(e==null?void 0:e.cancel_reason)??((n=e==null?void 0:e.metadata)==null?void 0:n.cancel_reason)??((i=e==null?void 0:e.metadata)==null?void 0:i.reason)??"-"},Vi=e=>{var n,i;return((n=Fe(e))==null?void 0:n.external_status)??((i=Fe(e))==null?void 0:i.external_reference)??"-"},Wi=e=>(e==null?void 0:e.external_order_id)||(e==null?void 0:e.external_checkout_id)||"-",Lr=e=>{var o;const n=hn(e);if(n!=null&&n.delivered_at)return n.delivered_at;const s=((e==null?void 0:e.dispatchAssignments)??(e==null?void 0:e.dispatch_assignments)??[]).find(m=>{var c;return(c=m==null?void 0:m.dispatch)==null?void 0:c.delivered_at});return((o=s==null?void 0:s.dispatch)==null?void 0:o.delivered_at)??""},qi=e=>{const n=e!=null&&e.created_at?new Date(e.created_at):null,i=Lr(e)||(e==null?void 0:e.updated_at),s=i?new Date(i):null;if(!n||!s||Number.isNaN(n.getTime())||Number.isNaN(s.getTime()))return"-";const o=Math.max(0,Math.round((s-n)/6e4)),m=Math.floor(o/1440),c=Math.floor(o%1440/60);return m>0?`${m}d ${c}h`:c>0?`${c}h ${o%60}m`:`${o}m`},D=(e,n="")=>{if(e==null)return n;if(typeof e=="object")return e.address??e.reference??e.name??e.description??n;const i=`${e}`;return i==="[object Object]"?n:i},Yi=e=>`${e??""}`.toUpperCase().includes("CREDITO")?"Credito":"Contado",Hi=e=>{const n=`${e??""}`.trim();return n?n.toUpperCase()==="TRANSFERENCIA"?"TRANSFERENCIA [CONTADO]":n:"EFECTIVO [CONTADO]"},Ki=e=>D(e==null?void 0:e.full_address,D(e==null?void 0:e.address,D(e==null?void 0:e.fiscal_address))),Ji=e=>D(e==null?void 0:e.ubigeo,D(e==null?void 0:e.district_ubigeo,D(e==null?void 0:e.inei_ubigeo))),yr=e=>{const n=`${e??""}`.trim(),i=n.match(/^(client|eventual)-(\d+)$/);return i?i[2]:n},Nr=e=>{var c,u,b;if(e.loading)return e.text;const n=e.data??{},i=e.text||n.name||"",s=(c=n.branch)==null?void 0:c.name,o=(b=(u=n.branch)==null?void 0:u.business)==null?void 0:b.name,m=$("<span>").text(i);return s&&m.append($("<small>").addClass("text-muted ms-1").text(`- ${s}`)),o&&m.append($("<small>").addClass("text-muted ms-1").text(`(${o})`)),m},le=e=>{if(!(e!=null&&e.current))return;const n=$(e.current);n.empty().val(null),n.trigger(n.data("select2")?"change.select2":"change")},Xi=e=>e.article_id?"Unidad base":"Sin presentacion",Qi=(e,n)=>{const i=(e==null?void 0:e.name)||"Presentacion",s=Ue((e==null?void 0:e.units)||1),o=n!=null&&n.article_unit?` ${n.article_unit}`:" unidad(es) base";return`${i} (${s}${o})`},Br=e=>["Factura","Boleta"].includes(At(e)),jr=(e,n)=>{const i=Number(e||0);if(!Br(n))return{subtotal:Number(i.toFixed(2)),taxAmount:0,total:Number(i.toFixed(2))};const s=Number((i/1.18).toFixed(2));return{subtotal:s,taxAmount:Number((i-s).toFixed(2)),total:Number(i.toFixed(2))}},Zi=(e,n="")=>{const i=new Map;return(e??[]).flatMap(s=>{if(!(s!=null&&s.article_id))return[];const o=`${s.article_id}:${s.warehouse_id||n||""}`,m=Number(s.quantity||0),c=Number(s.presentation_units||1)||1,u=Number((m*c).toFixed(3)),b=Number(s.stock_available||0),j=Number(i.get(o)||0),C=Math.max(0,b-j),S=Math.min(u,C),T=Math.max(0,u-S);return i.set(o,j+S),T<=1e-4?[]:[{article:s.article_name||s.article_label||s.article_code||"Articulo",quantity:u,lineQuantity:m,presentationUnits:c,available:C,shortage:T}]})},It=e=>(e==null?void 0:e.referral_guides)??(e==null?void 0:e.referralGuides)??[],Gr=e=>(e==null?void 0:e.external_reference)||[e==null?void 0:e.series,e==null?void 0:e.sequence].filter(Boolean).join("-")||(e==null?void 0:e.code)||"-",es=e=>e&&!["accepted","cancelled"].includes(e.guide_status),ts=e=>(e==null?void 0:e.delivery_evidences)??(e==null?void 0:e.deliveryEvidences)??[],hn=e=>ts(e)[0]??null,ns=e=>(e==null?void 0:e.tracking_events)??(e==null?void 0:e.trackingEvents)??[],Cr=e=>{const n=`${e??""}`.trim();return n.startsWith("blob:")||n.startsWith("data:image/")||/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(n)||n.includes("/delivery-evidence-media/")},Rr=()=>{const e=new Date;return e.setMinutes(e.getMinutes()-e.getTimezoneOffset()),e.toISOString().slice(0,16)},Tt={lat:-12.046374,lng:-77.042793},ce=e=>{const n=Number(e);return Number.isFinite(n)?n:null},Ot=e=>{const n=ce(e);return n===null?"":n.toFixed(7)},de=e=>ce(e==null?void 0:e.lat)!==null&&ce(e==null?void 0:e.lng)!==null,rs=({modalRef:e,position:n,searchText:i,onPositionChange:s,onSearchTextChange:o,onAddressSelected:m,googleMapsApiKey:c,disabled:u=!1})=>{const b=d.useRef(),[j,C]=d.useState(!1),[S,T]=d.useState(""),[H,B]=d.useState([]),q=de(n)?{lat:ce(n.lat),lng:ce(n.lng)}:Tt,G=(g,I=17)=>{const K=ce(g==null?void 0:g.lat),J=ce(g==null?void 0:g.lng);K===null||J===null||!b.current||(b.current.setCenter({lat:K,lng:J}),b.current.setZoom(I))},Ee=g=>{u||(s(g),G(g))};d.useEffect(()=>{if(de(n)){G(q);return}G(Tt,13)},[n==null?void 0:n.lat,n==null?void 0:n.lng]),d.useEffect(()=>{const g=e==null?void 0:e.current;if(!g)return;const I=()=>{setTimeout(()=>{de(n)?G(q):G(Tt,13)},180)};return $(g).on("shown.bs.modal",I),()=>$(g).off("shown.bs.modal",I)},[e,n==null?void 0:n.lat,n==null?void 0:n.lng]);const Se=async()=>{var I,K;if(u)return;const g=`${i??""}`.trim();if(!g){B([]),T("Escribe una direccion para buscar.");return}if(!((K=(I=window.google)==null?void 0:I.maps)!=null&&K.Geocoder)){T("Google Maps aun no termino de cargar.");return}C(!0),T("");try{new window.google.maps.Geocoder().geocode({address:`${g}, Peru`,componentRestrictions:{country:"PE"},region:"PE"},(me,X)=>{if(C(!1),X!=="OK"||!Array.isArray(me)||me.length===0){B([]),T("Sin resultados. Puedes marcar el punto manualmente en el mapa.");return}B(me.slice(0,5).map(ae=>({place_id:ae.place_id,display_name:ae.formatted_address,lat:ae.geometry.location.lat(),lng:ae.geometry.location.lng()})))})}catch(J){C(!1),T(`${J.message}. Puedes marcar el punto manualmente en el mapa.`),B([])}},Mt=g=>{if(u)return;const I={lat:ce(g.lat),lng:ce(g.lng)};s(I),o(g.display_name??""),m(g.display_name??""),G(I),B([])};return r.jsxs("div",{className:"commercial-order-map-picker",children:[r.jsxs("div",{className:"commercial-order-map-search",children:[r.jsxs("div",{children:[r.jsx("label",{className:"form-label",children:"Buscar direccion en mapa"}),r.jsxs("div",{className:"input-group",children:[r.jsx("input",{type:"text",className:"form-control",value:i,disabled:u,onChange:g=>o(g.target.value),onKeyDown:g=>{g.key==="Enter"&&(g.preventDefault(),Se())},placeholder:"Ej. Av. Javier Prado 123, San Isidro"}),r.jsx("button",{type:"button",className:"btn btn-outline-primary",onClick:Se,disabled:j||u,children:j?"Buscando...":"Buscar"})]})]}),r.jsxs("div",{className:"commercial-order-map-coordinates",children:[r.jsx("label",{className:"form-label",children:"Coordenadas"}),r.jsxs("div",{className:"commercial-order-map-coordinate-values",children:[r.jsx("span",{children:Ot(n==null?void 0:n.lat)||"-"}),r.jsx("span",{children:Ot(n==null?void 0:n.lng)||"-"})]})]})]}),H.length>0&&r.jsx("div",{className:"commercial-order-map-results",children:H.map(g=>r.jsx("button",{type:"button",className:"commercial-order-map-result",disabled:u,onClick:()=>Mt(g),children:g.display_name},`${g.place_id}-${g.lat}-${g.lng}`))}),S&&r.jsx("small",{className:"text-muted d-block mt-1",children:S}),r.jsx(Ha,{googleMapsApiKey:c,language:"es",region:"PE",onError:()=>T("No se pudo cargar Google Maps. Revisa la API key y las restricciones de dominio."),children:r.jsx(Ka,{mapContainerClassName:"commercial-order-map-canvas",center:q,zoom:de(n)?17:13,options:{clickableIcons:!u,fullscreenControl:!0,gestureHandling:u?"none":"greedy",mapTypeControl:!0,scrollwheel:!u,streetViewControl:!1},onLoad:g=>{b.current=g,setTimeout(()=>{de(n)?G(q):G(Tt,13)},120)},onClick:g=>{if(u)return;const I={lat:g.latLng.lat(),lng:g.latLng.lng()};Ee(I)},children:de(n)&&r.jsx(Ja,{position:q,draggable:!u,onDragEnd:g=>Ee({lat:g.latLng.lat(),lng:g.latLng.lng()})})})}),r.jsx("small",{className:"text-muted d-block mt-2",children:"Haz clic en el mapa o arrastra el marcador para fijar la ubicacion de entrega."})]})},as=e=>{const n=`${Ya.GMAPS_API_KEY??""}`.trim();return n?r.jsx(rs,{...e,googleMapsApiKey:n}):r.jsx("div",{className:"commercial-order-map-picker",children:r.jsx("div",{className:"commercial-order-map-empty",children:"Configura Google Maps API Key en Sistemas > Datos generales > Integraciones para habilitar el mapa."})})},is=e=>!e||e.status===null||`${e.order_status??""}`=="cancelled"?!1:`${e.dispatch_status??"pending"}`=="pending",ss=e=>!e||e.status===null||e.status===!1||e.status===0?!1:!["draft","cancelled"].includes(`${e.order_status??""}`),Ur=e=>{if(!e)return!1;const n=`${e.local_status??""}`;return["accepted","observed","cancelled"].includes(n)||!!e.external_id},ls=e=>{if(!e)return!1;const n=`${e.local_status??""}`;return["accepted","sent","observed"].includes(n)||!!e.external_id},wr=e=>{if(!(e!=null&&e.id))return"";const n=Fe(e);return ls(n)||`${e.billing_status??""}`=="billed"?`Este pedido ya tiene comprobante ${re(n)||(n==null?void 0:n.code)||"emitido"}. No se pueden modificar datos ni productos despues de emitir.`:""},os=e=>{const n=Fe(e);return n?Ur(n)?{icon:"mdi mdi-file-eye-outline",title:`Previsualizar PDF del comprobante ${re(n)||n.code}`}:Dt(n)?{icon:"mdi mdi-file-eye-outline",title:`Emitir o previsualizar comprobante ${re(n)||n.code}`}:{icon:"mdi mdi-send",title:`Emitir comprobante ${re(n)||n.code}`}:{icon:"mdi mdi-file-send-outline",title:"Generar comprobante de venta para este pedido"}},cs=e=>{if(!e)return[];const n=ns(e).map(c=>({date:c.happened_at??c.created_at,status:[c.title,c.description].filter(Boolean).join(" - ")})),i=[{date:e.created_at,status:"La orden ingreso en el sistema"}];e.approved_at&&["preparing","in_route","delivered","dispatched","billed","closed"].includes(e.order_status)?i.push({date:e.approved_at,status:"La orden paso a preparacion"}):e.approved_at&&e.order_status==="confirmed"?i.push({date:e.approved_at,status:"La orden fue confirmada"}):["preparing","in_route","delivered","dispatched","billed","closed"].includes(e.order_status)&&i.push({date:e.updated_at,status:"La orden paso a preparacion"});const s=(e.dispatch_assignments??e.dispatchAssignments??[]).filter(c=>(c==null?void 0:c.status)!==!1&&(c==null?void 0:c.status)!==0&&(c==null?void 0:c.dispatch)).sort((c,u)=>{var b,j,C,S;return new Date(((b=c==null?void 0:c.dispatch)==null?void 0:b.departed_at)||((j=c==null?void 0:c.dispatch)==null?void 0:j.scheduled_date)||0)-new Date(((C=u==null?void 0:u.dispatch)==null?void 0:C.departed_at)||((S=u==null?void 0:u.dispatch)==null?void 0:S.scheduled_date)||0)}),o=s.find(c=>{var u;return["in_route","delivered","closed"].includes((u=c==null?void 0:c.dispatch)==null?void 0:u.dispatch_status)});o?(i.push({date:o.dispatch.departed_at??o.dispatch.updated_at??o.dispatch.created_at,status:`Manifiesto ${o.dispatch.manifest_code||o.dispatch.code||""}`.trim()}),i.push({date:o.dispatch.departed_at??o.dispatch.updated_at??o.dispatch.created_at,status:"El pedido salio en ruta"})):e.dispatch_status==="in_route"&&i.push({date:e.updated_at,status:"El pedido salio en ruta"}),(e.dispatch_status==="dispatched"||s.some(c=>{var u;return((u=c==null?void 0:c.dispatch)==null?void 0:u.dispatch_status)==="dispatched"}))&&i.push({date:e.updated_at,status:"El pedido paso a despacho"}),It(e).forEach(c=>{i.push({date:c.issue_date??c.created_at??e.updated_at,status:`Guia de remision ${Gr(c)} - ${Fr(c.guide_status)}`})});const m=s.find(c=>{var u;return["delivered","closed"].includes((u=c==null?void 0:c.dispatch)==null?void 0:u.dispatch_status)});return m?i.push({date:m.dispatch.delivered_at??m.dispatch.updated_at??m.dispatch.created_at,status:"El pedido fue entregado"}):e.dispatch_status==="delivered"&&i.push({date:e.updated_at,status:"El pedido fue entregado"}),(e.order_status==="cancelled"||e.dispatch_status==="cancelled")&&i.push({date:e.updated_at,status:"El pedido fue cancelado"}),[...n,...i].filter(c=>c.date).sort((c,u)=>new Date(c.date)-new Date(u.date))},ds=({title:e,config:n})=>{const i=(n==null?void 0:n.pageSize)??20;return r.jsx("div",{className:"row",children:r.jsx("div",{className:"col-12",children:r.jsxs("div",{className:"card",children:[r.jsx("div",{className:"card-header",children:e}),r.jsxs("div",{className:"card-body",children:[r.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2",children:[r.jsxs("div",{className:"d-flex align-items-center gap-2",children:[r.jsx("label",{className:"form-label mb-0",children:"Elementos :"}),r.jsx("select",{className:"form-select form-select-sm commercial-order-page-size",defaultValue:i,children:[10,20,25,50].map(s=>r.jsx("option",{value:s,children:s},`commercial-list-size-${s}`))})]}),r.jsxs("div",{className:"d-flex align-items-center gap-2",children:[r.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),r.jsx("input",{className:"form-control form-control-sm commercial-order-list-search"})]})]}),((n==null?void 0:n.exports)??[]).length>0&&r.jsx("div",{className:"d-flex flex-wrap gap-1 mb-2",children:n.exports.map(s=>r.jsx("button",{type:"button",className:"btn btn-sm btn-light",children:s},`commercial-list-export-${s}`))}),r.jsx("div",{className:"table-responsive commercial-order-legacy-table",children:r.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[r.jsx("thead",{children:r.jsx("tr",{children:((n==null?void 0:n.headers)??[]).map(s=>r.jsx("th",{children:s},`commercial-list-header-${s}`))})}),r.jsx("tbody",{children:r.jsx("tr",{children:r.jsx("td",{colSpan:((n==null?void 0:n.headers)??[]).length||1,className:"text-muted",children:"No existen elementos"})})})]})}),r.jsxs("div",{className:"d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2",children:[r.jsx("span",{className:"text-muted",children:"No hay elementos a mostrar"}),r.jsxs("div",{className:"d-flex align-items-center gap-2 text-muted",children:[r.jsx("span",{children:"Anterior"}),r.jsx("button",{type:"button",className:"btn btn-sm btn-light active",children:"1"}),r.jsx("span",{children:"Siguiente"})]})]})]})]})})})},us=({requiredPermission:e="orders",externalSource:n=null,pageTitle:i="Pedidos comerciales"})=>{var Yn;L.externalSource=null;const s=d.useRef(),o=d.useRef(),m=d.useRef(),c=d.useRef(),u=d.useRef(),b=d.useRef(),j=d.useRef(),C=d.useRef(),S=d.useRef(),T=d.useRef(),H=d.useRef(),B=d.useRef(),q=d.useRef(),G=d.useRef(),Ee=d.useRef(),Se=d.useRef(),Mt=d.useRef(),g=d.useRef(),I=d.useRef(),K=d.useRef(),J=d.useRef(),me=d.useRef(),X=d.useRef(),ae=d.useRef(),zr=d.useRef(),ct=d.useRef(),dt=d.useRef(),Ve=d.useRef(),ut=d.useRef(),mt=d.useRef(),pt=d.useRef(),ht=d.useRef(),ft=d.useRef(),bt=d.useRef(),gt=d.useRef(),xt=d.useRef(),Vr=d.useRef(),Q=d.useRef(),$e=d.useRef(),pe=d.useRef(),Te=d.useRef(),ke=d.useRef(),_t=d.useRef(),Lt=d.useRef({}),[Wr,qr]=d.useState(!1),[De,gn]=d.useState(""),[Z,vt]=d.useState(""),[ee,yt]=d.useState(""),[Ie,Bt]=d.useState(""),[Ae,Gt]=d.useState(""),[te,We]=d.useState(""),[Yr,ye]=d.useState(""),[Ut,zt]=d.useState({lat:"",lng:""}),[Hr,Nt]=d.useState(""),[Kr,xn]=d.useState([]),[qe,jt]=d.useState([]),[ms,Oe]=d.useState([]),[ie,ne]=d.useState([lt()]),[Pe,_n]=d.useState("Factura"),[he,Vt]=d.useState(null),[vn,Jr]=d.useState(null),[Me,Xr]=d.useState(null),[yn,Wt]=d.useState(null),[Ne,qt]=d.useState(""),[Yt,Qr]=d.useState([]),[Ht,Nn]=d.useState(""),[Kt,jn]=d.useState(!1),[E,Zr]=d.useState(n?"multivende":"orders"),[ea,ta]=d.useState([]),[na,ra]=d.useState([]),[Cn,aa]=d.useState(Pr()),[Ye,ia]=d.useState(Pi()),[Ct,sa]=d.useState(""),[k,Jt]=d.useState({recipient_name:"",recipient_document_type:"DNI",recipient_document_number:"",recipient_phone:"",delivered_at:Rr(),evidence_notes:"",evidence_url:"",latitude:"",longitude:""}),la=d.useMemo(()=>{const t=new Er;return t.externalSource=n||cr,t},[n]),Rt=St.find(t=>t.id===E)??St[0],He=Cn[E]??{},Rn=Ye[E]??{},oa=d.useMemo(()=>Bi(Ye.orders),[Ye.orders]),ca=d.useMemo(()=>Li(E,Rn),[E,Rn]),da=d.useMemo(()=>Gi(Ye.multivende,n||cr),[Ye.multivende,n]),ua=d.useMemo(()=>{var a;const t=new URLSearchParams;return De&&t.append("business_id",De),Z&&t.append("business_branch_id",Z),ee&&t.append("warehouse_id",ee),Ie&&t.append("client_id",Ie),Ae&&t.append("eventual_client_id",Ae),te&&t.append("client_distribution_network_id",te),(a=X.current)!=null&&a.value&&t.append("issue_date",X.current.value),`/api/admin/commercial-orders/articles?${t.toString()}`},[De,Z,ee,Ie,Ae,te]),ma=d.useMemo(()=>Z?["business_branch_id","=",Number(Z)]:null,[Z]);d.useEffect(()=>()=>{Ne!=null&&Ne.startsWith("blob:")&&URL.revokeObjectURL(Ne)},[Ne]),d.useEffect(()=>{let t=!0;return Promise.all([se.getBusinesses(),L.getLaboratories()]).then(([a,l])=>{t&&(ta(a),ra(l))}),()=>{t=!1}},[]),d.useEffect(()=>{if(!he)return;const t=()=>Vt(null),a=l=>{l.key==="Escape"&&t()};return document.addEventListener("click",t),document.addEventListener("keydown",a),window.addEventListener("resize",t),window.addEventListener("scroll",t,!0),()=>{document.removeEventListener("click",t),document.removeEventListener("keydown",a),window.removeEventListener("resize",t),window.removeEventListener("scroll",t,!0)}},[he]);const wn=t=>(Lt.current[t]||(Lt.current[t]=d.createRef()),Lt.current[t]);d.useEffect(()=>{ie.forEach(t=>{const a=wn(t.uid);!a.current||!t.article_id||!t.article_label||`${$(a.current).val()}`==`${t.article_id}`||Be(a.current,t.article_id,t.article_label)})},[ie]);const Fn=async(t,a=null)=>{if(!t){xn([]),vt("");return}const p=(await L.getBranchesByBusiness(t)??[]).filter(h=>h.status!==null);if(xn(p),a&&p.some(h=>`${h.id}`==`${a}`)){vt(`${a}`);return}vt("")},En=t=>{if(!t)return;const a=Ki(t),l=Ji(t);a&&Q.current&&(Q.current.value=a),l&&pe.current&&(pe.current.value=l),a&&Nt(a)},Sn=async(t,a=null,l=null)=>{var y;if(!t){jt([]),We(""),Oe([]),ye("");return}const h=(await L.getDistributionNetworks(t)??[]).filter(x=>x.status!==null);jt(h);const f=a||((y=h.find(x=>x.is_default))==null?void 0:y.id);if(f&&h.some(x=>`${x.id}`==`${f}`)){We(`${f}`),await $n(f,null,h);return}We(""),Oe([]),ye(""),En(l)},$n=async(t,a=null,l=null)=>{var x,R;if(!t){Oe([]),ye("");return}let p=[];const h=(l??qe).find(N=>`${N.id}`==`${t}`);(((x=h==null?void 0:h.addresses)==null?void 0:x.length)??0)>0?p=h.addresses:p=await L.getDeliveryAddresses(t);const f=(p??[]).filter(N=>N.status!==null);Oe(f);const y=a||((R=f.find(N=>N.is_default))==null?void 0:R.id);if(y&&f.some(N=>`${N.id}`==`${y}`)){ye(`${y}`),pa(f.find(N=>`${N.id}`==`${y}`));return}ye("")},pa=t=>{t&&(Q.current&&(Q.current.value=D(t.address)),$e.current&&($e.current.value=D(t.reference)),pe.current&&(pe.current.value=D(t.ubigeo)),Te.current&&(Te.current.value=D(t.contact_name)),ke.current&&(ke.current.value=D(t.contact_phone)),Nt(D(t.address)),de({lat:t.latitude,lng:t.longitude})&&zt({lat:Number(t.latitude),lng:Number(t.longitude)}))},Tn=async(t,a={})=>{var f,y,x;const l=a.article_id??t.article_id,p=Number(a.quantity??t.quantity??0),h=a.presentation_id??t.presentation_id;return!l||!ee||p<=0?null:await L.resolvePrice({article_id:l,presentation_id:h||null,quantity:p,business_id:De||null,business_branch_id:Z||null,warehouse_id:ee||null,client_id:Ie||null,eventual_client_id:Ae||null,client_distribution_network_id:te||null,issue_date:((f=X.current)==null?void 0:f.value)||null,commercial_channel:((y=qe.find(R=>`${R.id}`==`${te}`))==null?void 0:y.commercial_channel)||null,segment:((x=qe.find(R=>`${R.id}`==`${te}`))==null?void 0:x.segment)||null})},Xt=async(t=null)=>{const a=t??ie;for(const l of a){if(!l.article_id)continue;const p=await Tn(l);p&&ne(h=>h.map(f=>f.uid!==l.uid?f:we({...f,stock_available:Number(p.stock_available||0),price_unit:ur(f,p),price_source:mr(f,p),price_list_code:p.price_list_code||""})))}},kn=t=>{t==="regular"?(Gt(""),le(K)):t==="eventual"&&(Bt(""),jt([]),We(""),Oe([]),ye(""),le(I))},Qt=async(t=null)=>{var x,R,N,O;qr(!!(t!=null&&t.id)),sa(wr(t)),G.current&&(G.current.value=(t==null?void 0:t.id)??""),Ee.current&&(Ee.current.value=(t==null?void 0:t.code)??"Se genera al guardar"),X.current&&(X.current.value=t!=null&&t.issue_date?t.issue_date.toString().slice(0,10):new Date().toISOString().slice(0,10)),ae.current&&(ae.current.value=t!=null&&t.promised_delivery_at?t.promised_delivery_at.toString().slice(0,10):""),_n(At((t==null?void 0:t.document_type)??"Factura")),ct.current&&(ct.current.value=(t==null?void 0:t.currency)??"PEN"),dt.current&&(dt.current.value=(t==null?void 0:t.payment_condition)??"Contado"),Ve.current&&(Ve.current.value=Hi(t==null?void 0:t.payment_method)),ht.current&&(ht.current.value=(t==null?void 0:t.installments)??1),ft.current&&(ft.current.value=t!=null&&t.first_due_date?t.first_due_date.toString().slice(0,10):""),bt.current&&(bt.current.value=(t==null?void 0:t.order_status)??(t!=null&&t.external_source?"pending":"draft")),gt.current&&(gt.current.value=(t==null?void 0:t.dispatch_status)??"pending"),xt.current&&(xt.current.value=(t==null?void 0:t.billing_status)??"pending"),Q.current&&(Q.current.value=D(t==null?void 0:t.delivery_address)),$e.current&&($e.current.value=D(t==null?void 0:t.delivery_reference)),pe.current&&(pe.current.value=D(t==null?void 0:t.ubigeo)),Te.current&&(Te.current.value=D(t==null?void 0:t.dispatch_contact_name)),ke.current&&(ke.current.value=D(t==null?void 0:t.dispatch_contact_phone)),ut.current&&(ut.current.value=(t==null?void 0:t.purchase_order)??""),mt.current&&(mt.current.value=(t==null?void 0:t.guide_number)??""),pt.current&&(pt.current.value=(t==null?void 0:t.referral_guide)??""),me.current&&(me.current.value=(t==null?void 0:t.doctor_name)??""),_t.current&&(_t.current.value=(t==null?void 0:t.observations)??""),zt({lat:de({lat:t==null?void 0:t.map_lat,lng:t==null?void 0:t.map_lng})?Number(t.map_lat):"",lng:de({lat:t==null?void 0:t.map_lat,lng:t==null?void 0:t.map_lng})?Number(t.map_lng):""}),Nt(D(t==null?void 0:t.delivery_address));const a=t!=null&&t.business_id?`${t.business_id}`:"",l=t!=null&&t.warehouse_id?`${t.warehouse_id}`:"",p=t!=null&&t.client_id?`${t.client_id}`:"",h=t!=null&&t.eventual_client_id?`${t.eventual_client_id}`:"";gn(a),yt(l),Bt(p),Gt(h),a&&((x=t==null?void 0:t.business)!=null&&x.name)?Be(Se.current,a,t.business.name):le(Se),l&&((R=t==null?void 0:t.warehouse)!=null&&R.name)?Be(g.current,l,t.warehouse.name):le(g),p&&((N=t==null?void 0:t.client)!=null&&N.full_name)?Be(I.current,p,`${t.client.document_number??""} - ${t.client.full_name}`.trim()):le(I),h&&((O=t==null?void 0:t.eventual_client)!=null&&O.business_name)?Be(K.current,h,`${t.eventual_client.document_number??""} - ${t.eventual_client.business_name}`.trim()):le(K),t!=null&&t.seller_id&&(t!=null&&t.seller)?Be(J.current,t.seller_id,Ei(t.seller)):le(J);const f=((t==null?void 0:t.items)??[]).map(w=>{var be,ge,xe,_e,F,A,Je,Xe,Qe,Ze,et,tt,nt,rt,at,it;const _=w.article??null,Y=((_==null?void 0:_.presentations)??[]).filter(P=>(P==null?void 0:P.status)!==!1&&(P==null?void 0:P.status)!==0),U=w.presentation??Y[0]??null,Re=Number(w.presentation_units??(U==null?void 0:U.units)??1)||1;return we({uid:crypto.randomUUID(),article_id:w.article_id?`${w.article_id}`:"",article_label:_?`${_.code??""} - ${_.name??""}`.trim():"",article_code:(_==null?void 0:_.code)??w.external_sku??"",article_lot:(_==null?void 0:_.default_lot)??"",article_name:(_==null?void 0:_.name)??"",article_unit:((be=_==null?void 0:_.unit)==null?void 0:be.symbol)??((ge=_==null?void 0:_.unit)==null?void 0:ge.name)??"",article_laboratory:((xe=_==null?void 0:_.laboratory)==null?void 0:xe.name)??"",article_principle:((_e=_==null?void 0:_.activePrinciple)==null?void 0:_e.name)??((F=_==null?void 0:_.active_principle)==null?void 0:F.name)??"",presentations:Y.map(P=>({id:`${P.id}`,name:P.name??"Presentacion",units:Number(P.units||1),price:Number(P.price||0)})),presentation_id:U!=null&&U.id?`${U.id}`:"",presentation_units:Re,stock_available:Number(w.stock_available||0),reserved_quantity:Number(w.reserved_quantity||0),price_unit:Number(w.price_unit||0),quantity:Number(w.quantity||1),discount_type:((Je=(A=w.external_payload)==null?void 0:A.commercial_form)==null?void 0:Je.discount_type)??"none",discount_value:Number(((Qe=(Xe=w.external_payload)==null?void 0:Xe.commercial_form)==null?void 0:Qe.discount_value)||0),discount_amount:Number(((et=(Ze=w.external_payload)==null?void 0:Ze.commercial_form)==null?void 0:et.discount_amount)||0),gross_total:Number(((nt=(tt=w.external_payload)==null?void 0:tt.commercial_form)==null?void 0:nt.gross_total)||0),total:Number(w.total||0),price_source:w.price_source||"fallback",price_list_code:((at=(rt=w==null?void 0:w.price_list_item)==null?void 0:rt.price_list)==null?void 0:at.code)||((it=t==null?void 0:t.price_list)==null?void 0:it.code)||""})}),y=f.length?f:[lt()];ne(y),$(c.current).modal("show"),await Fn((t==null?void 0:t.business_id)??null,(t==null?void 0:t.business_branch_id)??null),p?(await Sn(p,(t==null?void 0:t.client_distribution_network_id)??null),t!=null&&t.client_distribution_network_id&&await $n(t.client_distribution_network_id,(t==null?void 0:t.client_delivery_address_id)??null)):(jt([]),We(""),Oe([]),ye(""))},ha=async t=>{var h,f,y,x,R,N,O,w,_,Y,U,Re,be,ge,xe,_e,F,A,Je,Xe,Qe,Ze,et,tt,nt,rt,at,it,P,Hn,Kn,Jn,Xn;if(t.preventDefault(),Ct){z.fire("Pedido bloqueado",Ct,"info");return}const a={id:((h=G.current)==null?void 0:h.value)||void 0,external_source:n||void 0,business_id:De||null,business_branch_id:Z||null,warehouse_id:ee||null,client_id:Ie||null,eventual_client_id:Ae||null,seller_id:((f=J.current)==null?void 0:f.value)||null,client_distribution_network_id:te||null,client_delivery_address_id:Yr||null,document_type:Pe,currency:((y=ct.current)==null?void 0:y.value)||"PEN",payment_condition:Yi(((x=Ve.current)==null?void 0:x.value)||((R=dt.current)==null?void 0:R.value)||"Contado"),payment_method:((N=Ve.current)==null?void 0:N.value)||"",purchase_order:((w=(O=ut.current)==null?void 0:O.value)==null?void 0:w.trim())||"",guide_number:((Y=(_=mt.current)==null?void 0:_.value)==null?void 0:Y.trim())||"",referral_guide:((Re=(U=pt.current)==null?void 0:U.value)==null?void 0:Re.trim())||"",doctor_name:((ge=(be=me.current)==null?void 0:be.value)==null?void 0:ge.trim())||"",issue_date:((xe=X.current)==null?void 0:xe.value)||"",promised_delivery_at:((_e=ae.current)==null?void 0:_e.value)||null,installments:((F=ht.current)==null?void 0:F.value)||1,first_due_date:((A=ft.current)==null?void 0:A.value)||null,order_status:((Je=bt.current)==null?void 0:Je.value)||(n?"pending":"draft"),dispatch_status:((Xe=gt.current)==null?void 0:Xe.value)||"pending",billing_status:((Qe=xt.current)==null?void 0:Qe.value)||"pending",tax_amount:Ke.taxAmount,delivery_address:((et=(Ze=Q.current)==null?void 0:Ze.value)==null?void 0:et.trim())||"",delivery_reference:((nt=(tt=$e.current)==null?void 0:tt.value)==null?void 0:nt.trim())||"",ubigeo:((at=(rt=pe.current)==null?void 0:rt.value)==null?void 0:at.trim())||"",map_lat:Ot(Ut.lat)||null,map_lng:Ot(Ut.lng)||null,dispatch_contact_name:((P=(it=Te.current)==null?void 0:it.value)==null?void 0:P.trim())||"",dispatch_contact_phone:((Kn=(Hn=ke.current)==null?void 0:Hn.value)==null?void 0:Kn.trim())||"",observations:((Xn=(Jn=_t.current)==null?void 0:Jn.value)==null?void 0:Xn.trim())||"",items:ie.map(M=>({article_id:M.article_id||null,presentation_id:M.presentation_id||null,warehouse_id:ee||null,stock_available:M.stock_available,reserved_quantity:M.reserved_quantity,presentation_units:M.presentation_units,price_unit:M.price_unit,quantity:M.quantity,gross_total:M.gross_total,discount_type:M.discount_type,discount_value:M.discount_value,discount_amount:M.discount_amount,total:M.total,status:!0}))},l=Zi(ie,ee);if(l.length>0){const M=`
        <div class="text-start">
          <p>Hay productos sin stock suficiente. Se reservara lo disponible y el faltante quedara pendiente para preparacion.</p>
          <ul class="mb-0 ps-3">
            ${l.map(Le=>`<li><strong>${$i(Le.article)}</strong>: faltan ${Ue(Le.shortage)} unidad(es) base para completar ${Ue(Le.quantity)}. Cantidad: ${Ue(Le.lineQuantity)} x ${Ue(Le.presentationUnits)}. Disponible: ${Ue(Le.available)}.</li>`).join("")}
          </ul>
        </div>
      `,{isConfirmed:Ua}=await z.fire({title:"Stock insuficiente",html:M,icon:"warning",showCancelButton:!0,confirmButtonText:"Crear de todas formas",cancelButtonText:"Revisar pedido"});if(!Ua)return;a.allow_stock_shortage=!0}await L.save(a)&&($(s.current).dxDataGrid("instance").refresh(),$(c.current).modal("hide"))},fa=async t=>{const a=t.target.value||"";gn(a),yt(""),le(g),await Fn(a,null)},ba=t=>{const a=t.target.value||"";vt(a),yt(""),le(g)},ga=async t=>{const a=t.target.value||"";yt(a),await Xt()},xa=async t=>{var p,h;const a=yr(t.target.value),l=((h=(p=$(t.target).select2("data"))==null?void 0:p[0])==null?void 0:h.data)??null;Bt(a),kn("regular"),En(l),await Sn(a,null,l),await Xt()},_a=async t=>{const a=yr(t.target.value);Gt(a),kn("eventual"),await Xt()},je=(t,a,l)=>{aa(p=>({...p,[t]:{...p[t]??{},[a]:l}}))},Dn=(t=E)=>{var l;const a=t==="multivende"?m:((l=St.find(p=>p.id===t))==null?void 0:l.kind)==="billing"?o:s;return a.current?$(a.current).dxDataGrid("instance"):null},In=(t=E)=>{const a=Dn(t);a&&a.refresh()},An=(t=E)=>{const a=Cn[t]??{};t==="orders"&&L.setFilters({laboratory_id:a.laboratoryId||""}),ia(l=>({...l,[t]:a})),setTimeout(()=>In(t),0)},va=t=>{var a;(a=t==null?void 0:t.preventDefault)==null||a.call(t),An(E)},On=(t=!1)=>{const a=E;t&&An(a),setTimeout(()=>{const l=Dn(a);l!=null&&l.exportToExcel&&l.exportToExcel(!1)},t?350:0)},ya=async({id:t,field:a,value:l})=>{await L.boolean({id:t,field:a,value:l})&&$(s.current).dxDataGrid("instance").refresh()},Pn=t=>{Jr(t),$(H.current).modal("show")},Na=t=>{const a=hn(t);Xr(t),Wt(null),qt(Cr(a==null?void 0:a.evidence_url)?a.evidence_url:""),Jt({recipient_name:(a==null?void 0:a.recipient_name)??(t==null?void 0:t.dispatch_contact_name)??"",recipient_document_type:(a==null?void 0:a.recipient_document_type)??"DNI",recipient_document_number:(a==null?void 0:a.recipient_document_number)??"",recipient_phone:(a==null?void 0:a.recipient_phone)??(t==null?void 0:t.dispatch_contact_phone)??"",delivered_at:a!=null&&a.delivered_at?`${a.delivered_at}`.replace(" ","T").slice(0,16):Rr(),evidence_notes:(a==null?void 0:a.evidence_notes)??"",evidence_url:(a==null?void 0:a.evidence_url)??"",latitude:(a==null?void 0:a.latitude)??"",longitude:(a==null?void 0:a.longitude)??""}),navigator.geolocation&&navigator.geolocation.getCurrentPosition(l=>{Jt(p=>({...p,latitude:p.latitude||l.coords.latitude,longitude:p.longitude||l.coords.longitude}))},()=>{},{enableHighAccuracy:!0,timeout:5e3}),setTimeout(()=>{q.current&&(q.current.value="")},0),$(B.current).modal("show")},ja=t=>{var l;const a=((l=t.target.files)==null?void 0:l[0])??null;Wt(a),qt(a?URL.createObjectURL(a):Cr(k.evidence_url)?k.evidence_url:"")},fe=(t,a)=>Jt(l=>({...l,[t]:a})),Ca=async t=>{if(t.preventDefault(),!(Me!=null&&Me.id))return;const a=(Me.dispatch_assignments??Me.dispatchAssignments??[]).filter(h=>(h==null?void 0:h.status)!==!1&&(h==null?void 0:h.status)!==0&&(h==null?void 0:h.dispatch)).sort((h,f)=>{var y,x;return new Date(((y=f==null?void 0:f.dispatch)==null?void 0:y.scheduled_date)||(f==null?void 0:f.created_at)||0)-new Date(((x=h==null?void 0:h.dispatch)==null?void 0:x.scheduled_date)||(h==null?void 0:h.created_at)||0)})[0],l=new FormData;a!=null&&a.dispatch_id&&l.append("dispatch_id",a.dispatch_id),l.append("recipient_name",k.recipient_name??""),l.append("recipient_document_type",k.recipient_document_type??"DNI"),l.append("recipient_document_number",k.recipient_document_number??""),l.append("recipient_phone",k.recipient_phone??""),l.append("delivered_at",k.delivered_at??""),l.append("evidence_notes",k.evidence_notes??""),l.append("evidence_url",k.evidence_url??""),l.append("latitude",k.latitude??""),l.append("longitude",k.longitude??""),yn&&l.append("evidence_file",yn),await L.saveDeliveryEvidence(Me.id,l)&&(Wt(null),qt(""),q.current&&(q.current.value=""),$(B.current).modal("hide"),$(s.current).dxDataGrid("instance").refresh())},Mn=async t=>{const a=It(t)[0];if(a){if(es(a)){const p=await z.fire({title:"Guia de remision",text:`La guia ${Gr(a)} esta ${Fr(a.guide_status).toLowerCase()}.`,icon:"question",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Ver PDF",cancelButtonText:"Cancelar"});if(p.isConfirmed){const h=await or.issue(a.id);if(!(h!=null&&h.data))return;$(s.current).dxDataGrid("instance").refresh(),await Ft(Et.referralGuide(h.data));return}if(!p.isDenied)return}await Ft(Et.referralGuide(a));return}const l=await or.prepareFromCommercialOrder(t.id);l!=null&&l.data&&($(s.current).dxDataGrid("instance").refresh(),await Ft(Et.referralGuide(l.data)))},Ra=async t=>{var l;if(!(t!=null&&t.id)||t.items&&(t.business||t.commercial_order||t.commercialOrder))return t;const a=await se.paginate({skip:0,take:1,isLoadingAll:!0,filter:["id","=",Number(t.id)]});return((l=a==null?void 0:a.data)==null?void 0:l[0])??t},Ln=async t=>{var p;const a=`${(t==null?void 0:t.local_status)??"pending"}`=="pending"?((p=await se.prepareVoucher(t.id))==null?void 0:p.data)??t:t,l=await Ra(a);if(!Dt(l)){await z.fire({title:"Comprobante no preparado",text:"Primero genera serie y correlativo del comprobante.",icon:"warning",confirmButtonText:"Entendido"});return}Ci(l)},wa=async t=>{var p;let a=Fe(t);if(a&&Ur(a)){sr(se.downloadUrl(a.id,"pdf"),`Comprobante ${re(a)||a.code}`);return}if(a){const h=await z.fire({title:"Emitir comprobante",text:Dt(a)?`El comprobante ${re(a)||a.code} ya esta preparado. Puedes emitirlo o previsualizarlo.`:`Se emitira ${re(a)||a.code} usando el conector configurado.`,icon:"question",showCancelButton:!0,showDenyButton:Dt(a),confirmButtonText:"Emitir",denyButtonText:"Previsualizar PDF",cancelButtonText:"Cancelar"});if(h.isDenied){await Ln(a);return}if(!h.isConfirmed)return}else{if(!ss(t)){await z.fire({title:"Comprobante no disponible",text:"Primero envia el pedido a preparacion o confirma el pedido. Los pedidos en borrador no se pueden facturar.",icon:"warning",confirmButtonText:"Entendido"});return}const h=ln(t);if(!(await z.fire({title:"Generar comprobante",text:`Se generara un comprobante ${h} para el pedido ${t.code}.`,icon:"question",showCancelButton:!0,confirmButtonText:"Generar",cancelButtonText:"Cancelar"})).isConfirmed)return;const y=await se.save({commercial_order_id:t.id,document_type:h});if(!((p=y==null?void 0:y.data)!=null&&p.id))return;const x=await se.prepareVoucher(y.data.id);a=(x==null?void 0:x.data)??y.data,$(s.current).dxDataGrid("instance").refresh();const R=await z.fire({title:"Comprobante generado",text:`Se genero ${re(a)||a.code}. Puedes emitirlo o previsualizarlo ahora.`,icon:"success",showCancelButton:!0,showDenyButton:!0,confirmButtonText:"Emitir",denyButtonText:"Previsualizar PDF",cancelButtonText:"Cerrar"});if(R.isDenied){await Ln(a);return}if(!R.isConfirmed)return}await se.issue(a.id)&&$(s.current).dxDataGrid("instance").refresh()},Fa=async t=>{const{isConfirmed:a}=await z.fire({title:"Eliminar pedido comercial",text:"Estas seguro de eliminar este pedido comercial? Esta accion no se puede revertir",icon:"warning",showCancelButton:!0,confirmButtonText:"Si, eliminar",cancelButtonText:"Cancelar"});!a||!await L.delete(t)||$(s.current).dxDataGrid("instance").refresh()},Ea=()=>{b.current&&(b.current.value=""),$(u.current).modal("show"),setTimeout(()=>{var t;return(t=b.current)==null?void 0:t.focus()},150)},Sa=async t=>{var l,p;t.preventDefault();const a=((p=(l=b.current)==null?void 0:l.value)==null?void 0:p.trim())||"";if(!a){await z.fire({title:"CHECK OUT ID requerido",text:"Ingresa el CHECK OUT ID del pedido Multivende.",icon:"warning",confirmButtonText:"Entendido"});return}await z.fire({title:"Integracion pendiente",text:`El formulario ya captura el CHECK OUT ID ${a}. Falta conectar el servicio de Multivende para registrar el pedido automaticamente.`,icon:"info",confirmButtonText:"Aceptar"})},Bn=()=>{C.current&&(C.current.value=""),S.current&&(S.current.value=""),T.current&&(T.current.value="1")},Gn=async()=>{jn(!0);try{const t=await lr.paginate({take:100,skip:0,requireTotalCount:!0,sort:[{selector:"id",desc:!1}]});Qr((t==null?void 0:t.data)??[])}finally{jn(!1)}},$a=async()=>{Bn(),Nn(""),$(j.current).modal("show"),await Gn(),setTimeout(()=>{var t;return(t=S.current)==null?void 0:t.focus()},150)},Ta=t=>{var a;C.current&&(C.current.value=(t==null?void 0:t.id)??""),S.current&&(S.current.value=(t==null?void 0:t.description)??""),T.current&&(T.current.value=t!=null&&t.status?"1":"0"),(a=S.current)==null||a.focus()},ka=async()=>{var l,p,h,f;const t=((p=(l=S.current)==null?void 0:l.value)==null?void 0:p.trim())||"";if(!t){await z.fire({title:"Motivo requerido",text:"Ingresa la descripcion del motivo de retraso.",icon:"warning",confirmButtonText:"Entendido"});return}await lr.save({id:((h=C.current)==null?void 0:h.value)||void 0,description:t,status:((f=T.current)==null?void 0:f.value)==="1"})&&(Bn(),await Gn())},Da=async(t,a)=>{var w,_,Y,U,Re,be,ge,xe,_e;$(a.target).data("select2")&&$(a.target).select2("close");const l=(w=$(a.target).select2("data"))==null?void 0:w[0],p=(l==null?void 0:l.data)??null,h=a.target.value||"";if(!h){ne(F=>F.map(A=>A.uid===t?{...lt(),uid:A.uid}:A));return}const f=p??await L.getArticleById(h),y=((f==null?void 0:f.presentations)??[]).filter(F=>(F==null?void 0:F.status)!==!1&&(F==null?void 0:F.status)!==0),x=y[0]??null,R=f?`${f.code??""} - ${f.name??""}`.trim():(l==null?void 0:l.text)??h,N={article_id:h,article_label:R,article_code:(f==null?void 0:f.code)??"",article_lot:(f==null?void 0:f.default_lot)??"",article_name:(f==null?void 0:f.name)??"",article_unit:((_=f==null?void 0:f.unit)==null?void 0:_.symbol)??((Y=f==null?void 0:f.unit)==null?void 0:Y.name)??"",article_laboratory:((U=f==null?void 0:f.laboratory)==null?void 0:U.name)??"",article_principle:((Re=f==null?void 0:f.activePrinciple)==null?void 0:Re.name)??((be=f==null?void 0:f.active_principle)==null?void 0:be.name)??"",presentations:y.map(F=>({id:`${F.id}`,name:F.name??"Presentacion",units:Number(F.units||1),price:Number(F.price||0)})),presentation_id:x?`${x.id}`:"",presentation_units:Number((x==null?void 0:x.units)||1),quantity:1};ne(F=>F.map(A=>A.uid===t?we({...A,...N}):A));const O=await L.resolvePrice({article_id:h,presentation_id:x?`${x.id}`:null,quantity:1,business_id:De||null,business_branch_id:Z||null,warehouse_id:ee||null,client_id:Ie||null,eventual_client_id:Ae||null,client_distribution_network_id:te||null,issue_date:((ge=X.current)==null?void 0:ge.value)||null,commercial_channel:((xe=qe.find(F=>`${F.id}`==`${te}`))==null?void 0:xe.commercial_channel)||null,segment:((_e=qe.find(F=>`${F.id}`==`${te}`))==null?void 0:_e.segment)||null});O&&ne(F=>F.map(A=>A.uid===t?we({...A,...N,stock_available:Number(O.stock_available||0),price_unit:Number(O.price_unit||0),price_source:O.source||"fallback",price_list_code:O.price_list_code||""}):A))},Zt=async(t,a,l)=>{const p=ie.find(R=>R.uid===t);if(!p)return;const h=a==="presentation_id"?p.presentations.find(R=>`${R.id}`==`${l}`):null,f=we({...p,[a]:l,...a==="presentation_id"?{presentation_units:Number((h==null?void 0:h.units)||1)}:{}});if(a==="price_unit"&&(f.price_source="manual",f.price_list_code=""),ne(R=>R.map(N=>N.uid===t?f:N)),!["quantity","presentation_id"].includes(a))return;const y=f.presentations.find(R=>`${R.id}`==`${a==="presentation_id"?l:f.presentation_id}`),x=await Tn(f,{quantity:a==="quantity"?l:f.quantity,presentation_id:a==="presentation_id"?l:f.presentation_id});x&&ne(R=>R.map(N=>N.uid!==t?N:we({...N,presentation_units:Number((y==null?void 0:y.units)||N.presentation_units||1),stock_available:Number(x.stock_available||0),price_unit:ur(N,x,a==="presentation_id"),price_source:mr(N,x,a==="presentation_id"),price_list_code:a==="presentation_id"?x.price_list_code||"":fn(N)?N.price_list_code:x.price_list_code||""})))},Ia=(t,a)=>{const l=Number(a||0);ne(p=>p.map(h=>h.uid!==t?h:we({...h,discount_type:l>0?"percent":"none",discount_value:l>0?l:0})))},Aa=(t,a)=>{a.preventDefault(),a.stopPropagation();const l=a.currentTarget.getBoundingClientRect();Vt(p=>(p==null?void 0:p.uid)===t?null:{uid:t,top:l.bottom+4,left:l.left,width:Math.max(l.width,130)})},Un=(t,a)=>{Ia(t,a),Vt(null)},Oa=()=>ne(t=>[...t,lt()]),Pa=t=>{ne(a=>{const l=a.filter(p=>p.uid!==t);return l.length?l:[lt()]})},zn=d.useMemo(()=>ie.reduce((t,a)=>t+Number(a.total||0),0),[ie]),Ke=d.useMemo(()=>jr(zn,Pe),[zn,Pe]),Ce=Ct!=="",Vn=d.useMemo(()=>cs(vn),[vn]),en=d.useMemo(()=>{const t=Ht.trim().toLowerCase();return t?Yt.filter(a=>[a.description,a.status?"Activo":"Inactivo",sn(a.creator),gr(a.created_at)].some(l=>`${l??""}`.toLowerCase().includes(t))):Yt},[Yt,Ht]),Ma=(t,a)=>r.jsxs("div",{className:`commercial-order-filter-field commercial-order-filter-${a.key}`,children:[r.jsxs("label",{className:"form-label",children:[a.label,a.helper&&r.jsxs("span",{className:"commercial-order-filter-helper",children:[" ",a.helper]})]}),a.type==="business"?r.jsxs("select",{className:"form-select",value:He[a.key]??"",onChange:l=>je(t,a.key,l.target.value),children:[r.jsx("option",{value:"",children:"Todos"}),ea.map(l=>r.jsx("option",{value:l.id,children:l.name},`commercial-order-filter-business-${l.id}`))]}):a.type==="laboratory"?r.jsxs("select",{className:"form-select",value:He[a.key]??"",onChange:l=>je(t,a.key,l.target.value),children:[r.jsx("option",{value:"",children:"Todos"}),na.map(l=>r.jsx("option",{value:l.id,children:l.name},`commercial-order-filter-laboratory-${l.id}`))]}):a.type==="select"?r.jsx("select",{className:"form-select",value:He[a.key]??"",onChange:l=>je(t,a.key,l.target.value),children:(a.options??[]).map(l=>r.jsx("option",{value:l.value??l,children:l.label??l},`commercial-order-filter-${a.key}-${l.value??l}`))}):a.type==="dateRange"?r.jsx("input",{className:"form-control commercial-order-date-range-input","data-tab-id":t,value:He[a.key]??"",onChange:l=>je(t,a.key,l.target.value),placeholder:a.placeholder??"YYYY/MM/DD - YYYY/MM/DD"}):r.jsx("input",{className:"form-control",value:He[a.key]??"",onChange:l=>je(t,a.key,l.target.value),placeholder:a.placeholder??""})]},`commercial-order-main-filter-${t}-${a.key}`),tn={orders:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"laboratoryId",label:"Laboratorio",helper:"(Solo para Reporte con Visitadores)",type:"laboratory"},{key:"dispatchStatus",label:"Despachado",type:"select",options:[{value:"",label:"Seleccionar"},{value:"dispatched",label:"Pedidos despachados"},{value:"pending",label:"Pedidos sin despachar"}]}],issued:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],cancelled:[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],"credit-notes":[{key:"businessId",label:"Empresa",type:"business"},{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"}],multivende:[{key:"dateRange",label:"Fecha Registro (Inicio - Fin):",type:"dateRange"},{key:"orderVtex",label:"Pedido VTEX",type:"text",placeholder:"Numero de pedido"}]}[E]??((Yn=dr[E])==null?void 0:Yn.filters)??[],Wn=tn.some(t=>t.type==="dateRange");d.useEffect(()=>{if(!Wn)return;let t=!0;return Oi().then(()=>{var a,l;!t||!((l=(a=window.$)==null?void 0:a.fn)!=null&&l.daterangepicker)||!window.moment||(window.moment.locale("es"),$(".commercial-order-date-range-input").each(function(){const p=$(this),h=p.data("tab-id")||E,f=`${p.val()||oe()}`.trim(),{start:y,end:x}=Mr(f),R=window.moment(y||pn().replaceAll("/","-"),"YYYY-MM-DD"),N=window.moment(x||y||pn().replaceAll("/","-"),"YYYY-MM-DD"),O=p.data("daterangepicker");O&&O.remove(),p.off(".commercialOrderDateRange"),p.daterangepicker({startDate:R,endDate:N,autoUpdateInput:!1,alwaysShowCalendars:!0,linkedCalendars:!1,opens:"center",locale:{format:"YYYY/MM/DD",separator:" - ",applyLabel:"Aplicar",cancelLabel:"Limpiar",fromLabel:"Desde",toLabel:"Hasta",customRangeLabel:"Personalizado",weekLabel:"S",daysOfWeek:["Do","Lu","Ma","Mi","Ju","Vi","Sa"],monthNames:["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"],firstDay:1}},(w,_)=>{const Y=`${w.format("YYYY/MM/DD")} - ${_.format("YYYY/MM/DD")}`;p.val(Y),je(h,"dateRange",Y)}),p.on("cancel.daterangepicker.commercialOrderDateRange",()=>{p.val(""),je(h,"dateRange","")})}))}).catch(()=>{}),()=>{t=!1,$(".commercial-order-date-range-input").each(function(){const a=$(this).data("daterangepicker");a&&a.remove(),$(this).off(".commercialOrderDateRange")})}},[E,Wn]);const wt=r.jsxs("div",{className:"commercial-order-listing-header",children:[r.jsxs("div",{className:"d-flex align-items-center justify-content-between gap-2 mb-2",children:[r.jsx("h4",{className:"header-title mb-0",children:"Listado"}),r.jsx("button",{type:"button",className:"btn btn-xs btn-light",onClick:()=>In(),title:"Refrescar listado",children:r.jsx("i",{className:"mdi mdi-refresh"})})]}),r.jsx("ul",{className:"nav nav-tabs nav-bordered flex-nowrap overflow-auto mb-3",children:St.map(t=>r.jsx("li",{className:"nav-item",children:r.jsx("button",{type:"button",className:`nav-link text-nowrap ${E===t.id?"active":""}`,onClick:()=>Zr(t.id),children:t.label})},`commercial-order-tab-${t.id}`))}),tn.length>0&&r.jsxs("form",{className:"commercial-order-filter-form mb-2",onSubmit:va,children:[tn.map(t=>Ma(E,t)),r.jsxs("div",{className:"commercial-order-filter-actions",children:[r.jsxs("button",{type:"submit",className:"btn btn-outline-primary",children:[r.jsx("i",{className:"mdi mdi-magnify me-1"}),"Filtrar"]}),Rt.kind!=="static"&&r.jsxs("button",{type:"button",className:"btn btn-outline-danger",onClick:()=>On(!0),children:[r.jsx("i",{className:"mdi mdi-file-excel-box me-1"}),"Filtrar a Excel"]}),Rt.kind!=="static"&&r.jsxs("button",{type:"button",className:"btn btn-outline-success",onClick:()=>On(!1),children:[r.jsx("i",{className:"mdi mdi-file-excel-box me-1"}),"Reporte"]}),E==="multivende"&&r.jsxs("button",{type:"button",className:"btn btn-outline-success",children:[r.jsx("i",{className:"mdi mdi-calendar-refresh me-1"}),"Actualizar fechas de entrega"]})]})]}),E==="issued"&&r.jsx("div",{className:"row g-3 mt-1",children:["Total","IGV","IGV Recuperado"].map(t=>r.jsxs("div",{className:"col-12 col-md-4",children:[r.jsx("label",{className:"form-label",children:t}),r.jsx("input",{className:"form-control",value:"0.00",readOnly:!0})]},`commercial-order-total-${t}`))})]}),nn={caption:"Acciones",width:100,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowSorting:!1,cellTemplate:(t,{data:a})=>{t.addClass("commercial-order-actions"),V(t,{variant:"danger",title:"Previsualizar PDF del comprobante",icon:"mdi mdi-file-eye-outline",onClick:()=>sr(se.downloadUrl(a.id,"pdf"),`Comprobante ${re(a)||a.code}`)})}},La=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"dispatch_status",visible:!1,showInColumnChooser:!1}],rn=[{dataField:"source_type",visible:!1,showInColumnChooser:!1},{dataField:"local_status",visible:!1,showInColumnChooser:!1},{dataField:"document_type",visible:!1,showInColumnChooser:!1},{dataField:"business_id",visible:!1,showInColumnChooser:!1},{dataField:"created_at",visible:!1,showInColumnChooser:!1}],Ba=[{dataField:"external_source",visible:!1,showInColumnChooser:!1},{dataField:"external_order_id",visible:!1,showInColumnChooser:!1},{dataField:"external_checkout_id",visible:!1,showInColumnChooser:!1}],qn={issued:[...rn,nn,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:vr},{caption:"Cliente",minWidth:260,calculateCellValue:on},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:t=>cn(t.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}],cancelled:[...rn,nn,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"Cliente",minWidth:260,calculateCellValue:on},{caption:"Motivo",minWidth:180,calculateCellValue:zi},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:t=>cn(t.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"F. Facturacion",dataType:"date",width:130},{dataField:"cancelled_at",caption:"F. Anulacion",dataType:"datetime",width:160}],"credit-notes":[...rn,nn,{dataField:"series",caption:"Serie",width:90},{dataField:"sequence",caption:"Secuencia",width:110},{caption:"SUNAT",width:140,calculateCellValue:vr},{caption:"Doc. Afecto",width:130,calculateCellValue:Ui},{caption:"Cliente",minWidth:260,calculateCellValue:on},{dataField:"currency",caption:"Moneda",width:100,calculateCellValue:t=>cn(t.currency)},{dataField:"subtotal",caption:"Total Gravada",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"tax_amount",caption:"IGV",width:90,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"total",caption:"Importe Factura",width:130,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_method",caption:"Tipo de Pago",width:150},{dataField:"issue_date",caption:"Fecha Facturacion",dataType:"date",width:150}]},Ga=[...Ba,{caption:"Acciones",width:230,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(t,{data:a})=>{const l=It(a).length>0;t.css("text-overflow","unset"),t.addClass("commercial-order-actions"),V(t,{variant:"primary",title:"Editar pedido Multivende",icon:"mdi mdi-pencil",onClick:()=>Qt(a)}),V(t,{variant:"info",title:"Ver tracking del pedido Multivende",icon:"mdi mdi-timeline-clock-outline",onClick:()=>Pn(a)}),V(t,{variant:l?"dark":"warning",title:l?"Ver guia de remision asociada":"Generar guia de remision",icon:l?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>Mn(a)})}},{dataField:"order_status",caption:"E. Pedido",width:130,lookup:Zn(er),cellTemplate:(t,{value:a})=>$t(t,a,tr)},{caption:"E. SUNAT",width:120,calculateCellValue:Vi},{caption:"Pedido VTEX",width:150,calculateCellValue:Wi},{dataField:"external_channel",caption:"Canal",width:130},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:fr},{dataField:"document_type",caption:"Tipo Documento",width:140,calculateCellValue:ln,cellTemplate:(t,{value:a})=>$t(t,a,l=>l||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:300,calculateCellValue:br},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"promised_delivery_at",caption:"F. Entrega Estimada",dataType:"date",width:160},{caption:"F. de Entrega",width:150,dataType:"date",calculateCellValue:Lr},{caption:"Tiempo de Proceso",width:150,calculateCellValue:qi},{dataField:"created_at",caption:"Fecha Registro",dataType:"date",width:140},{dataField:"code",caption:"Codigo",width:130}];return r.jsxs(r.Fragment,{children:[r.jsx("style",{children:`
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
    `}),r.jsxs("div",{className:"commercial-order-top-actions",children:[r.jsxs("button",{type:"button",className:"btn btn-success commercial-order-multivende-action",title:"Ingresar pedido Multivende por CHECK OUT ID",onClick:Ea,children:[r.jsxs("span",{children:[r.jsx("i",{className:"mdi mdi-plus-circle-outline"})," Ingresar pedido multivende"]}),r.jsx("i",{className:"mdi mdi-calendar-month-outline"})]}),r.jsxs("button",{type:"button",className:"btn commercial-order-delay-action",title:"Abrir mantenedor de motivos de retraso de entrega",onClick:$a,children:[r.jsx("span",{children:"Mantenedor Retraso Entrega"}),r.jsx("i",{className:"mdi mdi-cog"})]})]}),E==="orders"&&r.jsx(an,{gridRef:s,title:wt,rest:L,filterValue:oa,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(s.current).dxDataGrid("instance").refresh()}}),t.unshift({widget:"dxButton",location:"after",options:{icon:"add",title:"Agregar",hint:"Agregar pedido comercial",onClick:()=>Qt(null)}})},pageSize:25,exportable:!0,columns:[...La,{caption:"Acciones",width:340,fixed:!0,fixedPosition:"left",allowFiltering:!1,allowExporting:!1,cellTemplate:(t,{data:a})=>{const l=It(a).length>0,p=wr(a);t.css("text-overflow","unset"),t.addClass("commercial-order-actions"),V(t,{variant:"primary",title:p||"Editar datos, cliente, entrega y productos del pedido comercial",icon:p?"mdi mdi-eye-outline":"mdi mdi-pencil",onClick:()=>Qt(a)}),is(a)&&V(t,{variant:"success",title:"Enviar este pedido a preparacion para iniciar picking",icon:"mdi mdi-clipboard-check-outline",onClick:()=>ya({id:a.id,field:"dispatch_status",value:"preparing"})}),V(t,{variant:"info",title:"Ver tracking del pedido: estados, guia, ruta y entrega",icon:"mdi mdi-timeline-clock-outline",onClick:()=>Pn(a)});const h=os(a);V(t,{variant:"secondary",title:h.title,icon:h.icon,onClick:()=>wa(a)}),V(t,{variant:l?"dark":"warning",title:l?"Ver, emitir o descargar la guia de remision asociada al pedido":"Generar guia de remision para este pedido",icon:l?"mdi mdi-eye":"mdi mdi-file-document",onClick:()=>Mn(a)}),V(t,{variant:"success",title:hn(a)?"Ver o actualizar foto y datos de evidencia de entrega":"Registrar foto y datos de evidencia de entrega",icon:"mdi mdi-camera",onClick:()=>Na(a)}),V(t,{variant:"danger",title:"Previsualizar o descargar PDF resumen del pedido comercial",icon:"mdi mdi-file-pdf-box",onClick:()=>Ft(Et.commercialOrder(a))}),V(t,{variant:"danger",title:"Eliminar este pedido comercial del listado",icon:"mdi mdi-delete",onClick:()=>Fa(a.id)})}},{dataField:"order_status",caption:"Estado",width:140,lookup:Zn(er),cellTemplate:(t,{value:a})=>$t(t,a,tr)},{dataField:"voucher_label",caption:"Comprobante",width:130,calculateCellValue:fr},{dataField:"document_type",caption:"Tipo documento",width:130,calculateCellValue:ln,cellTemplate:(t,{value:a})=>$t(t,a,l=>l||"-")},{dataField:"customer_label",caption:"Cliente",minWidth:320,calculateCellValue:br},{dataField:"total",caption:"Total",width:110,dataType:"number",format:{type:"fixedPoint",precision:2}},{dataField:"payment_label",caption:"Tipo de pago",width:170,calculateCellValue:Ii},{dataField:"seller.fullname",caption:"Usuario",width:190,cellTemplate:(t,{data:a})=>t.text(Si(a.seller))},{dataField:"created_at",caption:"Fecha registro",width:130,dataType:"date"},{dataField:"creator.username",caption:"Usuario registro",width:150,cellTemplate:(t,{data:a})=>t.text(sn(a.creator))},{dataField:"code",caption:"Código",width:130},{dataField:"business.name",caption:"Empresa",minWidth:150}]},"orders"),Rt.kind==="billing"&&r.jsx(an,{gridRef:o,title:wt,rest:se,filterValue:ca,pageSize:20,exportable:!0,columns:qn[E]??qn.issued,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar listado",onClick:()=>$(o.current).dxDataGrid("instance").refresh()}})}},`billing-${E}`),E==="multivende"&&r.jsx(an,{gridRef:m,title:wt,rest:la,filterValue:da,pageSize:10,exportable:!0,columns:Ga,toolBar:t=>{t.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar pedidos Multivende",onClick:()=>$(m.current).dxDataGrid("instance").refresh()}})}},"multivende"),Rt.kind==="static"&&r.jsx(ds,{title:wt,config:dr[E]}),r.jsx(st,{modalRef:c,title:Ce?"Ver pedido comercial":Wr?"Editar pedido comercial":"Agregar pedido comercial",size:"xl",dialogClass:"commercial-order-modal-dialog modal-dialog-scrollable",bodyClass:"commercial-order-modal-body",bodyStyle:{maxHeight:"calc(100vh - 150px)",overflowY:"auto",overflowX:"hidden"},btnSubmitText:"Guardar",hideButtonSubmit:Ce,onSubmit:ha,children:r.jsxs("div",{id:"commercial-orders-form-container",children:[r.jsx("input",{ref:G,type:"hidden"}),r.jsx("input",{ref:Ee,type:"hidden"}),r.jsx("input",{ref:X,type:"hidden"}),r.jsx("input",{ref:ae,type:"hidden"}),r.jsx("input",{ref:dt,type:"hidden"}),r.jsx("input",{ref:ht,type:"hidden"}),r.jsx("input",{ref:ft,type:"hidden"}),r.jsx("input",{ref:bt,type:"hidden"}),r.jsx("input",{ref:gt,type:"hidden"}),r.jsx("input",{ref:xt,type:"hidden"}),r.jsx("input",{ref:Vr,type:"hidden",value:Ke.taxAmount,readOnly:!0}),r.jsx("input",{ref:$e,type:"hidden"}),Ce&&r.jsxs("div",{className:"alert alert-warning py-2 mb-2",children:[r.jsx("i",{className:"mdi mdi-lock-outline me-1"}),Ct]}),r.jsxs("fieldset",{className:Ce?"commercial-order-form-readonly":"",disabled:Ce,style:{border:0,margin:0,padding:0,minWidth:0},children:[r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-file-document"}),r.jsx("span",{children:"Datos del pedido"})]}),r.jsxs("div",{className:"row g-2",children:[r.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:r.jsx(Ge,{eRef:Se,label:"Empresa",required:!0,searchAPI:"/api/admin/businesses/paginate",searchBy:"name",dropdownParent:"#commercial-orders-form-container",onChange:fa})}),r.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:r.jsxs(Za,{eRef:Mt,label:"Sede",dropdownParent:"#commercial-orders-form-container",value:Z,onChange:ba,children:[r.jsx("option",{value:"",children:"Sin sede"}),Kr.map(t=>r.jsx("option",{value:t.id,children:t.name},`commercial-order-branch-${t.id}`))]})}),r.jsx("div",{className:"col-12 col-md-6 col-xl-4",children:r.jsx(Ge,{eRef:g,label:"Almacen",required:!0,searchAPI:"/api/admin/warehouses/paginate",searchBy:"name",filter:ma,dropdownParent:"#commercial-orders-form-container",onChange:ga,templateResult:Nr,templateSelection:Nr})}),r.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Doc. venta"}),r.jsxs("select",{ref:zr,className:"form-control",value:Pe,onChange:t=>_n(At(t.target.value)),children:[r.jsx("option",{value:"Factura",children:"Factura"}),r.jsx("option",{value:"Boleta",children:"Boleta"}),r.jsx("option",{value:"Nota de pedido",children:"Nota de pedido"})]})]}),r.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Moneda"}),r.jsxs("select",{ref:ct,className:"form-control",children:[r.jsx("option",{value:"PEN",children:"PEN"}),r.jsx("option",{value:"USD",children:"USD"}),r.jsx("option",{value:"EUR",children:"EUR"})]})]}),r.jsxs("div",{className:"col-12 col-sm-6 col-lg-4 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Forma de pago"}),r.jsxs("select",{ref:Ve,className:"form-control",children:[r.jsx("option",{value:"",children:"Seleccione"}),Fi.map(t=>r.jsx("option",{value:t,children:t},`commercial-order-payment-${t}`))]})]})]})]}),r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-account"}),r.jsx("span",{children:"Cliente y entrega"})]}),r.jsxs("div",{className:"row g-2",children:[r.jsx("div",{className:"col-12 col-xl-6",children:r.jsx(Ge,{eRef:I,label:"Cliente regular",searchAPI:"/api/admin/clients/paginate",searchBy:"full_name",selectBy:"entity_id",filter:Ri,dropdownParent:"#commercial-orders-form-container",onChange:xa})}),r.jsx("div",{className:"col-12 col-xl-6",children:r.jsx(Ge,{eRef:K,label:"Cliente eventual",searchAPI:"/api/admin/eventual-clients/paginate",searchBy:"business_name",dropdownParent:"#commercial-orders-form-container",onChange:_a})}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Orden de compra"}),r.jsx("input",{ref:ut,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Numero de guia"}),r.jsx("input",{ref:mt,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Guia remision"}),r.jsx("input",{ref:pt,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Ubigeo"}),r.jsx("input",{ref:pe,className:"form-control"})]}),r.jsx("div",{className:"col-12 col-xl-4",children:r.jsx(nr,{eRef:Q,label:"Direccion de entrega",rows:2})}),r.jsx("div",{className:"col-12",children:r.jsx(as,{modalRef:c,position:Ut,searchText:Hr,onSearchTextChange:Nt,onPositionChange:zt,onAddressSelected:t=>{Q.current&&(Q.current.value=t)},disabled:Ce})}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-5",children:[r.jsx("label",{className:"form-label",children:"Nombre contacto entrega"}),r.jsx("input",{ref:Te,className:"form-control"})]}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-3",children:[r.jsx("label",{className:"form-label",children:"Celular contacto entrega"}),r.jsx("input",{ref:ke,className:"form-control"})]}),r.jsx(Ge,{eRef:J,label:"Vendedor",col:"col-12 col-md-6 col-xl-2",searchAPI:"/api/admin/users/paginate",searchBy:"fullname",dropdownParent:"#commercial-orders-form-container"}),r.jsxs("div",{className:"col-12 col-md-6 col-xl-2",children:[r.jsx("label",{className:"form-label",children:"Medico"}),r.jsx("input",{ref:me,className:"form-control"})]})]})]}),r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-detail-toolbar",children:[r.jsxs("div",{className:"commercial-order-section-title mb-0",children:[r.jsx("i",{className:"mdi mdi-format-list-bulleted"}),r.jsx("span",{children:"Detalle del pedido"})]}),r.jsx("button",{type:"button",className:"btn btn-sm btn-outline-primary",onClick:Oa,children:"Agregar item"})]}),r.jsx("div",{className:"table-responsive border rounded commercial-order-detail-table","data-select2-local-dropdown":"true",children:r.jsxs("table",{className:"table table-sm align-middle mb-0",children:[r.jsx("thead",{children:r.jsxs("tr",{children:[r.jsx("th",{style:{minWidth:96},children:"Descuento"}),r.jsx("th",{style:{minWidth:104},children:"Codigo"}),r.jsx("th",{style:{minWidth:88},children:"Codigo lote"}),r.jsx("th",{style:{minWidth:280},children:"Nombre"}),r.jsx("th",{style:{minWidth:128},children:"Laboratorio"}),r.jsx("th",{style:{minWidth:130},children:"Principio activo"}),r.jsx("th",{style:{minWidth:110},children:"Unidad"}),r.jsx("th",{style:{minWidth:64},children:"Stock"}),r.jsx("th",{style:{minWidth:112},children:"P. venta con IGV"}),r.jsx("th",{style:{minWidth:112},children:"P. venta sin IGV"}),r.jsx("th",{style:{minWidth:92},children:"Cantidad"}),r.jsx("th",{style:{minWidth:96},children:"Total desc."}),r.jsx("th",{style:{minWidth:96},children:"Sub total"}),r.jsx("th",{style:{width:70}})]})}),r.jsx("tbody",{children:ie.map(t=>r.jsxs("tr",{children:[r.jsx("td",{children:r.jsxs("div",{className:"commercial-order-discount-cell",children:[r.jsxs("button",{type:"button",className:"commercial-order-discount-trigger",onClick:a=>Aa(t.uid,a),children:[r.jsx("span",{children:t.discount_type==="percent"&&Number(t.discount_value||0)>0?`${Number(t.discount_value)}%`:"Seleccione"}),r.jsx("i",{className:"mdi mdi-chevron-down"})]}),(he==null?void 0:he.uid)===t.uid&&r.jsxs("div",{className:"commercial-order-discount-menu",style:{top:he.top,left:he.left,minWidth:he.width},onClick:a=>a.stopPropagation(),children:[r.jsx("button",{type:"button",className:`commercial-order-discount-option ${t.discount_type!=="percent"?"active":""}`,onClick:()=>Un(t.uid,""),children:"Seleccione"}),wi.map(a=>r.jsxs("button",{type:"button",className:`commercial-order-discount-option ${t.discount_type==="percent"&&Number(t.discount_value||0)===a?"active":""}`,onClick:()=>Un(t.uid,a),children:[a,"%"]},`commercial-order-discount-floating-${t.uid}-${a}`))]})]})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_code||"-"})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_lot||"-"})}),r.jsx("td",{className:"commercial-order-article-name",children:r.jsx(Ge,{eRef:wn(t.uid),searchAPI:ua,searchBy:"name",dropdownParent:"#commercial-orders-form-container",disabled:!ee,onChange:a=>Da(t.uid,a)})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_laboratory||"-"})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_principle||"-"})}),r.jsx("td",{children:r.jsxs("div",{children:[r.jsx("div",{className:"commercial-order-readonly-cell",children:t.article_unit||"-"}),t.presentations.length>0&&r.jsxs("select",{className:"form-control mt-1","data-no-select2":"true",value:t.presentation_id,disabled:!t.article_id,onChange:a=>Zt(t.uid,"presentation_id",a.target.value),children:[r.jsx("option",{value:"",children:Xi(t)}),t.presentations.map(a=>r.jsx("option",{value:a.id,children:Qi(a,t)},`commercial-order-presentation-${t.uid}-${a.id}`))]})]})}),r.jsx("td",{children:r.jsx("div",{className:"commercial-order-readonly-cell",children:Number(t.stock_available||0).toFixed(2)})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:t.price_unit,onFocus:hr,onChange:a=>Zt(t.uid,"price_unit",pr(a))})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:jr(Number(t.price_unit||0),Pe).subtotal.toFixed(2),readOnly:!0})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0.01",className:"form-control",value:t.quantity,onFocus:hr,onChange:a=>Zt(t.uid,"quantity",pr(a))})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(t.discount_amount||0).toFixed(2),readOnly:!0})}),r.jsx("td",{children:r.jsx("input",{type:"number",step:"0.01",min:"0",className:"form-control",value:Number(t.total||0).toFixed(2),readOnly:!0})}),r.jsx("td",{className:"text-end",children:r.jsx("button",{type:"button",className:"btn btn-sm btn-outline-danger",onClick:()=>Pa(t.uid),children:r.jsx("i",{className:"mdi mdi-close"})})})]},t.uid))}),r.jsxs("tfoot",{children:[r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:Br(Pe)?"Total gravada":"Sub total"}),r.jsx("th",{children:Ke.subtotal.toFixed(2)}),r.jsx("th",{})]}),r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:"Descuento global"}),r.jsx("th",{children:"0.00"}),r.jsx("th",{})]}),r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:"IGV"}),r.jsx("th",{children:Ke.taxAmount.toFixed(2)}),r.jsx("th",{})]}),r.jsxs("tr",{children:[r.jsx("th",{colSpan:"12",className:"text-end",children:"Total"}),r.jsx("th",{children:Ke.total.toFixed(2)}),r.jsx("th",{})]})]})]})})]}),r.jsxs("section",{className:"commercial-order-form-section mb-0",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-note-text"}),r.jsx("span",{children:"Observaciones"})]}),r.jsx(nr,{eRef:_t,label:"Observaciones",rows:3,disabled:Ce})]})]})]})}),r.jsx(st,{modalRef:u,title:"Ingresar pedido multivende",size:"lg",btnSubmitText:"Registrar",onSubmit:Sa,children:r.jsx("div",{className:"commercial-order-multivende-form",children:r.jsxs("section",{className:"commercial-order-form-section",children:[r.jsxs("div",{className:"commercial-order-section-title",children:[r.jsx("i",{className:"mdi mdi-file-document-plus-outline"}),r.jsx("span",{children:"General"})]}),r.jsxs("div",{className:"mb-2",children:[r.jsxs("label",{className:"form-label",children:["Ingrese el ",r.jsx("strong",{children:"CHECK OUT ID"})]}),r.jsx("input",{ref:b,name:"external_checkout_id",className:"form-control",autoComplete:"off"})]})]})})}),r.jsx(st,{modalRef:j,title:"Mantenedor motivo retraso entrega",size:"lg",hideFooter:!0,onSubmit:t=>{t.preventDefault(),ka()},children:r.jsxs("div",{className:"commercial-order-delay-maintainer",children:[r.jsxs("div",{className:"commercial-order-delay-actions",children:[r.jsxs("button",{type:"button",className:"btn btn-sm btn-light","data-bs-dismiss":"modal",children:[r.jsx("i",{className:"mdi mdi-close me-1"})," Cerrar"]}),r.jsxs("button",{type:"submit",className:"btn btn-sm btn-outline-primary",children:[r.jsx("i",{className:"mdi mdi-plus me-1"})," Registrar"]})]}),r.jsx("input",{ref:C,type:"hidden"}),r.jsxs("div",{className:"row",children:[r.jsxs("div",{className:"col-12 mb-3",children:[r.jsx("label",{className:"form-label",children:"Descripcion:"}),r.jsx("input",{ref:S,className:"form-control",autoComplete:"off"})]}),r.jsxs("div",{className:"col-12 mb-3",children:[r.jsx("label",{className:"form-label",children:"Estado:"}),r.jsxs("select",{ref:T,className:"form-control",defaultValue:"1",children:[r.jsx("option",{value:"1",children:"Activo"}),r.jsx("option",{value:"0",children:"Inactivo"})]})]})]}),r.jsx("hr",{}),r.jsxs("div",{className:"commercial-order-delay-filter",children:[r.jsx("label",{className:"form-label mb-0",children:"Filtrar :"}),r.jsx("input",{className:"form-control form-control-sm",value:Ht,onChange:t=>Nn(t.target.value)})]}),r.jsx("div",{className:"table-responsive commercial-order-delay-table",children:r.jsxs("table",{className:"table table-sm table-bordered table-striped align-middle mb-0",children:[r.jsx("thead",{children:r.jsxs("tr",{children:[r.jsx("th",{className:"text-center",children:"Acciones"}),r.jsx("th",{className:"text-center",children:"Estado"}),r.jsx("th",{children:"Motivo"}),r.jsx("th",{children:"Fecha registro"}),r.jsx("th",{children:"Usuario registro"})]})}),r.jsxs("tbody",{children:[Kt&&r.jsx("tr",{children:r.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"Cargando motivos..."})}),!Kt&&en.length===0&&r.jsx("tr",{children:r.jsx("td",{colSpan:"5",className:"text-center text-muted py-3",children:"No existen elementos"})}),!Kt&&en.map(t=>r.jsxs("tr",{children:[r.jsx("td",{className:"text-center",children:r.jsx("button",{type:"button",className:"btn btn-xs btn-outline-info",title:"Editar motivo de retraso",onClick:()=>Ta(t),children:r.jsx("i",{className:"mdi mdi-pencil"})})}),r.jsx("td",{className:"text-center",children:r.jsx("span",{className:Or(t.status?"billed":"cancelled"),children:t.status?"Activo":"Inactivo"})}),r.jsx("td",{children:t.description}),r.jsx("td",{children:gr(t.created_at)}),r.jsx("td",{children:sn(t.creator)})]},`delivery-delay-reason-${t.id}`))]})]})}),r.jsxs("div",{className:"commercial-order-delay-summary",children:[en.length," elementos (Pagina 1 de 1)"]})]})}),r.jsx(st,{modalRef:H,title:"Tracking del pedido",size:"lg",hideButtonSubmit:!0,children:r.jsx("div",{className:"table-responsive",children:r.jsxs("table",{className:"table table-sm align-middle mb-0",children:[r.jsx("thead",{children:r.jsxs("tr",{children:[r.jsx("th",{children:"Fecha"}),r.jsx("th",{children:"Estado"})]})}),r.jsxs("tbody",{children:[Vn.length===0&&r.jsx("tr",{children:r.jsx("td",{colSpan:"2",className:"text-muted text-center py-3",children:"Sin eventos registrados."})}),Vn.map((t,a)=>r.jsxs("tr",{children:[r.jsx("td",{children:new Date(t.date).toLocaleString("es-PE")}),r.jsx("td",{children:t.status})]},`commercial-order-tracking-${a}`))]})]})})}),r.jsx(st,{modalRef:B,title:"Evidencia de entrega",size:"lg",btnSubmitText:"Registrar",onSubmit:Ca,children:r.jsxs("div",{className:"row",children:[r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Recibido por"}),r.jsx("input",{className:"form-control",value:k.recipient_name,onChange:t=>fe("recipient_name",t.target.value)})]}),r.jsxs("div",{className:"col-md-3 mb-3",children:[r.jsx("label",{className:"form-label",children:"Tipo doc."}),r.jsxs("select",{className:"form-control",value:k.recipient_document_type,onChange:t=>fe("recipient_document_type",t.target.value),children:[r.jsx("option",{value:"DNI",children:"DNI"}),r.jsx("option",{value:"RUC",children:"RUC"}),r.jsx("option",{value:"CE",children:"CE"}),r.jsx("option",{value:"OTRO",children:"Otro"})]})]}),r.jsxs("div",{className:"col-md-3 mb-3",children:[r.jsx("label",{className:"form-label",children:"Numero"}),r.jsx("input",{className:"form-control",value:k.recipient_document_number,onChange:t=>fe("recipient_document_number",t.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Telefono"}),r.jsx("input",{className:"form-control",value:k.recipient_phone,onChange:t=>fe("recipient_phone",t.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Fecha y hora entrega"}),r.jsx("input",{type:"datetime-local",className:"form-control",value:k.delivered_at,onChange:t=>fe("delivered_at",t.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Foto / evidencia"}),r.jsx("input",{ref:q,className:"form-control",type:"file",accept:"image/png,image/jpeg,image/webp,image/gif",capture:"environment",onChange:ja})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Latitud"}),r.jsx("input",{className:"form-control",value:k.latitude,onChange:t=>fe("latitude",t.target.value)})]}),r.jsxs("div",{className:"col-md-6 mb-3",children:[r.jsx("label",{className:"form-label",children:"Longitud"}),r.jsx("input",{className:"form-control",value:k.longitude,onChange:t=>fe("longitude",t.target.value)})]}),r.jsxs("div",{className:"col-12 mb-3",children:[r.jsx("label",{className:"form-label",children:"Observaciones"}),r.jsx("textarea",{className:"form-control",rows:"3",value:k.evidence_notes,onChange:t=>fe("evidence_notes",t.target.value)})]}),r.jsx("div",{className:"col-12",children:r.jsx("div",{className:"border rounded p-3",children:Ne?r.jsx("img",{src:Ne,alt:"Evidencia de entrega",className:"img-fluid rounded border bg-light",style:{maxHeight:360,width:"100%",objectFit:"contain"}}):k.evidence_url?r.jsx("a",{href:k.evidence_url,target:"_blank",rel:"noreferrer",children:"Abrir evidencia registrada"}):r.jsx("div",{className:"text-muted py-4 text-center",children:"Sin evidencia registrada"})})})]})})]})};Wa((e,n)=>{!n.can("orders")&&!n.hasRole("Admin")&&(location.href="/admin/"),qa(e).render(r.jsx(Xa,{...n,title:n.pageTitle||"Pedidos comerciales",children:r.jsx(us,{...n})}))});
