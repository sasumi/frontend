/**
 * Created by sasumi on 2014/12/2.
 */
define('ywj/timepicker', function(require){
	require('jquery/ui/timepicker');
	require('ywj/resource/timepicker.css');

	var cover_date_str = function(str){
		if(str == 'now'){
			return new Date();
		}
		return str;
	};

	return {
		nodeInit: function($node, param){
			if($node.attr('readonly') || $node.attr('disabled')){
				return;
			}

			var opt = {};
			switch(param.format){
				case 'date':
					opt = {dateFormat: 'yy-mm-dd'};
					opt.maxDate = cover_date_str(param.max);
					opt.minDate = cover_date_str(param.min);
					$node.datepicker(opt);
					break;

				case 'time':
					opt = {timeFormat:'HH:mm:ss'};
					opt.maxTime = cover_date_str(param.max);
					$node.timepicker(opt);
					break;

				case 'datetime':
				case '':
					opt = {timeFormat: 'HH:mm:ss'};
					opt.maxTime = cover_date_str(param.max);
					$node.datetimepicker(opt);
					break;

				case 'month':
					opt = '';

				default:
					opt = {timeFormat: param.format};
					opt.maxTime = cover_date_str(param.max);
					$node.datetimepicker(opt);
					break;
			}
		}
	}
});