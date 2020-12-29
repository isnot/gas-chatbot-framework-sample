/**
 * [Apple_bot]
 * bot class: abstract
 */
class AbstractAppleBot {
  constructor() {
    // call super() first before your own imprement.
    this.VENDER_ID = 'Apple';
    this.target_api = '';
    this.isPrimary = false;
    this.valid_handler_type = [];
  }

  getValidHandlerTypes() {
    return this.valid_handler_type;
  }

  formatBody(message = {}) {
    // this functions should be implemented.
    return '';
  }

  sendToAdmin(param) {
    // this functions should be implemented.
    return '';
  }

  describeAboutMyBot() {
    // this functions should be implemented.
    const ipr = this.isPrimary ? 'is Primary' : 'not Primary';
    return `target_api: ${this.target_api}, ${ipr}`;
  }

  postProcess() {
    // this functions should be implemented.
    return '';
  }

  formatDateTime(dtstring, format) {
    const cx = getGlobalContexts();
    const config = cx.model.getSettings();
    const tz = cx.utils.deepRetrieve(config, 'misc.TimeZone');
    let dt;
    if (dtstring) {
      dt = new Date(dtstring);
    } else {
      dt = new Date();
    }
    return Utilities.formatDate(dt, tz, format);
  }

  makeContent(output) {
    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
  }

  ok(data) {
    const res = { result: true };
    if (data) {
      res.data = data;
    }
    return this.makeContent(res);
  }

  err(msg) {
    console.error(msg);
    return this.makeContent({ result: false, message: msg || 'unknown error.' });
  }

  myDispatch(data = {}) {
    throw new Error(`Not implemented yet.`);
  }

  dispatch(request) {
    const cx = getGlobalContexts();

    if (!this.isPrimary) {
      throw new Error(`I am not a primary bot. I could not dispatch. ${this.target_api}`);
    }

    if (
      typeof request !== 'object' ||
      typeof request.postData !== 'object' ||
      request.postData.length < 1 ||
      request.postData.type !== 'application/json'
    ) {
      return this.err('500');
    }
    const data = JSON.parse(request.postData.contents) || {};
    cx.incoming = data;
    cx.requestContents = request.postData.contents;
    cx.outgoing = new Set();

    try {
      this.myDispatch(data);
    } catch (e) {
      cx.bot.sendToAdmin(['DEBUG dispatch err', e]);
      return this.err(e);
    }

    this.postProcess();
    return this.ok();
  }
}
