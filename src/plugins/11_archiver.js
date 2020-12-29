/**
 * plugins: archiver
 */
(function(exports) {
  // =================================================================================
  // Start of plugin

  function archiver(params) {
    const cx = getGlobalContexts();
    // cx.bot.sendToAdmin(['DEBUG 11_archiver', params]);
    // cx.bot.describeAboutMyBot();
    let log_array = [];
    if (typeof params === 'object' && params !== null && Object.keys(params).length > 0) {
      log_array = cx.bot.processForLog(params);
    } else {
      log_array = cx.bot.processForLog();
    }
    const sheet = cx.model.getArchiverSheet();
    // cx.bot.sendToAdmin(['DEBUG 11_archiver', sheet, log_array]);
    cx.model.appendRowCarefully(sheet, log_array);
  }

  function registerEvents() {
    const cx = getGlobalContexts();
    const manager = cx.mgr;
    manager.addEventListener('any', archiver);
  }

  function setup() {
    return {
      name: 'archiver',
      filename: '11_archiver.js',
      description: 'I will archive all of chat messages.',
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
