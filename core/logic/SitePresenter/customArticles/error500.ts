export default (props: { type?: string }) => `---
title: Не удалось отобразить статью
---

${
	props?.type == "Parse"
		? `:::note\n\nGramax не смог прочитать Markdown-конструкцию в файле статьи. Кликните [cmd:Редактировать Markdown:file-pen], а затем исправьте ошибку или удалите конструкцию.\n\n:::`
		: "\n\n"
}
`;
