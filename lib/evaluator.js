'use babel';

var CONST_LINE = 'line'
var CONST_MULTI_LINE = 'multi_line'

export default class Evaluator {

  constructor(jensaarai) {
    this.package = jensaarai
  }

  getGLSL(editor) {
    if (!editor) return;
    var cursor = editor.getLastCursor();
    var startRow = endRow = cursor.getBufferRow();
    var lineCount = editor.getLineCount();
    while (startRow >= 0) {
      if (/[#\/\- ]*python/.test(editor.lineTextForBufferRow(startRow)))
        return
      if (/[#\/\- ]*tidal/.test(editor.lineTextForBufferRow(startRow)))
        return
      if (/[#\/\- ]*glsl/.test(editor.lineTextForBufferRow(startRow)))
        break
      startRow--;
    }
    while (endRow < lineCount) {
      if (/[#\/\- ]*python/.test(editor.lineTextForBufferRow(endRow)))
        break
      if (/[#\/\- ]*tidal/.test(editor.lineTextForBufferRow(endRow)))
        break
      endRow++
    }
    var range = {
      start: {
        row: startRow,
        column: 0
      },
      end: {
        row: endRow - 1,
        column: 0
      },
    }
    var expression = editor.getTextInBufferRange(range)
    this.evalWithRepl(expression, range, 'glsl', editor, false)
  }

  whichLanguage(editor) {
    var cursor = editor.getLastCursor()
    var startRow = endRow = cursor.getBufferRow()
    var lineCount = editor.getLineCount()
    while (startRow >= 0) {
      if (/[#\/\- ]*python/.test(editor.lineTextForBufferRow(startRow))) {
        if (this.package.tdRepl !== null) {return 'python'}
      }
      else if (/[#\/\- ]*tidal/.test(editor.lineTextForBufferRow(startRow))) {
        if (this.package.tidalRepl !== null) {return 'tidal'}
      }
      else if (/[#\/\- ]*glsl/.test(editor.lineTextForBufferRow(startRow))) {
        if (this.package.tdRepl !== null) {return 'glsl'}
      }
      startRow--
    }
    return null
  }

  remoteEval(range, language, editor) {
    var expression = editor.getTextInBufferRange(range)
    this.evalWithRepl(expression, range, language, editor, true)
  }

  localEval(evalType) {
    var editor = atom.workspace.getActiveTextEditor()
    var language = this.whichLanguage(editor)
    if (language === null) {
        atom.notifications.addError('language error')
        return
    }
    var expressionAndRange = this.currentExpression(evalType, editor)
    this.evalWithRepl(expressionAndRange[0], expressionAndRange[1], language, editor, false);
  }

  ciboEval(evalType, language, editor){
    var expressionAndRange = this.currentExpression(evalType, editor)
    this.evalWithRepl(expressionAndRange[0], expressionAndRange[1], language, editor, false);
  }

  evalWithRepl(expression, range, language, editor, remote) {
    var self = this

    if (!remote && this.package.firebaseConnection !== null && language !== 'glsl') { //check editor?
      self.package.firebaseConnection.addEval(range, language)
    }
    if (this.package.recording !== null) { //check editor?
      self.package.recording.addEval(language, expression, range)
    }
    if (this.package.cibo !== null) {
      self.package.cibo.send(language, expression)
    }

    if (language === 'python' || language === 'glsl') {
      if (this.package.tdRepl !== null)
        self.package.tdRepl.send(language, expression)
    }
    else if (language === 'tidal') {
      if (this.package.tidalRepl !== null)
        self.package.tidalRepl.tidalSendExpression(expression)
    }


    function doIt() {
      var unflash
      if (range) {
        unflash = self.evalFlash(range, editor);
      }

      function onSuccess() {
        if (unflash) {
          unflash('eval-success');
        }
      }

      onSuccess();
    }

    if (language !== 'glsl')
      doIt()
  }

  currentExpression(evalType, editor) {
    if (!editor) return;

    var selection = editor.getLastSelection();
    var expression = selection.getText();

    if (expression) {
      var range = selection.getBufferRange();
      return [expression, range];
    } else {
      if (evalType === CONST_LINE) {
        return this.getLineExpression(editor);
      }
      return this.getMultiLineExpression(editor);
    }
  }

  getLineExpression(editor) {
    var cursor = editor.getCursors()[0];
    var range = cursor.getCurrentLineBufferRange();
    var expression = range && editor.getTextInBufferRange(range);
    return [expression, range];
  }

  getMultiLineExpression(editor) {
    var range = this.getCurrentParagraphIncludingComments(editor);
    var expression = editor.getTextInBufferRange(range);
    return [expression, range];
  }

  getCurrentParagraphIncludingComments(editor) {
    var cursor = editor.getLastCursor();
    var startRow = endRow = cursor.getBufferRow();
    var lineCount = editor.getLineCount();

    // lines must include non-whitespace characters
    // and not be outside editor bounds
    while (/\S/.test(editor.lineTextForBufferRow(startRow)) && startRow >= 0) {
      startRow--;
    }
    while (/\S/.test(editor.lineTextForBufferRow(endRow)) && endRow < lineCount) {
      endRow++;
    }
    return {
      start: {
        row: startRow + 1,
        column: 0
      },
      end: {
        row: endRow,
        column: 0
      },
    };
  }

  evalFlash(range, editor) {
    var marker = editor.markBufferRange(range, {
      invalidate: 'touch'
    });

    var decoration = editor.decorateMarker(
      marker, {
        type: 'line',
        class: 'eval-flash'
      });

    // return fn to flash error / success and destroy the flash
    return function(cssClass) {
      decoration.setProperties({
        type: 'line',
        class: cssClass
      });
      var destroy = function() {
        marker.destroy();
      };
      setTimeout(destroy, 120);
    };
  }

}
