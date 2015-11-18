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
    Object.defineProperty(ZoomBounds, 'NS', {
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
    Object.defineProperty(ZoomBounds, 'CLASS_NAME', {
        value: 'ZoomBounds'
    });


    /**
     * This object defines the data bounds of a visualization, either directly with
     * absolute coordinates or indirectly with center coordinates and area.
     * Screen coordinates are never directly specified in the session state.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function ZoomBounds() {
        weavecore.LinkableVariable.call(this);

        Object.defineProperties(this, {
            '_tempBounds': {
                value: new weavedata.Bounds2D()
            },
            '_dataBounds': {
                value: new weavedata.Bounds2D()
            },
            '_screenBounds': {
                value: new weavedata.Bounds2D()
            },
        });

        this._useFixedAspectRatio = false;


    }


    function _fixAspectRatio(zoomOutIfNecessary) {
        zoomOutIfNecessary = (zoomOutIfNecessary === undefined) ? false : zoomOutIfNecessary;
        if (this._useFixedAspectRatio) {
            var xInvScale = this._dataBounds.getXCoverage() / this._screenBounds.getXCoverage();
            var yInvScale = this._dataBounds.getYCoverage() / this._screenBounds.getYCoverage();
            if (xInvScale !== yInvScale) {
                var scale = zoomOutIfNecessary ? Math.max(xInvScale, yInvScale) : Math.sqrt(xInvScale * yInvScale);
                this._dataBounds.centeredResize(this._screenBounds.getXCoverage() * scale, this._screenBounds.getYCoverage() * scale);
            }
        }
    }

    ZoomBounds.prototype = new weavecore.LinkableVariable();
    ZoomBounds.prototype.constructor = ZoomBounds;

    var p = ZoomBounds.prototype;
    /**
     * The session state has two modes: absolute coordinates and centered area coordinates.
     * @return The current session state.
     */
    p.getSessionState = function () {
        if (this._useFixedAspectRatio) {
            return {
                xCenter: weavecore.StandardLib.roundSignificant(this._dataBounds.getXCenter()),
                yCenter: weavecore.StandardLib.roundSignificant(this._dataBounds.getYCenter()),
                area: weavecore.StandardLib.roundSignificant(this._dataBounds.getArea())
            };
        } else {
            return {
                xMin: this._dataBounds.getXMin(),
                yMin: this._dataBounds.getYMin(),
                xMax: this._dataBounds.getXMax(),
                yMax: this._dataBounds.getYMax()
            };
        }
    }

    /**
     * The session state can be specified in two ways: absolute coordinates and centered area coordinates.
     * @param The new session state.
     */
    p.setSessionState = function (state) {
        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.delayCallbacks();

        if (state === null) {
            if (!this._dataBounds.isUndefined())
                cc.triggerCallbacks();
            this._dataBounds.reset();
        } else {
            var useFixedAspectRatio = false;
            if (state.hasOwnProperty("xCenter")) {
                useFixedAspectRatio = true;
                if (weavecore.StandardLib.roundSignificant(this._dataBounds.getXCenter()) !== state.xCenter) {
                    this._dataBounds.setXCenter(state.xCenter);
                    cc.triggerCallbacks();
                }
            }
            if (state.hasOwnProperty("yCenter")) {
                useFixedAspectRatio = true;
                if (weavecore.StandardLib.roundSignificant(this._dataBounds.getYCenter()) !== state.yCenter) {
                    this._dataBounds.setYCenter(state.yCenter);
                    cc.triggerCallbacks();
                }
            }
            if (state.hasOwnProperty("area")) {
                useFixedAspectRatio = true;
                if (weavecore.StandardLib.roundSignificant(this._dataBounds.getArea()) !== state.area) {
                    // We can't change the screen area.  Adjust the dataBounds to match the specified area.
                    /*
                    	Ad = Wd * Hd
                    	Wd/Hd = Ws/Hs
                    	Wd = Hd * Ws/Hs
                    	Ad = Hd^2 * Ws/Hs
                    	Hd^2 = Ad * Hs/Ws
                    	Hd = sqrt(Ad * Hs/Ws)
                    */

                    var Ad = state.area;
                    var HsWsRatio = this._screenBounds.getYCoverage() / this._screenBounds.getXCoverage();
                    if (!isFinite(HsWsRatio)) // handle case if screenBounds is undefined
                        HsWsRatio = 1;
                    var Hd = Math.sqrt(Ad * HsWsRatio);
                    var Wd = Ad / Hd;
                    this._dataBounds.centeredResize(Wd, Hd);
                    cc.triggerCallbacks();
                }
            }

            if (!useFixedAspectRatio) {
                var names = ["xMin", "yMin", "xMax", "yMax"];
                names.forEach(function (name) {
                    if (state.hasOwnProperty(name) && this._dataBounds[name] !== state[name]) {
                        this._dataBounds[name] = state[name];
                        cc.triggerCallbacks();
                    }
                }.bind(this));
            }

            this._useFixedAspectRatio = useFixedAspectRatio;
        }

        cc.resumeCallbacks();
    }

    /**
     * This function will copy the internal dataBounds to another IBounds2D.
     * @param outputScreenBounds The destination.
     */
    p.getDataBounds = function (outputDataBounds) {
        outputDataBounds.copyFrom(this._dataBounds);
    }

    /**
     * This function will copy the internal screenBounds to another IBounds2D.
     * @param outputScreenBounds The destination.
     */
    p.getScreenBounds = function (outputScreenBounds) {
        outputScreenBounds.copyFrom(this._screenBounds);
    }

    /**
     * This will project a Point from data coordinates to screen coordinates.
     * @param inputAndOutput The Point object containing output coordinates.  Reprojected coordinates will be stored in this same Point object.
     */
    p.projectDataToScreen = function (inputAndOutput) {
        this._dataBounds.projectPointTo(inputAndOutput, this._screenBounds);
    }

    /**
     * This will project a Point from screen coordinates to data coordinates.
     * @param inputAndOutput The Point object containing output coordinates.  Reprojected coordinates will be stored in this same Point object.
     */
    p.projectScreenToData = function (inputAndOutput) {
        this._screenBounds.projectPointTo(inputAndOutput, this._dataBounds);
    }

    /**
     * This function will set all the information required to define the session state of the ZoomBounds.
     * @param dataBounds The data range of a visualization.
     * @param screenBounds The pixel range of a visualization.
     * @param useFixedAspectRatio Set this to true if you want to maintain an identical x and y data-per-pixel ratio.
     */
    p.setBounds = function (dataBounds, screenBounds, useFixedAspectRatio) {
        if (this._dataBounds.equals(dataBounds) && this._screenBounds.equals(screenBounds) && this._useFixedAspectRatio === useFixedAspectRatio)
            return;

        this._dataBounds.copyFrom(dataBounds);
        this._screenBounds.copyFrom(screenBounds);
        this._useFixedAspectRatio = useFixedAspectRatio;
        _fixAspectRatio.call(this);

        WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
    }

    /**
     * This function will zoom to the specified dataBounds and fix the aspect ratio if necessary.
     * @param dataBounds The bounds to zoom to.
     * @param zoomOutIfNecessary Set this to true if you are using a fixed aspect ratio and you want the resulting fixed bounds to be expanded to include the specified dataBounds.
     */
    p.setDataBounds = function (dataBounds, zoomOutIfNecessary) {
        zoomOutIfNecessary = (zoomOutIfNecessary === undefined) ? false : zoomOutIfNecessary;
        if (this._dataBounds.equals(dataBounds))
            return;

        this._dataBounds.copyFrom(dataBounds);
        _fixAspectRatio.call(this, zoomOutIfNecessary);

        WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
    }

    /**
     * This function will update the screenBounds and fix the aspect ratio of the dataBounds if necessary.
     * @param screenBounds The new screenBounds.
     * @param useFixedAspectRatio Set this to true if you want to maintain an identical x and y data-per-pixel ratio.
     */
    p.setScreenBounds = function (screenBounds, useFixedAspectRatio) {
        if (this._useFixedAspectRatio === useFixedAspectRatio && this._screenBounds.equals(screenBounds))
            return;

        this._useFixedAspectRatio = useFixedAspectRatio;
        this._screenBounds.copyFrom(screenBounds);
        _fixAspectRatio.call(this);

        WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
    }



    /**
     * A scale of N means there is an N:1 correspondance of pixels to data coordinates.
     */
    p.getXScale = function () {
        return this._screenBounds.getXCoverage() / this._dataBounds.getXCoverage();
    }

    /**
     * A scale of N means there is an N:1 correspondance of pixels to data coordinates.
     */
    p.getYScale = function () {
        return this._screenBounds.getYCoverage() / this._dataBounds.getYCoverage();
    }

    if (typeof exports !== 'undefined') {
        module.exports = ZoomBounds;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.ZoomBounds = ZoomBounds;
    }

    weavecore.ClassUtils.registerClass('weavedata.ZoomBounds', weavedata.ZoomBounds);

}());
