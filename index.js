/// <reference path="package/monaco.d.ts" />

(() => {
    require.config({ paths: { 'vs': 'package/min/vs' }});
    require.config({ 'vs/nls': { availableLanguages: { '*': 'zh-cn' }}});

    require(['vs/editor/editor.main'], function () {
        /** @type {monaco.editor.IStandaloneCodeEditor} */
        const editor = createEditor();
        let origin;
        let smartSqlSupportAdded = false;
        // create editor
        function createEditor() {
            const editor = monaco.editor.create(
                document.getElementById('editor'),
                {
                    theme: 'vs',
                    tabSize: 2,
                    renderWhitespace: "all",
                    minimap: { enabled: true },
                    contextmenu: true
                }
            );
            editor.onDidChangeModel(e => {
                setTimeout(() => {
                    const act = editor.getAction('editor.action.formatDocument');
                    if (!!act) {
                        void act.run();
                    }
                }, 1000);
            });
            return editor;
        }
        // send code to parent;
        function sendCode() {
            if (!origin) {
                return;
            }
            const value = editor.getValue();
            window.top.postMessage(value, origin);
        }
        // receive message;
        function receiveMessage(event) {
            origin = event.origin;
            const data = event.data;
            if (!!data.vscodeSetImmediateId) {
                return;
            }
            if (data === 'addSmartSqlSupport') {
                if (!smartSqlSupportAdded) {
                    addSmartSqlSupport();
                }
                return;
            }
            if (data === 'getValue') {
                sendCode();
                return;
            }
            const { value, language } = data;
            const model = monaco.editor.createModel(value, language);
            editor.setModel(model);
        }
        // add smart-sql completion provider
        function addSmartSqlSupport() {
            smartSqlSupportAdded = true;
            const snippets = {
                'IsEmpty': '<IsEmpty Property="${1:propName}" Prepend="${2:and}" Required="${3:false}">${0}</IsEmpty>',
                'IsEqual': '<IsEqual Property="${1:propName}" CompareValue="${2:value}" Prepend="${3:and}" Required="${4:false}">${0}</IsEqual>',
                'IsGreaterEqual': '<IsGreaterEqual Property="${1:propName}" CompareValue="${2:value}" Prepend="${3:and}" Required="${4:false}">${0}</IsGreaterEqual>',
                'IsGreaterThan': '<IsGreaterThan Property="${1:propName}" CompareValue="${2:value}" Prepend="${3:and}" Required="${4:false}">${0}</IsGreaterThan>',
                'IsLessEqual': '<IsLessEqual Property="${1:propName}" CompareValue="${2:value}" Prepend="${3:and}" Required="${4:false}">${0}</IsLessEqual>',
                'IsLessThan': '<IsLessThan Property="${1:propName}" CompareValue="${2:value}" Prepend="${3:and}" Required="${4:false}">${0}</IsLessThan>',
                'IsNotEmpty': '<IsNotEmpty Property="${1:propName}" Prepend="${2:and}" Required="${3:false}">${0}</IsNotEmpty>',
                'IsNotEqual': '<IsNotEqual Property="${1:propName}" CompareValue="${2:value}" Prepend="${3:and}" Required="${4:false}">${0}</IsNotEqual>',
                'IsNotNull': '<IsNotNull Property="${1:propName}" Prepend="${2:and}" Required="${3:false}">${0}</IsNotNull>',
                'IsNull': '<IsNull Property="${1:propName}" Prepend="${2:and}" Required="${3:false}">${0}</IsNull>',
                // 'Include': '<Include RefId="${1:refId}" Prepend="${2:and}" Required="${3:false}">${0}</Include>',
                'Switch': [
                    '<Switch Property="${1:propName}" Prepend="${2:and}" Required="${3:false}">',
                    '  <Case CompareValue="${4:value}">${5}</Case>',
                    '  <Default>${0}</Default>',
                    '<Switch>'
                ].join('\n'),
                'Case': '<Case CompareValue="${1:value}">${0}</Case>',
                'Default': '<Default>${0}</Default>',
                'IsTrue': '<IsTrue Property="${1:propName}" Prepend="${2:and}" Required="${3:false}">${0}</IsTrue>',
                'IsFalse': '<IsFalse Property="${1:propName}" Prepend="${2:and}" Required="${3:false}">${0}</IsFalse>',
                'Range': '<Range Property="${1:propName}" Min="${2:minValue}" Max="${3:maxValue}" Prepend="${4:and}" Required="${5:false}">${0}</Range>',
                'IsProperty': '<IsProperty Property="${1:propName}" Prepend="${2:and}" >${0}</IsProperty>',
                'IsNotProperty': '<IsNotProperty Property="${1:propName}" Prepend="${2:and}" >${0}</IsNotProperty>',
                'Script': '<Script Test="${1:condition}" Prepend="${2:and}">${0}</Script>',
                'Placeholder': '<Placeholder Property="${1:propName}" Prepend="${2:and}" Required="${3:false}">${0}</Placeholder>',
                'OrderBy': '<OrderBy Property="${1:propName}" Required="${2:false}"></OrderBy>',
                'Dynamic': '<Dynamic Prepend="${1:where}" Min="${2:0}">${0}</Dynamic>',
                'Where': '<Where Min="${1:0}">${0}</Where>',
                'Set': [
                    '<Set Min="${1:0}">',
                    '  <IsProperty Property="${2:propName}" Prepend="${3:,}" Required="${4:true}">${0}</IsProperty>',
                    '</Set>'
                ].join('\n'),
                'For': '<For Open="${1:(}" Close="${2:)}" Key="${3:key}" Property="${4:propName}" Separator="${5:,}">${0}</For>',
                'Env': '<Env DbProvider="${1:providerName}" Prepend="${2:and}">${0}</Env>',
                'CDATA': '<![CDATA[${0}]]>',
                'Comment': '<!-- ${0} -->'
            };
            monaco.languages.html.registerHTMLLanguageService('xml', { }, { documentFormattingEdits: true });
            monaco.languages.registerCompletionItemProvider(
                'xml',
                {
                    provideCompletionItems: (model, position) => {
                        const suggestions = [];
                        for (const key in snippets) {
                            if (Object.hasOwnProperty.call(snippets, key)) {
                                suggestions.push({
                                    label: key,
                                    insertText: snippets[key],
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                                })
                            }
                        }
                        return { suggestions };
                    }
                }
            );
        }
        window.addEventListener('message', receiveMessage, false);
        const loading = document.getElementById('loading-indicator');
        loading.parentElement.removeChild(loading);
        window.addEventListener('resize', function() {
            if (!!editor) {
                editor.layout();
            }
        });
    });
})();
