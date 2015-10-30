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
