/*
    Weave (Web-based Analysis and Visualization Environment)
    Copyright (C) 2008-2011 University of Massachusetts Lowell

    This file is a part of Weave.

    Weave is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License, Version 3,
    as published by the Free Software Foundation.

    Weave is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Weave.  If not, see <http://www.gnu.org/licenses/>.
*/



/**
 * This object contains a mapping from keys to data values.
 *
 * @author adufilie
 * @author sanjay1909
 */

(function() {
    function AbstractAttributeColumn(metadata) {
        // set default argument values
        if (metadata === undefined) metadata = null;
        weavecore.CallbackCollection.call(this);


        this._metadata = null;
        /**
         * Used by default getValueFromKey() implementation. Must be explicitly initialized.
         */
        this.dataTask;

        /**
         * Used by default getValueFromKey() implementation. Must be explicitly initialized.
         */
        this.dataCache;


        if (metadata)
            this.setMetadata(metadata);
    }

    AbstractAttributeColumn.prototype = new weavecore.CallbackCollection();
    AbstractAttributeColumn.prototype.constructor = AbstractAttributeColumn;

    var p = AbstractAttributeColumn.prototype;

    /**
     * This function should only be called once, before setting the record data.
     * @param metadata Metadata for this column.
     */
    p.setMetadata = function(metadata) {
        if (this._metadata !== null)
            throw new Error("Cannot call setMetadata() if already set");
        // make a copy because we don't want any surprises (metadata being set afterwards)
        this._metadata = AbstractAttributeColumn.copyValues(metadata);
    }

    /**
     * Copies key/value pairs from an Object or XML attributes.
     * Converts Array values to Strings using WeaveAPI.CSVParser.createCSVRow().
     */
    AbstractAttributeColumn.copyValues = function(obj_or_xml) {
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

    // metadata for this attributeColumn (statistics, description, unit, etc)
    p.getMetadata = function(propertyName) {
        var value = null;
        if (this._metadata)
            value = this._metadata[propertyName] || null;
        return value;
    }

    p.getMetadataPropertyNames = function() {
        return weavedata.VectorUtils.getKeys(this._metadata);
    }

    // 'abstract' functions, should be defined with override when extending this class


    /**
     * @inheritDoc
     */
    p.__defineGetter__("keys", function() {
        return this.dataTask.uniqueKeys;
    });

    /**
     * @inheritDoc
     */
    p.containsKey = function(key) {
        return this.dataTask.arrayData[key] !== undefined;
    }

    /**
     * @inheritDoc
     */
    p.getValueFromKey = function(key, dataType) {
        var array = dataTask.arrayData[key];
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

    p.generateValue = function(key, dataType) {
        return null;
    }



    p.toString = function() {
        return debugId(this) + '(' + ColumnUtils.getTitle(this) + ')';
    }

    weavedata.AbstractAttributeColumn = AbstractAttributeColumn;
}());
