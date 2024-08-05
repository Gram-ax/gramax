# language: ru
Функция: Переход по ссылкам

  Сценарий: Переход в каталог по старой ссылке
    Когда находимся на "/%test-repo%/catalog/ThirdLevel/ThirdLevelArticle2"
    Тогда находимся по адресу "/%test-repo%/catalog/ThirdLevel/ThirdLevelArticle2"

  Сценарий: Переход в каталог по новой ссылке
    Когда находимся на "/%domain%/%group%/%test-repo%/not-dev-branch/-/catalog/ThirdLevel/ThirdLevelArticle2"
    Тогда находимся по адресу "/%domain%/%group%/%test-repo%/master/-/catalog/ThirdLevel/ThirdLevelArticle2"
    И закрываем активную форму
