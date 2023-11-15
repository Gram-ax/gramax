import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { PartType } from "@ext/git/actions/MergeConflictHandler/model/FileTypes";
import { MergeFile, ParsedMergeFile } from "@ext/git/actions/MergeConflictHandler/model/MergeFile";

export const files: MergeFile[] = [
	{
		title: "file1",
		path: "path/to/file1.md",
		content:
			"file 1\nIf you have questions, please \n<<<<<<< HEAD\nblue content\n=======\nporple content\n>>>>>>> branch-a\nI am\n<<<<<<< HEAD\ntomato\n=======\npotato\n>>>>>>> branch-a\nwqeqw",
		type: FileStatus.conflict,
	},
	{
		title: "file2",
		path: "path/to/file2.md",
		content:
			"file 1\nIf you have questions, please \n<<<<<<< HEAD\nStyling is a topic of its own in React. React does not offer its own in-house solution to make styling easier, however the introduction of CSS-in-JS has shaken up the scene a little bit. Adopted widely and loved by some but hotly debated by others. With CSS-in-JS, the styling of components also moves into JavaScript to not break with the paradigm of component-based development. \nBut let's start with the basics and explore the topic bit by bit.\n=======\nask your question in IRC.\n>>>>>>> branch-a\nI am\n<<<<<<< HEAD\n11111111111111111111\n=======\n2222222222222222222\n>>>>>>> branch-a\nwqeqw",
		type: FileStatus.conflict,
	},
];

export const parsedFile: ParsedMergeFile = {
	...files[0],
	parts: [
		{
			content: "file 1\nIf you have questions, please \n",
			type: PartType.Normal,
		},
		{
			content:
				"<<<<<<< HEAD\nStyling is a topic of its own in React. React does not offer its own in-house solution to make styling easier, however the introduction of CSS-in-JS has shaken up the scene a little bit. Adopted widely and loved by some but hotly debated by others. With CSS-in-JS, the styling of components also moves into JavaScript to not break with the paradigm of component-based development. \nBut let's start with the basics and explore the topic bit by bit.\n=======\nask your question in IRC.\n>>>>>>> branch-a",
			type: PartType.Conflict,
			topPart:
				"Styling is a topic of its own in React. React does not offer its own in-house solution to make styling easier, however the introduction of CSS-in-JS has shaken up the scene a little bit. Adopted widely and loved by some but hotly debated by others. With CSS-in-JS, the styling of components also moves into JavaScript to not break with the paradigm of component-based development. \nBut let's start with the basics and explore the topic bit by bit.",
			bottomPart: "ask your question in IRC.\n",
			resolved: false,
			isTopPart: null,
		},
		{
			content: "\nI am\n",
			type: PartType.Normal,
		},
		{
			content: "<<<<<<< HEAD\ntomato\n=======\npotato\n>>>>>>> branch-a",
			type: PartType.Conflict,
			topPart: "tomato",
			bottomPart: "potato\n",
			resolved: false,
			isTopPart: null,
		},
		{
			content: "\nwqeqw",
			type: PartType.Normal,
		},
	],
};
