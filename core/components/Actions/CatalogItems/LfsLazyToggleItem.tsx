import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import { useEditLfsOptions } from "@core/GitLfs/hooks/useEditLfsOptions";
import t from "@ext/localization/locale/translate";
import { Switch } from "@ui-kit/Switch";
import { useCallback, useEffect, useState } from "react";

interface LfsLazyToggleItemProps {
	children?: React.ReactNode;
}

const LfsLazyToggleItem = ({ children }: LfsLazyToggleItemProps) => {
	const { getLfsOptions, updateLfsOptions, allowed, isLoading } = useEditLfsOptions();
	const [isLazy, setIsLazy] = useState<boolean>(null);

	useEffect(() => {
		if (!allowed) return;

		const loadLfsOptions = async () => {
			const options = await getLfsOptions();
			setIsLazy(options?.lazy);
		};

		loadLfsOptions();
	}, [allowed, getLfsOptions]);

	const handleToggle = useCallback(async () => {
		if (!allowed) return;

		await updateLfsOptions({
			lazy: !isLazy,
		});

		setIsLazy(!isLazy);
	}, [allowed, isLazy, updateLfsOptions]);

	if (!allowed) return null;

	return (
		<CatalogItem
			renderLabel={(Item) => (
				<Item
					disabled={isLoading}
					onClick={(ev) => {
						ev.preventDefault();
						ev.stopPropagation();
						handleToggle();
					}}
				>
					<div className="flex items-center justify-between w-full gap-4">
						<div className="flex items-center gap-2">
							<Icon code="download" />
							{t("git.lfs.auto-download-toggle")}
						</div>
						{!isLoading && <Switch checked={!isLazy} size="sm" />}
					</div>
				</Item>
			)}
		>
			{children}
		</CatalogItem>
	);
};

export default LfsLazyToggleItem;
