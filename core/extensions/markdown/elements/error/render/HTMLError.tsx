import type React from "react";

const HTMLError = (props: { children?: React.ReactNode }) => <div data-component="error">{props.children}</div>;

export default HTMLError;
