$(() => {
    'use strict'

    const getStoredUsername = () => localStorage.getItem('username')
    const getStoredPassword = () => localStorage.getItem('password')
    const setStoredUsername = username => localStorage.setItem('username', username)
    const setStoredPaaword = password => localStorage.setItem('password', password)

    const setStoredPlaySound = play => localStorage.setItem('playSound', play)
      

    $('#config-btn').on('click', () => {
        $.ajax({
            method: "POST",
            url: "getConfig",
            headers: {
                adminUsername: getStoredUsername(),
                adminPassword: getStoredPassword()
            },
            data: {},
            success: (data) => {
                document.documentElement.setAttribute('data-bs-theme', data['theme'])
                $(document.head).append(`
                    <style>
                        :root { 
                            --bs-primary: `+ data['primaryColor'] +`; 
                            --bs-primary-hover: `+ data['primaryColor'] +`80; 
                            --bs-primary-active: `+ data['primaryColor'] +`80;
                        }
                        .swal2-confirm {
                            background-color: var(--bs-primary) !important;
                        }
                        .border-primary {
                            border-color: var(--bs-primary) !important;
                        }
                        .btn-primary {
                            --bs-btn-active-bg: var(--bs-primary-active) !important;
                            --bs-btn-active-border-color: var(--bs-primary-active) !important;
                        }
                        .btn-primary {
                            background-color: var(--bs-primary);
                            border-color: var(--bs-primary);
                        }
                        .btn-primary:hover {
                            background-color: var(--bs-primary-hover);
                            border-color: var(--bs-primary-hover);
                        }
                        .btn-outline-primary {
                            --bs-btn-active-bg: var(--bs-primary-active) !important;
                            --bs-btn-active-border-color: var(--bs-primary-active) !important;
                        }
                        .btn-outline-primary {
                            color: var(--bs-primary);
                            border-color: var(--bs-primary);
                        }
                        .btn-outline-primary:hover {
                            background-color: var(--bs-primary-hover);
                        }
                        .bg-primary {
                            background-color: var(--bs-primary) !important;
                        }
                        .active {
                            background-color: var(--bs-primary) !important;
                        }
                        .text-primary {
                            color: var(--bs-primary) !important;
                        }
                        .form-check-input:checked {
                            background-color: var(--bs-primary);
                            border-color: var(--bs-primary);
                        }
                        .form-check-input:focus {
                            border-color:rgba(134, 182, 254, 0);
                            box-shadow: 0 0 0 .25rem rgba(13, 110, 253, 0);
                        }
                    </style>`)
                $('#site-title-input').val(data['siteTitle']);
                if(data['orderActive'] == "true"){
                    $('#order-active').attr('checked', '');
                } else {
                    $('#order-active').removeAttr('checked');
                }
                if(data['playSound'] == "true"){
                    $('#sound-new-order').attr('checked', '');
                } else {
                    $('#sound-new-order').removeAttr('checked');
                }
                $('#acc-username').val(data['username']);
                $('#acc-password').val(data['password']);
                $('#wifi-username').val(data['ssid']);
                $('#wifi-password').val(data['pass']);
                $('#version-view').text(data['version']);

                if(data['theme'] == "dark"){
                    $('#theme-mode').attr('checked', '');
                } else {
                    $('#theme-mode').removeAttr('checked');
                }

                const materialColors = [
                    "#F44336", // Red
                    "#E91E63", // Pink
                    "#9C27B0", // Purple
                    "#673AB7", // Deep Purple
                    "#3F51B5", // Indigo
                    "#2196F3", // Blue
                    "#0D6EFD", // Blue 90 
                    "#03A9F4", // Light Blue
                    "#009688", // Teal
                    "#4CAF50", // Green
                    "#8BC34A", // Light Green
                    "#CDDC39", // Lime
                    "#FFEB3B", // Yellow
                    "#FFC107", // Amber
                    "#FF9800", // Orange
                    "#FF5722", // Deep Orange
                    "#795548", // Brown
                    "#9E9E9E", // Gray
                    "#607D8B", // Blue Gray
                    "#D27D2D", // Black
                  ];

                $("#picker").colorPick({
                    'paletteLabel': 'انتخاب رنگ:',
                    'initialColor' : data['primaryColor'],
                    'allowRecent': false,
                    'palette': materialColors,
                    'onColorSelected': function() {
                        this.element.css({'backgroundColor': this.color, 'color': this.color});
                        this.element.attr('color', this.color);
                        $(document.head).append(`
                            <style>
                                :root { 
                                    --bs-primary: `+ this.color +`; 
                                    --bs-primary-hover: `+ this.color +`80; 
                                    --bs-primary-active: `+ this.color +`80;
                                }
                                .swal2-confirm {
                                    background-color: var(--bs-primary) !important;
                                }
                                .border-primary {
                                    border-color: var(--bs-primary) !important;
                                }
                                .btn-primary {
                                    --bs-btn-active-bg: var(--bs-primary-active) !important;
                                    --bs-btn-active-border-color: var(--bs-primary-active) !important;
                                }
                                .btn-primary {
                                    background-color: var(--bs-primary);
                                    border-color: var(--bs-primary);
                                }
                                .btn-primary:hover {
                                    background-color: var(--bs-primary-hover);
                                    border-color: var(--bs-primary-hover);
                                }
                                .btn-outline-primary {
                                    --bs-btn-active-bg: var(--bs-primary-active) !important;
                                    --bs-btn-active-border-color: var(--bs-primary-active) !important;
                                }
                                .btn-outline-primary {
                                    color: var(--bs-primary);
                                    border-color: var(--bs-primary);
                                }
                                .btn-outline-primary:hover {
                                    background-color: var(--bs-primary-hover);
                                }
                                .bg-primary {
                                    background-color: var(--bs-primary) !important;
                                }
                                .active {
                                    background-color: var(--bs-primary) !important;
                                }
                                .text-primary {
                                    color: var(--bs-primary) !important;
                                }
                                .form-check-input:checked {
                                    background-color: var(--bs-primary);
                                    border-color: var(--bs-primary);
                                }
                                .form-check-input:focus {
                                    border-color:rgba(134, 182, 254, 0);
                                    box-shadow: 0 0 0 .25rem rgba(13, 110, 253, 0);
                                }
                            </style>`)
                    }
                });
            },
            error: (err) => {
                //
            }
          });
    })

    $('#theme-mode').on('change', function() {
        var theme = 'dark';
        if(!$(this).is(':checked')){
            theme = 'light';
        }
        document.documentElement.setAttribute('data-bs-theme', theme)
    })

    $('#save-config-btn').on('click', () => {
        var siteTitle = $('#site-title-input').val();
        var orderActive = $('#order-active').is(':checked');
        var theme = $('#theme-mode').is(':checked');
        var playSound = $('#sound-new-order').is(':checked');
        var primaryColor = $('#picker').attr('color');
        var username = $('#acc-username').val();
        var password = $('#acc-password').val();
        var ssid = $('#wifi-username').val();
        var pass = $('#wifi-password').val();

        if(siteTitle.toString().trim().length < 2) return;
        if(username.toString().trim().length < 4) return;
        if(password.toString().trim().length < 4) return;
        if(ssid.toString().trim().length < 3) return;

        $('#save-config-btn .v1').addClass('d-none');
        $('#save-config-btn .v2').removeClass('d-none');

        $.ajax({
            method: "POST",
            url: "setConfig",
            headers: {
                adminUsername: getStoredUsername(),
                adminPassword: getStoredPassword()
            },
            data: { 
                data: JSON.stringify({ 
                    siteTitle: siteTitle, 
                    orderActive: orderActive.toString(),
                    playSound: playSound.toString(),
                    theme: theme ? 'dark':'light',
                    primaryColor: primaryColor,
                    username: username,
                    password: password,
                    ssid: ssid,
                    pass: pass,
                })
            },
            success: (data) => {
                setStoredPlaySound(playSound);
                Swal.fire({
                    title: 'تغییرات اعمال شد',
                    icon: 'success',
                    confirmButtonText: 'بستن'
                  }).then((result) => {
                    if(username != getStoredUsername() || password != getStoredPassword()){
                        setStoredUsername("")
                        setStoredPaaword("")
                        window.location.href = 'login.html';
                    }
                  });
                $('#save-config-btn .v1').removeClass('d-none');
                $('#save-config-btn .v2').addClass('d-none');
            },
            error: (err) => {
                Swal.fire({
                    title: 'تغییرات اعمال نشد',
                    icon: 'error',
                    confirmButtonText: 'بستن'
                  });
                $('#save-config-btn .v1').removeClass('d-none');
                $('#save-config-btn .v2').addClass('d-none');
            }
          });
    })

    $('#update-btn, #update-back-btn').click(function() {
        $('#update-page-1').removeClass('d-none').removeClass('slide-out').removeClass('slide-in');
        $('#update-page-2').addClass('d-none').removeClass('slide-out').removeClass('slide-in');
        $('#update-back-btn').addClass('d-none');
        $('#accept-update-btn').removeClass('d-none');
        $('#update-start-btn').addClass('d-none');
        $('#wifi-device-ssid').val('');
        $('#wifi-device-password').val('');
    });
  
    $('#accept-update-btn').click(function() {
        $('#update-page-1').addClass('slide-out');
        $('#update-back-btn').removeClass('d-none');
        $('#accept-update-btn').addClass('d-none');
        $('#update-start-btn').removeClass('d-none');
        setTimeout(function() {
          $('#update-page-1').addClass('d-none').removeClass('slide-out');
          $('#update-page-2').removeClass('d-none').addClass('slide-in');
        }, 500);
    });
  
    $('#update-start-btn').click(function() {
        var ssid = $('#wifi-device-ssid').val();
        var pass = $('#wifi-device-password').val();
        if(ssid.length < 3) {
            alert('اطلاعات ورودی را درست وارد کنید!')
            return;
        }
        
        Swal.fire({
            title: 'بروزرسانی شروع شد',
            icon: 'info',
            confirmButtonText: 'بستن'
        });

        $.ajax({
            method: "POST",
            url: "setUpdateMode",
            headers: {
                adminUsername: getStoredUsername(),
                adminPassword: getStoredPassword()
            },
            data: {
                ssid: ssid,
                pass: pass
            },
            success: (data) => {
                Swal.fire({
                    title: 'بروزرسانی انجام شد',
                    icon: 'success',
                    confirmButtonText: 'بستن'
                  });
            },
            error: (err) => {
                //
            }
        })
    });
  
    $('#reset-factory-btn').click(function() {
        var menu = $('#menuReset').is(':checked');
        var orders = $('#orderReset').is(':checked');

        alert('شروع بازگشت به تنظیمات کارخانه')

        $.ajax({
            method: "POST",
            url: "resetFactory",
            headers: {
                adminUsername: getStoredUsername(),
                adminPassword: getStoredPassword()
            },
            data: {
                menu: menu.toString(),
                orders: orders.toString()
            },
            success: (data) => {
                Swal.fire({
                    title: 'انجام شد',
                    icon: 'success',
                    confirmButtonText: 'بستن'
                  });
            },
            error: (err) => {
                Swal.fire({
                    title: 'انجام نشد',
                    icon: 'error',
                    confirmButtonText: 'بستن'
                  });
            }
        })
    });
})