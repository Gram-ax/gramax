import t from "@ext/localization/locale/translate";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { PropertyTypes } from "@ext/properties/models";

const InlineProperty = ({ bind }: { bind: string }) => {
	if (!PropertyServiceProvider?.value) return;
	const { articleProperties, properties } = PropertyServiceProvider.value;
	const property = articleProperties?.find((p) => p.name === bind);
	const isFlag = property ? property?.type === PropertyTypes.flag : properties.get(bind)?.type === PropertyTypes.flag;

	if (!property && !isFlag) return;
	const displayValue = isFlag ? (property ? t("yes") : t("no")) : property.value?.join(", ") || bind || "???";
	return displayValue;
};

export default InlineProperty;
