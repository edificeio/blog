import{r as i,b as f,y as E,j as e,M as r,B as u}from"./index-XY-EGNwC.js";import{u as b,S as C,n as $,E as j}from"./index-fttVS9ld.js";import"/assets/js/edifice-ts-client/index.js";import"./index-fCB84Be-.js";const v=({isOpen:h,onSuccess:d,onCancel:n})=>{const c="\\frac{-b + \\sqrt{b^2 - 4ac}}{2a}",[o,m]=i.useState(`$${c}$`),{t:s}=f(),t=b({extensions:[C,$],content:"",editable:!1});i.useEffect(()=>{const a=document.createElement("link");return a.href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css",a.rel="stylesheet",a.type="text/css",document.head.appendChild(a),()=>{document.head.removeChild(a)}},[]),i.useEffect(()=>{t==null||t.commands.setContent(o),t==null||t.commands.enter()},[t,o]);const x=a=>{const l=a.target.value.replaceAll(`
`,"$<br/>$");l?(t==null||t.commands.setContent(`$${l}$`),m(`$${l}$`)):(t==null||t.commands.setContent(""),m("")),t==null||t.commands.enter()},p=()=>{n==null||n()};return E.createPortal(e.jsxs(r,{id:"MathsModal",isOpen:h,onModalClose:p,children:[e.jsx(r.Header,{onModalClose:p,children:s("tiptap.maths.title")}),e.jsxs(r.Subtitle,{children:[s("tiptap.maths.subtitle.1"),e.jsx("a",{href:s("https://fr.wikibooks.org/wiki/LaTeX/%C3%89crire_des_math%C3%A9matiques"),target:"_blank",children:s("tiptap.maths.subtitle.2")})]}),e.jsxs(r.Body,{children:[e.jsx("textarea",{id:"formulaTextArea",name:"formula",rows:4,cols:50,onChange:x,placeholder:`Exemple : ${c}`,className:"border rounded-3 w-100 px-16 py-12"}),e.jsx(j,{editor:t,className:"pt-24 pb-0 text-center fs-1"})]}),e.jsxs(r.Footer,{children:[e.jsx(u,{color:"tertiary",onClick:n,type:"button",variant:"ghost",children:s("tiptap.maths.cancel")}),e.jsx(u,{color:"primary",onClick:()=>d==null?void 0:d(o),type:"button",variant:"filled",children:s("tiptap.maths.add")})]})]}),document.getElementById("portal"))};export{v as default};
