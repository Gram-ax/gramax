import t from "@ext/localization/locale/translate";
import { Property, PropertyTypes } from "@ext/properties/models";

const getTextByProperty = (property: Property, existsInArticle: boolean = false): string => {
	const isFlag = property.type === PropertyTypes.flag;
	if (!existsInArticle && !isFlag) return "";

	return isFlag ? (existsInArticle ? t("yes") : t("no")) : existsInArticle ? property.value?.join(", ") : "";
};

export default getTextByProperty;
