import rehypeExternalLinks from "rehype-external-links";
import html from "rehype-stringify";
import { remark } from "remark";
import markdown from "remark-parse";
import remark2rehype from "remark-rehype";

const getProcessor = () => {
	return remark().use(markdown).use(remark2rehype).use(rehypeExternalLinks, { target: "_blank" }).use(html);
};

const parseMarkdown = async (text) => {
	if (!text) return "";
	const temp = String(await getProcessor().process(text));
	if (temp == "") return text;
	return temp;
};

export default parseMarkdown;
