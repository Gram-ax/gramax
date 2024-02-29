import { converterToEng, getOtherLanguageStr } from "./getOtherLanguageStr";

export const converterToRus: { [key: string]: string } = {};
Object.entries(converterToEng).forEach(([rus, eng]) => {
	if (!(converterToRus[eng] || eng === "")) converterToRus[eng] = rus;
});

export function getRussianStr(str: string): string {
	return getOtherLanguageStr(str, converterToRus);
}
