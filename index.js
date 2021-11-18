/// <reference path="package/monaco.d.ts" />

(function () {
    require.config({ paths: { 'vs': 'package/min/vs' }});
    require(['vs/editor/editor.main'], function () {
        var editor;
        var origin;
        function createEditor(value, language) {
            var editor = monaco.editor.create(
                document.getElementById('editor'),
                {
                    value: value,
                    language: language,
                    theme: 'vs',
                    tabSize: 2,
                    renderWhitespace: "boundary",
                    minimap: {
                        enabled: true
                    },
                    contextmenu: true
                }
            );
            return editor;
        }
        // send code to parent;
        function sendCode() {
            if (!origin) {
                return;
            }
            var value = editor.getValue();
            window.top.postMessage(value, origin);
        }
        // receive message;
        function receiveMessage(event) {
            origin = event.origin;
            var message = event.data;
            if (!!message.vscodeSetImmediateId) {
                return;
            }
            if (message === 'getValue') {
                sendCode();
                return;
            }
            if (!editor) {
                editor = createEditor(message.value, message.language);
            }
            else {
                var model = monaco.editor.createModel(
                    message.value,
                    message.language
                );
                editor.setModel(model);
            }
        }
        window.addEventListener('message', receiveMessage, false);
        var loading = document.getElementById('loading-indicator');
        loading.parentElement.removeChild(loading);
        window.addEventListener('resize', function() {
            if (!!editor) {
                editor.layout();
            }
        });
    });
})();
