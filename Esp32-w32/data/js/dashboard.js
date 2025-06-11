(() => {
    'use strict'
      
    const getStoredUsername = () => localStorage.getItem('username')
    const getStoredPassword = () => localStorage.getItem('password')
    const setStoredUsername = username => localStorage.setItem('username', username)
    const setStoredPaaword = password => localStorage.setItem('password', password)

    const setStoredPlaySound = play => localStorage.setItem('playSound', play)

    $.ajax({
      method: "POST",
      url: "getConfig",
      headers: {
          adminUsername: getStoredUsername(),
          adminPassword: getStoredPassword()
      },
      data: {},
      success: (data) => {
        $('#site-title').text(data['siteTitle']);
        setStoredPlaySound(data['playSound'] == 'true');
      },
      error: (err) => {
        window.location.href = 'login.html';
      }
    });

    $("#logout").on('click', function() {
        setStoredUsername("")
        setStoredPaaword("")
        window.location.href = 'login.html';
    })
  })()