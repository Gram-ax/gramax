import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import Button from "../../../../../components/Atoms/Button/Button";
import Checkbox from "../../../../../components/Atoms/Checkbox";
import SmallFence from "../../../../../components/Labels/SmallFence";
import { ListItem } from "../../../../../components/List/Item";
import ListLayout from "../../../../../components/List/ListLayout";
import useLocalize from "../../../../localization/useLocalize";

const MergeBranches = styled(
	({
		onClick,
		currentBranch,
		onBrancTohMergeInToChange = () => {},
		onDeleteAfterMergeChange = () => {},
		onCanMergeChange = () => {},
		branches,
		className,
	}: {
		onClick: () => void;
		currentBranch: string;
		onCanMergeChange?: (canMerge: boolean) => void;
		onBrancTohMergeInToChange?: (brancTohMergeInTo: string) => void;
		onDeleteAfterMergeChange?: (deleteAfterMerge: boolean) => void;
		branches: ListItem[];
		className?: string;
	}) => {
		const [brancTohMergeInTo, setBrancTohMergeInTo] = useState("");
		const [deleteAfterMerge, setDeleteAfterMerge] = useState(false);
		const [canMerge, setCanMerge] = useState(false);

		useEffect(() => {
			onBrancTohMergeInToChange(brancTohMergeInTo);
			setCanMerge(!!brancTohMergeInTo);
		}, [brancTohMergeInTo]);

		useEffect(() => {
			onDeleteAfterMergeChange(deleteAfterMerge);
		}, [deleteAfterMerge]);

		useEffect(() => {
			onCanMergeChange(canMerge);
		}, [canMerge]);

		const currentBranchElement = (
			<div title={currentBranch} className="current-branch">
				<SmallFence overflow="hidden" fixWidth value={currentBranch} />
			</div>
		);

		return (
			<div className={className}>
				<legend>{useLocalize("mergeBranches")}</legend>
				<div className="form-group">
					<div className="picker">
						<label className="control-label picker-text">
							<span>{useLocalize("mergeCurrentBranch")}</span>
							&nbsp;{currentBranchElement}&nbsp;
							<span>{useLocalize("inBranch").toLowerCase()}</span>
						</label>
						<ListLayout
							items={branches}
							placeholder={useLocalize("findBranch")}
							onSearchClick={() => setBrancTohMergeInTo("")}
							onItemClick={(branch) => setBrancTohMergeInTo(branch)}
						/>
					</div>
				</div>
				<div className="control-label delete-after-merge-checkbox">
					<Checkbox overflow="hidden" onClick={(value) => setDeleteAfterMerge(value)}>
						<div className="control-label picker-text">
							<span>{useLocalize("deleteBranch")}</span>
							&nbsp;{currentBranchElement}&nbsp;
							<span>{useLocalize("afterMerge").toLowerCase()}</span>
						</div>
					</Checkbox>
				</div>
				<div className="buttons">
					<Button disabled={!brancTohMergeInTo} onClick={onClick}>
						{useLocalize("merge")}
					</Button>
				</div>
			</div>
		);
	},
)`
	.picker-text {
		display: flex;
		white-space: nowrap;
		padding-right: 1rem;
	}
	.delete-after-merge-checkbox {
		width: 100%;
	}

	.current-branch {
		overflow: hidden;
	}
`;

export default MergeBranches;
