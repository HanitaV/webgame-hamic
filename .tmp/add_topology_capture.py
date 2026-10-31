from pathlib import Path
p=Path('web/scripts/capture.mjs');s=p.read_text(encoding='utf-8');anchor='await session("library",'
i=s.index(anchor)
s=s[:i]+'''await session("topology", { width: 844, height: 390 }, true, async (page, snap) => {
  await page.evaluate(() => { const h = window.__hoitu; h.storyProgress.set({ introSeen: true }); h.go("walk"); });
  await page.locator("[data-dialogue-next]").click();
  await page.evaluate(() => { const h = window.__hoitu; h.teleportToPoint(106.6, -64); h.walkToPoint(106.6, -95); });
  await page.waitForFunction(() => { const h = window.__hoitu; return h.walkPosition().z / h.data.map.scale + h.data.map.origin[1] < -94; });
  await snap("t1-passage");
  await page.evaluate(async () => { const h = window.__hoitu, b = h.data.map.buildings.find(b => b.id === "HUS_T1"); h.teleportToPoint(...b.entrance); await h.enterBuilding(b.id); });
  await snap("t1-ground-floor");
  const destination = await page.evaluate(() => { const h = window.__hoitu, room = h.roomState().room, lab = room.rooms.find(r => r.num === "111"); const p = { x: 1000 + lab.door[0] - room.sourceCenter[0], z: lab.door[1] - room.sourceCenter[1] }; h.walkToWorldPoint(p.x, p.z); return p; });
  await page.waitForFunction(p => { const q = window.__hoitu.walkPosition(); return Math.hypot(q.x - p.x, q.z - p.z) < .2; }, destination);
  await snap("t1-lab");
});

'''+s[i:];p.write_text(s,encoding='utf-8')
