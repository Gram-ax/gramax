import React from "react";

const HTMLBlockField = (props: { children?: React.ReactNode }) => (
	<div data-component="block-field">{props.children}</div>
);

export default HTMLBlockField;
