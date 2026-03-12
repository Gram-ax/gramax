/** biome-ignore-all lint/complexity/noStaticOnlyClass: expected */
import { mergeConflictRegExp } from "./MergeConflictFinder";

export default class MergeConflictPicker {
	static pick(raw: string, pick: "top" | "bottom"): string {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		return raw.replace(
			mergeConflictRegExp,
			(_match, _topRevision, topText, topNewLine, bottomText, bottomNewLine) => {
				return pick === "top" ? topText + topNewLine : bottomText + bottomNewLine;
			},
		);
	}
}
