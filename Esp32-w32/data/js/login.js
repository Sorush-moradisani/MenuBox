$(() => {
  'use strict'
    
  const getStoredUsername = () => localStorage.getItem('username')
  const getStoredPassword = () => localStorage.getItem('password')
  const setStoredUsername = username => localStorage.setItem('username', username)
  const setStoredPaaword = password => localStorage.setItem('password', password)

  if(getStoredUsername() && getStoredPassword()){
    $.ajax({
      method: "POST",
      url: "getConfig",
      headers: {
          adminUsername: getStoredUsername(),
          adminPassword: getStoredPassword()
      },
      data: {},
      success: (data) => {
        setTheme(data)
        if(data['siteTitle']) window.location.href = 'dashboard.html'
      }
    })
  } else {
    $.ajax({
      method: "POST",
      url: "getSiteData",
      data: {},
      success: (data) => {
        setTheme(data)
        $('#site-title').text(data['siteTitle'])
      }
    })
  }

  var loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    let username = document.getElementById("username");
    let password = document.getElementById("password");

    if (username.value == "" || password.value == "") {
      alert("مطمئن شوید که مقداری را در هر دو قسمت وارد کرده اید!");
    } else {
      $.ajax({
        method: "POST",
        url: "login",
        data: {
          username: username.value,
          password: password.value,
        },
        success: (data) => {
          setStoredUsername(username.value);
          setStoredPaaword(password.value);
          window.location.href = 'dashboard.html';
        },
        error: (err) => {
          username.value = "";
          password.value = "";
          alert("نام کاربری یا رمز عبور اشتباه است!");
        },
      })
    }
  });

  function setTheme(data) {
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
  }
})()
