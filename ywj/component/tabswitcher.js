/**
 * tab 选择器
 * @param tb 选择器父容器
 * @param ctn 目标父容器
 * @param event 触发事件
 * @param active_class 激活class
 * @param disable_class 禁用class
 * @constructor
 */
define('ywj/tabswitcher', function(require){
	return function(tb, ctn, event, active_class, disable_class){
		event = event || 'click';
		active_class = active_class || 'active';
		disable_class = disable_class || 'disactive';

		var tbs = $(tb).children();
		var ctns = $(ctn).children();
		tbs.each(function(idx){
			$(this).on(event, function(ev){
				tbs.each(function(i){
					$(this)[i != idx ? 'removeClass' : 'addClass'](active_class);
					$(this)[i != idx ? 'addClass' : 'removeClass'](disable_class);
				});
				ctns.each(function(i){
					$(this)[i != idx ? 'removeClass' : 'addClass'](active_class);
					$(this)[i != idx ? 'addClass' : 'removeClass'](disable_class);
				});
				if($('input[type=radio]', this).size()){
					$('input[type=radio]', this).attr('checked', true);
				}
				if(event == 'click' && ev.target.type != 'radio'){
					return false;
				}
			});
		});
	};
});
