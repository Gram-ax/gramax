import Tooltip from "@components/Atoms/Tooltip";
import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import { classNames } from "@components/libs/classNames";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";

export type ShowMergeRequestProps = {
	className?: string;
	mergeRequest: MergeRequest;
	isShow: boolean;
	setShow: (show: boolean) => void;
};

const Wrapper = styled.div<{ show?: boolean }>`
	${({ show }) =>
		show &&
		css`
			background-color: var(--color-merge-request-bg);

			span {
				color: var(--color-primary);
			}
		`}
`;

const ShowMergeRequest = ({ className, mergeRequest, isShow, setShow }: ShowMergeRequestProps) => {
	if (!getIsDevMode()) return null;

	if (!mergeRequest) return null;
	const approvedCount = mergeRequest.approvers.filter((a) => !!a.approvedAt).length;
	const approvedTotal = mergeRequest.approvers.length;
	return (
		<Wrapper show={isShow}>
			<StatusBarElement
				className={classNames(className, { "is-active": isShow })}
				onClick={() => setShow(!isShow)}
				data-qa="qa-clickable"
				iconCode="git-pull-request-arrow"
				iconStyle={isShow ? { color: "var(--color-primary)" } : null}
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
