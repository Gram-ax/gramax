import t from "@ext/localization/locale/translate";

const isSystemProperty = (name: string) => {
	return t(`properties.system.${name}.name`) !== `properties.system.${name}.name`;
};

export const isNotSystemProperty = (name: string) => !isSystemProperty(name);

export default isSystemProperty;
