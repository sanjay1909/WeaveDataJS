(function () {

    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(KeySetCallbackInterface, 'NS', {
        value: 'weavedata'
    });

    /**
     * TO-DO:temporary solution to save the CLASS-NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS-NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(KeySetCallbackInterface, 'CLASS_NAME', {
        value: 'KeySetCallbackInterface'
    });


    /**
     * Provides an interface for getting KeySet event-related information.
     */
    function KeySetCallbackInterface() {

        // specify the preCallback function in super() so list callback
        // variables will be set before each change callback.
        weavecore.CallbackCollection.call(this, setCallbackVariables.bind(this));

        /**
         * The keys that were most recently added, causing callbacks to trigger.
         * This can be used as a buffer prior to calling flushKeys().
         * @see #flushKeys()
         */
        this.keysAdded = [];

        /**
         * The keys that were most recently removed, causing callbacks to trigger.
         * This can be used as a buffer prior to calling flushKeys().
         * @see #flushKeys()
         */
        this.keysRemoved = [];

    }

    function setCallbackVariables(keysAdded, keysRemoved) {
        this.keysAdded = keysAdded;
        this.keysRemoved = keysRemoved;
    }

    KeySetCallbackInterface.prototype = new weavecore.CallbackCollection();
    KeySetCallbackInterface.prototype.constructor = KeySetCallbackInterface;

    var p = KeySetCallbackInterface.prototype;

    /**
     * This function should be called when keysAdded and keysRemoved are ready to be shared with the callbacks.
     * The keysAdded and keysRemoved Arrays will be reset to empty Arrays after the callbacks finish running.
     */
    p.flushKeys = function () {
        if (this.keysAdded.length || this.keysRemoved.length)
            this._runCallbacksImmediately(keysAdded, keysRemoved);
        setCallbackVariables.call(this, [], []); // reset the variables to new arrays
    }

    if (typeof exports !== 'undefined') {
        module.exports = KeySetCallbackInterface;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.KeySetCallbackInterface = KeySetCallbackInterface;
    }
}());
