import Skeleton from "@components/Atoms/ImageSkeleton";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { CatalogStoreProvider } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import DiagramData from "@ext/markdown/elements/diagrams/component/DiagramData";
import Drawio from "@ext/markdown/elements/drawio/render/component/Drawio";
import ImageRenderer from "@ext/markdown/elements/image/render/components/ImageRenderer";
import InlineImage from "@ext/markdown/elements/inlineImage/render/components/InlineImage";
import OpenApi from "@ext/markdown/elements/openApi/render/OpenApi";
import type { ReactNodeRenderers } from "@gaurussel/tiptap-diff-utility";
import type { Attrs } from "prosemirror-model";
import type { ReactElement, ReactNode } from "react";

interface OldArticleContext {
	apiUrlCreator: ApiUrlCreator;
	catalogProps: ClientCatalogProps;
}

interface ReactNodeRenderersOptions {
	oldContext?: OldArticleContext;
	isLoading?: boolean;
}

const DeletedNode = ({
	oldContext,
	isLoading,
	attrs,
	children,
}: {
	oldContext?: OldArticleContext;
	isLoading?: boolean;
	attrs: Attrs;
	children: ReactNode;
}): ReactElement => {
	if (isLoading) {
		return (
			<Skeleton height={attrs.height ?? "100%"} isLoaded={false} width={attrs.width ?? "100%"}>
				<div />
			</Skeleton>
		);
	}

	const node = <ResourceService.Provider>{children as ReactElement}</ResourceService.Provider>;

	if (!oldContext?.apiUrlCreator) return node;

	return (
		<ApiUrlCreatorService.Provider value={oldContext.apiUrlCreator}>
			<CatalogStoreProvider data={oldContext.catalogProps}>{node}</CatalogStoreProvider>
		</ApiUrlCreatorService.Provider>
	);
};

export const getReactNodeRenderers = ({
	oldContext,
	isLoading,
}: ReactNodeRenderersOptions = {}): ReactNodeRenderers => {
	return {
		image: (attrs: Attrs) => (
			<DeletedNode attrs={attrs} isLoading={isLoading} oldContext={oldContext}>
				<ImageRenderer
					alt={attrs.alt}
					crop={attrs.crop}
					height={attrs.height}
					id={attrs.id}
					objects={attrs.objects}
					realSrc={attrs.src}
					scale={attrs.scale}
					title={attrs.title}
					width={attrs.width}
				/>
			</DeletedNode>
		),
		inlineImage: (attrs: Attrs) => (
			<DeletedNode attrs={attrs} isLoading={isLoading} oldContext={oldContext}>
				<InlineImage
					alt={attrs.alt}
					height={attrs.height}
					renderSrc={attrs.renderSrc}
					src={attrs.src}
					width={attrs.width}
				/>
			</DeletedNode>
		),
		openapi: (attrs: Attrs) => (
			<DeletedNode attrs={attrs} isLoading={isLoading} oldContext={oldContext}>
				<OpenApi flag={attrs.flag} src={attrs.src} />
			</DeletedNode>
		),
		drawio: (attrs: Attrs) => (
			<DeletedNode attrs={attrs} isLoading={isLoading} oldContext={oldContext}>
				<Drawio
					height={attrs.height}
					id={attrs.id}
					scale={attrs.scale}
					src={attrs.src}
					title={attrs.title}
					width={attrs.width}
				/>
			</DeletedNode>
		),
		diagrams: (attrs: Attrs) => (
			<DeletedNode attrs={attrs} isLoading={isLoading} oldContext={oldContext}>
				<DiagramData
					content={attrs.content}
					diagramName={attrs.diagramName}
					float={attrs.float}
					height={attrs.height}
					scale={attrs.scale}
					src={attrs.src}
					title={attrs.title}
					width={attrs.width}
				/>
			</DeletedNode>
		),
	};
};
