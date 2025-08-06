import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";

export type ItemID = string;

export type ProviderItemProps = {
	id: ItemID;
	title: string;
};

export interface ProviderContextService {
	Init: (props: { children: JSX.Element }) => JSX.Element;
	fetchItems(apiUrlCreator: ApiUrlCreator): Promise<void>;
	openItem(item: ProviderItemProps): void;
	closeItem(): void;
}
