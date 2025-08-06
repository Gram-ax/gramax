import ButtonLayout from "@components/Layouts/ButtonLayout";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { DiffViewMode } from "@ext/markdown/elements/diff/components/DiffBottomBar";

interface DiffViewPickerProps {
	currentMode: DiffViewMode;
	onDiffViewPick: (mode: DiffViewMode) => void;
	hasWysiwyg?: boolean;
}

const getIsDoublePanel = (mode: DiffViewMode) => {
	if (mode === "wysiwyg-single" || mode === "single-panel") return false;
	return true;
};

const getIsSourceText = (mode: DiffViewMode, hasWysiwyg: boolean) => {
	if (!hasWysiwyg) return true;
	if (mode === "wysiwyg-double" || mode === "wysiwyg-single") return false;
	return true;
};

const getDiffViewMode = (isDoublePanel: boolean, isSourceText: boolean): DiffViewMode => {
	if (isDoublePanel && isSourceText) return "double-panel";
	if (isDoublePanel && !isSourceText) return "wysiwyg-double";

	if (!isDoublePanel && isSourceText) return "single-panel";
	if (!isDoublePanel && !isSourceText) return "wysiwyg-single";
};

const Wrapper = styled.div`
	color: var(--color-article-bg);

	.divider {
		background: var(--diff-bottom-bar-picker-bg);
	}
`;

const DiffViewPicker = (props: DiffViewPickerProps) => {
	const { currentMode, onDiffViewPick, hasWysiwyg } = props;

	const isDoublePanel = getIsDoublePanel(currentMode);
	const isSourceText = getIsSourceText(currentMode, hasWysiwyg);

	return (
		<Wrapper data-theme="light">
			<ButtonLayout>
				<div className="divider" />
				{hasWysiwyg && (
					<Button
						onClick={() => {
							const newIsSourceText = !isSourceText;
							onDiffViewPick(getDiffViewMode(isDoublePanel, newIsSourceText));
						}}
						icon="code-xml"
						tooltipText={t("diff.source-text")}
						isActive={isSourceText}
					/>
				)}
				<Button
					onClick={() => {
						const newIsDoublePanel = !isDoublePanel;
						onDiffViewPick(getDiffViewMode(newIsDoublePanel, isSourceText));
					}}
					icon="columns-2"
					tooltipText={t("diff.double-panel")}
					isActive={isDoublePanel}
				/>
			</ButtonLayout>
		</Wrapper>
	);
};

export default DiffViewPicker;
