define('temtop/notice', function(require){
	require('jquery/cookie');
	require('temtop/resource/temtop_notice.css');
	var $ = require('jquery');
	var Net = require('ywj/net');
	var Pop = require('ywj/popup');
	var Util = require('ywj/util');

	var NOTICE_CGI_URL = window['NOTICE_CGI_URL'];
	if(!NOTICE_CGI_URL){
		console.error('NOTICE_CGI_URL REQUIRED');
		return;
	}

	var ONE_DAY = 86400*1000;
	var CHECK_INTERVAL = 60*1000; //每60秒检查一次
	var TEMP_MIS_ALARM_INTERVAL = 60*2*1000; //临时关闭，2分钟之后提醒

	var COOKIE_TMP_CLOSE_FLAG = '_NTC_TMP_FLG_';
	var COOKIE_LAST_START_ID = '_NTC_CP_';  //cookie最后检测ID
	var COOKIE_LAST_UPDATE = '_NTC_LUPD_'; //cookie最后更新时间

	var set_cookie = function(k, v, mic_seconds){
		var tm = (new Date()).getTime() + mic_seconds;
		var date = new Date();
		date.setTime(tm);
		$.cookie(k, v, {expires:date, path:'/'});
	};

	var getRecentNotices = function(on_success, on_fail, last_id){
		on_fail = on_fail || function(){};
		Net.get(NOTICE_CGI_URL, {last_id: last_id}, function(rsp){
			on_success(rsp.data);
		}, {frontCache: true});
	};

	var mark_read = function(last_id){
		set_cookie(COOKIE_LAST_START_ID, last_id, ONE_DAY*7);
		set_cookie(COOKIE_LAST_UPDATE, (new Date).getTime(), ONE_DAY*7);
	};

	var show_panel = function(notice_list){
		var html = ['<ul class="temtop-notice-list">'];
		$.each(notice_list, function(k, notice){
			var new_link = '<a href="'+Util.htmlEscape(notice.url)+'" class="more" target="_blank">查看详细</a>';
			html.push('<li class="'+(!k?'active':'')+'">');
			html.push('<span class="ti">'+Util.htmlEscape(notice.title)+'</span>');
			html.push('<span class="tm">'+Util.htmlEscape(notice.addtime)+'</span>');
			html.push('<span class="u">'+Util.htmlEscape(notice.name)+'</span>');
			html.push('<div class="con"><table><tr><td>'+notice.content+new_link+'</td></tr></table></div>');
			html.push('</li>');
		});

		/**
		 * 临时关闭
		 */
		var tmp_close = function(){
			console.log('tmp close');
			set_cookie(COOKIE_TMP_CLOSE_FLAG, '1', TEMP_MIS_ALARM_INTERVAL);
		};

		var p = new Pop({
			title: '最新消息',
			content: html.join(''),
			width: 900,
			topCloseBtn: false,
			buttons: [
				{name: '标记已读', handler: function(){
					mark_read(notice_list[0].id);
					p.close();
				}},
				{name: '过一会再提醒', handler: function(){
					tmp_close();
					p.close();
				}}
			]
		});
		p.show();
		p.container.delegate('li', 'click', function(){
			$(this).parent().find('li').removeClass('active');
			$(this).addClass('active');
		})
	};

	var run = function(){
		var now = (new Date).getTime();
		var last_check_time = $.cookie(COOKIE_LAST_UPDATE);
		var last_start_id = $.cookie(COOKIE_LAST_START_ID);
		var tmp_closed = $.cookie(COOKIE_TMP_CLOSE_FLAG);

		if(tmp_closed){
			 console.log('tmp closed');
			 return;
		}

		console.log(last_check_time ? (new Date(parseInt(last_check_time, 10))) : 'last check time empty', last_check_time, last_start_id);
		if(!last_check_time || (now - last_check_time) > CHECK_INTERVAL){
			getRecentNotices(function(notice_list){
				if(notice_list){
					if(last_start_id >= notice_list[0].id){
						console.log('last id already read:', last_start_id);
						return;
					}
					show_panel(notice_list);
				} else {
					console.log('notice empty.',last_start_id);
				}
			}, null, last_start_id);
			return;
		}
		console.log('notice check time ignore');
	};

	run();
});