define('ywj/fixedhead', function (require) {
	var $ = require('jquery');
	var FIXED_CLASS = 'fixed-top-element';
	var tpl = '<div id="table-fixed-header" style="display:none;"><table></table></div>';

	return function(fixed_els){
		var $body = $('body');
		var $fixed_els = $(fixed_els);

		$fixed_els.each(function(){
			var $tbl = $(this);
			var $header_wrap = $(tpl).appendTo($body);
			var $table_header = $header_wrap.find('table');
			$table_header.addClass($tbl.attr('class'));
			$tbl.find("thead").clone().appendTo($table_header);
			var org_top = $tbl.offset().top;

			//scroll
			$(window).scroll(function(){
				var scroll_top = $(window).scrollTop();
				var $shadow = $('#table-fixed-header');
				if(org_top < scroll_top){
					$shadow.addClass(FIXED_CLASS).show();
				} else {
					$shadow.removeClass(FIXED_CLASS).hide();
				}
			}).trigger('scroll');

			//fix width
			$(window).resize(function(){
				var $org_ths = $tbl.find('th');
				$table_header.width($tbl.width());
				$header_wrap.css('left', $tbl.offset().left);
				$header_wrap.find('th').each(function(k, v){
					$(this).removeAttr('width');
					$(this).width($org_ths.eq(k).width());
				});
			}).trigger('resize');

			//bind partial check
			if($('[rel=selector]').size()){
				require.async('ywj/PartialCheckH5', function(PC){
					PC($('[rel=selector]', $header_wrap));
				});
			}
		});
	}
});