import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const divider: NotionNodeConverter = () => {
	return {
		type: "horizontal_rule",
	};
};

export default divider;
