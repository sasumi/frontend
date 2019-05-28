define('ywj/auto', function(require){
	var lang = require('lang/$G_LANGUAGE');
	var $ = require('jquery');

	/**
	 * 绑定事件
	 */
	var bindEvent = function(){
		var $body = $('body');

		//select placeholder 效果
		(function(){
			var patch_select_title = function($sel, empty){
				if(empty){
					$sel.removeAttr('title');
				} else {
					$sel.attr('title', $sel.children().first().text());
				}
			};
			var update_select_holder = function($sel){
				var val = $sel[0].options[$sel[0].selectedIndex].getAttribute('value');
				var empty = val === '' || val === null;
				$sel.attr('placeholder', empty ? 'valid' : 'invalid');
				patch_select_title($sel, empty);
			};
			$('select[placeholder]').change(function(){
				update_select_holder($(this));
			}).each(function(){
				update_select_holder($(this));
			});
		})();

		//表格操作
		(function(){
			$body.delegate('*[rel=row-delete-btn]', 'click', function(){
				var row = $(this).parentsUntil('tr').parent();
				var allow_empty=$(this).data("allow-empty") || false;
				require.async('ywj/table', function(T){
					T.deleteRow(row,allow_empty);
				});
			});

			$body.delegate('*[rel=row-up-btn]', 'click', function(){
				var row = $(this).parentsUntil('tr').parent();
				require.async('ywj/table', function(T){
					T.moveUpRow(row);
				});
			});

			$body.delegate('*[rel=row-down-btn]', 'click', function(){
				var row = $(this).parentsUntil('tr').parent();
				require.async('ywj/table', function(T){
					T.moveDownRow(row);
				});
			});

			$body.delegate('*[rel=row-append-btn]', 'click', function(e){
				var $table = $(this).closest('table');
				var $tbl = $('tbody', $table).eq(0);
				var tpl = $(this).data('tpl');
				require.async('ywj/table', function(T){
					T.appendRow($('#'+tpl).text(), $tbl);
				});
				e.stopPropagation();
			});
		})();

		//日期组件预加载
		if($('input.date-time-txt:not([data-component])').size() || $('input.date-txt:not([data-component])').size()){
			require.async('ywj/timepicker', function(){
				var $dt = $('input.date-time-txt:not([data-component])');
				var $d = $('input.date-txt:not([data-component])');
				$dt.datetimepicker({
					dateFormat: 'yy-mm-dd',
					timeFormat: 'HH:mm:ss'
				});
				$d.datepicker({
					dateFormat: 'yy-mm-dd'
				});
				$dt.data('date-widget-loaded', 1);
				$d.data('date-widget-loaded', 1);
			});
		}

		$.each(['input.date-time-txt:not([data-component])', 'input.date-txt:not([data-component])'], function(idx, s){
			if($(s).size()){
				require.async('ywj/timepicker', function(){
					var opt = {dateFormat: 'yy-mm-dd'};
					if(s.indexOf('time') >= 0){
						opt.timeFormat = 'HH:mm:ss'
					}
					$(s).datetimepicker(opt);
					$(s).data('date-widget-loaded', 1);
				});
			}
			$body.delegate(s, 'click', function(){
				if(!$(this).data('date-widget-loaded')){
					var _this = this;
					require.async('ywj/timepicker', function(){
						var opt = {dateFormat: 'yy-mm-dd'};
						if(s.indexOf('time') >= 0){
							opt.timeFormat = 'HH:mm:ss'
						}
						$(_this).datetimepicker(opt);
						$(_this).data('date-widget-loaded', 1);
						$(_this).trigger('click');
					});
				}
			});
		});
	};

	/**
	 * 处理器
	 * 里面的处理逻辑都需要做好去重
	 */
	var handler = function(){
		//表格空值填充
		$('table[data-empty-fill]').each(function(){
			var empty = $('tbody td', this).size() == 0 || $('td', this).size() == $('thead td').size();
			if(empty){
				var cs = Math.max($('tr>td', this).size(),$('tr>th', this).size());
				var con = $('tbody', this).size() ? $('tbody', this) : $(this);
				$('<tr class="row-empty"><td colspan="'+(cs || 1)+'"><div class="data-empty"> '+lang("无数据")+'</div></td></tr>').appendTo(con);
			}
		});

		//表单自动将get参数写到隐藏域中
		$('form').each(function(){
			var action = this.getAttribute('action');
			if($(this).data('form-get-fixed') || !action){
				return;
			}
			$(this).data('form-get-fixed', 1);

			if(!this.method || (this.method.toLowerCase() == 'get' && action.indexOf('?') >= 0)){
				var query_str = action.substring(action.lastIndexOf("?")+1, action.length);
				var query_arr = query_str.split('&');
				for(var i=0;i<query_arr.length;i++){
					var tmp = query_arr[i].split('=');
					$(this).prepend('<input name="'+escape(decodeURIComponent(tmp[0]))+'" type="hidden" value="'+escape(decodeURIComponent(tmp[1]))+'" />');
				}
			}
		});
	};

	$(function(){
		bindEvent();
		handler();
	});
});