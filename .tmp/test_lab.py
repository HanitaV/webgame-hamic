from pathlib import Path
p=Path('web/scripts/rooms-e2e.mjs');s=p.read_text(encoding='utf-8-sig');old="if(i===0){await page.screenshot({path:out+'/t1-ground-floor.png'});assert(requests.some(r=>r.endsWith('.glb')),'Real model is loaded on entry');}"
new="""if(i===0){
    await page.screenshot({path:out+'/t1-ground-floor.png'});assert(requests.some(r=>r.endsWith('.glb')),'Real model is loaded on entry');
    const lab=state.room.rooms.find(r=>r.num==='111'),center=state.room.sourceCenter;
    const goal={x:1000+lab.door[0]-center[0],z:lab.door[1]-center[1]};
    await page.evaluate(p=>window.__hoitu.walkToWorldPoint(p.x,p.z),goal);
    assert((await page.evaluate(()=>window.__hoitu.walkingMetrics())).route>0,'Indoor route through actual lab door exists');
    await page.waitForFunction(p=>{const q=window.__hoitu.walkPosition();return Math.hypot(q.x-p.x,q.z-p.z)<.2;},goal,{timeout:10000});
    await page.screenshot({path:out+'/t1-lab-room.png'});
  }"""
assert old in s;s=s.replace(old,new);p.write_text(s,encoding='utf-8')
