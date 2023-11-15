import { getEnglishStr } from "@core-ui/getEnglishStr";
import { IcsAccountIn } from "./IcsAccountIn.schema";
import { IcsAccountOut } from "./IcsAccountOut.schema";

export const icsAccount = (transliteration: IcsAccountIn): IcsAccountOut => {
	if (!transliteration?.fullName)
		return {
			fullName: ``,
			email: ``,
			login: ``,
		};
	const fullName = getEnglishStr(transliteration.fullName.toLowerCase());
	let N1 = "";
	let N2 = "";
	const n1 = fullName.split(" ")?.[0] ?? "";
	let n2 = fullName.split(" ")?.[1] ?? "";
	if (n1) N1 = n1[0].toUpperCase() + n1.slice(1);
	if (n2) {
		N2 = " " + n2[0].toUpperCase() + n2.slice(1);
		n2 = "." + n2;
	}
	return {
		fullName: `${N1}${N2}`,
		email: `${n1}${n2}@ics-it.ru`,
		login: `${n1}${n2}`,
	};
};
