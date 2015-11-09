(function () {
    function Rectangle() {
        this.x = NaN;
        this.y = NaN;
        this.width = NaN;
        this.height = NaN;
    }

    if (typeof exports !== 'undefined') {
        module.exports = Rectangle;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.Rectangle = Rectangle;
    }

}());
