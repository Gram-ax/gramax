import React from "react";

const HTMLBlockProperty = (props: { children?: React.ReactNode }) => (
  <div data-component="block-property">{props.children}</div>
);

export default HTMLBlockProperty;
