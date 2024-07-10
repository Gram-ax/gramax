export default (props: { pathname?: string }) => `---
title: Каталог не найден
---

:::note

${props?.pathname ? `Каталог по ссылке \`${props?.pathname}\` не найден.` : ""}

Проверьте, что путь указан верно.

:::`;
