/**
 * UI translations for all supported locales
 * Finnish (fi) is the source of truth
 * Key pattern: {page}.{element}
 */
export const ui = {
  fi: {
    // Home page
    'home.title': 'Roolipeli.info - Suomalaisen roolipelaamisen tietokanta',
    'home.welcome': 'Roolipeli.info - Tervetuloa!',
    'home.tagline':
      'Kanoninen tietolähde suomalaisesta roolipelaamisesta ja Suomessa tehdyistä pöytäroolipeleistä..',
    'home.mission.label': 'Missio',
    'home.mission.title': 'Kattava tietokanta ja kanoninen tietolähde',
    'home.mission.description':
      'Rakennamme kattavan kanonisen lähteen suomalaiselle pöytäroolipeliharrastukselle sen kaikissa muodoissa.',
    'home.lang.fi': 'Suomi',
    'home.lang.sv': 'Svenska',
    'home.lang.en': 'English',

    // Navigation cards
    'nav.products.label': 'Tuotteet',
    'nav.products.title': 'Selaa kuvastoa',
    'nav.products.description': 'Selaa kotimaisia julkaistuja roolipelejä ja lisäosia',
    'nav.publishers.label': 'Kustantajat',
    'nav.publishers.title': 'Julkaisijat',
    'nav.publishers.description': 'Tutustu kotimaisiin julkaisijoihin',
    'nav.creators.label': 'Tekijät',
    'nav.creators.title': 'Henkilöt',
    'nav.creators.description': 'Ihmiset suomalaisen pöytäroolipeliharrastuksen takana',

    // 404 page
    'error.404.title': 'Sivua ei löytynyt | Roolipeli.info',
    'error.404.label': 'Virhe 404',
    'error.404.heading': 'Sivua ei löytynyt',
    'error.404.message': 'Etsimääsi sivua ei ole olemassa tai se on siirretty.',
    'error.404.homeLink': 'Palaa etusivulle',

    // Products pages
    'products.title': 'Tuotteet | Roolipeli.info',
    'products.heading': 'Tuotteet',
    'products.backLink': 'Takaisin tuotteisiin',

    // Product detail
    'product.metadata.label': 'Tiedot',
    'product.metadata.type': 'Tyyppi',
    'product.metadata.year': 'Vuosi',
    'product.metadata.lang': 'Kieli',
    'product.metadata.publisher': 'Kustantaja',
    'product.metadata.isbn': 'ISBN',
    'product.description.label': 'Kuvaus',
    'product.creators.label': 'Tekijät',

    // Publishers pages
    'publishers.title': 'Kustantajat | Roolipeli.info',
    'publishers.heading': 'Kustantajat',
    'publishers.backLink': 'Takaisin kustantajiin',
    'publisher.description.label': 'Kuvaus',
    'publisher.products.label': 'Julkaistut tuotteet',
    'publisher.products.empty': 'Ei vielä julkaistuja tuotteita tietokannassa.',

    // Creators pages
    'creators.title': 'Tekijät | Roolipeli.info',
    'creators.heading': 'Tekijät',
    'creators.backLink': 'Takaisin tekijöihin',
    'creator.projects.label': 'Projekteja',
    'creator.projects.empty': 'Ei vielä merkittyjä projekteja tietokannassa.',

    // Admin
    'admin.title': 'Hallinta | Roolipeli.info',
    'admin.dashboard': 'Hallintapaneeli',
    'admin.products': 'Tuotteet',
    'admin.publishers': 'Kustantajat',
    'admin.creators': 'Tekijät',
    'admin.logout': 'Kirjaudu ulos',
    'admin.backToSite': 'Takaisin sivustolle',
    'admin.save': 'Tallenna',
    'admin.cancel': 'Peruuta',
    'admin.publishers.new': 'Uusi kustantaja',
    'admin.publishers.edit': 'Muokkaa kustantajaa',
    'admin.publishers.create': 'Luo kustantaja',
    'admin.creators.new': 'Uusi tekijä',
    'admin.creators.edit': 'Muokkaa tekijää',
    'admin.creators.create': 'Luo tekijä',
    'admin.products.new': 'Uusi tuote',
    'admin.products.edit': 'Muokkaa tuotetta',
    'admin.products.create': 'Luo tuote',
  },
  // Placeholders for future multilingual support
  sv: {
    'home.welcome': 'Välkommen!',
  },
  en: {
    'home.welcome': 'Welcome!',
  },
} as const;

export const defaultLang = 'fi';
