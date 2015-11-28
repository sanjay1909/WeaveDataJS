/**
 * This object contains a mapping from keys to data values.
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
    Object.defineProperty(AbstractAttributeColumn, 'NS', {
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
    Object.defineProperty(AbstractAttributeColumn, 'CLASS_NAME', {
        value: 'AbstractAttributeColumn'
    });

    function AbstractAttributeColumn(metadata) {
        // set default argument values
        if (metadata === undefined) metadata = null;
        weavedata.IAttributeColumn.call(this);

        Object.defineProperty(this, 'sessionable', {
            value: true
        });


        this._metadata = null; // get set in setMetadata function
        /**
         * Used by default getValueFromKey() implementation. Must be explicitly initialized.
         */
        this.dataTask;

        /**
         * Used by default getValueFromKey() implementation. Must be explicitly initialized.
         */
        this.dataCache;


        /**
         * @inheritDoc
         */
        Object.defineProperty(this, "keys", {
            get: function () {
                return this.dataTask.uniqueKeys;
            },
            configurable: true
        });



        if (metadata)
            this.setMetadata(metadata);
    }


    /**
     * Copies key/value pairs from an Object or XML attributes.
     * Converts Array values to Strings using WeaveAPI.CSVParser.createCSVRow().
     */
    AbstractAttributeColumn.copyValues = function (obj_or_xml) {
        /*if (obj_or_xml is XML_Class)
				return weavedata.HierarchyUtils.getMetadata(XML(obj_or_xml));*/

        var obj = {};
        for (var key in obj_or_xml) {
            var value = obj_or_xml[key];
            if (value.constructor === Array)
                obj[key] = WeaveAPI.CSVParser.createCSVRow(value);
            else
                obj[key] = value;
        }
        return obj;
    }

    AbstractAttributeColumn.prototype = new weavedata.IAttributeColumn();
    AbstractAttributeColumn.prototype.constructor = AbstractAttributeColumn;

    var p = AbstractAttributeColumn.prototype;

    /**
     * This function should only be called once, before setting the record data.
     * @param metadata Metadata for this column.
     */
    p.setMetadata = function (metadata) {
        if (this._metadata !== null)
            throw new Error("Cannot call setMetadata() if already set");
        // make a copy because we don't want any surprises (metadata being set afterwards)
        this._metadata = AbstractAttributeColumn.copyValues(metadata);
    }



    // metadata for this attributeColumn (statistics, description, unit, etc)
    p.getMetadata = function (propertyName) {
        var value = null;
        if (this._metadata)
            value = this._metadata[propertyName] || null;
        return value;
    }

    p.getMetadataPropertyNames = function () {
        return weavedata.VectorUtils.getKeys(this._metadata);
    }



    /**
     * @inheritDoc
     */
    p.containsKey = function (key) {
        return this.dataTask.arrayData[key] !== undefined;
    }

    /**
     * @inheritDoc
     */
    p.getValueFromKey = function (key, dataType) {
        var array = this.dataTask.arrayData[key];
        if (!array)
            return dataType === String ? '' : undefined;

        if (!dataType || dataType === Array)
            return array;

        var cache = this.dataCache.dictionary.get(dataType);
        if (!cache) {
            cache = new Map();
            this.dataCache.dictionary.set(dataType, cache);
        }

        var value = cache.get(key);
        if (value === undefined)
            cache[key] = value = this.generateValue(key, dataType);
        return value;
    }

    /**
     * Used by default getValueFromKey() implementation to cache values.
     */

    p.generateValue = function (key, dataType) {
        return null;
    }



    p.toString = function () {
        return WeaveAPI.debugId(this) + '(' + ColumnUtils.getTitle(this) + ')';
    }

    weavedata.AbstractAttributeColumn = AbstractAttributeColumn;

    if (typeof exports !== 'undefined') {
        module.exports = AbstractAttributeColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.AbstractAttributeColumn = AbstractAttributeColumn;
    }

    weavecore.ClassUtils.registerClass('weavedata.AbstractAttributeColumn', weavedata.AbstractAttributeColumn);
    weavecore.ClassUtils.registerImplementation('weavedata.AbstractAttributeColumn', "weavedata.IAttributeColumn");
}());
