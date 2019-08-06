(function(){
	//auto detected browser language
	window['G_LANGUAGE'] = detected_lang();

	/**
	 * patch on after resolve function
	 * @private
	 */
	var __seajs_org_resolve__ = seajs.resolve;
	var __seajs_after_resolve_list = [];

	/**
	 * 侦测浏览器语言
	 * @returns {String}
	 */
	function detected_lang(){
		var SUPPORT_LANGUAGES = ['de_DE', 'en_US', 'zh_CN'];
		var DEFAULT_LANGUAGE = 'zh_CN';

		var lang = window['G_LANGUAGE']
			|| (navigator.language || navigator.userLanguage).replace('-', '_')
			|| 'zh_CN';

		var supported = false;
		SUPPORT_LANGUAGES.forEach(function(v){
			if(v == lang){
				supported = true;
			}
		});
		if(supported){
			console.log('Language detected:', lang);
		} else {
			console.warn('Language ['+lang+'] no supported, use default setting:', DEFAULT_LANGUAGE);
		}
		return supported ? lang : DEFAULT_LANGUAGE;
	}

	/**
	 * add after resolve event
	 * @param callback
	 */
	seajs.onAfterResolve = function(callback){
		__seajs_after_resolve_list.push(callback);
	};

	/**
	 * override resolve method
	 * @param id
	 * @param refUri
	 * @returns {*}
	 */
	seajs.resolve = function(id, refUri){
		id = id.replace(/(\$[^/|$]+)/g, function(m){
			m = m.replace('$', '');
			if(!window[m]){
				console.error('package no found:' + id);
			}
			return window[m];
		});
		var url = __seajs_org_resolve__(id, refUri);
		for(var i = 0; i < __seajs_after_resolve_list.length; i++){
			var new_url = __seajs_after_resolve_list[i].call(null, url);
			if(new_url){
				url = new_url;
			}
		}
		return url;
	};

	//patch console log
	if(!window.console){
		window.console = {
			'info': function(){
			},
			'log': function(){
			},
			'error': function(){
			},
			'warn': function(){
			}
		};
	}

	//auto resolve frontend host
	var FRONTEND_SOURCE_PATH = window['FRONTEND_SOURCE_PATH'] ? window['FRONTEND_SOURCE_PATH'].replace(/\/$/, '') : (function(){
		var ss = document.getElementsByTagName('script');
		for(var i in ss){
			var src = ss[i].getAttribute('src');
			if(src && src.indexOf('/seajs/config.js') > 0){
				return src.replace(/\/seajs\/config\.js.*/i, '') + '/';
			}
		}
		console.warn('No frontend host found, use top path.');
		return '/';
	})();

	//静态资源版本，缺省使用
	var convert_reg = function(str){
		str = str.replace('.', '\\.')
			.replace(':', '\\:')
			.replace('*', '.*?');
		return new RegExp(str);
	};

	seajs.onAfterResolve(function(url){
		var C = window['STATIC_VERSION_CONFIG'];
		if(C){
			for(var str in C){
				var reg = convert_reg(str);
				if(reg.test(url)){
					if(C[str]){
						return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'v' + C[str];
					}else{
						return url;
					}
				}
			}
		}
		return url;
	});

	var vendor_source_path = FRONTEND_SOURCE_PATH + 'vendor';
	seajs.config({
		alias: {
			'jquery': vendor_source_path + '/jquery/jquery-1.8.3.min.js',
			'jquery-1.11.2': vendor_source_path + '/jquery/jquery-1.11.2.min.js',
			'jquerycolor': vendor_source_path + '/jquery/jquerycolor.js',
			'jquery/cookie': vendor_source_path + '/jquery/jquery.cookie.min.js',
			'jqueryanchor': vendor_source_path + '/jquery/jqueryanchor.js',
			'jquery/highlight': vendor_source_path + '/jquery/jquery.highlight.js',
			'jquery/ui': vendor_source_path + '/jquery/ui/jquery-ui.min.js',
			'jquery/ui/timepicker': vendor_source_path + '/jquery/ui/jquery-ui-timepicker-addon.js',
			'jquery/ui/tooltip': vendor_source_path + '/jquery/ui/jquery-ui-tooltip-addon.js',
			'lazyload': vendor_source_path + '/lazyload/lazyload.js',
			'shake': vendor_source_path + '/shake/shake.js',
			'swiper': vendor_source_path + '/swiper/swiper-3.0.7.js',
			'swiper2': vendor_source_path + '/swiper/swiper-2.7.js',
			'waterfall': vendor_source_path + '/waterfall/waterfall.js',
			'highcharts': vendor_source_path + '/highcharts/highcharts.js',
			'ueditor': vendor_source_path + '/ueditor/ueditor.all.js',
			'ueditor_normal_config': vendor_source_path + '/ueditor/ueditor.config.normal.js',
			'ueditor_lite_config': vendor_source_path + '/ueditor/ueditor.config.lite.js',
			'qrcode': vendor_source_path + '/qrcode/jquery.qrcode.min.js'
		},
		paths: {
			'ywj': FRONTEND_SOURCE_PATH + 'component',
			'jquery': FRONTEND_SOURCE_PATH+'vendor/jquery',
			'lang': FRONTEND_SOURCE_PATH+'lang'
		},
		preload: [
			!window.jQuery ? 'jquery' : '',
			'ywj/lang',
			'ywj/AutoComponent'
		],
		charset: 'utf-8'
	});
})();
