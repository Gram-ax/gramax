import BranchSideBar from "../../../../../../core/extensions/git/actions/Branch/components/BranchSideBar";
import InlineDecorator from "../../../../../styles/decorators/InlineDecorator";

const BranchData = {
	title: "gx/extensions/Catalog/Git/Atoms/Branch",
	decorators: [
		(Story) => (
			<div style={{ background: "lightblue", maxWidth: "500px" }}>
				<Story />
			</div>
		),
		InlineDecorator,
	],
	args: {
		title: "title",
	},
};

export const Branch = (args: { title: string }) => {
	const date = new Date().getTime() - 360000;
	return (
		<BranchSideBar
			name={args.title}
			tooltipContent={"123123"}
			iconCode={"desktop"}
			data={{ lastCommitAuthor: "Test Author (ICS)", lastCommitModify: new Date(date).toJSON() }}
		/>
	);
};

export default BranchData;
