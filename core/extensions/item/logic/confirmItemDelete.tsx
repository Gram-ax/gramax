import { getExecutingEnvironment } from "@app/resolveModule/env";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import type { AlertConfirm } from "@ui-kit/AlertDialog";
import type { ComponentProps } from "react";

const Description = ({ text }: { text: string }) => {
	return (
		<div
			dangerouslySetInnerHTML={{
				// biome-ignore lint/style/useNamingConvention: expected
				__html: text,
			}}
		/>
	);
};

export const confirmItemDelete = async (title: string, count: number) => {
	const result = await new Promise<boolean>((resolve) => {
		if (ModalToOpenService.hasValue()) {
			resolve(false);
			return;
		}

		const isSection = count > 0;
		const description = isSection
			? t("article.actions.delete.section.body")
					.replace("{{title}}", title)
					.replace("{{count}}", count > 0 ? `(${count})` : "")
			: t("article.actions.delete.article.body").replace("{{title}}", title);

		const isTauri = getExecutingEnvironment() === "tauri";

		ModalToOpenService.setValue<ComponentProps<typeof AlertConfirm>>(ModalToOpen.AlertConfirm, {
			title: isSection ? t("article.actions.delete.section.title") : t("article.actions.delete.article.title"),
			description: (
				<Description
					text={`${description}${isTauri ? `<br/><br/>${t("article.actions.delete.restore-from-trash")}` : ""}`}
				/>
			),
			cancelText: t("article.actions.delete.buttons.secondary"),
			confirmText: t("article.actions.delete.buttons.primary").replace(
				"{{count}}",
				count > 0 ? ` (${count + 1})` : "",
			),
			status: "error",
			icon: "triangle-alert",
			onConfirm: () => {
				resolve(true);
				ModalToOpenService.resetValue();
			},
			onCancel: () => {
				resolve(false);
				ModalToOpenService.resetValue();
			},
		});
	});

	return result;
};
