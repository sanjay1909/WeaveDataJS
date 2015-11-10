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
    Object.defineProperty(LinkableBound2D, 'NS', {
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
    Object.defineProperty(LinkableBound2D, 'CLASS_NAME', {
        value: 'LinkableBound2D'
    });


    Object.defineProperty(LinkableBound2D, 'tempBounds', {
        value: new weavedata.Bounds2D()
    });
    /**
     * This is a linkable version of a Bounds2D object.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function LinkableBound2D() {
        weavecore.LinkableVariable.call(this);

    }

    LinkableBound2D.prototype = new weavecore.LinkableVariable();
    LinkableBound2D.prototype.constructor = LinkableBound2D;

    var p = LinkableBound2D.prototype;

    p.copyFrom = function (sourceBounds) {
        LinkableBound2D.tempBounds.copyFrom(sourceBounds);
        this.setSessionState(LinkableBound2D.tempBounds);
    }

    p.copyTo = function (destinationBounds) {
        LinkableBound2D.tempBounds.reset();
        this.detectChanges();
        if (this._sessionStateInternal && typeof this._sessionStateInternal === 'object') {
            LinkableBound2D.tempBounds.xMin = weavecore.StandardLib.asNumber(this._sessionStateInternal.xMin);
            LinkableBound2D.tempBounds.yMin = weavecore.StandardLib.asNumber(this._sessionStateInternal.yMin);
            LinkableBound2D.tempBounds.xMax = weavecore.StandardLib.asNumber(this._sessionStateInternal.xMax);
            LinkableBound2D.tempBounds.yMax = weavecore.StandardLib.asNumber(this._sessionStateInternal.yMax);
        }
        destinationBounds.copyFrom(LinkableBound2D.tempBounds);
    }


    if (typeof exports !== 'undefined') {
        module.exports = LinkableBound2D;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.LinkableBound2D = LinkableBound2D;
    }

    weavecore.ClassUtils.registerClass('weavedata.LinkableBound2D', weavedata.LinkableBound2D);

}());
