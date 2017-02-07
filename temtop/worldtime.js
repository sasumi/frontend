define('temtop/worldtime', function (require) {
	require('temtop/resource/worldtime.css');
	var SERVER_TIMEZONE = window['SERVER_TIMEZONE'];
	var Tip = require('ywj/tip');
	var $ = require('jquery');
	var WT_MAP = [
		['Asia/Shanghai', '中国', 8, 'de.png'],
		['Europe/Berlin', '德国', 1, 'de.png'],
		['Europe/Rome', '意大利', 1, 'de.png'],
		['Europe/Madrid', '西班牙', 1, 'de.png'],
		['Europe/Paris', '法国', 1, 'de.png'],
		['America/New_York', '美国纽约', -4, 'de.png'],
		['Europe/London', '英国', 0, 'de.png'],
		['Asia/Tokyo', '日本', 9, 'de.png']
	];

	var dateFormat = function (d) {
		return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2) +
			" " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2);
	};

	var dateToUtc = function (d) {
		return d.getUTCFullYear() + "-" + ("0" + (d.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + d.getUTCDate()).slice(-2) +
			" " + ("0" + d.getUTCHours()).slice(-2) + ":" + ("0" + d.getUTCMinutes()).slice(-2) + ":" + ("0" + d.getUTCSeconds()).slice(-2);
	};

	var get_html = function (time_str) {
		var dt = new Date(time_str);
		var utc = new Date(dateToUtc(dt));
		var utc_time = SERVER_TIMEZONE ? (dt.getTime() - SERVER_TIMEZONE.offset * 3600 * 1000) : utc.getTime();
		var html = '<table class="world-time-tbl"><thead><tr><th>国家</th><th>时间</th></tr></thead><tbody>';
		for (var i in WT_MAP) {
			if (WT_MAP[i]) {
				var convert = utc_time + WT_MAP[i][2] * 3600 * 1000;
				var d = new Date(convert);
				var cl = WT_MAP[i][0] == SERVER_TIMEZONE.timezone ? 'current_zone' : '';
				html += '<tr class="'+cl+'"><td>' + WT_MAP[i][1] + '</td><td>' + dateFormat(d) + '</td></tr>';
			}
		}
		html += '</tbody></table>';
		return html;
	};

	$('.t-time').each(function () {
		var $this = $(this);
		var time = $this.data('wordtime-code-bind') || $.trim($this.text());
		var html = get_html(time);
		Tip.bind(html, this);
	})
});