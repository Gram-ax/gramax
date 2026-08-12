import { adminPageDescriptors } from "@ext/enterprise/model/AdminPageModel";
import type { Page } from "@ext/enterprise/types/Page";

export interface PageRendererProps {
	page: Page;
}

export const PageRenderer = ({ page }: PageRendererProps) => {
	const Component = adminPageDescriptors[page]?.component;
	if (!Component) return null;
	return <Component />;
};
