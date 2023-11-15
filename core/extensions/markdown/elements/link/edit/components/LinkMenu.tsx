import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import SelectLinkItem from "@ext/artilce/LinkCreator/components/SelectLinkItem";
import LinkItem from "@ext/artilce/LinkCreator/models/LinkItem";
import Button from "@ext/markdown/core/edit/components/Menu/Button";

import { getExecutingEnvironment } from "@app/resolveModule";
import parseStorageUrl from "@core/utils/parseStorageUrl";

const LinkMenu = ({
	href,
	value,
	itemLinks,
	onDelete,
	onUpdate,
}: {
	href: string;
	value: string;
	itemLinks: LinkItem[];
	onDelete: () => void;
	onUpdate: (value: string, href: string) => void;
}) => {
	// GXS-1126
	// logger.logInfo({ href, value, editor, itemLinks });
	const isTauri = getExecutingEnvironment() == "tauri";
	const isExternalLink = !!parseStorageUrl(value)?.domain;

	return (
		<ModalLayoutDark>
			<div style={{ width: "300px" }}>
				<ButtonsLayout>
					<SelectLinkItem value={value ?? ""} itemLinks={itemLinks} onChange={onUpdate} />
					<div className="divider" />
					<a
						href={href}
						rel="noopener noreferrer"
						style={{ color: "var(--color-article-bg)" }}
						target={isTauri ? (isExternalLink ? null : "_self") : "_blank"}
					>
						<Button
							icon="arrow-up-right-from-square"
							tooltipText={isTauri ? "Перейти по ссылке" : "Открыть ссылку в новой вкладке"}
						/>
					</a>
					<div className="divider" />
					<Button icon="trash" onClick={onDelete} tooltipText={"Удалить ссылку"} />
				</ButtonsLayout>
			</div>
		</ModalLayoutDark>
	);
};

export default LinkMenu;
