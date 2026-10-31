from pathlib import Path
p=Path('web/src/scene/walking.ts');s=p.read_text(encoding='utf-8')
a=s.index('    // Bệ đá');b=s.index('\n  } else {',a)
s=s[:a]+'''    // White, irregular monolith and two inset inscriptions, following docs/assets/UET_*.
    const stone = new THREE.MeshLambertMaterial({ color: "#eeeade", flatShading: true });
    const outline = new THREE.Shape();
    outline.moveTo(-.22, 0); outline.lineTo(-.24, .16); outline.lineTo(-.17, .39);
    outline.lineTo(-.11, .53); outline.lineTo(.03, .51); outline.lineTo(.13, .39);
    outline.lineTo(.22, .41); outline.lineTo(.25, .25); outline.lineTo(.23, .02); outline.closePath();
    const geo = new THREE.ExtrudeGeometry(outline, { depth: .25, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 1, steps: 1 });
    addMesh(g, geo, stone, 0, .015, -.13);
    const plaque = (key: string, width: number, height: number) => {
      const [c, ctx] = makeCanvas(512, 640); ctx.fillStyle = "#eeeade"; ctx.fillRect(0, 0, 512, 640);
      ctx.fillStyle = "#154c79"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const lines = t(key).split("\\n");
      lines.forEach((line, i) => { ctx.font = `${i === 0 ? 600 : 800} ${i === 0 ? 28 : 54}px "Be Vietnam Pro"`; ctx.fillText(line, 256, 100 + i * 118, 470); });
      return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: toTex(c) }));
    };
    const front = plaque("story.prop.uet.name", .28, .31); front.position.set(-.03, .24, .148); g.add(front);
    const side = plaque("story.prop.uet.motto", .19, .27); side.rotation.y = Math.PI / 2; side.position.set(.255, .23, 0); g.add(side);
''' +s[b:]
a=s.index('      // Giáo trình Giải tích');b=s.index('    } else if (egg.kind === "book_stack")',a)
s=s[:a]+'''      // Actual blue cover supplied by the user; no publisher crest is recreated in geometry.
      const cover = new THREE.MeshLambertMaterial({ color: "#154c79" });
      const book = new THREE.Group(); book.position.set(0, .30, 0); book.rotation.x = -.14;
      addMesh(book, new THREE.BoxGeometry(.23, .32, .04), paper);
      for (const z of [-.023, .023]) addMesh(book, new THREE.BoxGeometry(.245, .335, .006), cover, 0, 0, z);
      addMesh(book, new THREE.BoxGeometry(.014, .335, .05), cover, -.12);
      if (egg.texture) {
        const texture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}${egg.texture}`); texture.colorSpace = THREE.SRGBColorSpace;
        addMesh(book, new THREE.PlaneGeometry(.245, .335), new THREE.MeshBasicMaterial({ map: texture }), 0, 0, .027);
      }
      g.add(book);
''' +s[b:]
p.write_text(s,encoding='utf-8')
# Use hardware graphics for browser captures. WebGL uses Direct3D, it has no CUDA backend.
for name in ['capture.mjs','story-e2e.mjs']:
 p=Path('web/scripts')/name;s=p.read_text(encoding='utf-8').replace('"--use-angle=swiftshader", "--enable-unsafe-swiftshader",','"--use-angle=d3d11",');p.write_text(s,encoding='utf-8')
