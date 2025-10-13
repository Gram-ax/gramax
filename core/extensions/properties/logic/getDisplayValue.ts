import t from "@ext/localization/locale/translate";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import { PropertyTypes } from "@ext/properties/models";
import { getInputComponent } from "@ext/properties/components/Helpers/CustomInputRenderer";

const getDisplayValue = (type: PropertyTypes, value: string[] | string, isExists: boolean = false) => {
	if (type === PropertyTypes.blockMd && value?.[0]) return Renderer(value[0], { components: getComponents() });
	if (type === PropertyTypes.flag) return isExists ? t("yes") : t("no");
	if (!getInputComponent(type)) return Array.isArray(value) ? value.join(", ") : value;

	if (type === PropertyTypes.date) {
		const date = value?.[0];
		if (!date) return "";
		return new Date(date).toLocaleDateString();
	}

	return Array.isArray(value) ? value.join(", ") : value;
};

export default getDisplayValue;
