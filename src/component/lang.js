/**
 * Created by Administrator on 2016/5/27.
 */
define('ywj/lang', function(require){
	//auto detected browser language
	window['G_LANGUAGE'] = window['G_LANGUAGE']
		|| (navigator.language || navigator.userLanguage).replace('-', '_')
		|| 'zh_CN';

	console.info('Language detected:', window['G_LANGUAGE']);

	var tmp = {};

	return function(text){
		if(!window['LANG_PACKAGE']){
			console.error('language package setting no found');
			return text;
		}
		var PACKAGE = window['LANG_PACKAGE'][window['G_LANGUAGE']];
		if(!PACKAGE){
			console.error('language package no found');
			return text;
		}
		if(!PACKAGE[text]){
			if(!tmp[text]){
				console.warn('translate fail:' + text, window['G_LANGUAGE'], PACKAGE);
				tmp[text] = true;
			}
			return text;
		}
		return PACKAGE[text];
	};
});