/**
 * [Apple_bot]
 * Bot Commands and behavier.
 * functions that depend on global contexts.
 */
class TelegramBot extends AbstractAppleBot {
  constructor(option) {
    super();
    this.target_api = 'tg';
    this.valid_handler_type = [
      'any',
      'callback_query',
      'text', // テキスト
      'caption',
      'sticker', // スタンプ
      'photo', // 画像
      'video', // 動画
      'audio', // 音声
      'voice',
      'video_note',
      'document',
      'animation',
      'location', // 位置情報
      'venue',
      'contact', // 連絡先
      'poll',
      'new_chat_members',
      'left_chat_member',
      'new_chat_title',
      'new_chat_photo',
      'delete_chat_photo',
      'group_chat_created',
      'supergroup_chat_created',
      'channel_chat_created',
      'migrate_to_chat_id',
      'pinned_message',
      'reply_markup',
    ];
  }

  makeContent(output) {
    // 開発メモ：ここで ContentService.createTextOutput() を使うと、HTTP 302 Moved 応答になってしまうことにより、Telegram側がエラーと判定して、リトライを繰り返してしまうので注意
    return HtmlService.createTemplateFromFile('start').evaluate();
  }

  getMessageDateTime(elm) {
    const dtype = elm === 'edit_date' ? elm : 'date';
    const cx = getGlobalContexts();
    const mes = this.getMessageData('enable_edited');
    const utime = cx.utils.deepRetrieve(mes, dtype);
    return new Date(parseInt(Number(utime), 10) * 1000);
  }

  getMessageData(flag) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const incoming = cx.incoming;
    const mh = u.deepRetrieve(incoming, 'message');
    const cache_key = 'message_data_' + String(flag);
    let message;
    let tmp;
    if (u.hasProperty(cx, cache_key)) {
      return cx[cache_key];
    }
    if (mh) {
      message = mh;
    } else if (flag === 'enable_edited') {
      message = u.deepRetrieve(incoming, 'edited_message');
    }
    if (u.hasProperty(incoming, 'callback_query')) {
      tmp = u.deepRetrieve(incoming.callback_query, 'message');
      tmp.from = u.deepRetrieve(incoming.callback_query, 'from');
      tmp.text = u.deepRetrieve(incoming.callback_query, 'data');
      message = tmp;
    }
    // Logger.log(message);
    cx[cache_key] = message;
    return message;
  }

  isEditedMessage() {
    const cx = getGlobalContexts();
    return cx.utils.hasProperty(cx.incoming, 'edited_message');
  }

  getChatTitle() {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const mes = this.getMessageData('enable_edited');
    const ctype = u.deepRetrieve(mes, 'chat.type');
    let title = '';
    if (ctype === 'private') {
      title = this.getUserFullname();
    } else {
      title = u.deepRetrieve(mes, 'chat.title');
    }
    return title;
  }

  getUserFullname() {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const mes = this.getMessageData('enable_edited');
    const username = u.deepRetrieve(mes, 'from.username');
    const fname = u.deepRetrieve(mes, 'from.first_name');
    const lname = u.deepRetrieve(mes, 'from.last_name');
    let name = fname;
    if (typeof name === 'string' && typeof lname === 'string') {
      name = name + ' ' + lname;
    }
    if (typeof name === 'string' && typeof username === 'string') {
      return name + ' (@' + username + ')';
    }
    return String(name);
  }

  getChatFromConfig() {
    const cx = getGlobalContexts();
    const chats = {};
    const id2name = {};
    const config = cx.model.getSettings();
    Object.keys(config.archiver).forEach((key) => {
      let gid = 0;
      let prop = '';
      const val = config.archiver[key];
      if (key.indexOf('group_chat_id_') === 0) {
        gid = key.substring(14);
        prop = 'chat_id';
      }

      if (key.indexOf('sheet_name_') === 0) {
        gid = key.substring(11);
        prop = 'sheet_name';
      }

      if (gid && !cx.utils.hasProperty(chats, gid)) {
        chats[gid] = {};
      }
      if (gid && val !== 'undefined') {
        chats[gid][prop] = val;
      }
    });
    // Logger.log(['getChatFromConfig ', chats]);

    Object.keys(chats).forEach((gid) => {
      const id = chats[gid].chat_id;
      const name = chats[gid].sheet_name;
      id2name[id] = name;
    });
    return id2name;
  }

  getArchiverSheetInfo() {
    // 保存先シートの決定ロジック
    // 入力 chat_id chat_type
    // 設定 chat_id sheet_name
    // 結果 sheet_name、PrivateLog、出力先なし
    //
    // 以下、判定順序
    // 1. 入力chat_typeがprivate→PrivateLog
    // 2. 入力のchat_idが設定にない→PrivateLog
    // 3. 入力のchat_idが設定に一致、sheet_name設定あり→sheet_name決定
    // 4. 入力のchat_idが設定に一致、sheet_name設定なし→出力先なし
    // 5. 上記決定後：出力先のシートが存在しない→出力先なし
    // ======================================================
    const cx = getGlobalContexts();
    const u = cx.utils;
    const mes = this.getMessageData('enable_edited');
    let ss_id = cx.spreadsheet_id;
    let ss_name;
    const chat_ids = this.getChatFromConfig();
    const chat_type = u.deepRetrieve(mes, 'chat.type');
    const chat_id = u.deepRetrieve(mes, 'chat.id');
    const config = cx.model.getSettings();

    // Logger.log(['getSheet before ', chat_id, chat_type, ss_name, chat_ids]);
    if (chat_type === 'private') {
      ss_name = config.archiver.private_log_sheet_name;
    } else if (u.hasProperty(chat_ids, chat_id)) {
      ss_name = chat_ids[chat_id];
    } else {
      ss_name = config.archiver.private_log_sheet_name;
    }

    // 別ファイルに書き出す設定に対応
    if (ss_name.indexOf('@@') !== -1) {
      const a = ss_name.split('@@', 2);
      ss_name = a[0];
      ss_id = a[1];
    }

    // Logger.log(['getSheet after ', chat_id, chat_type, ss_name]);

    if (typeof ss_name === 'string' && ss_name !== '') {
      return { sheet_id: ss_id, sheet_name: ss_name };
    }
    return {};
  }

  saveLocation(data, latlng, username) {
    const cx = getGlobalContexts();
    const config = cx.model.getSettings();
    const u = cx.utils;
    const dtf = cx.utils.deepRetrieve(config, 'misc.DateTime_format');
    const sheet = cx.model.getSheet('locations_log');
    let uname = username;
    if (!uname) {
      uname = u.deepRetrieve(data, 'chat.username');
    }
    // datetime	chat_id	message_id	username	lat	lng	edited?
    const row = [
      this.formatDateTime(undefined, dtf),
      u.deepRetrieve(data, 'chat.id'),
      u.deepRetrieve(data, 'message_id'),
      uname,
      u.deepRetrieve(latlng, 'latitude'),
      u.deepRetrieve(latlng, 'longitude'),
      this.isEditedMessage() ? 'edited' : '',
    ];
    if (u.hasProperty(sheet, 'appendRow')) {
      sheet.appendRow(row);
    }
  }

  loadLocationContents() {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const ldata = cx.model.loadSheetContents('locations_log', 0, [
      'datetime',
      'chat_id',
      'message_id',
      'username',
      'lat',
      'lng',
      'edited',
    ]);
    return ldata;
  }

  loadLocation(username) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const ldata = this.loadLocationContents();
    const last = {};
    let dt;
    let x;
    u.each(ldata, (pk, lx) => {
      dt = new Date(lx.datetime).getTime();
      x = lx;
      x.dt = dt;
      if ((!u.hasProperty(last, lx.username) || last[lx.username].dt < dt) && lx.username !== '') {
        last[lx.username] = x;
      }
    });
    if (u.hasProperty(last, username)) {
      return last[username];
    }
    return last;
  }

  getUserWaypoints(username) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const ldata = this.loadLocationContents();
    const way = {};
    let dt;
    let x;
    u.each(ldata, (pk, lx) => {
      dt = new Date(lx.datetime).getTime();
      x = [lx.lat, lx.lng];
      if (lx.username === username) {
        way[dt] = x;
      }
    });
    return Object.keys(way)
      .sort()
      .map((t) => {
        return way[t];
      });
  }

  formatBody(message = {}) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    let contents = '';

    // forward [=name] text
    if (u.hasProperty(message, 'forward_from')) {
      contents = '[=' + message.forward_from.first_name + ']' + contents;
    }

    // reply [@name text...] text
    if (u.hasProperty(message, 'reply_to_message')) {
      const rep = u.deepRetrieve(message, 'reply_to_message.text');
      contents = rep.substring(0, 9) + '...] ' + contents;
      contents = '[@' + message.reply_to_message.from.first_name + ' ' + contents;
    }

    if (u.hasProperty(message, 'caption')) {
      contents = message.caption + contents;
    }

    // file [mime_type]
    if (u.hasProperty(message, 'document')) {
      contents = '[' + message.document.mime_type + ']' + contents;
    }

    // photo, audio, video, voice
    if (u.hasProperty(message, 'photo')) {
      contents = '[photo]' + contents;
    }
    if (u.hasProperty(message, 'animation')) {
      contents = `[animation] ${message.animation.duration}sec. ${contents}`;
    }
    if (u.hasProperty(message, 'video')) {
      contents = `[video] ${message.video.duration}sec. ${contents}`;
    }
    if (u.hasProperty(message, 'audio')) {
      contents = `[audio] ${message.audio.duration}sec. ${contents}`;
    }
    if (u.hasProperty(message, 'voice')) {
      contents = `[voice] ${message.voice.duration}sec. ${contents}`;
    }
    if (u.hasProperty(message, 'VideoNote')) {
      contents = `[video message] ${message.VideoNote.duration}sec. ${contents}`;
    }
    if (u.hasProperty(message, 'poll')) {
      contents = '[poll]' + contents;
    }
    if (u.hasProperty(message, 'dice')) {
      contents = `[dice] [${message.dice.value}] ${contents}`;
    }

    // sticker
    if (u.hasProperty(message, 'sticker')) {
      contents = '[ ' + message.sticker.emoji + ' ]' + contents;
    }

    // contact
    if (u.hasProperty(message, 'contact')) {
      contents = '[contact] ' + message.contact.first_name + ' ' + contents;
    }

    // location (venue)
    if (u.hasProperty(message, 'venue')) {
      contents = '[venue] ' + message.venue.title + ' ' + message.venue.address + ' ' + contents;
    } else if (u.hasProperty(message, 'location')) {
      contents = message.location.latitude + ',' + message.location.longitude + '&z=17 ' + contents;
      contents = '[location] https://maps.google.com/maps?q=loc:' + contents;
    }

    // system
    if (u.hasProperty(message, 'new_chat_members')) {
      const names = message.new_chat_members
        .map((t) => {
          return t.first_name;
        })
        .join(' ');
      contents = '[invite] ' + names + ' ' + contents;
    }
    if (u.hasProperty(message, 'left_chat_member')) {
      contents = '[left] ' + message.left_chat_member.first_name + ' ' + contents;
    }
    if (u.hasProperty(message, 'new_chat_photo')) {
      contents = '[new_chat_photo]' + contents;
    }
    if (u.hasProperty(message, 'delete_chat_photo')) {
      contents = '[delete_chat_photo]' + contents;
    }
    if (u.hasProperty(message, 'new_chat_title')) {
      contents = `[new_chat_title] [${message.new_chat_title}] ${contents}`;
    }
    if (u.hasProperty(message, 'migrate_to_chat_id')) {
      contents = `[migrate_to_chat_id] [${message.migrate_to_chat_id}] ${contents}`;
    }
    if (u.hasProperty(message, 'migrate_from_chat_id')) {
      contents = `[migrate_from_chat_id] [${message.migrate_from_chat_id}] ${contents}`;
    }
    if (u.hasProperty(message, 'pinned_message')) {
      contents = '[pinned] ' + message.pinned_message.text + ' ' + contents;
    }
    if (u.hasProperty(message, 'edit_date')) {
      contents = '[edit]' + contents;
    }

    // simple message
    if (u.hasProperty(message, 'text')) {
      contents += message.text;
    }

    return contents;
  }

  replyMessage(param) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const config = cx.model.getSettings();
    const text = cx.utils.replaceCharactorEntity4TgHtml(String(param));
    const mes = this.getMessageData('enable_edited');
    const chat_id = u.deepRetrieve(mes, 'chat.id');
    const reply_to_message_id = u.deepRetrieve(mes, 'message_id');
    if (chat_id && reply_to_message_id) {
      return cx.tg.sendToTelegram('sendMessage', {
        chat_id,
        text,
        reply_to_message_id,
        method: 'sendMessage',
        disable_web_page_preview: config.telegram.disable_web_page_preview,
        parse_mode: config.telegram.parse_mode,
      });
    }
    return this.sendToAdmin(text);
  }

  sendToAdmin(param) {
    const cx = getGlobalContexts();
    const config = cx.model.getSettings();
    return cx.tg.sendTgMessage(config.telegram.chat_id_admin, cx.utils.Any2Json(param));
  }

  describeAboutMyBot() {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const config = cx.model.getSettings();
    const mes = this.getMessageData('enable_edited');
    const cid = u.deepRetrieve(mes, 'chat.id') || '0';
    const mtext = u.deepRetrieve(mes, 'text') || '';
    const ipr = this.isPrimary ? 'is Primary' : 'not Primary';

    if (mtext.indexOf('/desc_bot') !== 0) {
      return '';
    }

    const chat_info = cx.tg.sendToTelegram('getChat', { chat_id: cid });
    const bot_info = cx.tg.sendToTelegram('getMe', {});
    const webhook_info = cx.tg.sendToTelegram('getWebhookInfo', {});

    const for_admin_text = [chat_info, bot_info, webhook_info]
      .map((json) => {
        const data = JSON.parse(json);
        let buf = '';
        u.each(data.result, (k, v) => {
          buf = `${buf}${k} => ${v}\n`;
          if (k === 'last_error_date') {
            buf = `${buf}👉${String(new Date(parseInt(Number(v), 10) * 1000))}\n`;
          }
        });
        return buf;
      })
      .join('\n');

    if (String(cid) === String(config.telegram.chat_id_admin)) {
      this.sendToAdmin(
        `${for_admin_text}\ntarget_api: ${this.target_api}, ${ipr}\n${cx.mgr.showHandlersInfo()}`
      );
    } else if (Number(cid) !== 0) {
      cx.tg.sendTgMessage(cid, `${this.VENDER_ID}: ${chat_info}`);
    }
    return '';
  }

  getMessageFileId() {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const mes = this.getMessageData('enable_edited');
    const photo_size = u.deepRetrieve(mes, 'photo');
    if (Array.isArray(photo_size)) {
      photo_size.sort((a, b) => {
        return b.width - a.width;
      });
      return photo_size[0].file_id;
    }
    return (
      u.deepRetrieve(mes, 'animation.file_id') ||
      u.deepRetrieve(mes, 'document.file_id') ||
      u.deepRetrieve(mes, 'video.file_id') ||
      u.deepRetrieve(mes, 'audio.file_id') ||
      u.deepRetrieve(mes, 'voice.file_id') ||
      u.deepRetrieve(mes, 'video_note.file_id')
    );
  }

  getFileBlob(file_id) {
    const cx = getGlobalContexts();
    const fid = file_id || this.getMessageFileId();
    if (!fid) {
      return undefined;
    }

    const file_info = cx.tg.sendToTelegram('getFile', { file_id: fid });
    const file_path = cx.utils.deepRetrieve(JSON.parse(file_info), 'result.file_path');
    if (!file_path) {
      return undefined;
    }
    const config = cx.model.getSettings();
    const url = `${config.telegram.file_endpoint_prefix}${config.telegram.telegram_token}/${file_path}`;
    const response = UrlFetchApp.fetch(url);
    Logger.log(response.getAllHeaders());
    return response.getBlob();
  }

  postProcess() {
    // const cx = getGlobalContexts();
    return '';
  }

  processForLog(ignore) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const config = cx.model.getSettings();
    const mes = this.getMessageData('enable_edited');
    const mtext = u.deepRetrieve(mes, 'text') || '';
    const body = cx.bot.formatBody(mes) || mtext;
    // eslint-disable-next-line no-control-regex
    const regexp = new RegExp('[\r\n]', 'g');
    const row = [
      config.datetime,
      u.deepRetrieve(cx.incoming, 'update_id'),
      u.deepRetrieve(mes, 'chat.id'),
      this.getChatTitle(),
      u.deepRetrieve(mes, 'message_id'),
      u.deepRetrieve(mes, 'from.username'),
      this.getUserFullname(),
      body,
      cx.requestContents.replace(regexp, ' '),
    ];
    const flag = u.isIgnorePattern(mtext, config.archiver.IgnorePattern);
    if (!flag) {
      return row;
    }
    return [];
  }

  // callback function to handle a single event
  handleEvent(data) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const mes = this.getMessageData('enable_edited');

    // handle message type separately
    Promise.all(
      this.valid_handler_type.map(async (type) => {
        if (type !== 'any' && u.hasProperty(mes, type)) {
          cx.mgr.dispatchEvent(type);
        }
      })
    ).catch((err) => {
      throw new Error(err);
    });

    if (u.hasProperty(data, 'callback_query')) {
      try {
        cx.mgr.dispatchEvent('callback_query');
      } catch (err) {
        throw new Error(err);
      }
    }

    // 種類を区別しないハンドラを呼び出す(種別ハンドラがあっても)
    try {
      cx.mgr.dispatchEvent('any');
    } catch (err) {
      throw new Error(err);
    }

    return `done`;
  }

  myDispatch(data) {
    const cx = getGlobalContexts();

    if (cx.is_ignore) {
      throw new Error('403');
    }

    // single event in each request
    try {
      this.handleEvent(data);
    } catch (err) {
      throw new Error(err);
    }
    this.ok();
  }
}

/**
 * create TelgramBot instance
 * @param {Object} option
 * @return {TelegramBot} Instance
 */
function createTelegramBot(option) {
  return new TelegramBot(option);
}
