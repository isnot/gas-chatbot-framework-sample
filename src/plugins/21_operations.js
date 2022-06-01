(function (exports) {
  // =================================================================================
  // Start of plugin

  function test_func(params) {
    const cx = getGlobalContexts();
    // 友だち追加された
    // ブロックされた
    const prof = cx.line.getUserProfile();
    if (prof) {
      cx.line.pushMessage(prof[0].mid, 'こんにちわ、' + prof[0].displayName + ' さん！');
    }
  }

  function registerEvents() {
    const cx = getGlobalContexts();
    const manager = cx.mgr;
    manager.addEventListener('follow', test_func);
    manager.addEventListener('unfollow', test_func);
    manager.addEventListener('join', test_func);
    manager.addEventListener('leave', test_func);
    manager.addEventListener('beacon', test_func);
  }

  function setup() {
    return {
      name: 'operations',
      filename: '21_operations.js',
      description: 'operations',
      auther: 'isnot',
      help: '',
      isAvailable: true,
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
