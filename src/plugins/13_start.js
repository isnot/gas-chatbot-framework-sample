/**
 * plugins: start
 */
(function(exports) {
  // =================================================================================
  // Start of plugin

  function start(params) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const incoming = cx.incoming;
    // const u_sheet = cx.model.getSheet('users');
    var start_at = '';
    var type = '';
    var is_member = false;

    // ユーザー一覧を取得
    // keys of users:
    // u_sheet.appendRow([fid, user, type, cx.tgBot.getMessageDateTime()]);

    cx.line.replyMessage(params.replyToken, '[A-START] ようこそ！開始しました');
  }

  function registerEvents() {
    const cx = getGlobalContexts();
    const manager = cx.mgr;
    manager.addEventListener('follow', start);
  }

  function setup() {
    return {
      name: 'start',
      filename: '13_start.js',
      description: 'I will respond to start command and record datetime.',
      help: 'このBotの利用を開始する',
      isAvailable: true,
      isEnabled: false,
      isLoaded: false,
      registerEvents
    };
  }

  // End of plugin
  // =================================================================================
  try {
    if (typeof cx !== 'object' && cx === null) {
      throw new Error('no GlobalContexts');
    }
  } catch (e) {
    cx = {
      plugins: {}
    };
  }
  const p = setup();
  cx.plugins[p.filename] = p;
  // =================================================================================
})(this);
