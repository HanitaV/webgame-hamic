import { renderEndingScore, wavBytes, type EndingScore } from "./core/ending-score";
const score = await (await fetch("/data/ending-audio.json")).json() as EndingScore;
Object.assign(window, { __endingAudioRender: async (id: string) => {
  const buffer = await renderEndingScore(score, id);
  const bytes = wavBytes(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(binary);
} });
