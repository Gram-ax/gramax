import getIsDevMode from "@core-ui/utils/getIsDevMode";
import BranchMenu from "@ext/git/actions/Branch/components/BranchMenu";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import { useState } from "react";
import Sidebar from "../../../../../components/Layouts/Sidebar";
import styled from "@emotion/styled";
import { BranchStatusEnum, MergeRequestIcon, RemoteOrLocalIcon } from "@ext/git/actions/Branch/components/BranchStatus";
import InlineUser from "@ext/security/components/User/InlineUser";
import Tooltip from "@components/Atoms/Tooltip";
import DisableTooltipContent from "@ext/git/actions/Branch/components/DisableTooltipContent";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import t from "@ext/localization/locale/translate";
import ButtonLink from "@components/Molecules/ButtonLink";
import { TextSize } from "@components/Atoms/Button/Button";

interface TitleComponentProps {
	branchName: string;
	lastAuthor: string;
	lastAuthorMail: string;
	lastModify: string;
	branchStatus?: BranchStatusEnum;
	hasMergeRequest?: boolean;
}

interface GitDateSideBarProps {
	title: string;
	currentBranchName?: string;
	branchStatus?: BranchStatusEnum;
	isLocal?: boolean;
	data?: { lastCommitAuthor?: string; lastCommitAuthorMail?: string; lastCommitModify: string };
	mergeRequest?: MergeRequest;
	disable?: boolean;
	showBranchMenu?: boolean;
	className?: string;
	switchBranch?: (branchName: string) => void;
	canSwitchBranch?: (branchName: string) => boolean;
	closeList?: () => void;
	onMergeRequestCreate?: () => void;
}

const TitleWrapper = styled.div`
	max-width: 100%;
	text-overflow: ellipsis;
	white-space: nowrap;

	.branch-info {
		zoom: 96%;
		margin-top: -2px;
		display: flex;
		align-items: center;
		overflow: hidden;
	}

	.branch-name {
		color: var(--color-article-text);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 2px;
	}

	.branch-name > span {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding-left: 0;
	}

	.branch-info > div {
		max-width: 100%;
		overflow: hidden;
	}

	.branch-info > div > .user-circle {
		font-size: 0.5em;
	}

	.branch-info > div > .dot-divider {
		margin-right: -0.3rem;
		margin-left: -0.3rem;
	}

	.branch-info .user-name {
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}

	.branch-info > div > span:last-of-type {
		min-width: 6.5em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
`;

const TitleComponent = (props: TitleComponentProps) => {
	const { branchName, lastAuthor, lastAuthorMail, lastModify, branchStatus, hasMergeRequest } = props;
	return (
		<TitleWrapper>
			<div className="branch-name">
				<span>{branchName}</span>
				<RemoteOrLocalIcon isRemote={branchStatus === BranchStatusEnum.Remote} />
				{hasMergeRequest && <MergeRequestIcon />}
			</div>
			<div className="branch-info">
				<InlineUser name={lastAuthor} mail={lastAuthorMail} date={lastModify} />
			</div>
		</TitleWrapper>
	);
};

const GitDateSideBar = (props: GitDateSideBarProps) => {
	const {
		title,
		currentBranchName,
		branchStatus,
		mergeRequest,
		data,
		closeList,
		onMergeRequestCreate,
		switchBranch,
		canSwitchBranch,
		className,
		disable,
	} = props;
	const [isDevMode] = useState(() => getIsDevMode());
	const hasMergeRequest = Boolean(isDevMode && mergeRequest);

	return (
		<Tooltip content={disable ? <DisableTooltipContent branch={title} /> : undefined}>
			<div data-qa="qa-clickable" className={className}>
				<Sidebar
					disable={disable}
					titleComponent={
						<TitleComponent
							branchName={title}
							lastAuthor={data?.lastCommitAuthor}
							lastAuthorMail={data?.lastCommitAuthorMail}
							lastModify={data?.lastCommitModify}
							branchStatus={branchStatus}
							hasMergeRequest={hasMergeRequest}
						/>
					}
					rightActions={[
						<Tooltip key={0} content={t("switch-branch")}>
							<ButtonLink
								key={0}
								data-qa="qa-switch-branch"
								iconCode="arrow-right"
								buttonStyle={ButtonStyle.transparent}
								textSize={TextSize.M}
								onClick={() => switchBranch(title)}
								disabled={!canSwitchBranch(title)}
							/>
						</Tooltip>,
						<BranchMenu
							key={1}
							closeList={closeList}
							branchName={title}
							onMergeRequestCreate={onMergeRequestCreate}
							currentBranchName={currentBranchName}
						/>,
					]}
				/>
			</div>
		</Tooltip>
	);
};

export default styled(GitDateSideBar)`
	cursor: pointer;
	width: 100%;
	padding: 0.15rem 1rem 0.15rem 1rem;

	.sidebar-article-element {
		width: 100%;
	}

	.sidebar-right-actions > * {
		opacity: 0;
		font-size: 1.25em;
	}

	.article-title {
		justify-content: space-between;
	}

	.title-component {
		max-width: 80%;
		width: 100%;
	}

	&:hover,
	:has(.sidebar-right-actions *[aria-expanded="true"]) {
		background-color: var(--color-merge-request-hover);
	}

	&:hover .sidebar-right-actions > *,
	:has(.sidebar-right-actions *[aria-expanded="true"]) .sidebar-right-actions > * {
		opacity: 1;
	}

	.branch-actions {
		overflow: hidden;
		height: 0;
		transition: height var(--transition-time-fast) ease-out;
	}

	&.selected .branch-actions {
		height: 2.5em;
	}
`;
