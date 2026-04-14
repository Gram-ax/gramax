import styled from "@emotion/styled";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

const TableWrapper = (props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => (
	<div data-table-wrapper="" {...props} />
);

export const PADDING_LEFT_RIGHT = "1.5em";
export const PADDING_TOP_BOTTOM = "1.25em";

const StyledTableWrapper = styled(TableWrapper)`
	width: max-content;
	padding: ${PADDING_TOP_BOTTOM} ${PADDING_LEFT_RIGHT};

	table {
		display: table;
		td[colwidth] {
			pre {
				max-width: calc(var(--colwidth) - ${PADDING_LEFT_RIGHT} * 2);
			}
		}
	}
`;

export default StyledTableWrapper;
