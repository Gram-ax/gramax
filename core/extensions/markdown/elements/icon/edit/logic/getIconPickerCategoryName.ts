import t from "@ext/localization/locale/translate";

export const getIconPickerCategoryName = (category: string) => {
	return t(`icon-picker.categories.${category}` as keyof typeof t);
};
