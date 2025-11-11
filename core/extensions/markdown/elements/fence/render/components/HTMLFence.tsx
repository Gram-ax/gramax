import React from "react";

const HTMLFence = (props: { style?: React.CSSProperties; value?: React.ReactNode; children?: React.ReactNode }) => (
  <pre data-component="fence" style={props.style}>{props.value || props.children}</pre>
);

export default HTMLFence;
