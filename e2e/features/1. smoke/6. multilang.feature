# language: ru
Функция: Добавление языка

  Сценарий: Создание каталога
    Пусть находимся на "главной"
    И смотрим на "панель действий"
    Когда нажимаем на кнопку "Добавить каталог"
    И нажимаем на кнопку "Создать новый"
    Тогда находимся по адресу "/-/-/-/-/new-catalog"

  Сценарий: Добавление языка - Настройки каталога
    Пусть наводимся и нажимаем на элемент "действия каталога"
    Когда нажимаем на кнопку "Настроить каталог"
    И видим форму "Настройки каталога"
    И смотрим на активную форму
    Когда нажимаем на Select "Основной язык"
    И смотрим на выпадающий список у Select
    И нажимаем на элемент списка "Русский"
    И смотрим на активную форму
    И нажимаем на кнопку "Сохранить"
    Когда заново смотрим на "правую панель"
    И смотрим на "переключатель языка контента"
    И нажимаем на кнопку "Русский"
    И смотрим на подсказку
    И видим кнопку "Русский"

  Сценарий: Добавление языка - Правая панель
    Пусть смотрим на "правую панель"
    И смотрим на "переключатель языка контента"
    И нажимаем на кнопку "Русский"
    И нажимаем на кнопку "Русский"
    И смотрим на подсказку
    И видим кнопку "Добавить язык"
    Когда смотрим на "Добавить язык"
    И наводим мышку
    И смотрим на подсказку
    И нажимаем на кнопку "English"
    Тогда находимся по адресу "/-/-/-/-/new-catalog/en/new-article"

  Сценарий: Редактирование статьи
    Пусть смотрим на редактор заголовка
    Когда вводим "test"
    И ждём 1 секунду
    И нажимаем на клавишу "Enter"
    И заново смотрим на редактор
    И вводим "en"
    Тогда находимся по адресу "/-/-/-/-/new-catalog/en/test"
    И разметка текущей статьи содержит
      """
      en
      """

  Сценарий: Переключение языка
    Пусть смотрим на "правую панель"
    И смотрим на "переключатель языка контента"
    И нажимаем на кнопку "English"
    И смотрим на подсказку
    И нажимаем на кнопку "Русский"
    Когда находимся по адресу "/-/-/-/-/new-catalog/test"
    И заново смотрим на редактор
    И вводим "ru"
    Тогда разметка текущей статьи содержит
      """
      ru
      """
