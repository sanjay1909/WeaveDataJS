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
