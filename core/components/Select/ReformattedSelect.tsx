import styled from "@emotion/styled";
import SelectRDS, { SelectProps } from "react-dropdown-select";
import Icon from "../Atoms/Icon";
import SpinnerLoader from "../Atoms/SpinnerLoader";

const ReformattedSelect = <T extends { value: string; label: string; [key: string]: string }>(
	props: SelectProps<T> & { onFocus?: any; chevronView?: boolean; dataQa?: string },
) => {
	const { onFocus, className, chevronView, dataQa, ...otherProps } = props;

	return (
		<div className={className} onClickCapture={onFocus} data-qa={dataQa}>
			<SelectRDS<T>
				multi
				valueField="value"
				labelField="label"
				{...otherProps}
				dropdownHandleRenderer={({ state }) =>
					!props.options?.length && chevronView ? (
						<div className="custom-icon" style={state.dropdown ? { marginTop: "-2px" } : {}}>
							<Icon code={`chevron-${!state.dropdown ? "down" : "up"}`} viewBox="3 3 18 18" isAction />
						</div>
					) : null
				}
				clearRenderer={() => null}
				loadingRenderer={() => (
					<div className="custom-icon">
						<SpinnerLoader width={15} height={15} lineWidth={2} />
					</div>
				)}
				noDataRenderer={() => <></>}
			/>
		</div>
	);
};

export default styled(ReformattedSelect)`
	.react-dropdown-select {
		padding-left: 13px;
		font-weight: 400;
		font-size: 0.875rem;
		line-height: 1.25rem;
		border-radius: 0.5rem;
		color: hsl(var(--primary-fg));
		border-color: hsl(var(--secondary-border)) !important;
		box-shadow: none !important;

		input {
			font-size: 0.875rem !important;
		}

		:focus,
		:hover,
		:active {
			border-color: hsl(var(--primary-border)) !important;
		}

		background: transparent;
	}

	.react-dropdown-select-content > .react-dropdown-select-input:first-of-type {
		margin: 0;
	}

	.custom-icon {
		display: flex;

		i {
			padding: 0;
			font-size: 10px;
		}
	}

	input::placeholder {
		color: hsl(var(--muted));
	}

	.react-dropdown-select-dropdown-handle {
		pointer-events: ${(p) => (p.disabled ? "none;" : "auto")};
	}

	.react-dropdown-select-option {
		background: var(--color-tooltip-opacity-bg);
		margin: 3px 5px 3px 0;

		.react-dropdown-select-option-remove:hover {
			color: #fff;
			opacity: 0.6;
		}
	}
	.react-dropdown-select-dropdown:empty {
		opacity: 0;
	}

	.react-dropdown-select-dropdown {
		background-color: hsl(var(--secondary-bg));
		border-radius: var(--radius);
		border-color: hsl(var(--secondary-border));

		.react-dropdown-select-item:hover,
		.react-dropdown-select-item:focus,
		.react-dropdown-select-item-active,
		.react-dropdown-select-dropdown-add-new:hover,
		.react-dropdown-select-item-selected {
			background: var(--color-lev-sidebar-hover);
		}

		.react-dropdown-select-dropdown-add-new,
		.react-dropdown-select-no-data,
		.react-dropdown-select-item {
			font-weight: 400;
			font-size: 0.875rem;
			line-height: 1.25rem;
			border-radius: 0.5rem;
			color: hsl(var(--primary-fg));
			border: none;
		}
	}
`;
