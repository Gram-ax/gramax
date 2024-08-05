import t from "@ext/localization/locale/translate";

const cut = {
	group: "block",
	content: "block+",
	defining: true,
	attrs: {
		text: { default: t("more") },
		expanded: { default: true },
		isInline: { default: false },
	},
};

export default cut;
