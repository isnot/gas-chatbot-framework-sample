(function (exports) {
  // =================================================================================
  // Start of plugin [security]

  function security() {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const mes = '';
    const users = {
      groups: [],
      users: [],
      ignore: [],
    };
    const u_sheet = cx.model.getSheet('users');
    let ignore = true;
    if (ignore) {
      return; // DEBUG
    }
    // ユーザー一覧を取得
    let u_values = u_sheet.getSheetValues(1, 1, u_sheet.getLastRow(), u_sheet.getLastColumn());

    u_values.forEach((cols) => {
      // keys of users: chat_id title type start_at
      users[utype][cols[0]] = { chat_id: cols[0], title: cols[1] };
    });
    u_values = [];

    // 発言したユーザー,チャット・グループを調べる
    //   拒否フラグ確認->未登録なら、ユーザー一覧に候補を追加する
    if (u.hasProperty(users.users, fid) && ctype === 'private') {
      ignore = false;
    }
    if (u.hasProperty(users.groups, chat_id) && ctype === 'supergroup') {
      // 許可するグループにいる場合には、ユーザー単位の拒否設定を上書きすることに注意
      ignore = false;
    }

    if (fid && !u.hasProperty(users.users, fid) && !u.hasProperty(users.ignore, fid)) {
      u_sheet.appendRow([
        fid,
        cx.tgBot.getUserFullname(),
        'new_user',
        cx.tgBot.getMessageDateTime(),
        username,
      ]);
    }

    if (ignore) {
      u_sheet.appendRow([chat_id, cx.tgBot.getChatTitle(), 'unknown', cx.tgBot.getMessageDateTime()]);
    }

    //   未登録なuserは、警告

    // cxにフラグをセットする
    cx.is_ignore = ignore;
  }

  function registerEvents() {
    const cx = getGlobalContexts();
    const manager = cx.mgr;
    // manager.addEventListener('any', security);
  }

  function setup() {
    return {
      name: 'security',
      filename: '00_security_of_bot.js',
      description: 'enforce bot security.',
      auther: 'isnot',
      help: '',
      isAvailable: false,
      isEnabled: false,
      isLoaded: false,
      type: 'special',
      security: security,
      registerEvents: () => {},
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
      plugins: {},
    };
  }
  const p = setup();
  cx.plugins[p.filename] = p;
  // =================================================================================
})(this);
