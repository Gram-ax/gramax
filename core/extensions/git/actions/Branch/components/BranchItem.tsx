import Tooltip from "@components/Atoms/Tooltip";
import Sidebar from "@components/Layouts/Sidebar";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { DateType } from "@core-ui/utils/dateUtils";
import styled from "@emotion/styled";
import BranchMenu from "@ext/git/actions/Branch/components/BranchMenu";
import { BranchStatusEnum, LocalIcon, MergeRequestIcon } from "@ext/git/actions/Branch/components/BranchStatus";
import DisableTooltipContent from "@ext/git/actions/Branch/components/DisableTooltipContent";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import InlineUser from "@ext/security/components/User/InlineUser";
import { isInDropdown } from "@ui-kit/Dropdown";
import { MouseEvent } from "react";

interface BranchLayoutProps {
	title: string;
	author: string;
	authorMail: string;
	date: DateType;
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
	refreshList?: () => void;
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

export const BranchLayout = (props: BranchLayoutProps) => {
	const { title, author, authorMail, date, branchStatus, hasMergeRequest } = props;

	return (
		<TitleWrapper>
			<div className="branch-name">
				<span>{title}</span>
				{branchStatus === BranchStatusEnum.Local && <LocalIcon />}
				{hasMergeRequest && <MergeRequestIcon />}
			</div>
			<div className="branch-info">
				<InlineUser date={date} mail={authorMail} name={author} />
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
		refreshList,
		onMergeRequestCreate,
		switchBranch,
		canSwitchBranch,
		className,
		disable,
	} = props;

	const hasMergeRequest = !!mergeRequest;
	const { isNext } = usePlatform();

	const onBranchSwitch = (e: MouseEvent<HTMLElement>) => {
		if (isInDropdown(e)) return;
		if (!canSwitchBranch(title)) return;
		switchBranch(title);
	};

	return (
		<Tooltip
			content={disable ? <DisableTooltipContent branch={title} /> : t("switch-branch")}
			delay={disable ? undefined : [500, 0]}
		>
			<div className={className} data-qa="qa-clickable">
				<div data-qa="qa-switch-branch" onClick={onBranchSwitch}>
					<Sidebar
						disable={disable}
						rightActions={
							!isNext && [
								<BranchMenu
									branchName={title}
									currentBranchName={currentBranchName}
									key={1}
									onMergeRequestCreate={onMergeRequestCreate}
									refreshList={refreshList}
								/>,
							]
						}
						titleComponent={
							<BranchLayout
								author={data?.lastCommitAuthor}
								authorMail={data?.lastCommitAuthorMail}
								branchStatus={branchStatus}
								date={data?.lastCommitModify}
								hasMergeRequest={hasMergeRequest}
								title={title}
							/>
						}
					/>
				</div>
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
