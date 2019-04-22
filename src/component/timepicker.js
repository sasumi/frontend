/**
 * Created by sasumi on 2014/12/2.
 */
define('ywj/timepicker', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');
	var $html = $('html');
	require('jquery/ui/timepicker');

	var top_window = window;
	try {
		if(top.seajs){
			top_window = top;
		}
		window.frameElement && top_window.seajs.use('ywj/timepicker');
	} catch(ex){
		console.error('Top window access fail, use local window instead.', ex);
	}

	var cover_date_str = function(str){
		if(str === 'now'){
			return new Date();
		}
		return str;
	};

	/**
	 * show datetime picker in top window
	 */
	var $PICKER_CON;
	var SHOW_FLAG;
	var $LAST_NODE;
	var showPicker = function(method, $node, opt){
		SHOW_FLAG = true;
		$LAST_NODE = $node;
		if(!$PICKER_CON){
			$PICKER_CON = $('<div class="top-datetime-picker" style="position:absolute; background-color:white; z-index:2000">').appendTo(document.body);
			$html.keydown(function(e){
				if(e.keyCode === Util.KEYS.ESC){
					console.log('DELEGATE WINDOW key ESC, time picker hide');
					hidePicker();
				}
			});
			$html.click(function(e){
				if(e.target === $PICKER_CON[0] || !$(e.target).closest('html').size() ||  $.contains($PICKER_CON[0], e.target)){
					console.log('click inside time picker');
				} else {
					console.log('DELEGATE WINDOW click in other region');
					hidePicker();
				}
			});
		}
		opt.onSelect = function(date, $ins){
			console.info('timepicker select', date);
			$LAST_NODE.val(date).trigger('change');
			if(method === 'datepicker'){
				hidePicker();
			}
		};
		$PICKER_CON.show()
			.datepicker('destroy')
			.datetimepicker('destroy')
			[method](opt)
			[method]('setDate', $node.val());
		if(opt.left !== undefined){
			$PICKER_CON.css('left', opt.left);
		}
		if(opt.top !== undefined){
			$PICKER_CON.css('top', opt.top);
		}
		setTimeout(function(){SHOW_FLAG = false;}, 100);
	};

	/**
	 * hide top window datetime picker
	 */
	var hidePicker = function(method){
		console.info('SHOW_FLAG', SHOW_FLAG);
		if(!$PICKER_CON || SHOW_FLAG){
			return;
		}
		console.info('hide datetime picker');
		$PICKER_CON.hide();
	};

	return {
		showPicker: showPicker,
		hidePicker: hidePicker,
		nodeInit: function($node, param){
			if($node.attr('readonly') || $node.attr('disabled')){
				return;
			}

			var opt = {};
			var method = 'datepicker';
			switch(param.format){
				case 'date':
					opt = {dateFormat: 'yy-mm-dd'};
					opt.maxDate = cover_date_str(param.max);
					opt.minDate = cover_date_str(param.min);
					method = 'datepicker';
					break;

				case 'time':
					opt = {timeFormat:'HH:mm:ss'};
					opt.maxTime = cover_date_str(param.max);
					method = 'timepicker';
					break;

				case 'datetime':
				case '':
				default:
					opt = {dateFormat: 'yy-mm-dd', timeFormat: 'HH:mm:ss'};
					opt.maxTime = cover_date_str(param.max);
					method = 'datetimepicker';
					break;
			}

			//bind space click only in difference frame
			if(top_window !== window){
				$html.click(function(e){
					if($PICKER_CON && (e.target === $PICKER_CON[0] || !$(e.target).closest('html').size() ||  $.contains($PICKER_CON[0], e.target))){
						console.log('LOCAL WINDOW click inside time picker');
						//hit current picker
					} else if(e.target === $node[0]){
						console.log('LOCAL WINDOW hit on input');
					} else {
						console.log('LOCAL WINDOW click in other region');
						top_window.seajs.use('ywj/timepicker', function(tp){
							console.log('local hide');
							tp.hidePicker(method);
						});
					}
				});
			}

			$node.click(function(){
				console.log('node click');
				top_window.seajs.use('ywj/timepicker', function(tp){
					var r = Util.getNodeRegionInTop($node);
					opt.left = r.left;
					opt.top = r.top + $node.outerHeight();
					console.log('node click', method, $node, opt);
					tp.showPicker(method, $node, opt);
				});
			});
		}
	}
});