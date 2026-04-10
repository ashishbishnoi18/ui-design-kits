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
