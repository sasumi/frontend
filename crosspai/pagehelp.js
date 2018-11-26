define('crosspai/pagehelp',function(require){
	require('crosspai/resource/pagehelp.css');
	var Util = require('ywj/util');
	var tmpl = require('ywj/tmpl');
	var $ = require('jquery');
	var Tip = require('ywj/tip');
	var Net = require('ywj/net');
	var CGI = 'http://help.whalepie.com/api/v1/article/search';

	if(!window['PAGE_HELP_AUTHORIZATION']){
		console.warn('NO PAGE HELP AUTHORIZATION KEY FOUND');
		return;
	}

	var tpl = '<article class="pagehelp">' +
		'<%if(article_list.length == 1){%>' +
		'<div class="pagehelp-title">' +
		'<%=article_list[0].title%>' +
		'</div>' +
		'<a href="<%=article_list[0].url%>" target="_blank" class="pagehelp-source-link">查看原文</a>' +
		'<div class="pagehelp-content">' +
			'<table><tr><td><%=article_list[0].content%></td></tr></table>' +
		'</div>' +
		'<%}else if(article_list.length){%>' +
		'<div class="pagehelp-title">“<%=keyword%>” 相关文章：</div>' +
		'<div class="pagehelp-content">' +
			'<ul class="pagehelp-article-list">' +
				'<%for(var i=0; i<article_list.length; i++){ var article=article_list[i];%>' +
				'<li><a href="<%=article.url%>" target="_blank"><%=article.title%></a></li>' +
				'<%}%>' +
			'</ul>' +
		'</div>' +
		'<%}else{%>' +
		'<span class="pagehelp-empty">没有找到相关帮助信息。</span>' +
		'<%}%>' +
		'</article>';

	var build_content = function(rsp, keyword){
		rsp = rsp || {};
		if(rsp.code == 0 || rsp.code == 'success'){
			var article_list = [];
			$.each(rsp.data.articles, function(k, article){
				article_list.push({
					title: Util.htmlEscape(article.title),
					content: article.content,
					url: Net.mergeCgiUri(article.url, {authorization: window.PAGE_HELP_AUTHORIZATION})
				});
			});
			return tmpl(tpl, {
				keyword: keyword,
				article_list: article_list
			});
		}
		return '系统繁忙，请稍后访问。';
	};

	return {
		nodeInit: function($node, param){
			$node.addClass('pagehelp-link');
			var opts = {
				authorization: window['PAGE_HELP_AUTHORIZATION']
			};
			var keyword = $.trim(param.keyword || $node.text());
			if(param.id){
				opts.id = param.id;
			} else {
				if(param.tags){
					opts.tags = param.tags;
				} else {
					opts.keyword = param.keyword;
				}
			}
			Tip.bindAsync($node, function(onSuccess, onError){
				Net.get(CGI, opts, function(rsp){
					console.log('pagehelp content', rsp);
					if(rsp.code == 0 || rsp.code == 'success'){
						onSuccess(build_content(rsp, keyword));
					}else{
						onError(rsp.message);
					}
				}, {
					format: 'jsonp',
					jsonpCallback: 'callback'
				});
			});
		}
	}
});