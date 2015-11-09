(function () {
    function Point() {
        this.x = NaN;
        this.y = NaN;
    }

    if (typeof exports !== 'undefined') {
        module.exports = Point;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.Point = Point;
    }

}());
