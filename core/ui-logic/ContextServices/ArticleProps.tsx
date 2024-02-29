import React, { ReactElement, useContext, useEffect, useState } from "react";
import { TocItem } from "../../extensions/navigation/article/logic/createTocItems";
import { ClientArticleProps } from "../../logic/SitePresenter/SitePresenter";

const ArticlePropsContext = React.createContext<ClientArticleProps>(undefined);
let _setArticleProps: React.Dispatch<React.SetStateAction<ClientArticleProps>>;
const TocItemsContext = React.createContext<TocItem[]>(undefined);
let _setTocItems: React.Dispatch<React.SetStateAction<TocItem[]>>;

abstract class ArticlePropsService {
	static Provider({ children, value }: { children: ReactElement; value: ClientArticleProps }): ReactElement {
		const [articleProps, setArticleProps] = useState<ClientArticleProps>(value);
		_setArticleProps = setArticleProps;

		const [tocItems, setTocItems] = useState<TocItem[]>(value.tocItems);
		_setTocItems = setTocItems;

		useEffect(() => {
			setArticleProps(value);
			setTocItems(value.tocItems);
		}, [value]);

		return (
			<ArticlePropsContext.Provider value={articleProps}>
				<TocItemsContext.Provider value={tocItems}>{children}</TocItemsContext.Provider>
			</ArticlePropsContext.Provider>
		);
	}

	static get value(): ClientArticleProps {
		return useContext(ArticlePropsContext);
	}

	static set(articleProps: ClientArticleProps) {
		_setArticleProps({ ...articleProps });
	}

	static get tocItems(): TocItem[] {
		return useContext(TocItemsContext);
	}

	static set tocItems(value: TocItem[]) {
		if (!value) return;
		_setTocItems([...value]);
	}
}
export default ArticlePropsService;
