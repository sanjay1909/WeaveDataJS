/**
 *
 * @author adufilie
 * @author asanjay
 */
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
    Object.defineProperty(KeyColumn, 'NS', {
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
    Object.defineProperty(KeyColumn, 'CLASS_NAME', {
        value: 'KeyColumn'
    });

    function KeyColumn(metadata) {
        metadata = (metadata === undefined) ? null : metadata;
        weavedata.AbstractAttributeColumn.call(this, metadata);

        Object.defineProperty(this, 'keyType', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString())
        });

        Object.defineProperty(this, 'keys', {
            value: []
        });


    }



    KeyColumn.prototype = new weavedata.AbstractAttributeColumn();
    KeyColumn.prototype.constructor = KeyColumn;
    var p = KeyColumn.prototype;

    p.getMetadata = function (propertyName) {
        if (propertyName === weavedata.ColumnMetadata.TITLE) {
            var kt = this.keyType.value;
            if (kt)
                return ("Key ({0})" + kt);
            return "Key";
        }
        if (propertyName === weavedata.ColumnMetadata.KEY_TYPE)
            return keyType.value;

        return KeyColumn.prototype.getMetadata(propertyName);
    }


    p.getValueFromKey = function (key, dataType) {
        dataType = (dataType === undefined) ? null : dataType;
        var kt = this.keyType.value;
        if (kt && key.keyType !== kt)
            return EquationColumnLib.cast(undefined, dataType);

        if (dataType === String)
            return key.localName;

        if (dataType === weavedata.IQualifiedKey)
            return key;

        return EquationColumnLib.cast(key, dataType);
    }



    if (typeof exports !== 'undefined') {
        module.exports = KeyColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.KeyColumn = KeyColumn;
    }

    weavecore.ClassUtils.registerClass('weavedata.KeyColumn', weavedata.KeyColumn);

}());
