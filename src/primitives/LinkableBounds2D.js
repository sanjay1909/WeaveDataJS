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
    Object.defineProperty(LinkableBounds2D, 'NS', {
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
    Object.defineProperty(LinkableBounds2D, 'CLASS_NAME', {
        value: 'LinkableBounds2D'
    });


    Object.defineProperty(LinkableBounds2D, 'tempBounds', {
        value: new weavedata.Bounds2D()
    });
    /**
     * This is a linkable version of a Bounds2D object.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function LinkableBounds2D() {
        weavecore.LinkableVariable.call(this);

    }

    LinkableBounds2D.prototype = new weavecore.LinkableVariable();
    LinkableBounds2D.prototype.constructor = LinkableBounds2D;

    var p = LinkableBounds2D.prototype;

    p.copyFrom = function (sourceBounds) {
        LinkableBounds2D.tempBounds.copyFrom(sourceBounds);
        this.setSessionState(LinkableBounds2D.tempBounds);
    }

    p.copyTo = function (destinationBounds) {
        LinkableBounds2D.tempBounds.reset();
        this.detectChanges();
        if (this._sessionStateInternal && typeof this._sessionStateInternal === 'object') {
            LinkableBounds2D.tempBounds.xMin = weavecore.StandardLib.asNumber(this._sessionStateInternal.xMin);
            LinkableBounds2D.tempBounds.yMin = weavecore.StandardLib.asNumber(this._sessionStateInternal.yMin);
            LinkableBounds2D.tempBounds.xMax = weavecore.StandardLib.asNumber(this._sessionStateInternal.xMax);
            LinkableBounds2D.tempBounds.yMax = weavecore.StandardLib.asNumber(this._sessionStateInternal.yMax);
        }
        destinationBounds.copyFrom(LinkableBounds2D.tempBounds);
    }


    if (typeof exports !== 'undefined') {
        module.exports = LinkableBounds2D;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.LinkableBounds2D = LinkableBounds2D;
    }

    weavecore.ClassUtils.registerClass('weavedata.LinkableBounds2D', weavedata.LinkableBounds2D);

}());
