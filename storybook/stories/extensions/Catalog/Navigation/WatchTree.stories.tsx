import { Meta } from "@storybook/react";
import NavigationLayout from "../../../../../core/extensions/navigation/catalog/main/render/Layout";
import NavigationWatchTree from "../../../../../core/extensions/navigation/catalog/watch/WatchTree";
import items from "../../../../data/pageProps";

export default {
	title: "gx/extensions/Catalog/Navigation/WatchTree",
	component: NavigationWatchTree,
} as Meta<typeof NavigationWatchTree>;

export const WatchTree = () => (
	<div style={{ overflow: "auto" }}>
		<NavigationLayout
			wathChildren={<NavigationWatchTree items={items.data.itemLinks as []} />}
			dragChildren={undefined}
		/>
	</div>
);
