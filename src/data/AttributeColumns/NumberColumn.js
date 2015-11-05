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
