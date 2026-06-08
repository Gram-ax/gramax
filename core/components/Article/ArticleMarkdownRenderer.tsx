import type { ArticleComponentProps } from "@components/Article/Article";
import FileInput from "@components/Atoms/FileInput/FileInput";
import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { useCallback, useRef } from "react";

export const ArticleMarkdownRenderer = ({ data, isReadOnly }: ArticleComponentProps<"markdown">) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const apiUrlCreatorRef = useRef(apiUrlCreator);
	apiUrlCreatorRef.current = apiUrlCreator;
	const isTemplate = useArticlePropsStore((state) => !!state.data?.template);

	const onUpdateContent = useCallback(
		(content: string) => {
			void FetchService.fetch(
				apiUrlCreatorRef.current.setArticleContent(data.articleProps.ref.path),
				content,
				MimeTypes.text,
				Method.POST,
				false,
			);
		},
		[data.articleProps.ref.path],
	);

	const { start: debouncedUpdateContent } = useDebounce(onUpdateContent, 500);

	return (
		<div className="w-full">
			<div className="w-full h-full justify-self-center">
				<div className="w-[var(--article-content-wrapper-width)] ml-[calc((var(--article-content-wrapper-width)-100%)/-2)]">
					<FileInput
						height={"85dvh"}
						onChange={(value) => {
							if (typeof window !== "undefined" && window.debug) {
								window.debug.forceSave = () => onUpdateContent(value);
							}

							debouncedUpdateContent(value);
						}}
						onMount={(editor) => {
							// https://github.com/microsoft/monaco-editor/issues/4448
							editor.updateOptions({ glyphMargin: false });
						}}
						options={{
							readOnly: isReadOnly || isTemplate,
							glyphMargin: false,
						}}
						style={{ padding: "0" }}
						theme={{ dark: "article-dark", light: "light" }}
						value={data.content ?? ""}
					/>
				</div>
			</div>
		</div>
	);
};
