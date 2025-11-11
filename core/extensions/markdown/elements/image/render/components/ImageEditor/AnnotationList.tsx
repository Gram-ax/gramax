import styled from "@emotion/styled";
import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import React from "react";

const PrintAnnotationsWrap = styled.div`
	margin-top: 0.5em;
	display: flex;
	justify-content: center;
`;

const PrintAnnotations = styled.ol`
	margin: 0;
	padding-left: 1.25em;
	max-width: 42.5em;
	line-height: 1.35;
	text-align: left;
`;

const AnnotationList = ({ objects }: { objects?: ImageObject[] }) => {
	const items = objects
		?.map((object, index) => {
			return object.text ? `${index + 1}. ${object.text}` : "";
		})
		.filter((text) => text);

	if (!items || items.length === 0) return null;

	return (
		<PrintAnnotationsWrap>
			<PrintAnnotations>
				{items.map((text, idx) => (
					<p key={idx}>{text}</p>
				))}
			</PrintAnnotations>
		</PrintAnnotationsWrap>
	);
};

export default AnnotationList;
