import AlertError from "@components/AlertError";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import type { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import type { JSONContent } from "@tiptap/core";
import { useMemo } from "react";

const Wrapper = styled.div`
	margin: -4px -8px 0.2em -8px;
	padding: 4px 8px;
	*[data-focusable="true"] {
		outline: unset !important;
		outline-offset: unset !important;
	}
`;

interface FragmentProps {
	id: string;
	content: JSONContent | RenderableTreeNodes;
}

const Fragment = (props: FragmentProps) => {
	const { id, content } = props;
	const contents = useMemo(() => Renderer(content, { components: getComponents() }), [content]);

	return content ? (
		<ResourceService.Provider id={id} provider="fragment">
			<Wrapper data-component="fragment" data-focusable="true" data-iseditable={false}>
				{contents}
			</Wrapper>
		</ResourceService.Provider>
	) : (
		<AlertError error={{ message: t("cant-get-fragment-data") }} title={t("fragment-render-error")} />
	);
};

export default Fragment;
