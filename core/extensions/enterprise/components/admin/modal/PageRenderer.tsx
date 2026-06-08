import { PageComponents } from "@ext/enterprise/types/EnterpriseAdmin";
import type { Page } from "@ext/enterprise/types/Page";

export interface PageRendererProps {
	page: Page;
}

export const PageRenderer = ({ page }: PageRendererProps) => {
	const Component = PageComponents[page];
	if (!Component) return null;
	return <Component />;
};
