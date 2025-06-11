$(() => {
  'use strict'

    $('.btn').on('click', function(e) {
        var $button = $(this);
        var $ripple = $('<span class="ripple"></span>');
        var buttonOffset = $button.offset();
        var xPos = e.pageX - buttonOffset.left;
        var yPos = e.pageY - buttonOffset.top;
        var size = Math.max($button.width(), $button.height());

        $ripple.css({
            width: size,
            height: size,
            top: yPos - size / 2,
            left: xPos - size / 2
        });

        $button.append($ripple);

        setTimeout(function() {
            $ripple.remove();
        }, 600);
    });
})