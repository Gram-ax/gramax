export default (props: { pathname?: string }) => `---
title: Статья не найдена
---

:::note
${props?.pathname ? `\nСтатья по ссылке \`${props?.pathname}\` не найдена.` : ""}

Проверьте, что путь указан верно.

:::`;
