import Icon from "@components/Atoms/Icon";
import { forwardRef } from "react";

const SourceListItem = forwardRef(({ code, text }: { code: string; text: string }, ref: any) => {
	return (
		<div ref={ref} style={{ padding: "6px 12px", width: "100%", display: "flex", alignItems: "center" }}>
			{code && <Icon code={code.toLowerCase()} />}
			<span>{text}</span>
		</div>
	);
});

export default SourceListItem;
