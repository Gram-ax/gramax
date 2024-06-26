# language: ru
Функция: Создание статьи

  Сценарий: Создание вложенной статьи
    Пусть смотрим на "левую навигацию"
    И смотрим на "Тест"
    И наводим мышку
    Когда нажимаем на иконку "плюс"
    Тогда находимся по адресу "/-/-/-/-/test/test1/new-article"
    И разметка текущей статьи ничего не содержит

  Сценарий: Создание статьи во вложенной статье
    Пусть смотрим на "левую навигацию"
    И нажимаем на кнопку "Тест"
    И смотрим на "Без названия"
    И наводим мышку
    И смотрим на "панель действий статьи"
    Когда нажимаем на иконку "плюс"
    Тогда находимся по адресу "/-/-/-/-/test/test1/new-article/new-article"
    И разметка текущей статьи ничего не содержит
