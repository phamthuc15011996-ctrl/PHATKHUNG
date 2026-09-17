const http=require("http"),fs=require("fs"),path=require("path");
const PORT=process.env.PORT||3000,pub=path.join(__dirname,"public");
let players=[],clients=[],messages=[],state={phase:"lobby",count:null,results:{}};
const emit=()=>{let m=`data: ${JSON.stringify({players,state,messages})}\n\n`;clients.forEach(c=>c.write(m))};
const body=req=>new Promise(ok=>{let b="";req.on("data",d=>b+=d);req.on("end",()=>{try{ok(JSON.parse(b||"{}"))}catch{ok({})}})});
const three=()=>String(Math.floor(Math.random()*1000)).padStart(3,"0");
http.createServer(async(req,res)=>{
 const u=new URL(req.url,`http://${req.headers.host}`);
 if(u.pathname==="/events"){res.writeHead(200,{"Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive"});res.write(`data: ${JSON.stringify({players,state,messages})}\n\n`);clients.push(res);req.on("close",()=>clients=clients.filter(x=>x!==res));return}
 if(req.method==="POST"){
  let d=await body(req);
  if(u.pathname==="/join"&&state.phase==="lobby"){let n=(d.name||"").trim().slice(0,20);if(n&&!players.includes(n))players.push(n)}
   if(u.pathname==="/chat"){
     let n=(d.name||"").trim().slice(0,20),txt=(d.text||"").trim().slice(0,200);
     if(n&&txt&&players.includes(n)){
       messages.push({name:n,text:txt,time:new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Ho_Chi_Minh"})});
       if(messages.length>100)messages=messages.slice(-100)
     }
   }
  if(u.pathname==="/reset")state={phase:"lobby",count:null,results:{}};
  if(u.pathname==="/clear"){players=[];messages=[];state={phase:"lobby",count:null,results:{}}}
  if(u.pathname==="/start"&&state.phase==="lobby"&&players.length){
    state={phase:"countdown",count:5,results:{}};emit();let n=5;
    let t=setInterval(()=>{n--;if(n){state.count=n;emit()}else{clearInterval(t);state={phase:"spin",count:null,results:{}};emit();
      setTimeout(()=>{let r={};players.forEach(p=>r[p]=three());state={phase:"result",count:null,results:r};emit()},3500)}},1000)
  }
  emit();res.end("ok");return
 }
 let f=u.pathname==="/"?"index.html":u.pathname.slice(1),fp=path.join(pub,f);
 if(!fp.startsWith(pub)||!fs.existsSync(fp)){res.statusCode=404;res.end("404");return}
 res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});fs.createReadStream(fp).pipe(res)
}).listen(PORT,"0.0.0.0",()=>console.log("PHATKHUNG V2 ONLINE - PORT "+PORT));