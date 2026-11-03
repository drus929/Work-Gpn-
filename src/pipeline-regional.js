// Документированные региональные нефтяные направления из публичного рабочего
// снимка Global Energy Monitor GOIT, map-data commit 043a9d0fe8755af76f5b41c892ab7d2494e4d121.
// Дата сборки снимка не равна дате обновления записи и не подтверждает работу сейчас.
// Само поле Fuel=Oil сокращено; отбор дополнительно использует явное имя Oil Pipeline
// и русское название нефтепровода, когда оно присутствует. NGL/ШФЛУ не включены.
// Параллельные нитки объединены; raw source IDs сохранены. Геометрия обзорная:
// округлённые опорные районы, без переноса точных трасс. Лицензия не заявляется.

export const regionalPipelines = [
  {
    "id": "perm-osa",
    "name": "Пермь — Оса",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Пермский край"
    ],
    "purpose": "Региональное нефтяное направление внутри Пермского края.",
    "route": "Пермь — Оса",
    "description": "Региональное нефтяное направление внутри Пермского края. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          55.9,
          57.8
        ],
        [
          55.4,
          57.2
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2369",
    "sourceRecordIds": [
      "P2369"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2025-01-14",
      "sourceDates": [
        "2025-01-14"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2369: Perm-Osa Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "almetyevsk-aznakaevo",
    "name": "Альметьевск — Азнакаево",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Республика Татарстан"
    ],
    "purpose": "Нефтяное направление между районами Альметьевска и Азнакаева; запись источника объединяет две нитки.",
    "route": "Альметьевск — Азнакаево",
    "description": "Нефтяное направление между районами Альметьевска и Азнакаева; запись источника объединяет две нитки. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          52.3,
          54.9
        ],
        [
          53.1,
          54.9
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2280",
    "sourceRecordIds": [
      "P2280"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-01-31",
      "sourceDates": [
        "2023-01-31"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2280: Almetyevsk-Aznakaevo I, II Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "chernushka-kaltasy",
    "name": "Чернушка — Калтасы",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Пермский край",
      "Республика Башкортостан"
    ],
    "purpose": "Межрегиональное нефтяное направление юга Пермского края и севера Башкортостана.",
    "route": "Чернушка — Калтасы",
    "description": "Межрегиональное нефтяное направление юга Пермского края и севера Башкортостана. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          56.0,
          56.5
        ],
        [
          54.5,
          56.0
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2295",
    "sourceRecordIds": [
      "P2295"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-01-25",
      "sourceDates": [
        "2023-01-25"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2295: Chernushka-Kaltasy Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "kaleykino-nizhnekamsk",
    "name": "Калейкино — Нижнекамск",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Республика Татарстан"
    ],
    "purpose": "Направление к нефтеперерабатывающему району Нижнекамска; в названии источника прямо указан НПЗ.",
    "route": "Калейкино — Нижнекамск",
    "description": "Направление к нефтеперерабатывающему району Нижнекамска; в названии источника прямо указан НПЗ. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          52.2,
          54.9
        ],
        [
          51.9,
          55.6
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P3703",
    "sourceRecordIds": [
      "P3703"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2022-03-02",
      "sourceDates": [
        "2022-03-02"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P3703: Kaleykino–Nizhnekamsk Refinery Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "karabash-almetyevsk-kaleykino",
    "name": "Карабаш — Альметьевск — Калейкино",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Республика Татарстан"
    ],
    "purpose": "Короткое региональное нефтяное направление в Альметьевском районе.",
    "route": "Карабаш — Альметьевск — Калейкино",
    "description": "Короткое региональное нефтяное направление в Альметьевском районе. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          52.6,
          54.7
        ],
        [
          52.3,
          54.9
        ],
        [
          52.2,
          54.9
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2319",
    "sourceRecordIds": [
      "P2319"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-01-25",
      "sourceDates": [
        "2023-01-25"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2319: Karabash-Almetyevsk-Kaleykino Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "khadyzhensk-krasnodar",
    "name": "Хадыженск — Краснодар",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Краснодарский край"
    ],
    "purpose": "Региональное нефтяное направление между Хадыженском и Краснодаром.",
    "route": "Хадыженск — Краснодар",
    "description": "Региональное нефтяное направление между Хадыженском и Краснодаром. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          39.5,
          44.5
        ],
        [
          39.0,
          45.0
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2323",
    "sourceRecordIds": [
      "P2323"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-01-25",
      "sourceDates": [
        "2023-01-25"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2323: Khadyzhensk-Krasnodar Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "krymsk-krasnodar",
    "name": "Крымск — Краснодар",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Краснодарский край"
    ],
    "purpose": "Региональное нефтяное направление в западной части Краснодарского края.",
    "route": "Крымск — Краснодар",
    "description": "Региональное нефтяное направление в западной части Краснодарского края. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          38.0,
          44.9
        ],
        [
          39.0,
          45.0
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2330",
    "sourceRecordIds": [
      "P2330"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2025-01-09",
      "sourceDates": [
        "2025-01-09"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2330: Krymsk-Krasnodar Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "kuleshovka-samara",
    "name": "Кулешовка — Самара",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Самарская область"
    ],
    "purpose": "Региональное нефтяное направление; в источнике используется историческое название Самары — Куйбышев.",
    "route": "Кулешовка — Самара",
    "description": "Региональное нефтяное направление; в источнике используется историческое название Самары — Куйбышев. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          51.1,
          52.8
        ],
        [
          50.5,
          53.0
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2333",
    "sourceRecordIds": [
      "P2333"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-01-26",
      "sourceDates": [
        "2023-01-26"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2333: Kuleshovka-Kuibyshev Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "mukhanovo-samara",
    "name": "Муханово — Самара",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Самарская область"
    ],
    "purpose": "Региональное нефтяное направление; в источнике используется название Муханово — Куйбышев.",
    "route": "Муханово — Самара",
    "description": "Региональное нефтяное направление; в источнике используется название Муханово — Куйбышев. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          51.3,
          53.3
        ],
        [
          50.5,
          53.0
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2345",
    "sourceRecordIds": [
      "P2345"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-01-27",
      "sourceDates": [
        "2023-01-27"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2345: Mukhanovo-Kuibyshev Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "chelny-almetyevsk",
    "name": "Набережные Челны — Альметьевск",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Республика Татарстан"
    ],
    "purpose": "Региональное нефтяное направление между двумя промышленными районами Татарстана.",
    "route": "Набережные Челны — Альметьевск",
    "description": "Региональное нефтяное направление между двумя промышленными районами Татарстана. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          52.4,
          54.9
        ],
        [
          52.4,
          55.7
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2347",
    "sourceRecordIds": [
      "P2347"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-01-27",
      "sourceDates": [
        "2023-01-27"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2347: Naberezhnye Chelny-Almetyevsk Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "novovelichkovskaya-krasnodar",
    "name": "Нововеличковская — Краснодар",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Краснодарский край"
    ],
    "purpose": "Короткое региональное нефтяное направление в районе Краснодара.",
    "route": "Нововеличковская — Краснодар",
    "description": "Короткое региональное нефтяное направление в районе Краснодара. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          38.8,
          45.3
        ],
        [
          38.9,
          45.1
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2359",
    "sourceRecordIds": [
      "P2359"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-01-27",
      "sourceDates": [
        "2023-01-27"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2359: Novovelichkovskaya-Krasnodar Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "pokrovka-krotovka",
    "name": "Покровка — Кротовка",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Самарская область"
    ],
    "purpose": "Региональное нефтяное направление. В поле начала источника указан Привольный; Покровка сохранена как официальное имя направления.",
    "route": "Покровка — Кротовка",
    "description": "Региональное нефтяное направление. В поле начала источника указан Привольный; Покровка сохранена как официальное имя направления. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          49.6,
          52.9
        ],
        [
          51.2,
          53.3
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2374",
    "sourceRecordIds": [
      "P2374"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-01-30",
      "sourceDates": [
        "2023-01-30"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2374: Pokrovka-Krotovka Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "salavat-orsk",
    "name": "Салават — Орск",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Республика Башкортостан",
      "Оренбургская область"
    ],
    "purpose": "Межрегиональное нефтяное направление Южного Урала.",
    "route": "Салават — Орск",
    "description": "Межрегиональное нефтяное направление Южного Урала. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          55.9,
          53.4
        ],
        [
          58.5,
          51.3
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2382",
    "sourceRecordIds": [
      "P2382"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-01-30",
      "sourceDates": [
        "2023-01-30"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2382: Salavat-Orsk Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "shkapovo-salavat",
    "name": "Шкапово — Салават",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Республика Башкортостан"
    ],
    "purpose": "Региональное нефтяное направление из Бижбулякского района к Салавату.",
    "route": "Шкапово — Салават",
    "description": "Региональное нефтяное направление из Бижбулякского района к Салавату. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          54.0,
          53.7
        ],
        [
          55.9,
          53.4
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2389",
    "sourceRecordIds": [
      "P2389"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-01-30",
      "sourceDates": [
        "2023-01-30"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2389: Shkapovo-Salavat Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "subkhankulovo-shkapovo",
    "name": "Субханкулово — Шкапово",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Республика Башкортостан"
    ],
    "purpose": "Региональное нефтяное направление внутри Башкортостана.",
    "route": "Субханкулово — Шкапово",
    "description": "Региональное нефтяное направление внутри Башкортостана. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          54.0,
          53.7
        ],
        [
          53.8,
          54.5
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2427",
    "sourceRecordIds": [
      "P2427"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-01-30",
      "sourceDates": [
        "2023-01-30"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2427: Subhankulovo-Shkapovo Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "tikhoretsk-tuapse",
    "name": "Тихорецк — Туапсе",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Краснодарский край"
    ],
    "purpose": "Нефтяное направление к Туапсе. Две документированные нитки объединены в одну обзорную линию.",
    "route": "Тихорецк — Туапсе",
    "description": "Нефтяное направление к Туапсе. Две документированные нитки объединены в одну обзорную линию. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          40.2,
          45.8
        ],
        [
          39.1,
          44.1
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P5127",
    "sourceRecordIds": [
      "P5127",
      "P0659"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2025-01-13",
      "sourceDates": [
        "2023-01-24",
        "2025-01-13"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P5127, P0659: Tikhoretsk-Tuapse 1 Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "tikhoretsk-novorossiysk",
    "name": "Тихорецк — Новороссийск",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Краснодарский край"
    ],
    "purpose": "Нефтяное направление к Новороссийску. Показаны совместно нитки 2 и 3; выведенная из эксплуатации нитка 1 и строящаяся в источнике нитка 4 не включены.",
    "route": "Тихорецк — Новороссийск",
    "description": "Нефтяное направление к Новороссийску. Показаны совместно нитки 2 и 3; выведенная из эксплуатации нитка 1 и строящаяся в источнике нитка 4 не включены. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          40.2,
          45.8
        ],
        [
          37.8,
          44.7
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P5161",
    "sourceRecordIds": [
      "P5161",
      "P5162"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2025-01-09",
      "sourceDates": [
        "2025-01-09"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P5161, P5162: Tikhoretsk-Novorossiysk Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "bavly-samara",
    "name": "Бавлы — Самара",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Республика Татарстан",
      "Самарская область"
    ],
    "purpose": "Межрегиональное нефтяное направление Бавлы — Куйбышев, историческое название Самары.",
    "route": "Бавлы — Самара",
    "description": "Межрегиональное нефтяное направление Бавлы — Куйбышев, историческое название Самары. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          53.3,
          54.4
        ],
        [
          50.5,
          53.0
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2284",
    "sourceRecordIds": [
      "P2284"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-01-25",
      "sourceDates": [
        "2023-01-25"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2284: Bavly-Kuibyshev Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "yaroslavl-moscow",
    "name": "Ярославль — Москва",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Ярославская область",
      "Москва"
    ],
    "purpose": "Отдельное нефтяное направление к Московскому региону. Регионы указаны по именованным конечным районам, не как перечень всех территорий трассы.",
    "route": "Ярославль — Москва",
    "description": "Отдельное нефтяное направление к Московскому региону. Регионы указаны по именованным конечным районам, не как перечень всех территорий трассы. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          39.8,
          57.5
        ],
        [
          37.8,
          55.7
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P5208",
    "sourceRecordIds": [
      "P5208"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2023-02-09",
      "sourceDates": [
        "2023-02-09"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P5208: Yaroslavl-Moscow Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  },
  {
    "id": "zhirnovsk-volgograd",
    "name": "Жирновск — Волгоград",
    "kind": "oil",
    "scope": "regional",
    "regions": [
      "Волгоградская область"
    ],
    "purpose": "Региональное нефтяное направление внутри Волгоградской области.",
    "route": "Жирновск — Волгоград",
    "description": "Региональное нефтяное направление внутри Волгоградской области. Авторская обзорная схема по округлённым опорным районам; точная трасса и текущая работа не подтверждаются.",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          44.8,
          51.0
        ],
        [
          44.4,
          48.9
        ]
      ]
    },
    "source": {
      "name": "Global Energy Monitor · рабочий снимок GOIT",
      "url": "https://github.com/GlobalEnergyMonitor/goit-ggit-data-ops/blob/043a9d0fe8755af76f5b41c892ab7d2494e4d121/goit_map_latest.geojson",
      "publishedAt": "2026-11-03"
    },
    "sourceRecordId": "P2460",
    "sourceRecordIds": [
      "P2460"
    ],
    "evidence": {
      "status": "documented",
      "checkedAt": "2026-11-03",
      "sourceDate": "2025-01-14",
      "sourceDates": [
        "2025-01-14"
      ],
      "basis": "В опубликованном рабочем снимке GOIT найдены записи P2460: Zhirnovsk-Volgograd Oil Pipeline. Название и именованные конечные районы подтверждают существование направления; статус operating относится к сведениям записи, а не к проверке работы сегодня.",
      "sourceStatus": "operating",
      "sourceSnapshot": "2026-11-03T06:32:55Z"
    }
  }
];
