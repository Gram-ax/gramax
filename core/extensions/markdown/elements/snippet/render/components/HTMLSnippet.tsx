import React from "react";

const HTMLSnippet = (props: { id?: string; children?: React.ReactNode }) => (
	<div data-component="snippet" data-id={props.id}>
		{props.children}
	</div>
);

export default HTMLSnippet;
