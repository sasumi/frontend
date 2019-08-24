define('ywj/ViewLink', function(require){
	var $ = require('jquery');
	var Tip = require('ywj/tip');
	var Util = require('ywj/util');

	$('<style>.open-link:before {content:"\\f08e"; font-size:14px; margin-left:0.2em; cursor:pointer; font-family:FontAwesome, serif; color:gray;}</style>').appendTo('head');

	var is_link = function(str){
		str = $.trim(str);
		return str && (str.indexOf('//') === 0 || /^\w+:\/\//.test(str));
	};

	var input_able = function($node){
		return !$node.attr('disabled') && !$node.attr('disabled') && $node.is(':input');
	};

	return {
		nodeInit: function($node, param){
			var val = $node.val() || $node.text();

			if(val || input_able($node)){
				var $view_btn = $node.next('.open-link');
				if(!$view_btn.size()){
					$view_btn = $('<span class="open-link" title="查看链接"></span>').insertAfter($node);
					$view_btn.click(function(){
						var url = $.trim($node.val() || $node.text());
						if(is_link(url)){
							Util.openLinkWithoutReferer(url);
							return false;
						}
						if(input_able($node)){
							if(!url){
								$node.focus();
								Tip.show('请输入URL', $node, {timeout: 1500});
								return false;
							}
							if(!is_link(url)){
								$node.focus();
								Tip.show('请输入正确格式的URL', $node, {timeout: 1500});
								return false;
							}
						}
					})
				}
			}
		}
	}
});