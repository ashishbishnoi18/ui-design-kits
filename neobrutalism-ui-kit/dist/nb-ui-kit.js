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


/* --- components/toggle.js --- */

/**
 * NB Toggle Component
 * Manages toggle/switch state and emits change events.
 *
 * Usage:
 *   <label class="nb-toggle" data-nb-toggle>
 *     <input class="nb-toggle_input" type="checkbox">
 *     <span class="nb-toggle_track">
 *       <span class="nb-toggle_thumb"></span>
 *     </span>
 *     <span class="nb-toggle_label">Label</span>
 *   </label>
 *
 * Events:
 *   nb:toggle-change — detail: { checked: boolean }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('toggle', function (el) {
    var input = el.querySelector('.nb-toggle_input');
    if (!input) return;

    /* Ensure ARIA role */
    if (!input.getAttribute('role')) {
      input.setAttribute('role', 'switch');
    }
    input.setAttribute('aria-checked', String(input.checked));

    /* ---------------------------------------------------------------- */
    /*  Change handler                                                   */
    /* ---------------------------------------------------------------- */

    function onChange() {
      input.setAttribute('aria-checked', String(input.checked));
      NB.emit(el, 'nb:toggle-change', { checked: input.checked });
    }

    NB.on(input, 'change', onChange);
  });

})(window.NB);


/* --- components/select.js --- */

/**
 * NB Select Component
 * Custom dropdown select with keyboard navigation, search filtering,
 * and full ARIA support.
 *
 * Usage:
 *   <div class="nb-select" data-nb-select>
 *     <button class="nb-select_trigger" type="button" aria-haspopup="listbox">
 *       <span class="nb-select_value">Choose...</span>
 *       <svg class="nb-select_chevron">...</svg>
 *     </button>
 *     <div class="nb-select_menu" role="listbox">
 *       <input class="nb-select_search" type="text" placeholder="Search...">
 *       <div class="nb-select_option" role="option" data-value="a">Option A</div>
 *       <div class="nb-select_option" role="option" data-value="b">Option B</div>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:select-change — detail: { value: string, label: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('select', function (el) {
    var trigger = el.querySelector('.nb-select_trigger');
    var menu    = el.querySelector('.nb-select_menu');
    var search  = el.querySelector('.nb-select_search');
    var valueEl = el.querySelector('.nb-select_value');

    if (!trigger || !menu) return;

    var options     = [];
    var focusIndex  = -1;
    var isOpen      = false;
    var placeholder = valueEl ? valueEl.textContent : '';

    /* ---------------------------------------------------------------- */
    /*  Gather options                                                   */
    /* ---------------------------------------------------------------- */

    function refreshOptions() {
      options = NB.$$('.nb-select_option:not(.is-hidden)', menu);
    }

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    var menuId = menu.id || NB.uid('nb-select-menu');
    menu.id = menuId;
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', menuId);
    menu.setAttribute('role', 'listbox');

    var allOptions = NB.$$('.nb-select_option', menu);
    allOptions.forEach(function (opt, i) {
      opt.setAttribute('role', 'option');
      if (!opt.id) opt.id = NB.uid('nb-select-opt');
      opt.setAttribute('aria-selected', 'false');
    });

    /* ---------------------------------------------------------------- */
    /*  Open / Close                                                     */
    /* ---------------------------------------------------------------- */

    function open() {
      if (isOpen) return;
      isOpen = true;
      menu.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      refreshOptions();
      focusIndex = -1;

      /* Highlight active option if one exists */
      var active = menu.querySelector('.nb-select_option.is-active');
      if (active) {
        var idx = options.indexOf(active);
        if (idx >= 0) setFocus(idx);
      }

      if (search) {
        search.value = '';
        filterOptions('');
        search.focus();
      }

      NB.on(document, 'click', onOutsideClick, true);
      NB.on(document, 'keydown', onKeydown);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      menu.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      focusIndex = -1;
      clearFocus();
      trigger.focus();
      NB.off(document, 'click', onOutsideClick, true);
      NB.off(document, 'keydown', onKeydown);
    }

    function toggle() {
      isOpen ? close() : open();
    }

    /* ---------------------------------------------------------------- */
    /*  Focus management                                                 */
    /* ---------------------------------------------------------------- */

    function clearFocus() {
      options.forEach(function (opt) {
        opt.classList.remove('is-focused');
      });
      trigger.removeAttribute('aria-activedescendant');
    }

    function setFocus(idx) {
      clearFocus();
      if (idx < 0 || idx >= options.length) return;
      focusIndex = idx;
      options[idx].classList.add('is-focused');
      trigger.setAttribute('aria-activedescendant', options[idx].id);

      /* Scroll into view */
      options[idx].scrollIntoView({ block: 'nearest' });
    }

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function selectOption(opt) {
      /* Clear previous active */
      allOptions.forEach(function (o) {
        o.classList.remove('is-active');
        o.setAttribute('aria-selected', 'false');
      });

      opt.classList.add('is-active');
      opt.setAttribute('aria-selected', 'true');

      var value = opt.getAttribute('data-value') || opt.textContent.trim();
      var label = opt.textContent.trim();

      if (valueEl) {
        valueEl.textContent = label;
        valueEl.classList.remove('nb-select_placeholder');
      }

      close();
      NB.emit(el, 'nb:select-change', { value: value, label: label });
    }

    /* ---------------------------------------------------------------- */
    /*  Search / filter                                                  */
    /* ---------------------------------------------------------------- */

    function filterOptions(query) {
      var q = query.toLowerCase().trim();

      allOptions.forEach(function (opt) {
        var text = opt.textContent.toLowerCase();
        if (q === '' || text.indexOf(q) !== -1) {
          opt.classList.remove('is-hidden');
        } else {
          opt.classList.add('is-hidden');
        }
      });

      refreshOptions();
      focusIndex = -1;

      /* Show/hide empty message */
      var empty = menu.querySelector('.nb-select_empty');
      if (empty) {
        empty.style.display = options.length === 0 ? 'block' : 'none';
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Event handlers                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(trigger, 'click', function (e) {
      e.preventDefault();
      toggle();
    });

    /* Keyboard on trigger when closed */
    NB.on(trigger, 'keydown', function (e) {
      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        open();
      }
    });

    /* Option clicks */
    NB.on(menu, 'click', function (e) {
      var opt = e.target.closest('.nb-select_option');
      if (opt && !opt.classList.contains('is-hidden')) {
        selectOption(opt);
      }
    });

    /* Search input */
    if (search) {
      NB.on(search, 'input', function () {
        filterOptions(search.value);
      });

      /* Prevent search keystrokes from bubbling to trigger close */
      NB.on(search, 'keydown', function (e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          close();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          refreshOptions();
          if (options.length > 0) setFocus(0);
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          refreshOptions();
          if (focusIndex >= 0 && focusIndex < options.length) {
            selectOption(options[focusIndex]);
          }
          return;
        }
        /* Let other keys pass through for typing */
        e.stopPropagation();
      });
    }

    /* Global keyboard when open */
    function onKeydown(e) {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          close();
          break;

        case 'ArrowDown':
          e.preventDefault();
          refreshOptions();
          if (options.length === 0) break;
          setFocus(focusIndex < options.length - 1 ? focusIndex + 1 : 0);
          break;

        case 'ArrowUp':
          e.preventDefault();
          refreshOptions();
          if (options.length === 0) break;
          setFocus(focusIndex > 0 ? focusIndex - 1 : options.length - 1);
          break;

        case 'Enter':
          e.preventDefault();
          if (focusIndex >= 0 && focusIndex < options.length) {
            selectOption(options[focusIndex]);
          }
          break;

        case 'Home':
          e.preventDefault();
          refreshOptions();
          if (options.length > 0) setFocus(0);
          break;

        case 'End':
          e.preventDefault();
          refreshOptions();
          if (options.length > 0) setFocus(options.length - 1);
          break;
      }
    }

    /* Click outside to close */
    function onOutsideClick(e) {
      if (!el.contains(e.target)) {
        close();
      }
    }
  });

})(window.NB);


/* --- components/search.js --- */

/**
 * NB Search Component
 * Manages clear button visibility, clear-on-click, and Cmd+K / Ctrl+K
 * keyboard shortcut to focus the search input.
 *
 * Usage:
 *   <div class="nb-search" data-nb-search>
 *     <span class="nb-search_icon">
 *       <svg>...</svg>
 *     </span>
 *     <input class="nb-search_input" type="text" placeholder="Search...">
 *     <button class="nb-search_clear" type="button" aria-label="Clear search">
 *       <svg>...</svg>
 *     </button>
 *     <span class="nb-search_shortcut">&#8984;K</span>
 *   </div>
 *
 * Events:
 *   nb:search-clear — fired when the input is cleared
 *   nb:search-focus — fired when focused via keyboard shortcut
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('search', function (el) {
    var input = el.querySelector('.nb-search_input');
    var clear = el.querySelector('.nb-search_clear');

    if (!input) return;

    /* ---------------------------------------------------------------- */
    /*  Clear button visibility                                          */
    /* ---------------------------------------------------------------- */

    function updateClearVisibility() {
      if (!clear) return;
      if (input.value.length > 0) {
        clear.classList.add('is-visible');
      } else {
        clear.classList.remove('is-visible');
      }
    }

    NB.on(input, 'input', updateClearVisibility);

    /* Set initial state */
    updateClearVisibility();

    /* ---------------------------------------------------------------- */
    /*  Clear on click                                                   */
    /* ---------------------------------------------------------------- */

    if (clear) {
      NB.on(clear, 'click', function (e) {
        e.preventDefault();
        input.value = '';
        updateClearVisibility();
        input.focus();
        NB.emit(el, 'nb:search-clear');
        /* Also trigger an input event so consumers can react */
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Cmd+K / Ctrl+K shortcut to focus                                 */
    /* ---------------------------------------------------------------- */

    function onGlobalKeydown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        input.focus();
        input.select();
        NB.emit(el, 'nb:search-focus');
      }
    }

    NB.on(document, 'keydown', onGlobalKeydown);

    /* ---------------------------------------------------------------- */
    /*  Escape to blur                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'keydown', function (e) {
      if (e.key === 'Escape') {
        input.blur();
      }
    });

    /* Return cleanup for NB.destroy() */
    return function () {
      NB.off(document, 'keydown', onGlobalKeydown);
    };
  });

})(window.NB);


/* --- components/password-toggle.js --- */

/**
 * NB Password Toggle Component
 * Toggles password input visibility between 'password' and 'text'.
 * Updates the toggle icon to reflect the current state.
 *
 * Usage:
 *   <div class="nb-password" data-nb-password>
 *     <input class="nb-password_input" type="password" placeholder="Password">
 *     <button class="nb-password_toggle" type="button" aria-label="Show password">
 *       <svg class="nb-password_icon-show"><!-- eye icon --></svg>
 *       <svg class="nb-password_icon-hide" style="display:none"><!-- eye-off icon --></svg>
 *     </button>
 *   </div>
 *
 * Events:
 *   nb:password-toggle — detail: { visible: boolean }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('password', function (el) {
    var input    = el.querySelector('.nb-password_input');
    var toggleEl = el.querySelector('.nb-password_toggle');

    if (!input || !toggleEl) return;

    var iconShow = el.querySelector('.nb-password_icon-show');
    var iconHide = el.querySelector('.nb-password_icon-hide');

    /* ---------------------------------------------------------------- */
    /*  State                                                            */
    /* ---------------------------------------------------------------- */

    var isVisible = false;

    function updateState() {
      if (isVisible) {
        input.type = 'text';
        toggleEl.setAttribute('aria-label', 'Hide password');
        if (iconShow) iconShow.style.display = 'none';
        if (iconHide) iconHide.style.display = '';
      } else {
        input.type = 'password';
        toggleEl.setAttribute('aria-label', 'Show password');
        if (iconShow) iconShow.style.display = '';
        if (iconHide) iconHide.style.display = 'none';
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Toggle handler                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(toggleEl, 'click', function (e) {
      e.preventDefault();
      isVisible = !isVisible;
      updateState();
      input.focus();
      NB.emit(el, 'nb:password-toggle', { visible: isVisible });
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard: Enter/Space on toggle button                           */
    /* ---------------------------------------------------------------- */

    NB.on(toggleEl, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        isVisible = !isVisible;
        updateState();
        input.focus();
        NB.emit(el, 'nb:password-toggle', { visible: isVisible });
      }
    });

    /* Set initial state */
    updateState();
  });

})(window.NB);


/* --- components/range.js --- */

/**
 * NB Range Component
 * Updates value display and track fill width on input.
 * Emits nb:range-change events.
 *
 * Usage:
 *   <div class="nb-range" data-nb-range>
 *     <div class="nb-range_label-row">
 *       <span>Volume</span>
 *       <span class="nb-range_value">50</span>
 *     </div>
 *     <div class="nb-range_track">
 *       <input class="nb-range_input" type="range" min="0" max="100" value="50">
 *       <div class="nb-range_track-fill"></div>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:range-change — detail: { value: number, min: number, max: number, percent: number }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('range', function (el) {
    var input     = el.querySelector('.nb-range_input');
    var valueEl   = el.querySelector('.nb-range_value');
    var trackFill = el.querySelector('.nb-range_track-fill');

    if (!input) return;

    /* ---------------------------------------------------------------- */
    /*  Calculate percentage                                             */
    /* ---------------------------------------------------------------- */

    function getPercent() {
      var min = parseFloat(input.min) || 0;
      var max = parseFloat(input.max) || 100;
      var val = parseFloat(input.value) || 0;
      if (max === min) return 0;
      return ((val - min) / (max - min)) * 100;
    }

    /* ---------------------------------------------------------------- */
    /*  Update display                                                   */
    /* ---------------------------------------------------------------- */

    function update() {
      var pct = getPercent();

      /* Update value text */
      if (valueEl) {
        valueEl.textContent = input.value;
      }

      /* Update track fill width */
      if (trackFill) {
        trackFill.style.width = pct + '%';
      }

      /* ARIA */
      input.setAttribute('aria-valuenow', input.value);
      input.setAttribute('aria-valuemin', input.min || '0');
      input.setAttribute('aria-valuemax', input.max || '100');
    }

    /* ---------------------------------------------------------------- */
    /*  Event handlers                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'input', function () {
      update();
      NB.emit(el, 'nb:range-change', {
        value: parseFloat(input.value),
        min: parseFloat(input.min) || 0,
        max: parseFloat(input.max) || 100,
        percent: getPercent()
      });
    });

    /* Also handle programmatic changes */
    NB.on(input, 'change', function () {
      update();
    });

    /* Set initial state */
    update();
  });

})(window.NB);


/* --- components/checkbox.js --- */

/**
 * NB Checkbox Component
 * Handles label click forwarding and emits change events.
 *
 * Usage:
 *   <label class="nb-checkbox" data-nb-checkbox>
 *     <input class="nb-checkbox_input" type="checkbox">
 *     <span class="nb-checkbox_box"></span>
 *     <span class="nb-checkbox_label">Remember me</span>
 *   </label>
 *
 * Events:
 *   nb:checkbox-change — detail: { checked: boolean }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('checkbox', function (el) {
    var input = el.querySelector('.nb-checkbox_input');
    if (!input) return;

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    var labelEl = el.querySelector('.nb-checkbox_label');
    if (labelEl && !input.getAttribute('aria-label') && !input.id) {
      var labelId = NB.uid('nb-checkbox-label');
      labelEl.id = labelId;
      input.setAttribute('aria-labelledby', labelId);
    }

    /* ---------------------------------------------------------------- */
    /*  Change handler                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'change', function () {
      NB.emit(el, 'nb:checkbox-change', { checked: input.checked });
    });

    /* ---------------------------------------------------------------- */
    /*  Label click forwarding                                           */
    /*  If the wrapper isn't a <label>, forward clicks to the input      */
    /* ---------------------------------------------------------------- */

    if (el.tagName.toLowerCase() !== 'label') {
      NB.on(el, 'click', function (e) {
        /* Don't double-toggle if the click was on the input itself */
        if (e.target === input) return;
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  });

})(window.NB);


/* --- components/radio.js --- */

/**
 * NB Radio Component
 * Handles radio group behavior and emits change events.
 *
 * Usage:
 *   <label class="nb-radio" data-nb-radio>
 *     <input class="nb-radio_input" type="radio" name="group" value="a">
 *     <span class="nb-radio_circle"></span>
 *     <span class="nb-radio_label">Option A</span>
 *   </label>
 *   <label class="nb-radio" data-nb-radio>
 *     <input class="nb-radio_input" type="radio" name="group" value="b">
 *     <span class="nb-radio_circle"></span>
 *     <span class="nb-radio_label">Option B</span>
 *   </label>
 *
 * Events:
 *   nb:radio-change — detail: { value: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('radio', function (el) {
    var input = el.querySelector('.nb-radio_input');
    if (!input) return;

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    var labelEl = el.querySelector('.nb-radio_label');
    if (labelEl && !input.getAttribute('aria-label') && !input.id) {
      var labelId = NB.uid('nb-radio-label');
      labelEl.id = labelId;
      input.setAttribute('aria-labelledby', labelId);
    }

    /* ---------------------------------------------------------------- */
    /*  Change handler                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'change', function () {
      if (input.checked) {
        NB.emit(el, 'nb:radio-change', { value: input.value });
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Label click forwarding                                           */
    /*  If the wrapper isn't a <label>, forward clicks to the input      */
    /* ---------------------------------------------------------------- */

    if (el.tagName.toLowerCase() !== 'label') {
      NB.on(el, 'click', function (e) {
        if (e.target === input) return;
        if (!input.checked) {
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard: Arrow keys for radio group navigation                  */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' &&
          e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        return;
      }

      var name = input.name;
      if (!name) return;

      e.preventDefault();

      /* Get all radios in the same group */
      var radios = NB.$$('.nb-radio_input[name="' + name + '"]');
      if (radios.length <= 1) return;

      var currentIndex = radios.indexOf(input);
      var nextIndex;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        nextIndex = currentIndex < radios.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : radios.length - 1;
      }

      var nextRadio = radios[nextIndex];
      if (nextRadio && !nextRadio.disabled) {
        nextRadio.checked = true;
        nextRadio.focus();
        nextRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

})(window.NB);


/* --- components/file-upload.js --- */

/**
 * NB File Upload Component
 * Drag-and-drop file upload with file list management.
 *
 * Usage:
 *   <div class="nb-file-upload" data-nb-file-upload>
 *     <div class="nb-file-upload_zone">
 *       <span class="nb-file-upload_label"><strong>Click to upload</strong> or drag and drop</span>
 *       <span class="nb-file-upload_hint">PNG, JPG up to 10MB</span>
 *       <input class="nb-file-upload_input" type="file" multiple>
 *     </div>
 *     <div class="nb-file-upload_list"></div>
 *   </div>
 *
 * Data attributes:
 *   data-nb-file-upload       — activates component
 *   data-nb-accept="image/*"  — accepted file types (maps to input accept)
 *   data-nb-max-size="10485760" — max file size in bytes
 *
 * Events:
 *   nb:file-add    — detail: { file: File }
 *   nb:file-remove — detail: { fileName: string }
 *   nb:files-change — detail: { files: File[] }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('file-upload', function (el) {
    var zone   = el.querySelector('.nb-file-upload_zone');
    var input  = el.querySelector('.nb-file-upload_input');
    var list   = el.querySelector('.nb-file-upload_list');

    if (!zone || !input) return;

    var files   = [];
    var accept  = el.getAttribute('data-nb-accept') || '';
    var maxSize = parseInt(el.getAttribute('data-nb-max-size'), 10) || 0;

    if (accept) input.setAttribute('accept', accept);

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function updateState() {
      if (files.length > 0) {
        el.classList.add('has-files');
      } else {
        el.classList.remove('has-files');
      }
    }

    function renderList() {
      if (!list) return;
      list.innerHTML = '';

      files.forEach(function (file, idx) {
        var row = document.createElement('div');
        row.className = 'nb-file-upload_file';

        var name = document.createElement('span');
        name.className = 'nb-file-upload_file-name';
        name.textContent = file.name;

        var size = document.createElement('span');
        size.className = 'nb-file-upload_file-size';
        size.textContent = formatSize(file.size);

        var remove = document.createElement('button');
        remove.className = 'nb-file-upload_file-remove';
        remove.type = 'button';
        remove.textContent = '\u00d7';
        remove.setAttribute('aria-label', 'Remove ' + file.name);
        remove.setAttribute('data-index', idx);

        row.appendChild(name);
        row.appendChild(size);
        row.appendChild(remove);
        list.appendChild(row);
      });

      updateState();
    }

    function addFiles(newFiles) {
      for (var i = 0; i < newFiles.length; i++) {
        var file = newFiles[i];

        /* Check max size */
        if (maxSize && file.size > maxSize) continue;

        /* Skip duplicates by name + size */
        var dup = false;
        for (var j = 0; j < files.length; j++) {
          if (files[j].name === file.name && files[j].size === file.size) {
            dup = true;
            break;
          }
        }
        if (dup) continue;

        files.push(file);
        NB.emit(el, 'nb:file-add', { file: file });
      }

      renderList();
      NB.emit(el, 'nb:files-change', { files: files.slice() });
    }

    function removeFile(idx) {
      var removed = files.splice(idx, 1)[0];
      if (removed) {
        NB.emit(el, 'nb:file-remove', { fileName: removed.name });
      }
      renderList();
      NB.emit(el, 'nb:files-change', { files: files.slice() });
    }

    /* ---------------------------------------------------------------- */
    /*  Click to open file dialog                                        */
    /* ---------------------------------------------------------------- */

    NB.on(zone, 'click', function (e) {
      if (e.target.closest('.nb-file-upload_input')) return;
      input.click();
    });

    NB.on(input, 'change', function () {
      if (input.files && input.files.length) {
        addFiles(input.files);
      }
      /* Reset so same file can be re-selected */
      input.value = '';
    });

    /* ---------------------------------------------------------------- */
    /*  Drag and drop                                                    */
    /* ---------------------------------------------------------------- */

    var dragCounter = 0;

    NB.on(zone, 'dragenter', function (e) {
      e.preventDefault();
      dragCounter++;
      el.classList.add('is-dragover');
    });

    NB.on(zone, 'dragleave', function (e) {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        el.classList.remove('is-dragover');
      }
    });

    NB.on(zone, 'dragover', function (e) {
      e.preventDefault();
    });

    NB.on(zone, 'drop', function (e) {
      e.preventDefault();
      dragCounter = 0;
      el.classList.remove('is-dragover');

      if (e.dataTransfer && e.dataTransfer.files.length) {
        addFiles(e.dataTransfer.files);
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Remove button clicks (delegated)                                 */
    /* ---------------------------------------------------------------- */

    if (list) {
      NB.on(list, 'click', function (e) {
        var btn = e.target.closest('.nb-file-upload_file-remove');
        if (!btn) return;
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        if (!isNaN(idx)) removeFile(idx);
      });
    }
  });

})(window.NB);


/* --- components/tag-input.js --- */

/**
 * NB Tag Input Component
 * Chip-style tag input with add/remove and keyboard support.
 *
 * Usage:
 *   <div class="nb-tag-input" data-nb-tag-input>
 *     <input class="nb-tag-input_field" type="text" placeholder="Add tag...">
 *   </div>
 *
 * Data attributes:
 *   data-nb-tag-input           — activates component
 *   data-nb-max="10"            — maximum number of tags
 *   data-nb-duplicates="false"  — allow duplicate tags (default false)
 *
 * Events:
 *   nb:tag-add    — detail: { tag: string, tags: string[] }
 *   nb:tag-remove — detail: { tag: string, tags: string[] }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('tag-input', function (el) {
    var field = el.querySelector('.nb-tag-input_field');
    if (!field) return;

    var tags      = [];
    var max       = parseInt(el.getAttribute('data-nb-max'), 10) || 0;
    var allowDups = el.getAttribute('data-nb-duplicates') === 'true';

    /* ---------------------------------------------------------------- */
    /*  Rendering                                                        */
    /* ---------------------------------------------------------------- */

    function render() {
      /* Remove existing tag elements */
      var existing = NB.$$('.nb-tag-input_tag', el);
      existing.forEach(function (t) { t.remove(); });

      /* Insert tags before the input field */
      tags.forEach(function (tag, idx) {
        var chip = document.createElement('span');
        chip.className = 'nb-tag-input_tag';

        var text = document.createElement('span');
        text.className = 'nb-tag-input_tag-text';
        text.textContent = tag;

        var remove = document.createElement('button');
        remove.className = 'nb-tag-input_tag-remove';
        remove.type = 'button';
        remove.textContent = '\u00d7';
        remove.setAttribute('aria-label', 'Remove ' + tag);
        remove.setAttribute('data-index', idx);

        chip.appendChild(text);
        chip.appendChild(remove);
        el.insertBefore(chip, field);
      });

      /* Hide input if max reached */
      if (max && tags.length >= max) {
        field.style.display = 'none';
      } else {
        field.style.display = '';
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Add / Remove                                                     */
    /* ---------------------------------------------------------------- */

    function addTag(value) {
      var tag = value.trim();
      if (!tag) return;

      /* Check max */
      if (max && tags.length >= max) return;

      /* Check duplicates */
      if (!allowDups) {
        var lower = tag.toLowerCase();
        for (var i = 0; i < tags.length; i++) {
          if (tags[i].toLowerCase() === lower) return;
        }
      }

      tags.push(tag);
      render();
      NB.emit(el, 'nb:tag-add', { tag: tag, tags: tags.slice() });
    }

    function removeTag(idx) {
      if (idx < 0 || idx >= tags.length) return;
      var removed = tags.splice(idx, 1)[0];
      render();
      NB.emit(el, 'nb:tag-remove', { tag: removed, tags: tags.slice() });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard handling                                                */
    /* ---------------------------------------------------------------- */

    NB.on(field, 'keydown', function (e) {
      var val = field.value;

      /* Enter or comma to add tag */
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        var raw = val.replace(/,/g, '');
        addTag(raw);
        field.value = '';
        return;
      }

      /* Backspace on empty input removes last tag */
      if (e.key === 'Backspace' && val === '' && tags.length > 0) {
        removeTag(tags.length - 1);
        return;
      }
    });

    /* Also handle pasting comma-separated values */
    NB.on(field, 'paste', function (e) {
      var pasted = (e.clipboardData || window.clipboardData).getData('text');
      if (pasted.indexOf(',') !== -1) {
        e.preventDefault();
        var parts = pasted.split(',');
        parts.forEach(function (p) { addTag(p); });
        field.value = '';
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Click to focus input                                             */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      if (e.target.closest('.nb-tag-input_tag-remove')) return;
      field.focus();
    });

    /* ---------------------------------------------------------------- */
    /*  Remove button clicks (delegated)                                 */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var btn = e.target.closest('.nb-tag-input_tag-remove');
      if (!btn) return;
      var idx = parseInt(btn.getAttribute('data-index'), 10);
      if (!isNaN(idx)) removeTag(idx);
    });

    /* ---------------------------------------------------------------- */
    /*  Initialize from existing tag elements                            */
    /* ---------------------------------------------------------------- */

    var initialTags = NB.$$('.nb-tag-input_tag', el);
    initialTags.forEach(function (chip) {
      var text = chip.querySelector('.nb-tag-input_tag-text');
      if (text) tags.push(text.textContent.trim());
    });
    if (initialTags.length) render();
  });

})(window.NB);


/* --- components/number-input.js --- */

/**
 * NB Number Input Component
 * Numeric stepper with increment/decrement buttons and keyboard support.
 *
 * Usage:
 *   <div class="nb-number-input" data-nb-number-input>
 *     <button class="nb-number-input_btn" type="button" data-nb-action="decrement">&minus;</button>
 *     <input class="nb-number-input_field" type="number" value="0">
 *     <button class="nb-number-input_btn" type="button" data-nb-action="increment">+</button>
 *   </div>
 *
 * Data attributes:
 *   data-nb-number-input   — activates component
 *   data-nb-min="0"        — minimum value
 *   data-nb-max="100"      — maximum value
 *   data-nb-step="1"       — step increment
 *
 * Events:
 *   nb:number-change — detail: { value: number }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('number-input', function (el) {
    var field   = el.querySelector('.nb-number-input_field');
    var btnDec  = el.querySelector('[data-nb-action="decrement"]');
    var btnInc  = el.querySelector('[data-nb-action="increment"]');

    if (!field) return;

    var min  = parseFloat(el.getAttribute('data-nb-min'));
    var max  = parseFloat(el.getAttribute('data-nb-max'));
    var step = parseFloat(el.getAttribute('data-nb-step')) || 1;

    var hasMin = !isNaN(min);
    var hasMax = !isNaN(max);

    /* Sync native attributes */
    if (hasMin) field.setAttribute('min', min);
    if (hasMax) field.setAttribute('max', max);
    field.setAttribute('step', step);

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function getValue() {
      var v = parseFloat(field.value);
      return isNaN(v) ? 0 : v;
    }

    function clamp(val) {
      if (hasMin && val < min) return min;
      if (hasMax && val > max) return max;
      return val;
    }

    function setValue(val) {
      var clamped = clamp(val);
      /* Round to step precision to avoid floating point issues */
      var decimals = (String(step).split('.')[1] || '').length;
      field.value = clamped.toFixed(decimals);
      NB.emit(el, 'nb:number-change', { value: clamped });
    }

    function increment() {
      setValue(getValue() + step);
    }

    function decrement() {
      setValue(getValue() - step);
    }

    /* ---------------------------------------------------------------- */
    /*  Button clicks                                                    */
    /* ---------------------------------------------------------------- */

    if (btnDec) {
      NB.on(btnDec, 'click', function (e) {
        e.preventDefault();
        decrement();
        field.focus();
      });
    }

    if (btnInc) {
      NB.on(btnInc, 'click', function (e) {
        e.preventDefault();
        increment();
        field.focus();
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard: ArrowUp / ArrowDown                                    */
    /* ---------------------------------------------------------------- */

    NB.on(field, 'keydown', function (e) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        increment();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        decrement();
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Validate on blur                                                 */
    /* ---------------------------------------------------------------- */

    NB.on(field, 'blur', function () {
      var v = getValue();
      setValue(v);
    });

    /* ---------------------------------------------------------------- */
    /*  Input change                                                     */
    /* ---------------------------------------------------------------- */

    NB.on(field, 'change', function () {
      var v = getValue();
      setValue(v);
    });
  });

})(window.NB);


/* --- components/pin-input.js --- */

/**
 * NB PIN Input Component
 * Individual digit inputs with auto-advance, backspace, and paste support.
 *
 * Usage:
 *   <div class="nb-pin-input" data-nb-pin-input data-nb-length="6">
 *     <!-- Inputs are auto-generated, or provide them: -->
 *     <input class="nb-pin-input_field" maxlength="1" inputmode="numeric">
 *     ...
 *   </div>
 *
 * Data attributes:
 *   data-nb-pin-input          — activates component
 *   data-nb-length="6"         — number of digits (default 4)
 *   data-nb-mask="true"        — mask input as dots (password type)
 *
 * Events:
 *   nb:pin-change   — detail: { value: string, complete: boolean }
 *   nb:pin-complete — detail: { value: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('pin-input', function (el) {
    var length = parseInt(el.getAttribute('data-nb-length'), 10) || 4;
    var mask   = el.getAttribute('data-nb-mask') === 'true';

    /* ---------------------------------------------------------------- */
    /*  Auto-generate fields if none exist                               */
    /* ---------------------------------------------------------------- */

    var fields = NB.$$('.nb-pin-input_field', el);

    if (fields.length === 0) {
      for (var i = 0; i < length; i++) {
        var inp = document.createElement('input');
        inp.className = 'nb-pin-input_field';
        inp.type = mask ? 'password' : 'text';
        inp.maxLength = 1;
        inp.setAttribute('inputmode', 'numeric');
        inp.setAttribute('autocomplete', 'one-time-code');
        inp.setAttribute('aria-label', 'Digit ' + (i + 1) + ' of ' + length);
        el.appendChild(inp);
      }
      fields = NB.$$('.nb-pin-input_field', el);
    }

    /* Trim to length */
    fields = fields.slice(0, length);

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', 'PIN input');

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function getFullValue() {
      var val = '';
      for (var i = 0; i < fields.length; i++) {
        val += fields[i].value || '';
      }
      return val;
    }

    function checkComplete() {
      var val = getFullValue();
      var complete = val.length === length;

      if (complete) {
        el.classList.add('is-complete');
        NB.emit(el, 'nb:pin-complete', { value: val });
      } else {
        el.classList.remove('is-complete');
      }

      NB.emit(el, 'nb:pin-change', { value: val, complete: complete });
    }

    function updateFilledState() {
      fields.forEach(function (f) {
        if (f.value) {
          f.classList.add('is-filled');
        } else {
          f.classList.remove('is-filled');
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Input handling                                                    */
    /* ---------------------------------------------------------------- */

    fields.forEach(function (field, idx) {
      NB.on(field, 'input', function (e) {
        /* Allow only single digit */
        var val = field.value.replace(/[^0-9]/g, '');
        field.value = val.slice(0, 1);

        updateFilledState();

        /* Auto-advance to next */
        if (field.value && idx < fields.length - 1) {
          fields[idx + 1].focus();
          fields[idx + 1].select();
        }

        checkComplete();
      });

      NB.on(field, 'keydown', function (e) {
        /* Backspace: clear current, then move back */
        if (e.key === 'Backspace') {
          if (!field.value && idx > 0) {
            e.preventDefault();
            fields[idx - 1].value = '';
            fields[idx - 1].focus();
            updateFilledState();
            checkComplete();
          }
          return;
        }

        /* ArrowLeft / ArrowRight */
        if (e.key === 'ArrowLeft' && idx > 0) {
          e.preventDefault();
          fields[idx - 1].focus();
          fields[idx - 1].select();
          return;
        }
        if (e.key === 'ArrowRight' && idx < fields.length - 1) {
          e.preventDefault();
          fields[idx + 1].focus();
          fields[idx + 1].select();
          return;
        }
      });

      /* Select all on focus */
      NB.on(field, 'focus', function () {
        setTimeout(function () { field.select(); }, 0);
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Paste support: distribute digits across fields                    */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'paste', function (e) {
      var pasted = (e.clipboardData || window.clipboardData).getData('text');
      var digits = pasted.replace(/[^0-9]/g, '').split('');

      if (digits.length === 0) return;
      e.preventDefault();

      for (var i = 0; i < fields.length && i < digits.length; i++) {
        fields[i].value = digits[i];
      }

      /* Focus the next empty field or the last field */
      var nextEmpty = digits.length < fields.length ? digits.length : fields.length - 1;
      fields[nextEmpty].focus();

      updateFilledState();
      checkComplete();
    });
  });

})(window.NB);


/* --- components/combobox.js --- */

/**
 * NB Combobox Component
 * Autocomplete text input with filterable dropdown and keyboard navigation.
 *
 * Usage:
 *   <div class="nb-combobox" data-nb-combobox>
 *     <input class="nb-combobox_input" type="text" placeholder="Search..." role="combobox"
 *            aria-expanded="false" aria-autocomplete="list">
 *     <div class="nb-combobox_list" role="listbox">
 *       <div class="nb-combobox_option" role="option" data-value="react">React</div>
 *       <div class="nb-combobox_option" role="option" data-value="vue">Vue</div>
 *     </div>
 *     <div class="nb-combobox_empty">No results found</div>
 *   </div>
 *
 * Events:
 *   nb:combobox-select — detail: { value: string, label: string }
 *   nb:combobox-change — detail: { query: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('combobox', function (el) {
    var input     = el.querySelector('.nb-combobox_input');
    var listbox   = el.querySelector('.nb-combobox_list');
    var emptyMsg  = el.querySelector('.nb-combobox_empty');

    if (!input || !listbox) return;

    var allOptions = [];
    var visibleOptions = [];
    var highlightIndex = -1;
    var isOpen = false;

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    var listId = listbox.id || NB.uid('nb-combobox-list');
    listbox.id = listId;

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', listId);
    listbox.setAttribute('role', 'listbox');

    function setupOptions() {
      allOptions = NB.$$('.nb-combobox_option', listbox);
      allOptions.forEach(function (opt) {
        opt.setAttribute('role', 'option');
        if (!opt.id) opt.id = NB.uid('nb-combo-opt');
      });
    }

    setupOptions();

    /* ---------------------------------------------------------------- */
    /*  Open / Close                                                     */
    /* ---------------------------------------------------------------- */

    function open() {
      if (isOpen) return;
      isOpen = true;
      el.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
      NB.on(document, 'click', onOutsideClick, true);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      el.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      highlightIndex = -1;
      clearHighlight();
      input.removeAttribute('aria-activedescendant');
      NB.off(document, 'click', onOutsideClick, true);
    }

    /* ---------------------------------------------------------------- */
    /*  Filtering                                                        */
    /* ---------------------------------------------------------------- */

    function filter(query) {
      var q = query.toLowerCase().trim();

      allOptions.forEach(function (opt) {
        var text = opt.textContent.toLowerCase();
        if (q === '' || text.indexOf(q) !== -1) {
          opt.classList.remove('is-hidden');
        } else {
          opt.classList.add('is-hidden');
        }
      });

      visibleOptions = allOptions.filter(function (opt) {
        return !opt.classList.contains('is-hidden');
      });

      highlightIndex = -1;
      clearHighlight();

      /* Show/hide empty message */
      if (emptyMsg) {
        if (visibleOptions.length === 0 && q !== '') {
          emptyMsg.classList.add('is-visible');
        } else {
          emptyMsg.classList.remove('is-visible');
        }
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Highlight management                                             */
    /* ---------------------------------------------------------------- */

    function clearHighlight() {
      allOptions.forEach(function (opt) {
        opt.classList.remove('is-highlighted');
      });
    }

    function setHighlight(idx) {
      clearHighlight();
      if (idx < 0 || idx >= visibleOptions.length) return;
      highlightIndex = idx;
      visibleOptions[idx].classList.add('is-highlighted');
      input.setAttribute('aria-activedescendant', visibleOptions[idx].id);
      visibleOptions[idx].scrollIntoView({ block: 'nearest' });
    }

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function selectOption(opt) {
      var value = opt.getAttribute('data-value') || opt.textContent.trim();
      var label = opt.textContent.trim();

      /* Clear previous selection */
      allOptions.forEach(function (o) { o.classList.remove('is-selected'); });
      opt.classList.add('is-selected');

      input.value = label;
      close();
      input.focus();
      NB.emit(el, 'nb:combobox-select', { value: value, label: label });
    }

    /* ---------------------------------------------------------------- */
    /*  Event handlers                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'input', function () {
      filter(input.value);
      if (!isOpen) open();
      NB.emit(el, 'nb:combobox-change', { query: input.value });
    });

    NB.on(input, 'focus', function () {
      filter(input.value);
      open();
    });

    NB.on(input, 'keydown', function (e) {
      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        filter(input.value);
        open();
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (visibleOptions.length === 0) break;
          setHighlight(highlightIndex < visibleOptions.length - 1 ? highlightIndex + 1 : 0);
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (visibleOptions.length === 0) break;
          setHighlight(highlightIndex > 0 ? highlightIndex - 1 : visibleOptions.length - 1);
          break;

        case 'Enter':
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < visibleOptions.length) {
            selectOption(visibleOptions[highlightIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          close();
          break;

        case 'Home':
          if (isOpen) {
            e.preventDefault();
            if (visibleOptions.length > 0) setHighlight(0);
          }
          break;

        case 'End':
          if (isOpen) {
            e.preventDefault();
            if (visibleOptions.length > 0) setHighlight(visibleOptions.length - 1);
          }
          break;
      }
    });

    /* Option clicks */
    NB.on(listbox, 'click', function (e) {
      var opt = e.target.closest('.nb-combobox_option');
      if (opt && !opt.classList.contains('is-hidden')) {
        selectOption(opt);
      }
    });

    /* Click outside */
    function onOutsideClick(e) {
      if (!el.contains(e.target)) {
        close();
      }
    }
  });

})(window.NB);


/* --- components/multiselect.js --- */

/**
 * NB Multiselect Component
 * Multi-value select with chips, dropdown checkboxes, and search filtering.
 *
 * Usage:
 *   <div class="nb-multiselect" data-nb-multiselect>
 *     <div class="nb-multiselect_trigger" tabindex="0" role="combobox"
 *          aria-expanded="false" aria-haspopup="listbox">
 *       <span class="nb-multiselect_placeholder">Select items...</span>
 *     </div>
 *     <div class="nb-multiselect_dropdown" role="listbox" aria-multiselectable="true">
 *       <input class="nb-multiselect_search" type="text" placeholder="Filter...">
 *       <div class="nb-multiselect_option" data-value="a">
 *         <span class="nb-multiselect_check"><svg class="nb-multiselect_check-icon" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span>
 *         Option A
 *       </div>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:multiselect-change — detail: { values: string[], labels: string[] }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('multiselect', function (el) {
    var trigger     = el.querySelector('.nb-multiselect_trigger');
    var dropdown    = el.querySelector('.nb-multiselect_dropdown');
    var search      = el.querySelector('.nb-multiselect_search');
    var placeholder = el.querySelector('.nb-multiselect_placeholder');

    if (!trigger || !dropdown) return;

    var allOptions  = NB.$$('.nb-multiselect_option', dropdown);
    var selected    = [];
    var isOpen      = false;

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    var dropdownId = dropdown.id || NB.uid('nb-multiselect-dd');
    dropdown.id = dropdownId;
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-controls', dropdownId);
    dropdown.setAttribute('role', 'listbox');
    dropdown.setAttribute('aria-multiselectable', 'true');

    allOptions.forEach(function (opt) {
      opt.setAttribute('role', 'option');
      opt.setAttribute('aria-selected', 'false');
      if (!opt.id) opt.id = NB.uid('nb-multi-opt');
    });

    /* ---------------------------------------------------------------- */
    /*  Open / Close                                                     */
    /* ---------------------------------------------------------------- */

    function open() {
      if (isOpen) return;
      isOpen = true;
      el.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');

      if (search) {
        search.value = '';
        filterOptions('');
        search.focus();
      }

      NB.on(document, 'click', onOutsideClick, true);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      el.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      NB.off(document, 'click', onOutsideClick, true);
      trigger.focus();
    }

    function toggle() {
      isOpen ? close() : open();
    }

    /* ---------------------------------------------------------------- */
    /*  Chip rendering                                                   */
    /* ---------------------------------------------------------------- */

    function renderChips() {
      /* Remove old chips */
      NB.$$('.nb-multiselect_chip', trigger).forEach(function (c) { c.remove(); });

      if (selected.length === 0) {
        if (placeholder) placeholder.style.display = '';
        return;
      }

      if (placeholder) placeholder.style.display = 'none';

      selected.forEach(function (item) {
        var chip = document.createElement('span');
        chip.className = 'nb-multiselect_chip';
        chip.setAttribute('data-value', item.value);

        var text = document.createTextNode(item.label);
        var remove = document.createElement('button');
        remove.className = 'nb-multiselect_chip-remove';
        remove.type = 'button';
        remove.textContent = '\u00d7';
        remove.setAttribute('aria-label', 'Remove ' + item.label);

        chip.appendChild(text);
        chip.appendChild(remove);

        /* Insert before placeholder or chevron */
        var chevron = trigger.querySelector('.nb-multiselect_chevron');
        if (chevron) {
          trigger.insertBefore(chip, chevron);
        } else {
          trigger.appendChild(chip);
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function getOptionData(opt) {
      return {
        value: opt.getAttribute('data-value') || opt.textContent.trim(),
        label: opt.textContent.trim()
      };
    }

    function isSelected(value) {
      return selected.some(function (s) { return s.value === value; });
    }

    function toggleOption(opt) {
      var data = getOptionData(opt);

      if (isSelected(data.value)) {
        /* Deselect */
        selected = selected.filter(function (s) { return s.value !== data.value; });
        opt.classList.remove('is-checked');
        opt.setAttribute('aria-selected', 'false');
      } else {
        /* Select */
        selected.push(data);
        opt.classList.add('is-checked');
        opt.setAttribute('aria-selected', 'true');
      }

      renderChips();
      emitChange();
    }

    function deselectByValue(value) {
      selected = selected.filter(function (s) { return s.value !== value; });

      /* Update option state */
      allOptions.forEach(function (opt) {
        var val = opt.getAttribute('data-value') || opt.textContent.trim();
        if (val === value) {
          opt.classList.remove('is-checked');
          opt.setAttribute('aria-selected', 'false');
        }
      });

      renderChips();
      emitChange();
    }

    function emitChange() {
      NB.emit(el, 'nb:multiselect-change', {
        values: selected.map(function (s) { return s.value; }),
        labels: selected.map(function (s) { return s.label; })
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Filtering                                                        */
    /* ---------------------------------------------------------------- */

    function filterOptions(query) {
      var q = query.toLowerCase().trim();
      allOptions.forEach(function (opt) {
        var text = opt.textContent.toLowerCase();
        if (q === '' || text.indexOf(q) !== -1) {
          opt.classList.remove('is-hidden');
        } else {
          opt.classList.add('is-hidden');
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Event handlers                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(trigger, 'click', function (e) {
      /* Handle chip remove buttons */
      var removeBtn = e.target.closest('.nb-multiselect_chip-remove');
      if (removeBtn) {
        var chip = removeBtn.closest('.nb-multiselect_chip');
        if (chip) {
          e.stopPropagation();
          deselectByValue(chip.getAttribute('data-value'));
        }
        return;
      }
      toggle();
    });

    NB.on(trigger, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    });

    /* Option clicks */
    NB.on(dropdown, 'click', function (e) {
      var opt = e.target.closest('.nb-multiselect_option');
      if (opt && !opt.classList.contains('is-hidden')) {
        toggleOption(opt);
      }
    });

    /* Search filtering */
    if (search) {
      NB.on(search, 'input', function () {
        filterOptions(search.value);
      });

      NB.on(search, 'keydown', function (e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          close();
        }
        e.stopPropagation();
      });
    }

    /* Click outside */
    function onOutsideClick(e) {
      if (!el.contains(e.target)) close();
    }

    /* ---------------------------------------------------------------- */
    /*  Init pre-checked options                                         */
    /* ---------------------------------------------------------------- */

    allOptions.forEach(function (opt) {
      if (opt.classList.contains('is-checked')) {
        var data = getOptionData(opt);
        selected.push(data);
        opt.setAttribute('aria-selected', 'true');
      }
    });

    if (selected.length) renderChips();
  });

})(window.NB);


/* --- components/checkbox-card.js --- */

/**
 * NB Checkbox Card Component
 * Card-styled checkbox with full-card click area.
 *
 * Usage:
 *   <label class="nb-checkbox-card" data-nb-checkbox-card>
 *     <input class="nb-checkbox-card_input" type="checkbox" name="features" value="api">
 *     <span class="nb-checkbox-card_indicator">
 *       <svg class="nb-checkbox-card_indicator-icon" viewBox="0 0 12 12">
 *         <path d="M2.5 6l2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="1.5"/>
 *       </svg>
 *     </span>
 *     <span class="nb-checkbox-card_title">API Access</span>
 *     <span class="nb-checkbox-card_description">Full REST API with webhooks</span>
 *   </label>
 *
 * Events:
 *   nb:checkbox-card-change — detail: { checked: boolean, value: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('checkbox-card', function (el) {
    var input = el.querySelector('.nb-checkbox-card_input');
    if (!input) return;

    /* ---------------------------------------------------------------- */
    /*  Sync visual state                                                */
    /* ---------------------------------------------------------------- */

    function syncState() {
      if (input.checked) {
        el.classList.add('is-checked');
      } else {
        el.classList.remove('is-checked');
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Change handler                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'change', function () {
      syncState();
      NB.emit(el, 'nb:checkbox-card-change', {
        checked: input.checked,
        value: input.value || ''
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Click forwarding (if wrapper is not a <label>)                   */
    /* ---------------------------------------------------------------- */

    if (el.tagName.toLowerCase() !== 'label') {
      NB.on(el, 'click', function (e) {
        if (e.target === input) return;
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard: Space to toggle (when card is focused)                 */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'keydown', function (e) {
      if (e.key === ' ' && e.target === el) {
        e.preventDefault();
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    /* Initialize state */
    syncState();
  });

})(window.NB);


/* --- components/radio-card.js --- */

/**
 * NB Radio Card Component
 * Card-styled radio buttons with single-select group behavior.
 *
 * Usage:
 *   <div class="nb-radio-card-group" data-nb-radio-card role="radiogroup" aria-label="Plans">
 *     <label class="nb-radio-card">
 *       <input class="nb-radio-card_input" type="radio" name="plan" value="free">
 *       <span class="nb-radio-card_indicator"><span class="nb-radio-card_indicator-dot"></span></span>
 *       <span class="nb-radio-card_title">Free</span>
 *       <span class="nb-radio-card_description">For personal projects</span>
 *     </label>
 *     <label class="nb-radio-card">
 *       <input class="nb-radio-card_input" type="radio" name="plan" value="pro">
 *       <span class="nb-radio-card_indicator"><span class="nb-radio-card_indicator-dot"></span></span>
 *       <span class="nb-radio-card_title">Pro</span>
 *       <span class="nb-radio-card_description">For teams</span>
 *     </label>
 *   </div>
 *
 * Note: data-nb-radio-card goes on the GROUP container, not individual cards.
 *
 * Events:
 *   nb:radio-card-change — detail: { value: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('radio-card', function (group) {
    var cards = NB.$$('.nb-radio-card', group);
    if (!cards.length) return;

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    if (!group.getAttribute('role')) {
      group.setAttribute('role', 'radiogroup');
    }

    /* ---------------------------------------------------------------- */
    /*  Sync visual state across all cards                               */
    /* ---------------------------------------------------------------- */

    function syncAll() {
      cards.forEach(function (card) {
        var input = card.querySelector('.nb-radio-card_input');
        if (!input) return;

        if (input.checked) {
          card.classList.add('is-active');
        } else {
          card.classList.remove('is-active');
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Change handler on each card                                      */
    /* ---------------------------------------------------------------- */

    cards.forEach(function (card) {
      var input = card.querySelector('.nb-radio-card_input');
      if (!input) return;

      NB.on(input, 'change', function () {
        syncAll();
        NB.emit(group, 'nb:radio-card-change', { value: input.value || '' });
      });

      /* Click forwarding if wrapper is not a <label> */
      if (card.tagName.toLowerCase() !== 'label') {
        NB.on(card, 'click', function (e) {
          if (e.target === input) return;
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard: ArrowDown/Right = next, ArrowUp/Left = previous        */
    /* ---------------------------------------------------------------- */

    NB.on(group, 'keydown', function (e) {
      var inputs = cards.map(function (c) {
        return c.querySelector('.nb-radio-card_input');
      }).filter(Boolean);

      if (!inputs.length) return;

      var currentIdx = -1;
      for (var i = 0; i < inputs.length; i++) {
        if (document.activeElement === inputs[i] ||
            document.activeElement === cards[i]) {
          currentIdx = i;
          break;
        }
      }

      if (currentIdx === -1) return;

      var nextIdx = -1;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        nextIdx = currentIdx < inputs.length - 1 ? currentIdx + 1 : 0;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIdx = currentIdx > 0 ? currentIdx - 1 : inputs.length - 1;
      }

      if (nextIdx >= 0) {
        inputs[nextIdx].checked = true;
        inputs[nextIdx].focus();
        inputs[nextIdx].dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    /* Initialize */
    syncAll();
  });

})(window.NB);


/* --- components/toggle-group.js --- */

/**
 * NB Toggle Group Component
 * Button group with single or multi-select toggle behavior.
 *
 * Usage:
 *   <div class="nb-toggle-group" data-nb-toggle-group="single" role="group" aria-label="View">
 *     <button class="nb-toggle-group_btn is-active" data-value="grid">Grid</button>
 *     <button class="nb-toggle-group_btn" data-value="list">List</button>
 *     <button class="nb-toggle-group_btn" data-value="table">Table</button>
 *   </div>
 *
 * Data attributes:
 *   data-nb-toggle-group="single" — single select (default)
 *   data-nb-toggle-group="multi"  — multi select
 *
 * Events:
 *   nb:toggle-group-change — detail: { value: string|string[], active: HTMLElement[] }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('toggle-group', function (el) {
    var mode    = el.getAttribute('data-nb-toggle-group') || 'single';
    var buttons = NB.$$('.nb-toggle-group_btn', el);

    if (!buttons.length) return;

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    if (!el.getAttribute('role')) {
      el.setAttribute('role', 'group');
    }

    buttons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.classList.contains('is-active') ? 'true' : 'false');
    });

    /* ---------------------------------------------------------------- */
    /*  Get current value(s)                                             */
    /* ---------------------------------------------------------------- */

    function getActive() {
      return buttons.filter(function (btn) {
        return btn.classList.contains('is-active');
      });
    }

    function getValue() {
      var active = getActive();
      if (mode === 'single') {
        return active.length ? (active[0].getAttribute('data-value') || '') : '';
      }
      return active.map(function (btn) {
        return btn.getAttribute('data-value') || '';
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Toggle logic                                                     */
    /* ---------------------------------------------------------------- */

    function activate(btn) {
      if (mode === 'single') {
        /* Deactivate all others */
        buttons.forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        /* Multi: toggle this button */
        if (btn.classList.contains('is-active')) {
          btn.classList.remove('is-active');
          btn.setAttribute('aria-pressed', 'false');
        } else {
          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');
        }
      }

      NB.emit(el, 'nb:toggle-group-change', {
        value: getValue(),
        active: getActive()
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Click handlers                                                   */
    /* ---------------------------------------------------------------- */

    buttons.forEach(function (btn) {
      NB.on(btn, 'click', function (e) {
        e.preventDefault();
        activate(btn);
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard: ArrowLeft / ArrowRight for navigation                  */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'keydown', function (e) {
      var idx = buttons.indexOf(document.activeElement);
      if (idx === -1) return;

      var nextIdx = -1;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIdx = idx < buttons.length - 1 ? idx + 1 : 0;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIdx = idx > 0 ? idx - 1 : buttons.length - 1;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIdx = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIdx = buttons.length - 1;
      }

      if (nextIdx >= 0) {
        buttons[nextIdx].focus();
        if (mode === 'single') {
          activate(buttons[nextIdx]);
        }
      }
    });
  });

})(window.NB);


/* --- components/segmented-control.js --- */

/**
 * NB Segmented Control Component
 * Button group selector with sliding indicator animation.
 *
 * Usage:
 *   <div class="nb-segmented" data-nb-segmented role="radiogroup" aria-label="View mode">
 *     <div class="nb-segmented_indicator"></div>
 *     <button class="nb-segmented_item is-active" data-value="day" role="radio" aria-checked="true">Day</button>
 *     <button class="nb-segmented_item" data-value="week" role="radio" aria-checked="false">Week</button>
 *     <button class="nb-segmented_item" data-value="month" role="radio" aria-checked="false">Month</button>
 *   </div>
 *
 * Events:
 *   nb:segmented-change — detail: { value: string, index: number }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('segmented', function (el) {
    var indicator = el.querySelector('.nb-segmented_indicator');
    var items     = NB.$$('.nb-segmented_item', el);

    if (!items.length) return;

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    if (!el.getAttribute('role')) {
      el.setAttribute('role', 'radiogroup');
    }

    items.forEach(function (item) {
      item.setAttribute('role', 'radio');
      item.setAttribute('aria-checked',
        item.classList.contains('is-active') ? 'true' : 'false'
      );
    });

    /* ---------------------------------------------------------------- */
    /*  Indicator positioning                                            */
    /* ---------------------------------------------------------------- */

    function moveIndicator(target, animate) {
      if (!indicator) return;

      var elRect     = el.getBoundingClientRect();
      var targetRect = target.getBoundingClientRect();

      var offsetLeft = targetRect.left - elRect.left;
      var width      = targetRect.width;

      if (!animate) {
        indicator.style.transition = 'none';
      }

      indicator.style.width     = width + 'px';
      indicator.style.transform = 'translateX(' + (offsetLeft - 3) + 'px)';

      if (!animate) {
        /* Force reflow then re-enable transition */
        indicator.offsetHeight; /* eslint-disable-line no-unused-expressions */
        indicator.style.transition = '';
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function activate(item, animate) {
      /* Deactivate all */
      items.forEach(function (i) {
        i.classList.remove('is-active');
        i.setAttribute('aria-checked', 'false');
        i.setAttribute('tabindex', '-1');
      });

      /* Activate selected */
      item.classList.add('is-active');
      item.setAttribute('aria-checked', 'true');
      item.setAttribute('tabindex', '0');

      moveIndicator(item, animate !== false);

      var idx   = items.indexOf(item);
      var value = item.getAttribute('data-value') || '';

      NB.emit(el, 'nb:segmented-change', { value: value, index: idx });
    }

    /* ---------------------------------------------------------------- */
    /*  Click handlers                                                   */
    /* ---------------------------------------------------------------- */

    items.forEach(function (item) {
      NB.on(item, 'click', function (e) {
        e.preventDefault();
        activate(item, true);
        item.focus();
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard navigation                                              */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'keydown', function (e) {
      var idx = items.indexOf(document.activeElement);
      if (idx === -1) return;

      var nextIdx = -1;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIdx = idx < items.length - 1 ? idx + 1 : 0;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIdx = idx > 0 ? idx - 1 : items.length - 1;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIdx = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIdx = items.length - 1;
      }

      if (nextIdx >= 0) {
        activate(items[nextIdx], true);
        items[nextIdx].focus();
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Initialize: position indicator on the active item (no animation) */
    /* ---------------------------------------------------------------- */

    var active = el.querySelector('.nb-segmented_item.is-active');
    if (active) {
      activate(active, false);
    } else if (items[0]) {
      activate(items[0], false);
    }

    /* Re-position on window resize */
    var resizeTimer;
    NB.on(window, 'resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var current = el.querySelector('.nb-segmented_item.is-active');
        if (current) moveIndicator(current, false);
      }, 100);
    });
  });

})(window.NB);


/* --- components/date-picker.js --- */

/**
 * NB Date Picker Component
 * Input field + calendar dropdown with month/year navigation.
 * Keyboard: arrows navigate days, Enter selects, Escape closes.
 *
 * Usage:
 *   <div data-nb-date-picker class="nb-date-picker">
 *     <div class="nb-date-picker_input-wrap">
 *       <input class="nb-date-picker_input" placeholder="Select date" readonly>
 *       <svg class="nb-date-picker_icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
 *         <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 7h12M5 1v4M11 1v4"/>
 *       </svg>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-nb-date-picker     — init marker
 *   data-nb-format           — date format string (default: "YYYY-MM-DD")
 *   data-nb-min              — minimum date (YYYY-MM-DD)
 *   data-nb-max              — maximum date (YYYY-MM-DD)
 *   data-nb-value            — initial value (YYYY-MM-DD)
 *
 * Events:
 *   nb:date-change — detail: { value: string, date: Date }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var MONTHS = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  var DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  NB.register('date-picker', function (el) {

    var input = NB.$('.nb-date-picker_input', el);
    if (!input) return;

    var format = el.getAttribute('data-nb-format') || 'YYYY-MM-DD';
    var minStr = el.getAttribute('data-nb-min');
    var maxStr = el.getAttribute('data-nb-max');
    var valStr = el.getAttribute('data-nb-value');
    var minDate = minStr ? parseISO(minStr) : null;
    var maxDate = maxStr ? parseISO(maxStr) : null;

    var viewYear, viewMonth; // current calendar view
    var selectedDate = null;
    var focusedDay = null;
    var dropdown = null;
    var daysGrid = null;
    var titleEl = null;
    var releaseFocus = null;

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function parseISO(s) {
      var p = s.split('-');
      return new Date(+p[0], +p[1] - 1, +p[2]);
    }

    function formatDate(d) {
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return format.replace('YYYY', y).replace('MM', m).replace('DD', day);
    }

    function sameDay(a, b) {
      return a && b &&
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
    }

    function isDisabled(d) {
      if (minDate && d < minDate) return true;
      if (maxDate && d > maxDate) return true;
      return false;
    }

    /* ---------------------------------------------------------------- */
    /*  Build calendar DOM                                                */
    /* ---------------------------------------------------------------- */

    function build() {
      dropdown = document.createElement('div');
      dropdown.className = 'nb-date-picker_dropdown';
      dropdown.setAttribute('role', 'dialog');
      dropdown.setAttribute('aria-modal', 'true');
      dropdown.setAttribute('aria-label', 'Choose date');

      // Header
      var header = document.createElement('div');
      header.className = 'nb-date-picker_header';

      var navLeft = document.createElement('div');
      navLeft.className = 'nb-date-picker_nav';

      var prevBtn = makeNavBtn('prev', '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2L4 7l5 5"/></svg>');
      navLeft.appendChild(prevBtn);

      titleEl = document.createElement('span');
      titleEl.className = 'nb-date-picker_title';
      titleEl.setAttribute('aria-live', 'polite');

      var navRight = document.createElement('div');
      navRight.className = 'nb-date-picker_nav';
      var nextBtn = makeNavBtn('next', '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 2l5 5-5 5"/></svg>');
      navRight.appendChild(nextBtn);

      header.appendChild(navLeft);
      header.appendChild(titleEl);
      header.appendChild(navRight);
      dropdown.appendChild(header);

      // Weekday headers
      var weekdays = document.createElement('div');
      weekdays.className = 'nb-date-picker_weekdays';
      weekdays.setAttribute('role', 'row');
      DAYS_SHORT.forEach(function (d) {
        var span = document.createElement('span');
        span.className = 'nb-date-picker_weekday';
        span.textContent = d;
        span.setAttribute('role', 'columnheader');
        weekdays.appendChild(span);
      });
      dropdown.appendChild(weekdays);

      // Days grid
      daysGrid = document.createElement('div');
      daysGrid.className = 'nb-date-picker_days';
      daysGrid.setAttribute('role', 'grid');
      daysGrid.setAttribute('aria-label', 'Calendar');
      dropdown.appendChild(daysGrid);

      el.appendChild(dropdown);

      NB.on(prevBtn, 'click', function (e) { e.stopPropagation(); changeMonth(-1); });
      NB.on(nextBtn, 'click', function (e) { e.stopPropagation(); changeMonth(1); });
    }

    function makeNavBtn(dir, svgHTML) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nb-date-picker_nav-btn';
      btn.innerHTML = svgHTML;
      btn.setAttribute('aria-label', dir === 'prev' ? 'Previous month' : 'Next month');
      return btn;
    }

    /* ---------------------------------------------------------------- */
    /*  Render days                                                       */
    /* ---------------------------------------------------------------- */

    function render() {
      titleEl.textContent = MONTHS[viewMonth] + ' ' + viewYear;
      daysGrid.innerHTML = '';

      var firstDay = new Date(viewYear, viewMonth, 1).getDay();
      var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      var daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
      var today = new Date();

      // Previous month trailing days
      for (var p = firstDay - 1; p >= 0; p--) {
        var pd = new Date(viewYear, viewMonth - 1, daysInPrev - p);
        addDayBtn(pd, true);
      }

      // Current month
      for (var d = 1; d <= daysInMonth; d++) {
        var cd = new Date(viewYear, viewMonth, d);
        addDayBtn(cd, false);
      }

      // Fill to 42 cells (6 rows)
      var total = firstDay + daysInMonth;
      var remaining = (Math.ceil(total / 7) * 7) - total;
      for (var n = 1; n <= remaining; n++) {
        var nd = new Date(viewYear, viewMonth + 1, n);
        addDayBtn(nd, true);
      }
    }

    function addDayBtn(date, isOutside) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nb-date-picker_day';
      btn.textContent = date.getDate();
      btn.setAttribute('role', 'gridcell');
      btn.setAttribute('tabindex', '-1');
      btn.setAttribute('data-date', date.toISOString().split('T')[0]);

      var today = new Date();
      if (sameDay(date, today)) btn.classList.add('is-today');
      if (sameDay(date, selectedDate)) btn.classList.add('is-selected');
      if (isOutside) btn.classList.add('is-outside');
      if (isDisabled(date)) btn.classList.add('is-disabled');

      if (sameDay(date, focusedDay)) {
        btn.setAttribute('tabindex', '0');
      }

      NB.on(btn, 'click', function (e) {
        e.stopPropagation();
        selectDate(date);
      });

      daysGrid.appendChild(btn);
    }

    /* ---------------------------------------------------------------- */
    /*  Navigation                                                       */
    /* ---------------------------------------------------------------- */

    function changeMonth(delta) {
      viewMonth += delta;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      focusedDay = new Date(viewYear, viewMonth, 1);
      render();
    }

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function selectDate(date) {
      if (isDisabled(date)) return;
      selectedDate = date;
      input.value = formatDate(date);
      el.setAttribute('data-nb-value', date.toISOString().split('T')[0]);
      NB.emit(el, 'nb:date-change', { value: input.value, date: date });
      close();
    }

    /* ---------------------------------------------------------------- */
    /*  Open / close                                                     */
    /* ---------------------------------------------------------------- */

    function isOpen() { return el.classList.contains('is-open'); }

    function open() {
      if (isOpen()) return;
      var now = selectedDate || new Date();
      viewYear = now.getFullYear();
      viewMonth = now.getMonth();
      focusedDay = selectedDate || new Date();
      render();
      el.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
      releaseFocus = NB.trapFocus(dropdown);
      // Focus the selected or today cell
      var sel = NB.$('.is-selected', daysGrid) || NB.$('.is-today', daysGrid) || NB.$('.nb-date-picker_day', daysGrid);
      if (sel) { sel.setAttribute('tabindex', '0'); sel.focus(); }
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      if (releaseFocus) { releaseFocus(); releaseFocus = null; }
      input.focus();
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard                                                         */
    /* ---------------------------------------------------------------- */

    function handleKeydown(e) {
      if (!isOpen()) return;

      var dayBtns = NB.$$('.nb-date-picker_day:not(.is-disabled)', daysGrid);
      var current = document.activeElement;
      var idx = dayBtns.indexOf(current);

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveFocus(dayBtns, idx, 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus(dayBtns, idx, -1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(dayBtns, idx, 7);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(dayBtns, idx, -7);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (current && current.classList.contains('nb-date-picker_day')) {
            var dateStr = current.getAttribute('data-date');
            if (dateStr) selectDate(parseISO(dateStr));
          }
          break;
      }
    }

    function moveFocus(btns, fromIdx, delta) {
      if (fromIdx < 0) return;
      var next = fromIdx + delta;
      if (next >= 0 && next < btns.length) {
        btns.forEach(function (b) { b.setAttribute('tabindex', '-1'); });
        btns[next].setAttribute('tabindex', '0');
        btns[next].focus();
      } else if (delta > 0) {
        changeMonth(1);
        setTimeout(function () {
          var newBtns = NB.$$('.nb-date-picker_day:not(.is-disabled)', daysGrid);
          if (newBtns.length) { newBtns[0].setAttribute('tabindex', '0'); newBtns[0].focus(); }
        }, 0);
      } else {
        changeMonth(-1);
        setTimeout(function () {
          var newBtns = NB.$$('.nb-date-picker_day:not(.is-disabled)', daysGrid);
          if (newBtns.length) {
            var last = newBtns[newBtns.length - 1];
            last.setAttribute('tabindex', '0');
            last.focus();
          }
        }, 0);
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Outside click                                                    */
    /* ---------------------------------------------------------------- */

    function handleOutsideClick(e) {
      if (isOpen() && !el.contains(e.target)) close();
    }

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-haspopup', 'dialog');
    input.setAttribute('aria-expanded', 'false');

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    build();

    if (valStr) {
      selectedDate = parseISO(valStr);
      input.value = formatDate(selectedDate);
    }

    NB.on(input, 'click', function () { isOpen() ? close() : open(); });
    NB.on(el, 'keydown', handleKeydown);
    NB.on(document, 'click', handleOutsideClick);
  });

})(window.NB);


/* --- components/time-picker.js --- */

/**
 * NB Time Picker Component
 * Scrollable hour/minute columns with optional AM/PM toggle.
 *
 * Usage:
 *   <div data-nb-time-picker="24h" class="nb-time-picker">
 *     <div class="nb-time-picker_input-wrap">
 *       <input class="nb-time-picker_input" placeholder="Select time" readonly>
 *       <svg class="nb-time-picker_icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
 *         <circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V8l2.5 1.5"/>
 *       </svg>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-nb-time-picker — "12h" or "24h" (default: "24h")
 *   data-nb-value       — initial value (HH:MM or HH:MM AM/PM)
 *   data-nb-step        — minute step (default: 1)
 *
 * Events:
 *   nb:time-change — detail: { value: string, hour: number, minute: number }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('time-picker', function (el) {

    var input = NB.$('.nb-time-picker_input', el);
    if (!input) return;

    var mode = (el.getAttribute('data-nb-time-picker') || '24h').toLowerCase();
    var is12h = mode === '12h';
    var step = parseInt(el.getAttribute('data-nb-step'), 10) || 1;
    var valStr = el.getAttribute('data-nb-value');

    var selectedHour = -1;
    var selectedMinute = -1;
    var selectedPeriod = 'AM';
    var dropdown = null;
    var hourCol = null;
    var minuteCol = null;
    var releaseFocus = null;

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function pad(n) { return String(n).padStart(2, '0'); }

    function formatTime() {
      if (selectedHour < 0 || selectedMinute < 0) return '';
      if (is12h) {
        var h = selectedHour === 0 ? 12 : (selectedHour > 12 ? selectedHour - 12 : selectedHour);
        return pad(h) + ':' + pad(selectedMinute) + ' ' + selectedPeriod;
      }
      return pad(selectedHour) + ':' + pad(selectedMinute);
    }

    function updateInput() {
      input.value = formatTime();
      if (selectedHour >= 0 && selectedMinute >= 0) {
        NB.emit(el, 'nb:time-change', {
          value: input.value,
          hour: selectedHour,
          minute: selectedMinute
        });
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Build DOM                                                        */
    /* ---------------------------------------------------------------- */

    function build() {
      dropdown = document.createElement('div');
      dropdown.className = 'nb-time-picker_dropdown';
      dropdown.setAttribute('role', 'listbox');
      dropdown.setAttribute('aria-label', 'Choose time');

      // Hour column
      hourCol = makeColumn('Hr', buildHours());
      dropdown.appendChild(hourCol);

      dropdown.appendChild(makeDivider());

      // Minute column
      minuteCol = makeColumn('Min', buildMinutes());
      dropdown.appendChild(minuteCol);

      // AM/PM if 12h
      if (is12h) {
        dropdown.appendChild(makeDivider());
        var periodWrap = document.createElement('div');
        periodWrap.className = 'nb-time-picker_period';

        var amBtn = makePeriodBtn('AM');
        var pmBtn = makePeriodBtn('PM');
        periodWrap.appendChild(amBtn);
        periodWrap.appendChild(pmBtn);
        dropdown.appendChild(periodWrap);
      }

      el.appendChild(dropdown);
    }

    function makeColumn(label, items) {
      var col = document.createElement('div');
      col.className = 'nb-time-picker_col';

      var lbl = document.createElement('div');
      lbl.className = 'nb-time-picker_col-label';
      lbl.textContent = label;
      col.appendChild(lbl);

      items.forEach(function (item) { col.appendChild(item); });
      return col;
    }

    function makeDivider() {
      var d = document.createElement('div');
      d.className = 'nb-time-picker_divider';
      return d;
    }

    function buildHours() {
      var max = is12h ? 12 : 23;
      var start = is12h ? 1 : 0;
      var items = [];
      for (var h = start; h <= max; h++) {
        items.push(makeItem(pad(h), h, 'hour'));
      }
      return items;
    }

    function buildMinutes() {
      var items = [];
      for (var m = 0; m < 60; m += step) {
        items.push(makeItem(pad(m), m, 'minute'));
      }
      return items;
    }

    function makeItem(text, value, type) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nb-time-picker_item';
      btn.textContent = text;
      btn.setAttribute('role', 'option');
      btn.setAttribute('tabindex', '-1');
      btn.setAttribute('data-value', value);
      btn.setAttribute('data-type', type);

      NB.on(btn, 'click', function (e) {
        e.stopPropagation();
        if (type === 'hour') {
          selectedHour = is12h ? to24h(value, selectedPeriod) : value;
          highlightColumn(hourCol, btn);
        } else {
          selectedMinute = value;
          highlightColumn(minuteCol, btn);
        }
        updateInput();
      });

      return btn;
    }

    function makePeriodBtn(period) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nb-time-picker_period-btn';
      btn.textContent = period;
      btn.setAttribute('tabindex', '-1');

      if (period === selectedPeriod) btn.classList.add('is-active');

      NB.on(btn, 'click', function (e) {
        e.stopPropagation();
        selectedPeriod = period;
        // Recalculate hour in 24h
        if (selectedHour >= 0) {
          var display12 = selectedHour % 12 || 12;
          selectedHour = to24h(display12, period);
        }
        // Update active states
        NB.$$('.nb-time-picker_period-btn', dropdown).forEach(function (b) {
          b.classList.toggle('is-active', b.textContent === period);
        });
        updateInput();
      });

      return btn;
    }

    function to24h(h12, period) {
      if (period === 'AM') return h12 === 12 ? 0 : h12;
      return h12 === 12 ? 12 : h12 + 12;
    }

    function highlightColumn(col, activeBtn) {
      NB.$$('.nb-time-picker_item', col).forEach(function (b) {
        b.classList.remove('is-selected');
        b.setAttribute('aria-selected', 'false');
      });
      activeBtn.classList.add('is-selected');
      activeBtn.setAttribute('aria-selected', 'true');
      // Scroll into view
      activeBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /* ---------------------------------------------------------------- */
    /*  Open / close                                                     */
    /* ---------------------------------------------------------------- */

    function isOpen() { return el.classList.contains('is-open'); }

    function open() {
      if (isOpen()) return;
      el.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
      releaseFocus = NB.trapFocus(dropdown);
      // Scroll to selected items
      scrollToSelected(hourCol, selectedHour, 'hour');
      scrollToSelected(minuteCol, selectedMinute, 'minute');
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      if (releaseFocus) { releaseFocus(); releaseFocus = null; }
      input.focus();
    }

    function scrollToSelected(col, value, type) {
      if (value < 0) return;
      var checkVal = value;
      if (type === 'hour' && is12h) {
        checkVal = value % 12 || 12;
      }
      var items = NB.$$('.nb-time-picker_item', col);
      items.forEach(function (b) {
        if (parseInt(b.getAttribute('data-value'), 10) === checkVal) {
          b.classList.add('is-selected');
          b.setAttribute('aria-selected', 'true');
          setTimeout(function () {
            b.scrollIntoView({ block: 'nearest' });
          }, 0);
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard                                                         */
    /* ---------------------------------------------------------------- */

    function handleKeydown(e) {
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        close();
        return;
      }

      if (!isOpen()) return;

      var current = document.activeElement;
      if (!current || !current.classList.contains('nb-time-picker_item')) return;

      var col = current.closest('.nb-time-picker_col');
      if (!col) return;

      var items = NB.$$('.nb-time-picker_item', col);
      var idx = items.indexOf(current);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (idx < items.length - 1) items[idx + 1].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx > 0) items[idx - 1].focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        current.click();
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Outside click                                                    */
    /* ---------------------------------------------------------------- */

    function handleOutsideClick(e) {
      if (isOpen() && !el.contains(e.target)) close();
    }

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-haspopup', 'listbox');
    input.setAttribute('aria-expanded', 'false');

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    build();

    // Parse initial value
    if (valStr) {
      var parts = valStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (parts) {
        var h = parseInt(parts[1], 10);
        var m = parseInt(parts[2], 10);
        if (is12h && parts[3]) {
          selectedPeriod = parts[3].toUpperCase();
          selectedHour = to24h(h, selectedPeriod);
        } else {
          selectedHour = h;
          if (is12h) selectedPeriod = h >= 12 ? 'PM' : 'AM';
        }
        selectedMinute = m;
        input.value = formatTime();
      }
    }

    NB.on(input, 'click', function () { isOpen() ? close() : open(); });
    NB.on(el, 'keydown', handleKeydown);
    NB.on(document, 'click', handleOutsideClick);
  });

})(window.NB);


/* --- components/date-range-picker.js --- */

/**
 * NB Date Range Picker Component
 * Dual calendar with start/end selection, range highlighting, and presets.
 *
 * Usage:
 *   <div data-nb-date-range class="nb-date-range">
 *     <div class="nb-date-range_inputs">
 *       <input class="nb-date-range_input" placeholder="Start date" readonly>
 *       <span class="nb-date-range_separator">&rarr;</span>
 *       <input class="nb-date-range_input" placeholder="End date" readonly>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-nb-date-range — init marker
 *   data-nb-format     — date format (default: "YYYY-MM-DD")
 *
 * Events:
 *   nb:range-change — detail: { start: Date|null, end: Date|null, startStr: string, endStr: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var MONTHS = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  var DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  var PRESETS = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 14 days', days: 14 },
    { label: 'Last 30 days', days: 30 },
    { label: 'This month', days: -1 },
    { label: 'Last month', days: -2 }
  ];

  NB.register('date-range', function (el) {

    var inputs = NB.$$('.nb-date-range_input', el);
    if (inputs.length < 2) return;
    var startInput = inputs[0];
    var endInput = inputs[1];

    var format = el.getAttribute('data-nb-format') || 'YYYY-MM-DD';
    var startDate = null;
    var endDate = null;
    var hoverDate = null; // for preview
    var leftYear, leftMonth;
    var dropdown = null;
    var leftCal = null;
    var rightCal = null;
    var releaseFocus = null;

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function parseISO(s) {
      var p = s.split('-');
      return new Date(+p[0], +p[1] - 1, +p[2]);
    }

    function toISO(d) {
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    }

    function formatDate(d) {
      if (!d) return '';
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return format.replace('YYYY', y).replace('MM', m).replace('DD', day);
    }

    function sameDay(a, b) {
      return a && b &&
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
    }

    function stripTime(d) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    /* ---------------------------------------------------------------- */
    /*  Build DOM                                                        */
    /* ---------------------------------------------------------------- */

    function build() {
      dropdown = document.createElement('div');
      dropdown.className = 'nb-date-range_dropdown';
      dropdown.setAttribute('role', 'dialog');
      dropdown.setAttribute('aria-modal', 'true');
      dropdown.setAttribute('aria-label', 'Choose date range');

      // Presets
      var presets = document.createElement('div');
      presets.className = 'nb-date-range_presets';
      PRESETS.forEach(function (p) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nb-date-range_preset';
        btn.textContent = p.label;
        btn.setAttribute('tabindex', '-1');
        NB.on(btn, 'click', function (e) {
          e.stopPropagation();
          applyPreset(p);
          NB.$$('.nb-date-range_preset', presets).forEach(function (b) {
            b.classList.remove('is-active');
          });
          btn.classList.add('is-active');
        });
        presets.appendChild(btn);
      });
      dropdown.appendChild(presets);

      // Calendars
      var cals = document.createElement('div');
      cals.className = 'nb-date-range_calendars';

      leftCal = buildCalendar('left');
      rightCal = buildCalendar('right');
      cals.appendChild(leftCal);
      cals.appendChild(rightCal);
      dropdown.appendChild(cals);

      el.appendChild(dropdown);
    }

    function buildCalendar(side) {
      var cal = document.createElement('div');
      cal.className = 'nb-date-range_calendar';
      cal.setAttribute('data-side', side);

      var header = document.createElement('div');
      header.className = 'nb-date-range_header';

      var title = document.createElement('span');
      title.className = 'nb-date-range_title';

      if (side === 'left') {
        var prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'nb-date-range_nav-btn';
        prevBtn.innerHTML = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2L4 7l5 5"/></svg>';
        prevBtn.setAttribute('aria-label', 'Previous month');
        NB.on(prevBtn, 'click', function (e) { e.stopPropagation(); changeMonth(-1); });
        header.appendChild(prevBtn);
      }

      header.appendChild(title);

      if (side === 'right') {
        var nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'nb-date-range_nav-btn';
        nextBtn.innerHTML = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 2l5 5-5 5"/></svg>';
        nextBtn.setAttribute('aria-label', 'Next month');
        NB.on(nextBtn, 'click', function (e) { e.stopPropagation(); changeMonth(1); });
        header.appendChild(nextBtn);
      }

      cal.appendChild(header);

      // Weekdays
      var weekdays = document.createElement('div');
      weekdays.className = 'nb-date-range_weekdays';
      DAYS_SHORT.forEach(function (d) {
        var span = document.createElement('span');
        span.className = 'nb-date-range_weekday';
        span.textContent = d;
        weekdays.appendChild(span);
      });
      cal.appendChild(weekdays);

      var days = document.createElement('div');
      days.className = 'nb-date-range_days';
      cal.appendChild(days);

      return cal;
    }

    /* ---------------------------------------------------------------- */
    /*  Render                                                           */
    /* ---------------------------------------------------------------- */

    function render() {
      renderMonth(leftCal, leftYear, leftMonth);
      // Right calendar is always next month
      var rYear = leftMonth === 11 ? leftYear + 1 : leftYear;
      var rMonth = (leftMonth + 1) % 12;
      renderMonth(rightCal, rYear, rMonth);
    }

    function renderMonth(cal, year, month) {
      var title = NB.$('.nb-date-range_title', cal);
      title.textContent = MONTHS[month] + ' ' + year;

      var grid = NB.$('.nb-date-range_days', cal);
      grid.innerHTML = '';

      var firstDay = new Date(year, month, 1).getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();
      var daysInPrev = new Date(year, month, 0).getDate();
      var today = new Date();

      // Prev month fill
      for (var p = firstDay - 1; p >= 0; p--) {
        var pd = new Date(year, month - 1, daysInPrev - p);
        addRangeDay(grid, pd, true);
      }

      // Current
      for (var d = 1; d <= daysInMonth; d++) {
        addRangeDay(grid, new Date(year, month, d), false);
      }

      // Fill to complete weeks
      var total = firstDay + daysInMonth;
      var remaining = (Math.ceil(total / 7) * 7) - total;
      for (var n = 1; n <= remaining; n++) {
        addRangeDay(grid, new Date(year, month + 1, n), true);
      }
    }

    function addRangeDay(grid, date, isOutside) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nb-date-range_day';
      btn.textContent = date.getDate();
      btn.setAttribute('tabindex', '-1');
      btn.setAttribute('data-date', toISO(date));

      var today = new Date();
      if (sameDay(date, today)) btn.classList.add('is-today');
      if (isOutside) btn.classList.add('is-outside');

      var ds = stripTime(date);

      if (startDate && sameDay(ds, startDate)) btn.classList.add('is-start');
      if (endDate && sameDay(ds, endDate)) btn.classList.add('is-end');

      // In-range
      if (startDate && endDate && ds > startDate && ds < endDate) {
        btn.classList.add('is-in-range');
      }

      // Hover preview
      if (startDate && !endDate && hoverDate) {
        var rangeStart = startDate < hoverDate ? startDate : hoverDate;
        var rangeEnd = startDate < hoverDate ? hoverDate : startDate;
        if (ds > rangeStart && ds < rangeEnd) {
          btn.classList.add('is-in-range');
        }
        if (sameDay(ds, hoverDate)) {
          btn.classList.add(startDate < hoverDate ? 'is-end' : 'is-start');
        }
      }

      NB.on(btn, 'click', function (e) {
        e.stopPropagation();
        handleDayClick(date);
      });

      NB.on(btn, 'mouseenter', function () {
        if (startDate && !endDate) {
          hoverDate = stripTime(date);
          render();
        }
      });

      grid.appendChild(btn);
    }

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function handleDayClick(date) {
      var d = stripTime(date);
      if (!startDate || (startDate && endDate)) {
        // Start new selection
        startDate = d;
        endDate = null;
        hoverDate = null;
      } else {
        // Set end
        if (d < startDate) {
          endDate = startDate;
          startDate = d;
        } else {
          endDate = d;
        }
        hoverDate = null;
      }
      updateInputs();
      render();

      if (startDate && endDate) {
        emitChange();
      }
    }

    function updateInputs() {
      startInput.value = formatDate(startDate);
      endInput.value = formatDate(endDate);
    }

    function emitChange() {
      NB.emit(el, 'nb:range-change', {
        start: startDate,
        end: endDate,
        startStr: formatDate(startDate),
        endStr: formatDate(endDate)
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Presets                                                           */
    /* ---------------------------------------------------------------- */

    function applyPreset(preset) {
      var now = new Date();
      var today = stripTime(now);

      if (preset.days === 0) {
        startDate = today;
        endDate = today;
      } else if (preset.days === -1) {
        // This month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = today;
      } else if (preset.days === -2) {
        // Last month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      } else {
        endDate = today;
        startDate = new Date(today.getTime() - preset.days * 86400000);
      }

      leftYear = startDate.getFullYear();
      leftMonth = startDate.getMonth();
      hoverDate = null;
      updateInputs();
      render();
      emitChange();
    }

    /* ---------------------------------------------------------------- */
    /*  Navigation                                                       */
    /* ---------------------------------------------------------------- */

    function changeMonth(delta) {
      leftMonth += delta;
      if (leftMonth > 11) { leftMonth = 0; leftYear++; }
      if (leftMonth < 0) { leftMonth = 11; leftYear--; }
      render();
    }

    /* ---------------------------------------------------------------- */
    /*  Open / close                                                     */
    /* ---------------------------------------------------------------- */

    function isOpen() { return el.classList.contains('is-open'); }

    function open() {
      if (isOpen()) return;
      var ref = startDate || new Date();
      leftYear = ref.getFullYear();
      leftMonth = ref.getMonth();
      render();
      el.classList.add('is-open');
      startInput.setAttribute('aria-expanded', 'true');
      releaseFocus = NB.trapFocus(dropdown);
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      startInput.setAttribute('aria-expanded', 'false');
      if (releaseFocus) { releaseFocus(); releaseFocus = null; }
      startInput.focus();
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard                                                         */
    /* ---------------------------------------------------------------- */

    function handleKeydown(e) {
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        close();
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Outside click                                                    */
    /* ---------------------------------------------------------------- */

    function handleOutsideClick(e) {
      if (isOpen() && !el.contains(e.target)) close();
    }

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    startInput.setAttribute('aria-label', 'Start date');
    endInput.setAttribute('aria-label', 'End date');
    startInput.setAttribute('aria-haspopup', 'dialog');
    startInput.setAttribute('aria-expanded', 'false');

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    build();

    NB.on(startInput, 'click', function () { isOpen() ? close() : open(); });
    NB.on(endInput, 'click', function () { isOpen() ? close() : open(); });
    NB.on(el, 'keydown', handleKeydown);
    NB.on(document, 'click', handleOutsideClick);
  });

})(window.NB);


/* --- components/color-picker.js --- */

/**
 * NB Color Picker Component
 * Hue slider + saturation/brightness area + hex input + preset swatches.
 *
 * Usage:
 *   <div data-nb-color-picker="#10b981" class="nb-color-picker">
 *     <button type="button" class="nb-color-picker_trigger">
 *       <span class="nb-color-picker_swatch"></span>
 *       <span class="nb-color-picker_value">#10b981</span>
 *     </button>
 *   </div>
 *
 * Attributes:
 *   data-nb-color-picker — default hex value (e.g. "#10b981")
 *
 * Events:
 *   nb:color-change — detail: { hex: string, rgb: {r,g,b}, hsl: {h,s,l} }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var DEFAULT_PRESETS = [
    '#ef4444','#f97316','#eab308','#22c55e','#10b981','#06b6d4','#3b82f6','#8b5cf6',
    '#ec4899','#f43f5e','#14b8a6','#6366f1','#a855f7','#d946ef','#64748b','#ffffff'
  ];

  NB.register('color-picker', function (el) {

    var trigger = NB.$('.nb-color-picker_trigger', el);
    var swatch = NB.$('.nb-color-picker_swatch', el);
    var valueEl = NB.$('.nb-color-picker_value', el);
    if (!trigger) return;

    var defaultVal = el.getAttribute('data-nb-color-picker') || '#10b981';
    var hsv = { h: 0, s: 100, v: 100 }; // internal HSV
    var dropdown = null;
    var areaEl = null;
    var areaCursor = null;
    var hueEl = null;
    var hueThumb = null;
    var hexInput = null;
    var previewEl = null;
    var releaseFocus = null;
    var draggingArea = false;
    var draggingHue = false;

    /* ---------------------------------------------------------------- */
    /*  Color conversion                                                 */
    /* ---------------------------------------------------------------- */

    function hsvToRgb(h, s, v) {
      s /= 100; v /= 100;
      var c = v * s;
      var x = c * (1 - Math.abs((h / 60) % 2 - 1));
      var m = v - c;
      var r, g, b;
      if (h < 60)       { r = c; g = x; b = 0; }
      else if (h < 120) { r = x; g = c; b = 0; }
      else if (h < 180) { r = 0; g = c; b = x; }
      else if (h < 240) { r = 0; g = x; b = c; }
      else if (h < 300) { r = x; g = 0; b = c; }
      else              { r = c; g = 0; b = x; }
      return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
      };
    }

    function rgbToHsv(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var d = max - min;
      var h = 0, s = max === 0 ? 0 : d / max, v = max;
      if (d !== 0) {
        if (max === r) h = ((g - b) / d + 6) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
      }
      return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) };
    }

    function rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(function (c) {
        return c.toString(16).padStart(2, '0');
      }).join('');
    }

    function hexToRgb(hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
      };
    }

    function rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + 6) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
      }
      return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    function getHex() {
      var rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    }

    /* ---------------------------------------------------------------- */
    /*  Build DOM                                                        */
    /* ---------------------------------------------------------------- */

    function build() {
      dropdown = document.createElement('div');
      dropdown.className = 'nb-color-picker_dropdown';
      dropdown.setAttribute('role', 'dialog');
      dropdown.setAttribute('aria-modal', 'true');
      dropdown.setAttribute('aria-label', 'Choose color');

      // Sat/Brightness area
      areaEl = document.createElement('div');
      areaEl.className = 'nb-color-picker_area';

      var areaBase = document.createElement('div');
      areaBase.className = 'nb-color-picker_area-gradient';

      var areaWhite = document.createElement('div');
      areaWhite.className = 'nb-color-picker_area-gradient nb-color-picker_area-white';

      var areaBlack = document.createElement('div');
      areaBlack.className = 'nb-color-picker_area-gradient nb-color-picker_area-black';

      areaCursor = document.createElement('div');
      areaCursor.className = 'nb-color-picker_area-cursor';

      areaEl.appendChild(areaBase);
      areaEl.appendChild(areaWhite);
      areaEl.appendChild(areaBlack);
      areaEl.appendChild(areaCursor);
      dropdown.appendChild(areaEl);

      // Hue slider
      hueEl = document.createElement('div');
      hueEl.className = 'nb-color-picker_hue';
      hueEl.setAttribute('role', 'slider');
      hueEl.setAttribute('aria-label', 'Hue');
      hueEl.setAttribute('aria-valuemin', '0');
      hueEl.setAttribute('aria-valuemax', '360');
      hueEl.setAttribute('tabindex', '0');

      hueThumb = document.createElement('div');
      hueThumb.className = 'nb-color-picker_hue-thumb';
      hueEl.appendChild(hueThumb);
      dropdown.appendChild(hueEl);

      // Hex row
      var hexRow = document.createElement('div');
      hexRow.className = 'nb-color-picker_hex-row';

      var hexLabel = document.createElement('span');
      hexLabel.className = 'nb-color-picker_hex-label';
      hexLabel.textContent = 'Hex';

      hexInput = document.createElement('input');
      hexInput.type = 'text';
      hexInput.className = 'nb-color-picker_hex-input';
      hexInput.setAttribute('maxlength', '7');
      hexInput.setAttribute('aria-label', 'Hex color value');

      previewEl = document.createElement('div');
      previewEl.className = 'nb-color-picker_preview';

      hexRow.appendChild(hexLabel);
      hexRow.appendChild(hexInput);
      hexRow.appendChild(previewEl);
      dropdown.appendChild(hexRow);

      // Preset swatches
      var swatches = document.createElement('div');
      swatches.className = 'nb-color-picker_swatches';

      DEFAULT_PRESETS.forEach(function (color) {
        var preset = document.createElement('button');
        preset.type = 'button';
        preset.className = 'nb-color-picker_preset';
        preset.style.background = color;
        preset.setAttribute('data-color', color);
        preset.setAttribute('aria-label', 'Color ' + color);
        preset.setAttribute('tabindex', '-1');
        NB.on(preset, 'click', function (e) {
          e.stopPropagation();
          setFromHex(color);
        });
        swatches.appendChild(preset);
      });
      dropdown.appendChild(swatches);

      el.appendChild(dropdown);

      // Event bindings for area/hue
      bindAreaEvents();
      bindHueEvents();

      NB.on(hexInput, 'change', function () {
        var val = hexInput.value.trim();
        if (/^#?[0-9a-fA-F]{3,6}$/.test(val)) {
          if (val[0] !== '#') val = '#' + val;
          setFromHex(val);
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Area (saturation/brightness) drag                                */
    /* ---------------------------------------------------------------- */

    function bindAreaEvents() {
      NB.on(areaEl, 'mousedown', function (e) {
        e.preventDefault();
        draggingArea = true;
        updateAreaFromEvent(e);
      });
      NB.on(document, 'mousemove', function (e) {
        if (!draggingArea) return;
        e.preventDefault();
        updateAreaFromEvent(e);
      });
      NB.on(document, 'mouseup', function () {
        draggingArea = false;
      });
    }

    function updateAreaFromEvent(e) {
      var rect = areaEl.getBoundingClientRect();
      var x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      var y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      hsv.s = Math.round((x / rect.width) * 100);
      hsv.v = Math.round(100 - (y / rect.height) * 100);
      updateUI();
      emitChange();
    }

    /* ---------------------------------------------------------------- */
    /*  Hue slider drag                                                  */
    /* ---------------------------------------------------------------- */

    function bindHueEvents() {
      NB.on(hueEl, 'mousedown', function (e) {
        e.preventDefault();
        draggingHue = true;
        updateHueFromEvent(e);
      });
      NB.on(document, 'mousemove', function (e) {
        if (!draggingHue) return;
        e.preventDefault();
        updateHueFromEvent(e);
      });
      NB.on(document, 'mouseup', function () {
        draggingHue = false;
      });

      // Keyboard on hue slider
      NB.on(hueEl, 'keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          hsv.h = Math.min(360, hsv.h + 1);
          updateUI(); emitChange();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          hsv.h = Math.max(0, hsv.h - 1);
          updateUI(); emitChange();
        }
      });
    }

    function updateHueFromEvent(e) {
      var rect = hueEl.getBoundingClientRect();
      var x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      hsv.h = Math.round((x / rect.width) * 360);
      updateUI();
      emitChange();
    }

    /* ---------------------------------------------------------------- */
    /*  Update UI                                                        */
    /* ---------------------------------------------------------------- */

    function updateUI() {
      var hex = getHex();
      var hueColor = 'hsl(' + hsv.h + ', 100%, 50%)';

      // Area background = pure hue
      var areaBase = areaEl.querySelector('.nb-color-picker_area-gradient');
      areaBase.style.background = hueColor;

      // Cursor position
      areaCursor.style.left = hsv.s + '%';
      areaCursor.style.top = (100 - hsv.v) + '%';

      // Hue thumb
      hueThumb.style.left = (hsv.h / 360 * 100) + '%';
      hueThumb.style.background = hueColor;
      hueEl.setAttribute('aria-valuenow', hsv.h);

      // Hex input
      hexInput.value = hex;
      previewEl.style.background = hex;

      // Trigger swatch
      if (swatch) swatch.style.background = hex;
      if (valueEl) valueEl.textContent = hex;

      // Highlight active preset
      NB.$$('.nb-color-picker_preset', dropdown).forEach(function (p) {
        p.classList.toggle('is-active',
          p.getAttribute('data-color').toLowerCase() === hex.toLowerCase());
      });
    }

    function setFromHex(hex) {
      var rgb = hexToRgb(hex);
      hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      updateUI();
      emitChange();
    }

    function emitChange() {
      var hex = getHex();
      var rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
      var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      NB.emit(el, 'nb:color-change', { hex: hex, rgb: rgb, hsl: hsl });
    }

    /* ---------------------------------------------------------------- */
    /*  Open / close                                                     */
    /* ---------------------------------------------------------------- */

    function isOpen() { return el.classList.contains('is-open'); }

    function open() {
      if (isOpen()) return;
      el.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      updateUI();
      releaseFocus = NB.trapFocus(dropdown);
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      if (releaseFocus) { releaseFocus(); releaseFocus = null; }
      trigger.focus();
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard                                                         */
    /* ---------------------------------------------------------------- */

    function handleKeydown(e) {
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        close();
      }
    }

    function handleOutsideClick(e) {
      if (isOpen() && !el.contains(e.target)) close();
    }

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    build();
    setFromHex(defaultVal);

    NB.on(trigger, 'click', function (e) {
      e.stopPropagation();
      isOpen() ? close() : open();
    });
    NB.on(el, 'keydown', handleKeydown);
    NB.on(document, 'click', handleOutsideClick);
  });

})(window.NB);


/* --- components/rating.js --- */

/**
 * NB Rating Component
 * Star rating with click-to-set, hover preview, half-star, and read-only modes.
 *
 * Usage:
 *   <div data-nb-rating class="nb-rating" data-nb-value="3" data-nb-max="5">
 *   </div>
 *
 * Attributes:
 *   data-nb-rating   — "half" for half-star support, "readonly" for read-only
 *   data-nb-value    — initial value (number)
 *   data-nb-max      — max stars (default: 5)
 *
 * Events:
 *   nb:rating-change — detail: { value: number, max: number }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var STAR_SVG = '<svg viewBox="0 0 20 20"><path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 13.87l-4.94 2.83.94-5.49-4-3.9 5.53-.8L10 1.5z"/></svg>';

  NB.register('rating', function (el) {

    var mode = (el.getAttribute('data-nb-rating') || '').toLowerCase();
    var isHalf = mode === 'half';
    var isReadonly = mode === 'readonly';
    var max = parseInt(el.getAttribute('data-nb-max'), 10) || 5;
    var value = parseFloat(el.getAttribute('data-nb-value')) || 0;
    var hoverValue = -1;
    var stars = [];

    /* ---------------------------------------------------------------- */
    /*  Build                                                            */
    /* ---------------------------------------------------------------- */

    function build() {
      el.setAttribute('role', 'radiogroup');
      el.setAttribute('aria-label', 'Rating');

      if (isReadonly) {
        el.classList.add('is-readonly');
        el.setAttribute('aria-readonly', 'true');
      }

      for (var i = 1; i <= max; i++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nb-rating_star';
        btn.innerHTML = STAR_SVG;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-label', i + ' star' + (i !== 1 ? 's' : ''));
        btn.setAttribute('data-value', i);

        if (isReadonly) {
          btn.setAttribute('tabindex', '-1');
          btn.disabled = true;
        } else {
          btn.setAttribute('tabindex', i === Math.ceil(value) || (value === 0 && i === 1) ? '0' : '-1');
        }

        // Half-star fill overlay
        if (isHalf) {
          var fillOverlay = document.createElement('span');
          fillOverlay.className = 'nb-rating_star-fill';
          fillOverlay.innerHTML = STAR_SVG;
          btn.appendChild(fillOverlay);
        }

        stars.push(btn);
        el.appendChild(btn);

        if (!isReadonly) {
          (function (starBtn, starValue) {
            NB.on(starBtn, 'click', function (e) {
              e.stopPropagation();
              if (isHalf) {
                handleHalfClick(e, starBtn, starValue);
              } else {
                setValue(starValue);
              }
            });

            NB.on(starBtn, 'mouseenter', function (e) {
              if (isHalf) {
                handleHalfHover(e, starBtn, starValue);
              } else {
                hoverValue = starValue;
                renderStars();
              }
            });
          })(btn, i);
        }
      }

      if (!isReadonly) {
        NB.on(el, 'mouseleave', function () {
          hoverValue = -1;
          renderStars();
        });

        NB.on(el, 'keydown', handleKeydown);
      }

      renderStars();
    }

    /* ---------------------------------------------------------------- */
    /*  Half-star logic                                                  */
    /* ---------------------------------------------------------------- */

    function handleHalfClick(e, btn, starValue) {
      var rect = btn.getBoundingClientRect();
      var isLeft = (e.clientX - rect.left) < rect.width / 2;
      var newVal = isLeft ? starValue - 0.5 : starValue;
      setValue(newVal);
    }

    function handleHalfHover(e, btn, starValue) {
      var rect = btn.getBoundingClientRect();
      var isLeft = (e.clientX - rect.left) < rect.width / 2;
      hoverValue = isLeft ? starValue - 0.5 : starValue;
      renderStars();

      // Track mouse within the star for half-hover
      var moveHandler = function (me) {
        var isL = (me.clientX - rect.left) < rect.width / 2;
        var newHover = isL ? starValue - 0.5 : starValue;
        if (newHover !== hoverValue) {
          hoverValue = newHover;
          renderStars();
        }
      };
      NB.on(btn, 'mousemove', moveHandler);
      var leaveHandler = function () {
        NB.off(btn, 'mousemove', moveHandler);
        NB.off(btn, 'mouseleave', leaveHandler);
      };
      NB.on(btn, 'mouseleave', leaveHandler);
    }

    /* ---------------------------------------------------------------- */
    /*  Set value                                                        */
    /* ---------------------------------------------------------------- */

    function setValue(newVal) {
      value = newVal;
      el.setAttribute('data-nb-value', value);
      hoverValue = -1;
      renderStars();
      updateTabindex();
      NB.emit(el, 'nb:rating-change', { value: value, max: max });
    }

    /* ---------------------------------------------------------------- */
    /*  Render                                                           */
    /* ---------------------------------------------------------------- */

    function renderStars() {
      var displayVal = hoverValue >= 0 ? hoverValue : value;
      var isHovering = hoverValue >= 0;

      stars.forEach(function (btn, idx) {
        var starNum = idx + 1;
        btn.classList.remove('is-filled', 'is-half', 'is-hover');
        btn.setAttribute('aria-checked', starNum <= value ? 'true' : 'false');

        if (starNum <= Math.floor(displayVal)) {
          btn.classList.add(isHovering ? 'is-hover' : 'is-filled');
        } else if (isHalf && starNum - 0.5 === displayVal) {
          btn.classList.add('is-half');
          if (isHovering) btn.classList.add('is-hover');
        }
      });
    }

    function updateTabindex() {
      var activeIdx = Math.ceil(value) - 1;
      if (activeIdx < 0) activeIdx = 0;
      stars.forEach(function (btn, idx) {
        btn.setAttribute('tabindex', idx === activeIdx ? '0' : '-1');
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard                                                         */
    /* ---------------------------------------------------------------- */

    function handleKeydown(e) {
      var current = document.activeElement;
      var idx = stars.indexOf(current);
      if (idx < 0) return;

      var step = isHalf ? 0.5 : 1;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          if (value < max) setValue(value + step);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          if (value > step) setValue(value - step);
          else if (value > 0) setValue(0);
          break;
        case 'Home':
          e.preventDefault();
          setValue(isHalf ? 0.5 : 1);
          break;
        case 'End':
          e.preventDefault();
          setValue(max);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          setValue(idx + 1);
          break;
      }

      // Focus the correct star after value change
      var newIdx = Math.ceil(value) - 1;
      if (newIdx >= 0 && newIdx < stars.length) {
        stars[newIdx].focus();
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    build();
  });

})(window.NB);


/* --- components/rich-text-editor.js --- */

/**
 * NB Rich Text Editor Component
 * Toolbar with formatting commands and a contenteditable area.
 *
 * Usage:
 *   <div data-nb-editor class="nb-editor">
 *     <div class="nb-editor_toolbar">
 *       <div class="nb-editor_toolbar-group">
 *         <button type="button" class="nb-editor_btn" data-nb-cmd="bold" aria-label="Bold">
 *           <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2h5a3 3 0 012 5.24A3.5 3.5 0 019.5 14H4V2zm2 5h3a1 1 0 100-2H6v2zm0 2v3h3.5a1.5 1.5 0 000-3H6z"/></svg>
 *         </button>
 *         <button type="button" class="nb-editor_btn" data-nb-cmd="italic" aria-label="Italic">
 *           <svg viewBox="0 0 16 16" fill="currentColor"><path d="M6 2h6v2h-2.2l-2.6 8H9v2H3v-2h2.2l2.6-8H6V2z"/></svg>
 *         </button>
 *         <!-- ... more buttons -->
 *       </div>
 *     </div>
 *     <div class="nb-editor_content" contenteditable="true" data-placeholder="Start writing..."></div>
 *   </div>
 *
 * Supported data-nb-cmd values:
 *   bold, italic, underline, strikethrough, link, heading, ul, ol, code, quote
 *
 * Events:
 *   nb:editor-change — detail: { html: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var CMD_MAP = {
    bold: 'bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'strikeThrough',
    ul: 'insertUnorderedList',
    ol: 'insertOrderedList'
  };

  var QUERY_MAP = {
    bold: 'bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'strikeThrough',
    ul: 'insertUnorderedList',
    ol: 'insertOrderedList'
  };

  NB.register('editor', function (el) {

    var toolbar = NB.$('.nb-editor_toolbar', el);
    var content = NB.$('.nb-editor_content', el);
    if (!content) return;

    var buttons = toolbar ? NB.$$('.nb-editor_btn[data-nb-cmd]', toolbar) : [];
    var linkDialog = null;
    var linkInput = null;

    /* ---------------------------------------------------------------- */
    /*  Ensure contenteditable                                           */
    /* ---------------------------------------------------------------- */

    content.setAttribute('contenteditable', 'true');
    content.setAttribute('role', 'textbox');
    content.setAttribute('aria-multiline', 'true');
    content.setAttribute('aria-label', 'Rich text editor');

    // Generate unique id for ARIA linking
    var contentId = content.id || NB.uid('nb-editor-content');
    content.id = contentId;

    /* ---------------------------------------------------------------- */
    /*  Link dialog                                                      */
    /* ---------------------------------------------------------------- */

    function buildLinkDialog() {
      linkDialog = document.createElement('div');
      linkDialog.className = 'nb-editor_link-dialog is-hidden';

      linkInput = document.createElement('input');
      linkInput.type = 'url';
      linkInput.className = 'nb-editor_link-input';
      linkInput.placeholder = 'https://...';
      linkInput.setAttribute('aria-label', 'Link URL');

      var applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.className = 'nb-editor_link-btn';
      applyBtn.textContent = 'Apply';

      var cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'nb-editor_link-btn';
      cancelBtn.textContent = 'Cancel';

      linkDialog.appendChild(linkInput);
      linkDialog.appendChild(applyBtn);
      linkDialog.appendChild(cancelBtn);
      el.appendChild(linkDialog);

      NB.on(applyBtn, 'click', function () {
        var url = linkInput.value.trim();
        if (url) {
          content.focus();
          restoreSelection();
          document.execCommand('createLink', false, url);
          emitChange();
        }
        closeLinkDialog();
      });

      NB.on(cancelBtn, 'click', closeLinkDialog);

      NB.on(linkInput, 'keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyBtn.click();
        } else if (e.key === 'Escape') {
          closeLinkDialog();
        }
      });
    }

    var savedRange = null;

    function saveSelection() {
      var sel = window.getSelection();
      if (sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0).cloneRange();
      }
    }

    function restoreSelection() {
      if (savedRange) {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
    }

    function openLinkDialog() {
      saveSelection();
      linkDialog.classList.remove('is-hidden');
      linkInput.value = '';
      linkInput.focus();
    }

    function closeLinkDialog() {
      linkDialog.classList.add('is-hidden');
      content.focus();
      restoreSelection();
    }

    /* ---------------------------------------------------------------- */
    /*  Command execution                                                */
    /* ---------------------------------------------------------------- */

    function execCmd(cmd) {
      content.focus();

      if (cmd === 'link') {
        openLinkDialog();
        return;
      }

      if (cmd === 'heading') {
        // Toggle between h2 and paragraph
        var current = document.queryCommandValue('formatBlock');
        if (current === 'h2' || current === 'H2') {
          document.execCommand('formatBlock', false, 'p');
        } else {
          document.execCommand('formatBlock', false, 'h2');
        }
        updateActiveStates();
        emitChange();
        return;
      }

      if (cmd === 'code') {
        // Wrap selection in <code>
        var sel = window.getSelection();
        if (sel.rangeCount > 0) {
          var range = sel.getRangeAt(0);
          var text = range.toString();
          if (text) {
            // Check if already in code
            var parent = sel.anchorNode.parentElement;
            if (parent && parent.tagName === 'CODE') {
              // Remove code wrapper
              var textNode = document.createTextNode(parent.textContent);
              parent.parentNode.replaceChild(textNode, parent);
            } else {
              var code = document.createElement('code');
              range.surroundContents(code);
            }
          }
        }
        updateActiveStates();
        emitChange();
        return;
      }

      if (cmd === 'quote') {
        var currentBlock = document.queryCommandValue('formatBlock');
        if (currentBlock === 'blockquote' || currentBlock === 'BLOCKQUOTE') {
          document.execCommand('formatBlock', false, 'p');
        } else {
          document.execCommand('formatBlock', false, 'blockquote');
        }
        updateActiveStates();
        emitChange();
        return;
      }

      // Standard commands
      var execName = CMD_MAP[cmd];
      if (execName) {
        document.execCommand(execName, false, null);
        updateActiveStates();
        emitChange();
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Active states                                                     */
    /* ---------------------------------------------------------------- */

    function updateActiveStates() {
      buttons.forEach(function (btn) {
        var cmd = btn.getAttribute('data-nb-cmd');
        var isActive = false;

        if (QUERY_MAP[cmd]) {
          isActive = document.queryCommandState(QUERY_MAP[cmd]);
        } else if (cmd === 'heading') {
          var val = document.queryCommandValue('formatBlock');
          isActive = val === 'h2' || val === 'H2' || val === 'h1' || val === 'H1' || val === 'h3' || val === 'H3';
        } else if (cmd === 'quote') {
          var qVal = document.queryCommandValue('formatBlock');
          isActive = qVal === 'blockquote' || qVal === 'BLOCKQUOTE';
        } else if (cmd === 'code') {
          var sel = window.getSelection();
          if (sel.anchorNode) {
            var p = sel.anchorNode.parentElement;
            isActive = p && p.tagName === 'CODE';
          }
        }

        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Change emission                                                  */
    /* ---------------------------------------------------------------- */

    function emitChange() {
      NB.emit(el, 'nb:editor-change', { html: content.innerHTML });
    }

    /* ---------------------------------------------------------------- */
    /*  Button clicks                                                    */
    /* ---------------------------------------------------------------- */

    buttons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', 'false');
      NB.on(btn, 'mousedown', function (e) {
        // Prevent focus loss from content area
        e.preventDefault();
      });
      NB.on(btn, 'click', function (e) {
        e.preventDefault();
        var cmd = btn.getAttribute('data-nb-cmd');
        execCmd(cmd);
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Content events                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(content, 'input', function () {
      emitChange();
    });

    NB.on(content, 'keyup', updateActiveStates);
    NB.on(content, 'mouseup', updateActiveStates);

    // Keyboard shortcuts
    NB.on(content, 'keydown', function (e) {
      if (e.ctrlKey || e.metaKey) {
        var key = e.key.toLowerCase();
        if (key === 'b') { e.preventDefault(); execCmd('bold'); }
        else if (key === 'i') { e.preventDefault(); execCmd('italic'); }
        else if (key === 'u') { e.preventDefault(); execCmd('underline'); }
        else if (key === 'k') { e.preventDefault(); execCmd('link'); }
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    buildLinkDialog();
  });

})(window.NB);


/* --- components/editable-text.js --- */

/**
 * NB Editable Text Component
 * Inline text that becomes an input on click or Enter.
 *
 * Usage:
 *   <div data-nb-editable class="nb-editable">
 *     <button type="button" class="nb-editable_display">
 *       <span class="nb-editable_text">Click to edit</span>
 *       <svg class="nb-editable_display-icon" viewBox="0 0 12 12" fill="none"
 *            stroke="currentColor" stroke-width="1.5">
 *         <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z"/>
 *       </svg>
 *     </button>
 *     <div class="nb-editable_edit">
 *       <input class="nb-editable_input" type="text">
 *       <div class="nb-editable_actions">
 *         <button type="button" class="nb-editable_action nb-editable_action--confirm" aria-label="Confirm">
 *           <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6l3 3 5-5"/></svg>
 *         </button>
 *         <button type="button" class="nb-editable_action nb-editable_action--cancel" aria-label="Cancel">
 *           <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l6 6M9 3l-6 6"/></svg>
 *         </button>
 *       </div>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-nb-editable  — init marker, optional type: "text" (default) or "number"
 *   data-nb-value     — initial value
 *   data-nb-placeholder — placeholder for empty state
 *
 * Events:
 *   nb:editable-save   — detail: { value: string, previousValue: string }
 *   nb:editable-cancel — detail: { value: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('editable', function (el) {

    var display = NB.$('.nb-editable_display', el);
    var textEl = NB.$('.nb-editable_text', el);
    var editWrap = NB.$('.nb-editable_edit', el);
    var inputEl = NB.$('.nb-editable_input', el);
    var confirmBtn = NB.$('.nb-editable_action--confirm', el);
    var cancelBtn = NB.$('.nb-editable_action--cancel', el);

    if (!display || !inputEl) return;

    var type = el.getAttribute('data-nb-editable') || 'text';
    var placeholder = el.getAttribute('data-nb-placeholder') || 'Click to edit';
    var currentValue = el.getAttribute('data-nb-value') || (textEl ? textEl.textContent.trim() : '');
    var previousValue = currentValue;

    // Set input type
    if (type === 'number') {
      inputEl.type = 'number';
    }

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    display.setAttribute('role', 'button');
    display.setAttribute('aria-label', 'Click to edit: ' + (currentValue || placeholder));

    /* ---------------------------------------------------------------- */
    /*  Display rendering                                                */
    /* ---------------------------------------------------------------- */

    function renderDisplay() {
      if (textEl) {
        if (currentValue) {
          textEl.textContent = currentValue;
          display.classList.remove('is-empty');
        } else {
          textEl.textContent = placeholder;
          display.classList.add('is-empty');
        }
      }
      display.setAttribute('aria-label', 'Click to edit: ' + (currentValue || placeholder));
    }

    /* ---------------------------------------------------------------- */
    /*  Start editing                                                     */
    /* ---------------------------------------------------------------- */

    function startEditing() {
      previousValue = currentValue;
      el.classList.add('is-editing');
      inputEl.value = currentValue;
      inputEl.focus();
      inputEl.select();
    }

    /* ---------------------------------------------------------------- */
    /*  Confirm                                                          */
    /* ---------------------------------------------------------------- */

    function confirm() {
      var newVal = inputEl.value;
      if (type === 'number') {
        newVal = inputEl.value;
      }
      currentValue = newVal;
      el.setAttribute('data-nb-value', currentValue);
      el.classList.remove('is-editing');
      renderDisplay();
      display.focus();
      NB.emit(el, 'nb:editable-save', {
        value: currentValue,
        previousValue: previousValue
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Cancel                                                           */
    /* ---------------------------------------------------------------- */

    function cancel() {
      el.classList.remove('is-editing');
      renderDisplay();
      display.focus();
      NB.emit(el, 'nb:editable-cancel', { value: currentValue });
    }

    /* ---------------------------------------------------------------- */
    /*  Event bindings                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(display, 'click', function (e) {
      e.preventDefault();
      startEditing();
    });

    NB.on(display, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startEditing();
      }
    });

    NB.on(inputEl, 'keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    });

    // Blur = confirm (common UX expectation)
    NB.on(inputEl, 'blur', function (e) {
      // Only confirm if we're not clicking the cancel/confirm buttons
      var related = e.relatedTarget;
      if (related && (related === confirmBtn || related === cancelBtn)) return;
      // Small delay to allow button clicks to fire first
      setTimeout(function () {
        if (el.classList.contains('is-editing')) {
          confirm();
        }
      }, 100);
    });

    if (confirmBtn) {
      NB.on(confirmBtn, 'click', function (e) {
        e.preventDefault();
        confirm();
      });
    }

    if (cancelBtn) {
      NB.on(cancelBtn, 'click', function (e) {
        e.preventDefault();
        cancel();
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    renderDisplay();
  });

})(window.NB);


/* --- components/data-table.js --- */

/**
 * NB Data Table Component
 * Adds sorting to table columns via sort buttons.
 * Rearranges tbody rows on click, cycling through asc / desc / none.
 * Emits `nb:table-sort` with `{ column, direction }` detail.
 *
 * Usage:
 *   <div class="nb-data-table" data-nb-data-table>
 *     <table class="nb-table">
 *       <thead>
 *         <tr>
 *           <th><button class="nb-data-table_sort-btn" data-col="0">Name</button></th>
 *           <th><button class="nb-data-table_sort-btn" data-col="1">Value</button></th>
 *         </tr>
 *       </thead>
 *       <tbody>...</tbody>
 *     </table>
 *   </div>
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** Sort direction cycle: none -> ascending -> descending -> none */
  var CYCLE = { none: 'ascending', ascending: 'descending', descending: 'none' };

  NB.register('data-table', function (el) {
    var table   = NB.$('.nb-table', el) || el.querySelector('table');
    if (!table) return;

    var tbody   = table.querySelector('tbody');
    if (!tbody) return;

    var sortBtns = NB.$$('.nb-data-table_sort-btn', el);
    if (!sortBtns.length) return;

    /* -------------------------------------------------------------- */
    /*  State                                                          */
    /* -------------------------------------------------------------- */

    var currentBtn   = null;
    var currentDir   = 'none';
    var originalRows = null; // snapshot for resetting to "none"

    /* -------------------------------------------------------------- */
    /*  Helpers                                                        */
    /* -------------------------------------------------------------- */

    /**
     * Extract sortable text content from a cell.
     * Strips whitespace and lowercases for natural comparison.
     */
    function getCellValue(row, colIndex) {
      var cell = row.children[colIndex];
      if (!cell) return '';

      // Prefer data-sort-value attribute for custom sort keys
      var explicit = cell.getAttribute('data-sort-value');
      if (explicit !== null) return explicit;

      return (cell.textContent || '').trim().toLowerCase();
    }

    /**
     * Compare two values — tries numeric first, falls back to string.
     */
    function compare(a, b) {
      var numA = parseFloat(a);
      var numB = parseFloat(b);

      // Both are valid numbers
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }

      // String comparison
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    }

    /**
     * Sort and re-append rows into tbody.
     */
    function sortRows(colIndex, direction) {
      if (!originalRows) {
        // Snapshot the original DOM order on first sort
        originalRows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
      }

      var rows;

      if (direction === 'none') {
        // Restore original order
        rows = originalRows.slice();
      } else {
        rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
        rows.sort(function (rowA, rowB) {
          var valA = getCellValue(rowA, colIndex);
          var valB = getCellValue(rowB, colIndex);
          var result = compare(valA, valB);
          return direction === 'descending' ? -result : result;
        });
      }

      // Re-append in new order (moves existing DOM nodes)
      var frag = document.createDocumentFragment();
      for (var i = 0; i < rows.length; i++) {
        frag.appendChild(rows[i]);
      }
      tbody.appendChild(frag);
    }

    /* -------------------------------------------------------------- */
    /*  Reset ARIA on all buttons                                      */
    /* -------------------------------------------------------------- */

    function resetAllButtons() {
      for (var i = 0; i < sortBtns.length; i++) {
        sortBtns[i].removeAttribute('aria-sort');
      }
    }

    /* -------------------------------------------------------------- */
    /*  Click handler                                                  */
    /* -------------------------------------------------------------- */

    function handleSort(e) {
      var btn = e.currentTarget;
      var colIndex = parseInt(btn.getAttribute('data-col'), 10);
      if (isNaN(colIndex)) return;

      // Determine new direction
      var prevDir = btn === currentBtn ? currentDir : 'none';
      var nextDir = CYCLE[prevDir];

      // Reset all, then set active
      resetAllButtons();

      if (nextDir !== 'none') {
        btn.setAttribute('aria-sort', nextDir);
      }

      currentBtn = btn;
      currentDir = nextDir;

      // Sort
      sortRows(colIndex, nextDir);

      // Emit event
      NB.emit(el, 'nb:table-sort', {
        column: colIndex,
        direction: nextDir
      });
    }

    /* -------------------------------------------------------------- */
    /*  Bind                                                           */
    /* -------------------------------------------------------------- */

    for (var i = 0; i < sortBtns.length; i++) {
      NB.on(sortBtns[i], 'click', handleSort);
    }
  });

})(window.NB);


/* --- components/accordion.js --- */

/**
 * NB Accordion Component
 * Toggles accordion items open/closed with animated max-height.
 * Supports single-open mode via data-nb-accordion="single".
 * Keyboard accessible: Enter / Space to toggle.
 * ARIA: aria-expanded on trigger, aria-controls linking to content panel.
 *
 * Usage:
 *   <div class="nb-accordion" data-nb-accordion>              (multi-open)
 *   <div class="nb-accordion" data-nb-accordion="single">     (single-open)
 *     <div class="nb-accordion_item">
 *       <button class="nb-accordion_trigger">
 *         Section Title
 *         <svg class="nb-accordion_icon">...</svg>
 *       </button>
 *       <div class="nb-accordion_content">
 *         <div class="nb-accordion_body">Content here</div>
 *       </div>
 *     </div>
 *   </div>
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('accordion', function (el) {

    var mode     = el.getAttribute('data-nb-accordion'); // "single" or ""
    var isSingle = mode === 'single';
    var items    = NB.$$('.nb-accordion_item', el);

    if (!items.length) return;

    /* -------------------------------------------------------------- */
    /*  Setup ARIA attributes                                          */
    /* -------------------------------------------------------------- */

    items.forEach(function (item) {
      var trigger = NB.$('.nb-accordion_trigger', item);
      var content = NB.$('.nb-accordion_content', item);
      if (!trigger || !content) return;

      // Generate unique IDs for ARIA linking
      var panelId  = content.id || NB.uid('nb-acc-panel');
      var triggerId = trigger.id || NB.uid('nb-acc-trigger');

      content.id = panelId;
      trigger.id = triggerId;

      trigger.setAttribute('aria-controls', panelId);
      content.setAttribute('role', 'region');
      content.setAttribute('aria-labelledby', triggerId);

      // Set initial ARIA state based on whether item is already open
      var isOpen = item.classList.contains('is-open');
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      // If already open, set maxHeight so it displays correctly
      if (isOpen) {
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });

    /* -------------------------------------------------------------- */
    /*  Toggle logic                                                   */
    /* -------------------------------------------------------------- */

    function closeItem(item) {
      var trigger = NB.$('.nb-accordion_trigger', item);
      var content = NB.$('.nb-accordion_content', item);
      if (!trigger || !content) return;

      item.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      content.style.maxHeight = '0';
    }

    function openItem(item) {
      var trigger = NB.$('.nb-accordion_trigger', item);
      var content = NB.$('.nb-accordion_content', item);
      if (!trigger || !content) return;

      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      content.style.maxHeight = content.scrollHeight + 'px';
    }

    function toggleItem(item) {
      var isOpen = item.classList.contains('is-open');

      // In single mode, close all others first
      if (isSingle && !isOpen) {
        items.forEach(function (other) {
          if (other !== item && other.classList.contains('is-open')) {
            closeItem(other);
          }
        });
      }

      if (isOpen) {
        closeItem(item);
      } else {
        openItem(item);
      }
    }

    /* -------------------------------------------------------------- */
    /*  Event delegation                                               */
    /* -------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var trigger = e.target.closest('.nb-accordion_trigger');
      if (!trigger) return;

      var item = trigger.closest('.nb-accordion_item');
      if (!item || !el.contains(item)) return;

      e.preventDefault();
      toggleItem(item);
    });

    /* -------------------------------------------------------------- */
    /*  Keyboard: Enter / Space                                        */
    /* -------------------------------------------------------------- */

    NB.on(el, 'keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;

      var trigger = e.target.closest('.nb-accordion_trigger');
      if (!trigger) return;

      var item = trigger.closest('.nb-accordion_item');
      if (!item || !el.contains(item)) return;

      e.preventDefault();
      toggleItem(item);
    });

    /* -------------------------------------------------------------- */
    /*  Handle dynamic content height changes                          */
    /* -------------------------------------------------------------- */

    /** Recalculate max-height for all open items. */
    el._nbRecalc = function () {
      items.forEach(function (item) {
        if (!item.classList.contains('is-open')) return;
        var content = NB.$('.nb-accordion_content', item);
        if (content) {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    };
  });

})(window.NB);


/* --- components/calendar.js --- */

/**
 * NB Calendar Component
 * Interactive month grid with keyboard navigation and date selection.
 * Emits nb:calendar-select on date pick.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var CHEVRON_LEFT =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var CHEVRON_RIGHT =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  var MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function parseISO(str) {
    if (!str) return null;
    var p = str.split('-');
    if (p.length === 3) return new Date(+p[0], +p[1] - 1, +p[2]);
    var d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  function toISO(d) {
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  /* ------------------------------------------------------------------ */
  /*  Component                                                          */
  /* ------------------------------------------------------------------ */

  NB.register('calendar', function (el) {
    var valueAttr = el.getAttribute('data-nb-calendar');
    var minDate = parseISO(el.getAttribute('data-nb-calendar-min'));
    var maxDate = parseISO(el.getAttribute('data-nb-calendar-max'));
    var eventsAttr = el.getAttribute('data-nb-calendar-events');

    var events = {};
    if (eventsAttr) {
      try {
        var arr = JSON.parse(eventsAttr);
        arr.forEach(function (iso) { events[iso] = true; });
      } catch (e) { /* ignore */ }
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var selected = (valueAttr && valueAttr !== 'true') ? parseISO(valueAttr) : new Date(today);
    if (selected) selected.setHours(0, 0, 0, 0);

    var viewMonth = selected ? selected.getMonth() : today.getMonth();
    var viewYear = selected ? selected.getFullYear() : today.getFullYear();

    var titleEl, gridEl, prevBtn, nextBtn;

    /* ---------------------------------------------------------------- */
    /*  Build scaffold                                                   */
    /* ---------------------------------------------------------------- */

    function build() {
      el.innerHTML = '';
      el.classList.add('nb-calendar');

      var header = document.createElement('div');
      header.className = 'nb-calendar_header';

      titleEl = document.createElement('span');
      titleEl.className = 'nb-calendar_title';

      var nav = document.createElement('div');
      nav.className = 'nb-calendar_nav';

      prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.setAttribute('aria-label', 'Previous month');
      prevBtn.innerHTML = CHEVRON_LEFT;

      nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.setAttribute('aria-label', 'Next month');
      nextBtn.innerHTML = CHEVRON_RIGHT;

      nav.appendChild(prevBtn);
      nav.appendChild(nextBtn);

      header.appendChild(titleEl);
      header.appendChild(nav);
      el.appendChild(header);

      var weekdays = document.createElement('div');
      weekdays.className = 'nb-calendar_weekdays';
      WEEKDAYS.forEach(function (d) {
        var s = document.createElement('span');
        s.textContent = d;
        weekdays.appendChild(s);
      });
      el.appendChild(weekdays);

      gridEl = document.createElement('div');
      gridEl.className = 'nb-calendar_grid';
      gridEl.setAttribute('role', 'grid');
      el.appendChild(gridEl);
    }

    build();

    /* ---------------------------------------------------------------- */
    /*  Render                                                           */
    /* ---------------------------------------------------------------- */

    function isDisabled(d) {
      if (minDate && d < minDate) return true;
      if (maxDate && d > maxDate) return true;
      return false;
    }

    function render() {
      titleEl.textContent = MONTHS[viewMonth] + ' ' + viewYear;
      gridEl.innerHTML = '';

      var first = new Date(viewYear, viewMonth, 1);
      var startDow = first.getDay();
      var lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
      var prevLast = new Date(viewYear, viewMonth, 0).getDate();

      for (var i = 0; i < 42; i++) {
        var dayNum, cellDate, isOther = false;

        if (i < startDow) {
          dayNum = prevLast - startDow + 1 + i;
          cellDate = new Date(viewYear, viewMonth - 1, dayNum);
          isOther = true;
        } else if (i - startDow >= lastDay) {
          dayNum = i - startDow - lastDay + 1;
          cellDate = new Date(viewYear, viewMonth + 1, dayNum);
          isOther = true;
        } else {
          dayNum = i - startDow + 1;
          cellDate = new Date(viewYear, viewMonth, dayNum);
        }

        cellDate.setHours(0, 0, 0, 0);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nb-calendar_day';
        btn.textContent = cellDate.getDate();
        btn.setAttribute('data-date', toISO(cellDate));

        if (isOther) btn.classList.add('is-other-month');
        if (sameDay(cellDate, today)) btn.classList.add('is-today');
        if (selected && sameDay(cellDate, selected)) btn.classList.add('is-selected');
        if (events[toISO(cellDate)]) btn.classList.add('has-event');

        if (isDisabled(cellDate)) {
          btn.classList.add('is-disabled');
          btn.disabled = true;
        }

        gridEl.appendChild(btn);
      }
    }

    render();

    /* ---------------------------------------------------------------- */
    /*  Navigation                                                       */
    /* ---------------------------------------------------------------- */

    function prevMonth() {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      render();
    }

    function nextMonth() {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      render();
    }

    NB.on(prevBtn, 'click', function (e) { e.preventDefault(); prevMonth(); });
    NB.on(nextBtn, 'click', function (e) { e.preventDefault(); nextMonth(); });

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function selectDate(d) {
      selected = new Date(d);
      selected.setHours(0, 0, 0, 0);
      viewMonth = selected.getMonth();
      viewYear = selected.getFullYear();
      render();
      NB.emit(el, 'nb:calendar-select', { date: new Date(selected), iso: toISO(selected) });
    }

    NB.on(gridEl, 'click', function (e) {
      var btn = e.target.closest('.nb-calendar_day');
      if (!btn || btn.disabled) return;
      var d = parseISO(btn.getAttribute('data-date'));
      if (d) selectDate(d);
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard                                                         */
    /* ---------------------------------------------------------------- */

    NB.on(gridEl, 'keydown', function (e) {
      var focused = document.activeElement;
      if (!focused || !focused.classList.contains('nb-calendar_day')) return;

      var d = parseISO(focused.getAttribute('data-date'));
      if (!d) return;

      var nd = null;
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); nd = new Date(d); nd.setDate(nd.getDate() - 1); break;
        case 'ArrowRight': e.preventDefault(); nd = new Date(d); nd.setDate(nd.getDate() + 1); break;
        case 'ArrowUp':    e.preventDefault(); nd = new Date(d); nd.setDate(nd.getDate() - 7); break;
        case 'ArrowDown':  e.preventDefault(); nd = new Date(d); nd.setDate(nd.getDate() + 7); break;
        case 'Enter':      e.preventDefault(); if (!focused.disabled) selectDate(d); return;
        default: return;
      }

      if (!nd || isDisabled(nd)) return;
      nd.setHours(0, 0, 0, 0);

      if (nd.getMonth() !== viewMonth || nd.getFullYear() !== viewYear) {
        viewMonth = nd.getMonth();
        viewYear = nd.getFullYear();
        render();
      }

      var target = gridEl.querySelector('[data-date="' + toISO(nd) + '"]');
      if (target) target.focus();
    });
  });

})(window.NB);


/* --- components/date-display.js --- */

/**
 * NB Date Display Component
 * Renders formatted dates with relative time support and auto-updates.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTH_LONG = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  var activeInstances = [];
  var timerStarted = false;

  /* ------------------------------------------------------------------ */
  /*  Format helpers                                                     */
  /* ------------------------------------------------------------------ */

  function formatRelative(date) {
    var now = Date.now();
    var diff = now - date.getTime();
    var absDiff = Math.abs(diff);
    var seconds = Math.floor(absDiff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    var weeks = Math.floor(days / 7);
    var months = Math.floor(days / 30);
    var years = Math.floor(days / 365);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return minutes + 'm ago';
    if (hours < 24) return hours + 'h ago';
    if (days < 7) return days + 'd ago';
    if (weeks < 5) return weeks + 'w ago';
    if (months < 12) return months + 'mo ago';
    return years + 'y ago';
  }

  function formatShort(date) {
    return MONTH_SHORT[date.getMonth()] + ' ' + date.getDate();
  }

  function formatLong(date) {
    return MONTH_LONG[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
  }

  function formatAbsolute(date) {
    return MONTH_LONG[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() +
      ' at ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
  }

  /* ------------------------------------------------------------------ */
  /*  Auto-update timer                                                  */
  /* ------------------------------------------------------------------ */

  function startTimer() {
    if (timerStarted) return;
    timerStarted = true;

    setInterval(function () {
      activeInstances.forEach(function (inst) {
        inst.update();
      });
    }, 60000);
  }

  /* ------------------------------------------------------------------ */
  /*  Component                                                          */
  /* ------------------------------------------------------------------ */

  NB.register('date', function (el) {
    var timestamp = el.getAttribute('data-nb-date');
    var format = el.getAttribute('data-nb-date-format') || 'relative';

    if (!timestamp || timestamp === 'true') return;

    var date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      var parts = timestamp.split('-');
      if (parts.length === 3) {
        date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      }
      if (isNaN(date.getTime())) return;
    }

    el.classList.add('nb-date');

    function update() {
      var text;
      switch (format) {
        case 'short':
          text = formatShort(date);
          el.classList.add('nb-date--compact');
          break;
        case 'long':
          text = formatLong(date);
          el.classList.add('nb-date--long');
          break;
        case 'relative':
        default:
          text = formatRelative(date);
          el.classList.add('nb-date--relative');

          var diff = Date.now() - date.getTime();
          if (diff < 300000) {
            el.classList.add('nb-date--recent');
          } else {
            el.classList.remove('nb-date--recent');
          }
          break;
      }

      el.textContent = text;
      el.setAttribute('title', formatAbsolute(date));
    }

    update();

    if (format === 'relative') {
      activeInstances.push({ update: update });
      startTimer();
    }
  });

})(window.NB);


/* --- components/marquee.js --- */

/**
 * NB Marquee Component
 * Clones track children for seamless looping. Supports pausable and speed options.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('marquee', function (el) {
    var track = NB.$('.nb-marquee_track', el);
    if (!track || track.dataset.nbCloned) return;

    /* ---------------------------------------------------------------- */
    /*  Read options                                                     */
    /* ---------------------------------------------------------------- */

    var attrVal = el.getAttribute('data-nb-marquee') || '';
    var speed = el.getAttribute('data-nb-marquee-speed');

    if (attrVal === 'pausable' || attrVal === 'pause') {
      el.classList.add('is-pausable');
    }

    if (speed === 'slow') el.classList.add('nb-marquee--slow');
    if (speed === 'fast') el.classList.add('nb-marquee--fast');

    /* ---------------------------------------------------------------- */
    /*  Clone children for seamless loop                                 */
    /* ---------------------------------------------------------------- */

    var items = Array.prototype.slice.call(track.children);
    items.forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    track.dataset.nbCloned = 'true';
  });

})(window.NB);


/* --- components/json-viewer.js --- */

/**
 * NB JSON Viewer Component
 * Collapsible JSON tree with syntax coloring and copy button.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var COPY_ICON =
    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.5"/>' +
    '</svg>';

  var CHECK_ICON =
    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M3 8.5l3.5 3.5 6.5-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  NB.register('json-viewer', function (el) {

    /* ---------------------------------------------------------------- */
    /*  Read JSON                                                        */
    /* ---------------------------------------------------------------- */

    var raw = el.getAttribute('data-nb-json-viewer');

    if (!raw || raw === '' || raw === 'true') {
      var scriptEl = NB.$('script[type="application/json"]', el);
      if (scriptEl) {
        raw = scriptEl.textContent;
      } else {
        raw = el.textContent.trim();
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

    var lineNumbers = el.hasAttribute('data-nb-json-lines');
    var rawJSON = JSON.stringify(data, null, 2);

    /* ---------------------------------------------------------------- */
    /*  Build UI                                                         */
    /* ---------------------------------------------------------------- */

    el.innerHTML = '';
    el.classList.add('nb-json');
    if (lineNumbers) el.classList.add('nb-json--line-numbers');

    // Copy button
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'nb-json_copy';
    copyBtn.innerHTML = COPY_ICON + ' Copy';
    copyBtn.setAttribute('aria-label', 'Copy JSON');
    el.appendChild(copyBtn);

    NB.on(copyBtn, 'click', function () {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(rawJSON).then(function () {
          showCopied();
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = rawJSON;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showCopied();
      }
    });

    function showCopied() {
      copyBtn.innerHTML = CHECK_ICON + ' Copied!';
      copyBtn.classList.add('is-copied');
      setTimeout(function () {
        copyBtn.innerHTML = COPY_ICON + ' Copy';
        copyBtn.classList.remove('is-copied');
      }, 2000);
    }

    // Build tree
    var tree = buildNode(null, data, 0, false);
    el.appendChild(tree);

    /* ---------------------------------------------------------------- */
    /*  Build a node                                                     */
    /* ---------------------------------------------------------------- */

    function buildNode(key, value, depth, isLast) {
      var node = document.createElement('div');
      node.className = 'nb-json_node';

      var type = getType(value);

      if (type === 'object' || type === 'array') {
        buildCompound(node, key, value, type, depth, isLast);
      } else {
        buildPrimitive(node, key, value, type, isLast);
      }

      return node;
    }

    /* ---------------------------------------------------------------- */
    /*  Compound node                                                    */
    /* ---------------------------------------------------------------- */

    function buildCompound(node, key, value, type, depth, isLast) {
      var open = type === 'array' ? '[' : '{';
      var close = type === 'array' ? ']' : '}';
      var keys = Object.keys(value);
      var count = keys.length;
      var label = type === 'array'
        ? count + ' item' + (count !== 1 ? 's' : '')
        : count + ' key' + (count !== 1 ? 's' : '');

      var collapsed = depth >= 2;

      // Line
      var line = document.createElement('div');
      line.className = 'nb-json_line';

      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nb-json_toggle';
      toggle.innerHTML = '<svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 2l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
      if (collapsed) toggle.classList.add('is-collapsed');
      line.appendChild(toggle);

      if (key !== null) {
        var keySpan = document.createElement('span');
        keySpan.className = 'nb-json_key';
        keySpan.textContent = '"' + key + '"';
        line.appendChild(keySpan);

        var colon = document.createElement('span');
        colon.className = 'nb-json_colon';
        colon.textContent = ': ';
        line.appendChild(colon);
      }

      var bracket = document.createElement('span');
      bracket.className = 'nb-json_bracket';
      bracket.textContent = open;
      line.appendChild(bracket);

      var countSpan = document.createElement('span');
      countSpan.className = 'nb-json_count';
      countSpan.textContent = label;
      if (!collapsed) countSpan.style.display = 'none';
      line.appendChild(countSpan);

      var closeInline = document.createElement('span');
      closeInline.className = 'nb-json_bracket';
      closeInline.textContent = close;
      if (!collapsed) closeInline.style.display = 'none';
      line.appendChild(closeInline);

      var commaInline = null;
      if (!isLast) {
        commaInline = document.createElement('span');
        commaInline.className = 'nb-json_comma';
        commaInline.textContent = ',';
        if (!collapsed) commaInline.style.display = 'none';
        line.appendChild(commaInline);
      }

      node.appendChild(line);

      // Children
      var children = document.createElement('div');
      children.className = 'nb-json_children';
      if (collapsed) children.classList.add('is-collapsed');

      for (var i = 0; i < keys.length; i++) {
        var ck = type === 'array' ? null : keys[i];
        children.appendChild(buildNode(ck, value[keys[i]], depth + 1, i === keys.length - 1));
      }
      node.appendChild(children);

      // Closing line
      var closingLine = document.createElement('div');
      closingLine.className = 'nb-json_line nb-json_closing';

      var closingBracket = document.createElement('span');
      closingBracket.className = 'nb-json_bracket';
      closingBracket.textContent = close;
      closingLine.appendChild(closingBracket);

      if (!isLast) {
        var comma = document.createElement('span');
        comma.className = 'nb-json_comma';
        comma.textContent = ',';
        closingLine.appendChild(comma);
      }

      if (collapsed) closingLine.style.display = 'none';
      node.appendChild(closingLine);

      // Toggle handler
      NB.on(toggle, 'click', function () {
        var nowCollapsed = !toggle.classList.contains('is-collapsed');
        toggle.classList.toggle('is-collapsed', nowCollapsed);
        children.classList.toggle('is-collapsed', nowCollapsed);
        countSpan.style.display = nowCollapsed ? '' : 'none';
        closeInline.style.display = nowCollapsed ? '' : 'none';
        closingLine.style.display = nowCollapsed ? 'none' : '';
        if (commaInline) commaInline.style.display = nowCollapsed ? '' : 'none';
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Primitive node                                                   */
    /* ---------------------------------------------------------------- */

    function buildPrimitive(node, key, value, type, isLast) {
      var line = document.createElement('div');
      line.className = 'nb-json_line';

      if (key !== null) {
        var keySpan = document.createElement('span');
        keySpan.className = 'nb-json_key';
        keySpan.textContent = '"' + key + '"';
        line.appendChild(keySpan);

        var colon = document.createElement('span');
        colon.className = 'nb-json_colon';
        colon.textContent = ': ';
        line.appendChild(colon);
      }

      var valSpan = document.createElement('span');
      valSpan.className = 'nb-json_value nb-json_value--' + type;

      if (type === 'string') valSpan.textContent = '"' + value + '"';
      else if (type === 'null') valSpan.textContent = 'null';
      else valSpan.textContent = String(value);

      line.appendChild(valSpan);

      if (!isLast) {
        var comma = document.createElement('span');
        comma.className = 'nb-json_comma';
        comma.textContent = ',';
        line.appendChild(comma);
      }

      node.appendChild(line);
    }

    /* ---------------------------------------------------------------- */
    /*  Type helper                                                      */
    /* ---------------------------------------------------------------- */

    function getType(v) {
      if (v === null) return 'null';
      if (Array.isArray(v)) return 'array';
      return typeof v;
    }
  });

})(window.NB);


/* --- components/clipboard.js --- */

/**
 * NB Clipboard Component
 * Copy-to-clipboard with visual feedback and icon swap.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var COPY_SVG =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.5"/>' +
    '</svg>';

  var CHECK_SVG =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M3 8.5l3.5 3.5 6.5-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  NB.register('clipboard', function (el) {
    var target = el.getAttribute('data-nb-clipboard');
    var iconEl = NB.$('.nb-clipboard_icon', el);

    el.classList.add('nb-clipboard');

    // Create tooltip
    var tooltip = document.createElement('span');
    tooltip.className = 'nb-clipboard_tooltip';
    tooltip.textContent = 'Copied!';
    el.appendChild(tooltip);

    // Set initial icon if icon slot exists
    if (iconEl) {
      iconEl.innerHTML = COPY_SVG;
    }

    /* ---------------------------------------------------------------- */
    /*  Get text to copy                                                 */
    /* ---------------------------------------------------------------- */

    function getTextToCopy() {
      // If target is a selector, get text from that element
      if (target && target !== 'true' && target !== '') {
        var targetEl = document.querySelector(target);
        if (targetEl) {
          return targetEl.textContent || targetEl.value || '';
        }
      }

      // Otherwise use data attribute text or button text
      var text = el.getAttribute('data-nb-clipboard-text');
      if (text) return text;

      return el.textContent.replace('Copied!', '').trim();
    }

    /* ---------------------------------------------------------------- */
    /*  Copy action                                                      */
    /* ---------------------------------------------------------------- */

    function doCopy() {
      var text = getTextToCopy();
      if (!text) return;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(showFeedback);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showFeedback();
      }
    }

    function showFeedback() {
      el.classList.add('is-copied');
      if (iconEl) iconEl.innerHTML = CHECK_SVG;

      NB.emit(el, 'nb:clipboard-copy');

      setTimeout(function () {
        el.classList.remove('is-copied');
        if (iconEl) iconEl.innerHTML = COPY_SVG;
      }, 2000);
    }

    NB.on(el, 'click', function (e) {
      e.preventDefault();
      doCopy();
    });
  });

})(window.NB);


/* --- components/qr-code.js --- */

/**
 * NB QR Code Component
 * Generates a QR code as an SVG element using a simple QR encoding algorithm.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /* ================================================================== */
  /*  Minimal QR encoder (Version 1-4, Mode Byte, ECC L)                */
  /*  Simplified implementation for short text/URLs.                     */
  /* ================================================================== */

  var ALIGNMENT = { 2: [6, 18], 3: [6, 22], 4: [6, 26] };
  var EC_CODEWORDS = { 1: 7, 2: 10, 3: 15, 4: 20 };
  var DATA_CAPACITY = { 1: 17, 2: 32, 3: 53, 4: 78 };
  var SIZES = { 1: 21, 2: 25, 3: 29, 4: 33 };

  /* ---- Galois Field GF(256) tables ---- */

  var EXP = new Array(256);
  var LOG = new Array(256);

  (function () {
    var x = 1;
    for (var i = 0; i < 256; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x >= 256) x ^= 0x11d;
    }
    LOG[0] = undefined;
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[(LOG[a] + LOG[b]) % 255];
  }

  /* ---- Reed-Solomon ECC ---- */

  function rsGenPoly(n) {
    var poly = [1];
    for (var i = 0; i < n; i++) {
      var next = new Array(poly.length + 1);
      for (var j = 0; j < next.length; j++) next[j] = 0;
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    var gen = rsGenPoly(ecLen);
    var msg = new Array(data.length + ecLen);
    for (var i = 0; i < msg.length; i++) msg[i] = 0;
    for (var i = 0; i < data.length; i++) msg[i] = data[i];

    for (var i = 0; i < data.length; i++) {
      var coef = msg[i];
      if (coef === 0) continue;
      for (var j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }

    return msg.slice(data.length);
  }

  /* ---- Bit stream helpers ---- */

  function BitStream() {
    this.bits = [];
  }

  BitStream.prototype.push = function (val, len) {
    for (var i = len - 1; i >= 0; i--) {
      this.bits.push((val >> i) & 1);
    }
  };

  BitStream.prototype.toBytes = function () {
    while (this.bits.length % 8 !== 0) this.bits.push(0);
    var bytes = [];
    for (var i = 0; i < this.bits.length; i += 8) {
      var b = 0;
      for (var j = 0; j < 8; j++) b = (b << 1) | this.bits[i + j];
      bytes.push(b);
    }
    return bytes;
  };

  /* ---- Data encoding (byte mode) ---- */

  function encodeData(text) {
    var bytes = [];
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c < 128) {
        bytes.push(c);
      } else if (c < 2048) {
        bytes.push(0xc0 | (c >> 6));
        bytes.push(0x80 | (c & 0x3f));
      } else {
        bytes.push(0xe0 | (c >> 12));
        bytes.push(0x80 | ((c >> 6) & 0x3f));
        bytes.push(0x80 | (c & 0x3f));
      }
    }

    // Determine version
    var version = 1;
    for (var v = 1; v <= 4; v++) {
      if (bytes.length <= DATA_CAPACITY[v]) { version = v; break; }
      if (v === 4) version = 4;
    }

    var dataCapacity = DATA_CAPACITY[version];
    var ecCount = EC_CODEWORDS[version];

    var bs = new BitStream();
    bs.push(0b0100, 4); // byte mode indicator
    bs.push(bytes.length, version >= 1 ? 8 : 16); // character count

    for (var i = 0; i < bytes.length; i++) {
      bs.push(bytes[i], 8);
    }

    bs.push(0, 4); // terminator

    var dataBytes = bs.toBytes();

    // Pad to capacity
    var padPatterns = [0xEC, 0x11];
    var padIdx = 0;
    while (dataBytes.length < dataCapacity) {
      dataBytes.push(padPatterns[padIdx % 2]);
      padIdx++;
    }

    dataBytes = dataBytes.slice(0, dataCapacity);

    var ecBytes = rsEncode(dataBytes, ecCount);

    return { version: version, data: dataBytes.concat(ecBytes) };
  }

  /* ---- Matrix construction ---- */

  function createMatrix(version) {
    var size = SIZES[version];
    var matrix = [];
    var reserved = [];
    for (var r = 0; r < size; r++) {
      matrix[r] = new Array(size);
      reserved[r] = new Array(size);
      for (var c = 0; c < size; c++) {
        matrix[r][c] = 0;
        reserved[r][c] = false;
      }
    }
    return { matrix: matrix, reserved: reserved, size: size };
  }

  function placeFinderPattern(m, row, col) {
    for (var r = -1; r <= 7; r++) {
      for (var c = -1; c <= 7; c++) {
        var rr = row + r, cc = col + c;
        if (rr < 0 || rr >= m.size || cc < 0 || cc >= m.size) continue;
        var v = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        m.matrix[rr][cc] = v ? 1 : 0;
        m.reserved[rr][cc] = true;
      }
    }
  }

  function placeTimingPatterns(m) {
    for (var i = 8; i < m.size - 8; i++) {
      m.matrix[6][i] = i % 2 === 0 ? 1 : 0;
      m.reserved[6][i] = true;
      m.matrix[i][6] = i % 2 === 0 ? 1 : 0;
      m.reserved[i][6] = true;
    }
  }

  function placeAlignmentPattern(m, version) {
    var positions = ALIGNMENT[version];
    if (!positions) return;
    for (var i = 0; i < positions.length; i++) {
      for (var j = 0; j < positions.length; j++) {
        var r = positions[i], c = positions[j];
        // Skip if overlaps with finder pattern
        if ((r <= 8 && c <= 8) || (r <= 8 && c >= m.size - 8) || (r >= m.size - 8 && c <= 8)) continue;
        for (var dr = -2; dr <= 2; dr++) {
          for (var dc = -2; dc <= 2; dc++) {
            var v = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
            m.matrix[r + dr][c + dc] = v ? 1 : 0;
            m.reserved[r + dr][c + dc] = true;
          }
        }
      }
    }
  }

  function reserveFormatInfo(m) {
    for (var i = 0; i <= 8; i++) {
      if (i < m.size) { m.reserved[8][i] = true; m.reserved[i][8] = true; }
    }
    for (var i = 0; i < 8; i++) {
      m.reserved[8][m.size - 1 - i] = true;
      m.reserved[m.size - 1 - i][8] = true;
    }
    m.matrix[m.size - 8][8] = 1;
    m.reserved[m.size - 8][8] = true;
  }

  function placeData(m, data) {
    var bitIdx = 0;
    var totalBits = data.length * 8;
    var isUpward = true;

    for (var col = m.size - 1; col >= 0; col -= 2) {
      if (col === 6) col = 5; // skip timing column

      var rows = isUpward
        ? (function (s) { var a = []; for (var i = s - 1; i >= 0; i--) a.push(i); return a; })(m.size)
        : (function (s) { var a = []; for (var i = 0; i < s; i++) a.push(i); return a; })(m.size);

      for (var ri = 0; ri < rows.length; ri++) {
        var r = rows[ri];
        for (var dc = 0; dc <= 1; dc++) {
          var c = col - dc;
          if (c < 0) continue;
          if (m.reserved[r][c]) continue;
          if (bitIdx < totalBits) {
            var byteIdx = Math.floor(bitIdx / 8);
            var bitPos = 7 - (bitIdx % 8);
            m.matrix[r][c] = (data[byteIdx] >> bitPos) & 1;
            bitIdx++;
          }
        }
      }

      isUpward = !isUpward;
    }
  }

  function applyMask0(m) {
    for (var r = 0; r < m.size; r++) {
      for (var c = 0; c < m.size; c++) {
        if (!m.reserved[r][c] && (r + c) % 2 === 0) {
          m.matrix[r][c] ^= 1;
        }
      }
    }
  }

  function placeFormatInfo(m) {
    // Format info for ECC L + mask 0: pre-computed
    var FORMAT_BITS = 0x77c4;
    var bits = [];
    for (var i = 14; i >= 0; i--) bits.push((FORMAT_BITS >> i) & 1);

    // Around top-left finder
    for (var i = 0; i <= 5; i++) m.matrix[8][i] = bits[i];
    m.matrix[8][7] = bits[6];
    m.matrix[8][8] = bits[7];
    m.matrix[7][8] = bits[8];
    for (var i = 9; i <= 14; i++) m.matrix[14 - i][8] = bits[i];

    // Around other finders
    for (var i = 0; i <= 7; i++) m.matrix[8][m.size - 1 - i] = bits[i];
    for (var i = 0; i <= 6; i++) m.matrix[m.size - 1 - i][8] = bits[14 - i];
  }

  /* ---- Generate full QR matrix ---- */

  function generateQR(text) {
    var encoded = encodeData(text);
    var m = createMatrix(encoded.version);

    placeFinderPattern(m, 0, 0);
    placeFinderPattern(m, 0, m.size - 7);
    placeFinderPattern(m, m.size - 7, 0);
    placeTimingPatterns(m);
    placeAlignmentPattern(m, encoded.version);
    reserveFormatInfo(m);
    placeData(m, encoded.data);
    applyMask0(m);
    placeFormatInfo(m);

    return m;
  }

  /* ---- Render as SVG ---- */

  function renderSVG(m, fgColor, bgColor) {
    var size = m.size;
    var q = 4; // quiet zone
    var total = size + q * 2;

    var paths = [];
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (m.matrix[r][c]) {
          paths.push('M' + (c + q) + ',' + (r + q) + 'h1v1h-1z');
        }
      }
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges">' +
      '<rect width="' + total + '" height="' + total + '" fill="' + bgColor + '"/>' +
      '<path d="' + paths.join('') + '" fill="' + fgColor + '"/>' +
      '</svg>';
  }

  /* ================================================================== */
  /*  Component                                                          */
  /* ================================================================== */

  NB.register('qr', function (el) {
    var text = el.getAttribute('data-nb-qr');
    if (!text || text === 'true') return;

    el.classList.add('nb-qr');

    var style = getComputedStyle(el);
    var fgColor = style.getPropertyValue('--text-primary').trim() || '#e5e5e5';
    var bgColor = 'transparent';

    try {
      var m = generateQR(text);
      el.innerHTML = renderSVG(m, fgColor, bgColor);
    } catch (err) {
      console.warn('NB qr-code: generation failed', err);
      el.textContent = 'QR Error';
    }
  });

})(window.NB);


/* --- components/tree-view.js --- */

/**
 * NB Tree View Component
 * Hierarchical expandable tree with keyboard navigation and ARIA roles.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var CHEVRON_SVG =
    '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">' +
    '<path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var FOLDER_SVG =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M2 4.5A1.5 1.5 0 0 1 3.5 3H6l1.5 1.5H12.5A1.5 1.5 0 0 1 14 6v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12V4.5z" stroke="currentColor" stroke-width="1.2"/>' +
    '</svg>';

  var FILE_SVG =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M4 2h5l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.2"/>' +
    '<path d="M9 2v4h4" stroke="currentColor" stroke-width="1.2"/>' +
    '</svg>';

  NB.register('tree', function (el) {

    el.classList.add('nb-tree');
    el.setAttribute('role', 'tree');

    var nodes = NB.$$('.nb-tree_node', el);
    var allLabels = [];

    /* ---------------------------------------------------------------- */
    /*  Setup each node                                                  */
    /* ---------------------------------------------------------------- */

    nodes.forEach(function (node) {
      var label = NB.$('.nb-tree_label', node);
      if (!label) return;

      var children = NB.$('.nb-tree_children', node);
      var isLeaf = !children || children.children.length === 0;

      // ARIA
      node.setAttribute('role', 'treeitem');
      if (children) children.setAttribute('role', 'group');

      // Make label focusable
      if (!label.hasAttribute('tabindex')) {
        label.setAttribute('tabindex', '-1');
      }

      allLabels.push(label);

      // Toggle icon
      var toggle = NB.$('.nb-tree_toggle', node);
      if (!toggle) {
        toggle = document.createElement('span');
        toggle.className = 'nb-tree_toggle' + (isLeaf ? ' nb-tree_toggle--leaf' : '');
        toggle.innerHTML = CHEVRON_SVG;
        label.insertBefore(toggle, label.firstChild);
      }

      // Node icon (folder/file)
      var icon = NB.$('.nb-tree_icon', node);
      if (!icon) {
        icon = document.createElement('span');
        icon.className = 'nb-tree_icon' + (isLeaf ? '' : ' nb-tree_icon--folder');
        icon.innerHTML = isLeaf ? FILE_SVG : FOLDER_SVG;
        // Insert after toggle
        if (toggle.nextSibling) {
          label.insertBefore(icon, toggle.nextSibling);
        } else {
          label.appendChild(icon);
        }
      }

      // Default collapsed state
      if (!node.classList.contains('is-collapsed') && !node.hasAttribute('data-nb-tree-open')) {
        // Leave root-level nodes expanded, collapse deeper ones
        var depth = getDepth(node);
        if (depth >= 2) {
          node.classList.add('is-collapsed');
        }
      }

      // Update aria-expanded
      if (!isLeaf) {
        label.setAttribute('aria-expanded', node.classList.contains('is-collapsed') ? 'false' : 'true');
      }
    });

    // First focusable label gets tabindex=0
    if (allLabels.length) {
      allLabels[0].setAttribute('tabindex', '0');
    }

    /* ---------------------------------------------------------------- */
    /*  Depth helper                                                     */
    /* ---------------------------------------------------------------- */

    function getDepth(node) {
      var d = 0;
      var parent = node.parentElement;
      while (parent && parent !== el) {
        if (parent.classList.contains('nb-tree_children')) d++;
        parent = parent.parentElement;
      }
      return d;
    }

    /* ---------------------------------------------------------------- */
    /*  Toggle                                                           */
    /* ---------------------------------------------------------------- */

    function toggleNode(node) {
      var children = NB.$('.nb-tree_children', node);
      if (!children || children.children.length === 0) return;

      var label = NB.$('.nb-tree_label', node);
      var isCollapsed = node.classList.contains('is-collapsed');

      node.classList.toggle('is-collapsed');

      if (label) {
        label.setAttribute('aria-expanded', isCollapsed ? 'true' : 'false');
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Click handler                                                    */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var label = e.target.closest('.nb-tree_label');
      if (!label) return;

      var node = label.closest('.nb-tree_node');
      if (!node || !el.contains(node)) return;

      e.preventDefault();

      // Toggle expand/collapse
      toggleNode(node);

      // Set active state
      allLabels.forEach(function (l) { l.classList.remove('is-active'); });
      label.classList.add('is-active');

      // Focus management
      allLabels.forEach(function (l) { l.setAttribute('tabindex', '-1'); });
      label.setAttribute('tabindex', '0');
      label.focus();

      NB.emit(el, 'nb:tree-select', { node: node, label: label });
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard navigation                                              */
    /* ---------------------------------------------------------------- */

    function getVisibleLabels() {
      return allLabels.filter(function (l) {
        return l.offsetParent !== null;
      });
    }

    NB.on(el, 'keydown', function (e) {
      var focused = document.activeElement;
      if (!focused || !focused.classList.contains('nb-tree_label')) return;

      var visible = getVisibleLabels();
      var idx = visible.indexOf(focused);
      if (idx === -1) return;

      var node = focused.closest('.nb-tree_node');
      var children = node ? NB.$('.nb-tree_children', node) : null;
      var isLeaf = !children || children.children.length === 0;
      var isCollapsed = node && node.classList.contains('is-collapsed');

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (idx < visible.length - 1) focusLabel(visible[idx + 1]);
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (idx > 0) focusLabel(visible[idx - 1]);
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (!isLeaf && isCollapsed) {
            toggleNode(node);
          } else if (!isLeaf) {
            // Focus first child
            var childLabels = getVisibleLabels();
            var nextIdx = childLabels.indexOf(focused);
            if (nextIdx < childLabels.length - 1) focusLabel(childLabels[nextIdx + 1]);
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (!isLeaf && !isCollapsed) {
            toggleNode(node);
          } else {
            // Focus parent
            var parentChildren = node ? node.parentElement : null;
            if (parentChildren && parentChildren.classList.contains('nb-tree_children')) {
              var parentNode = parentChildren.closest('.nb-tree_node');
              if (parentNode) {
                var parentLabel = NB.$('.nb-tree_label', parentNode);
                if (parentLabel) focusLabel(parentLabel);
              }
            }
          }
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          toggleNode(node);

          allLabels.forEach(function (l) { l.classList.remove('is-active'); });
          focused.classList.add('is-active');

          NB.emit(el, 'nb:tree-select', { node: node, label: focused });
          break;

        case 'Home':
          e.preventDefault();
          if (visible.length) focusLabel(visible[0]);
          break;

        case 'End':
          e.preventDefault();
          if (visible.length) focusLabel(visible[visible.length - 1]);
          break;

        default:
          return;
      }
    });

    function focusLabel(label) {
      allLabels.forEach(function (l) { l.setAttribute('tabindex', '-1'); });
      label.setAttribute('tabindex', '0');
      label.focus();
    }
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


/* --- components/kv-editor.js --- */

/**
 * NB Key-Value Editor Component
 * Editable key-value pair rows for headers, query params, etc.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var REMOVE_SVG =
    '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
    '<line x1="2" y1="2" x2="8" y2="8"/>' +
    '<line x1="8" y1="2" x2="2" y2="8"/>' +
    '</svg>';

  NB.kvEditor = {};

  NB.kvEditor.getData = function (el) {
    if (typeof el === 'string') {
      el = document.getElementById(el);
    }
    if (!el) return [];
    return getEntries(el);
  };

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

  NB.register('kv-editor', function (el) {
    var body = NB.$('.nb-kv-editor__body', el);
    if (!body) {
      body = document.createElement('div');
      body.className = 'nb-kv-editor__body';
    }

    var initialData = [];
    var dataAttr = el.getAttribute('data-nb-kv-editor-data');
    if (dataAttr) {
      try {
        initialData = JSON.parse(dataAttr);
      } catch (err) {
        console.warn('NB kv-editor: invalid JSON in data-nb-kv-editor-data', err);
      }
    }

    var existingRows = NB.$$('.nb-kv-editor__row', el);
    var hasExistingRows = existingRows.length > 0;

    el.innerHTML = '';
    el.classList.add('nb-kv-editor');

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

    if (initialData.length) {
      initialData.forEach(function (pair) {
        body.appendChild(createRow(pair.key || '', pair.value || ''));
      });
    } else if (hasExistingRows) {
      existingRows.forEach(function (row) {
        wireRow(row);
        body.appendChild(row);
      });
    }

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

    function wireRow(row) {
      var keyInput = NB.$('.nb-kv-editor__key', row);
      var valInput = NB.$('.nb-kv-editor__value', row);
      var removeBtn = NB.$('.nb-kv-editor__remove', row);

      if (keyInput) {
        NB.on(keyInput, 'input', function () { emitChange(); });
        NB.on(keyInput, 'keydown', function (e) {
          if (e.key === 'Backspace' && keyInput.value === '' && valInput && valInput.value === '') {
            e.preventDefault();
            removeRow(row);
          }
        });
      }

      if (valInput) {
        NB.on(valInput, 'input', function () { emitChange(); });
      }

      if (removeBtn) {
        NB.on(removeBtn, 'click', function () { removeRow(row); });
      }
    }

    function removeRow(row) {
      if (row.parentNode) row.parentNode.removeChild(row);
      emitChange();
    }

    function emitChange() {
      NB.emit(el, 'nb:kv-change', { entries: getEntries(el) });
    }
  });

})(window.NB);


/* --- components/alert-dismiss.js --- */

/**
 * NB Alert Dismiss Component
 * Handles dismissing alerts with a fade-out animation and DOM removal.
 *
 * Usage:
 *   <div class="nb-alert nb-alert--info" data-nb-alert>
 *     <span class="nb-alert_icon">...</span>
 *     <div class="nb-alert_content">
 *       <div class="nb-alert_title">Title</div>
 *       Message text
 *     </div>
 *     <button class="nb-alert_close" data-nb-alert-dismiss>
 *       &times;
 *     </button>
 *   </div>
 *
 * Events:
 *   nb:alert-dismiss — on the alert element, before removal
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Dismiss handler                                                    */
  /* ------------------------------------------------------------------ */

  function dismissAlert(alertEl) {
    if (!alertEl || alertEl._nbDismissed) return;
    alertEl._nbDismissed = true;

    NB.emit(alertEl, 'nb:alert-dismiss');

    /* Fade out */
    alertEl.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    alertEl.style.opacity = '0';
    alertEl.style.transform = 'translateY(-4px)';

    /* Remove from DOM after transition */
    setTimeout(function () {
      if (alertEl.parentNode) {
        alertEl.parentNode.removeChild(alertEl);
      }
    }, 160);
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  NB.register('alert', function (el) {
    var closeBtn = el.querySelector('[data-nb-alert-dismiss]');
    if (!closeBtn) return;

    NB.on(closeBtn, 'click', function () {
      dismissAlert(el);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Delegated click handler for dismiss buttons                        */
  /* ------------------------------------------------------------------ */

  NB.on(document, 'click', function (e) {
    var btn = e.target.closest('[data-nb-alert-dismiss]');
    if (!btn) return;

    var alert = btn.closest('.nb-alert');
    if (alert) {
      dismissAlert(alert);
    }
  });

})(window.NB);


/* --- components/modal.js --- */

/**
 * NB Modal Component
 * Manages modal open/close, backdrop click, Escape key, focus trap,
 * and body scroll lock.
 *
 * Usage:
 *   <div class="nb-modal-backdrop" id="my-modal" data-nb-modal>
 *     <div class="nb-modal">
 *       <div class="nb-modal_header">
 *         <h3 class="nb-modal_title">Title</h3>
 *         <button class="nb-modal_close">&times;</button>
 *       </div>
 *       <div class="nb-modal_body">Content</div>
 *       <div class="nb-modal_footer">Actions</div>
 *     </div>
 *   </div>
 *
 *   <button data-nb-modal-open="my-modal">Open</button>
 *
 * API:
 *   NB.modal.open(id)
 *   NB.modal.close(id)
 *   NB.modal.closeAll()
 *
 * Events:
 *   nb:modal-open   — detail: { id }
 *   nb:modal-close  — detail: { id }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var openModals = [];
  var scrollbarWidth = 0;

  /* ------------------------------------------------------------------ */
  /*  Scrollbar width measurement                                        */
  /* ------------------------------------------------------------------ */

  function measureScrollbar() {
    var outer = document.createElement('div');
    outer.style.cssText =
      'position:fixed;top:0;left:0;width:50px;height:50px;overflow:scroll;visibility:hidden;';
    document.body.appendChild(outer);
    scrollbarWidth = outer.offsetWidth - outer.clientWidth;
    document.body.removeChild(outer);
  }

  /* ------------------------------------------------------------------ */
  /*  Scroll lock                                                        */
  /* ------------------------------------------------------------------ */

  function lockBody() {
    if (openModals.length > 0) return; // already locked
    if (!scrollbarWidth) measureScrollbar();
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth) {
      document.body.style.paddingRight = scrollbarWidth + 'px';
    }
  }

  function unlockBody() {
    if (openModals.length > 0) return; // other modals still open
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  /* ------------------------------------------------------------------ */
  /*  Open / Close                                                       */
  /* ------------------------------------------------------------------ */

  function openModal(id) {
    var backdrop = document.getElementById(id);
    if (!backdrop || backdrop.classList.contains('is-open')) return;

    lockBody();
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');

    var modal = backdrop.querySelector('.nb-modal');
    if (modal) {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
    }

    // Store release function for focus trap
    backdrop._nbReleaseFocus = NB.trapFocus(modal || backdrop);
    openModals.push(id);

    NB.emit(backdrop, 'nb:modal-open', { id: id });
  }

  function closeModal(id) {
    var backdrop = document.getElementById(id);
    if (!backdrop || !backdrop.classList.contains('is-open')) return;

    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');

    // Release focus trap
    if (backdrop._nbReleaseFocus) {
      backdrop._nbReleaseFocus();
      backdrop._nbReleaseFocus = null;
    }

    // Remove from open list
    var idx = openModals.indexOf(id);
    if (idx !== -1) openModals.splice(idx, 1);

    unlockBody();
    NB.emit(backdrop, 'nb:modal-close', { id: id });
  }

  function closeAll() {
    var ids = openModals.slice();
    for (var i = 0; i < ids.length; i++) {
      closeModal(ids[i]);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  NB.register('modal', function (backdrop) {
    var id = backdrop.id;
    if (!id) {
      id = NB.uid('modal');
      backdrop.id = id;
    }

    backdrop.setAttribute('aria-hidden', 'true');

    /* Close button */
    var closeBtn = backdrop.querySelector('.nb-modal_close');
    if (closeBtn) {
      NB.on(closeBtn, 'click', function () {
        closeModal(id);
      });
    }

    /* Backdrop click */
    NB.on(backdrop, 'click', function (e) {
      if (e.target === backdrop) {
        closeModal(id);
      }
    });

    /* Escape key */
    NB.on(backdrop, 'keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal(id);
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Open triggers — delegated                                          */
  /* ------------------------------------------------------------------ */

  function handleOpenTrigger(e) {
    var trigger = e.target.closest('[data-nb-modal-open]');
    if (trigger) {
      var targetId = trigger.getAttribute('data-nb-modal-open');
      if (targetId) openModal(targetId);
    }
  }

  NB.on(document, 'click', handleOpenTrigger);

  /** Remove the delegated open-trigger listener (called by NB.destroy). */
  NB._addCleanup(document, function () {
    NB.off(document, 'click', handleOpenTrigger);
  });

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  NB.modal = {
    open: openModal,
    close: closeModal,
    closeAll: closeAll,
  };

})(window.NB);


/* --- components/drawer.js --- */

/**
 * NB Drawer Component
 * Slide-in panel from right, left, or bottom with backdrop, Escape key,
 * and focus trap.
 *
 * Usage:
 *   <div class="nb-drawer-backdrop" data-nb-drawer>
 *     <div class="nb-drawer nb-drawer--right" id="my-drawer">
 *       <div class="nb-drawer_header">
 *         <h3 class="nb-drawer_title">Title</h3>
 *         <button class="nb-drawer_close">&times;</button>
 *       </div>
 *       <div class="nb-drawer_body">Content</div>
 *     </div>
 *   </div>
 *
 *   <button data-nb-drawer-open="my-drawer">Open</button>
 *
 * API:
 *   NB.drawer.open(id)
 *   NB.drawer.close(id)
 *
 * Events:
 *   nb:drawer-open   — detail: { id }
 *   nb:drawer-close  — detail: { id }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var openDrawers = [];

  /* ------------------------------------------------------------------ */
  /*  Scroll lock                                                        */
  /* ------------------------------------------------------------------ */

  function lockBody() {
    if (openDrawers.length > 0) return;
    document.body.style.overflow = 'hidden';
  }

  function unlockBody() {
    if (openDrawers.length > 0) return;
    document.body.style.overflow = '';
  }

  /* ------------------------------------------------------------------ */
  /*  Open / Close                                                       */
  /* ------------------------------------------------------------------ */

  function openDrawer(id) {
    var drawer = document.getElementById(id);
    if (!drawer) return;

    /* Determine if the target is the drawer itself or a backdrop wrapper */
    var backdrop = drawer.closest('.nb-drawer-backdrop');
    var panel = drawer.classList.contains('nb-drawer') ? drawer : drawer.querySelector('.nb-drawer');

    if (!panel || panel.classList.contains('is-open')) return;

    lockBody();
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    if (backdrop) {
      backdrop.classList.add('is-open');
    }

    panel._nbReleaseFocus = NB.trapFocus(panel);
    openDrawers.push(id);

    NB.emit(panel, 'nb:drawer-open', { id: id });
  }

  function closeDrawer(id) {
    var drawer = document.getElementById(id);
    if (!drawer) return;

    var backdrop = drawer.closest('.nb-drawer-backdrop');
    var panel = drawer.classList.contains('nb-drawer') ? drawer : drawer.querySelector('.nb-drawer');

    if (!panel || !panel.classList.contains('is-open')) return;

    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');

    if (backdrop) {
      backdrop.classList.remove('is-open');
    }

    if (panel._nbReleaseFocus) {
      panel._nbReleaseFocus();
      panel._nbReleaseFocus = null;
    }

    var idx = openDrawers.indexOf(id);
    if (idx !== -1) openDrawers.splice(idx, 1);

    unlockBody();
    NB.emit(panel, 'nb:drawer-close', { id: id });
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  NB.register('drawer', function (el) {
    /* el may be the backdrop or the drawer panel itself */
    var backdrop = el.classList.contains('nb-drawer-backdrop') ? el : null;
    var drawers = backdrop
      ? NB.$$('.nb-drawer', backdrop)
      : [el];

    drawers.forEach(function (panel) {
      var id = panel.id;
      if (!id) {
        id = NB.uid('drawer');
        panel.id = id;
      }

      panel.setAttribute('aria-hidden', 'true');

      /* Close button */
      var closeBtn = panel.querySelector('.nb-drawer_close');
      if (closeBtn) {
        NB.on(closeBtn, 'click', function () {
          closeDrawer(id);
        });
      }

      /* Escape key */
      NB.on(panel, 'keydown', function (e) {
        if (e.key === 'Escape') {
          closeDrawer(id);
        }
      });
    });

    /* Backdrop click */
    if (backdrop) {
      NB.on(backdrop, 'click', function (e) {
        if (e.target === backdrop) {
          /* Close the first open drawer in this backdrop */
          drawers.forEach(function (panel) {
            if (panel.classList.contains('is-open') && panel.id) {
              closeDrawer(panel.id);
            }
          });
        }
      });
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Open triggers — delegated                                          */
  /* ------------------------------------------------------------------ */

  function handleOpenTrigger(e) {
    var trigger = e.target.closest('[data-nb-drawer-open]');
    if (trigger) {
      var targetId = trigger.getAttribute('data-nb-drawer-open');
      if (targetId) openDrawer(targetId);
    }
  }

  NB.on(document, 'click', handleOpenTrigger);

  /** Remove the delegated open-trigger listener (called by NB.destroy). */
  NB._addCleanup(document, function () {
    NB.off(document, 'click', handleOpenTrigger);
  });

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  NB.drawer = {
    open: openDrawer,
    close: closeDrawer,
  };

})(window.NB);


/* --- components/tooltip.js --- */

/**
 * NB Tooltip Component
 * Shows tooltip content on mouseenter/focus, hides on mouseleave/blur.
 * Adds `is-visible` class with a slight delay for smoother UX.
 *
 * Usage:
 *   <span class="nb-tooltip nb-tooltip--top" data-nb-tooltip>
 *     Hover me
 *     <span class="nb-tooltip_content">Tooltip text</span>
 *   </span>
 *
 * Options (via data attributes):
 *   data-nb-tooltip-delay="200"  — show delay in ms (default: 100)
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('tooltip', function (el) {
    var content = el.querySelector('.nb-tooltip_content');
    if (!content) return;

    var delay = parseInt(el.getAttribute('data-nb-tooltip-delay'), 10) || 100;
    var showTimer = null;
    var hideTimer = null;

    /* Ensure ARIA */
    var tooltipId = content.id || NB.uid('tooltip');
    content.id = tooltipId;
    content.setAttribute('role', 'tooltip');

    /* Find the trigger — first child that is not the content */
    var trigger = el.firstElementChild;
    if (trigger === content) trigger = el;
    trigger.setAttribute('aria-describedby', tooltipId);

    /* ---------------------------------------------------------------- */
    /*  Show / Hide                                                      */
    /* ---------------------------------------------------------------- */

    function show() {
      clearTimeout(hideTimer);
      showTimer = setTimeout(function () {
        el.classList.add('is-visible');
      }, delay);
    }

    function hide() {
      clearTimeout(showTimer);
      hideTimer = setTimeout(function () {
        el.classList.remove('is-visible');
      }, 50);
    }

    /* ---------------------------------------------------------------- */
    /*  Event binding                                                     */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'mouseenter', show);
    NB.on(el, 'mouseleave', hide);
    NB.on(el, 'focusin', show);
    NB.on(el, 'focusout', hide);

    /* Return cleanup for NB.destroy() */
    return function () {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  });

})(window.NB);


/* --- components/toast.js --- */

/**
 * NB Toast Component
 * Programmatic toast notifications with auto-dismiss and hover pause.
 *
 * Usage:
 *   <!-- Container (place once in your page) -->
 *   <div class="nb-toast-container nb-toast-container--top-right"
 *        data-nb-toast-container></div>
 *
 * API:
 *   NB.toast({ title, message, type, duration, closable })
 *   NB.toast.success(message, options?)
 *   NB.toast.danger(message, options?)
 *   NB.toast.warning(message, options?)
 *   NB.toast.info(message, options?)
 *
 * Options:
 *   title    — string (optional heading)
 *   message  — string (required body text)
 *   type     — 'success' | 'danger' | 'warning' | 'info' (default: none)
 *   duration — ms before auto-dismiss (default: 5000, 0 = no auto)
 *   closable — show close button (default: true)
 *
 * Events:
 *   nb:toast-dismiss — on the toast element, detail: { type }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var container = null;
  var DEFAULT_DURATION = 5000;

  /* ------------------------------------------------------------------ */
  /*  SVG icons by type                                                  */
  /* ------------------------------------------------------------------ */

  var ICONS = {
    success:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    danger:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  var CLOSE_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  /* ------------------------------------------------------------------ */
  /*  Find or create container                                           */
  /* ------------------------------------------------------------------ */

  function getContainer() {
    if (container && document.body.contains(container)) return container;

    container = document.querySelector('[data-nb-toast-container]');
    if (!container) {
      container = document.createElement('div');
      container.className = 'nb-toast-container nb-toast-container--top-right';
      container.setAttribute('data-nb-toast-container', '');
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-relevant', 'additions');
      document.body.appendChild(container);
    }
    return container;
  }

  /* ------------------------------------------------------------------ */
  /*  Dismiss a toast                                                    */
  /* ------------------------------------------------------------------ */

  function dismiss(toastEl) {
    if (toastEl._nbDismissed) return;
    toastEl._nbDismissed = true;

    toastEl.classList.add('is-exiting');
    NB.emit(toastEl, 'nb:toast-dismiss', {
      type: toastEl._nbType || null,
    });

    /* Remove after animation */
    setTimeout(function () {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, 220);
  }

  /* ------------------------------------------------------------------ */
  /*  Create & show toast                                                */
  /* ------------------------------------------------------------------ */

  function createToast(opts) {
    if (typeof opts === 'string') {
      opts = { message: opts };
    }

    var type = opts.type || '';
    var title = opts.title || '';
    var message = opts.message || '';
    var duration = opts.duration !== undefined ? opts.duration : DEFAULT_DURATION;
    var closable = opts.closable !== undefined ? opts.closable : true;

    /* Build element */
    var toast = document.createElement('div');
    toast.className = 'nb-toast' + (type ? ' nb-toast--' + type : '');
    toast.setAttribute('role', 'alert');
    toast._nbType = type;

    var html = '';

    /* Icon */
    if (type && ICONS[type]) {
      html += '<span class="nb-toast_icon">' + ICONS[type] + '</span>';
    }

    /* Content */
    html += '<div class="nb-toast_content">';
    if (title) {
      html += '<div class="nb-toast_title">' + escapeHtml(title) + '</div>';
    }
    if (message) {
      html += '<div class="nb-toast_message">' + escapeHtml(message) + '</div>';
    }
    html += '</div>';

    /* Close */
    if (closable) {
      html +=
        '<button class="nb-toast_close" aria-label="Dismiss">' +
        CLOSE_ICON +
        '</button>';
    }

    toast.innerHTML = html;

    /* Close button handler */
    if (closable) {
      var closeBtn = toast.querySelector('.nb-toast_close');
      NB.on(closeBtn, 'click', function () {
        dismiss(toast);
      });
    }

    /* Auto-dismiss timer */
    var timer = null;

    function startTimer() {
      if (duration > 0) {
        timer = setTimeout(function () {
          dismiss(toast);
        }, duration);
      }
    }

    function pauseTimer() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    /* Pause on hover */
    NB.on(toast, 'mouseenter', pauseTimer);
    NB.on(toast, 'mouseleave', startTimer);

    /* Append and start */
    getContainer().appendChild(toast);
    startTimer();

    return toast;
  }

  /* ------------------------------------------------------------------ */
  /*  HTML escape                                                        */
  /* ------------------------------------------------------------------ */

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ------------------------------------------------------------------ */
  /*  Shortcut methods                                                   */
  /* ------------------------------------------------------------------ */

  createToast.success = function (message, opts) {
    return createToast(Object.assign({ type: 'success', message: message }, opts || {}));
  };

  createToast.danger = function (message, opts) {
    return createToast(Object.assign({ type: 'danger', message: message }, opts || {}));
  };

  createToast.warning = function (message, opts) {
    return createToast(Object.assign({ type: 'warning', message: message }, opts || {}));
  };

  createToast.info = function (message, opts) {
    return createToast(Object.assign({ type: 'info', message: message }, opts || {}));
  };

  /* ------------------------------------------------------------------ */
  /*  Register container element (for ARIA)                              */
  /* ------------------------------------------------------------------ */

  NB.register('toast-container', function (el) {
    container = el;
    if (!el.getAttribute('aria-live')) {
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-relevant', 'additions');
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  NB.toast = createToast;

})(window.NB);


/* --- components/popover.js --- */

/**
 * NB Popover Component
 * Toggle popover content on trigger click. Closes on outside click
 * or Escape key. Manages ARIA attributes.
 *
 * Usage:
 *   <div class="nb-popover nb-popover--bottom" data-nb-popover>
 *     <button class="nb-popover_trigger">Click me</button>
 *     <div class="nb-popover_content">
 *       <div class="nb-popover_arrow"></div>
 *       Popover content
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:popover-open  — detail: { id }
 *   nb:popover-close — detail: { id }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var openPopovers = [];

  /* ------------------------------------------------------------------ */
  /*  Close a specific popover                                           */
  /* ------------------------------------------------------------------ */

  function closePopover(el) {
    if (!el.classList.contains('is-open')) return;

    el.classList.remove('is-open');

    var content = el.querySelector('.nb-popover_content');
    if (content) {
      content.setAttribute('aria-hidden', 'true');
    }

    var trigger = el.querySelector('.nb-popover_trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }

    var idx = openPopovers.indexOf(el);
    if (idx !== -1) openPopovers.splice(idx, 1);

    NB.emit(el, 'nb:popover-close', { id: el.id || null });
  }

  /* ------------------------------------------------------------------ */
  /*  Open a specific popover                                            */
  /* ------------------------------------------------------------------ */

  function openPopover(el) {
    if (el.classList.contains('is-open')) return;

    /* Close all other open popovers */
    var others = openPopovers.slice();
    for (var i = 0; i < others.length; i++) {
      closePopover(others[i]);
    }

    el.classList.add('is-open');

    var content = el.querySelector('.nb-popover_content');
    if (content) {
      content.setAttribute('aria-hidden', 'false');
    }

    var trigger = el.querySelector('.nb-popover_trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'true');
    }

    openPopovers.push(el);
    NB.emit(el, 'nb:popover-open', { id: el.id || null });
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  NB.register('popover', function (el) {
    if (!el.id) {
      el.id = NB.uid('popover');
    }

    var trigger = el.querySelector('.nb-popover_trigger');
    var content = el.querySelector('.nb-popover_content');

    if (!trigger || !content) return;

    /* ARIA setup */
    var contentId = content.id || NB.uid('popover-content');
    content.id = contentId;
    content.setAttribute('role', 'dialog');
    content.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', contentId);

    /* Toggle on trigger click */
    NB.on(trigger, 'click', function (e) {
      e.stopPropagation();
      if (el.classList.contains('is-open')) {
        closePopover(el);
      } else {
        openPopover(el);
      }
    });

    /* Escape key */
    NB.on(el, 'keydown', function (e) {
      if (e.key === 'Escape' && el.classList.contains('is-open')) {
        closePopover(el);
        trigger.focus();
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Close on outside click — delegated                                 */
  /* ------------------------------------------------------------------ */

  NB.on(document, 'click', function (e) {
    if (!openPopovers.length) return;

    var popovers = openPopovers.slice();
    for (var i = 0; i < popovers.length; i++) {
      if (!popovers[i].contains(e.target)) {
        closePopover(popovers[i]);
      }
    }
  });

})(window.NB);


/* --- components/hover-card.js --- */

/**
 * NB Hover Card Component
 * Rich content card that appears on hover with show/hide delays.
 *
 * Usage:
 *   <div class="nb-hover-card" data-nb-hover-card>
 *     <a class="nb-hover-card_trigger" href="#">@username</a>
 *     <div class="nb-hover-card_content">
 *       <div class="nb-hover-card_header">
 *         <img class="nb-hover-card_avatar" src="..." alt="" />
 *         <div>
 *           <div class="nb-hover-card_name">Name</div>
 *           <div class="nb-hover-card_handle">@username</div>
 *         </div>
 *       </div>
 *       <div class="nb-hover-card_body">Bio text here</div>
 *     </div>
 *   </div>
 *
 * Options:
 *   data-nb-hover-show="300"   — show delay in ms (default 300)
 *   data-nb-hover-hide="200"   — hide delay in ms (default 200)
 *
 * Events:
 *   nb:hover-card-open  — detail: { id }
 *   nb:hover-card-close — detail: { id }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('hover-card', function (el) {

    var trigger = NB.$('.nb-hover-card_trigger', el);
    var content = NB.$('.nb-hover-card_content', el);
    if (!trigger || !content) return;

    var showDelay = parseInt(el.getAttribute('data-nb-hover-show'), 10) || 300;
    var hideDelay = parseInt(el.getAttribute('data-nb-hover-hide'), 10) || 200;
    var showTimer = null;
    var hideTimer = null;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    var contentId = content.id || NB.uid('nb-hover-card');
    content.id = contentId;
    content.setAttribute('role', 'tooltip');
    trigger.setAttribute('aria-describedby', contentId);

    /* -------------------------------------------------------------- */
    /*  Auto-position                                                  */
    /* -------------------------------------------------------------- */

    function autoPosition() {
      var rect = el.getBoundingClientRect();
      var spaceBelow = window.innerHeight - rect.bottom;
      var spaceAbove = rect.top;

      el.classList.remove('nb-hover-card--top', 'nb-hover-card--bottom');
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        el.classList.add('nb-hover-card--top');
      } else {
        el.classList.add('nb-hover-card--bottom');
      }
    }

    /* -------------------------------------------------------------- */
    /*  Show / Hide                                                    */
    /* -------------------------------------------------------------- */

    function show() {
      clearTimeout(hideTimer);
      showTimer = setTimeout(function () {
        autoPosition();
        el.classList.add('is-open');
        NB.emit(el, 'nb:hover-card-open', { id: contentId });
      }, showDelay);
    }

    function hide() {
      clearTimeout(showTimer);
      hideTimer = setTimeout(function () {
        el.classList.remove('is-open');
        NB.emit(el, 'nb:hover-card-close', { id: contentId });
      }, hideDelay);
    }

    /* -------------------------------------------------------------- */
    /*  Event handlers                                                 */
    /* -------------------------------------------------------------- */

    NB.on(trigger, 'mouseenter', show);
    NB.on(trigger, 'mouseleave', hide);

    NB.on(content, 'mouseenter', function () {
      clearTimeout(hideTimer);
    });

    NB.on(content, 'mouseleave', hide);

    /* Focus support */
    NB.on(trigger, 'focus', show);
    NB.on(trigger, 'blur', hide);

  });
})(window.NB);


/* --- components/pricing-table.js --- */

/**
 * NB Pricing Table Component
 * Toggles between monthly and annual pricing.
 * Switches visibility of elements with data-nb-price-monthly / data-nb-price-annual.
 *
 * Usage:
 *   <div class="nb-pricing-table" data-nb-pricing-table>
 *     <div class="nb-pricing-table_toggle">
 *       <span class="nb-pricing-table_toggle-label is-active" data-nb-toggle-monthly>Monthly</span>
 *       <button class="nb-pricing-table_toggle-switch" aria-label="Toggle annual pricing"></button>
 *       <span class="nb-pricing-table_toggle-label" data-nb-toggle-annual>Annual</span>
 *       <span class="nb-pricing-table_save">Save 20%</span>
 *     </div>
 *     ...
 *     <span data-nb-price-monthly>$19</span>
 *     <span data-nb-price-annual>$15</span>
 *   </div>
 *
 * Events:
 *   nb:pricing-change — detail: { billing: 'monthly' | 'annual' }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('pricing-table', function (el) {
    var toggle       = NB.$('.nb-pricing-table_toggle-switch', el);
    var labelMonthly = NB.$('[data-nb-toggle-monthly]', el);
    var labelAnnual  = NB.$('[data-nb-toggle-annual]', el);

    if (!toggle) return;

    var isAnnual = false;

    function update() {
      if (isAnnual) {
        el.classList.add('is-annual');
        toggle.classList.add('is-annual');
        if (labelMonthly) labelMonthly.classList.remove('is-active');
        if (labelAnnual) labelAnnual.classList.add('is-active');
      } else {
        el.classList.remove('is-annual');
        toggle.classList.remove('is-annual');
        if (labelMonthly) labelMonthly.classList.add('is-active');
        if (labelAnnual) labelAnnual.classList.remove('is-active');
      }

      toggle.setAttribute('aria-checked', String(isAnnual));
      NB.emit(el, 'nb:pricing-change', {
        billing: isAnnual ? 'annual' : 'monthly',
      });
    }

    /* ----- Setup ARIA ----- */
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', 'false');

    /* ----- Click toggle switch ----- */
    NB.on(toggle, 'click', function () {
      isAnnual = !isAnnual;
      update();
    });

    /* ----- Click labels ----- */
    if (labelMonthly) {
      NB.on(labelMonthly, 'click', function () {
        isAnnual = false;
        update();
      });
    }
    if (labelAnnual) {
      NB.on(labelAnnual, 'click', function () {
        isAnnual = true;
        update();
      });
    }

    /* ----- Keyboard ----- */
    NB.on(toggle, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        isAnnual = !isAnnual;
        update();
      }
    });

    /* Ensure toggle is focusable */
    if (!toggle.getAttribute('tabindex')) {
      toggle.setAttribute('tabindex', '0');
    }
  });

})(window.NB);


/* --- components/testimonial-slider.js --- */

/**
 * NB Testimonial Slider Component
 * Carousel of testimonial slides with auto-advance and pause on hover.
 *
 * Usage:
 *   <div class="nb-testimonial-slider" data-nb-testimonial-slider
 *        data-nb-interval="5000">
 *     <div class="nb-testimonial-slider_track">
 *       <div class="nb-testimonial-slider_slide">...</div>
 *       <div class="nb-testimonial-slider_slide">...</div>
 *     </div>
 *     <div class="nb-testimonial-slider_nav">
 *       <button class="nb-testimonial-slider_prev" aria-label="Previous">
 *         <svg>...</svg>
 *       </button>
 *       <div class="nb-testimonial-slider_dots"></div>
 *       <button class="nb-testimonial-slider_next" aria-label="Next">
 *         <svg>...</svg>
 *       </button>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-nb-interval — auto-advance interval in ms (default: 5000, 0 = off)
 *
 * Events:
 *   nb:slide-change — detail: { index, total }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('testimonial-slider', function (el) {
    var track    = NB.$('.nb-testimonial-slider_track', el);
    var slides   = NB.$$('.nb-testimonial-slider_slide', el);
    var prevBtn  = NB.$('.nb-testimonial-slider_prev', el);
    var nextBtn  = NB.$('.nb-testimonial-slider_next', el);
    var dotsWrap = NB.$('.nb-testimonial-slider_dots', el);

    if (!track || slides.length < 2) return;

    var total    = slides.length;
    var current  = 0;
    var interval = parseInt(el.getAttribute('data-nb-interval'), 10);
    if (isNaN(interval)) interval = 5000;
    var timer    = null;

    /* -------------------------------------------------------------- */
    /*  Build dot indicators                                          */
    /* -------------------------------------------------------------- */

    var dots = [];
    if (dotsWrap) {
      for (var i = 0; i < total; i++) {
        var dot = document.createElement('button');
        dot.className = 'nb-testimonial-slider_dot';
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.setAttribute('type', 'button');
        if (i === 0) dot.classList.add('is-active');
        dots.push(dot);
        dotsWrap.appendChild(dot);
      }
    }

    /* -------------------------------------------------------------- */
    /*  Go to slide                                                    */
    /* -------------------------------------------------------------- */

    function goTo(index) {
      if (index < 0) index = total - 1;
      if (index >= total) index = 0;

      current = index;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';

      /* Update dots */
      for (var d = 0; d < dots.length; d++) {
        dots[d].classList.toggle('is-active', d === current);
      }

      /* Update prev/next disabled state */
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;

      /* Emit event */
      NB.emit(el, 'nb:slide-change', { index: current, total: total });
    }

    /* -------------------------------------------------------------- */
    /*  Auto-advance                                                   */
    /* -------------------------------------------------------------- */

    function startAuto() {
      stopAuto();
      if (interval > 0) {
        timer = setInterval(function () {
          goTo(current + 1);
        }, interval);
      }
    }

    function stopAuto() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    /* Pause on hover */
    NB.on(el, 'mouseenter', stopAuto);
    NB.on(el, 'mouseleave', startAuto);

    /* Pause on focus within (keyboard users) */
    NB.on(el, 'focusin', stopAuto);
    NB.on(el, 'focusout', function (e) {
      if (!el.contains(e.relatedTarget)) startAuto();
    });

    /* -------------------------------------------------------------- */
    /*  Navigation buttons                                             */
    /* -------------------------------------------------------------- */

    if (prevBtn) {
      NB.on(prevBtn, 'click', function () {
        goTo(current - 1);
        startAuto(); // restart timer on manual nav
      });
    }

    if (nextBtn) {
      NB.on(nextBtn, 'click', function () {
        goTo(current + 1);
        startAuto();
      });
    }

    /* -------------------------------------------------------------- */
    /*  Dot click                                                      */
    /* -------------------------------------------------------------- */

    if (dotsWrap) {
      NB.on(dotsWrap, 'click', function (e) {
        var dot = e.target.closest('.nb-testimonial-slider_dot');
        if (!dot) return;
        var idx = dots.indexOf(dot);
        if (idx >= 0) {
          goTo(idx);
          startAuto();
        }
      });
    }

    /* -------------------------------------------------------------- */
    /*  Keyboard navigation                                            */
    /* -------------------------------------------------------------- */

    NB.on(el, 'keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(current - 1);
        startAuto();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(current + 1);
        startAuto();
      }
    });

    /* -------------------------------------------------------------- */
    /*  ARIA                                                           */
    /* -------------------------------------------------------------- */

    el.setAttribute('role', 'region');
    el.setAttribute('aria-roledescription', 'carousel');
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', 'Testimonials');
    }

    slides.forEach(function (slide, idx) {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', 'Slide ' + (idx + 1) + ' of ' + total);
    });

    /* -------------------------------------------------------------- */
    /*  Init                                                           */
    /* -------------------------------------------------------------- */

    goTo(0);
    startAuto();
  });

})(window.NB);


/* --- components/faq.js --- */

/**
 * NB FAQ Component
 * Accordion-based FAQ with smooth expand/collapse animation.
 * Uses a plus/x icon rotation pattern for the toggle indicator.
 * Schema-friendly: works with itemscope/itemprop markup.
 *
 * Usage:
 *   <div class="nb-faq" data-nb-faq>
 *     <div class="nb-faq_item" itemscope itemprop="mainEntity"
 *          itemtype="https://schema.org/Question">
 *       <button class="nb-faq_question" itemprop="name">
 *         Question text?
 *         <svg class="nb-faq_icon">...</svg>
 *       </button>
 *       <div class="nb-faq_answer" itemscope itemprop="acceptedAnswer"
 *            itemtype="https://schema.org/Answer">
 *         <div class="nb-faq_answer-body" itemprop="text">
 *           Answer text here.
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-nb-faq           — multi-open (default)
 *   data-nb-faq="single"  — only one open at a time
 *
 * Events:
 *   nb:faq-toggle — detail: { item, open }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('faq', function (el) {
    var mode     = el.getAttribute('data-nb-faq');
    var isSingle = mode === 'single';
    var items    = NB.$$('.nb-faq_item', el);

    if (!items.length) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    items.forEach(function (item) {
      var question = NB.$('.nb-faq_question', item);
      var answer   = NB.$('.nb-faq_answer', item);
      if (!question || !answer) return;

      var answerId   = answer.id || NB.uid('nb-faq-a');
      var questionId = question.id || NB.uid('nb-faq-q');

      answer.id = answerId;
      question.id = questionId;

      question.setAttribute('aria-controls', answerId);
      answer.setAttribute('role', 'region');
      answer.setAttribute('aria-labelledby', questionId);

      var isOpen = item.classList.contains('is-open');
      question.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      if (isOpen) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });

    /* -------------------------------------------------------------- */
    /*  Toggle logic                                                   */
    /* -------------------------------------------------------------- */

    function closeItem(item) {
      var question = NB.$('.nb-faq_question', item);
      var answer   = NB.$('.nb-faq_answer', item);
      if (!question || !answer) return;

      item.classList.remove('is-open');
      question.setAttribute('aria-expanded', 'false');
      answer.style.maxHeight = '0';
    }

    function openItem(item) {
      var question = NB.$('.nb-faq_question', item);
      var answer   = NB.$('.nb-faq_answer', item);
      if (!question || !answer) return;

      item.classList.add('is-open');
      question.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }

    function toggleItem(item) {
      var isOpen = item.classList.contains('is-open');

      if (isSingle && !isOpen) {
        items.forEach(function (other) {
          if (other !== item && other.classList.contains('is-open')) {
            closeItem(other);
          }
        });
      }

      if (isOpen) {
        closeItem(item);
      } else {
        openItem(item);
      }

      NB.emit(el, 'nb:faq-toggle', {
        item: item,
        open: !isOpen,
      });
    }

    /* -------------------------------------------------------------- */
    /*  Event delegation                                               */
    /* -------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var question = e.target.closest('.nb-faq_question');
      if (!question) return;

      var item = question.closest('.nb-faq_item');
      if (!item || !el.contains(item)) return;

      e.preventDefault();
      toggleItem(item);
    });

    /* -------------------------------------------------------------- */
    /*  Keyboard: Enter / Space                                        */
    /* -------------------------------------------------------------- */

    NB.on(el, 'keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;

      var question = e.target.closest('.nb-faq_question');
      if (!question) return;

      var item = question.closest('.nb-faq_item');
      if (!item || !el.contains(item)) return;

      e.preventDefault();
      toggleItem(item);
    });
  });

})(window.NB);


/* --- components/announcement-bar.js --- */

/**
 * NB Announcement Bar Component
 * Dismissable top-of-page notification bar with localStorage persistence.
 *
 * Usage:
 *   <div class="nb-announcement-bar" data-nb-announcement-bar
 *        data-nb-announcement-id="promo-2026">
 *     <span class="nb-announcement-bar_text">
 *       Big news! Check out our latest release.
 *     </span>
 *     <a class="nb-announcement-bar_link" href="#">Learn more &rarr;</a>
 *     <button class="nb-announcement-bar_close" aria-label="Dismiss">
 *       <svg>...</svg>
 *     </button>
 *   </div>
 *
 * Attributes:
 *   data-nb-announcement-id — unique key for localStorage persistence
 *                              (if absent, dismissal is session-only)
 *
 * Events:
 *   nb:announcement-dismiss — detail: { id }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var STORAGE_PREFIX = 'nb-announcement-dismissed-';

  NB.register('announcement-bar', function (el) {
    var closeBtn = NB.$('.nb-announcement-bar_close', el);
    var id       = el.getAttribute('data-nb-announcement-id') || '';

    /* -------------------------------------------------------------- */
    /*  Check if previously dismissed                                  */
    /* -------------------------------------------------------------- */

    if (id) {
      try {
        if (localStorage.getItem(STORAGE_PREFIX + id) === '1') {
          el.classList.add('is-hidden');
          return;
        }
      } catch (e) {
        /* localStorage unavailable — treat as not dismissed */
      }
    }

    /* -------------------------------------------------------------- */
    /*  Dismiss handler                                                */
    /* -------------------------------------------------------------- */

    function dismiss() {
      el.classList.add('is-dismissing');

      /* After transition, fully hide */
      setTimeout(function () {
        el.classList.add('is-hidden');
        el.classList.remove('is-dismissing');

        /* Remember dismissal */
        if (id) {
          try {
            localStorage.setItem(STORAGE_PREFIX + id, '1');
          } catch (e) {
            /* ignore */
          }
        }

        NB.emit(el, 'nb:announcement-dismiss', { id: id });
      }, 200);
    }

    /* -------------------------------------------------------------- */
    /*  Bind close button                                              */
    /* -------------------------------------------------------------- */

    if (closeBtn) {
      NB.on(closeBtn, 'click', function (e) {
        e.preventDefault();
        dismiss();
      });
    }

    /* -------------------------------------------------------------- */
    /*  Public API on element                                          */
    /* -------------------------------------------------------------- */

    el._nbDismiss = dismiss;
  });

})(window.NB);


/* --- components/countdown.js --- */

/**
 * NB Countdown Component
 * Counts down to a target datetime, updating every second.
 * Zero-pads all values, uses mono font from CSS.
 *
 * Usage:
 *   <div class="nb-countdown" data-nb-countdown="2026-12-31T23:59:59">
 *     <div class="nb-countdown_unit">
 *       <span class="nb-countdown_value" data-nb-days>00</span>
 *       <span class="nb-countdown_label">Days</span>
 *     </div>
 *     <span class="nb-countdown_sep">:</span>
 *     <div class="nb-countdown_unit">
 *       <span class="nb-countdown_value" data-nb-hours>00</span>
 *       <span class="nb-countdown_label">Hours</span>
 *     </div>
 *     <span class="nb-countdown_sep">:</span>
 *     <div class="nb-countdown_unit">
 *       <span class="nb-countdown_value" data-nb-minutes>00</span>
 *       <span class="nb-countdown_label">Min</span>
 *     </div>
 *     <span class="nb-countdown_sep">:</span>
 *     <div class="nb-countdown_unit">
 *       <span class="nb-countdown_value" data-nb-seconds>00</span>
 *       <span class="nb-countdown_label">Sec</span>
 *     </div>
 *     <span class="nb-countdown_expired">Timer expired</span>
 *   </div>
 *
 * Attributes:
 *   data-nb-countdown — target datetime (ISO 8601 or any Date-parseable string)
 *
 * Events:
 *   nb:countdown-tick    — detail: { days, hours, minutes, seconds, total }
 *   nb:countdown-expired — when timer reaches zero
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('countdown', function (el) {
    var targetStr = el.getAttribute('data-nb-countdown');
    if (!targetStr) return;

    var target = new Date(targetStr).getTime();
    if (isNaN(target)) {
      console.warn('NB Countdown: invalid date "' + targetStr + '"');
      return;
    }

    var dayEl   = el.querySelector('[data-nb-days]');
    var hourEl  = el.querySelector('[data-nb-hours]');
    var minEl   = el.querySelector('[data-nb-minutes]');
    var secEl   = el.querySelector('[data-nb-seconds]');

    var timer   = null;
    var expired = false;

    /* -------------------------------------------------------------- */
    /*  Zero-pad                                                       */
    /* -------------------------------------------------------------- */

    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }

    /* -------------------------------------------------------------- */
    /*  Update display                                                 */
    /* -------------------------------------------------------------- */

    function tick() {
      var now  = Date.now();
      var diff = target - now;

      if (diff <= 0) {
        diff = 0;
        if (!expired) {
          expired = true;
          el.classList.add('is-expired');
          NB.emit(el, 'nb:countdown-expired');
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      }

      var totalSeconds = Math.floor(diff / 1000);
      var days    = Math.floor(totalSeconds / 86400);
      var hours   = Math.floor((totalSeconds % 86400) / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);
      var seconds = totalSeconds % 60;

      if (dayEl)  dayEl.textContent  = pad(days);
      if (hourEl) hourEl.textContent = pad(hours);
      if (minEl)  minEl.textContent  = pad(minutes);
      if (secEl)  secEl.textContent  = pad(seconds);

      NB.emit(el, 'nb:countdown-tick', {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        total: totalSeconds,
      });
    }

    /* -------------------------------------------------------------- */
    /*  ARIA                                                           */
    /* -------------------------------------------------------------- */

    el.setAttribute('role', 'timer');
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', 'Countdown timer');
    }
    el.setAttribute('aria-live', 'off'); /* avoid flooding screen readers */

    /* -------------------------------------------------------------- */
    /*  Start                                                          */
    /* -------------------------------------------------------------- */

    tick(); /* immediate first render */
    if (!expired) {
      timer = setInterval(tick, 1000);
    }

    /* -------------------------------------------------------------- */
    /*  Cleanup on element removal (MutationObserver safety)           */
    /* -------------------------------------------------------------- */

    el._nbDestroy = function () {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  });

})(window.NB);


/* --- components/api-playground.js --- */

/**
 * NB API Playground Component
 * Interactive API testing interface with method selection, headers,
 * body editing, and response display.
 *
 * Usage:
 *   <div class="nb-api-playground" data-nb-api-playground>
 *     <div class="nb-api_request-bar">
 *       <select class="nb-api_method-select" data-method="GET">
 *         <option value="GET">GET</option>
 *         <option value="POST">POST</option>
 *         <option value="PUT">PUT</option>
 *         <option value="DELETE">DELETE</option>
 *       </select>
 *       <input class="nb-api_url-input" placeholder="Enter URL..." />
 *       <button class="nb-api_send-btn">Send</button>
 *     </div>
 *     <div class="nb-api_tabs">
 *       <button class="nb-api_tab is-active" data-tab="headers">Headers</button>
 *       <button class="nb-api_tab" data-tab="body">Body</button>
 *     </div>
 *     <div class="nb-api_panel is-active" data-panel="headers">...</div>
 *     <div class="nb-api_panel" data-panel="body">
 *       <textarea class="nb-api_body" placeholder="Request body..."></textarea>
 *     </div>
 *     <div class="nb-api_response">
 *       <div class="nb-api_response-empty">Send a request to see the response</div>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:api-send — detail: { method, url, headers, body }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('api-playground', function (el) {

    var methodSelect = NB.$('.nb-api_method-select', el);
    var urlInput     = NB.$('.nb-api_url-input', el);
    var sendBtn      = NB.$('.nb-api_send-btn', el);
    var tabs         = NB.$$('.nb-api_tab', el);
    var panels       = NB.$$('.nb-api_panel', el);
    var responseEl   = NB.$('.nb-api_response', el);

    /* -------------------------------------------------------------- */
    /*  Method select — sync data-method for color coding              */
    /* -------------------------------------------------------------- */

    if (methodSelect) {
      function syncMethod() {
        methodSelect.setAttribute('data-method', methodSelect.value);
      }
      NB.on(methodSelect, 'change', syncMethod);
      syncMethod();
    }

    /* -------------------------------------------------------------- */
    /*  Tabs                                                           */
    /* -------------------------------------------------------------- */

    tabs.forEach(function (tab) {
      NB.on(tab, 'click', function () {
        var target = tab.getAttribute('data-tab');

        tabs.forEach(function (t) { t.classList.remove('is-active'); });
        panels.forEach(function (p) { p.classList.remove('is-active'); });

        tab.classList.add('is-active');
        var panel = NB.$('[data-panel="' + target + '"]', el);
        if (panel) panel.classList.add('is-active');
      });
    });

    /* -------------------------------------------------------------- */
    /*  Add header row                                                 */
    /* -------------------------------------------------------------- */

    var addRowBtns = NB.$$('.nb-api_add-row', el);
    addRowBtns.forEach(function (btn) {
      NB.on(btn, 'click', function () {
        var container = btn.parentElement;
        var row = document.createElement('div');
        row.className = 'nb-api_kv-row';
        row.innerHTML =
          '<input type="text" placeholder="Key" />' +
          '<input type="text" placeholder="Value" />' +
          '<button class="nb-api_kv-remove" type="button">&times;</button>';
        container.insertBefore(row, btn);

        var removeBtn = row.querySelector('.nb-api_kv-remove');
        NB.on(removeBtn, 'click', function () { row.remove(); });
      });
    });

    /* Remove row — existing rows */
    NB.$$('.nb-api_kv-remove', el).forEach(function (btn) {
      NB.on(btn, 'click', function () {
        btn.closest('.nb-api_kv-row').remove();
      });
    });

    /* -------------------------------------------------------------- */
    /*  Collect headers from KV rows                                   */
    /* -------------------------------------------------------------- */

    function collectHeaders() {
      var headersPanel = NB.$('[data-panel="headers"]', el);
      if (!headersPanel) return {};

      var headers = {};
      NB.$$('.nb-api_kv-row', headersPanel).forEach(function (row) {
        var inputs = row.querySelectorAll('input');
        if (inputs.length >= 2) {
          var key = inputs[0].value.trim();
          var val = inputs[1].value.trim();
          if (key) headers[key] = val;
        }
      });
      return headers;
    }

    /* -------------------------------------------------------------- */
    /*  Send                                                           */
    /* -------------------------------------------------------------- */

    if (sendBtn) {
      NB.on(sendBtn, 'click', function () {
        var method  = methodSelect ? methodSelect.value : 'GET';
        var url     = urlInput ? urlInput.value.trim() : '';
        var bodyEl  = NB.$('.nb-api_body', el);
        var body    = bodyEl ? bodyEl.value : '';
        var headers = collectHeaders();

        if (!url) {
          if (urlInput) urlInput.focus();
          return;
        }

        sendBtn.classList.add('is-loading');
        sendBtn.textContent = 'Sending...';

        NB.emit(el, 'nb:api-send', {
          method: method,
          url: url,
          headers: headers,
          body: body,
        });

        /* Simulate a response for demo purposes.
           In production, hook into nb:api-send to make a real fetch. */
        simulateResponse(method, url);
      });
    }

    /* -------------------------------------------------------------- */
    /*  Simulate response (demo)                                       */
    /* -------------------------------------------------------------- */

    function simulateResponse(method, url) {
      setTimeout(function () {
        sendBtn.classList.remove('is-loading');
        sendBtn.textContent = 'Send';

        if (!responseEl) return;

        var statusCode = 200;
        var statusText = '200 OK';
        var statusClass = 'nb-api_status--2xx';
        var responseBody = JSON.stringify({
          message: 'Success',
          method: method,
          url: url,
          timestamp: new Date().toISOString(),
        }, null, 2);

        responseEl.innerHTML =
          '<div class="nb-api_response-bar">' +
            '<span class="nb-api_status ' + statusClass + '">' + statusText + '</span>' +
            '<span class="nb-api_response-meta">247ms &middot; 128 B</span>' +
          '</div>' +
          '<pre class="nb-api_response-body">' + escapeHtml(responseBody) + '</pre>';
      }, 600);
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }
  });

})(window.NB);


/* --- components/notification-center.js --- */

/**
 * NB Notification Center Component
 * Dropdown notification panel with badge count, mark-read,
 * and mark-all-read functionality.
 *
 * Usage:
 *   <div class="nb-notifications" data-nb-notification-center>
 *     <button class="nb-notifications_trigger">
 *       <svg>...</svg>
 *       <span class="nb-notifications_badge">3</span>
 *     </button>
 *     <div class="nb-notifications_panel">
 *       <div class="nb-notifications_header">
 *         <h3 class="nb-notifications_title">Notifications</h3>
 *         <button class="nb-notifications_mark-all">Mark all read</button>
 *       </div>
 *       <ul class="nb-notifications_list">
 *         <li class="nb-notification_item is-unread" data-notification-id="1">
 *           <div class="nb-notification_icon nb-notification_icon--info">...</div>
 *           <div class="nb-notification_content">
 *             <p class="nb-notification_text">...</p>
 *             <span class="nb-notification_time">2m ago</span>
 *           </div>
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:notification-read     — detail: { id }
 *   nb:notification-read-all
 *   nb:notification-toggle   — detail: { open }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('notification-center', function (el) {

    var trigger  = NB.$('.nb-notifications_trigger', el);
    var panel    = NB.$('.nb-notifications_panel', el);
    var badge    = NB.$('.nb-notifications_badge', el);
    var markAll  = NB.$('.nb-notifications_mark-all', el);

    if (!trigger || !panel) return;

    /* -------------------------------------------------------------- */
    /*  Toggle panel                                                   */
    /* -------------------------------------------------------------- */

    function openPanel() {
      panel.classList.add('is-open');
      NB.emit(el, 'nb:notification-toggle', { open: true });
    }

    function closePanel() {
      panel.classList.remove('is-open');
      NB.emit(el, 'nb:notification-toggle', { open: false });
    }

    function togglePanel() {
      if (panel.classList.contains('is-open')) {
        closePanel();
      } else {
        openPanel();
      }
    }

    NB.on(trigger, 'click', function (e) {
      e.stopPropagation();
      togglePanel();
    });

    /* Close on outside click */
    NB.on(document, 'click', function (e) {
      if (!el.contains(e.target) && panel.classList.contains('is-open')) {
        closePanel();
      }
    });

    /* Close on Escape */
    NB.on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        closePanel();
        trigger.focus();
      }
    });

    /* -------------------------------------------------------------- */
    /*  Badge count                                                    */
    /* -------------------------------------------------------------- */

    function updateBadge() {
      var unread = NB.$$('.nb-notification_item.is-unread', el);
      var count = unread.length;

      if (badge) {
        badge.textContent = count > 0 ? count : '';
        badge.setAttribute('data-count', count);
      }
    }

    /* -------------------------------------------------------------- */
    /*  Mark read on click                                             */
    /* -------------------------------------------------------------- */

    NB.on(panel, 'click', function (e) {
      var item = e.target.closest('.nb-notification_item');
      if (!item) return;

      if (item.classList.contains('is-unread')) {
        item.classList.remove('is-unread');
        var id = item.getAttribute('data-notification-id') || '';
        NB.emit(el, 'nb:notification-read', { id: id });
        updateBadge();
      }
    });

    /* -------------------------------------------------------------- */
    /*  Mark all read                                                  */
    /* -------------------------------------------------------------- */

    if (markAll) {
      NB.on(markAll, 'click', function () {
        NB.$$('.nb-notification_item.is-unread', el).forEach(function (item) {
          item.classList.remove('is-unread');
        });
        updateBadge();
        NB.emit(el, 'nb:notification-read-all');
      });
    }

    /* Initial badge count */
    updateBadge();
  });

})(window.NB);


/* --- components/comment-thread.js --- */

/**
 * NB Comment Thread Component
 * Nested discussion with reply forms, like buttons, and collapsible threads.
 *
 * Usage:
 *   <div class="nb-comments" data-nb-comment-thread>
 *     <div class="nb-comment">
 *       <img class="nb-comment_avatar" src="..." alt="" />
 *       <div class="nb-comment_body">
 *         <div class="nb-comment_meta">
 *           <span class="nb-comment_author">Jane</span>
 *           <span class="nb-comment_time">2h ago</span>
 *         </div>
 *         <p class="nb-comment_text">Comment text...</p>
 *         <div class="nb-comment_actions">
 *           <button class="nb-comment_action" data-action="like">Like</button>
 *           <button class="nb-comment_action" data-action="reply">Reply</button>
 *           <button class="nb-comment_collapse-btn" data-action="collapse">Collapse</button>
 *         </div>
 *         <div class="nb-comment_reply-form">
 *           <textarea class="nb-comment_reply-input" placeholder="Reply..."></textarea>
 *           <button class="nb-comment_reply-submit">Reply</button>
 *         </div>
 *         <div class="nb-comment_replies">
 *           <!-- nested .nb-comment elements -->
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:comment-like    — detail: { commentEl }
 *   nb:comment-reply   — detail: { parentComment, text }
 *   nb:comment-collapse — detail: { commentEl, collapsed }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('comment-thread', function (el) {

    /* -------------------------------------------------------------- */
    /*  Delegated click handler                                        */
    /* -------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var action = e.target.closest('[data-action]');
      if (!action) return;

      var type = action.getAttribute('data-action');
      var comment = action.closest('.nb-comment');
      if (!comment) return;

      switch (type) {
        case 'like':
          handleLike(action, comment);
          break;
        case 'reply':
          handleReply(comment);
          break;
        case 'collapse':
          handleCollapse(action, comment);
          break;
      }
    });

    /* -------------------------------------------------------------- */
    /*  Submit reply via delegated click                                */
    /* -------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var submitBtn = e.target.closest('.nb-comment_reply-submit');
      if (!submitBtn) return;

      var form = submitBtn.closest('.nb-comment_reply-form');
      var input = form ? form.querySelector('.nb-comment_reply-input') : null;
      var comment = submitBtn.closest('.nb-comment');

      if (!input || !input.value.trim()) return;

      NB.emit(el, 'nb:comment-reply', {
        parentComment: comment,
        text: input.value.trim(),
      });

      input.value = '';
      form.classList.remove('is-open');
    });

    /* -------------------------------------------------------------- */
    /*  Like                                                           */
    /* -------------------------------------------------------------- */

    function handleLike(btn, comment) {
      btn.classList.toggle('is-liked');

      /* Update count if a span child exists */
      var countEl = btn.querySelector('span');
      if (countEl) {
        var current = parseInt(countEl.textContent, 10) || 0;
        countEl.textContent = btn.classList.contains('is-liked')
          ? current + 1
          : Math.max(0, current - 1);
      }

      NB.emit(el, 'nb:comment-like', { commentEl: comment });
    }

    /* -------------------------------------------------------------- */
    /*  Reply toggle                                                   */
    /* -------------------------------------------------------------- */

    function handleReply(comment) {
      var body = comment.querySelector('.nb-comment_body');
      if (!body) return;

      var form = body.querySelector('.nb-comment_reply-form');
      if (!form) return;

      /* Close any other open forms first */
      NB.$$('.nb-comment_reply-form.is-open', el).forEach(function (f) {
        if (f !== form) f.classList.remove('is-open');
      });

      form.classList.toggle('is-open');

      if (form.classList.contains('is-open')) {
        var input = form.querySelector('.nb-comment_reply-input');
        if (input) input.focus();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Collapse / expand thread                                       */
    /* -------------------------------------------------------------- */

    function handleCollapse(btn, comment) {
      var body = comment.querySelector('.nb-comment_body');
      if (!body) return;

      var replies = body.querySelector('.nb-comment_replies');
      if (!replies) return;

      var collapsed = replies.classList.toggle('is-collapsed');
      btn.textContent = collapsed ? 'Expand' : 'Collapse';

      NB.emit(el, 'nb:comment-collapse', {
        commentEl: comment,
        collapsed: collapsed,
      });
    }
  });

})(window.NB);


/* --- components/chat-interface.js --- */

/**
 * NB Chat Interface Component
 * Full chat UI with message input, auto-scroll, and typing indicator.
 *
 * Usage:
 *   <div class="nb-chat" data-nb-chat>
 *     <div class="nb-chat_header">...</div>
 *     <div class="nb-chat_messages">
 *       <!-- .nb-chat-message elements -->
 *       <div class="nb-chat_typing">
 *         <div class="nb-chat_typing-dots"><span></span><span></span><span></span></div>
 *         <span>typing...</span>
 *       </div>
 *     </div>
 *     <div class="nb-chat_input">
 *       <textarea class="nb-chat_input-field" placeholder="Type a message..."></textarea>
 *       <button class="nb-chat_send-btn">
 *         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
 *           <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>
 *         </svg>
 *       </button>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:chat-send — detail: { text }
 *
 * API:
 *   NB.chat.scrollToBottom()
 *   NB.chat.showTyping()
 *   NB.chat.hideTyping()
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('chat', function (el) {

    var messagesEl = NB.$('.nb-chat_messages', el);
    var inputField = NB.$('.nb-chat_input-field', el);
    var sendBtn    = NB.$('.nb-chat_send-btn', el);
    var typingEl   = NB.$('.nb-chat_typing', el);

    if (!messagesEl) return;

    /* -------------------------------------------------------------- */
    /*  Scroll to bottom                                               */
    /* -------------------------------------------------------------- */

    function scrollToBottom() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    /* Initial scroll */
    scrollToBottom();

    /* -------------------------------------------------------------- */
    /*  Send message                                                   */
    /* -------------------------------------------------------------- */

    function sendMessage() {
      if (!inputField) return;
      var text = inputField.value.trim();
      if (!text) return;

      NB.emit(el, 'nb:chat-send', { text: text });

      /* Create and append sent message bubble */
      var msgDiv = document.createElement('div');
      msgDiv.className = 'nb-chat-message nb-chat-message-sent';
      msgDiv.innerHTML =
        '<div>' +
          '<div class="nb-chat-message_bubble">' + escapeHtml(text) + '</div>' +
          '<div class="nb-chat-message_time">' + formatTime() + '</div>' +
        '</div>';

      /* Insert before typing indicator if it exists, else append */
      if (typingEl) {
        messagesEl.insertBefore(msgDiv, typingEl);
      } else {
        messagesEl.appendChild(msgDiv);
      }

      inputField.value = '';
      inputField.style.height = '';
      scrollToBottom();
    }

    /* -------------------------------------------------------------- */
    /*  Send button click                                              */
    /* -------------------------------------------------------------- */

    if (sendBtn) {
      NB.on(sendBtn, 'click', sendMessage);
    }

    /* -------------------------------------------------------------- */
    /*  Enter key sends (Shift+Enter for newline)                      */
    /* -------------------------------------------------------------- */

    if (inputField) {
      NB.on(inputField, 'keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      /* Auto-resize textarea */
      NB.on(inputField, 'input', function () {
        inputField.style.height = '';
        inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
      });
    }

    /* -------------------------------------------------------------- */
    /*  Typing indicator                                               */
    /* -------------------------------------------------------------- */

    function showTyping() {
      if (typingEl) {
        typingEl.classList.add('is-visible');
        scrollToBottom();
      }
    }

    function hideTyping() {
      if (typingEl) {
        typingEl.classList.remove('is-visible');
      }
    }

    /* -------------------------------------------------------------- */
    /*  Auto-scroll on new messages (MutationObserver)                  */
    /* -------------------------------------------------------------- */

    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function () {
        /* Scroll only if user is near the bottom already */
        var threshold = 80;
        var atBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < threshold;
        if (atBottom) scrollToBottom();
      });

      observer.observe(messagesEl, { childList: true, subtree: true });
    }

    /* -------------------------------------------------------------- */
    /*  Helpers                                                        */
    /* -------------------------------------------------------------- */

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    function formatTime() {
      var now = new Date();
      var h = now.getHours();
      var m = now.getMinutes();
      var ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      m = m < 10 ? '0' + m : m;
      return h + ':' + m + ' ' + ampm;
    }

    /* -------------------------------------------------------------- */
    /*  Public API                                                     */
    /* -------------------------------------------------------------- */

    NB.chat = NB.chat || {};
    NB.chat.scrollToBottom = scrollToBottom;
    NB.chat.showTyping = showTyping;
    NB.chat.hideTyping = hideTyping;
  });

})(window.NB);


/* --- components/checkout-stepper.js --- */

/**
 * NB Checkout Stepper Component
 * Multi-step checkout flow with Shipping, Payment, Review panels.
 * Uses the stepper pattern for step indicators.
 *
 * Usage:
 *   <div class="nb-checkout" data-nb-checkout>
 *     <div class="nb-checkout_steps">
 *       <div class="nb-checkout_step is-active">
 *         <div class="nb-checkout_step-number"><span class="nb-checkout_step-text">1</span></div>
 *         <span class="nb-checkout_step-label">Shipping</span>
 *       </div>
 *       <div class="nb-checkout_connector"></div>
 *       <div class="nb-checkout_step">
 *         <div class="nb-checkout_step-number"><span class="nb-checkout_step-text">2</span></div>
 *         <span class="nb-checkout_step-label">Payment</span>
 *       </div>
 *       <div class="nb-checkout_connector"></div>
 *       <div class="nb-checkout_step">
 *         <div class="nb-checkout_step-number"><span class="nb-checkout_step-text">3</span></div>
 *         <span class="nb-checkout_step-label">Review</span>
 *       </div>
 *     </div>
 *     <div class="nb-checkout_panel is-active" data-step="0">...</div>
 *     <div class="nb-checkout_panel" data-step="1">...</div>
 *     <div class="nb-checkout_panel" data-step="2">...</div>
 *     <div class="nb-checkout_nav">
 *       <button class="nb-checkout_btn nb-checkout_btn--back">Back</button>
 *       <button class="nb-checkout_btn nb-checkout_btn--next">Next</button>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:checkout-step — detail: { step, total }
 *   nb:checkout-complete
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('checkout', function (el) {

    var steps      = NB.$$('.nb-checkout_step', el);
    var connectors = NB.$$('.nb-checkout_connector', el);
    var panels     = NB.$$('.nb-checkout_panel', el);
    var backBtn    = NB.$('.nb-checkout_btn--back', el);
    var nextBtn    = NB.$('.nb-checkout_btn--next', el);

    if (!steps.length || !panels.length) return;

    var currentStep = 0;
    var totalSteps  = steps.length;

    /* -------------------------------------------------------------- */
    /*  Determine initial step from markup                             */
    /* -------------------------------------------------------------- */

    steps.forEach(function (step, i) {
      if (step.classList.contains('is-active')) {
        currentStep = i;
      }
    });

    /* -------------------------------------------------------------- */
    /*  Update UI                                                      */
    /* -------------------------------------------------------------- */

    function update() {
      /* Update step indicators */
      steps.forEach(function (step, i) {
        step.classList.remove('is-active', 'is-complete');
        if (i < currentStep) {
          step.classList.add('is-complete');
        } else if (i === currentStep) {
          step.classList.add('is-active');
        }
      });

      /* Update connectors */
      connectors.forEach(function (conn, i) {
        conn.style.background = i < currentStep ? 'var(--accent)' : '';
      });

      /* Show active panel */
      panels.forEach(function (panel) {
        panel.classList.remove('is-active');
      });
      var activePanel = NB.$('[data-step="' + currentStep + '"]', el);
      if (activePanel) activePanel.classList.add('is-active');

      /* Update button states */
      if (backBtn) {
        backBtn.disabled = currentStep === 0;
      }

      if (nextBtn) {
        if (currentStep === totalSteps - 1) {
          nextBtn.textContent = 'Place Order';
        } else {
          nextBtn.textContent = 'Next';
        }
      }

      NB.emit(el, 'nb:checkout-step', {
        step: currentStep,
        total: totalSteps,
      });
    }

    /* -------------------------------------------------------------- */
    /*  Navigation                                                     */
    /* -------------------------------------------------------------- */

    function next() {
      if (currentStep < totalSteps - 1) {
        currentStep++;
        update();
      } else {
        /* Final step — complete */
        NB.emit(el, 'nb:checkout-complete');
      }
    }

    function prev() {
      if (currentStep > 0) {
        currentStep--;
        update();
      }
    }

    function goTo(n) {
      if (typeof n !== 'number') return;
      currentStep = Math.max(0, Math.min(n, totalSteps - 1));
      update();
    }

    /* Button clicks */
    if (nextBtn) NB.on(nextBtn, 'click', next);
    if (backBtn) NB.on(backBtn, 'click', prev);

    /* -------------------------------------------------------------- */
    /*  Public API                                                     */
    /* -------------------------------------------------------------- */

    NB.checkout = NB.checkout || {};
    NB.checkout.next = next;
    NB.checkout.prev = prev;
    NB.checkout.goTo = goTo;
    NB.checkout.getCurrent = function () { return currentStep; };

    /* Initialize */
    update();
  });

})(window.NB);


/* --- components/kanban-board.js --- */

/**
 * NB Kanban Board Component
 * Column-based task board with HTML5 drag-and-drop between columns.
 *
 * Usage:
 *   <div class="nb-kanban" data-nb-kanban>
 *     <div class="nb-kanban_column">
 *       <div class="nb-kanban_column-header">
 *         <h3 class="nb-kanban_column-title">
 *           To Do <span class="nb-kanban_column-count">3</span>
 *         </h3>
 *       </div>
 *       <div class="nb-kanban_cards">
 *         <div class="nb-kanban_card" draggable="true">
 *           <p class="nb-kanban_card-title">Task title</p>
 *           <div class="nb-kanban_card-labels">
 *             <span class="nb-kanban_card-label nb-kanban_card-label--blue">Feature</span>
 *           </div>
 *           <div class="nb-kanban_card-footer">
 *             <img class="nb-kanban_card-avatar" src="..." alt="" />
 *             <span class="nb-kanban_card-meta">NB-42</span>
 *           </div>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:kanban-move — detail: { card, fromColumn, toColumn, position }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('kanban', function (el) {

    var draggedCard = null;
    var sourceColumn = null;

    /* -------------------------------------------------------------- */
    /*  Update column counts                                           */
    /* -------------------------------------------------------------- */

    function updateCounts() {
      NB.$$('.nb-kanban_column', el).forEach(function (col) {
        var cards = NB.$$('.nb-kanban_card', col);
        var countEl = col.querySelector('.nb-kanban_column-count');
        if (countEl) countEl.textContent = cards.length;
      });
    }

    /* -------------------------------------------------------------- */
    /*  Drag start                                                     */
    /* -------------------------------------------------------------- */

    NB.on(el, 'dragstart', function (e) {
      var card = e.target.closest('.nb-kanban_card');
      if (!card) return;

      draggedCard = card;
      sourceColumn = card.closest('.nb-kanban_column');
      card.classList.add('is-dragging');

      /* Required for Firefox */
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });

    /* -------------------------------------------------------------- */
    /*  Drag end                                                       */
    /* -------------------------------------------------------------- */

    NB.on(el, 'dragend', function () {
      if (draggedCard) {
        draggedCard.classList.remove('is-dragging');
      }

      /* Remove all drag-over highlights */
      NB.$$('.nb-kanban_column.is-drag-over', el).forEach(function (col) {
        col.classList.remove('is-drag-over');
      });

      draggedCard = null;
      sourceColumn = null;
    });

    /* -------------------------------------------------------------- */
    /*  Drag over — allow drop                                         */
    /* -------------------------------------------------------------- */

    NB.on(el, 'dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      var column = e.target.closest('.nb-kanban_column');
      if (!column || !draggedCard) return;

      /* Highlight the column */
      NB.$$('.nb-kanban_column.is-drag-over', el).forEach(function (col) {
        if (col !== column) col.classList.remove('is-drag-over');
      });
      column.classList.add('is-drag-over');

      /* Position the card within the list */
      var cardsContainer = column.querySelector('.nb-kanban_cards');
      if (!cardsContainer) return;

      var afterCard = getInsertPosition(cardsContainer, e.clientY);
      if (afterCard) {
        cardsContainer.insertBefore(draggedCard, afterCard);
      } else {
        cardsContainer.appendChild(draggedCard);
      }
    });

    /* -------------------------------------------------------------- */
    /*  Drop                                                           */
    /* -------------------------------------------------------------- */

    NB.on(el, 'drop', function (e) {
      e.preventDefault();

      var column = e.target.closest('.nb-kanban_column');
      if (!column || !draggedCard) return;

      column.classList.remove('is-drag-over');

      /* Determine position index */
      var cardsContainer = column.querySelector('.nb-kanban_cards');
      var cards = cardsContainer ? NB.$$('.nb-kanban_card', cardsContainer) : [];
      var position = cards.indexOf(draggedCard);

      updateCounts();

      NB.emit(el, 'nb:kanban-move', {
        card: draggedCard,
        fromColumn: sourceColumn,
        toColumn: column,
        position: position,
      });
    });

    /* -------------------------------------------------------------- */
    /*  Drag enter / leave for column highlight                        */
    /* -------------------------------------------------------------- */

    NB.on(el, 'dragenter', function (e) {
      var column = e.target.closest('.nb-kanban_column');
      if (column && draggedCard) {
        column.classList.add('is-drag-over');
      }
    });

    NB.on(el, 'dragleave', function (e) {
      var column = e.target.closest('.nb-kanban_column');
      if (column && !column.contains(e.relatedTarget)) {
        column.classList.remove('is-drag-over');
      }
    });

    /* -------------------------------------------------------------- */
    /*  Determine insertion position based on cursor Y                  */
    /* -------------------------------------------------------------- */

    function getInsertPosition(container, y) {
      var cards = NB.$$('.nb-kanban_card:not(.is-dragging)', container);
      var closest = null;
      var closestOffset = Number.NEGATIVE_INFINITY;

      cards.forEach(function (card) {
        var box = card.getBoundingClientRect();
        var offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closestOffset) {
          closestOffset = offset;
          closest = card;
        }
      });

      return closest;
    }

    /* Initial count update */
    updateCounts();
  });

})(window.NB);


/* --- components/file-browser.js --- */

/**
 * NB File Browser Component
 * File/folder tree with context menu, breadcrumb navigation,
 * and grid/list view toggle.
 *
 * Usage:
 *   <div class="nb-file-browser" data-nb-file-browser>
 *     <div class="nb-file-browser_toolbar">
 *       <div class="nb-file-browser_breadcrumb">
 *         <button class="nb-file-browser_breadcrumb-item" data-path="/">~</button>
 *         <span class="nb-file-browser_breadcrumb-sep">/</span>
 *         <button class="nb-file-browser_breadcrumb-item" data-path="/src">src</button>
 *       </div>
 *       <div class="nb-file-browser_view-toggle">
 *         <button class="nb-file-browser_view-btn is-active" data-view="list">...</button>
 *         <button class="nb-file-browser_view-btn" data-view="grid">...</button>
 *       </div>
 *     </div>
 *     <div class="nb-file-browser_list">
 *       <div class="nb-file-browser_list-header">
 *         <span>Name</span><span>Size</span><span>Modified</span><span></span>
 *       </div>
 *       <div class="nb-file-browser_row" data-type="folder" data-name="src">
 *         <div class="nb-file-browser_name">
 *           <svg class="nb-file-browser_icon nb-file-browser_icon--folder">...</svg>
 *           <span class="nb-file-browser_name-text">src</span>
 *         </div>
 *         <span class="nb-file-browser_size">--</span>
 *         <span class="nb-file-browser_modified">Mar 28</span>
 *         <div class="nb-file-browser_row-actions">
 *           <button class="nb-file-browser_row-action">...</button>
 *         </div>
 *       </div>
 *     </div>
 *     <div class="nb-file-browser_grid" style="display:none">...</div>
 *     <div class="nb-file-browser_context-menu">
 *       <button class="nb-file-browser_context-item" data-action="open">Open</button>
 *       <button class="nb-file-browser_context-item" data-action="rename">Rename</button>
 *       <button class="nb-file-browser_context-item" data-action="copy">Copy</button>
 *       <div class="nb-file-browser_context-divider"></div>
 *       <button class="nb-file-browser_context-item nb-file-browser_context-item--danger" data-action="delete">Delete</button>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:file-select   — detail: { name, type }
 *   nb:file-action   — detail: { action, name, type }
 *   nb:file-navigate — detail: { path }
 *   nb:file-view     — detail: { view: 'list'|'grid' }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('file-browser', function (el) {

    var listView    = NB.$('.nb-file-browser_list', el);
    var gridView    = NB.$('.nb-file-browser_grid', el);
    var contextMenu = NB.$('.nb-file-browser_context-menu', el);
    var viewBtns    = NB.$$('.nb-file-browser_view-btn', el);

    var currentView   = 'list';
    var selectedTarget = null;

    /* -------------------------------------------------------------- */
    /*  View toggle                                                    */
    /* -------------------------------------------------------------- */

    viewBtns.forEach(function (btn) {
      NB.on(btn, 'click', function () {
        var view = btn.getAttribute('data-view');
        if (view === currentView) return;

        currentView = view;

        viewBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');

        if (view === 'list') {
          if (listView) listView.style.display = '';
          if (gridView) gridView.style.display = 'none';
        } else {
          if (listView) listView.style.display = 'none';
          if (gridView) gridView.style.display = '';
        }

        NB.emit(el, 'nb:file-view', { view: view });
      });
    });

    /* -------------------------------------------------------------- */
    /*  Row / grid item click — select                                 */
    /* -------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var row = e.target.closest('.nb-file-browser_row, .nb-file-browser_grid-item');
      if (!row) return;

      /* Deselect all */
      NB.$$('.nb-file-browser_row.is-selected, .nb-file-browser_grid-item.is-selected', el)
        .forEach(function (r) { r.classList.remove('is-selected'); });

      row.classList.add('is-selected');

      var name = row.getAttribute('data-name') || '';
      var type = row.getAttribute('data-type') || 'file';

      NB.emit(el, 'nb:file-select', { name: name, type: type });
    });

    /* Double-click to open folder ------------------------------------- */

    NB.on(el, 'dblclick', function (e) {
      var row = e.target.closest('.nb-file-browser_row, .nb-file-browser_grid-item');
      if (!row) return;

      var type = row.getAttribute('data-type') || 'file';
      var name = row.getAttribute('data-name') || '';

      if (type === 'folder') {
        NB.emit(el, 'nb:file-navigate', { path: name });
      }
    });

    /* -------------------------------------------------------------- */
    /*  Breadcrumb navigation                                          */
    /* -------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var crumb = e.target.closest('.nb-file-browser_breadcrumb-item');
      if (!crumb) return;

      var path = crumb.getAttribute('data-path') || '/';
      NB.emit(el, 'nb:file-navigate', { path: path });
    });

    /* -------------------------------------------------------------- */
    /*  Context menu                                                   */
    /* -------------------------------------------------------------- */

    if (contextMenu) {
      /* Show on right-click */
      NB.on(el, 'contextmenu', function (e) {
        var row = e.target.closest('.nb-file-browser_row, .nb-file-browser_grid-item');
        if (!row) {
          closeContextMenu();
          return;
        }

        e.preventDefault();
        selectedTarget = row;

        /* Position the menu */
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
        contextMenu.classList.add('is-open');

        /* Ensure menu doesn't overflow viewport */
        requestAnimationFrame(function () {
          var rect = contextMenu.getBoundingClientRect();
          if (rect.right > window.innerWidth) {
            contextMenu.style.left = (e.clientX - rect.width) + 'px';
          }
          if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = (e.clientY - rect.height) + 'px';
          }
        });
      });

      /* Context menu item click */
      NB.on(contextMenu, 'click', function (e) {
        var item = e.target.closest('.nb-file-browser_context-item');
        if (!item) return;

        var action = item.getAttribute('data-action') || '';
        var name = selectedTarget ? selectedTarget.getAttribute('data-name') || '' : '';
        var type = selectedTarget ? selectedTarget.getAttribute('data-type') || 'file' : 'file';

        NB.emit(el, 'nb:file-action', {
          action: action,
          name: name,
          type: type,
        });

        closeContextMenu();
      });

      /* Close on click outside */
      NB.on(document, 'click', function () {
        closeContextMenu();
      });

      /* Close on Escape */
      NB.on(document, 'keydown', function (e) {
        if (e.key === 'Escape') closeContextMenu();
      });
    }

    function closeContextMenu() {
      if (contextMenu) {
        contextMenu.classList.remove('is-open');
      }
      selectedTarget = null;
    }

    /* -------------------------------------------------------------- */
    /*  Row action button (three-dot menu)                              */
    /* -------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var actionBtn = e.target.closest('.nb-file-browser_row-action');
      if (!actionBtn) return;

      e.stopPropagation();

      var row = actionBtn.closest('.nb-file-browser_row');
      if (!row || !contextMenu) return;

      selectedTarget = row;

      var rect = actionBtn.getBoundingClientRect();
      contextMenu.style.left = rect.left + 'px';
      contextMenu.style.top = (rect.bottom + 4) + 'px';
      contextMenu.classList.add('is-open');
    });
  });

})(window.NB);


/* --- components/navbar.js --- */

/**
 * NB Navbar Component
 * Mobile hamburger toggle: show/hide nav on click.
 * Closes on outside click and Escape key.
 *
 * Usage:
 *   <nav data-nb-navbar class="nb-navbar">
 *     <div class="nb-navbar_brand">...</div>
 *     <button class="nb-navbar_mobile-toggle" aria-label="Toggle navigation" aria-expanded="false">
 *       <span class="nb-navbar_mobile-toggle-icon"></span>
 *     </button>
 *     <div class="nb-navbar_nav">...</div>
 *     <div class="nb-navbar_actions">...</div>
 *   </nav>
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('navbar', function (el) {

    var toggle = NB.$('.nb-navbar_mobile-toggle', el);
    var nav = NB.$('.nb-navbar_nav', el);

    if (!toggle || !nav) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    var navId = nav.id || NB.uid('nb-navbar-nav');
    nav.id = navId;
    toggle.setAttribute('aria-controls', navId);

    function isOpen() {
      return el.classList.contains('is-open');
    }

    function syncAria() {
      toggle.setAttribute('aria-expanded', String(isOpen()));
    }

    /* -------------------------------------------------------------- */
    /*  Toggle                                                         */
    /* -------------------------------------------------------------- */

    function open() {
      el.classList.add('is-open');
      syncAria();
      NB.emit(el, 'nb:navbar-open');
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      syncAria();
      NB.emit(el, 'nb:navbar-close');
    }

    function handleToggle(e) {
      e.stopPropagation();
      if (isOpen()) {
        close();
      } else {
        open();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Outside click                                                   */
    /* -------------------------------------------------------------- */

    function handleOutsideClick(e) {
      if (!isOpen()) return;
      if (!el.contains(e.target)) {
        close();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Escape key                                                     */
    /* -------------------------------------------------------------- */

    function handleKeydown(e) {
      if (e.key === 'Escape' && isOpen()) {
        close();
        toggle.focus();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Bind events                                                    */
    /* -------------------------------------------------------------- */

    NB.on(toggle, 'click', handleToggle);
    NB.on(document, 'click', handleOutsideClick);
    NB.on(document, 'keydown', handleKeydown);

    // Ensure initial ARIA state
    syncAria();

    /* Return cleanup for NB.destroy() */
    return function () {
      NB.off(document, 'click', handleOutsideClick);
      NB.off(document, 'keydown', handleKeydown);
    };
  });

})(window.NB);


/* --- components/sidebar.js --- */

/**
 * NB Sidebar Component
 * Toggles `is-collapsed` on desktop. Shows/hides with backdrop on mobile.
 * Handles window resize to clean up mobile state when returning to desktop.
 *
 * Usage:
 *   <aside data-nb-sidebar class="nb-sidebar">
 *     <div class="nb-sidebar_header">
 *       <div class="nb-sidebar_logo">...</div>
 *       <button data-nb-sidebar-toggle aria-label="Toggle sidebar">...</button>
 *     </div>
 *     ...
 *   </aside>
 *   <div class="nb-sidebar_backdrop"></div>
 *
 * External trigger (e.g. in a navbar):
 *   <button data-nb-sidebar-open aria-label="Open sidebar">...</button>
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var MOBILE_BREAKPOINT = 768;

  NB.register('sidebar', function (el) {

    var toggleBtn = NB.$('[data-nb-sidebar-toggle]', el);
    var backdrop = el.nextElementSibling;

    // Validate backdrop
    if (!backdrop || !backdrop.classList.contains('nb-sidebar_backdrop')) {
      backdrop = null;
    }

    /* -------------------------------------------------------------- */
    /*  Desktop: collapse / expand                                     */
    /* -------------------------------------------------------------- */

    function isMobile() {
      return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function toggleCollapse() {
      if (isMobile()) {
        toggleMobile();
        return;
      }
      el.classList.toggle('is-collapsed');
      NB.emit(el, 'nb:sidebar-toggle', {
        collapsed: el.classList.contains('is-collapsed'),
      });
    }

    /* -------------------------------------------------------------- */
    /*  Mobile: overlay sidebar                                        */
    /* -------------------------------------------------------------- */

    function openMobile() {
      el.classList.add('is-mobile-open');
      if (backdrop) backdrop.style.display = 'block';
      document.body.style.overflow = 'hidden';
      NB.emit(el, 'nb:sidebar-open');
    }

    function closeMobile() {
      el.classList.remove('is-mobile-open');
      if (backdrop) backdrop.style.display = '';
      document.body.style.overflow = '';
      NB.emit(el, 'nb:sidebar-close');
    }

    function toggleMobile() {
      if (el.classList.contains('is-mobile-open')) {
        closeMobile();
      } else {
        openMobile();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Handle resize: clean up mobile state on breakpoint cross       */
    /* -------------------------------------------------------------- */

    var resizeTimer;

    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (!isMobile() && el.classList.contains('is-mobile-open')) {
          closeMobile();
        }
      }, 100);
    }

    /* -------------------------------------------------------------- */
    /*  Escape key                                                     */
    /* -------------------------------------------------------------- */

    function handleKeydown(e) {
      if (e.key === 'Escape' && isMobile() && el.classList.contains('is-mobile-open')) {
        closeMobile();
      }
    }

    /* -------------------------------------------------------------- */
    /*  External open triggers                                         */
    /* -------------------------------------------------------------- */

    var externalOpeners = NB.$$('[data-nb-sidebar-open]');
    externalOpeners.forEach(function (btn) {
      NB.on(btn, 'click', function () {
        if (isMobile()) {
          openMobile();
        } else {
          if (el.classList.contains('is-collapsed')) {
            el.classList.remove('is-collapsed');
            NB.emit(el, 'nb:sidebar-toggle', { collapsed: false });
          }
        }
      });
    });

    /* -------------------------------------------------------------- */
    /*  Bind events                                                    */
    /* -------------------------------------------------------------- */

    if (toggleBtn) {
      NB.on(toggleBtn, 'click', toggleCollapse);
    }

    if (backdrop) {
      NB.on(backdrop, 'click', closeMobile);
    }

    NB.on(window, 'resize', handleResize);
    NB.on(document, 'keydown', handleKeydown);

    /* Return cleanup for NB.destroy() */
    NB._addCleanup(el, function () {
      NB.off(window, 'resize', handleResize);
      NB.off(document, 'keydown', handleKeydown);
      clearTimeout(resizeTimer);
    });

    /* -------------------------------------------------------------- */
    /*  Public API                                                     */
    /* -------------------------------------------------------------- */

    NB.sidebar = NB.sidebar || {};
    NB.sidebar.collapse = function () {
      el.classList.add('is-collapsed');
      NB.emit(el, 'nb:sidebar-toggle', { collapsed: true });
    };
    NB.sidebar.expand = function () {
      el.classList.remove('is-collapsed');
      NB.emit(el, 'nb:sidebar-toggle', { collapsed: false });
    };
    NB.sidebar.openMobile = openMobile;
    NB.sidebar.closeMobile = closeMobile;
  });

})(window.NB);


/* --- components/tabs.js --- */

/**
 * NB Tabs Component
 * Click to activate tab + panel. Arrow keys for navigation.
 * Full ARIA: role=tablist, role=tab, role=tabpanel, aria-selected.
 *
 * Usage:
 *   <div data-nb-tabs class="nb-tabs">
 *     <div class="nb-tabs_list" role="tablist">
 *       <button class="nb-tabs_tab is-active" data-nb-tab="panel-1">Tab 1</button>
 *       <button class="nb-tabs_tab" data-nb-tab="panel-2">Tab 2</button>
 *     </div>
 *     <div class="nb-tabs_panel is-active" id="panel-1">Content 1</div>
 *     <div class="nb-tabs_panel" id="panel-2">Content 2</div>
 *   </div>
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('tabs', function (el) {

    var tablist = NB.$('.nb-tabs_list', el);
    var tabs = NB.$$('.nb-tabs_tab', el);
    var panels = NB.$$('.nb-tabs_panel', el);

    if (!tablist || !tabs.length) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    tablist.setAttribute('role', 'tablist');

    tabs.forEach(function (tab, i) {
      var panelId = tab.getAttribute('data-nb-tab');
      var tabId = tab.id || NB.uid('nb-tab');
      tab.id = tabId;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('tabindex', tab.classList.contains('is-active') ? '0' : '-1');
      tab.setAttribute('aria-selected', String(tab.classList.contains('is-active')));

      if (panelId) {
        tab.setAttribute('aria-controls', panelId);
        var panel = document.getElementById(panelId);
        if (panel) {
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('aria-labelledby', tabId);
          panel.setAttribute('tabindex', '0');
        }
      }
    });

    /* -------------------------------------------------------------- */
    /*  Activate tab                                                   */
    /* -------------------------------------------------------------- */

    function activate(tab) {
      // Deactivate all
      tabs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });

      panels.forEach(function (p) {
        p.classList.remove('is-active');
      });

      // Activate selected
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      tab.focus();

      var panelId = tab.getAttribute('data-nb-tab');
      if (panelId) {
        var panel = document.getElementById(panelId);
        if (panel) {
          panel.classList.add('is-active');
        }
      }

      NB.emit(el, 'nb:tab-change', { tab: tab, panelId: panelId });
    }

    /* -------------------------------------------------------------- */
    /*  Click handler                                                  */
    /* -------------------------------------------------------------- */

    tabs.forEach(function (tab) {
      NB.on(tab, 'click', function () {
        activate(tab);
      });
    });

    /* -------------------------------------------------------------- */
    /*  Keyboard navigation                                            */
    /* -------------------------------------------------------------- */

    NB.on(tablist, 'keydown', function (e) {
      var currentIndex = tabs.indexOf(document.activeElement);
      if (currentIndex === -1) return;

      var nextIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = (currentIndex + 1) % tabs.length;
          activate(tabs[nextIndex]);
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          activate(tabs[nextIndex]);
          break;

        case 'Home':
          e.preventDefault();
          activate(tabs[0]);
          break;

        case 'End':
          e.preventDefault();
          activate(tabs[tabs.length - 1]);
          break;
      }
    });
  });

})(window.NB);


/* --- components/stepper.js --- */

/**
 * NB Stepper Component
 * Manages multi-step indicator state. Exposes API for next/prev/goTo.
 * Updates is-active and is-complete classes on steps.
 *
 * Usage:
 *   <div data-nb-stepper class="nb-stepper">
 *     <div class="nb-stepper_step is-complete">
 *       <div class="nb-stepper_indicator"><span class="nb-stepper_indicator-text">1</span></div>
 *       <span class="nb-stepper_label">Account</span>
 *     </div>
 *     <div class="nb-stepper_connector"></div>
 *     <div class="nb-stepper_step is-active">
 *       <div class="nb-stepper_indicator"><span class="nb-stepper_indicator-text">2</span></div>
 *       <span class="nb-stepper_label">Profile</span>
 *     </div>
 *     <div class="nb-stepper_connector"></div>
 *     <div class="nb-stepper_step">
 *       <div class="nb-stepper_indicator"><span class="nb-stepper_indicator-text">3</span></div>
 *       <span class="nb-stepper_label">Review</span>
 *     </div>
 *   </div>
 *
 * JS API:
 *   NB.stepper.next()   — advance to next step
 *   NB.stepper.prev()   — go back one step
 *   NB.stepper.goTo(n)  — jump to step n (0-indexed)
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('stepper', function (el) {

    var steps = NB.$$('.nb-stepper_step', el);
    if (!steps.length) return;

    /* -------------------------------------------------------------- */
    /*  Determine current step from markup                             */
    /* -------------------------------------------------------------- */

    var currentIndex = 0;

    steps.forEach(function (step, i) {
      if (step.classList.contains('is-active')) {
        currentIndex = i;
      }
    });

    /* -------------------------------------------------------------- */
    /*  Update step states                                             */
    /* -------------------------------------------------------------- */

    function updateSteps() {
      steps.forEach(function (step, i) {
        step.classList.remove('is-active', 'is-complete');

        if (i < currentIndex) {
          step.classList.add('is-complete');
        } else if (i === currentIndex) {
          step.classList.add('is-active');
        }
      });

      // Update connector states: connectors follow the step that precedes them
      var connectors = NB.$$('.nb-stepper_connector', el);
      connectors.forEach(function (conn, i) {
        if (i < currentIndex) {
          conn.style.background = 'var(--accent)';
        } else {
          conn.style.background = '';
        }
      });

      NB.emit(el, 'nb:stepper-change', {
        step: currentIndex,
        total: steps.length,
      });
    }

    /* -------------------------------------------------------------- */
    /*  Navigation methods                                             */
    /* -------------------------------------------------------------- */

    function next() {
      if (currentIndex < steps.length - 1) {
        currentIndex++;
        updateSteps();
      }
    }

    function prev() {
      if (currentIndex > 0) {
        currentIndex--;
        updateSteps();
      }
    }

    function goTo(n) {
      if (typeof n !== 'number') return;
      var index = Math.max(0, Math.min(n, steps.length - 1));
      currentIndex = index;
      updateSteps();
    }

    /* -------------------------------------------------------------- */
    /*  Public API                                                     */
    /* -------------------------------------------------------------- */

    NB.stepper = NB.stepper || {};
    NB.stepper.next = next;
    NB.stepper.prev = prev;
    NB.stepper.goTo = goTo;

    NB.stepper.getCurrent = function () {
      return currentIndex;
    };

    NB.stepper.getTotal = function () {
      return steps.length;
    };

    // Initialize from markup state
    updateSteps();
  });

})(window.NB);


/* --- components/dropdown.js --- */

/**
 * NB Dropdown Component
 * Toggle menu on trigger click. Close on outside click / Escape.
 * Arrow key navigation of items. Full ARIA: menu, menuitem, haspopup, expanded.
 *
 * Usage:
 *   <div data-nb-dropdown class="nb-dropdown">
 *     <button class="nb-dropdown_trigger">Options</button>
 *     <div class="nb-dropdown_menu">
 *       <div class="nb-dropdown_header">Section</div>
 *       <button class="nb-dropdown_item">Edit</button>
 *       <button class="nb-dropdown_item">Duplicate</button>
 *       <div class="nb-dropdown_divider"></div>
 *       <button class="nb-dropdown_item">Delete</button>
 *     </div>
 *   </div>
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('dropdown', function (el) {

    var trigger = NB.$('.nb-dropdown_trigger', el);
    var menu = NB.$('.nb-dropdown_menu', el);

    if (!trigger || !menu) return;

    var items = NB.$$('.nb-dropdown_item', menu);
    var focusedIndex = -1;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    var menuId = menu.id || NB.uid('nb-dropdown-menu');
    menu.id = menuId;
    menu.setAttribute('role', 'menu');

    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', menuId);

    items.forEach(function (item) {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
    });

    /* -------------------------------------------------------------- */
    /*  State helpers                                                   */
    /* -------------------------------------------------------------- */

    function isOpen() {
      return el.classList.contains('is-open');
    }

    function clearFocus() {
      items.forEach(function (item) {
        item.classList.remove('is-focused');
      });
      focusedIndex = -1;
    }

    function focusItem(index) {
      clearFocus();
      if (index < 0 || index >= items.length) return;
      focusedIndex = index;
      items[focusedIndex].classList.add('is-focused');
      items[focusedIndex].focus();
    }

    /* -------------------------------------------------------------- */
    /*  Open / close                                                   */
    /* -------------------------------------------------------------- */

    function open() {
      el.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      NB.emit(el, 'nb:dropdown-open');

      // Focus first item
      if (items.length) {
        focusItem(0);
      }
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      clearFocus();
      NB.emit(el, 'nb:dropdown-close');
    }

    function toggle(e) {
      e.stopPropagation();
      if (isOpen()) {
        close();
        trigger.focus();
      } else {
        open();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Item selection                                                  */
    /* -------------------------------------------------------------- */

    function selectItem(item) {
      NB.emit(el, 'nb:dropdown-select', {
        value: item.textContent.trim(),
        item: item,
      });
      close();
      trigger.focus();
    }

    /* -------------------------------------------------------------- */
    /*  Outside click                                                   */
    /* -------------------------------------------------------------- */

    function handleOutsideClick(e) {
      if (!isOpen()) return;
      if (!el.contains(e.target)) {
        close();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Keyboard navigation                                            */
    /* -------------------------------------------------------------- */

    function handleKeydown(e) {
      if (!isOpen() && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
        if (el.contains(document.activeElement)) {
          e.preventDefault();
          open();
          return;
        }
      }

      if (!isOpen()) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          close();
          trigger.focus();
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (focusedIndex < items.length - 1) {
            focusItem(focusedIndex + 1);
          } else {
            focusItem(0);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (focusedIndex > 0) {
            focusItem(focusedIndex - 1);
          } else {
            focusItem(items.length - 1);
          }
          break;

        case 'Home':
          e.preventDefault();
          focusItem(0);
          break;

        case 'End':
          e.preventDefault();
          focusItem(items.length - 1);
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            selectItem(items[focusedIndex]);
          }
          break;

        case 'Tab':
          close();
          break;
      }
    }

    /* -------------------------------------------------------------- */
    /*  Item click                                                     */
    /* -------------------------------------------------------------- */

    items.forEach(function (item) {
      NB.on(item, 'click', function (e) {
        e.stopPropagation();
        selectItem(item);
      });

      // Hover focus
      NB.on(item, 'mouseenter', function () {
        focusItem(items.indexOf(item));
      });
    });

    /* -------------------------------------------------------------- */
    /*  Bind events                                                    */
    /* -------------------------------------------------------------- */

    NB.on(trigger, 'click', toggle);
    NB.on(document, 'click', handleOutsideClick);
    NB.on(el, 'keydown', handleKeydown);

    /* Return cleanup for NB.destroy() */
    return function () {
      NB.off(document, 'click', handleOutsideClick);
    };
  });

})(window.NB);


/* --- components/vertical-tabs.js --- */

/**
 * NB Vertical Tabs Component
 * Vertical tab navigation with arrow key support (up/down, Home/End).
 * Full ARIA: role=tablist orientation=vertical, role=tab, role=tabpanel.
 *
 * Usage:
 *   <div data-nb-vtabs class="nb-vtabs">
 *     <div class="nb-vtabs_list">
 *       <button class="nb-vtabs_tab is-active" data-nb-vtab="panel-1">Tab 1</button>
 *       <button class="nb-vtabs_tab" data-nb-vtab="panel-2">Tab 2</button>
 *     </div>
 *     <div class="nb-vtabs_panel is-active" id="panel-1">Content 1</div>
 *     <div class="nb-vtabs_panel" id="panel-2">Content 2</div>
 *   </div>
 *
 * Events:
 *   nb:vtab-change — detail: { tab, panel }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('vtabs', function (el) {

    var tablist = NB.$('.nb-vtabs_list', el);
    var tabs = NB.$$('.nb-vtabs_tab', el);
    var panels = NB.$$('.nb-vtabs_panel', el);

    if (!tablist || !tabs.length) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-orientation', 'vertical');

    tabs.forEach(function (tab, i) {
      var panelId = tab.getAttribute('data-nb-vtab');
      var tabId = tab.id || NB.uid('nb-vtab');
      tab.id = tabId;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('tabindex', tab.classList.contains('is-active') ? '0' : '-1');
      tab.setAttribute('aria-selected', String(tab.classList.contains('is-active')));
      if (panelId) tab.setAttribute('aria-controls', panelId);

      var panel = panelId ? document.getElementById(panelId) : panels[i];
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tabId);
        panel.setAttribute('tabindex', '0');
      }
    });

    /* -------------------------------------------------------------- */
    /*  Activate tab                                                   */
    /* -------------------------------------------------------------- */

    function activate(tab) {
      tabs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      panels.forEach(function (p) { p.classList.remove('is-active'); });

      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      tab.focus();

      var panelId = tab.getAttribute('data-nb-vtab');
      var panel = panelId ? document.getElementById(panelId) : null;
      if (panel) panel.classList.add('is-active');

      NB.emit(el, 'nb:vtab-change', { tab: tab, panel: panel });
    }

    /* -------------------------------------------------------------- */
    /*  Click handler                                                  */
    /* -------------------------------------------------------------- */

    NB.on(tablist, 'click', function (e) {
      var tab = e.target.closest('.nb-vtabs_tab');
      if (tab) activate(tab);
    });

    /* -------------------------------------------------------------- */
    /*  Keyboard navigation                                            */
    /* -------------------------------------------------------------- */

    NB.on(tablist, 'keydown', function (e) {
      var idx = tabs.indexOf(document.activeElement);
      if (idx === -1) return;

      var next;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          next = tabs[(idx + 1) % tabs.length];
          break;
        case 'ArrowUp':
          e.preventDefault();
          next = tabs[(idx - 1 + tabs.length) % tabs.length];
          break;
        case 'Home':
          e.preventDefault();
          next = tabs[0];
          break;
        case 'End':
          e.preventDefault();
          next = tabs[tabs.length - 1];
          break;
      }

      if (next) activate(next);
    });

  });
})(window.NB);


/* --- components/context-menu.js --- */

/**
 * NB Context Menu Component
 * Right-click context menus with keyboard navigation.
 *
 * Usage:
 *   <div data-nb-context-menu="my-ctx">Right-click here</div>
 *
 *   <div class="nb-context-menu" id="my-ctx" role="menu">
 *     <button class="nb-context-menu_item" role="menuitem">Cut</button>
 *     <button class="nb-context-menu_item" role="menuitem">Copy</button>
 *     <div class="nb-context-menu_divider"></div>
 *     <button class="nb-context-menu_item" role="menuitem">
 *       Delete
 *       <span class="nb-context-menu_shortcut">Del</span>
 *     </button>
 *   </div>
 *
 * Events:
 *   nb:context-menu-open  — detail: { id, x, y }
 *   nb:context-menu-close — detail: { id }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var activeMenu = null;

  /* ------------------------------------------------------------------ */
  /*  Close active menu                                                  */
  /* ------------------------------------------------------------------ */

  function closeActive() {
    if (!activeMenu) return;
    activeMenu.classList.remove('is-open');
    activeMenu.setAttribute('aria-hidden', 'true');
    NB.emit(activeMenu, 'nb:context-menu-close', { id: activeMenu.id || null });
    activeMenu = null;
  }

  /* ------------------------------------------------------------------ */
  /*  Open a menu at coordinates                                         */
  /* ------------------------------------------------------------------ */

  function openMenu(menu, x, y) {
    closeActive();
    activeMenu = menu;

    /* Position at cursor */
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');

    /* Clamp to viewport */
    var rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = (y - rect.height) + 'px';
    }

    /* Focus first item */
    var first = NB.$('.nb-context-menu_item:not([disabled])', menu);
    if (first) first.focus();

    NB.emit(menu, 'nb:context-menu-open', { id: menu.id || null, x: x, y: y });
  }

  /* ------------------------------------------------------------------ */
  /*  Keyboard navigation                                                */
  /* ------------------------------------------------------------------ */

  function handleKeydown(e) {
    if (!activeMenu) return;

    var items = NB.$$('.nb-context-menu_item:not([disabled])', activeMenu);
    if (!items.length) return;

    var idx = items.indexOf(document.activeElement);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
        break;
      case 'Home':
        e.preventDefault();
        items[0].focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1].focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (idx !== -1) {
          items[idx].click();
          closeActive();
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeActive();
        break;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Global listeners                                                   */
  /* ------------------------------------------------------------------ */

  function handleContextMenu(e) {
    var trigger = e.target.closest('[data-nb-context-menu]');
    if (!trigger) return;

    e.preventDefault();
    var menuId = trigger.getAttribute('data-nb-context-menu');
    var menu = document.getElementById(menuId);
    if (menu) openMenu(menu, e.clientX, e.clientY);
  }

  function handleClick() {
    closeActive();
  }

  NB.on(document, 'contextmenu', handleContextMenu);
  NB.on(document, 'click', handleClick);
  NB.on(document, 'keydown', handleKeydown);

  /** Remove all global listeners (called by NB.destroy). */
  NB._addCleanup(document, function () {
    NB.off(document, 'contextmenu', handleContextMenu);
    NB.off(document, 'click', handleClick);
    NB.off(document, 'keydown', handleKeydown);
  });

  /* Expose API */
  NB.contextMenu = {
    open: openMenu,
    close: closeActive
  };

})(window.NB);


/* --- components/menubar.js --- */

/**
 * NB Menubar Component
 * Horizontal menubar with nested dropdown submenus.
 * Hover-to-open behavior, full ARIA: menubar, menuitem, haspopup, expanded.
 *
 * Usage:
 *   <nav class="nb-menubar" data-nb-menubar>
 *     <button class="nb-menubar_item">
 *       File
 *       <div class="nb-menubar_submenu">
 *         <button class="nb-menubar_submenu-item">New</button>
 *         <button class="nb-menubar_submenu-item">Open</button>
 *         <div class="nb-menubar_divider"></div>
 *         <button class="nb-menubar_submenu-item">Save</button>
 *       </div>
 *     </button>
 *     <button class="nb-menubar_item">Edit</button>
 *   </nav>
 *
 * Events:
 *   nb:menubar-open  — detail: { item }
 *   nb:menubar-close — detail: { item }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('menubar', function (el) {

    var items = NB.$$(':scope > .nb-menubar_item', el);
    var isBarActive = false;

    if (!items.length) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    el.setAttribute('role', 'menubar');

    items.forEach(function (item) {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '0');

      var submenu = NB.$('.nb-menubar_submenu', item);
      if (submenu) {
        var subId = submenu.id || NB.uid('nb-menubar-sub');
        submenu.id = subId;
        submenu.setAttribute('role', 'menu');
        item.setAttribute('aria-haspopup', 'true');
        item.setAttribute('aria-expanded', 'false');
        item.setAttribute('aria-controls', subId);

        NB.$$('.nb-menubar_submenu-item', submenu).forEach(function (si) {
          si.setAttribute('role', 'menuitem');
          si.setAttribute('tabindex', '-1');
        });
      }
    });

    /* -------------------------------------------------------------- */
    /*  Open / Close                                                   */
    /* -------------------------------------------------------------- */

    function openItem(item) {
      closeAll();
      item.classList.add('is-open');
      item.setAttribute('aria-expanded', 'true');
      isBarActive = true;

      var first = NB.$('.nb-menubar_submenu-item', item);
      if (first) first.focus();

      NB.emit(el, 'nb:menubar-open', { item: item });
    }

    function closeItem(item) {
      item.classList.remove('is-open');
      item.setAttribute('aria-expanded', 'false');
      NB.emit(el, 'nb:menubar-close', { item: item });
    }

    function closeAll() {
      items.forEach(function (item) {
        if (item.classList.contains('is-open')) closeItem(item);
      });
      isBarActive = false;
    }

    /* -------------------------------------------------------------- */
    /*  Click handler                                                  */
    /* -------------------------------------------------------------- */

    items.forEach(function (item) {
      NB.on(item, 'click', function (e) {
        if (e.target.closest('.nb-menubar_submenu-item')) return;
        e.stopPropagation();
        if (item.classList.contains('is-open')) {
          closeItem(item);
          isBarActive = false;
        } else {
          openItem(item);
        }
      });

      /* Hover to open when bar is active */
      NB.on(item, 'mouseenter', function () {
        if (isBarActive && !item.classList.contains('is-open')) {
          openItem(item);
        }
      });
    });

    /* -------------------------------------------------------------- */
    /*  Submenu item click                                             */
    /* -------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var subItem = e.target.closest('.nb-menubar_submenu-item');
      if (subItem) closeAll();
    });

    /* -------------------------------------------------------------- */
    /*  Keyboard navigation                                            */
    /* -------------------------------------------------------------- */

    NB.on(el, 'keydown', function (e) {
      var activeItem = document.activeElement;
      var parentItem = activeItem.closest('.nb-menubar_item');

      /* Top-level navigation */
      if (items.indexOf(activeItem) !== -1) {
        var idx = items.indexOf(activeItem);

        switch (e.key) {
          case 'ArrowRight':
            e.preventDefault();
            items[(idx + 1) % items.length].focus();
            if (isBarActive) openItem(items[(idx + 1) % items.length]);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            items[(idx - 1 + items.length) % items.length].focus();
            if (isBarActive) openItem(items[(idx - 1 + items.length) % items.length]);
            break;
          case 'ArrowDown':
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (NB.$('.nb-menubar_submenu', activeItem)) {
              openItem(activeItem);
            }
            break;
          case 'Escape':
            e.preventDefault();
            closeAll();
            break;
        }
        return;
      }

      /* Submenu navigation */
      if (parentItem && activeItem.classList.contains('nb-menubar_submenu-item')) {
        var subItems = NB.$$('.nb-menubar_submenu-item', parentItem);
        var subIdx = subItems.indexOf(activeItem);

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            subItems[(subIdx + 1) % subItems.length].focus();
            break;
          case 'ArrowUp':
            e.preventDefault();
            subItems[(subIdx - 1 + subItems.length) % subItems.length].focus();
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            activeItem.click();
            break;
          case 'Escape':
            e.preventDefault();
            closeItem(parentItem);
            parentItem.focus();
            break;
          case 'ArrowRight': {
            e.preventDefault();
            var pIdx = items.indexOf(parentItem);
            var nextItem = items[(pIdx + 1) % items.length];
            closeItem(parentItem);
            if (NB.$('.nb-menubar_submenu', nextItem)) {
              openItem(nextItem);
            } else {
              nextItem.focus();
            }
            break;
          }
          case 'ArrowLeft': {
            e.preventDefault();
            var pIdx2 = items.indexOf(parentItem);
            var prevItem = items[(pIdx2 - 1 + items.length) % items.length];
            closeItem(parentItem);
            if (NB.$('.nb-menubar_submenu', prevItem)) {
              openItem(prevItem);
            } else {
              prevItem.focus();
            }
            break;
          }
        }
      }
    });

    /* -------------------------------------------------------------- */
    /*  Close on outside click                                         */
    /* -------------------------------------------------------------- */

    NB.on(document, 'click', function (e) {
      if (!el.contains(e.target)) closeAll();
    });

  });
})(window.NB);


/* --- components/navigation-menu.js --- */

/**
 * NB Navigation Menu Component
 * Mega-menu style navigation with multi-column content panels.
 *
 * Usage:
 *   <nav class="nb-nav-menu" data-nb-nav-menu>
 *     <button class="nb-nav-menu_trigger" data-nb-nav-target="panel-1">Products</button>
 *     <button class="nb-nav-menu_trigger" data-nb-nav-target="panel-2">Resources</button>
 *
 *     <div class="nb-nav-menu_content" id="panel-1">
 *       <div class="nb-nav-menu_columns">
 *         <div class="nb-nav-menu_column">
 *           <div class="nb-nav-menu_heading">Platform</div>
 *           <a href="#" class="nb-nav-menu_link">
 *             <span class="nb-nav-menu_link-title">API</span>
 *             <span class="nb-nav-menu_link-desc">Build integrations</span>
 *           </a>
 *         </div>
 *       </div>
 *     </div>
 *   </nav>
 *
 * Events:
 *   nb:nav-menu-open  — detail: { trigger, panel }
 *   nb:nav-menu-close — detail: { trigger, panel }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('nav-menu', function (el) {

    var triggers = NB.$$('.nb-nav-menu_trigger', el);
    var panels = NB.$$('.nb-nav-menu_content', el);
    var activePanel = null;
    var activeTrigger = null;
    var closeTimer = null;

    if (!triggers.length) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    triggers.forEach(function (trigger) {
      var targetId = trigger.getAttribute('data-nb-nav-target');
      if (targetId) {
        trigger.setAttribute('aria-haspopup', 'true');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', targetId);
      }
    });

    panels.forEach(function (panel) {
      panel.setAttribute('aria-hidden', 'true');
    });

    /* -------------------------------------------------------------- */
    /*  Open / Close                                                   */
    /* -------------------------------------------------------------- */

    function openPanel(trigger) {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }

      var targetId = trigger.getAttribute('data-nb-nav-target');
      var panel = targetId ? document.getElementById(targetId) : null;
      if (!panel) return;

      if (activePanel && activePanel !== panel) {
        closePanel();
      }

      activeTrigger = trigger;
      activePanel = panel;

      trigger.classList.add('is-active');
      trigger.setAttribute('aria-expanded', 'true');
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');

      NB.emit(el, 'nb:nav-menu-open', { trigger: trigger, panel: panel });
    }

    function closePanel() {
      if (!activePanel) return;

      activeTrigger.classList.remove('is-active');
      activeTrigger.setAttribute('aria-expanded', 'false');
      activePanel.classList.remove('is-open');
      activePanel.setAttribute('aria-hidden', 'true');

      NB.emit(el, 'nb:nav-menu-close', { trigger: activeTrigger, panel: activePanel });

      activePanel = null;
      activeTrigger = null;
    }

    function scheduleClose() {
      closeTimer = setTimeout(closePanel, 150);
    }

    /* -------------------------------------------------------------- */
    /*  Event handlers                                                 */
    /* -------------------------------------------------------------- */

    triggers.forEach(function (trigger) {
      NB.on(trigger, 'click', function (e) {
        e.preventDefault();
        if (activeTrigger === trigger) {
          closePanel();
        } else {
          openPanel(trigger);
        }
      });

      NB.on(trigger, 'mouseenter', function () {
        openPanel(trigger);
      });

      NB.on(trigger, 'mouseleave', function () {
        scheduleClose();
      });
    });

    panels.forEach(function (panel) {
      NB.on(panel, 'mouseenter', function () {
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      });

      NB.on(panel, 'mouseleave', function () {
        scheduleClose();
      });
    });

    /* Escape closes */
    NB.on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && activePanel) {
        closePanel();
        if (activeTrigger) activeTrigger.focus();
      }
    });

    /* Close on outside click */
    NB.on(document, 'click', function (e) {
      if (activePanel && !el.contains(e.target)) {
        closePanel();
      }
    });

  });
})(window.NB);


/* --- components/command-palette.js --- */

/**
 * NB Command Palette Component
 * Cmd+K / Ctrl+K searchable launcher overlay with fuzzy filtering.
 *
 * Usage:
 *   <div class="nb-command-palette" id="cmd-palette" data-nb-command-palette>
 *     <div class="nb-command_dialog" role="dialog" aria-label="Command palette">
 *       <div class="nb-command_search">
 *         <svg class="nb-command_search-icon">...</svg>
 *         <input class="nb-command_input" placeholder="Type a command..." />
 *       </div>
 *       <div class="nb-command_results">
 *         <div class="nb-command_group">
 *           <div class="nb-command_group-label">Navigation</div>
 *           <button class="nb-command_item" data-nb-command-value="dashboard">
 *             Dashboard
 *             <span class="nb-command_item-shortcut">Ctrl+D</span>
 *           </button>
 *         </div>
 *       </div>
 *       <div class="nb-command_footer">
 *         <span><kbd>&uarr;&darr;</kbd> Navigate</span>
 *         <span><kbd>&crarr;</kbd> Select</span>
 *         <span><kbd>Esc</kbd> Close</span>
 *       </div>
 *     </div>
 *   </div>
 *
 * API:
 *   NB.commandPalette.open(id?)
 *   NB.commandPalette.close()
 *
 * Events:
 *   nb:command-open   — on the palette element
 *   nb:command-close  — on the palette element
 *   nb:command-select — detail: { value, item }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var activePalette = null;
  var allItems = [];
  var visibleItems = [];
  var activeIndex = -1;
  var releaseFocusTrap = null;

  /* ------------------------------------------------------------------ */
  /*  Fuzzy match                                                        */
  /* ------------------------------------------------------------------ */

  function fuzzyMatch(query, text) {
    query = query.toLowerCase();
    text = text.toLowerCase();
    var qi = 0;
    for (var ti = 0; ti < text.length && qi < query.length; ti++) {
      if (text[ti] === query[qi]) qi++;
    }
    return qi === query.length;
  }

  /* ------------------------------------------------------------------ */
  /*  Scroll lock                                                        */
  /* ------------------------------------------------------------------ */

  function lockScroll() {
    document.body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.body.style.overflow = '';
  }

  /* ------------------------------------------------------------------ */
  /*  Open / Close                                                       */
  /* ------------------------------------------------------------------ */

  function openPalette(id) {
    var el = id ? document.getElementById(id) :
      document.querySelector('[data-nb-command-palette]');
    if (!el || el.classList.contains('is-open')) return;

    activePalette = el;
    allItems = NB.$$('.nb-command_item', el);
    lockScroll();

    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');

    /* Trap focus inside the dialog */
    var dialog = NB.$('.nb-command_dialog', el) || el;
    releaseFocusTrap = NB.trapFocus(dialog);

    var input = NB.$('.nb-command_input', el);
    if (input) {
      input.value = '';
      setTimeout(function () { input.focus(); }, 50);
    }

    resetFilter();
    NB.emit(el, 'nb:command-open');
  }

  function closePalette() {
    if (!activePalette) return;

    activePalette.classList.remove('is-open');
    activePalette.setAttribute('aria-hidden', 'true');

    /* Release focus trap */
    if (releaseFocusTrap) {
      releaseFocusTrap();
      releaseFocusTrap = null;
    }

    unlockScroll();

    NB.emit(activePalette, 'nb:command-close');
    activePalette = null;
    allItems = [];
    visibleItems = [];
    activeIndex = -1;
  }

  /* ------------------------------------------------------------------ */
  /*  Filtering                                                          */
  /* ------------------------------------------------------------------ */

  function resetFilter() {
    allItems.forEach(function (item) {
      item.style.display = '';
      item.classList.remove('is-active');
    });

    /* Show all groups */
    if (activePalette) {
      NB.$$('.nb-command_group', activePalette).forEach(function (g) {
        g.style.display = '';
      });
    }

    visibleItems = allItems.slice();
    activeIndex = visibleItems.length > 0 ? 0 : -1;
    updateHighlight();
  }

  function filterItems(query) {
    if (!query) { resetFilter(); return; }

    allItems.forEach(function (item) {
      var text = item.textContent || '';
      var value = item.getAttribute('data-nb-command-value') || '';
      var match = fuzzyMatch(query, text) || fuzzyMatch(query, value);
      item.style.display = match ? '' : 'none';
      item.classList.remove('is-active');
    });

    /* Hide empty groups */
    if (activePalette) {
      NB.$$('.nb-command_group', activePalette).forEach(function (g) {
        var hasVisible = NB.$$('.nb-command_item', g).some(function (i) {
          return i.style.display !== 'none';
        });
        g.style.display = hasVisible ? '' : 'none';
      });
    }

    visibleItems = allItems.filter(function (i) { return i.style.display !== 'none'; });
    activeIndex = visibleItems.length > 0 ? 0 : -1;
    updateHighlight();
  }

  /* ------------------------------------------------------------------ */
  /*  Highlight management                                               */
  /* ------------------------------------------------------------------ */

  function updateHighlight() {
    visibleItems.forEach(function (item, i) {
      item.classList.toggle('is-active', i === activeIndex);
    });
    if (activeIndex >= 0 && visibleItems[activeIndex]) {
      visibleItems[activeIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Select item                                                        */
  /* ------------------------------------------------------------------ */

  function selectItem(item) {
    var value = item.getAttribute('data-nb-command-value') || item.textContent.trim();
    NB.emit(activePalette, 'nb:command-select', { value: value, item: item });
    closePalette();
  }

  /* ------------------------------------------------------------------ */
  /*  Global Cmd+K / Ctrl+K                                              */
  /* ------------------------------------------------------------------ */

  function handleGlobalKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (activePalette) {
        closePalette();
      } else {
        openPalette();
      }
    }
  }

  NB.on(document, 'keydown', handleGlobalKeydown);

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  NB.register('command-palette', function (el) {

    el.setAttribute('aria-hidden', 'true');

    var input = NB.$('.nb-command_input', el);

    /* Input filtering */
    if (input) {
      NB.on(input, 'input', function () {
        filterItems(input.value.trim());
      });
    }

    /* Click on backdrop to close */
    NB.on(el, 'click', function (e) {
      if (e.target === el) closePalette();
    });

    /* Click on item */
    NB.on(el, 'click', function (e) {
      var item = e.target.closest('.nb-command_item');
      if (item) selectItem(item);
    });

    /* Keyboard nav */
    NB.on(el, 'keydown', function (e) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (visibleItems.length) {
            activeIndex = (activeIndex + 1) % visibleItems.length;
            updateHighlight();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (visibleItems.length) {
            activeIndex = (activeIndex - 1 + visibleItems.length) % visibleItems.length;
            updateHighlight();
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && visibleItems[activeIndex]) {
            selectItem(visibleItems[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closePalette();
          break;
      }
    });

    /* Return cleanup for NB.destroy() */
    return function () {
      NB.off(document, 'keydown', handleGlobalKeydown);
      if (releaseFocusTrap) {
        releaseFocusTrap();
        releaseFocusTrap = null;
      }
    };
  });

  /* Expose API */
  NB.commandPalette = {
    open: openPalette,
    close: closePalette
  };

})(window.NB);


/* --- components/scroll-area.js --- */

/**
 * NB Scroll Area Component
 * Auto-hide scrollbar after inactivity. Works alongside native scroll.
 *
 * Usage:
 *   <div class="nb-scroll-area" data-nb-scroll-area>
 *     <!-- scrollable content -->
 *   </div>
 *
 * Options:
 *   data-nb-scroll-idle="2000"  — idle timeout in ms (default 1500)
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('scroll-area', function (el) {

    var idleDelay = parseInt(el.getAttribute('data-nb-scroll-idle'), 10) || 1500;
    var timer = null;

    function showScrollbar() {
      el.classList.remove('is-idle');
      clearTimeout(timer);
      timer = setTimeout(function () {
        el.classList.add('is-idle');
      }, idleDelay);
    }

    /* Start idle */
    el.classList.add('is-idle');

    /* Show on scroll */
    NB.on(el, 'scroll', showScrollbar);

    /* Show on hover */
    NB.on(el, 'mouseenter', function () {
      el.classList.remove('is-idle');
      clearTimeout(timer);
    });

    NB.on(el, 'mouseleave', function () {
      timer = setTimeout(function () {
        el.classList.add('is-idle');
      }, idleDelay);
    });

  });
})(window.NB);


/* --- components/splitter.js --- */

/**
 * NB Splitter Component
 * Draggable divider between two panes. Horizontal or vertical layout.
 *
 * Usage:
 *   <div class="nb-splitter" data-nb-splitter="horizontal">
 *     <div class="nb-splitter_pane" style="flex: 0 0 50%">Left</div>
 *     <div class="nb-splitter_handle" tabindex="0"></div>
 *     <div class="nb-splitter_pane" style="flex: 1">Right</div>
 *   </div>
 *
 * Options:
 *   data-nb-splitter="horizontal|vertical"
 *   data-nb-min="100"  — min size in px for first pane
 *   data-nb-max="800"  — max size in px for first pane
 *
 * Events:
 *   nb:splitter-resize — detail: { size, percent }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('splitter', function (el) {

    var handle = NB.$('.nb-splitter_handle', el);
    var panes = NB.$$('.nb-splitter_pane', el);
    if (!handle || panes.length < 2) return;

    var isVertical = el.getAttribute('data-nb-splitter') === 'vertical';
    var minSize = parseInt(el.getAttribute('data-nb-min'), 10) || 50;
    var maxSize = parseInt(el.getAttribute('data-nb-max'), 10) || Infinity;

    var firstPane = panes[0];
    var startPos = 0;
    var startSize = 0;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', isVertical ? 'horizontal' : 'vertical');
    handle.setAttribute('aria-valuenow', '50');
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', '100');

    /* -------------------------------------------------------------- */
    /*  Drag handling                                                  */
    /* -------------------------------------------------------------- */

    function onMouseMove(e) {
      var containerRect = el.getBoundingClientRect();
      var totalSize = isVertical ? containerRect.height : containerRect.width;
      var delta = isVertical ? (e.clientY - startPos) : (e.clientX - startPos);
      var newSize = Math.max(minSize, Math.min(maxSize, startSize + delta));
      var clampedSize = Math.min(newSize, totalSize - minSize);

      firstPane.style.flex = '0 0 ' + clampedSize + 'px';

      var percent = Math.round((clampedSize / totalSize) * 100);
      handle.setAttribute('aria-valuenow', String(percent));

      NB.emit(el, 'nb:splitter-resize', { size: clampedSize, percent: percent });
    }

    function onMouseUp() {
      el.classList.remove('is-resizing');
      handle.classList.remove('is-dragging');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    NB.on(handle, 'mousedown', function (e) {
      e.preventDefault();
      startPos = isVertical ? e.clientY : e.clientX;
      startSize = isVertical ? firstPane.offsetHeight : firstPane.offsetWidth;

      el.classList.add('is-resizing');
      handle.classList.add('is-dragging');

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    /* -------------------------------------------------------------- */
    /*  Keyboard resize                                                */
    /* -------------------------------------------------------------- */

    var STEP = 10;

    NB.on(handle, 'keydown', function (e) {
      var size = isVertical ? firstPane.offsetHeight : firstPane.offsetWidth;
      var containerRect = el.getBoundingClientRect();
      var totalSize = isVertical ? containerRect.height : containerRect.width;
      var newSize;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          newSize = Math.max(minSize, size - STEP);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          newSize = Math.min(Math.min(maxSize, totalSize - minSize), size + STEP);
          break;
        case 'Home':
          e.preventDefault();
          newSize = minSize;
          break;
        case 'End':
          e.preventDefault();
          newSize = Math.min(maxSize, totalSize - minSize);
          break;
        default:
          return;
      }

      firstPane.style.flex = '0 0 ' + newSize + 'px';
      var percent = Math.round((newSize / totalSize) * 100);
      handle.setAttribute('aria-valuenow', String(percent));
      NB.emit(el, 'nb:splitter-resize', { size: newSize, percent: percent });
    });

  });
})(window.NB);


/* --- components/theme-toggle.js --- */

/**
 * NB Theme Toggle Component
 * Toggles `data-theme` between 'dark' and 'light' on <html>.
 * Persists the selection to localStorage and restores it on init.
 * Emits a `nb:theme-change` CustomEvent with `{ theme }` detail.
 *
 * Usage:
 *   <button data-nb-theme-toggle>Toggle theme</button>
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var STORAGE_KEY = 'nb-theme';
  var root = document.documentElement;

  NB.register('theme-toggle', function (el) {

    /* ---------------------------------------------------------------- */
    /*  Restore saved theme on init                                      */
    /* ---------------------------------------------------------------- */

    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      // localStorage may be unavailable (private browsing, etc.)
    }

    if (saved === 'dark' || saved === 'light') {
      root.setAttribute('data-theme', saved);
    }

    /* ---------------------------------------------------------------- */
    /*  Toggle handler                                                   */
    /* ---------------------------------------------------------------- */

    function toggle() {
      var current = root.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';

      root.setAttribute('data-theme', next);

      // Persist preference
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        // Silently fail if storage is unavailable
      }

      // Notify listeners
      NB.emit(el, 'nb:theme-change', { theme: next });
    }

    /* ---------------------------------------------------------------- */
    /*  Bind click                                                       */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'click', toggle);
  });

})(window.NB);


/* --- components/portal.js --- */

/**
 * NB Portal Component
 * Moves element content to the end of document.body (teleporting).
 * Useful for modals, tooltips, and overlays that need to escape
 * overflow/stacking-context constraints.
 *
 * Usage:
 *   <div data-nb-portal>
 *     <div class="nb-modal-backdrop">...</div>
 *   </div>
 *
 * Options:
 *   data-nb-portal-target="#custom-container"  — teleport to a specific element
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('portal', function (el) {

    var targetSelector = el.getAttribute('data-nb-portal-target');
    var target = targetSelector ? document.querySelector(targetSelector) : document.body;
    if (!target) target = document.body;

    /* Store original position for potential cleanup */
    var placeholder = document.createComment('nb-portal:' + (el.id || NB.uid('portal')));
    el.parentNode.insertBefore(placeholder, el);

    /* Move all children to target */
    var fragment = document.createDocumentFragment();
    while (el.firstChild) {
      fragment.appendChild(el.firstChild);
    }

    /* Track moved nodes for cleanup */
    var movedNodes = Array.prototype.slice.call(fragment.childNodes);
    target.appendChild(fragment);

    /* Expose restore method */
    el._nbPortalRestore = function () {
      movedNodes.forEach(function (node) {
        el.appendChild(node);
      });
      if (placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
    };

  });
})(window.NB);


/* --- components/presence.js --- */

/**
 * NB Presence Component
 * Animate enter/exit of elements. Adds animation class on enter,
 * waits for animationend before removing on exit.
 *
 * Usage:
 *   <div data-nb-presence
 *        data-nb-enter="nb-fade-in"
 *        data-nb-exit="nb-fade-out">
 *     Content to animate
 *   </div>
 *
 * API:
 *   NB.presence.enter(el)  — trigger enter animation
 *   NB.presence.exit(el)   — trigger exit animation (removes after animationend)
 *   NB.presence.toggle(el) — toggle between enter and exit
 *
 * Events:
 *   nb:presence-enter    — after enter animation starts
 *   nb:presence-entered  — after enter animation ends
 *   nb:presence-exit     — after exit animation starts
 *   nb:presence-exited   — after exit animation ends
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  function enter(el) {
    var enterClass = el.getAttribute('data-nb-enter') || 'nb-fade-in';
    var exitClass = el.getAttribute('data-nb-exit') || 'nb-fade-out';

    el.classList.remove(exitClass);
    el.style.display = '';
    el.classList.add(enterClass);

    NB.emit(el, 'nb:presence-enter');

    function onEnd() {
      el.removeEventListener('animationend', onEnd);
      NB.emit(el, 'nb:presence-entered');
    }

    el.addEventListener('animationend', onEnd);
  }

  function exit(el) {
    var enterClass = el.getAttribute('data-nb-enter') || 'nb-fade-in';
    var exitClass = el.getAttribute('data-nb-exit') || 'nb-fade-out';

    el.classList.remove(enterClass);
    el.classList.add(exitClass);

    NB.emit(el, 'nb:presence-exit');

    function onEnd() {
      el.removeEventListener('animationend', onEnd);
      el.classList.remove(exitClass);
      el.style.display = 'none';
      NB.emit(el, 'nb:presence-exited');
    }

    el.addEventListener('animationend', onEnd);
  }

  function toggle(el) {
    if (el.style.display === 'none' || getComputedStyle(el).display === 'none') {
      enter(el);
    } else {
      exit(el);
    }
  }

  NB.register('presence', function (el) {
    /* Auto-hide on init if data-nb-presence-hidden is set */
    if (el.hasAttribute('data-nb-presence-hidden')) {
      el.style.display = 'none';
    }
  });

  /* Expose API */
  NB.presence = {
    enter: enter,
    exit: exit,
    toggle: toggle
  };

})(window.NB);


/* --- components/focus-trap.js --- */

/**
 * NB Focus Trap Component
 * Traps focus within an element. Wraps the core NB.trapFocus() utility
 * as a registerable component.
 *
 * Usage:
 *   <div data-nb-focus-trap>
 *     <input type="text" />
 *     <button>Submit</button>
 *   </div>
 *
 * Options:
 *   data-nb-focus-trap-active="true|false"  — start active (default: true)
 *
 * @requires nb-core.js (NB.trapFocus)
 */
;(function (NB) {
  'use strict';

  NB.register('focus-trap', function (el) {

    var isActive = el.getAttribute('data-nb-focus-trap-active') !== 'false';
    var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

    function getFocusable() {
      return Array.prototype.slice.call(el.querySelectorAll(FOCUSABLE)).filter(function (f) {
        return f.offsetParent !== null;
      });
    }

    function handleKeydown(e) {
      if (e.key !== 'Tab') return;

      var focusable = getFocusable();
      if (!focusable.length) return;

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

    function activate() {
      isActive = true;
      el.addEventListener('keydown', handleKeydown);
      /* Focus first focusable element */
      var focusable = getFocusable();
      if (focusable.length) focusable[0].focus();
    }

    function deactivate() {
      isActive = false;
      el.removeEventListener('keydown', handleKeydown);
    }

    if (isActive) activate();

    /* Expose methods on element */
    el._nbFocusTrap = {
      activate: activate,
      deactivate: deactivate
    };

  });
})(window.NB);


/* --- components/keyboard-shortcut.js --- */

/**
 * NB Keyboard Shortcut Component
 * Renders keyboard shortcut display and optionally registers handlers.
 *
 * Usage:
 *   <!-- Display only -->
 *   <span class="nb-shortcut" data-nb-shortcut="ctrl+k">
 *     <kbd>Ctrl</kbd><span class="nb-shortcut_sep">+</span><kbd>K</kbd>
 *   </span>
 *
 *   <!-- With handler -->
 *   <span class="nb-shortcut" data-nb-shortcut="ctrl+k" data-nb-shortcut-action="openSearch">
 *     <kbd>Ctrl</kbd><span class="nb-shortcut_sep">+</span><kbd>K</kbd>
 *   </span>
 *
 * Combo format: "ctrl+shift+k", "meta+enter", "alt+1"
 * Modifier keys: ctrl, shift, alt, meta (Cmd on Mac)
 *
 * Events:
 *   nb:shortcut-triggered — detail: { combo, action }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var registeredShortcuts = [];

  /* ------------------------------------------------------------------ */
  /*  Parse combo string                                                 */
  /* ------------------------------------------------------------------ */

  function parseCombo(str) {
    var parts = str.toLowerCase().split('+').map(function (s) { return s.trim(); });
    return {
      ctrl:  parts.indexOf('ctrl') !== -1,
      shift: parts.indexOf('shift') !== -1,
      alt:   parts.indexOf('alt') !== -1,
      meta:  parts.indexOf('meta') !== -1 || parts.indexOf('cmd') !== -1,
      key:   parts.filter(function (p) {
        return ['ctrl', 'shift', 'alt', 'meta', 'cmd'].indexOf(p) === -1;
      })[0] || ''
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Match event to combo                                               */
  /* ------------------------------------------------------------------ */

  function matchCombo(e, combo) {
    if (combo.ctrl  !== e.ctrlKey)  return false;
    if (combo.shift !== e.shiftKey) return false;
    if (combo.alt   !== e.altKey)   return false;
    if (combo.meta  !== e.metaKey)  return false;
    return e.key.toLowerCase() === combo.key;
  }

  /* ------------------------------------------------------------------ */
  /*  Global keydown listener                                            */
  /* ------------------------------------------------------------------ */

  NB.on(document, 'keydown', function (e) {
    for (var i = 0; i < registeredShortcuts.length; i++) {
      var s = registeredShortcuts[i];
      if (matchCombo(e, s.combo)) {
        e.preventDefault();
        NB.emit(s.el, 'nb:shortcut-triggered', {
          combo: s.comboStr,
          action: s.action
        });
      }
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  NB.register('shortcut', function (el) {

    var comboStr = el.getAttribute('data-nb-shortcut');
    var action = el.getAttribute('data-nb-shortcut-action');

    if (!comboStr) return;

    /* Register the keyboard handler if action is specified */
    if (action) {
      var combo = parseCombo(comboStr);
      registeredShortcuts.push({
        el: el,
        combo: combo,
        comboStr: comboStr,
        action: action
      });
    }

  });

  /* Expose API */
  NB.shortcut = {
    register: function (comboStr, callback) {
      var combo = parseCombo(comboStr);
      var entry = {
        el: document.body,
        combo: combo,
        comboStr: comboStr,
        action: 'custom'
      };
      registeredShortcuts.push(entry);

      NB.on(document.body, 'nb:shortcut-triggered', function (e) {
        if (e.detail && e.detail.combo === comboStr) {
          callback(e);
        }
      });

      return function unregister() {
        var idx = registeredShortcuts.indexOf(entry);
        if (idx !== -1) registeredShortcuts.splice(idx, 1);
      };
    }
  };

})(window.NB);
