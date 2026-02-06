import a from "@ext/confluence/core/server/logic/HTMLElements/a";
import blockquote from "@ext/confluence/core/server/logic/HTMLElements/blockquote";
import body from "@ext/confluence/core/server/logic/HTMLElements/body";
import code from "@ext/confluence/core/server/logic/HTMLElements/code";
import column from "@ext/confluence/core/server/logic/HTMLElements/column";
import emoji from "@ext/confluence/core/server/logic/HTMLElements/emoji";
import file from "@ext/confluence/core/server/logic/HTMLElements/file";
import heading from "@ext/confluence/core/server/logic/HTMLElements/heading";
import hr from "@ext/confluence/core/server/logic/HTMLElements/hr";
import image from "@ext/confluence/core/server/logic/HTMLElements/image";
import li from "@ext/confluence/core/server/logic/HTMLElements/li";
import link from "@ext/confluence/core/server/logic/HTMLElements/link";
import note from "@ext/confluence/core/server/logic/HTMLElements/note";
import ol from "@ext/confluence/core/server/logic/HTMLElements/ol";
import p from "@ext/confluence/core/server/logic/HTMLElements/p";
import pre from "@ext/confluence/core/server/logic/HTMLElements/pre";
import richTextBody from "@ext/confluence/core/server/logic/HTMLElements/richTextBody";
import smallHeading from "@ext/confluence/core/server/logic/HTMLElements/smallHeading";
import status from "@ext/confluence/core/server/logic/HTMLElements/status";
import stub from "@ext/confluence/core/server/logic/HTMLElements/stub";
import tbody from "@ext/confluence/core/server/logic/HTMLElements/tbody";
import td from "@ext/confluence/core/server/logic/HTMLElements/td";
import text from "@ext/confluence/core/server/logic/HTMLElements/text";
import time from "@ext/confluence/core/server/logic/HTMLElements/time";
import tr from "@ext/confluence/core/server/logic/HTMLElements/tr";
import ul from "@ext/confluence/core/server/logic/HTMLElements/ul";
import widget from "@ext/confluence/core/server/logic/HTMLElements/widget";
import HTMLNodeConverter from "@ext/confluence/core/server/model/HTMLNodeConverter";

const getServerConvertors = (): Record<string, HTMLNodeConverter> => {
	return {
		body,
		p,
		"ac:rich-text-body": richTextBody,
		hr,
		h1: heading,
		h2: heading,
		h3: heading,
		h4: smallHeading,
		h5: smallHeading,
		h6: smallHeading,
		text,
		a,
		strong: text,
		em: text,
		s: text,
		u: text,
		sup: text,
		sub: text,
		span: text,
		code,
		noformat: code,
		pre,
		ol,
		ul,
		li,
		br: p,
		table: p,
		tbody,
		colgroup: stub,
		col: stub,
		tr,
		th: td,
		td,
		blockquote,
		time,
		"ac:task-list": ul,
		"ac:task": p,
		"ac:task-body": li,
		emoji,
		status,
		info: note,
		tip: note,
		note: note,
		warning: note,
		expand: note,
		panel: note,
		widget,
		"ac:image": image,
		multimedia: file,
		"view-file": file,
		viewdoc: file,
		viewpdf: file,
		viewxls: file,
		viewppt: file,
		section: tbody,
		column,
		profile: link,
		"profile-picture": link,
		"ac:link": link,
		excerpt: p,
		"ac:layout": tbody,
		"ac:layout-section": tr,
		"ac:layout-cell": td,
		"ac:parameter": stub,
		div: stub,
		"ac:plain-text-body": stub,
		"ri:user": stub,
		"ri:page": stub,
		"ri:attachment": stub,
		"ac:emoticon": stub,
		"ac:task-id": stub,
		"ac:task-uuid": stub,
		"ac:task-status": stub,
		"ac:plain-text-link-body": stub,
		"ac:link-body": stub,
		"ri:url": stub,
	};
};

export default getServerConvertors;
