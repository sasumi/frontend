/**
 * 打印控件LODOP的相关操作
 */
define('temtop/printer', function(require){
	var $ = require('jquery');
	var _ = require('jquery/cookie');
	var Pop = require("ywj/popup");
	var Net = require('ywj/net');
	var lang = require('lang/$G_LANGUAGE');
	var PRINTER_SET_CGI = window['PRINTER_SET_CGI'] || '';
	var EMPTY_FN = function(){};

	var LODOP_COPYRIGHT = '北京中电亿商网络技术有限责任公司';
	var LODOP_KEY = '653726081798577778794959892839';
	var LOCAL_SCRIPT = 'http://localhost:8000/CLodopfuncs.js?priority=1';
	var LODOP_TOKEN = '';
	var TXT_INSTALL_TIPS = lang("本功能使用了CLodop云打印服务,请点击这里") + "<a href='http://www.lodop.net/download.html' target='_blank'>" + lang("下载") + "</a>";
	var TXT_NO_READY = "C-Lodop没准备好，请稍后再试！";
	var CHECK_TIMEOUT = 5000;

	/**
	 * 判断是否需要加载本地打印服务端口js，
	 * 如果不需要加载，则可以使用<object>方式直接调用打印对象
	 * @returns {boolean}
	 */
	function needCLodop(){
		try{
			var ua = navigator.userAgent;
			if(ua.match(/Windows\sPhone/i) != null) return true;
			if(ua.match(/iPhone|iPod/i) != null) return true;
			if(ua.match(/Android/i) != null) return true;
			if(ua.match(/Edge\D?\d+/i) != null) return true;
			if(ua.match(/QQBrowser/i) != null) return false;
			var verTrident = ua.match(/Trident\D?\d+/i);
			var verIE = ua.match(/MSIE\D?\d+/i);
			var verOPR = ua.match(/OPR\D?\d+/i);
			var verFF = ua.match(/Firefox\D?\d+/i);
			var x64 = ua.match(/x64/i);
			if((verTrident == null) && (verIE == null) && (x64 !== null))
				return true;
			else if(verFF !== null){
				verFF = verFF[0].match(/\d+/);
				if(verFF[0] >= 42) return true;
			}else if(verOPR !== null){
				verOPR = verOPR[0].match(/\d+/);
				if(verOPR[0] >= 32) return true;
			}else if((verTrident == null) && (verIE == null)){
				var verChrome = ua.match(/Chrome\D?\d+/i);
				if(verChrome !== null){
					verChrome = verChrome[0].match(/\d+/);
					if(verChrome[0] >= 42) return true;
				}
			}
			return false;
		}catch(err){
			return true;
		}
	}

	var setting_page = function(cgi){
		PRINTER_SET_CGI = cgi;
	};

	/**
	 * 初始化，检查lodop版本，设置版权
	 */
	var init = (function(){
		var _lodop_obj = null;
		var _req_send = false;
		var _req_fin = false;

		var _succ_cb = [];
		var _err_cb = [];
		var _flush_check = function(success, lodop){
			//防止同步方式调用回调，产生回调链死循环
			var sl = _succ_cb,
				el = _err_cb;
			_succ_cb = [];
			_err_cb = [];
			$.each(success ? sl : el, function(k, v){
				v(lodop);
			});
		};

		/**
		 * 检查lodop版本
		 * @param lodop_obj
		 * @param show_install
         * @returns {boolean}
		 */
		var chk_ver = function(lodop_obj, show_install){
			if(!lodop_obj || !lodop_obj.VERSION || lodop_obj.VERSION < "6.1.9.5"){
				if(show_install){
					showInstall();
				}
				return false;
			}
			lodop_obj.SET_LICENSES(LODOP_COPYRIGHT, LODOP_KEY, LODOP_TOKEN, "");
			return true;
		};

		return function(on_success, on_error){
			on_success = on_success || EMPTY_FN;
			var silent = false;
			if(on_error){
				silent = true;
			}
			on_error = on_error || function(){
				alert(TXT_NO_READY);
			};
			_succ_cb.push(on_success);
			_err_cb.push(on_error);

			if(_req_fin || _lodop_obj){
				if(chk_ver(_lodop_obj, !silent)){
					_flush_check(true, _lodop_obj);
					return true;
				}
				_flush_check(false);
				return false;
			}
			if(!needCLodop()){
				_lodop_obj = document.createElement("object");
				_lodop_obj.setAttribute("style", "position:absolute;left:0px;top:-100px;width:0px;height:0px;");
				_lodop_obj.setAttribute("type", "application/x-print-lodop");
				document.documentElement.appendChild(_lodop_obj);
				if(chk_ver(_lodop_obj)){
					_flush_check(true, _lodop_obj);
					return true;
				}
				_flush_check(false);
				return false;
			}
			if(_req_send){
				return false;
			}
			_req_send = true;
			console.log('loading lodop script');
			var checker = setTimeout(function(){
				console.warn('script load timeout');
				_req_fin = true;
				_flush_check(false);
			}, CHECK_TIMEOUT);

			$.getScript(LOCAL_SCRIPT).done(function(){
				_req_fin = true;
				clearTimeout(checker);
				console.info('printer js loaded');
				if(typeof window['getCLodop'] == 'function'){
					_lodop_obj = window['getCLodop']();
					if(_lodop_obj && chk_ver(_lodop_obj)){
						_flush_check(true, _lodop_obj);
						return;
					} else {
						on_error('getCLodop() call fail');
					}
				} else {
					on_error('getCLodop function no found');
				}
				_flush_check(false);
			}).fail(function(){
				_req_fin = true;
				console.error(LOCAL_SCRIPT+' script file load fail');
				clearTimeout(checker);
				on_error(LOCAL_SCRIPT+' script file load fail');
				_flush_check(false);
			});
			return false;
		};
	})();

	/**
	 * 检测打印机是否安装
	 * @deprecated 该方法废弃，请使用init、getPrinter来获取打印机
	 * @returns {boolean}
	 */
	var checkInstall = function(){
		if(!init(null, EMPTY_FN)){
			alert(TXT_NO_READY);
			return false;
		}
		return true;
	};

	var showInstall = function(){
		Pop.showAlert("Install", TXT_INSTALL_TIPS + "。或者按Ctrl+P直接打印</a>");
	};

	/**
	 * 获取lodop对象
	 * @deprecated 该方法逻辑不严谨，lodop为异步加载
	 * @returns {*}
	 */
	var getLodop = function(){
		var _lodop;
		if(init(function(lodop){
				_lodop = lodop;
			})){
			return _lodop
		}
		return false;
	};

	/**
	 * 打印URL
	 * @param url
	 * @param printer_index
	 * @param intOrient
	 * @param width
	 * @param height
	 * @param callback
	 * @param intCopies
	 */
	var printURL = function(url, printer_index, intOrient, width, height, callback, intCopies){
		console.info('print url:%c'+url, 'color:blue;text-decoration:underline');
		if(!url){
			console.error('no url found');
			return;
		}
		$.get(url, function(html){
			printHTML(html, printer_index, intOrient, width, height, callback, intCopies);
		});
	};
	/**
	 * 打印URL--post提交
	 * @param url
	 * @param printer_index
	 * @param intOrient
	 * @param width
	 * @param height
	 * @param callback
	 * @param data
	 */
	var printURLPost = function(url, printer_index, intOrient, width, height, callback,data){
		console.info('print url:%c'+url, 'color:blue;text-decoration:underline');
		if(!url){
			console.error('no url found');
			return;
		}
		$.post(url,data,function(html){
			printHTML(html, printer_index, intOrient, width, height, callback);
		});

	};


	/**
	 * 打印html
	 * @param html
	 * @param printer_index
	 * @param intOrient
	 * @param width
	 * @param height
	 * @param callback
	 * @param intCopies 打印份数
	 */
	var printHTML = function(html, printer_index, intOrient, width, height, callback, intCopies){
		var args = arguments;
		init(function(lodop){
			console.info('%cprint html, intOrient, width, height:', 'color:green', args);
			lodop.PRINT_INIT("");
			lodop.SET_PRINT_MODE('WINDOW_DEFPRINTER', printer_index);
			lodop.SET_PRINTER_INDEX(printer_index);
			var wt = '100%';
			var ht = '100%';
			if(!intOrient){
				intOrient = 1;
			}
			if(width && height){
				wt = width;
				ht = height;
			}
			intCopies = (intCopies && intCopies > 1) ? parseInt(intCopies) : 1;
			lodop.SET_PRINT_COPIES(intCopies);
			lodop.SET_PRINT_STYLE("FontSize", 18);
			lodop.SET_PRINT_STYLE("Bold", 0);
			lodop.ADD_PRINT_HTM(0, 0, "100%", "100%", html);
			lodop.SET_PRINT_PAGESIZE(intOrient, wt, ht);
			lodop.PRINT();
			if(callback){
				callback();
			}
		});
	};

	/**
	 * 打印图片
	 * @param src
	 * @param printer_index
	 * @param callback
	 */
	var printImg = function(src, printer_index, callback){
		init(function(lodop){
			lodop.PRINT_INIT("");
			lodop.SET_PRINT_MODE('WINDOW_DEFPRINTER', printer_index);
			lodop.SET_PRINTER_INDEX(printer_index);
			lodop.SET_PRINT_PAGESIZE(1, 800, 900);
			lodop.ADD_PRINT_IMAGE('3mm', '2mm', '80mm', '90mm', "<img  src='" + src + "' />");
			lodop.SET_PRINT_STYLEA(0, "Stretch", 1);//按原图比例(不变形)缩放模式
			lodop.PRINT();
			if(callback){
				callback();
			}
		});
	};

	/**
	 * 打印png图片
	 * @deprecated 该方法与 printImg冲突，需要改进printImg方法
	 * @param src
	 * @param printer_index
	 * @param width
	 * @param height
	 * @param callback
	 * @param config
	 */
	var printPng = function(src, printer_index, width, height, callback, config){
		config = $.extend({
			page_left:'3',
			page_top:'2',
			image_width:'100',
			image_height:'200'
		}, config);
		init(function(lodop){
			callback = callback || function(){};
			lodop.PRINT_INIT("");
			lodop.SET_PRINT_MODE('WINDOW_DEFPRINTER', printer_index);
			lodop.SET_PRINTER_INDEX(printer_index);
			lodop.SET_PRINT_PAGESIZE(1, width, height);
			lodop.ADD_PRINT_IMAGE(parseInt(config.page_top, 10)+'mm', parseInt(config.page_left, 10)+'mm', parseInt(config.image_width, 10)+'mm', parseInt(config.image_height, 10)+'mm', "<img src='" + src + "'/>");
			lodop.SET_PRINT_STYLEA(0, "Stretch", 1);//按原图比例(不变形)缩放模式
			lodop.PRINT();
			if(callback){
				callback();
			}
		})
	};

	/**
	 * 打印base64图片
	 * @param strBase64Code
	 * @param printer_index
	 * @param width
	 * @param height
	 * @param callback
	 * @param config
	 */
	var printBase64Img = function(strBase64Code, printer_index, width, height, callback, config){
		config = $.extend({
			page_left:'3',
			page_top:'2',
			image_width:'100',
			image_height:'200'
		}, config);
		init(function(lodop){
			callback = callback || function(){};
			lodop.PRINT_INIT("");
			lodop.SET_PRINT_MODE('WINDOW_DEFPRINTER', printer_index);
			lodop.SET_PRINTER_INDEX(printer_index);
			lodop.SET_PRINT_PAGESIZE(1, width, height);
			lodop.ADD_PRINT_IMAGE(parseInt(config.page_top, 10)+'mm', parseInt(config.page_left, 10)+'mm', parseInt(config.image_width, 10)+'mm', parseInt(config.image_height, 10)+'mm', strBase64Code);
			lodop.SET_PRINT_STYLEA(0, "Stretch", 1);//按原图比例(不变形)缩放模式
			lodop.PRINT();
			if(callback){
				callback();
			}
		})
	};

	/**
	 * 获取打印机
	 * @param tag
	 * @param on_success
	 * @param on_error
	 */
	var getPrinter = function(tag, on_success, on_error){
		init(function(lodop){
			var printer_index = $.cookie(tag);
			if(printer_index === '' || printer_index === null || printer_index === undefined){
				if(!PRINTER_SET_CGI){
					console.error('NO PRINTER_SET_CGI FOUND');
					if(on_error){
						on_error('NO PRINTER_SET_CGI FOUND');
					}
					return;
				}
				var src = Net.mergeCgiUri(PRINTER_SET_CGI, {'ref': 'iframe', 'act':tag});
				Pop.showPopInTop({
					title: lang('打印机设置'),
					content: {src: src}
				}, function(p){
					p.listen('onSuccess', function(printer_index){
						on_success(printer_index, lodop);
					});
				});
			} else {
				on_success(printer_index, lodop);
			}
		},on_error);
	};

	//静默方式，默认初始化
	init(null, EMPTY_FN);

	return {
		init: init,
		setSettingPage: setting_page,
		getPrinter: getPrinter,
		checkInstall: checkInstall,
		showInstall: showInstall,
		getLodop: getLodop,
		printURL: printURL,
		printURLPost: printURLPost,
		printURL_new: printURL,
		printHTML: printHTML,
		printImg: printImg,
		printPng: printPng,
		printBase64Img: printBase64Img,
		nodeClick: function($node, param){
			var tag = param.tag;
			var url = param.url || $node.attr('href');
			if(!tag){
				console.error('printer require tag');
				return false;
			}

			getPrinter(tag, function(printer_index){
				printURL(url, printer_index);
			});
			if($node[0].tagName == 'A'){
				return false;
			}
		}
	};
});