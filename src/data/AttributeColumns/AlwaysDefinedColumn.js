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
    Object.defineProperty(AlwaysDefinedColumn, 'NS', {
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
    Object.defineProperty(AlwaysDefinedColumn, 'CLASS_NAME', {
        value: 'AlwaysDefinedColumn'
    });


    Object.defineProperty(AlwaysDefinedColumn, 'UNDEFINED', {
        value: {}
    });


    /**
     * AlwaysDefinedColumn
     *
     * @author adufilie
     * @author sanjay1909
     */
    function AlwaysDefinedColumn(defaultValue, defaultValueVerifier) {
        defaultValueVerifier = (defaultValueVerifier === undefined) ? null : defaultValueVerifier;
        weavedata.ExtendedDynamicColumn.call(this);
        /**
         * This sessioned property contains the default value to be returned
         * when the referenced column does not define a value for a given key.
         */

        this._defaultValue = new weavecore.UntypedLinkableVariable(defaultValue, defaultValueVerifier);
        WeaveAPI.SessionManager.registerLinkableChild(this, this._defaultValue, handleDefaultValueChange.bind(this));
        Object.defineProperty(this, 'defaultValue', {
            get: function () {
                return this._defaultValue;
            }
        });



        this._cachedDefaultValue;

        this._cache_type_key = new Map();
        this._cacheCounter = 0;
    }

    function handleDefaultValueChange() {
        this._cachedDefaultValue = this.defaultValue.value;
    }

    AlwaysDefinedColumn.prototype = new weavedata.ExtendedDynamicColumn();
    AlwaysDefinedColumn.prototype.constructor = AlwaysDefinedColumn;

    var p = AlwaysDefinedColumn.prototype;

    /**
     * @param key A key to test.
     * @return true if the key exists in this IKeySet.
     */
    p.containsKey = function (key) {
        return true;
    }

    /**
     * @param key A key of the type specified by keyType.
     * @return The value associated with the given key.
     */
    p.getValueFromKey = function (key, dataType) {
        dataType = (dataType === undefined) ? null : dataType;
        if (!weavedata.DynamicColumn.cache) {
            var value = this.internalDynamicColumn.getValueFromKey(key, dataType);

            if (weavecore.StandardLib.isUndefined(value)) {
                value = this._cachedDefaultValue;
                if (dataType != null)
                    value = weavedata.EquationColumnLib.cast(value, dataType);
            }

            return value;
        }

        if (this.triggerCounter != this._cacheCounter) {
            this._cacheCounter = this.triggerCounter;
            this._cache_type_key = new Map();
        }
        var _cache = this._cache_type_key.get(dataType);
        if (!_cache) {
            _cache = new Map();
            this._cache_type_key.set(dataType, _cache);
        }


        value = _cache.get(key);
        if (value === undefined) {
            value = this.internalDynamicColumn.getValueFromKey(key, dataType);
            if (weavecore.StandardLib.isUndefined(value)) {
                value = this._cachedDefaultValue;
                if (dataType != null)
                    value = weavedata.EquationColumnLib.cast(value, dataType);
            }

            _cache.set(key, ((value === undefined) ? AlwaysDefinedColumn.UNDEFINED : value));
        }
        return value === AlwaysDefinedColumn.UNDEFINED ? undefined : value;
    }

    if (typeof exports !== 'undefined') {
        module.exports = AlwaysDefinedColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.AlwaysDefinedColumn = AlwaysDefinedColumn;
    }

    weavecore.ClassUtils.registerClass('weavedata.AlwaysDefinedColumn', weavedata.AlwaysDefinedColumn);
    weavecore.ClassUtils.registerImplementation('weavedata.AlwaysDefinedColumn', "weavedata.IAttributeColumn");

}());
