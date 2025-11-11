import React from "react";

export interface HTMLTermProps {
	title?: string;
	summary?: string;
	url?: string;
	children?: React.ReactNode;
}

const HTMLTerm = (props: HTMLTermProps) => (
	<span
		data-component="term"
		data-title={props.title}
		data-summary={props.summary}
		{...(props.children ? { "data-children": JSON.stringify(props.children) } : {})}
		data-url={props.url}
	>
		{props.title}
	</span>
);

export default HTMLTerm;
