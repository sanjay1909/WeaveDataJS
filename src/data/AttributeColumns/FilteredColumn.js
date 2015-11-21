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
    Object.defineProperty(FilteredColumn, 'NS', {
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
    Object.defineProperty(FilteredColumn, 'CLASS_NAME', {
        value: 'FilteredColumn'
    });

    function FilteredColumn() {

        weavedata.ExtendedDynamicColumn.call(this);

        /**
         * This is private because it doesn't need to appear in the session state -- keys are returned by the "get keys()" accessor function
         */
        Object.defineProperty(this, '_filteredKeySet', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavedata.FilteredKeySet())
        })

        /**
         * This is the dynamically created filter that filters the keys in the column.
         */
        Object.defineProperty(this, 'filter', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, this._filteredKeySet.keyFilter)
        })


        /**
         * This stores the filtered keys
         */
        this._keys;

        Object.defineProperty(this, 'keys', {
            get: function () {
                // also make internal column request because it may trigger callbacks
                this.internalDynamicColumn.keys;
                return this._filteredKeySet.keys;
            },
            configurable: true
        });



        this._filteredKeySet.setSingleKeySource(this.internalDynamicColumn);
    }


    FilteredColumn.prototype = new weavedata.ExtendedDynamicColumn();
    FilteredColumn.prototype.constructor = FilteredColumn;

    var p = FilteredColumn.prototype;

    /**
     * The filter removes certain records from the column.  This function will return false if the key is not contained in the filter.
     */
    p.containsKey = function (key) {
        // also make internal column request because it may trigger callbacks
        this.internalDynamicColumn.containsKey(key);
        return this._filteredKeySet.containsKey(key);
    }

    p.getValueFromKey = function (key, dataType) {
        dataType = (dataType === undefined) ? null : dataType;
        var column = this.internalDynamicColumn.getInternalColumn();
        var keyFilter = this.filter.getInternalKeyFilter();
        if (column) {
            // always make internal column request because it may trigger callbacks
            var value = column.getValueFromKey(key, dataType);
            if (!keyFilter || keyFilter.containsKey(key))
                return value;
        }

        if (dataType)
            return weavedata.EquationColumnLib.cast(undefined, dataType);

        return undefined;
    }


    if (typeof exports !== 'undefined') {
        module.exports = FilteredColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.FilteredColumn = FilteredColumn;
    }

    weavecore.ClassUtils.registerClass('weavedata.FilteredColumn', weavedata.FilteredColumn);
    weavecore.ClassUtils.registerImplementation('weavedata.FilteredColumn', "weavedata.IAttributeColumn");

}());
