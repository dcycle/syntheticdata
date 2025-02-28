/** Services singleton. Contains all other singletons. */
class Services {
  /** Init all the singletons. */
  async init() {
    this.preflight = await new Preflight(this).preload();
    this.selfTester = await new SelfTester(this).preload();
    this.app = await new App(this).preload();
    this.dom = await new Dom(this).preload();
    this.csvGen = await new CsvGen(this).preload();
    this.config = await new MyConfig(this).preload();
    this.urlBar = await new UrlBar(this).preload();
    this.url = await new Url(this).preload();
    this.multilingual = await new Multilingual(this).preload();
    this.multilingualDom = await new MyMultilingualDom(this).preload();
    return this;
  }
  /** Get a singleton. */
  get(name) {
    if (typeof this[name] == 'undefined') {
      throw new Error('Unknown service or services has not been initalized: ' + name);
    }
    return this[name];
  }
}

/** Mock services for testing. */
class MockServices {
  constructor(services) {
    this.services = services;
  }
  get(name) {
    return this.services[name];
  }
}

/** Base class for a single service singleton. */
class Service {
  constructor(services) {
    if (typeof services === 'undefined') {
      throw new Error('Services must be passed to the constructor in ' + this.constructor.name);
    }
    if (typeof services.get === 'undefined') {
      throw new Error('Valid services must be passed to the constructor in ' + this.constructor.name);
    }
    this.services = services;
  }
  /** Preload this service and return itself. */
  async preload() {
    return this;
  }
  /** Get another service. */
  s(name) {
    return this.services.get(name);
  }
}

class UrlBar extends Service {
  getHash() {
    const ret = window.location.hash;
    if(ret.charAt(0) === '#') {
       return ret.substring(1);
    }

    return ret;
  }
  setHash(hash = '') {
    window.location.hash = hash;
  }
  refreshPage() {
    location.reload();
  }
}

class UrlBarMock {
  constructor(hash = '') {
    this._hash = hash;
  }

  getHash() {
    return this._hash;
  }

  setHash(hash) {
    this._hash = hash;
  }
}

class UrlMock {
  constructor(value = '') {
    this._value = value;
  }

  var(param, defaultValue) {
    if (!this._value) {
      return defaultValue;
    }
    return this._value;
  }

  getHash() {
    return 'lang/' + this._value;
  }

  setParam(param, value) {
    this._value = value;
  }
}

class Tester {
  assert(message, condition) {
    console.log('Asserting ' + message);
    if (!condition) {
      throw message;
    }
    console.log('ok');
  }
  assertEqual(message, first, second) {
    if (typeof first == 'undefined') {
      throw new Error('Do not pass undefined to assertEqual.');
    }
    if (typeof second == 'undefined') {
      throw new Error('Do not pass undefined to assertEqual.');
    }
    console.log('Asserting ' + message);
    if (JSON.stringify(first) != JSON.stringify(second)) {
      throw message + ' ' + JSON.stringify(first) + ' != ' + JSON.stringify(second);
    }
    console.log('ok');
  }
  testCase(name) {
    console.log('');
    console.log('---');
    console.log('Running test case ' + name);
    this[name]();
  }
}

class UrlTest extends Tester {
  run() {
    this.testCase('setGetHash');
    this.testCase('hashObject');
    this.testCase('var');
    this.testCase('setParam');
  }
  setGetHash() {
    const that = this;
    [
      'a',
      '/a/b/c/d/',
    ].forEach((hash) => {
      const obj = new Url(new MockServices({
        'urlBar': new UrlBarMock(),
      }));
      obj.setHash(hash);
      that.assertEqual('Making sure hash is set', hash, obj.getHash());
    });
  }
  hashObject() {
    const that = this;
    [
      {
        hash: 'a/b/c/d',
        hashObj: { a: 'b', c: 'd' },
        clean: 'a/b/c/d',
      },
      {
        hash: 'a/b/a/c',
        hashObj: { a: 'c' },
        clean: 'a/c',
      },
      {
        hash: 'a/b/c/d/e/f',
        hashObj: { a: 'b', c: 'd', e: 'f' },
        clean: 'a/b/c/d/e/f',
      },
      {
        hash: 'a/b/c/d/e/f/g/h',
        hashObj: { a: 'b', c: 'd', e: 'f', g: 'h' },
        clean: 'a/b/c/d/e/f/g/h',
      },
    ].forEach((test) => {
      const hash = test.hash;
      const hashObj = test.hashObj;
      const clean = test.clean;
      const obj = new Url(new MockServices({
        'urlBar': new UrlBarMock(),
      }));
      this.assertEqual(
        'Making sure hashToObject works',
        hashObj,
        obj.hashToObject(hash),
      );
      this.assertEqual(
        'Making sure objectToHash works',
        clean,
        obj.objectToHash(hashObj),
      );
      this.assertEqual(
        'Making sure cleanhash works',
        clean,
        obj.cleanHash(hash),
      );
    });
  }
  var() {
    [
      {
        hash: 'a/b/c/d',
        name: 'a',
        value: 'b',
        defaultValue: 'z',
      },
      {
        hash: 'a/b/c/d',
        name: 'c',
        value: 'd',
        defaultValue: 'z',
      },
      {
        hash: 'a/b/c/d',
        name: 'b',
        value: 'z',
        defaultValue: 'z',
      },
      {
        hash: 'a/c/a/d',
        name: 'a',
        value: 'd',
        defaultValue: 'z',
      },
      {
        hash: 'a/c/a/d',
        name: 'a',
        value: 'd',
        defaultValue: 'z',
      },
    ].forEach((test) => {
      const hash = test.hash;
      const name = test.name;
      const value = test.value;
      const defaultValue = test.defaultValue;
      const obj = new Url(new MockServices({
        'urlBar': new UrlBarMock(hash),
      }));
      this.assertEqual(
        'Making sure var works',
        value,
        obj.var(name, defaultValue),
      );
    });
  }

  setParam() {
    [
      {
        'hash': 'a/b/c/d',
        'param': 'a',
        'value': 'b',
        'expected': 'a/b/c/d',
      },
      {
        'hash': 'a/b/c/d',
        'param': 'z',
        'value': '12',
        'expected': 'a/b/c/d/z/12',
      },
      {
        'hash': 'a/b/c/d',
        'param': '/this contains a slash',
        'value': '/this also contains a slash',
        'expected': 'a/b/c/d/%2Fthis%20contains%20a%20slash/%2Fthis%20also%20contains%20a%20slash',
      },
    ].forEach((test) => {
      const hash = test.hash;
      const param = test.param;
      const value = test.value;
      const expected = test.expected;
      const obj = new Url(new MockServices({
        'urlBar': new UrlBarMock(hash),
      }));
      this.assertEqual('Making sure setParam works', expected, obj.setParam(param, value));
    });
  }

}

/** Interact with the URL */
class Url extends Service {
  setHash(hash = '') {
    this.s('urlBar').setHash(hash);
  }

  getHash() {
    return this.s('urlBar').getHash();
  }

  /** convert a hash a/b to an object {a: b} */
  hashToObject(hash) {
    if (typeof hash === 'undefined') {
      return {};
    }
    let ret = {};
    let index = 0;
    let currentKey = '';
    const parts = hash.split('/');
    for (const part of parts) {
      if (index % 2 == 0) {
        currentKey = decodeURIComponent(part);
      }
      else {
        if (currentKey !== '') {
          ret[currentKey] = decodeURIComponent(part);
        }
      }
      index++;
    }
    return ret;
  }

  /** convert an object {a: b} to a hash a/b */
  objectToHash(obj) {
    let retComponents = [];
    for (const key in obj) {
      retComponents.push(encodeURIComponent(key) + '/' + encodeURIComponent(obj[key]));
    }
    return retComponents.join('/');
  }

  /** Normalize the hash by removing extra slashes */
  cleanHash(hash) {
    return this.objectToHash(this.hashToObject(hash));
  }

  /** If hash is a/b/c/d, then a is b, c is d, b is undefined.
   * If the hash is %2F/%2F/a/b, then a is b and / is /.
   * If the hash is a/b/a/c/a/d, it wil return b (the first occurrence).
   */
  var(name, defaultValue = '') {
    const hash = this.getHash();
    if (this.hashToObject(hash)[name]) {
      return this.hashToObject(hash)[name];
    }
    return defaultValue;
  }

  /** Set param and value to hash
   * Example 1: adding param a and value b will cause the hash to contain
   * a/b.
   * Example 2: adding param / and value / will cause the hash to contain
   * %2F/%2F.
   * If the param already exists, it will be replaced.
   */
  setParam(param, value) {
    const hash = this.getHash();
    let hashObj = this.hashToObject(hash);
    hashObj[param] = value;
    return this.objectToHash(hashObj);
  }

}

class MultilingualTest extends Tester {
  run() {
    this.testCase('activeLang');
    this.testCase('setActiveLang');
    this.testCase('translationCrud');
    this.testCase('t');
  }
  newObj(lang) {
    return new Multilingual(new MockServices({
      'url': new UrlMock(lang),
      'urlBar': new UrlBarMock('lang/' + lang),
    }));
  }
  activeLang() {
    const that = this;
    [
      {
        'lang': 'en',
        'expected': 'en',
      },
      {
        'lang': 'fr',
        'expected': 'fr',
      },
      {
        'lang': '',
        'expected': 'en',
      },
    ].forEach((test) => {
      const obj = that.newObj(test.lang);
      const expected = test.expected;

      this.assertEqual('Making sure activeLang works ' + expected, expected, obj.activeLang());
    });
  }
  setActiveLang() {
    const that = this;
    [
      {
        'lang': 'en',
        'expected': 'lang/en',
      },
      {
        'lang': 'fr',
        'expected': 'lang/fr',
      },
    ].forEach((test) => {
      const lang = test.lang;
      const expected = test.expected;
      const obj = that.newObj(lang);

      obj.setActiveLang(lang);
      this.assertEqual('Making sure setActiveLang works ' + expected, expected, obj.s('url').getHash());
    });
  }
  translationCrud() {
    const that = this;
    [
      {
        'hash': '',
        'lang': 'xx',
        'translations': {
          'hello': 'world',
        },
        'expected': 'a/b/c/d/lang/en',
      },
    ].forEach((test) => {
      const lang = test.lang;
      const translations = test.translations;
      const obj = that.newObj(test.hash);

      obj.setTranslations(lang, translations);

      this.assertEqual(
        'Making sure set/get translations works',
        translations,
        obj.getTranslations(lang),
      );
      obj.clearTranslations();
      this.assertEqual(
        'Making sure clear translations works',
        {},
        obj.getTranslations(lang),
      );
    });
  }
  t() {
    const that = this;
    [
      {
        'lang': 'xx',
        'args': { 'name': 'world' },
        'translations': {},
        'string': 'hello',
        'expected': 'hello',
      },
      {
        'lang': 'xx',
        'args': { 'name': 'world' },
        'translations': {},
        'string': 'hello',
        'expected': 'hello',
      },
      {
        'lang': 'fr',
        'args': { 'name': 'world' },
        'translations': {
          'hello': 'bonjour',
        },
        'string': 'hello',
        'expected': 'bonjour',
      },
      {
        'lang': 'fr',
        'args': { 'name': 'world' },
        'translations': {
          'hello name': 'bonjour name',
        },
        'string': 'hello name',
        'expected': 'bonjour world',
      },
    ].forEach((test) => {
      const string = test.string;
      const lang = test.lang;
      const args = test.args;
      const translations = test.translations;
      const expected = test.expected;
      const obj = that.newObj(lang);
      obj.setTranslations(lang, translations);

      this.assertEqual(
        'Making sure t works: ' + expected,
        expected,
        obj.t(string, args),
      );
    });
  }
}

class CsvDef {

}

class CsvDefArray extends CsvDef {

}

class CsvDefUrl extends CsvDef {

}

class CsvDefFileContents extends CsvDef {

}

class CsvDefUi extends CsvDef {

}

class CsvDevPreview extends CsvDef {

}


/** Multiligual system, like translations */
class Multilingual extends Service {
  prepare() {
    const that = this;
    const translations = this.s('config').translations();
    const languages = this.s('config').languages();
    this.setInitialTranslations();
    languages.forEach((lang) => {
      that.setTranslations(lang, translations[lang]);
    });
    this.setCount();
  }

  setInitialTranslations() {
    $('.translate-me').each(function() {
      const str = $(this).text();
      $(this).attr('translate-me-content-text', str.trim());
      $(this).attr('translate-me-args-content-text', "{}");
      $(this).addClass('translate-me-content-text');
    });
    this.s('multilingualDom').translateInterface(this.activeLang());
  }

  setCount() {
    const defaultLineCount = 400;
    const maxLineCount = 4000;

    let count = parseInt(this.s('url').var('count', defaultLineCount));

    if (count == NaN) {
      count = defaultLineCount;
    }

    if (count < 1) {
      count = 1;
    }

    if (count > maxLineCount) {
      count = maxLineCount;
    }

    $('.count-values').val(count);
  }

  /** Get the active language */
  activeLang() {
    return this.s('url').var('lang', 'en');
  }

  /** Set the active language */
  setActiveLang(lang) {
    const hash = this.s('url').setParam('lang', lang);
    this.s('urlBar').setHash(hash);
  }

  /** Get the translation set. */
  getTranslations(lang) {
    if (lang == '') {
      return {};
    }
    if (typeof this.translations === 'undefined') {
      this.translations = {};
    }
    if (typeof this.translations[lang] === 'undefined') {
      this.translations[lang] = {};
    }
    return this.translations[lang];
  }

  /** Clear all translations */
  clearTranslations() {
    this.translations = {};
  }
  /** Add translations to the set, overwriting existing ones. */
  setTranslations(lang, translations) {
    const previousTranslations = this.getTranslations(lang);
    this.translations[lang] = { ...previousTranslations, ...translations };
  }

  /** Translate a string. */
  t(str, args = {}, lang = '') {
    if (lang == '') {
      lang = this.activeLang();
    }
    const translations = this.getTranslations(lang);
    if (typeof translations[str] === 'undefined') {
      return this.replaceArgs(str, args);
    }
    return this.replaceArgs(translations[str], args);
  }

  /** Internal function to replace args in a string with values. */
  replaceArgs(str, args) {
    for (const key in args) {
      str = str.replaceAll(key, args[key]);
    }
    return str;
  }

}

/** A multilingual representation of the DOM. */
class MyMultilingualDom extends Service {

  /** Prepare our multilingual DOM */
  prepare() {
    const activeLang = this.s('multilingual').activeLang();
    this.putLanguages(
      this.s('config').languages(),
    );
    this.setActiveLang(activeLang);
    this.setHomeButton(activeLang);
    this.setStartButton(activeLang);
    this.setContent(
      '.put-sitename-here',
      'content-text',
      'Synthetic Data',
    )
  }

  setStartButton(activeLang) {
    $('.start-button').attr('href',
      'go.html#col-1/name.name/col-2/age.int.18-55/count/400/lang/' + activeLang,
    );
  }

  setHomeButton(lang) {
    const that = this;
    $('.back-to-home').attr('href', 'index.html#lang/' + lang);
    $('.back-to-home').off().click(function(e) {
      e.preventDefault();
      that.s('app').resetAll();
    });
  }

  /** Of the language links (en, fr), make the appropriate one active */
  setActiveLangLink(activeLang) {
    const that = this;
    $('.language').removeClass('active');
    $('.language').each(function() {
      const lang = $(this).data('lang');
      if (activeLang == lang) {
        $(this).addClass('active');
        $(this).text(lang);
      }
      else {
        $(this).html('<a href="#' + that.s('url').setParam('lang', lang) + '" class="switch-lang" data-lang="' + lang + '">' + lang + '</a>');
        $(this).off().on('click', function(e) {
          e.preventDefault();
          that.setActiveLang(lang);
        });
      }
    });
  }

  /** Set the active language */
  setActiveLang(lang) {
    this.s('multilingual').setActiveLang(lang);
    this.translateInterface(lang);
    this.setActiveLangLink(lang);
    this.setHomeButton(lang);
    this.setStartButton(lang);
  }

  /** Translate the interface */
  translateInterface(lang) {
    const that = this;
    $('.translate-me-href').each(function() {
      const str = $(this).attr('translate-me-href');
      const stringifiedArgs = $(this).attr('translate-me-args-href');
      const args = JSON.parse(stringifiedArgs);
      const translated = that.s('multilingual').t(str, args, lang);
      $(this).attr('href', translated);
    });
    $('.translate-me-content-text').each(function() {
      const str = $(this).attr('translate-me-content-text');
      const stringifiedArgs = $(this).attr('translate-me-args-content-text');
      const args = JSON.parse(stringifiedArgs);
      const translated = that.s('multilingual').t(str, args, lang);
      $(this).text(translated);
    });
  }

  /** Put languages */
  putLanguages(languages) {
    let first = true;
    languages.forEach((language) => {
      $('.languages').append(`<span class="language" data-lang="${language}">${language}</span>`);
    });
  }

  setContent(selector, loc, content, args = {}) {
    this.s('dom').setContent(selector, [
      {
        loc: loc,
        content: this.s('multilingual').t(content, args),
      },
      {
        loc: 'translate-me-' + loc,
        content: content,
      },
      {
        loc: 'translate-me-args-' + loc,
        content: JSON.stringify(args),
      },
    ], 'translate-me-' + loc);
  }

}


// /** Wrapper for the config object at ./data/all.json */
class MyConfig extends Service {
  /** Prepare the config */
  async preload() {
    const that = this;
    $.ajaxSetup({
      async: false
    });
    $.getJSON(`./data/all.json`, (data) => {
      that.data = data;
    });
    return this;
  }

  /** Make sure the config has been preloaded */
  assertPreloaded() {
    if (typeof this.data === 'undefined') {
      throw new Error('Config data has not been preloaded.');
    }
  }

  /** Get all available translations from the config file. */
  translations() {
    this.assertPreloaded();
    return this.data['translations'];
  }

  /** Get available languages. */
  languages() {
    this.assertPreloaded();
    return this.data['languages'];
  }

}

class Preflight extends Service {
  check() {
    if (location.protocol == 'file:') {
      throw ('Cannot use file:// protocol. You might want to try: python3 -m http.server; see https://documentation.dcycle.com for more details.');
    }
  }
}

/** Wrapper for the application. */
class App extends Service {
  run() {
    try {
      this.s('preflight').check();
      this.s('dom').prepare();
      this.s('multilingual').prepare();
      this.s('multilingualDom').prepare();
    }
    catch (error) {
      console.log(error);
      this.s('dom').addError(error);
    }
  }
  resetAll() {
    const lang = this.s('url').var('lang', 'en');
    window.location.replace('index.html#lang/' + lang);
    //this.s('urlBar').refreshPage();
  }
  createCsvInDiv() {
    $('#csv').text(this.s('csvGen').getCsv());
  }
  visualize() {
    this.createCsvInDiv();
    alert('Visualize not implemented.');
  }
  download() {
    this.createCsvInDiv();
    // https://code-maven.com/create-and-download-csv-with-javascript
    // https://stackoverflow.com/questions/29702758/html-button-to-save-div-content-using-javascript
    var csv = $('#csv').text()
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'donnes-synthetiques.csv';
    hiddenElement.click();
  }
}

class CsvGen extends Service {
  getCsv() {
    return 'a,b,c\n1,2,3\n4,5,6';
  }
  getColumns() {
    let ret = [];
    $('tr[draggable=true]').each(function() {
      //ret.push(new Column($(this)));
      console.log($(this).find('.col-header').attr('value'));
      console.log($(this).find('.my-type').attr('value'));
    });
    return ret;
  }
}

/** In a console, run SelfTester.test() to make sure stuff works. */
class SelfTester extends Service {
  test() {
    new Preflight(new MockServices()).check();
    new UrlTest().run();
    new MultilingualTest().run();
  }
}

class Dom extends Service {
  addError(error) {
    $('.unhide-if-errors').show();
    $('.put-errors-here').append(`<p>${error}</p>`);
    $('.hide-if-errors').hide();
  }
  prepare() {
    this.putCurrentYear();
    this.showStartGame();
    this.plusIcon();
    this.deleteRowIcon();
    this.visualize();
    this.download();
  }
  visualize() {
    const that = this;
    $('.visualize').off().on('click', function() {
      that.s('app').visualize();
    });
  }
  download() {
    const that = this;
    $('.download-me').off().on('click', function() {
      that.s('app').download();
    });
  }
  addRow() {
    $('.my-template.row-template')
      .clone()
      .attr('draggable', 'true')
      .attr('ondragstart', 'start()')
      .attr('ondragover', 'dragover()')
      .removeClass('my-template')
      .insertBefore('.insert-row-before');

    this.deleteRowIcon();
  }
  deleteRowIcon() {
    $('.delete-row').off().on('click', function() {
      $(this).closest('tr').remove();
    });
  }
  plusIcon() {
    const that = this;
    $('.insert-row').off().on('click', function() {
      that.addRow();
    });
  }
  showStartGame() {
    this.hideTitle();
    $('.start-game').show();
  }
  hide(selector) {
    $(selector).hide();
  }
  hideTitle() {
    $('.h1').hide();
  }
  putCurrentYear() {
    $('.put-year-here').text(new Date().getFullYear());
  }
  setContent(selector, attributes, addClass) {
    attributes.forEach((attribute) => {
      if (attribute.loc == 'content-text') {
        $(selector).text(attribute.content);
      }
      else if (attribute.loc == 'content-html') {
        $(selector).html(attribute.content);
      }
      else {
        $(selector).attr(attribute.loc, attribute.content);
      }
    });
    $(selector).addClass(addClass);
  }
}

class MyUtilities extends Service {
  randomArrayElem(array) {
    if (typeof array === 'undefined') {
      throw new Error('randomArrayElem requires an array; not undefined.');
    }
    return array[Math.floor(Math.random() * array.length)];
  }
}
