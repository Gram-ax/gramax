# language: ru
Функция: Прохождение по всем статьям

  Сценарий: Нажатие "Далее" до конца
    Пусть находимся в "/%domain%/%group%/%test-repo%/master/-"
    Тогда нажимаем кнопку далее, пока видим её

  @next-only
  Сценарий: Нажатие "Далее" до конца
    Пусть находимся в "/%test-repo%"
    Тогда нажимаем кнопку далее, пока видим её