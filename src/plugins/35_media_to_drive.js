(function(exports) {
  // =================================================================================
  // Start of plugin

  function mediaToDrive(params) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const media_blob = cx.bot.getFileBlob();
    if (media_blob) {
      const name = cx.bot.formatDateTime(undefined, 'yyyyMMdd_HHmmss') || '';
      const original_name = media_blob.getName() || '';
      media_blob.setName(`${cx.bot.target_api}_${name}_${original_name}`);
      const folder = DriveApp.getFoldersByName('images_from_chat').next();
      const url = folder.createFile(media_blob).getUrl();
      cx.bot.replyMessage(`${cx.bot.target_api}_${name}_${original_name} ${String(url)}`);
    }
  }

  function registerEvents() {
    const cx = getGlobalContexts();
    const manager = cx.mgr;
    if (cx.bot.target_api === 'tg') {
      manager.addEventListener('photo', mediaToDrive);
      manager.addEventListener('document', mediaToDrive);
      manager.addEventListener('audio', mediaToDrive);
      manager.addEventListener('video', mediaToDrive);
      manager.addEventListener('animation', mediaToDrive);
      manager.addEventListener('voice', mediaToDrive);
      manager.addEventListener('video_note', mediaToDrive);
    }
    if (cx.bot.target_api === 'line') {
      manager.addEventListener('image', mediaToDrive);
      manager.addEventListener('file', mediaToDrive);
      manager.addEventListener('audio', mediaToDrive);
      manager.addEventListener('video', mediaToDrive);
    }
  }

  function setup() {
    return {
      name: 'media_to_drive',
      filename: '35_media_to_drive.js',
      description: 'media_to_drive',
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
