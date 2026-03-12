import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";

const Wrapper = styled.div`
	-webkit-line-clamp: 2;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	overflow: hidden;
	line-height: 1.2;
	display: flex;
	max-width: 100%;

	span:nth-of-type(1) {
		margin-right: 0.12rem;
	}
`;

const Description = ({ content }: { content: string }) => {
	if (!content?.trim()) return null;

	return (
		<Wrapper>
			<span>{t("description")}:</span>
			<TextOverflowTooltip className="truncate">{content}</TextOverflowTooltip>
		</Wrapper>
	);
};

export default Description;
