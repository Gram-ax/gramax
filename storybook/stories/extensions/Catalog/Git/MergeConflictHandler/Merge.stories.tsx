import { StoryObj } from "@storybook/react";
import { useState } from "react";
import MergeConflictChooser from "../../../../../../core/extensions/git/actions/MergeConflictHandler/components/Chooser/Chooser";
import MergeConflictHandler from "../../../../../../core/extensions/git/actions/MergeConflictHandler/components/MergeConflictHandler";
import { files as testFiles, parsedFile as testParsedFile } from "./data";

export const Chooser: StoryObj = {
	render: () => {
		const [parsedFile, setParsedFiles] = useState(testParsedFile);
		return <MergeConflictChooser parsedFile={parsedFile} onResolve={setParsedFiles} />;
	},
};

export const Handler: StoryObj = {
	render: () => <MergeConflictHandler rawFiles={testFiles} onMerge={console.log} />,
};

const MergeData = {
	title: "gx/extensions/Catalog/Git/Merge",
};

export default MergeData;
