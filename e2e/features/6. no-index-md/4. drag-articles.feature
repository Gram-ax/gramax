# language: ru
Функция: Перетаскивание разделов

  Сценарий: Перетаскивание раздела
    Пусть смотрим на "левую навигацию"
    Когда перетаскиваем "inner-category" над "category"
    Тогда ждём 1 секунду
    И нажимаем на кнопку "inner-category"
    И свойства текущей статьи содержат
      """
      order: 0.5
      """
    И нажимаем на кнопку "2-inner"
    И свойства текущей статьи ничего не содержат
    И нажимаем на кнопку "2-inner-article"
