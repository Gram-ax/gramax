import { useItemsKeyboardNavigation } from "@ui-kit/hooks/useItemsKeyboardNavigation";
import { Input } from "@ui-kit/Input";
import { SearchSelectTag } from "@ui-kit/SearchSelect";

import { useCallback, useRef, useState } from "react";

interface TagInputWithKeyboardProps {
	value: string[];
	onChange: (tags: string[]) => void;
	placeholder?: string;
	readonly?: boolean;
	description?: string;
}

const TagInputWithKeyboard = ({ value, onChange, placeholder, readonly, description }: TagInputWithKeyboardProps) => {
	const [inputValue, setInputValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const removeTag = useCallback(
		(_: string, index: number) => {
			if (readonly) return;
			onChange(value.filter((_, i) => i !== index));
			inputRef.current?.focus();
		},
		[readonly, value, onChange],
	);

	const {
		handleKeyDown: handleTagsKeyDown,
		isFocused,
		focusItemAtIndex,
	} = useItemsKeyboardNavigation({
		items: value,
		onDelete: removeTag,
		cycleNavigation: true,
	});

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && inputValue.trim()) {
			e.preventDefault();
			const trimmed = inputValue.trim();
			if (!value.includes(trimmed)) {
				onChange([...value, trimmed]);
				setInputValue("");
			}
			return;
		}
		if (!inputValue.trim()) {
			handleTagsKeyDown(e);
		}
	};

	return (
		<div className="group/search-select-trigger flex flex-col gap-2 w-full">
			<Input
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={handleInputKeyDown}
				placeholder={placeholder}
				readOnly={readonly}
				ref={inputRef}
				value={inputValue}
			/>
			{value.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{value.map((tag, index) => (
						<SearchSelectTag
							isFocused={isFocused(index)}
							key={tag}
							onClose={() => removeTag(tag, index)}
							onLabelClick={() => focusItemAtIndex(index)}
							readonly={readonly}
						>
							{tag}
						</SearchSelectTag>
					))}
				</div>
			)}
			{description && <div className="text-muted font-normal text-xs">{description}</div>}
		</div>
	);
};

export default TagInputWithKeyboard;
