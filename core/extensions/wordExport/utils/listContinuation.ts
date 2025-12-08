import docx from "@dynamicImports/docx";

export const LIST_CONTINUATION_CAPTION = "__LIST_CONTINUATION__";
export const LIST_CONTINUATION_BOOKMARK = "__LIST_CONTINUATION__";
const CONTINUATION_DELIMITER = ":";

type ContinuationMarkerInfo = {
	matches: boolean;
	level?: number;
};

const formatContinuationMarker = (base: string, level?: number): string => {
	if (level === undefined || level === null) return base;
	return `${base}${CONTINUATION_DELIMITER}${level}`;
};

const parseContinuationMarker = (base: string, value?: string | null): ContinuationMarkerInfo => {
	if (typeof value !== "string" || value.length === 0) {
		return { matches: false };
	}

	if (value === base) {
		return { matches: true };
	}

	const prefix = `${base}${CONTINUATION_DELIMITER}`;
	if (!value.startsWith(prefix)) return { matches: false };
	const level = parseInt(value.substring(prefix.length), 10);
	if (Number.isNaN(level)) return { matches: false };
	return { matches: true, level };
};

export const encodeListContinuationCaption = (level?: number): string =>
	formatContinuationMarker(LIST_CONTINUATION_CAPTION, level);

export const encodeListContinuationBookmark = (level?: number): string =>
	formatContinuationMarker(LIST_CONTINUATION_BOOKMARK, level);

export const parseListContinuationCaption = (value?: string | null): ContinuationMarkerInfo =>
	parseContinuationMarker(LIST_CONTINUATION_CAPTION, value);

export const parseListContinuationBookmark = (value?: string | null): ContinuationMarkerInfo =>
	parseContinuationMarker(LIST_CONTINUATION_BOOKMARK, value);

let bookmarkCounter = 100000;

export const markTableAsListContinuation = async (table: any, level?: number) => {
	const { ImportedXmlComponent } = await docx();
	const captionValue = encodeListContinuationCaption(level);
	const xml = `<w:tblCaption xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="${captionValue}"/>`;
	const imported = ImportedXmlComponent.fromXmlString(xml);
	const captionComp = (imported as any)?.root?.[0];
	if (!captionComp) return;

	const rootArray = table?.root as any[] | undefined;
	if (!Array.isArray(rootArray)) return;

	let tblPrComp = rootArray.find((c) => c?.rootKey === "w:tblPr");

	if (!tblPrComp) {
		tblPrComp = new ImportedXmlComponent("w:tblPr");
		rootArray.unshift(tblPrComp);
	}

	const tblPrRoot = tblPrComp?.root;
	if (Array.isArray(tblPrRoot)) {
		for (let i = tblPrRoot.length - 1; i >= 0; i--) {
			if (tblPrRoot[i]?.rootKey === "w:tblCaption") {
				tblPrRoot.splice(i, 1);
			}
		}
	}

	tblPrComp?.root.push(captionComp);
};

export const wrapWithListContinuationBookmark = async (children: any[], level?: number) => {
	const { BookmarkStart, BookmarkEnd } = await docx();
	const id = bookmarkCounter++;
	const name = encodeListContinuationBookmark(level);
	return [new BookmarkStart(name, id), ...children, new BookmarkEnd(id)];
};
