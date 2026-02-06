import React from "react";
import HTMLComponents from "../../../../core/render/components/getComponents/HTMLComponents";

export interface HTMLLinkProps {
	children: React.ReactNode;
	href?: string;
	resourcePath?: string;
	isFile?: boolean;
	hash?: string;
}

const HTMLLink = (html: HTMLComponents) => {
	return (props: HTMLLinkProps) => {
		const { children, resourcePath, isFile, hash, href } = props;
		const newHref = html.getHref(resourcePath, isFile, hash, href);

		return (
			<a data-component="link" href={newHref}>
				{children}
			</a>
		);
	};
};

export default HTMLLink;
