angular.module('myApp').factory('notificationService', function() {
    type = ['primary', 'info', 'success', 'warning', 'danger'];
    return {
        showNotification: function(message, icon = null, color = Math.floor((Math.random() * 4) + 1), delay) {
            $.notify({
                icon: icon,
                message: message
            }, {
                type: type[color],
                delay: delay,
                z_index: 2000,
                placement: {
                    from: 'bottom',
                    align: 'center'
                }
            });
        },
        notify: function(msg, color, from, align) {
            //color : 1 blue, 2 green, 4 red, 3: orange,
            // color = Math.floor((Math.random() * 4) + 1);
            console.log("notification color: " + color);
            $.notify({
                icon: "nc-icon nc-app",
                message: msg
            }, {
                type: type[color],
                timer: 8000,
                placement: {
                    from: 'top',
                    align: 'center'
                }
            });
        }
    }
});