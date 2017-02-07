/**
 * Created by Administrator on 2017/1/13.
 */
define('ywj/liteladder', function(require){
	var $body = $('body');
	var chk = function(){
		var $ladder = $('.ladder');
		var sh = $body[0].scrollHeight;
		var wh = $(window).height();
		if(!$ladder.size()){
			require.async('ywj/resource/liteladder.css');
			$ladder = $('<ul class="ladder"><li><a href="#top" data-up="1" title="按Home键" class="fa fa-angle-double-up"></a></li><li><a href="#bottom" data-down="1" class="fa fa-angle-double-down" title="按End键"></a></li></ul>').appendTo($body);
			$body.prepend('<a id="top" name="top"></a>');
			$body.append('<a id="bottom" name="bottom"></a>');

			var offset = [];
			var last_mouse_pos = [];
			var last_div_pos = [];
			var start_move = false;
			var moving = false;
			$ladder.mousedown(function(e){
				last_mouse_pos = [e.clientX, e.clientY];
				last_div_pos = [parseInt($ladder.css('margin-right'), 10), parseInt($ladder.css('margin-bottom'), 10)];
				start_move = true;
				return false;
			});
			$ladder.find('a').click(function(e){
				e.preventDefault();
				if(moving){
					moving = false;
					return false;
				}
				$body.stop().animate({
					scrollTop: ($(this).data('up')) ? 0 : ($body[0].scrollHeight)
				}, 'fast');
			});
			$body.mouseup(function(e){
				start_move = false;
			});
			$body.click(function(){
				moving = false;
			});
			$body.mousemove(function(e){
				if(start_move){
					offset[0] = e.clientX - last_mouse_pos[0];
					offset[1] = e.clientY - last_mouse_pos[1];
					moving = !((Math.abs(offset[0]) < 2) && (Math.abs(offset[1]) < 2));
					$ladder.css({
						marginRight: last_div_pos[0]-offset[0],
						marginBottom: last_div_pos[1]-offset[1]
					});
				}
			});
		}
		if(sh > wh && $body.css('overflow-y') != 'hidden') {
			$ladder.css('display', 'block');
		} else {
			$ladder.hide();
		}
	};
	$(window).resize(chk);
	setTimeout(chk, 500);
});