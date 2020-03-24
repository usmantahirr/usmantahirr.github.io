(this["webpackJsonpreact-code-test"]=this["webpackJsonpreact-code-test"]||[]).push([[1],{10:function(e,t,n){"use strict";var r=n(13),a=n(5),o="\n  color: blue;\n  background: yellow;\n  font-weight: bold;\n  padding: 3px;\n",c="\n  color: red;\n  background: beige;\n  font-weight: bold;\n  border: 1px solid red;\n  padding: 3px;\n",i="\n  color: white;\n  background: red;\n  font-weight: bold;\n  padding: 3px;\n";function l(){var e=(new Error).stack.replace(/^Error\s+/,""),t=e.split("\n")[2],n=e.split("\n")[3];return n&&(n=n.replace(/ http.*$/,"")),t&&(t=t.replace(/ http.*$/,"")),[t=t?t.replace(/ \(.+\)$/,"").substring(6).trim():"",n=n?n.replace(/ \(.+\)$/,"").substring(6).trim():""]}var u={info:function(e){var t=l(),n=Object(r.a)(t,2),c=n[0],i=n[1];if(a.b.enabled&&("error"===a.b.loglevel||"warn"===a.b.loglevel||"info"===a.b.loglevel)){for(var u=arguments.length,s=new Array(u>1?u-1:0),f=1;f<u;f++)s[f-1]=arguments[f];s&&s.length?console.info("%c[INFO] ".concat(i,"/").concat(c),o,e,s):console.info("%c[INFO] ".concat(i,"/").concat(c),o,e)}},warn:function(e){var t=l(),n=Object(r.a)(t,2),o=n[0],i=n[1];if(a.b.enabled&&("error"===a.b.loglevel||"warn"===a.b.loglevel)){for(var u=arguments.length,s=new Array(u>1?u-1:0),f=1;f<u;f++)s[f-1]=arguments[f];s&&s.length?console.info("%c[WARN] ".concat(i,"/").concat(o),c,e,s):console.info("%c[WARN] ".concat(i,"/").concat(o),c,e)}},error:function(e){var t=l(),n=Object(r.a)(t,2),o=n[0],c=n[1];if(a.b.enabled&&"error"===a.b.loglevel){for(var u=arguments.length,s=new Array(u>1?u-1:0),f=1;f<u;f++)s[f-1]=arguments[f];s&&s.length?console.info("%c[ERROR] ".concat(c,"/").concat(o),i,e,s):console.info("%c[ERROR] ".concat(c,"/").concat(o),i,e)}}};t.a=u},104:function(e,t,n){},164:function(e,t,n){},165:function(e,t,n){"use strict";n.r(t);var r=n(0),a=n.n(r),o=n(12),c=n.n(o),i=(n(104),n(25)),l=(n(105),n(106),n(23)),u=n(13),s=n(69),f=n.n(s),d=n(24),b=function(e){var t=e.children,n=Object(r.createRef)(),o=Object(r.useState)({type:"error",fail:!1,message:"",statusCode:""}),c=Object(u.a)(o,2),i=c[0],s=c[1];return a.a.createElement(d.a,{value:{notification:i,setNotification:function(e,t){t&&n&&n.current&&n.current.addNotification({level:e.type,message:a.a.createElement("div",null,e.statusCode&&a.a.createElement("b",null,e.statusCode,": "),e.message),position:"tc"}),s(Object(l.a)({},e))}}},a.a.createElement(f.a,{ref:n}),t)},p=n(53),m=n(26),v=n(40),E=n(76),g=n(78),h=n(54),O=n(10),y=function(e){Object(g.a)(n,e);var t=Object(E.a)(n);function n(e){var r;return Object(p.a)(this,n),(r=t.call(this,e)).setError=r.setError.bind(Object(m.a)(r)),r.state={error:{fail:!1,message:"",statusCode:""},applicationError:!1},r}return Object(v.a)(n,null,[{key:"getDerivedStateFromError",value:function(e){return O.a.info("Derived Error",e),{applicationError:!0}}}]),Object(v.a)(n,[{key:"componentDidCatch",value:function(e,t){O.a.info("CDC",e,t)}},{key:"setError",value:function(e,t){t&&(0,this.context.setNotification)(Object(l.a)({},e,{type:"error"}),t);this.setState({error:e})}},{key:"render",value:function(){var e=this.props.children,t=this.state,n=t.error;return t.applicationError?a.a.createElement("h1",null,"Something went wrong."):a.a.createElement(h.a,{value:{error:n,setError:this.setError}},e)}}]),n}(a.a.Component);y.contextType=d.b;var w=y,j=n(3),C=n(169),R=n(167),k=function(){return a.a.createElement(C.a,{status:"404",title:"404",subTitle:"Sorry, the page you visited does not exist.",extra:a.a.createElement(i.b,{to:"/"},a.a.createElement(R.a,{type:"primary"},"Back Home"))})},x=n(49),A=n(50),D=n(73),N=n.n(D),S=n(5);function T(){var e=Object(x.a)(["\n  display: flex;\n  justify-content: center;\n"]);return T=function(){return e},e}var I=Object(A.a)(N.a)(T()),F=function(){return a.a.createElement(I,{color:S.a.LOADER,width:100,height:100,type:"MutatingDots"})},P=function(){return a.a.createElement(r.Suspense,{fallback:a.a.createElement(F,null)},a.a.createElement(j.c,null,a.a.createElement(j.a,{exact:!0,path:"/",component:Object(r.lazy)((function(){return Promise.all([n.e(0),n.e(4),n.e(7)]).then(n.bind(null,371))}))}),a.a.createElement(j.a,{exact:!0,path:"/:id",component:Object(r.lazy)((function(){return Promise.all([n.e(0),n.e(5),n.e(6)]).then(n.bind(null,372))}))}),a.a.createElement(j.a,{component:k})))};n(164);var $=function(){return a.a.createElement(b,null,a.a.createElement(w,null,a.a.createElement(i.a,null,a.a.createElement(P,null))))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));c.a.render(a.a.createElement($,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()}))},24:function(e,t,n){"use strict";n.d(t,"a",(function(){return l}));var r=n(0),a=n.n(r),o=n(10),c={notification:{type:"",fail:!1,message:"",statusCode:""},setNotification:function(e,t){o.a.info(e,t)}},i=a.a.createContext(c),l=i.Provider;i.Consumer;t.b=i},5:function(e,t,n){"use strict";n.d(t,"b",(function(){return r})),n.d(t,"a",(function(){return a}));var r={enabled:!0,loglevel:"error"},a={PRIMARY:"#34495e",SECONDARY:"#95a5a6",SECONDARY_LIGHT:"#ecf0f1",TEXT_DARK:"#2c3e50",TEXT_LIGHT:"#ecf0f1",LOADER:"#FFA500"}},54:function(e,t,n){"use strict";n.d(t,"a",(function(){return l}));var r=n(0),a=n.n(r),o=n(10),c={error:{fail:!1,message:"",statusCode:""},setError:function(e,t){o.a.info(e,t)}},i=a.a.createContext(c),l=i.Provider;i.Consumer;t.b=i},99:function(e,t,n){e.exports=n(165)}},[[99,2,3]]]);
//# sourceMappingURL=main.122e9f2a.chunk.js.map