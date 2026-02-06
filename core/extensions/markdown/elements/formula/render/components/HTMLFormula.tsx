import React from "react";

const HTMLFormula = (props: { content: string }) => (
	<span dangerouslySetInnerHTML={{ __html: props.content }} data-component="formula" />
);

export default HTMLFormula;
