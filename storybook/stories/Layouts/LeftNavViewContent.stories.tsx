import Divider from "@components/Atoms/Divider";
import LeftNavViewContentSrc, { ViewContent } from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import { Meta } from "@storybook/react";
export default {
	title: "gx/Layouts/LeftNavViewContent",
} as Meta<typeof LeftNavViewContent>;

export const LeftNavViewContent = () => {
	const elements: ViewContent[] = [];
	for (let i = 0; i < 20; i++) {
		if (i === 5) {
			elements.push({
				leftSidebar: (
					<div style={{ padding: "1rem" }}>
						<Divider />
					</div>
				),
				clickable: false,
			});
			continue;
		}
		elements.push({
			leftSidebar: <div style={{ padding: "1rem" }}>Left Sidebar {i}</div>,
			content: <div>Content {i}</div>,
		});
	}
	return <LeftNavViewContentSrc elements={elements} />;
};
