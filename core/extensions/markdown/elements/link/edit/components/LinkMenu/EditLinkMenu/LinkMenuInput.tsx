import t from "@ext/localization/locale/translate";
import type { LinkMenuMode } from "@ext/markdown/elements/link/edit/components/LinkMenu/LinkMenu";
import { IconButton } from "@ui-kit/Button";
import { type FormEvent, useEffect, useRef } from "react";

interface LinkMenuInputProps {
	value: string;
	isSearchCatalogs: boolean;
	onValueChange: (event: FormEvent<HTMLInputElement>) => void;
	setMode: (mode: LinkMenuMode) => void;
}

export const LinkMenuInput = ({ value, onValueChange, setMode, isSearchCatalogs }: LinkMenuInputProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		requestAnimationFrame(() => {
			inputRef.current?.focus();
		});
	}, []);

	return (
		<div className="flex items-center border-b border-inverse-border pl-2 pr-1">
			<input
				className="flex h-9 w-full rounded-md bg-transparent py-1 pl-1 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50 text-xs"
				onInput={onValueChange}
				placeholder={isSearchCatalogs ? `${t("list.search-catalogs")}...` : `${t("list.search-articles")}...`}
				ref={inputRef}
				type="text"
				value={value}
			/>
			<IconButton
				className="h-7 w-7 rounded-sm shadow-none"
				icon="x"
				iconClassName="flex-shrink-0"
				onPointerDown={() => setMode("view")}
				size="lg"
			/>
		</div>
	);
};
