import { FileStatus } from "@ext/Watchers/model/FileStatus";
import HistorySrc from "@ext/git/actions/History/component/History";
import { Meta } from "@storybook/react";
import mock from "storybook/data/mock";
import BlockDecorator from "storybook/styles/decorators/BlockDecorator";

export const History = () => {
	return <HistorySrc shouldRender={true} />;
};

export default {
	component: History,
	title: "gx/extensions/Catalog/Git/History",
	decorators: [BlockDecorator],
	parameters: {
		msw: mock([
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
} as Meta<typeof HistorySrc>;
