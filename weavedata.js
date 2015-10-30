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
        while (column instanceof IColumnWrapper)
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
            if (columnWrapper instanceof ExtendedDynamicColumn)
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
        console.log('window is used');
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
        console.log('window is used');
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
        console.log('window is used');
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
        console.log('window is used');
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
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.Aggregation = Aggregation;
    }

}());

/*package weave.data
{
	import flash.utils.Dictionary;
	import flash.utils.getTimer;

	import weave.api.core.ILinkableObject;
	import weave.api.data.DataType;
	import weave.api.data.IQualifiedKey;
	import weave.api.data.IQualifiedKeyManager;
	import weave.compiler.StandardLib;
	import weave.flascc.stringHash;
	import weave.utils.WeavePromise;*/

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

    /**
     * @param output An output Array or Vector for IQualifiedKeys.
     */
    p.getQKeys_range = function (keyType, keyStrings, iStart, iEnd, output) {
        // if there is no keyType specified, use the default
        if (!keyType)
            keyType = "string";

        // get mapping of key strings to QKey weak references
        var keyLookup = _keys[keyType];
        if (keyLookup === null) {
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
                this.keyLookup.set(hash, qkey)
                this.keyTypeLookup(qkey, keyType);
                this.localNameLookup(qkey, localName);
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
        var keys = new Array(keyStrings.length);
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
        console.log('window is used');
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
        console.log('window is used');
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
        WeaveAPI.StageUtils.startTask(relevantContext, iterate, WeaveAPI.TASK_PRIORITY_HIGH, asyncComplete.bind(this), weavedata.StandardLib.substitute("Initializing {0} record identifiers", keyStrings.length));

        return this;
    }

    function iterate(stopTime) {
        for (; this._i < this._keyStrings.length; this._i += batch) {
            if (getTimer() > stopTime)
                return this._i / this._keyStrings.length;

            this._manager.getQKeys_range(this._keyType, this._keyStrings, this._i, Math.min(this._i + batch, this._keyStrings.length), this._outputKeys);
        }
        return 1;
    }



    function asyncComplete() {
        setResult(this.this._outputKeys);
    }

    if (typeof exports !== 'undefined') {
        module.exports = QKeyGetter;
    } else {
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.QKeyGetter = QKeyGetter;
    }
}());
(function () {
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
            WeaveAPI.StageUtils.startTask(this, parseIterate.bind(this), WeaveAPI.TASK_PRIORITY_3_PARSING, parseDone.bind(this));
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
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.CSVParser = CSVParser;
        window.WeaveAPI = window.WeaveAPI ? window.WeaveAPI : {};
        WeaveAPI.CSVParser = new CSVParser();
    }

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
        console.log('window is used');
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
        console.log('window is used');
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
        console.log('window is used');
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
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.EntityType = EntityType;
    }

}());
/**
 * This object contains a mapping from keys to data values.
 *
 * @author adufilie
 * @author sanjay1909
 */

(function () {
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
            }
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
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.AbstractAttributeColumn = AbstractAttributeColumn;
    }
}());
/**
 * This column is defined by two columns of CSV data: keys and values.
 *
 * @author adufilie
 * @author asanjay
 */
(function () {
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
        return CSVColumn.prototype.getMetadata(propertyName);
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
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.CSVColumn = CSVColumn;
    }


}());
(function () {
    function ColumnDataTask(parentColumn, dataFilter, callback) {
        dataFilter = (dataFilter === undefined) ? dataFilter : null;
        callback = (callback === undefined) ? callback : null;

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

        this._dataFilter = dataFilter;
        this._keys = inputKeys;
        this._data = inputData;
        this._i = 0;
        this._n = keys.length;
        this.uniqueKeys = [];
        this.arrayData = new Map();

        // high priority because not much can be done without data
        WeaveAPI.StageUtils.startTask(this._parentColumn, iterate.bind(this), WeaveAPI.TASK_PRIORITY_HIGH, this._callback, weavecore.StandardLib.substitute("Processing {0} records", this._n));
    }

    function iterate(stopTime) {
        for (; this._i < this._n; this._i++) {
            if (getTimer() > stopTime)
                return this._i / this._n;

            var value = this._data[this._i];
            if (this._dataFilter !== null && !this._dataFilter(value))
                continue;

            var key = keys[this._i];
            var array = this.arrayData.get(key);
            if (!array) {
                this.uniqueKeys.push(key);
                array = [value]
                this.arrayData.set(key, array);
            } else {
                array.push(value);
            }
        }
        return 1;
    }

    function getTimer() {
        return new Date().getTime();
    }

    if (typeof exports !== 'undefined') {
        module.exports = ColumnDataTask;
    } else {
        console.log('window is used');
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
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.DateColumn = DateColumn;
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
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.DynamicColumn = DynamicColumn;
    }

}());

if (this.weavedata === undefined) this.weavedata = {};
(function () {
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
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.IColumnWrapper = IColumnWrapper;
    }
}());
/**
 *
 * @author adufilie
 * @author asanjay
 */
(function () {
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
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.KeyColumn = KeyColumn;
    }


}());
/**
 *
 * @author adufilie
 * @author asanjay
 */
(function () {

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
        return NumberColumn.prototype.getMetadata(propertyName);
    }

    //TODO - implement IBaseColumn
    p.setRecords = function (keys, numericData) {
        this.dataTask.begin(keys, numericData);

        this._numberToStringFunction = null;
        // compile the string format function from the metadata
        var stringFormat = this.getMetadata(ColumnMetadata.STRING);
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
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.NumberColumn = NumberColumn;
    }


}());
/**
 * This provides a wrapper for a referenced column.
 *
 * @author adufilie
 * @author sanjay1909
 */
(function () {
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
            value: WeaveAPI.SessionManager.registerLinkableChild(this, weavecore.LinkableString, this._updateDataSource.bind(this)),
            writable: false
        });
        /**
         * This holds the metadata used to identify a column.
         */
        Object.defineProperty(this, 'metadata', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, weavecore.LinkableVariable),
            writable: false
        });

        Object.defineProperty(this, '_columnWatcher', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, weavecore.LinkableWatcher),
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
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.ReferencedColumn = ReferencedColumn;
    }


}());
/**
 *
 * @author adufilie
 * @author asanjay
 */
(function () {

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
        var value = weavedata.StringColumn.prototype.getMetadata(propertyName);
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
        this.triggerCallbacks();
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
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.StringColumn = StringColumn;
    }


}());
