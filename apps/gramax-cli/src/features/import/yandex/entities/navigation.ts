import ChalkLogger from "../../../../utils/ChalkLogger";
import FetchActions from "../FetchActions";
import { getChildrenByRequestChildren } from "../utils";

export interface NavItem {
	id: number;
	slug: string;
	title: string;
	page_type: "wysiwyg";
	has_children: boolean;
	type: "page" | "root";
	is_fixed: boolean;
}

export type Navigation = Record<number, NavItem>;

export async function getNavigation() {
	const breadcrumbsBranchSlug = "homepage";
	const parentSlug = "";
	const navigation: any = {};
	let processedCount = 0;

	const data = await FetchActions.getNavTreeNode(parentSlug, breadcrumbsBranchSlug);
	if (!data) return;

	const { tree } = data;

	const topLevelPagesData = Object.values(tree).find((item: NavItem) => {
		if (!item || typeof item !== "object" || !("type" in item)) return false;

		return item.type === "root";
	});

	const topLevelPages = getChildrenByRequestChildren(topLevelPagesData);

	if (!topLevelPages) {
		ChalkLogger.log("Out top level pages");
		return navigation;
	}

	const stack: NavItem[] = [...topLevelPages];

	while (stack.length) {
		const item = stack.pop();
		navigation[item.id] = item;

		processedCount += 1;
		ChalkLogger.write(`\rFetched navigation items: ${processedCount}`);

		if (item.has_children) {
			let data;

			try {
				data = await FetchActions.getNavTreeNode(item.slug);
			} catch (e) {
				throw new Error("Got navigation error, ", e);
			}

			const children = getChildrenByRequestChildren(data);
			if (!children) continue;
			stack.push(...children);
		}
	}

	if (processedCount > 0) {
		ChalkLogger.deletePrevLine();
	}

	return navigation;
}
