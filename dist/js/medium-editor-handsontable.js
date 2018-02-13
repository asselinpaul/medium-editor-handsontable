var spreadsheet_count = 0; //keeps track of the number of spreadsheets
var readOnly;
var contextMenu;

(function(root, factory) {
    'use strict';
    if (typeof module === 'object') {
        module.exports = factory;
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.MediumEditorSpreadsheet = factory;
    }
}(this, function() {

    'use strict';

    function extend(dest, source) {
        var prop;
        dest = dest || {};
        for (prop in source) {
            if (source.hasOwnProperty(prop) && !dest.hasOwnProperty(prop)) {
                dest[prop] = source[prop];
            }
        }
        return dest;
    }

    function getSelectionText(doc) {
        if (doc.getSelection) {
            return doc.getSelection().toString();
        }
        if (doc.selection && doc.selection.type !== 'Control') {
            return doc.selection.createRange().text;
        }
        return '';
    }

    function getSelectionStart(doc) {
        var node = doc.getSelection().anchorNode;
        var startNode = (node && node.nodeType === 3 ? node.parentNode : node);
        return startNode;
    }

    function placeCaretAtNode(doc, node, before) {
        if (doc.getSelection !== undefined && node) {
            var range = doc.createRange();
            var selection = doc.getSelection();

            if (before) {
                range.setStartBefore(node);
            } else {
                range.setStartAfter(node);
            }

            range.collapse(true);

            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    function isInsideElementOfTag(node, tag) {
        if (!node) {
            return false;
        }

        var parentNode = node.parentNode;
        var tagName = parentNode.tagName.toLowerCase();

        while (tagName !== 'body') {
            if (tagName === tag) {
                return true;
            }
            parentNode = parentNode.parentNode;

            if (parentNode && parentNode.tagName) {
                tagName = parentNode.tagName.toLowerCase();
            } else {
                return false;
            }
        }

        return false;
    }

    function parse() {
        var spreadsheets = document.getElementsByClassName('medium-text-handsontable');
        for (var k = 0; k < spreadsheets.length; k++) {
            if (spreadsheets[k].id !== '') {
                var id = spreadsheets[k].id;
                var className = spreadsheets[k].className;
                var dataHeight = spreadsheets[k].dataset.height;
                var dataWidth = spreadsheets[k].dataset.width;
                var dataData = JSON.parse(spreadsheets[k].dataset.data);

                var newDiv = document.createElement('div');
                newDiv.id = id;
                newDiv.contentEditable = false;
                spreadsheets[k].parentNode.insertBefore(newDiv, spreadsheets[k].nextSibling);
                spreadsheets[k].parentNode.removeChild(spreadsheets[k]);

                //initialise the two dimensional array with the data
                var data = new Array(dataHeight);
                for (var i = 0; i < dataHeight; i++) {
                    data[i] = new Array(dataWidth);
                    for (var j = 0; j < dataWidth; j++) {
                        data[i][j] = dataData[i][j];
                    }
                }
                draw(newDiv, data, contextMenu, readOnly);
            }
        }
    }

    function getParentOf(el, tagTarget) {
        var tagName = el && el.tagName ? el.tagName.toLowerCase() : false;
        if (!tagName) {
            return false;
        }
        while (tagName && tagName !== 'body') {
            if (tagName === tagTarget) {
                return el;
            }
            el = el.parentNode;
            tagName = el && el.tagName ? el.tagName.toLowerCase() : false;
        }
    }

    function Grid(el, callback, rows, columns) {
        return this.init(el, callback, rows, columns);
    }

    Grid.prototype = {
        init: function(el, callback, rows, columns) {
            this._root = el;
            this._callback = callback;
            this.rows = rows;
            this.columns = columns;
            return this._render();
        },

        setCurrentCell: function(cell) {
            this._currentCell = cell;
        },

        markCells: function() {
            [].forEach.call(this._cellsElements, function(el) {
                var cell = {
                    column: parseInt(el.dataset.column, 10),
                    row: parseInt(el.dataset.row, 10)
                };
                var active = this._currentCell &&
                    cell.row <= this._currentCell.row &&
                    cell.column <= this._currentCell.column;
                if (active === true) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            }.bind(this));
        },

        _generateCells: function() {
            this._cells = [];

            for (var i = 0; i < this.rows * this.columns; i++) {
                var column = i % this.columns;
                var row = Math.floor(i / this.rows);

                this._cells.push({
                    column: column,
                    row: row,
                    active: false
                });
            }
        },

        _html: function() {
            var html = '<div class="medium-editor-table-builder-grid clearfix">';
            html += this._cellsHTML();
            html += '</div>';
            return html;
        },

        _cellsHTML: function() {
            var html = '';
            this._generateCells();
            this._cells.map(function(cell) {
                html += '<a href="#" class="medium-editor-table-builder-cell' +
                    (cell.active === true ? ' active' : '') +
                    '" ' + 'data-row="' + cell.row +
                    '" data-column="' + cell.column + '">';
                html += '</a>';
            });
            return html;
        },

        _render: function() {
            this._root.innerHTML = this._html();
            this._cellsElements = this._root.querySelectorAll('a');
            this._bindEvents();
        },

        _bindEvents: function() {
            [].forEach.call(this._cellsElements, function(el) {
                this._onMouseEnter(el);
                this._onClick(el);
            }.bind(this));
        },

        _onMouseEnter: function(el) {
            var self = this;
            var timer;

            el.addEventListener('mouseenter', function() {
                clearTimeout(timer);

                var dataset = this.dataset;

                timer = setTimeout(function() {
                    self._currentCell = {
                        column: parseInt(dataset.column, 10),
                        row: parseInt(dataset.row, 10)
                    };
                    self.markCells();
                }, 50);
            });
        },

        _onClick: function(el) {
            var self = this;
            el.addEventListener('click', function(e) {
                e.preventDefault();
                self._callback(this.dataset.row, this.dataset.column);
            });
        }
    };

    function Builder(options) {
        return this.init(options);
    }

    Builder.prototype = {
        init: function(options) {
            this.options = options;
            this._doc = options.ownerDocument || document;
            this._root = this._doc.createElement('div');
            this._root.className = 'medium-editor-table-builder';
            this.grid = new Grid(
                this._root,
                this.options.onClick,
                this.options.rows,
                this.options.columns
            );
        },

        getElement: function() {
            return this._root;
        },

        hide: function() {
            this._root.style.display = '';
            this.grid.setCurrentCell({
                column: -1,
                row: -1
            });
            this.grid.markCells();
        },

        show: function(left) {
            this._root.style.display = 'block';
            this._root.style.left = left + 'px';
        }
    };

    function Spreadsheet(editor) {
        return this.init(editor);
    }

    var BACKSPACE_KEY_CODE = 8;

    Spreadsheet.prototype = {
        init: function(editor) {
            this._editor = editor;
            this._doc = this._editor.options.ownerDocument;
        },

        insert: function(rows, cols, id, readOnlyBool, contextMenuBool) {
            spreadsheet_count++;
            var html = this._html(rows, cols, id);
            this._editor.pasteHTML(
                html, {
                    cleanAttrs: [],
                    cleanTags: []
                }
            );
            setTimeout(function() {
                var container = document.getElementById('spreadsheet' + id);

                //initialise a blank two dimensional array
                var data = new Array(parseInt(rows) + 1);
                for (var i = 0; i < data.length; i++) {
                    data[i] = Array(parseInt(cols) + 1).fill("");
                }

                draw(container, data, contextMenuBool, readOnlyBool);
            });
        },

        _html: function(rows, cols, id) {
            var html = '';
            var text = getSelectionText(this._doc);

            html += text;
            html += ' <div id="spreadsheet' + id + '"> </div> ';
            return html;
        }
    };

    function updateAttribute(html, container) {
        var data = html.getData();
        container.dataset.height = data.length;
        container.dataset.width = data[0].length;
        container.dataset.data = JSON.stringify(data);
    }

    var checkboxRenderer;

    checkboxRenderer = function(instance, td, row, col, prop, value, cellProperties) {
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        if (value = '') {
            td.html = '<input type="checkbox">'
        }
        td.style.backgroundColor = 'yellow';

    };

    function draw(container, data, contextMenuBool, readOnlyBool) {
        var contextMenuOptions;
        if (contextMenuBool) {
            contextMenuOptions = ['row_above', 'row_below', '---------', 'col_left',
                'col_right', '---------', 'remove_row', 'remove_col',
                '---------', 'undo', 'redo', 'make_read_only',
                '---------', 'alignment', {
                    key: 'add_checkmark',
                    name: 'Insert checkmark',
                    callback: function(key, selection) {
                        for (var i = selection.start.col; i <= selection.end.col; i++) {
                            for (var j = selection.start.row; j <= selection.end.row; j++) {
                                this.setDataAtCell(j, i, '<input type="checkbox">');

                            }
                        }
                    }
                }

            ];
        } else {
            contextMenuOptions = false;
        }
        var html = new Handsontable(container, {
            data: data,
            className: "medium-text-handsontable",
            rowHeaders: true,
            colHeaders: true,
            contextMenu: contextMenuOptions,
            autoWrapCol: true,
            autoWrapRow: true,
            renderer: 'html',
            placeholder: ' ',
            autoColumnSize: true,
            readOnly: readOnlyBool,
            afterChange: function(change, source) {
                if (source === 'loadData') {
                    return; //don't save this change
                }
                updateAttribute(html, container);
            }
        });

        container.contentEditable = false; //fixes formatting bugs, makes it easier to delete with backspace
        updateAttribute(html, container); //initialises dataset attributes

        //if sheet is lastNode, add <br> so that the caret can be positioned below the sheet (otherwise can't delete)
        if (container == container.parentNode.lastElementChild) {
            container.parentNode.insertBefore(document.createElement("br"), container.nextSibling);
        }
    }

    function MediumEditorSpreadsheet(options) {
        this.options = extend(options, {
            columns: 10,
            rows: 10,
            readOnly: false,
            contextMenu: true
        });
        this.parent = true;
        this.hasForm = true;
        this.isFormVisible = false;
        this.createButton();
        parse();
    }

    MediumEditorSpreadsheet.prototype = {
        createButton: function() {
            this._createButtonElement();
            this._bindButtonClick();
        },

        isDisplayed: function() {
            return this.isFormVisible;
        },

        getForm: function() {
            if (!this.builder) {
                this.builder = new Builder({
                    onClick: function(rows, columns) {
                        readOnly = this.options.readOnly;
                        contextMenu = this.options.contextMenu;
                        this.table.insert(rows, columns, spreadsheet_count, readOnly, contextMenu);
                        this.hideForm();
                    }.bind(this),
                    ownerDocument: this.document,
                    rows: this.options.rows,
                    columns: this.options.columns
                });
                this.table = new Spreadsheet(this.base);
            }

            return this.builder.getElement();
        },

        getButton: function() {
            if (this.base.options.buttonLabels === 'fontawesome') {
                this.button.innerHTML = '<i class="fa fa-table"></i>';
            }
            return this.button;
        },

        onHide: function() {
            this.hideForm();
        },

        hideForm: function() {
            this.isFormVisible = false;
            this.builder.hide();
            this.button.classList.remove('medium-editor-button-active');
        },

        show: function() {
            this.isFormVisible = true;
            this.builder.show(this.button.offsetLeft);
            this.button.classList.add('medium-editor-button-active');
            var elements = document.getElementsByClassName('medium-editor-table-builder-grid');
            for (var i = 0; i < elements.length; i++) {
                // TODO: what is 16 and what is 2?
                elements[i].style.height = (16 * this.options.rows + 2) + 'px';
                elements[i].style.width = (16 * this.options.columns + 2) + 'px';
            }
        },

        _createButtonElement: function() {
            this.button = document.createElement('button');
            this.button.className = 'medium-editor-action';
            this.button.innerHTML = 'tbl';
        },

        _bindButtonClick: function() {
            this.button.addEventListener('click', function(e) {
                e.preventDefault();
                this[this.isFormVisible === true ? 'hideForm' : 'show']();
            }.bind(this));
        }
    };

    return MediumEditorSpreadsheet;
}()));
