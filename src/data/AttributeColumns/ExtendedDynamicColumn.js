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
    Object.defineProperty(ExtendedDynamicColumn, 'NS', {
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
    Object.defineProperty(ExtendedDynamicColumn, 'CLASS_NAME', {
        value: 'ExtendedDynamicColumn'
    });

    ExtendedDynamicColumn._instanceCount = 0;
    Object.defineProperty(ExtendedDynamicColumn, 'instanceCount', {

        get: function () {
            return ExtendedDynamicColumn._instanceCount = ExtendedDynamicColumn._instanceCount + 1
        }
    });


    /**
     * This provides a wrapper for a dynamic column, and allows new properties to be added.
     * The purpose of this class is to provide a base for extending DynamicColumn.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function ExtendedDynamicColumn() {
        weavecore.CallbackCollection.call(this);


        Object.defineProperty(this, '_internalDynamicColumn', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavedata.DynamicColumn())
        });

        /**
         * This is the internal DynamicColumn object that is being extended.
         */
        Object.defineProperty(this, 'internalDynamicColumn', {
            get: function () {
                return this._internalDynamicColumn;
            }
        });



        this.name = "ExtendedDynamicColumn" + ExtendedDynamicColumn._instanceCount;

        /**
         * @return the keys associated with this column.
         */
        Object.defineProperty(this, 'keys', {
    get: function () {
        return this.internalDynamicColumn.keys;
    },
    configurable: true
});




    }

    ExtendedDynamicColumn.prototype = new weavecore.CallbackCollection();
    ExtendedDynamicColumn.prototype.constructor = ExtendedDynamicColumn;

    var p = ExtendedDynamicColumn.prototype;
    /**
     * This is for the IColumnWrapper interface.
     */
    p.getInternalColumn = function () {
        return this.internalDynamicColumn.getInternalColumn();
    }


    /************************************
     * Begin IAttributeColumn interface
     ************************************/

    p.getMetadata = function (propertyName) {
        return this.internalDynamicColumn.getMetadata(propertyName);
    }

    p.getMetadataPropertyNames = function () {
        return this.internalDynamicColumn.getMetadataPropertyNames();
    }



    /**
     * @param key A key to test.
     * @return true if the key exists in this IKeySet.
     */
    p.containsKey = function (key) {
        return this.internalDynamicColumn.containsKey(key);
    }

    /**
     * getValueFromKey
     * @param key A key of the type specified by keyType.
     * @return The value associated with the given key.
     */
    p.getValueFromKey = function (key, dataType) {
        dataType = (dataType === undefined) ? null : dataType;
        return this.internalDynamicColumn.getValueFromKey(key, dataType);
    }

    p.toString = function () {
        return WeaveAPI.debugId(this) + '(' + (this.getInternalColumn() ? this.getInternalColumn() : weavedata.ColumnUtils.getTitle(this)) + ')';
    }

    if (typeof exports !== 'undefined') {
        module.exports = ExtendedDynamicColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.ExtendedDynamicColumn = ExtendedDynamicColumn;
    }

}());
