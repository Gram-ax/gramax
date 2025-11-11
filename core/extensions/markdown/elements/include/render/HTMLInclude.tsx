import React from "react";

const HTMLInclude = (props: { children?: React.ReactNode }) => <div data-component="include">{props.children}</div>;

export default HTMLInclude;
