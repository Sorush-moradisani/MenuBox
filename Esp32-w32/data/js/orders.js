$(() => {
    'use strict'

    const getStoredUsername = () => localStorage.getItem('username')
    const getStoredPassword = () => localStorage.getItem('password')

    const getStoredPlaySound = () => localStorage.getItem('playSound')
    const setStoredPlaySound = play => localStorage.setItem('playSound', play)

    let batteryLowPlayedSound = false;

    if(!getStoredPlaySound()){
        setStoredPlaySound(true)
    }

    let ws;

    function connect() {
        let notSeenCount = 0;
        let ordersCount = 0;

        ws = new WebSocket('ws://192.168.4.1/ws');

        ws.onopen = function () {
            // console.log('Connected');
            ws.send('getData');
        };

        ws.onmessage = function (event) {
            let wsData = JSON.parse(event.data);

            if(wsData['isCharging'] != undefined){
                let data = wsData;
                $('#battery-view svg').addClass('d-none');
                $('#battery-view svg').removeClass('text-danger');
                $('#battery-view svg').removeClass('charging');
                if(data['isCharging']){
                    $('#battery-charging').removeClass('d-none');
                    batteryLowPlayedSound = false;
                    $('#lowBattreyModal').modal('hide');
                
                    if(data['batteryPercentage'] <= 30) {
                        $('#battery-25').addClass('charging');
                        $('#battery-25').removeClass('d-none');
                        $('#battery-0').removeClass('d-none');
                    } else if(data['batteryPercentage'] <= 60) {
                        $('#battery-50').addClass('charging');
                        $('#battery-50').removeClass('d-none');
                        $('#battery-25').removeClass('d-none');
                    } else if(data['batteryPercentage'] <= 85) {
                        $('#battery-75').addClass('charging');
                        $('#battery-75').removeClass('d-none');
                        $('#battery-50').removeClass('d-none');
                    } else {
                        $('#battery-100').addClass('charging');
                        $('#battery-100').removeClass('d-none');
                        $('#battery-75').removeClass('d-none');
                    }
                } else {
                    if(data['batteryPercentage'] <= 10 && !batteryLowPlayedSound){
                        batteryLowPlayedSound = true;
                        var audio = new Audio('../sounds/battery-low.wav');
                        audio.play();
                        $('#lowBattreyModal').modal('show');
                    }
                
                    if(data['batteryPercentage'] <= 10){
                        $('#battery-0').removeClass('d-none');
                        $('#battery-0').addClass('text-danger');
                    } else if(data['batteryPercentage'] <= 30) {
                        $('#battery-25').removeClass('d-none');
                    } else if(data['batteryPercentage'] <= 60) {
                        $('#battery-50').removeClass('d-none');
                    } else if(data['batteryPercentage'] <= 85) {
                        $('#battery-75').removeClass('d-none');
                    } else {
                        $('#battery-100').removeClass('d-none');
                    }
                } 

                return;
            }

            if(wsData.title == 'notifs'){
                notSeenCount = 0;
                let data = wsData.data;
                if(data.length > 0) {
                    $('#notifications-data').html('');

                    $('#notifications-data').removeClass('d-none');
                    $('#notifications-empty').addClass('d-none');
        
                    var differenceInMillis = new Date() - new Date(Number(data[0].timestamp));
                    if(differenceInMillis < 3000){
                        var audio = new Audio('../sounds/notif1.mp3');
                        audio.play();
                    }
            
                    for(var i=0; i<data.length; i++){
                        insertNotifData(data[i].id, data[i].table, data[i].status, data[i].timestamp);
                        if(data[i].status == "not_seen"){
                            notSeenCount++;
                        }
                    }
                } else {
                    $('#notifications-data').addClass('d-none');
                    $('#notifications-empty').removeClass('d-none');
                }
            }

            if(wsData.title == 'orders'){
                ordersCount = 0;
                let data = wsData.data;
                if(data.length > 0) {
                    $('#orders-data').html('');
                    $('#orders-data').removeClass('d-none');
                    $('#orders-empty').addClass('d-none');
        
                    var differenceInMillis = new Date() - new Date(Number(data[0].timestamp));
                    if(differenceInMillis < 3000){
                        var audio = new Audio('../sounds/notif1.mp3');
                        audio.play();
                    }
                
                    for(var i=0; i<data.length; i++){
                        insertData(data[i].id, data[i].table, data[i].status, data[i].desc.length == 0 ? ' - ' : data[i].desc , data[i].finalPrice, data[i].data, data[i].timestamp);
                        if(data[i].status == "inOrder"){
                            ordersCount++;
                        }
                    }
                } else {
                    $('#orders-data').addClass('d-none');
                    $('#orders-empty').removeClass('d-none');
                }
            }

            if(ordersCount + notSeenCount == 0){
                $('#notif-btn').addClass('d-none')
                $('#notifications-btn .badge').addClass('d-none')
                $('#orders-btn .badge').addClass('d-none')
            } else {
                if(notSeenCount > 0){
                    $('#notif-btn').removeClass('d-none')
                    $('#notifications-btn .badge').removeClass('d-none')
                    $('#notifications-btn .badge').text(notSeenCount)
                    $('#notif-btn .badge').text(ordersCount + notSeenCount)
                    $('#notif-btn .btn').off('click', function() {})
                    $('#notif-btn .btn').on('click', function() {
                        $('#notifications-btn').click();
                    })
                } else {
                    $('#notifications-btn .badge').addClass('d-none')
                    $('#notifications-btn .badge').text(0)
                }
        
                if(ordersCount > 0){
                    $('#notif-btn').removeClass('d-none')
                    $('#orders-btn .badge').removeClass('d-none')
                    $('#orders-btn .badge').text(ordersCount)
                    $('#notif-btn .badge').text(ordersCount + notSeenCount)
                    $('#notif-btn .btn').off('click', () => {})
                    $('#notif-btn .btn').on('click', () => {
                        $('#orders-btn').click();
                    })
                } else {
                    $('#orders-btn .badge').addClass('d-none')
                    $('#orders-btn .badge').text(0)
                }
            }
        };

        ws.onclose = function () {
            // console.log('Disconnected');
            setTimeout(connect, 3000);
        };

        ws.onerror = function (error) {
            ws.close();
        };
    }

    connect();

    function sendData(id, command) {
        ws.send(JSON.stringify({id: id , command: command}));
    }

    let loading = false;

    let readyDataLength = 0;

    let timestamp = "0";

    const loadMoreBtn = `
        <div id="load-more" class="d-flex justify-content-center align-items-center w-100 p-5">
            <button id="load-more-btn" class="btn btn-info">
                نمایش موارد بیشتر
            </button>
            <div id="load-more-loading" class="spinner-border d-none" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    function getReadyData(length) {
        if(loading) return;

        loading = true;

        if(length == 0){
            timestamp = "0";
            $('#old-orders-data').html('');
        }

        $.ajax({
            method: "POST",
            url: "getReadyOrders",
            headers: {
                adminUsername: getStoredUsername(),
                adminPassword: getStoredPassword()
            },
            data: { 
                length: length
            },
            success: (data) => {
                loading = false;
                readyDataLength += data.length;
                if(length == 0 && data.length == 0){
                    $('#old-orders-data').addClass('d-none');
                    $('#old-orders-empty').removeClass('d-none');
                } else {
                    $('#old-orders-data').removeClass('d-none');
                    $('#old-orders-empty').addClass('d-none');
                }
                $('#load-more').remove();

                for(var i=0; i<data.length; i++){
                    const jalaliDate1 = moment.unix(Number(timestamp)).format('jYYYY/jM/jD');
                    const jalaliDate2 = moment.unix(Number(data[i].timestamp)).format('jYYYY/jM/jD');

                    if(jalaliDate1 != jalaliDate2){
                        const date = moment(Number(data[i].timestamp));
                        const jalaliDate = date.format('jYYYY/jMM/jDD');
                        const isToday = date.isSame(moment(), 'day');
                        const isYesterday = date.isSame(moment().subtract(1, 'days'), 'day');
        
                        let persianDayName;
                        if (isToday) {
                            persianDayName = "امروز";
                        } else if (isYesterday) {
                            persianDayName = "دیروز";
                        } else {
                            persianDayName = date.format('dddd');
                        }
        
                        const jalaliDateString = `${persianDayName} - ${jalaliDate}`;

                        let htmlData = `<div class="sticky-top d-flex justify-content-center align-items-center fs-4 p-2 w-100 mb-3 bg-secondary">`+ jalaliDateString +`</div>`;
                        $('#old-orders-data').append(htmlData)
                    }
                    timestamp = data[i].timestamp;
                    insertData(data[i].id, data[i].table, data[i].status, data[i].desc.length == 0 ? ' - ' : data[i].desc , data[i].finalPrice, data[i].data, data[i].timestamp);
                }

                if(readyDataLength >= 20){
                    $('#old-orders-data').append(loadMoreBtn)
                    $('#load-more-btn').on('click', function() {
                        $(this).addClass('d-none')
                        $('#load-more-loading').removeClass('d-none')
                        getReadyData(readyDataLength)
                    })
                }
            },
            error: (err) => {
                loading = false;
                Swal.fire({
                    title: 'خطا در دریافت اطلاعات!',
                    icon: 'error',
                    confirmButtonText: 'بستن'
                  });
            }
        });
    }

    $('#old-orders-btn').on('click', function(){
        getReadyData(0);
    })

    $('#delete-orders-btn').click(function() {
        $.ajax({
            method: "POST",
            url: "deleteOrders",
            headers: {
                adminUsername: getStoredUsername(),
                adminPassword: getStoredPassword()
            },
            data: {},
            success: (data) => {
                getReadyData(0);
                Swal.fire({
                    title: 'پاکسازی انجام شد',
                    icon: 'success',
                    confirmButtonText: 'بستن'
                  });
            },
            error: (err) => {
                Swal.fire({
                    title: 'پاکسازی انجام نشد!',
                    icon: 'error',
                    confirmButtonText: 'بستن'
                  });
            }
        })
    });

    function insertData(id, table, status, desc, finalPrice, data, timestamp) {
        const date = new Date(Number(timestamp));
        var htmlData = `
            <div  class="p-2 col-md-6 col-xl-3" data-id="`+ id +`">
                <div style="height: 100%;`;
        if(status == 'inProgress'){
            htmlData += ` background-color:rgba(234, 252, 74, 0.1);`;
        }
        htmlData += `" class="card p-4 d-flex flex-column align-items-center`;
        if(status == 'inProgress'){
            htmlData += `  border-warning`;
        }
        if(status == 'isReady'){
            htmlData += `  border-success`;
        }
        htmlData += `">
                  <p class="card px-3">` +date.getHours()+`:`+date.getMinutes()+`</p>
                  <h4 class="card p-3 mb-5">سفارش میز شماره `+ table +`</h4>
                  `;
        for(var i=0; i<data.length; i++){
            htmlData += `
                <div class="d-flex align-items-center w-100 mt-2">
                    <p class="fs-5">`+ data[i].name +`</p>
                    <div style="border-style: dashed; height: 0; opacity: 0.3;" class="flex-grow-1 ms-3 me-3"></div>
                    <p class="fs-5">`+ data[i].count +` عدد</p>
                </div>`;
        }
        htmlData += `
                <p class="fs-5 mt-auto">توضیحات: `+ desc +`</p>
                <hr>
                <div class="d-flex align-items-center w-100 mt-auto">
                    <p class="fs-5">هزینه نهایی:</p>
                    <div class="flex-grow-1"></div>
                    <p class="fs-4">`+ finalPrice +` تومان</p>
                </div>
            `;
        if(status == 'isReady'){
            $('#old-orders-data').append(htmlData);
            $('#old-orders-data .card').css('background-color', 'rgba(0, 200, 0, 0.2)');
        }
        htmlData += `
                <div class="d-flex align-items-center justify-content-between w-100 mt-5" data-id="`+ id +`">
                    <button type="button" class="btn btn-danger flex-grow-1 cancel-btn">لغو</button>
                    <button type="button" class="btn btn-warning mx-1 flex-grow-1 start-progress-btn"`;
        if(status == 'inProgress'){
            htmlData += `disabled style="opacity: 0;"`;
        }
        htmlData += `
                >آماده‌سازی</button>
                    <button type="button" class="btn btn-success flex-grow-1 done-btn">انجام شد</button>
                </div>
                </div>
            </div>`;

        if(status != 'isReady'){
            $('#orders-data').append(htmlData);
        }

        $('.cancel-btn').off('click', () => {});
        $('.start-progress-btn').off('click', () => {});
        $('.done-btn').off('click', () => {});

        $('.cancel-btn').on('click', (ele) => {
            var id = $(ele.target).parent().attr('data-id');
            sendData(id,'cancel');
        });
        $('.start-progress-btn').on('click', (ele) => {
            var id = $(ele.target).parent().attr('data-id');
            sendData(id,'inProgress');
        });
        $('.done-btn').on('click', (ele) => {
            var id = $(ele.target).parent().attr('data-id');
            sendData(id,'isReady');
        });
    }

    ////////////////////////////////////// Notifications /////////////////////////////////////////////

    $('#delete-notifications-btn').click(function() {
        $.ajax({
            method: "POST",
            url: "deleteNotifications",
            headers: {
                adminUsername: getStoredUsername(),
                adminPassword: getStoredPassword()
            },
            data: {},
            success: (data) => {
                ws.send('getData');
                Swal.fire({
                    title: 'پاکسازی انجام شد',
                    icon: 'success',
                    confirmButtonText: 'بستن'
                  });
            },
            error: (err) => {
                Swal.fire({
                    title: 'پاکسازی انجام نشد!',
                    icon: 'error',
                    confirmButtonText: 'بستن'
                  });
            }
        })
    });

    function insertNotifData(id, table, status, timestamp) {
        const date = new Date(Number(timestamp));
        var htmlData = `
            <div  class="p-2 col-12 col-xl-8 mx-auto mb-3" data-id="`+ id +`">
                <div style="height: 100px;`;
        if(status == 'seen'){
            htmlData += ` opacity: 0.4`;
        }
        htmlData += `
            " class="card p-2 p-lg-4 d-flex flex-row align-items-center">
                <h5 class="card me-auto mb-0 px-2 px-lg-3">` +date.getHours()+`:`+date.getMinutes()+`</h5>
                <h5>میز </h5>
                <h4 class="text-danger mx-2 mb-2">`+ table +`</h4>
                <h5> آماده سفارش گیری</h5>`;
        if(status == 'not_seen'){
            htmlData += `<button type="button" class="btn btn-success ms-auto seen-btn px-2">`;
        } else{
            htmlData += `<button type="button" class="btn ms-auto px-2" style="opacity: 0;" disabled>`;
        }
        htmlData += `
            <span class="d-none d-lg-flex"></span>
            <svg class="bi pe-none d-lg-none" width="22" height="22"><use xlink:href="#check-icon"></use></svg>
        </button></div></div>`;

        $('#notifications-data').append(htmlData);

        $('.seen-btn').off('click', () => {});

        $('.seen-btn').on('click', (ele) => {
            var id = $(ele.target).parent().parent().attr('data-id');
            sendData(id,'seen');
        });
    }
})