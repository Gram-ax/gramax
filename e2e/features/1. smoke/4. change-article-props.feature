# language: ru
Функция: Изменение пропсов статьи

  Сценарий: Открытие меню пропсов статьи
    Пусть смотрим на "левую навигацию"
    И смотрим на "Без названия"
    И наводим мышку
    И смотрим на "панель действий статьи"
    Когда нажимаем на иконку "три точки"
    И смотрим на подсказку
    И нажимаем на кнопку "Свойства..."
    Тогда видим форму "Свойства статьи"

  Сценарий: Изменение пропсов статьи
    Пусть смотрим на активную форму
    Когда заполняем форму
      """
      Заголовок: Тест
      URL: test1
      """
    И нажимаем на кнопку "Сохранить"
    И заново смотрим на "левую навигацию"
    И нажимаем на кнопку "Тест"
    Тогда находимся по адресу "/-/-/-/-/test/test1"
