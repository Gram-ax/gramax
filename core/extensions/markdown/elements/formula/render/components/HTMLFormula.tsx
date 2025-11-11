import React from "react";

const HTMLFormula = (props: { content: string }) => (
	<span data-component="formula" dangerouslySetInnerHTML={{ __html: props.content }} />
);

export default HTMLFormula;
