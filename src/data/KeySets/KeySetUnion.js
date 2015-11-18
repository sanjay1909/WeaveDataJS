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
    Object.defineProperty(KeySetUnion, 'NS', {
        value: 'weavedata'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(KeySetUnion, 'CLASS_NAME', {
        value: 'KeySetUnion'
    });

    KeySetUnion.debug = false;
    /**
     * This key set is the union of several other key sets.  It has no session state.
     *
     * @param keyInclusionLogic A function that accepts an IQualifiedKey and returns true or false.
     * @author adufilie
     * @author sanjay1909
     */
    function KeySetUnion() {
        weavedata.IKeySet.call(this);
        /**
         * This will be used to determine whether or not to include a key.
         */
        this._keyInclusionLogic = null;

        this._keySets = []; // Array of IKeySet
        this._allKeys = []; // Array of IQualifiedKey
        this._keyLookup = new Map(); // IQualifiedKey -> Boolean

        /**
         * Use this to check asynchronous task busy status.  This is kept separate because if we report busy status we need to
         * trigger callbacks when an asynchronous task completes, but we don't want to trigger KeySetUnion callbacks when nothing
         * changes as a result of completing the asynchronous task.
         */
        Object.defineProperty(this, 'busyStatus', {
            value: WeaveAPI.SessionManager.registerDisposableChild(this, new weavecore.CallbackCollection()) // separate owner for the async task to avoid affecting our busy status
        })


        this._asyncKeys; // keys from current key set
        this._asyncKeySetIndex; // index of current key set
        this._asyncKeyIndex; // index of current key
        this._prevCompareCounter; // keeps track of how many new keys are found in the old keys list
        this._newKeyLookup; // for comparing to new keys lookup
        this._newKeys; // new allKeys array in progress

        /**
         * This is a list of the IQualifiedKey objects that define the key set.
         */
        Object.defineProperty(this, 'keys', {
            get: function () {
                this._allKeys;
            }
        })
    }

    function _firstCallback() {
        console.log(this, 'trigger', keys.length, 'keys');
    }



    function asyncStart() {
        // remove disposed key sets
        for (var i = this._keySets.length; i--;)
            if (WeaveAPI.SessionManager.objectWasDisposed(this._keySets[i]))
                this._keySets.splice(i, 1);

            // restart async task
        this._prevCompareCounter = 0;
        this._newKeys = [];
        this._newKeyLookup = new Map();
        this._asyncKeys = null;
        this._asyncKeySetIndex = 0;
        this._asyncKeyIndex = 0;
        // high priority because all visualizations depend on key sets
        WeaveAPI.StageUtils.startTask(this.busyStatus, asyncIterate.bind(this), WeaveAPI.TASK_PRIORITY_HIGH, asyncComplete.bind(this), weavecore.StandardLib.substitute("Computing the union of {0} key sets", this._keySets.length));
    }

    function asyncIterate(stopTime) {
        if (!this._keySets) return 1; //to-do:not sure this is correct
        for (; this._asyncKeySetIndex < this._keySets.length; this._asyncKeySetIndex++) {
            if (this._asyncKeys === null) {
                this._asyncKeys = (this._keySets[this._asyncKeySetIndex]).keys;
                this._asyncKeyIndex = 0;
            }

            for (; this._asyncKeys && this._asyncKeyIndex < this._asyncKeys.length; this._asyncKeyIndex++) {
                if (getTimer() > stopTime)
                    return (this._asyncKeySetIndex + this._asyncKeyIndex / this._asyncKeys.length) / this._keySets.length;

                var key = (this._asyncKeys[this._asyncKeyIndex] && this._asyncKeys[this._asyncKeyIndex] instanceof weavedata.IQualifiedKey) ? this._asyncKeys[this._asyncKeyIndex] : null;
                if (this._newKeyLookup.get(key) === undefined) // if we haven't seen this key yet
                {
                    var includeKey = (this._keyInclusionLogic === null) ? true : this._keyInclusionLogic(key);
                    this._newKeyLookup.set(key, includeKey);

                    if (includeKey) {
                        _newKeys.push(key);

                        // keep track of how many keys we saw both previously and currently
                        if (this._keyLookup.get(key) === true)
                            this._prevCompareCounter++;
                    }
                }
            }

            this._asyncKeys = null;
        }
        return 1; // avoids division by zero
    }

    function getTimer() {
        return new Date().getTime();
    }

    function asyncComplete() {
        // detect change
        if (!this._allKeys) return;
        if (this._allKeys.length != this._newKeys.length || this._allKeys.length != this._prevCompareCounter) {
            this._allKeys = this._newKeys;
            this._keyLookup = this._newKeyLookup;
            WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
        }

        this.busyStatus.triggerCallbacks();
    }

    KeySetUnion.prototype = new weavedata.IKeySet();
    KeySetUnion.prototype.constructor = KeySetUnion;
    var p = KeySetUnion.prototype;


    /**
     * This will add an IKeySet as a dependency and include its keys in the union.
     * @param keySet
     */
    p.addKeySetDependency = function (keySet) {
        if (this._keySets.indexOf(keySet) < 0) {
            this._keySets.push(keySet);
            WeaveAPI.SessionManager.getCallbackCollection(keySet).addDisposeCallback(this, asyncStart.bind(this));
            WeaveAPI.SessionManager.getCallbackCollection(keySet).addImmediateCallback(this, asyncStart.bind(this), true);
        }
    }



    /**
     * @param key A IQualifiedKey object to check.
     * @return true if the given key is included in the set.
     */
    p.containsKey = function (key) {
        return this._keyLookup.get(key) === true;
    }



    p.dispose = function () {
        this._keySets = null;
        this._allKeys = null;
        this._keyLookup = null;
        this._newKeyLookup = null;
    }

    if (typeof exports !== 'undefined') {
        module.exports = KeySetUnion;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.KeySetUnion = KeySetUnion;
    }

    weavecore.ClassUtils.registerClass('weavedata.KeySetUnion', weavedata.KeySetUnion);

}());
