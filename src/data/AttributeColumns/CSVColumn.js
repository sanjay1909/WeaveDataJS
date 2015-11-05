/**
 * This column is defined by two columns of CSV data: keys and values.
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
    Object.defineProperty(CSVColumn, 'NS', {
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
    Object.defineProperty(CSVColumn, 'CLASS_NAME', {
        value: 'CSVColumn'
    });

    function CSVColumn() {
        weavedata.AbstractAttributeColumn.call(this);

        Object.defineProperty(this, "title", {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString())
        });
        /**
         * This should contain a two-column CSV with the first column containing the keys and the second column containing the values.
         */
        Object.defineProperty(this, "data", {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableVariable(), this.invalidate.bind(this))
        });

        /**
         * If this is set to true, the data will be parsed as numbers to produce the numeric data.
         */
        Object.defineProperty(this, "numericMode", {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(), this.invalidate.bind(this))
        });

        /**
         * This is the key type of the first column in the csvData.
         */
        Object.defineProperty(this, "keyType", {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString(), this.invalidate.bind(this))
        });


        /**
         * This function returns the list of String values from the first column in the CSV data.
         */
        Object.defineProperty(this, "keys", {
            get: function () {
                // refresh the data if necessary
                if (this._dirty)
                    validate.call(this);

                return this._keys;
            }
        });


        this._keyToIndexMap = null; // This maps a key to a row index.
        this._keys = []; // list of keys from the first CSV column
        this._stringValues = []; // list of Strings from the first CSV column
        this._numberValues = []; // list of Numbers from the first CSV column

        this._dirty = true;
        this.numericMode.value = false;

    }

    function invalidate() {
        this._dirty = true;
    }


    /**
     * This function generates three Vectors from the CSV data: _keys, _stringValues, _numberValues
     */
    function validate() {
        // replace the previous _keyToIndexMap with a new empty one
        this._keyToIndexMap = new Map();
        this._keys.length = 0;
        this._stringValues.length = 0;
        this._numberValues.length = 0;

        var key;
        var value;
        var table = this.data.getSessionState() ? this.data.getSessionState() : [];
        for (var i = 0; i < table.length; i++) {
            var row = table[i];
            if (row === null || row.length === 0)
                continue; // skip blank lines

            // get the key from the first column and the value from the second.
            key = WeaveAPI.QKeyManager.getQKey(keyType.value, String(row[0]));
            value = String(row.length > 1 ? row[1] : '');

            // save the results of parsing the CSV row
            this._keyToIndexMap.set(this._keys.length);
            this._keys.push(key);
            this._stringValues.push(value);
            try {
                this._numberValues.push(Number(value));
            } catch (e) {
                this._numberValues.push(NaN);
            }
        }
        this.dirty = false;
    }

    CSVColumn.prototype = new weavedata.AbstractAttributeColumn();
    CSVColumn.prototype.constructor = CSVColumn;
    var p = CSVColumn.prototype;

    p.getMetadata = function (propertyName) {
        switch (propertyName) {
        case ColumnMetadata.TITLE:
            return this.title.value;
        case ColumnMetadata.KEY_TYPE:
            return this.keyType.value;
        case ColumnMetadata.DATA_TYPE:
            return this.numericMode.value ? 'number' : 'string';
        }
        return weavedata.AbstractAttributeColumn.prototype.getMetadata.call(this, propertyName);
    }

    /**
     * Use this function to set the keys and data of the column.
     * @param table An Array of rows where each row is an Array containing a key and a data value.
     */
    p.setDataTable = function (table) {
        var stringTable = [];
        for (var r = 0; r < table.length; r++) {
            var row = table[r].concat(); // make a copy of the row
            // convert each value to a string
            for (var c = 0; c < row.length; c++)
                row[c] = String(row[c]);
            stringTable[r] = row; // save the copied row
        }
        this.data.setSessionState(stringTable);
    }

    /**
     * @param key A key to test.
     * @return true if the key exists in this IKeySet.
     */
    p.containsKey = function (key) {
        // refresh the data if necessary
        if (this._dirty)
            validate.call(this);

        return this._keyToIndexMap.get(key) !== undefined;
    }

    /**
     * This function returns the corresponding numeric or string value depending on the dataType parameter and the numericMode setting.
     */


    p.getValueFromKey = function (key, dataType) {
        dataType = dataType ? dataType : null;
        // refresh the data if necessary
        if (this._dirty)
            validate.call(this);

        // get the index from the key
        var keyIndex = this._keyToIndexMap.get(key);

        // cast to different data types
        if (dataType === Boolean) {
            return !isNaN(keyIndex);
        }
        if (dataType === Number) {
            if (isNaN(keyIndex))
                return NaN;
            return this._numberValues[keyIndex];
        }
        if (dataType === String) {
            if (isNaN(keyIndex))
                return '';
            return this._stringValues[keyIndex];
        }

        // return default data type
        if (isNaN(keyIndex))
            return this.numericMode.value ? NaN : '';

        if (this.numericMode.value)
            return this._numberValues[keyIndex];

        return this._stringValues[keyIndex];
    }

    if (typeof exports !== 'undefined') {
        module.exports = CSVColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.CSVColumn = CSVColumn;
    }
    weavecore.ClassUtils.registerClass('weavedata.CSVColumn', weavedata.CSVColumn);

}());
