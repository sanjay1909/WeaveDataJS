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
            get: this._getinitializationComplete
        });

    }

    CSVDataSource.prototype = new weavedata.AbstractDataSource();
    CSVDataSource.prototype.constructor = CSVDataSource;

    var p = CSVDataSource.prototype;

    //override getter
    p._getinitializationComplete = function () {
        var ic = weavedata.AbstractDataSource.prototype._getinitializationComplete.call(this);
        return ic && this._parsedRows && this._keysVector && !WeaveAPI.SessionManager.linkableObjectIsBusy(this._keysCallbacks);
    }

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

        if (WeaveAPI.detectLinkableObjectChange(parseRawData, this.delimiter)) {
            if (this._csvParser)
                WeaveAPI.SessionManager.disposeObject(this._csvParser);
            //to-do replac eot asyncmode, tesitng with normal mode now
            this._csvParser = WeaveAPI.SessionManager.registerLinkableChild(this, new weavedata.CSVParser(false, this.delimiter.value), handleCSVParser.bind(this));
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
