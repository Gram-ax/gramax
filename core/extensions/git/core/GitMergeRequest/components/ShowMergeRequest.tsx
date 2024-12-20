import Tooltip from "@components/Atoms/Tooltip";
import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import { classNames } from "@components/libs/classNames";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import styled from "@emotion/styled";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";

export type ShowMergeRequestProps = {
	className?: string;
	mergeRequest: MergeRequest;
	isShow: boolean;
	setShow: (show: boolean) => void;
};

const Wrapper = styled.div`
	background-color: var(--color-nav-menu-bg);
	span {
		color: var(--color-primary);
	}
`;

const ShowMergeRequest = ({ className, mergeRequest, isShow, setShow }: ShowMergeRequestProps) => {
	if (!getIsDevMode()) return null;

	if (!mergeRequest) return null;
	const approvedCount = mergeRequest.assignees.filter((a) => !!a.approvedAt).length;
	const approvedTotal = mergeRequest.assignees.length;
	return (
		<Wrapper>
			<StatusBarElement
				className={classNames(className, { "is-active": isShow })}
				onClick={() => setShow(!isShow)}
				data-qa="qa-clickable"
				iconCode="git-pull-request-arrow"
				iconStyle={{ color: "var(--color-primary)" }}
				iconStrokeWidth="1.6"
			>
				<Tooltip
					content={t("git.merge-requests.approvedCountTooltip")
						.replace("{{approvedCount}}", approvedCount)
						.replace("{{approvedTotal}}", approvedTotal)}
				>
					<span>
						{approvedCount} / {approvedTotal}
					</span>
				</Tooltip>
			</StatusBarElement>
		</Wrapper>
	);
};

export default ShowMergeRequest;
