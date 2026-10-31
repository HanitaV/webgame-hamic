/** Navigation uses the blockout's individual wall/collision boxes, never building envelopes. */
export interface Wall { x: number; z: number; w: number; d: number }
export interface Bounds { x0: number; z0: number; x1: number; z1: number }
export class Navigation {
  private buckets = new Map<string, Wall[]>();
  constructor(readonly walls: Wall[], readonly radius: number, private step: number, private bounds: Bounds, private regions?: Bounds[]) {
    for (const w of walls) for (let x = this.cell(w.x-w.w/2-radius); x <= this.cell(w.x+w.w/2+radius); x++) for (let z = this.cell(w.z-w.d/2-radius); z <= this.cell(w.z+w.d/2+radius); z++) {
      const k = `${x},${z}`; const bucket = this.buckets.get(k) ?? []; bucket.push(w); this.buckets.set(k,bucket);
    }
  }
  private cell(n: number) { return Math.floor(n / (this.step * 10)); }
  allowed(x: number,z: number) {
    const b=this.bounds;
    return x>=b.x0 && x<=b.x1 && z>=b.z0 && z<=b.z1 && (!this.regions || this.regions.some(r=>x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1)) && !(this.buckets.get(`${this.cell(x)},${this.cell(z)}`) ?? []).some(w=>Math.abs(x-w.x)<=w.w/2+this.radius && Math.abs(z-w.z)<=w.d/2+this.radius);
  }
  clear(a: {x:number;z:number}, b: {x:number;z:number}) {
    const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/(this.step*.45)));
    for(let i=0;i<=count;i++) if(!this.allowed(a.x+(b.x-a.x)*i/count,a.z+(b.z-a.z)*i/count))return false;
    return true;
  }
  path(start: {x:number;z:number}, target: {x:number;z:number}) {
    if(!this.allowed(target.x,target.z) || !this.allowed(start.x,start.z))return [];
    if(this.clear(start,target))return [target];
    const s=this.step, width=Math.ceil((this.bounds.x1-this.bounds.x0)/s)+1;
    const key=(x:number,z:number)=>z*width+x;
    const coord=(k:number)=>({x:this.bounds.x0+(k%width)*s,z:this.bounds.z0+Math.floor(k/width)*s});
    const cell=(p:{x:number;z:number})=>key(Math.round((p.x-this.bounds.x0)/s),Math.round((p.z-this.bounds.z0)/s));
    const first=cell(start),goal=cell(target),cost=new Map<number,number>([[first,0]]),prev=new Map<number,number>(),closed=new Set<number>();
    const heap:{id:number;score:number}[]=[];
    const push=(id:number,score:number)=>{let i=heap.length;heap.push({id,score});while(i){const p=(i-1)>>1;if(heap[p].score<=score)break;heap[i]=heap[p];i=p;}heap[i]={id,score};};
    const pop=()=>{const top=heap[0],tail=heap.pop()!;if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].score<heap[c].score)c++;if(heap[c].score>=tail.score)break;heap[i]=heap[c];i=c;}heap[i]=tail;}return top.id;};
    push(first,0);let found=-1;
    while(heap.length && closed.size<100000){
      const k=pop();if(closed.has(k))continue;closed.add(k);const p=coord(k);
      if((k===goal || Math.hypot(p.x-target.x,p.z-target.z)<s*1.5)&&this.clear(p,target)){found=k;break;}
      for(const dx of [-1,0,1])for(const dz of [-1,0,1]){
        if(!dx&&!dz)continue;const nk=k+dx+dz*width,q=coord(nk);
        if(Math.abs(q.x-p.x)>s*1.1 || Math.abs(q.z-p.z)>s*1.1 || closed.has(nk)||!this.allowed(q.x,q.z))continue;
        // Disallow diagonal corner cutting and test the exact start-to-grid connection.
        if(!this.clear(k===first?start:p,q))continue;
        const next=cost.get(k)!+Math.hypot(dx,dz)*s;
        if(next>=(cost.get(nk)??Infinity))continue;cost.set(nk,next);prev.set(nk,k);push(nk,next+Math.hypot(q.x-target.x,q.z-target.z));
      }
    }
    if(found<0)return [];
    const path=[target];let k=found;while(k!==first){path.unshift(coord(k));k=prev.get(k)!;}
    // Retain only turns with a wall between them; smoothing uses the same collision query.
    const result: {x:number;z:number}[]=[];let anchor=start,i=0;
    while(i<path.length){let j=i;while(j+1<path.length&&this.clear(anchor,path[j+1]))j++;result.push(path[j]);anchor=path[j];i=j+1;}
    return result;
  }
}
