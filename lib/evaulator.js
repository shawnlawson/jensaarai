'use babel';


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
      if (/[#\/\- ]*python/.test(editor.lineTextForBufferRow(startRow)))
        break
      if (/[#\/\- ]*tidal/.test(editor.lineTextForBufferRow(startRow)))
        break
      endRow++
    }
    var range = {
      start: {
        row: startRow + 1,
        column: 0
      },
      end: {
        row: endRow - 1,
        column: 0
      },
    }
    return editor.getTextInBufferRange(range)
  }

  eval(evalType, copy) {
    var editor = atom.workspace.getActiveTextEditor()
    var cursor = editor.getLastCursor()
    var startRow = endRow = cursor.getBufferRow()
    var lineCount = editor.getLineCount()
    while (startRow >= 0) {
      if (/[#\/\- ]*python/.test(editor.lineTextForBufferRow(startRow))) {
        if (this.package.tdRepl !== null) {
          this.localEval(evalType, copy, 'python', editor)
        }
        return
      }
      else if (/[#\/\- ]*tidal/.test(editor.lineTextForBufferRow(startRow))) {
        if (this.package.tidalRepl !== null) {
          this.localEval(evalType, copy, 'tidal', editor)
        }
        return
      }
      else if (/[#\/\- ]*glsl/.test(editor.lineTextForBufferRow(startRow))) {
        if (this.package.tdRepl !== null) {
          this.localEval(evalType, copy, 'glsl', editor)
        }
        return
      }
      startRow--
    }
  }

  remoteEval(range, lang, editor) {
    var expression = editor.getTextInBufferRange(range)
    if (this.package.recording !== null) {
      this.package.recording.addEval(null, expression, range, lang)
    }
    if (lang === 'python' || lang === 'glsl') {
      this.evalWithRepl(expression, range, false, lang, editor)
    }
    else if (lang === 'tidal') {
      this.evalWithRepl(expression, range, false, lang, editor)
    }
  }

  localEval(evalType, copy, language, editor) {
    var expressionAndRange = this.currentExpression(evalType, editor);
    var expression = expressionAndRange[0];
    var range = expressionAndRange[1];
    if (this.package.connection !== null) { //check editor?
      this.package.connection.addEval(range, language)
    }
    if (this.package.recording !== null) { //check editor?
      this.package.recording.addEval(evalType, expression, range, language)
    }
    this.evalWithRepl(expression, range, copy, language, editor);
  }

  evalWithRepl(expression, range, copy, language, editor) {
    var self = this
    if (!expression ) return
    //|| language !== 'python' || language !== 'glsl') return;

    function doIt() {
      var unflash
      if (range) {
        unflash = self.evalFlash(range);
        var copyRange;
        if (copy) {
          copyRange = self.copyRange(range, editor);
        }
      }

      function onSuccess() {
        if (unflash) {
          unflash('eval-success');
        }
      }

      if (lang === 'python' || lang === 'glsl') {
        self.package.tdRepl.send('/'+language, expression)
      }
      else if (lang === 'tidal') {
        self.package.tidalRepl.tidalSendExpression( expression)
      }
      onSuccess();
    }

    doIt();
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

  copyRange(range, editor) {
      var endRow = range.end.row;
      endRow++
      var text = editor.getTextInBufferRange(range);
      text = '\n' + text + '\n';

      if (endRow > editor.getLastBufferRow()) {
          text = '\n' + text
      }

      editor.getBuffer().insert([endRow, 0], text);
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

  evalFlash(range) {
    var editor = this.getEditor();
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
