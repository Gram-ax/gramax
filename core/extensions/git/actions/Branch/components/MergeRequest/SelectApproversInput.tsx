import validateEmail from "@core/utils/validateEmail";
import AuthorInfoCodec from "@core-ui/utils/authorInfoCodec";
import t from "@ext/localization/locale/translate";
import { InputGroup, InputGroupInput } from "@ui-kit/Input";
import { SearchSelectTag } from "@ui-kit/SearchSelect";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { type ReactNode, useCallback, useState } from "react";

export const normalizeToApprover = (input: string): { label: string; value: string } => {
	const trimmed = input.trim();
	if (!trimmed) return;

	if (validateEmail(trimmed)) {
		return { label: trimmed, value: AuthorInfoCodec.serialize({ name: trimmed, email: trimmed }) };
	}

	return;
};

interface SelectApproversInputProps {
	approvers?: { label: string; value: string }[];
	onChange: (approvers: { label: string; value: string }[]) => void;
	children?: ReactNode;
}

export const SelectApproversInput = ({ approvers, onChange, children }: SelectApproversInputProps) => {
	const [value, setValue] = useState("");

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			const normalized = normalizeToApprover(value);
			if (normalized && !approvers?.some((a) => a.value === normalized.value)) {
				onChange([...(approvers || []), normalized]);
				setValue("");
			}
		}
	};

	const handleRemove = useCallback(
		(tag: { label: string; value: string }) => {
			onChange(approvers.filter((a) => a.value !== tag.value));
		},
		[approvers, onChange],
	);

	const handleTagKeyDown = useCallback(
		(tag: { label: string; value: string }) => (event: React.KeyboardEvent<HTMLDivElement>) => {
			if (event.key === "Enter") handleRemove(tag);
		},
		[handleRemove],
	);

	return (
		<div className="flex flex-col gap-2">
			<InputGroup>
				<InputGroupInput
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={handleInputKeyDown}
					placeholder={t("git.merge.add-user")}
					value={value}
				/>
				{children}
			</InputGroup>
			{approvers?.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{approvers?.map((tag) => (
						<SearchSelectTag
							key={tag.value}
							onClose={() => handleRemove(tag)}
							onKeyDown={handleTagKeyDown(tag)}
							onLabelClick={() => {}}
							tabIndex={0}
						>
							<TextOverflowTooltip className="min-w-0 flex-1 truncate">{tag.label}</TextOverflowTooltip>
						</SearchSelectTag>
					))}
				</div>
			)}
		</div>
	);
};
