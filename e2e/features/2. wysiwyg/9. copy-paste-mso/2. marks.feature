# language: ru
Функция: Текст с марками

  Сценарий: Ссылки на заголовок
    Пусть очищаем документ
    И смотрим на редактор
    Когда вставляем html
      """
        <html xmlns:v="urn:schemas-microsoft-com:vml">
          <body>
            <h1><a name="_Heading"></a>Heading<o:p></o:p></h1>
            <p class=MsoNormal><a href="#_Heading">link</a><o:p></o:p></p>
          </body>
        </html>
      """
    Тогда разметка текущей статьи содержит
      """
      ## Heading
      
      [link](./new-article-8#heading)
      """

  Сценарий: Ссылки на сторонний ресурс
    Пусть очищаем документ
    И смотрим на редактор
    Когда вставляем html
      """
        <html xmlns:v="urn:schemas-microsoft-com:vml">
          <body>
            <p class=MsoNormal><a href="https://www.youtube.com/watch?v=XXYlFuWEuKI">link</a><o:p></o:p></p>
          </body>
        </html>
      """
    Тогда разметка текущей статьи содержит
      """
      [link](https://www.youtube.com/watch?v=XXYlFuWEuKI)
      """

  Сценарий: Италик текст
    Пусть очищаем документ
    И смотрим на редактор
    Когда вставляем html
      """
        <html xmlns:v="urn:schemas-microsoft-com:vml">
          <body>
            <p class=MsoNormal><i>aaa<o:p></o:p></i></p>
          </body>
        </html>
      """
    Тогда разметка текущей статьи содержит
      """
      *aaa*
      """

  Сценарий: Жирный текст
    Пусть очищаем документ
    И смотрим на редактор
    Когда вставляем html
      """
        <html xmlns:v="urn:schemas-microsoft-com:vml">
          <body>
            <p class=MsoNormal><b>bbb<o:p></o:p></b></p>
          </body>
        </html>
      """
    Тогда разметка текущей статьи содержит
      """
      **bbb**
      """
