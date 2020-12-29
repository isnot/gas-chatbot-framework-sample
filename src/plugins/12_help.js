(function(exports) {
  // =================================================================================
  // Start of plugin

  function help(params) {
    const cx = getGlobalContexts();
    const plugin_filenames = Object.keys(cx.plugins).sort();
    var helps = [];
    plugin_filenames.forEach(pfn => {
      const px = cx.plugins[pfn];
      // text = text + '[' + px.name + '] ' + px.description + '\n';
      if (px.isAvailable && px.isEnabled && px.help !== '') {
        helps.push(px.help);
      }
    });
    helps = helps.sort();

    Logger.log(helps);
    cx.line.replyMessage(params.replyToken, helps.join('\n'));
  }

  function registerEvents() {
    const cx = getGlobalContexts();
    const manager = cx.mgr;
    manager.addEventListener('text', help);
  }

  function setup() {
    return {
      name: 'help',
      filename: '12_help.js',
      description: 'I respond you help message',
      auther: 'isnot',
      help: '/help - このメッセージを表示する',
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
