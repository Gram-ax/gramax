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
		data-summary={props.summary}
		data-title={props.title}
		{...(props.children ? { "data-children": JSON.stringify(props.children) } : {})}
		data-url={props.url}
	>
		{props.title}
	</span>
);

export default HTMLTerm;
