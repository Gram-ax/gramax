import styled from "@emotion/styled";

const Accent = styled.span<{ bold?: boolean }>`
	font-weight: ${({ bold }) => (bold ? 400 : 300)};
	color: var(--color-merge-request-text-accent);
`;

export default Accent;
