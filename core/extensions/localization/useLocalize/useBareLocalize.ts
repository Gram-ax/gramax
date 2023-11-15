import Language, { defaultLanguage } from "../core/model/Language";
import UiLocalization from "./data.json";

const useBareLocalize = (text: keyof typeof UiLocalization, language: Language): string =>
	UiLocalization[text]?.[language] ?? UiLocalization[text]?.[defaultLanguage] ?? text;

export default useBareLocalize;
