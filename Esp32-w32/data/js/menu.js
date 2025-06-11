$(() => {
    'use strict'
    const getStoredUsername = () => localStorage.getItem('username')
    const getStoredPassword = () => localStorage.getItem('password')

    const uid = function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    var data = [];

    var selectedTabId;

    $.ajax({
        method: "POST",
        url: "getMenu",
        data: {},
        success: (menuData) => {
            data = menuData;
            createView();
        },
        error: (err) => {
            //
        }
      })

    function createView() {
        $('#food-data').empty();
        var tabView = `
            <ul style="max-width: 100vw; min-width: 100%; min-height: 40px; overflow-y: hidden;" class="nav nav-tabs mt-3 overflow-x-auto d-flex flex-nowrap" role="tablist">
                <li id="add-tab" class="nav-item">
                    <button style="border-width: 0;" class="nav-link bg-white text-primary ms-2 me-3" id="add-tab-button" data-bs-toggle="modal" data-bs-target="#addFoodTabModal">+</button>
                </li>
            </ul>`;
        $('#food-data').append(tabView);
        var tabContent = `<div class="tab-content mt-3 w-100"></div>`;
        $('#food-data').append(tabContent);

        for(var i=0; i < data.length; i++){
            insertFoodTabData(data[i].id, data[i].name);
            let foodTabData = data[i].data;
            for(var j=0; j < foodTabData.length; j++){
                insertFoodCatData(data[i].id, foodTabData[j].id, foodTabData[j].name);
                let foodCatData = foodTabData[j].data;
                for(var k=0; k < foodCatData.length; k++){
                    insertFoodData(foodTabData[j].id, foodCatData[k]);
                }
            }
        }
    }

    function insertFoodTabData(id, name) {
        var htmlData = ` <li class="nav-item" style="min-width: 140px;" data-id="`+ id +`"> <button id="tab-`+ id +`" style="text-align: center; min-width: 140px;" class="nav-link`;
        if(($('#food-data .nav-tabs').children().length == 1 && selectedTabId == undefined) || selectedTabId == id){
            htmlData += ` active`;
        }
        htmlData += `" data-bs-toggle="tab" data-bs-target="#content-`+ id +`">`+ name +`</button></li>`;
        $('#add-tab').before(htmlData);
        var scrollable = $("#food-data .nav-tabs");
        scrollable.scrollLeft(scrollable[0].scrollWidth);

        var htmlContentData = `<div id="content-`+ id +`" style="height: auto; background-color: transparent !important;" class="container tab-pane`;
        if(($('#food-data .tab-content').children().length == 0 && selectedTabId == undefined) || selectedTabId == id){
            htmlContentData += ` fade show active`;
        } else {
            htmlContentData += ` fade`;
        }
        htmlContentData += `">
            <div class="content-child w-100 d-flex flex-column align-items-center">
                <div class="d-flex flex-row justify-content-center align-items-center my-3 my-lg-5">
                    <button style="min-width: 50px; min-height: 45px;" class="btn btn-outline-primary me-1 add-cat-button" data-bs-toggle="modal" data-bs-target="#addFoodCatModal" parent-id="`+ id +`">
                        <span class="d-none d-lg-flex">افزودن گروه غذایی جدید</span>
                        <svg class="bi pe-none d-lg-none" width="20" height="20"><use xlink:href="#add-icon"></use></svg>
                    </button>
                    <button style="min-width: 50px; min-height: 45px;" class="btn btn-outline-info me-1 edit-tab-button" data-bs-toggle="modal" data-bs-target="#addFoodTabModal" data-id="`+ id +`">
                        <span class="d-none d-lg-flex">ویرایش گروه اصلی</span>
                        <svg class="bi pe-none d-lg-none" width="20" height="20"><use xlink:href="#edit-icon"></use></svg>
                    </button>
                    <button style="min-width: 50px; min-height: 45px;" class="btn btn-outline-danger delete-tab-button" data-id="`+ id +`">
                        <span class="d-none d-lg-flex">حذف گروه اصلی</span>
                        <svg class="bi pe-none d-lg-none" width="20" height="20"><use xlink:href="#delete-icon"></use></svg>
                    </button>
                </div>
            </div>
        </div>`;
        $('#food-data .tab-content').append(htmlContentData);
    }

    function insertFoodCatData(parentId, id, name) {
        var htmlData = `
            <div class="cat-table d-md-flex w-100 flex-column align-items-center mt-5" parent-id="`+ parentId +`">
                <div class="cat-header d-flex flex-row w-100 mb-1">
                    <h5 class="cat-name" data-id="`+ id +`">` + name + `</h5>
                    <div class="flex-grow-1"></div>
                    <div class="d-flex flex-row">
                        <button type="button" style="min-width: 50px; min-height: 45px;" class="btn btn-outline-primary mb-3 add-row-button" data-bs-toggle="modal" data-bs-target="#addFoodModal" parent-id="`+ id +`">
                            <span class="d-none d-lg-flex">افزودن مواد غذایی</span>
                            <svg class="bi pe-none d-lg-none" width="20" height="20"><use xlink:href="#add-icon"></use></svg>
                        </button>
                        <button type="button" style="min-width: 50px; min-height: 45px;" class="btn btn-outline-info mb-3 mx-2 edit-cat-button" data-bs-toggle="modal" data-bs-target="#addFoodCatModal" parent-id="`+ parentId +`" data-id="`+ id +`">
                            <span class="d-none d-lg-flex">ویرایش گروه</span>
                            <svg class="bi pe-none d-lg-none" width="20" height="20"><use xlink:href="#edit-icon"></use></svg>
                        </button>
                        <button type="button" style="min-width: 50px; min-height: 45px;" class="btn btn-outline-danger mb-3 delete-cat-button" parent-id="`+ parentId +`" data-id="`+ id +`">
                            <span class="d-none d-lg-flex">حذف گروه</span>
                            <svg class="bi pe-none d-lg-none" width="20" height="20"><use xlink:href="#delete-icon"></use></svg>
                        </button>
                    </div>
                </div>
                <div style="min-width: 100%" class="overflow-x-auto table-view">
                    <table class="table" data-id="` + id + `">
                        <thead>
                            <tr>
                                <th style="width: 100px;"></th>
                                <th style="width: 200px;">نام مواد غذایی</th>
                                <th colspan="2">توضیحات</th>
                                <th style="width: 160px;">قیمت (تومان)</th>
                                <th style="width: 100px;">موجودی</th>
                                <th style="width: 120px;"></th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>`;
        $(`#content-`+ parentId +` .content-child`).append(htmlData);
    }

    function insertFoodData(parentId, data) {
        var htmlData = `
            <tr data-id="`+ data.id +`">
                <td>
                    <div class="d-flex">
                        <a type="button" class="up-btn" parent-id="`+ parentId +`" data-id="`+ data.id +`"><svg class="bi pe-none me-2" width="32" height="32"><use xlink:href="#move-up-icon"></use></svg></a>
                        <a type="button" class="down-btn" parent-id="`+ parentId +`" data-id="`+ data.id +`"><svg class="bi pe-none me-2" width="32" height="32"><use xlink:href="#move-down-icon"></use></svg></a>
                    </div>
                </td>
                <td>`+ data.name +`</td>
                <td colspan="2">`+ data.desc +`</td>
                <td class="ps-4">`+ data.price +`</td>
                <td>
                    <div class="form-check form-switch ms-4">
                        <input class="form-check-input fs-4 change-status" type="checkbox" role="switch" data-id="`+ data.id +`"/>
                    </div>
                </td>
                <td>
                    <div>
                        <button type="button" class="btn btn-outline-info me-1 edit-row-button" data-bs-toggle="modal" data-bs-target="#addFoodModal" parent-id="`+ parentId +`" data-id="`+ data.id +`">
                            <svg class="bi pe-none" width="20" height="20"><use xlink:href="#edit-icon"></use></svg>
                        </button>
                        <button type="button" class="btn btn-outline-danger delete-row-button" parent-id="`+ parentId +`" data-id="`+ data.id +`">
                            <svg class="bi pe-none" width="20" height="20"><use xlink:href="#delete-icon"></use></svg>
                        </button>
                    </div>
                </td>
            </tr>`;
        $('#food-data table[data-id="'+ parentId +'"]').find('tbody').append(htmlData);
        if(data.exist == "true"){
            $('#food-data input[data-id="'+ data.id +'"]').attr('checked','');
        }
    }

    $(document).on('click', '#food-data .nav-link', function(){
        selectedTabId = $(this).parent().attr('data-id')
    })

    $(document).on('click', '.up-btn,.down-btn', function(){
        var parentId = $(this).attr('parent-id');
        var id = $(this).attr('data-id');
        for(var i=0; i < data.length; i++){
            for(var j=0; j < data[i].data.length; j++){
                if(data[i].data[j].id == parentId){
                    for(var k=0; k < data[i].data[j].data.length; k++){
                        if(data[i].data[j].data[k].id == id){
                            if ($(this).is(".up-btn")) {
                                data[i].data[j].data = moveArrayItem(data[i].data[j].data,k,k-1);
                            } else {
                                data[i].data[j].data = moveArrayItem(data[i].data[j].data,k,k+1);
                            }
                        }
                    }
                }
            }
        }
        createView()
    });

    function moveArrayItem(arr, oldIndex, newIndex) {
        if (newIndex < 0 || newIndex >= arr.length) {
            return arr;
        }
        arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
        return arr;
    }

    $(document).on('click', '#add-tab-button', function() {
        $('#addFoodTabModal').attr('data-id','');
        $('#addFoodTabModal h5.modal-title').text('گروه اصلی جدید');
        $('#food-tab-name').val('');
        $('#food-tab-save').text('افزودن');
    })

    $(document).on('click', 'button.edit-tab-button', function() {
        var id = $(this).attr('data-id');
        var name = '';
        for(var i=0; i < data.length; i++){
            if(data[i].id == id){
                name = data[i].name;
            }
        }
        $('#addFoodTabModal').attr('data-id',id);
        $('#addFoodTabModal h5.modal-title').text('ویرایش گروه: '+ name +'');
        $('#food-tab-name').val(name);
        $('#food-tab-save').text('ذخیره');
    })

    $(document).on('click', 'button.delete-tab-button', function() {
        var id = $(this).attr('data-id');
        data = data.filter(function(item) {
            if (item.id == id) {
                return false;
            }
            return true;
        });
        createView();
    })
    
    $(document).on('click', '#food-tab-save', function() {
        var foodTabName = $('#food-tab-name').val();

        if(foodTabName.length == 0) {
            alert('لطفا نام گروه را وارد کنید!');
            return;
        }

        if($('#food-tab-save').text() == 'ذخیره'){
            var id = $('#addFoodTabModal').attr('data-id');
            for(var i=0; i < data.length; i++){
                if(data[i].id == id){
                    data[i].name = foodTabName;
                }
            }
        } else {
            var id = uid();
            data.push({
                id: id,
                name: foodTabName,
                data: []
            });
            selectedTabId = id;
        }
        $('#addFoodTabModal').modal('hide');
        createView();
    })

    $(document).on('click', 'button.add-cat-button', function() {
        var foodCatParentId = $(this).attr('parent-id');
        $('#addFoodCatModal').attr('parent-id',foodCatParentId);
        $('#addFoodCatModal').attr('data-id','');
        $('#addFoodCatModal h5.modal-title').html('گروه غذایی جدید');
        $('#food-cat-name').val('');
        $('#food-cat-save').html('افزودن');
    })

    $(document).on('click', 'button.edit-cat-button', function() {
        var foodCatParentId = $(this).attr('parent-id');
        var foodCatId = $(this).attr('data-id');
        var foodCatName = $('h5[data-id="'+ foodCatId +'"]').text();

        $('#addFoodCatModal').attr('parent-id',foodCatParentId);
        $('#addFoodCatModal').attr('data-id',foodCatId);
        $('#addFoodCatModal h5.modal-title').html('ویرایش گروه غذایی: '+ foodCatName);
        $('#food-cat-name').val(foodCatName);
        $('#food-cat-save').html('ذخیره');
    });

    $(document).on('click', 'button.delete-cat-button', function() {
        var parentId = $(this).attr('parent-id');
        var id = $(this).attr('data-id');
        for(var i=0; i < data.length; i++){
            if(data[i].id == parentId){
                for(var j=0; j < data[i].data.length; j++){
                    if(data[i].data[j].id == id){
                        data[i].data.splice(j, 1);
                    }
                }
            }
        }
        createView();
    });

    $(document).on('click', '#food-cat-save', function() {
        var foodCatName = $('#food-cat-name').val();

        if(foodCatName.length == 0) {
            alert('لطفا نام گروه را وارد کنید!');
            return;
        }

        var parentId = $('#addFoodCatModal').attr('parent-id');

        if($('#food-cat-save').text() == 'ذخیره'){
            var id = $('#addFoodCatModal').attr('data-id');
            for(var i=0; i < data.length; i++){
                if(data[i].id == parentId){
                    for(var j=0; j < data[i].data.length; j++){
                        if(data[i].data[j].id == id){
                            data[i].data[j].name = foodCatName;
                        }
                    }
                }
            }
        } else {
            var id = uid();
            for(var i=0; i < data.length; i++){
                if(data[i].id == parentId){
                    data[i].data.push({
                        id: id,
                        name: foodCatName,
                        data: []
                    });
                }
            }
        }
        $('#addFoodCatModal').modal('hide');
        createView();
    })

    $(document).on('click', 'button.add-row-button', function() {
        var parentId = $(this).attr('parent-id');
        $('#addFoodModal').attr('parent-id', parentId);
        $('#addFoodModal').attr('data-id', '');
        $('#addFoodModal h5.modal-title').html('مواد غذایی جدید');
        $('#food-name').val('');
        $('#food-desc').val('');
        $('#food-price').val('');
        $('#food-save').html('افزودن');
    })

    $(document).on('click', 'button.edit-row-button', function() {
        var foodName = '';
        var foodDesc = '';
        var foodPrice = '';

        var parentId = $(this).attr('parent-id');
        var id = $(this).attr('data-id');

        for(var i=0; i < data.length; i++){
            for(var j=0; j < data[i].data.length; j++){
                for(var k=0; k < data[i].data[j].data.length; k++){
                    if(data[i].data[j].data[k].id == id){
                        foodName = data[i].data[j].data[k].name;
                        foodDesc = data[i].data[j].data[k].desc;
                        foodPrice = data[i].data[j].data[k].price;
                    }
                }
            }
        }

        $('#addFoodModal').attr('parent-id',parentId);
        $('#addFoodModal').attr('data-id',id);
        $('#addFoodModal h5.modal-title').html('ویرایش مواد غذایی: '+ foodName);
        $('#food-name').val(foodName);
        $('#food-desc').val(foodDesc);
        $('#food-price').val(foodPrice);
        $('#food-save').html('ذخیره');
    })

    $(document).on('click', 'button.delete-row-button', function() {
        var id = $(this).attr('data-id');
        for(var i=0; i < data.length; i++){
            for(var j=0; j < data[i].data.length; j++){
                for(var k=0; k < data[i].data[j].data.length; k++){
                    if(data[i].data[j].data[k].id == id){
                        data[i].data[j].data.splice(k, 1);
                    }
                }
            }
        }
        createView();
    });

    $(document).on('click', '#food-save', function() {
        var foodName = $('#food-name').val();
        var foodDesc = $('#food-desc').val();
        var foodPrice = $('#food-price').val();

        if(foodName.length == 0) {
            alert('لطفا نام غذا را وارد کنید!');
            return;
        }
        if(foodPrice.length == 0) {
            alert('لطفا قیمت را وارد کنید!');
            return;
        }

        var parentId = $('#addFoodModal').attr('parent-id');

        if($('#food-save').text() == 'ذخیره'){
            var id = $('#addFoodModal').attr('data-id');
            for(var i=0; i < data.length; i++){
                for(var j=0; j < data[i].data.length; j++){
                    var cat = data[i].data[j];
                    if(cat.id == parentId){
                        for(var k=0; k < cat.data.length; k++){
                            if(cat.data[k].id == id){
                                data[i].data[j].data[k].name = foodName;
                                data[i].data[j].data[k].desc = foodDesc;
                                data[i].data[j].data[k].price = foodPrice;
                            }
                        }
                    }
                }
            }
        } else {
            var id = uid();
            for(var i=0; i < data.length; i++){
                for(var j=0; j < data[i].data.length; j++){
                    if(data[i].data[j].id == parentId){
                        data[i].data[j].data.push({
                            id: id,
                            name: foodName,
                            desc: foodDesc,
                            price: foodPrice,
                            exist: "true"
                        });
                    }
                }
            }
        }
        $('#addFoodModal').modal('hide');
        createView();
    })

    $(document).on('change', 'input.change-status', function() {
        var checked = $(this).is(":checked");
        var id = $(this).attr("data-id");
        for(var i=0; i < data.length; i++){
            for(var j=0; j < data[i].data.length; j++){
                for(var k=0; k < data[i].data[j].data.length; k++){
                    if(data[i].data[j].data[k].id == id){
                        data[i].data[j].data[k].exist = checked.toString();
                    }
                }
            }
        }
    })

    $(document).on('click', '#export-btn', function() {
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "menu.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    $(document).on('click', '#import-btn', function() {
        $('#import-input').click();
    })

    $(document).on('change', '#import-input', function(event) {
        var file = event.target.files[0];
        if(file){
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var jsonData = JSON.parse(e.target.result);
                    data = jsonData;
                    selectedTabId = undefined;
                    createView();
                } catch (error) {
                    console.error("Error parsing JSON: ", error);
                }
            };
            reader.readAsText(file);
        }
    });

    $(document).on('click', '#save-menu-btn', function() {
        $('#save-menu-btn .v1').addClass('d-none');
        $('#save-menu-btn .v2').removeClass('d-none');
        if(data.length == 0){
            clearMenu();
        } else {
            saveDataRow(0, data[0]);
        }
    })

    function saveDataRow(row, rowData) {
        $.ajax({
            method: "POST",
            url: "setMenu",
            headers: {
                adminUsername: getStoredUsername(),
                adminPassword: getStoredPassword()
            },
            data: {
                data: JSON.stringify(rowData),
            },
            success: (responseData) => {
                if(row == data.length - 1){
                    Swal.fire({
                        title: 'تغییرات اعمال شد',
                        icon: 'success',
                        confirmButtonText: 'بستن'
                      }).then((result) => {
                        window.location.reload();
                      });
                    $('#save-menu-btn .v1').removeClass('d-none');
                    $('#save-menu-btn .v2').addClass('d-none');
                } else {
                    saveDataRow(row + 1, data[row + 1]);
                }
            },
            error: (err) => {
                Swal.fire({
                    title: 'تغییرات اعمال نشد',
                    icon: 'error',
                    confirmButtonText: 'بستن'
                  });
                $('#save-menu-btn .v1').removeClass('d-none');
                $('#save-menu-btn .v2').addClass('d-none');
            }
          })
    }

    function clearMenu() {
        $.ajax({
            method: "POST",
            url: "clearMenu",
            headers: {
                adminUsername: getStoredUsername(),
                adminPassword: getStoredPassword()
            },
            data: {},
            success: (responseData) => {
                Swal.fire({
                    title: 'تغییرات اعمال شد',
                    icon: 'success',
                    confirmButtonText: 'بستن'
                  }).then((result) => {
                    window.location.reload();
                  });
            },
            error: (err) => {
                Swal.fire({
                    title: 'تغییرات اعمال نشد',
                    icon: 'error',
                    confirmButtonText: 'بستن'
                  });
            }
          })
    }
});