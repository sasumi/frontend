/**
 * Created by Sasumi on 2015/6/18.
 */
seajs.use('jquery', function($){
	return;
	var isChrome = function (){ // Actually, isWithChromePDFReader
		for (var i=0; i<navigator.plugins.length; i++)
			if (navigator.plugins[i].name == 'Chrome PDF Viewer') return true;
		return false;
	};

	var userAgent = navigator.userAgent.toLowerCase();
	var id = 'acca'+ (Math.random()+'').replace('.','');
	var style = '<style>#'+id+'{background-color:#ff8f4a; padding:200px 10px; text-align:center; color:white; font-size:14px; text-shadow:1px 1px 1px black;} #'+id+' a {color:white; text-decoration:underline}</style>';
	$(style).appendTo($('head'));
	var notChrome = !$.browser.webkit || userAgent.indexOf('se 2.x') != -1 || userAgent.indexOf('360se') != -1 || userAgent.indexOf(' opr/') != -1;

	var html;
	if(notChrome){
		html = '<div id="'+id+'">'+
			'为了更好支持当前系统功能，请使用chrome浏览器。' +
			'<a href="http://www.baidu.com/link?url=uW6N14FmKFmvaGqqDjRz-mA5X3qWZtmgYkaNVsDRg-2LOzFAaN6mqtelXQFSNvFmjSgl60rtwrMqPisH2JzEyK" target="_blank">马上下载</a>'+
			'<br/>更多疑问，请咨询 <a href="http://wpa.qq.com/msgrd?v=3&uin=361591257&site=qq&menu=yes" target="_blank">开发同学</a></div>';
		$('body').html(html);
	} else if(!isChrome() && false){
		html = '<div id="'+id+'">'+
			'为了更好支持当前系统功能，请使用正式发行版chrome浏览器，您当前使用的版本为Chromium，不符合系统运行要求。' +
			'<a href="http://www.baidu.com/link?url=uW6N14FmKFmvaGqqDjRz-mA5X3qWZtmgYkaNVsDRg-2LOzFAaN6mqtelXQFSNvFmjSgl60rtwrMqPisH2JzEyK" target="_blank">马上下载</a>'+
			'<br/>更多疑问，请咨询 <a href="http://wpa.qq.com/msgrd?v=3&uin=361591257&site=qq&menu=yes" target="_blank">开发同学</a></div>';
		$('body').html(html);
	}
});