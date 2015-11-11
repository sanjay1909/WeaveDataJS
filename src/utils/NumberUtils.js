(function () {
    function NumberUtils() {

    }


    /**
     * generateBins
     * @return an array of Range objects, with values evenly distributed between min and max
     */
    NumberUtils.generateBins = function (min, max, divisions) {
        var coverage = max - min;
        var rangeList = [];
        for (var i = 0; i < divisions; i++)
            rangeList[i] = new weavedata.Range(
                min + i / divisions * coverage,
                min + (i + 1) / divisions * coverage
            );
        return rangeList;
    }

    /**
     * This function verifies that the given String can be parsed as a finite Number optionally appended with a percent sign.
     * @param numberOrPercent A String to verify.
     * @return A value of true if the String can be parsed as a finite Number or percentage value.
     */
    NumberUtils.verifyNumberOrPercentage = function (numberOrPercent) {
        try {
            // don't accept null or empty string
            if (!numberOrPercent)
                return false;
            if (numberOrPercent.substr(-1) === '%')
                return isFinite(Number(numberOrPercent.substr(0, -1)));
            return isFinite(Number(numberOrPercent));
        } catch (e) {
            // failed to parse number
        }
        return false;
    }

    /**
     * getNumberFromNumberOrPercent
     * This function will convert a String like "75%" into a Number using the calculation "whole * percent / 100".
     * If the String does not have a "%" sign in it, it will be treated as an absolute number.
     * @param numberOrPercent
     *     This string can be either a number like "640" or a percentage like "50%".
     * @param wholeForPercentage
     *     If the 'numberOrPercent' parameter contains the '%' sign, this will be used as the 'whole' value used in the calculation.
     * @return
     *     The 'numberOrPercent' parameter as a Number if it does not have a '%' sign, or (whole * percent / 100) if it does.
     */
    NumberUtils.getNumberFromNumberOrPercent = function (numberOrPercent, wholeForPercentage) {
        try {
            if (numberOrPercent.substr(-1) === '%') // percentage
                return wholeForPercentage * Number(numberOrPercent.substr(0, -1)) / 100;
            else // absolute
                return Number(numberOrPercent);
        } catch (e) {}

        return NaN;
    }


    if (typeof exports !== 'undefined') {
        module.exports = NumberUtils;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.NumberUtils = NumberUtils;
    }
}());
