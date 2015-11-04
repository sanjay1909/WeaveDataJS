/**
 * This class manages a global list of IQualifiedKey objects.
 *
 * The getQKey() function must be used to get IQualifiedKey objects.  Each QKey returned by
 * getQKey() with the same parameters will be the same object, so IQualifiedKeys can be compared
 * with the == operator or used as keys in a Dictionary.
 *
 * @author adufilie
 * @author asanjay
 */
(function () {

    /**
     * This makes a sorted copy of an Array of keys.
     * @param An Array of IQualifiedKeys.
     * @return A sorted copy of the keys.
     */
    QKeyManager.keySortCopy = function (keys) {
        var qkm = WeaveAPI.QKeyManager;
        var params = [qkm.keyTypeLookup, qkm.localNameLookup];
        return weavecore.StandardLib.sortOn(keys, params, null, false);
    }

    function QKeyManager() {
        Object.defineProperty(this, "_keyBuffer", {
            value: [] // holds one key
        });

        /**
         * keyType -> Object( localName -> IQualifiedKey )
         */
        Object.defineProperty(this, "_keys", {
            value: {} // holds one key
        });

        /**
         * Maps IQualifiedKey to keyType - faster than reading the keyType property of a QKey
         */
        Object.defineProperty(this, "keyTypeLookup", {
            value: new Map()
        });

        /**
         * Maps IQualifiedKey to localName - faster than reading the localName property of a QKey
         */
        Object.defineProperty(this, "localNameLookup", {
            value: new Map()
        });

        Object.defineProperty(this, "_qkeyGetterLookup", {
            value: new Map()
        });

    }

    var p = QKeyManager.prototype;

    /**
     * Get the QKey object for a given key type and key.
     *
     * @return The QKey object for this type and key.
     */
    p.getQKey = function (keyType, localName) {
        this._keyBuffer[0] = localName;
        this.getQKeys_range(keyType, this._keyBuffer, 0, 1, this._keyBuffer);
        return this._keyBuffer[0];
    }

    function stringHash(str) {
        var hash = 0;
        if (!str) return hash;
        str = (typeof (str) === 'number') ? String(str) : str;
        if (str.length === 0) return hash;
        for (var i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    /**
     * @param output An output Array or Vector for IQualifiedKeys.
     */
    p.getQKeys_range = function (keyType, keyStrings, iStart, iEnd, output) {
        // if there is no keyType specified, use the default
        if (!keyType)
            keyType = "string";

        // get mapping of key strings to QKey weak references
        var keyLookup = this._keys[keyType];
        if (keyLookup === null || keyLookup === undefined) {
            // key type not seen before, so initialize it
            keyLookup = {};
            this._keys[keyType] = keyLookup;
        }

        for (var i = iStart; i < iEnd; i++) {
            var localName = keyStrings[i];
            //TO-DO do Stringhash
            var hash = stringHash(localName, true); // using stringHash improves lookup speed for a large number of strings
            var qkey = keyLookup[hash];
            if (qkey === undefined) {
                // QKey not created for this key yet (or it has been garbage-collected)
                qkey = new weavedata.QKey(keyType, localName);
                keyLookup[hash] = qkey;
                this.keyTypeLookup.set(qkey, keyType);
                this.localNameLookup.set(qkey, localName);
            }

            output[i] = qkey;
        }
    }


    /**
     * Get a list of QKey objects, all with the same key type.
     *
     * @return An array of QKeys.
     */
    p.getQKeys = function (keyType, keyStrings) {
        var keys = [];
        keys.length = keyStrings.length;
        this.getQKeys_range(keyType, keyStrings, 0, keyStrings.length, keys);
        return keys;
    }

    /**
     * This will replace untyped Objects in an Array with their IQualifiedKey counterparts.
     * Each object in the Array should have two properties: <code>keyType</code> and <code>localName</code>
     * @param objects An Array to modify.
     * @return The same Array that was passed in, modified.
     */
    p.convertToQKeys = function (objects) {
        var i = objects.length;
        while (i--) {
            var item = objects[i];
            if (!(item instanceof weavedata.IQualifiedKey))
                objects[i] = this.getQKey(item.keyType, item.localName);
        }
        return objects;
    }

    /**
     * Get a list of QKey objects, all with the same key type.
     *
     * @return An array of QKeys that will be filled in asynchronously.
     */
    p.getQKeysAsync = function (relevantContext, keyType, keyStrings, asyncCallback, outputKeys) {
        var qkg = this._qkeyGetterLookup.get(relevantContext);
        if (!qkg) {
            qkg = new weavedata.QKeyGetter(this, relevantContext);
            this._qkeyGetterLookup.set(relevantContext, qkg);
        }

        qkg.asyncStart(keyType, keyStrings, outputKeys).then(function () {
            asyncCallback();
        });
    }

    /**
     * Get a list of QKey objects, all with the same key type.
     * @param relevantContext The owner of the WeavePromise. Only one WeavePromise will be generated per owner.
     * @param keyType The keyType.
     * @param keyStrings An Array of localName values.
     * @return A WeavePromise that produces a Vector.<IQualifiedKey>.
     */
    p.getQKeysPromise = function (relevantContext, keyType, keyStrings) {
        var qkg = this._qkeyGetterLookup.get(relevantContext);
        if (!qkg) {
            qkg = new weavedata.QKeyGetter(this, relevantContext);
            this._qkeyGetterLookup.set(relevantContext, qkg);
        }

        qkg.asyncStart(keyType, keyStrings);
        return qkg;
    }


    /**
     * Get a list of all previoused key types.
     *
     * @return An array of QKeys.
     */
    p.getAllKeyTypes = function () {
        var types = [];
        for (var type in this._keys)
            types.push(type);
        return types;
    }

    /**
     * Get a list of all referenced QKeys for a given key type
     * @return An array of QKeys
     */
    p.getAllQKeys = function (keyType) {
        var qkeys = [];
        this._keys.forEach(function (qkey) {
            qkeys.push(qkey);
        });

    }


    if (typeof exports !== 'undefined') {
        module.exports = QKeyManager;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.QKeyManager = QKeyManager;
        window.WeaveAPI = window.WeaveAPI ? window.WeaveAPI : {};
        window.WeaveAPI.QKeyManager = new QKeyManager();
    }

}());



/**
 * This class is internal to QKeyManager because instances
 * of QKey should not be instantiated outside QKeyManager.
 */
(function () {
    function QKey(keyType, localName) {
        this._kt = keyType;
        this._ln = localName;

        /**
         * This is the namespace of the QKey.
         */
        Object.defineProperty(this, "keyType", {
            get: function () {
                return this._kt;
            }
        });

        /**
         * This is local record identifier in the namespace of the QKey.
         */
        Object.defineProperty(this, "localName", {
            get: function () {
                return this._ln;
            }
        });
    }

    var p = QKey.prototype;

    if (typeof exports !== 'undefined') {
        module.exports = QKey;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.QKey = QKey;
    }
}());

/**
 * This class is internal to QKeyManager because instances
 * of QKey should not be instantiated outside QKeyManager.
 */
(function () {
    function QKeyGetter(manager, relevantContext) {

        weavecore.WeavePromise.call(this, relevantContext);
        this._manager = manager;

        this._asyncCallback;
        this._i;

        this._keyType;
        this._keyStrings;
        this._outputKeys;


        Object.defineProperty(this, '_batch', {
            value: 5000
        });


    }


    QKeyGetter.prototype = new weavecore.WeavePromise();
    QKeyGetter.prototype.constructor = QKeyGetter;
    var p = QKeyGetter.prototype;

    p.asyncStart = function (keyType, keyStrings, outputKeys) {
        outputKeys = outputKeys ? outputKeys : null;
        //this.manager = manager;
        this._keyType = keyType;
        this._keyStrings = keyStrings;
        this._i = 0;
        this._outputKeys = outputKeys || [];
        this._outputKeys.length = keyStrings.length;
        // high priority because all visualizations depend on key sets
        WeaveAPI.StageUtils.startTask(this.relevantContext, iterate.bind(this), WeaveAPI.TASK_PRIORITY_HIGH, asyncComplete.bind(this), weavecore.StandardLib.substitute("Initializing {0} record identifiers", keyStrings.length));

        return this;
    }

    function iterate(stopTime) {
        for (; this._i < this._keyStrings.length; this._i += this._batch) {
            if (getTimer() > stopTime)
                return this._i / this._keyStrings.length;

            this._manager.getQKeys_range(this._keyType, this._keyStrings, this._i, Math.min(this._i + this._batch, this._keyStrings.length), this._outputKeys);
        }
        return 1;
    }

    function getTimer() {
        return new Date().getTime();
    }

    function asyncComplete() {
        this.setResult(this._outputKeys);
    }

    if (typeof exports !== 'undefined') {
        module.exports = QKeyGetter;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.QKeyGetter = QKeyGetter;
    }
}());
