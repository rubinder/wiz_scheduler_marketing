import type { Locale } from "../lib/links";
import type { Chrome } from "./chrome/en";
import gEn from "./generated/en";
import gEs from "./generated/es";
import gFr from "./generated/fr";
import gDe from "./generated/de";
import gPt from "./generated/pt";
import gRu from "./generated/ru";
import gTr from "./generated/tr";
import gAr from "./generated/ar";
import gUr from "./generated/ur";
import gHi from "./generated/hi";
import gBn from "./generated/bn";
import gMr from "./generated/mr";
import gTa from "./generated/ta";
import gTe from "./generated/te";
import gPcm from "./generated/pcm";
import gId from "./generated/id";
import gVi from "./generated/vi";
import gJa from "./generated/ja";
import gZh from "./generated/zh";
import cEn from "./chrome/en";
import cEs from "./chrome/es";
import cFr from "./chrome/fr";
import cDe from "./chrome/de";
import cPt from "./chrome/pt";
import cRu from "./chrome/ru";
import cTr from "./chrome/tr";
import cAr from "./chrome/ar";
import cUr from "./chrome/ur";
import cHi from "./chrome/hi";
import cBn from "./chrome/bn";
import cMr from "./chrome/mr";
import cTa from "./chrome/ta";
import cTe from "./chrome/te";
import cPcm from "./chrome/pcm";
import cId from "./chrome/id";
import cVi from "./chrome/vi";
import cJa from "./chrome/ja";
import cZh from "./chrome/zh";

export type Generated = typeof gEn;
export type HomeCopy = Generated & Chrome;

const pair = (g: Generated, c: Chrome): HomeCopy => ({ ...g, ...c });

export const HOME_COPY: Record<Locale, HomeCopy> = {
  en: pair(gEn, cEn), es: pair(gEs, cEs), fr: pair(gFr, cFr), de: pair(gDe, cDe),
  pt: pair(gPt, cPt), ru: pair(gRu, cRu), tr: pair(gTr, cTr), ar: pair(gAr, cAr),
  ur: pair(gUr, cUr), hi: pair(gHi, cHi), bn: pair(gBn, cBn), mr: pair(gMr, cMr),
  ta: pair(gTa, cTa), te: pair(gTe, cTe), pcm: pair(gPcm, cPcm), id: pair(gId, cId),
  vi: pair(gVi, cVi), ja: pair(gJa, cJa), zh: pair(gZh, cZh),
};
