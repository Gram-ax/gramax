import Tooltip from "@components/Atoms/Tooltip";
import FormStyle from "@components/Form/FormStyle";
import ListLayout from "@components/List/ListLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import CurrentTabsTagService from "@ext/markdown/elements/tabs/components/CurrentTabsTagService";
import { useState } from "react";

const Content = () => {
	const catalogProps = CatalogPropsService.value;
	const currentTag = CurrentTabsTagService.value;
	const tabsTags = catalogProps.tabsTags;

	return (
		<div style={{ boxShadow: "var(--shadows-deeplight)" }}>
			<FormStyle>
				<div className="field field-string column">
					<label className="control-label">{tabsTags.label}</label>
					<div className="input-lable">
						<ListLayout
							items={tabsTags.tags ?? []}
							item={currentTag}
							onItemClick={(value) => (CurrentTabsTagService.value = value)}
						/>
					</div>
				</div>
			</FormStyle>
		</div>
	);
};

const SwitchTabsTag = () => {
	const [isOpen, setIsOpen] = useState(false);
	const catalogProps = CatalogPropsService.value;
	const currentTag = CurrentTabsTagService.value;
	const tabsTags = catalogProps.tabsTags;

	if (!tabsTags || !currentTag) return null;

	return (
		<div>
			<Tooltip
				trigger="click"
				onShow={() => setIsOpen(true)}
				onHide={() => setIsOpen(false)}
				customStyle
				hideOnClick
				content={isOpen ? <Content /> : <></>}
				arrow={false}
				interactive
			>
				<span>
					<ButtonLink text={currentTag} />
				</span>
			</Tooltip>
		</div>
	);
};

export default SwitchTabsTag;
