// Boot/recovery overlay disappears completely during play.
(()=>{const panel=document.getElementById('boot'),title=document.getElementById('bootTitle'),bar=document.getElementById('bootProgress'),retry=document.getElementById('bootRetry');let ready=false;
 window.quarryBoot={get isReady(){return ready},progress(value){bar.style.width=Math.round(value*100)+'%'},ready(){ready=true;panel.hidden=true},waiting(text){ready=false;title.textContent=text;panel.hidden=false;retry.hidden=true},error(){if(ready)return;title.textContent='Не удалось открыть карьер';document.getElementById('bootDetail').textContent='Проверь соединение и попробуй ещё раз.';retry.hidden=false;panel.hidden=false}};
 retry.onclick=()=>location.reload();addEventListener('error',event=>{if(event.error||event.target?.tagName==='SCRIPT')window.quarryBoot.error()},true);addEventListener('unhandledrejection',()=>window.quarryBoot.error());
})();

// The full-screen game owns touch gestures; keep native button clicks intact.
document.addEventListener('dblclick',event=>event.preventDefault(),{passive:false});
document.addEventListener('touchend',event=>{
 if(event.target===document.body||event.target===document.documentElement||event.target?.tagName==='CANVAS')event.preventDefault();
},{passive:false});

document.addEventListener('selectstart',event=>event.preventDefault());
