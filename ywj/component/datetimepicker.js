/**
 * Created by sasumi on 2014/12/2.
 */
define('ywj/datetimepicker', function(require){
	require('ywj/resource/datetimepicker.css');
	var Tip = require('ywj/tip');

	var parse_date_str = function(date_str){
		var d = new Date(date_str);
		return {
			year: d.getFullYear(),
			month: d.getMonth()+1,
			date: d.getUTCDate(),
			hour: d.getUTCHours(),
			min: d.getUTCMinutes(),
			second: d.getUTCSeconds()
		}
	};

	/**
	 * 查询上个月
	 * @param year
	 * @param month
	 * @returns {*}
	 */
	var get_last_month = function(year, month){
		return month === 1 ? [year-1, 12] : [year, month-1];
	};

	/**
	 * 查询下个月
	 * @param year
	 * @param month
	 * @returns {*}
	 */
	var get_next_month = function(year, month){
		return month === 12 ? [year+1, 1] : [year, month + 1];
	};

	/**
	 * 获取月份内的天数序列，包含上一个月后补，下一个月前缀天数
	 * @param year
	 * @param month
	 * @param day_start
	 * @returns {[null]}
	 */
	var get_days_serials = function(year, month, day_start){
		var current_month_days_count = new Date(year, month, 0).getDate();
		var last_month_days_count = new Date(year, month-1, 0).getDate();
		var first_day = new Date(year, month-1, 1).getDay();
		var prev_patch_count = Math.abs(day_start - first_day);
		var next_patch_count = 7 - (prev_patch_count + current_month_days_count)%7;
		var today = parse_date_str();
		[last_year, last_month]  = get_last_month(year, month);
		[next_year, next_month]  = get_next_month(year, month);

		var date_serials = [];
		//patch previous month dates
		for(var i=prev_patch_count-1; i>=0; i--){
			date_serials.push({
				year: last_year,
				month: last_month,
				date: last_month_days_count - i,
				month_flag: 'last'
			});
		}

		//current month dates
		for(var i=0; i<current_month_days_count; i++){
			var is_today = today.year == year && today.month == month && today.date == (i+1);
			date_serials.push({
				year: year,
				month: month,
				date: i+1,
				now: is_today ? true : false,
				month_flag: 'current'
			});
		}

		//next month dates
		for(var i=0; i<next_patch_count; i++){
			date_serials.push({
				year: year,
				month: month,
				date: i+1,
				month_flag: 'next'
			})
		}

		return date_serials;
	};

	var get_html = function(date_val, cfg){
		var date_obj = parse_date_str(date_val);
		var year_sel_str = '';
		cfg = cfg || {};
		cfg.months = cfg.months || ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
		cfg.days = cfg.days || ['一', '二', '三', '四', '五', '六', '日'];
		cfg.day_start = cfg.day_start || 1;

		//year select panel
		for(var i=0; i<16; i+=4){
			year_sel_str += '<tr>';
			for(var j=0; j<4; j++){
				var y = date_obj.year+i+j;
				year_sel_str += '<td '+(!i && !j ? 'class="active"' : '')+'>'+y+'</td>';
			}
			year_sel_str += '</tr>';
		}
		var html = '<div class="com-dtp">'+
			'<table class="com-dpt-year-panel" style="display:none;"><thead>'+
			'<tr><th><span class="com-dpt-prev-btn"></span></th><th colspan="2"><span class="com-dpt-month">请选择年份</span></th>'+
			'<th><span class="com-dpt-next-btn"></span></th></tr>'+
			'</thead><tbody>'+
			year_sel_str+
			'</tbody></table>';

		//month select panel
		var month_str = '';
		for(var i=0; i<3; i++){
			month_str += '<tr>';
			for(var j=0; j<4; j++){
				month_str += '<td>'+cfg.months[i+j]+'</td>';
			}
			month_str += '</tr>';
		}
		html += '<table class="com-dpt-month-panel" style="display:none;"><thead>'+
			'<tr><th><span class="com-dpt-prev-btn"></span></th><th colspan="2"><span class="com-dpt-year">'+date_obj.year+'</span></th>'+
				'<th><span class="com-dpt-next-btn"></span></th></tr>'+
			'</thead><tbody>'+
			month_str+
			'</tbody></table>';

		//day select panel
		var date_str = '';
		var day_str = '';
		var i = 0;
		var day_idx = 0;
		while(i++ < 7){
			day_idx = (i+cfg.day_start)%7;
			day_str += '<th>'+cfg.days[day_idx]+'</th>';
		}

		var ds = get_days_serials(date_obj.year, date_obj.month, cfg.day_start);
		for(var i=0; i<ds.length; i++){
			var d = ds[i];
			var cls = d.month_flag == 'last' ? 'com-dtp-date-old' : (d.month_flag == 'next' ? 'com-dtp-date-new'  : '');
			cls += d.now ? ' com-dpt-today' : '';
			 if(i%7 == 0){
			 	date_str += '<tr>';
			 }
			 date_str += '<td data-date="'+d.year+'-'+d.month+'-'+d.date+'" class="'+cls+'">'+d.date+'</td>';
			if(i%7 == 6){
				date_str += '</tr>';
			}
		}

		html += '<table class="com-dpt-date-panel">'+
			'<thead>'+
			'<tr><th><span class="com-dpt-prev-btn"></span></th>'+
				'<th colspan="5"><span class="com-dpt-year">'+date_obj.year+'</span><span class="com-dpt-month">'+cfg.months[date_obj.month-1]+'</span></th>'+
				'<th><span class="com-dpt-next-btn"></span></th>'+
			'</tr>'+
			'<tr>'+day_str+'</tr>'+
			'</thead>'+
			'<tbody>' +date_str+'</tbody></table>';
		html += '</div>';
		return html;
	};

	var set_date = function($relate_node, date){
		$relate_node.val(date);
	};

	var common_panel_tip;
	var show_common_panel = function($relate_node, date){
		if(!common_panel_tip){
			common_panel_tip = new Tip(get_html(date), $relate_node);
			var $dom = common_panel_tip.getDom();
			$dom.find('.ywj-tip-content').addClass('com-dpt-tip-content-wrap');
			$('body').click(function(e){
				if(e.target == $dom[0] || $.contains($dom[0], e.target) || e.target == $relate_node[0]){
					console.log('inside');
					return;
				}
				console.log('click outside');
				hide_common_panel();
			});

			//date click
			$dom.find('.com-dpt-date-panel tbody td').click(function(){

			});

			//year click
			$dom.find('.com-dpt-year').click(function(){

			});

			//year click
			$dom.find('.com-dpt-year').click(function(){

			});
		} else {
			var $dom = common_panel_tip.getDom().find('.ywj-tip-content');
			$dom.html(get_html(date));
			common_panel_tip.rel_tag = $relate_node;
		}
		common_panel_tip.show();
	};

	var hide_common_panel = function(){
		if(common_panel_tip){
			common_panel_tip.hide();
		}
	};

	var bind_node = function($node, param){
		if($node.attr('readonly') || $node.attr('disabled')){
			return;
		}

		$node.focus(function(){
			show_common_panel($(this), this.value);
		});
	};

	return {
		nodeInit: bind_node
	}
});