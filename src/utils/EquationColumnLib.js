(function () {
    function EquationColumnLib() {

    }


    EquationColumnLib.cast = function (value, newType) {
        if (newType == null)
            return value;

        // if newType is a qualified class name, get the Class definition
        /*if (newType instanceof String)
    newType = ClassUtils.getClassDefinition(newType);*/

        // cast the value as the desired type
        if (newType === Number) {
            value = weavecore.StandardLib.asNumber(value);
            if (isNaN(value))
                return NaN;
        } else if (newType === String) {
            value = weavecore.StandardLib.asString(value);
        } else if (newType === Boolean) {
            value = weavecore.StandardLib.asBoolean(value);
        }

        return value;
    }

    if (typeof exports !== 'undefined') {
        module.exports = EquationColumnLib;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.EquationColumnLib = EquationColumnLib;
    }

}());
