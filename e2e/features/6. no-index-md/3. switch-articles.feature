# language: ru
Функция: Переключение статей

  Сценарий: Article H1 -> Category
    Пусть находимся в "/gitlab.com/%group%/%test-repo-no-index%/master/-"
    Когда смотрим на "левую навигацию"
    И видим кнопку "Category"
    Тогда нажимаем на кнопку "Category"
    И находимся по адресу "/gitlab.com/%group%/%test-repo-no-index%/master/-/category"

  @next-only
  Сценарий: Article H1 -> Category
    Пусть находимся в "/%test-repo-no-index%/"
    Когда смотрим на "левую навигацию"
    И видим кнопку "Category"
    Тогда нажимаем на кнопку "Category"
    И находимся по адресу "/%test-repo-no-index%/category"

  Сценарий: Category -> Article H1
    Пусть находимся в "/gitlab.com/%group%/%test-repo-no-index%/master/-/category"
    Когда смотрим на "левую навигацию"
    И видим кнопку "Article H1"
    Тогда нажимаем на кнопку "Article H1"
    И находимся по адресу "/gitlab.com/%group%/%test-repo-no-index%/master/-/article"

  @next-only
  Сценарий: Category -> Article H1
    Пусть находимся в "/%test-repo-no-index%/category"
    Когда смотрим на "левую навигацию"
    И видим кнопку "Article H1"
    Тогда нажимаем на кнопку "Article H1"
    И находимся по адресу "/%test-repo-no-index%/article"

  Сценарий: Article H1 -> inner-category
    Пусть находимся в "/gitlab.com/%group%/%test-repo-no-index%/master/-/article"
    Когда смотрим на "левую навигацию"
    И видим кнопку "inner-category"
    Тогда нажимаем на кнопку "inner-category"
    И находимся по адресу "/gitlab.com/%group%/%test-repo-no-index%/master/-/category/inner-category"

  @next-only
  Сценарий: Article H1 -> inner-category
    Пусть находимся в "/%test-repo-no-index%/article"
    Когда смотрим на "левую навигацию"
    И видим кнопку "inner-category"
    Тогда нажимаем на кнопку "inner-category"
    И находимся по адресу "/%test-repo-no-index%/category/inner-category"
