import { StoryObj } from "@storybook/react";
import MergeConflictHandler from "../../../../../../core/extensions/git/actions/MergeConflictHandler/components/MergeConflictHandler";
import { files as testFiles } from "./data";

export const Handler: StoryObj = {
	render: () => (
		<MergeConflictHandler rawFiles={testFiles} onMerge={(r) => alert(JSON.stringify(r, null, 2))} reverseMerge />
	),
	decorators: [
		(S) => (
			<div style={{ background: "gray", padding: "1rem" }}>
				<S />
			</div>
		),
	],
};

export const HandlerNoReverse: StoryObj = {
	name: "Handler (no reverse)",
	render: () => (
		<MergeConflictHandler rawFiles={testFiles} onMerge={(r) => alert(JSON.stringify(r))} reverseMerge={false} />
	),
	decorators: [
		(S) => (
			<div style={{ background: "gray", padding: "1rem" }}>
				<S />
			</div>
		),
	],
};

const MergeData = {
	title: "gx/extensions/Catalog/Git/Merge",
};

export default MergeData;
