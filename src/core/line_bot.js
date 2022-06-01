/**
 * [Apple_bot]
 * Bot Commands and behavier.
 * functions that depend on global contexts.
 */
class LineBot extends AbstractAppleBot {
  constructor(config) {
    super();
    this.baseUrl = config.baseUrl || 'https://api.line.me/v2';
    this.target_api = 'line';
    this.valid_handler_type = [
      'any', // 種類を区別しないハンドラ
      'follow', // 友達追加された (ブロック解除含む)
      'unfollow', // ブロックされた
      'join',
      'leave',
      'postback',
      'beacon',
      'text', // テキスト
      'image', // 画像
      'video', // 動画
      'audio', // 音声
      'file',
      'location', // 位置情報
      'sticker', // スタンプ
      'contact', // 連絡先?
      'profile',
      'buttons',
      'confirm',
      'carousel',
      'image carousel',
      'datetime',
      'imagemap',
      'bye',
      'error',
    ];
    this.botUserId = config.botUserId || '';
    this.destination = '';
    this.replyToken = '';
    this.user_profile = {};
    // 画像・動画・音声の自動取得 (default: off)
    this.autoContentsLoad = config.autoContentsLoad === undefined ? false : config.autoContentsLoad;
    // 署名の自動検証もできるようにしたいが、Google Apps Script ではリクエストヘッダの取得ができないため難しいかも
    // http://line.github.io/line-bot-api-doc/ja/api/callback/post.html#signagure-verification
  }

  isValidBotId() {
    if (!this.destination) {
      return false;
    }
    if (this.botUserId === '') {
      return true;
    }
    return String(this.destination) === String(this.botUserId);
  }

  findUserProfile(userId = '') {
    if (!userId) {
      return {};
    }
    const cx = getGlobalContexts();
    const u = cx.utils;
    const users = cx.model.getUsers('line_users');
    if (u.hasProperty(users, userId)) {
      return users[userId];
    }

    const profile = cx.line.getProfile(userId);
    cx.bot.sendToAdmin(['DEBUG req line gProf', profile.displayName]);
    const now_dt = this.getMessageDateTime(Date.now());
    users[userId] = {
      userId: profile.userId || '',
      displayName: profile.displayName || '',
      pictureUrl: u.deepRetrieve(profile, 'pictureUrl') || '',
      datetime: now_dt || '',
      statusMessage: u.deepRetrieve(profile, 'statusMessage') || '',
    };
    return users[userId];
  }

  getArchiverSheetInfo() {
    // 保存先シートの決定ロジック
    // 入力 source_id source_type
    // 設定 source_id sheet_name
    // 結果 sheet_name、PrivateLog、出力先なし
    //
    // 以下、判定順序
    // 1. 入力source_typeがuser→PrivateLog
    // 2. 入力のsource_idが設定にない→PrivateLog
    // 3. 入力のsource_idが設定に一致、sheet_name設定あり→sheet_name決定
    // 4. 入力のsource_idが設定に一致、sheet_name設定なし→出力先なし
    // 5. 上記決定後：出力先のシートが存在しない→出力先なし
    // ======================================================
    const cx = getGlobalContexts();
    const u = cx.utils;
    const config = cx.model.getSettings();
    let ss_id = cx.spreadsheet_id;
    let ss_name;

    // Logger.log(['getSheet before ', chat_id, chat_type, ss_name, chat_ids]);
    ss_name = 'line_logs';
    // config.archiver.private_log_sheet_name;

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

  // callback function to handle a single event
  handleEvent(event) {
    const cx = getGlobalContexts();
    const u = cx.utils;

    const replyToken = u.deepRetrieve(event, 'replyToken');
    if (typeof replyToken === 'string' && replyToken.match(/^(.)\1*$/)) {
      Logger.log('Test hook recieved: ' + JSON.stringify(event.message));
      return 'noop';
    }
    this.replyToken = replyToken;

    const isActive = u.deepRetrieve(event, 'mode') === 'active';
    const event_type = u.deepRetrieve(event, 'type');
    const message_type = u.deepRetrieve(event, 'message.type');
    const valid_message_type = new Set([
      'text', // テキスト
      'image', // 画像
      'video', // 動画
      'audio', // 音声
      'file',
      'location', // 位置情報
      'sticker', // スタンプ
    ]);
    const valid_operation_type = new Set([
      'follow', // 友達追加された (ブロック解除含む)
      'unfollow', // ブロックされた
      'join',
      'leave',
      'postback',
      'beacon',
    ]);

    // cx.bot.sendToAdmin(['DEBUG hE', cx.mgr.showHandlersInfo()]);

    const params = { event };
    let pdata;
    switch (event_type) {
      case 'message': // メッセージ受信
        if (valid_message_type.has(message_type)) {
          try {
            cx.mgr.dispatchEvent(message_type, params);
          } catch (err) {
            throw new Error(err);
          }
        } else {
          // 対応するメッセージハンドラがない場合
          throw new Error(`Unknown message: ${JSON.stringify(event)}`);
        }
        break;

      // ユーザー操作
      case 'follow':
      case 'unfollow':
      case 'join':
      case 'leave':
      case 'beacon':
        try {
          cx.mgr.dispatchEvent(event_type, params);
        } catch (err) {
          throw new Error(err);
        }
        break;

      case 'postback':
        pdata = u.deepRetrieve(event, 'postback.data');
        if (pdata === 'DATE' || pdata === 'TIME' || pdata === 'DATETIME') {
          pdata += `(${JSON.stringify(event.postback.params)})`;
        }
        params.postback = pdata;
        try {
          cx.mgr.dispatchEvent('postback', params);
        } catch (err) {
          throw new Error(err);
        }
        break;

      default:
        if (cx.mgr.isValidHandlerType(event_type)) {
          try {
            cx.mgr.dispatchEvent(event_type, params);
          } catch (err) {
            throw new Error(err);
          }
        } else {
          // 対応するハンドラがない場合
          throw new Error(`Unknown event: ${JSON.stringify(event)}`);
        }
    }

    // 種類を区別しないハンドラを呼び出す (種別ハンドラがあっても)
    // this.autoContentsLoad ? this.getMessageContent(msg.id) : null,
    try {
      cx.mgr.dispatchEvent('any', params);
    } catch (err) {
      throw new Error(err);
    }

    return `done ${String(event_type)} ${String(message_type)} ${String(pdata)}`;
  }

  myDispatch(data) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    if (data.destination) {
      this.destination = data.destination;
      Logger.log('Destination User ID: ' + data.destination);
    }

    // events should be an array of events
    if (!Array.isArray(data.events) || data.events.length < 1) {
      throw new Error('miss events');
    }

    this.user_profile = this.findUserProfile(u.deepRetrieve(data.events[0], 'source.userId'));

    // handle events separately
    Promise.all(
      data.events.map(async (ee) => {
        const res = await this.handleEvent(ee);
        // cx.bot.sendToAdmin(['DEBUG mD', res]);
      })
    ).catch((err) => {
      throw new Error(err);
    });
  }

  getMessageDateTime(timestamp) {
    const cx = getGlobalContexts();
    const config = cx.model.getSettings();
    const dtf = cx.utils.deepRetrieve(config, 'misc.DateTime_format');
    return this.formatDateTime(parseInt(Number(timestamp), 10), dtf);
  }

  getSourceId(source) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const st = u.deepRetrieve(source, 'type');
    if (st === 'user') {
      return u.deepRetrieve(source, 'userId');
    }
    if (st === 'room') {
      return u.deepRetrieve(source, 'roomId');
    }
    if (st === 'group') {
      return u.deepRetrieve(source, 'groupId');
    }
    return st || 'unknown';
  }

  getActionType(event) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const et = u.deepRetrieve(event, 'type');
    if (et === 'message') {
      return u.deepRetrieve(event, 'message.type');
    }
    return et;
  }

  formatBody(action, event) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    if (action === 'text') {
      return u.deepRetrieve(event, 'message.text');
    }
    if (action === 'location') {
      return '[location] ' + String(u.deepRetrieve(event, 'message.address'));
    }
    if (action === 'file') {
      return '[file] ' + String(u.deepRetrieve(event, 'message.fileName'));
    }
    const body = `[${action}]`;
    const mtext = u.deepRetrieve(event, 'message.text');
    if (mtext) {
      return `${body} ${String(mtext)}`;
    }
    return body;
  }

  sendToAdmin(param) {
    const cx = getGlobalContexts();
    const config = cx.model.getSettings();
    return cx.line.pushMessage(config.line.AdminGroupId, { type: 'text', text: cx.utils.Any2Json(param) });
  }

  replyMessage(param) {
    const cx = getGlobalContexts();
    return cx.line.replyMessage(this.replyToken, { type: 'text', text: String(param) });
  }

  describeAboutMyBot() {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const event = cx.incoming.events[0];
    const text = u.deepRetrieve(event, 'message.text') || '';

    if (text.indexOf('desc_bot') === -1) {
      return '';
    }

    const config = cx.model.getSettings();
    const source = u.deepRetrieve(event, 'source') || {};
    const source_type = u.deepRetrieve(source, 'type') || '';
    const uid = u.deepRetrieve(source, 'userId') || '';
    const displayName = this.findUserProfile(uid).displayName || '';
    const source_id = this.getSourceId(source) || uid;
    const ipr = this.isPrimary ? 'is Primary' : 'not Primary';
    const source_data = `${source_type}/${source_id} userId/${uid},${displayName}`;
    if (String(source_id) === String(config.line.AdminGroupId)) {
      this.sendToAdmin(`${source_data}\ntarget_api: ${this.target_api}, ${ipr} ${cx.mgr.showHandlersInfo()}`);
    } else if (this.replyToken) {
      this.replyMessage(`${this.VENDER_ID}: ${source_data}`);
    }
    return '';
  }

  getFileBlob(midx = 0) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const events = u.deepRetrieve(cx, 'incoming.events');
    if (!Array.isArray(events)) {
      return undefined;
    }
    const message_type_media = ['image', 'video', 'audio', 'file'];
    const mids = events.filter((item) => {
      const mtype = u.deepRetrieve(item, 'message.type');
      if (message_type_media.indexOf(mtype) === -1) {
        return false;
      }
      return true;
    });
    if (mids.length < 1) {
      return undefined;
    }
    return cx.line.getMessageContent(mids[midx].message.id);
  }

  postProcess() {
    const cx = getGlobalContexts();
    cx.model.updateLineUsersSheet();
    return '';
  }

  processForLog(params) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const config = cx.model.getSettings();
    const event = u.deepRetrieve(params, 'event') || {};
    const source = u.deepRetrieve(event, 'source') || {};
    const dt = this.getMessageDateTime(u.deepRetrieve(event, 'timestamp')) || '';
    const source_type = u.deepRetrieve(source, 'type') || '';
    const uid = u.deepRetrieve(source, 'userId') || '';
    const displayName = this.findUserProfile(uid).displayName || '';
    const source_id = this.getSourceId(source) || uid;
    const action = this.getActionType(event) || '';
    const body = this.formatBody(action, event) || '';
    // eslint-disable-next-line no-control-regex
    const regexp = new RegExp('[\r\n]', 'g');
    const json = JSON.stringify(params).replace(regexp, ' ');
    return [config.datetime, dt, source_type, source_id, uid, displayName, action, body, json];
  }
}

/**
 * LineBot インスタンスの作成
 *
 * @param {assoc} config
 * @return {LineBot} Instance
 */
function createLineBot(config) {
  return new LineBot(config.line);
}
