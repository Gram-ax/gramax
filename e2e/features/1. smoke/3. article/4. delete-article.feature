# language: ru
Функция: Удаление статьи

  Сценарий: Удаление раздела
    Пусть смотрим на "левую навигацию"
    И нажимаем на кнопку "Тест"
    И смотрим на "Без названия"
    И наводим мышку
    И смотрим на "панель действий статьи"
    Когда нажимаем на иконку "три точки"
    И смотрим на подсказку
    И нажимаем на кнопку "Удалить"
    Тогда заново смотрим на "левую навигацию"

  Сценарий: Удаление статьи
    Пусть смотрим на "левую навигацию"
    И смотрим на "Без названия"
    И наводим мышку
    Когда нажимаем на иконку "три точки"
    И смотрим на подсказку
    И нажимаем на кнопку "Удалить"
    Тогда заново смотрим на "левую навигацию"
    И не видим кнопку "Без названия"