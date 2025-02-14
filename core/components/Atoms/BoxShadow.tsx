import styled from "@emotion/styled";

const BoxShadow = styled.div<{ show: boolean }>`
	box-shadow: ${({ show }) => (show ? "var(--bar-shadow-vertical)" : "none")};
`;

export default BoxShadow;
