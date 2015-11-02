/**
 * This class contains static functions that access values from IAttributeColumn objects.
 *
 * @author adufilie
 */

(function () {
    function ColumnUtils() {

    }
    /**
     * This is a shortcut for column.getMetadata(ColumnMetadata.TITLE).
     * @param column A column to get the title of.
     * @return The title of the column.
     */
    ColumnUtils.getTitle = function (column) {
        var title = column.getMetadata(weavedata.ColumnMetadata.TITLE) || weavedata.ProxyColumn.DATA_UNAVAILABLE;

        // debug code
        if (false) {
            var keyType = column.getMetadata(weavedata.ColumnMetadata.KEY_TYPE);
            if (keyType)
                title += " (Key type: " + keyType + ")";
            else
                title += " (No key type)";
        }

        return title;
    }

    /**
     * Generates a label to use when displaying the column in a list.
     * @param column
     * @return The column title followed by its dataType and/or keyType metadata.
     */
    ColumnUtils.getColumnListLabel = function (column) {
        var title = ColumnUtils.getTitle(column);
        var keyType = ColumnUtils.getKeyType(column);
        var dataType = ColumnUtils.getDataType(column);
        var projection = column.getMetadata(weavedata.ColumnMetadata.PROJECTION);
        var dateFormat = column.getMetadata(weavedata.ColumnMetadata.DATE_FORMAT);

        if (dataType === weavedata.DataType.DATE && dateFormat)
            dataType = dataType + '; ' + dateFormat;
        if (dataType === weavedata.DataType.GEOMETRY && projection)
            dataType = dataType + '; ' + projection;

        if (dataType && keyType)
            return weavecore.StandardLib.substitute("{0} ({1} -> {2})", title, keyType, dataType);
        if (keyType)
            return weaveore.StandardLib.substitute("{0} (Key Type: {1})", title, keyType);
        if (dataType)
            return weavecore.StandardLib.substitute("{0} (Data Type: {1})", title, dataType);

        return title;
    }

    /**
     * Temporary solution
     * @param column
     * @return
     */
    ColumnUtils.getDataSource = function (column) {
        var name;
        var nameMap = {};
        var cols;
        if (column instanceof weavedata.ReferencedColumn)
            cols = [column];
        else
            cols = WeaveAPI.SessionManager.getLinkableDescendants(column, weavedata.ReferencedColumn);
        for (var i = 0; i < cols.length; i++) {
            var col = cols[i];
            var source = col.getDataSource();
            var sourceOwner = WeaveAPI.SessionManager.getLinkableOwner(source);
            if (!sourceOwner)
                continue;
            name = sourceOwner.getName(source);
            nameMap[name] = true;
        }
        var names = [];
        for (name in nameMap)
            names.push(name);
        return names.join(', ');
    }

    /**
     * This function gets the keyType of a column, either from the metadata or from the actual keys.
     * @param column A column to get the keyType of.
     * @return The keyType of the column.
     */
    ColumnUtils.getKeyType = function (column) {
        // first try getting the keyType from the metadata.
        var keyType = column.getMetadata(weavedata.ColumnMetadata.KEY_TYPE);
        if (keyType === null || keyType === undefined) {
            // if metadata does not specify keyType, get it from the first key in the list of keys.
            var keys = column.keys;
            if (keys.length > 0)
                keyType = keys[0].keyType;
        }
        return keyType;
    }

    /**
     * This function gets the dataType of a column from its metadata.
     * @param column A column to get the dataType of.
     * @return The dataType of the column.
     */
    ColumnUtils.getDataType = function (column) {
        return column.getMetadata(weavedata.ColumnMetadata.DATA_TYPE);
    }

    /**
     * This function will use an attribute column to convert a number to a string.
     * @param column A column that may have a way to convert numeric values to string values.
     * @param number A Number to convert to a String.
     * @return A String representation of the number, or null if no specific string representation exists.
     */
    ColumnUtils.deriveStringFromNumber = function (column, number) {
        var pc = ColumnUtils.hack_findNonWrapperColumn(column);
        if (pc)
            return pc.deriveStringFromNumber(number);
        return null; // no specific string representation
    }

    ColumnUtils.hack_findNonWrapperColumn = function (column) {
        // try to find an internal IPrimitiveColumn
        while (column instanceof IColumnWrapper || column.getInternalColumn)
            column = column.getInternalColumn();
        return column;
    }

    ColumnUtils.hack_findInternalDynamicColumn = function (columnWrapper) {
        if (columnWrapper) {
            // temporary solution - find internal dynamic column
            while (true) {
                if (columnWrapper.getInternalColumn() instanceof DynamicColumn)
                    columnWrapper = columnWrapper.getInternalColumn();
                else if (columnWrapper.getInternalColumn() instanceof ExtendedDynamicColumn)
                    columnWrapper = columnWrapper.getInternalColumn().internalDynamicColumn;
                else
                    break;
            }
            if (columnWrapper instanceof weavedata.ExtendedDynamicColumn)
                columnWrapper = columnWrapper.internalDynamicColumn;
        }
        return columnWrapper;
    }

    /**
     * Gets an array of QKey objects from <code>column</code> which meet the criteria
     * <code>min &lt;= getNumber(column, key) &lt;= max</code>, where key is a <code>QKey</code>
     * in <code>column</code>.
     * @param min The minimum value for the keys
     * @param max The maximum value for the keys
     * @param inclusiveRange A boolean specifying whether the range includes the min and max values.
     * Default value is <code>true</code>.
     * @return An array QKey objects.
     */
    ColumnUtils.getQKeysInNumericRange = function (column, min, max, inclusiveRange) {
        //set default parameter values
        if (inclusiveRange === undefined) inclusiveRange = true;
        var result = [];
        var keys = column.keys;
        for (var i = 0; i < keys.length; i++) {
            var qkey = keys[i];
            var number = column.getValueFromKey(qkey, Number);
            var isInRange = false;
            if (inclusiveRange)
                isInRange = min <= number && number <= max;
            else
                isInRange = min < number && number < max;

            if (isInRange)
                result.push(qkey);
        }

        return result;
    }

    ColumnUtils.getQKeys = function (genericObjects) {
        return WeaveAPI.QKeyManager.convertToQKeys(genericObjects);
    }

    /**
     * Get the QKey corresponding to <code>object.keyType</code>
     * and <code>object.localName</code>.
     *
     * @param object An object with properties <code>keyType</code>
     * and <code>localName</code>.
     * @return An IQualifiedKey object.
     */
    ColumnUtils.getQKey = function (object) {
        if (object instanceof IQualifiedKey)
            return object;
        return WeaveAPI.QKeyManager.getQKey(object.keyType, object.localName);
    }

    /**
     * @param column A column to get a value from.
     * @param key A key in the given column to get the value for.
     * @return The Number corresponding to the given key.
     */
    ColumnUtils.getNumber = function (column, key) {
            var qkey = ColumnUtils.getQKey(key);
            if (column !== null && column !== undefined)
                return column.getValueFromKey(qkey, Number);
            return NaN;
        }
        /**
         * @param column A column to get a value from.
         * @param key A key in the given column to get the value for.
         * @return The String corresponding to the given key.
         */
    ColumnUtils.getString = function (column, key) {
            var qkey = ColumnUtils.getQKey(key);
            if (column !== null && column !== undefined)
                return column.getValueFromKey(qkey, String);
            return '';
        }
        /**
         * @param column A column to get a value from.
         * @param key A key in the given column to get the value for.
         * @return The Boolean corresponding to the given key.
         */
    ColumnUtils.getBoolean = function (column, key) {
            var qkey = ColumnUtils.getQKey(key);
            if (column !== null && column !== undefined)
                return weavecore.StandardLib.asBoolean(column.getValueFromKey(qkey, Number));
            return false;
        }
        /**
         * @param column A column to get a value from.
         * @param key A key in the given column to get the value for.
         * @return The Number corresponding to the given key, normalized to be between 0 and 1.
         */
    ColumnUtils.getNorm = function (column, key) {
        var qkey = ColumnUtils.getQKey(key);
        return WeaveAPI.StatisticsCache.getColumnStatistics(column).getNorm(qkey);
    }

    /**
     * @param geometryColumn A GeometryColumn which contains the geometry objects for the key.
     * @param key An object with <code>keyType</code> and <code>localName</code> properties.
     * @return An array of arrays of arrays of Points.
     * For example,
     * <code>result[0]</code> is type <code>Array of Array of Point</code>. <br>
     * <code>result[0][0]</code> is type <code>Array of Point</code> <br>
     * <code>result[0][0][0]</code> is a <code>Point</code>
     */
    ColumnUtils.getGeometry = function (geometryColumn, key) {
        /*var qkey = ColumnUtils.getQKey(key);
			var genGeoms = geometryColumn.getValueFromKey(qkey, Array);

			if (genGeoms === null || genGeoms === undefined)
				return null;

			var result = [];

			for (var iGenGeom; iGenGeom < genGeoms.length; ++iGenGeom)
			{
				var genGeom = genGeoms[iGenGeom];
				var simplifiedGeom:Vector.<Vector.<BLGNode>> = genGeom.getSimplifiedGeometry();
				var newSimplifiedGeom:Array = [];
				for (var iSimplifiedGeom:int; iSimplifiedGeom < simplifiedGeom.length; ++iSimplifiedGeom)
				{
					var nodeVector:Vector.<BLGNode> = simplifiedGeom[iSimplifiedGeom];
					var newNodeVector:Array = [];
					for (var iNode:int = 0; iNode < nodeVector.length; ++iNode)
					{
						var node:BLGNode = nodeVector[iNode];
						var point:Point = new Point(node.x, node.y);
						newNodeVector.push(point);
					}
					newSimplifiedGeom.push(newNodeVector);
				}
				result.push(newSimplifiedGeom);
			}*/

        return result;
    }


    ColumnUtils.test_getAllValues = function (column, dataType) {
        var t = getTimer();
        var keys = column.keys;
        var values = new Array(keys.length);
        for (var i in keys)
            values[i] = column.getValueFromKey(keys[i], dataType);
        //weaveTrace(getTimer()-t);
        return values;
    }

    /**
     * This function takes the common keys from a list of columns and generates a table of data values for each key from each specified column.
     * @param columns A list of IAttributeColumns to compute a join table from.
     * @param dataType The dataType parameter to pass to IAttributeColumn.getValueFromKey().
     * @param allowMissingData If this is set to true, then all keys will be included in the join result.  Otherwise, only the keys that have associated values will be included.
     * @param keyFilter Either an IKeyFilter or an Array of IQualifiedKey objects used to filter the results.
     * @return An Array of Arrays, the first being IQualifiedKeys and the rest being Arrays data values from the given columns that correspond to the IQualifiedKeys.
     */
    ColumnUtils.joinColumns = function (columns, dataType, allowMissingData, keyFilter) {
            //set default values for parameters
            if (dataType === undefined) dataType = null;
            if (allowMissingData === undefined) allowMissingData = false;
            if (keyFilter === undefined) keyFilter = null;

            var keys;
            var key;
            var column;
            // if no keys are specified, get the keys from the columns
            if (keyFilter.constructor === Array) {
                keys = keyFilter.concat(); // make a copy so we don't modify the original
            } else if (keyFilter instanceof weavedata.IKeySet) {
                keys = keyFilter.keys.concat(); // make a copy so we don't modify the original
            } else {
                // count the number of appearances of each key in each column
                var keyCounts = new Map();
                for (var i = 0; i < columns.length; i++) {
                    var keys = columns[i].keys;
                    for (var j = 0; j < keys.length; j++) {
                        var key = keys[j];
                        keyCounts.set(key, Number(keyCounts.get(key)) + 1);
                    }
                }


                // get a list of keys
                keys = [];
                var filter = keyFilter;
                for (var qkey of keyCounts.keys())
                    if (allowMissingData || keyCounts.get(qkey) === columns.length)
                        if (!filter || filter.containsKey(qkey))
                            keys.push(qkey);
            }
            // put the keys in the result
            var result = [keys];
            // get all the data values in the same order as the common keys
            for (var cIndex = 0; cIndex < columns.length; cIndex++) {
                column = columns[cIndex];

                var dt = dataType;
                if (!dt && column)
                    dt = weavedata.DataType.getClass(column.getMetadata(weavedata.ColumnMetadata.DATA_TYPE));

                var values = [];
                for (var kIndex = 0; kIndex < keys.length; kIndex++) {
                    var value = column ? column.getValueFromKey(keys[kIndex], dt) : undefined;
                    var isUndef = weavecore.StandardLib.isUndefined(value);
                    if (!allowMissingData && isUndef) {
                        // value is undefined, so remove this key and all associated data from the list
                        result.forEach(function (array) {
                            array.splice(kIndex, 1);
                        });
                        kIndex--; // avoid skipping the next key
                    } else if (isUndef)
                        values.push(undefined);
                    else
                        values.push(value);
                }
                result.push(values);
            }
            return result;
        }
        /**
         * This function takes an array of attribute columns, a set of keys, and the type of the columns
         * @param attrCols An array of IAttributeColumns or ILinkableHashMaps containing IAttributeColumns.
         * @param subset An IKeyFilter or IKeySet specifying which keys to include in the CSV output, or null to indicate all keys available in the Attributes.
         * @param dataType
         * @return A string containing a CSV-formatted table containing the attributes of the requested keys.
         */
    ColumnUtils.generateTableCSV = function (attrCols, subset, dataType) {
        // set default values for parameters
        if (subset === undefined) subset = null;
        if (dataType === undefined) dataType = null;

        weavedata.SecondaryKeyNumColumn.allKeysHack = true; // dimension slider hack

        var records = [];
        var columnLookup = new Map();
        attrCols = attrCols.map(function (item, i, a) {
            return item instanceof weavecore.LinkableHashMap ? item.getObjects(weavedata.AttributeColumn) : item;
        });
        attrCols = weavedata.VectorUtils.flatten(attrCols);
        attrCols = attrCols.map(function (column, i, a) {
            return ColumnUtils.hack_findNonWrapperColumn(column);
        }).filter(function (column, i, a) {
            if (!column || columnLookup.get(column))
                return false;
            columnLookup.set(column, true);
            return true;
        });
        var columnTitles = attrCols.map(function (column, i, a) {
            return ColumnUtils.getTitle(column);
        });
        var keys;
        if (!subset)
            keys = ColumnUtils.getAllKeys(attrCols);
        else
            keys = ColumnUtils.getAllKeys(attrCols).filter(function (key, idx, arr) {
                return subset.containsKey(key);
            });

        var keyTypeMap = {};
        // create the data for each column in each selected row
        keys.forEach(function (key) {
            var record = {};
            // each record has a property named after the keyType equal to the key value
            record[key.keyType] = key.localName;
            keyTypeMap[key.keyType] = true;

            for (var i = 0; i < attrCols.length; i++) {
                var col = attrCols[i];
                var dt = dataType || weavedata.DataType.getClass(col.getMetadata(weavedata.ColumnMetadata.DATA_TYPE));
                var value = col.getValueFromKey(key, dt);
                if (weavecore.StandardLib.isDefined(value))
                    record[columnTitles[i]] = value;
            }
            records.push(record);
        })

        // update the list of headers before generating the table
        for (var keyType in keyTypeMap)
            columnTitles.unshift(keyType);

        weavedata.SecondaryKeyNumColumn.allKeysHack = false; // dimension slider hack

        var rows = WeaveAPI.CSVParser.convertRecordsToRows(records, columnTitles);
        return WeaveAPI.CSVParser.createCSV(rows);
    }

    /**
     * This function will compute the union of a list of IKeySets.
     * @param inputKeySets An Array of IKeySets (can be IAttributeColumns).
     * @return The list of unique keys contained in all the inputKeySets.
     */
    ColumnUtils.getAllKeys = function (inputKeySets) {
        var lookup = new Map();
        var result = [];
        for (var i = 0; i < inputKeySets.length; i++) {
            var keys = inputKeySets[i].keys;
            for (var j = 0; j < keys.length; j++) {
                var key = keys[j];
                if (lookup[key] === undefined) {
                    lookup[key] = true;
                    result.push(key);
                }
            }
        }
        return result;
    }

    /**
     * This function will make sure the first IAttributeColumn in a linkable hash map is a DynamicColumn.
     */
    ColumnUtils.forceFirstColumnDynamic = function (columnHashMap) {
        var cols = columnHashMap.getObjects(weavedata.AttributeColumn);
        if (cols.length === 0) {
            // just create a new dynamic column
            columnHashMap.requestObject(null, weavedata.DynamicColumn, false);
        } else if (!cols[0]) {
            // don't run callbacks while we edit session state
            WeaveAPI.SessionManager.getCallbackCollection(columnHashMap).delayCallbacks();
            // remember the name order
            var names = columnHashMap.getNames();
            // remember the session state of the first column
            var state = columnHashMap.getSessionState();
            state.length = 1; // only keep first column
            // overwrite existing column, reusing the same name
            var newCol = columnHashMap.requestObject(names[0], weavedata.DynamicColumn, false);
            // copy the old col inside the new col
            newCol.setSessionState(state, true);
            // restore name order
            columnHashMap.setNameOrder(names);
            // done editing session state
            WeaveAPI.SessionManager.getCallbackCollection(columnHashMap).resumeCallbacks();
        }
    }

    /**
     * Retrieves a metadata value from a list of columns if they all share the same value.
     * @param columns The columns.
     * @param propertyName The metadata property name.
     * @return The metadata value if it is the same across all columns, or null if not.
     */
    ColumnUtils.getCommonMetadata = function (columns, propertyName) {
        var value;
        for (var i = 0; i < columns.length; i++) {
            var column = columns[i];
            if (i === 0)
                value = column.getMetadata(propertyName);
            else if (value != column.getMetadata(propertyName))
                return null;
        }
        return value;
    }

    ColumnUtils.getAllCommonMetadata = function (columns) {
        var output = {};
        if (!columns.length)
            return output;
        // We only need to get property names from the first column
        // because we only care about metadata common to all columns.
        for (var key in columns[0].getMetadataPropertyNames()) {
            var value = getCommonMetadata(columns, key);
            if (value)
                output[key] = value;
        }
        return output;
    }

    Object.defineProperty(ColumnUtils, "_preferredMetadataPropertyOrder", {
        value: 'title,keyType,dataType,number,string,min,max,year'.split(',')
    });
    ColumnUtils.sortMetadataPropertyNames = function (names) {
        weavecore.StandardLib.sortOn(names, [ColumnUtils._preferredMetadataPropertyOrder.indexOf, names]);
    }

    /**
     * This will initialize selectable attributes using a list of columns and/or column references.
     * @param selectableAttributes An Array of IColumnWrapper and/or ILinkableHashMaps to initialize.
     * @param input An Array of IAttributeColumn and/or IColumnReference objects. If not specified, getColumnsWithCommonKeyType() will be used.
     * @see #getColumnsWithCommonKeyType()
     */
    ColumnUtils.initSelectableAttributes = function (selectableAttributes, input) {
        if (input === undefined) input = null;
        if (!input)
            input = ColumnUtils.getColumnsWithCommonKeyType();

        for (var i = 0; i < selectableAttributes.length; i++)
            ColumnUtils.initSelectableAttribute(selectableAttributes[i], input[i % input.length]);
    }

    /**
     * Gets a list of columns with a common keyType.
     */
    ColumnUtils.getColumnsWithCommonKeyType = function (keyType) {
        // set default values for parameters
        if (keyType === undefined) keyType = null;
        var columns = WeaveAPI.SessionManager.getLinkableDescendants(WeaveAPI.globalHashMap, weavedata.ReferencedColumn);

        // if keyType not specified, find the most common keyType
        if (!keyType) {
            var keyTypeCounts = new Object();
            for (var column in columns)
                keyTypeCounts[ColumnUtils.getKeyType(column)] = keyTypeCounts[ColumnUtils.getKeyType(column)] + 1;
            var count = 0;
            for (var kt in keyTypeCounts)
                if (keyTypeCounts[kt] > count)
                    count = keyTypeCounts[keyType = kt];
        }

        // remove columns not of the selected key type
        var n = 0;
        for (var i = 0; i < columns.length; i++)
            if (ColumnUtils.getKeyType(columns[i]) === keyType)
                columns[n++] = columns[i];
        columns.length = n;

        return columns;
    }

    /**
     * This will initialize one selectable attribute using a column or column reference.
     * @param selectableAttribute A selectable attribute (IColumnWrapper/ILinkableHashMap/ReferencedColumn)
     * @param column_or_columnReference Either an IAttributeColumn or an ILinkableHashMap
     * @param clearHashMap If the selectableAttribute is an ILinkableHashMap, all objects will be removed from it prior to adding a column.
     */
    ColumnUtils.initSelectableAttribute = function (selectableAttribute, column_or_columnReference, clearHashMap) {
        // set default values for parameter
        if (clearHashMap === undefined) clearHashMap = true;

        var inputCol = column_or_columnReference;
        var inputRef = column_or_columnReference;

        var outputRC = selectableAttribute;
        if (outputRC) {
            var inputRC;
            if (inputCol)
                inputRC = inputCol || WeaveAPI.SessionManager.getLinkableDescendants(inputCol, weavedata.ReferencedColumn)[0];

            if (inputRC)
                copySessionState(inputRC, outputRC);
            else if (inputRef)
                outputRC.setColumnReference(inputRef.getDataSource(), inputRef.getColumnMetadata());
            else
                outputRC.setColumnReference(null, null);
        }

        var outputDC = ColumnUtils.hack_findInternalDynamicColumn(selectableAttribute);
        if (outputDC && outputDC.getInternalColumn() === null) {
            if (inputCol) {
                if (inputCol instanceof DynamicColumn)
                    WeaveAPI.SessionManager.copySessionState(inputCol, outputDC);
                else
                    outputDC.requestLocalObjectCopy(inputCol);
            } else if (inputRef)
                weavedata.ReferencedColumn(
                    outputDC.requestLocalObject(ReferencedColumn, false)).setColumnReference(
                    inputRef.getDataSource(),
                    inputRef.getColumnMetadata());
            else
                outputDC.removeObject();
        }

        var outputHash = selectableAttribute;
        if (outputHash) {
            if (clearHashMap)
                outputHash.removeAllObjects()
            if (inputCol)
                outputHash.requestObjectCopy(null, inputCol);
            else if (inputRef)
                weavedata.ReferencedColumn(
                    outputHash.requestObject(null, ReferencedColumn, false)).setColumnReference(
                    inputRef.getDataSource(),
                    inputRef.getColumnMetadata());
        }
    }


    if (typeof exports !== 'undefined') {
        module.exports = ColumnUtils;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.ColumnUtils = ColumnUtils;
    }

    //todo: (cached) get sorted index from a key and a column

    //todo: (cached) get bins from a column with a filter applied
}());
