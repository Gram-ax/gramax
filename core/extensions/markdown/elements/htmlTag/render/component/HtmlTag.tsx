import { filterHtmlAttributes, isAllowedElement, isSelfClosingTag } from "@ext/markdown/elements/htmlTag/logic/utils";
import { createElement, ReactNode } from "react";

const HtmlTag = (props: { attributes: Record<string, any>; name: string; children: ReactNode }) => {
	const { attributes, name, children } = props;

	const CustomTag = ({ children, ...componentProps }: { children?: React.ReactNode }) => {
		const Tag = name.toLowerCase();
		return createElement(Tag, { ...componentProps }, children);
	};
	if (!name || !isAllowedElement(name)) {
		return children;
	}

	const filteredProps = filterHtmlAttributes(name, attributes);

	if (name.toLowerCase() === "a" && filteredProps.href) {
		const url = filteredProps.href.toString().toLowerCase();
		if (url.startsWith("javascript:") || url.startsWith("data:")) {
			filteredProps.href = "#";
		}
	}

	if (isSelfClosingTag(name)) {
		return <CustomTag {...filteredProps} />;
	}

	return <CustomTag {...filteredProps}>{children}</CustomTag>;
};

export default HtmlTag;
