$(document).ready(function() {
    $('.modal').modal({
        dismissible: false
    });
    $('.sidenav').sidenav();
    $('select').formSelect();
    $('.collapsible').collapsible();
    $('.dropdown-trigger').dropdown({
        hover: false
    });
});

