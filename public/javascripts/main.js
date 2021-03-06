function editPickerChanged(e) {
    var t = document.getElementById("editSubmitButton"),
        d = document.getElementById("schedules-list-picker");
    d.addEventListener("change", editPickerChanged);
    var n = d.options[d.selectedIndex].value;
    t.href = "/scheduled/edit/" + n
}

function deletePickerChanged(e) {
    var t = document.getElementById("repoClosingScheduleIdentifier"),
        d = document.getElementById("delete-list-picker");
    t.value = d.options[d.selectedIndex].value
}

function main() {
    var e = document.getElementById("schedules-list-picker");
    if (e) {
        e.addEventListener("change", editPickerChanged);
        var t = e.options[e.selectedIndex].value,
            d = document.getElementById("editSubmitButton");
        d.href = "/scheduled/edit/" + t
    }
    var n = document.getElementById("delete-list-picker");
    if (n) {
        n.addEventListener("change", deletePickerChanged);
        var i = document.getElementById("repoClosingScheduleIdentifier");
        i.value = n.options[n.selectedIndex].value
    }
}
document.addEventListener("DOMContentLoaded", main);
