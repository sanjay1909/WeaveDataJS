/**
 *
 * @author adufilie
 * @author asanjay
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
    Object.defineProperty(ProxyColumn, 'NS', {
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
    Object.defineProperty(ProxyColumn, 'CLASS_NAME', {
        value: 'ProxyColumn'
    });


    Object.defineProperty(ProxyColumn, 'DATA_UNAVAILABLE', {
        value: '(Data unavailable)'
    });



    function ProxyColumn(metadata) {
        metadata = (metadata === undefined) ? null : metadata;
        weavedata.AbstractAttributeColumn.call(this, metadata);
        /**
         * internalAttributeColumn
         * This is the IAttributeColumn object contained in this ProxyColumn.
         */
        this._internalColumn = null;

        this._overrideTitle;

        /**
         * internalNonProxyColumn
         * As long as internalAttributeColumn is a ProxyColumn, this function will
         * keep traversing internalAttributeColumn until it reaches an IAttributeColumn that
         * is not a ProxyColumn.
         * @return An attribute column that is not a ProxyColumn, or null.
         */
        Object.defineProperty(this, "internalNonProxyColumn", {
            get: function () {
                var column = this._internalColumn;
                while (column instanceof ProxyColumn)
                    column = column._internalColumn;
                return column;
            }
        });

        /**
         * @return the keys associated with this column.
         */
        Object.defineProperty(this, "keys", {
            get: function () {
                var column = this.internalNonProxyColumn;
                return column ? column.keys : [];
            },
            configurable: true
        });


    }



    ProxyColumn.prototype = new weavedata.AbstractAttributeColumn();
    ProxyColumn.prototype.constructor = ProxyColumn;
    var p = ProxyColumn.prototype;

    /**
     * @param key A key to test.
     * @return true if the key exists in this IKeySet.
     */
    p.containsKey = function (key) {
        return this._internalColumn && this._internalColumn.containsKey(key);
    }

    /**
     * This function updates the proxy metadata.
     * @param metadata New metadata for the proxy.
     */
    p.setMetadata = function (metadata) {
        this._metadata = weavedata.AbstractAttributeColumn.copyValues(metadata);
        this.triggerCallbacks();
    }

    /**
     * The metadata specified by ProxyColumn will override the metadata of the internal column.
     * First, this function checks thet ProxyColumn metadata.
     * If the value is null, it checks the metadata of the internal column.
     * @param propertyName The name of a metadata property to get.
     * @return The metadata value of the ProxyColumn or the internal column, ProxyColumn metadata takes precendence.
     */
    p.getMetadata = function (propertyName) {
        if (propertyName === weavedata.ColumnMetadata.TITLE && this._overrideTitle)
            return this._overrideTitle;

        var overrideValue = weavedata.AbstractAttributeColumn.prototype.getMetadata.call(this, propertyName);
        if ((overrideValue === null || overrideValue === undefined) && this._internalColumn !== null)
            return this._internalColumn.getMetadata(propertyName);
        return overrideValue;
    }


    p.getProxyMetadata = function () {
        return weavedata.AbstractAttributeColumn.copyValues(this._metadata);
    }

    p.getMetadataPropertyNames = function () {
        if (this._internalColumn)
            return weavedata.VectorUtils.union(weavedata.AbstractAttributeColumn.prototype.getMetadataPropertyNames.call(this), this._internalColumn.getMetadataPropertyNames());
        return weavedata.AbstractAttributeColumn.prototype.getMetadataPropertyNames.call(this);
    }




    p.getInternalColumn = function () {
        return this._internalColumn;
    }
    p.setInternalColumn = function (newColumn) {
        this._overrideTitle = null;

        if (newColumn === this) {
            console.warn("WARNING! Attempted to set ProxyColumn.internalAttributeColumn to self: " + this);
            return;
        }

        if (this._internalColumn === newColumn)
            return;

        // clean up ties to previous column
        if (this._internalColumn !== null)
            WeaveAPI.SessionManager.unregisterLinkableChild(this, this._internalColumn);

        // save pointer to new column
        this._internalColumn = newColumn;

        // initialize for new column
        if (this._internalColumn !== null)
            WeaveAPI.SessionManager.registerLinkableChild(this, this._internalColumn);

        this.triggerCallbacks();
    }

    /**
     * The functions below serve as wrappers for matching function calls on the internalAttributeColumn.
     */
    p.getValueFromKey = function (key, dataType) {
        dataType = (dataType === undefined) ? null : dataType;
        if (this._internalColumn)
            return this._internalColumn.getValueFromKey(key, dataType);
        return undefined;
    }

    /**
     * @inheritDoc
     */
    p.dispose = function () {
        weavedata.AbstractAttributeColumn.prototype.dispose.call(this);
        this._metadata = null;
        this.setInternalColumn(null); // this will remove the callback that was added to the internal column
    }

    /**
     * Call this function when the ProxyColumn should indicate that the requested data is unavailable.
     * @param message The message to display in the title of the ProxyColumn.
     */
    p.dataUnavailable = function (message) {
        message = (message === undefined) ? null : message;
        this.delayCallbacks();
        this.setInternalColumn(null);
        if (message) {
            this._overrideTitle = message;
        } else {
            var title = this.getMetadata(weavedata.ColumnMetadata.TITLE);
            if (title)
                this._overrideTitle = weavecore.StandardLib.substitute('(Data unavailable: {0})', title);
            else
                this._overrideTitle = ProxyColumn.DATA_UNAVAILABLE;
        }
        this.triggerCallbacks();
        this.resumeCallbacks();
    }

    p.toString = function () {
        if (this.getInternalColumn())
            return WeaveAPI.debugId(this) + '( ' + this.getInternalColumn() + ' )';
        return weavedata.AbstractAttributeColumn.prototype.toString.call(this);
    }

    if (typeof exports !== 'undefined') {
        module.exports = ProxyColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.ProxyColumn = ProxyColumn;
    }
    weavecore.ClassUtils.registerClass('weavedata.ProxyColumn', weavedata.ProxyColumn);

}());
