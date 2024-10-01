import LeftNavigationContent from "@components/Layouts/CatalogLayout/LeftNavigation/LeftNavigationContent";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import { createContext, ReactElement, useContext, useState } from "react";

type ItemLinks = NodeModel<ItemLink>[];

export type LeftNavViewContentComponent = ({
	itemLinks,
	closeNavigation,
}: {
	itemLinks: ItemLinks;
	closeNavigation?: () => void;
}) => JSX.Element;

const LeftNavViewContentContext = createContext<LeftNavViewContentComponent>(undefined);
let _setLeftNavViewContent: React.Dispatch<React.SetStateAction<LeftNavViewContentComponent>>;

abstract class LeftNavViewContentService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const [leftNavViewContent, setLeftNavViewContent] = useState<LeftNavViewContentComponent>(
			() => LeftNavigationContent,
		);

		_setLeftNavViewContent = setLeftNavViewContent;

		return (
			<LeftNavViewContentContext.Provider value={leftNavViewContent}>
				{children}
			</LeftNavViewContentContext.Provider>
		);
	}

	static get value(): LeftNavViewContentComponent {
		return useContext(LeftNavViewContentContext);
	}

	static setView(component: LeftNavViewContentComponent) {
		_setLeftNavViewContent(() => component);
	}

	static setDefaultView() {
		LeftNavViewContentService.setView(LeftNavigationContent);
	}
}

export default LeftNavViewContentService;
