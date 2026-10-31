import * as THREE from "three";

type Entry = { mesh: THREE.Mesh; original: THREE.Material | THREE.Material[]; copies: THREE.Material[]; alpha: number; key: string };

/** Fade complete building groups while keeping the follow camera's arm length unchanged. */
export class BuildingOcclusion {
  private ray = new THREE.Ray();
  private direction = new THREE.Vector3();
  private target = new THREE.Vector3();
  private hit = new THREE.Vector3();
  private entries = new Map<THREE.Mesh, Entry>();
  private groups = new Map<string, THREE.Mesh[]>();
  private bounds = new Map<string,{ box: THREE.Box3; parts: THREE.Box3[] }>();
  private blocked = new Set<string>();
  private probeMs = 0;
  constructor(private root: THREE.Group, private keyOf: (mesh: THREE.Mesh) => string | null, private opacity: number) {
    root.updateWorldMatrix(true,true);
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const key = keyOf(mesh); if (!key) return;
      const list = this.groups.get(key) ?? []; list.push(mesh); this.groups.set(key,list);
      const bounds = this.bounds.get(key) ?? { box: new THREE.Box3(), parts: [] };
      const part = new THREE.Box3().setFromObject(mesh);
      bounds.box.union(part); bounds.parts.push(part); this.bounds.set(key,bounds);
    });
  }
  update(camera: THREE.Camera, player: THREE.Vector3, height: number, dt: number, immediate: boolean) {
    const start = performance.now();
    this.blocked.clear();
    for (const y of [.2,.65,1]) {
      this.target.copy(player).y += height*y;
      this.direction.copy(this.target).sub(camera.position);
      const farSquared = Math.max(.05,this.direction.length()-.03)**2;
      this.ray.set(camera.position,this.direction.normalize());
      const crosses = (box: THREE.Box3) => box.containsPoint(camera.position) || box.containsPoint(this.target) || !!this.ray.intersectBox(box,this.hit) && this.hit.distanceToSquared(camera.position) <= farSquared;
      for (const [key,bounds] of this.bounds) {
        if (!this.blocked.has(key) && crosses(bounds.box) && bounds.parts.some(crosses)) this.blocked.add(key);
      }
    }
    for (const key of this.blocked) for (const mesh of this.groups.get(key) ?? []) {
      if (this.entries.has(mesh)) continue;
      const original = mesh.material;
      const copies = (Array.isArray(original) ? original : [original]).map((m) => { const c=m.clone(); c.transparent=true; c.depthWrite=false; return c; });
      mesh.material = Array.isArray(original) ? copies : copies[0];
      this.entries.set(mesh,{mesh,original,copies,alpha:1,key});
    }
    for (const [mesh, entry] of this.entries) {
      const goal = this.blocked.has(entry.key) ? this.opacity : 1;
      entry.alpha = immediate ? goal : THREE.MathUtils.lerp(entry.alpha,goal,1-Math.exp(-dt*12));
      const originals = Array.isArray(entry.original) ? entry.original : [entry.original];
      entry.copies.forEach((m,i) => { m.opacity = originals[i].opacity * entry.alpha; });
      if (goal === 1 && entry.alpha > .995) this.restore(mesh,entry);
    }
    this.probeMs = this.probeMs*.9+(performance.now()-start)*.1;
  }
  private restore(mesh: THREE.Mesh, entry: Entry) { mesh.material=entry.original; entry.copies.forEach((m) => m.dispose()); this.entries.delete(mesh); }
  get active() { return this.entries.size > 0; }
  clear() { for (const [mesh,entry] of this.entries) this.restore(mesh,entry); this.blocked.clear(); }
  diagnostics() { return { groups: [...this.blocked], meshes: this.entries.size, minOpacity: Math.min(1,...[...this.entries.values()].map((e) => e.alpha)), probeMs: this.probeMs }; }
}
