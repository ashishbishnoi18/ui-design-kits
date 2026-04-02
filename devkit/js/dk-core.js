/**
 * DK Core -- DevKit UI
 * Core initialization system, DOM helpers, and accessibility utilities.
 * Adapted from NB UI Kit's nb-core.js pattern.
 * @version 0.1.0
 */
;(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Namespace                                                          */
  /* ------------------------------------------------------------------ */

  var DK = global.DK || {};

  DK.version = '0.1.0';

  /** @type {Object.<string, function(HTMLElement): void>} */
  DK._registry = {};

  /** WeakSet that tracks already-initialized elements */
  var _initialized = new WeakSet();

  /** Counter for unique IDs */
  var _uidCounter = 0;

  /* ------------------------------------------------------------------ */
  /*  Component registration & initialization                           */
  /* ------------------------------------------------------------------ */

  /**
   * Register a component initializer.
   * The name maps to elements with a `data-dk-<name>` attribute.
   * @param {string}   name   -- component name (matches data-dk-<name>)
   * @param {function} initFn -- called once per matching element
   */
  DK.register = function register(name, initFn) {
    if (typeof name !== 'string' || typeof initFn !== 'function') {
      throw new TypeError('DK.register(name: string, initFn: function)');
    }
    DK._registry[name] = initFn;
  };

  /**
   * Scan `root` for every registered `[data-dk-*]` component and
   * call the matching init function on each element.
   * Skips elements that have already been initialized (tracked via WeakSet).
   * @param {Document|HTMLElement} [root=document]
   */
  DK.init = function init(root) {
    root = root || document;

    var names = Object.keys(DK._registry);
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
  DK.initComponent = function initComponent(name, root) {
    root = root || document;
    if (!DK._registry[name]) {
      console.warn('DK: component "' + name + '" is not registered.');
      return;
    }
    _initByName(name, root);
  };

  /**
   * Internal -- find elements matching a single component name and init them.
   */
  function _initByName(name, root) {
    var fn = DK._registry[name];
    if (!fn) return;

    var selector = '[data-dk-' + name + ']';
    var els = root.querySelectorAll
      ? root.querySelectorAll(selector)
      : [];

    // If root itself matches the selector, include it
    if (root !== document && root.matches && root.matches(selector)) {
      _maybeInit(root, fn);
    }

    for (var i = 0; i < els.length; i++) {
      _maybeInit(els[i], fn);
    }
  }

  /**
   * Internal -- init a single element if it hasn't been initialized yet.
   * Prevents double-init via the _initialized WeakSet.
   */
  function _maybeInit(el, fn) {
    if (_initialized.has(el)) return;
    _initialized.add(el);
    try {
      fn(el);
    } catch (err) {
      console.error('DK: component init error', err);
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
  DK.$ = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  /**
   * Shortcut for querySelectorAll (returns a real Array).
   * @param {string}              selector
   * @param {Document|HTMLElement} [root=document]
   * @returns {HTMLElement[]}
   */
  DK.$$ = function (selector, root) {
    return Array.prototype.slice.call(
      (root || document).querySelectorAll(selector)
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Event helpers                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * addEventListener wrapper.
   * @param {HTMLElement}    el
   * @param {string}         event
   * @param {function}       handler
   * @param {Object|boolean} [options]
   */
  DK.on = function (el, event, handler, options) {
    el.addEventListener(event, handler, options || false);
  };

  /**
   * removeEventListener wrapper.
   * @param {HTMLElement} el
   * @param {string}      event
   * @param {function}    handler
   */
  DK.off = function (el, event, handler) {
    el.removeEventListener(event, handler);
  };

  /**
   * Dispatch a CustomEvent on `el` with bubbles and cancelable set to true.
   * @param {HTMLElement} el
   * @param {string}      eventName
   * @param {*}           [detail]
   */
  DK.emit = function (el, eventName, detail) {
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

  /** Selector for all natively focusable elements */
  var FOCUSABLE =
    'a[href], area[href], input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    'button:not([disabled]), iframe, object, embed, ' +
    '[tabindex]:not([tabindex="-1"]), [contenteditable]';

  /**
   * Trap keyboard focus inside `container`.
   * Returns a release function that removes the trap and restores
   * focus to the previously focused element.
   * @param {HTMLElement} container
   * @returns {function} release
   */
  DK.trapFocus = function (container) {
    var previouslyFocused = document.activeElement;

    function getFocusable() {
      return DK.$$(FOCUSABLE, container).filter(function (el) {
        return el.offsetParent !== null; // only visible elements
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

    DK.on(container, 'keydown', handleKeydown);

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
      DK.off(container, 'keydown', handleKeydown);
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    };
  };

  /* ------------------------------------------------------------------ */
  /*  Unique ID generator                                                */
  /* ------------------------------------------------------------------ */

  /**
   * Generate a unique ID string, useful for ARIA attributes and
   * linking labels to inputs.
   * @param {string} [prefix='dk']
   * @returns {string}
   */
  DK.uid = function (prefix) {
    _uidCounter += 1;
    return (prefix || 'dk') + '-' + _uidCounter;
  };

  /* ------------------------------------------------------------------ */
  /*  Auto-init on DOMContentLoaded                                      */
  /* ------------------------------------------------------------------ */

  function onReady() {
    DK.init(document);
    _observeMutations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    // DOM already ready (script loaded async / deferred)
    onReady();
  }

  /* ------------------------------------------------------------------ */
  /*  MutationObserver -- auto-init dynamically added nodes              */
  /* ------------------------------------------------------------------ */

  function _observeMutations() {
    if (typeof MutationObserver === 'undefined') return;

    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          // Init any registered components in the added subtree
          DK.init(node);
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

  global.DK = DK;
})(typeof window !== 'undefined' ? window : this);
