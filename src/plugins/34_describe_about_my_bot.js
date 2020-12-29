(function(exports) {
  // =================================================================================
  // Start of plugin

  function describeBot(params) {
    const cx = getGlobalContexts();
    cx.bot.describeAboutMyBot();
  }

  function registerEvents() {
    const cx = getGlobalContexts();
    const manager = cx.mgr;
    manager.addEventListener('text', describeBot);
  }

  function setup() {
    return {
      name: 'describe_bot',
      filename: '34_describe_about_my_bot.js',
      description: 'describe_about_my_bot.',
      auther: 'isnot',
      help: '/desc_bot - describe about my bot',
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
