import { PartType } from "../model/FileTypes";
import { ParsedMergeFile } from "../model/MergeFile";

const buildFile = ({ file }: { file: ParsedMergeFile }): string => {
	return file.parts
		.map((part) => {
			if (part.type === PartType.Normal) return part.content;
			return part.isTopPart ? part.topPart : part.bottomPart;
		})
		.join("");
};

export default buildFile;
