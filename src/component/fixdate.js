/**
 * Created by sasumi on 2014/12/2.
 */
define('ywj/fixdate', function(require){
	var $ = require('jquery');
	var $body = $('body');

	var format = function(val, fmt){
		return val;
	};

	var init = function(){
		$('input[type=date]').each(function(){
			var $this = $(this);
			if($this.data('fd-binded') || $this.data('format')){
				return;
			}
			$this.data('fd-binded', 1);

			var fmt = $this.data('format');
			if($this.val()){
				$this.val(format($this.val(), fmt));
			}
			$this.on('change keyup', function(){
				$this.val(format($this.val(), fmt));
			});
		});
	};

	$body.on('DOMSubtreeModified propertychange', function() {
		init();
	});
	init();
});