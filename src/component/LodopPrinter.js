/**
 * Created by Administrator on 2017/1/13.
 */
define('ywj/LodopPrinter', function(require){
	const Pop = require('ywj/popup');
	const Net = require('ywj/net');
	const _ = require('jquery');
	const LS = window.localStorage;
	const LS_KEY = 'lodop_printer_map';

	const LODOP_COPYRIGHT = '北京中电亿商网络技术有限责任公司';
	const LODOP_KEY = '653726081798577778794959892839';
	const LOCAL_SCRIPT = 'http://localhost:8000/CLodopfuncs.js?priority=1';
	const LODOP_TOKEN = '';
	const TXT_INSTALL_TIPS = "本功能使用了CLodop云打印服务,请点击这里 <a href='http://www.lodop.net/download.html' target='_blank'> 下载 </a>";
	const CHECK_TIMEOUT = 5000;
	const VERSION_LIMIT = "6.1.9.5";

	let PRINTER_SET_PAGE = '';

	/**
	 * 绑定设置页面
	 * @param url
	 */
	const setPrinterSetupPageUrl = (url)=>{
		PRINTER_SET_PAGE = url;
	};

	/**
	 * setup printer via tag
	 * @param tag
	 * @returns {Promise<mixed>}
	 */
	const showPrinterSetup = (tag = '')=>{
		return new Promise((resolve, reject) => {
			if(!PRINTER_SET_PAGE){
				reject('未绑定打印机设置页面');
				return;
			}
			let src = Net.mergeCgiUri(PRINTER_SET_PAGE, {'tag':tag});
			Pop.showPopInTop({
				title: '打印机设置',
				content: {src: src},
				width:800
			}, function(p){
				p.listen('onSuccess', function(){
					resolve();
				});
			});
		});
	};

	/**
	 * set printer parameter
	 * @param lodop
	 * @param option
	 */
	const setPrinterConfig = (lodop, option = {}) => {
		option = Object.assign({
			PrinterName: null,
			PrinterIndex: null,
			Orient: 1, //方向
			Copies: 1, //份数
			PageWidth: '100%',
			PageHeight: '100%',
			FontSize: null,
			Bold: null
		}, option);

		if(option.PrinterName){
			let printer_list = getPrinterListViaLodop(lodop);
			option.PrinterIndex = printer_list.findIndex(val=>val === option.PrinterName);
		}

		if(option.PrinterIndex === null){
			console.warn('printer index no set, use 0 as default.', option);
			option.PrinterIndex = 0;
		}

		lodop.PRINT_INIT("");
		lodop.SET_PRINT_MODE('WINDOW_DEFPRINTER', option.PrinterIndex);
		lodop.SET_PRINTER_INDEX(option.PrinterIndex);
		option.Copies !== null && lodop.SET_PRINT_COPIES(option.Copies);
		option.Bold !== null && lodop.SET_PRINT_STYLE("Bold", option.Bold);
		option.FontSize !== null && lodop.SET_PRINT_STYLE("FontSize", option.FontSize);
		lodop.SET_PRINT_PAGESIZE(option.Orient, option.PageWidth, option.PageHeight);
		console.info('%cLodop config', 'color:green', option);
	};

	/**
	 * print url
	 * @param url
	 * @param option
	 * @returns {Promise<mixed>}
	 */
	const printUrl = (url, option)=>{
		return new Promise((resolve, reject) => {
			$.get(url, function(html){
				printHtml(html, option).then(resolve, reject);
			});
		});
	};

	const printUrlByTag = (url, tag)=>{
		return new Promise((resolve, reject) => {
			getPrinterConfigByTagAuto(tag).then(option=>{
				printUrl(url, option).then(resolve, reject);
			});
		});
	};

	/**
	 * 打印URL--post提交
	 * @param url
	 * @param data
	 * @param option
	 */
	const printUrlPost = function(url, data, option){
		return new Promise((resolve, reject) => {
			$.post(url, data, function(html){
				printHtml(html, option).then(resolve, reject);
			});
		});
	};

	/**
	 * 打印URL--post提交
	 * @param url
	 * @param data
	 * @param tag
	 */
	const printUrlPostByTag = function(url, data, tag){
		return new Promise((resolve, reject) => {
			getPrinterConfigByTagAuto(tag).then(option => {
				printUrlPost(url, option).then(resolve, reject);
			});
		});
	};

	/**
	 * 打印html
	 * @param html
	 * @param option
	 */
	const printHtml = (html, option = {})=>{
		return new Promise((resolve, reject) => {
			ready().then(lodop => {
				setPrinterConfig(lodop, option);
				lodop.ADD_PRINT_HTM(0, 0, "100%", "100%", html);
				lodop.PRINT();
				resolve(lodop);
			}, reject);
		});
	};

	const printHtmlByTag = (html, tag)=>{
		return new Promise((resolve, reject) => {
			getPrinterConfigByTagAuto(tag).then(option=>{
				printHtml(html, option).then(resolve, reject);
			});
		});
	};

	/**
	 * 打印图片
	 * @param data_or_src
	 * @param option
	 * @param as_base64
	 */
	const printImage = (data_or_src, option, as_base64 = false)=>{
		return new Promise((resolve, reject) => {
			ready().then(lodop => {
				let opt = Object.assign({
					PageWidth: 800,
					PageHeight: 900,
					ImagePageTop: '3mm',
					ImagePageLeft: '2mm',
					ImageWidth: '90mm',
					ImageHeight: '80mm'
				}, option);
				setPrinterConfig(lodop, opt);
				let content = as_base64 ? data_or_src : "<img  src='" + data_or_src + "' />";
				lodop.ADD_PRINT_IMAGE(opt.ImagePageTop, opt.ImagePageLeft, opt.ImageWidth, opt.ImageHeight, content);
				lodop.SET_PRINT_STYLEA(0, "Stretch", 1);//按原图比例(不变形)缩放模式
				lodop.PRINT();
				resolve(lodop);
			}, reject);
		});
	};

	const printImageByTag = (data_or_src, tag, as_base64 = false)=>{
		return new Promise((resolve, reject) => {
			getPrinterConfigByTagAuto(tag).then(option=>{
				printImage(data_or_src, option, as_base64).then(resolve, reject)
			});
		});
	};

	/**
	 * 打印base64图片
	 * @param str_base64
	 * @param option
	 * @returns {*|Promise<mixed>}
	 */
	const printImageBase64 = (str_base64, option)=>{
		return printImage(str_base64, option, true);
	};

	/**
	 * 打印base64图片
	 * @param str_base64
	 * @param tag
	 * @returns {*|Promise<mixed>}
	 */
	const printImageBase64ByTag = (str_base64, tag)=>{
		return printImageByTag(str_base64, tag, true);
	};

	/**
	 * show install dialog
	 */
	const showInstall = ()=>{
		Pop.showAlert("Install", TXT_INSTALL_TIPS + "。或者按Ctrl+P直接打印</a>");
	};

	/**
	 * 判断是否需要加载本地打印服务端口js，
	 * 如果不需要加载，则可以使用<object>方式直接调用打印对象
	 * @returns {boolean}
	 */
	const needCLodop = ()=>{
		try{
			let ua = navigator.userAgent;
			if(ua.match(/Windows\sPhone/i) != null) return true;
			if(ua.match(/iPhone|iPod/i) != null) return true;
			if(ua.match(/Android/i) != null) return true;
			if(ua.match(/Edge\D?\d+/i) != null) return true;
			if(ua.match(/QQBrowser/i) != null) return false;
			let verTrident = ua.match(/Trident\D?\d+/i);
			let verIE = ua.match(/MSIE\D?\d+/i);
			let verOPR = ua.match(/OPR\D?\d+/i);
			let verFF = ua.match(/Firefox\D?\d+/i);
			let x64 = ua.match(/x64/i);
			if((verTrident == null) && (verIE == null) && (x64 !== null))
				return true;
			else if(verFF !== null){
				verFF = verFF[0].match(/\d+/);
				if(verFF[0] >= 42) return true;
			}else if(verOPR !== null){
				verOPR = verOPR[0].match(/\d+/);
				if(verOPR[0] >= 32) return true;
			}else if((verTrident == null) && (verIE == null)){
				let verChrome = ua.match(/Chrome\D?\d+/i);
				if(verChrome !== null){
					verChrome = verChrome[0].match(/\d+/);
					if(verChrome[0] >= 42) return true;
				}
			}
			return false;
		}catch(err){
			return true;
		}
	};

	/**
	 * get printer map
	 */
	const getPrinterList = ()=>{
		return new Promise((resolve, reject) => {
			ready().then(lodop=>{
				resolve(getPrinterListViaLodop(lodop));
			}, reject);
		});
	};

	const getPrinterListViaLodop = (lodop)=>{
		let printers = [];
		let printer_count = lodop.GET_PRINTER_COUNT();
		for(let i = 0; i < printer_count; i++){
			printers[i] = lodop.GET_PRINTER_NAME(i);
		}
		return printers;
	};

	/**
	 * 绑定打印机标签配置（对应打印机名称、配置）
	 * @param {Object} tag_config {tag: {PrinterName:'Printer1', other config item}, ...}
	 */
	const savePrinterConfig = (tag_config)=>{
		console.log('printer config saved', tag_config);
		LS.setItem(LS_KEY, JSON.stringify(tag_config));
	};

	/**
	 * save printer config by tag
	 * @param tag
	 * @param config
	 */
	const savePrinterConfigByTag = (tag, config) => {
		let cfg = getPrinterConfig();
		cfg[tag] = config;
		savePrinterConfig(cfg);
	};

	/**
	 * get printer config
	 * @returns {{}}
	 */
	const getPrinterConfig = () => {
		let s = LS.getItem(LS_KEY);
		return s ? JSON.parse(s) : {};
	};

	/**
	 * get printer config by tag
	 * @param tag
	 * @returns {*}
	 */
	const getPrinterConfigByTag = (tag)=>{
		let cfg = getPrinterConfig();
		return cfg[tag];
	};

	/**
	 * get printer config by tag auto show setup dialog
	 * @param tag
	 * @returns {Promise<mixed>}
	 */
	const getPrinterConfigByTagAuto = (tag)=>{
		return new Promise((resolve, reject) => {
			let cfg = getPrinterConfigByTag(tag);
			if(cfg){
				resolve(cfg);
				return;
			}
			showPrinterSetup(tag).then(()=>{
				resolve(savePrinterConfigByTag(tag));
			}, reject);
		});
	};

	/**
	 * 检查lodop版本
	 * @param lodop_obj
	 * @return boolean
	 */
	const checkVersion = (lodop_obj)=>{
		if(!lodop_obj.VERSION || lodop_obj.VERSION < VERSION_LIMIT){
			return false;
		}
		lodop_obj.SET_LICENSES(LODOP_COPYRIGHT, LODOP_KEY, LODOP_TOKEN, "");
		return true;
	};

	/**
	 * ready事件，包含版本检查，安装提示
	 * @returns {Promise<mixed>}
	 */
	const ready = ()=>{
		return new Promise((resolve, reject) => {
			init((lodop)=>{
				if(!checkVersion(lodop)){
					showInstall();
				} else {
					resolve(lodop);
				}
			}, (error)=>{
				reject(error);
			})
		});
	};

	/**
	 * 初始化lodop对象
	 */
	const init = (()=>{
		let lodop = null;
		let req_send = false;
		let req_flag = false;
		let req_error = '';

		let success_callbacks = [];
		let error_callbacks = [];

		let flush_callback = function(success, lodop_or_error){
			let sl = success_callbacks,
				el = error_callbacks;
			success_callbacks = [];
			error_callbacks = [];
			$.each(success ? sl : el, function(k, v){
				v(lodop_or_error);
			});
		};

		return (resolve = ()=>{}, reject = ()=>{}) => {
			success_callbacks.push(resolve);
			error_callbacks.push(reject);
			if(req_flag){
				flush_callback(!!lodop, req_error || lodop);
				return;
			}
			if(!needCLodop()){
				lodop = document.createElement("object");
				lodop.setAttribute("style", "position:absolute;left:0px;top:-100px;width:0px;height:0px;");
				lodop.setAttribute("type", "application/x-print-lodop");
				document.documentElement.appendChild(lodop);
				flush_callback(true, lodop);
				return;
			}
			if(req_send){
				return;
			}
			req_send = true;

			let checker = setTimeout(function(){
				req_flag = true;
				flush_callback(false, 'CLodop脚本加载超时。');
			}, CHECK_TIMEOUT);

			$.getScript(LOCAL_SCRIPT).done(() => {
				req_flag = true;
				clearTimeout(checker);
				if(typeof window['getCLodop'] == 'function'){
					lodop = window['getCLodop']();
					if(lodop){
						flush_callback(true, lodop);
					}else{
						flush_callback(false, 'getCLodop() 调用失败。');
					}
				}else{
					flush_callback(false, 'getCLodop 函数未找到。');
				}
			}).fail(() => {
				req_flag = true;
				clearTimeout(checker);
				flush_callback(false, 'CLodop脚本加载失败:' + LOCAL_SCRIPT);
			});
		};
	})();

	return {
		savePrinterConfig: savePrinterConfig,
		savePrinterConfigByTag: savePrinterConfigByTag,
		getPrinterConfig:getPrinterConfig,
		getPrinterConfigByTag: getPrinterConfigByTag,
		getPrinterConfigByTagAuto: getPrinterConfigByTagAuto,
		getPrinterList: getPrinterList,
		printUrl: printUrl,
		printUrlByTag: printUrlByTag,
		printUrlPost: printUrlPost,
		printUrlPostByTag: printUrlPostByTag,
		printHtml: printHtml,
		printHtmlByTag: printHtmlByTag,
		printImage: printImage,
		printImageByTag: printImageByTag,
		printImageBase64: printImageBase64,
		printImageBase64ByTag: printImageBase64ByTag,
		setPrinterSetupPageUrl: setPrinterSetupPageUrl,
		showPrinterSetup: showPrinterSetup,
		ready: ready,
		nodeClick: ($node, param)=>{
			let tag = param.tag;
			let url = param.url || $node.attr('href');
			if(!tag){
				printUrl(url, param);
				return false;
			} else {
				printUrlByTag(url, tag);
			}
			if($node[0].tagName === 'A'){
				return false;
			}
		}
	}
});