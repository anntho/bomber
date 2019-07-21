document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.sidenav');
    var sidenavInstances = M.Sidenav.init(elems);

    var elems2 = document.querySelectorAll('.collapsible');
    var collapsableInstances = M.Collapsible.init(elems2);

    var elems3 = document.querySelectorAll('.dropdown-trigger');
    var dropdownInstances = M.Dropdown.init(elems3, {
        hover: false
    });
});

