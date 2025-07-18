# language: ru
Функция: Клонирование каталога

  @next-only
  Сценарий: Аутентификация
    Пусть находимся в "/admin"
    Когда смотрим на активную форму
    И видим форму "Вход в аккаунт"
    Когда заполняем форму
      """
      Логин: %next-login%
      Пароль: %next-password%
      """
    И нажимаем на кнопку "Войти"
    И находимся по адресу "/"

  @next
  Сценарий: Открытие меню хранилищ
    Пусть находимся на "главной"
    И смотрим на "панель действий"
    Когда нажимаем на кнопку "Добавить каталог"
    И нажимаем на кнопку "Загрузить существующий"
    Тогда видим форму "Загрузить существующий каталог"

  @next
  Сценарий: Добавление нового хранилища
    Пусть смотрим на выпадающий список
    Когда нажимаем на кнопку "Добавить новое хранилище"
    И нажимаем на кнопку "GitLab"
    Тогда видим форму "Добавить новое хранилище"

  @next
  Сценарий: Заполняем форму добавления хранилища
    Пусть смотрим на активную форму
    Когда заполняем форму
      """
      URL сервера GitLab: %url_new%
      GitLab-токен: %token%
      """
    И нажимаем на кнопку "Добавить"
    Тогда видим форму "Загрузить существующий каталог"

  Сценарий: Клонирование каталога
    Пусть смотрим на выпадающий список
    И ждём конца загрузки
    И смотрим на активную форму
    Когда заполняем форму
      """
      Поиск репозитория: %test-repo-no-index%
      """
    И смотрим на выпадающий список
    И нажимаем на кнопку "%group%/%test-repo-no-index%"
    И смотрим на активную форму
    Тогда нажимаем на кнопку "Загрузить"
    И ждём 5 секунду
    И находимся в "/gitlab.com/%group%/%test-repo-no-index%/master/-"

  @next-only
  Сценарий: Клонирование каталога
    Пусть смотрим на выпадающий список
    И ждём конца загрузки
    И смотрим на активную форму
    Когда заполняем форму
      """
      Поиск репозитория: %test-repo-no-index%
      """
    И смотрим на выпадающий список
    И нажимаем на кнопку "%group%/%test-repo-no-index%"
    И смотрим на активную форму
    И нажимаем на кнопку "Загрузить" и ждём загрузки
    И ждём 1 секунду
    И ждём конца загрузки
    И ждём 1 секунду
    Тогда находимся на "/%test-repo-no-index%"
