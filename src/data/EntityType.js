(function () {
    function EntityType() {

    }


    EntityType.ALL_TYPES = [EntityType.TABLE, EntityType.COLUMN, EntityType.HIERARCHY, EntityType.CATEGORY];

    EntityType.TABLE = 'table';
    EntityType.COLUMN = 'column';
    EntityType.HIERARCHY = 'hierarchy';
    EntityType.CATEGORY = 'category';



    if (typeof exports !== 'undefined') {
        module.exports = EntityType;
    } else {
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.EntityType = EntityType;
    }

}());
