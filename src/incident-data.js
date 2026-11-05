// Reviewed retrospective reports at enterprise level; no inferred operating status or recovery.
export const incidentCoverage = {
  "state": "partial",
  "attemptedOn": "2026-11-05",
  "requestedWindow": {
    "from": "2026-10-03",
    "to": "2026-11-05"
  },
  "verifiedThrough": null,
  "message": "Проверка 05.11.2026 за 03.10–05.11.2026: уточнены последствия для трёх событий, прочитаны 4 первичных сообщения в Telegram и MAX. По Ярославлю обновлены сведения о пострадавших. Независимого двустороннего подтверждения производственных последствий не найдено. Новое сообщение о Рязани 5 ноября остаётся на проверке. Покрытие неполное; отсутствие отметки не означает отсутствие происшествий.",
  "reportUrl": "https://github.com/drus929/Work-Gpn-/blob/main/docs/incident-review-2026-11-05.md"
};

export const incidentRecords = [
  {
    "id": "omsk-2026-10-08",
    "plantId": "omsk",
    "occurredOn": "2026-10-08",
    "reviewedOn": "2026-11-05",
    "title": "Сообщения об атаке на Омский НПЗ",
    "summary": "EADaily передало сообщения жителей о взрывах рядом с НПЗ и дыме; Bloomberg отдельно привело подтверждение атаки украинским президентом. Последствия для переработки и продолжительность возможных ограничений не установлены.",
    "impact": "unspecified",
    "sources": [
      {
        "publisher": "EADaily",
        "url": "https://eadaily.com/ru/news/2026/10/08/2500-km-ot-granicy-vsu-dnem-udarili-po-krupneyshemu-v-rossii-omskomu-npz",
        "publishedOn": "2026-10-08",
        "perspective": "russian",
        "originKey": "omsk-local-residents-2026-10-08",
        "originNote": "Сообщения местных жителей в публикации; свидетели не названы, прямые ссылки на их сообщения не приведены.",
        "confirmsIncident": true,
        "confirmsImpact": false
      },
      {
        "publisher": "Bloomberg / Rigzone",
        "url": "https://www.rigzone.com/news/wire/ukraine_says_it_attacked_4th_russian_refinery_this_week-09-oct-2026-184814-article/",
        "publishedOn": "2026-10-09",
        "perspective": "western",
        "originKey": "zelensky-statement-2026-10-09",
        "originNote": "Прямая ссылка на заявление Владимира Зеленского с подтверждением атаки 8 октября. Rigzone публикует материал Bloomberg, это одна цепочка.",
        "confirmsIncident": true,
        "confirmsImpact": false
      }
    ],
    "damageReview": {
      "damage": "В публикации EADaily от 8 октября сообщалось о взрывах рядом с НПЗ и дыме. Независимая оценка масштаба повреждений предприятия в проверенных материалах не найдена.",
      "production": "Bloomberg подтверждает сообщение об атаке, но не приводит отдельного подтверждения производственных ограничений после неё.",
      "recovery": "Проверенное сообщение о восстановлении после этого события не установлено. Давность публикации не заменяет такого сообщения.",
      "limits": "Сведения жителей в EADaily не сопровождаются именами и прямыми ссылками на их посты; новые первичные сообщения о последствиях для этого НПЗ в просмотренной выборке не найдены."
    }
  },
  {
    "id": "ryazan-2026-10-15",
    "plantId": "ryazan",
    "occurredOn": "2026-10-15",
    "reviewedOn": "2026-11-05",
    "title": "Пожар на Рязанском НПЗ после атаки",
    "summary": "Губернатор сообщил о пожаре на НПЗ; отдельный украинский официальный источник AP подтвердил попадание. Reuters 16 октября сообщило о частичном ограничении переработки по сведениям отраслевых источников. Независимого российского подтверждения производственных последствий не найдено; полная остановка и восстановление не установлены.",
    "impact": "reported_disruption",
    "sources": [
      {
        "publisher": "Фонтанка",
        "url": "https://www.fontanka.ru/2026/10/15/76701557/",
        "publishedOn": "2026-10-15",
        "perspective": "russian",
        "originKey": "malkov-statement-2026-10-15",
        "originNote": "Заявление губернатора Павла Малкова: пожар на территории НПЗ; сведений об остановке переработки нет.",
        "confirmsIncident": true,
        "confirmsImpact": false
      },
      {
        "publisher": "Associated Press",
        "url": "https://apnews.com/article/russia-ukraine-war-oil-refinery-attacks-resume-0071b4f3792c9912b977b0ee73505b18",
        "publishedOn": "2026-10-15",
        "perspective": "western",
        "originKey": "ap-ukrainian-official-2026-10-15",
        "originNote": "Отдельный высокопоставленный украинский источник AP подтверждает попадание; пожар статья также описывает по российским заявлениям. Обновлена 16 октября.",
        "confirmsIncident": true,
        "confirmsImpact": false
      },
      {
        "publisher": "Reuters / Internazionale",
        "url": "https://www.internazionale.it/ultime-notizie-reuters/2026/10/16/ukraine-s-zelenskiy-blasts-us-russian-diesel-deal-welcomes-bigger-european-role-in-peace-process",
        "publishedOn": "2026-10-16",
        "perspective": "western",
        "originKey": "reuters-industry-sources-ryazan-2026-10-16",
        "originNote": "Два отраслевых источника Reuters сообщают о частичном ограничении переработки. Перепечатка BFM повторяет эту же цепочку.",
        "confirmsIncident": true,
        "confirmsImpact": true
      }
    ],
    "damageReview": {
      "damage": "Пожар на предприятии 15 октября подтверждён заявлением губернатора; отдельный источник AP подтвердил попадание. Эти сообщения не устанавливают полный масштаб повреждений.",
      "production": "Reuters 16 октября сообщило о частичном ограничении переработки со ссылкой на два отраслевых источника. Нового независимого российского подтверждения этой части не найдено.",
      "recovery": "Фраза о «недавнем возобновлении работы» в публикации 5 ноября не содержит проверенной даты и самостоятельного подтверждения восстановления после события 15 октября.",
      "limits": "Сообщения о новой атаке 5 ноября рассматриваются отдельно в отчёте. Октябрьское ограничение переработки не переносится на ноябрь; городские отключения электричества не приписываются НПЗ."
    }
  },
  {
    "id": "yar-2026-11-03",
    "plantId": "yar",
    "occurredOn": "2026-11-03",
    "reviewedOn": "2026-11-05",
    "title": "Пожар и повреждения на Ярославском НПЗ",
    "summary": "Губернатор сообщил о пожаре и повреждениях инфраструктуры НПЗ 3 ноября. По уточнению правительства области от 4 ноября медпомощь потребовалась трём сотрудникам: один госпитализирован, двое направлены на амбулаторное лечение. DW отдельно приводит анализ Astra по местным видеозаписям. Последствия для переработки и восстановление после этой атаки не установлены.",
    "impact": "unspecified",
    "sources": [
      {
        "publisher": "Интерфакс",
        "url": "https://www.interfax.ru/russia/1126703",
        "publishedOn": "2026-11-03",
        "perspective": "russian",
        "originKey": "yevraev-statement-2026-11-03",
        "originNote": "Заявление губернатора Михаила Евраева: повреждения инфраструктуры и раненые сотрудники; производство не оценивается.",
        "confirmsIncident": true,
        "confirmsImpact": false
      },
      {
        "publisher": "Deutsche Welle",
        "url": "https://www.dw.com/ru/ataka-dronov-na-aroslavskuu-oblast-veroatnoj-celu-stal-npz-slavnefti/a-79835516",
        "publishedOn": "2026-11-03",
        "perspective": "western",
        "originKey": "astra-yaroslavl-local-video-2026-11-03",
        "originNote": "Отдельная цепочка — анализ Astra видеозаписей местных жителей и фотографии пожара. Пересказ заявления губернатора в той же статье не считается новым свидетельством.",
        "confirmsIncident": true,
        "confirmsImpact": false
      },
      {
        "publisher": "Михаил Евраев · Telegram",
        "url": "https://t.me/evraevmikhail/24137",
        "publishedOn": "2026-11-03",
        "perspective": "russian",
        "originKey": "yevraev-statement-2026-11-03",
        "medium": "social",
        "platform": "Telegram",
        "originNote": "Первичное сообщение губернатора, прочитано полностью. Публичная дата: 03.11.2026, 08:14 МСК. Авторство сверено по прямой ссылке Фонтанки и совпадающему сообщению MAX. Это та же цепочка, что у Интерфакса; не отдельное подтверждение.",
        "confirmsIncident": true,
        "confirmsImpact": false
      },
      {
        "publisher": "YarNews",
        "url": "https://www.yarnews.net/news/100723-tri-sotrudnika-yaroslavskogo-npz-poluchili-pomocsh-medikov/",
        "publishedOn": "2026-11-04",
        "perspective": "russian",
        "originKey": "yar-government-tass-medical-update-2026-11-04",
        "originNote": "Уточнение правительства области через ТАСС: помощь трём сотрудникам, один госпитализирован, двое направлены на амбулаторное лечение. 76.ru повторяет ту же цепочку; оригинал ТАСС недоступен для прямого чтения.",
        "confirmsIncident": true,
        "confirmsImpact": false
      }
    ],
    "damageReview": {
      "damage": "В первичном сообщении губернатора 3 ноября указаны повреждения инфраструктуры и пожар на НПЗ; самостоятельная оценка масштаба ущерба не представлена.",
      "production": "В прочитанных сообщениях губернатора и уточнении правительства нет подтверждения изменения объёмов переработки. Историческая сентябрьская остановка из контекста DW не описывает ноябрьское событие.",
      "recovery": "В изученных источниках нет отдельного подтверждения восстановления предприятия после атаки 3 ноября. Снятие транспортных ограничений относится к дорогам, а не к работе завода.",
      "limits": "Первоначально сообщалось о двух госпитализированных. Уточнение 4 ноября: помощь понадобилась трём сотрудникам, один госпитализирован в стабильном состоянии, двое лечатся амбулаторно. YarNews и 76.ru повторяют одну цепочку «правительство области → ТАСС»."
    }
  }
];
