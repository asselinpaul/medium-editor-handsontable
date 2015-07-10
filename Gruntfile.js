global.jsSourceFiles = [
  'dist/js/medium-editor-handsontable.js'
];

module.exports = function (grunt) {
  require('load-grunt-config')(grunt, {
    loadGruntTasks: {
      pattern: [
        'grunt-*'
      ]
    }
  });
  require('time-grunt')(grunt);
};
