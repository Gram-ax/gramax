import t from "@ext/localization/locale/translate";

export const getEmojiCategoryName = (category: string): string => {
	const key = `icon-picker.emoji-categories.${category}` as keyof typeof t;
	const translated = t(key);
	return translated === key ? category : translated;
};
