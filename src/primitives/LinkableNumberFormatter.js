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
    Object.defineProperty(LinkableNumberFormatter, 'NS', {
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
    Object.defineProperty(LinkableNumberFormatter, 'CLASS_NAME', {
        value: 'LinkableNumberFormatter'
    });


    /**
     * This is a sessioned NumberFormatter object.
     * All the properties of an internal NumberFormatter object are accessible through the public sessioned properties of this class.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function LinkableNumberFormatter() {
        weavecore.ILinkableObject.call(this);



        Object.defineProperties(this, {
            'decimalSeparatorFrom': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(), invalidate.bind(this))
            },
            'decimalSeparatorTo': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(), invalidate.bind(this))
            },
            'precision': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableNumber(), invalidate.bind(this))
            },
            'rounding': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(), invalidate.bind(this))
            },
            'thousandsSeparatorFrom': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(), invalidate.bind(this))
            },
            'thousandsSeparatorTo': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(), invalidate.bind(this))
            },
            'useNegativeSign': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(), invalidate.bind(this))
            },
            'useThousandsSeparator': {
                value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(), invalidate.bind(this))
            }
        });
        /**
         * This is the internal NumberFormatter object.
         */
        Object.defineProperty(this, '_nf', {
            value: new Number()
        });
        //private const :NumberFormatter = new NumberFormatter();
        /**
         * This is a flag that is set by invalidate() to remember that the _nf properties need to be validated.
         */
        this._invalid = false;
    }


    /**
     * This function invalidates the properties of _nf.
     */
    function invalidate() {
        this._invalid = true;
    }
    /**
     * This function will validate the properties of _nf.
     */
    function validate() {
        // validate now
        this.copyTo(this._nf);
        this._invalid = false;
    }

    LinkableNumberFormatter.prototype = new weavecore.ILinkableObject();
    LinkableNumberFormatter.prototype.constructor = LinkableNumberFormatter;

    var p = LinkableNumberFormatter.prototype;
    /**
     * This function calls format() on the internal NumberFormatter object.
     * @param value The value to format.
     * @return The value, formatted using the internal NumberFormatter.
     */
    p.format = function (value) {
        if (this._invalid)
            validate.call(this);
        return this._nf.format(value);
    }

    /**
     * @param numberFormatter A NumberFormatter to copy the settings to.
     */
    p.copyTo = function (numberFormatter) {
        numberFormatter.decimalSeparatorFrom = this.decimalSeparatorFrom.value;
        numberFormatter.decimalSeparatorTo = this.decimalSeparatorTo.value;
        numberFormatter.precision = this.precision.value;
        numberFormatter.rounding = this.rounding.value;
        numberFormatter.thousandsSeparatorFrom = this.thousandsSeparatorFrom.value;
        numberFormatter.thousandsSeparatorTo = this.thousandsSeparatorTo.value;
        numberFormatter.useNegativeSign = this.useNegativeSign.value;
        numberFormatter.useThousandsSeparator = this.useThousandsSeparator.value;
    }

    if (typeof exports !== 'undefined') {
        module.exports = LinkableNumberFormatter;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.LinkableNumberFormatter = LinkableNumberFormatter;
    }

    weavecore.ClassUtils.registerClass('weavedata.LinkableNumberFormatter', weavedata.LinkableNumberFormatter);

}());
