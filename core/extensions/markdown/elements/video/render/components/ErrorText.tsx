import Anchor from "@components/controls/Anchor";
import t from "@ext/localization/locale/translate";

const ErrorText = ({ isLink, isNoneError, link }: { isLink: boolean; isNoneError: boolean; link?: string }) => {
	return (
		<ul>
			<li>
				{isNoneError ? (
					t("editor.video.error.none")
				) : isLink ? (
					<>
						{t("editor.video.error.some")}
						<Anchor href={link}>{t("editor.video.error.some-link")}</Anchor>.
					</>
				) : (
					t("editor.video.error.generic")
				)}
			</li>
			<li>
				{isNoneError ? (
					<>
						{t("editor.video.error.none-2")}
						<Anchor href={"https://gram.ax/resources/docs/key-functions/video"}>
							{t("editor.video.error.none-2-link")}
						</Anchor>
						.
					</>
				) : isLink ? (
					t("editor.video.error.some-2")
				) : (
					<>
						{t("editor.video.error.generic-2")}
						<Anchor href="https://gram.ax/resources/docs/key-functions/video">
							{t("editor.video.error.generic-2-link")}
						</Anchor>
						.
					</>
				)}
			</li>
		</ul>
	);
};

export default ErrorText;
