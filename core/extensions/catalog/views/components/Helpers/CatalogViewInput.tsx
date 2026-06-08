import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { Input } from "@ui-kit/Input";
import { MenuItem } from "@ui-kit/MenuItem";
import { forwardRef } from "react";

const StyledMenuItem = styled(MenuItem)`
	margin-left: -0.5rem;
	width: calc(100% + 1rem);
	&[aria-selected="true"] {
		background-color: hsl(var(--secondary-bg-hover));
	}
`;

const StyledInput = styled(Input)`
	height: auto;
	padding-top: 0.125rem;
	padding-bottom: 0.125rem;
`;

export const CatalogViewInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
	(props, ref) => {
		return (
			<StyledMenuItem className="[&>span:first-child]:shrink-0 bg-secondary-bg-hover">
				<StyledInput
					autoFocus
					className="px-1.5 py-0.5 h-auto"
					data-testid="catalog-view-item-input"
					placeholder={t("enter-value")}
					{...props}
					ref={ref}
				/>
			</StyledMenuItem>
		);
	},
);

CatalogViewInput.displayName = "CatalogViewInput";
