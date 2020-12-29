/**
 * [Apple_bot]
 * manager: event handler / message handler
 */
class AppleManager {
  constructor(option) {
    this.VENDER_ID = 'Apple';
    this.option = option;
    this.handler_types = [];
    this.handlers = new Map();
    this.proccess_state = '';
  }

  setValidHandlerTypes(vType = []) {
    vType.forEach(type => {
      this.handler_types.push(type);
      this.handlers.set(type, new Set());
    });
  }

  isValidHandlerType(type) {
    return this.handlers.has(type);
  }

  createCustomHandler(type) {
    this.handlers.set(type, new Set());
  }

  recallHandlerTypes() {
    return Array.from(this.handlers.keys());
  }

  removeEventListener(type) {
    if (!this.isValidHandlerType(type)) {
      throw new Error('unknown type of handler');
    }
    const th = this.handlers.get(type);
    if (th.size > 0) {
      th.clear();
    }
  }

  removeAllEventListeners() {
    this.handlers.clear();
  }

  showHandlersInfo() {
    let text = '### showHandlersInfo:\n';
    this.recallHandlerTypes().forEach(tk => {
      const pset = this.handlers.get(tk);
      text += `${tk} => (${pset.size})`;
      Array.from(pset.values()).forEach(pfunc => {
        text += ` ${pfunc.name}`;
      });
      text += '\n';
    });
    return text;
  }

  // register Handler
  addEventListener(type, func) {
    if (!this.isValidHandlerType(type)) {
      throw new Error(`unknown type of handler: ${type}`);
    }
    this.handlers.get(type).add(func);
  }

  dispatchEvent(type, params = {}) {
    // getGlobalContexts().bot.sendToAdmin([`DEBUG rH ${type}`, params]);
    if (!this.isValidHandlerType(type)) {
      throw new Error(`invalid handler type: ${type}`);
    }
    const hx = this.handlers.get(type);
    if (hx.size > 0) {
      hx.forEach(func => {
        func.call(undefined, params);
      });
    }
  }
}

/**
 * create AppleManager instance
 * @param {Object} option no use
 * @return AppleManager
 */
function createAppleManager(option) {
  return new AppleManager(option);
}
