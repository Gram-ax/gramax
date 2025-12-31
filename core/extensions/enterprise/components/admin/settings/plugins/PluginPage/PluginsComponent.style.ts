import styled from "@emotion/styled";
import { Table } from "ics-ui-kit/components/table";

export const StyledTableWrapper = styled(Table)`
	border: 1px solid var(--color-merge-request-border);
	border-radius: var(--radius-large);
	overflow: hidden;

	table {
		table-layout: fixed;
	}

	tr.disabled-row {
		background-color: var(--color-menu-bg);

		&:hover {
			background-color: var(--color-menu-bg);
		}

		&[data-state="selected"] {
			background-color: var(--color-menu-bg);
		}
	}

	tr.deleted-row {
		background-color: var(--color-danger-bg);
		text-decoration: line-through;
		opacity: 0.7;

		&:hover {
			background-color: var(--color-danger-bg);
		}

		&[data-state="selected"] {
			background-color: var(--color-danger-bg);
		}
	}
`;
