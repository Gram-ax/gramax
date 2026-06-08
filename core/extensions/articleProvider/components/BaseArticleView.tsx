import ArticleExtensions from "@components/Article/ArticleExtensions";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import BaseArticleBreadcrumb from "@ext/articleProvider/components/BaseArticleBreadcrumb";
import CustomArticleEditor from "@ext/articleProvider/components/CustomArticleEditor";
import type { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import type { ToolbarMenuProps } from "@ext/markdown/core/edit/components/Menu/Menus/Toolbar";
import type { GetExtensionsPropsOptions } from "@ext/markdown/core/edit/logic/getExtensions";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import type { Extensions, JSONContent } from "@tiptap/react";
import { useCallback, useState } from "react";

interface BaseArticleViewProps {
	providerType: ArticleProviderType;
	item: ProviderItemProps;
	onUpdate: (id: string, content: JSONContent, title: string) => void;
	onCloseClick: () => void;
	extensions?: Extensions;
	extensionsOptions?: GetExtensionsPropsOptions;
	menuOptions?: ToolbarMenuProps;
}

const BaseArticleView = (props: BaseArticleViewProps) => {
	const { providerType, item, onUpdate, onCloseClick, extensions = [], extensionsOptions, menuOptions } = props;
	const [content, setContent] = useState<JSONContent>(null);
	const [isLoading, setIsLoading] = useState(true);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const fetchContent = useCallback(async () => {
		setIsLoading(true);
		const res = await FetchService.fetch(apiUrlCreator.getEditTreeInGramaxDir(item.id, providerType));
		if (!res.ok) return setIsLoading(false);

		const json = await res.json();
		const article = getArticleWithTitle(item.title, json);
		setContent(article);
		setIsLoading(false);
	}, [apiUrlCreator, item, providerType]);

	useWatch(() => {
		void fetchContent();
	}, [item.id]);

	return (
		<div className="flex flex-col h-full">
			<div className="flex gap-1 flex-row h-full [&>div:first-of-type]:w-full">
				<div>
					{isLoading ? (
						<SpinnerLoader />
					) : (
						<>
							<BaseArticleBreadcrumb onCloseClick={onCloseClick} />
							<CustomArticleEditor
								content={content}
								extensions={extensions}
								extensionsOptions={extensionsOptions}
								id={item.id}
								menuOptions={menuOptions}
								onUpdate={onUpdate}
								providerType={providerType}
								title={item.title}
							/>
						</>
					)}
				</div>
			</div>
			<ArticleExtensions />
		</div>
	);
};

export default BaseArticleView;
