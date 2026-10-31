from pathlib import Path
p=Path('web/scripts/rooms-e2e.mjs');s=p.read_text(encoding='utf-8').replace(" await page.locator('[data-exit-building]').click();",''' // Furniture blocks the avatar while the centre aisle remains walkable.
 await page.evaluate(()=>{window.__hoitu.pauseWalk(false);window.__hoitu.walkAxis(0,-1);});await wait(900);
 await page.evaluate(()=>window.__hoitu.walkAxis(1,0));await wait(900);await page.evaluate(()=>window.__hoitu.walkAxis(0,0));
 assert((await page.evaluate(()=>window.__hoitu.walkPosition())).x<1000.75,'desk blocks sideways movement');
 await page.locator('[data-exit-building]').click();''')
s=s.replace(" await atDoor('USSH_C');",''' await atDoor('HUS_T1');await page.evaluate(()=>window.__hoitu.walkToPoint(106.8,-93));
 assert((await page.evaluate(()=>window.__hoitu.walkingMetrics())).route>1,'route detours around T1');
 await atDoor('USSH_C');''')
p.write_text(s,encoding='utf-8')
