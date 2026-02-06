import { useApi } from "@core-ui/hooks/useApi";
import { isExternalLink } from "@core-ui/hooks/useExternalLink";
import useWatch from "@core-ui/hooks/useWatch";
import LinkItem from "@ext/article/LinkCreator/models/LinkItem";
import { getHref } from "@ext/markdown/elements/link/edit/logic/getHref";
import { getLinkToHeading } from "@ext/markdown/elements/link/edit/logic/getLinkToHeading";
import { Mark } from "@tiptap/pm/model";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { EditLinkMenu } from "./EditLinkMenu";
import { ViewLinkMenu } from "./ViewLinkMenu";

export type LinkMenuMode = "edit" | "view";

interface LinkMenuContentProps {
	mark: Mark;
	onDelete: () => void;
	onUpdate: (relativePath: string, newHref: string, mark: any) => void;
}

interface LinkMenuProps {
	mark: Mark;
	onUpdate: (relativePath: string, newHref: string, mark: any) => void;
	onDelete?: () => void;
}

const LinkMenuContent = memo(({ mark, onDelete, onUpdate }: LinkMenuContentProps) => {
	const [mode, setMode] = useState<LinkMenuMode>(mark?.attrs?.href ? "view" : "edit");
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

	useEffect(() => {
		if (!mark?.attrs?.href) return;
		if (isExternal) return setItemName(href);
		void (async () => {
			const item = await getLinkItemByPath();
			setHasError(!item);
			setMode(item ? "view" : "edit");
			if (item) return setItemName(item.title + (hash ? decodeURI(hash) : ""));
			setItemName(href);
		})();
	}, [mark?.attrs?.href, mark?.attrs?.resourcePath, hash, href]);

	useWatch(() => {
		setMode(mark?.attrs?.href ? "view" : "edit");
	}, [mark?.attrs?.href]);

	const handleUpdate = useCallback(
		(relativePath: string, newHref: string) => {
			setMode("view");
			onUpdate(relativePath, newHref, mark);
		},
		[mark, onUpdate],
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

export const LinkMenu = memo(({ mark, onUpdate, onDelete }: LinkMenuProps) => {
	return <LinkMenuContent key={mark?.attrs?.href} mark={mark} onDelete={onDelete} onUpdate={onUpdate} />;
});
