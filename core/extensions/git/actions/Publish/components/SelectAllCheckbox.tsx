import Checkbox from "@components/Atoms/Checkbox";
import Divider from "@components/Atoms/Divider";
import styled from "@emotion/styled";
import Discard from "@ext/git/actions/Discard/Discard";
import t from "@ext/localization/locale/translate";

interface SelectAllCheckboxProps {
	checked: boolean;
	showDiscardAllButton: boolean;
	filePathsToDiscard: string[];
	onCheckboxClick: (checked: boolean) => void;
	onCheckboxChange: (checked: boolean) => void;
	onStartDiscard: (paths: string[]) => void;
	onEndDiscard: (paths: string[]) => void;
	className?: string;
}

const SelectAllCheckboxUnstyled = (props: SelectAllCheckboxProps) => {
	const {
		checked,
		showDiscardAllButton,
		filePathsToDiscard,
		onCheckboxClick,
		onCheckboxChange,
		onStartDiscard,
		onEndDiscard,
		className,
	} = props;

	return (
		<div className={className}>
			<div className="select-all" data-qa="qa-clickable">
				<div className="select-all-checkbox">
					<Checkbox checked={checked} onClick={onCheckboxClick} onChange={onCheckboxChange}>
						<p className="select-all-text" style={{ userSelect: "none" }}>
							{t("select-all")}
						</p>
					</Checkbox>
					{showDiscardAllButton && (
						<div className="discard-all">
							<Discard
								paths={filePathsToDiscard}
								selectedText
								onStartDiscard={onStartDiscard}
								onEndDiscard={onEndDiscard}
							/>
						</div>
					)}
				</div>
				<div className="divider">
					<Divider />
				</div>
			</div>
		</div>
	);
};

const SelectAllCheckbox = styled(SelectAllCheckboxUnstyled)`
	.select-all {
		border-radius: 4px 0px 0px 0px;
	}

	.select-all-checkbox {
		display: flex;
		min-width: 100%;
		width: fit-content;
		flex-direction: row;
		justify-content: space-between;
		color: var(--color-primary-general);
	}

	.discard-all a {
		color: var(--color-primary-general);
		:hover {
			color: var(--color-primary);
		}
	}

	.select-all-text {
		color: var(--color-primary-general);
	}

	.select-all-text:hover {
		color: var(--color-primary);
	}

	.select-all-checkbox {
		a {
			font-weight: 300;
			color: var(--color-primary-general);
			text-decoration: none;
		}

		a:hover {
			color: var(--color-primary);
		}
	}

	.divider {
		padding-top: 1rem;
	}
`;

export default SelectAllCheckbox;
