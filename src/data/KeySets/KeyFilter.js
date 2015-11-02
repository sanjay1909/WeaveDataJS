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
    Object.defineProperty(KeyFilter, 'NS', {
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
    Object.defineProperty(KeyFilter, 'CLASS_NAME', {
        value: 'KeyFilter'
    });


    /**
     * This class is used to include and exclude IQualifiedKeys from a set.
     *
     * @author adufilie
     * @author sanjay1909
     */

    function KeyFilter() {
        weavecore.ILinkableObject.call(this);

        // option to include missing keys or not
        Object.defineProperty(this, 'includeMissingKeys', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(), cacheValues.bind(this))
        });
        Object.defineProperty(this, 'includeMissingKeyTypes', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(), cacheValues.bind(this))
        });

        Object.defineProperty(this, 'included', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavedata.KeySet(), handleIncludeChange.bind(this))
        });

        Object.defineProperty(this, 'excluded', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavedata.KeySet(), handleIncludeChange.bind(this))
        });

        Object.defineProperty(this, 'filters', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableHashMap(weavedata.KeyFilter))
        });



        this._includeMissingKeys;
        this._includeMissingKeyTypes;
        this._filters;

        this._includedKeyTypeMap = {};

        this._excludedKeyTypeMap = {};
    }



    function cacheValues() {
        this._includeMissingKeys = this.includeMissingKeys.value;
        this._includeMissingKeyTypes = this.includeMissingKeyTypes.value;
        this._filters = this.filters.getObjects();
    }


    // removes keys from exclude list that were just added to include list

    function handleIncludeChange() {
        var includedKeys = this.included.keys;
        this._includedKeyTypeMap = {};
        for each(var key in includedKeys)
        this._includedKeyTypeMap[key.keyType] = true;

        this.excluded.removeKeys(includedKeys);
    }

    // removes keys from include list that were just added to exclude list

    function handleExcludeChange() {
        var excludedKeys = this.excluded.keys;
        this._excludedKeyTypeMap = {};
        for each(var key in excludedKeys)
        this._excludedKeyTypeMap[key.keyType] = true;

        this.included.removeKeys(excludedKeys);
    }

    KeyFilter.prototype = new weavecore.ILinkableObject();
    KeyFilter.prototype.constructor = KeyFilter;

    var p = KeyFilter.prototype;


    /**
     * This replaces the included and excluded keys in the filter with the parameters specified.
     */
    p.replaceKeys = function (includeMissingKeys, includeMissingKeyTypes, includeKeys, excludeKeys) {
        includeKeys = (includeKeys === undefined) ? null : includeKeys;
        excludeKeys = (excludeKeys === undefined) ? null : excludeKeys;

        WeaveAPI.SessionManager.getCallbackCollection(this).delayCallbacks();

        this.includeMissingKeys.value = includeMissingKeys;
        this.includeMissingKeyTypes.value = includeMissingKeyTypes;

        if (includeKeys)
            this.included.replaceKeys(includeKeys);
        else
            this.included.clearKeys();

        if (excludeKeys)
            this.excluded.replaceKeys(excludeKeys);
        else
            this.excluded.clearKeys();

        WeaveAPI.SessionManager.getCallbackCollection(this).resumeCallbacks();
    }

    // adds keys to include list
    p.includeKeys = function (keys) {
        this.included.addKeys(keys);
    }

    // adds keys to exclude list
    p.excludeKeys = function (keys) {
        this.excluded.addKeys(keys);
    }




    /**
     * @param key A key to test.
     * @return true if this filter includes the key, false if the filter excludes it.
     */
    p.containsKey = function (key) {
        for (var i = 0; i < this._filters.length; i++) {
            var filter = this._filters[0]
            if (!filter.containsKey(key))
                return false;
        }

        if (this._includeMissingKeys || (this._includeMissingKeyTypes && !this._includedKeyTypeMap[key.keyType])) {
            if (this.excluded.containsKey(key))
                return false;
            if (!this._includeMissingKeyTypes && this._excludedKeyTypeMap[key.keyType])
                return false;
            return true;
        } else // exclude missing keys
        {
            if (this.included.containsKey(key))
                return true;
            // if includeMissingKeyTypes and keyType is missing
            if (this._includeMissingKeyTypes && !this._includedKeyTypeMap[key.keyType] && !this._excludedKeyTypeMap[key.keyType])
                return true;
            return false;
        }
    }

    if (typeof exports !== 'undefined') {
        module.exports = KeyFilter;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.KeyFilter = KeyFilter;
    }

}());
