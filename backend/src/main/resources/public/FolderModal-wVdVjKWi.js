import{b as M,r as v,y as $,j as e,M as u,F as B,L,z as q,B as S,K as H,W as O,H as R,D as V,G as w}from"./index-XY-EGNwC.js";import{FOLDER as z}from"/assets/js/edifice-ts-client/index.js";function K({edit:n,onSuccess:t,onClose:m}){var l;const r=H(),d=O(),p=R(),x=V(),o=n?(l=r[0])==null?void 0:l.name:void 0,{reset:s,register:a,handleSubmit:f,setFocus:h,formState:{errors:c,isSubmitting:y,isDirty:F,isValid:g}}=w({mode:"onChange",values:{name:o||""}}),C=v.useId(),I=async function({name:b}){var j;try{if(n){const i=(j=r[0])==null?void 0:j.parentId,E=r[0].id;await x.mutate({folderId:E,parentId:i,name:b}),s(),t==null||t()}else{const i=(d==null?void 0:d.id)||z.DEFAULT;await p.mutate({name:b,parentId:i}),s(),t==null||t()}}catch(i){console.error(i)}};function D(){s(),m()}return{formId:`createModal_${C}`,errors:c,isSubmitting:y,isDirty:F,isValid:g,register:a,setFocus:h,handleSubmit:f,onCancel:D,onSubmit:I}}function W({isOpen:n,edit:t,onSuccess:m,onCancel:l}){const{t:r}=M(),{isDirty:d,isValid:p,isSubmitting:x,formId:o,onSubmit:s,onCancel:a,handleSubmit:f,register:h,setFocus:c}=K({edit:t,onSuccess:m,onClose:l});return v.useEffect(()=>{n&&c("name")},[n,c]),n?$.createPortal(e.jsxs(u,{isOpen:n,onModalClose:a,id:"modal_"+o,children:[e.jsx(u.Header,{onModalClose:a,children:r(t?"explorer.rename.folder":"explorer.create.folder")}),e.jsx(u.Body,{children:e.jsx("form",{id:o,onSubmit:f(s),children:e.jsxs(B,{id:"nameFolder",isRequired:!0,children:[e.jsx(L,{children:r("explorer.create.folder.name")}),e.jsx(q,{type:"text",...h("name",{required:!0,pattern:{value:/[^ ]/,message:"invalid title"}}),placeholder:r("explorer.create.folder.name"),size:"md","aria-required":!0})]})})}),e.jsxs(u.Footer,{children:[e.jsx(S,{color:"tertiary",onClick:a,type:"button",variant:"ghost",children:r("explorer.cancel")}),e.jsx(S,{form:o,type:"submit",color:"primary",variant:"filled",disabled:!d||!p||x,children:r(t?"explorer.rename":"explorer.create")})]})]}),document.getElementById("portal")):null}export{W as default};
