/**
 * Created by sasumi on 3/12/2014.
 */
define('ywj/net', function(require){
	var $ = require('jquery');
	var util = require('ywj/util');
	var msg = require('ywj/msg');

	/**
	 * get param
	 * @param param
	 * @param url
	 * @return {string}
	 */
	var getParam = function(param, url){
		var r = new RegExp("(\\?|#|&)"+param+"=([^&#]*)(&|#|$)");
		var m = (url || location.href).match(r);
		return (!m?"":m[2]);
	};

	/**
	 * 获取变量
	 * 这里不考虑到变量名重叠的情况
	 * @returns {{}}
	 */
	var getHash = function(){
		var url = location.hash;
		if(url[0] == '#'){
			url = url.substr(1);
		}
		var found = false;
		var ret = {};
		var ps = url.indexOf('&') >= 0 ? url.split('&') : [url];
		for(var i=0; i<ps.length; i++){
			var sep = ps[i].indexOf('=');
			var k, v;
			if(sep){
				k = decodeURIComponent(ps[i].substr(0, sep));
				v = decodeURIComponent(ps[i].substr(sep+1));
			}
			if(k){
				ret[k] = v;
				found = true;
			}
		}
		return found ? ret : null;
	};

	/**
	 * 设置hash
	 * @param k
	 * @param v
	 */
	var setHash = function(k, v){
		var ps = getHash() || {};
		var s = [];
		delete(ps[k]);
		ps[k] = v;
		for(var t in ps){
			if(ps[t] !== null){
				s.push(encodeURIComponent(t)+'='+encodeURIComponent(ps[t]));
			} else {
				s.push(encodeURIComponent(t));
			}
		}
		if(s.length){
			location.hash = '#'+ s.join('&');
		} else {
			location.hash = '';
		}
	};

	/**
	 * check is scalar
	 * @param val
	 * @returns {boolean}
	 */
	var fixType = function(val){
		return typeof(val) == 'string' || typeof(val) == 'number';
	};

	/**
	 * 合并后台cgi请求url
	 * @description 该方法不支持前台文件hash链接生成，如果要
	 * @return
	 */
	var buildParam = function(/**params1, params2...*/){
		var data = [];
		var args = util.toArray(arguments);

		$.each(args, function(k, val){
			var params = val;
			if(util.isArray(params)){
				data.push(params.join('&'));
			} else if(typeof(params) == 'object'){
				for(var i in params){
					if(fixType(params[i])){
						data.push(i+'='+encodeURIComponent(params[i]));
					}
				}
			} else if(typeof(params) == 'string') {
				data.push(params);
			}
		});
		return data.join('&').replace(/^[?|#|&]{0,1}(.*?)[?|#|&]{0,1}$/g, '$1');	//移除头尾的#&?
	};

	/**
	 * 合并参数
	 * @return
	 **/
	var mergeCgiUri = function(/**url, get1, get2...**/){
		var args = util.toArray(arguments);
		var url = args[0];
		url = url.replace(/(.*?)[?|#|&]{0,1}$/g, '$1');	//移除尾部的#&?
		args = args.slice(1);
		$.each(args, function(){
			var str = buildParam(this);
			if(str){
				url += (url.indexOf('?') >= 0 ? '&' : '?') + str;
			}
		});
		return url;
	};

	/**
	 * 合并cgi请求url
	 * @description 该方法所生成的前台链接默认使用#hash传参，但如果提供的url里面包含？的话，则会使用queryString传参
	 * 所以如果需要使用?方式的话，可以在url最后补上?, 如：a.html?
	 * @return
	 */
	var mergeStaticUri = function(/**url, get1, get2...**/){
		var args = util.toArray(arguments);
		var url = args[0];
		args = args.slice(1);
		$.each(args, function(){
			var str = buildParam(this);
			if(str){
				url += /(\?|#|&)$/.test(url) ? '' : (/\?|#|&/.test(url) ? '&' : '#');
				url += str;
			}
		});
		return url;
	};

	var _AJAX_CACHE_DATA_ = {};

	/**
	 * ajax request
	 * @param url
	 * @param data
	 * @param opt
	 * @return XHR
	 */
	var request = function(url, data, opt){
		opt = $.extend({
			method: 'get',
			format: 'json', //默认格式：json, text
			async: true,
			timeout: 10000,     //默认超时10s
			charset: 'utf-8',
			cache: false,       //是否禁用浏览器cache
			frontCache: false,  //前端cache
			jsonpCallback: '_callback',
			onSuccess: function(){},
			onError: function(){msg.show("后台有点忙，请稍后重试", 'err');}
		}, opt);

		if(util.inArray(opt.format, ['json', 'jsonp', 'formsender'])){
			url = mergeCgiUri(url, {ref: opt.format});
		}

		var url_id = buildParam(url, data);
		if(opt.frontCache){
			if(_AJAX_CACHE_DATA_[url_id] !== undefined){
				opt.onSuccess(_AJAX_CACHE_DATA_[url_id]);
				return null;
			}
		}

		return $.ajax(url, {
			async: opt.async,
			cache: opt.cache,
			type: opt.method,
			timeout: opt.timeout,
			scriptCharset: opt.charset,
			data: data,
			dataType: opt.format,
			jsonpCallback: opt.jsonpCallback,
			success: function(rsp){
				if(opt.frontCache){
					_AJAX_CACHE_DATA_[url_id] = rsp;
				}
				opt.onSuccess(rsp);
			},
			error: function(){
				opt.onError();
			}
		});
	};

	/**
	 * get data
	 * @param url
	 * @param data
	 * @param onSuccess
	 * @param opt
	 */
	var get = function(url, data, onSuccess, opt){
		opt = $.extend({
			onSuccess: onSuccess
		},opt||{});
		return request(url, data, opt);
	};

	/**
	 * post data
	 * @param url
	 * @param data
	 * @param onSuccess
	 * @param opt
	 */
	var post = function(url, data, onSuccess, opt){
		opt = $.extend({
			method: 'post',
			onSuccess: onSuccess
		},opt||{});
		return request(url, data, opt);
	};

	/**
	 * 获取表单提交的数据
	 * @description 不包含文件表单(后续HTML5版本可能会提供支持)
	 * @param form
	 * @returns {string}
	 */
	var getFormData = function(form){
		form = $(form);
		var data = {};
		var elements = form[0].elements;

		$.each(elements, function(){
			var name = this.name;
			if(!data[name]){
				data[name] = [];
			}

			if(this.type == 'radio'){
				if(this.checked){
					data[name].push(this.value);
				}
			} else if($(this).attr('name') !== undefined && $(this).attr('value') !== undefined){
				data[name].push(this.value);
			}
		});

		var data_str = [];
		$.each(data, function(key, v){
			$.each(v, function(k, val){
				data_str.push(encodeURIComponent(key)+'='+encodeURIComponent(val));
			})
		});
		return data_str.join('&');
	};

	return {
		getParam: getParam,
		setHash: setHash,
		buildParam: buildParam,
		mergeStaticUri: mergeStaticUri,
		mergeCgiUri: mergeCgiUri,
		request: request,
		get: get,
		post: post,
		getFormData: getFormData
	};
});