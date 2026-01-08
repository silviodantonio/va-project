// constants.js
export const REGION_LIST = [
    "Piemonte", "Valle d'Aosta", "Liguria", "Lombardia",
    "Trentino", "Veneto", "Friuli",
    "Emilia-Romagna", "Toscana", "Umbria", "Marche", "Lazio", "Abruzzo",
    "Molise", "Campania", "Puglia", "Basilicata", "Calabria", "Sicilia", "Sardegna"
];

export const INTERSECTION_LIST = [
    "crossroad", "traffic circle", "level crossing",
    "straight stretch", "bend", "bump-slope-bottleneck", "tunnel"
];

export const ACCIDENT_TYPE_LIST = [
    "accident between vehicles",
    "vehicle-pedestrian accident",
    "accidents involving a single vehicle"
];

export const WEEK_DAY_LIST = [
      "Dom", "Lun", "Mar",
      "Mer", "Gio", "Ven", "Sab"
    ];

export const WEEK_DAY_DICTIONARY = {
      "Dom": "Domenica", "Lun": "Lunedì", "Mar": "Martedì",
      "Mer": "Mercoledì", "Gio": "Giovedì", "Ven": "Venerdì", "Sab": "Sabato"
    };

export const MONTH_LIST = [
      "Gennaio", "Febbraio", "Marzo", "Aprile",
      "Maggio", "Giugno", "Luglio", "Agosto",
      "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];

export const HOUR_LIST = [
        "1", "2", "3", "4", "5", "6", "7", "8",
        "9", "10", "11", "12", "13", "14", "15", "16",
        "17", "18", "19", "20", "21", "22", "23", "24"
    ];

export const DEADLY_LIST = ["Injured", "Dead"];

export const labels = {
    region: REGION_LIST,
    intersection: INTERSECTION_LIST,
    accident_type: ACCIDENT_TYPE_LIST,
    week_day: WEEK_DAY_LIST,
    month: MONTH_LIST,
    hour: HOUR_LIST,
    deadly: DEADLY_LIST,
}