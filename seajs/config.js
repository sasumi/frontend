/**
 * patch on after resolve function
 * @private
 */
var __seajs_org_resolve__ = seajs.resolve;
var __seajs_after_resolve_list = [];

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
	var url = __seajs_org_resolve__(id, refUri);
	for(var i=0; i<__seajs_after_resolve_list.length; i++){
		var new_url = __seajs_after_resolve_list[i].call(null, url);
		if(new_url){
			url = new_url;
		}
	}
	return url;
};


var FRONTEND_HOST = window.FRONTEND_HOST || '/frontend';

//log patch
if(!window['console']){
	window['console'] = {
		'info': function(){},
		'log': function(){},
		'error': function(){},
		'warn': function(){}
	};
}

//静态资源版本，缺省使用
(function(){
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
						return url+(url.indexOf('?') >= 0 ? '&' : '?')+'v'+C[str];
					} else {
						return url;
					}
				}
			}
		}
		return url;
	});
})();

seajs.config({
	alias: {
		"jquery": "jquery/jquery-1.8.3.min.js",
		"jquery-1.11.2": "jquery/jquery-1.11.2.min.js",
		"jquerycolor": "jquery/jquerycolor.js",
		"jquery-cookie":"jquery/jquery.cookie.min.js",
		"jquery/cookie":"jquery/jquery.cookie.min.js",
		"jqueryanchor": "jquery/jqueryanchor.js",
		"jquery/ui": "jquery/ui/jquery-ui.min.js",
		"jquery/ui/timepicker": "jquery/ui/jquery-ui-timepicker-addon.js",
		"jquery/ui/tooltip": "jquery/ui/jquery-ui-tooltip-addon.js",
		"lazyload": "lazyload/lazyload.js",
		"swiper": "swiper/swiper.min.js",
		"waterfall": "waterfall/waterfall.js",
		"ueditor": FRONTEND_HOST+"/ueditor/ueditor.all.js",
		"ueditor_admin_config": FRONTEND_HOST+"/ueditor/ueditor.admin.js"
	},
	paths: {
		"ywj": FRONTEND_HOST+"/ywj/component",
		"ywjui": FRONTEND_HOST+"/ywj/ui",
		"www": "app/www/js",

		//ERP专用
		"ds": "http://ds.erp.com/static/js",
		"css": "http://css.erp.com/static/js",
		"pm": "http://pm.erp.com/static/js",
		"quotation": "http://quotation.erp.com/static/js",
		"cms": "http://cms.erp.com/static/js",
		"material": "http://material.erp.com/static/js"
	},
	preload: [
		!window.jQuery ? 'jquery' : ''
	],

	charset: 'utf-8'
});
