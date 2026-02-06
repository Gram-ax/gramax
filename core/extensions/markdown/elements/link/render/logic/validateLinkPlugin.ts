import type MarkdownIt from "markdown-it";

const BAD_PROTO_RE = /^(vbscript|javascript|data):/;
const GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;

const validateLink = (url: string) => {
	const str = url.trim().toLowerCase();

	return BAD_PROTO_RE.test(str) ? GOOD_DATA_RE.test(str) : true;
};

const validateLinkPlugin = (md: MarkdownIt) => {
	md.validateLink = validateLink;
};

export default validateLinkPlugin;
