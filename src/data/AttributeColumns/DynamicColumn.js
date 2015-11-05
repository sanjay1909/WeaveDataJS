/**
 * This provides a wrapper for a dynamically created column.
 *
 * @author adufilie
 * @author asanjay
 */
/*public class DynamicColumn extends LinkableDynamicObject implements IColumnWrapper
	{*/

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
    Object.defineProperty(DynamicColumn, 'NS', {
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
    Object.defineProperty(DynamicColumn, 'CLASS_NAME', {
        value: 'DynamicColumn'
    });


    // TEMPORARY PERFORMANCE IMPROVEMENT SOLUTION
    DynamicColumn.cache = true;
    DynamicColumn._cache_type_key = new Map();
    DynamicColumn._cacheCounter = 0;

    Object.defineProperty(DynamicColumn, 'UNDEFINED', {
        value: {}
    });

    function DynamicColumn(columnTypeRestriction) {
        columnTypeRestriction = columnTypeRestriction ? columnTypeRestriction : null;

        if (columnTypeRestriction === null) {
            columnTypeRestriction = weavedata.IAttributeColumn;
        } else {
            // make sure the columnTypeRestriction implements IAttributeColumn
            if (!columnTypeRestriction.isPrototypeOf(weavedata.IAttributeColumn)) {
                console.error("DynamicColumn(): columnTypeRestriction is not prototype of IAttributeColumn: " + columnTypeRestriction.constructor.name);
                columnTypeRestriction = weavedata.IAttributeColumn;
            }
        }

        /**
         * @return the keys associated with this column.
         */
        Object.defineProperty(this, 'keys', {
            get: function () {
                return this.getInternalColumn() ? this.getInternalColumn().keys : [];
            }
        });
        weavecore.LinkableDynamicObject.call(this, columnTypeRestriction);


    }

    DynamicColumn.prototype = new weavecore.LinkableDynamicObject();
    DynamicColumn.prototype.constructor = DynamicColumn;

    var p = DynamicColumn.prototype;

    /**
     * This function lets you skip the step of casting internalObject as an IAttributeColumn.
     */
    p.getInternalColumn = function () {
        return this.internalObject;

    }

    /************************************
     * Begin IAttributeColumn interface
     ************************************/

    p.getMetadata = function (propertyName) {
        if (this.internalObject)
            return this.internalObject.getMetadata(propertyName);
        return null;
    }


    p.getMetadataPropertyNames = function () {
        if (this.internalObject)
            return this.internalObject.getMetadataPropertyNames();
        return [];
    }

    /**
     * @param key A key to test.
     * @return true if the key exists in this IKeySet.
     */
    p.containsKey = function (key) {
        return this.internalObject ? this.internalObject.containsKey(key) : false;
    }

    /**
     * @param key A key of the type specified by keyType.
     * @return The value associated with the given key.
     */


    p.getValueFromKey = function (key, dataType) {
        dataType = dataType ? dataType : null;
        if (!DynamicColumn.cache) {
            return this.internalObject ? this.internalObject.getValueFromKey(key, dataType) : undefined;
        }

        if (this.triggerCounter != DynamicColumn._cacheCounter) {
            DynamicColumn._cacheCounter = this.triggerCounter;
            DynamicColumn._cache_type_key = new Map();
        }
        var _cache = DynamicColumn._cache_type_key.get(dataType);
        if (!_cache) {
            _cache = new Map();
            DynamicColumn._cache_type_key.set(_cache);
        }


        var value = _cache.get(key);
        if (value === undefined) {
            if (this.internalObject)
                value = this.internalObject.getValueFromKey(key, dataType);
            value === undefined ? DynamicColumn.UNDEFINED : value;
            _cache.set(value);
        }
        return value === DynamicColumn.UNDEFINED ? undefined : value;
    }

    p.toString = function () {
        return debugId(this) + '(' + (this.getInternalColumn() ? this.getInternalColumn() : weavedata.ColumnUtils.getTitle(this)) + ')';
    }



    if (typeof exports !== 'undefined') {
        module.exports = DynamicColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.DynamicColumn = DynamicColumn;
    }

    weavecore.ClassUtils.registerClass('weavedata.DynamicColumn', weavedata.DynamicColumn);
}());
