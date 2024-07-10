import Anchor from "@components/controls/Anchor";

const ErrorText = ({ isLink, isNoneError, link }: { isLink: boolean; isNoneError: boolean; link?: string }) => {
	return (
		<ul>
			<li>
				{isNoneError ? (
					"В дополнительной панели укажите ссылку на него и добавьте подпись."
				) : isLink ? (
					<>
						Проверьте наличие видео в файловом хранилище по
						<Anchor href={link}> ссылке</Anchor>.
					</>
				) : (
					"Проверьте, правильно ли указано название файла."
				)}
			</li>
			<li>
				{isNoneError ? (
					<>
						Из каких источников можно добавлять ссылки на видео читайте
						<Anchor href={"https://gram.ax/resources/docs/key-functions/files#видео"}> в статье</Anchor>.
					</>
				) : isLink ? (
					"Убедитесь, что в хранилище для ссылки/видео нет ограничений к доступу на просмотр."
				) : (
					<>
						Убедитесь, что видео есть в соответствующей папке в SharePoint. Куда нужно поместить файл
						читайте
						<Anchor href="https://gram.ax/resources/docs/key-functions/files#видео"> здесь</Anchor>.
					</>
				)}
			</li>
		</ul>
	);
};

export default ErrorText;
