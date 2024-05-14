import { transliterate } from "@core-ui/languageConverter/transliterate";

export class StringRewriter {
	private _keyboardRuToEn = new Map<string, string>([
		["й", "q"],
		["ц", "w"],
		["у", "e"],
		["к", "r"],
		["е", "t"],
		["н", "y"],
		["г", "u"],
		["ш", "i"],
		["щ", "o"],
		["з", "p"],
		["х", "["],
		["ъ", "]"],
		["ф", "a"],
		["ы", "s"],
		["в", "d"],
		["а", "f"],
		["п", "g"],
		["р", "h"],
		["о", "j"],
		["л", "k"],
		["д", "l"],
		["ж", ";"],
		["э", "'"],
		["я", "z"],
		["ч", "x"],
		["с", "c"],
		["м", "v"],
		["и", "b"],
		["т", "n"],
		["ь", "m"],
		["б", ","],
		["ю", "."],
	]);

	public changeTextLayout(stringToFix: string) {
		let wrongLayoutQuery = "";
		stringToFix.toLowerCase();

		for (let i = 0; i < stringToFix.length; i++) {
			const letter = stringToFix[i];
			const char = this._keyboardRuToEn.get(letter) || this._getKeyByValue(letter) || letter;

			wrongLayoutQuery += char;
		}

		return wrongLayoutQuery;
	}

	public changeRussianToEnglishTransliteration(stringToFix: string): string {
		return transliterate(stringToFix);
	}

	public changeEnglishToRussianTransliteration(stringToFix: string): string {
		return transliterate(stringToFix, { targetLanguage: "ru" });
	}

	private _getKeyByValue(letter: string): string {
		const keys = this._keyboardRuToEn.keys();

		for (const key of keys) if (this._keyboardRuToEn.get(key) === letter) return key;

		return null;
	}
}
