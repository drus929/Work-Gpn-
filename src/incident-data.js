// Reviewed retrospective reports at enterprise level; no inferred operating status or recovery.
export const incidentCoverage = {
  "state": "partial",
  "attemptedOn": "2026-11-03",
  "requestedWindow": {
    "to": "2026-11-03",
    "from": "2026-10-03"
  },
  "verifiedThrough": null,
  "message": "Проверка 03.11.2026 за 03.10–03.11.2026: добавлено 3 события. Проверка неполная: часть статей недоступна, часть сообщений не прошла сверку независимых первоисточников. Двустороннего подтверждения производственных последствий не найдено. Отсутствие отметки не означает отсутствие происшествий.",
  "reportUrl": "https://github.com/drus929/Work-Gpn-/blob/main/docs/incident-review-2026-11-03.md"
};

export const incidentRecords = [
  {
    "id": "omsk-2026-10-08",
    "plantId": "omsk",
    "occurredOn": "2026-10-08",
    "reviewedOn": "2026-11-03",
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
    ]
  },
  {
    "id": "ryazan-2026-10-15",
    "plantId": "ryazan",
    "occurredOn": "2026-10-15",
    "reviewedOn": "2026-11-03",
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
    ]
  },
  {
    "id": "yar-2026-11-03",
    "plantId": "yar",
    "occurredOn": "2026-11-03",
    "reviewedOn": "2026-11-03",
    "title": "Пожар и повреждения на Ярославском НПЗ",
    "summary": "Губернатор сообщил о повреждениях инфраструктуры НПЗ, пожаре и двух раненых сотрудниках. DW отдельно приводит анализ Astra по видеозаписям местных жителей, относящий пожар к «Славнефть-ЯНОС». Последствия для переработки после этой атаки не установлены; сведения о сентябрьской остановке не переносятся на ноябрь.",
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
      }
    ]
  }
];
