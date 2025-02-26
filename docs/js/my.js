/** Services singleton. Contains all other singletons. */
class Services {
  /** Init all the singletons. */
  async init() {
    this.selfTester = await new SelfTester(this).preload();
    this.app = await new App(this).preload();
    this.dom = await new Dom(this).preload();
    this.csvGen = await new CsvGen(this).preload();
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
      this.s('dom').prepare();
    }
    catch (error) {
      console.log(error);
      this.s('dom').addError(error);
    }
  }
  resetAll() {
    const lang = this.s('url').var('lang', 'en');
    this.s('urlBar').setHash('lang/' + lang);
    this.s('urlBar').refreshPage();
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
