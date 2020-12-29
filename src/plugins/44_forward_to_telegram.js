(function(exports) {
  // =================================================================================
  // Start of plugin

  function forwardToTelegram(params) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const config = cx.model.getSettings();
    const events = u.deepRetrieve(cx.incoming, 'events');
    const mtype = u.deepRetrieve(events[0], 'message.type');
    const body = cx.lineBot.formatBody(mtype, events[0]);
    const uid = u.deepRetrieve(events[0], 'source.userId');
    const sender_profile = cx.lineBot.findUserProfile(uid);
    const to_cid = config.telegram.chat_id_admin;
    if (to_cid && String(body) !== '') {
      cx.tg.sendTgMessage(to_cid, `[LINE:${sender_profile.displayName}] ${body}`);
    }
  }

  function registerEvents() {
    const cx = getGlobalContexts();
    const manager = cx.mgr;
    if (cx.bot.target_api === 'line') {
      manager.addEventListener('text', forwardToTelegram);
      manager.addEventListener('sticker', forwardToTelegram);
      manager.addEventListener('image', forwardToTelegram);
      manager.addEventListener('location', forwardToTelegram);
      manager.addEventListener('video', forwardToTelegram);
      manager.addEventListener('audio', forwardToTelegram);
    }
  }

  function setup() {
    return {
      name: 'forward_to_telegram',
      filename: '44_forward_to_telegram.js',
      description: 'forward_to_telegram',
      auther: 'isnot',
      help: '',
      isAvailable: true,
      isEnabled: true,
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
