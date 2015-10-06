/**
 * Created by sasumi on 15/1/2015 0015.
 */
define('ywj/selectui', function(require){
	var $ = require('jquery');

	return function(sel, opt){
		opt = $.extend({
			cssClass: 'g-select',
			hoverClass: 'g-select-hover',
			childHover: 'hover',
			childActive: 'active'
		}, opt);

		$(sel).each(function(){
			var select = this;
			var current = this.options[this.selectedIndex];
			var w = $(this).outerWidth();
			var h = $(this).outerHeight();
			var html = '<dl class="'+opt.cssClass+'" style="width:'+w+'px; height:'+h+'px">';
			html += '<dt tabindex=0>'+$(current).text()+'</dt>';
			$.each(this.options, function(k, option){
				html += '<dd tabindex=0 class="'+(k==select.selectedIndex ? opt.childActive : '')+'">'+decodeURI($(option).text())+'</dd>';
			});
			html += '</dl>';

			var n = $(html).insertAfter(this);
			$(this).hide();

			//even
			n.hover(function(){
				$(this).addClass(opt.hoverClass);
			}, function(){
				$(this).removeClass(opt.hoverClass);
			});
			n.children().hover(function(){
				$(this).addClass(opt.childHover);
			}, function(){
				$(this).removeClass(opt.childHover);
			});
			$('dd',n).click(function(){
				var idx = $(this).index()-1;
				n.children().removeClass(opt.childActive);
				$(this).addClass(opt.childActive);
				$('dt', n).html($(this).text());
				n.removeClass(opt.hoverClass);
				select.selectedIndex = idx;
				$(select).trigger('change');
			});
		})
	};
});