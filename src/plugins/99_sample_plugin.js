(function (exports) {
  // =================================================================================
  // Start of plugin

  function onPluginCall(match) {
    const cx = getGlobalContexts();
  }

  function registerEvents() {
    const cx = getGlobalContexts();
    const manager = cx.mgr;
    manager.addEventListener('text', onPluginCall);
  }

  function setup() {
    return {
      name: 'sample',
      filename: '99_sample_plugin.js',
      description: 'This is sample plugin.',
      auther: '<optional>',
      help: '/sample - this is sample <optional>',
      isAvailable: false,
      isEnabled: false,
      isLoaded: false,
      registerEvents,
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
