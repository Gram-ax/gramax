import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";

export const ErrorIcon = styled(Icon)`
	vertical-align: unset !important;
	display: unset !important;

	svg {
		fill: hsl(var(--status-error));
		line {
			color: white;
		}
	}
`;

export const SuccessIcon = styled(Icon)`
	vertical-align: unset !important;
	display: unset !important;

	svg {
		fill: hsl(var(--status-success));
		path {
			color: white;
		}
	}
`;
