import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { ComponentMeta } from "@storybook/react";
import HistorySrc from "../../../../../../core/extensions/git/actions/History/component/History";
import mockApi from "../../../../../logic/api/mockApi";
import BlockDecorator from "../../../../../styles/decorators/InlineDecorator";

export const History = () => {
	return <HistorySrc />;
};

export default {
	component: History,
	title: "DocReader/extensions/Catalog/Git/History",
	decorators: [BlockDecorator],
	parameters: {
		msw: mockApi([
			{
				path: "/api/versionControl/fileHistory",
				response: [
					{
						version: "1",
						author: "Test Author awdjiawdjiawdij awdijawdijawijd",
						date: new Date(new Date().getTime() - 3600000).toJSON(),
						content: [
							{ value: "123" },
							{ value: "456", type: FileStatus.delete },
							{ value: "789", type: FileStatus.new },
						],
					},
					{
						version: "1",
						author: "new author 2 kaodkawd akodawd koawd aw",
						date: new Date(new Date().getTime() - 7200000).toJSON(),
						content: [
							{ value: "111" },
							{ value: "12312321312", type: FileStatus.delete },
							{ value: "234234324", type: FileStatus.new },
						],
					},
				],
				delay: 500,
				// errorMessage: "history error",
			},
		]),
	},
} as ComponentMeta<typeof HistorySrc>;
