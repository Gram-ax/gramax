import AlertError from "@components/AlertError";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import t from "@ext/localization/locale/translate";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import type { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import type { JSONContent } from "@tiptap/core";
import { useMemo } from "react";

const fragmentClassName =
	"-mx-2 -mt-1 mb-[0.2em] px-2 py-1 [&_*[data-focusable=true]]:![outline-offset:unset] [&_*[data-focusable=true]]:![outline:unset]";

interface FragmentProps {
	id: string;
	content: JSONContent | RenderableTreeNodes;
	isPrint?: boolean;
}

const Fragment = (props: FragmentProps) => {
	const { id, content, isPrint } = props;
	const contents = useMemo(() => Renderer(content, { components: getComponents() }, isPrint), [content, isPrint]);

	return content ? (
		<ResourceService.Provider id={id} provider="fragment">
			<div
				className={fragmentClassName}
				data-component="fragment"
				data-focusable="true"
				data-fragment-id={id}
				data-iseditable={false}
			>
				{contents}
			</div>
		</ResourceService.Provider>
	) : (
		<AlertError error={{ message: t("cant-get-fragment-data") }} title={t("fragment-render-error")} />
	);
};

export default Fragment;
