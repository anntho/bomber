document.addEventListener('DOMContentLoaded', function() {
    let sidenav = document.querySelectorAll('.sidenav');
    let sidenavInstances = M.Sidenav.init(sidenav);

    let collapsible = document.querySelectorAll('.collapsible');
    let collapsableInstances = M.Collapsible.init(collapsible);

    let dropdown = document.querySelectorAll('.dropdown-trigger');
    let dropdownInstances = M.Dropdown.init(dropdown, {
        hover: false
    });

    let modal = document.querySelectorAll('.modal');
    let modalInstances = M.Modal.init(modal);

    let select = document.querySelectorAll('select');
    let selectInstances = M.FormSelect.init(select);
});

