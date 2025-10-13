import styled from "@emotion/styled";

const Wrapper = styled.div<{ bottom?: string }>`
	bottom: ${({ bottom }) => bottom || "4px"};
	z-index: var(--z-index-toolbar);
	position: sticky;

	pointer-events: none;
`;

const ArticleExtensions = ({ id, bottom }: { id: string; bottom?: string }) => {
	return (
		<Wrapper bottom={bottom}>
			<div id={id} />
		</Wrapper>
	);
};

export default ArticleExtensions;
