(function () {
    var state = {
        lastExternalId: null,
        currentPdfUrl: null,
        nativeWindowOpen: window.open.bind(window),
        modal: null,
        iframe: null
    };

    function normalizeText(value) {
        return (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function isDocumentOptionsDialog(dialog) {
        if (!dialog) return false;
        var labels = Array.prototype.slice.call(dialog.querySelectorAll('p')).map(function (p) {
            return normalizeText(p.textContent);
        });
        return labels.indexOf('a4') !== -1 && labels.indexOf('a5') !== -1;
    }

    function hideRow(element) {
        if (!element) return;
        var row = element.closest('.row');
        if (row) {
            row.style.display = 'none';
            row.setAttribute('data-factu-lite-hidden-send', '1');
            return;
        }

        var group = element.closest('.input-group');
        if (group) {
            group.style.display = 'none';
        }
    }

    function hideSendInputs(dialog) {
        if (!isDocumentOptionsDialog(dialog)) return;

        var buttons = dialog.querySelectorAll('button, .el-button, .btn');
        Array.prototype.forEach.call(buttons, function (button) {
            var text = normalizeText(button.textContent);
            if (text === 'enviar' || text.indexOf('enviar ') === 0) {
                hideRow(button);
            }
        });

        var phonePrefix = Array.prototype.find.call(
            dialog.querySelectorAll('span, .input-group-text, .input-group-addon'),
            function (node) {
                return normalizeText(node.textContent) === '+51';
            }
        );

        hideRow(phonePrefix);
    }

    function extractExternalId(payload) {
        if (!payload || typeof payload !== 'string') return;
        var match = payload.match(/"external_id"\s*:\s*"([a-zA-Z0-9-]+)"/);
        if (match && match[1] && match[1] !== 'null') {
            state.lastExternalId = match[1];
        }
    }

    function patchXhrCapture() {
        if (window.__factuLiteXhrPatched || !window.XMLHttpRequest) return;
        window.__factuLiteXhrPatched = true;

        var originalOpen = XMLHttpRequest.prototype.open;
        var originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
            this.__factuLiteUrl = url || '';
            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function () {
            this.addEventListener('load', function () {
                try {
                    var url = this.__factuLiteUrl || '';
                    if (url.indexOf('/documents') !== -1 || url.indexOf('/record/') !== -1) {
                        extractExternalId(this.responseText || '');
                    }
                } catch (e) {
                }
            });
            return originalSend.apply(this, arguments);
        };
    }

    function ensureModal() {
        if (state.modal) return;

        var modal = document.createElement('div');
        modal.id = 'factu-lite-pdf-modal';
        modal.style.cssText = [
            'display:none',
            'position:fixed',
            'z-index:4000',
            'inset:0',
            'background:rgba(0,0,0,0.55)',
            'align-items:center',
            'justify-content:center'
        ].join(';');

        modal.innerHTML = [
            '<div style="background:#fff;width:92vw;max-width:1250px;height:90vh;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;">',
            '  <div style="padding:10px 12px;border-bottom:1px solid #e5e5e5;display:flex;gap:8px;justify-content:flex-end;">',
            '    <button type="button" data-factu-print style="border:0;background:#1677ff;color:#fff;padding:8px 12px;border-radius:4px;cursor:pointer;">Imprimir</button>',
            '    <button type="button" data-factu-open-tab style="border:1px solid #d9d9d9;background:#fff;color:#333;padding:8px 12px;border-radius:4px;cursor:pointer;">Abrir pestana</button>',
            '    <button type="button" data-factu-close style="border:1px solid #d9d9d9;background:#fff;color:#333;padding:8px 12px;border-radius:4px;cursor:pointer;">Cerrar</button>',
            '  </div>',
            '  <iframe title="PDF" data-factu-iframe style="width:100%;height:100%;border:0;"></iframe>',
            '</div>'
        ].join('');

        document.body.appendChild(modal);
        state.modal = modal;
        state.iframe = modal.querySelector('[data-factu-iframe]');

        modal.querySelector('[data-factu-close]').addEventListener('click', closePdfModal);
        modal.querySelector('[data-factu-open-tab]').addEventListener('click', function () {
            if (state.currentPdfUrl) {
                state.nativeWindowOpen(state.currentPdfUrl, '_blank');
            }
        });
        modal.querySelector('[data-factu-print]').addEventListener('click', function () {
            try {
                if (state.iframe && state.iframe.contentWindow) {
                    state.iframe.contentWindow.focus();
                    state.iframe.contentWindow.print();
                }
            } catch (e) {
                if (state.currentPdfUrl) {
                    state.nativeWindowOpen(state.currentPdfUrl, '_blank');
                }
            }
        });

        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                closePdfModal();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && state.modal && state.modal.style.display !== 'none') {
                closePdfModal();
            }
        });
    }

    function closePdfModal() {
        if (!state.modal) return;
        state.modal.style.display = 'none';
    }

    function openPdfModal(url) {
        if (!url) return;
        ensureModal();
        state.currentPdfUrl = url;
        state.iframe.src = url;
        state.modal.style.display = 'flex';
    }

    function resolvePrintUrl(url) {
        if (!url || typeof url !== 'string') return url;
        if (url.indexOf('/print/document/null/') !== -1 && state.lastExternalId) {
            return url.replace('/print/document/null/', '/print/document/' + state.lastExternalId + '/');
        }
        return url;
    }

    function patchWindowOpen() {
        if (window.__factuLiteWindowOpenPatched) return;
        window.__factuLiteWindowOpenPatched = true;

        window.open = function (url, target, features) {
            try {
                if (typeof url === 'string' && url.indexOf('/print/document/') !== -1) {
                    var resolved = resolvePrintUrl(url);
                    if (resolved.indexOf('/print/document/null/') !== -1) {
                        return null;
                    }
                    openPdfModal(resolved);
                    return null;
                }
            } catch (e) {
            }
            return state.nativeWindowOpen(url, target, features);
        };
    }

    function run() {
        var dialogs = document.querySelectorAll('.el-dialog');
        Array.prototype.forEach.call(dialogs, hideSendInputs);
    }

    patchXhrCapture();
    patchWindowOpen();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }

    setInterval(run, 700);

    var observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true });
})();
