(() => {
  'use strict'
  $('#navigation .nav-link').on('click', function() {
      var target = $(this).attr('data-content');
      $('#navigation .nav-link').removeClass('active');
      $(this).addClass('active');
      $('#sections > .tab-pane').removeClass('show active');
      $('#' + target).addClass('show active');
      window.dispatchEvent(new Event('resize'));
  });
})()
