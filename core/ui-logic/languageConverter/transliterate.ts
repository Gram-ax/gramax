export const fromRuToEn = {
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

export const fromEnToRu: { [key: string]: string } = {};

Object.entries(fromRuToEn).forEach(([rus, eng]) => {
	if (!(fromEnToRu[eng] || eng === "")) fromEnToRu[eng] = rus;
});

const transliterateInternal = (str: string, converter: { [key: string]: string }): string => {
	Object.keys(converter).map((sub) => (str = str.replace(new RegExp(sub, "g"), converter[sub])));
	return str;
};

const kebab = (value: string): string => {
	return value
		.toLocaleLowerCase()
		.replaceAll(/[^a-zA-Zа-яА-Я0-9\-_]/g, "-")
		.replaceAll(/-+/g, "-")
		.replaceAll(/^-|-$/g, "");
};

export const transliterate = (
	value: string,
	opts?: { kebab?: boolean; targetLanguage?: "ru" | "en"; maxLength?: number },
): string => {
	const text = transliterateInternal(
		value.toLocaleLowerCase(),
		opts?.targetLanguage == "ru" ? fromEnToRu : fromRuToEn,
	);
	const res = opts?.maxLength ? text.slice(0, Math.min(text.length, opts.maxLength - 1)) : text;
	return opts?.kebab ? kebab(res) : res;
};
