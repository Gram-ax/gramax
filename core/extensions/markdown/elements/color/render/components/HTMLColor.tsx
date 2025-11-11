import React from "react";

const HTMLColor = (props: { color: string; children?: React.ReactNode }) => (
  <span data-component="color" data-color={props.color} style={{ color: props.color }}>
    {props.children}
  </span>
);

export default HTMLColor;
