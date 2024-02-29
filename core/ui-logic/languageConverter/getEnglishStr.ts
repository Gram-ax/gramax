import { converterToEng, getOtherLanguageStr } from "./getOtherLanguageStr";

export function getEnglishStr(str: string): string {
	return getOtherLanguageStr(str, converterToEng);
}
