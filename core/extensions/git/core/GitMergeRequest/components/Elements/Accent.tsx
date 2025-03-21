import styled from "@emotion/styled";

const Accent = styled.span<{ bold?: boolean }>`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: ${({ bold }) => (bold ? 400 : 300)};
	color: var(--color-merge-request-text-accent);
`;

export default Accent;
