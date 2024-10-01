import LeftSidebarSrc from "@components/Layouts/LeftSidebar/LeftSidebar";
import { Meta } from "@storybook/react";
import BlockDecorator from "../../styles/decorators/BlockDecorator";

export default {
	title: "gx/Layouts/LeftSidebar",
	decorators: [BlockDecorator],
} as Meta<typeof LeftSidebar>;

export const LeftSidebar = () => {
	const content =
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.";
	return (
		<div style={{ width: "200px", height: "600px" }}>
			<LeftSidebarSrc sidebarTop={<div>Top content</div>} sidebarBottom={<div>Bottom content</div>}>
				{content}
			</LeftSidebarSrc>
		</div>
	);
};
