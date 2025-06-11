$(() => {
    'use strict'

    var data = [];

    var orderActive = true;
    var orders = [];
    var finalPrice = 0;

    const uid = function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    try {
        var pageURL = window.location.search.substring(1);
        var table = Number(/table=(\d+)/.exec(pageURL)[1]);
        $('#table-number').val(table);
    } catch(ex){
        //
    }

    $.ajax({
        method: "POST",
        url: "getSiteData",
        data: {},
        success: (siteData) => {
            document.documentElement.setAttribute('data-bs-theme', siteData['theme'])
            $(document.head).append(`
                <style>
                    :root { 
                        --bs-primary: `+ siteData['primaryColor'] +`; 
                        --bs-primary-hover: `+ siteData['primaryColor'] +`80; 
                        --bs-primary-active: `+ siteData['primaryColor'] +`80;
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
            $('#site-title').text(siteData['siteTitle']);
            orderActive = siteData['orderActive'] == "true";
            if(!orderActive){
                $('.active-order').addClass('d-none');
                $('.user-submit-order').text('درخواست سفارش');
                $('.user-submit-order').removeAttr('disabled');
            }

            $.ajax({
                method: "POST",
                url: "getMenu",
                data: {},
                success: (menuData) => {
                    data = menuData;
                    var htmlTabData = ``;
                    if(data.length == 1){
                        htmlTabData = `
                            <div class="position-relative mt-3 w-100">
                                <ul class="list w-100 border-bottom">
                                    <li data-id="`+ data[0].id +`" class="border-bottom border-primary text-primary act">`+ data[0].name +`</li>
                                </ul>
                                <div class="swipe d-none"></div>
                            </div>
                        `;
                    }
                    if(data.length >= 2){
                        htmlTabData = `
                            <div class="position-relative mt-3 w-100 overflow-hidden">
                                <ul class="list w-100 border-bottom">
                                    <li data-index="`+ (data.length-2).toString() +`" class="text-primary hide">`+ data[data.length-2].name +`</li>
                                    <li data-index="`+ (data.length-1).toString() +`" class="text-primary prev">`+ data[data.length-1].name +`</li>
                                    <li data-index="0" class="border-bottom border-primary text-primary act">`+ data[0].name +`</li>
                                    <li data-index="1" class="text-primary next">`+ data[1].name +`</li>
                                    <li data-index="`+ (data.length >= 3 ? 2 : 0).toString() +`" class="text-primary next new-next">`+ (data.length >= 3 ? data[2].name : data[0].name).toString() +`</li>
                                </ul>
                                <div class="swipe"></div>
                            </div>
                        `;
                    }

                    $('#add-order-data').append(htmlTabData);
                    var htmlData = `
                        <div id="slides" class="w-100"></div>
                    `;
                    $('#add-order-data').append(htmlData);

                    for(var i=0; i<data.length; i++){
                        insertData(data[i].id, data[i].data);
                    }

                    var $carousel = $('#slides').flickity({
                        cellAlign: 'center',
                        cellSpacing: 5,
                        pageDots: false,
                        prevNextButtons: false,
                        contain: true,
                        adaptiveHeight: true,
                        wrapAround: true
                    });

                    var moveX = 0;
                    var isNextTriggered = false;
                    var isPrevTriggered = false;

                    $carousel.on('change.flickity', function(event, index) {
                        var lastIndex = parseInt($('.act').first().attr('data-index'));
                        if(data.length == 2){
                            if(moveX > 0.1){
                                isPrevTriggered = true;
                            } 
                            if(moveX < -0.1){
                                isNextTriggered = true;
                            }
                        }
                        if(isNextTriggered){
                            next();
                        } else if(isPrevTriggered){
                            prev();
                        } else if(data.length > 2 && lastIndex == data.length - 1 && index == 0){
                            next();
                        } else if(data.length > 2 && lastIndex == 0 && index == data.length - 1){
                            prev();
                        } else if(index > lastIndex){
                            next();
                        } else {
                            prev();
                        }
                        isNextTriggered = false;
                        isPrevTriggered = false;
                    });

                    $carousel.on('dragMove.flickity',function( event, pointer, moveVector ) {
                        moveX =  moveVector.x;
                    });

                    function next() {
                        if ($(".hide")) {
                            $(".hide").remove(); 
                        }
                        
                        if ($(".prev")) {
                            $(".prev").addClass("hide");
                            $(".prev").removeClass("prev");
                        }
                        
                        $(".act").addClass("prev");
                        $(".act").removeClass("border-bottom border-primary");
                        $(".act").removeClass("act");
                        
                        $(".next").first().addClass("act");
                        $(".act").addClass("border-bottom border-primary");
                        $(".next").first().removeClass("next");
                        
                        $(".new-next").removeClass("new-next");
                        
                        const addedEl = document.createElement('li');
                        
                        $(".list").append(addedEl);
                        addedEl.classList.add("text-primary","next","new-next");
                        let index = parseInt($('.next').first().attr('data-index'));
                        if(index + 1 >= data.length){
                            $('.new-next').attr('data-index', "0");
                            $('.new-next').text(data[0].name);
                        } else {
                            $('.new-next').attr('data-index', (index + 1).toString());
                            $('.new-next').text(data[index + 1].name);
                        }
                    }
                        
                    function prev() {
                        $(".new-next").remove();
                        
                        $(".next").addClass("new-next");
                        
                        $(".act").addClass("next");
                        $(".act").removeClass("border-bottom border-primary");
                        $(".act").removeClass("act");
                        
                        $(".prev").addClass("act");
                        $(".act").addClass("border-bottom border-primary");
                        $(".prev").removeClass("prev");
                        
                        $(".hide").addClass("prev");
                        $(".hide").removeClass("hide");
                        
                        const addedEl = document.createElement('li');
                        
                        $(".prev").before(addedEl);
                        addedEl.classList.add("text-primary","hide");
                        let index = parseInt($('.prev').first().attr('data-index'));
                        if(index - 1 < 0){
                            $('li.hide').attr('data-index', (data.length - 1).toString());
                            $('li.hide').text(data[data.length - 1].name);
                        } else {
                            $('li.hide').attr('data-index', (index - 1).toString());
                            $('li.hide').text(data[index - 1].name);
                        }
                    }
                        
                    const slide = element => {
                        if (element.classList.contains('next')) {
                            isNextTriggered = true;
                            $carousel.flickity('next');
                        } else if (element.classList.contains('prev')) {
                            isPrevTriggered = true;
                            $carousel.flickity('previous');
                        }
                    }
                        
                    const slider = $(".list");
                    const swipe = new Hammer($(".swipe")[0]);
                        
                    slider.on('click',  (ev) => {
                        slide(ev.target);
                    })
                        
                    swipe.on("swipeleft", (ev) => {
                        isNextTriggered = true;
                        $carousel.flickity('next');
                    });
                        
                    swipe.on("swiperight", (ev) => {
                        isPrevTriggered = true;
                        $carousel.flickity('previous');
                    });
                },
                error: (err) => {
                    //
                }
              })
        }
      });

    function insertData(id, data) {
        var htmlData = `<div data-id="`+ id +`" class="content w-100 d-flex flex-column">`;
        for(var i=0 ; i<data.length; i++){
            htmlData += `
                <button class="btn btn-primary w-100 fs-4 mt-4">
                    `+ data[i].name +`
                </button>
                <div id="food`+ data[i].id +`">`;
            for(var j=0; j<data[i].data.length; j++){
                htmlData += `
                        <div class="card card-body ps-2 pe-0 p-3 w-100 d-flex flex-row flex-nowrap justify-content-between">
                            <div class="d-flex flex-column">
                                <h5>`+ data[i].data[j].name +`</h5>
                                `+ data[i].data[j].desc +`
                            </div>
                            <div style="min-width: 150px;" class="d-flex flex-column justify-content-center align-items-center">
                                <p>`+ data[i].data[j].price +` تومان</p>
                    `;
                if((orderActive && $("#admin-view").length == 0) || $("#admin-view").length != 0){
                    if(data[i].data[j].exist == 'true'){
                        htmlData += `<div class="d-flex flex-nowrap align-items-center">
                                <button style="width: 35px;" type="button" class="btn btn-primary add-food-item" data-id="`+ data[i].data[j].id +`">+</button>
                                <span style="width: 35px; text-align: center;" data-id="`+ data[i].data[j].id +`">0</span>
                                <button style="width: 35px;" type="button" class="btn btn-primary remove-food-item" data-id="`+ data[i].data[j].id +`">-</button>
                            </div>
                        `;
                    } else {
                        htmlData += `<p class="text-danger fs-5">عدم موجودی!</p>`;
                    }
                }
                htmlData += `</div></div>`;

            }
            htmlData += `</div>`;
        }
        htmlData += `</div>`;

        $('#slides').append(htmlData);
    }

    function updateOrderList(data) {
        var itemCount = orders.filter(item => item == data.id).length;
        if(itemCount != 0){
            var htmlData = `
                <div class="d-flex flex-nowrap align-items-center justify-content-center">
                    <button style="width: 35px;" type="button" class="btn btn-primary mx-2 add-food-item-t" data-id="`+ data.id +`">+</button>
                    <h4 style="min-width: 220px;" class="card py-3 my-2 text-center">`+ data.name + ` - ` + itemCount + `عدد</h4>
                    <button style="width: 35px;" type="button" class="btn btn-primary mx-2 remove-food-item-t" data-id="`+ data.id +`">-</button>
                </div>`;
            $('#orders-list').html($('#orders-list').html() + htmlData);
        }
        if(orders.length == 0){
            $('#shop-btn span').addClass('d-none');
        } else {
            $('#shop-btn span').removeClass('d-none');
            $('#shop-btn span').text(orders.length.toString());
        }
    }

    $(document).on('click', 'button.add-food-item', function() {
        var count = $(this).next();
        var id = count.attr('data-id');
        if(parseInt(count.text()) < 10){
            count.text(parseInt(count.text()) + 1);
            orders.push(id);
            $('#orders-list').empty();
            for(var i=0; i<data.length; i++){
                for(var j=0; j<data[i].data.length; j++){
                    for(var k=0; k<data[i].data[j].data.length; k++){
                        if(data[i].data[j].data[k].id == id){
                            finalPrice += parseInt(data[i].data[j].data[k].price);
                            $('#submit-orders').removeAttr('disabled');
                            $('#final-price').html(finalPrice + ' تومان');
                        }
                        updateOrderList(data[i].data[j].data[k]);
                    }
                }
            }
        }
    })

    $(document).on('click', 'button.remove-food-item', function() {
        var count = $(this).prev();
        var id = count.attr('data-id');
        if(parseInt(count.text()) > 0){
            count.text(parseInt(count.text()) - 1);
            orders.splice(orders.indexOf(id), 1);
            $('#orders-list').empty();
            for(var i=0; i<data.length; i++){
                for(var j=0; j<data[i].data.length; j++){
                    for(var k=0; k<data[i].data[j].data.length; k++){
                        if(data[i].data[j].data[k].id == id){
                            finalPrice -= parseInt(data[i].data[j].data[k].price);
                            if(finalPrice == 0){
                                $('#submit-orders').attr('disabled', '');
                            }
                            $('#final-price').html(finalPrice + ' تومان');
                        }
                        updateOrderList(data[i].data[j].data[k]);
                    }
                }
            }
        }
    })

    $(document).on('click', 'button.add-food-item-t', function() {
        var id = $(this).attr('data-id');
        $('button.add-food-item').each(function(i){
            if($(this).attr('data-id') == id){
                $(this).click();
            }
        })
    })

    $(document).on('click', 'button.remove-food-item-t', function() {
        var id = $(this).attr('data-id');
        $('button.remove-food-item').each(function(i){
            if($(this).attr('data-id') == id){
                $(this).click();
            }
        })
    })

    $(document).on('click', '#submit-orders', function() {
        var table = $('#table-number').val();
        var desc = $('#order-desc').val();
        var orderItemData = [];
        for(var i=0; i<data.length; i++){
            for(var j=0; j<data[i].data.length; j++){
                for(var k=0; k<data[i].data[j].data.length; k++){
                    var itemCount = orders.filter(item => item == data[i].data[j].data[k].id).length;
                    if(itemCount > 0) {
                        orderItemData.push({
                            id: data[i].data[j].data[k].id,
                            count: itemCount.toString(),
                            name: data[i].data[j].data[k].name,
                            price: data[i].data[j].data[k].price,
                        });
                    }
                }
            }
        }

        $('#submit-orders').html(orderItemData.length == 0 ? 'در حال ثبت درخواست...' : 'در حال ثبت سفارش...');

        if(orderItemData.length == 0) {
            var notifData = {
                id: uid(),
                table: table,
                status: 'not_seen',
                timestamp: Date.now().toString(),
            };

            $.ajax({
                method: "POST",
                url: "addNotif",
                data: {
                    data: JSON.stringify(notifData)
                },
                success: (data) => {
                    Swal.fire({
                        title: 'درخواست شما ثبت شد',
                        text: 'تا لحظاتی دیگر پرسنل برای دریافت سفارش نزد شما خواهند آمد',
                        icon: 'success',
                        confirmButtonText: 'بستن'
                      }).then((result) => {
                        window.location.reload();
                      });
                },
                error: (err) => {
                    Swal.fire({
                        title: 'درخواست ثبت نشد!',
                        icon: 'error',
                        confirmButtonText: 'بستن'
                      });
                    $('#submit-orders').html('درخواست سفارش');
                }
            })
        } else {
            var orderData = {
                id: uid(),
                data: orderItemData,
                table: table,
                desc: desc,
                finalPrice: finalPrice.toString(),
                status: 'inOrder',
                timestamp: Date.now().toString(),
            };

            $.ajax({
                method: "POST",
                url: "addOrder",
                data: {
                    data: JSON.stringify(orderData)
                },
                success: (data) => {
                    Swal.fire({
                        title: 'سفارش انجام شد',
                        icon: 'success',
                        confirmButtonText: 'بستن'
                      }).then((result) => {
                        window.location.reload();
                      });
                    $('#submit-orders').attr('disabled','');
                },
                error: (err) => {
                    Swal.fire({
                        title: 'سفارش انجام نشد!',
                        icon: 'error',
                        confirmButtonText: 'بستن'
                      });
                    $('#submit-orders').html('ثبت سفارش');
                }
            })
        }

    })
})