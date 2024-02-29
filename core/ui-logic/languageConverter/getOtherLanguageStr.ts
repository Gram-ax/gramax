export const converterToEng = {
	кс: "x",
	щ: "sch",
	ч: "ch",
	ж: "zh",
	х: "kh",
	ш: "sh",
	ю: "yu",
	я: "ya",
	а: "a",
	б: "b",
	в: "v",
	г: "g",
	д: "d",
	е: "e",
	ё: "e",
	з: "z",
	и: "i",
	й: "y",
	к: "k",
	л: "l",
	м: "m",
	н: "n",
	о: "o",
	п: "p",
	р: "r",
	с: "s",
	т: "t",
	у: "u",
	ф: "f",
	ц: "c",
	ь: "",
	ы: "y",
	ъ: "",
	э: "e",
};

export function getOtherLanguageStr(str: string, converter: { [key: string]: string }): string {
	Object.keys(converter).map((sub) => {
		str = str.replace(new RegExp(sub, "g"), converter[sub]);
	});

	return str;
}