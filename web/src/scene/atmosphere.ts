import * as THREE from "three";
import type { AtmosphereFrame } from "../core/data";

/** Story steps advance the light; elapsed real time never advances the story. */
export class Atmosphere {
  private current = 0;
  private goal = 0;
  private show = false;
  private sky = new THREE.Color();
  private other = new THREE.Color();
  private sunPosition = new THREE.Vector3();
  private hemi = new THREE.HemisphereLight();
  private sun = new THREE.DirectionalLight();
  private fill = new THREE.DirectionalLight();
  night = 0;
  constructor(private scene: THREE.Scene, private renderer: THREE.WebGLRenderer, private frames: AtmosphereFrame[]) {
    scene.background = this.sky;
    scene.fog = new THREE.FogExp2(frames[0].sky);
    this.fill.position.set(30,20,-40);
    scene.add(this.hemi, this.sun, this.fill);
    this.update(0, true);
  }
  setStep(step: number, immediate = false) { this.goal = THREE.MathUtils.clamp(step, this.frames[0].step, this.frames.at(-1)!.step); if (immediate) this.update(0,true); }
  setShow(on: boolean) { this.show = on; }
  update(dt: number, immediate: boolean) {
    const target = this.show ? this.frames.at(-1)!.step : this.goal;
    this.current = immediate ? target : THREE.MathUtils.lerp(this.current,target,1-Math.exp(-dt*.9));
    const upper = this.frames.findIndex((f) => f.step > this.current);
    const a = this.frames[upper < 0 ? this.frames.length-1 : Math.max(0,upper-1)];
    const b = this.frames[upper < 0 ? this.frames.length-1 : upper];
    const mix = a === b ? 0 : (this.current-a.step)/(b.step-a.step);
    const number = (key: "night" | "sunIntensity" | "hemiIntensity" | "exposure" | "fogDensity") => THREE.MathUtils.lerp(a[key],b[key],mix);
    const color = (target: THREE.Color, key: "sky" | "sunColor" | "hemiSky" | "hemiGround") => target.set(a[key]).lerp(this.other.set(b[key]),mix);
    color(this.sky,"sky");
    const fog = this.scene.fog as THREE.FogExp2; fog.color.copy(this.sky); fog.density = number("fogDensity");
    color(this.hemi.color,"hemiSky"); color(this.hemi.groundColor,"hemiGround"); this.hemi.intensity = number("hemiIntensity");
    color(this.sun.color,"sunColor"); this.sun.intensity = number("sunIntensity");
    this.sun.position.fromArray(a.sunPosition).lerp(this.sunPosition.fromArray(b.sunPosition),mix);
    this.night = number("night");
    this.fill.color.copy(this.hemi.color); this.fill.intensity = .25 + (1-this.night)*.15;
    this.renderer.toneMappingExposure = number("exposure");
  }
  diagnostics() { return { step: this.current, target: this.goal, night: this.night, sky: `#${this.sky.getHexString()}`, showing: this.show }; }
}
