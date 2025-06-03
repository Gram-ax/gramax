import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";

interface BaseArticleBreadcrumbProps {
	onCloseClick: () => void;
}

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
`;

const BaseArticleBreadcrumb = ({ onCloseClick }: BaseArticleBreadcrumbProps) => {
	return (
		<Wrapper>
			<div />
			<div>
				<Icon code="x" tooltipContent={t("close")} onClick={onCloseClick} isAction />
			</div>
		</Wrapper>
	);
};
export default BaseArticleBreadcrumb;
