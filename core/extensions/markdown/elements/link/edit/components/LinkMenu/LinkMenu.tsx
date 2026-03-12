import safeDecode from "@core/utils/safeDecode";
import { useApi } from "@core-ui/hooks/useApi";
import { isExternalLink } from "@core-ui/hooks/useExternalLink";
import type LinkItem from "@ext/article/LinkCreator/models/LinkItem";
import { getHref } from "@ext/markdown/elements/link/edit/logic/getHref";
import { getLinkToHeading } from "@ext/markdown/elements/link/edit/logic/getLinkToHeading";
import type { Mark } from "@tiptap/pm/model";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { EditLinkMenu } from "./EditLinkMenu/EditLinkMenu";
import { ViewLinkMenu } from "./ViewLinkMenu";

export type LinkMenuMode = "edit" | "view";

interface LinkMenuContentProps {
	mark: Mark;
	mode: LinkMenuMode;
	setMode: (mode: LinkMenuMode) => void;
	onDelete: () => void;
	onUpdate: (relativePath: string, newHref: string, mark: Mark) => void;
}

interface LinkMenuProps {
	mark: Mark;
	mode: LinkMenuMode;
	setMode: (mode: LinkMenuMode) => void;
	onUpdate: (relativePath: string, newHref: string, mark: Mark) => void;
	onDelete?: () => void;
}

const LinkMenuContent = memo(({ mark, mode, setMode, onDelete, onUpdate }: LinkMenuContentProps) => {
	const [itemName, setItemName] = useState<string>("");
	const [hasError, setHasError] = useState<boolean>(false);

	const href = mark ? getHref(mark) : "";
	const { isExternal } = isExternalLink(href);

	const { hash, pathWithoutHash, catalogName } = useMemo(() => {
		const hashMatch = getLinkToHeading(href);
		const pathWithoutHash = hashMatch ? hashMatch[1] : href;
		const hash = hashMatch?.[2] || "";
		const parsedCatalogName = hasError
			? undefined
			: href
				? href.split("/")?.[3] === "-"
					? href.split("/")?.[5]
					: href.split("/")?.[3]
				: "";
		const catalogName = isExternal ? undefined : parsedCatalogName;
		return { hash, pathWithoutHash, catalogName };
	}, [href, isExternal, hasError]);

	const { call: getLinkItemByPath } = useApi<LinkItem>({
		url: (api) => api.getLinkItemByPath(isExternal ? "" : pathWithoutHash, catalogName),
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (!mark?.attrs?.href) return;
		if (isExternal) return setItemName(href);
		void (async () => {
			const item = await getLinkItemByPath();
			setHasError(!item);
			setMode(item ? "view" : "edit");
			if (item) return setItemName(item.title + (hash ? safeDecode(hash) : ""));
			setItemName(href);
		})();
	}, [mark?.attrs?.href, hash, href, getLinkItemByPath, isExternal]);

	useLayoutEffect(() => {
		setMode(mark?.attrs?.href ? "view" : "edit");
	}, [mark?.attrs?.href, setMode]);

	const handleUpdate = useCallback(
		(relativePath: string, newHref: string) => {
			setMode("view");
			onUpdate(relativePath, newHref, mark);
		},
		[mark, onUpdate, setMode],
	);

	if (!mark) return null;

	if (mode === "edit") {
		return (
			<EditLinkMenu
				catalogName={catalogName}
				defaultValue={itemName}
				hasError={hasError}
				onDelete={onDelete}
				onUpdate={handleUpdate}
				setMode={setMode}
			/>
		);
	}

	return (
		<ViewLinkMenu
			href={href}
			icon="link"
			isExternalLink={isExternal}
			itemName={itemName}
			onDelete={onDelete}
			setMode={setMode}
		/>
	);
});

export const LinkMenu = memo(({ mark, mode, setMode, onUpdate, onDelete }: LinkMenuProps) => {
	return (
		<LinkMenuContent
			key={mark?.attrs?.href}
			mark={mark}
			mode={mode}
			onDelete={onDelete}
			onUpdate={onUpdate}
			setMode={setMode}
		/>
	);
});
