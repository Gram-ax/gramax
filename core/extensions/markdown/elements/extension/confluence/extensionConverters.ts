import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";
import excerpt from "@ext/markdown/elements/extension/confluence/extensions/excerpt";
import include from "@ext/markdown/elements/extension/confluence/extensions/include";
import jira from "@ext/markdown/elements/extension/confluence/extensions/jira";
import livesearch from "@ext/markdown/elements/extension/confluence/extensions/livesearch";
import portfolioforjiraplan from "@ext/markdown/elements/extension/confluence/extensions/portfolioforjiraplan";
import profile from "@ext/markdown/elements/extension/confluence/extensions/profile";
import toc_zone from "@ext/markdown/elements/extension/confluence/extensions/toc_zone";
import viewFile from "@ext/markdown/elements/extension/confluence/extensions/viewFile";
import widget from "@ext/markdown/elements/extension/confluence/extensions/widget";

const extensionConverters: Record<string, NodeConverter> = {
	widget,
	excerpt,
	details: excerpt,
	"toc-zone": toc_zone,
	jira,
	livesearch,
	profile,
	"profile-picture": profile,
	include,
	portfolioforjiraplan,
	viewpdf: viewFile,
	viewdoc: viewFile,
	viewxls: viewFile,
	viewppt: viewFile,
};

export default extensionConverters;
