/**
 *
 * @author adufilie
 * @author asanjay
 */
(function () {
    function DateColumn(metadata) {
        metadata = (metadata === undefined) ? null : metadata;
        weavedata.AbstractAttributeColumn.call(this, metadata);


    }



    DateColumn.prototype = new weavedata.AbstractAttributeColumn();
    DateColumn.prototype.constructor = DateColumn;
    var p = DateColumn.prototype;



    if (typeof exports !== 'undefined') {
        module.exports = DateColumn;
    } else {
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.DateColumn = DateColumn;
    }


}());
