import { ListItem } from "@components/List/Item";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { useEffect, useState } from "react";
import Button from "../../../../../components/Atoms/Button/Button";
import Checkbox from "../../../../../components/Atoms/Checkbox";
import SmallFence from "../../../../../components/Labels/SmallFence";
import ListLayout from "../../../../../components/List/ListLayout";

const MergeBranches = styled(
	({
		onClick,
		currentBranch,
		onBranchToMergeInToChange = () => {},
		onDeleteAfterMergeChange = () => {},
		onCanMergeChange = () => {},
		branches,
		isLoadingData,
		className,
	}: {
		onClick: () => void;
		isLoadingData?: boolean;
		currentBranch: string;
		onCanMergeChange?: (canMerge: boolean) => void;
		onBranchToMergeInToChange?: (branchToMergeInTo: string) => void;
		onDeleteAfterMergeChange?: (deleteAfterMerge: boolean) => void;
		branches: ListItem[];
		className?: string;
	}) => {
		const [branchToMergeInTo, setBranchToMergeInTo] = useState("");
		const [deleteAfterMerge, setDeleteAfterMerge] = useState(false);
		const canMerge = !!branchToMergeInTo;

		useEffect(() => {
			onBranchToMergeInToChange(branchToMergeInTo);
		}, [branchToMergeInTo]);

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
				<legend>{t("git.merge.branches")}</legend>
				<div className="form-group">
					<div className="picker">
						<label className="control-label picker-text">
							<span>{t("git.merge.current-branch")}</span>
							&nbsp;{currentBranchElement}&nbsp;
							<span>{t("in-branch").toLowerCase()}</span>
						</label>
						<ListLayout
							isLoadingData={isLoadingData}
							items={branches}
							placeholder={t("find-branch")}
							onSearchClick={() => setBranchToMergeInTo("")}
							onItemClick={(branch) => setBranchToMergeInTo(branch)}
						/>
					</div>
				</div>
				<div className="control-label delete-after-merge-checkbox">
					<Checkbox overflow="hidden" onClick={(value) => setDeleteAfterMerge(value)}>
						<div className="control-label picker-text" data-qa="qa-clickable">
							<span>{t("delete-branch")}</span>
							&nbsp;{currentBranchElement}&nbsp;
							<span>{t("git.merge.after-merge").toLowerCase()}</span>
						</div>
					</Checkbox>
				</div>
				<div className="buttons">
					<Button disabled={!branchToMergeInTo} onClick={onClick}>
						{t("git.merge.merge")}
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
