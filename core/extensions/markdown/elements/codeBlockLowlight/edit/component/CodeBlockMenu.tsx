import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ListLayout from "@components/List/ListLayout";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Languages } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LangList";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { useEffect, useState } from "react";

const autoSetLang = (lang = "", dispatch) => {
	const Lang = Languages.find((i) => i.toLowerCase() === lang.toLowerCase());
	dispatch(Lang);
};

const CodeBlockMenu = ({ editor, className }: { editor: Editor; className?: string }) => {
	const [node, setNode] = useState<Node>(null);
	const [isCoped, setIsCoped] = useState(false);
	const [language, setLanguage] = useState("");

	useEffect(() => {
		const { node: newNode } = getFocusNode(editor.state, (node) => node.type.name === "code_block");
		if (newNode) {
			if (!node || JSON.stringify(node.attrs) !== JSON.stringify(newNode.attrs)) {
				setNode(newNode);
				autoSetLang(newNode.attrs?.language ?? "", setLanguage);
			}
		}
	}, [editor.state.selection]);

	if (!editor.isActive("code_block")) return null;

	const handleLanguageChange = (value: string) => {
		const lowerValue = value.toLowerCase();
		autoSetLang(value, setLanguage);
		editor.commands.updateAttributes("code_block", { language: lowerValue });
	};

	const handleCopy = () => {
		void navigator.clipboard.writeText(node.textContent);
		setIsCoped(true);
	};

	const handleMouseLeave = () => {
		setIsCoped(false);
	};

	const handleDelete = () => {
		editor.commands.deleteNode("code_block");
	};

	return (
		<ModalLayoutDark className={className}>
			<ButtonsLayout>
				<ListLayout
					className={"layout-parent"}
					appendTo={"parent"}
					onSearchChange={(inputText) => {
						if (inputText === "") handleLanguageChange("");
					}}
					isCode={false}
					place="top"
					itemsClassName={"custom-style"}
					placeholder={t("language.name")}
					onItemClick={(lang) => handleLanguageChange(lang)}
					item={language ? { element: language, labelField: language } : undefined}
					items={Languages.map((lang) => {
						return { element: lang, labelField: lang };
					})}
				/>

				<div className="divider" />
				<ButtonsLayout>
					<Button
						icon="copy"
						tooltipText={isCoped ? t("copied") + "!" : t("copy")}
						onClick={handleCopy}
						onMouseLeave={handleMouseLeave}
					/>
					<Button icon="trash" tooltipText={t("delete")} onClick={handleDelete} />
				</ButtonsLayout>
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default styled(CodeBlockMenu)`
	.layout-parent {
		padding: 0 5.5px;
	}

	.items {
		background: var(--color-tooltip-background);
		border-radius: var(--radius-large);
		overflow: hidden;
	}

	.item {
		color: var(--color-article-bg) !important;
	}

	.item,
	.breadcrumb {
		.link {
			line-height: 1.5em;
		}
	}

	.item.active {
		background: var(--color-edit-menu-button-active-bg);
	}
`;
