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
