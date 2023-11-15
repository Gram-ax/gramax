import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { Conflict, Normal, PartType } from "../model/FileTypes";
import { MergeFile, ParsedMergeFile } from "../model/MergeFile";
import { FIND_MERGE_CONFLICT, PARSE_MERGE_CONFLICT } from "./mergeRegExps";

export default function parseRawFile(rawFiles: MergeFile[], reverse = false): ParsedMergeFile[] {
	return rawFiles.map((file): ParsedMergeFile => {
		return {
			...file,
			parts: file.content.split(FIND_MERGE_CONFLICT).map((content) => parseContent(content, file.type, reverse)),
		};
	});
}

const parseContent = (content: string, type: FileStatus, reverse = false): Normal | Conflict => {
	if (type == FileStatus.new || type == FileStatus.delete)
		return {
			content: content,
			type: PartType.Conflict,
			topPart: type == FileStatus.new ? "" : content,
			bottomPart: type == FileStatus.new ? content : "",
			resolved: false,
			isTopPart: null,
		};

	if (!PARSE_MERGE_CONFLICT.test(content)) return { content: content, type: PartType.Normal };
	const [topPart, bottomPart] = PARSE_MERGE_CONFLICT.exec(content).slice(1);
	return {
		content,
		type: PartType.Conflict,
		topPart: reverse ? bottomPart : topPart,
		bottomPart: reverse ? topPart : bottomPart,
		resolved: false,
		isTopPart: null,
	};
};
