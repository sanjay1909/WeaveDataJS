/**
 * This provides a wrapper for a referenced column.
 *
 * @author adufilie
 * @author sanjay1909
 */
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
    Object.defineProperty(ReferencedColumn, 'NS', {
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
    Object.defineProperty(ReferencedColumn, 'CLASS_NAME', {
        value: 'ReferencedColumn'
    });

    function ReferencedColumn() {
        weavedata.IColumnWrapper.call(this);
        this._dataSource;
        /**
         * The trigger counter value at the last time the internal column was retrieved.
         */
        this._prevTriggerCounter = 0;
        /**
         * the internal referenced column
         */
        this._internalColumn = null;

        /**
         * @return the keys associated with this column.
         */
        Object.defineProperty(this, 'keys', {
            get: function () {
                if (this._prevTriggerCounter !== this.triggerCounter)
                    this.getInternalColumn();
                return this._internalColumn ? this._internalColumn.keys : [];
            }
        });

        /**
         * This is the name of an IDataSource in the top level session state.
         */
        Object.defineProperty(this, 'dataSourceName', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(), this._updateDataSource.bind(this)),
            writable: false
        });
        /**
         * This holds the metadata used to identify a column.
         */
        Object.defineProperty(this, 'metadata', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableVariable()),
            writable: false
        });

        Object.defineProperty(this, '_columnWatcher', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableWatcher()),
            writable: false
        });

        WeaveAPI.globalHashMap.childListCallbacks.addImmediateCallback(this, this._updateDataSource.bind(this));
    }

    ReferencedColumn.prototype = new weavedata.IColumnWrapper();
    ReferencedColumn.prototype.constructor = ReferencedColumn;


    var p = ReferencedColumn.prototype;

    p._updateDataSource = function () {
        var ds = WeaveAPI.globalHashMap.getObject(this.dataSourceName.value);
        if (this._dataSource !== ds) {
            this._dataSource = ds;
            this.triggerCallbacks();
        }
    }

    /**
     * @inheritDoc
     */
    p.getDataSource = function () {
        return this._dataSource;
    }

    /**
     * Updates the session state to refer to a new column.
     */
    p.setColumnReference = function (dataSource, metadata) {
        this.delayCallbacks();
        this.dataSourceName.value = WeaveAPI.globalHashMap.getName(dataSource);
        this.metadata.setSessionState(metadata);
        this.resumeCallbacks();
    }


    /**
     * @inheritDoc
     */

    p.getInternalColumn = function () {
        if (this._prevTriggerCounter !== this.triggerCounter) {
            if (WeaveAPI.SessionManager.objectWasDisposed(this._dataSource))
                this._dataSource = null;

            var col = null;
            if (this.dataSourceName.value && !this._dataSource) {
                // data source was named but not found
            } else {
                col = WeaveAPI.AttributeColumnCache.getColumn(this._dataSource, this.metadata.getSessionState());
            }
            this._columnWatcher.target = this._internalColumn = col;

            this._prevTriggerCounter = this.triggerCounter;
        }
        return this._internalColumn;
    }


    /************************************
     * Begin IAttributeColumn interface
     ************************************/


    p.getMetadata = function (attributeName) {
        if (this._prevTriggerCounter !== this.triggerCounter)
            this.getInternalColumn();
        return this._internalColumn ? this._internalColumn.getMetadata(attributeName) : null;
    }

    p.getMetadataPropertyNames = function () {
        if (this._prevTriggerCounter !== this.triggerCounter)
            this.getInternalColumn();
        return this._internalColumn ? this._internalColumn.getMetadataPropertyNames() : [];
    }



    /**
     * @param key A key to test.
     * @return true if the key exists in this IKeySet.
     */
    p.containsKey = function (key) {
        if (this._prevTriggerCounter !== this.triggerCounter)
            this.getInternalColumn();
        return this._internalColumn && this._internalColumn.containsKey(key);
    }

    /**
     * getValueFromKey
     * @param key A key of the type specified by keyType.
     * @return The value associated with the given key.
     */
    p.getValueFromKey = function (key, dataType) {
        if (dataType === undefined) dataType = null;
        if (this._prevTriggerCounter !== this.triggerCounter)
            this.getInternalColumn();
        return this._internalColumn ? this._internalColumn.getValueFromKey(key, dataType) : undefined;
    }

    p.toString = function () {
        return this.debugId(this) + '(' + weavedata.ColumnUtils.getTitle(this) + ')';
    }

    if (typeof exports !== 'undefined') {
        module.exports = ReferencedColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.ReferencedColumn = ReferencedColumn;
    }

    weavecore.ClassUtils.registerClass('weavedata.ReferencedColumn', weavedata.ReferencedColumn);
}());
