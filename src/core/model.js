/**
 * [Apple_bot]
 * model: business logic
 */
class AppleModel extends AbstractAppleModel {
  constructor(option) {
    super(option);
    this.line_users_heads = ['userId', 'displayName', 'pictureUrl', 'datetime', 'statusMessage'];
    this.line_groups_users_heads = ['key', 'userId', 'groupId', 'datetime'];
    this.tg_users_heads = ['chat_id', 'title', 'type', 'start_at', 'username', 'description'];
    this.users_master_heads = ['unit', 'no', 'codename', 'yomi', 'gplus', 'username', 'ag_tg'];
  }

  getUsers(type) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    let func;

    switch (type) {
      case 'chat_ids':
        func = this.loadTgUsersChatIds;
        break;
      case 'users':
        func = this.loadTgUsersContents;
        break;
      case 'master':
        func = this.loadUsersMaster;
        break;
      case 'line_users':
        func = this.loadLineUsersContents;
        break;
      case 'line_groups_users':
        func = this.loadLineGroupsUsersContents;
        break;
      default:
    }

    if (u.hasProperty(cx, type) && typeof cx[type] === 'object') {
      return cx[type];
    }
    if (typeof func === 'function') {
      cx[type] = func.call(this);
      return cx[type];
    }
    return {};
  }

  loadUsersMaster() {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const m_contents = this.loadSheetContents('users_master', 2, this.users_master_heads);
    const u_chat_ids = this.loadTgUsersChatIds();
    const db = {};
    u.each(m_contents, (pk, mx) => {
      db[mx.username] = mx;
      if (mx.username && u.hasProperty(u_chat_ids, mx.username)) {
        db[mx.username].chat_id = u_chat_ids[mx.username];
      }
    });
    return db;
  }

  loadTgUsersChatIds() {
    return this.loadSheetContents('users', 4, 0);
  }

  loadTgUsersContents() {
    return this.loadSheetContents('users', 0, this.tg_users_heads);
  }

  loadLineUsersContents() {
    return this.loadSheetContents('line_users', 0, this.line_users_heads);
  }

  loadLineGroupsUsersContents() {
    return this.loadSheetContents('line_groups_users', 0, this.line_groups_users_heads);
  }

  updateLineUsersSheet() {
    const users = this.getUsers('line_users');
    // getGlobalContexts().bot.sendToAdmin(['DEBUG updateLUS', users]);
    this.updateSheet('line_users', users, prof => {
      if (typeof prof === 'object') {
        return this.line_users_heads.map(col => {
          return prof[col];
        });
      }
      return this.line_users_heads;
    });
  }
}

/**
 * create AppleModel instance
 * @param {Object} option no use
 * @return AppleModel
 */
function createAppleModel(option) {
  return new AppleModel(option);
}
