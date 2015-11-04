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

}());
