import React from "react";

const HTMLDiv = (props: { children?: React.ReactNode }) => (
  <div data-component="html">{props.children}</div>
);

export default HTMLDiv;
