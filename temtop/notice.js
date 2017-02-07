define('temtop/notice', function(require){
	require('jquery/cookie');
	var $ = require('jquery');
	var Net = require('ywj/net');
	var Pop = require('ywj/popup');
	var Util = require('ywj/util');
	var NOTICE_CGI_URL = window['NOTICE_CGI_URL'];
	var NOTICE_LIST_URL = window['NOTICE_LIST_URL'];

	var COOKIE_UNREAD_FLAG = 'NOTICE_READ_FLAG';
	var COOKIE_CHECK_KEY = 'NOTICE_LAST_UPDATE';
	var CHECK_TIME_INTERVAL = 360; //每*秒检查一次

	var render = function($node, unread){
		$node.show().removeClass('notice-unread').attr('title', '');
		if(unread){
			$node.addClass('notice-unread').attr('title', '您有未读消息');
		}
	};

	return {
		nodeInit: function($node){
			$node.hide();
			return;
			if(!NOTICE_CGI_URL){
				return;
			}

			var now = (new Date()).getTime()/1000;
			var last_update = $.cookie(COOKIE_CHECK_KEY) || 0;

			$node.click(function(){
				Net.get(NOTICE_CGI_URL, {check_time: last_update}, function(data){
					var html = '<table class="data-tbl" id="notice-table-list">';
					html += '<thead><tr><th>类型</th><th>标题</th><th>时间</th><th>作者</th></tr></thead>';
					html += '<tbody>';
					for(var i=0; i<data.noticeList.length; i++){
						var n = data.noticeList[i];
						html += '<tr>';
						html += '<td>'+Util.htmlEscape(n.type)+'</td>';
						html += '<td><a href="'+n.url+'">'+Util.htmlEscape(n.title)+'</a></td>';
						html += '<td>'+n.addtime+'</td>';
						html += '<td>'+Util.htmlEscape(n.name)+'</td>';
						html += '</tr>';
					}
					html += '</tbody></table>';
					if(NOTICE_LIST_URL){
						html += '<div class="operate-row" style="padding:10px 0;">';
						html += '<a href="'+NOTICE_LIST_URL+'" class="btn btn-weak">查看更多</a>';
						html += '</div>';
					}

					var p = new Pop({
						title: '最近更新',
						width: 550,
						content: html
					});
					p.show();
				}, {frontCache: true});
			});

			if(last_update && (now - last_update) < CHECK_TIME_INTERVAL){
				render($node, $.cookie(COOKIE_UNREAD_FLAG));
				return;
			}

			Net.get(NOTICE_CGI_URL, {check_time: last_update}, function(data){
				if(data.update_count){
					$node.html('<b>'+data.update_count+'</b>').show();
				}
				$.cookie(COOKIE_CHECK_KEY, now);
				$.cookie(COOKIE_UNREAD_FLAG, data.update_count);
				render($node, true);
				last_update = now;
			}, {onError: function(e){
			}, frontCache: true});
		}
	}
});