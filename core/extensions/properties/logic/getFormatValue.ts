import { InputValue } from "@ext/properties/components/Helpers/CustomInputRenderer";

const getFormatValue = (value: InputValue): string => {
	if (typeof value !== "string" && Array.isArray(value)) return value.map((v) => getFormatValue(v)).join(",");
	if (value instanceof Date) return value.toISOString();

	return value.toString();
};

export default getFormatValue;
