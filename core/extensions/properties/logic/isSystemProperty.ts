import t from "@ext/localization/locale/translate";

export default (name: string) => {
	return t(`properties.system.${name}.name`) !== `properties.system.${name}.name`;
};
