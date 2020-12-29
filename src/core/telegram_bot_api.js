/**
 * Telegram Bot API for GAS
 *
 */
class TelegramBotApi {
  constructor(option) {
    this.VENDER_ID = 'Apple';
    this.TOKEN = '';
    this.DEFAULT_SETTINGS = {};
    this.option = option;
  }

  sendToTelegram(method, params) {
    let data = {};
    let message;
    const config = cx.model.getSettings();
    const url = config.telegram.api_endpoint_prefix + config.telegram.telegram_token + '/' + method;
    if (typeof params === 'object') {
      data = params;
      // data.chat_id = config.telegram.chat_id_admin;
    } else if (params && method === 'sendMessage') {
      message = params;
      if (message.length > 300) {
        message = message.substring(0, 300) + '.....';
      }
      data = {
        chat_id: config.telegram.chat_id_admin,
        text: message,
        method: method,
        disable_web_page_preview: config.telegram.disable_web_page_preview,
        parse_mode: config.telegram.parse_mode
      };
      if (data.text === '') {
        throw new Error('need params text');
      }
      if (Number(data.chat_id) === 0) {
        throw new Error('need params chat_id');
      }
    } else {
      throw new Error('need params');
    }

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(data)
    };
    const response = UrlFetchApp.fetch(url, options);
    // Logger.log([options, response]);
    return response.getContentText();
  }

  sendTgMessage(chat_id, message) {
    const config = cx.model.getSettings();
    return this.sendToTelegram('sendMessage', {
      chat_id: chat_id,
      text: cx.utils.replaceCharactorEntity4TgHtml(message),
      method: 'sendMessage',
      disable_web_page_preview: config.telegram.disable_web_page_preview,
      parse_mode: config.telegram.parse_mode
    });
  }

  sendTgMessageHTML(chat_id, message) {
    const config = cx.model.getSettings();
    return this.sendToTelegram('sendMessage', {
      chat_id: chat_id,
      text: message,
      method: 'sendMessage',
      disable_web_page_preview: config.telegram.disable_web_page_preview,
      parse_mode: config.telegram.parse_mode
    });
  }

  updateMessageHTML(chat_id, message_id, text, reply_markup) {
    const config = cx.model.getSettings();
    const data = {
      chat_id: chat_id,
      message_id: message_id,
      text: text,
      disable_web_page_preview: config.telegram.disable_web_page_preview,
      parse_mode: config.telegram.parse_mode
    };
    if (!text || text === '') {
      throw new Error('updateMessageHTML: need text');
    }
    if (typeof reply_markup === 'string' && reply_markup !== '') {
      data.reply_markup = reply_markup;
    }
    return this.sendToTelegram('editMessageText', data);
  }

  answerCallbackQuery(data) {
    return this.sendToTelegram('answerCallbackQuery', data);
  }
}

/**
 * create TelegramBotApi instance
 * @param {Object} option no use
 * @return TelegramBotApi
 */
function createTelegramBotApi(option) {
  return new TelegramBotApi(option);
}

/**
 * [Apple_bot]
 * InlineKeyboardManager
 */
class InlineKeyboardManager {
  constructor(option) {
    this.VENDER_ID = 'Apple';
    this.key_data = { rows: [] };
    this.option = option;
  }

  addRow(arr, opt) {
    const u = getGlobalContexts().utils;
    const valid_items = [];
    let single_row = [];
    let cell_num;
    let pad_num;
    let c;
    if (!Array.isArray(arr)) {
      return this;
    }
    arr.forEach(item => {
      if (typeof item === 'object' && u.hasProperty(item, 'text') && u.hasProperty(item, 'callback_data')) {
        valid_items.push(item);
      }
    });

    if (typeof opt === 'object' && u.hasProperty(opt, 'cols')) {
      const cols = Number(opt.cols);
      c = valid_items.length;
      while (c > 0) {
        if (cols > c) {
          cell_num = c;
          pad_num = cols - c;
        } else {
          cell_num = cols;
          pad_num = 0;
        }
        single_row = [];
        while (cell_num > 0) {
          cell_num -= 1;
          single_row.push(valid_items.shift());
        }
        // padding cells
        while (pad_num > 0) {
          pad_num -= 1;
          single_row.push(this.createInlineKeyboardButton('?', ''));
        }
        this.key_data.rows.push(single_row);
        c = valid_items.length;
      }
    } else {
      // single_row = valid_items;
      this.key_data.rows.push(valid_items);
    }

    return this;
  }

  getInlineKeyboardMarkup() {
    return JSON.stringify({ inline_keyboard: this.key_data.rows });
  }

  createInlineKeyboardButton(in_data) {
    const u = getGlobalContexts().utils;
    let ikb = { text: '_', callback_data: '_' };
    if (typeof in_data === 'string' && in_data !== '') {
      ikb = { text: in_data, callback_data: in_data };
    }
    if (Array.isArray(in_data) && in_data.length > 1) {
      ikb = { text: in_data[0], callback_data: in_data[1] };
    }
    if (typeof in_data === 'object' && in_data !== null) {
      if (u.hasProperty(in_data, 'text')) {
        ikb.text = in_data.text;
      }
      if (u.hasProperty(in_data, 'callback_data')) {
        ikb.callback_data = in_data.callback_data;
      }
      if (u.hasProperty(in_data, 'url')) {
        ikb.url = in_data.url;
      }
    }
    return ikb;
  }
}

/**
 * create InlineKeyboardManager instance
 * @param {Object} option no use
 * @return InlineKeyboardManager
 */
function createInlineKeyboardManager(option) {
  return new InlineKeyboardManager(option);
}
