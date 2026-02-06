import React from "react";

export interface HTMLHeadingProps {
	id?: string;
	level?: number;
	dataQa?: string;
	copyLinkIcon?: boolean;
	children?: React.ReactNode;
}

const HTMLHeading = (props: HTMLHeadingProps) => {
	const hash = props.id ? `#${props.id}` : "";
	const header = (
		<>
			{props.children}
			{props.copyLinkIcon !== false && !!props.children && (
				<a className="anchor" contentEditable={false} data-mdignore={true} href={hash}>
					<i className="link-icon chain-icon" />
				</a>
			)}
		</>
	);
	return React.createElement(
		"h" + (props.level || 1),
		{ id: props.id, "data-qa": props.dataQa, "data-component": "header" },
		header,
	);
};

export default HTMLHeading;
