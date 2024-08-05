import t from "@ext/localization/locale/translate";

const inlineCut_component = {
	group: "inline",
	content: "inline*",
	inline: true,
	attrs: {
		text: { default: t("expand") },
		expanded: { default: true },
		isInline: { default: true },
	},
};

export default inlineCut_component;
