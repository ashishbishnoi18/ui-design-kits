/*! NB UI Kit v1.0.0 | MIT License | github.com/ashishbishnoi18/nb-ui-kit */
/* --- nb-core.js --- */

/**
 * NB Core — Neo Brutalism UI Kit
 * Core initialization system, DOM helpers, and accessibility utilities.
 * @version 1.0.0
 */
;(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Namespace                                                          */
  /* ------------------------------------------------------------------ */

  var NB = global.NB || {};

  NB.version = '1.0.0';

  /** @type {Object.<string, function(HTMLElement): void>} */
  NB._registry = {};

  /** WeakSet that tracks already-initialized elements */
  var _initialized = new WeakSet();

  /** Counter for unique IDs */
  var _uidCounter = 0;

  /* ------------------------------------------------------------------ */
  /*  Component registration & initialisation                           */
  /* ------------------------------------------------------------------ */

  /**
   * Register a component initializer.
   * @param {string}   name   — component name (matches data-nb-<name>)
   * @param {function} initFn — called once per matching element
   */
  NB.register = function register(name, initFn) {
    if (typeof name !== 'string' || typeof initFn !== 'function') {
      throw new TypeError('NB.register(name: string, initFn: function)');
    }
    NB._registry[name] = initFn;
  };

  /**
   * Scan `root` for every `[data-nb-*]` attribute, match against
   * registered components, and call the init function on each element.
   * Skips elements that have already been initialized.
   * @param {Document|HTMLElement} [root=document]
   */
  NB.init = function init(root) {
    root = root || document;

    var names = Object.keys(NB._registry);
    if (!names.length) return;

    names.forEach(function (name) {
      _initByName(name, root);
    });
  };

  /**
   * Initialize only a specific registered component inside `root`.
   * @param {string}              name
   * @param {Document|HTMLElement} [root=document]
   */
  NB.initComponent = function initComponent(name, root) {
    root = root || document;
    if (!NB._registry[name]) {
      console.warn('NB: component "' + name + '" is not registered.');
      return;
    }
    _initByName(name, root);
  };

  /**
   * Internal — find elements matching a single component name and init them.
   */
  function _initByName(name, root) {
    var fn = NB._registry[name];
    if (!fn) return;

    var selector = '[data-nb-' + name + ']';
    var els = root.querySelectorAll
      ? root.querySelectorAll(selector)
      : [];

    // If root itself matches, include it
    if (root !== document && root.matches && root.matches(selector)) {
      _maybeInit(root, fn);
    }

    for (var i = 0; i < els.length; i++) {
      _maybeInit(els[i], fn);
    }
  }

  function _maybeInit(el, fn) {
    if (_initialized.has(el)) return;
    _initialized.add(el);
    try {
      fn(el);
    } catch (err) {
      console.error('NB: component init error', err);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  DOM query helpers                                                  */
  /* ------------------------------------------------------------------ */

  /**
   * Shortcut for querySelector.
   * @param {string}              selector
   * @param {Document|HTMLElement} [root=document]
   * @returns {HTMLElement|null}
   */
  NB.$ = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  /**
   * Shortcut for querySelectorAll (returns real Array).
   * @param {string}              selector
   * @param {Document|HTMLElement} [root=document]
   * @returns {HTMLElement[]}
   */
  NB.$$ = function (selector, root) {
    return Array.prototype.slice.call(
      (root || document).querySelectorAll(selector)
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Event helpers                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * addEventListener wrapper.
   * @param {HTMLElement} el
   * @param {string}      event
   * @param {function}    handler
   * @param {Object|boolean} [options]
   */
  NB.on = function (el, event, handler, options) {
    el.addEventListener(event, handler, options || false);
  };

  /**
   * removeEventListener wrapper.
   * @param {HTMLElement} el
   * @param {string}      event
   * @param {function}    handler
   */
  NB.off = function (el, event, handler) {
    el.removeEventListener(event, handler);
  };

  /**
   * Dispatch a CustomEvent on `el`.
   * @param {HTMLElement} el
   * @param {string}      eventName
   * @param {*}           [detail]
   */
  NB.emit = function (el, eventName, detail) {
    el.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        cancelable: true,
        detail: detail !== undefined ? detail : null,
      })
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Accessibility: focus trap                                          */
  /* ------------------------------------------------------------------ */

  var FOCUSABLE =
    'a[href], area[href], input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    'button:not([disabled]), iframe, object, embed, ' +
    '[tabindex]:not([tabindex="-1"]), [contenteditable]';

  /**
   * Trap keyboard focus inside `container`.
   * Returns a release function that removes the trap.
   * @param {HTMLElement} container
   * @returns {function} release
   */
  NB.trapFocus = function (container) {
    var previouslyFocused = document.activeElement;

    function getFocusable() {
      return NB.$$(FOCUSABLE, container).filter(function (el) {
        return el.offsetParent !== null; // visible
      });
    }

    function handleKeydown(e) {
      if (e.key !== 'Tab') return;

      var focusable = getFocusable();
      if (!focusable.length) {
        e.preventDefault();
        return;
      }

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    NB.on(container, 'keydown', handleKeydown);

    // Move focus into the container
    var targets = getFocusable();
    if (targets.length) {
      targets[0].focus();
    } else {
      container.setAttribute('tabindex', '-1');
      container.focus();
    }

    /** Release the focus trap and restore previous focus. */
    return function release() {
      NB.off(container, 'keydown', handleKeydown);
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    };
  };

  /* ------------------------------------------------------------------ */
  /*  Unique ID generator                                                */
  /* ------------------------------------------------------------------ */

  /**
   * Generate a unique ID string, useful for ARIA attributes.
   * @param {string} [prefix='nb']
   * @returns {string}
   */
  NB.uid = function (prefix) {
    _uidCounter += 1;
    return (prefix || 'nb') + '-' + _uidCounter;
  };

  /* ------------------------------------------------------------------ */
  /*  Auto-init on DOMContentLoaded                                      */
  /* ------------------------------------------------------------------ */

  function onReady() {
    NB.init(document);
    _observeMutations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    // DOM already ready (script loaded async / deferred)
    onReady();
  }

  /* ------------------------------------------------------------------ */
  /*  MutationObserver — auto-init dynamically added nodes               */
  /* ------------------------------------------------------------------ */

  function _observeMutations() {
    if (typeof MutationObserver === 'undefined') return;

    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          // Init the added subtree
          NB.init(node);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Expose                                                             */
  /* ------------------------------------------------------------------ */

  global.NB = NB;
})(typeof window !== 'undefined' ? window : this);


/* --- components/modal.js --- */

/**
 * NB Modal Component
 * Accessible modal dialogs with focus trapping and keyboard support.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** @type {Object.<string, function>} release functions keyed by modal id */
  var _traps = {};

  /** Stack of currently open modal ids */
  var _openStack = [];

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function getBackdrop(id) {
    var modal = document.getElementById(id);
    if (!modal) return null;
    // The backdrop is either the modal element itself or a parent with
    // [data-nb-modal-backdrop]
    if (modal.hasAttribute('data-nb-modal-backdrop')) return modal;
    var backdrop = modal.closest('[data-nb-modal-backdrop]');
    return backdrop || modal;
  }

  function getModal(id) {
    return document.getElementById(id);
  }

  /* ------------------------------------------------------------------ */
  /*  Open / Close                                                       */
  /* ------------------------------------------------------------------ */

  function open(id) {
    if (!id) return;
    id = id.replace(/^#/, '');

    var backdrop = getBackdrop(id);
    var modal = getModal(id);
    if (!backdrop || !modal) {
      console.warn('NB.modal: element "#' + id + '" not found.');
      return;
    }

    if (_openStack.indexOf(id) !== -1) return; // already open

    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');

    document.body.style.overflow = 'hidden';
    _openStack.push(id);

    // Trap focus
    _traps[id] = NB.trapFocus(modal);

    NB.emit(modal, 'nb:modal-open', { id: id });
  }

  function close(id) {
    if (!id) return;
    id = id.replace(/^#/, '');

    var backdrop = getBackdrop(id);
    var modal = getModal(id);

    var idx = _openStack.indexOf(id);
    if (idx === -1) return; // not open

    backdrop && backdrop.classList.remove('is-open');
    backdrop && backdrop.setAttribute('aria-hidden', 'true');
    modal && modal.removeAttribute('aria-modal');

    _openStack.splice(idx, 1);

    // Release focus trap
    if (_traps[id]) {
      _traps[id]();
      delete _traps[id];
    }

    // Restore body scroll only when no modals remain open
    if (_openStack.length === 0) {
      document.body.style.overflow = '';
    }

    modal && NB.emit(modal, 'nb:modal-close', { id: id });
  }

  function closeAll() {
    // Close in reverse order (LIFO)
    var stack = _openStack.slice();
    for (var i = stack.length - 1; i >= 0; i--) {
      close(stack[i]);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Keyboard handler (Escape)                                          */
  /* ------------------------------------------------------------------ */

  NB.on(document, 'keydown', function (e) {
    if (e.key === 'Escape' && _openStack.length) {
      e.preventDefault();
      close(_openStack[_openStack.length - 1]);
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Registration                                                       */
  /* ------------------------------------------------------------------ */

  NB.register('modal', function () {
    // We use event delegation on document instead of per-element init
  });

  // Delegate: trigger clicks
  NB.on(document, 'click', function (e) {
    // Open trigger
    var trigger = e.target.closest('[data-nb-modal]');
    if (trigger) {
      e.preventDefault();
      var targetId = trigger.getAttribute('data-nb-modal');
      open(targetId);
      return;
    }

    // Close button
    var closeBtn = e.target.closest('[data-nb-modal-close]');
    if (closeBtn) {
      e.preventDefault();
      // Find the closest open modal
      var modal = closeBtn.closest('[data-nb-modal-backdrop]');
      if (modal) {
        var id = modal.querySelector('[id]');
        if (id) {
          close(id.id);
        } else {
          close(modal.id);
        }
      }
      return;
    }

    // Backdrop click (click directly on backdrop, not its children)
    var backdrop = e.target.closest('[data-nb-modal-backdrop]');
    if (backdrop && e.target === backdrop) {
      // Find the modal id inside
      var innerModal = backdrop.querySelector('[id]');
      if (innerModal && backdrop.classList.contains('is-open')) {
        close(innerModal.id);
      } else if (backdrop.id && backdrop.classList.contains('is-open')) {
        close(backdrop.id);
      }
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  NB.modal = {
    open: open,
    close: close,
    closeAll: closeAll
  };

})(window.NB);


/* --- components/toast.js --- */

/**
 * NB Toast Component
 * Notification toasts with auto-dismiss, progress bars, and position support.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** Containers keyed by position */
  var _containers = {};

  var POSITIONS = [
    'top-right', 'top-left', 'top-center',
    'bottom-right', 'bottom-left', 'bottom-center'
  ];

  /* ------------------------------------------------------------------ */
  /*  Container management                                               */
  /* ------------------------------------------------------------------ */

  function getContainer(position) {
    if (_containers[position]) return _containers[position];

    var container = document.createElement('div');
    container.className = 'nb-toast-container nb-toast-container--' + position;
    container.setAttribute('data-nb-toast-container', position);
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);

    _containers[position] = container;
    return container;
  }

  /* ------------------------------------------------------------------ */
  /*  Format file size (reused later, but handy here for consistency)    */
  /* ------------------------------------------------------------------ */

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ------------------------------------------------------------------ */
  /*  Toast creation                                                     */
  /* ------------------------------------------------------------------ */

  function toast(options) {
    if (typeof options === 'string') {
      options = { message: options };
    }

    var message    = options.message || '';
    var type       = options.type || 'info';
    var title      = options.title || '';
    var duration   = options.duration !== undefined ? options.duration : 5000;
    var position   = options.position || 'top-right';
    var dismissible = options.dismissible !== undefined ? options.dismissible : true;

    if (POSITIONS.indexOf(position) === -1) {
      position = 'top-right';
    }

    var container = getContainer(position);

    // Build toast element
    var el = document.createElement('div');
    el.className = 'nb-toast nb-toast--' + type;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');

    var id = NB.uid('toast');
    el.id = id;

    // Inner HTML
    var html = '<div class="nb-toast__content">';
    if (title) {
      html += '<div class="nb-toast__title">' + escapeHtml(title) + '</div>';
    }
    html += '<div class="nb-toast__message">' + escapeHtml(message) + '</div>';
    html += '</div>';

    if (dismissible) {
      html += '<button class="nb-toast__close" data-nb-toast-close aria-label="Dismiss notification" type="button">&times;</button>';
    }

    if (duration > 0) {
      html += '<div class="nb-toast__progress"><div class="nb-toast__progress-bar" style="animation-duration:' + duration + 'ms"></div></div>';
    }

    el.innerHTML = html;

    // Append — bottom positions prepend so newest is at bottom
    if (position.indexOf('bottom') === 0) {
      container.appendChild(el);
    } else {
      container.appendChild(el);
    }

    // Force reflow then add active class for entrance animation
    void el.offsetHeight;
    el.classList.add('is-active');

    // Auto-remove timer
    var timer = null;

    function removeToast() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      el.classList.remove('is-active');
      el.classList.add('is-exiting');

      // Wait for exit animation
      var onEnd = function () {
        NB.off(el, 'animationend', onEnd);
        NB.off(el, 'transitionend', onEnd);
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
        NB.emit(document, 'nb:toast-dismissed', { id: id, type: type });
      };

      NB.on(el, 'animationend', onEnd);
      NB.on(el, 'transitionend', onEnd);

      // Fallback removal if no animation fires
      setTimeout(function () {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 500);
    }

    if (duration > 0) {
      timer = setTimeout(removeToast, duration);
    }

    // Pause timer on hover
    NB.on(el, 'mouseenter', function () {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      var bar = NB.$('.nb-toast__progress-bar', el);
      if (bar) bar.style.animationPlayState = 'paused';
    });

    NB.on(el, 'mouseleave', function () {
      if (duration > 0 && !el.classList.contains('is-exiting')) {
        var bar = NB.$('.nb-toast__progress-bar', el);
        if (bar) bar.style.animationPlayState = 'running';
        timer = setTimeout(removeToast, duration / 2);
      }
    });

    // Close button
    if (dismissible) {
      var closeBtn = NB.$('[data-nb-toast-close]', el);
      if (closeBtn) {
        NB.on(closeBtn, 'click', function (e) {
          e.preventDefault();
          removeToast();
        });
      }
    }

    NB.emit(document, 'nb:toast-shown', { id: id, type: type, message: message });

    return el;
  }

  /* ------------------------------------------------------------------ */
  /*  Shortcut methods                                                   */
  /* ------------------------------------------------------------------ */

  toast.success = function (message, opts) {
    return toast(Object.assign({ type: 'success', message: message }, opts || {}));
  };

  toast.danger = function (message, opts) {
    return toast(Object.assign({ type: 'danger', message: message }, opts || {}));
  };

  toast.warning = function (message, opts) {
    return toast(Object.assign({ type: 'warning', message: message }, opts || {}));
  };

  toast.info = function (message, opts) {
    return toast(Object.assign({ type: 'info', message: message }, opts || {}));
  };

  /* ------------------------------------------------------------------ */
  /*  Registration                                                       */
  /* ------------------------------------------------------------------ */

  NB.register('toast', function () {
    // Toast is imperative — no per-element init needed
  });

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  NB.toast = toast;

})(window.NB);


/* --- components/dropdown.js --- */

/**
 * NB Dropdown Component
 * Accessible dropdowns with keyboard navigation and click-outside closing.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** Track all active dropdowns for outside-click handling */
  var _active = [];

  /* ------------------------------------------------------------------ */
  /*  Init per dropdown                                                  */
  /* ------------------------------------------------------------------ */

  NB.register('dropdown', function (el) {
    var trigger = NB.$('[data-nb-dropdown-trigger]', el);
    if (!trigger) return;

    var persist = el.hasAttribute('data-nb-dropdown-persist');
    var menu = NB.$('.nb-dropdown__menu', el) ||
               NB.$('[role="menu"]', el) ||
               el.querySelector('ul') ||
               el.querySelector('.nb-dropdown__content');

    if (!menu) return;

    // ARIA setup
    var menuId = menu.id || NB.uid('dropdown-menu');
    menu.id = menuId;
    menu.setAttribute('role', 'menu');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', menuId);

    var items = function () {
      return NB.$$('[role="menuitem"], [data-nb-dropdown-item], li > a, li > button', menu).filter(function (item) {
        return item.offsetParent !== null; // visible only
      });
    };

    function open() {
      if (el.classList.contains('is-open')) return;
      // Close other dropdowns first
      closeAll();
      el.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      _active.push(el);

      // Set role on items
      items().forEach(function (item) {
        if (!item.getAttribute('role')) {
          item.setAttribute('role', 'menuitem');
        }
        item.setAttribute('tabindex', '-1');
      });

      NB.emit(el, 'nb:dropdown-open');
    }

    function close() {
      if (!el.classList.contains('is-open')) return;
      el.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');

      var idx = _active.indexOf(el);
      if (idx !== -1) _active.splice(idx, 1);

      trigger.focus();
      NB.emit(el, 'nb:dropdown-close');
    }

    function toggle() {
      if (el.classList.contains('is-open')) {
        close();
      } else {
        open();
      }
    }

    function focusItem(index) {
      var list = items();
      if (!list.length) return;
      if (index < 0) index = list.length - 1;
      if (index >= list.length) index = 0;
      list[index].focus();
    }

    function currentIndex() {
      var list = items();
      var active = document.activeElement;
      for (var i = 0; i < list.length; i++) {
        if (list[i] === active) return i;
      }
      return -1;
    }

    // Trigger click
    NB.on(trigger, 'click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    });

    // Keyboard on trigger
    NB.on(trigger, 'keydown', function (e) {
      switch (e.key) {
        case 'ArrowDown':
        case 'Down':
          e.preventDefault();
          open();
          focusItem(0);
          break;
        case 'ArrowUp':
        case 'Up':
          e.preventDefault();
          open();
          focusItem(-1);
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          toggle();
          if (el.classList.contains('is-open')) {
            focusItem(0);
          }
          break;
      }
    });

    // Keyboard inside menu
    NB.on(menu, 'keydown', function (e) {
      var idx = currentIndex();

      switch (e.key) {
        case 'ArrowDown':
        case 'Down':
          e.preventDefault();
          focusItem(idx + 1);
          break;
        case 'ArrowUp':
        case 'Up':
          e.preventDefault();
          focusItem(idx - 1);
          break;
        case 'Home':
          e.preventDefault();
          focusItem(0);
          break;
        case 'End':
          e.preventDefault();
          focusItem(items().length - 1);
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'Tab':
          close();
          break;
        case 'Enter':
        case ' ':
          // Let the event propagate to the item's click handler
          if (!persist) {
            // Delay close so click can register
            setTimeout(function () { close(); }, 0);
          }
          break;
      }
    });

    // Item click
    NB.on(menu, 'click', function (e) {
      var item = e.target.closest('[role="menuitem"], [data-nb-dropdown-item], li > a, li > button');
      if (item) {
        NB.emit(el, 'nb:dropdown-select', { item: item, value: item.textContent.trim() });
        if (!persist) {
          close();
        }
      }
    });

    // Store close function on element for closeAll
    el._nbDropdownClose = close;
  });

  /* ------------------------------------------------------------------ */
  /*  Close all dropdowns                                                */
  /* ------------------------------------------------------------------ */

  function closeAll() {
    var list = _active.slice();
    list.forEach(function (el) {
      if (el._nbDropdownClose) el._nbDropdownClose();
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Global listeners                                                   */
  /* ------------------------------------------------------------------ */

  // Click outside
  NB.on(document, 'click', function (e) {
    var list = _active.slice();
    list.forEach(function (el) {
      if (!el.contains(e.target) && el._nbDropdownClose) {
        el._nbDropdownClose();
      }
    });
  });

  // Escape key
  NB.on(document, 'keydown', function (e) {
    if (e.key === 'Escape' && _active.length) {
      closeAll();
    }
  });

})(window.NB);


/* --- components/tabs.js --- */

/**
 * NB Tabs Component
 * Accessible tabs with keyboard navigation and ARIA attributes.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('tabs', function (el) {
    var tabButtons = NB.$$('[data-nb-tab]', el);
    if (!tabButtons.length) return;

    // Find or create tablist wrapper
    var tablist = NB.$('[role="tablist"]', el);
    if (!tablist) {
      // Use the parent of the first tab button as tablist
      tablist = tabButtons[0].parentElement;
      tablist.setAttribute('role', 'tablist');
    }

    // Gather all panels
    var panels = {};
    var panelEls = NB.$$('[data-nb-tab-panel]', el);
    panelEls.forEach(function (panel) {
      var panelId = panel.getAttribute('data-nb-tab-panel');
      panels[panelId] = panel;
    });

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    tabButtons.forEach(function (tab) {
      var panelId = tab.getAttribute('data-nb-tab');
      var panel = panels[panelId];

      // Ensure IDs
      if (!tab.id) tab.id = NB.uid('tab');
      if (panel && !panel.id) panel.id = NB.uid('tabpanel');

      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel ? panel.id : '');

      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
      }

      // Initial state
      if (tab.classList.contains('is-active')) {
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');
        if (panel) {
          panel.classList.add('is-active');
          panel.removeAttribute('hidden');
        }
      } else {
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
        if (panel) {
          panel.classList.remove('is-active');
          panel.setAttribute('hidden', '');
        }
      }
    });

    // If no tab is initially active, activate the first one
    var hasActive = tabButtons.some(function (t) {
      return t.classList.contains('is-active');
    });
    if (!hasActive && tabButtons.length) {
      activate(tabButtons[0]);
    }

    /* ---------------------------------------------------------------- */
    /*  Activation                                                       */
    /* ---------------------------------------------------------------- */

    function activate(tab) {
      var panelId = tab.getAttribute('data-nb-tab');

      // Deactivate all
      tabButtons.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');

        var pId = t.getAttribute('data-nb-tab');
        var p = panels[pId];
        if (p) {
          p.classList.remove('is-active');
          p.setAttribute('hidden', '');
        }
      });

      // Activate selected
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      tab.focus();

      var panel = panels[panelId];
      if (panel) {
        panel.classList.add('is-active');
        panel.removeAttribute('hidden');
      }

      NB.emit(el, 'nb:tab-change', { tab: tab, panelId: panelId, panel: panel });
    }

    /* ---------------------------------------------------------------- */
    /*  Click handler                                                    */
    /* ---------------------------------------------------------------- */

    tabButtons.forEach(function (tab) {
      NB.on(tab, 'click', function (e) {
        e.preventDefault();
        activate(tab);
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard navigation                                              */
    /* ---------------------------------------------------------------- */

    NB.on(tablist, 'keydown', function (e) {
      var currentTab = e.target.closest('[data-nb-tab]');
      if (!currentTab) return;

      var idx = tabButtons.indexOf(currentTab);
      if (idx === -1) return;

      var newIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'Right':
          e.preventDefault();
          newIndex = (idx + 1) % tabButtons.length;
          activate(tabButtons[newIndex]);
          break;

        case 'ArrowLeft':
        case 'Left':
          e.preventDefault();
          newIndex = (idx - 1 + tabButtons.length) % tabButtons.length;
          activate(tabButtons[newIndex]);
          break;

        case 'Home':
          e.preventDefault();
          activate(tabButtons[0]);
          break;

        case 'End':
          e.preventDefault();
          activate(tabButtons[tabButtons.length - 1]);
          break;
      }
    });
  });

})(window.NB);


/* --- components/accordion.js --- */

/**
 * NB Accordion Component
 * Collapsible content sections with animation and ARIA support.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('accordion', function (el) {
    var mode = el.getAttribute('data-nb-accordion') || 'multiple'; // "single" or "multiple"
    var triggers = NB.$$('[data-nb-accordion-trigger]', el);

    if (!triggers.length) return;

    /* ---------------------------------------------------------------- */
    /*  Setup each trigger                                               */
    /* ---------------------------------------------------------------- */

    triggers.forEach(function (trigger) {
      var item = trigger.closest('.nb-accordion__item');
      if (!item) return;

      var content = item.querySelector('.nb-accordion__content') ||
                    item.querySelector('.nb-accordion__body') ||
                    trigger.nextElementSibling;
      if (!content) return;

      // Ensure IDs for ARIA
      var triggerId = trigger.id || NB.uid('accordion-trigger');
      var contentId = content.id || NB.uid('accordion-content');
      trigger.id = triggerId;
      content.id = contentId;

      // ARIA attributes
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-controls', contentId);
      content.setAttribute('role', 'region');
      content.setAttribute('aria-labelledby', triggerId);

      // Make trigger focusable if not already
      if (!trigger.getAttribute('tabindex') && trigger.tagName !== 'BUTTON' && trigger.tagName !== 'A') {
        trigger.setAttribute('tabindex', '0');
      }

      // Initial state
      var isOpen = item.classList.contains('is-open');
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) {
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.style.maxHeight = '0';
        content.style.overflow = 'hidden';
      }

      // Store references
      trigger._nbAccordionItem = item;
      trigger._nbAccordionContent = content;
    });

    /* ---------------------------------------------------------------- */
    /*  Toggle logic                                                     */
    /* ---------------------------------------------------------------- */

    function openItem(trigger) {
      var item = trigger._nbAccordionItem;
      var content = trigger._nbAccordionContent;
      if (!item || !content) return;

      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      content.style.overflow = 'hidden';
      content.style.maxHeight = content.scrollHeight + 'px';

      // After transition, remove max-height constraint so dynamic content works
      var onEnd = function () {
        NB.off(content, 'transitionend', onEnd);
        if (item.classList.contains('is-open')) {
          content.style.overflow = '';
          content.style.maxHeight = 'none';
        }
      };
      NB.on(content, 'transitionend', onEnd);

      NB.emit(el, 'nb:accordion-open', { item: item, trigger: trigger });
    }

    function closeItem(trigger) {
      var item = trigger._nbAccordionItem;
      var content = trigger._nbAccordionContent;
      if (!item || !content) return;

      // Set explicit max-height before collapsing (for transition to work)
      content.style.maxHeight = content.scrollHeight + 'px';
      content.style.overflow = 'hidden';

      // Force reflow
      void content.offsetHeight;

      item.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      content.style.maxHeight = '0';

      NB.emit(el, 'nb:accordion-close', { item: item, trigger: trigger });
    }

    function toggle(trigger) {
      var item = trigger._nbAccordionItem;
      if (!item) return;

      if (item.classList.contains('is-open')) {
        closeItem(trigger);
      } else {
        // In single mode, close all others first
        if (mode === 'single') {
          triggers.forEach(function (t) {
            if (t !== trigger && t._nbAccordionItem && t._nbAccordionItem.classList.contains('is-open')) {
              closeItem(t);
            }
          });
        }
        openItem(trigger);
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                  */
    /* ---------------------------------------------------------------- */

    triggers.forEach(function (trigger) {
      NB.on(trigger, 'click', function (e) {
        e.preventDefault();
        toggle(trigger);
      });

      NB.on(trigger, 'keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle(trigger);
        }
      });
    });
  });

})(window.NB);


/* --- components/tooltip.js --- */

/**
 * NB Tooltip Component
 * Dynamic tooltips with configurable positioning and keyboard support.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var SHOW_DELAY = 200;
  var GAP = 8; // px gap between element and tooltip

  NB.register('tooltip', function (el) {
    var text = el.getAttribute('data-nb-tooltip');
    if (!text) return;

    var position = el.getAttribute('data-nb-tooltip-position') || 'top';
    var tooltipEl = null;
    var showTimer = null;

    // Ensure the trigger is focusable
    if (!el.getAttribute('tabindex') && el.tagName !== 'BUTTON' &&
        el.tagName !== 'A' && el.tagName !== 'INPUT') {
      el.setAttribute('tabindex', '0');
    }

    // ARIA
    var tooltipId = NB.uid('tooltip');
    el.setAttribute('aria-describedby', tooltipId);

    /* ---------------------------------------------------------------- */
    /*  Create / Destroy tooltip element                                 */
    /* ---------------------------------------------------------------- */

    function createTooltip() {
      tooltipEl = document.createElement('div');
      tooltipEl.id = tooltipId;
      tooltipEl.className = 'nb-tooltip nb-tooltip--' + position;
      tooltipEl.setAttribute('role', 'tooltip');
      tooltipEl.textContent = text;
      document.body.appendChild(tooltipEl);
    }

    function positionTooltip() {
      if (!tooltipEl) return;

      var rect = el.getBoundingClientRect();
      var tipRect = tooltipEl.getBoundingClientRect();
      var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;

      var top, left;

      switch (position) {
        case 'bottom':
          top = rect.bottom + GAP + scrollY;
          left = rect.left + (rect.width - tipRect.width) / 2 + scrollX;
          break;
        case 'left':
          top = rect.top + (rect.height - tipRect.height) / 2 + scrollY;
          left = rect.left - tipRect.width - GAP + scrollX;
          break;
        case 'right':
          top = rect.top + (rect.height - tipRect.height) / 2 + scrollY;
          left = rect.right + GAP + scrollX;
          break;
        case 'top':
        default:
          top = rect.top - tipRect.height - GAP + scrollY;
          left = rect.left + (rect.width - tipRect.width) / 2 + scrollX;
          break;
      }

      // Clamp to viewport
      var viewWidth = document.documentElement.clientWidth;
      if (left < scrollX + 4) left = scrollX + 4;
      if (left + tipRect.width > scrollX + viewWidth - 4) {
        left = scrollX + viewWidth - tipRect.width - 4;
      }
      if (top < scrollY + 4) {
        // Flip to bottom
        top = rect.bottom + GAP + scrollY;
      }

      tooltipEl.style.position = 'absolute';
      tooltipEl.style.top = top + 'px';
      tooltipEl.style.left = left + 'px';
    }

    function show() {
      if (tooltipEl) return;
      showTimer = setTimeout(function () {
        createTooltip();
        // Allow reflow before positioning and animating
        void tooltipEl.offsetHeight;
        positionTooltip();
        tooltipEl.classList.add('is-active');
      }, SHOW_DELAY);
    }

    function hide() {
      if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
      }
      if (!tooltipEl) return;
      tooltipEl.classList.remove('is-active');

      var tip = tooltipEl;
      tooltipEl = null;

      // Remove after transition
      var onEnd = function () {
        NB.off(tip, 'transitionend', onEnd);
        if (tip.parentNode) tip.parentNode.removeChild(tip);
      };
      NB.on(tip, 'transitionend', onEnd);

      // Fallback removal
      setTimeout(function () {
        if (tip.parentNode) tip.parentNode.removeChild(tip);
      }, 300);
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                  */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'mouseenter', show);
    NB.on(el, 'mouseleave', hide);
    NB.on(el, 'focus', show);
    NB.on(el, 'blur', hide);

    // Escape hides tooltip
    NB.on(el, 'keydown', function (e) {
      if (e.key === 'Escape') {
        hide();
      }
    });

    // Update text if attribute changes (MutationObserver)
    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].attributeName === 'data-nb-tooltip') {
            text = el.getAttribute('data-nb-tooltip') || '';
            if (tooltipEl) tooltipEl.textContent = text;
          }
          if (mutations[i].attributeName === 'data-nb-tooltip-position') {
            position = el.getAttribute('data-nb-tooltip-position') || 'top';
          }
        }
      });
      observer.observe(el, { attributes: true });
    }
  });

})(window.NB);


/* --- components/select.js --- */

/**
 * NB Custom Select Component
 * Accessible custom select with search, keyboard navigation, and native fallback.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('select', function (el) {
    var nativeSelect = NB.$('select', el);
    if (!nativeSelect) return;

    var hasSearch = el.hasAttribute('data-nb-select-search');
    var trigger = NB.$('.nb-select__trigger', el) || NB.$('[data-nb-select-trigger]', el);
    var dropdown = NB.$('.nb-select__dropdown', el) || NB.$('[data-nb-select-dropdown]', el);

    /* ---------------------------------------------------------------- */
    /*  Build custom UI if not already present                           */
    /* ---------------------------------------------------------------- */

    if (!trigger) {
      trigger = document.createElement('button');
      trigger.className = 'nb-select__trigger';
      trigger.setAttribute('type', 'button');
      el.appendChild(trigger);
    }

    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'nb-select__dropdown';
      el.appendChild(dropdown);
    }

    // ARIA setup
    var listboxId = NB.uid('select-listbox');
    var triggerId = trigger.id || NB.uid('select-trigger');
    trigger.id = triggerId;
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', listboxId);

    // Build search input
    var searchInput = null;
    if (hasSearch) {
      searchInput = NB.$('.nb-select__search', dropdown) || NB.$('input[type="search"]', dropdown);
      if (!searchInput) {
        searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.className = 'nb-select__search';
        searchInput.setAttribute('placeholder', 'Search...');
        searchInput.setAttribute('aria-label', 'Search options');
        dropdown.insertBefore(searchInput, dropdown.firstChild);
      }
    }

    // Build options list
    var listbox = NB.$('[role="listbox"]', dropdown);
    if (!listbox) {
      listbox = document.createElement('ul');
      listbox.className = 'nb-select__options';
      dropdown.appendChild(listbox);
    }
    listbox.id = listboxId;
    listbox.setAttribute('role', 'listbox');
    listbox.setAttribute('aria-labelledby', triggerId);

    // Hide native select
    nativeSelect.setAttribute('tabindex', '-1');
    nativeSelect.setAttribute('aria-hidden', 'true');
    nativeSelect.style.position = 'absolute';
    nativeSelect.style.width = '1px';
    nativeSelect.style.height = '1px';
    nativeSelect.style.overflow = 'hidden';
    nativeSelect.style.clip = 'rect(0,0,0,0)';
    nativeSelect.style.border = '0';

    /* ---------------------------------------------------------------- */
    /*  Populate options from native select                              */
    /* ---------------------------------------------------------------- */

    function buildOptions() {
      listbox.innerHTML = '';
      var options = nativeSelect.options;

      for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        if (opt.disabled && opt.value === '') continue; // skip placeholder

        var li = document.createElement('li');
        li.className = 'nb-select__option';
        li.setAttribute('role', 'option');
        li.setAttribute('data-value', opt.value);
        li.setAttribute('tabindex', '-1');
        li.textContent = opt.textContent;

        if (opt.selected) {
          li.classList.add('is-selected');
          li.setAttribute('aria-selected', 'true');
        } else {
          li.setAttribute('aria-selected', 'false');
        }

        listbox.appendChild(li);
      }
    }

    buildOptions();
    updateTriggerText();

    function updateTriggerText() {
      var selected = nativeSelect.options[nativeSelect.selectedIndex];
      if (selected) {
        trigger.textContent = selected.textContent;
      } else {
        trigger.textContent = '';
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Open / Close                                                      */
    /* ---------------------------------------------------------------- */

    function open() {
      if (el.classList.contains('is-open')) return;
      el.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');

      if (searchInput) {
        searchInput.value = '';
        filterOptions('');
        searchInput.focus();
      } else {
        // Focus the selected option or first option
        var selected = NB.$('.is-selected', listbox);
        if (selected) {
          selected.focus();
        } else {
          var first = NB.$('[role="option"]', listbox);
          if (first) first.focus();
        }
      }

      NB.emit(el, 'nb:select-open');
    }

    function close() {
      if (!el.classList.contains('is-open')) return;
      el.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
      NB.emit(el, 'nb:select-close');
    }

    function selectOption(li) {
      if (!li) return;
      var value = li.getAttribute('data-value');

      // Update native select
      nativeSelect.value = value;

      // Update visual state
      NB.$$('[role="option"]', listbox).forEach(function (opt) {
        opt.classList.remove('is-selected');
        opt.setAttribute('aria-selected', 'false');
      });
      li.classList.add('is-selected');
      li.setAttribute('aria-selected', 'true');

      updateTriggerText();
      close();

      // Dispatch change event on native select
      var changeEvent = new Event('change', { bubbles: true });
      nativeSelect.dispatchEvent(changeEvent);

      NB.emit(el, 'nb:select-change', { value: value, text: li.textContent });
    }

    /* ---------------------------------------------------------------- */
    /*  Search / filter                                                  */
    /* ---------------------------------------------------------------- */

    function filterOptions(query) {
      query = query.toLowerCase().trim();
      var options = NB.$$('[role="option"]', listbox);

      options.forEach(function (opt) {
        var text = opt.textContent.toLowerCase();
        if (!query || text.indexOf(query) !== -1) {
          opt.style.display = '';
          opt.removeAttribute('hidden');
        } else {
          opt.style.display = 'none';
          opt.setAttribute('hidden', '');
        }
      });
    }

    if (searchInput) {
      NB.on(searchInput, 'input', function () {
        filterOptions(searchInput.value);
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard navigation                                              */
    /* ---------------------------------------------------------------- */

    function getVisibleOptions() {
      return NB.$$('[role="option"]', listbox).filter(function (opt) {
        return !opt.hasAttribute('hidden') && opt.style.display !== 'none';
      });
    }

    function focusOption(index) {
      var opts = getVisibleOptions();
      if (!opts.length) return;
      if (index < 0) index = opts.length - 1;
      if (index >= opts.length) index = 0;
      opts[index].focus();
    }

    function currentOptionIndex() {
      var opts = getVisibleOptions();
      var active = document.activeElement;
      for (var i = 0; i < opts.length; i++) {
        if (opts[i] === active) return i;
      }
      return -1;
    }

    // Trigger events
    NB.on(trigger, 'click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (el.classList.contains('is-open')) {
        close();
      } else {
        open();
      }
    });

    NB.on(trigger, 'keydown', function (e) {
      switch (e.key) {
        case 'ArrowDown':
        case 'Down':
        case 'ArrowUp':
        case 'Up':
        case 'Enter':
        case ' ':
          e.preventDefault();
          open();
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    });

    // Dropdown keyboard
    var handleDropdownKeydown = function (e) {
      var idx = currentOptionIndex();

      switch (e.key) {
        case 'ArrowDown':
        case 'Down':
          e.preventDefault();
          focusOption(idx + 1);
          break;
        case 'ArrowUp':
        case 'Up':
          e.preventDefault();
          if (idx <= 0 && searchInput) {
            searchInput.focus();
          } else {
            focusOption(idx - 1);
          }
          break;
        case 'Home':
          e.preventDefault();
          focusOption(0);
          break;
        case 'End':
          e.preventDefault();
          focusOption(getVisibleOptions().length - 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (document.activeElement && document.activeElement.getAttribute('role') === 'option') {
            selectOption(document.activeElement);
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'Tab':
          close();
          break;
      }
    };

    NB.on(dropdown, 'keydown', handleDropdownKeydown);

    // Search input arrow down moves to options
    if (searchInput) {
      NB.on(searchInput, 'keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'Down') {
          e.preventDefault();
          focusOption(0);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          close();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          var opts = getVisibleOptions();
          if (opts.length === 1) {
            selectOption(opts[0]);
          }
        }
      });
    }

    // Option click
    NB.on(listbox, 'click', function (e) {
      var opt = e.target.closest('[role="option"]');
      if (opt) {
        e.preventDefault();
        selectOption(opt);
      }
    });

    // Click outside
    NB.on(document, 'click', function (e) {
      if (!el.contains(e.target) && el.classList.contains('is-open')) {
        close();
      }
    });

    // Sync if native select changes externally
    NB.on(nativeSelect, 'change', function () {
      buildOptions();
      updateTriggerText();
    });
  });

})(window.NB);


/* --- components/toggle.js --- */

/**
 * NB Toggle Component
 * Accessible toggle switches backed by a native checkbox.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('toggle', function (el) {
    var checkbox = NB.$('input[type="checkbox"]', el);

    // Create hidden checkbox if not present
    if (!checkbox) {
      checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'nb-toggle__input';
      checkbox.style.position = 'absolute';
      checkbox.style.width = '1px';
      checkbox.style.height = '1px';
      checkbox.style.overflow = 'hidden';
      checkbox.style.clip = 'rect(0,0,0,0)';
      el.insertBefore(checkbox, el.firstChild);
    }

    // Ensure IDs
    if (!checkbox.id) checkbox.id = NB.uid('toggle-input');

    // ARIA: the element acts as a switch
    el.setAttribute('role', 'switch');
    el.setAttribute('tabindex', '0');

    // Sync initial state
    function syncState() {
      var checked = checkbox.checked;
      if (checked) {
        el.classList.add('is-active');
      } else {
        el.classList.remove('is-active');
      }
      el.setAttribute('aria-checked', String(checked));
    }

    syncState();

    /* ---------------------------------------------------------------- */
    /*  Toggle                                                           */
    /* ---------------------------------------------------------------- */

    function toggle() {
      checkbox.checked = !checkbox.checked;
      syncState();

      // Dispatch change event on checkbox
      var changeEvent = new Event('change', { bubbles: true });
      checkbox.dispatchEvent(changeEvent);

      NB.emit(el, 'nb:toggle-change', { checked: checkbox.checked });
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                  */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      // Prevent double-firing if clicking directly on checkbox
      if (e.target === checkbox) return;
      e.preventDefault();
      toggle();
    });

    NB.on(el, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });

    // Listen to checkbox change (e.g., changed via label or programmatically)
    NB.on(checkbox, 'change', function () {
      syncState();
    });

    // Prevent the checkbox click from bubbling and double-toggling
    NB.on(checkbox, 'click', function (e) {
      e.stopPropagation();
      syncState();
      NB.emit(el, 'nb:toggle-change', { checked: checkbox.checked });
    });
  });

})(window.NB);


/* --- components/file-upload.js --- */

/**
 * NB File Upload Component
 * Drag-and-drop file upload with previews and validation.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    if (i >= units.length) i = units.length - 1;
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  NB.register('file-upload', function (el) {
    var isMultiple = el.hasAttribute('data-nb-file-upload-multiple');
    var acceptAttr = el.getAttribute('data-nb-file-upload-accept') || '';
    var input = NB.$('input[type="file"]', el);
    var fileList = NB.$('.nb-file-upload__list', el) ||
                   NB.$('[data-nb-file-list]', el);

    // Create file input if not present
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.className = 'nb-file-upload__input';
      input.style.position = 'absolute';
      input.style.width = '1px';
      input.style.height = '1px';
      input.style.overflow = 'hidden';
      input.style.clip = 'rect(0,0,0,0)';
      el.appendChild(input);
    }

    if (isMultiple) input.setAttribute('multiple', '');
    if (acceptAttr) input.setAttribute('accept', acceptAttr);

    // Create file list container if not present
    if (!fileList) {
      fileList = document.createElement('div');
      fileList.className = 'nb-file-upload__list';
      el.appendChild(fileList);
    }

    // Stored files (maintained as array since FileList is read-only)
    var _files = [];

    /* ---------------------------------------------------------------- */
    /*  Validation                                                       */
    /* ---------------------------------------------------------------- */

    function isAccepted(file) {
      if (!acceptAttr) return true;
      var types = acceptAttr.split(',').map(function (t) { return t.trim().toLowerCase(); });
      var fileName = file.name.toLowerCase();
      var fileType = file.type.toLowerCase();

      return types.some(function (type) {
        if (type.charAt(0) === '.') {
          // Extension match
          return fileName.endsWith(type);
        }
        if (type.endsWith('/*')) {
          // MIME type wildcard (e.g. image/*)
          return fileType.indexOf(type.replace('/*', '/')) === 0;
        }
        return fileType === type;
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Render file list                                                  */
    /* ---------------------------------------------------------------- */

    function renderFiles() {
      fileList.innerHTML = '';

      if (!_files.length) {
        fileList.classList.remove('is-active');
        return;
      }

      fileList.classList.add('is-active');

      _files.forEach(function (file, index) {
        var item = document.createElement('div');
        item.className = 'nb-file-upload__item';

        var info = document.createElement('span');
        info.className = 'nb-file-upload__file-info';
        info.innerHTML = '<span class="nb-file-upload__file-name">' +
                         escapeHtml(file.name) + '</span>' +
                         '<span class="nb-file-upload__file-size">' +
                         formatFileSize(file.size) + '</span>';

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'nb-file-upload__remove';
        removeBtn.setAttribute('aria-label', 'Remove ' + file.name);
        removeBtn.innerHTML = '&times;';
        removeBtn.setAttribute('data-index', String(index));

        item.appendChild(info);
        item.appendChild(removeBtn);
        fileList.appendChild(item);
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Handle files                                                      */
    /* ---------------------------------------------------------------- */

    function handleFiles(newFiles) {
      var added = [];
      var rejected = [];

      for (var i = 0; i < newFiles.length; i++) {
        var file = newFiles[i];
        if (!isAccepted(file)) {
          rejected.push(file);
          continue;
        }

        if (isMultiple) {
          _files.push(file);
        } else {
          _files = [file];
        }
        added.push(file);
      }

      renderFiles();

      NB.emit(el, 'nb:file-change', {
        files: _files.slice(),
        added: added,
        rejected: rejected
      });

      if (rejected.length) {
        NB.emit(el, 'nb:file-rejected', { files: rejected });
      }
    }

    function removeFile(index) {
      var removed = _files.splice(index, 1);
      renderFiles();

      // Clear input value so the same file can be re-selected
      input.value = '';

      NB.emit(el, 'nb:file-change', {
        files: _files.slice(),
        removed: removed
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Drag and drop                                                    */
    /* ---------------------------------------------------------------- */

    var dragCounter = 0;

    NB.on(el, 'dragenter', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      el.classList.add('is-dragover');
    });

    NB.on(el, 'dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
    });

    NB.on(el, 'dragleave', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        el.classList.remove('is-dragover');
      }
    });

    NB.on(el, 'drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      el.classList.remove('is-dragover');

      var dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length) {
        handleFiles(dt.files);
      }
    });

    /* ---------------------------------------------------------------- */
    /*  File input change                                                */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'change', function () {
      if (input.files && input.files.length) {
        handleFiles(input.files);
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Click to open file dialog                                        */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      // Don't trigger if clicking the remove button or input itself
      if (e.target === input || e.target.closest('.nb-file-upload__remove')) return;
      input.click();
    });

    /* ---------------------------------------------------------------- */
    /*  Remove button (delegated)                                        */
    /* ---------------------------------------------------------------- */

    NB.on(fileList, 'click', function (e) {
      var removeBtn = e.target.closest('.nb-file-upload__remove');
      if (removeBtn) {
        e.stopPropagation();
        var index = parseInt(removeBtn.getAttribute('data-index'), 10);
        if (!isNaN(index)) {
          removeFile(index);
        }
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard: Enter / Space opens file dialog                        */
    /* ---------------------------------------------------------------- */

    if (!el.getAttribute('tabindex')) {
      el.setAttribute('tabindex', '0');
    }
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', el.getAttribute('aria-label') || 'Choose files to upload');

    NB.on(el, 'keydown', function (e) {
      if (e.target === input || e.target.closest('.nb-file-upload__remove')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });
  });

})(window.NB);


/* --- components/table-sort.js --- */

/**
 * NB Table Sort Component
 * Sortable table columns with numeric detection and custom sort values.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('table-sort', function (el) {
    var table = el.tagName === 'TABLE' ? el : NB.$('table', el);
    if (!table) return;

    var tbody = NB.$('tbody', table);
    if (!tbody) return;

    var sortButtons = NB.$$('[data-nb-sort]', table);

    // Current sort state
    var currentSortCol = null;
    var currentSortDir = null;

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    sortButtons.forEach(function (btn) {
      btn.setAttribute('aria-sort', 'none');
      if (!btn.getAttribute('tabindex') && btn.tagName !== 'BUTTON' && btn.tagName !== 'A') {
        btn.setAttribute('tabindex', '0');
        btn.setAttribute('role', 'button');
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Sorting logic                                                     */
    /* ---------------------------------------------------------------- */

    function getCellValue(row, colIndex) {
      var cells = row.querySelectorAll('td, th');
      if (colIndex >= cells.length) return '';
      var cell = cells[colIndex];
      // Prefer data-sort-value attribute
      if (cell.hasAttribute('data-sort-value')) {
        return cell.getAttribute('data-sort-value');
      }
      return cell.textContent.trim();
    }

    function isNumeric(value) {
      if (value === '') return false;
      // Handle currency, commas, percentages
      var cleaned = value.replace(/[$,% ]/g, '');
      return !isNaN(parseFloat(cleaned)) && isFinite(cleaned);
    }

    function parseNumeric(value) {
      var cleaned = String(value).replace(/[$,% ]/g, '');
      return parseFloat(cleaned);
    }

    function getColumnIndex(btn) {
      // Explicit column index
      var explicit = btn.getAttribute('data-nb-sort');
      if (explicit && !isNaN(parseInt(explicit, 10))) {
        return parseInt(explicit, 10);
      }

      // Determine from th position
      var th = btn.closest('th');
      if (!th) return 0;

      var row = th.parentElement;
      var cells = row.querySelectorAll('th');
      for (var i = 0; i < cells.length; i++) {
        if (cells[i] === th) return i;
      }
      return 0;
    }

    function sortTable(colIndex, direction) {
      var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
      if (!rows.length) return;

      // Detect if column is numeric by sampling first non-empty values
      var useNumeric = false;
      var numericCount = 0;
      var totalChecked = 0;
      for (var i = 0; i < rows.length && totalChecked < 10; i++) {
        var val = getCellValue(rows[i], colIndex);
        if (val !== '') {
          totalChecked++;
          if (isNumeric(val)) numericCount++;
        }
      }
      useNumeric = totalChecked > 0 && numericCount / totalChecked >= 0.5;

      // Sort rows
      rows.sort(function (a, b) {
        var valA = getCellValue(a, colIndex);
        var valB = getCellValue(b, colIndex);

        var result;
        if (useNumeric) {
          var numA = parseNumeric(valA);
          var numB = parseNumeric(valB);
          // Handle NaN — push non-numeric to end
          if (isNaN(numA) && isNaN(numB)) result = 0;
          else if (isNaN(numA)) result = 1;
          else if (isNaN(numB)) result = -1;
          else result = numA - numB;
        } else {
          result = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
        }

        return direction === 'desc' ? -result : result;
      });

      // Re-append sorted rows using a DocumentFragment for performance
      var fragment = document.createDocumentFragment();
      rows.forEach(function (row) {
        fragment.appendChild(row);
      });
      tbody.appendChild(fragment);
    }

    /* ---------------------------------------------------------------- */
    /*  Click handler                                                    */
    /* ---------------------------------------------------------------- */

    function handleSort(btn) {
      var colIndex = getColumnIndex(btn);

      // Determine new direction
      var newDir;
      if (currentSortCol === colIndex) {
        newDir = currentSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        newDir = 'asc';
      }

      // Reset all sort indicators
      sortButtons.forEach(function (b) {
        var th = b.closest('th') || b;
        th.classList.remove('is-sorted-asc', 'is-sorted-desc');
        b.setAttribute('aria-sort', 'none');
      });

      // Apply sort
      sortTable(colIndex, newDir);

      // Update indicators
      var th = btn.closest('th') || btn;
      th.classList.add('is-sorted-' + newDir);
      btn.setAttribute('aria-sort', newDir === 'asc' ? 'ascending' : 'descending');

      currentSortCol = colIndex;
      currentSortDir = newDir;

      NB.emit(table, 'nb:table-sort', {
        column: colIndex,
        direction: newDir
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                  */
    /* ---------------------------------------------------------------- */

    sortButtons.forEach(function (btn) {
      NB.on(btn, 'click', function (e) {
        e.preventDefault();
        handleSort(btn);
      });

      NB.on(btn, 'keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSort(btn);
        }
      });
    });
  });

})(window.NB);


/* --- components/password-toggle.js --- */

/**
 * NB Password Toggle Component
 * Toggle password field visibility with accessible state management.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  // SVG icons for eye/eye-off
  var ICON_EYE = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  var ICON_EYE_OFF = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  NB.register('password-toggle', function (btn) {
    var targetSelector = btn.getAttribute('data-nb-password-toggle');
    if (!targetSelector) return;

    var input = targetSelector.charAt(0) === '#' || targetSelector.charAt(0) === '.'
      ? document.querySelector(targetSelector)
      : document.getElementById(targetSelector);

    if (!input) {
      console.warn('NB.password-toggle: input "' + targetSelector + '" not found.');
      return;
    }

    // Ensure button type
    if (btn.tagName === 'BUTTON' && !btn.getAttribute('type')) {
      btn.setAttribute('type', 'button');
    }

    // ARIA
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Show password');

    // Set initial icon
    var iconContainer = NB.$('.nb-password-toggle__icon', btn);
    if (!iconContainer) {
      iconContainer = document.createElement('span');
      iconContainer.className = 'nb-password-toggle__icon';
      // Only add icon if button has no text content
      if (!btn.textContent.trim()) {
        btn.innerHTML = '';
        btn.appendChild(iconContainer);
      }
    }

    function updateIcon() {
      var isVisible = input.type === 'text';
      if (iconContainer) {
        iconContainer.innerHTML = isVisible ? ICON_EYE_OFF : ICON_EYE;
      }
    }

    updateIcon();

    /* ---------------------------------------------------------------- */
    /*  Toggle                                                           */
    /* ---------------------------------------------------------------- */

    function toggle() {
      var isPassword = input.type === 'password';

      if (isPassword) {
        input.type = 'text';
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Hide password');
        btn.classList.add('is-active');
      } else {
        input.type = 'password';
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Show password');
        btn.classList.remove('is-active');
      }

      updateIcon();

      NB.emit(btn, 'nb:password-toggle', {
        visible: input.type === 'text',
        input: input
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                  */
    /* ---------------------------------------------------------------- */

    NB.on(btn, 'click', function (e) {
      e.preventDefault();
      toggle();
    });
  });

})(window.NB);


/* --- components/alert-dismiss.js --- */

/**
 * NB Alert Dismiss Component
 * Dismissible alerts with fade-out animation.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('alert-dismiss', function (btn) {
    // ARIA
    btn.setAttribute('aria-label', btn.getAttribute('aria-label') || 'Dismiss alert');

    NB.on(btn, 'click', function (e) {
      e.preventDefault();

      var alert = btn.closest('.nb-alert');
      if (!alert) {
        // Fallback: try parent with role="alert"
        alert = btn.closest('[role="alert"]');
      }
      if (!alert) {
        // Last fallback: just use parentElement
        alert = btn.parentElement;
      }
      if (!alert) return;

      // Start exit animation
      alert.classList.add('is-dismissing');
      alert.style.opacity = '0';
      alert.style.transition = alert.style.transition || 'opacity 0.3s ease';

      var onEnd = function () {
        NB.off(alert, 'transitionend', onEnd);

        // Dispatch event before removal
        NB.emit(alert, 'nb:alert-dismissed', {
          alert: alert
        });

        // Remove from DOM
        if (alert.parentNode) {
          alert.parentNode.removeChild(alert);
        }
      };

      NB.on(alert, 'transitionend', onEnd);

      // Fallback removal if no transition fires
      setTimeout(function () {
        if (alert.parentNode) {
          NB.emit(alert, 'nb:alert-dismissed', { alert: alert });
          alert.parentNode.removeChild(alert);
        }
      }, 500);
    });
  });

})(window.NB);


/* --- components/navbar-mobile.js --- */

/**
 * NB Navbar Mobile Component
 * Responsive mobile navigation toggle with accessibility support.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('navbar-toggle', function (btn) {
    var navbar = btn.closest('.nb-navbar') || btn.closest('[data-nb-navbar]') || btn.parentElement;
    if (!navbar) return;

    // Find the nav menu
    var targetSelector = btn.getAttribute('data-nb-navbar-toggle');
    var menu = targetSelector
      ? document.querySelector(targetSelector)
      : NB.$('.nb-navbar__menu', navbar) || NB.$('.nb-navbar__nav', navbar) || NB.$('nav', navbar);

    if (!menu) return;

    // ARIA setup
    var menuId = menu.id || NB.uid('navbar-menu');
    menu.id = menuId;
    btn.setAttribute('aria-controls', menuId);
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', btn.getAttribute('aria-label') || 'Toggle navigation menu');

    /* ---------------------------------------------------------------- */
    /*  Open / Close                                                     */
    /* ---------------------------------------------------------------- */

    function isOpen() {
      return navbar.classList.contains('is-open');
    }

    function open() {
      navbar.classList.add('is-open');
      btn.classList.add('is-active');
      btn.setAttribute('aria-expanded', 'true');
      menu.removeAttribute('hidden');
      NB.emit(navbar, 'nb:navbar-open');
    }

    function close() {
      navbar.classList.remove('is-open');
      btn.classList.remove('is-active');
      btn.setAttribute('aria-expanded', 'false');
      NB.emit(navbar, 'nb:navbar-close');
    }

    function toggle() {
      if (isOpen()) {
        close();
      } else {
        open();
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                  */
    /* ---------------------------------------------------------------- */

    NB.on(btn, 'click', function (e) {
      e.preventDefault();
      toggle();
    });

    // Close when clicking a nav link (mobile)
    NB.on(menu, 'click', function (e) {
      var link = e.target.closest('a');
      if (link && isOpen()) {
        close();
      }
    });

    // Close on Escape
    NB.on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        close();
        btn.focus();
      }
    });

    // Close on window resize to desktop (optional enhancement)
    var resizeTimer;
    NB.on(window, 'resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        // If menu is open and we're now at desktop width, close it
        if (isOpen() && window.innerWidth >= 1024) {
          close();
        }
      }, 150);
    });
  });

  // Also register under the attribute name used in HTML
  NB.register('navbar-mobile', function () {
    // The actual init happens on [data-nb-navbar-toggle] elements
    // This registration ensures NB.init picks up containers with
    // data-nb-navbar-mobile if needed.
  });

})(window.NB);


/* --- components/sidebar-toggle.js --- */

/**
 * NB Sidebar Toggle Component
 * Collapsible sidebar with overlay and responsive behavior.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('sidebar-toggle', function (btn) {
    var targetSelector = btn.getAttribute('data-nb-sidebar-toggle');
    var sidebar = targetSelector
      ? document.querySelector(targetSelector)
      : NB.$('.nb-sidebar');

    if (!sidebar) {
      console.warn('NB.sidebar-toggle: sidebar target not found.');
      return;
    }

    // Ensure IDs for ARIA
    var sidebarId = sidebar.id || NB.uid('sidebar');
    sidebar.id = sidebarId;
    btn.setAttribute('aria-controls', sidebarId);
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', btn.getAttribute('aria-label') || 'Toggle sidebar');

    // Create or find overlay
    var overlay = NB.$('.nb-sidebar__overlay') ||
                  NB.$('[data-nb-sidebar-overlay]');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'nb-sidebar__overlay';
      overlay.setAttribute('data-nb-sidebar-overlay', '');
      overlay.setAttribute('aria-hidden', 'true');
      sidebar.parentNode.insertBefore(overlay, sidebar.nextSibling);
    }

    /* ---------------------------------------------------------------- */
    /*  State                                                            */
    /* ---------------------------------------------------------------- */

    function isOpen() {
      return sidebar.classList.contains('is-open');
    }

    function isMobile() {
      return window.innerWidth < 1024;
    }

    function open() {
      sidebar.classList.add('is-open');
      btn.classList.add('is-active');
      btn.setAttribute('aria-expanded', 'true');
      overlay.classList.add('is-active');

      if (isMobile()) {
        document.body.style.overflow = 'hidden';
      }

      NB.emit(sidebar, 'nb:sidebar-open');
    }

    function close() {
      sidebar.classList.remove('is-open');
      btn.classList.remove('is-active');
      btn.setAttribute('aria-expanded', 'false');
      overlay.classList.remove('is-active');

      if (isMobile()) {
        document.body.style.overflow = '';
      }

      NB.emit(sidebar, 'nb:sidebar-close');
    }

    function toggle() {
      if (isOpen()) {
        close();
      } else {
        open();
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Event listeners                                                  */
    /* ---------------------------------------------------------------- */

    // Toggle button
    NB.on(btn, 'click', function (e) {
      e.preventDefault();
      toggle();
    });

    // Overlay click closes
    NB.on(overlay, 'click', function () {
      close();
    });

    // Escape key closes
    NB.on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        close();
        btn.focus();
      }
    });

    // On resize: restore body scroll if switching to desktop while open
    var resizeTimer;
    NB.on(window, 'resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (isOpen() && !isMobile()) {
          document.body.style.overflow = '';
        }
      }, 150);
    });
  });

})(window.NB);


/* --- components/date-display.js --- */

/**
 * NB Date Display Component
 * Formats dates as relative time, short, or long format with optional live updates.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('date', function (el) {
    var isoString = el.getAttribute('data-nb-date');
    if (!isoString) return;

    var date = new Date(isoString);
    if (isNaN(date.getTime())) {
      console.warn('NB date-display: invalid date "' + isoString + '"');
      return;
    }

    var format = el.getAttribute('data-nb-date-format') || 'relative';
    var live = el.getAttribute('data-nb-date-live') === 'true';
    var intervalId = null;

    /* ---------------------------------------------------------------- */
    /*  Formatters                                                       */
    /* ---------------------------------------------------------------- */

    /**
     * Return a human-readable relative time string.
     * @param {Date} d
     * @returns {string}
     */
    function formatRelative(d) {
      var now = Date.now();
      var diffMs = now - d.getTime();
      var diffSec = Math.floor(diffMs / 1000);
      var diffMin = Math.floor(diffSec / 60);
      var diffHr = Math.floor(diffMin / 60);
      var diffDay = Math.floor(diffHr / 24);
      var diffMonth = Math.floor(diffDay / 30);
      var diffYear = Math.floor(diffDay / 365);

      if (diffSec < 60) return 'just now';
      if (diffMin < 60) return diffMin + (diffMin === 1 ? ' minute ago' : ' minutes ago');
      if (diffHr < 24) return diffHr + (diffHr === 1 ? ' hour ago' : ' hours ago');
      if (diffDay < 30) return diffDay + (diffDay === 1 ? ' day ago' : ' days ago');
      if (diffMonth < 12) return diffMonth + (diffMonth === 1 ? ' month ago' : ' months ago');
      return diffYear + (diffYear === 1 ? ' year ago' : ' years ago');
    }

    /**
     * Format as short date: "Mar 14, 2026"
     * @param {Date} d
     * @returns {string}
     */
    function formatShort(d) {
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    /**
     * Format as long date: "March 14, 2026"
     * @param {Date} d
     * @returns {string}
     */
    function formatLong(d) {
      return d.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Render                                                           */
    /* ---------------------------------------------------------------- */

    function render() {
      var text;

      switch (format) {
        case 'short':
          text = formatShort(date);
          break;
        case 'long':
          text = formatLong(date);
          break;
        case 'relative':
        default:
          text = formatRelative(date);
          break;
      }

      el.textContent = text;
    }

    // Initial render
    render();

    // Set the datetime attribute for accessibility / SEO
    if (el.tagName === 'TIME' && !el.getAttribute('datetime')) {
      el.setAttribute('datetime', isoString);
    }

    /* ---------------------------------------------------------------- */
    /*  Live update                                                      */
    /* ---------------------------------------------------------------- */

    if (live) {
      intervalId = setInterval(render, 60000);
    }
  });

})(window.NB);


/* --- components/calendar.js --- */

/**
 * NB Calendar Component
 * Interactive calendar grid with keyboard navigation and date selection.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  SVG icons                                                          */
  /* ------------------------------------------------------------------ */

  var CHEVRON_LEFT =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var CHEVRON_RIGHT =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  var MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Parse an ISO date string (YYYY-MM-DD) into a local-midnight Date.
   * Falls back to new Date(str) for full ISO strings.
   */
  function parseISO(str) {
    if (!str) return null;
    var parts = str.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    var d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  /** Return "YYYY-MM-DD" for a Date. */
  function toISO(d) {
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return (
      y +
      '-' +
      (m < 10 ? '0' + m : m) +
      '-' +
      (day < 10 ? '0' + day : day)
    );
  }

  /** Compare two dates by year-month-day only. */
  function sameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Component                                                          */
  /* ------------------------------------------------------------------ */

  NB.register('calendar', function (el) {
    var valueAttr = el.getAttribute('data-nb-calendar-value');
    var minDate = parseISO(el.getAttribute('data-nb-calendar-min'));
    var maxDate = parseISO(el.getAttribute('data-nb-calendar-max'));

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var selectedDate = parseISO(valueAttr) || new Date(today);
    selectedDate.setHours(0, 0, 0, 0);

    // viewMonth / viewYear control which month is displayed
    var viewMonth = selectedDate.getMonth();
    var viewYear = selectedDate.getFullYear();

    // DOM references
    var headerEl = null;
    var titleEl = null;
    var prevBtn = null;
    var nextBtn = null;
    var gridEl = null;

    /* ---------------------------------------------------------------- */
    /*  Scaffold                                                         */
    /* ---------------------------------------------------------------- */

    function buildScaffold() {
      el.innerHTML = '';
      el.classList.add('nb-calendar');

      // Header
      headerEl = document.createElement('div');
      headerEl.className = 'nb-calendar__header';

      prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'nb-calendar__prev';
      prevBtn.setAttribute('aria-label', 'Previous month');
      prevBtn.innerHTML = CHEVRON_LEFT;

      titleEl = document.createElement('span');
      titleEl.className = 'nb-calendar__title';

      nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'nb-calendar__next';
      nextBtn.setAttribute('aria-label', 'Next month');
      nextBtn.innerHTML = CHEVRON_RIGHT;

      var navEl = document.createElement('div');
      navEl.className = 'nb-calendar__nav';
      navEl.appendChild(prevBtn);
      navEl.appendChild(nextBtn);

      headerEl.appendChild(titleEl);
      headerEl.appendChild(navEl);
      el.appendChild(headerEl);

      // Weekday headers
      var weekdaysEl = document.createElement('div');
      weekdaysEl.className = 'nb-calendar__weekdays';
      WEEKDAY_LABELS.forEach(function (label) {
        var span = document.createElement('span');
        span.className = 'nb-calendar__weekday';
        span.textContent = label;
        weekdaysEl.appendChild(span);
      });
      el.appendChild(weekdaysEl);

      // Grid
      gridEl = document.createElement('div');
      gridEl.className = 'nb-calendar__grid';
      gridEl.setAttribute('role', 'grid');
      el.appendChild(gridEl);
    }

    buildScaffold();

    /* ---------------------------------------------------------------- */
    /*  Rendering                                                        */
    /* ---------------------------------------------------------------- */

    function isDisabled(d) {
      if (minDate && d < minDate) return true;
      if (maxDate && d > maxDate) return true;
      return false;
    }

    function renderGrid() {
      // Update title
      titleEl.textContent = MONTH_NAMES[viewMonth] + ' ' + viewYear;

      // Clear grid
      gridEl.innerHTML = '';

      // First day of the displayed month
      var firstOfMonth = new Date(viewYear, viewMonth, 1);
      var startDow = firstOfMonth.getDay(); // 0 = Sun

      // Last day of the displayed month
      var lastOfMonth = new Date(viewYear, viewMonth + 1, 0);
      var totalDays = lastOfMonth.getDate();

      // Days from previous month to fill the first row
      var prevMonthLast = new Date(viewYear, viewMonth, 0);
      var prevMonthDays = prevMonthLast.getDate();

      // Build 6 rows x 7 cols = 42 cells
      var cellDate;
      var totalCells = 42;

      for (var i = 0; i < totalCells; i++) {
        var dayNum;
        var isOtherMonth = false;

        if (i < startDow) {
          // Previous month
          dayNum = prevMonthDays - startDow + 1 + i;
          cellDate = new Date(viewYear, viewMonth - 1, dayNum);
          isOtherMonth = true;
        } else if (i - startDow >= totalDays) {
          // Next month
          dayNum = i - startDow - totalDays + 1;
          cellDate = new Date(viewYear, viewMonth + 1, dayNum);
          isOtherMonth = true;
        } else {
          // Current month
          dayNum = i - startDow + 1;
          cellDate = new Date(viewYear, viewMonth, dayNum);
        }

        cellDate.setHours(0, 0, 0, 0);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nb-calendar__day';
        btn.textContent = cellDate.getDate();
        btn.setAttribute('data-date', toISO(cellDate));

        if (isOtherMonth) btn.classList.add('nb-calendar__day--other-month');
        if (sameDay(cellDate, today)) btn.classList.add('nb-calendar__day--today');
        if (sameDay(cellDate, selectedDate)) btn.classList.add('nb-calendar__day--selected');

        if (isDisabled(cellDate)) {
          btn.classList.add('nb-calendar__day--disabled');
          btn.disabled = true;
        }

        gridEl.appendChild(btn);
      }
    }

    renderGrid();

    /* ---------------------------------------------------------------- */
    /*  Navigation                                                       */
    /* ---------------------------------------------------------------- */

    function goToPrevMonth() {
      viewMonth -= 1;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear -= 1;
      }
      renderGrid();
    }

    function goToNextMonth() {
      viewMonth += 1;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear += 1;
      }
      renderGrid();
    }

    NB.on(prevBtn, 'click', function (e) {
      e.preventDefault();
      goToPrevMonth();
    });

    NB.on(nextBtn, 'click', function (e) {
      e.preventDefault();
      goToNextMonth();
    });

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function selectDate(d) {
      selectedDate = new Date(d);
      selectedDate.setHours(0, 0, 0, 0);

      // Ensure the selected month is visible
      viewMonth = selectedDate.getMonth();
      viewYear = selectedDate.getFullYear();

      renderGrid();

      NB.emit(el, 'nb:calendar-select', {
        date: new Date(selectedDate),
        iso: toISO(selectedDate),
      });
    }

    NB.on(gridEl, 'click', function (e) {
      var btn = e.target.closest('.nb-calendar__day');
      if (!btn || btn.disabled) return;

      var iso = btn.getAttribute('data-date');
      var d = parseISO(iso);
      if (d) selectDate(d);
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard navigation                                              */
    /* ---------------------------------------------------------------- */

    NB.on(gridEl, 'keydown', function (e) {
      var focused = document.activeElement;
      if (!focused || !focused.classList.contains('nb-calendar__day')) return;

      var iso = focused.getAttribute('data-date');
      var d = parseISO(iso);
      if (!d) return;

      var newDate = null;

      switch (e.key) {
        case 'ArrowLeft':
        case 'Left':
          e.preventDefault();
          newDate = new Date(d);
          newDate.setDate(newDate.getDate() - 1);
          break;

        case 'ArrowRight':
        case 'Right':
          e.preventDefault();
          newDate = new Date(d);
          newDate.setDate(newDate.getDate() + 1);
          break;

        case 'ArrowUp':
        case 'Up':
          e.preventDefault();
          newDate = new Date(d);
          newDate.setDate(newDate.getDate() - 7);
          break;

        case 'ArrowDown':
        case 'Down':
          e.preventDefault();
          newDate = new Date(d);
          newDate.setDate(newDate.getDate() + 7);
          break;

        case 'Enter':
          e.preventDefault();
          if (!focused.disabled) selectDate(d);
          return;

        case 'Escape':
          e.preventDefault();
          focused.blur();
          return;

        default:
          return;
      }

      if (!newDate) return;
      newDate.setHours(0, 0, 0, 0);

      if (isDisabled(newDate)) return;

      // Adjust view if we crossed a month boundary
      if (newDate.getMonth() !== viewMonth || newDate.getFullYear() !== viewYear) {
        viewMonth = newDate.getMonth();
        viewYear = newDate.getFullYear();
        renderGrid();
      }

      // Focus the corresponding button
      var target = gridEl.querySelector('[data-date="' + toISO(newDate) + '"]');
      if (target) target.focus();
    });
  });

})(window.NB);


/* --- components/search.js --- */

/**
 * NB Search Component
 * Search input with debounced events, dropdown results, and keyboard navigation.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var DEBOUNCE_MS = 200;

  NB.register('search', function (el) {
    var input = NB.$('.nb-search__input', el);
    if (!input) return;

    var clearBtn = NB.$('.nb-search__clear', el);
    var resultsEl = NB.$('.nb-search__results', el);
    var shortcutEnabled = el.getAttribute('data-nb-search-shortcut') === 'true';

    var debounceTimer = null;

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function getResultItems() {
      return resultsEl ? NB.$$('.nb-search__result', resultsEl) : [];
    }

    function getFocusedIndex() {
      var items = getResultItems();
      for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains('is-focused')) return i;
      }
      return -1;
    }

    function clearFocus() {
      var items = getResultItems();
      items.forEach(function (item) {
        item.classList.remove('is-focused');
      });
    }

    function focusItem(index) {
      var items = getResultItems();
      if (!items.length) return;

      clearFocus();

      // Clamp index
      if (index < 0) index = items.length - 1;
      if (index >= items.length) index = 0;

      items[index].classList.add('is-focused');

      // Scroll into view if needed
      if (items[index].scrollIntoView) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Dropdown visibility                                              */
    /* ---------------------------------------------------------------- */

    function openDropdown() {
      if (!resultsEl) return;
      resultsEl.classList.add('is-open');

      // Show "No results" if the dropdown is empty
      var items = getResultItems();
      if (!items.length) {
        ensureEmptyMessage();
      } else {
        removeEmptyMessage();
      }
    }

    function closeDropdown() {
      if (!resultsEl) return;
      resultsEl.classList.remove('is-open');
      clearFocus();
    }

    function isOpen() {
      return resultsEl ? resultsEl.classList.contains('is-open') : false;
    }

    function ensureEmptyMessage() {
      if (!resultsEl) return;
      if (NB.$('.nb-search__empty', resultsEl)) return;

      var emptyEl = document.createElement('div');
      emptyEl.className = 'nb-search__empty';
      emptyEl.textContent = 'No results found';
      resultsEl.appendChild(emptyEl);
    }

    function removeEmptyMessage() {
      if (!resultsEl) return;
      var emptyEl = NB.$('.nb-search__empty', resultsEl);
      if (emptyEl && emptyEl.parentNode) {
        emptyEl.parentNode.removeChild(emptyEl);
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Clear button                                                     */
    /* ---------------------------------------------------------------- */

    function updateClearButton() {
      if (!clearBtn) return;
      if (input.value.length > 0) {
        clearBtn.classList.add('is-active');
      } else {
        clearBtn.classList.remove('is-active');
      }
    }

    // Initial state
    updateClearButton();

    if (clearBtn) {
      NB.on(clearBtn, 'click', function (e) {
        e.preventDefault();
        input.value = '';
        updateClearButton();
        closeDropdown();
        input.focus();

        NB.emit(el, 'nb:search-input', { query: '' });
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Debounced input                                                  */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'input', function () {
      updateClearButton();

      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(function () {
        var query = input.value;

        NB.emit(el, 'nb:search-input', { query: query });

        if (query.length > 0) {
          openDropdown();
        } else {
          closeDropdown();
        }
      }, DEBOUNCE_MS);
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard navigation                                              */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'keydown', function (e) {
      var items = getResultItems();

      switch (e.key) {
        case 'ArrowDown':
        case 'Down':
          e.preventDefault();
          if (!isOpen() && input.value.length > 0) {
            openDropdown();
          }
          if (items.length) {
            var downIdx = getFocusedIndex();
            focusItem(downIdx + 1);
          }
          break;

        case 'ArrowUp':
        case 'Up':
          e.preventDefault();
          if (items.length) {
            var upIdx = getFocusedIndex();
            focusItem(upIdx - 1);
          }
          break;

        case 'Enter':
          e.preventDefault();
          var enterIdx = getFocusedIndex();
          if (enterIdx >= 0 && items[enterIdx]) {
            var value = items[enterIdx].textContent;
            NB.emit(el, 'nb:search-select', { value: value, index: enterIdx });
            closeDropdown();
          }
          break;

        case 'Escape':
          if (isOpen()) {
            e.preventDefault();
            closeDropdown();
          }
          break;
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Result item click                                                */
    /* ---------------------------------------------------------------- */

    if (resultsEl) {
      NB.on(resultsEl, 'click', function (e) {
        var item = e.target.closest('.nb-search__result');
        if (!item) return;

        var items = getResultItems();
        var idx = items.indexOf(item);
        var value = item.textContent;

        NB.emit(el, 'nb:search-select', { value: value, index: idx });
        closeDropdown();
      });

      // Observe results container for child changes to manage empty state
      if (typeof MutationObserver !== 'undefined') {
        var observer = new MutationObserver(function () {
          if (!isOpen()) return;
          var items = getResultItems();
          if (!items.length) {
            ensureEmptyMessage();
          } else {
            removeEmptyMessage();
          }
        });
        observer.observe(resultsEl, { childList: true });
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Click outside                                                    */
    /* ---------------------------------------------------------------- */

    NB.on(document, 'click', function (e) {
      if (!el.contains(e.target) && isOpen()) {
        closeDropdown();
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard shortcut: Cmd+K / Ctrl+K                                */
    /* ---------------------------------------------------------------- */

    if (shortcutEnabled) {
      NB.on(document, 'keydown', function (e) {
        var isMac = navigator.platform.indexOf('Mac') > -1 ||
                    navigator.userAgent.indexOf('Mac') > -1;
        var modifier = isMac ? e.metaKey : e.ctrlKey;

        if (modifier && e.key === 'k') {
          e.preventDefault();
          input.focus();
          input.select();
        }
      });
    }
  });

})(window.NB);


/* --- components/drawer.js --- */

/**
 * NB Drawer Component
 * Accessible slide-over / drawer panels with focus trapping and keyboard support.
 * Triggered by buttons with [data-nb-drawer-open="drawer-id"].
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** @type {Object.<string, function>} release functions keyed by drawer id */
  var _traps = {};

  /** Stack of currently open drawer ids */
  var _openStack = [];

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Get or create the shared backdrop element.
   * @returns {HTMLElement}
   */
  function getBackdrop() {
    var backdrop = NB.$('[data-nb-drawer-backdrop]');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'nb-drawer-backdrop';
      backdrop.setAttribute('data-nb-drawer-backdrop', '');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }
    return backdrop;
  }

  /* ------------------------------------------------------------------ */
  /*  Open / Close                                                       */
  /* ------------------------------------------------------------------ */

  function open(id) {
    if (!id) return;
    id = id.replace(/^#/, '');

    var drawer = document.getElementById(id);
    if (!drawer) {
      console.warn('NB.drawer: element "#' + id + '" not found.');
      return;
    }

    if (_openStack.indexOf(id) !== -1) return; // already open

    var backdrop = getBackdrop();

    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('role', 'dialog');

    document.body.style.overflow = 'hidden';
    _openStack.push(id);

    // Trap focus
    _traps[id] = NB.trapFocus(drawer);

    NB.emit(drawer, 'nb:drawer-open', { id: id });
  }

  function close(id) {
    if (!id) return;
    id = id.replace(/^#/, '');

    var drawer = document.getElementById(id);
    var idx = _openStack.indexOf(id);
    if (idx === -1) return; // not open

    drawer && drawer.classList.remove('is-open');
    drawer && drawer.removeAttribute('aria-modal');

    _openStack.splice(idx, 1);

    // Release focus trap
    if (_traps[id]) {
      _traps[id]();
      delete _traps[id];
    }

    // Hide backdrop and restore body scroll only when no drawers remain open
    if (_openStack.length === 0) {
      var backdrop = getBackdrop();
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    drawer && NB.emit(drawer, 'nb:drawer-close', { id: id });
  }

  function closeAll() {
    // Close in reverse order (LIFO)
    var stack = _openStack.slice();
    for (var i = stack.length - 1; i >= 0; i--) {
      close(stack[i]);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Keyboard handler (Escape)                                          */
  /* ------------------------------------------------------------------ */

  NB.on(document, 'keydown', function (e) {
    if (e.key === 'Escape' && _openStack.length) {
      e.preventDefault();
      close(_openStack[_openStack.length - 1]);
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Registration                                                       */
  /* ------------------------------------------------------------------ */

  NB.register('drawer-open', function (btn) {
    var targetId = btn.getAttribute('data-nb-drawer-open');
    if (!targetId) return;

    btn.setAttribute('aria-haspopup', 'dialog');

    NB.on(btn, 'click', function (e) {
      e.preventDefault();
      open(targetId);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Delegated click handlers (close button & backdrop)                 */
  /* ------------------------------------------------------------------ */

  NB.on(document, 'click', function (e) {
    // Close button inside drawer
    var closeBtn = e.target.closest('[data-nb-drawer-close]');
    if (closeBtn) {
      e.preventDefault();
      var drawer = closeBtn.closest('.nb-drawer');
      if (drawer && drawer.id) {
        close(drawer.id);
      }
      return;
    }

    // Backdrop click
    var backdrop = e.target.closest('[data-nb-drawer-backdrop]');
    if (backdrop && e.target === backdrop && _openStack.length) {
      close(_openStack[_openStack.length - 1]);
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  NB.drawer = {
    open: open,
    close: close,
    closeAll: closeAll
  };

})(window.NB);


/* --- components/stepper.js --- */

/**
 * NB Stepper Component
 * Multi-step wizard with navigation, completion tracking, and step change events.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('stepper', function (el) {
    var steps = NB.$$('.nb-stepper__step', el);
    if (!steps.length) return;

    var total = steps.length;
    var activeIndex = parseInt(el.getAttribute('data-nb-stepper-active'), 10) || 1;

    // Clamp to valid range
    activeIndex = Math.max(1, Math.min(activeIndex, total));

    /* ---------------------------------------------------------------- */
    /*  State management                                                 */
    /* ---------------------------------------------------------------- */

    function applyState() {
      steps.forEach(function (step, i) {
        var stepNum = i + 1;

        step.classList.remove('is-active', 'is-completed');

        if (stepNum < activeIndex) {
          step.classList.add('is-completed');
        } else if (stepNum === activeIndex) {
          step.classList.add('is-active');
        }
        // Steps after activeIndex remain unstyled (pending)
      });
    }

    function goTo(stepNum) {
      stepNum = Math.max(1, Math.min(stepNum, total));
      if (stepNum === activeIndex) return;

      activeIndex = stepNum;
      el.setAttribute('data-nb-stepper-active', String(activeIndex));
      applyState();

      NB.emit(el, 'nb:stepper-change', { step: activeIndex, total: total });
    }

    /* ---------------------------------------------------------------- */
    /*  Initial state                                                    */
    /* ---------------------------------------------------------------- */

    applyState();

    /* ---------------------------------------------------------------- */
    /*  Click on completed step indicator to navigate back               */
    /* ---------------------------------------------------------------- */

    steps.forEach(function (step, i) {
      var indicator = NB.$('.nb-stepper__indicator', step);
      if (!indicator) return;

      NB.on(indicator, 'click', function () {
        // Only allow clicking completed steps
        if (step.classList.contains('is-completed')) {
          goTo(i + 1);
        }
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Listen for programmatic step changes                             */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'nb:stepper-goto', function (e) {
      var targetStep = e.detail && e.detail.step;
      if (typeof targetStep === 'number') {
        goTo(targetStep);
      }
    });
  });

})(window.NB);


/* --- components/tag-input.js --- */

/**
 * NB Tag Input Component
 * Interactive tag/chip creation with keyboard support, duplicates prevention,
 * and optional max-tag limit.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** Small X icon SVG used for the remove button */
  var REMOVE_SVG =
    '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
    '<line x1="2" y1="2" x2="8" y2="8"/>' +
    '<line x1="8" y1="2" x2="2" y2="8"/>' +
    '</svg>';

  NB.register('tag-input', function (el) {
    var input = NB.$('.nb-tag-input__input', el);
    if (!input) return;

    var maxTags = parseInt(el.getAttribute('data-nb-tag-input-max'), 10) || 0;
    var separator = el.getAttribute('data-nb-tag-input-separator') || ',';

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function getAllTags() {
      return NB.$$('.nb-tag-input__tag', el);
    }

    function getAllValues() {
      return getAllTags().map(function (tag) {
        return tag.getAttribute('data-nb-tag-value') || tag.textContent.trim();
      });
    }

    function isDuplicate(value) {
      var lower = value.toLowerCase();
      return getAllValues().some(function (v) {
        return v.toLowerCase() === lower;
      });
    }

    function isAtMax() {
      return maxTags > 0 && getAllTags().length >= maxTags;
    }

    /* ---------------------------------------------------------------- */
    /*  Create tag element                                               */
    /* ---------------------------------------------------------------- */

    function createTag(value) {
      var tag = document.createElement('span');
      tag.className = 'nb-tag-input__tag';
      tag.setAttribute('data-nb-tag-value', value);

      var text = document.createTextNode(value);
      tag.appendChild(text);

      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'nb-tag-input__tag-remove';
      removeBtn.setAttribute('aria-label', 'Remove ' + value);
      removeBtn.innerHTML = REMOVE_SVG;

      NB.on(removeBtn, 'click', function (e) {
        e.stopPropagation();
        removeTag(tag);
      });

      tag.appendChild(removeBtn);
      return tag;
    }

    /* ---------------------------------------------------------------- */
    /*  Add / Remove                                                     */
    /* ---------------------------------------------------------------- */

    function addTag(value) {
      value = value.trim();
      if (!value) return;
      if (isDuplicate(value)) return;
      if (isAtMax()) return;

      var tag = createTag(value);
      el.insertBefore(tag, input);

      NB.emit(el, 'nb:tag-add', { value: value, tags: getAllValues() });
    }

    function removeTag(tag) {
      var value = tag.getAttribute('data-nb-tag-value') || tag.textContent.trim();
      tag.parentNode.removeChild(tag);

      NB.emit(el, 'nb:tag-remove', { value: value, tags: getAllValues() });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard handling                                                */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'keydown', function (e) {
      var val = input.value;

      if (e.key === 'Enter') {
        e.preventDefault();
        addTag(val);
        input.value = '';
        return;
      }

      if (e.key === 'Backspace' && val === '') {
        var tags = getAllTags();
        if (tags.length) {
          removeTag(tags[tags.length - 1]);
        }
        return;
      }
    });

    /* Handle separator character (e.g. comma) */
    NB.on(input, 'input', function () {
      var val = input.value;

      if (separator && val.indexOf(separator) !== -1) {
        var parts = val.split(separator);
        for (var i = 0; i < parts.length - 1; i++) {
          addTag(parts[i]);
        }
        // Keep whatever is after the last separator for continued typing
        input.value = parts[parts.length - 1];
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Click on wrapper focuses input                                   */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      if (e.target === el) {
        input.focus();
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Wire up existing remove buttons (for pre-rendered tags)          */
    /* ---------------------------------------------------------------- */

    NB.$$('.nb-tag-input__tag-remove', el).forEach(function (btn) {
      var tag = btn.closest('.nb-tag-input__tag');
      if (!tag) return;

      NB.on(btn, 'click', function (e) {
        e.stopPropagation();
        removeTag(tag);
      });
    });
  });

})(window.NB);


/* --- components/code-block.js --- */

/**
 * NB Code Block Component
 * Copy-to-clipboard functionality for code blocks.
 * Optionally integrates with Prism.js for syntax highlighting.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('code-block', function (el) {
    var copyBtn = NB.$('.nb-code-block__copy', el);
    var codeEl = NB.$('code', el);

    if (!copyBtn || !codeEl) return;

    NB.on(copyBtn, 'click', function (e) {
      e.preventDefault();

      var text = codeEl.textContent;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showCopied();
        });
      } else {
        // Fallback for older browsers
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          showCopied();
        } catch (err) {
          console.warn('NB code-block: copy failed', err);
        }
        document.body.removeChild(textarea);
      }
    });

    function showCopied() {
      var original = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('is-copied');

      setTimeout(function () {
        copyBtn.textContent = original;
        copyBtn.classList.remove('is-copied');
      }, 2000);
    }
  });

})(window.NB);


/* --- components/json-viewer.js --- */

/**
 * NB JSON Viewer Component
 * Collapsible JSON tree viewer with syntax-colored primitives.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('json-viewer', function (el) {

    /* ---------------------------------------------------------------- */
    /*  Read JSON source                                                 */
    /* ---------------------------------------------------------------- */

    var raw = el.getAttribute('data-nb-json-viewer');

    if (!raw || raw === '' || raw === 'true') {
      var scriptEl = NB.$('script[type="application/json"]', el);
      if (scriptEl) {
        raw = scriptEl.textContent;
      } else {
        var dataEl = NB.$('.nb-json-viewer__data', el);
        if (dataEl) {
          raw = dataEl.textContent;
        }
      }
    }

    if (!raw) return;

    var data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.warn('NB json-viewer: invalid JSON', err);
      return;
    }

    /* ---------------------------------------------------------------- */
    /*  Clear source elements and build tree                             */
    /* ---------------------------------------------------------------- */

    el.innerHTML = '';
    el.classList.add('nb-json-viewer');

    var tree = buildNode(null, data, 0, false);
    el.appendChild(tree);

    /* ---------------------------------------------------------------- */
    /*  Build a single node                                              */
    /* ---------------------------------------------------------------- */

    function buildNode(key, value, depth, isLast) {
      var node = document.createElement('div');
      node.className = 'nb-json-node';

      var type = getType(value);

      if (type === 'object' || type === 'array') {
        buildCompoundNode(node, key, value, type, depth, isLast);
      } else {
        buildPrimitiveNode(node, key, value, type, isLast);
      }

      return node;
    }

    /* ---------------------------------------------------------------- */
    /*  Compound node (object / array)                                   */
    /* ---------------------------------------------------------------- */

    function buildCompoundNode(node, key, value, type, depth, isLast) {
      var openBracket = type === 'array' ? '[' : '{';
      var closeBracket = type === 'array' ? ']' : '}';
      var keys = Object.keys(value);
      var count = keys.length;
      var countLabel = type === 'array'
        ? count + ' item' + (count !== 1 ? 's' : '')
        : count + ' key' + (count !== 1 ? 's' : '');

      var collapsed = depth >= 2;

      /* --- Line with toggle, key, opening bracket --- */
      var line = document.createElement('div');
      line.className = 'nb-json-node__line';

      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nb-json-node__toggle';
      toggle.textContent = '\u25B6';
      if (collapsed) toggle.classList.add('is-collapsed');
      line.appendChild(toggle);

      if (key !== null) {
        var keySpan = document.createElement('span');
        keySpan.className = 'nb-json-node__key';
        keySpan.textContent = '"' + key + '"';
        line.appendChild(keySpan);

        var colon = document.createElement('span');
        colon.className = 'nb-json-node__colon';
        colon.textContent = ': ';
        line.appendChild(colon);
      }

      var bracket = document.createElement('span');
      bracket.className = 'nb-json-node__bracket';
      bracket.textContent = openBracket;
      line.appendChild(bracket);

      /* Collapsed count preview */
      var countSpan = document.createElement('span');
      countSpan.className = 'nb-json-node__count';
      countSpan.textContent = countLabel;
      if (!collapsed) countSpan.style.display = 'none';
      line.appendChild(countSpan);

      /* Collapsed closing bracket (inline) */
      var closeBracketCollapsed = document.createElement('span');
      closeBracketCollapsed.className = 'nb-json-node__bracket';
      closeBracketCollapsed.textContent = closeBracket;
      if (!collapsed) closeBracketCollapsed.style.display = 'none';
      line.appendChild(closeBracketCollapsed);

      /* Comma after collapsed inline bracket */
      if (!isLast) {
        var commaCollapsed = document.createElement('span');
        commaCollapsed.className = 'nb-json-node__comma';
        commaCollapsed.textContent = ',';
        if (!collapsed) commaCollapsed.style.display = 'none';
        line.appendChild(commaCollapsed);
      }

      node.appendChild(line);

      /* --- Children container --- */
      var children = document.createElement('div');
      children.className = 'nb-json-node__children';
      if (collapsed) children.classList.add('is-collapsed');

      for (var i = 0; i < keys.length; i++) {
        var childKey = type === 'array' ? null : keys[i];
        var childValue = value[keys[i]];
        var childIsLast = i === keys.length - 1;
        children.appendChild(buildNode(childKey, childValue, depth + 1, childIsLast));
      }

      node.appendChild(children);

      /* --- Closing bracket (expanded) --- */
      var closingLine = document.createElement('div');
      closingLine.className = 'nb-json-node__line nb-json-node__closing';

      var closingBracket = document.createElement('span');
      closingBracket.className = 'nb-json-node__bracket';
      closingBracket.textContent = closeBracket;
      closingLine.appendChild(closingBracket);

      if (!isLast) {
        var comma = document.createElement('span');
        comma.className = 'nb-json-node__comma';
        comma.textContent = ',';
        closingLine.appendChild(comma);
      }

      if (collapsed) closingLine.style.display = 'none';
      node.appendChild(closingLine);

      /* --- Toggle handler --- */
      NB.on(toggle, 'click', function () {
        var isNowCollapsed = !toggle.classList.contains('is-collapsed');

        toggle.classList.toggle('is-collapsed', isNowCollapsed);
        children.classList.toggle('is-collapsed', isNowCollapsed);

        countSpan.style.display = isNowCollapsed ? '' : 'none';
        closeBracketCollapsed.style.display = isNowCollapsed ? '' : 'none';
        closingLine.style.display = isNowCollapsed ? 'none' : '';

        if (commaCollapsed) {
          commaCollapsed.style.display = isNowCollapsed ? '' : 'none';
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Primitive node (string, number, boolean, null)                    */
    /* ---------------------------------------------------------------- */

    function buildPrimitiveNode(node, key, value, type, isLast) {
      var line = document.createElement('div');
      line.className = 'nb-json-node__line';

      if (key !== null) {
        var keySpan = document.createElement('span');
        keySpan.className = 'nb-json-node__key';
        keySpan.textContent = '"' + key + '"';
        line.appendChild(keySpan);

        var colon = document.createElement('span');
        colon.className = 'nb-json-node__colon';
        colon.textContent = ': ';
        line.appendChild(colon);
      }

      var valSpan = document.createElement('span');
      valSpan.className = 'nb-json-node__value nb-json-node__value--' + type;

      if (type === 'string') {
        valSpan.textContent = '"' + value + '"';
      } else if (type === 'null') {
        valSpan.textContent = 'null';
      } else {
        valSpan.textContent = String(value);
      }

      line.appendChild(valSpan);

      if (!isLast) {
        var comma = document.createElement('span');
        comma.className = 'nb-json-node__comma';
        comma.textContent = ',';
        line.appendChild(comma);
      }

      node.appendChild(line);
    }

    /* ---------------------------------------------------------------- */
    /*  Type helper                                                      */
    /* ---------------------------------------------------------------- */

    function getType(value) {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'array';
      return typeof value; // 'string', 'number', 'boolean', 'object'
    }
  });

})(window.NB);


/* --- components/kv-editor.js --- */

/**
 * NB Key-Value Editor Component
 * Editable key-value pair rows for headers, query params, etc.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** Small X icon SVG used for the remove button */
  var REMOVE_SVG =
    '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
    '<line x1="2" y1="2" x2="8" y2="8"/>' +
    '<line x1="8" y1="2" x2="2" y2="8"/>' +
    '</svg>';

  /* ------------------------------------------------------------------ */
  /*  Static API                                                         */
  /* ------------------------------------------------------------------ */

  NB.kvEditor = {};

  /**
   * Get current entries from a kv-editor element.
   * @param {HTMLElement|string} el — the element or its ID
   * @returns {Array<{key: string, value: string}>}
   */
  NB.kvEditor.getData = function (el) {
    if (typeof el === 'string') {
      el = document.getElementById(el);
    }
    if (!el) return [];

    return getEntries(el);
  };

  /* ------------------------------------------------------------------ */
  /*  Shared helpers                                                      */
  /* ------------------------------------------------------------------ */

  function getEntries(root) {
    var rows = NB.$$('.nb-kv-editor__row', root);
    var entries = [];

    rows.forEach(function (row) {
      var keyInput = NB.$('.nb-kv-editor__key', row);
      var valInput = NB.$('.nb-kv-editor__value', row);
      if (!keyInput || !valInput) return;

      var k = keyInput.value.trim();
      var v = valInput.value.trim();
      if (k || v) {
        entries.push({ key: k, value: v });
      }
    });

    return entries;
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  NB.register('kv-editor', function (el) {

    /* ---------------------------------------------------------------- */
    /*  Build initial DOM                                                */
    /* ---------------------------------------------------------------- */

    var body = NB.$('.nb-kv-editor__body', el);
    if (!body) {
      body = document.createElement('div');
      body.className = 'nb-kv-editor__body';
    }

    /* Parse initial data from attribute */
    var initialData = [];
    var dataAttr = el.getAttribute('data-nb-kv-editor-data');
    if (dataAttr) {
      try {
        initialData = JSON.parse(dataAttr);
      } catch (err) {
        console.warn('NB kv-editor: invalid JSON in data-nb-kv-editor-data', err);
      }
    }

    /* Check for existing rows already in the DOM */
    var existingRows = NB.$$('.nb-kv-editor__row', el);
    var hasExistingRows = existingRows.length > 0;

    /* Build wrapper */
    el.innerHTML = '';
    el.classList.add('nb-kv-editor');

    /* Header row */
    var header = document.createElement('div');
    header.className = 'nb-kv-editor__header';

    var headerKey = document.createElement('span');
    headerKey.className = 'nb-kv-editor__header-cell';
    headerKey.textContent = 'Key';
    header.appendChild(headerKey);

    var headerVal = document.createElement('span');
    headerVal.className = 'nb-kv-editor__header-cell';
    headerVal.textContent = 'Value';
    header.appendChild(headerVal);

    var headerDel = document.createElement('span');
    headerDel.className = 'nb-kv-editor__header-cell nb-kv-editor__header-cell--action';
    header.appendChild(headerDel);

    el.appendChild(header);
    el.appendChild(body);

    /* Populate from attribute data */
    if (initialData.length) {
      initialData.forEach(function (pair) {
        body.appendChild(createRow(pair.key || '', pair.value || ''));
      });
    } else if (hasExistingRows) {
      /* Re-attach existing rows, wiring up events */
      existingRows.forEach(function (row) {
        wireRow(row);
        body.appendChild(row);
      });
    }

    /* Add button */
    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'nb-kv-editor__add';
    addBtn.textContent = '+ Add';
    el.appendChild(addBtn);

    NB.on(addBtn, 'click', function () {
      var row = createRow('', '');
      body.appendChild(row);
      var keyInput = NB.$('.nb-kv-editor__key', row);
      if (keyInput) keyInput.focus();
    });

    /* ---------------------------------------------------------------- */
    /*  Create a row                                                     */
    /* ---------------------------------------------------------------- */

    function createRow(key, value) {
      var row = document.createElement('div');
      row.className = 'nb-kv-editor__row';

      var keyInput = document.createElement('input');
      keyInput.type = 'text';
      keyInput.className = 'nb-kv-editor__key';
      keyInput.placeholder = 'Key';
      keyInput.value = key;

      var valInput = document.createElement('input');
      valInput.type = 'text';
      valInput.className = 'nb-kv-editor__value';
      valInput.placeholder = 'Value';
      valInput.value = value;

      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'nb-kv-editor__remove';
      removeBtn.setAttribute('aria-label', 'Remove row');
      removeBtn.innerHTML = REMOVE_SVG;

      row.appendChild(keyInput);
      row.appendChild(valInput);
      row.appendChild(removeBtn);

      wireRow(row);

      return row;
    }

    /* ---------------------------------------------------------------- */
    /*  Wire events on a row                                             */
    /* ---------------------------------------------------------------- */

    function wireRow(row) {
      var keyInput = NB.$('.nb-kv-editor__key', row);
      var valInput = NB.$('.nb-kv-editor__value', row);
      var removeBtn = NB.$('.nb-kv-editor__remove', row);

      if (keyInput) {
        NB.on(keyInput, 'input', function () {
          emitChange();
        });

        NB.on(keyInput, 'keydown', function (e) {
          if (e.key === 'Backspace' && keyInput.value === '' && valInput && valInput.value === '') {
            e.preventDefault();
            removeRow(row);
          }
        });
      }

      if (valInput) {
        NB.on(valInput, 'input', function () {
          emitChange();
        });
      }

      if (removeBtn) {
        NB.on(removeBtn, 'click', function () {
          removeRow(row);
        });
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Remove a row                                                     */
    /* ---------------------------------------------------------------- */

    function removeRow(row) {
      if (row.parentNode) {
        row.parentNode.removeChild(row);
      }
      emitChange();
    }

    /* ---------------------------------------------------------------- */
    /*  Emit change event                                                */
    /* ---------------------------------------------------------------- */

    function emitChange() {
      NB.emit(el, 'nb:kv-change', { entries: getEntries(el) });
    }
  });

})(window.NB);


/* --- components/api-console.js --- */

/**
 * NB API Console Component
 * Console/log output panel with timestamped, level-colored entries.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Static API                                                         */
  /* ------------------------------------------------------------------ */

  NB.console = {};

  /**
   * Append a log entry to a console element.
   * @param {HTMLElement|string} el      — the console element or its ID
   * @param {string}             message — log text
   * @param {string}            [level]  — 'info' | 'warn' | 'error' | 'success' (default 'info')
   */
  NB.console.log = function (el, message, level) {
    if (typeof el === 'string') {
      el = document.getElementById(el);
    }
    if (!el) return;

    level = level || 'info';

    /* Remove empty-state message if present */
    var empty = NB.$('.nb-console__empty', el);
    if (empty) {
      empty.parentNode.removeChild(empty);
    }

    /* Build log line */
    var line = document.createElement('div');
    line.className = 'nb-console__line';

    var time = document.createElement('span');
    time.className = 'nb-console__time';
    time.textContent = formatTime();
    line.appendChild(time);

    var levelSpan = document.createElement('span');
    levelSpan.className = 'nb-console__level nb-console__level--' + level;
    levelSpan.textContent = level;
    line.appendChild(levelSpan);

    var msg = document.createElement('span');
    msg.className = 'nb-console__msg';
    msg.textContent = message;
    line.appendChild(msg);

    el.appendChild(line);

    /* Enforce max lines */
    var max = parseInt(el.getAttribute('data-nb-api-console-max'), 10);
    if (max > 0) {
      var lines = NB.$$('.nb-console__line', el);
      while (lines.length > max) {
        lines[0].parentNode.removeChild(lines[0]);
        lines.shift();
      }
    }

    /* Auto-scroll to bottom */
    el.scrollTop = el.scrollHeight;
  };

  /**
   * Clear all log entries from a console element.
   * @param {HTMLElement|string} el — the console element or its ID
   */
  NB.console.clear = function (el) {
    if (typeof el === 'string') {
      el = document.getElementById(el);
    }
    if (!el) return;

    var lines = NB.$$('.nb-console__line', el);
    lines.forEach(function (line) {
      line.parentNode.removeChild(line);
    });

    addEmptyState(el);
  };

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function formatTime() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  function addEmptyState(el) {
    var empty = document.createElement('div');
    empty.className = 'nb-console__empty';
    empty.textContent = 'No log entries.';
    el.appendChild(empty);
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  NB.register('api-console', function (el) {
    el.classList.add('nb-console');

    /* Add empty state if no children */
    if (!el.children.length) {
      addEmptyState(el);
    }
  });

})(window.NB);
