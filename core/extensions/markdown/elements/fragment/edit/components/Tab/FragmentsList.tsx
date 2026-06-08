import Icon from "@components/Atoms/Icon";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ItemList from "@ext/articleProvider/components/ItemList";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import type { FragmentAlreadyUseWarnProps } from "@ext/markdown/elements/fragment/edit/components/FragmentAlreadyUseWarn";
import FragmentUpdateService from "@ext/markdown/elements/fragment/edit/components/FragmentUpdateService";
import FragmentService from "@ext/markdown/elements/fragment/edit/components/Tab/FragmentService";
import FragmentUsages from "@ext/markdown/elements/fragment/edit/components/Tab/FragmentUsages";
import { type RefObject, useCallback, useEffect } from "react";

interface FragmentsListProps {
	apiUrlCreator: ApiUrlCreator;
	fragments: Map<string, ProviderItemProps>;
	selectedID: string;
	show: boolean;
	tabWrapperRef: RefObject<HTMLDivElement>;
	setHeight: (height: number) => void;
}

const FragmentsList = ({
	show,
	fragments,
	selectedID,
	apiUrlCreator,
	tabWrapperRef,
	setHeight,
}: FragmentsListProps) => {
	useEffect(() => {
		if (!show) return;

		FragmentService.fetchItems(apiUrlCreator);
	}, [show, apiUrlCreator]);

	const onDelete = useCallback(
		(id: string) => {
			if (selectedID === id) {
				void FetchService.fetch(apiUrlCreator.clearArticlesContentWithFragment(id));
				FragmentService.closeItem();
			}

			const newFragments = Array.from(fragments.values()).filter((s) => s.id !== id);
			FragmentService.setItems(newFragments);
			FragmentUpdateService.clearContent(id);
		},
		[selectedID, fragments, apiUrlCreator],
	);

	const onMarkdownChange = useCallback(
		async (id: string) => {
			await FragmentUpdateService.updateContent(id, apiUrlCreator);

			if (selectedID === id) {
				FragmentService.closeItem();

				setTimeout(() => {
					FragmentService.openItem(fragments.get(id));
				}, 0);
			}
		},
		[selectedID, fragments, apiUrlCreator],
	);

	const onItemClick = useCallback(
		(id: string) => {
			const fragment = fragments.get(id);
			if (!fragment) return;

			FragmentService.openItem(fragment);
		},
		[fragments],
	);

	const rightActions = useCallback((id: string) => {
		return (
			<FragmentUsages
				fragmentId={id}
				isSubmenu
				trigger={
					<>
						<Icon code="file-symlink" />
						{t("view-usage")}
					</>
				}
			/>
		);
	}, []);

	const preDelete = useCallback(async (id: string) => {
		return new Promise<boolean>((resolve) => {
			ModalToOpenService.setValue<FragmentAlreadyUseWarnProps>(ModalToOpen.FragmentAlreadyUseWarn, {
				fragmentId: id,
				onClose: () => {
					resolve(false);
					ModalToOpenService.resetValue();
				},
				onSubmit: () => {
					resolve(true);
					ModalToOpenService.resetValue();
				},
			});
		});
	}, []);

	return (
		<ItemList
			items={Array.from(fragments.values())}
			noItemsText={t("no-fragments")}
			onDelete={onDelete}
			onItemClick={onItemClick}
			onMarkdownChange={onMarkdownChange}
			preDelete={preDelete}
			providerType="fragment"
			rightActions={rightActions}
			selectedItemId={selectedID}
			setContentHeight={setHeight}
			show={show}
			tabWrapperRef={tabWrapperRef}
		/>
	);
};

export default FragmentsList;
