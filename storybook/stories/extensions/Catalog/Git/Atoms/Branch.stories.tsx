import GitDateSideBar from "../../../../../../core/extensions/git/actions/Branch/components/GitDateSideBar";
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
		<GitDateSideBar
			title={args.title}
			tooltipContent={"123123"}
			iconCode={"monitor"}
			data={{ lastCommitAuthor: "Test Author (ICS)", lastCommitModify: new Date(date).toJSON() }}
		/>
	);
};

export default BranchData;
