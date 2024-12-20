import { GitMergeResultContent } from "@ext/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import GitMergeStatus from "@ext/git/actions/MergeConflictHandler/model/GitMergeStatus";

export const files: GitMergeResultContent[] = [
	{
		title: "file both modified 1",
		path: "path/to/bothModified1.md",
		content: `start
<<<<<<< Updated upstream
изменение на сервере
=======
локальное изменение
>>>>>>> Stashed changes
end
`,
		status: GitMergeStatus.BothModified,
	},
	{
		title: "file both modified 2",
		path: "path/to/bothModified2.md",
		content: `start
2
3
<<<<<<< Updated upstream
изменение на сервере 2
1234567890
=======
локальное изменение 2
456
>>>>>>> Stashed changes
end
4
5

<<<<<<< Updated upstream
текущее, входящая одна строка
=======

>>>>>>> Stashed changes

start
2
3
<<<<<<< Updated upstream

=======
входящее, текущее одна строка
>>>>>>> Stashed changes
end
4
5
<<<<<<< Updated upstream
=======
текущее, входящее пусто
>>>>>>> Stashed changes

<<<<<<< Updated upstream
входящее, текущее пусто
=======
>>>>>>> Stashed changes
`,
		status: GitMergeStatus.BothModified,
	},
	{
		title: "file deleted by them",
		path: "path/to/deletedByThem.md",
		content: `Some content
that deleted in their version
some more content... `,
		status: GitMergeStatus.DeletedByThem,
	},
	{
		title: "file deleted by us",
		path: "path/to/deletedByUs.md",
		content: `Some content
that deleted in our version
some more content... `,
		status: GitMergeStatus.DeletedByUs,
	},
	{
		title: "file deleted both",
		path: "path/to/bothDeleted.md",
		content: "",
		status: GitMergeStatus.BothDeleted,
	},
	{
		title: "file added by them",
		path: "path/to/addedByThem.md",
		content: `Some content
they only added in their version
some more content... `,
		status: GitMergeStatus.AddedByThem,
	},
	{
		title: "file added by us",
		path: "path/to/addedByUs.md",
		content: `Some content
we only added in our version
some more content... `,
		status: GitMergeStatus.AddedByUs,
	},
	{
		title: "file both added",
		path: "path/to/bothAdded.md",
		content: `<<<<<<< Updated upstream
Some content
in our version
some more content...
=======
Some content
in their version
some more content...
>>>>>>> Stashed changes`,
		status: GitMergeStatus.BothAdded,
	},
];
