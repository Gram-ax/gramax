# language: ru
Функция: Дискард одного файла

  Сценарий: Открытие окна публикации
    Пусть смотрим на "левую панель"
    И смотрим на "нижнюю панель"
    Когда нажимаем на иконку "облачка"
    Тогда видим форму "публикация" без заголовка

  Сценарий: Дискард одного файла
    Пусть смотрим на активную форму
    Когда смотрим на "левую панель"
    И смотрим на "new_article_0.md"
    И наводим мышку
    И нажимаем на иконку "отмена"
    Тогда файл "new_article_0.md" не существует
