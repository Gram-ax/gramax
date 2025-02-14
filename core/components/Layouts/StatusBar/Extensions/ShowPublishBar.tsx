import Icon from "@components/Atoms/Icon";
import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";

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

const Counter = styled.span`
	font-size: 10px;
	display: flex;
	align-items: center;
	height: 100%;

	i {
		font-size: 8px;
	}
`;

const ShowPublishBar = ({ onClick, isShow }: { onClick: () => void; isShow: boolean }) => {
	const overview = GitIndexService.getOverview();
	const total = overview.added + overview.deleted + overview.modified;

	return (
		<Wrapper show={isShow} data-qa="qa-publish-trigger">
			<StatusBarElement
				onClick={onClick}
				iconCode="custom-cloud-up"
				iconStyle={isShow ? { fill: "var(--color-primary)" } : { fill: "white" }}
				tooltipText={t("publish-changes")}
			>
				{total > 0 && (
					<Counter>
						{total}
						<Icon code="move-up" strokeWidth="2" viewBox="2 0 20 20"></Icon>
					</Counter>
				)}
			</StatusBarElement>
		</Wrapper>
	);
};

export default ShowPublishBar;
