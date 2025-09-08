import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import t from "@ext/localization/locale/translate";
import getCountArticles from "@ext/markdown/elements/view/render/logic/getCountArticles";
import { PropertyValue, ViewRenderGroup } from "@ext/properties/models";
import { Display } from "@ext/properties/models/display";
import { getDisplayComponent } from "@ext/properties/models/displays";
import { memo } from "react";

interface ViewRenderContentProps {
	content: ViewRenderGroup[];
	display: Display;
	defs: PropertyValue[];
	orderby: string[];
	groupby: string[];
	select: string[];
	className?: string;
	disabled?: boolean;
	catalogProps: ClientCatalogProps;
	commentId?: string;
	isPrint?: boolean;
	updateArticle?: (articlePath: string, property: string, value: string, isDelete?: boolean) => void;
}

const ViewRenderContent = memo(
	({ content, className, display, updateArticle, commentId, isPrint, ...otherProps }: ViewRenderContentProps) => {
		const noDefs = t("properties.validation-errors.no-defs");
		const noContent = t("properties.validation-errors.no-content");
		const count = getCountArticles(content);
		if (!count || !content.length) {
			return (
				<div className="error-message" data-focusable="true">
					{!count ? noContent : noDefs}
				</div>
			);
		}

		const Component = getDisplayComponent[isPrint ? Display.List : display];
		if (!Component) return null;

		return (
			<div>
				<Component
					{...otherProps}
					isPrint={isPrint}
					content={content}
					updateArticle={updateArticle}
					className={className}
					commentId={commentId}
				/>
			</div>
		);
	},
);

export default ViewRenderContent;
