import styled from "@emotion/styled";
import Select from "react-dropdown-select";
import Icon from "../Atoms/Icon";
import SpinnerLoader from "../Atoms/SpinnerLoader";

export default styled(function <T extends { value: string; label: string; [key: string]: string }>({
	values,
	options,
	onFocus,
	onChange,
	create,
	loading,
	disabled,
	clearable,
	placeholder,
	addPlaceholder,
	createNewLabel,
	className,
}: {
	values: T[];
	options: T[];
	onFocus: () => void;
	onChange: (value: T[]) => void;
	create?: boolean;
	loading?: boolean;
	disabled?: boolean;
	clearable?: boolean;
	placeholder?: string;
	addPlaceholder?: string;
	createNewLabel?: string;
	className?: string;
}) {
	return (
		<div className={className} onClickCapture={onFocus}>
			<Select<T>
				multi
				values={values}
				options={options}
				valueField="value"
				labelField="label"
				onChange={onChange}
				create={create}
				loading={loading}
				disabled={disabled}
				clearable={clearable}
				placeholder={placeholder}
				addPlaceholder={addPlaceholder}
				createNewLabel={createNewLabel}
				dropdownHandleRenderer={({ state }) => {
					if (!options.length) return null;
					return (
						<div className="custom-icon" style={state.dropdown ? { marginTop: "-2px" } : {}}>
							<Icon code={`chevron-${!state.dropdown ? "down" : "up"}`} isAction />
						</div>
					);
				}}
				clearRenderer={({ methods }) => {
					return (
						<div className="custom-icon">
							<Icon code="xmark" isAction onClick={methods.clearAll} />
						</div>
					);
				}}
				loadingRenderer={() => (
					<div className="custom-icon">
						<SpinnerLoader width={15} height={15} lineWidth={2} />
					</div>
				)}
				noDataRenderer={() => <></>}
			/>
		</div>
	);
})`
	.react-dropdown-select {
		outline: 0;
		width: 100%;
		border: none;
		font-weight: 300;
		padding: 6px 12px;
		border-radius: 4px;
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
		border-radius: var(--radius-block);
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
