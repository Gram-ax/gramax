import React, { ReactElement, useContext, useEffect, useState } from "react";
import { TocItem } from "../../extensions/navigation/article/logic/createTocItems";
import { ClientArticleProps } from "../../logic/SitePresenter/SitePresenter";

interface ArticlePropsContextType {
	articleProps: ClientArticleProps;
	setArticleProps: React.Dispatch<React.SetStateAction<ClientArticleProps>>;
}

interface TocItemsContextType {
	tocItems: TocItem[];
	setTocItems: React.Dispatch<React.SetStateAction<TocItem[]>>;
}

const ArticlePropsContext = React.createContext<ArticlePropsContextType>(undefined);
const TocItemsContext = React.createContext<TocItemsContextType>(undefined);

abstract class ArticlePropsService {
	static Provider({ children, value }: { children: ReactElement; value: ClientArticleProps }): ReactElement {
		const [articleProps, setArticleProps] = useState<ClientArticleProps>(value);

		const [tocItems, setTocItems] = useState<TocItem[]>(value.tocItems);

		useEffect(() => {
			setArticleProps(value);
			setTocItems(value.tocItems);
		}, [value]);

		return (
			<ArticlePropsContext.Provider value={{ articleProps, setArticleProps }}>
				<TocItemsContext.Provider value={{ tocItems, setTocItems }}>{children}</TocItemsContext.Provider>
			</ArticlePropsContext.Provider>
		);
	}

	static get value(): ClientArticleProps {
		return useContext(ArticlePropsContext)?.articleProps;
	}

	static get setArticleProps() {
		return useContext(ArticlePropsContext).setArticleProps;
	}

	static get tocItems(): TocItem[] {
		return useContext(TocItemsContext).tocItems;
	}

	static get setTocItems() {
		return useContext(TocItemsContext).setTocItems;
	}
}
export default ArticlePropsService;
