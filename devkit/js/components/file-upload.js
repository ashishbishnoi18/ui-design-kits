/**
 * DK File Upload Component
 * Drag-and-drop file upload with file list management.
 *
 * Usage:
 *   <div class="dk-file-upload" data-dk-file-upload>
 *     <div class="dk-file-upload_zone">
 *       <span class="dk-file-upload_label"><strong>Click to upload</strong> or drag and drop</span>
 *       <span class="dk-file-upload_hint">PNG, JPG up to 10MB</span>
 *       <input class="dk-file-upload_input" type="file" multiple>
 *     </div>
 *     <div class="dk-file-upload_list"></div>
 *   </div>
 *
 * Data attributes:
 *   data-dk-file-upload       — activates component
 *   data-dk-accept="image/*"  — accepted file types (maps to input accept)
 *   data-dk-max-size="10485760" — max file size in bytes
 *
 * Events:
 *   dk:file-add    — detail: { file: File }
 *   dk:file-remove — detail: { fileName: string }
 *   dk:files-change — detail: { files: File[] }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('file-upload', function (el) {
    var zone   = el.querySelector('.dk-file-upload_zone');
    var input  = el.querySelector('.dk-file-upload_input');
    var list   = el.querySelector('.dk-file-upload_list');

    if (!zone || !input) return;

    var files   = [];
    var accept  = el.getAttribute('data-dk-accept') || '';
    var maxSize = parseInt(el.getAttribute('data-dk-max-size'), 10) || 0;

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
        row.className = 'dk-file-upload_file';

        var name = document.createElement('span');
        name.className = 'dk-file-upload_file-name';
        name.textContent = file.name;

        var size = document.createElement('span');
        size.className = 'dk-file-upload_file-size';
        size.textContent = formatSize(file.size);

        var remove = document.createElement('button');
        remove.className = 'dk-file-upload_file-remove';
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
        DK.emit(el, 'dk:file-add', { file: file });
      }

      renderList();
      DK.emit(el, 'dk:files-change', { files: files.slice() });
    }

    function removeFile(idx) {
      var removed = files.splice(idx, 1)[0];
      if (removed) {
        DK.emit(el, 'dk:file-remove', { fileName: removed.name });
      }
      renderList();
      DK.emit(el, 'dk:files-change', { files: files.slice() });
    }

    /* ---------------------------------------------------------------- */
    /*  Click to open file dialog                                        */
    /* ---------------------------------------------------------------- */

    DK.on(zone, 'click', function (e) {
      if (e.target.closest('.dk-file-upload_input')) return;
      input.click();
    });

    DK.on(input, 'change', function () {
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

    DK.on(zone, 'dragenter', function (e) {
      e.preventDefault();
      dragCounter++;
      el.classList.add('is-dragover');
    });

    DK.on(zone, 'dragleave', function (e) {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        el.classList.remove('is-dragover');
      }
    });

    DK.on(zone, 'dragover', function (e) {
      e.preventDefault();
    });

    DK.on(zone, 'drop', function (e) {
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
      DK.on(list, 'click', function (e) {
        var btn = e.target.closest('.dk-file-upload_file-remove');
        if (!btn) return;
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        if (!isNaN(idx)) removeFile(idx);
      });
    }
  });

})(window.DK);
