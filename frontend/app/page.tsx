'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export const LANGS = ['kk', 'ru', 'en'];
export const LOCALES = { kk: 'kk-KZ', ru: 'ru-RU', en: 'en-US' };

/* ------------------------------------------------------------------ */
/*  Словари. Добавляйте сюда все строки интерфейса: t('ключ')           */
/*  Каждый ключ должен быть во всех трёх языках — тогда языки не        */
/*  смешиваются.                                                        */
/* ------------------------------------------------------------------ */
const DICT = {
  ru: {
    'subtitle': 'Инфракрасный таймлапс всего неба и платформа открытий для всех',
    'search': 'Искать',
    'share': 'Поделиться',
    'type.brownDwarf': 'Коричневый карлик',
    'type.highMotion': 'Быстрое движение',
    'type.binaryDwarf': 'Двойной карлик',
    'type.variable': 'Переменная звезда',
    'type.miraPulsator': 'Пульсирующая звезда',
    'coords': 'Координаты на небе',
    'modes': 'Режимы анализа',
    'imageSubtraction': 'Сравнение снимков',
    'catalogs': 'Каталоги звёзд (Gaia, WISE)',
    'motionVectors': 'Стрелки движения',
    'on': 'ВКЛ',
    'off': 'ВЫКЛ',
    'fov': 'Размер участка неба',
    'lightCurve': 'Как менялась яркость',
    'epoch': 'Снимок',
    'pause': 'ПАУЗА',
    'play': 'ИГРАТЬ',
    'speed': 'Скорость',
    'spectrometer': 'Спектрометр (102 цвета)',
    'array': 'Диапазон',
    'flagged': 'Что заметно здесь',
    'discovery': 'Журнал открытий',
    'exportJson': 'Скачать JSON',
    'obj.movingAsteroid': 'Движущийся астероид / сближающийся с Землёй',
    'obj.variable': 'Переменная звезда',
    'obj.other': 'Другое',

    'facts.title': 'Знаешь ли ты?',
    'facts.next': 'Следующий факт',

    'size.title': 'Размер',
    'size.radius': 'Радиус',
    'size.approx': 'приблизительно',
    'size.same': 'почти как Земля',
    'size.larger': '{name} больше Земли в {n} {times}',
    'size.smaller': '{name} меньше Земли в {n} {times}',
    'size.km': '≈ {km} км',
    'atm.title': 'Из чего состоит атмосфера',
    'atm.star': 'Из чего состоит внешний слой',
    'temp': 'Температура',
    'spec.title': 'Как это связано со спектрометром',
    'spec.what': 'Спектрометр — это «призма» для света. Он раскладывает свет объекта на цвета, как радугу. SPHEREx видит 102 инфракрасных цвета, которых не видит глаз. У каждого вещества свой «отпечаток»: оно поглощает свет в определённых цветах. Так по свету можно узнать, из чего состоит объект, не долетая до него.',
    'spec.link': 'Вот что SPHEREx ищет у этого объекта:',
    'spec.row': '{um} мкм — {mol}',
    'spec.dip': 'Провал на графике в этом месте значит: вещество есть. Чем глубже провал, тем его больше.',
    'sources': 'Источники',

    'motion.title': 'Как двигался объект',
    'motion.sentence': 'С {from} по {to} ({duration}) объект сместился на небе на {dist}″ — в сторону {dir}.',
    'motion.moon': 'Это примерно 1/{n} ширины Луны на небе.',
    'motion.arcsec': '″ — угловая секунда: 1/3600 градуса.',
    'motion.none': 'За выбранный период заметного движения нет.',
    'motion.start': 'Нужно выбрать хотя бы второй снимок.',
    'dir.east': 'востока', 'dir.west': 'запада', 'dir.north': 'севера', 'dir.south': 'юга',
    'dir.and': ' и ',

    'ai.open': 'ИИ-помощник',
    'ai.hint': 'Нажми два раза на элемент, который тебе непонятен',
    'ai.title': 'ИИ-помощник',
    'ai.close': 'Закрыть',
    'ai.empty': 'Дважды нажми на любую кнопку, график или надпись — и спроси, что это.',
    'ai.selected': 'Выбрано: «{label}». Что ты хочешь узнать?',
    'ai.placeholder': 'Например: что это значит?',
    'ai.send': 'Спросить',
    'ai.thinking': 'Думаю…',
    'ai.offline': 'ИИ сейчас недоступен. Вот короткое пояснение:',
    'ai.noInfo': 'ИИ сейчас недоступен, попробуй чуть позже.',
    'unit.day.one': 'день', 'unit.day.few': 'дня', 'unit.day.many': 'дней',
    'unit.year.one': 'год', 'unit.year.few': 'года', 'unit.year.many': 'лет',
    'unit.times.one': 'раз', 'unit.times.few': 'раза', 'unit.times.many': 'раз',
  },

  kk: {
    'subtitle': 'Бүкіл аспанның инфрақызыл таймлапсы және барлығына арналған ашылулар платформасы',
    'search': 'Іздеу',
    'share': 'Бөлісу',
    'type.brownDwarf': 'Қоңыр карлик',
    'type.highMotion': 'Жылдам қозғалыс',
    'type.binaryDwarf': 'Қос карлик',
    'type.variable': 'Айнымалы жұлдыз',
    'type.miraPulsator': 'Пульсациялайтын жұлдыз',
    'coords': 'Аспандағы координаттар',
    'modes': 'Талдау режимдері',
    'imageSubtraction': 'Суреттерді салыстыру',
    'catalogs': 'Жұлдыз каталогтары (Gaia, WISE)',
    'motionVectors': 'Қозғалыс бағыттары',
    'on': 'ҚОСУЛЫ',
    'off': 'ӨШІРУЛІ',
    'fov': 'Аспан бөлігінің өлшемі',
    'lightCurve': 'Жарықтық қалай өзгерді',
    'epoch': 'Түсірілім',
    'pause': 'ПАУЗА',
    'play': 'ОЙНАТУ',
    'speed': 'Жылдамдық',
    'spectrometer': 'Спектрометр (102 түс)',
    'array': 'Диапазон',
    'flagged': 'Мұнда не байқалады',
    'discovery': 'Ашулар журналы',
    'exportJson': 'JSON жүктеу',
    'obj.movingAsteroid': 'Қозғалатын астероид / Жерге жақындайтын',
    'obj.variable': 'Айнымалы жұлдыз',
    'obj.other': 'Басқа',

    'facts.title': 'Білесің бе?',
    'facts.next': 'Келесі дерек',

    'size.title': 'Өлшемі',
    'size.radius': 'Радиус',
    'size.approx': 'шамамен',
    'size.same': 'Жерге дерлік тең',
    'size.larger': '{name} Жерден {n} есе үлкен',
    'size.smaller': '{name} Жерден {n} есе кіші',
    'size.km': '≈ {km} км',
    'atm.title': 'Атмосферасы неден тұрады',
    'atm.star': 'Сыртқы қабаты неден тұрады',
    'temp': 'Температурасы',
    'spec.title': 'Спектрометрмен байланысы қандай',
    'spec.what': 'Спектрометр — жарыққа арналған «призма». Ол заттан келген жарықты кемпірқосақ сияқты түстерге жіктейді. SPHEREx көз көрмейтін 102 инфрақызыл түсті көреді. Әр заттың өз «таңбасы» бар: ол жарықты белгілі бір түстерде жұтады. Осылайша объектіге ұшып бармай-ақ, оның неден тұратынын білуге болады.',
    'spec.link': 'SPHEREx осы объектіден мынаны іздейді:',
    'spec.row': '{um} мкм — {mol}',
    'spec.dip': 'Графиктегі осы жердегі ойыс — зат бар дегенді білдіреді. Ойыс терең болған сайын, зат көп.',
    'sources': 'Дереккөздер',

    'motion.title': 'Объект қалай қозғалды',
    'motion.sentence': '{from} мен {to} аралығында ({duration}) объект аспанда {dist}″ жылжыды — бағыты: {dir}.',
    'motion.moon': 'Бұл аспандағы Ай енінің шамамен 1/{n} бөлігі.',
    'motion.arcsec': '″ — бұрыштық секунд: градустың 1/3600 бөлігі.',
    'motion.none': 'Таңдалған кезеңде байқалатын қозғалыс жоқ.',
    'motion.start': 'Кемінде екінші түсірілімді таңдаңыз.',
    'dir.east': 'шығыс', 'dir.west': 'батыс', 'dir.north': 'солтүстік', 'dir.south': 'оңтүстік',
    'dir.and': ' және ',

    'ai.open': 'ЖИ-көмекші',
    'ai.hint': 'Түсініксіз элементті екі рет басыңыз',
    'ai.title': 'ЖИ-көмекші',
    'ai.close': 'Жабу',
    'ai.empty': 'Кез келген батырманы, графикті немесе жазуды екі рет басып, не екенін сұраңыз.',
    'ai.selected': 'Таңдалды: «{label}». Не білгіңіз келеді?',
    'ai.placeholder': 'Мысалы: бұл нені білдіреді?',
    'ai.send': 'Сұрау',
    'ai.thinking': 'Ойланып жатырмын…',
    'ai.offline': 'ЖИ қазір қолжетімсіз. Қысқаша түсініктеме:',
    'ai.noInfo': 'ЖИ қазір қолжетімсіз, сәлден кейін қайталап көріңіз.',
    'unit.day.one': 'күн', 'unit.day.few': 'күн', 'unit.day.many': 'күн',
    'unit.year.one': 'жыл', 'unit.year.few': 'жыл', 'unit.year.many': 'жыл',
    'unit.times.one': 'есе', 'unit.times.few': 'есе', 'unit.times.many': 'есе',
  },

  en: {
    'subtitle': 'All-Sky Infrared Time-Lapse & Citizen Discovery Platform',
    'search': 'Search',
    'share': 'Share',
    'type.brownDwarf': 'Brown dwarf',
    'type.highMotion': 'High motion',
    'type.binaryDwarf': 'Binary dwarf',
    'type.variable': 'Variable star',
    'type.miraPulsator': 'Mira pulsator',
    'coords': 'Sky coordinates',
    'modes': 'Analysis modes',
    'imageSubtraction': 'Compare images',
    'catalogs': 'Star catalogs (Gaia, WISE)',
    'motionVectors': 'Motion arrows',
    'on': 'ON',
    'off': 'OFF',
    'fov': 'Size of the sky patch',
    'lightCurve': 'How brightness changed',
    'epoch': 'Snapshot',
    'pause': 'PAUSE',
    'play': 'PLAY',
    'speed': 'Speed',
    'spectrometer': 'Spectrometer (102 colors)',
    'array': 'Range',
    'flagged': 'What stands out here',
    'discovery': 'Discovery log',
    'exportJson': 'Download JSON',
    'obj.movingAsteroid': 'Moving asteroid / near-Earth object',
    'obj.variable': 'Variable star',
    'obj.other': 'Other',

    'facts.title': 'Did you know?',
    'facts.next': 'Next fact',

    'size.title': 'Size',
    'size.radius': 'Radius',
    'size.approx': 'approximate',
    'size.same': 'about the same as Earth',
    'size.larger': '{name} is {n} {times} larger than Earth',
    'size.smaller': '{name} is {n} {times} smaller than Earth',
    'size.km': '≈ {km} km',
    'atm.title': 'What the atmosphere is made of',
    'atm.star': 'What the outer layer is made of',
    'temp': 'Temperature',
    'spec.title': 'How this connects to the spectrometer',
    'spec.what': 'A spectrometer is a “prism” for light. It splits an object’s light into colors, like a rainbow. SPHEREx sees 102 infrared colors that your eyes cannot. Every substance has its own “fingerprint”: it absorbs light at certain colors. That is how we learn what an object is made of without ever going there.',
    'spec.link': 'Here is what SPHEREx looks for in this object:',
    'spec.row': '{um} µm — {mol}',
    'spec.dip': 'A dip in the graph at this spot means the substance is there. The deeper the dip, the more of it.',
    'sources': 'Sources',

    'motion.title': 'How the object moved',
    'motion.sentence': 'From {from} to {to} ({duration}) the object shifted by {dist}″ across the sky — toward the {dir}.',
    'motion.moon': 'That is about 1/{n} of the Moon’s width in the sky.',
    'motion.arcsec': '″ is an arcsecond: 1/3600 of a degree.',
    'motion.none': 'No noticeable movement in the chosen period.',
    'motion.start': 'Pick at least the second snapshot.',
    'dir.east': 'east', 'dir.west': 'west', 'dir.north': 'north', 'dir.south': 'south',
    'dir.and': ' and ',

    'ai.open': 'AI assistant',
    'ai.hint': 'Double-click anything you don’t understand',
    'ai.title': 'AI assistant',
    'ai.close': 'Close',
    'ai.empty': 'Double-click any button, chart or label — then ask what it is.',
    'ai.selected': 'Selected: “{label}”. What would you like to know?',
    'ai.placeholder': 'For example: what does this mean?',
    'ai.send': 'Ask',
    'ai.thinking': 'Thinking…',
    'ai.offline': 'The AI is unavailable right now. Here is a short explanation:',
    'ai.noInfo': 'The AI is unavailable right now, please try again later.',
    'unit.day.one': 'day', 'unit.day.few': 'days', 'unit.day.many': 'days',
    'unit.year.one': 'year', 'unit.year.few': 'years', 'unit.year.many': 'years',
    'unit.times.one': 'time', 'unit.times.few': 'times', 'unit.times.many': 'times',
  },
};

/* Выбор формы слова: ru — 3 формы, en — 2, kk — одна */
export function pluralKey(lang, n) {
  const i = Math.abs(Math.floor(n));
  if (lang === 'ru') {
    const m10 = i % 10, m100 = i % 100;
    if (n !== i) return 'few';              // дробные: «1,5 раза»
    if (m10 === 1 && m100 !== 11) return 'one';
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'few';
    return 'many';
  }
  if (lang === 'en') return n === 1 ? 'one' : 'many';
  return 'one';
}

const I18nContext = createContext(null);

export function LanguageProvider({ children, defaultLang = 'ru' }) {
  const [lang, setLangState] = useState(defaultLang);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('spherex-lang');
      if (LANGS.includes(saved)) setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('spherex-lang', l); } catch {}
  }, []);

  const t = useCallback((key, vars) => {
    let s = DICT[lang]?.[key] ?? key; // НЕ подставляем другой язык — лучше увидеть ключ и исправить
    if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
    return s;
  }, [lang]);

  const fmt = useCallback((n, digits = 1) =>
    new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: digits }).format(n), [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, fmt }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

/* Текст объекта {kk, ru, en} → строка на текущем языке */
export const pick = (obj, lang) => (obj && obj[lang]) || '';
