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

(function () {
    function EquationColumnLib() {

    }


    EquationColumnLib.cast = function (value, newType) {
        if (newType == null)
            return value;

        // if newType is a qualified class name, get the Class definition
        /*if (newType instanceof String)
    newType = ClassUtils.getClassDefinition(newType);*/

        // cast the value as the desired type
        if (newType === Number) {
            value = weavecore.StandardLib.asNumber(value);
            if (isNaN(value))
                return NaN;
        } else if (newType === String) {
            value = weavecore.StandardLib.asString(value);
        } else if (newType === Boolean) {
            value = weavecore.StandardLib.asBoolean(value);
        }

        return value;
    }

    if (typeof exports !== 'undefined') {
        module.exports = EquationColumnLib;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.EquationColumnLib = EquationColumnLib;
    }

}());

(function () {
    function HierarchyUtils() {

    }

    /**
     * Finds a series of IWeaveTreeNode objects which can be traversed as a path to a descendant node.
     * @param root The root IWeaveTreeNode.
     * @param descendant The descendant IWeaveTreeNode.
     * @return An Array of IWeaveTreeNode objects which can be followed as a path from the root to the descendant, including the root and descendant nodes.
     *         The last item in the path may be the equivalent node found in the hierarchy rather than the descendant node that was passed in.
     *         Returns null if the descendant is unreachable from this node.
     * @see weave.api.data.IWeaveTreeNode#equals()
     */
    HierarchyUtils.findPathToNode = function (root, descendant) {
        if (!root || !descendant)
            return null;

        if (root.findPathToNode)
            return root.findPathToNode(descendant);

        if (root.equals(descendant))
            return [root];

        var children = root.getChildren();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];

            var path = HierarchyUtils.findPathToNode(child, descendant);
            if (path) {
                path.unshift(root);
                return path;
            }
        }

        return null;
    }


    if (typeof exports !== 'undefined') {
        module.exports = HierarchyUtils;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.HierarchyUtils = HierarchyUtils;
    }

}());

/**
 * This class contains static functions that manipulate Vectors and Arrays.
 * Functions with * as parameter types support both Vector and Array.
 * Vector.&lt;*&rt; is not used because it causes compiler errors.
 *
 * @author adufilie
 * @author sanjay1909
 */
(function () {

    function VectorUtils() {

    }

    VectorUtils._lookup = new Map();
    VectorUtils._lookupId = 0;

    /**
     * Computes the union of the items in a list of Arrays. Can also be used to get a list of unique items in an Array.
     * @param arrays A list of Arrays.
     * @return The union of all the unique items in the Arrays in the order they appear.
     */
    VectorUtils.union = function () {
        var arrays = arguments;
        var result = [];
        VectorUtils._lookupId++;
        for (var array in arrays) {
            for (var item in array) {
                if (VectorUtils._lookup[item] !== VectorUtils._lookupId) {
                    VectorUtils._lookup[item] = VectorUtils._lookupId;
                    result.push(item);
                }
            }
        }
        return result;
    }


    /**
     * Computes the intersection of the items in a list of two or more Arrays.
     * @param arrays A list of Arrays.
     * @return The intersection of the items appearing in all Arrays, in the order that they appear in the first Array.
     */
    VectorUtils.intersection = function (firtArray, secondArray) {
        var moreArrays = arguments.splice(0, 2);

        moreArrays.unshift(secondArray);

        var result = [];
        var item;
        var lastArray = moreArrays.pop();

        VectorUtils._lookupId++;
        for (item in lastArray)
            VectorUtils._lookup[item] = VectorUtils._lookupId;

        for (var array in moreArrays) {
            for (item in array)
                if (VectorUtils._lookup[item] === VectorUtils._lookupId)
                    VectorUtils._lookup[item] = VectorUtils._lookupId + 1;
            VectorUtils._lookupId++;
        }

        for (item in firstArray)
            if (VectorUtils._lookup[item] === VectorUtils._lookupId)
                result.push(item);

        return result;
    }

    /**
     * This function copies the contents of the source to the destination.
     * Either parameter may be either an Array or a Vector.
     * @param source An Array-like object.
     * @param destination An Array or Vector.
     * @return A pointer to the destination Array (or Vector)
     */
    VectorUtils.copy = function (source, destination) {
            if (destination === undefined) destination = null;
            if (!destination)
                destination = [];
            destination.length = source.length;
            for (var i in source)
                destination[i] = source[i];
            return destination;
        }
        /**
         * Fills a hash map with the keys from an Array.
         */
    VectorUtils.fillKeys = function (output, keys) {
            for (var key in keys)
                output[key] = true;
        }
        /**
         * Gets all keys in a hash map.
         */
    VectorUtils.getKeys = function (hashMap) {
        var keys = [];
        for (var key in hashMap)
            keys.push(key);
        return keys;
    }

    /**
     * If there are any properties of the hashMap, return false; else, return true.
     * @param hashMap The Object to test for emptiness.
     * @return A boolean which is true if the Object is empty, false if it has at least one property.
     */
    VectorUtils.isEmpty = function (hashMap) {
        for (var key in hashMap)
            return false;
        return true;
    }

    /**
     * Efficiently removes duplicate adjacent items in a pre-sorted Array (or Vector).
     * @param vector The sorted Array (or Vector)
     */
    VectorUtils.removeDuplicatesFromSortedArray = function (sorted) {
            var n = sorted.length;
            if (n === 0)
                return;
            var write = 0;
            var prev = sorted[0] === undefined ? null : undefined;
            for (var read = 0; read < n; ++read) {
                var item = sorted[read];
                if (item !== prev)
                    sorted[write++] = prev = item;
            }
            sorted.length = write;
        }
        /**
         * randomizes the order of the elements in the vector in O(n) time by modifying the given array.
         * @param the vector to randomize
         */
    VectorUtils.randomSort = function (vector) {
        var i = vector.length;
        while (i) {
            // randomly choose index j
            var j = Math.floor(Math.random() * i--);
            // swap elements i and j
            var temp = vector[i];
            vector[i] = vector[j];
            vector[j] = temp;
        }
    }

    /**
     * See http://en.wikipedia.org/wiki/Quick_select#Partition-based_general_selection_algorithm
     * @param list An Array or Vector to be re-organized
     * @param firstIndex The index of the first element in the list to partition.
     * @param lastIndex The index of the last element in the list to partition.
     * @param pivotIndex The index of an element to use as a pivot when partitioning.
     * @param compareFunction A function that takes two array elements a,b and returns -1 if a&lt;b, 1 if a&gt;b, or 0 if a==b.
     * @return The index the pivot element was moved to during the execution of the function.
     */
    VectorUtils.partition = function (list, firstIndex, lastIndex, pivotIndex, compareFunction) {
        var temp;
        var pivotValue = list[pivotIndex];
        // Move pivot to end
        temp = list[pivotIndex];
        list[pivotIndex] = list[lastIndex];
        list[lastIndex] = temp;

        var storeIndex = firstIndex;
        for (var i = firstIndex; i < lastIndex; i++) {
            if (compareFunction(list[i], pivotValue) < 0) {
                if (storeIndex != i) {
                    // swap elements at storeIndex and i
                    temp = list[storeIndex];
                    list[storeIndex] = list[i];
                    list[i] = temp;
                }

                storeIndex++;
            }
        }
        if (storeIndex != lastIndex) {
            // Move pivot to its final place
            temp = list[storeIndex];
            list[storeIndex] = list[lastIndex];
            list[lastIndex] = temp;
        }
        // everything to the left of storeIndex is < pivot element
        // everything to the right of storeIndex is >= pivot element
        return storeIndex;
    }

    //testPartition()
    VectorUtils.testPartition = function () {
        var list = [3, 7, 5, 8, 2];
        var pivotIndex = VectorUtils.partition(list, 0, list.length - 1, list.length / 2, weavedata.AsyncSort.primitiveCompare);

        for (var i = 0; i < list.length; i++)
            if (i < pivotIndex != list[i] < list[pivotIndex])
                throw new Error('assertion fail');
    }

    /**
     * See http://en.wikipedia.org/wiki/Quick_select#Partition-based_general_selection_algorithm
     * @param list An Array or Vector to be re-organized.
     * @param compareFunction A function that takes two array elements a,b and returns -1 if a&lt;b, 1 if a&gt;b, or 0 if a==b.
     * @param firstIndex The index of the first element in the list to calculate a median from.
     * @param lastIndex The index of the last element in the list to calculate a median from.
     * @return The index the median element.
     */
    VectorUtils.getMedianIndex = function (list, compareFunction, firstIndex, lastIndex) {
        //set default parameter values
        if (firstIndex === undefined) firstIndex = 0;
        if (lastIndex === undefined) lastIndex = -1;

        var left = firstIndex;
        var right = (lastIndex >= 0) ? (lastIndex) : (list.length - 1);
        if (left >= right)
            return left;
        var medianIndex = (left + right) / 2;
        while (true) {
            var pivotIndex = VectorUtils.partition(list, left, right, (left + right) / 2, compareFunction);
            if (medianIndex === pivotIndex)
                return medianIndex;
            if (medianIndex < pivotIndex)
                right = pivotIndex - 1;
            else
                left = pivotIndex + 1;
        }
        return -1;
    }

    /**
     * Merges two previously-sorted arrays or vectors.
     * @param sortedInputA The first sorted array or vector.
     * @param sortedInputB The second sorted array or vector.
     * @param mergedOutput A vector or array to store the merged arrays or vectors.
     * @param comparator A function that takes two parameters and returns -1 if the first parameter is less than the second, 0 if equal, or 1 if the first is greater than the second.
     */
    VectorUtils.mergeSorted = function (sortedInputA, sortedInputB, mergedOutput, comparator) {
        var indexA = 0;
        var indexB = 0;
        var indexOut = 0;
        var lengthA = sortedInputA.length;
        var lengthB = sortedInputB.length;
        while (indexA < lengthA && indexB < lengthB)
            if (VectorUtils.comparator(sortedInputA[indexA], sortedInputB[indexB]) < 0)
                mergedOutput[indexOut++] = sortedInputA[indexA++];
            else
                mergedOutput[indexOut++] = sortedInputB[indexB++];

        while (indexA < lengthA)
            mergedOutput[indexOut++] = sortedInputA[indexA++];

        while (indexB < lengthB)
            mergedOutput[indexOut++] = sortedInputB[indexB++];

        mergedOutput.length = indexOut;
    }

    /**
     * This will flatten an Array of Arrays into a flat Array.
     * Items will be appended to the destination Array.
     * @param source A multi-dimensional Array to flatten.
     * @param destination An Array or Vector to append items to.  If none specified, a new one will be created.
     * @return The destination Array with all the nested items in the source appended to it.
     */
    VectorUtils.flatten = function (source, destination) {
        if (destination === null || destination === undefined)
            destination = [];
        if (source === null || source === undefined)
            return destination;

        for (var i = 0; i < source.length; i++)
            if (source[i].constructor === Array) // no vector in JS
                flatten(source[i], destination);
            else
                destination.push(source[i]);
        return destination;
    }

    VectorUtils.flattenObject = function (input, output, prefix) {
        if (prefix === undefined) prefix = '';
        if (output === null || output === undefined)
            output = {};
        if (input === null || input === undefined)
            return output;

        for (var key in input)
            if (typeof input[key] === 'object')
                flattenObject(input[key], output, prefix + key + '.');
            else
                output[prefix + key] = input[key];
        return output;
    }

    /**
     * This will take an Array of Arrays of String items and produce a single list of String-joined items.
     * @param arrayOfArrays An Array of Arrays of String items.
     * @param separator The separator String used between joined items.
     * @param includeEmptyItems Set this to true to include empty-strings and undefined items in the nested Arrays.
     * @return An Array of String-joined items in the same order they appear in the nested Arrays.
     */
    VectorUtils.joinItems = function (arrayOfArrays, separator, includeEmptyItems) {
        var maxLength = 0;
        var itemList;
        for (itemList in arrayOfArrays)
            maxLength = Math.max(maxLength, itemList.length);

        var result = [];
        for (var itemIndex = 0; itemIndex < maxLength; itemIndex++) {
            var joinedItem = [];
            for (var listIndex = 0; listIndex < arrayOfArrays.length; listIndex++) {
                itemList = arrayOfArrays[listIndex];
                var item = '';
                if (itemList && itemIndex < itemList.length)
                    item = itemList[itemIndex] || '';
                if (item || includeEmptyItems)
                    joinedItem.push(item);
            }
            result.push(joinedItem.join(separator));
        }
        return result;
    }

    /**
     * Performs a binary search on a sorted array with no duplicate values.
     * @param sortedUniqueValues Array or Vector of Numbers or Strings
     * @param compare A compare function
     * @param exactMatchOnly If true, searches for exact match. If false, searches for insertion point.
     * @return The index of the matching value or insertion point.
     */
    VectorUtils.binarySearch = function (sortedUniqueValues, item, exactMatchOnly, compare) {
        if (compare === undefined) compare = null;
        var i = 0,
            imin = 0,
            imax = sortedUniqueValues.length - 1;
        while (imin <= imax) {
            i = (imin + imax) / 2;
            var a = sortedUniqueValues[i];
            var c = compare != null ? compare(item, a) : (item < a ? -1 : (item > a ? 1 : 0));
            if (c < 0)
                imax = i - 1;
            else if (c > 0)
                imin = ++i; // set i for possible insertion point
            else
                return i;
        }
        return exactMatchOnly ? -1 : i;
    }

    /**
     * Gets an Array of items from an ICollectionView.
     * @param collection The ICollectionView.
     * @param alwaysMakeCopy If set to false and the collection is an ArrayCollection, returns original source Array.
     */
    VectorUtils.getArrayFromCollection = function (collection, alwaysMakeCopy) {
        // set default values for parameters
        if (alwaysMakeCopy === undefined) alwaysMakeCopy = true;
        console.log('array collection not yet supported for weave');
        /*if (!collection || !collection.length)
				return [];

			var array:Array = null;
			if (collection is ArrayCollection && collection.filterFunction == null)
				array = (collection as ArrayCollection).source;
			if (array)
				return alwaysMakeCopy ? array.concat() : array;

			array = [];
			var cursor:IViewCursor = collection.createCursor();
			do
			{
				array.push(cursor.current);
			}
			while (cursor.moveNext());
			return array;*/
    }

    /**
     * Creates an object from arrays of keys and values.
     * @param keys Keys corresponding to the values.
     * @param values Values corresponding to the keys.
     * @return A new Object.
     */
    VectorUtils.zipObject = function (keys, values) {
        var n = Math.min(keys.length, values.length);
        var o = {};
        for (var i = 0; i < n; i++)
            o[keys[i]] = values[i];
        return o;
    }

    /**
     * This will get a subset of properties/items/attributes from an Object/Array/XML.
     * @param object An Object/Array/XML containing properties/items/attributes to retrieve.
     * @param keys A list of property names, index values, or attribute names.
     * @param output Optionally specifies where to store the resulting items.
     * @return An Object (or Array) containing the properties/items/attributes specified by keysOrIndices.
     */
    VectorUtils.getItems = function (object, keys, output) {
        if (output === null || output === undefined)
            output = object.constructor === Array ? [] : {};
        if (!object)
            return output;
        for (var keyIndex in keys) {
            var keyValue = keys[keyIndex];

            var item;
            /*if (object is XML_Class)
					item = String((object as XML_Class).attribute(keyValue));
				else*/
            item = object[keyValue];

            if (output.constructor === Array)
                output[keyIndex] = item;
            else
                output[keyValue] = item;
        }
        return output;
    }

    /**
     * Removes items from an Array or Vector.
     * @param array Array or Vector
     * @param indices Array of indices to remove
     */
    VectorUtils.removeItems = function (array, indices) {
        var n = array.length;
        /*var skipList:Vector.<int> = Vector.<int>(indices).sort(Array.NUMERIC);
			skipList.push(n);
			VectorUtils.removeDuplicatesFromSortedArray(skipList);

			var iSkip = 0;
			var skip = skipList[0];
			var write = skip;
			for (var read = skip; read < n; ++read)
			{
				if (read === skip)
					skip = skipList[++iSkip];
				else
					array[write++] = array[read];
			}
			array.length = write;*/
        console.log("Sanjay - Need to add alterantive for vector usage");
    }

    VectorUtils._pluckProperty;

    /**
     * Gets a list of values of a property from a list of objects.
     * @param array An Array or Vector of Objects.
     * @param property The property name to get from each object
     * @return A list of the values of the specified property for each object in the original list.
     */
    VectorUtils.pluck = function (array, property) {
        _pluckProperty = property;
        return array.map(_pluck);
    }


    VectorUtils._pluck = function (item, i, a) {
        return item[_pluckProperty];
    }

    /**
     * Creates a lookup from item (or item property) to index. Does not consider duplicate items (or item property values).
     * @param propertyChain A property name or chain of property names to index on rather than the item itself.
     * @return A reverse lookup.
     */
    VectorUtils.createLookup = function (array) {
        var propertyChain = arguments.splice(0, 1);
        var lookup = new Map();
        for (var key in array) {
            var value = array[key];
            for (var prop in propertyChain)
                value = value[prop];
            lookup[value] = key;
        }
        return lookup;
    }

    if (typeof exports !== 'undefined') {
        module.exports = VectorUtils;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.VectorUtils = VectorUtils;
    }
}());

(function () {
    function Aggregation() {

    }


    Aggregation.ALL_TYPES = [Aggregation.SAME, Aggregation.FIRST, Aggregation.LAST, Aggregation.MEAN, Aggregation.SUM, Aggregation.MIN, Aggregation.MAX, Aggregation.COUNT];

    Aggregation.SAME = "same";
    Aggregation.FIRST = "first";
    Aggregation.LAST = "last";

    Aggregation.MEAN = "mean";
    Aggregation.SUM = "sum";
    Aggregation.MIN = "min";
    Aggregation.MAX = "max";
    Aggregation.COUNT = "count";

    /**
     * The default aggregation mode.
     */
    Aggregation.DEFAULT = Aggregation.SAME;

    /**
     * Maps an aggregation method to a short description of its behavior.
     */
    Aggregation.HELP = {
        'same': 'Keep the value only if it is the same for each record in the group.',
        'first': 'Use the first of a group of values.',
        'last': 'Use the last of a group of values.',
        'mean': 'Calculate the mean (average) from a group of numeric values.',
        'sum': 'Calculate the sum (total) from a group of numeric values.',
        'min': 'Use the minimum of a group of numeric values.',
        'max': 'Use the maximum of a group of numeric values.',
        'count': 'Count the number of values in a group.'
    };


    if (typeof exports !== 'undefined') {
        module.exports = Aggregation;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.Aggregation = Aggregation;
    }

}());

(function () {
    /**
     * This is an all-static class containing numerical statistics on columns and functions to access the statistics.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function StatisticsCache() {
        Object.defineProperty(this, '_columnToStats', {
            value: new Map()
        });
    }

    var p = StatisticsCache.prototype;

    /**
     * @param column A column to get statistics for.
     * @return A Dictionary that maps a IQualifiedKey to a running total numeric value, based on the order of the keys in the column.
     */
    p.getRunningTotals = function (column) {
        return (this.getColumnStatistics(column)).getRunningTotals();
    }



    p.getColumnStatistics = function (column) {
        if (column === null)
            throw new Error("getColumnStatistics(): Column parameter cannot be null.");

        if (WeaveAPI.SessionManager.objectWasDisposed(column)) {
            this._columnToStats.delete(column);
            throw new Error("Invalid attempt to retrieve statistics for a disposed column.");
        }

        var stats = (this._columnToStats.get(column) && this._columnToStats.get(column) instanceof weavedata.ColumnStatistics) ? this._columnToStats.get(column) : null;
        if (!stats) {
            stats = new weavedata.ColumnStatistics(column);

            // when the column is disposed, the stats should be disposed
            this._columnToStats.set(column, WeaveAPI.SessionManager.registerDisposableChild(column, stats));
        }
        return stats;
    }

    if (typeof exports !== 'undefined') {
        module.exports = ColumnStatistics;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.StatisticsCache = StatisticsCache;
        window.WeaveAPI = window.WeaveAPI ? window.WeaveAPI : {};
        window.WeaveAPI.StatisticsCache = new StatisticsCache();
    }

}());


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
    Object.defineProperty(ColumnStatistics, 'NS', {
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
    Object.defineProperty(ColumnStatistics, 'CLASS_NAME', {
        value: 'ColumnStatistics'
    });


    function ColumnStatistics(column) {
        weavecore.ILinkableObject.call(this);

        this.prevTriggerCounter = 0;

        //Private
        /**
         * This maps a stats function of this object to a cached value for the function.
         * Example: cache[getMin] is a cached value for the getMin function.
         */
        Object.defineProperty(this, '_cache', {
            value: new Map()
        });
        this._busy = false;

        this._column = column;
        column.addImmediateCallback(this, WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks, false, true);

        this._i;
        this._keys;
        this._min;
        this._max;
        this._count;
        this._sum;
        this._squareSum;
        this._mean;
        this._variance;
        this._standardDeviation;

        //TODO - make runningTotals use sorted order instead of original key order
        this._runningTotals;

        this._outKeys;
        this._outNumbers;
        this._sortIndex; // IQualifiedKey -> int
        this._hack_numericData; // IQualifiedKey -> Number
        this._median;
    }


    /**
     * This function will validate the cached statistical values for the given column.
     * @param statsFunction The function we are interested in calling.
     * @return The cached result for the statsFunction.
     */
    function validateCache(statsFunction) {
        // the cache becomes invalid when the trigger counter has changed
        if (this.prevTriggerCounter !== this._column.triggerCounter) {
            // statistics are undefined while column is busy
            this._busy = WeaveAPI.SessionManager.linkableObjectIsBusy(this._column);

            // once we have determined the column is not busy, begin the async task to calculate stats
            if (!this._busy)
                asyncStart.call(this);
        }
        return this._cache.get(statsFunction);
    }



    function asyncStart() {
        // remember the trigger counter from when we begin calculating
        this.prevTriggerCounter = this._column.triggerCounter;
        this._i = 0;
        this._keys = this._column.keys;
        this._min = Infinity; // so first value < min
        this._max = -Infinity; // so first value > max
        this._count = 0;
        this._sum = 0;
        this._squareSum = 0;
        this._mean = NaN;
        this._variance = NaN;
        this._standardDeviation = NaN;

        this._outKeys = [];
        this._outKeys.length = this._keys.length;
        this._outNumbers = [];
        this._outNumbers.length = this._keys.length
        this._sortIndex = new Map();
        this._hack_numericData = new Map();
        this._median = NaN;

        this._runningTotals = new Map();

        // high priority because preparing data is often a prerequisite for other things
        WeaveAPI.StageUtils.startTask(this, iterate.bind(this), WeaveAPI.TASK_PRIORITY_HIGH, asyncComplete.bind(this), weavecore.StandardLib.substitute("Calculating statistics for {0} values in {1}", this._keys.length, WeaveAPI.debugId(this._column)));
    }

    function iterate(stopTime) {
        // when the column is found to be busy or modified since last time, stop immediately
        if (this._busy || this.prevTriggerCounter !== this._column.triggerCounter) {
            // make sure trigger counter is reset because cache is now invalid
            this.prevTriggerCounter = 0;
            return 1;
        }

        for (; this._i < this._keys.length; ++this._i) {
            if (getTimer() > stopTime)
                return this._i / this._keys.length;

            // iterate on this key
            var key = (this._keys[this._i] && this._keys[this._i] instanceof weavedata.IQualifiedKey) ? this._keys[this._i] : null;
            var value = this._column.getValueFromKey(key, Number);
            // skip keys that do not have an associated numeric value in the column.
            if (isFinite(value)) {
                this._sum += value;
                this._squareSum += value * value;

                if (value < this._min)
                    this._min = value;
                if (value > this._max)
                    this._max = value;

                //TODO - make runningTotals use sorted order instead of original key order
                this._runningTotals.set(key, this._sum);

                this._hack_numericData.set(key, value);
                this._outKeys[this._count] = key;
                this._outNumbers[this._count] = value;
                ++this._count;
            }
        }
        return 1;
    }

    function getTimer() {
        return new Date().getTime();
    }

    function asyncComplete() {
        if (this._busy) {
            WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
            return;
        }

        if (this._count === 0)
            this._min = this._max = NaN;
        this._mean = this._sum / this._count;
        this._variance = this._squareSum / this._count - this._mean * this._mean;
        this._standardDeviation = Math.sqrt(this._variance);

        this._outKeys.length = this._count;
        this._outNumbers.length = this._count;
        var qkm = WeaveAPI.QKeyManager;
        var outIndices = weavecore.StandardLib.sortOn(this._outKeys, [this._outNumbers, qkm.keyTypeLookup, qkm.localNameLookup], null, false, true);
        this._median = this._outNumbers[outIndices[Number(this._count / 2)]];
        this._i = this._count;
        while (--this._i >= 0)
            this._sortIndex.set(this._outKeys[outIndices[this._i]], this._i);

        // BEGIN code to get custom min,max
        var tempNumber;
        try {
            tempNumber = weavecore.StandardLib.asNumber(this._column.getMetadata(weavedata.ColumnMetadata.MIN));
            if (isFinite(tempNumber))
                this._min = tempNumber;
        } catch (e) {}
        try {
            tempNumber = weavecore.StandardLib.asNumber(this._column.getMetadata(weavedata.ColumnMetadata.MAX));
            if (isFinite(tempNumber))
                this._max = tempNumber;
        } catch (e) {}
        // END code to get custom min,max

        // save the statistics for this column in the cache
        this._cache.set(this.getMin, this._min);
        this._cache.set(this.getMax, this._max);
        this._cache.set(this.getCount, this._count);
        this._cache.set(this.getSum, this._sum);
        this._cache.set(this.getSquareSum, this._squareSum);
        this._cache.set(this.getMean, this._mean);
        this._cache.set(this.getVariance, this._variance);
        this._cache.set(this.getStandardDeviation, this._standardDeviation);
        this._cache.set(this.getMedian, this._median);
        this._cache.set(this.getSortIndex, this._sortIndex);
        this._cache.set(this.hack_getNumericData, this._hack_numericData);
        this._cache.set(this.getRunningTotals, this._runningTotals);

        //trace('stats calculated', debugId(this), debugId(column), String(column));

        // trigger callbacks when we are done
        WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
    }

    ColumnStatistics.prototype = new weavecore.ILinkableObject();
    ColumnStatistics.prototype.constructor = ColumnStatistics;
    var p = ColumnStatistics.prototype;


    /**
     * @inheritDoc
     */
    p.getNorm = function (key) {
        var min = validateCache.call(this, this.getMin);
        var max = validateCache.call(this, getMax);
        var numericData = validateCache.call(this, this.hack_getNumericData.bind(this));
        var value = numericData ? numericData[key] : NaN;
        return (value - min) / (max - min);
    }

    /**
     * @inheritDoc
     */
    p.getMin = function () {
        return validateCache.call(this, this.getMin.bind(this));
    }

    /**
     * @inheritDoc
     */
    p.getMax = function () {
        return validateCache.call(this, this.getMax.bind(this));
    }

    /**
     * @inheritDoc
     */
    p.getCount = function () {
        return validateCache.call(this, this.getCount.bind(this));
    }

    /**
     * @inheritDoc
     */
    p.getSum = function () {
        return validateCache.call(this, this.getSum.bind(this));
    }

    /**
     * @inheritDoc
     */
    p.getSquareSum = function () {
        return validateCache.call(this, this.getSquareSum.bind(this));
    }

    /**
     * @inheritDoc
     */
    p.getMean = function () {
        return validateCache.call(this, this.getMean.bind(this));
    }

    /**
     * @inheritDoc
     */
    p.getVariance = function () {
        return validateCache.call(this, this.getVariance.bind(this));
    }

    /**
     * @inheritDoc
     */
    p.getStandardDeviation = function () {
        return validateCache.call(this, this.getStandardDeviation.bind(this));
    }

    /**
     * @inheritDoc
     */
    p.getMedian = function () {
        return validateCache.call(this, this.getMedian.bind(this));
    }

    /**
     * @inheritDoc
     */
    p.getSortIndex = function () {
        return validateCache.call(this, this.getSortIndex.bind(this));
    }

    /**
     * @inheritDoc
     */
    p.hack_getNumericData = function () {
        return validateCache.call(this, this.hack_getNumericData.bind(this));
    }

    /**
     * Gets a Dictionary that maps a IQualifiedKey to a running total numeric value, based on the order of the keys in the column.
     */
    p.getRunningTotals = function () {
        return validateCache.call(this, this.getRunningTotals.bind(this));
    }

    if (typeof exports !== 'undefined') {
        module.exports = ColumnStatistics;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.ColumnStatistics = ColumnStatistics;
    }

    weavecore.ClassUtils.registerClass('weavedata.ColumnStatistics', weavedata.ColumnStatistics);

}());
(function () {

    AttributeColumnCache._globalColumnDataSource;

    Object.defineProperty(AttributeColumnCache, 'globalColumnDataSource', {
        get: function () {
            if (!AttributeColumnCache._globalColumnDataSource)
                AttributeColumnCache._globalColumnDataSource = new weavedata.GlobalColumnDataSource();
            return AttributeColumnCache._globalColumnDataSource;
        }
    });

    function AttributeColumnCache() {
        Object.defineProperty(this, 'd2d_dataSource_metadataHash', {
            value: new weavecore.Dictionary2D(true, true)
        });
    }

    var p = AttributeColumnCache.prototype;

    /**
     * @inheritDoc
     */
    p.getColumn = function (dataSource, metadata) {
        // null means no column
        if (metadata === null)
            return null;

        // special case - if dataSource is null, use WeaveAPI.globalHashMap
        if (dataSource === null)
            return AttributeColumnCache.globalColumnDataSource.getAttributeColumn(metadata);

        // Get the column pointer associated with the hash value.
        var hashCode = weavecore.Compiler.stringify(metadata);
        var wr = this.d2d_dataSource_metadataHash.get(dataSource, hashCode);
        var weakRef = (wr && wr instanceof weavecore.WeakReference) ? wr : null;
        if (weakRef !== null && weakRef.value !== null) {
            if (WeaveAPI.SessionManager.objectWasDisposed(weakRef.value))
                this.d2d_dataSource_metadataHash.remove(dataSource, hashCode);
            else
                return weakRef.value;
        }

        // If no column is associated with this hash value, request the
        // column from its data source and save the column pointer.
        var column = dataSource.getAttributeColumn(metadata);
        this.d2d_dataSource_metadataHash.set(dataSource, hashCode, new weavecore.WeakReference(column));

        return column;
    }


    if (typeof exports !== 'undefined') {
        module.exports = AttributeColumnCache;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.AttributeColumnCache = AttributeColumnCache;
        window.WeaveAPI = window.WeaveAPI ? window.WeaveAPI : {};
        window.WeaveAPI.AttributeColumnCache = new AttributeColumnCache();
    }


}());


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
    Object.defineProperty(GlobalColumnDataSource, 'NS', {
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
    Object.defineProperty(GlobalColumnDataSource, 'CLASS_NAME', {
        value: 'GlobalColumnDataSource'
    });

    /**
     * The metadata property name used to identify a column appearing in WeaveAPI.globalHashMap.
     */
    Object.defineProperty(GlobalColumnDataSource, 'NAME', {
        value: 'name'
    });



    /**
     * This is an interface to an object that decides which IQualifiedKey objects are included in a set or not.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function GlobalColumnDataSource() {
        weavecore.ILinkableObject.call(this);
        Object.defineProperty(this, 'hierarchyRefresh', {
            value: WeaveAPI.SessionManager.getCallbackCollection(this)
        });
        WeaveAPI.SessionManager.registerLinkableChild(this, WeaveAPI.globalHashMap.childListCallbacks);

        var source = this;
        this._rootNode = new weavedata.ColumnTreeNode({
            dataSource: source,
            label: function () {
                return WeaveAPI.globalHashMap.getObjects(CSVColumn).length ? 'Generated columns' : 'Equations';
            },
            hasChildBranches: false,
            children: function () {
                return getGlobalColumns().map(function (column) {
                    WeaveAPI.SessionManager.registerLinkableChild(source, column);
                    return createColumnNode(WeaveAPI.globalHashMap.getName(column));
                });
            }
        });
    }

    function getGlobalColumns() {
        var csvColumns = WeaveAPI.globalHashMap.getObjects(CSVColumn);
        var equationColumns = WeaveAPI.globalHashMap.getObjects(EquationColumn);
        return equationColumns.concat(csvColumns);
    }

    function createColumnNode(name) {
        var column = this.getAttributeColumn(name);
        if (!column)
            return null;

        var meta = {};
        meta[GlobalColumnDataSource.NAME] = name;
        return new weavedata.ColumnTreeNode({
            dataSource: this,
            dependency: column,
            label: function () {
                return column.getMetadata(weavedata.ColumnMetadata.TITLE);
            },
            data: meta,
            idFields: [GlobalColumnDataSource.NAME]
        });
    }

    GlobalColumnDataSource.prototype = new weavecore.ILinkableObject();
    GlobalColumnDataSource.prototype.constructor = GlobalColumnDataSource;
    var p = GlobalColumnDataSource.prototype;


    p.getHierarchyRoot = function () {
        return this._rootNode;
    }

    p.findHierarchyNode = function (metadata) {
        var column = this.getAttributeColumn(metadata);
        if (!column)
            return null;
        var name = WeaveAPI.globalHashMap.getName(column);
        var node = createColumnNode.call(this, name);
        var path = this._rootNode.findPathToNode(node);
        if (path)
            return path[path.length - 1];
        return null;
    }

    p.getAttributeColumn = function (metadata) {
        if (!metadata)
            return null;
        var name;
        if (typeof metadata === 'object')
            name = metadata[GlobalColumnDataSource.NAME];
        else
            name = metadata;
        return WeaveAPI.globalHashMap.getObject(name);
    }



    if (typeof exports !== 'undefined') {
        module.exports = GlobalColumnDataSource;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.GlobalColumnDataSource = GlobalColumnDataSource;
    }

    weavecore.ClassUtils.registerClass('weavedata.GlobalColumnDataSource', weavedata.GlobalColumnDataSource);

}());
/**
 * This class manages a global list of IQualifiedKey objects.
 *
 * The getQKey() function must be used to get IQualifiedKey objects.  Each QKey returned by
 * getQKey() with the same parameters will be the same object, so IQualifiedKeys can be compared
 * with the == operator or used as keys in a Dictionary.
 *
 * @author adufilie
 * @author asanjay
 */
(function () {

    /**
     * This makes a sorted copy of an Array of keys.
     * @param An Array of IQualifiedKeys.
     * @return A sorted copy of the keys.
     */
    QKeyManager.keySortCopy = function (keys) {
        var qkm = WeaveAPI.QKeyManager;
        var params = [qkm.keyTypeLookup, qkm.localNameLookup];
        return weavecore.StandardLib.sortOn(keys, params, null, false);
    }

    function QKeyManager() {
        Object.defineProperty(this, "_keyBuffer", {
            value: [] // holds one key
        });

        /**
         * keyType -> Object( localName -> IQualifiedKey )
         */
        Object.defineProperty(this, "_keys", {
            value: {} // holds one key
        });

        /**
         * Maps IQualifiedKey to keyType - faster than reading the keyType property of a QKey
         */
        Object.defineProperty(this, "keyTypeLookup", {
            value: new Map()
        });

        /**
         * Maps IQualifiedKey to localName - faster than reading the localName property of a QKey
         */
        Object.defineProperty(this, "localNameLookup", {
            value: new Map()
        });

        Object.defineProperty(this, "_qkeyGetterLookup", {
            value: new Map()
        });

    }

    var p = QKeyManager.prototype;

    /**
     * Get the QKey object for a given key type and key.
     *
     * @return The QKey object for this type and key.
     */
    p.getQKey = function (keyType, localName) {
        this._keyBuffer[0] = localName;
        this.getQKeys_range(keyType, this._keyBuffer, 0, 1, this._keyBuffer);
        return this._keyBuffer[0];
    }

    function stringHash(str) {
        var hash = 0;
        if (!str) return hash;
        str = (typeof (str) === 'number') ? String(str) : str;
        if (str.length === 0) return hash;
        for (var i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    /**
     * @param output An output Array or Vector for IQualifiedKeys.
     */
    p.getQKeys_range = function (keyType, keyStrings, iStart, iEnd, output) {
        // if there is no keyType specified, use the default
        if (!keyType)
            keyType = "string";

        // get mapping of key strings to QKey weak references
        var keyLookup = this._keys[keyType];
        if (keyLookup === null || keyLookup === undefined) {
            // key type not seen before, so initialize it
            keyLookup = {};
            this._keys[keyType] = keyLookup;
        }

        for (var i = iStart; i < iEnd; i++) {
            var localName = keyStrings[i];
            //TO-DO do Stringhash
            var hash = stringHash(localName, true); // using stringHash improves lookup speed for a large number of strings
            var qkey = keyLookup[hash];
            if (qkey === undefined) {
                // QKey not created for this key yet (or it has been garbage-collected)
                qkey = new weavedata.QKey(keyType, localName);
                keyLookup[hash] = qkey;
                this.keyTypeLookup.set(qkey, keyType);
                this.localNameLookup.set(qkey, localName);
            }

            output[i] = qkey;
        }
    }


    /**
     * Get a list of QKey objects, all with the same key type.
     *
     * @return An array of QKeys.
     */
    p.getQKeys = function (keyType, keyStrings) {
        var keys = [];
        keys.length = keyStrings.length;
        this.getQKeys_range(keyType, keyStrings, 0, keyStrings.length, keys);
        return keys;
    }

    /**
     * This will replace untyped Objects in an Array with their IQualifiedKey counterparts.
     * Each object in the Array should have two properties: <code>keyType</code> and <code>localName</code>
     * @param objects An Array to modify.
     * @return The same Array that was passed in, modified.
     */
    p.convertToQKeys = function (objects) {
        var i = objects.length;
        while (i--) {
            var item = objects[i];
            if (!(item instanceof weavedata.IQualifiedKey))
                objects[i] = this.getQKey(item.keyType, item.localName);
        }
        return objects;
    }

    /**
     * Get a list of QKey objects, all with the same key type.
     *
     * @return An array of QKeys that will be filled in asynchronously.
     */
    p.getQKeysAsync = function (relevantContext, keyType, keyStrings, asyncCallback, outputKeys) {
        var qkg = this._qkeyGetterLookup.get(relevantContext);
        if (!qkg) {
            qkg = new weavedata.QKeyGetter(this, relevantContext);
            this._qkeyGetterLookup.set(relevantContext, qkg);
        }

        qkg.asyncStart(keyType, keyStrings, outputKeys).then(function () {
            asyncCallback();
        });
    }

    /**
     * Get a list of QKey objects, all with the same key type.
     * @param relevantContext The owner of the WeavePromise. Only one WeavePromise will be generated per owner.
     * @param keyType The keyType.
     * @param keyStrings An Array of localName values.
     * @return A WeavePromise that produces a Vector.<IQualifiedKey>.
     */
    p.getQKeysPromise = function (relevantContext, keyType, keyStrings) {
        var qkg = this._qkeyGetterLookup.get(relevantContext);
        if (!qkg) {
            qkg = new weavedata.QKeyGetter(this, relevantContext);
            this._qkeyGetterLookup.set(relevantContext, qkg);
        }

        qkg.asyncStart(keyType, keyStrings);
        return qkg;
    }


    /**
     * Get a list of all previoused key types.
     *
     * @return An array of QKeys.
     */
    p.getAllKeyTypes = function () {
        var types = [];
        for (var type in this._keys)
            types.push(type);
        return types;
    }

    /**
     * Get a list of all referenced QKeys for a given key type
     * @return An array of QKeys
     */
    p.getAllQKeys = function (keyType) {
        var qkeys = [];
        this._keys.forEach(function (qkey) {
            qkeys.push(qkey);
        });

    }


    if (typeof exports !== 'undefined') {
        module.exports = QKeyManager;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.QKeyManager = QKeyManager;
        window.WeaveAPI = window.WeaveAPI ? window.WeaveAPI : {};
        window.WeaveAPI.QKeyManager = new QKeyManager();
    }

}());



/**
 * This class is internal to QKeyManager because instances
 * of QKey should not be instantiated outside QKeyManager.
 */
(function () {
    function QKey(keyType, localName) {
        this._kt = keyType;
        this._ln = localName;

        /**
         * This is the namespace of the QKey.
         */
        Object.defineProperty(this, "keyType", {
            get: function () {
                return this._kt;
            }
        });

        /**
         * This is local record identifier in the namespace of the QKey.
         */
        Object.defineProperty(this, "localName", {
            get: function () {
                return this._ln;
            }
        });
    }

    var p = QKey.prototype;

    if (typeof exports !== 'undefined') {
        module.exports = QKey;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.QKey = QKey;
    }
}());

/**
 * This class is internal to QKeyManager because instances
 * of QKey should not be instantiated outside QKeyManager.
 */
(function () {
    function QKeyGetter(manager, relevantContext) {

        weavecore.WeavePromise.call(this, relevantContext);
        this._manager = manager;

        this._asyncCallback;
        this._i;

        this._keyType;
        this._keyStrings;
        this._outputKeys;


        Object.defineProperty(this, '_batch', {
            value: 5000
        });


    }


    QKeyGetter.prototype = new weavecore.WeavePromise();
    QKeyGetter.prototype.constructor = QKeyGetter;
    var p = QKeyGetter.prototype;

    p.asyncStart = function (keyType, keyStrings, outputKeys) {
        outputKeys = outputKeys ? outputKeys : null;
        //this.manager = manager;
        this._keyType = keyType;
        this._keyStrings = keyStrings;
        this._i = 0;
        this._outputKeys = outputKeys || [];
        this._outputKeys.length = keyStrings.length;
        // high priority because all visualizations depend on key sets
        WeaveAPI.StageUtils.startTask(this.relevantContext, iterate.bind(this), WeaveAPI.TASK_PRIORITY_HIGH, asyncComplete.bind(this), weavecore.StandardLib.substitute("Initializing {0} record identifiers", keyStrings.length));

        return this;
    }

    function iterate(stopTime) {
        for (; this._i < this._keyStrings.length; this._i += this._batch) {
            if (getTimer() > stopTime)
                return this._i / this._keyStrings.length;

            this._manager.getQKeys_range(this._keyType, this._keyStrings, this._i, Math.min(this._i + this._batch, this._keyStrings.length), this._outputKeys);
        }
        return 1;
    }

    function getTimer() {
        return new Date().getTime();
    }

    function asyncComplete() {
        this.setResult(this._outputKeys);
    }

    if (typeof exports !== 'undefined') {
        module.exports = QKeyGetter;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.QKeyGetter = QKeyGetter;
    }
}());

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
    Object.defineProperty(CSVParser, 'NS', {
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
    Object.defineProperty(CSVParser, 'CLASS_NAME', {
        value: 'CSVParser'
    });


    Object.defineProperty(CSVParser, 'CR', {
        value: '\r'
    });
    Object.defineProperty(CSVParser, 'LF', {
        value: '\n'
    });
    Object.defineProperty(CSVParser, 'CRLF', {
        value: '\r\n'
    });




    function CSVParser(asyncMode, delimiter, quote) {
        weavecore.ILinkableObject.call(this);
        asyncMode = (asyncMode === undefined) ? false : asyncMode;
        delimiter = (delimiter === undefined) ? ',' : delimiter;
        quote = (quote === undefined) ? '"' : quote;

        //ptivate
        // modes set in constructor
        this.asyncMode = asyncMode;
        this.delimiter = ',';
        this.quote = '"';
        if (delimiter && delimiter.length === 1)
            this.delimiter = delimiter;
        if (quote && quote.length === 1)
            this.quote = quote;


        // async state
        this.csvData;
        this.csvDataArray;
        this.parseTokens;
        this.i;
        this.row;
        this.col;
        this.escaped;

        /**
         * @return  The resulting two-dimensional Array from the last call to parseCSV().
         */
        Object.defineProperty(this, 'parseResult', {
            get: function () {
                return this.csvDataArray
            }
        })
    }

    CSVParser.prototype = new weavecore.ILinkableObject();
    CSVParser.prototype.constructor = CSVParser;
    var p = CSVParser.prototype;

    /**
     * @inheritDoc
     */
    p.parseCSV = function (csvData, parseTokens) {
        parseTokens = (parseTokens === undefined) ? true : parseTokens;
        // initialization
        this.csvData = csvData;
        this.csvDataArray = [];
        this.parseTokens = parseTokens;
        this.i = 0;
        this.row = 0;
        this.col = 0;
        this.escaped = false;

        if (this.asyncMode) {
            WeaveAPI.StageUtils.startTask(this, parseIterate.bind(this), WeaveAPI.TASK_PRIORITY_HIGH, parseDone.bind(this));
        } else {
            parseIterate.call(this, Number.MAX_VALUE);
            parseDone.call(this);
        }

        return this.csvDataArray;
    }

    function getTimer() {
        return new Date().getTime();
    }

    function parseIterate(stopTime) {
        // run initialization code on first iteration
        if (this.i === 0) {
            if (!this.csvData) // null or empty string?
                return 1; // done

            // start off first row with an empty string token
            this.csvDataArray[this.row] = [''];
        }

        while (getTimer() < stopTime) {
            if (this.i >= this.csvData.length)
                return 1; // done

            var currentChar = this.csvData.charAt(this.i);
            var twoChar = currentChar + this.csvData.charAt(this.i + 1);
            if (this.escaped) {
                if (twoChar === this.quote + this.quote) //escaped quote
                {
                    this.csvDataArray[this.row][this.col] += (this.parseTokens ? currentChar : twoChar); //append quote(s) to current token
                    this.i += 1; //skip second quote mark
                } else if (currentChar === this.quote) //end of escaped text
                {
                    this.escaped = false;
                    if (!this.parseTokens) {
                        this.csvDataArray[this.row][this.col] += currentChar; //append quote to current token
                    }
                } else {
                    this.csvDataArray[this.row][this.col] += currentChar; //append quotes to current token
                }
            } else {

                if (twoChar === this.delimiter + this.quote) {
                    this.escaped = true;
                    this.col += 1;
                    this.csvDataArray[this.row][this.col] = (this.parseTokens ? '' : this.quote);
                    this.i += 1; //skip quote mark
                } else if (currentChar === this.quote && this.csvDataArray[this.row][this.col] === '') //start new token
                {
                    this.escaped = true;
                    if (!this.parseTokens)
                        this.csvDataArray[this.row][this.col] += currentChar;
                } else if (currentChar === this.delimiter) //start new token
                {
                    this.col += 1;
                    this.csvDataArray[this.row][this.col] = '';
                } else if (twoChar === CSVParser.CRLF) //then start new row
                {
                    this.i += 1; //skip line feed
                    this.row += 1;
                    this.col = 0;
                    this.csvDataArray[this.row] = [''];
                } else if (currentChar === CSVParser.CR) //then start new row
                {
                    this.row += 1;
                    this.col = 0;
                    this.csvDataArray[this.row] = [''];
                } else if (currentChar === CSVParser.LF) //then start new row
                {
                    this.row += 1;
                    this.col = 0;
                    this.csvDataArray[this.row] = [''];
                } else //append single character to current token
                    this.csvDataArray[this.row][this.col] += currentChar;
            }
            this.i++;
        }

        return this.i / this.csvData.length;
    }


    function parseDone() {
        // if there is more than one row and last row is empty,
        // remove last row assuming it is there because of a newline at the end of the file.
        for (var iRow = this.csvDataArray.length; iRow--;) {
            var dataLine = this.csvDataArray[iRow];

            if (dataLine.length === 1 && dataLine[0] === '')
                this.csvDataArray.splice(iRow, 1);
        }

        if (this.asyncMode)
            WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
    }


    p.createCSV = function (rows) {
        var lines = [];
        lines.length = rows.length;
        for (var i = rows.length; i--;) {
            var tokens = [];
            tokens.length = rows[i].length
            for (var j = tokens.length; j--;)
                tokens[j] = this.createCSVToken(rows[i][j]);

            lines[i] = tokens.join(this.delimiter);
        }
        var csvData = lines.join(CSVParser.LF);
        return csvData;
    }

    /**
     * @inheritDoc
     */
    p.parseCSVRow = function (csvData, parseTokens) {
        if (csvData === null)
            return null;

        parseTokens = (parseTokens === undefined) ? true : parseTokens;
        var rows = this.parseCSV(csvData, parseTokens);
        if (rows.length === 0)
            return rows;
        if (rows.length === 1)
            return rows[0];
        // flatten
        return [].concat.apply(null, rows);
    }

    /**
     * @inheritDoc
     */
    p.createCSVRow = function (row) {
        return this.createCSV([row]);
    }

    /**
     * @inheritDoc
     */
    p.parseCSVToken = function (token) {
        var parsedToken = '';

        var tokenLength = token.length;

        if (token.charAt(0) === this.quote) {
            var escaped = true;
            for (var i = 1; i <= tokenLength; i++) {
                var currentChar = token.charAt(i);
                var twoChar = currentChar + token.charAt(i + 1);

                if (twoChar === this.quote + this.quote) //append escaped quote
                {
                    i += 1;
                    parsedToken += this.quote;
                } else if (currentChar === this.quote && escaped) {
                    escaped = false;
                } else {
                    parsedToken += currentChar;
                }
            }
        } else {
            parsedToken = token;
        }
        return parsedToken;
    }

    /**
     * @inheritDoc
     */
    p.createCSVToken = function (str) {
        if (str === null)
            str = '';

        // determine if quotes are necessary
        if (str.length > 0 && str.indexOf(this.quote) < 0 && str.indexOf(this.delimiter) < 0 && str.indexOf(CSVParser.LF) < 0 && str.indexOf(CSVParser.CR) < 0 && str === str.trim()) {
            return str;
        }

        var token = this.quote;
        for (var i = 0; i <= str.length; i++) {
            var currentChar = str.charAt(i);
            if (currentChar === this.quote)
                token += this.quote + this.quote;
            else
                token += currentChar;
        }
        return token + this.quote;
    }

    /**
     * @inheritDoc
     */
    p.convertRowsToRecords = function (rows, headerDepth) {
        headerDepth = headerDepth === undefined ? 1 : headerDepth;
        if (rows.length < headerDepth)
            throw new Error("headerDepth is greater than the number of rows");
        CSVParser.assertHeaderDepth(headerDepth);

        var records = [];
        records.length = rows.length - headerDepth
        for (var r = headerDepth; r < rows.length; r++) {
            var record = {};
            var row = rows[r];
            for (var c = 0; c < row.length; c++) {
                var output = record;
                var cell = row[c];
                for (var h = 0; h < headerDepth; h++) {
                    var colName = rows[h][c];
                    if (h < headerDepth - 1) {
                        if (!output[colName])
                            output[colName] = {};
                        output = output[colName];
                    } else
                        output[colName] = cell;
                }
            }
            records[r - headerDepth] = record;
        }
        return records;
    }

    /**
     * @inheritDoc
     */
    p.getRecordFieldNames = function (records, includeNullFields, headerDepth) {
        includeNullFields = includeNullFields === undefined ? false : includeNullFields;
        headerDepth = headerDepth === undefined ? 1 : headerDepth;
        CSVParser.assertHeaderDepth(headerDepth);

        var nestedFieldNames = {};
        records.forEach(function (record) {
            _outputNestedFieldNames.call(this, record, includeNullFields, nestedFieldNames, headerDepth);
        });

        var fields = [];
        _collapseNestedFieldNames.call(this, nestedFieldNames, fields);
        return fields;
    }

    function _outputNestedFieldNames(record, includeNullFields, output, depth) {
        for (var field in record) {
            if (includeNullFields || record[field] != null) {
                if (depth === 1) {
                    output[field] = false;
                } else {
                    if (!output[field])
                        output[field] = {};
                    _outputNestedFieldNames.call(this, record[field], includeNullFields, output[field], depth - 1);
                }
            }
        }
    }

    function _collapseNestedFieldNames(nestedFieldNames, output, prefix) {
        prefix = prefix === undefined ? null : prefix;
        for (var field in nestedFieldNames) {
            if (nestedFieldNames[field]) // either an Object or false
            {
                _collapseNestedFieldNames.call(this, nestedFieldNames[field], output, prefix ? prefix.concat(field) : [field]);
            } else // false means reached full nesting depth
            {
                if (prefix) // is depth > 1?
                    output.push(prefix.concat(field)); // output the list of nested field names
                else
                    output.push(field); // no array when max depth is 1
            }
        }
    }

    p.convertRecordsToRows = function (records, columnOrder, allowBlankColumns, headerDepth) {
        columnOrder = columnOrder === undefined ? null : columnOrder;
        allowBlankColumns = allowBlankColumns === false ? null : allowBlankColumns;
        headerDepth = headerDepth === undefined ? 1 : headerDepth;
        CSVParser.assertHeaderDepth(headerDepth);

        var fields = columnOrder;
        if (fields === null) {
            fields = this.getRecordFieldNames(records, allowBlankColumns, headerDepth);
            weavecore.AsyncSort.sortImmediately(fields);
        }

        var r;
        var c;
        var cell;
        var row;
        var rows = [];
        rows.length = records.length + headerDepth;

        // construct multiple header rows from field name chains
        for (r = 0; r < headerDepth; r++) {
            row = [];
            row.length = fields.length;
            for (c = 0; c < fields.length; c++) {
                if (headerDepth > 1)
                    row[c] = fields[c][r] || ''; // fields are Arrays
                else
                    row[c] = fields[c] || ''; // fields are Strings
            }
            rows[r] = row;
        }

        for (r = 0; r < records.length; r++) {
            var record = records[r];
            row = [];
            row.length = fields.length;
            for (c = 0; c < fields.length; c++) {
                if (headerDepth === 1) {
                    // fields is an Array of Strings
                    cell = record[fields[c]];
                } else {
                    // fields is an Array of Arrays
                    cell = record;
                    fields[c].forEach(function (field) {
                        if (cell)
                            cell = cell[field];
                    });
                }
                row[c] = cell !== null ? String(cell) : '';
            }
            rows[headerDepth + r] = row;
        }
        return rows;
    }


    CSVParser.assertHeaderDepth = function (headerDepth) {
        if (headerDepth < 1)
            throw new Error("headerDepth must be > 0");
    }

    //test();
    CSVParser._tested = false;
    CSVParser.test = function () {
        if (CSVParser._tested)
            return;
        CSVParser._tested = true;

        var _ = {};
        _.parser = WeaveAPI.CSVParser;
        _.csv = [
				"internal,internal,public,public,public,private,private,test",
				"id,type,title,keyType,dataType,connection,sqlQuery,empty",
				"2,1,state name,fips,string,resd,\"select fips,name from myschema.state_data\",",
				"3,1,population,fips,number,resd,\"select fips,pop from myschema.state_data\",",
				"1,0,state data table"
			].join('\n');
        _.table = _.parser.parseCSV(_.csv);
        _.records = _.parser.convertRowsToRecords(_.table, 2);
        _.rows = _.parser.convertRecordsToRows(_.records, null, false, 2);
        _.fields = _.parser.getRecordFieldNames(_.records, false, 2);
        _.fieldOrder = _.parser.parseCSV('internal,id\ninternal,type\npublic,title\npublic,keyType\npublic,dataType\nprivate,connection\nprivate,sqlQuery');
        _.rows2 = _.parser.convertRecordsToRows(_.records, _.fieldOrder, false, 2);
        console.log(_);
    }

    if (typeof exports !== 'undefined') {
        module.exports = CSVParser;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.CSVParser = CSVParser;
        window.WeaveAPI = window.WeaveAPI ? window.WeaveAPI : {};
        WeaveAPI.CSVParser = new CSVParser();
    }


    weavecore.ClassUtils.registerClass('weavedata.CSVParser', weavedata.CSVParser);
}());
(function () {
    function ColumnMetadata() {

    }


    ColumnMetadata.ENTITY_TYPE = 'entityType';
    ColumnMetadata.TITLE = "title";
    ColumnMetadata.NUMBER = "number";
    ColumnMetadata.STRING = "string";
    ColumnMetadata.KEY_TYPE = "keyType";
    ColumnMetadata.DATA_TYPE = "dataType";
    ColumnMetadata.PROJECTION = "projection";
    ColumnMetadata.AGGREGATION = "aggregation";
    ColumnMetadata.DATE_FORMAT = "dateFormat";
    ColumnMetadata.DATE_DISPLAY_FORMAT = "dateDisplayFormat";
    ColumnMetadata.OVERRIDE_BINS = "overrideBins";
    ColumnMetadata.MIN = "min";
    ColumnMetadata.MAX = "max";

    ColumnMetadata.getAllMetadata = function (column) {
        var meta = {};
        var propertyNames = column.getMetadataPropertyNames();
        for (var i = 0; i < propertyNames.length; i++)
            meta[name] = column.getMetadata(name);
        return meta;

    }

    /**
     * @param propertyName The name of a metadata property.
     * @return An Array of suggested String values for the specified metadata property.
     */
    ColumnMetadata.getSuggestedPropertyValues = function (propertyName) {
        switch (propertyName) {
        case ColumnMetadata.ENTITY_TYPE:
            return weavedata.EntityType.ALL_TYPES;

        case ColumnMetadata.DATA_TYPE:
            return weavedata.DataType.ALL_TYPES;

        case ColumnMetadata.DATE_DISPLAY_FORMAT:
        case ColumnMetadata.DATE_FORMAT:
            return weavedata.DateFormat.getSuggestions();

        case ColumnMetadata.AGGREGATION:
            return weavedata.Aggregation.ALL_TYPES;

        default:
            return [];
        }
    }


    if (typeof exports !== 'undefined') {
        module.exports = ColumnMetadata;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.ColumnMetadata = ColumnMetadata;
    }

}());

(function () {
    function DataType() {

    }


    DataType.ALL_TYPES = [DataType.NUMBER, DataType.STRING, DataType.DATE, DataType.GEOMETRY];

    DataType.NUMBER = "number";
    DataType.STRING = "string";
    DataType.DATE = "date";
    DataType.GEOMETRY = "geometry";

    /**
     * Gets the Class associated with a dataType metadata value.
     * This Class indicates the type of values stored in a column with given dataType metadata value.
     * @param dataType A dataType metadata value.
     * @return The associated Class, which can be used to pass to IAttributeColumn.getValueFromKey().
     * @see weave.api.data.IAttributeColumn#getValueFromKey()
     */
    DataType.getClass = function (dataType) {
        switch (dataType) {
        case DataType.NUMBER:
            return Number;
        case DataType.DATE:
            return Date;
        case DataType.GEOMETRY:
            return Array;
        default:
            return String;
        }
    }


    if (typeof exports !== 'undefined') {
        module.exports = DataType;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.DataType = DataType;
    }

}());

(function () {
    function DateFormat() {

    }


    DateFormat.ADDITIONAL_SUGGESTIONS = ["%Y"];
    DateFormat.FOR_AUTO_DETECT = [
			'%d-%b-%y',
			'%b-%d-%y',
			'%d-%b-%Y',
			'%b-%d-%Y',
			'%Y-%b-%d',

			'%d/%b/%y',
			'%b/%d/%y',
			'%d/%b/%Y',
			'%b/%d/%Y',
			'%Y/%b/%d',

			'%d.%b.%y',
			'%b.%d.%y',
			'%d.%b.%Y',
			'%b.%d.%Y',
			'%Y.%b.%d',

			'%d-%m-%y',
			'%m-%d-%y',
			'%d-%m-%Y',
			'%m-%d-%Y',

			'%d/%m/%y',
			'%m/%d/%y',
			'%d/%m/%Y',
			'%m/%d/%Y',
			'%Y/%m/%d',

			'%d.%m.%y',
			'%m.%d.%y',
			'%d.%m.%Y',
			'%m.%d.%Y',
			'%Y.%m.%d',

			'%H:%M',
			'%H:%M:%S',
			'%H:%M:%S.%Q',
			'%a, %d %b %Y %H:%M:%S %z', // RFC_822

			// ISO_8601   http://www.thelinuxdaily.com/2014/03/c-function-to-validate-iso-8601-date-formats-using-strptime/
			"%Y-%m-%d",
			"%y-%m-%d",
			"%Y-%m-%d %T",
			"%y-%m-%d %T",
			"%Y-%m-%dT%T",
			"%y-%m-%dT%T",
			"%Y-%m-%dT%TZ",
			"%y-%m-%dT%TZ",
			"%Y-%m-%d %TZ",
			"%y-%m-%d %TZ",
			"%Y%m%dT%TZ",
			"%y%m%dT%TZ",
			"%Y%m%d %TZ",
			"%y%m%d %TZ",

			"%Y-%b-%d %T",
			"%Y-%b-%d %H:%M:%S",
			"%Y-%b-%d %H:%M:%S.%Q",
			"%d-%b-%Y %T",
			"%d-%b-%Y %H:%M:%S",
			"%d-%b-%Y %H:%M:%S.%Q",

			/*
			//https://code.google.com/p/datejs/source/browse/trunk/src/globalization/en-US.js
			'M/d/yyyy',
			'dddd, MMMM dd, yyyy',
			"M/d/yyyy",
			"dddd, MMMM dd, yyyy",
			"h:mm tt",
			"h:mm:ss tt",
			"dddd, MMMM dd, yyyy h:mm:ss tt",
			"yyyy-MM-ddTHH:mm:ss",
			"yyyy-MM-dd HH:mm:ssZ",
			"ddd, dd MMM yyyy HH:mm:ss GMT",
			"MMMM dd",
			"MMMM, yyyy",

			//http://www.java2s.com/Code/Android/Date-Type/parseDateforlistofpossibleformats.htm
			"EEE, dd MMM yyyy HH:mm:ss z", // RFC_822
			"EEE, dd MMM yyyy HH:mm zzzz",
			"yyyy-MM-dd'T'HH:mm:ssZ",
			"yyyy-MM-dd'T'HH:mm:ss.SSSzzzz", // Blogger Atom feed has millisecs also
			"yyyy-MM-dd'T'HH:mm:sszzzz",
			"yyyy-MM-dd'T'HH:mm:ss z",
			"yyyy-MM-dd'T'HH:mm:ssz", // ISO_8601
			"yyyy-MM-dd'T'HH:mm:ss",
			"yyyy-MM-dd'T'HHmmss.SSSz",

			//http://stackoverflow.com/a/21737848
			"M/d/yyyy", "MM/dd/yyyy",
			"d/M/yyyy", "dd/MM/yyyy",
			"yyyy/M/d", "yyyy/MM/dd",
			"M-d-yyyy", "MM-dd-yyyy",
			"d-M-yyyy", "dd-MM-yyyy",
			"yyyy-M-d", "yyyy-MM-dd",
			"M.d.yyyy", "MM.dd.yyyy",
			"d.M.yyyy", "dd.MM.yyyy",
			"yyyy.M.d", "yyyy.MM.dd",
			"M,d,yyyy", "MM,dd,yyyy",
			"d,M,yyyy", "dd,MM,yyyy",
			"yyyy,M,d", "yyyy,MM,dd",
			"M d yyyy", "MM dd yyyy",
			"d M yyyy", "dd MM yyyy",
			"yyyy M d", "yyyy MM dd" */
		];


    DateFormat.getSuggestions = function (dataType) {
        return DateFormat.ADDITIONAL_SUGGESTIONS.concat(DateFormat.FOR_AUTO_DETECT);
    }


    if (typeof exports !== 'undefined') {
        module.exports = DateFormat;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.DateFormat = DateFormat;
    }

}());

(function () {
    function EntityType() {

    }


    EntityType.ALL_TYPES = [EntityType.TABLE, EntityType.COLUMN, EntityType.HIERARCHY, EntityType.CATEGORY];

    EntityType.TABLE = 'table';
    EntityType.COLUMN = 'column';
    EntityType.HIERARCHY = 'hierarchy';
    EntityType.CATEGORY = 'category';



    if (typeof exports !== 'undefined') {
        module.exports = EntityType;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.EntityType = EntityType;
    }

}());

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
    Object.defineProperty(DynamicKeyFilter, 'NS', {
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
    Object.defineProperty(DynamicKeyFilter, 'CLASS_NAME', {
        value: 'DynamicKeyFilter'
    });



    /**
     * This is a wrapper for a dynamically created object implementing IKeyFilter.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function DynamicKeyFilter() {
        weavecore.LinkableDynamicObject.call(this, weavedata.KeyFilter);
    }

    DynamicKeyFilter.prototype = new weavecore.LinkableDynamicObject();
    DynamicKeyFilter.prototype.constructor = DynamicKeyFilter;

    var p = DynamicKeyFilter.prototype;

    p.getInternalKeyFilter = function () {
        var kf = (this.internalObject && this.internalObject instanceof weavedata.KeyFilter) ? this.internalObject : null;
        return kf;
    }



    if (typeof exports !== 'undefined') {
        module.exports = DynamicKeyFilter;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.DynamicKeyFilter = DynamicKeyFilter;
    }
    weavecore.ClassUtils.registerClass('weavedata.DynamicKeyFilter', weavedata.DynamicKeyFilter);
}());
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
    Object.defineProperty(FilteredKeySet, 'NS', {
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
    Object.defineProperty(FilteredKeySet, 'CLASS_NAME', {
        value: 'FilteredKeySet'
    });

    FilteredKeySet.debug = false;

    /**
     * A FilteredKeySet has a base set of keys and an optional filter.
     * The resulting set of keys becomes the intersection of the base set with the filter.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function FilteredKeySet() {
        weavecore.CallbackCollection.call(this);
        if (FilteredKeySet.debug)
            this.addImmediateCallback(this, _firstCallback.bind(this));

        this._baseKeySet = null; // stores the base IKeySet


        this._filteredKeys = []; // stores the filtered list of keys
        this._filteredKeyLookup = new Map(); // this maps a key to a value if the key is included in this key set
        this._generatedKeySets;
        this._setColumnKeySources_arguments;
        this._prevTriggerCounter; // used to remember if the this._filteredKeys are valid


        this._i;
        this._asyncInverse;
        this._asyncFilter;
        this._asyncInput;
        this._asyncOutput;
        this._asyncLookup;

        // this stores the IKeyFilter
        Object.defineProperty(this, '_dynamicKeyFilter', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavedata.DynamicKeyFilter())

        });

        /**
         * When this is set to true, the inverse of the filter will be used to filter the keys.
         * This means any keys appearing in the filter will be excluded from this key set.
         */


        Object.defineProperty(this, 'inverseFilter', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean())

        });

        /**
         * @return The interface for setting a filter that is applied to the base key set.
         */

        Object.defineProperty(this, 'keyFilter', {
            get: function () {
                return this._dynamicKeyFilter;
            }

        });


        /**
         * @return The keys in this IKeySet.
         */
        Object.defineProperty(this, 'keys', {
            get: function () {
                if (this._prevTriggerCounter !== this.triggerCounter)
                    validateFilteredKeys.call(this);
                return this._filteredKeys;
            }

        });


    }


    /**
     * @private
     */
    function validateFilteredKeys() {
        this._prevTriggerCounter = this.triggerCounter; // this prevents the function from being called again before callbacks are triggered again.

        this._asyncFilter = this._dynamicKeyFilter.getInternalKeyFilter();

        if (this._baseKeySet == null) {
            // no keys when base key set is undefined
            this._filteredKeys = [];
            this._filteredKeyLookup = new Map();
            return;
        }
        if (!this._asyncFilter) {
            // use base key set
            this._filteredKeys = this._baseKeySet.keys;
            this._filteredKeyLookup = new Map();
            weavedata.VectorUtils.fillKeys(this._filteredKeyLookup, this._filteredKeys);
            return;
        }

        this._i = 0;
        this._asyncInput = this._baseKeySet.keys;
        this._asyncOutput = [];
        this._asyncLookup = new Map();
        this._asyncInverse = this.inverseFilter.value;

        // high priority because all visualizations depend on key sets
        WeaveAPI.StageUtils.startTask(this, iterate.bind(this), WeaveAPI.TASK_PRIORITY_HIGH, asyncComplete.bind(this), weavecore.StandardLib.substitute('Filtering {0} keys in {1}', this._asyncInput.length, WeaveAPI.debugId(this)));
    }



    function iterate(stopTime) {
        if (this._prevTriggerCounter !== this.triggerCounter)
            return 1;

        for (; this._i < this._asyncInput.length; ++this._i) {
            if (!this._asyncFilter)
                return 1;
            if (getTimer() > stopTime)
                return this._i / this._asyncInput.length;

            var key = (this._asyncInput[this._i] && this._asyncInput[this._i] instanceof weavedata.IQualifiedKey) ? this._asyncInput[this._i] : null;
            var contains = this._asyncFilter.containsKey(key);
            if (contains !== this._asyncInverse) {
                this._asyncOutput.push(key);
                this._asyncLookup.set(key, true);
            }
        }

        return 1;
    }

    function getTimer() {
        return new Date().getTime();
    }

    function asyncComplete() {
        if (this._prevTriggerCounter !== this.triggerCounter) {
            validateFilteredKeys.call(this);
            return;
        }

        this._prevTriggerCounter++;
        this._filteredKeys = this._asyncOutput;
        this._filteredKeyLookup = this._asyncLookup;
        this.triggerCallbacks();
    }

    FilteredKeySet.prototype = new weavecore.CallbackCollection();
    FilteredKeySet.prototype.constructor = FilteredKeySet;

    var p = FilteredKeySet.prototype;

    function _firstCallback() {
        console.log(this, 'trigger', this.keys.length, 'keys');
    }

    p.dispose = function () {
        weavecore.CallbackCollection.prototype.dispose.call(this);
        this.setColumnKeySources(null);
    }

    /**
     * This sets up the FilteredKeySet to get its base set of keys from a list of columns and provide them in sorted order.
     * @param columns An Array of IAttributeColumns to use for comparing IQualifiedKeys.
     * @param sortDirections Array of sort directions corresponding to the columns and given as integers (1=ascending, -1=descending, 0=none).
     * @param keySortCopy A function that returns a sorted copy of an Array of keys. If specified, descendingFlags will be ignored and this function will be used instead.
     * @param keyInclusionLogic Passed to KeySetUnion constructor.
     * @see weave.data.KeySets.SortedKeySet#generateCompareFunction()
     */
    p.setColumnKeySources = function (columns, sortDirections, keySortCopy, keyInclusionLogic) {
        sortDirections = (sortDirections === undefined) ? null : sortDirections;
        keySortCopy = (keySortCopy === undefined) ? null : keySortCopy;
        keyInclusionLogic = (keyInclusionLogic === undefined) ? null : keyInclusionLogic;

        var args = Array.prototype.slice.call(arguments);
        if (weavecore.StandardLib.compare(this._setColumnKeySources_arguments, args) == 0)
            return;

        var keySet;

        // unlink from the old key set
        if (this._generatedKeySets) {
            this._generatedKeySets.forEach(function (keySet) {
                WeaveAPI.SessionManager.disposeObject(keySet);
            });
            this._generatedKeySets = null;
        } else {
            this.setSingleKeySource(null);
        }

        this._setColumnKeySources_arguments = args;

        if (columns) {
            // KeySetUnion should not trigger callbacks
            var union = WeaveAPI.SessionManager.registerDisposableChild(this, new weavedata.KeySetUnion(keyInclusionLogic));
            columns.forEach(function (keySet) {
                union.addKeySetDependency(keySet);
                if (keySet instanceof weavedata.IAttributeColumn) {
                    var stats = WeaveAPI.StatisticsCache.getColumnStatistics(keySet);
                    WeaveAPI.SessionManager.registerLinkableChild(union, stats);
                }
            })

            if (FilteredKeySet.debug && keySortCopy == null)
                console.log(WeaveAPI.debugId(this), 'sort by [', columns, ']');

            var sortCopy = keySortCopy || SortedKeySet.generateSortCopyFunction(columns, sortDirections);
            // SortedKeySet should trigger callbacks
            var sorted = WeaveAPI.SessionManager.registerLinkableChild(this, new weavedata.SortedKeySet(union, sortCopy, columns));
            this._generatedKeySets = [union, sorted];

            this._baseKeySet = sorted;
        } else {
            this._baseKeySet = null;
        }

        this.triggerCallbacks();
    }

    /**
     * This function sets the base IKeySet that is being filtered.
     * @param newBaseKeySet A new IKeySet to use as the base for this FilteredKeySet.
     */
    p.setSingleKeySource = function (keySet) {
        if (this._generatedKeySets)
            this.setColumnKeySources(null);

        if (this._baseKeySet === keySet)
            return;

        // unlink from the old key set
        if (this._baseKeySet !== null)
            WeaveAPI.SessionManager.getCallbackCollection(this._baseKeySet).removeCallback(this.triggerCallbacks);

        this._baseKeySet = keySet; // save pointer to new base key set

        // link to new key set
        if (this._baseKeySet !== null)
            WeaveAPI.SessionManager.getCallbackCollection(this._baseKeySet).addImmediateCallback(this, this.triggerCallbacks.bind(this), false, true);

        this.triggerCallbacks();
    }



    /**
     * @param key A key to test.
     * @return true if the key exists in this IKeySet.
     */
    p.containsKey = function (key) {
        if (this._prevTriggerCounter !== this.triggerCounter)
            validateFilteredKeys.call(this);
        return this._filteredKeyLookup.get(key) !== undefined;
    }



    if (typeof exports !== 'undefined') {
        module.exports = FilteredKeySet;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.FilteredKeySet = FilteredKeySet;
    }

    weavecore.ClassUtils.registerClass('weavedata.FilteredKeySet', weavedata.FilteredKeySet);
}());
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
    Object.defineProperty(IKeyFilter, 'NS', {
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
    Object.defineProperty(IKeyFilter, 'CLASS_NAME', {
        value: 'IKeyFilter'
    });


    /**
     * This is an interface to an object that decides which IQualifiedKey objects are included in a set or not.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function IKeyFilter() {
        weavecore.ILinkableObject.call(this);
    }

    IKeyFilter.prototype = new weavecore.ILinkableObject();
    IKeyFilter.prototype.constructor = IKeyFilter;
    var p = IKeyFilter.prototype;

    /**
     * This function tests if a IQualifiedKey object is contained in this IKeySet.
     * @param key A IQualifiedKey object.
     * @return true if the IQualifiedKey object is contained in the IKeySet.
     */
    p.containsKey = function (key) {}


    if (typeof exports !== 'undefined') {
        module.exports = IKeyFilter;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.IKeyFilter = IKeyFilter;
    }

    weavecore.ClassUtils.registerClass('weavedata.IKeyFilter', weavedata.IKeyFilter);

}());
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
    Object.defineProperty(IKeySet, 'NS', {
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
    Object.defineProperty(IKeySet, 'CLASS_NAME', {
        value: 'IKeySet'
    });


    /**
     * This is an extension of IKeyFilter that adds a complete list of the IQualifiedKey objects contained in the key set.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function IKeySet() {
        weavedata.IKeyFilter.call(this);

        /**
         * This is a list of the IQualifiedKey objects that define the key set.
         */
        Object.defineProperty(this, 'keys', {
            get: function () {
                return []
            },
            configurable: true
        })
    }

    IKeySet.prototype = new weavedata.IKeyFilter();
    IKeySet.prototype.constructor = IKeySet;

    if (typeof exports !== 'undefined') {
        module.exports = IKeySet;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.IKeySet = IKeySet;
    }

    weavecore.ClassUtils.registerClass('weavedata.IKeySet', weavedata.IKeySet);

}());
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
        includedKeys.forEach(function (key) {
            this._includedKeyTypeMap[key.keyType] = true;
        });

        this.excluded.removeKeys(includedKeys);
    }

    // removes keys from include list that were just added to exclude list

    function handleExcludeChange() {
        var excludedKeys = this.excluded.keys;
        this._excludedKeyTypeMap = {};
        excludedKeys.forEach(function (key) {
            this._excludedKeyTypeMap[key.keyType] = true;
        });

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

    weavecore.ClassUtils.registerClass('weavedata.KeyFilter', weavedata.KeyFilter);

}());
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
    Object.defineProperty(KeySet, 'NS', {
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
    Object.defineProperty(KeySet, 'CLASS_NAME', {
        value: 'KeySet'
    });

    function KeySet() {
        weavecore.LinkableVariable.call(this, Array, verifySessionState.bind(this));

        // The first callback will update the keys from the session state.
        this.addImmediateCallback(this, updateKeys.bind(this));
        /**
         * This object maps keys to index values
         */
        this._keyIndex = new Map();
        /**
         * This maps index values to IQualifiedKey objects
         */
        this._keys = [];

        /**
         * This flag is used to avoid recursion while the keys are being synchronized with the session state.
         */
        this._currentlyUpdating = false;


        /**
         * A list of keys included in this KeySet.
         */
        Object.defineProperty(this, 'keys', {
            get: function () {
                return this._keys
            }
        });

        /**
         * An interface for keys added and removed
         */
        Object.defineProperty(this, 'keyCallbacks', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavedata.KeySetCallbackInterface())
        });

    }

    /**
     * Verifies that the value is a two-dimensional array or null.
     */
    function verifySessionState(value) {
        if (!value) return false;
        for (var i = 0; i < value.length; i++) {
            var row = value[i];
            if (!(row.constructor === Array))
                return false;
        }
        return true;
    }



    /**
     * This is the first callback that runs when the KeySet changes.
     * The keys will be updated based on the session state.
     */
    function updateKeys() {
        // avoid recursion
        if (this._currentlyUpdating)
            return;

        // each row of CSV represents a different keyType (keyType is the first token in the row)
        var newKeys = [];
        this._sessionStateInternal.forEach(function (row) {
            newKeys.push.apply(null, WeaveAPI.QKeyManager.getQKeys(row[0], row.slice(1)));
        })

        // avoid internal recursion while still allowing callbacks to cause recursion afterwards
        this.delayCallbacks();
        this._currentlyUpdating = true;
        this.replaceKeys(newKeys);
        this.keyCallbacks.flushKeys();
        this._currentlyUpdating = false;
        this.resumeCallbacks();
    }

    /**
     * This function will derive the session state from the IQualifiedKey objects in the keys array.
     */
    function updateSessionState() {
        // avoid recursion
        if (this._currentlyUpdating)
            return;

        // from the IQualifiedKey objects, generate the session state
        var _keyTypeToKeysMap = {};
        this._keys.forEach(function (key) {
            if (_keyTypeToKeysMap[key.keyType] === undefined)
                _keyTypeToKeysMap[key.keyType] = [];
            (_keyTypeToKeysMap[key.keyType]).push(key.localName);
        });
        // for each keyType, create a row for the CSV parser
        var keyTable = [];
        for (var keyType in _keyTypeToKeysMap) {
            var newKeys = _keyTypeToKeysMap[keyType];
            newKeys.unshift(keyType);
            keyTable.push(newKeys);
        }

        // avoid internal recursion while still allowing callbacks to cause recursion afterwards
        this.delayCallbacks();
        this._currentlyUpdating = true;
        this.setSessionState(keyTable);
        this.keyCallbacks.flushKeys();
        this._currentlyUpdating = false;
        this.resumeCallbacks();
    }


    KeySet.prototype = new weavecore.LinkableVariable();
    KeySet.prototype.constructor = KeySet;

    var p = KeySet.prototype;


    /**
     * Overwrite the current set of keys.
     * @param newKeys An Array of IQualifiedKey objects.
     * @return true if the set changes as a result of calling this function.
     */
    p.replaceKeys = function (newKeys) {
        if (this._locked)
            return false;

        WeaveAPI.QKeyManager.convertToQKeys(newKeys);
        if (newKeys === this._keys)
            this._keys = this._keys.concat();

        var key;
        var changeDetected = false;

        // copy the previous key-to-index mapping for detecting changes
        var prevKeyIndex = this._keyIndex;

        // initialize new key index
        this._keyIndex = new Map();
        // copy new keys and create new key index
        this._keys.length = newKeys.length; // allow space for all keys
        var outputIndex = 0; // index to store internally
        for (var inputIndex = 0; inputIndex < newKeys.length; inputIndex++) {
            key = (newKeys[inputIndex] && newKeys[inputIndex] instanceof weavedata.IQualifiedKey) ? newKeys[inputIndex] : null;
            // avoid storing duplicate keys
            if (this._keyIndex.get(key) !== undefined)
                continue;
            // copy key
            this._keys[outputIndex] = key;
            // save key-to-index mapping
            this._keyIndex.set(key, outputIndex);
            // if the previous key index did not have this key, a change has been detected.
            if (prevKeyIndex.get(key) === undefined) {
                changeDetected = true;
                this.keyCallbacks.keysAdded.push(key);
            }
            // increase stored index
            outputIndex++;
        }
        this._keys.length = outputIndex; // trim to actual length
        // loop through old keys and see if any were removed
        for (var key of prevKeyIndex.keys()) {
            if (this._keyIndex.get(key) === undefined) // if this previous key is gone now, change detected
            {
                changeDetected = true;
                this.keyCallbacks.keysRemoved.push(key);
            }
        }

        if (changeDetected)
            updateSessionState.call(this);

        return changeDetected;
    }

    /**
     * Clear the current set of keys.
     * @return true if the set changes as a result of calling this function.
     */
    p.clearKeys = function () {
        if (this._locked)
            return false;

        // stop if there are no keys to remove
        if (this._keys.length === 0)
            return false; // set did not change

        this.keyCallbacks.keysRemoved = this.keyCallbacks.keysRemoved.concat(this._keys);

        // clear key-to-index mapping
        this._keyIndex = new Map();
        this._keys = [];

        updateSessionState.call(this);

        // set changed
        return true;
    }

    /**
     * @param key A IQualifiedKey object to check.
     * @return true if the given key is included in the set.
     */
    p.containsKey = function (key) {
        // the key is included in the set if it is in the key-to-index mapping.
        return this._keyIndex.get(key) !== undefined;
    }

    /**
     * Adds a vector of additional keys to the set.
     * @param additionalKeys A list of keys to add to this set.
     * @return true if the set changes as a result of calling this function.
     */
    p.addKeys = function (additionalKeys) {
        if (this._locked)
            return false;

        var changeDetected = false;
        WeaveAPI.QKeyManager.convertToQKeys(additionalKeys);
        additionalKeys.forEach(function (key) {
            if (this._keyIndex.get(key) === undefined) {
                // add key
                var newIndex = this._keys.length;
                this._keys[newIndex] = key;
                this._keyIndex.set(key, newIndex);

                changeDetected = true;
                this.keyCallbacks.keysAdded.push(key);
            }
        }.bind(this))

        if (changeDetected)
            updateSessionState.call(this);

        return changeDetected;
    }

    /**
     * Removes a vector of additional keys to the set.
     * @param unwantedKeys A list of keys to remove from this set.
     * @return true if the set changes as a result of calling this function.
     */
    p.removeKeys = function (unwantedKeys) {
        if (this._locked)
            return false;

        if (unwantedKeys === this._keys)
            return clearKeys();

        var changeDetected = false;
        WeaveAPI.QKeyManager.convertToQKeys(unwantedKeys);
        unwantedKeys.forEach(function (key) {
            if (this._keyIndex.get(key) !== undefined) {
                // drop key from this._keys vector
                var droppedIndex = this._keyIndex.get(key);
                if (droppedIndex < this._keys.length - 1) // if this is not the last entry
                {
                    // move the last entry to the droppedIndex slot
                    var lastKey = (this._keys[keys.length - 1] && this._keys[keys.length - 1] instanceof weavedata.IQualifiedKey) ? this._keys[keys.length - 1] : null;
                    this._keys[droppedIndex] = lastKey;
                    this._keyIndex[lastKey] = droppedIndex;
                }
                // update length of vector
                this._keys.length--;
                // drop key from object mapping
                this._keyIndex.delete(key);

                changeDetected = true;
                this.keyCallbacks.keysRemoved.push(key);
            }
        });

        if (changeDetected)
            updateSessionState.call(this);

        return changeDetected;
    }

    /**
     * This function sets the session state for the KeySet.
     * @param value A CSV-formatted String where each row is a keyType followed by a list of key strings of that keyType.
     */
    p.setSessionState = function (value) {

        // backwards compatibility -- parse CSV String
        if (value.constructor === String)
            value = WeaveAPI.CSVParser.parseCSV(value);

        // expecting a two-dimensional Array at this point
        weavecore.LinkableVariable.prototype.setSessionState.call(this, value);
    }


    //---------------------------------------------------------------------------------
    // test code
    // { test(); }
    KeySet.test = function () {
        var k = new KeySet();
        var k2 = new KeySet();
        k.addImmediateCallback(null, function () {
            traceKeySet(k);
        });

        testFunction(k, k.replaceKeys, 'create k', 't', ['a', 'b', 'c'], 't', ['a', 'b', 'c']);
        testFunction(k, k.addKeys, 'add', 't', ['b', 'c', 'd', 'e'], 't', ['a', 'b', 'c', 'd', 'e']);
        testFunction(k, k.removeKeys, 'remove', 't', ['d', 'e', 'f', 'g'], 't', ['a', 'b', 'c']);
        testFunction(k, k.replaceKeys, 'replace', 't', ['b', 'x'], 't', ['b', 'x']);

        k2.replaceKeys(WeaveAPI.QKeyManager.getQKeys('t', ['a', 'b', 'x', 'y']));
        console.log('copy k2 to k');
        WeaveAPI.SessionManager.copySessionState(k2, k);
        assert(k, WeaveAPI.QKeyManager.getQKeys('t', ['a', 'b', 'x', 'y']));




        testFunction(k, k.replaceKeys, 'replace k', 't', ['1'], 't', ['1']);
        testFunction(k, k.addKeys, 'add k', 't2', ['1'], 't', ['1'], 't2', ['1']);
        testFunction(k, k.removeKeys, 'remove k', 't', ['1'], 't2', ['1']);
        testFunction(k, k.addKeys, 'add k', 't2', ['1'], 't2', ['1']);

        var arr = WeaveAPI.QKeyManager.getAllKeyTypes();
        arr.forEach(function (t) {
            console.log('all keys (' + t + '):', KeySet.getKeyStrings(WeaveAPI.QKeyManager.getAllQKeys(t)));
        });
    }

    KeySet.getKeyStrings = function (qkeys) {
        var keyStrings = [];
        qkeys.forEach(function (key) {
            keyStrings.push(key.keyType + '#' + key.localName);
        });
        return keyStrings;
    }

    KeySet.traceKeySet = function (keySet) {
        console.log(' ->', KeySet.getKeyStrings(keySet.keys));
        console.log('   ', weavecore.Compiler.stringify(WeaveAPI.SessionManager.getSessionState(keySet)));
    }

    KeySet.testFunction = function (keySet, func, comment, keyType, keys, expectedResultKeyType, expectedResultKeys, expectedResultKeyType2, expectedResultKeys2) {
        expectedResultKeyType2 = (expectedResultKeyType2 === undefined) ? null : expectedResultKeyType2;
        expectedResultKeys2 = (expectedResultKeys2 === undefined) ? null : expectedResultKeys2;

        console.log(comment, keyType, keys);
        func(WeaveAPI.QKeyManager.getQKeys(keyType, keys));
        var keys1 = expectedResultKeys ? WeaveAPI.QKeyManager.getQKeys(expectedResultKeyType, expectedResultKeys) : [];
        var keys2 = expectedResultKeys2 ? WeaveAPI.QKeyManager.getQKeys(expectedResultKeyType2, expectedResultKeys2) : [];
        assert(keySet, keys1, keys2);
    }
    KeySet.assert = function (keySet, expectedKeys1, expectedKeys2) {
        expectedKeys2 = (expectedKeys2 === undefined) ? null : expectedKeys2;
        var qkey;
        var qkeyMap = new Map();
            [expectedKeys1, expectedKeys2].forEach(function (keys) {
            keys.forEach(function (qkey) {
                if (!keySet.containsKey(qkey))
                    throw new Error("KeySet does not contain expected keys");
                qkeyMap.set(qkey, true);
            });
        });

        keySet.keys.forEach(function (qkey) {
            if (qkeyMap.get(qkey) === undefined)
                throw new Error("KeySet contains unexpected keys");
        });
    }

    if (typeof exports !== 'undefined') {
        module.exports = KeySet;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.KeySet = KeySet;
    }

    weavecore.ClassUtils.registerClass('weavedata.KeySet', weavedata.KeySet);

}());
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
    Object.defineProperty(KeySetCallbackInterface, 'NS', {
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
    Object.defineProperty(KeySetCallbackInterface, 'CLASS_NAME', {
        value: 'KeySetCallbackInterface'
    });


    /**
     * Provides an interface for getting KeySet event-related information.
     */
    function KeySetCallbackInterface() {

        // specify the preCallback function in super() so list callback
        // variables will be set before each change callback.
        weavecore.CallbackCollection.call(this, setCallbackVariables.bind(this));

        /**
         * The keys that were most recently added, causing callbacks to trigger.
         * This can be used as a buffer prior to calling flushKeys().
         * @see #flushKeys()
         */
        this.keysAdded = [];

        /**
         * The keys that were most recently removed, causing callbacks to trigger.
         * This can be used as a buffer prior to calling flushKeys().
         * @see #flushKeys()
         */
        this.keysRemoved = [];

    }

    function setCallbackVariables(keysAdded, keysRemoved) {
        this.keysAdded = keysAdded;
        this.keysRemoved = keysRemoved;
    }

    KeySetCallbackInterface.prototype = new weavecore.CallbackCollection();
    KeySetCallbackInterface.prototype.constructor = KeySetCallbackInterface;

    var p = KeySetCallbackInterface.prototype;

    /**
     * This function should be called when keysAdded and keysRemoved are ready to be shared with the callbacks.
     * The keysAdded and keysRemoved Arrays will be reset to empty Arrays after the callbacks finish running.
     */
    p.flushKeys = function () {
        if (this.keysAdded.length || this.keysRemoved.length)
            this._runCallbacksImmediately(keysAdded, keysRemoved);
        setCallbackVariables.call(this, [], []); // reset the variables to new arrays
    }

    if (typeof exports !== 'undefined') {
        module.exports = KeySetCallbackInterface;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.KeySetCallbackInterface = KeySetCallbackInterface;
    }

    weavecore.ClassUtils.registerClass('weavedata.KeySetCallbackInterface', weavedata.KeySetCallbackInterface);

}());
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
    Object.defineProperty(KeySetUnion, 'NS', {
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
    Object.defineProperty(KeySetUnion, 'CLASS_NAME', {
        value: 'KeySetUnion'
    });

    KeySetUnion.debug = false;
    /**
     * This key set is the union of several other key sets.  It has no session state.
     *
     * @param keyInclusionLogic A function that accepts an IQualifiedKey and returns true or false.
     * @author adufilie
     * @author sanjay1909
     */
    function KeySetUnion() {
        weavedata.IKeySet.call(this);
        /**
         * This will be used to determine whether or not to include a key.
         */
        this._keyInclusionLogic = null;

        this._keySets = []; // Array of IKeySet
        this._allKeys = []; // Array of IQualifiedKey
        this._keyLookup = new Map(); // IQualifiedKey -> Boolean

        /**
         * Use this to check asynchronous task busy status.  This is kept separate because if we report busy status we need to
         * trigger callbacks when an asynchronous task completes, but we don't want to trigger KeySetUnion callbacks when nothing
         * changes as a result of completing the asynchronous task.
         */
        Object.defineProperty(this, 'busyStatus', {
            value: WeaveAPI.SessionManager.registerDisposableChild(this, new weavecore.CallbackCollection()) // separate owner for the async task to avoid affecting our busy status
        })


        this._asyncKeys; // keys from current key set
        this._asyncKeySetIndex; // index of current key set
        this._asyncKeyIndex; // index of current key
        this._prevCompareCounter; // keeps track of how many new keys are found in the old keys list
        this._newKeyLookup; // for comparing to new keys lookup
        this._newKeys; // new allKeys array in progress

        /**
         * This is a list of the IQualifiedKey objects that define the key set.
         */
        Object.defineProperty(this, 'keys', {
            get: function () {
                this._allKeys;
            }
        })
    }

    function _firstCallback() {
        console.log(this, 'trigger', keys.length, 'keys');
    }



    function asyncStart() {
        // remove disposed key sets
        for (var i = this._keySets.length; i--;)
            if (objectWasDisposed(this._keySets[i]))
                this._keySets.splice(i, 1);

            // restart async task
        this._prevCompareCounter = 0;
        this._newKeys = [];
        this._newKeyLookup = new Map();
        this._asyncKeys = null;
        this._asyncKeySetIndex = 0;
        this._asyncKeyIndex = 0;
        // high priority because all visualizations depend on key sets
        WeaveAPI.StageUtils.startTask(this.busyStatus, asyncIterate.bind(this), WeaveAPI.TASK_PRIORITY_HIGH, asyncComplete.bind(this), weavecore.StandardLib.substitute("Computing the union of {0} key sets", this._keySets.length));
    }

    function asyncIterate(stopTime) {
        for (; this._asyncKeySetIndex < this._keySets.length; this._asyncKeySetIndex++) {
            if (this._asyncKeys === null) {
                this._asyncKeys = (this._keySets[this._asyncKeySetIndex]).keys;
                this._asyncKeyIndex = 0;
            }

            for (; this._asyncKeys && this._asyncKeyIndex < this._asyncKeys.length; this._asyncKeyIndex++) {
                if (getTimer() > stopTime)
                    return (this._asyncKeySetIndex + this._asyncKeyIndex / this._asyncKeys.length) / this._keySets.length;

                var key = (this._asyncKeys[this._asyncKeyIndex] && this._asyncKeys[this._asyncKeyIndex] instanceof weavedata.IQualifiedKey) ? this._asyncKeys[this._asyncKeyIndex] : null;
                if (this._newKeyLookup.get(key) === undefined) // if we haven't seen this key yet
                {
                    var includeKey = (this._keyInclusionLogic === null) ? true : this._keyInclusionLogic(key);
                    this._newKeyLookup.set(key, includeKey);

                    if (includeKey) {
                        _newKeys.push(key);

                        // keep track of how many keys we saw both previously and currently
                        if (this._keyLookup.get(key) === true)
                            this._prevCompareCounter++;
                    }
                }
            }

            this._asyncKeys = null;
        }
        return 1; // avoids division by zero
    }

    function getTimer() {
        return new Date().getTime();
    }

    function asyncComplete() {
        // detect change
        if (this._allKeys.length != this._newKeys.length || this._allKeys.length != this._prevCompareCounter) {
            this._allKeys = this._newKeys;
            this._keyLookup = this._newKeyLookup;
            WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
        }

        this.busyStatus.triggerCallbacks();
    }

    KeySetUnion.prototype = new weavedata.IKeySet();
    KeySetUnion.prototype.constructor = KeySetUnion;
    var p = KeySetUnion.prototype;


    /**
     * This will add an IKeySet as a dependency and include its keys in the union.
     * @param keySet
     */
    p.addKeySetDependency = function (keySet) {
        if (this._keySets.indexOf(keySet) < 0) {
            this._keySets.push(keySet);
            WeaveAPI.SessionManager.getCallbackCollection(keySet).addDisposeCallback(this, asyncStart.bind(this));
            WeaveAPI.SessionManager.getCallbackCollection(keySet).addImmediateCallback(this, asyncStart.bind(this), true);
        }
    }



    /**
     * @param key A IQualifiedKey object to check.
     * @return true if the given key is included in the set.
     */
    p.containsKey = function (key) {
        return this._keyLookup.get(key) === true;
    }



    p.dispose = function () {
        this._keySets = null;
        this._allKeys = null;
        this._keyLookup = null;
        this._newKeyLookup = null;
    }

    if (typeof exports !== 'undefined') {
        module.exports = KeySetUnion;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.KeySetUnion = KeySetUnion;
    }

    weavecore.ClassUtils.registerClass('weavedata.KeySetUnion', weavedata.KeySetUnion);

}());
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
    Object.defineProperty(SortedKeySet, 'NS', {
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
    Object.defineProperty(SortedKeySet, 'CLASS_NAME', {
        value: 'SortedKeySet'
    });


    /**
     * Generates a function like <code>function(keys)</code> that returns a sorted copy of an Array of keys.
     * Note that the resulting sort function depends on WeaveAPI.StatisticsManager, so the sort function should be called
     * again when statistics change for any of the columns you provide.
     * @param columns An Array of IAttributeColumns or Functions mapping IQualifiedKeys to Numbers.
     * @param sortDirections Sort directions (-1, 0, 1)
     * @return A function that returns a sorted copy of an Array of keys.
     */
    SortedKeySet.generateSortCopyFunction = function (columns, sortDirections) {
        sortDirections = (sortDirections === undefined) ? null : sortDirections;
        return function (keys) {
            var params = [];
            var directions = [];
            var lastDirection = 1;
            for (var i = 0; i < columns.length; i++) {
                var param = columns[i];
                if (WeaveAPI.SessionManager.objectWasDisposed(param))
                    continue;
                if (param instanceof weavedata.IAttributeColumn) {
                    var stats = WeaveAPI.StatisticsCache.getColumnStatistics(param);
                    param = stats.hack_getNumericData();
                }
                if (!param || param instanceof weavedata.IKeySet)
                    continue;
                if (sortDirections && !sortDirections[i])
                    continue;
                lastDirection = (sortDirections ? sortDirections[i] : 1)
                params.push(param);
                directions.push(lastDirection);
            }
            var qkm = WeaveAPI.QKeyManager;
            params.push(qkm.keyTypeLookup, qkm.localNameLookup);
            directions.push(lastDirection, lastDirection);

            //var t = getTimer();
            var result = weavecore.StandardLib.sortOn(keys, params, directions, false);
            //trace('sorted',keys.length,'keys in',getTimer()-t,'ms',DebugUtils.getCompactStackTrace(new Error()));
            return result;
        };
    }

    //
    SortedKeySet._EMPTY_ARRAY = []


    /**
     * This provides the keys from an existing IKeySet in a sorted order.
     * Callbacks will trigger when the sorted result changes.
     */
    function SortedKeySet(keySet, sortCopyFunction, dependencies) {
        sortCopyFunction = (sortCopyFunction === undefined) ? null : sortCopyFunction;
        dependencies = (dependencies === undefined) ? null : dependencies;
        weavedata.IKeySet.call(this);

        this._triggerCounter = 0;
        this._dependencies = WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.CallbackCollection());
        this._keySet;
        this._sortCopyFunction = WeaveAPI.QKeyManager.keySortCopy;
        this._sortedKeys = [];


        this._keySet = keySet;
        this._sortCopyFunction = (sortCopyFunction) ? sortCopyFunction : QKeyManager.keySortCopy;

        dependencies.forEach(function (object) {
            WeaveAPI.SessionManager.registerLinkableChild(this._dependencies, object);
            if (object instanceof weavedata.IAttributeColumn) {
                var stats = WeaveAPI.StatisticsCache.getColumnStatistics(object);
                WeaveAPI.SessionManager.registerLinkableChild(this._dependencies, stats);
            }
        });
        WeaveAPI.SessionManager.registerLinkableChild(this._dependencies, this._keySet);
        /**
         * This is the list of keys from the IKeySet, sorted.
         */
        Object.defineProperty(this, 'keys', {
            get: function () {
                if (this._triggerCounter != this._dependencies.triggerCounter)
                    _validate.call(this);
                return this._sortedKeys;
            }
        })

    }



    function _validate() {
        this._triggerCounter = this._dependencies.triggerCounter;
        if (WeaveAPI.SessionManager.linkableObjectIsBusy(this))
            return;

        WeaveAPI.StageUtils.startTask(this, _asyncTask.bind(this), WeaveAPI.TASK_PRIORITY_NORMAL, _asyncComplete.bind(this));
    }




    function _asyncTask() {
        // first try sorting an empty array to trigger any column statistics requests
        this._sortCopyFunction(SortedKeySet._EMPTY_ARRAY);

        // stop if any async tasks were started
        if (WeaveAPI.SessionManager.linkableObjectIsBusy(this._dependencies))
            return 1;

        // sort the keys
        this._sortedKeys = this._sortCopyFunction(this._keySet.keys);

        return 1;
    }


    function _asyncComplete() {
        if (WeaveAPI.SessionManager.linkableObjectIsBusy(this._dependencies) || this._triggerCounter != this._dependencies.triggerCounter)
            return;

        WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
    }

    SortedKeySet.prototype = new weavedata.IKeySet();
    SortedKeySet.prototype.constructor = SortedKeySet;
    var p = SortedKeySet.prototype;

    /**
     * @inheritDoc
     */
    p.containsKey = function (key) {
        return this._keySet.containsKey(key);
    }

    if (typeof exports !== 'undefined') {
        module.exports = SortedKeySet;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.SortedKeySet = SortedKeySet;
    }

    weavecore.ClassUtils.registerClass('weavedata.SortedKeySet', weavedata.SortedKeySet);

}());
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

    AbstractAttributeColumn.prototype = new weavecore.CallbackCollection();
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
}());
/**
 * This column is defined by two columns of CSV data: keys and values.
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
    Object.defineProperty(CSVColumn, 'NS', {
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
    Object.defineProperty(CSVColumn, 'CLASS_NAME', {
        value: 'CSVColumn'
    });

    function CSVColumn() {
        weavedata.AbstractAttributeColumn.call(this);

        Object.defineProperty(this, "title", {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString())
        });
        /**
         * This should contain a two-column CSV with the first column containing the keys and the second column containing the values.
         */
        Object.defineProperty(this, "data", {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableVariable(), this.invalidate.bind(this))
        });

        /**
         * If this is set to true, the data will be parsed as numbers to produce the numeric data.
         */
        Object.defineProperty(this, "numericMode", {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(), this.invalidate.bind(this))
        });

        /**
         * This is the key type of the first column in the csvData.
         */
        Object.defineProperty(this, "keyType", {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(), this.invalidate.bind(this))
        });


        /**
         * This function returns the list of String values from the first column in the CSV data.
         */
        Object.defineProperty(this, "keys", {
            get: function () {
                // refresh the data if necessary
                if (this._dirty)
                    validate.call(this);

                return this._keys;
            }
        });


        this._keyToIndexMap = null; // This maps a key to a row index.
        this._keys = []; // list of keys from the first CSV column
        this._stringValues = []; // list of Strings from the first CSV column
        this._numberValues = []; // list of Numbers from the first CSV column

        this._dirty = true;
        this.numericMode.value = false;

    }

    function invalidate() {
        this._dirty = true;
    }


    /**
     * This function generates three Vectors from the CSV data: _keys, _stringValues, _numberValues
     */
    function validate() {
        // replace the previous _keyToIndexMap with a new empty one
        this._keyToIndexMap = new Map();
        this._keys.length = 0;
        this._stringValues.length = 0;
        this._numberValues.length = 0;

        var key;
        var value;
        var table = this.data.getSessionState() ? this.data.getSessionState() : [];
        for (var i = 0; i < table.length; i++) {
            var row = table[i];
            if (row === null || row.length === 0)
                continue; // skip blank lines

            // get the key from the first column and the value from the second.
            key = WeaveAPI.QKeyManager.getQKey(keyType.value, String(row[0]));
            value = String(row.length > 1 ? row[1] : '');

            // save the results of parsing the CSV row
            this._keyToIndexMap.set(this._keys.length);
            this._keys.push(key);
            this._stringValues.push(value);
            try {
                this._numberValues.push(Number(value));
            } catch (e) {
                this._numberValues.push(NaN);
            }
        }
        this.dirty = false;
    }

    CSVColumn.prototype = new weavedata.AbstractAttributeColumn();
    CSVColumn.prototype.constructor = CSVColumn;
    var p = CSVColumn.prototype;

    p.getMetadata = function (propertyName) {
        switch (propertyName) {
        case ColumnMetadata.TITLE:
            return this.title.value;
        case ColumnMetadata.KEY_TYPE:
            return this.keyType.value;
        case ColumnMetadata.DATA_TYPE:
            return this.numericMode.value ? 'number' : 'string';
        }
        return weavedata.AbstractAttributeColumn.prototype.getMetadata.call(this, propertyName);
    }

    /**
     * Use this function to set the keys and data of the column.
     * @param table An Array of rows where each row is an Array containing a key and a data value.
     */
    p.setDataTable = function (table) {
        var stringTable = [];
        for (var r = 0; r < table.length; r++) {
            var row = table[r].concat(); // make a copy of the row
            // convert each value to a string
            for (var c = 0; c < row.length; c++)
                row[c] = String(row[c]);
            stringTable[r] = row; // save the copied row
        }
        this.data.setSessionState(stringTable);
    }

    /**
     * @param key A key to test.
     * @return true if the key exists in this IKeySet.
     */
    p.containsKey = function (key) {
        // refresh the data if necessary
        if (this._dirty)
            validate.call(this);

        return this._keyToIndexMap.get(key) !== undefined;
    }

    /**
     * This function returns the corresponding numeric or string value depending on the dataType parameter and the numericMode setting.
     */


    p.getValueFromKey = function (key, dataType) {
        dataType = dataType ? dataType : null;
        // refresh the data if necessary
        if (this._dirty)
            validate.call(this);

        // get the index from the key
        var keyIndex = this._keyToIndexMap.get(key);

        // cast to different data types
        if (dataType === Boolean) {
            return !isNaN(keyIndex);
        }
        if (dataType === Number) {
            if (isNaN(keyIndex))
                return NaN;
            return this._numberValues[keyIndex];
        }
        if (dataType === String) {
            if (isNaN(keyIndex))
                return '';
            return this._stringValues[keyIndex];
        }

        // return default data type
        if (isNaN(keyIndex))
            return this.numericMode.value ? NaN : '';

        if (this.numericMode.value)
            return this._numberValues[keyIndex];

        return this._stringValues[keyIndex];
    }

    if (typeof exports !== 'undefined') {
        module.exports = CSVColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.CSVColumn = CSVColumn;
    }
    weavecore.ClassUtils.registerClass('weavedata.CSVColumn', weavedata.CSVColumn);

}());
(function () {
    function ColumnDataTask(parentColumn, dataFilter, callback) {
        dataFilter = (dataFilter === undefined) ? null : dataFilter;
        callback = (callback === undefined) ? null : callback;

        if (callback === null)
            callback = parentColumn.triggerCallbacks;

        /**
         * Asynchronous output.
         * recordKey:IQualifiedKey -&gt; Array&lt;Number&gt;
         */
        this.uniqueKeys = [];

        /**
         * Asynchronous output.
         * (dataType:Class, recordKey:IQualifiedKey) -&gt; value
         */
        this.arrayData = new Map();

        //private
        this._parentColumn = parentColumn;
        this._dataFilter = dataFilter;
        this._callback = callback;
        this._keys;
        this._data;
        this._i;
        this._n;
    }

    var p = ColumnDataTask.prototype;

    /**
     * @param inputKeys A Vector (or Array) of IQualifiedKey objects.
     * @param inputData A Vector (or Array) of data values corresponding to the inputKeys.
     * @param relevantContext
     * @param callback
     */
    p.begin = function (inputKeys, inputData) {
        if (inputKeys.length !== inputData.length)
            throw new Error(weavecore.StandardLib.substitute("Arrays are of different length ({0} != {1})", inputKeys.length, inputData.length));

        this._dataFilter = this._dataFilter;
        this._keys = inputKeys;
        this._data = inputData;
        this._i = 0;
        this._n = this._keys.length;
        this.uniqueKeys = [];
        this.arrayData = new Map();

        // high priority because not much can be done without data
        WeaveAPI.StageUtils.startTask(this._parentColumn, iterate.bind(this), WeaveAPI.TASK_PRIORITY_HIGH, this._callback, weavecore.StandardLib.substitute("Processing {0} records", this._n));
    }

    function iterate(stopTime) {
        console.log(this._i, this._n);
        for (; this._i < this._n; this._i++) {
            if (getTimer() > stopTime)
                return this._i / this._n;

            var value = this._data[this._i];
            if ((this._dataFilter !== null || this._dataFilter !== undefined) && !this._dataFilter(value))
                continue;

            var key = this._keys[this._i];
            var array = this.arrayData.get(key);
            if (!array) {
                this.uniqueKeys.push(key);
                array = [value]
                this.arrayData.set(key, array);
            } else {
                array.push(value);
            }
        }
        console.log(this._i, this._n, this.arrayData.get(key));
        return 1;
    }

    function getTimer() {
        return new Date().getTime();
    }

    if (typeof exports !== 'undefined') {
        module.exports = ColumnDataTask;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.ColumnDataTask = ColumnDataTask;
    }


}());
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
    Object.defineProperty(DateColumn, 'NS', {
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
    Object.defineProperty(DateColumn, 'CLASS_NAME', {
        value: 'DateColumn'
    });

    function DateColumn(metadata) {
        metadata = (metadata === undefined) ? null : metadata;
        weavedata.AbstractAttributeColumn.call(this, metadata);


    }



    DateColumn.prototype = new weavedata.AbstractAttributeColumn();
    DateColumn.prototype.constructor = DateColumn;
    var p = DateColumn.prototype;



    if (typeof exports !== 'undefined') {
        module.exports = DateColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.DateColumn = DateColumn;
    }

    weavecore.ClassUtils.registerClass('weavedata.DateColumn', weavedata.DateColumn);

}());
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


        WeaveAPI.SessionManager.registerLinkableChild(this, WeaveAPI.StatisticsCache.getColumnStatistics(this.internalDynamicColumn));


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

    weavecore.ClassUtils.registerClass('weavedata.ExtendedDynamicColumn', weavedata.ExtendedDynamicColumn);

}());
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

}());

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
    Object.defineProperty(IColumnWrapper, 'NS', {
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
    Object.defineProperty(IColumnWrapper, 'CLASS_NAME', {
        value: 'IColumnWrapper'
    });

    /**
     * This is an prototype for a column that is a wrapper for another column.
     * The data should always be retrieved from the wrapper class because the getValueFromKey() function may modify the data before returning it.
     * The purpose of this prototype is to allow you to check the type of the internal column.
     * One example usage of this is to check if the internal column is a StreamedGeometryColumn
     * so that you can request more detail from the tile service.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function IColumnWrapper() {
        weavedata.AbstractAttributeColumn.call(this);
    }

    IColumnWrapper.prototype = new weavedata.AbstractAttributeColumn();
    IColumnWrapper.prototype.constructor = IColumnWrapper;

    var p = IColumnWrapper.prototype;
    /**
     * @return The internal column this object is a wrapper for.
     */
    p.getInternalColumn = function () {
        console.log("Implement in Child");
    };

    if (typeof exports !== 'undefined') {
        module.exports = IColumnWrapper;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.IColumnWrapper = IColumnWrapper;
    }
     weavecore.ClassUtils.registerClass('weavedata.IColumnWrapper', weavedata.IColumnWrapper);

}());

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
    Object.defineProperty(KeyColumn, 'NS', {
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
    Object.defineProperty(KeyColumn, 'CLASS_NAME', {
        value: 'KeyColumn'
    });

    function KeyColumn(metadata) {
        metadata = (metadata === undefined) ? null : metadata;
        weavedata.AbstractAttributeColumn.call(this, metadata);

        Object.defineProperty(this, 'keyType', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString())
        });

        Object.defineProperty(this, 'keys', {
            value: []
        });


    }



    KeyColumn.prototype = new weavedata.AbstractAttributeColumn();
    KeyColumn.prototype.constructor = KeyColumn;
    var p = KeyColumn.prototype;

    p.getMetadata = function (propertyName) {
        if (propertyName === weavedata.ColumnMetadata.TITLE) {
            var kt = this.keyType.value;
            if (kt)
                return ("Key ({0})" + kt);
            return "Key";
        }
        if (propertyName === weavedata.ColumnMetadata.KEY_TYPE)
            return keyType.value;

        return KeyColumn.prototype.getMetadata(propertyName);
    }


    p.getValueFromKey = function (key, dataType) {
        dataType = (dataType === undefined) ? null : dataType;
        var kt = this.keyType.value;
        if (kt && key.keyType !== kt)
            return EquationColumnLib.cast(undefined, dataType);

        if (dataType === String)
            return key.localName;

        if (dataType === weavedata.IQualifiedKey)
            return key;

        return EquationColumnLib.cast(key, dataType);
    }



    if (typeof exports !== 'undefined') {
        module.exports = KeyColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.KeyColumn = KeyColumn;
    }

    weavecore.ClassUtils.registerClass('weavedata.KeyColumn', weavedata.KeyColumn);

}());
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
    Object.defineProperty(NumberColumn, 'NS', {
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
    Object.defineProperty(NumberColumn, 'CLASS_NAME', {
        value: 'NumberColumn'
    });


    Object.defineProperty(NumberColumn, 'compiler', {
        value: new weavecore.Compiler()
    });

    function NumberColumn(metadata) {
        metadata = (metadata === undefined) ? null : metadata;
        weavedata.AbstractAttributeColumn.call(this, metadata);

        this.dataTask = new weavedata.ColumnDataTask(this, isFinite, asyncComplete.bind(this));
        this.dataCache = new weavecore.Dictionary2D();

        this._lastError;


        this._numberToStringFunction = null;
    }



    NumberColumn.prototype = new weavedata.AbstractAttributeColumn();
    NumberColumn.prototype.constructor = NumberColumn;
    var p = NumberColumn.prototype;


    p.getMetadata = function (propertyName) {
        if (propertyName == weavedata.ColumnMetadata.DATA_TYPE)
            return weavedata.DataType.NUMBER;
        return weavedata.AbstractAttributeColumn.prototype.getMetadata.call(this, propertyName);
    }

    //TODO - implement IBaseColumn
    p.setRecords = function (keys, numericData) {
        this.dataTask.begin(keys, numericData);

        this._numberToStringFunction = null;
        // compile the string format function from the metadata
        var stringFormat = this.getMetadata(weavedata.ColumnMetadata.STRING);
        if (stringFormat) {
            try {
                this._numberToStringFunction = NumberColumn.compiler.compileToFunction(stringFormat, null, errorHandler.bind(this), false, [weavedata.ColumnMetadata.NUMBER, 'array']);
            } catch (e) {
                errorHandler.call(this, e);
            }
        }
    }

    function asyncComplete() {
        // cache needs to be cleared after async task completes because some values may have been cached while the task was busy
        this.dataCache = new weavecore.Dictionary2D();
        this.triggerCallbacks();
    }


    function errorHandler(e) {
        var str = e instanceof Error ? e.message : String(e);
        str = weavecore.StandardLib.substitute("Error in script for attribute column {0}:\n{1}", weavecore.Compiler.stringify(this._metadata), str);
        if (this._lastError !== str) {
            this._lastError = str;
            console.log(e);
        }
    }


    /**
     * Get a string value for a given number.
     */
    p.deriveStringFromNumber = function (number) {
        if (this._numberToStringFunction != null)
            return weavecore.StandardLib.asString(this._numberToStringFunction(number, [number]));
        return weavecore.StandardLib.formatNumber(number);
    }

    p.generateValue = function (key, dataType) {
        var array = this.dataTask.arrayData[key];

        if (this.dataType === Number)
            return NumberColumn.aggregate(array, this._metadata ? this._metadata[weavedata.ColumnMetadata.AGGREGATION] : null);

        if (this.dataType === String) {
            var number = this.getValueFromKey(key, Number);
            if (this._numberToStringFunction != null) {
                return weavecore.StandardLib.asString(this._numberToStringFunction(number, array));
            }
            if (isNaN(number) && array && array.length > 1) {
                var aggregation = (this._metadata && this._metadata[weavedata.ColumnMetadata.AGGREGATION]) || weavedata.Aggregation.DEFAULT;
                if (aggregation === weavedata.Aggregation.SAME)
                    return weavedata.StringColumn.AMBIGUOUS_DATA;
            }
            return weavedata.StandardLib.formatNumber(number);
        }

        if (this.dataType === weavedata.IQualifiedKey)
            return WeaveAPI.QKeyManager.getQKey(weavedata.DataType.NUMBER, this.getValueFromKey(key, Number));

        return null;
    }

    p.toString = function () {
        return WeaveAPI.debugId(this) + '{recordCount: ' + this.keys.length + ', keyType: "' + this.getMetadata('keyType') + '", title: "' + this.getMetadata('title') + '"}';
    }

    /**
     * Aggregates an Array of Numbers into a single Number.
     * @param numbers An Array of Numbers.
     * @param aggregation One of the constants in weave.api.data.Aggregation.
     * @return An aggregated Number.
     * @see weave.api.data.Aggregation
     */
    NumberColumn.aggregate = function (numbers, aggregation) {
        if (!numbers)
            return NaN;

        if (!aggregation)
            aggregation = weavedata.Aggregation.DEFAULT;

        switch (aggregation) {
        case weavedata.Aggregation.SAME:
            var first = numbers[0];
            for (var i = 0; i < number.length; i++) {
                value = numbers[i]
                if (value !== first)
                    return NaN;
            }
            return first;
        case weavedata.Aggregation.FIRST:
            return numbers[0];
        case weavedata.Aggregation.LAST:
            return numbers[numbers.length - 1];
        case weavedata.Aggregation.COUNT:
            return numbers.length;
        case weavedata.Aggregation.MEAN:
            return weavecore.StandardLib.mean(numbers);
        case weavedata.Aggregation.SUM:
            return weavecore.StandardLib.sum(numbers);
        case weavedata.Aggregation.MIN:
            return Math.min.apply(null, numbers);
        case weavedata.Aggregation.MAX:
            return Math.max.apply(null, numbers);
        default:
            return NaN;
        }
    }


    if (typeof exports !== 'undefined') {
        module.exports = NumberColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.NumberColumn = NumberColumn;
    }

    weavecore.ClassUtils.registerClass('weavedata.NumberColumn', weavedata.NumberColumn);


}());

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
    Object.defineProperty(StringColumn, 'NS', {
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
    Object.defineProperty(StringColumn, 'CLASS_NAME', {
        value: 'StringColumn'
    });

    Object.defineProperty(StringColumn, 'compiler', {
        value: new weavecore.Compiler()
    });


    /**
     * Aggregates an Array of Strings into a single String.
     * @param strings An Array of Strings.
     * @param aggregation One of the constants in weave.api.data.Aggregation.
     * @return An aggregated String.
     * @see weave.api.data.Aggregation
     */
    StringColumn.aggregate = function (strings, aggregation) {
        if (!strings)
            return undefined;

        if (!aggregation)
            aggregation = weavedata.Aggregation.DEFAULT;

        switch (aggregation) {
        case weavedata.Aggregation.SAME:
            var first = strings[0];
            for (var i = 0; i < strings.length; i++) {
                var value = string[i]
                if (value != first)
                    return StringColumn.AMBIGUOUS_DATA;
            }
            return first;

        case weavedata.Aggregation.FIRST:
            return strings[0];

        case weavedata.Aggregation.LAST:
            return strings[strings.length - 1];

        default:
            return undefined;
        }
    }

    StringColumn.getSupportedAggregationModes = function () {
        return [weavedata.Aggregation.SAME, weavedata.Aggregation.FIRST, weavedata.Aggregation.LAST];
    }

    /**
     * The string displayed when data for a record is ambiguous.
     */
    StringColumn.AMBIGUOUS_DATA = "Ambiguous data";


    function StringColumn(metadata) {
        metadata = (metadata === undefined) ? null : metadata;
        weavedata.AbstractAttributeColumn.call(this, metadata);

        /**
         * Sorted list of unique string values.
         */
        Object.defineProperty(this, '_uniqueStrings', {
            value: new Array()
        });
        Object.defineProperty(this, '_asyncSort', {
            value: WeaveAPI.SessionManager.registerDisposableChild(this, new weavecore.AsyncSort())
        });

        /**
         * String -> index in sorted _uniqueStrings
         */
        this._uniqueStringLookup;
        this._lastError;

        // variables that do not get reset after async task
        this._stringToNumberFunction = null;
        this._numberToStringFunction = null;

        this._i;
        this._numberToString = {};
        this._stringToNumber = {};

        this.dataTask = new weavedata.ColumnDataTask(this, filterStringValue, handleDataTaskComplete);
        this.dataCache = new weavecore.Dictionary2D();
        WeaveAPI.SessionManager.getCallbackCollection(this._asyncSort).addImmediateCallback(this, handleSortComplete);


    }



    StringColumn.prototype = new weavedata.AbstractAttributeColumn();
    StringColumn.prototype.constructor = StringColumn;
    var p = StringColumn.prototype;

    p.getMetadata = function (propertyName) {
        var value = weavedata.AbstractAttributeColumn.prototype.getMetadata.call(this, propertyName);
        if (!value && propertyName === weavedata.ColumnMetadata.DATA_TYPE)
            return weavedata.DataType.STRING;
        return value;
    }

    p.setRecords = function (keys, stringData) {
        this.dataTask.begin(keys, stringData);
        this._asyncSort.abort();

        this._uniqueStrings.length = 0;
        this._uniqueStringLookup = {};
        this._stringToNumberFunction = null;
        this._numberToStringFunction = null;

        // compile the number format function from the metadata
        var numberFormat = this.getMetadata(weavedata.ColumnMetadata.NUMBER);
        if (numberFormat) {
            try {
                this._stringToNumberFunction = StringColumn.compiler.compileToFunction(numberFormat, null, errorHandler.bind(this), false, [weavedata.ColumnMetadata.STRING, 'array']);
            } catch (e) {
                console.log(e);
            }
        }

        // compile the string format function from the metadata
        var stringFormat = this.getMetadata(weavedata.ColumnMetadata.STRING);
        if (stringFormat) {
            try {
                this._numberToStringFunction = StringColumn.compiler.compileToFunction(stringFormat, null, errorHandler, false, [weavedata.ColumnMetadata.NUMBER]);
            } catch (e) {
                console.log(e);
            }
        }
    }

    function filterStringValue(value) {
        if (!value)
            return false;

        // keep track of unique strings
        if (this._uniqueStringLookup[value] === undefined) {
            this._uniqueStrings.push(value);
            // initialize mapping
            this._uniqueStringLookup[value] = -1;
        }

        return true;
    }

    function handleDataTaskComplete() {
        // begin sorting unique strings previously listed
        this._asyncSort.beginSort(this._uniqueStrings, weavedata.AsyncSort.compareCaseInsensitive);
    }

    function handleSortComplete() {
        if (!this._asyncSort.result)
            return;

        this._i = 0;
        this._numberToString = {};
        // high priority because not much can be done without data
        WeaveAPI.StageUtils.startTask(this, _iterate.bind(this), WeaveAPI.TASK_PRIORITY_HIGH, asyncComplete.bind(this));
    }

    function _iterate(stopTime) {
        for (; this._i < this._uniqueStrings.length; this._i++) {
            if (new Date().getTime() > stopTime)
                return this._i / this._uniqueStrings.length;

            var string = this._uniqueStrings[_i];
            this._uniqueStringLookup[string] = _i;

            if (this._stringToNumberFunction != null) {
                var number = weavedata.StandardLib.asNumber(this._stringToNumberFunction(string));
                this._stringToNumber[string] = number;
                this._numberToString[number] = string;
            }
        }
        return 1;
    }

    function asyncComplete() {
        // cache needs to be cleared after async task completes because some values may have been cached while the task was busy
        this.dataCache = new weavecore.Dictionary2D();
        this.triggerCallbacks.call(this);
    }


    // find the closest string value at a given normalized value
    p.deriveStringFromNumber = function (number) {
        if (this._metadata && this._metadata[weavedata.ColumnMetadata.NUMBER]) {
            if (this._numberToString.hasOwnProperty(number))
                return this._numberToString[number];

            if (this._numberToStringFunction !== null)
                return this._numberToString[number] = weavecore.StandardLib.asString(this._numberToStringFunction(number));
        } else if (number === Number(number) && 0 <= number && number < this._uniqueStrings.length) {
            return this._uniqueStrings[Number(number)];
        }
        return '';
    }

    p.generateValue = function (key, dataType) {
        var array = this.dataTask.arrayData[key];

        if (dataType === String)
            return StringColumn.aggregate(array, this._metadata ? this._metadata[weavedata.ColumnMetadata.AGGREGATION] : null) || '';

        var string = this.getValueFromKey(key, String);

        if (dataType === Number) {
            if (this._stringToNumberFunction != null)
                return Number(this._stringToNumber[string]);

            return Number(this._uniqueStringLookup[string]);
        }

        if (dataType === weavedata.IQualifiedKey) {
            var type = this._metadata ? this._metadata[weavedata.ColumnMetadata.DATA_TYPE] : null;
            if (!type)
                type = weavedata.DataType.STRING;
            return WeaveAPI.QKeyManager.getQKey(type, string);
        }

        return null;
    }

    p.toString = function () {
        return WeaveAPI.debugId(this) + '{recordCount: ' + this.keys.length + ', keyType: "' + this.getMetadata('keyType') + '", title: "' + this.getMetadata('title') + '"}';
    }


    if (typeof exports !== 'undefined') {
        module.exports = StringColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.StringColumn = StringColumn;
    }

    weavecore.ClassUtils.registerClass('weavedata.StringColumn', weavedata.StringColumn);

}());
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
    Object.defineProperty(IDataSource, 'NS', {
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
    Object.defineProperty(IDataSource, 'CLASS_NAME', {
        value: 'IDataSource'
    });


    /**
     * This is a simple and generic interface for getting columns of data from a source.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function IDataSource() {
        weavecore.ILinkableObject.call(this);


        /**
         * When explicitly triggered, this will force the hierarchy to be refreshed.
         * This should not be used to determine when the hierarchy is updated.
         * For that purpose, add a callback directly to the IDataSource instead.
         */
        Object.defineProperty(this, "hierarchyRefresh", {
            get: function () {
                return null;
            },
            configurable: true
        });
    }

    IDataSource.prototype = new weavecore.ILinkableObject();
    IDataSource.prototype.constructor = IDataSource;
    var p = IDataSource.prototype;


    /**
     * Gets the root node of the attribute hierarchy, which should have descendant nodes that implement IColumnReference.
     */
    p.getHierarchyRoot = function () {};

    /**
     * Finds the hierarchy node that corresponds to a set of metadata, or null if there is no such node.
     * @param metadata Metadata used to identify a node in the hierarchy, which may or may not reference a column.
     * @return The hierarchy node corresponding to the metadata or null if there is no corresponding node.
     */
    p.findHierarchyNode = function (metadata) {};

    /**
     * Retrieves an IAttributeColumn from this IDataSource.
     * @param metadata Metadata used to identify a column in this IDataSource.
     * @return An IAttributeColumn object that will be updated when the column data is available.
     */
    p.getAttributeColumn = function (metadata) {};


    if (typeof exports !== 'undefined') {
        module.exports = IDataSource;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.IDataSource = IDataSource;

    }

    weavecore.ClassUtils.registerClass('weavedata.IDataSource', weavedata.IDataSource);

}());
/**
 * This is a base class to make it easier to develope a new class that implements IDataSource.
 * Classes that extend AbstractDataSource should implement the following methods:
 * getHierarchyRoot, generateHierarchyNode, requestColumnFromSource
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
    Object.defineProperty(AbstractDataSource, 'NS', {
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
    Object.defineProperty(AbstractDataSource, 'CLASS_NAME', {
        value: 'AbstractDataSource'
    });

    function AbstractDataSource() {
        weavedata.IDataSource.call(this);
        /*
         *
         * This variable is set to false when the session state changes and true when initialize() is called.*/
        this._initializeCalled = false;

        /**
         * This should be used to keep a pointer to the hierarchy root node.
         */
        this._rootNode;

        /**
         * ProxyColumn -> (true if pending, false if not pending)
         */
        this._proxyColumns = new Map();

        Object.defineProperty(this, "_hierarchyRefresh", {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.CallbackCollection(), refreshHierarchy.bind(this))
        });

        Object.defineProperty(this, "hierarchyRefresh", {
            get: function () {
                return this._hierarchyRefresh;
            }
        });

        /**
         * Classes that extend AbstractDataSource can define their own replacement for this function.
         * All column requests will be delayed as long as this accessor function returns false.
         * The default behavior is to return false during the time between a change in the session state and when initialize() is called.
         */
        Object.defineProperty(this, "initializationComplete", {
            get: function () {
                return this._initializeCalled;
            },
            configurable: true
        });

        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.addImmediateCallback(this, uninitialize.bind(this));
        cc.addGroupedCallback(this, this.initialize.bind(this), true);


    }


    AbstractDataSource.prototype = new weavedata.IDataSource();
    AbstractDataSource.prototype.constructor = AbstractDataSource;

    var p = AbstractDataSource.prototype;


    /**
     * Sets _rootNode to null and triggers callbacks.
     * @inheritDoc
     */
    function refreshHierarchy() {
        this._rootNode = null;
    }

    /**
     * This function must be implemented by classes that extend AbstractDataSource.
     * This function should set _rootNode if it is null, which may happen from calling refreshHierarchy().
     * @inheritDoc
     */
    p.getHierarchyRoot = function () {
        return this._rootNode;
    }

    /**
     * This function must be implemented by classes that extend AbstractDataSource.
     * This function should make a request to the source to fill in the proxy column.
     * @param proxyColumn Contains metadata for the column request and will be used to store column data when it is ready.
     */
    p.requestColumnFromSource = function (proxyColumn) {

    }

    /**
     * This function must be implemented by classes that extend AbstractDataSource.
     * @param metadata A set of metadata that may identify a column in this IDataSource.
     * @return A node that contains the metadata.
     */
    p.generateHierarchyNode = function (metadata) {
        return null;
    }

    /**
     * This function is called as an immediate callback and sets initialized to false.
     */
    function uninitialize() {
        this._initializeCalled = false;
    }

    /**
     * This function will be called as a grouped callback the frame after the session state for the data source changes.
     * When overriding this function, super.initialize() should be called.
     */
    p.initialize = function () {
        // set initialized to true so other parts of the code know if this function has been called.
        this._initializeCalled = true;

        handleAllPendingColumnRequests.call(this);
    }

    /**
     * The default implementation of this function calls generateHierarchyNode(metadata) and
     * then traverses the _rootNode to find a matching node.
     * This function should be overridden if the hierachy is not known completely, since this
     * may result in traversing the entire hierarchy, causing many remote procedure calls if
     * the hierarchy is stored remotely.
     * @inheritDoc
     */
    p.findHierarchyNode = function (metadata) {
        var path = HierarchyUtils.findPathToNode(this.getHierarchyRoot(), this.generateHierarchyNode(metadata));
        if (path)
            return path[path.length - 1];
        return null;
    }

    /**
     * This function creates a new ProxyColumn object corresponding to the metadata and queues up the request for the column.
     * @param metadata An object that contains all the information required to request the column from this IDataSource.
     * @return A ProxyColumn object that will be updated when the column data is ready.
     */
    p.getAttributeColumn = function (metadata) {
        var proxyColumn = WeaveAPI.SessionManager.registerDisposableChild(this, new weavedata.ProxyColumn());
        proxyColumn.setMetadata(metadata);
        var description = (WeaveAPI.globalHashMap.getName(this) || WeaveAPI.debugId(this)) + " pending column request";
        WeaveAPI.ProgressIndicator.addTask(proxyColumn, this, description);
        WeaveAPI.ProgressIndicator.addTask(proxyColumn, proxyColumn, description);
        handlePendingColumnRequest.call(this, proxyColumn);
        return proxyColumn;
    }


    /**
     * This function will call requestColumnFromSource() if initializationComplete==true.
     * Otherwise, it will delay the column request again.
     * This function may be overridden by classes that extend AbstractDataSource.
     * However, if the extending class decides it wants to call requestColumnFromSource()
     * for the pending column, it is recommended to call super.handlePendingColumnRequest() instead.
     * @param request The request that needs to be handled.
     */
    function handlePendingColumnRequest(column) {
        // If data source is already initialized (session state is stable, not currently changing), we can request the column now.
        // Otherwise, we have to wait.
        if (this.initializationComplete) {
            this._proxyColumns.set(column, false); // no longer pending
            WeaveAPI.ProgressIndicator.removeTask(column);
            this.requestColumnFromSource.call(this, column);
        } else {
            this._proxyColumns.set(column, true); // pending
        }
    }

    /**
     * This function will call handlePendingColumnRequest() on each pending column request.
     */
    function handleAllPendingColumnRequests() {
        for (var proxyColumn of this._proxyColumns.keys()) {
            if (this._proxyColumns.get(proxyColumn)) // pending?
                handlePendingColumnRequest.call(this, proxyColumn);
        }


    }

    /**
     * Calls requestColumnFromSource() on all ProxyColumn objects created previously via getAttributeColumn().
     */
    p.refreshAllProxyColumns = function () {
        for (var proxyColumn of this._proxyColumns.keys())
            handlePendingColumnRequest.call(this, proxyColumn);

    }

    /**
     * This function should be called when the IDataSource is no longer in use.
     * All existing pointers to objects should be set to null so they can be garbage collected.
     */
    p.dispose = function () {
        for (var column of this._proxyColumns.keys())
            WeaveAPI.ProgressIndicator.removeTask(column);

        this._initializeCalled = false;
        this._proxyColumns = null;
    }

    if (typeof exports !== 'undefined') {
        module.exports = AbstractDataSource;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.AbstractDataSource = AbstractDataSource;
    }

    weavecore.ClassUtils.registerClass('weavedata.AbstractDataSource', weavedata.AbstractDataSource);

}());
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
    Object.defineProperty(CSVDataSource, 'NS', {
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
    Object.defineProperty(CSVDataSource, 'CLASS_NAME', {
        value: 'CSVDataSource'
    });

    Object.defineProperty(CSVDataSource, 'METADATA_COLUMN_INDEX', {
        value: 'csvColumnIndex'
    });

    Object.defineProperty(CSVDataSource, 'METADATA_COLUMN_NAME', {
        value: 'csvColumn'
    });

    function CSVDataSource() {
        weavedata.AbstractDataSource.call(this);

        /**
         * Contains the csv data that should be used elsewhere in the code
         */
        this._parsedRows;
        this._cachedDataTypes = {};
        this._columnIds = [];
        this._keysVector;
        this._csvParser;

        Object.defineProperty(this, '_nullValues', {
            value: [null, "", "null", "\\N", "NaN"]
        });







        Object.defineProperty(this, '_keysCallbacks', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.CallbackCollection())
        });


        //public
        Object.defineProperty(this, 'csvData', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableVariable(Array, verifyRows.bind(this)), handleCSVDataChange.bind(this))
        });

        Object.defineProperty(this, 'keyType', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(), updateKeys.bind(this))
        });
        Object.defineProperty(this, 'keyColName', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(), updateKeys.bind(this))
        });
        Object.defineProperty(this, 'metadata', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableVariable(null, verifyMetadata.bind(this)))
        });

        Object.defineProperty(this, 'url', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableFile(), parseRawData.bind(this))
        });
        Object.defineProperty(this, 'delimiter', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(',', verifyDelimiter.bind(this)), parseRawData.bind(this))
        });

        WeaveAPI.SessionManager.registerLinkableChild(this.hierarchyRefresh, this.metadata);

        Object.defineProperty(this, 'initializationComplete', {
            get: function () {
                // make sure csv data is set before column requests are handled.
                return this.__proto__.initializationComplete && this._parsedRows && this._keysVector && !WeaveAPI.SessionManager.linkableObjectIsBusy(this._keysCallbacks);
            }
        });

    }

    CSVDataSource.prototype = new weavedata.AbstractDataSource();
    CSVDataSource.prototype.constructor = CSVDataSource;

    var p = CSVDataSource.prototype;




    function verifyRows(rows) {
        if (!rows) return false;
        return weavecore.StandardLib.arrayIsType(rows, Array);
    }

    function verifyMetadata(value) {

        return typeof value === 'object';
    }


    function verifyDelimiter(value) {
        return value && value.length === 1 && value !== '"';
    }


    function parseRawData() {
        if (!this.url.value)
            return;

        if (this.url.error)
            console.log(url.error);

        if (WeaveAPI.detectLinkableObjectChange(this.parseRawData, this.delimiter)) {
            if (this._csvParser)
                WeaveAPI.SessionManager.disposeObject(this._csvParser);
            this._csvParser = WeaveAPI.SessionManager.registerLinkableChild(this, new weavedata.CSVParser(true, this.delimiter.value), handleCSVParser.bind(this));
        }


        this._csvParser.parseCSV(String(this.url.result || ''));
    }


    /**
     * Called when csv parser finishes its task
     */
    function handleCSVParser() {
        // when csv parser finishes, handle the result
        if (this.url.value) {
            // when using url, we don't want to set session state of csvData
            handleParsedRows.call(this, this._csvParser.parseResult);
        } else {
            this.csvData.setSessionState(this._csvParser.parseResult);
        }
    }

    /**
     * Called when csvData session state changes
     */
    function handleCSVDataChange() {
        // save parsedRows only if csvData has non-null session state
        var rows = this.csvData.getSessionState();
        // clear url value when we specify csvData session state
        if (this.url.value && (rows !== null || rows !== undefined) && rows.length)
            this.url.value = null;
        if (!this.url.value)
            handleParsedRows.call(this, rows);
    }



    function handleParsedRows(rows) {
        if (!rows)
            rows = [];
        this._cachedDataTypes = {};
        this._parsedRows = rows;
        this._columnIds = rows[0] ? rows[0].concat() : [];
        // make sure column names are unique - if not, use index values for columns with duplicate names
        var nameLookup = {};
        for (var i = 0; i < this._columnIds.length; i++) {
            if (!this._columnIds[i] || nameLookup.hasOwnProperty(this._columnIds[i]))
                this._columnIds[i] = i;
            else
                nameLookup[this._columnIds[i]] = true;
        }
        updateKeys.call(this, true);
        this.hierarchyRefresh.triggerCallbacks();
    }



    function updateKeys(forced) {
        forced = (forced === undefined) ? false : forced;
        var changed = WeaveAPI.detectLinkableObjectChange(updateKeys.bind(this), this.keyType, this.keyColName);
        if (this._parsedRows && (forced || changed)) {
            var colNames = this._parsedRows[0] || [];
            // getColumnValues supports columnIndex -1
            var keyColIndex = -1;
            if (this.keyColName.value) {
                keyColIndex = colNames.indexOf(keyColName.value);
                // treat invalid keyColName as an error
                if (keyColIndex < 0)
                    keyColIndex = -2;
            }
            var keyStrings = getColumnValues.call(this, this._parsedRows, keyColIndex, []);
            var keyTypeString = this.keyType.value;

            this._keysVector = new Array();
            WeaveAPI.QKeyManager.getQKeysAsync(this._keysCallbacks, this.keyType.value, keyStrings, null, this._keysVector);
        }
    }



    p.generateHierarchyNode = function (metadata) {
        if (typeof metadata !== 'object')
            metadata = this.generateMetadataForColumnId(metadata);

        if (!metadata)
            return null;

        if (metadata.hasOwnProperty(CSVDataSource.METADATA_COLUMN_INDEX) || metadata.hasOwnProperty(CSVDataSource.METADATA_COLUMN_NAME)) {
            return new weavedata.ColumnTreeNode({
                dataSource: this,
                label: getColumnNodeLabel.bind(this),
                idFields: [CSVDataSource.METADATA_COLUMN_INDEX, CSVDataSource.METADATA_COLUMN_NAME],
                data: metadata
            });
        }

        return null;
    }

    function getColumnNodeLabel(node) {
        var title = node.data[weavedata.ColumnMetadata.TITLE] || node.data[CSVDataSource.METADATA_COLUMN_NAME];
        if (!title && node.data['name']) {
            title = node.data['name'];
            if (node.data['year'])
                title = StandardLib.substitute("{0} ({1})", title, node.data['year']);
        }
        return title;
    }



    p.requestColumnFromSource = function (proxyColumn) {
        var metadata = proxyColumn.getProxyMetadata();

        // get column id from metadata
        var columnId = metadata[CSVDataSource.METADATA_COLUMN_INDEX];
        if (columnId !== null || columnId !== undefined) {
            columnId = Number(columnId);
        } else {
            columnId = metadata[CSVDataSource.METADATA_COLUMN_NAME];
            if (!columnId) {
                // support for time slider
                for (var i = 0; i < this._columnIds.length; i++) {
                    var meta = getColumnMetadata.call(this, this._columnIds[i]);
                    if (!meta)
                        continue;
                    var found = 0;
                    for (var key in metadata) {
                        if (meta[key] != metadata[key]) {
                            found = 0;
                            break;
                        }
                        found++;
                    }
                    if (found) {
                        columnId = i;
                        break;
                    }
                }

                // backwards compatibility
                if (!columnId)
                    columnId = metadata["name"];
            }
        }

        // get column name and index from id
        var colNames = this._parsedRows[0] || [];
        var colIndex, colName;
        if (typeof columnId === 'number') {
            colIndex = Number(columnId);
            colName = colNames[columnId];
        } else {
            colIndex = colNames.indexOf(columnId);
            colName = String(columnId);
        }
        if (colIndex < 0) {
            proxyColumn.dataUnavailable("No such column: {0}", columnId);
            return;
        }

        metadata = this.generateMetadataForColumnId(columnId);
        proxyColumn.setMetadata(metadata);

        var strings = getColumnValues.call(this, this._parsedRows, colIndex, new Array());
        var numbers = null;
        var dateFormats = null;

        if (!this._keysVector || strings.length != this._keysVector.length) {
            proxyColumn.setInternalColumn(null);
            return;
        }

        var dataType = metadata[weavedata.ColumnMetadata.DATA_TYPE];

        if (dataType === null || dataType === undefined || dataType === weavedata.DataType.NUMBER) {
            numbers = stringsToNumbers.call(this, strings, dataType === weavedata.DataType.NUMBER);
        }

        if ((!numbers && (dataType === null || dataType === undefined)) || dataType === weavedata.DataType.DATE) {
            dateFormats = weavedata.DateColumn.detectDateFormats(strings);
        }

        var newColumn;
        if (numbers) {
            newColumn = new weavedata.NumberColumn(metadata);
            newColumn.setRecords(this._keysVector, numbers);
        } else {
            if (dataType === weavedata.DataType.DATE || (dateFormats && dateFormats.length > 0)) {
                newColumn = new weavedata.DateColumn(metadata);
                newColumn.setRecords(this._keysVector, strings);
            } else {
                newColumn = new weavedata.StringColumn(metadata);
                newColumn.setRecords(this._keysVector, strings);
            }
        }
        this._cachedDataTypes[columnId] = newColumn.getMetadata(weavedata.ColumnMetadata.DATA_TYPE);
        proxyColumn.setInternalColumn(newColumn);
    }


    /**
     * Gets whatever is stored in the "metadata" session state for the specified id.
     */


    function getColumnMetadata(id) {
        try {
            if (typeof (id) === 'number')
                id = this._columnIds[id];
            var meta = this.metadata.getSessionState();
            if (meta instanceof Array) {
                var array = meta;
                for (var i = 0; i < array.length; i++) {
                    var item = array[i];
                    var itemId = item[CSVDataSource.METADATA_COLUMN_NAME] || item[CSVDataSource.METADATA_COLUMN_INDEX];
                    if (itemId === undefined)
                        itemId = this._columnIds[i];
                    if (itemId === id)
                        return item;
                }
                return null;
            } else if (meta)
                return meta[id];
        } catch (e) {
            console.error(e);
        }
        return null;
    }


    function getColumnValues(rows, columnIndex, outputArrayOrVector) {
        outputArrayOrVector.length = Math.max(0, rows.length - 1);
        var i;
        if (columnIndex === -1) {
            // generate keys 0,1,2,3,...
            for (i = 1; i < rows.length; i++)
                outputArrayOrVector[i - 1] = i;
        } else {
            // get column value from each row
            for (i = 1; i < rows.length; i++)
                outputArrayOrVector[i - 1] = rows[i][columnIndex];
        }
        return outputArrayOrVector;
    }

    /**
     * Attempts to convert a list of Strings to Numbers. If successful, returns the Numbers.
     * @param strings The String values.
     * @param forced Always return a Vector of Numbers, whether or not the Strings look like Numbers.
     * @return Either a Vector of Numbers or null
     */
    function stringsToNumbers(strings, forced) {
        var numbers = new Array();
        numbers.length = strings.length
        var i = strings.length;
        outerLoop: while (i--) {
            var string = strings[i].trim();
            for (var j = 0; j < this._nullValues.length; j++) {
                var nullValue = this._nullValues[j];
                var a = nullValue && nullValue.toLocaleLowerCase();
                var b = string && string.toLocaleLowerCase();
                if (a === b) {
                    numbers[i] = NaN;
                    continue outerLoop;
                }
            }

            // if a string is 2 characters or more and begins with a '0', treat it as a string.
            if (!forced && string.length > 1 && string.charAt(0) === '0' && string.charAt(1) != '.')
                return null;

            if (string.indexOf(',') >= 0)
                string = string.split(',').join('');

            var number = Number(string);
            if (isNaN(number) && !forced)
                return null;

            numbers[i] = number;
        }
        return numbers;
    }




    /**
     * This gets called as a grouped callback.
     */

    p.initialize = function () {
        // if url is specified, do not use csvDataString
        if (this.url.value)
            this.csvData.setSessionState(null);

        // recalculate all columns previously requested because CSV data may have changed.
        this.refreshAllProxyColumns();

        weavedata.AbstractDataSource.prototype.initialize.call(this);
    }

    /**
     * Convenience function for setting session state of csvData.
     * @param rows
     */
    p.setCSVData = function (rows) {
        if (!verifyRows.call(this, rows))
            throw new Error("Invalid data format. Expecting nested Arrays.");
        this.csvData.setSessionState(rows);
    }

    p.getCSVData = function () {
        return this.csvData.getSessionState();
    }

    /**
     * Convenience function for setting session state of csvData.
     * @param csvDataString CSV string using comma as a delimiter.
     */
    p.setCSVDataString = function (csvDataString) {
        this.csvData.setSessionState(WeaveAPI.CSVParser.parseCSV(csvDataString));
    }

    /**
     * This will get a list of column names in the data, which are taken directly from the header row and not guaranteed to be unique.
     */
    p.getColumnNames = function () {
        if (this._parsedRows && this._parsedRows.length)
            return this._parsedRows[0].concat();
        return [];
    }

    /**
     * A unique list of identifiers for columns which may be a mix of Strings and Numbers, depending on the uniqueness of column names.
     */
    p.getColumnIds = function () {
        return this._columnIds.concat();
    }



    p.getColumnTitle = function (id) {
        var meta = getColumnMetadata.call(this, id);
        var title = meta ? meta[CSVDataSource.ColumnMetadata.TITLE] : null;
        if (!title && typeof id === 'number' && this._parsedRows && this._parsedRows.length)
            title = this._parsedRows[0][id];
        if (!title)
            title = String(id);
        return title;
    }



    p.generateMetadataForColumnId = function (id) {
        var metadata = {};
        metadata[weavedata.ColumnMetadata.TITLE] = this.getColumnTitle(id);
        metadata[weavedata.ColumnMetadata.KEY_TYPE] = this.keyType.value || weavedata.DataType.STRING;
        if (this._cachedDataTypes[id])
            metadata[weavedata.ColumnMetadata.DATA_TYPE] = this._cachedDataTypes[id];

        // get column metadata from session state
        var meta = getColumnMetadata.call(this, id);
        for (var key in meta)
            metadata[key] = meta[key];

        // overwrite identifying property
        if (typeof id === 'number')
            metadata[CSVDataSource.METADATA_COLUMN_INDEX] = id;
        else
            metadata[CSVDataSource.METADATA_COLUMN_NAME] = id;

        return metadata;
    }

    p.getAttributeColumn = function (metadata) {
        if (typeof metadata != 'object')
            metadata = this.generateMetadataForColumnId(metadata);
        return weavedata.AbstractDataSource.prototype.getAttributeColumn.call(this, metadata);
    }

    /**
     * This function will get a column by name or index.
     * @param columnNameOrIndex The name or index of the CSV column to get.
     * @return The column.
     */
    p.getColumnById = function (columnNameOrIndex) {
        return WeaveAPI.AttributeColumnCache.getColumn(this, columnNameOrIndex);
    }

    /**
     * This function will create a column in an ILinkableHashMap that references a column from this CSVDataSource.
     * @param columnNameOrIndex Either a column name or zero-based column index.
     * @param destinationHashMap The hash map to put the column in.
     * @return The column that was created in the hash map.
     */
    p.putColumnInHashMap = function (columnNameOrIndex, destinationHashMap) {
        var sourceOwner = WeaveAPI.SessionManager.getLinkableOwner(this);
        if (!sourceOwner)
            return null;

        WeaveAPI.SessionManager.getCallbackCollection(destinationHashMap).delayCallbacks();
        var refCol = destinationHashMap.requestObject(null, weavedata.ReferencedColumn, false);
        refCol.setColumnReference(this, this.generateMetadataForColumnId(columnNameOrIndex));
        WeaveAPI.SessionManager.getCallbackCollection(destinationHashMap).resumeCallbacks();
        return refCol;
    }

    /**
     * This will modify a column object in the session state to refer to a column in this CSVDataSource.
     * @param columnNameOrIndex Either a column name or zero-based column index.
     * @param columnPath A DynamicColumn or the path in the session state that refers to a DynamicColumn.
     * @return A value of true if successful, false if not.
     * @see weave.api.IExternalSessionStateInterface
     */
    p.putColumn = function (columnNameOrIndex, dynamicColumnOrPath) {
        var sourceOwner = WeaveAPI.SessionManager.getLinkableOwner(this);
        if (!sourceOwner)
            return false;

        var dc = (dynamicColumnOrPath && dynamicColumnOrPath instanceof weavedata.DynamicColumn) ? dynamicColumnOrPath : null;
        if (!dc) {
            WeaveAPI.ExternalSessionStateInterface.requestObject(dynamicColumnOrPath, weavedata.DynamicColumn.className);
            dc = WeaveAPI.getObject(dynamicColumnOrPath);
        }
        if (!dc)
            return false;

        WeaveAPI.SessionManager.getCallbackCollection(dc).delayCallbacks();
        var refCol = dc.requestLocalObject(weavedata.ReferencedColumn, false);
        refCol.setColumnReference(this, this.generateMetadataForColumnId(columnNameOrIndex));
        WeaveAPI.SessionManager.getCallbackCollection(dc).resumeCallbacks();

        return true;

    }




    /**
     * Gets the root node of the attribute hierarchy.
     */
    p.getHierarchyRoot = function () {
        if (!_rootNode)
            _rootNode = new weavedata.ColumnTreeNode({
                dataSource: this,
                label: WeaveAPI.globalHashMap.getName(this),
                children: function (root) {
                    var items = metadata.getSessionState();
                    if (!items)
                        items = this.getColumnIds();
                    var children = [];
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        children[i] = this.generateHierarchyNode.call(this, item) || this.generateHierarchyNode.call(this, i);
                    }
                    return children;
                }.bind(this)
            });
        return _rootNode;
    }

    if (typeof exports !== 'undefined') {
        module.exports = CSVDataSource;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.CSVDataSource = CSVDataSource;
    }

    weavecore.ClassUtils.registerClass('weavedata.CSVDataSource', weavedata.CSVDataSource);

}());
(function () {

    /**
     * A node in a tree whose leaves identify attribute columns.
     * The following properties are used for equality comparison, in addition to node class definitions:<br>
     * <code>dependency, data</code><br>
     * The following properties are used by WeaveTreeDescriptorNode but not for equality comparison:<br>
     * <code>label, children, hasChildBranches</code><br>
     */
    function WeaveTreeDescriptorNode(params) {

        weavecore.WeaveTreeItem.call(this);

        this.__hasChildBranches = null;
        /**
         * Set this to true if this node is a branch, or false if it is not.
         * Otherwise, hasChildBranches() will check isBranch() on each child returned by getChildren().
         */
        Object.defineProperty(this, '_hasChildBranches', {
            set: function (value) {
                this._counter['hasChildBranches'] = undefined;
                this.__hasChildBranches = value;
            }
        })

        this.childItemClass = WeaveTreeDescriptorNode;

        for (var key in params) {
            if (this[key] instanceof Function && this.hasOwnProperty('_' + key))
                this['_' + key] = params[key];
            else
                this[key] = params[key];
        }
    }

    WeaveTreeDescriptorNode.prototype = new weavecore.WeaveTreeItem();
    WeaveTreeDescriptorNode.prototype.constructor = WeaveTreeDescriptorNode;

    var p = WeaveTreeDescriptorNode.prototype;
    /**
     * @inheritDoc
     */
    p.equals = function (other) {
        var that = (other && other instanceof WeaveTreeDescriptorNode) ? other : null;
        if (!that)
            return false;

        // compare constructor
        if (Object(this).constructor !== Object(that).constructor)
            return false; // constructor differs

        // compare dependency
        if (this.dependency !== that.dependency)
            return false; // dependency differs

        if (weavecore.StandardLib.compare(this.data, that.data) !== 0)
            return false; // data differs

        return true;
    }

    /**
     * @inheritDoc
     */
    p.getLabel = function () {
        return this.label;
    }

    /**
     * @inheritDoc
     */
    p.isBranch = function () {
        // assume that if children property was defined that this is a branch
        return this._children != null;
    }

    /**
     * @inheritDoc
     */
    p.hasChildBranches = function () {
        const id = 'hasChildBranches';
        if (this.isCached(id))
            return this.cache(id);

        if (this.__hasChildBranches !== null)
            return this.cache(id, this.getBoolean(this.__hasChildBranches, id));

        var children = this.getChildren();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.isBranch())
                return this.cache(id, true);
        }


        return this.cache(id, false);
    }

    /**
     * @inheritDoc
     */
    p.getChildren = function () {
        return this.children;
    }


    if (typeof exports !== 'undefined') {
        module.exports = WeaveTreeDescriptorNode;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.WeaveTreeDescriptorNode = WeaveTreeDescriptorNode;
    }

}());
/**
 * A node in a tree whose leaves identify attribute columns.
 * The <code>data</code> property is used for column metadata on leaf nodes.
 * The following properties are used for equality comparison, in addition to node class definitions:<br>
 * <code>dataSource, data, idFields</code><br>
 * The following properties are used by ColumnTreeNode but not for equality comparison:<br>
 * <code>label, children, hasChildBranches</code><br>
 */
(function () {
    /**
     * The <code>data</code> parameter is used for column metadata on leaf nodes.
     * The following properties are used for equality comparison, in addition to node class definitions:
     *     <code>dependency, data, dataSource, idFields</code><br>
     * The following properties are used by ColumnTreeNode but not for equality comparison:
     *     <code>label, children, hasChildBranches</code><br>
     * @params An values for the properties of this ColumnTreeNode.
     *         The <code>dataSource</code> property is required.
     *         If no <code>dependency</code> property is given, <code>dataSource.hierarchyRefresh</code> will be used as the dependency.
     */

    function ColumnTreeNode(params) {
        weavedata.WeaveTreeDescriptorNode.call(this, params);

        /**
         * IDataSource for this node.
         */
        this.dataSource = null;

        /**
         * A list of data fields to use for node equality tests.
         */
        this.idFields = null;

        /**
         * If there is no label, this will use data['title'] if defined.
         */
        Object.defineProperty(this, 'label', {
            get: function () {
                var str = weavedata.WeaveTreeDescriptorNode.prototype.label;
                if (!str && data)
                    str = (typeof data === 'object' && data.hasOwnProperty(weavedata.ColumnMetadata.TITLE)) ? data[weavedata.ColumnMetadata.TITLE] : data.toString();
                return str;
            },
            configurable: true
        });

        this.childItemClass = ColumnTreeNode;

        if (!this.dataSource)
            throw new Error('ColumnTreeNode constructor: "dataSource" parameter is required');
        if (!this.dependency)
            this.dependency = this.dataSource.hierarchyRefresh;

    }
    ColumnTreeNode.prototype = new weavedata.WeaveTreeDescriptorNode();
    ColumnTreeNode.prototype.constructor = ColumnTreeNode;

    var p = ColumnTreeNode.prototype;


    /**
     * Compares constructor, dataSource, dependency, data, idFields.
     * @inheritDoc
     */
    p.equals = function (other) {
        var that = (other && other instanceof ColumnTreeNode) ? other : null;
        if (!that)
            return false;

        // compare constructor
        if (Object(this).constructor !== Object(that).constructor)
            return false; // constructor differs

        // compare dependency
        if (this.dependency !== that.dependency)
            return false; // dependency differs

        // compare dataSource
        if (this.dataSource !== that.dataSource)
            return false; // dataSource differs

        // compare idFields
        if (weavecore.StandardLib.compare(this.idFields, that.idFields) !== 0)
            return false; // idFields differs

        // compare data
        if (this.idFields) // partial data comparison
        {
            for (var i = 0; i < idFields.length; i++) {
                var field = idFields[i];
                if (weavecore.StandardLib.compare(this.data[field], that.data[field]) !== 0)
                    return false; // data differs
            }
        } else if (weavecore.StandardLib.compare(this.data, that.data) !== 0) // full data comparison
            return false; // data differs

        return true;
    }

    /**
     * @inheritDoc
     */
    p.getDataSource = function () {
        return this.dataSource;
    }

    /**
     * @inheritDoc
     */
    p.getColumnMetadata = function () {
        if (this.isBranch())
            return null;
        return data;
    }

    /**
     * @inheritDoc
     */
    p.findPathToNode = function (descendant) {
        // base case - if nodes are equal
        if (this.equals(descendant))
            return [this];

        // stopping condition - if ColumnTreeNode descendant dataSource or idFields values differ
        var _descendant = (descendant && descendant instanceof ColumnTreeNode) ? descendant : null;
        if (_descendant) {
            // don't look for a descendant with different a dataSource
            if (weavecore.StandardLib.compare(this.dataSource, _descendant.dataSource) != 0)
                return null;

            // if this node has idFields, make sure the id values match those of the descendant

            if (this.idFields && this.data && _descendant.data)
                for (var i = 0; i < idFields.length; i++) {
                    var field = idFields[i];
                    if (this.data[field] != _descendant.data[field])
                        return null;
                }

        }

        // finally, check each child
        var children = this.getChildren()
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var path = weavedata.HierarchyUtils.findPathToNode(child, descendant);
            if (path) {
                path.unshift(this);
                return path;
            }
        }

        return null;
    }

    if (typeof exports !== 'undefined') {
        module.exports = ColumnTreeNode;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.ColumnTreeNode = ColumnTreeNode;
    }

}());
