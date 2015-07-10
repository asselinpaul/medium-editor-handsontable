# MediumEditor Handsontable

MediumEditor Handsontable is an extension to add [handsontable](http://handsontable.com/) spreadsheets to [MediumEditor](https://github.com/yabwe/medium-editor).

Demo: []()
--

![meditor-handsontable gif](https://cloud.githubusercontent.com/assets/868249/8600928/ae31ae04-2660-11e5-8e39-9fb0399d9f94.gif)

--

## Usage

You can install manually or either by using npm or bower:

```
npm install medium-editor-tables
```

or

```
bower install medium-editor-tables
```

On your app, link the style and the script and initialize MediumEditor with the table extension:

```html
<!doctype html>
<html>
<head>
...
  <link rel="stylesheet" href="<path_to_medium-editor>/dist/css/medium-editor.css" />
  <link rel="stylesheet" href="<path_to_medium-editor>/dist/css/themes/default.css" />
  <link rel="stylesheet" href="<path_to_medium-editor-handsontable>/dist/css/medium-editor-handsontable.css" />
...
</head>
<body>
  <div class="editable"></div>

  <script type="text/javascript" src="<path_to_medium-editor>/dist/js/medium-editor.js"></script>
  <script type="text/javascript" src="<path_to_medium-editor-handsontable>/dist/js/medium-editor-handsontable.js"></script>

  <script type="text/javascript" charset="utf-8">
    var editor = new MediumEditor('.editable', {
    buttonLabels: 'fontawesome',
    extensions: {
      spreadsheet: new MediumEditorSpreadsheet()
    },
    toolbar: {
      buttons: [
        'h2',
        'bold',
        'italic',
        'spreadsheet'
      ],
      static: true,
      sticky: true
    }
  });
  </script>
</body>
</html>
```

## Initialization options

* __rows__: maximum number of rows. Default: 10.
* __columns__: maximum number of columns. Default: 10.
* __readOnly__: makes the cell un-editable. Default: false.
* __contextMenu__: shows the context menu on right click (enables the addition/removal of rows and columns). Default: true.

### Examples

```javascript
...
    extensions: {
      'table': new MediumEditorTable({
        rows: 40,
        columns: 40
      })
    }
...
```

```javascript
...
	extensions: {
      spreadsheet: new MediumEditorSpreadsheet({
        readOnly: true,
        contextMenu: false
      })
    }
...
```

## Saving states
Saving states is easy and compatible with the medium-editor ```.serialize``` method. In order to make this work, the extension keeps the dimensions and data of the spreadsheets in the respective element's data attributes (updated as the spreadsheet is edited).

Serializing the editor therefore saves the state in plain html: ``` data-height="2" data-width="2" data-data="[["1","2"],["3","4"]]" ```

When the serialised data is loaded and medium-editor-handsontable is initialised, the spreadsheet elements are re-created by the ```parse()``` method. 

## Demo

Clone the repository and: 

```
bower install
open demo/index.html
```

## Development
Clone the repository and:

```
npm install
grunt
```

## License
The extension is based on the following project: [https://github.com/yabwe/medium-editor-tables](https://github.com/yabwe/medium-editor-tables)

MIT: [https://github.com/asselinpaul/medium-editor-handsontable/blob/master/LICENSE](https://github.com/asselinpaul/medium-editor-handsontable/blob/master/LICENSE)
