import { parseRichText } from "@components/Atoms/RichText/parseRichText";
import Code from "@ext/markdown/elements/code/render/component/Code";
import { Fragment } from "react";

const RichText = ({ text }: { text?: string | null }) => {
	if (!text) return null;

	return (
		<div className="space-y-[0.7em]">
			{parseRichText(text).map((segments, paragraphIndex) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static text, segments never reorder
				<p key={paragraphIndex}>
					{segments.map((segment, segmentIndex) => {
						const key = segmentIndex;
						return segment.type === "code" ? (
							<span className="article" key={key}>
								<Code>{segment.text}</Code>
							</span>
						) : (
							<Fragment key={key}>{segment.text}</Fragment>
						);
					})}
				</p>
			))}
		</div>
	);
};

export default RichText;
