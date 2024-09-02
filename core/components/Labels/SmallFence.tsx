import styled from "@emotion/styled";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import { Property } from "csstype";

const SmallFence = (props: { value: string; fixWidth?: boolean; overflow?: Property.Overflow; className?: string }) => {
	const { className, value, overflow } = props;
	return (
		<div className={className}>
			<CodeBlock value={value} style={{ overflow }} withoutHighlight />
		</div>
	);
};

export default styled(SmallFence)`
	${(p) => (p.fixWidth ? "flex: 1; overflow: hidden;" : "")}

	> pre {
		padding: 2px 6px;
		margin: 0 !important;
		color: var(--color-fence-text);
	}
`;
