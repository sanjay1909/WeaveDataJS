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
    Object.defineProperty(KeySet, 'NS', {
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
    Object.defineProperty(KeySet, 'CLASS_NAME', {
        value: 'KeySet'
    });

    function KeySet() {
        weavecore.LinkableVariable.call(this, Array, verifySessionState.bind(this));

        // The first callback will update the keys from the session state.
        this.addImmediateCallback(this, updateKeys.bind(this));
        /**
         * This object maps keys to index values
         */
        this._keyIndex = new Map();
        /**
         * This maps index values to IQualifiedKey objects
         */
        this._keys = [];

        /**
         * This flag is used to avoid recursion while the keys are being synchronized with the session state.
         */
        this._currentlyUpdating = false;


        /**
         * A list of keys included in this KeySet.
         */
        Object.defineProperty(this, 'keys', {
            get: function () {
                return this._keys
            }
        });

        /**
         * An interface for keys added and removed
         */
        Object.defineProperty(this, 'keyCallbacks', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavedata.KeySetCallbackInterface())
        });

    }

    /**
     * Verifies that the value is a two-dimensional array or null.
     */
    function verifySessionState(value) {
        if (!value) return false;
        for (var i = 0; i < value.length; i++) {
            var row = value[i];
            if (!(row.constructor === Array))
                return false;
        }
        return true;
    }



    /**
     * This is the first callback that runs when the KeySet changes.
     * The keys will be updated based on the session state.
     */
    function updateKeys() {
        // avoid recursion
        if (this._currentlyUpdating)
            return;

        // each row of CSV represents a different keyType (keyType is the first token in the row)
        var newKeys = [];
        this._sessionStateInternal.forEach(function (row) {
            newKeys.push.apply(null, WeaveAPI.QKeyManager.getQKeys(row[0], row.slice(1)));
        })

        // avoid internal recursion while still allowing callbacks to cause recursion afterwards
        this.delayCallbacks();
        this._currentlyUpdating = true;
        this.replaceKeys(newKeys);
        this.keyCallbacks.flushKeys();
        this._currentlyUpdating = false;
        this.resumeCallbacks();
    }

    /**
     * This function will derive the session state from the IQualifiedKey objects in the keys array.
     */
    function updateSessionState() {
        // avoid recursion
        if (this._currentlyUpdating)
            return;

        // from the IQualifiedKey objects, generate the session state
        var _keyTypeToKeysMap = {};
        this._keys.forEach(function (key) {
            if (_keyTypeToKeysMap[key.keyType] === undefined)
                _keyTypeToKeysMap[key.keyType] = [];
            (_keyTypeToKeysMap[key.keyType]).push(key.localName);
        });
        // for each keyType, create a row for the CSV parser
        var keyTable = [];
        for (var keyType in _keyTypeToKeysMap) {
            var newKeys = _keyTypeToKeysMap[keyType];
            newKeys.unshift(keyType);
            keyTable.push(newKeys);
        }

        // avoid internal recursion while still allowing callbacks to cause recursion afterwards
        this.delayCallbacks();
        this._currentlyUpdating = true;
        this.setSessionState(keyTable);
        this.keyCallbacks.flushKeys();
        this._currentlyUpdating = false;
        this.resumeCallbacks();
    }


    KeySet.prototype = new weavecore.LinkableVariable();
    KeySet.prototype.constructor = KeySet;

    var p = KeySet.prototype;


    /**
     * Overwrite the current set of keys.
     * @param newKeys An Array of IQualifiedKey objects.
     * @return true if the set changes as a result of calling this function.
     */
    p.replaceKeys = function (newKeys) {
        if (this._locked)
            return false;

        WeaveAPI.QKeyManager.convertToQKeys(newKeys);
        if (newKeys === this._keys)
            this._keys = this._keys.concat();

        var key;
        var changeDetected = false;

        // copy the previous key-to-index mapping for detecting changes
        var prevKeyIndex = this._keyIndex;

        // initialize new key index
        this._keyIndex = new Map();
        // copy new keys and create new key index
        this._keys.length = newKeys.length; // allow space for all keys
        var outputIndex = 0; // index to store internally
        for (var inputIndex = 0; inputIndex < newKeys.length; inputIndex++) {
            key = (newKeys[inputIndex] && newKeys[inputIndex] instanceof weavedata.IQualifiedKey) ? newKeys[inputIndex] : null;
            // avoid storing duplicate keys
            if (this._keyIndex.get(key) !== undefined)
                continue;
            // copy key
            this._keys[outputIndex] = key;
            // save key-to-index mapping
            this._keyIndex.set(key, outputIndex);
            // if the previous key index did not have this key, a change has been detected.
            if (prevKeyIndex.get(key) === undefined) {
                changeDetected = true;
                this.keyCallbacks.keysAdded.push(key);
            }
            // increase stored index
            outputIndex++;
        }
        this._keys.length = outputIndex; // trim to actual length
        // loop through old keys and see if any were removed
        for (var key of prevKeyIndex.keys()) {
            if (this._keyIndex.get(key) === undefined) // if this previous key is gone now, change detected
            {
                changeDetected = true;
                this.keyCallbacks.keysRemoved.push(key);
            }
        }

        if (changeDetected)
            updateSessionState.call(this);

        return changeDetected;
    }

    /**
     * Clear the current set of keys.
     * @return true if the set changes as a result of calling this function.
     */
    p.clearKeys = function () {
        if (this._locked)
            return false;

        // stop if there are no keys to remove
        if (this._keys.length === 0)
            return false; // set did not change

        this.keyCallbacks.keysRemoved = this.keyCallbacks.keysRemoved.concat(this._keys);

        // clear key-to-index mapping
        this._keyIndex = new Map();
        this._keys = [];

        updateSessionState.call(this);

        // set changed
        return true;
    }

    /**
     * @param key A IQualifiedKey object to check.
     * @return true if the given key is included in the set.
     */
    p.containsKey = function (key) {
        // the key is included in the set if it is in the key-to-index mapping.
        return this._keyIndex.get(key) !== undefined;
    }

    /**
     * Adds a vector of additional keys to the set.
     * @param additionalKeys A list of keys to add to this set.
     * @return true if the set changes as a result of calling this function.
     */
    p.addKeys = function (additionalKeys) {
        if (this._locked)
            return false;

        var changeDetected = false;
        WeaveAPI.QKeyManager.convertToQKeys(additionalKeys);
        additionalKeys.forEach(function (key) {
            if (this._keyIndex.get(key) === undefined) {
                // add key
                var newIndex = this._keys.length;
                this._keys[newIndex] = key;
                this._keyIndex.set(key, newIndex);

                changeDetected = true;
                this.keyCallbacks.keysAdded.push(key);
            }
        }.bind(this))

        if (changeDetected)
            updateSessionState.call(this);

        return changeDetected;
    }

    /**
     * Removes a vector of additional keys to the set.
     * @param unwantedKeys A list of keys to remove from this set.
     * @return true if the set changes as a result of calling this function.
     */
    p.removeKeys = function (unwantedKeys) {
        if (this._locked)
            return false;

        if (unwantedKeys === this._keys)
            return clearKeys();

        var changeDetected = false;
        WeaveAPI.QKeyManager.convertToQKeys(unwantedKeys);
        unwantedKeys.forEach(function (key) {
            if (this._keyIndex.get(key) !== undefined) {
                // drop key from this._keys vector
                var droppedIndex = this._keyIndex.get(key);
                if (droppedIndex < this._keys.length - 1) // if this is not the last entry
                {
                    // move the last entry to the droppedIndex slot
                    var lastKey = (this._keys[keys.length - 1] && this._keys[keys.length - 1] instanceof weavedata.IQualifiedKey) ? this._keys[keys.length - 1] : null;
                    this._keys[droppedIndex] = lastKey;
                    this._keyIndex[lastKey] = droppedIndex;
                }
                // update length of vector
                this._keys.length--;
                // drop key from object mapping
                this._keyIndex.delete(key);

                changeDetected = true;
                this.keyCallbacks.keysRemoved.push(key);
            }
        });

        if (changeDetected)
            updateSessionState.call(this);

        return changeDetected;
    }

    /**
     * This function sets the session state for the KeySet.
     * @param value A CSV-formatted String where each row is a keyType followed by a list of key strings of that keyType.
     */
    p.setSessionState = function (value) {

        // backwards compatibility -- parse CSV String
        if (value.constructor === String)
            value = WeaveAPI.CSVParser.parseCSV(value);

        // expecting a two-dimensional Array at this point
        weavecore.LinkableVariable.prototype.setSessionState.call(this, value);
    }


    //---------------------------------------------------------------------------------
    // test code
    // { test(); }
    KeySet.test = function () {
        var k = new KeySet();
        var k2 = new KeySet();
        k.addImmediateCallback(null, function () {
            traceKeySet(k);
        });

        testFunction(k, k.replaceKeys, 'create k', 't', ['a', 'b', 'c'], 't', ['a', 'b', 'c']);
        testFunction(k, k.addKeys, 'add', 't', ['b', 'c', 'd', 'e'], 't', ['a', 'b', 'c', 'd', 'e']);
        testFunction(k, k.removeKeys, 'remove', 't', ['d', 'e', 'f', 'g'], 't', ['a', 'b', 'c']);
        testFunction(k, k.replaceKeys, 'replace', 't', ['b', 'x'], 't', ['b', 'x']);

        k2.replaceKeys(WeaveAPI.QKeyManager.getQKeys('t', ['a', 'b', 'x', 'y']));
        console.log('copy k2 to k');
        WeaveAPI.SessionManager.copySessionState(k2, k);
        assert(k, WeaveAPI.QKeyManager.getQKeys('t', ['a', 'b', 'x', 'y']));




        testFunction(k, k.replaceKeys, 'replace k', 't', ['1'], 't', ['1']);
        testFunction(k, k.addKeys, 'add k', 't2', ['1'], 't', ['1'], 't2', ['1']);
        testFunction(k, k.removeKeys, 'remove k', 't', ['1'], 't2', ['1']);
        testFunction(k, k.addKeys, 'add k', 't2', ['1'], 't2', ['1']);

        var arr = WeaveAPI.QKeyManager.getAllKeyTypes();
        arr.forEach(function (t) {
            console.log('all keys (' + t + '):', KeySet.getKeyStrings(WeaveAPI.QKeyManager.getAllQKeys(t)));
        });
    }

    KeySet.getKeyStrings = function (qkeys) {
        var keyStrings = [];
        qkeys.forEach(function (key) {
            keyStrings.push(key.keyType + '#' + key.localName);
        });
        return keyStrings;
    }

    KeySet.traceKeySet = function (keySet) {
        console.log(' ->', KeySet.getKeyStrings(keySet.keys));
        console.log('   ', weavecore.Compiler.stringify(WeaveAPI.SessionManager.getSessionState(keySet)));
    }

    KeySet.testFunction = function (keySet, func, comment, keyType, keys, expectedResultKeyType, expectedResultKeys, expectedResultKeyType2, expectedResultKeys2) {
        expectedResultKeyType2 = (expectedResultKeyType2 === undefined) ? null : expectedResultKeyType2;
        expectedResultKeys2 = (expectedResultKeys2 === undefined) ? null : expectedResultKeys2;

        console.log(comment, keyType, keys);
        func(WeaveAPI.QKeyManager.getQKeys(keyType, keys));
        var keys1 = expectedResultKeys ? WeaveAPI.QKeyManager.getQKeys(expectedResultKeyType, expectedResultKeys) : [];
        var keys2 = expectedResultKeys2 ? WeaveAPI.QKeyManager.getQKeys(expectedResultKeyType2, expectedResultKeys2) : [];
        assert(keySet, keys1, keys2);
    }
    KeySet.assert = function (keySet, expectedKeys1, expectedKeys2) {
        expectedKeys2 = (expectedKeys2 === undefined) ? null : expectedKeys2;
        var qkey;
        var qkeyMap = new Map();
            [expectedKeys1, expectedKeys2].forEach(function (keys) {
            keys.forEach(function (qkey) {
                if (!keySet.containsKey(qkey))
                    throw new Error("KeySet does not contain expected keys");
                qkeyMap.set(qkey, true);
            });
        });

        keySet.keys.forEach(function (qkey) {
            if (qkeyMap.get(qkey) === undefined)
                throw new Error("KeySet contains unexpected keys");
        });
    }

    if (typeof exports !== 'undefined') {
        module.exports = KeySet;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.KeySet = KeySet;
    }

}());
