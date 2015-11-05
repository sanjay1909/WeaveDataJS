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
