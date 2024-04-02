import TabAttrs from "@ext/markdown/elements/tabs/model/TabAttrs";

const getVisibleChildAttrs = (tags: string[], currentTag: string, childAttrs: TabAttrs[]) => {
	if (!tags || !tags?.length || !currentTag) {
		return childAttrs.map((attrs) => attrs);
	}

	return childAttrs
		.map((attrs) => {
			if (attrs.tag && attrs.tag !== currentTag) return null;
			return attrs;
		})
		.filter((i) => i);
};

export default getVisibleChildAttrs;
