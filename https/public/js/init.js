document.addEventListener('DOMContentLoaded', function() {
    var sidenav = document.querySelectorAll('.sidenav');
    var sidenavInstances = M.Sidenav.init(sidenav);

    var collapsible = document.querySelectorAll('.collapsible');
    var collapsableInstances = M.Collapsible.init(collapsible);

    var dropdown = document.querySelectorAll('.dropdown-trigger');
    var dropdownInstances = M.Dropdown.init(dropdown, {
        hover: false
    });

    var modal = document.querySelectorAll('.modal');
    var modalInstances = M.Modal.init(modal);
});

