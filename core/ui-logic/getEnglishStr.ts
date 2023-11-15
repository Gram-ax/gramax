export function getEnglishStr(str: string): string {
	Object.keys(converter).map((sub) => {
		str = str.replace(new RegExp(sub, "g"), converter[sub]);
	});
	return str;
}

const converter = {
	кс: "x",
	а: "a",
	б: "b",
	в: "v",
	г: "g",
	д: "d",
	е: "e",
	ё: "e",
	ж: "zh",
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
	х: "kh",
	ц: "c",
	ч: "ch",
	ш: "sh",
	щ: "sch",
	ь: "",
	ы: "y",
	ъ: "",
	э: "e",
	ю: "yu",
	я: "ya",
};
