(function () {

    /**
     * This class defines a 1-dimensional continuous range of values by begin and end values.
     * The difference between the begin and end values can be either positive or negative.
     * @author adufilie
     * @author sanjay1909
     */
    function Range(begin, end) {
        /**
         * The begin and end values define the range of values covered by this Range object.
         * The difference between begin and end can be either positive or negative.
         */
        this.begin = begin;
        this.end = end;

        /**
         * This is the minimum value of the range.
         */
        Object.defineProperty(this, 'min', {
            get: function () {
                return Math.min(this.begin, this.end);
            }
        });


        /**
         * This is the maximum value of the range.
         */
        Object.defineProperty(this, 'max', {
            get: function () {
                return Math.max(this.begin, this.end);
            }
        });


        /**
         * The coverage of a Range is defined by the positive distance
         * from the min numeric value to the max numeric value.
         */
        Object.defineProperty(this, 'coverage', {
            get: function () {
                return Math.abs(this.end - this.begin);
            }
        });

    }


    var p = Range.prototype;

    /**
     * @param value A number within this Range
     * @return A number in the range [0,1]
     */
    p.normalize = function (value) {
            if (value === this.end)
                return 1;
            return (value - this.begin) / (this.end - this.begin);
        }
        /**
         * @param A number in the range [0,1]
         * @return A number within this Range
         */
    p.denormalize = function (value) {
        return this.begin + (this.end - this.begin) * value;
    }



    /**
     * @param begin The new begin value.
     * @param end The new end value.
     */
    p.setRange = function (begin, end) {
        this.begin = begin;
        this.end = end;
    }

    /**
     * This will shift the begin and end values by a delta value.
     */
    p.offset = function (delta) {
        this.begin += delta;
        this.end += delta;
    }

    /**
     * This function will constrain a value to be within this Range.
     * @return A number contained in this Range.
     */
    p.constrain = function (value) {
        if (this.begin < this.end)
            return Math.max(this.begin, Math.min(value, this.end));
        return Math.max(this.end, Math.min(value, this.begin));
    }

    /**
     * @param value A number to check
     * @return true if the given value is within this Range
     */
    p.contains = function (value) {
        if (this.begin < this.end)
            return this.begin <= value && value <= this.end;
        return this.end <= value && value <= this.begin;
    }

    /**
     * @param value A number to check
     * @return -1 if value &lt; min, 1 if value &gt; max, 0 if min &lt;= value &lt;= max, or NaN otherwise
     */
    p.compare = function (value) {
        var min = this.min;
        var max = this.max;
        if (value < min)
            return -1;
        if (value > max)
            return 1;
        if (min <= value && value <= max)
            return 0;
        return NaN;
    }

    /**
     * This function will reposition another Range object
     * such that one range will completely contain the other.
     * @param rangeToConstrain The range to be repositioned.
     * @param allowShrinking If set to true, the rangeToConstrain may be resized to fit within this range.
     */
    p.constrainRange = function (rangeToConstrain, allowShrinking) {
        allowShrinking = (allowShrinking === undefined) ? false : allowShrinking;
        // don't constrain if this range is NaN
        if (isNaN(this.coverage))
            return;

        if (rangeToConstrain.coverage < this.coverage) // if rangeToConstrain can fit within this Range
        {
            // shift rangeToConstrain enough so it is contained within this Range.
            if (rangeToConstrain.min < this.min)
                rangeToConstrain.offset(this.min - rangeToConstrain.min);
            else if (rangeToConstrain.max > this.max)
                rangeToConstrain.offset(this.max - rangeToConstrain.max);
        } else if (allowShrinking) {
            // rangeToConstrain should be resized to fit within this Range.
            rangeToConstrain.setRange(this.begin, this.end);
        } else // rangeToConstrain has a larger coverage (does not fit within this Range)
        {
            // shift rangeToConstrain enough so it contains this Range
            if (rangeToConstrain.min > this.min)
                rangeToConstrain.offset(this.min - rangeToConstrain.min);
            else if (rangeToConstrain.max < this.max)
                rangeToConstrain.offset(this.max - rangeToConstrain.max);
        }
    }

    /**
     * This function will expand the range as necessary to include the specified value.
     * @param value The value to include in the range.
     */
    p.includeInRange = function (value) {
        if (this.end < this.begin) {
            if (value < this.end)
                this.end = value;
            if (value > this.begin)
                this.begin = value;
        } else // begin <= this.end)
        {
            if (value < this.begin)
                this.begin = value;
            if (value > this.end)
                this.end = value;
        }
    }

    p.toString = function () {
        return "[" + this.begin.toFixed(2) + " to " + this.end.toFixed(2) + "]";
    }

    if (typeof exports !== 'undefined') {
        module.exports = Range;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.Range = Range;
    }

}());
