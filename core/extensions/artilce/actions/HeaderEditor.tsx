import BlockInput from "@components/Atoms/BlockInput";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import trollCaller from "@core-ui/trollCaller";
import { splitRange } from "@core-ui/utils/rangeUtils";
import styled from "@emotion/styled";
import { MutableRefObject, useEffect, useRef } from "react";
import useLocalize from "../../localization/useLocalize";
import EditorService from "../../markdown/elementsUtils/ContextServices/EditorService";

const UPDATE_ARTICLE_TITLE_SYMBOL = Symbol();

let headerRef: MutableRefObject<HTMLDivElement> = null;
export const getHeaderRef = () => headerRef;

export default styled(({ className }: { className?: string }) => {
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const ref = useRef<HTMLDivElement>(null);

	const updateArticleTitle = (title: string) => {
		articleProps.title = title;
		ArticlePropsService.set(articleProps);
		const url = apiUrlCreator.updateItemProps();
		trollCaller(
			UPDATE_ARTICLE_TITLE_SYMBOL,
			() => FetchService.fetch(url, JSON.stringify(articleProps), MimeTypes.json),
			500,
		);
	};

	const replaceSpaceToUnbreakableSpace = (text: string): string =>
		text.replaceAll(/^ | $/gm, String.fromCharCode(160));

	const removeExtraSpaceFromStart = (text: string): string => text.match(/^\s*(.*)/)[1].match(/(.*?)\s*$/)[1];

	const onArrowDown = () => {
		EditorService.getEditor().commands.focus(0);
	};

	const onEnter = () => {
		const sel = window.getSelection();
		const editor = EditorService.getEditor();
		if (!editor || sel.toString()) return;
		const elem = ref.current;
		const { beforeOffset, afterOffset } = splitRange(elem, sel.focusOffset);

		const textStartToFocus = replaceSpaceToUnbreakableSpace(beforeOffset.toString());
		const textFocusToEnd = replaceSpaceToUnbreakableSpace(afterOffset.toString());

		elem.innerHTML = removeExtraSpaceFromStart(textStartToFocus);
		updateArticleTitle(elem.innerText);

		editor.commands.insertContentAt(0, {
			type: "paragraph",
			content: textFocusToEnd ? [{ type: "text", text: textFocusToEnd }] : [],
		});
		editor.commands.focus("start");
	};

	useEffect(() => {
		headerRef = ref;
	});

	return (
		<div className={className}>
			<h1 className={"article-title"}>
				<BlockInput
					ref={ref}
					value={articleProps.title}
					placeholder={useLocalize("articleTitle")}
					onInput={(e) => updateArticleTitle(e.currentTarget.innerText.trim())}
					onBlur={(e) => updateArticleTitle(e.currentTarget.innerText.trim())}
					deps={[articleProps.ref.path]}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							onEnter();
						}
						if (e.key === "ArrowDown") onArrowDown();
					}}
				/>
			</h1>
		</div>
	);
})`
	width: 100%;
	display: flex;
	align-items: baseline;
	justify-content: space-between;

	> h1 {
		flex: 1;

		input {
			padding-left: 0 !important;
		}
	}
`;
