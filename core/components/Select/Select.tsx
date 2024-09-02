import styled from "@emotion/styled";
import SelectRDS, { SelectProps } from "react-dropdown-select";
import Icon from "../Atoms/Icon";
import SpinnerLoader from "../Atoms/SpinnerLoader";

const Select = <T extends { value: string; label: string; [key: string]: string }>(
	props: SelectProps<T> & { onFocus: any; chevronView?: boolean },
) => {
	const { onFocus, className, chevronView, ...otherProps } = props;

	return (
		<div className={className} onClickCapture={onFocus}>
			<SelectRDS<T>
				multi
				valueField="value"
				labelField="label"
				{...otherProps}
				dropdownHandleRenderer={({ state }) =>
					!props.options.length || chevronView ? (
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

export default styled(Select)`
	.react-dropdown-select {
		outline: 0;
		width: 100%;
		border: none;
		font-weight: 300;
		padding: 6px 12px;
		border-radius: var(--radius-small);
		box-shadow: none !important;
		background: var(--color-code-bg);
	}

	.react-dropdown-select-content > .react-dropdown-select-input:first-of-type {
		margin: 0;
	}

	.react-dropdown-select,
	.react-dropdown-select-input {
		font-size: 14px;
		color: var(--color-prism-text);
	}

	.custom-icon {
		display: flex;

		i {
			padding: 0px;
			font-size: 10px;
		}
	}

	.react-dropdown-select-dropdown-handle {
		pointer-events: ${(p) => (p.disabled ? "none;" : "auto")};
	}

	.react-dropdown-select-option {
		background: var(--color-tooltip-opacity-bg);
		margin: 3px 5px 3px 0px;

		.react-dropdown-select-option-remove:hover {
			color: #fff;
			opacity: 0.6;
		}
	}

	.react-dropdown-select-dropdown {
		border: none;
		border-radius: var(--radius-small);
		background: var(--color-code-copy-bg);

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
			border: none;
			color: var(--color-prism-text);
		}
	}
`;
