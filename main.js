/*
 * Copyright (c) 2013 Ingo Richter. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, window */

/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    "use strict";

    var AppInit         = brackets.getModule("utils/AppInit"),
        Menus           = brackets.getModule("command/Menus"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        DocumentManager = brackets.getModule("document/DocumentManager");
    
    // Function to run when the menu item is clicked
    function helloWorld() {
        window.alert("Hello, world!");
    }
    
    function isWordChar(character) {
        return (/\w/).test(character) || character.toUpperCase() !== character.toLowerCase();
    }
        
    function _getWordPositions(str, position) {
        var startIndexWordB = position,
            endIndexWordB = position,
            tempPosition = position,
            startIndexWordA,
            endIndexWordA;
        
        // cursor placed directly at the end of the word
        if (!isWordChar(str.charAt(position))) {
            if (isWordChar(str.charAt(position - 1))) {
                tempPosition = tempPosition - 1;
            }
        }

        while (isWordChar(str.charAt(tempPosition))) {
            startIndexWordB = tempPosition;
            tempPosition = tempPosition - 1;
        }
        
        tempPosition = endIndexWordB;

        while (isWordChar(str.charAt(tempPosition))) {
            tempPosition = tempPosition + 1;
            endIndexWordB = tempPosition;
        }
        
        endIndexWordA = startIndexWordB - 1;

        // skip all non chars
        while (!isWordChar(str.charAt(endIndexWordA))) {
            endIndexWordA = endIndexWordA - 1;
        }
        
        tempPosition = endIndexWordA;

        while (isWordChar(str.charAt(tempPosition))) {
            startIndexWordA = tempPosition;
            tempPosition = tempPosition - 1;
        }
        
        var wordB = str.substr(startIndexWordB, (endIndexWordB - startIndexWordB));
        var wordA = str.substr(startIndexWordA, (endIndexWordA - startIndexWordA) + 1);

        return {
            wordA: {
                text: wordA,
                startIndex: startIndexWordA,
                endIndex: endIndexWordA
            },
            wordB: {
                text: wordB,
                startIndex: startIndexWordB,
                endIndex: endIndexWordB
            }
        };
    }

    /* Change the position of two words in a string
     * Example: WordA WordB WordC WordD
     *                 ^
     *                 |
     *              Cursor
     * Calling this function will change the position of WordB with WordA
     * 
     * @param str The string which contains the words to transpose
     * @param position The position from where to start the operation in the str. It's 0 based.
     */
    function transposeWords(str, position) {
        if (str.length === 0 || !position || str.charAt(position) === "") {
            return str;
        }

        var wordPos = _getWordPositions(str, position);
        
        var newString = str.substr(0, wordPos.wordA.startIndex) +
            wordPos.wordB.text +
            str.substr(wordPos.wordA.endIndex + 1, (wordPos.wordB.startIndex - wordPos.wordA.endIndex) - 1) +
            wordPos.wordA.text + str.substr(wordPos.wordB.endIndex);

        return newString;
    }
    
    function handleTranspose() {
        var editor = EditorManager.getCurrentFullEditor();

        if (editor) {
            var cursorPos = editor.getCursorPos(),
                doc = DocumentManager.getCurrentDocument();

            // transpose text at the line
            var text = doc.getLine(cursorPos.line);
            if (text) {
                // transpose words
                var transposedText = transposeWords(text, cursorPos.ch);
                
                // find new cursor pos
                var newCursorPos = cursorPos.ch;
                while (isWordChar(transposedText.charAt(newCursorPos))) {
                    newCursorPos++;
                }

                // update document only if it was modified through transpose
                if (transposedText !== text) {
                    doc.batchOperation(function () {
                        doc.setText(transposedText);
                    });
                    
                    editor.setCursorPos({line: cursorPos.line, ch: newCursorPos});
                }
            }
        }
    }
    
    // Define Command
    
    // First, register a command - this creates a UI less object with an ID to a function that will
    // called when the command is executed
    var MY_COMMAND_ID = "de.richter.brackets.BracketsTranspose";
    CommandManager.register("Transpose Words", MY_COMMAND_ID, handleTranspose);

    // Create a menu item that is bound to the previously created command
    // The label will be taken from the command previously defined (see above)
    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    if (menu) {
        menu.addMenuItem(MY_COMMAND_ID, "Alt-T");
    }

    // API
    exports.transposeWords      = transposeWords;
    // testing only
    exports._getWordPositions   = _getWordPositions;
});