import GoToArticle from "@components/Actions/GoToArticle";
import Icon from "@components/Atoms/Icon";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

const SnippetViewUses = ({
	articles,
	onLinkClick,
}: {
	articles: { pathname: string; title: string }[];
	onLinkClick?: () => void;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<PopupMenuLayout
			trigger={
				<a style={{ display: "flex", alignItems: "center" }}>
					<span>{t("view-usage")} </span>
					<Icon code={`chevron-${isOpen ? "up" : "down"}`} />
				</a>
			}
			onOpen={() => setIsOpen(true)}
			onClose={() => setIsOpen(false)}
		>
			{articles.map((a, idx) => (
				<GoToArticle
					key={idx}
					href={a.pathname}
					trigger={
						<div className="popup-button" style={{ color: "var(--color-link)" }} onClick={onLinkClick}>
							{a.title}
						</div>
					}
				/>
			))}
		</PopupMenuLayout>
	);
};

export default SnippetViewUses;
