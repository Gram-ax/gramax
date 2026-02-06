import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import { Accent } from "@ext/git/core/GitMergeRequest/components/Elements";
import t from "@ext/localization/locale/translate";
import { useMemo } from "react";

const Wrapper = styled.div`
	-webkit-line-clamp: 2;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.2;

	span:nth-of-type(1) {
		margin-right: 0.12rem;
	}
`;

const LargeContent = styled.div`
	max-width: 28rem;
	line-height: 1.4;
	overflow: hidden;
	word-break: break-word;
	word-wrap: break-word;
	white-space: pre-wrap;
`;

const Description = ({ content }: { content: string }) => {
	if (!content?.trim()) return null;

	const Content = useMemo(() => <LargeContent>{content}</LargeContent>, [content]);

	return (
		<Tooltip content={content.length >= 78 ? Content : null} interactive offset={[0, 20]} placement="right">
			<Wrapper>
				<span>{t("description")}:</span>
				<Accent>{content}</Accent>
			</Wrapper>
		</Tooltip>
	);
};

export default Description;
