/**
 * @class
 * @extends {gls2.Scene}
 */
gls2.DialogMenu = tm.createClass(
/** @lends {gls2.DialogMenu.prototype} */
{
    superClass: gls2.Scene,

    /** @type {string} */
    titleText: null,
    /** @type {Array.<string>} */
    menu: null,
    /** @type {Array.<string>} */
    descriptions: null,
    /** @type {boolean} */
    showExit: false,

    /** @type {tm.app.Label} */
    title: null,
    /** @type {Array.<tm.app.Label>} */
    selections: [],
    /** @type {tm.app.Label} */
    description: null,
    /** @type {tm.app.RectangleShape} */
    box: null,
    /** @type {tm.app.RectangleShape} */
    cursor: null,

    _selected: 0,
    _opened: false,
    _finished: false,

    /**
     * @constructs
     * @param {string} title
     * @param {Array.<string>} menu
     * @param {number=} defaultSelected
     * @param {Array.<string>} menuDesctiptions
     * @param {boolean=} showExit
     */
    init: function(title, menu, defaultSelected, menuDesctiptions, showExit) {
        this.superInit();

        this.titleText = title;
        this.menu = menu;
        this._selected = ~~defaultSelected;
        this.showExit = !!showExit;
        if (menuDesctiptions) {
            this.descriptions = menuDesctiptions;
        } else {
            this.descriptions = [].concat(menu);
        }
        if (this.showExit) {
            menu.push("exit");
            this.descriptions.push("前の画面へ戻ります");
        }

        var height = Math.max((1+menu.length)*50, 50) + 40;
        this.box = tm.app.RectangleShape(SC_W * 0.8, height, {
            strokeStyle: "rgba(0,0,0,0)",
            fillStyle: "rgba(1,2,48,0.8)",
        }).setPosition(SC_W*0.5, SC_H*0.5);
        this.box.width = 1;
        this.box.height = 1;
        this.box.tweener
            .to({ width: SC_W*0.8, height: height }, 200, "easeOutExpo")
            .call(this._onOpen.bind(this));
        this.box.addChildTo(this);

        this.description = tm.app.Label("", 14).setPosition(SC_W*0.5, SC_H-10).addChildTo(this);
    },

    _onOpen: function() {
        var y = SC_H*0.5 - this.menu.length * 25;

        this.title = tm.app.Label(this.titleText, 30).setPosition(SC_W*0.5, y).addChildTo(this);

        this.selections = this.menu.map(function(m, i) {
            var self = this;
            y += 50;
            var sel = tm.app.Label(m).setPosition(SC_W*0.5, y).addChildTo(this);
            sel.interactive = true;
            sel.addEventListener("touchend", function() {
                if (self._selected === i) {
                    self.closeDialog(self._selected);
                } else {
                    self._selected = i;
                }
            });
            sel.width = SC_W * 0.7;
            return sel;
        }.bind(this));

        this._createCursor();

        this._opened = true;
    },

    _createCursor: function() {
        this.cursor = tm.app.RectangleShape(SC_W*0.7, 10, {
            strokeStyle: "rgba(0,0,0,0)",
            fillStyle: tm.graphics.LinearGradient(0,0,SC_W*0.7,0)
                .addColorStopList([
                    { offset:0.0, color:"rgba(  0,255,100,0.0)" },
                    { offset:0.2, color:"rgba(  0,255,100,0.3)" },
                    { offset:0.5, color:"rgba(  0,255,255,0.5)" },
                    { offset:0.8, color:"rgba(  0,255,100,0.3)" },
                    { offset:1.0, color:"rgba(  0,255,100,0.0)" },
                ]).toStyle(),
        }).addChildTo(this);
        this.cursor.blendMode = "lighter";
        this.cursor.x = SC_W*0.5;
        this.cursor.s = this._selected;
        this.cursor.y = this.selections[this._selected].y;
        this.cursor.update = function() {
            if (this.s !== this.parent._selected) {
                this.s = this.parent._selected;
                this.tweener.clear();
                this.tweener.to({
                    y: this.parent.selections[this.parent._selected].y
                }, 200, "easeOutExpo");
            }
        };
    },

    update: function(app) {
        this.description.text = this.descriptions[this._selected];

        if (!this._opened) {
            return;
        }
        if (this._finished) {
            this.cursor.visible = ~~(app.frame/2) % 2 === 0;
            return;
        }

        if (this.showExit && app.keyboard.getKeyDown("x")) {
            this._selected = this.selections.length-1;
            this.closeDialog(this._selected);
            return;
        } else if (app.keyboard.getKeyDown("z") || app.keyboard.getKeyDown("space")) {
            this.closeDialog(this._selected);
            return;
        } else if (app.keyboard.getKeyDown("down")) {
            this._selected += 1;
            this._selected = gls2.math.clamp(this._selected, 0, this.selections.length-1);
        } else if (app.keyboard.getKeyDown("up")) {
            this._selected -= 1;
            this._selected = gls2.math.clamp(this._selected, 0, this.selections.length-1);
        }
    },

    closeDialog: function(result) {
        this._finished = true;
        this.tweener
            .clear()
            .wait(200)
            .call(function() {
                this.cursor.remove();
                this.title.remove();
                this.selections.each(function(sel) {
                    sel.remove();
                });
                this.box.tweener.clear();
                this.box.tweener
                    .to({ width: 1, height: 1 }, 200, "easeInExpo")
                    .call(function() {
                        this.finish(result);
                    }.bind(this));
            }.bind(this));
    },

    draw: function(canvas) {
        canvas.fillStyle = "rgba(0,0,0,0.8)";
        canvas.fillRect(0,0,SC_W,SC_H);
    },
});

/**
 * @param {string} title
 * @param {Array.<string>} menu
 * @param {function(number)} callback
 * @param {number=} defaultValue
 * @param {Array.<string>=} menuDescriptions
 * @param {boolean=} showExit
 */
gls2.Scene.prototype.openDialogMenu = function(title, menu, callback, defaultValue, menuDescriptions, showExit) {
    if (showExit === undefined) showExit = true;
    this.startSceneForResult(gls2.DialogMenu(title, menu, defaultValue, menuDescriptions, showExit), callback);
};
