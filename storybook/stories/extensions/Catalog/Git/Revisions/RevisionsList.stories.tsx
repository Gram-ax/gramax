import useWatch from "@core-ui/hooks/useWatch";
import RevisionsListLayout from "@ext/git/actions/Revisions/components/RevisionsListLayout";
import type GitVersionData from "@ext/git/core/model/GitVersionData";
import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import BlockDecorator from "storybook/styles/decorators/BlockDecorator";

const getRevisions = (count: number, start: number = 0) => {
	const revisions: GitVersionData[] = [];
	for (let i = start; i < count + start; i++) {
		const oid = window.crypto.randomUUID().replace(/-/g, "");
		revisions.push({
			oid,
			author: {
				name: `User${i} VeryLoooooooongName`,
				email: `user${i}.VeryLoooooooongName@example.com`,
			},
			timestamp: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * i).getTime(),
			summary: `Commit message ${i}`,
			parents: [],
		});
	}

	return revisions;
};

export const RevisionsList: StoryObj<{
	revisionsCount: number;
	isLoading: boolean;
	shouldLoadMoreAtScrollEnd: boolean;
}> = {
	args: {
		revisionsCount: 10,
		isLoading: false,
		shouldLoadMoreAtScrollEnd: true,
	},
	render: (props) => {
		const { isLoading, revisionsCount } = props;
		const [revisions, setRevisions] = useState<GitVersionData[]>(getRevisions(revisionsCount));
		const [currentRevision, setCurrentRevision] = useState<string>(null);

		useWatch(() => {
			setRevisions(getRevisions(revisionsCount));
		}, [revisionsCount]);

		return (
			<RevisionsListLayout
				currentRevision={currentRevision}
				onClick={(revision) => setCurrentRevision(revision)}
				revisions={isLoading ? null : revisions}
				shouldLoadMoreAtScrollEnd={props.shouldLoadMoreAtScrollEnd}
				requestMore={() => {
					setTimeout(() => {
						setRevisions([...revisions, ...getRevisions(revisionsCount, revisions.length)]);
					}, 500);
				}}
			/>
		);
	},
};

const meta: Meta = {
	title: "gx/extensions/Catalog/Git/Revisions/RevisionsList",
	decorators: [BlockDecorator],
};

export default meta;
