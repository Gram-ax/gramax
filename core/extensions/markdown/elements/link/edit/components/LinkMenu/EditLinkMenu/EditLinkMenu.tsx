import { useExternalLink } from "@core-ui/hooks/useExternalLink";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import {
	LinkMenuArticleChooser,
	LinkMenuCatalogChooser,
} from "@ext/markdown/elements/link/edit/components/LinkMenu/EditLinkMenu/LinkMenuChoosers";
import { LinkMenuInput } from "@ext/markdown/elements/link/edit/components/LinkMenu/EditLinkMenu/LinkMenuInput";
import { useMediaQuery } from "@mui/material";
import { Command, CommandEmpty, CommandItem, CommandList, CommandSeparator } from "@ui-kit/Command";
import { Icon } from "@ui-kit/Icon";
import { type FormEvent, memo, useCallback, useEffect, useState } from "react";
import type { LinkMenuMode } from "../LinkMenu";

interface EditLinkMenuProps {
	catalogName: string;
	defaultValue: string;
	hasError: boolean;
	setMode: (mode: LinkMenuMode) => void;
	onDelete: () => void;
	onUpdate: (relativePath: string, newHref: string) => void;
}

const StyledCommand = styled(Command)`
	width: 18.75rem;
	max-height: min(18.75rem, 60vh);

	&.mobile {
		width: 100%;
	}
`;

export const EditLinkMenu = memo((props: EditLinkMenuProps) => {
	const { defaultValue, catalogName: initialCatalogName, hasError, setMode, onDelete, onUpdate } = props;
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const { catalogName } = useCatalogPropsStore((state) => {
		return {
			catalogName: state.data?.name,
		};
	}, "shallow");
	const [selectedCatalogName, setSelectedCatalogName] = useState<string>(initialCatalogName || catalogName);
	const [value, setValue] = useState(defaultValue);
	const [isExternalLink, externalLink, updateLink] = useExternalLink(value);
	const isCurrentCatalog = selectedCatalogName === catalogName;

	useEffect(() => {
		setValue(defaultValue);
	}, [defaultValue]);

	const onValueChange = useCallback(
		(event: FormEvent<HTMLInputElement>) => {
			const newValue = (event.target as HTMLInputElement).value;
			setValue(newValue);
			updateLink(newValue);
		},
		[updateLink],
	);

	const changeMode = useCallback(
		(mode: LinkMenuMode) => {
			setMode(mode);
			if (!defaultValue || !defaultValue.length || hasError) onDelete();
		},
		[setMode, onDelete, defaultValue, hasError],
	);

	return (
		<StyledCommand
			className={cn("rounded-lg lg:shadow-hard-base", isMobile && "mobile")}
			role="toolbar"
			shouldFilter={false}
		>
			<LinkMenuInput
				isSearchCatalogs={!isCurrentCatalog}
				onValueChange={onValueChange}
				setMode={changeMode}
				value={value}
			/>
			<CommandList>
				<CommandEmpty>{t("list.no-results-found")}</CommandEmpty>
				<CommandItem className="hidden" value="-" />
				{!isExternalLink && selectedCatalogName && (
					<LinkMenuArticleChooser
						catalogName={selectedCatalogName}
						isCurrentCatalog={isCurrentCatalog}
						onUpdate={onUpdate}
						searchValue={value}
					/>
				)}
				{!isExternalLink && !selectedCatalogName && (
					<LinkMenuCatalogChooser
						catalogName={selectedCatalogName}
						searchValue={value}
						setCatalogName={setSelectedCatalogName}
					/>
				)}
				{!isExternalLink && selectedCatalogName && (
					<>
						<CommandSeparator />
						<div className="p-1">
							<CommandItem
								className="px-2 py-1 h-7"
								onSelect={() => {
									setSelectedCatalogName(null);
									setValue("");
								}}
								value="other-catalogs"
							>
								<div className="flex items-center gap-2">
									<Icon className="w-3.5 h-3.5" icon="folders" />
									<span className="text-xs whitespace-nowrap truncate">
										{t("editor.link.other-catalogs")}
									</span>
								</div>
							</CommandItem>
						</div>
					</>
				)}
				{isExternalLink && (
					<div className="p-1">
						<CommandItem
							className="px-2 py-1 overflow-hidden max-w-full"
							onSelect={() => onUpdate(externalLink, externalLink)}
						>
							<div className="flex items-center gap-2 truncate">
								<Icon className="w-3.5 h-3.5" icon="globe" />
								<span className="truncate whitespace-nowrap text-xs">{externalLink}</span>
							</div>
						</CommandItem>
					</div>
				)}
			</CommandList>
		</StyledCommand>
	);
});
