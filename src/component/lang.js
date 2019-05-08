/**
 * Created by Administrator on 2016/5/27.
 */
define('ywj/lang', function(require){
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