import styled from "@emotion/styled";

export const ArticlePropertyWrapper = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5em;
	font-size: 0.7em;

	@media print {
		display: none;
	}
`;
