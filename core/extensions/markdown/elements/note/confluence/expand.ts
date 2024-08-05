import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";
import t from "@ext/localization/locale/translate";

const expand: NodeConverter = (expandNode) => {
	return {
		type: "note",
		attrs: { title: expandNode?.attrs?.title || t("more"), type: "info", collapsed: true },
		content: expandNode.content,
	};
};

export default expand;
