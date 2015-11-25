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
    Object.defineProperty(ColorColumn, 'NS', {
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
    Object.defineProperty(ColorColumn, 'CLASS_NAME', {
        value: 'ColorColumn'
    });

    function ColorColumn() {

        weavedata.ExtendedDynamicColumn.call(this);

        Object.defineProperties(this, {
            'ramp': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavedata.ColorRamp())
            },
            'rampCenterAtZero': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(false), cacheState.bind(this))
            },
            'recordColors': {
                /**
                 * This is a CSV containing specific colors associated with record keys.
                 * The format for each row in the CSV is:  keyType,localName,color
                 */
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableVariable(null, verifyRecordColors.bind(this)))
            }
        })




        this._rampCenterAtZero;
        // color values depend on the min,max stats of the internal column
        this._internalColumnStats;
        this._recordColorsTriggerCounter = 0;


        this._recordColorsMap;

        this._internalColumnStats = WeaveAPI.SessionManager.registerLinkableChild(this, WeaveAPI.StatisticsCache.getColumnStatistics(this.internalDynamicColumn));


    }

    function cacheState() {
        this._rampCenterAtZero = this.rampCenterAtZero.value;
    }

    function verifyRecordColors(value) {
        if (typeof value === "string") {
            value = WeaveAPI.CSVParser.parseCSV(value);
            this.recordColors.setSessionState(value);
            return false;
        }
        if (value === null)
            return true;

        return value.constructor === Array && weavecore.StandardLib.arrayIsType(value, Array);
    }


    function handleRecordColors() {
        var rows = this.recordColors.getSessionState();
        this._recordColorsMap = new Map();
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (row.length !== 3)
                continue;
            try {
                var key = WeaveAPI.QKeyManager.getQKey(row[0], row[1]);
                var color = weavecore.StandardLib.asNumber(row[2]);
                this._recordColorsMap.set(key, color);
            } catch (e) {
                console.error(e);
            }
        }

    }

    ColorColumn.prototype = new weavedata.ExtendedDynamicColumn();
    ColorColumn.prototype.constructor = ColorColumn;

    var p = ColorColumn.prototype;

    p.getMetadata = function (propertyName) {
        if (propertyName === weavedata.ColumnMetadata.DATA_TYPE)
            return weavedata.DataType.STRING;

        return weavedata.ExtendedDynamicColumn.prototype.getMetadata(propertyName);
    }

    p.getValueFromKey = function (key, dataType) {
        dataType = dataType === undefined ? null : dataType;
        if (this._recordColorsTriggerCounter !== this.recordColors.triggerCounter) {
            this._recordColorsTriggerCounter = this.recordColors.triggerCounter;
            handleRecordColors.call(this);
        }

        var color;

        var recordColor = this._recordColorsMap.get(key);
        if (recordColor !== undefined) {
            color = recordColor;
        } else {
            var value = this.internalDynamicColumn.getValueFromKey(key, Number);
            color = this.getColorFromDataValue(value);
        }

        if (dataType === Number)
            return color;

        // return a 6-digit hex value for a String version of the color
        if (isFinite(color))
            return '#' + weavecore.StandardLib.numberToBase(color, 16, 6);

        return '';
    }


    p.getDataMin = function () {
        if (this._rampCenterAtZero) {
            var dataMin = this._internalColumnStats.getMin();
            var dataMax = this._internalColumnStats.getMax();
            return -Math.max(Math.abs(dataMin), Math.abs(dataMax));
        }
        return this._internalColumnStats.getMin();
    }
    p.getDataMax = function () {
        if (this._rampCenterAtZero) {
            var dataMin = this._internalColumnStats.getMin();
            var dataMax = this._internalColumnStats.getMax();
            return Math.max(Math.abs(dataMin), Math.abs(dataMax));
        }
        return this._internalColumnStats.getMax();
    }
    p.getColorFromDataValue = function (value) {
        var dataMin = this._internalColumnStats.getMin();
        var dataMax = this._internalColumnStats.getMax();
        var norm;
        if (dataMin === dataMax) {
            norm = isFinite(value) ? 0.5 : NaN;
        } else if (this._rampCenterAtZero) {
            var absMax = Math.max(Math.abs(dataMin), Math.abs(dataMax));
            norm = (value + absMax) / (2 * absMax);
        } else {
            norm = (value - dataMin) / (dataMax - dataMin);
        }
        return this.ramp.getColorFromNorm(norm);
    }



    if (typeof exports !== 'undefined') {
        module.exports = ColorColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.ColorColumn = ColorColumn;
    }

    weavecore.ClassUtils.registerClass('weavedata.ColorColumn', weavedata.ColorColumn);
    weavecore.ClassUtils.registerImplementation('weavedata.ColorColumn', "weavedata.IAttributeColumn");

}());
